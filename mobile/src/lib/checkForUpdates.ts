import { Platform } from "react-native";
import * as Updates from "expo-updates";

/**
 * Non-blocking update check. Never reload on launch — reloadAsync() after a
 * bad OTA was leaving phones on a permanent black screen.
 *
 * Fetched updates apply the next time the user cold-starts the app.
 */
export async function checkForAppUpdates(): Promise<void> {
  if (__DEV__ || Platform.OS === "web") return;
  if (!Updates.isEnabled) return;

  try {
    const result = await Updates.checkForUpdateAsync();
    if (!result.isAvailable) return;
    await Updates.fetchUpdateAsync();
    // Do NOT call Updates.reloadAsync() here.
  } catch (error) {
    if (__DEV__) console.warn("[updates]", error);
  }
}
