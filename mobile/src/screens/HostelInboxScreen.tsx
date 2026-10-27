import React, { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { fetchAllHostelComplaints, fetchHostelOptions } from "../api/hostel";
import { ConnectionBanner } from "../components/ConnectionBanner";
import { ConnectionGate } from "../components/ConnectionGate";
import { DesktopPage } from "../components/DesktopPage";
import { LoadingOverlay } from "../components/LoadingOverlay";
import { Badge, Chip } from "../components/Ui";
import { EmptyState, ErrorState } from "../components/states";
import { useAuth } from "../context/AuthContext";
import { COLORS, CONTENT_MAX_WIDTH, FONTS, RADIUS, WIDE_BREAKPOINT } from "../constants/config";
import {
  HOSTEL_STATUS_LABEL,
  HOSTEL_STATUS_STEPS,
  HOSTEL_STATUS_TONE,
  complaintPlace,
} from "../constants/hostel";
import { RootStackParamList } from "../navigation/types";
import type { HostelComplaint, HostelComplaintOptions, HostelComplaintStatus } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "HostelInbox">;

/** Hostel staff only — every complaint, filterable by hostel. */
export function HostelInboxScreen({ navigation }: Props) {
  const { token } = useAuth();
  const [options, setOptions] = useState<HostelComplaintOptions | null>(null);
  const [complaints, setComplaints] = useState<HostelComplaint[]>([]);
  const [hostel, setHostel] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [statusFilter, setStatusFilter] = useState<HostelComplaintStatus | null>(null);
  const { width } = useWindowDimensions();
  const wide = width >= WIDE_BREAKPOINT;

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setError(null);
      const [opts, rows] = await Promise.all([
        fetchHostelOptions(token),
        fetchAllHostelComplaints(token, hostel || undefined),
      ]);
      setOptions(opts);
      setComplaints(rows);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [token, hostel]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (loading && !wide) return <LoadingOverlay label="Loading complaints" />;
  if (error) return <ErrorState error={error} onRetry={load} />;

  const open = complaints.filter((c) => c.status !== "resolved").length;

  const row = (c: HostelComplaint, style?: object) => (
    <Pressable
      key={c.id}
      style={({ pressed }) => [styles.row, style, pressed && styles.pressed]}
      onPress={() => navigation.navigate("HostelComplaintDetail", { complaintId: c.id })}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.rowTitle}>{c.category_label}</Text>
        <Text style={styles.rowMeta} numberOfLines={1}>
          {complaintPlace(c)}
        </Text>
        <Text style={styles.rowMeta} numberOfLines={1}>
          {c.reporter_name || c.reporter_vtu_id} · {new Date(c.created_at).toLocaleDateString()}
        </Text>
        {wide ? (
          <Text style={styles.rowPreview} numberOfLines={2}>
            {c.description}
          </Text>
        ) : null}
      </View>
      <Badge label={HOSTEL_STATUS_LABEL[c.status]} tone={HOSTEL_STATUS_TONE[c.status]} />
    </Pressable>
  );

  const hostelChips = (
    <View style={styles.chips}>
      <Chip label="All hostels" active={!hostel} onPress={() => setHostel("")} />
      {options?.hostels.map((h) => (
        <Chip key={h.id} label={h.label} active={hostel === h.id} onPress={() => setHostel(h.id)} />
      ))}
    </View>
  );

  if (wide) {
    const shown = statusFilter ? complaints.filter((c) => c.status === statusFilter) : complaints;
    return (
      <DesktopPage
        active="hostel"
        loading={loading && !options}
        eyebrow="Hostel · Hostel office"
        title="Hostel office inbox"
        subtitle="Every complaint from every hostel. Only hostel staff can see this page."
      >
        <View style={styles.statRow}>
          {HOSTEL_STATUS_STEPS.map(({ key, label }) => {
            const active = statusFilter === key;
            return (
              <Pressable
                key={key}
                onPress={() => setStatusFilter(active ? null : key)}
                style={({ pressed }) => [styles.stat, active && styles.statActive, pressed && styles.pressed]}
              >
                <Text style={styles.statValue}>{complaints.filter((c) => c.status === key).length}</Text>
                <Text style={styles.statLabel}>{label}</Text>
              </Pressable>
            );
          })}
          <View style={[styles.stat, styles.statTotal]}>
            <Text style={[styles.statValue, styles.statValueInk]}>{open}</Text>
            <Text style={[styles.statLabel, styles.statLabelInk]}>Still open</Text>
          </View>
        </View>
        {hostelChips}
        {shown.length === 0 ? (
          <EmptyState title="No complaints" message="Nothing matches these filters." compact />
        ) : (
          <View style={styles.grid}>{shown.map((c) => row(c, styles.gridCell))}</View>
        )}
      </DesktopPage>
    );
  }

  return (
    <ConnectionGate>
      <View style={styles.root}>
        <ConnectionBanner />
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.summary}>
            {complaints.length} complaint{complaints.length === 1 ? "" : "s"} · {open} open
          </Text>
          {hostelChips}

          {complaints.length === 0 ? (
            <EmptyState title="No complaints" message="Nothing has been filed here yet." compact />
          ) : (
            complaints.map((c) => row(c))
          )}
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
  summary: { fontFamily: FONTS.sansSemi, fontSize: 13, color: COLORS.textMuted, marginBottom: 12 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: 14,
    marginBottom: 10,
  },
  rowTitle: { fontFamily: FONTS.sansSemi, fontSize: 14, color: COLORS.text },
  rowMeta: { marginTop: 3, fontFamily: FONTS.sans, fontSize: 11.5, color: COLORS.textMuted },
  pressed: { opacity: 0.92 },
  rowPreview: { marginTop: 6, fontFamily: FONTS.sans, fontSize: 12, lineHeight: 17, color: COLORS.textMuted },
  statRow: { flexDirection: "row", gap: 14, marginBottom: 16 },
  stat: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.xl,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  statActive: { borderColor: COLORS.primary, borderWidth: 1.5 },
  statTotal: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  statValue: { fontFamily: FONTS.display, fontSize: 22, color: COLORS.text },
  statValueInk: { color: "#fff" },
  statLabel: { fontFamily: FONTS.sansMedium, fontSize: 12, color: COLORS.textMuted },
  statLabelInk: { color: "rgba(255,255,255,.75)" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 14 },
  gridCell: { width: "48.5%", flexGrow: 1, marginBottom: 0 },
});
