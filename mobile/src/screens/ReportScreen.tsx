import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { createItem, fetchMetadata } from "../api/auth";
import { ConnectionBanner } from "../components/ConnectionBanner";
import { ErrorState } from "../components/ErrorState";
import { LoadingOverlay } from "../components/LoadingOverlay";
import { Field, PrimaryButton, ScreenShell } from "../components/Ui";
import { useAuth } from "../context/AuthContext";
import { useConnection } from "../context/ConnectionContext";
import { RootStackParamList } from "../navigation/types";
import { COLORS } from "../constants/config";
import { ApiError } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "Report">;

export function ReportScreen({ route, navigation }: Props) {
  const { mode } = route.params;
  const { token } = useAuth();
  const { state } = useConnection();
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [categories, setCategories] = useState<{ id: string; label: string }[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isUrgent, setIsUrgent] = useState(mode === "lost");
  const [photo, setPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);

  useEffect(() => {
    (async () => {
      if (!token) return;
      try {
        const meta = await fetchMetadata(token);
        setCategories(meta.categories);
        setLocations(meta.locations);
        setCategory(meta.categories[0]?.id ?? "");
        setLocation(meta.locations[0] ?? "");
      } catch (err) {
        setError(err);
      } finally {
        setLoadingMeta(false);
      }
    })();
  }, [token]);

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Camera permission needed", "Allow camera access to upload item photos.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      allowsEditing: true,
    });
    if (!result.canceled) {
      setPhoto(result.assets[0]);
    }
  };

  const submit = async () => {
    if (!token) return;
    if (state !== "online") {
      Alert.alert("Offline", "You need an active server connection to upload a report.");
      return;
    }
    if (!photo) {
      Alert.alert("Photo required", "Take a clear photo of the valuable item.");
      return;
    }

    const form = new FormData();
    form.append("item_type", mode);
    form.append("category", category);
    form.append("title", title);
    form.append("description", description);
    form.append("location", location);
    form.append("is_urgent", String(isUrgent));
    form.append("image", {
      uri: photo.uri,
      name: "item.jpg",
      type: "image/jpeg",
    } as unknown as Blob);

    setSubmitting(true);
    try {
      const item = await createItem(token, form);
      Alert.alert(
        mode === "lost" ? "Lost report live" : "Found report live",
        mode === "lost"
          ? "Campus users can now see your report. Only your VTU ID is public."
          : "AI is checking for possible owners. Matches appear on the item page.",
      );
      navigation.replace("ItemDetail", { itemId: item.id });
    } catch (err) {
      Alert.alert("Upload failed", err instanceof ApiError ? err.message : "Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingMeta) return <LoadingOverlay label="Loading form..." />;
  if (error) return <ErrorState error={error} onRetry={() => setError(null)} />;

  return (
    <View style={styles.root}>
      <ConnectionBanner />
      <ScrollView>
        <ScreenShell
          title={mode === "lost" ? "Report lost valuable" : "Report found valuable"}
          subtitle="Low-value items like pens and pencils are rejected. Upload one clear photo."
        >
          <Pressable style={styles.photoBox} onPress={pickPhoto}>
            {photo ? (
              <Image source={{ uri: photo.uri }} style={styles.photo} />
            ) : (
              <Text style={styles.photoHint}>Tap to take photo</Text>
            )}
          </Pressable>

          <Text style={styles.label}>Category</Text>
          <View style={styles.chips}>
            {categories.map((item) => (
              <Pressable
                key={item.id}
                style={[styles.chip, category === item.id && styles.chipActive]}
                onPress={() => setCategory(item.id)}
              >
                <Text style={[styles.chipText, category === item.id && styles.chipTextActive]}>
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Field label="Short title" value={title} onChangeText={setTitle} placeholder="Black Fastrack watch" autoCapitalize="sentences" />
          <Field label="Details" value={description} onChangeText={setDescription} placeholder="Scratches, brand, unique marks" autoCapitalize="sentences" />

          <Text style={styles.label}>Location</Text>
          <View style={styles.chips}>
            {locations.map((loc) => (
              <Pressable
                key={loc}
                style={[styles.chip, location === loc && styles.chipActive]}
                onPress={() => setLocation(loc)}
              >
                <Text style={[styles.chipText, location === loc && styles.chipTextActive]}>{loc}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Urgent campus alert (valuables only)</Text>
            <Switch value={isUrgent} onValueChange={setIsUrgent} />
          </View>

          <PrimaryButton
            label={submitting ? "Uploading..." : "Submit report"}
            onPress={submit}
            disabled={submitting}
          />
        </ScreenShell>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  photoBox: {
    height: 180,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    overflow: "hidden",
  },
  photo: { width: "100%", height: "100%" },
  photoHint: { color: COLORS.textMuted },
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
    marginBottom: 14,
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
