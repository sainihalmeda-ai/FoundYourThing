import React, { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { fetchAllHostelComplaints, fetchHostelOptions } from "../api/hostel";
import { ConnectionBanner } from "../components/ConnectionBanner";
import { ConnectionGate } from "../components/ConnectionGate";
import { LoadingOverlay } from "../components/LoadingOverlay";
import { Badge, Chip } from "../components/Ui";
import { EmptyState, ErrorState } from "../components/states";
import { useAuth } from "../context/AuthContext";
import { COLORS, CONTENT_MAX_WIDTH, FONTS, RADIUS } from "../constants/config";
import { HOSTEL_STATUS_LABEL, HOSTEL_STATUS_TONE, complaintPlace } from "../constants/hostel";
import { RootStackParamList } from "../navigation/types";
import type { HostelComplaint, HostelComplaintOptions } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "HostelInbox">;

/** Hostel staff only — every complaint, filterable by hostel. */
export function HostelInboxScreen({ navigation }: Props) {
  const { token } = useAuth();
  const [options, setOptions] = useState<HostelComplaintOptions | null>(null);
  const [complaints, setComplaints] = useState<HostelComplaint[]>([]);
  const [hostel, setHostel] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

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

  if (loading) return <LoadingOverlay label="Loading complaints" />;
  if (error) return <ErrorState error={error} onRetry={load} />;

  const open = complaints.filter((c) => c.status !== "resolved").length;

  return (
    <ConnectionGate>
      <View style={styles.root}>
        <ConnectionBanner />
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.summary}>
            {complaints.length} complaint{complaints.length === 1 ? "" : "s"} · {open} open
          </Text>
          <View style={styles.chips}>
            <Chip label="All hostels" active={!hostel} onPress={() => setHostel("")} />
            {options?.hostels.map((h) => (
              <Chip key={h.id} label={h.label} active={hostel === h.id} onPress={() => setHostel(h.id)} />
            ))}
          </View>

          {complaints.length === 0 ? (
            <EmptyState title="No complaints" message="Nothing has been filed here yet." compact />
          ) : (
            complaints.map((c) => (
              <Pressable
                key={c.id}
                style={({ pressed }) => [styles.row, pressed && styles.pressed]}
                onPress={() => navigation.navigate("HostelComplaintDetail", { complaintId: c.id })}
              >
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.rowTitle}>{c.category_label}</Text>
                  <Text style={styles.rowMeta} numberOfLines={1}>
                    {complaintPlace(c)}
                  </Text>
                  <Text style={styles.rowMeta} numberOfLines={1}>
                    {c.reporter_name || c.reporter_vtu_id} ·{" "}
                    {new Date(c.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <Badge label={HOSTEL_STATUS_LABEL[c.status]} tone={HOSTEL_STATUS_TONE[c.status]} />
              </Pressable>
            ))
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
});
