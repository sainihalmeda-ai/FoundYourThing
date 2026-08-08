import { Platform } from "react-native";
import Constants from "expo-constants";

/**
 * Campus Connect design tokens (cool academic greys + navy + teal).
 * Source: campus-connect styles.css — UX only; no functional meaning.
 */
export const COLORS = {
  background: "#F4F5F7",
  surface: "#F8F9FB",
  surfaceMuted: "#EFF1F5",
  card: "#FFFFFF",
  text: "#111827",
  textMuted: "#667085",
  primary: "#102A56",
  primaryDark: "#09182F",
  primaryForeground: "#FFFFFF",
  accent: "#009CA5",
  accentForeground: "#FFFFFF",
  gold: "#C89B3C",
  goldForeground: "#2A1E06",
  success: "#22C55E",
  danger: "#EF4444",
  warning: "#F59E0B",
  border: "#E4E7EC",
  divider: "#ECEFF3",
  input: "#E4E7EC",
  offline: "#667085",
  inkTop: "#102A56",
  inkBottom: "#09182F",
  ring: "#009CA5",
};

export const FONTS = {
  display: "Fraunces_700Bold",
  displayMedium: "Fraunces_600SemiBold",
  displayRegular: "Fraunces_400Regular",
  sans: "Manrope_400Regular",
  sansMedium: "Manrope_500Medium",
  sansSemi: "Manrope_600SemiBold",
  sansBold: "Manrope_700Bold",
};

export const RADIUS = {
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  "2xl": 26,
  "3xl": 34,
  pill: 999,
};

export const SHADOW = {
  soft: {
    shadowColor: "#102828",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 24,
    elevation: 2,
  },
  lift: {
    shadowColor: "#102828",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 32,
    elevation: 6,
  },
  glow: {
    shadowColor: "#009CA5",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.14,
    shadowRadius: 4,
    elevation: 2,
  },
};

/** Floating bottom nav metrics — keep scroll content clear of the bar. */
export const TAB_BAR = {
  height: 68,
  /** Gap from screen bottom to the bar (matches AppStack tabBarStyle). */
  bottomGap: Platform.OS === "ios" ? 24 : 16,
  /** Extra breathing room above the bar so last lines aren’t tucked under it. */
  contentGap: 32,
};

/** Bottom padding for ScrollView / FlatList on tab screens. */
export function tabBarScrollPadding(safeBottom = 0): number {
  return TAB_BAR.height + TAB_BAR.bottomGap + TAB_BAR.contentGap + Math.max(safeBottom, 0);
}

const API_PORT = 8000;

/**
 * In development the backend runs on the same machine as the dev server, so
 * following whatever host Expo Go already connected to keeps working after a
 * Wi-Fi or hotspot change. A hard-coded address in .env goes stale the moment
 * the laptop gets a new IP.
 */
function devServerApiUrl(): string | null {
  if (Platform.OS === "web") {
    if (typeof window === "undefined") return null;
    return `${window.location.protocol}//${window.location.hostname}:${API_PORT}`;
  }
  const hostUri =
    Constants.expoConfig?.hostUri ?? Constants.expoGoConfig?.debuggerHost ?? "";
  const host = hostUri.split("/")[0].split(":")[0];
  return host ? `http://${host}:${API_PORT}` : null;
}

const resolvedApiBaseUrl =
  (__DEV__ ? devServerApiUrl() : null) ??
  process.env.EXPO_PUBLIC_API_URL ??
  (typeof window !== "undefined" && window.location?.hostname
    ? `${window.location.protocol}//${window.location.hostname}:8000`
    : null);

if (!resolvedApiBaseUrl) {
  throw new Error(
    "EXPO_PUBLIC_API_URL is not set. Production / APK builds must point at the live API " +
      "(e.g. https://foundyourthing-api.onrender.com).",
  );
}

export const API_BASE_URL = resolvedApiBaseUrl;

export const REQUEST_TIMEOUT_MS = 15000;
export const MAX_RETRIES = 2;
/** Health probe is short so the connection banner reacts quickly but not blindly. */
export const HEALTH_TIMEOUT_MS = 6000;
/** Photo uploads travel far more bytes than any other call. */
export const UPLOAD_TIMEOUT_MS = 60000;

/**
 * LiveGo — found reports must be a fresh camera photo, verified against the
 * image's camera data. Off by default; set EXPO_PUBLIC_LIVEGO=true here and
 * LIVEGO_ENABLED=true in backend/.env to switch it on.
 */
export const LIVEGO_ENABLED = process.env.EXPO_PUBLIC_LIVEGO === "true";

/** Client session length — must match backend ACCESS_TOKEN_EXPIRE_MINUTES. */
export const SESSION_DURATION_MS = 10 * 60 * 1000;
/** Show continue/proceed modal when this much time remains. */
export const SESSION_WARN_MS = 60 * 1000;
