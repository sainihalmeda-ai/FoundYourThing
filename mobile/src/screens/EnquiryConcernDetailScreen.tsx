import React, { useCallback, useEffect, useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { fetchConcern, updateConcern } from "../api/auth";
import { ConnectionBanner } from "../components/ConnectionBanner";
import { ConnectionGate } from "../components/ConnectionGate";
import { AppButton, Chip, Field } from "../components/Ui";
import { ErrorState, ValidationMessage } from "../components/states";
import { LoadingOverlay } from "../components/LoadingOverlay";
import { useAuth } from "../context/AuthContext";
import { COLORS, CONTENT_MAX_WIDTH, FONTS, RADIUS, SHADOW } from "../constants/config";
import { RootStackParamList } from "../navigation/types";
import { ApiError, type ConcernStatus, type ConcernTeamView } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "EnquiryConcernDetail">;

const STATUS_OPTIONS: { id: ConcernStatus; label: string }[] = [
  { id: "received", label: "Received" },
  { id: "under_review", label: "Under review" },
  { id: "resolved", label: "Resolved" },
];

export function EnquiryConcernDetailScreen({ route }: Props) {
  const { concernId } = route.params;
  const { token } = useAuth();
  const [concern, setConcern] = useState<ConcernTeamView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [status, setStatus] = useState<ConcernStatus>("received");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setError(null);
      const data = await fetchConcern(token, concernId);
      setConcern(data);
      setStatus(data.status);
      setNote(data.team_note);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [token, concernId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load]),
  );

  useEffect(() => {
    setSaved(false);
  }, [status, note]);

  const save = async () => {
    if (!token) return;
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await updateConcern(token, concernId, { status, team_note: note.trim() });
      setConcern(updated);
      setSaved(true);
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : "Could not save. Try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingOverlay label="Loading report" />;
  if (error) return <ErrorState error={error} onRetry={load} />;
  if (!concern) return <ErrorState error={new Error("Report not found.")} />;

  return (
    <ConnectionGate>
      <View style={styles.root}>
        <ConnectionBanner />
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.title}>{concern.category_label}</Text>
          <Text style={styles.date}>
            Filed {new Date(concern.created_at).toLocaleString()}
          </Text>

          <View style={styles.card}>
            <Text style={styles.cardLabel}>Reported by</Text>
            <Text style={styles.reporterName}>
              {concern.reporter_name || concern.reporter_vtu_id}
            </Text>
            <Text style={styles.reporterMeta}>
              {concern.reporter_vtu_id}
              {concern.reporter_department ? ` · ${concern.reporter_department}` : ""}
            </Text>
            {concern.reporter_phone ? (
              <Pressable
                style={styles.callBtn}
                onPress={() => Linking.openURL(`tel:${concern.reporter_phone}`)}
              >
                <Ionicons name="call" size={14} color={COLORS.accent} />
                <Text style={styles.callBtnText}>Call {concern.reporter_phone}</Text>
              </Pressable>
            ) : null}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardLabel}>What they reported</Text>
            <Text style={styles.cardBody}>{concern.description}</Text>
            {concern.location ? (
              <View style={styles.metaRow}>
                <Ionicons name="location-outline" size={13} color={COLORS.textMuted} />
                <Text style={styles.metaText}>{concern.location}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.warnCard}>
            <Ionicons name="alert-circle" size={16} color={COLORS.accent} />
            <Text style={styles.warnText}>
              This app never notifies anyone else automatically. Suspension notices, public
              announcements, or any disciplinary action must go through the official Anti-Ragging
              Committee / Dean of Student Affairs — outside this app.
            </Text>
          </View>

          <Text style={styles.label}>Status</Text>
          <View style={styles.chips}>
            {STATUS_OPTIONS.map((opt) => (
              <Chip
                key={opt.id}
                label={opt.label}
                active={status === opt.id}
                onPress={() => setStatus(opt.id)}
              />
            ))}
          </View>

          <Field
            label="Update for the reporter (optional)"
            value={note}
            onChangeText={setNote}
            placeholder="A short, human update — what you found and what happens next…"
            autoCapitalize="sentences"
            multiline
            numberOfLines={5}
          />

          <ValidationMessage message={saveError} />
          {saved ? <Text style={styles.savedText}>Saved.</Text> : null}

          <AppButton
            label={saving ? "Saving…" : "Save"}
            onPress={save}
            disabled={saving}
            loading={saving}
          />
        </ScrollView>
      </View>
    </ConnectionGate>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  scroll: {
    padding: 20,
    paddingBottom: 48,
    width: "100%",
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: "center",
  },
  title: {
    fontFamily: FONTS.display,
    fontSize: 24,
    color: COLORS.text,
    letterSpacing: -0.4,
  },
  date: { marginTop: 4, fontFamily: FONTS.sans, fontSize: 12, color: COLORS.textMuted },
  card: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.xl,
    padding: 16,
    marginTop: 16,
    ...SHADOW.soft,
  },
  cardLabel: {
    fontFamily: FONTS.sansBold,
    fontSize: 11,
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  reporterName: { fontFamily: FONTS.displayMedium, fontSize: 17, color: COLORS.text },
  reporterMeta: { marginTop: 4, fontFamily: FONTS.sansMedium, fontSize: 12, color: COLORS.textMuted },
  callBtn: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: "rgba(169,31,35,0.08)",
    borderRadius: RADIUS.pill,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  callBtnText: { fontFamily: FONTS.sansBold, fontSize: 12.5, color: COLORS.accent },
  cardBody: { fontFamily: FONTS.sansMedium, fontSize: 14, color: COLORS.text, lineHeight: 21 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 10 },
  metaText: { fontFamily: FONTS.sans, fontSize: 12, color: COLORS.textMuted },
  warnCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 16,
    padding: 12,
    borderRadius: RADIUS["2xl"],
    backgroundColor: "rgba(169,31,35,0.06)",
    borderWidth: 1,
    borderColor: "rgba(169,31,35,0.18)",
  },
  warnText: { flex: 1, fontFamily: FONTS.sansMedium, fontSize: 11.5, lineHeight: 17, color: COLORS.text },
  label: {
    fontSize: 13,
    fontFamily: FONTS.sansSemi,
    color: COLORS.text,
    marginBottom: 8,
    marginTop: 20,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  savedText: {
    fontFamily: FONTS.sansSemi,
    fontSize: 12,
    color: COLORS.success,
    marginBottom: 8,
  },
});
