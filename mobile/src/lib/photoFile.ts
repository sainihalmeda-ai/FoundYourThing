import { Platform } from "react-native";
import { File } from "expo-file-system";

export type PhotoFileInfo = { exists: boolean; size: number | null };

/**
 * Check that a picked or resized photo is really on disk.
 *
 * Android reports an unreadable upload body as a plain network failure, so a
 * missing cache file looks exactly like a dead server. Checking first lets the
 * report fall back to the original photo instead of blaming the network.
 */
export function inspectPhoto(uri: string): PhotoFileInfo {
  if (Platform.OS === "web" || !uri.startsWith("file:")) {
    return { exists: true, size: null };
  }
  try {
    const file = new File(uri);
    return { exists: file.exists, size: file.size };
  } catch {
    return { exists: false, size: null };
  }
}
