import { Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { uploadProfilePhoto } from "../api/auth";
import { compressForUpload } from "./compressImage";
import { appendImageToFormData } from "./formData";
import type { User } from "../types";

/**
 * Opens the gallery picker, compresses, and uploads a new profile photo.
 * Returns the updated user (with the new photo_url) on success, or null if
 * the user cancelled or permission was denied — never throws for those.
 */
export async function pickAndUploadProfilePhoto(token: string): Promise<User | null> {
  if (Platform.OS !== "web") {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    quality: 0.8,
    allowsEditing: true,
    aspect: [1, 1],
    mediaTypes: ["images"],
  });
  if (result.canceled || !result.assets[0]) return null;

  const asset = await compressForUpload(result.assets[0]);
  const form = new FormData();
  await appendImageToFormData(form, "photo", asset, "profile.jpg");
  return uploadProfilePhoto(token, form);
}
