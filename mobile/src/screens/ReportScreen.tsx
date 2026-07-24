import React, { useEffect, useState } from "react";
import {
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { claimAgainstFound, createItem, fetchItem, fetchMetadata } from "../api/auth";
import { resolveImageUrl } from "../api/client";
import { ConnectionBanner } from "../components/ConnectionBanner";
import { ConnectionGate } from "../components/ConnectionGate";
import { ErrorState } from "../components/ErrorState";
import { LoadingOverlay } from "../components/LoadingOverlay";
import { Field, PrimaryButton, ScreenShell } from "../components/Ui";
import {
  PermissionDeniedState,
  SuccessState,
  ValidationMessage,
} from "../components/states";
import { useAuth } from "../context/AuthContext";
import { useConnection } from "../context/ConnectionContext";
import { appendImageToFormData } from "../lib/formData";
import { hasErrors, validateReport } from "../lib/validation";
import { RootStackParamList } from "../navigation/types";
import { COLORS } from "../constants/config";
import { ApiError } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "Report">;

export function ReportScreen({ route, navigation }: Props) {
  const { mode, linkFoundId } = route.params;
  const linkingFound = mode === "lost" && Boolean(linkFoundId);
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
  const [foundPreviewUrl, setFoundPreviewUrl] = useState<string | null>(null);
  const [foundPreviewTitle, setFoundPreviewTitle] = useState<string | null>(null);
  const [categories, setCategories] = useState<{ id: string; label: string }[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isUrgent, setIsUrgent] = useState(mode === "lost");
  const [photo, setPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);
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

      if (linkFoundId) {
        const found = await fetchItem(token, linkFoundId);
        setFoundPreviewUrl(resolveImageUrl(found.image_url));
        setFoundPreviewTitle(found.title);
        if (found.category) nextCategory = found.category;
        if (found.location) nextLocation = found.location;
        setTitle((prev) => prev || found.title);
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
  }, [token, linkFoundId]);

  const applyPickedPhoto = (asset: ImagePicker.ImagePickerAsset) => {
    setPhoto(asset);
    setPermissionDenied(null);
    setFieldErrors((prev) => ({ ...prev, photo: "" }));
  };

  const pickFromGallery = async () => {
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
      applyPickedPhoto(result.assets[0]);
    }
  };

  const takePhoto = async () => {
    if (Platform.OS === "web") {
      await pickFromGallery();
      return;
    }
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setPermissionDenied("camera");
      return;
    }
    setPermissionDenied(null);
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      applyPickedPhoto(result.assets[0]);
    }
  };

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
      await appendImageToFormData(form, "image", photo);

      const item = await createItem(token, form);

      if (linkingFound && linkFoundId) {
        await claimAgainstFound(token, linkFoundId, item.id);
        setClaimSent(true);
      }

      setSuccessItemId(item.id);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Upload failed. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingMeta) return <LoadingOverlay label="Loading form..." />;
  if (error) return <ErrorState error={error} onRetry={loadMeta} />;

  if (successItemId != null) {
    return (
      <SuccessState
        title={
          claimSent
            ? "Lost claim sent"
            : mode === "lost"
              ? "Lost report live"
              : "Found report live"
        }
        message={
          claimSent
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
        <ScrollView>
          <ScreenShell
            title={
              linkingFound
                ? "Raise lost claim"
                : mode === "lost"
                  ? "Report lost valuable"
                  : "Report found valuable"
            }
            subtitle={
              linkingFound
                ? "You’re claiming a found item from the campus feed. Add your photo and details — the finder will get a request with both pictures."
                : "Low-value items like pens and pencils are rejected. Upload one clear photo."
            }
          >
            {linkingFound && foundPreviewUrl ? (
              <View style={styles.foundRef}>
                <Text style={styles.foundRefLabel}>Found item you’re claiming</Text>
                <Image source={{ uri: foundPreviewUrl }} style={styles.foundRefImage} />
                {foundPreviewTitle ? (
                  <Text style={styles.foundRefTitle}>{foundPreviewTitle}</Text>
                ) : null}
              </View>
            ) : null}

            <View style={[styles.photoBox, fieldErrors.photo ? styles.photoError : null]}>
              {photo ? (
                <Image source={{ uri: photo.uri }} style={styles.photo} />
              ) : (
                <Text style={styles.photoHint}>Add one clear photo of the item</Text>
              )}
            </View>
            <View style={styles.photoActions}>
              <Pressable style={styles.photoActionBtn} onPress={pickFromGallery}>
                <Text style={styles.photoActionText}>Gallery</Text>
              </Pressable>
              {Platform.OS !== "web" ? (
                <Pressable style={styles.photoActionBtn} onPress={takePhoto}>
                  <Text style={styles.photoActionText}>Camera</Text>
                </Pressable>
              ) : null}
            </View>
            <ValidationMessage message={fieldErrors.photo} field />

            <Text style={styles.label}>Category</Text>
            <View style={styles.chips}>
              {categories.map((item) => (
                <Pressable
                  key={item.id}
                  style={[styles.chip, category === item.id && styles.chipActive]}
                  onPress={() => {
                    setCategory(item.id);
                    setFieldErrors((prev) => ({ ...prev, category: "" }));
                  }}
                >
                  <Text style={[styles.chipText, category === item.id && styles.chipTextActive]}>
                    {item.label}
                  </Text>
                </Pressable>
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
                <Pressable
                  key={loc}
                  style={[styles.chip, location === loc && styles.chipActive]}
                  onPress={() => {
                    setLocation(loc);
                    setFieldErrors((prev) => ({ ...prev, location: "" }));
                  }}
                >
                  <Text style={[styles.chipText, location === loc && styles.chipTextActive]}>{loc}</Text>
                </Pressable>
              ))}
            </View>
            <ValidationMessage message={fieldErrors.location} field />

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Urgent campus alert (valuables only)</Text>
              <Switch value={isUrgent} onValueChange={setIsUrgent} />
            </View>

            <ValidationMessage message={formError} />

            <PrimaryButton
              label={
                submitting
                  ? linkingFound
                    ? "Sending claim..."
                    : "Uploading..."
                  : linkingFound
                    ? "Submit lost claim"
                    : "Submit report"
              }
              onPress={submit}
              disabled={submitting}
            />
          </ScreenShell>
        </ScrollView>
      </View>
    </ConnectionGate>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  foundRef: {
    marginBottom: 14,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  foundRefLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  foundRefImage: {
    width: "100%",
    height: 140,
    borderRadius: 10,
    backgroundColor: "#EEF2F7",
  },
  foundRefTitle: {
    marginTop: 8,
    fontWeight: "700",
    color: COLORS.text,
  },
  photoBox: {
    height: 180,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    overflow: "hidden",
  },
  photoError: {
    borderColor: COLORS.danger,
  },
  photo: { width: "100%", height: "100%" },
  photoHint: { color: COLORS.textMuted },
  photoActions: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  photoActionBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  photoActionText: {
    color: COLORS.primary,
    fontWeight: "700",
    fontSize: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 8,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 4,
  },
  chip: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: { color: COLORS.text, fontSize: 12 },
  chipTextActive: { color: "#fff", fontWeight: "700" },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  switchLabel: {
    flex: 1,
    color: COLORS.text,
    fontWeight: "600",
  },
});
