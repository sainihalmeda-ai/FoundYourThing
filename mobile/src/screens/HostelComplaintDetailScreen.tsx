import React, { useCallback, useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { resolveImageUrl } from "../api/client";
import { fetchHostelComplaint, fetchHostelOptions, updateHostelComplaint } from "../api/hostel";
import { ConnectionBanner } from "../components/ConnectionBanner";
import { ConnectionGate } from "../components/ConnectionGate";
import { LoadingOverlay } from "../components/LoadingOverlay";
import { PhotoView } from "../components/PhotoView";
import { AppButton, Chip, Field } from "../components/Ui";
import { ErrorState, ValidationMessage } from "../components/states";
import { useAuth } from "../context/AuthContext";
import { COLORS, CONTENT_MAX_WIDTH, FONTS, RADIUS, SHADOW } from "../constants/config";
import { HOSTEL_STATUS_STEPS, complaintPlace } from "../constants/hostel";
import { RootStackParamList } from "../navigation/types";
import { ApiError, HostelComplaint, HostelComplaintStatus } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "HostelComplaintDetail">;

/**
 * One complaint. The student who filed it sees progress and the hostel
 * office's reply; hostel staff also see who filed it and can update it.
 */
export function HostelComplaintDetailScreen({ route }: Props) {
  const { complaintId } = route.params;
  const { token } = useAuth();
  const [complaint, setComplaint] = useState<HostelComplaint | null>(null);
  const [isStaff, setIsStaff] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const [status, setStatus] = useState<HostelComplaintStatus>("received");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setError(null);
      const [data, options] = await Promise.all([
        fetchHostelComplaint(token, complaintId),
        fetchHostelOptions(token),
      ]);
      setComplaint(data);
      setIsStaff(options.is_hostel_staff);
      setStatus(data.status);
      setNote(data.staff_note);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [token, complaintId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const save = async () => {
    if (!token) return;
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    try {
      const updated = await updateHostelComplaint(token, complaintId, {
        status,
        staff_note: note.trim(),
      });
      setComplaint(updated);
      setSaved(true);
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : "Could not save. Try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingOverlay label="Loading complaint" />;
  if (error) return <ErrorState error={error} onRetry={load} />;
  if (!complaint) return <ErrorState error={new Error("Complaint not found.")} />;

  const stepIndex = HOSTEL_STATUS_STEPS.findIndex((s) => s.key === complaint.status);

  return (
    <ConnectionGate>
      <View style={styles.root}>
        <ConnectionBanner />
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.title}>{complaint.category_label}</Text>
          <View style={styles.metaRow}>
            <Ionicons name="business-outline" size={13} color={COLORS.textMuted} />
            <Text style={styles.metaText}>{complaintPlace(complaint)}</Text>
          </View>
          <Text style={styles.date}>
            Filed {new Date(complaint.created_at).toLocaleString()}
          </Text>

          <View style={styles.progressTrack}>
            {HOSTEL_STATUS_STEPS.map((step, i) => (
              <View
                key={step.key}
                style={[styles.progressSegment, i <= stepIndex && styles.progressSegmentDone]}
              />
            ))}
          </View>
          <View style={styles.progressLabels}>
            {HOSTEL_STATUS_STEPS.map((step, i) => (
              <Text
                key={step.key}
                style={[styles.progressLabel, i <= stepIndex && styles.progressLabelDone]}
              >
                {step.label}
              </Text>
            ))}
          </View>

          {isStaff && complaint.reporter_vtu_id ? (
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Filed by</Text>
              <Text style={styles.reporterName}>
                {complaint.reporter_name || complaint.reporter_vtu_id}
              </Text>
              <Text style={styles.reporterMeta}>
                {complaint.reporter_vtu_id}
                {complaint.reporter_department ? ` · ${complaint.reporter_department}` : ""}
              </Text>
              {complaint.reporter_phone ? (
                <Pressable
                  style={styles.callBtn}
                  onPress={() => Linking.openURL(`tel:${complaint.reporter_phone}`)}
                >
                  <Ionicons name="call" size={14} color={COLORS.primary} />
                  <Text style={styles.callBtnText}>Call {complaint.reporter_phone}</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          <View style={styles.card}>
            <Text style={styles.cardLabel}>Photo</Text>
            <PhotoView
              uri={resolveImageUrl(complaint.attachment_url)}
              style={styles.photo}
              fallbackHint="Photo unavailable"
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardLabel}>
              Complaint · {complaint.word_count} words
            </Text>
            <Text style={styles.cardBody}>{complaint.description}</Text>
          </View>

          {complaint.staff_note ? (
            <View style={[styles.card, styles.noteCard]}>
              <View style={styles.noteHeader}>
                <Ionicons name="chatbox-ellipses" size={14} color={COLORS.primary} />
                <Text style={styles.noteLabel}>Reply from the hostel office</Text>
              </View>
              <Text style={styles.cardBody}>{complaint.staff_note}</Text>
            </View>
          ) : !isStaff ? (
            <Text style={styles.waiting}>
              No reply yet. The hostel office has your complaint and will update it here.
            </Text>
          ) : null}

          {isStaff ? (
            <>
              <Text style={styles.label}>Status</Text>
              <View style={styles.chips}>
                {HOSTEL_STATUS_STEPS.map((opt) => (
                  <Chip
                    key={opt.key}
                    label={opt.label}
                    active={status === opt.key}
                    onPress={() => {
                      setStatus(opt.key);
                      setSaved(false);
                    }}
                  />
                ))}
              </View>
              <Field
                label="Reply to the student (optional)"
                value={note}
                onChangeText={(text) => {
                  setNote(text);
                  setSaved(false);
                }}
                placeholder="What was done, or when the repair is planned…"
                autoCapitalize="sentences"
                multiline
                numberOfLines={4}
              />
              <ValidationMessage message={saveError} />
              {saved ? <Text style={styles.savedText}>Saved.</Text> : null}
              <AppButton
                label={saving ? "Saving…" : "Save update"}
                onPress={save}
                disabled={saving}
                loading={saving}
              />
            </>
          ) : null}
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
  title: { fontFamily: FONTS.display, fontSize: 24, color: COLORS.text, letterSpacing: -0.4 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 6 },
  metaText: { fontFamily: FONTS.sansMedium, fontSize: 12.5, color: COLORS.textMuted },
  date: { marginTop: 4, fontFamily: FONTS.sans, fontSize: 12, color: COLORS.textMuted },
  progressTrack: { flexDirection: "row", gap: 4, marginTop: 18 },
  progressSegment: { flex: 1, height: 6, borderRadius: 3, backgroundColor: COLORS.surfaceMuted },
  progressSegmentDone: { backgroundColor: COLORS.primary },
  progressLabels: { flexDirection: "row", marginTop: 6 },
  progressLabel: { flex: 1, fontFamily: FONTS.sansMedium, fontSize: 11, color: COLORS.textMuted },
  progressLabelDone: { color: COLORS.text, fontFamily: FONTS.sansSemi },
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
  cardBody: { fontFamily: FONTS.sansMedium, fontSize: 14, color: COLORS.text, lineHeight: 21 },
  photo: { height: 240, borderRadius: RADIUS.lg },
  reporterName: { fontFamily: FONTS.displayMedium, fontSize: 17, color: COLORS.text },
  reporterMeta: { marginTop: 4, fontFamily: FONTS.sansMedium, fontSize: 12, color: COLORS.textMuted },
  callBtn: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: RADIUS.pill,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  callBtnText: { fontFamily: FONTS.sansBold, fontSize: 12.5, color: COLORS.primary },
  noteCard: { borderColor: COLORS.primary },
  noteHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  noteLabel: { fontFamily: FONTS.sansBold, fontSize: 12, color: COLORS.primary },
  waiting: {
    marginTop: 16,
    fontFamily: FONTS.sans,
    fontSize: 12.5,
    lineHeight: 18,
    color: COLORS.textMuted,
  },
  label: {
    fontSize: 13,
    fontFamily: FONTS.sansSemi,
    color: COLORS.text,
    marginBottom: 8,
    marginTop: 20,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  savedText: { fontFamily: FONTS.sansSemi, fontSize: 12, color: COLORS.success, marginBottom: 8 },
});
