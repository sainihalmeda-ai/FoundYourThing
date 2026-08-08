import {
  API_BASE_URL,
  HEALTH_TIMEOUT_MS,
  MAX_RETRIES,
  REQUEST_TIMEOUT_MS,
} from "../constants/config";
import { ApiError } from "../types";

type RequestOptions = {
  method?: string;
  token?: string | null;
  body?: Record<string, unknown> | FormData;
  retries?: number;
  /** Override for slow calls such as photo uploads. */
  timeoutMs?: number;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatApiErrorMessage(raw: unknown): string {
  if (typeof raw === "string") return raw;
  if (Array.isArray(raw)) {
    return raw
      .map((item) => {
        if (item && typeof item === "object" && "msg" in item) {
          const loc = Array.isArray((item as { loc?: unknown }).loc)
            ? (item as { loc: unknown[] }).loc.join(".")
            : "";
          const msg = String((item as { msg: unknown }).msg);
          return loc ? `${loc}: ${msg}` : msg;
        }
        return JSON.stringify(item);
      })
      .join("\n");
  }
  if (raw && typeof raw === "object") return JSON.stringify(raw);
  return "Something went wrong on the server.";
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const {
    method = "GET",
    token,
    body,
    retries = MAX_RETRIES,
    timeoutMs = REQUEST_TIMEOUT_MS,
  } = options;
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body && !(body instanceof FormData) && !(typeof FormData !== "undefined" && Object.prototype.toString.call(body) === "[object FormData]")) {
    headers["Content-Type"] = "application/json";
  }

  let lastError: ApiError | null = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${API_BASE_URL}${path}`, {
        method,
        headers,
        body:
          body instanceof FormData ||
          (body != null && Object.prototype.toString.call(body) === "[object FormData]")
            ? (body as FormData)
            : body
              ? JSON.stringify(body)
              : undefined,
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const contentType = response.headers.get("content-type") ?? "";
      const payload = contentType.includes("application/json")
        ? await response.json()
        : null;

      if (!response.ok) {
        const raw =
          payload?.detail ??
          payload?.message ??
          "Something went wrong on the server.";
        const message = formatApiErrorMessage(raw);

        if (response.status === 401) {
          // Login/register failures are 401 too — keep the server message.
          // Only treat authenticated requests as a true session expiry.
          const kind = token ? "unauthorized" : "validation";
          const text =
            kind === "unauthorized" && !message.toLowerCase().includes("invalid")
              ? "Your session expired. Please log in again."
              : message;
          throw new ApiError(text, kind, 401);
        }

        throw new ApiError(
          message,
          response.status >= 500 ? "server" : "validation",
          response.status,
        );
      }

      return payload as T;
    } catch (error) {
      clearTimeout(timeout);

      if (error instanceof ApiError) {
        lastError = error;
        if (error.kind === "unauthorized" || error.kind === "validation") {
          throw error;
        }
      } else if (error instanceof Error && error.name === "AbortError") {
        lastError = new ApiError(
          "The server took too long to respond. Check your connection and try again.",
          "timeout",
        );
      } else {
        // Android reports a broken multipart body the same way it reports a
        // dead network, so keep the platform text for diagnosis.
        const detail =
          error instanceof Error ? `${error.name}: ${error.message}` : String(error);
        lastError = new ApiError(
          "Cannot reach the server. Make sure you are online and the backend is running.",
          "offline",
          undefined,
          detail,
        );
        if (__DEV__) console.warn(`[api] ${method} ${path} failed — ${detail}`);
      }

      if (attempt < retries) {
        await sleep(800 * (attempt + 1));
        continue;
      }
    }
  }

  throw lastError ?? new ApiError("Unknown error.", "unknown");
}

/**
 * One dropped request should not black out the whole app, so a couple of quick
 * attempts must fail before we declare the server unreachable.
 */
export async function checkServerHealth(attempts = 2): Promise<boolean> {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);
    try {
      const response = await fetch(`${API_BASE_URL}/api/health`, {
        method: "GET",
        signal: controller.signal,
      });
      if (response.ok) return true;
    } catch {
      // Fall through to the next attempt.
    } finally {
      clearTimeout(timeout);
    }
    if (attempt < attempts - 1) await sleep(700);
  }
  return false;
}

export function resolveImageUrl(path: string): string {
  if (path.startsWith("http")) return path;
  return `${API_BASE_URL}${path}`;
}
