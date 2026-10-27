import React, { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { fetchMyConcerns } from "../api/auth";
import { ConnectionBanner } from "../components/ConnectionBanner";
import { ConnectionGate } from "../components/ConnectionGate";
import { DesktopCard, DesktopPage } from "../components/DesktopPage";
import { SidebarShell } from "../components/SidebarShell";
import { ErrorState } from "../components/states";
import { LoadingOverlay } from "../components/LoadingOverlay";
import { useAuth } from "../context/AuthContext";
import {
  COLORS,
  CONTENT_MAX_WIDTH,
  FONTS,
  RADIUS,
  SHADOW,
  WIDE_BREAKPOINT,
} from "../constants/config";
import { RootStackParamList } from "../navigation/types";
import type { Concern, ConcernStatus } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "ConcernDetail">;

const STEPS: { key: ConcernStatus; label: string }[] = [
  { key: "received", label: "Received" },
  { key: "under_review", label: "Under review" },
  { key: "resolved", label: "Resolved" },
];

export function ConcernDetailScreen({ route }: Props) {
  const { concernId } = route.params;
  const { token } = useAuth();
  const [concern, setConcern] = useState<Concern | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const { width } = useWindowDimensions();
  const wide = width >= WIDE_BREAKPOINT;

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setError(null);
      // The reporter only ever sees their own reports — filter client-side
      // from /mine rather than trust an id in the URL against the team view.
      const mine = await fetchMyConcerns(token);
      const found = mine.find((c) => c.id === concernId) ?? null;
      setConcern(found);
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

  if (loading && !wide) return <LoadingOverlay label="Loading report" />;
  if (error) return <ErrorState error={error} onRetry={load} />;
  if (!concern) {
    // Desktop first load: keep the sidebar and show its in-pane spinner.
    if (loading) return <SidebarShell active="safety" loading>{null}</SidebarShell>;
    return <ErrorState error={new Error("Report not found.")} />;
  }

  const stepIndex = STEPS.findIndex((s) => s.key === concern.status);

  const toldCard = (
    <View style={[styles.card, wide && styles.cardDesk]}>
      <Text style={styles.cardLabel}>What you told us</Text>
      <Text style={styles.cardBody}>{concern.description}</Text>
      {concern.location ? (
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={13} color={COLORS.textMuted} />
          <Text style={styles.metaText}>{concern.location}</Text>
        </View>
      ) : null}
    </View>
  );

  const teamReply = concern.team_note ? (
    <View style={[styles.card, styles.noteCard, wide && styles.cardDesk]}>
      <View style={styles.noteHeader}>
        <Ionicons name="shield-checkmark" size={14} color={COLORS.accent} />
        <Text style={styles.noteLabel}>Update from the enquiry team</Text>
      </View>
      <Text style={styles.cardBody}>{concern.team_note}</Text>
    </View>
  ) : (
    <Text style={[styles.waiting, wide && styles.waitingDesk]}>
      No update yet — the enquiry team has been notified and will follow up with you directly.
    </Text>
  );

  if (wide) {
    return (
      <DesktopPage
        active="safety"
        eyebrow="Campus safety · Your report"
        title={concern.category_label}
        subtitle={`Filed ${new Date(concern.created_at).toLocaleString()} · visible only to you and the enquiry team`}
        main={
          <>
            {toldCard}
            {teamReply}
          </>
        }
        side={
          <>
            <DesktopCard>
              <Text style={styles.cardLabel}>Status</Text>
              {STEPS.map((step, i) => {
                const done = i <= stepIndex;
                return (
                  <View key={step.key} style={styles.timelineRow}>
                    <View style={styles.timelineRail}>
                      <View style={[styles.timelineDot, done && styles.timelineDotDone]}>
                        {done ? <Ionicons name="checkmark" size={11} color="#fff" /> : null}
                      </View>
                      {i < STEPS.length - 1 ? (
                        <View style={[styles.timelineLine, i < stepIndex && styles.timelineLineDone]} />
                      ) : null}
                    </View>
                    <Text style={[styles.timelineLabel, done && styles.timelineLabelDone]}>
                      {step.label}
                      {i === stepIndex ? "  ·  current" : ""}
                    </Text>
                  </View>
                );
              })}
            </DesktopCard>
            <DesktopCard>
              <View style={styles.noteHeader}>
                <Ionicons name="call-outline" size={14} color={COLORS.accent} />
                <Text style={styles.noteLabel}>Need help right now?</Text>
              </View>
              <Text style={styles.metaText}>
                Contact campus security or the police first. National Anti-Ragging Helpline:
                1800-180-5522.
              </Text>
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
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.title}>{concern.category_label}</Text>
          <Text style={styles.date}>
            Filed {new Date(concern.created_at).toLocaleDateString()}
          </Text>

          <View style={styles.progressTrack}>
            {STEPS.map((step, i) => (
              <View
                key={step.key}
                style={[
                  styles.progressSegment,
                  i > 0 && styles.progressSegmentGap,
                  i <= stepIndex && styles.progressSegmentDone,
                ]}
              />
            ))}
          </View>
          <View style={styles.progressLabels}>
            {STEPS.map((step, i) => (
              <Text
                key={step.key}
                style={[styles.progressLabel, i <= stepIndex && styles.progressLabelDone]}
              >
                {step.label}
              </Text>
            ))}
          </View>

          {toldCard}
          {teamReply}
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
  date: {
    marginTop: 4,
    fontFamily: FONTS.sans,
    fontSize: 12,
    color: COLORS.textMuted,
  },
  progressTrack: {
    flexDirection: "row",
    marginTop: 24,
    marginBottom: 8,
  },
  progressSegment: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  progressSegmentGap: { marginLeft: 6 },
  progressSegmentDone: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  progressLabels: {
    flexDirection: "row",
    marginBottom: 20,
  },
  progressLabel: {
    flex: 1,
    fontFamily: FONTS.sansMedium,
    fontSize: 10.5,
    color: COLORS.textMuted,
  },
  progressLabelDone: { color: COLORS.text, fontFamily: FONTS.sansSemi },
  card: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.xl,
    padding: 16,
    marginBottom: 14,
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
  cardBody: {
    fontFamily: FONTS.sansMedium,
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 21,
  },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 10 },
  metaText: { fontFamily: FONTS.sans, fontSize: 12, color: COLORS.textMuted },
  noteCard: { borderColor: "rgba(169,31,35,0.25)", backgroundColor: "rgba(169,31,35,0.04)" },
  noteHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  noteLabel: { fontFamily: FONTS.sansBold, fontSize: 12, color: COLORS.accent },
  cardDesk: { marginBottom: 0 },
  waitingDesk: { textAlign: "left", marginTop: 0, paddingHorizontal: 4 },
  timelineRow: { flexDirection: "row", gap: 10, minHeight: 34 },
  timelineRail: { alignItems: "center", width: 20 },
  timelineDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    alignItems: "center",
    justifyContent: "center",
  },
  timelineDotDone: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  timelineLine: { flex: 1, width: 2, backgroundColor: COLORS.border, marginVertical: 2 },
  timelineLineDone: { backgroundColor: COLORS.primary },
  timelineLabel: { fontFamily: FONTS.sansMedium, fontSize: 13, color: COLORS.textMuted, paddingTop: 1 },
  timelineLabelDone: { color: COLORS.text, fontFamily: FONTS.sansSemi },
  waiting: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 8,
  },
});
