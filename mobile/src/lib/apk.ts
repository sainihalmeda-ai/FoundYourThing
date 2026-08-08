import { Linking, Platform } from "react-native";
import { FYT_APK_PAGE_URL } from "../constants/config";

/** Open the public FYT APK page (static HTML on the hosted web app). */
export function openFytApkPage() {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    window.location.assign("/download/");
    return;
  }
  void Linking.openURL(FYT_APK_PAGE_URL);
}
