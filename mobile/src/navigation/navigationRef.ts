import { createNavigationContainerRef } from "@react-navigation/native";
import type { RootStackParamList } from "./types";

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function navigate(name: keyof RootStackParamList, params?: object) {
  if (!navigationRef.isReady()) return;
  const ref = navigationRef as { navigate: (n: string, p?: object) => void };
  ref.navigate(name, params);
}
