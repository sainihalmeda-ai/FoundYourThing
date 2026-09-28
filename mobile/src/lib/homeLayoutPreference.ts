import AsyncStorage from "@react-native-async-storage/async-storage";

export type HomeLayout = "portal" | "grid" | "feed";

const KEY = "fyt_home_layout";
const VALID: HomeLayout[] = ["portal", "grid", "feed"];

export async function getHomeLayout(): Promise<HomeLayout> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return (VALID as string[]).includes(raw ?? "") ? (raw as HomeLayout) : "portal";
  } catch {
    return "portal";
  }
}

export async function saveHomeLayout(layout: HomeLayout): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, layout);
  } catch {
    // Non-fatal — the picked layout just won't survive an app restart.
  }
}
