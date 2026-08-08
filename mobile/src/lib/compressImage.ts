import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import type { ImagePickerAsset } from "expo-image-picker";

/** Longest edge kept after shrinking — plenty for identifying an item. */
const MAX_EDGE = 1400;
const JPEG_QUALITY = 0.7;

/**
 * Shrink a camera photo before uploading.
 *
 * A phone camera writes 3-5 MB files. Pushing that over campus Wi-Fi takes
 * long enough to trip the request timeout, and the report then fails with a
 * misleading "cannot reach the server". Resized, the same photo is well under
 * half a megabyte and uploads in a moment.
 */
export async function compressForUpload(
  asset: ImagePickerAsset,
): Promise<ImagePickerAsset> {
  if (!asset.uri) return asset;

  try {
    const context = ImageManipulator.manipulate(asset.uri);
    const width = asset.width ?? 0;
    const height = asset.height ?? 0;

    if (Math.max(width, height) > MAX_EDGE) {
      context.resize(
        height >= width
          ? { height: MAX_EDGE, width: null }
          : { width: MAX_EDGE, height: null },
      );
    }

    const rendered = await context.renderAsync();
    const saved = await rendered.saveAsync({
      compress: JPEG_QUALITY,
      format: SaveFormat.JPEG,
    });

    return {
      ...asset,
      uri: saved.uri,
      width: saved.width,
      height: saved.height,
      mimeType: "image/jpeg",
      fileName: `${(asset.fileName ?? "item").replace(/\.[^.]+$/, "")}.jpg`,
    };
  } catch {
    // A failed resize must not block the report — send the original instead.
    return asset;
  }
}
