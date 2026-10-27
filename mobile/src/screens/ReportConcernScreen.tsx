import React, { useState } from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { createConcern } from "../api/auth";
import { KeyboardAwareScrollView } from "../components/Keyboard";
import { ConnectionBanner } from "../components/ConnectionBanner";
import { ConnectionGate } from "../components/ConnectionGate";
import { DesktopCard, DesktopPage } from "../components/DesktopPage";
import { SidebarShell } from "../components/SidebarShell";
import { AppButton, Chip, Field, ScreenShell } from "../components/Ui";
import { SuccessState, ValidationMessage } from "../components/states";
import { useAuth } from "../context/AuthContext";
import { useConnection } from "../context/ConnectionContext";
import { hasErrors, validateConcern } from "../lib/validation";
import { RootStackParamList } from "../navigation/types";
import { COLORS, FONTS, RADIUS, WIDE_BREAKPOINT } from "../constants/config";
import { ApiError } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "ReportConcern">;

const CATEGORIES: { id: string; label: string }[] = [
  { id: "ragging", label: "Ragging" },
  { id: "harassment", label: "Harassment" },
  { id: "bullying", label: "Bullying" },
  { id: "other", label: "Other safety concern" },
];

const NEXT_STEPS = [
  "Your report reaches the enquiry team privately — nobody else sees it.",
  "They may contact you to hear the full picture before acting.",
  "Track its status and their reply under Your reports.",
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
  const { width } = useWindowDimensions();
  const wide = width >= WIDE_BREAKPOINT;

  if (submitted) {
    const success = (
      <SuccessState
        title="Received"
        message="The enquiry team has been notified privately. Nobody else can see this. They may reach out to hear the full picture — you can check status any time under Your reports."
        actionLabel="Back to Your reports"
        onAction={() => navigation.replace("Safety")}
      />
    );
    return wide ? <SidebarShell active="safety">{success}</SidebarShell> : success;
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

  const privacyNote = (
    <View style={[styles.privacyNote, wide && styles.privacyNoteDesk]}>
      <Ionicons name="lock-closed" size={15} color={COLORS.accent} />
      <Text style={styles.privacyNoteText}>
        Take your time and describe what happened in your own words — who was involved,
        where, and when. The enquiry team will follow up with you directly before anything
        else happens.
      </Text>
    </View>
  );

  const formFields = (
    <>
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
        numberOfLines={wide ? 10 : 6}
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
    </>
  );

  if (wide) {
    return (
      <DesktopPage
        active="safety"
        eyebrow="Campus safety · Private report"
        title="Report a concern"
        subtitle="Private — this goes only to the college's enquiry team, never to other students."
        main={<DesktopCard style={styles.formCard}>{formFields}</DesktopCard>}
        side={
          <>
            {privacyNote}
            <DesktopCard style={styles.dangerCard}>
              <View style={styles.sideHeader}>
                <Ionicons name="warning-outline" size={16} color={COLORS.accent} />
                <Text style={styles.sideTitle}>In immediate danger?</Text>
              </View>
              <Text style={styles.sideBody}>
                Contact campus security or the police first. This form supplements, not
                replaces, your college's official Anti-Ragging Committee.
              </Text>
              <View style={styles.helpline}>
                <Ionicons name="call" size={14} color="#fff" />
                <Text style={styles.helplineText}>Anti-Ragging Helpline 1800-180-5522</Text>
              </View>
            </DesktopCard>
            <DesktopCard>
              <Text style={styles.sideTitle}>What happens next</Text>
              {NEXT_STEPS.map((step, i) => (
                <View key={step} style={styles.stepRow}>
                  <View style={styles.stepDot}>
                    <Text style={styles.stepNum}>{i + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
            </DesktopCard>
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
            title="Report a concern"
            subtitle="Private — this goes only to the college's enquiry team, never to other students."
          >
            {privacyNote}
            {formFields}
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
  formCard: { padding: 20 },
  privacyNoteDesk: { marginBottom: 0 },
  dangerCard: { borderColor: "rgba(169,31,35,0.25)" },
  sideHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  sideTitle: { fontFamily: FONTS.displayMedium, fontSize: 15, color: COLORS.text, marginBottom: 6 },
  sideBody: { fontFamily: FONTS.sans, fontSize: 12.5, lineHeight: 18, color: COLORS.textMuted },
  helpline: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.pill,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  helplineText: { fontFamily: FONTS.sansBold, fontSize: 12.5, color: "#fff" },
  stepRow: { flexDirection: "row", gap: 10, alignItems: "flex-start", marginTop: 8 },
  stepDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNum: { fontFamily: FONTS.sansBold, fontSize: 11, color: COLORS.primary },
  stepText: { flex: 1, fontFamily: FONTS.sans, fontSize: 12.5, lineHeight: 18, color: COLORS.text },
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
