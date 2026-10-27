import React, { useEffect, useState } from "react";
import {
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
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
import { ErrorState } from "../components/ErrorState";
import { LoadingOverlay } from "../components/LoadingOverlay";
import { PhotoView } from "../components/PhotoView";
import { SidebarShell } from "../components/SidebarShell";
import {
  ModeToggle,
  NextSteps,
  ReportPreview,
  StepCard,
} from "../components/report/ReportDesktopParts";
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
import {
  COLORS,
  FONTS,
  LIVEGO_ENABLED,
  RADIUS,
  SHADOW,
  WIDE_BREAKPOINT,
} from "../constants/config";
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
  const { width } = useWindowDimensions();
  const wide = width >= WIDE_BREAKPOINT;

  // The desktop header can switch Lost <-> Found in place; keep the
  // urgent default in step with whichever mode is showing.
  useEffect(() => {
    setIsUrgent(mode === "lost");
  }, [mode]);

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

  if (loadingMeta && !wide) {
    return (
      <LoadingOverlay label="Preparing report" hint="Loading categories and campus locations…" />
    );
  }
  if (error) return <ErrorState error={error} onRetry={loadMeta} />;

  if (successItemId != null) {
    const success = (
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
    return wide ? <SidebarShell active="home">{success}</SidebarShell> : success;
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

  // ---- Form pieces, arranged below as one column (phone) or a grid (desktop) ----

  const headline = linkingFound
    ? "Raise lost claim"
    : linkingLost
      ? "I found this item"
      : mode === "lost"
        ? "Report lost valuable"
        : "Report found valuable";

  const intro = linkingFound
    ? "You’re claiming a found item from the campus feed. Add your photo and details — the finder will get a request with both pictures."
    : linkingLost
      ? "You’re answering a lost report from the campus feed. Add a photo of the item you picked up — the owner will compare both pictures and decide."
      : liveOnly
        ? "Low-value items like pens and pencils are rejected. Take one live photo of the item you found."
        : "Low-value items like pens and pencils are rejected. Upload one clear photo.";

  const submitLabel = submitting
    ? linkingFound || linkingLost
      ? "Sending to the other student…"
      : "Posting your report…"
    : linkingFound
      ? "Submit lost claim"
      : linkingLost
        ? "Notify the owner"
        : mode === "lost"
          ? "Post lost report"
          : "Post found report";

  const linkedRef = linkedPreviewUrl ? (
    <View style={styles.foundRef}>
      <Text style={styles.foundRefLabel}>
        {linkingLost ? "Lost report you’re answering" : "Found item you’re claiming"}
      </Text>
      <PhotoView uri={linkedPreviewUrl} style={styles.foundRefImage} />
      {linkedPreviewTitle ? <Text style={styles.foundRefTitle}>{linkedPreviewTitle}</Text> : null}
    </View>
  ) : null;

  const liveNote = liveOnly ? (
    <View style={styles.liveNote}>
      <Ionicons name="camera" size={16} color={COLORS.accent} />
      <Text style={styles.liveNoteText}>
        {hasCamera
          ? "Live photo required. We read the photo’s camera data, so downloaded or edited pictures are rejected — shoot the item in front of you."
          : "This browser has no camera. Upload an unedited photo you just took on your phone — we read its camera data and reject downloaded or edited images."}
      </Text>
    </View>
  ) : null;

  const photoPicker = (
    <>
      <View style={styles.photoActions}>
        {singlePhotoButton ? (
          <Pressable style={[styles.photoActionBtn, styles.photoActionActive]} onPress={choosePhoto}>
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
              style={[styles.photoActionBtn, photoSource !== "camera" && styles.photoActionActive]}
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
              style={[styles.photoActionBtn, photoSource === "camera" && styles.photoActionActive]}
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
        <PhotoView
          key={photoKey}
          uri={photo.uri}
          style={[styles.photoPreview, wide && styles.photoDesk]}
        />
      ) : (
        <Pressable
          onPress={choosePhoto}
          style={({ pressed }) => [
            styles.photoBox,
            wide && styles.photoDesk,
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
    </>
  );

  const categoryPicker = (
    <>
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
    </>
  );

  const detailFields = (
    <>
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
    </>
  );

  const locationChips = (
    <>
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
    </>
  );

  const urgentSwitch =
    mode === "lost" ? (
      <PremiumSwitch
        label="Urgent campus alert — pin near top of feed"
        value={isUrgent}
        onValueChange={setIsUrgent}
      />
    ) : null;

  const submitBlock = (
    <>
      <ValidationMessage message={formError} />
      <AppButton label={submitLabel} onPress={submit} disabled={submitting} loading={submitting} />
    </>
  );

  if (wide) {
    // Same thresholds as validateReport, so the checklist and the submit agree.
    const checks = [
      { label: "Photo added", done: Boolean(photo) },
      { label: "Category chosen", done: Boolean(category) },
      { label: "Short title", done: title.trim().length >= 3 },
      { label: "Details", done: description.trim().length >= 8 },
      { label: "Location", done: Boolean(location) },
    ];
    const canSwitchMode = !linkingFound && !linkingLost;

    return (
      <SidebarShell active="home" loading={loadingMeta} loadingLabel="Preparing report">
        <ConnectionBanner />
        <ScrollView contentContainerStyle={styles.deskScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.deskHeader}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={styles.eyebrowRow}>
                <Pressable
                  onPress={() =>
                    navigation.canGoBack()
                      ? navigation.goBack()
                      : navigation.navigate("MainTabs")
                  }
                  style={({ pressed }) => [styles.backPill, pressed && { opacity: 0.7 }]}
                  accessibilityRole="button"
                >
                  <Ionicons name="chevron-back" size={14} color={COLORS.primary} />
                  <Text style={styles.backPillText}>Back</Text>
                </Pressable>
                <Text style={styles.deskEyebrow}>
                  Lost &amp; Found · {mode === "lost" ? "Lost item" : "Found item"}
                </Text>
              </View>
              <Text style={styles.deskTitle}>{headline}</Text>
              <Text style={styles.deskSub}>{intro}</Text>
            </View>
            {canSwitchMode ? (
              <ModeToggle mode={mode} onChange={(m) => navigation.setParams({ mode: m })} />
            ) : null}
          </View>

          <View style={styles.deskGrid}>
            <View style={styles.deskColA}>
              <StepCard step={1} title="Photo" icon="camera-outline" done={checks[0].done}>
                {liveNote}
                {photoPicker}
                <View style={styles.tipRow}>
                  <Ionicons name="bulb-outline" size={14} color={COLORS.gold} />
                  <Text style={styles.tipText}>
                    Whole item, plain background, good light — matching compares photos.
                  </Text>
                </View>
              </StepCard>
              <StepCard
                step={3}
                title={mode === "lost" ? "Where did you lose it?" : "Where did you find it?"}
                icon="location-outline"
                done={checks[4].done}
              >
                {locationChips}
              </StepCard>
            </View>

            <View style={styles.deskColB}>
              <StepCard
                step={2}
                title="About the item"
                icon="pricetag-outline"
                done={checks[1].done && checks[2].done && checks[3].done}
              >
                {categoryPicker}
                {detailFields}
              </StepCard>
              <NextSteps mode={mode} />
            </View>

            <View style={styles.deskColC}>
              {linkedRef}
              <ReportPreview
                mode={mode}
                photoUri={photo?.uri ?? null}
                title={title}
                categoryLabel={categories.find((c) => c.id === category)?.label ?? ""}
                location={location}
                isUrgent={isUrgent}
                checks={checks}
              />
              {urgentSwitch}
              <View style={styles.privacyRow}>
                <Ionicons name="lock-closed-outline" size={13} color={COLORS.textMuted} />
                <Text style={styles.privacyText}>
                  Only your VTU ID is public. Your phone is never shared without your OK.
                </Text>
              </View>
              {submitBlock}
            </View>
          </View>
        </ScrollView>
      </SidebarShell>
    );
  }

  return (
    <SidebarShell active="home">
      <ConnectionBanner />
      <KeyboardAwareScrollView bottomOffset={24} keyboardShouldPersistTaps="handled">
        <ScreenShell title={headline} subtitle={intro}>
          {linkedRef}
          {liveNote}
          {photoPicker}
          {categoryPicker}
          {detailFields}
          <Text style={styles.label}>Location</Text>
          {locationChips}
          {urgentSwitch}
          {submitBlock}
        </ScreenShell>
      </KeyboardAwareScrollView>
    </SidebarShell>
  );
}

const styles = StyleSheet.create({
  deskScroll: {
    paddingHorizontal: 28,
    paddingTop: 20,
    paddingBottom: 20,
    width: "100%",
    maxWidth: 1240,
    alignSelf: "center",
  },
  deskHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 18,
  },
  eyebrowRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  backPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingVertical: 4,
    paddingLeft: 6,
    paddingRight: 10,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  backPillText: { fontFamily: FONTS.sansSemi, fontSize: 12.5, color: COLORS.primary },
  deskEyebrow: {
    fontFamily: FONTS.sansBold,
    fontSize: 11,
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  deskTitle: {
    marginTop: 4,
    fontFamily: FONTS.display,
    fontSize: 28,
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  deskSub: {
    marginTop: 4,
    maxWidth: 640,
    fontFamily: FONTS.sans,
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.textMuted,
  },
  deskGrid: { flexDirection: "row", alignItems: "flex-start", gap: 18 },
  deskColA: { flex: 1.1, minWidth: 0, gap: 18 },
  deskColB: { flex: 1.3, minWidth: 0, gap: 18 },
  deskColC: { width: 300, gap: 14 },
  tipRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  tipText: { flex: 1, fontFamily: FONTS.sans, fontSize: 11.5, color: COLORS.textMuted },
  photoDesk: { height: 180 },
  privacyRow: { flexDirection: "row", alignItems: "flex-start", gap: 6, paddingHorizontal: 2 },
  privacyText: {
    flex: 1,
    fontFamily: FONTS.sans,
    fontSize: 11.5,
    lineHeight: 16,
    color: COLORS.textMuted,
  },
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
