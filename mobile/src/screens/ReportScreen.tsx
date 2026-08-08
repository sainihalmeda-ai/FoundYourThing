import React, { useEffect, useState } from "react";
import { Linking, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { KeyboardAwareScrollView } from "../components/Keyboard";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  claimAgainstFound,
  createItem,
  fetchItem,
  fetchMetadata,
  foundAgainstLost,
} from "../api/auth";
import { resolveImageUrl } from "../api/client";
import { ConnectionBanner } from "../components/ConnectionBanner";
import { ConnectionGate } from "../components/ConnectionGate";
import { ErrorState } from "../components/ErrorState";
import { LoadingOverlay } from "../components/LoadingOverlay";
import { PhotoView } from "../components/PhotoView";
import { AppButton, Chip, Field, PremiumSwitch, ScreenShell } from "../components/Ui";
import {
  PermissionDeniedState,
  SuccessState,
  ValidationMessage,
} from "../components/states";
import { useAuth } from "../context/AuthContext";
import { useConnection } from "../context/ConnectionContext";
import { appendImageToFormData } from "../lib/formData";
import { compressForUpload } from "../lib/compressImage";
import { inspectPhoto } from "../lib/photoFile";
import {
  deviceTimestamp,
  liveCaptureProblem,
  pickExifFields,
} from "../lib/livePhoto";
import { hasErrors, validateReport } from "../lib/validation";
import { RootStackParamList } from "../navigation/types";
import { COLORS, FONTS, LIVEGO_ENABLED, RADIUS, SHADOW } from "../constants/config";
import { ApiError } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "Report">;

export function ReportScreen({ route, navigation }: Props) {
  const { mode, linkFoundId, linkLostId } = route.params;
  /** Owner answering a found item on the feed with their own lost report. */
  const linkingFound = mode === "lost" && Boolean(linkFoundId);
  /** Finder answering a lost report on the feed with the item they picked up. */
  const linkingLost = mode === "found" && Boolean(linkLostId);
  const linkedItemId = linkFoundId ?? linkLostId;
  /** LiveGo: finders must shoot the item live, blocking reposts of someone else's picture. */
  const liveOnly = LIVEGO_ENABLED && mode === "found";
  /** Only native builds get a real camera app; the web uses the file dialog. */
  const hasCamera = Platform.OS !== "web";
  const cameraOnly = liveOnly && hasCamera;
  const { token } = useAuth();
  const { canUseApi } = useConnection();
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [permissionDenied, setPermissionDenied] = useState<"camera" | "gallery" | null>(
    null,
  );
  const [successItemId, setSuccessItemId] = useState<number | null>(null);
  const [claimSent, setClaimSent] = useState(false);
  const [linkedPreviewUrl, setLinkedPreviewUrl] = useState<string | null>(null);
  const [linkedPreviewTitle, setLinkedPreviewTitle] = useState<string | null>(null);
  const [categories, setCategories] = useState<{ id: string; label: string }[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isUrgent, setIsUrgent] = useState(mode === "lost");
  const [photo, setPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [photoSource, setPhotoSource] = useState<"camera" | "gallery" | null>(null);
  const [photoKey, setPhotoKey] = useState(0);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const loadMeta = async () => {
    if (!token) return;
    setLoadingMeta(true);
    setError(null);
    try {
      const meta = await fetchMetadata(token);
      setCategories(meta.categories);
      setLocations(meta.locations);

      let nextCategory = meta.categories[0]?.id ?? "";
      let nextLocation = meta.locations[0] ?? "";

      if (linkedItemId) {
        const linked = await fetchItem(token, linkedItemId);
        setLinkedPreviewUrl(resolveImageUrl(linked.image_url));
        setLinkedPreviewTitle(linked.title);
        if (linked.category) nextCategory = linked.category;
        if (linked.location) nextLocation = linked.location;
        setTitle((prev) => prev || linked.title);
      }

      setCategory(nextCategory);
      setLocation(nextLocation);
    } catch (err) {
      setError(err);
    } finally {
      setLoadingMeta(false);
    }
  };

  useEffect(() => {
    loadMeta();
  }, [token, linkedItemId]);

  const applyPickedPhoto = (
    asset: ImagePicker.ImagePickerAsset,
    source: "camera" | "gallery",
  ) => {
    setPermissionDenied(null);

    if (cameraOnly) {
      const problem = liveCaptureProblem(pickExifFields(asset.exif));
      if (problem) {
        setPhoto(null);
        setPhotoSource(null);
        setFieldErrors((prev) => ({ ...prev, photo: problem }));
        return;
      }
    }

    setPhoto(asset);
    setPhotoSource(source);
    setPhotoKey((value) => value + 1);
    setFieldErrors((prev) => ({ ...prev, photo: "" }));
  };

  const pickFromGallery = async () => {
    if (cameraOnly) return;
    if (Platform.OS !== "web") {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setPermissionDenied("gallery");
        return;
      }
    }
    setPermissionDenied(null);
    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.7,
      allowsEditing: true,
      mediaTypes: ["images"],
    });
    if (!result.canceled && result.assets[0]) {
      applyPickedPhoto(result.assets[0], "gallery");
    }
  };

  const takePhoto = async () => {
    if (Platform.OS !== "web") {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setPermissionDenied("camera");
        return;
      }
    }
    setPermissionDenied(null);
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      // Cropping is disabled for found reports so the live frame stays intact.
      allowsEditing: !liveOnly,
      cameraType: ImagePicker.CameraType.back,
      exif: true,
    });
    if (!result.canceled && result.assets[0]) {
      applyPickedPhoto(result.assets[0], "camera");
    }
  };

  // A desktop browser has no camera app, and a phone browser already offers the
  // camera inside its file dialog, so one button covers the web on every device.
  const singlePhotoButton = liveOnly || !hasCamera;
  const choosePhoto = cameraOnly ? takePhoto : pickFromGallery;
  const photoHint = cameraOnly
    ? "Tap here to capture the item"
    : liveOnly
      ? "Tap here to pick the photo you just took"
      : hasCamera
        ? "Tap here, or use Gallery or Camera above"
        : "Tap here to choose a photo of the item";

  const submit = async () => {
    if (!token || !photo) return;
    setFormError(null);

    const errors = validateReport({
      title,
      description,
      category,
      location,
      hasPhoto: Boolean(photo),
    });
    if (cameraOnly && photoSource !== "camera") {
      errors.photo = "Found reports need a live camera photo taken here in the app.";
    }
    setFieldErrors(errors);
    if (hasErrors(errors)) return;

    if (!canUseApi) {
      setFormError("You need an active server connection to upload a report.");
      return;
    }

    setSubmitting(true);
    try {
      const form = new FormData();
      form.append("item_type", mode);
      form.append("category", category);
      form.append("title", title.trim());
      form.append("description", description.trim());
      form.append("location", location);
      form.append("is_urgent", String(isUrgent));
      form.append("client_exif", JSON.stringify(pickExifFields(photo.exif)));
      form.append("client_now", deviceTimestamp());
      // Camera photos are several megabytes; shrink before sending, but only
      // trust the shrunk copy if it actually landed on disk.
      const resized = await compressForUpload(photo);
      const resizedInfo = inspectPhoto(resized.uri);
      const upload = resizedInfo.exists && resizedInfo.size !== 0 ? resized : photo;
      if (__DEV__) {
        console.log(
          `[report] uploading ${upload.uri} (${resizedInfo.size ?? "?"} bytes, ` +
            `${upload === photo ? "original" : "resized"})`,
        );
      }
      await appendImageToFormData(form, "image", upload);

      const item = await createItem(token, form);

      if (linkingFound && linkFoundId) {
        await claimAgainstFound(token, linkFoundId, item.id);
        setClaimSent(true);
      } else if (linkingLost && linkLostId) {
        await foundAgainstLost(token, linkLostId, item.id);
        setClaimSent(true);
      }

      setSuccessItemId(item.id);
    } catch (err) {
      const base =
        err instanceof ApiError
          ? err.kind === "offline" || err.kind === "timeout"
            ? `${err.message} Your photo is still here — press the button again once you have signal.`
            : err.message
          : "Upload failed. Try again.";
      const detail = err instanceof ApiError ? err.detail : String(err);
      setFormError(__DEV__ && detail ? `${base}\n[debug] ${detail}` : base);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingMeta) {
    return (
      <LoadingOverlay label="Preparing report" hint="Loading categories and campus locations…" />
    );
  }
  if (error) return <ErrorState error={error} onRetry={loadMeta} />;

  if (successItemId != null) {
    return (
      <SuccessState
        title={
          linkingLost && claimSent
            ? "Owner notified"
            : claimSent
              ? "Lost claim sent"
              : mode === "lost"
                ? "Lost report live"
                : "Found report live"
        }
        message={
          linkingLost && claimSent
            ? "Your found report is live and the owner was told you may have their item. They’ll see both photos and decide whether to share contact."
            : claimSent
              ? "Your lost report is live and a contact request was sent to the finder. They’ll see both photos in a popup."
              : mode === "lost"
                ? "Campus users can now see your report. Only your VTU ID is public."
                : "AI is checking for possible owners. Matches appear on the item page."
        }
        actionLabel="View your report"
        onAction={() => navigation.replace("ItemDetail", { itemId: successItemId })}
        secondaryLabel="Back to feed"
        onSecondary={() => navigation.navigate("Feed")}
      />
    );
  }

  if (permissionDenied) {
    const isGallery = permissionDenied === "gallery";
    return (
      <PermissionDeniedState
        permissionName={isGallery ? "photo library" : "the camera"}
        message={
          isGallery
            ? "Allow gallery access so you can upload an existing photo of the item."
            : liveOnly
              ? "Found reports need a live photo. Allow camera access to capture the item."
              : "Allow camera access to take a clear photo of the item."
        }
        onRetry={isGallery ? pickFromGallery : takePhoto}
        onOpenSettings={() => Linking.openSettings()}
      />
    );
  }

  return (
    <ConnectionGate>
      <View style={styles.root}>
        <ConnectionBanner />
        <KeyboardAwareScrollView bottomOffset={24} keyboardShouldPersistTaps="handled">
          <ScreenShell
            title={
              linkingFound
                ? "Raise lost claim"
                : linkingLost
                  ? "I found this item"
                  : mode === "lost"
                    ? "Report lost valuable"
                    : "Report found valuable"
            }
            subtitle={
              linkingFound
                ? "You’re claiming a found item from the campus feed. Add your photo and details — the finder will get a request with both pictures."
                : linkingLost
                  ? "You’re answering a lost report from the campus feed. Add a photo of the item you picked up — the owner will compare both pictures and decide."
                  : liveOnly
                    ? "Low-value items like pens and pencils are rejected. Take one live photo of the item you found."
                    : "Low-value items like pens and pencils are rejected. Upload one clear photo."
            }
          >
            {linkedPreviewUrl ? (
              <View style={styles.foundRef}>
                <Text style={styles.foundRefLabel}>
                  {linkingLost ? "Lost report you’re answering" : "Found item you’re claiming"}
                </Text>
                <PhotoView uri={linkedPreviewUrl} style={styles.foundRefImage} />
                {linkedPreviewTitle ? (
                  <Text style={styles.foundRefTitle}>{linkedPreviewTitle}</Text>
                ) : null}
              </View>
            ) : null}

            {liveOnly ? (
              <View style={styles.liveNote}>
                <Ionicons name="camera" size={16} color={COLORS.accent} />
                <Text style={styles.liveNoteText}>
                  {hasCamera
                    ? "Live photo required. We read the photo’s camera data, so downloaded or edited pictures are rejected — shoot the item in front of you."
                    : "This browser has no camera. Upload an unedited photo you just took on your phone — we read its camera data and reject downloaded or edited images."}
                </Text>
              </View>
            ) : null}

            <View style={styles.photoActions}>
              {singlePhotoButton ? (
                <Pressable
                  style={[styles.photoActionBtn, styles.photoActionActive]}
                  onPress={choosePhoto}
                >
                  <Text style={[styles.photoActionText, styles.photoActionTextActive]}>
                    {cameraOnly
                      ? photo
                        ? "Retake live photo"
                        : "Take live photo"
                      : photo
                        ? "Change photo"
                        : "Choose photo"}
                  </Text>
                </Pressable>
              ) : (
                <>
                  <Pressable
                    style={[
                      styles.photoActionBtn,
                      photoSource !== "camera" && styles.photoActionActive,
                    ]}
                    onPress={pickFromGallery}
                  >
                    <Text
                      style={[
                        styles.photoActionText,
                        photoSource !== "camera" && styles.photoActionTextActive,
                      ]}
                    >
                      Gallery
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.photoActionBtn,
                      photoSource === "camera" && styles.photoActionActive,
                    ]}
                    onPress={takePhoto}
                  >
                    <Text
                      style={[
                        styles.photoActionText,
                        photoSource === "camera" && styles.photoActionTextActive,
                      ]}
                    >
                      Camera
                    </Text>
                  </Pressable>
                </>
              )}
            </View>
            {photo ? (
              // Keyed on the pick counter so a replacement image always remounts.
              <PhotoView key={photoKey} uri={photo.uri} style={styles.photoPreview} />
            ) : (
              <Pressable
                onPress={choosePhoto}
                style={({ pressed }) => [
                  styles.photoBox,
                  fieldErrors.photo ? styles.photoError : null,
                  pressed ? styles.photoBoxPressed : null,
                ]}
              >
                <Ionicons
                  name={cameraOnly ? "camera-outline" : "image-outline"}
                  size={26}
                  color={COLORS.accent}
                />
                <Text style={styles.photoHint}>{photoHint}</Text>
              </Pressable>
            )}
            {liveOnly && photo && photoSource === "camera" ? (
              <View style={styles.liveBadge}>
                <Ionicons name="shield-checkmark" size={13} color={COLORS.success} />
                <Text style={styles.liveBadgeText}>Live photo captured in app</Text>
              </View>
            ) : null}
            <ValidationMessage message={fieldErrors.photo} field />

            <Text style={styles.label}>Category</Text>
            <View style={styles.chips}>
              {categories.map((item) => (
                <Chip
                  key={item.id}
                  label={item.label}
                  active={category === item.id}
                  onPress={() => {
                    setCategory(item.id);
                    setFieldErrors((prev) => ({ ...prev, category: "" }));
                  }}
                />
              ))}
            </View>
            <ValidationMessage message={fieldErrors.category} field />

            <Field
              label="Short title"
              value={title}
              onChangeText={(text) => {
                setTitle(text);
                setFieldErrors((prev) => ({ ...prev, title: "" }));
              }}
              placeholder="Black Fastrack watch"
              autoCapitalize="sentences"
              error={fieldErrors.title}
            />
            <Field
              label="Details"
              value={description}
              onChangeText={(text) => {
                setDescription(text);
                setFieldErrors((prev) => ({ ...prev, description: "" }));
              }}
              placeholder="Scratches, brand, unique marks"
              autoCapitalize="sentences"
              error={fieldErrors.description}
            />

            <Text style={styles.label}>Location</Text>
            <View style={styles.chips}>
              {locations.map((loc) => (
                <Chip
                  key={loc}
                  label={loc}
                  active={location === loc}
                  onPress={() => {
                    setLocation(loc);
                    setFieldErrors((prev) => ({ ...prev, location: "" }));
                  }}
                />
              ))}
            </View>
            <ValidationMessage message={fieldErrors.location} field />

            {mode === "lost" ? (
              <PremiumSwitch
                label="Urgent campus alert — pin near top of feed"
                value={isUrgent}
                onValueChange={setIsUrgent}
              />
            ) : null}

            <ValidationMessage message={formError} />

            <AppButton
              label={
                submitting
                  ? linkingFound || linkingLost
                    ? "Sending to the other student…"
                    : "Posting your report…"
                  : linkingFound
                    ? "Submit lost claim"
                    : linkingLost
                      ? "Notify the owner"
                      : mode === "lost"
                        ? "Post lost report"
                        : "Post found report"
              }
              onPress={submit}
              disabled={submitting}
              loading={submitting}
            />
          </ScreenShell>
        </KeyboardAwareScrollView>
      </View>
    </ConnectionGate>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  foundRef: {
    marginBottom: 14,
    padding: 14,
    borderRadius: RADIUS["2xl"],
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  foundRefLabel: {
    fontSize: 12,
    fontFamily: FONTS.sansBold,
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  foundRefImage: {
    width: "100%",
    height: 140,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surfaceMuted,
  },
  foundRefTitle: {
    marginTop: 8,
    fontFamily: FONTS.sansBold,
    color: COLORS.text,
  },
  liveNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 12,
    padding: 12,
    borderRadius: RADIUS["2xl"],
    backgroundColor: "rgba(0,156,165,0.1)",
    borderWidth: 1,
    borderColor: "rgba(0,156,165,0.25)",
  },
  liveNoteText: {
    flex: 1,
    fontFamily: FONTS.sansMedium,
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.text,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  liveBadgeText: {
    fontFamily: FONTS.sansSemi,
    fontSize: 12,
    color: COLORS.success,
  },
  photoBox: {
    height: 220,
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 8,
    overflow: "hidden",
  },
  photoBoxPressed: {
    backgroundColor: COLORS.surfaceMuted,
  },
  photoError: {
    borderColor: COLORS.danger,
  },
  photoPreview: {
    height: 220,
    borderRadius: 20,
    marginBottom: 8,
  },
  photoHint: {
    color: COLORS.textMuted,
    fontFamily: FONTS.sansMedium,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  photoActions: {
    flexDirection: "row",
    gap: 0,
    marginBottom: 12,
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: RADIUS.pill,
    padding: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  photoActionBtn: {
    flex: 1,
    borderRadius: RADIUS.pill,
    paddingVertical: 10,
    alignItems: "center",
  },
  photoActionActive: {
    backgroundColor: COLORS.card,
    ...SHADOW.soft,
  },
  photoActionText: {
    color: COLORS.textMuted,
    fontFamily: FONTS.sansMedium,
    fontSize: 12,
  },
  photoActionTextActive: {
    color: COLORS.text,
    fontFamily: FONTS.sansSemi,
  },
  label: {
    fontSize: 13,
    fontFamily: FONTS.sansSemi,
    color: COLORS.text,
    marginBottom: 8,
    marginTop: 6,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
});
