import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { SESSION_DURATION_MS } from "../constants/config";

const TOKEN_KEY = "fyt_token";
const EXPIRES_KEY = "fyt_session_expires_at";

async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    return localStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

async function deleteItem(key: string): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.removeItem(key);
    return;
  }
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    // Key may already be absent.
  }
}

export async function saveToken(
  token: string,
  expiresAtMs?: number,
): Promise<void> {
  const expiresAt = String(expiresAtMs ?? Date.now() + SESSION_DURATION_MS);
  await setItem(TOKEN_KEY, token);
  await setItem(EXPIRES_KEY, expiresAt);
}

export async function getToken(): Promise<string | null> {
  return getItem(TOKEN_KEY);
}

export async function getSessionExpiresAt(): Promise<number | null> {
  const raw = await getItem(EXPIRES_KEY);
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

export async function clearToken(): Promise<void> {
  await deleteItem(TOKEN_KEY);
  await deleteItem(EXPIRES_KEY);
}
