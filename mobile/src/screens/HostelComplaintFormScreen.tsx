import React, { useCallback, useEffect, useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { createHostelComplaint, fetchHostelOptions } from "../api/hostel";
import { ConnectionBanner } from "../components/ConnectionBanner";
import { ConnectionGate } from "../components/ConnectionGate";
import { DesktopCard, DesktopPage } from "../components/DesktopPage";
import { SidebarShell } from "../components/SidebarShell";
import { StepCard } from "../components/report/ReportDesktopParts";
import { KeyboardAwareScrollView } from "../components/Keyboard";
import { LoadingOverlay } from "../components/LoadingOverlay";
import { PhotoView } from "../components/PhotoView";
import { AppButton, Chip, Field, ScreenShell } from "../components/Ui";
import { ErrorState, SuccessState, ValidationMessage } from "../components/states";
import { useAuth } from "../context/AuthContext";
import { useConnection } from "../context/ConnectionContext";
import { compressForUpload } from "../lib/compressImage";
import { complaintTextProblem, countWords } from "../lib/complaintText";
import { appendImageToFormData } from "../lib/formData";
import { FieldErrors, hasErrors } from "../lib/validation";
import { RootStackParamList } from "../navigation/types";
import { COLORS, FONTS, RADIUS, WIDE_BREAKPOINT } from "../constants/config";
import { HOSTEL_GROUPS } from "../constants/hostel";
import { ApiError, HostelComplaintOptions } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "HostelComplaintNew">;

export function HostelComplaintFormScreen({ navigation }: Props) {
  const { token } = useAuth();
  const { canUseApi } = useConnection();
  const [options, setOptions] = useState<HostelComplaintOptions | null>(null);
  const [loadError, setLoadError] = useState<unknown>(null);

  const [hostel, setHostel] = useState("");
  const [block, setBlock] = useState("");
  const [room, setRoom] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [photoKey, setPhotoKey] = useState(0);

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { width } = useWindowDimensions();
  const wide = width >= WIDE_BREAKPOINT;

  const loadOptions = useCallback(async () => {
    if (!token) return;
    try {
      setLoadError(null);
      setOptions(await fetchHostelOptions(token));
    } catch (err) {
      setLoadError(err);
    }
  }, [token]);

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  const clearError = (key: string) => setFieldErrors((prev) => ({ ...prev, [key]: "" }));

  if (loadError) return <ErrorState error={loadError} onRetry={loadOptions} />;
  if (!options) {
    return wide ? (
      <SidebarShell active="hostel" loading>
        {null}
      </SidebarShell>
    ) : (
      <LoadingOverlay label="Loading" hint="Fetching hostels and blocks…" />
    );
  }

  if (submitted) {
    const success = (
      <SuccessState
        title="Complaint registered"
        message="The hostel office has your complaint and photo. You can follow its status under Your complaints."
        actionLabel="Back to Your complaints"
        onAction={() => navigation.replace("Hostel")}
      />
    );
    return wide ? <SidebarShell active="hostel">{success}</SidebarShell> : success;
  }

  const { min_words: minWords, max_words: maxWords } = options;
  const selectedHostel = options.hostels.find((h) => h.id === hostel);
  const words = countWords(description);
  const enoughWords = words >= minWords;
  // Padding/repetition only matters once the word count is there.
  const textProblem = enoughWords ? complaintTextProblem(description, minWords, maxWords) : null;

  const applyPickedPhoto = (result: ImagePicker.ImagePickerResult) => {
    if (result.canceled || !result.assets[0]) return;
    setPhoto(result.assets[0]);
    setPhotoKey((k) => k + 1);
    clearError("photo");
  };

  const pickFromGallery = async () => {
    if (Platform.OS !== "web") {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setFieldErrors((prev) => ({ ...prev, photo: "Allow photo access to attach a picture." }));
        return;
      }
    }
    applyPickedPhoto(
      await ImagePicker.launchImageLibraryAsync({ quality: 0.8, mediaTypes: ["images"] }),
    );
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setFieldErrors((prev) => ({ ...prev, photo: "Allow camera access to take a picture." }));
      return;
    }
    applyPickedPhoto(await ImagePicker.launchCameraAsync({ quality: 0.8 }));
  };

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {};
    if (!hostel) errors.hostel = "Choose your hostel.";
    if (selectedHostel?.blocks.length && !block) errors.block = "Choose your block.";
    if (!category) errors.category = "Choose what the complaint is about.";
    const problem = complaintTextProblem(description, minWords, maxWords);
    if (problem) errors.description = problem;
    if (!photo) errors.photo = "Attach a photo of the problem.";
    return errors;
  };

  const submit = async () => {
    if (!token) return;
    setFormError(null);
    const errors = validate();
    setFieldErrors(errors);
    if (hasErrors(errors) || !photo) return;

    if (!canUseApi) {
      setFormError("You need an active server connection to send this.");
      return;
    }

    setSubmitting(true);
    try {
      const form = new FormData();
      form.append("hostel", hostel);
      form.append("block", block);
      form.append("room", room.trim());
      form.append("category", category);
      form.append("description", description.trim());
      await appendImageToFormData(form, "attachment", await compressForUpload(photo), "complaint.jpg");
      await createHostelComplaint(token, form);
      setSubmitted(true);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Could not send this. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const whereFields = (
    <>
      <Text style={styles.label}>Hostel</Text>
      {HOSTEL_GROUPS.map((group) => {
        const hostels = options.hostels.filter((h) => h.group === group.key);
        if (hostels.length === 0) return null;
        return (
          <View key={group.key}>
            <Text style={styles.groupLabel}>{group.label}</Text>
            <View style={styles.chips}>
              {hostels.map((h) => (
                <Chip
                  key={h.id}
                  label={h.label}
                  active={hostel === h.id}
                  onPress={() => {
                    setHostel(h.id);
                    // A block letter from another hostel isn't valid here.
                    if (!h.blocks.includes(block)) setBlock("");
                    clearError("hostel");
                    clearError("block");
                  }}
                />
              ))}
            </View>
          </View>
        );
      })}
      <ValidationMessage message={fieldErrors.hostel} field />

      {/* Blocks appear once a hostel is picked, and only if it has any listed. */}
      {selectedHostel && selectedHostel.blocks.length > 0 ? (
        <>
          <Text style={styles.label}>Block in {selectedHostel.label}</Text>
          <View style={styles.chips}>
            {selectedHostel.blocks.map((b) => (
              <Chip
                key={b}
                label={`Block ${b}`}
                active={block === b}
                onPress={() => {
                  setBlock(b);
                  clearError("block");
                }}
              />
            ))}
          </View>
          <ValidationMessage message={fieldErrors.block} field />
        </>
      ) : null}

      <Field
        label="Room number (optional)"
        value={room}
        onChangeText={setRoom}
        placeholder="e.g. 214, or Mess hall"
        autoCapitalize="sentences"
      />
    </>
  );

  const problemFields = (
    <>
      <Text style={styles.label}>What is the problem?</Text>
      <View style={styles.chips}>
        {options.categories.map((c) => (
          <Chip
            key={c.id}
            label={c.label}
            active={category === c.id}
            onPress={() => {
              setCategory(c.id);
              clearError("category");
            }}
          />
        ))}
      </View>
      <ValidationMessage message={fieldErrors.category} field />

      <Text style={styles.label}>Describe the problem</Text>
      <Text style={styles.muted}>
        At least {minWords} words: what is wrong, exactly where, since when, who you have
        already told, and how it affects students.
      </Text>
      <TextInput
        style={[styles.textarea, fieldErrors.description ? styles.textareaError : null]}
        value={description}
        onChangeText={(text) => {
          setDescription(text);
          clearError("description");
        }}
        placeholder="For the last week the tap in the second-floor bathroom of Block B has been leaking…"
        placeholderTextColor={COLORS.textMuted}
        multiline
        textAlignVertical="top"
        autoCapitalize="sentences"
      />
      <View style={styles.counterRow}>
        <View style={styles.counterTrack}>
          <View
            style={[
              styles.counterFill,
              { width: `${Math.min(100, (words / minWords) * 100)}%` },
              enoughWords && styles.counterFillDone,
            ]}
          />
        </View>
        <Text style={[styles.counterText, enoughWords && styles.counterTextDone]}>
          {words} / {minWords} words
        </Text>
      </View>
      <ValidationMessage message={fieldErrors.description || textProblem} field />
    </>
  );

  const photoField = (
    <>
      {/* On desktop the step card's title already says this. */}
      {wide ? null : <Text style={styles.label}>Photo of the problem</Text>}
      {photo ? (
        <View>
          <PhotoView key={photoKey} uri={photo.uri} style={styles.photoPreview} />
          <View style={styles.photoActions}>
            <Pressable onPress={pickFromGallery} style={styles.linkBtn}>
              <Ionicons name="swap-horizontal" size={14} color={COLORS.primary} />
              <Text style={styles.linkText}>Change photo</Text>
            </Pressable>
            <Pressable onPress={() => setPhoto(null)} style={styles.linkBtn}>
              <Ionicons name="trash-outline" size={14} color={COLORS.accent} />
              <Text style={[styles.linkText, { color: COLORS.accent }]}>Remove</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={styles.photoRow}>
          <Pressable
            onPress={pickFromGallery}
            style={({ pressed }) => [
              styles.photoBox,
              fieldErrors.photo ? styles.photoBoxError : null,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="image-outline" size={24} color={COLORS.primary} />
            <Text style={styles.photoHint}>
              {Platform.OS === "web" ? "Choose a photo" : "Gallery"}
            </Text>
          </Pressable>
          {/* A browser's file dialog already offers the camera on phones. */}
          {Platform.OS !== "web" ? (
            <Pressable
              onPress={takePhoto}
              style={({ pressed }) => [
                styles.photoBox,
                fieldErrors.photo ? styles.photoBoxError : null,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons name="camera-outline" size={24} color={COLORS.primary} />
              <Text style={styles.photoHint}>Camera</Text>
            </Pressable>
          ) : null}
        </View>
      )}
      <ValidationMessage message={fieldErrors.photo} field />
    </>
  );

  const submitBlock = (
    <>
      <ValidationMessage message={formError} />

      <AppButton
        label={submitting ? "Sending…" : "Register complaint"}
        onPress={submit}
        disabled={submitting}
        loading={submitting}
      />
    </>
  );

  if (wide) {
    const summary: { label: string; value: string; done: boolean }[] = [
      {
        label: "Where",
        value: selectedHostel
          ? [selectedHostel.label, block && `Block ${block}`, room.trim() && `Room ${room.trim()}`]
              .filter(Boolean)
              .join(" · ")
          : "Choose a hostel",
        done: Boolean(selectedHostel) && (!selectedHostel?.blocks.length || Boolean(block)),
      },
      {
        label: "Problem",
        value: options.categories.find((c) => c.id === category)?.label ?? "Choose a category",
        done: Boolean(category),
      },
      {
        label: "Description",
        value: `${words} / ${minWords} words`,
        done: enoughWords && !textProblem,
      },
      { label: "Photo", value: photo ? "Attached" : "Not attached yet", done: Boolean(photo) },
    ];

    return (
      <DesktopPage
        active="hostel"
        eyebrow="Hostel · New complaint"
        title="Register a complaint"
        subtitle="Goes to the hostel office. Other students can't see it."
        sideWidth={360}
        main={
          <>
            <StepCard step={1} title="Where is the problem?" icon="business-outline" done={summary[0].done}>
              {whereFields}
            </StepCard>
            <StepCard step={2} title="What is wrong?" icon="construct-outline" done={summary[1].done && summary[2].done}>
              {problemFields}
            </StepCard>
          </>
        }
        side={
          <>
            <StepCard step={3} title="Photo of the problem" icon="camera-outline" done={summary[3].done}>
              {photoField}
            </StepCard>
            <DesktopCard>
              <Text style={styles.summaryTitle}>Your complaint</Text>
              {summary.map((row) => (
                <View key={row.label} style={styles.summaryRow}>
                  <Ionicons
                    name={row.done ? "checkmark-circle" : "ellipse-outline"}
                    size={15}
                    color={row.done ? COLORS.success : COLORS.border}
                  />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.summaryLabel}>{row.label}</Text>
                    <Text style={styles.summaryValue} numberOfLines={2}>
                      {row.value}
                    </Text>
                  </View>
                </View>
              ))}
            </DesktopCard>
            {submitBlock}
          </>
        }
      />
    );
  }

  return (
    <ConnectionGate>
      <View style={styles.root}>
        <ConnectionBanner />
        <KeyboardAwareScrollView bottomOffset={24} keyboardShouldPersistTaps="handled">
          <ScreenShell
            title="Register a complaint"
            subtitle="Goes to the hostel office. Other students can't see it."
          >
            {whereFields}
            {problemFields}
            {photoField}
            {submitBlock}
          </ScreenShell>
        </KeyboardAwareScrollView>
      </View>
    </ConnectionGate>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  label: {
    fontSize: 13,
    fontFamily: FONTS.sansSemi,
    color: COLORS.text,
    marginBottom: 8,
    marginTop: 10,
  },
  groupLabel: {
    fontFamily: FONTS.sansBold,
    fontSize: 10.5,
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: 4,
    marginBottom: 6,
  },
  summaryTitle: { fontFamily: FONTS.displayMedium, fontSize: 15, color: COLORS.text, marginBottom: 8 },
  summaryRow: { flexDirection: "row", gap: 9, alignItems: "flex-start", paddingVertical: 5 },
  summaryLabel: {
    fontFamily: FONTS.sansBold,
    fontSize: 10.5,
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  summaryValue: { marginTop: 1, fontFamily: FONTS.sansSemi, fontSize: 13, color: COLORS.text },
  muted: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    lineHeight: 17,
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 4 },
  textarea: {
    minHeight: 240,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: 14,
    fontFamily: FONTS.sans,
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.text,
  },
  textareaError: { borderColor: COLORS.danger },
  counterRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 8 },
  counterTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.surfaceMuted,
    overflow: "hidden",
  },
  counterFill: { height: 6, borderRadius: 3, backgroundColor: COLORS.warning },
  counterFillDone: { backgroundColor: COLORS.success },
  counterText: { fontFamily: FONTS.sansSemi, fontSize: 12, color: COLORS.textMuted },
  counterTextDone: { color: "#15803D" },
  photoRow: { flexDirection: "row", gap: 10 },
  photoBox: {
    flex: 1,
    height: 110,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  photoBoxError: { borderColor: COLORS.danger },
  photoHint: { fontFamily: FONTS.sansSemi, fontSize: 12.5, color: COLORS.primary },
  photoPreview: { height: 220, borderRadius: RADIUS.lg },
  photoActions: { flexDirection: "row", gap: 18, marginTop: 8 },
  linkBtn: { flexDirection: "row", alignItems: "center", gap: 5 },
  linkText: { fontFamily: FONTS.sansSemi, fontSize: 12.5, color: COLORS.primary },
  pressed: { opacity: 0.85 },
});
