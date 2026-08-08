import { Platform } from "react-native";
import * as Updates from "expo-updates";

/**
 * Pull the latest EAS Update (JS/assets) for this APK channel.
 * Native/module changes still need a new APK build.
 */
export async function checkForAppUpdates(): Promise<void> {
  if (__DEV__ || Platform.OS === "web") return;
  if (!Updates.isEnabled) return;

  try {
    const result = await Updates.checkForUpdateAsync();
    if (!result.isAvailable) return;
    await Updates.fetchUpdateAsync();
    await Updates.reloadAsync();
  } catch (error) {
    if (__DEV__) console.warn("[updates]", error);
  }
}
