export const COLORS = {
  primary: "#1B4D89",
  primaryDark: "#12335F",
  accent: "#0EA5A4",
  background: "#F4F7FB",
  surface: "#FFFFFF",
  text: "#102A43",
  textMuted: "#627D98",
  border: "#D9E2EC",
  danger: "#D64545",
  success: "#2F9E44",
  warning: "#F59F00",
  offline: "#52606D",
};

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export const REQUEST_TIMEOUT_MS = 15000;
export const MAX_RETRIES = 2;

/** Client session length — must match backend ACCESS_TOKEN_EXPIRE_MINUTES. */
export const SESSION_DURATION_MS = 10 * 60 * 1000;
/** Show continue/proceed modal when this much time remains. */
export const SESSION_WARN_MS = 60 * 1000;
