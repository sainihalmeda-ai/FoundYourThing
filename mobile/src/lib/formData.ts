import { Platform } from "react-native";
import type { ImagePickerAsset } from "expo-image-picker";

/**
 * Append an image picker asset to FormData in a way that works on
 * native (uri object) and web (real File/Blob).
 */
export async function appendImageToFormData(
  form: FormData,
  fieldName: string,
  asset: ImagePickerAsset,
  fallbackName = "item.jpg",
): Promise<void> {
  const mime = asset.mimeType || "image/jpeg";
  const name = asset.fileName || fallbackName;

  if (Platform.OS === "web") {
    const response = await fetch(asset.uri);
    const blob = await response.blob();
    const file = new File([blob], name, { type: mime });
    form.append(fieldName, file);
    return;
  }

  // React Native FormData accepts this shape for local files.
  form.append(fieldName, {
    uri: asset.uri,
    name,
    type: mime,
  } as unknown as Blob);
}
