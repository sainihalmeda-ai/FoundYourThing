import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { createConcern } from "../api/auth";
import { KeyboardAwareScrollView } from "../components/Keyboard";
import { ConnectionBanner } from "../components/ConnectionBanner";
import { ConnectionGate } from "../components/ConnectionGate";
import { AppButton, Chip, Field, ScreenShell } from "../components/Ui";
import { SuccessState, ValidationMessage } from "../components/states";
import { useAuth } from "../context/AuthContext";
import { useConnection } from "../context/ConnectionContext";
import { hasErrors, validateConcern } from "../lib/validation";
import { RootStackParamList } from "../navigation/types";
import { COLORS, FONTS, RADIUS } from "../constants/config";
import { ApiError } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "ReportConcern">;

const CATEGORIES: { id: string; label: string }[] = [
  { id: "ragging", label: "Ragging" },
  { id: "harassment", label: "Harassment" },
  { id: "bullying", label: "Bullying" },
  { id: "other", label: "Other safety concern" },
];

export function ReportConcernScreen({ navigation }: Props) {
  const { token } = useAuth();
  const { canUseApi } = useConnection();
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <SuccessState
        title="Received"
        message="The enquiry team has been notified privately. Nobody else can see this. They may reach out to hear the full picture — you can check status any time under Your reports."
        actionLabel="Back to Your reports"
        onAction={() => navigation.replace("Safety")}
      />
    );
  }

  const submit = async () => {
    if (!token) return;
    setFormError(null);
    const errors = validateConcern({ category, description });
    setFieldErrors(errors);
    if (hasErrors(errors)) return;

    if (!canUseApi) {
      setFormError("You need an active server connection to send this.");
      return;
    }

    setSubmitting(true);
    try {
      await createConcern(token, {
        category,
        description: description.trim(),
        location: location.trim(),
      });
      setSubmitted(true);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Could not send this. Try again.";
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ConnectionGate>
      <View style={styles.root}>
        <ConnectionBanner />
        <KeyboardAwareScrollView bottomOffset={24} keyboardShouldPersistTaps="handled">
          <ScreenShell
            title="Report a concern"
            subtitle="Private — this goes only to the college's enquiry team, never to other students."
          >
            <View style={styles.privacyNote}>
              <Ionicons name="lock-closed" size={15} color={COLORS.accent} />
              <Text style={styles.privacyNoteText}>
                Take your time and describe what happened in your own words — who was involved,
                where, and when. The enquiry team will follow up with you directly before anything
                else happens.
              </Text>
            </View>

            <Text style={styles.label}>What is this about?</Text>
            <View style={styles.chips}>
              {CATEGORIES.map((item) => (
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
              label="What happened"
              value={description}
              onChangeText={(text) => {
                setDescription(text);
                setFieldErrors((prev) => ({ ...prev, description: "" }));
              }}
              placeholder="Describe what happened, who was involved, where, and when…"
              autoCapitalize="sentences"
              error={fieldErrors.description}
              multiline
              numberOfLines={6}
            />

            <Field
              label="Location (optional)"
              value={location}
              onChangeText={setLocation}
              placeholder="Hostel Block C, Canteen, etc."
              autoCapitalize="sentences"
            />

            <ValidationMessage message={formError} />

            <AppButton
              label={submitting ? "Sending…" : "Send privately to the enquiry team"}
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
  privacyNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 16,
    padding: 12,
    borderRadius: RADIUS["2xl"],
    backgroundColor: "rgba(169,31,35,0.06)",
    borderWidth: 1,
    borderColor: "rgba(169,31,35,0.18)",
  },
  privacyNoteText: {
    flex: 1,
    fontFamily: FONTS.sansMedium,
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.text,
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
