import React, { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fetchAllConcerns } from "../api/auth";
import { ConnectionBanner } from "../components/ConnectionBanner";
import { ConnectionGate } from "../components/ConnectionGate";
import { DesktopPage } from "../components/DesktopPage";
import { HomeButton } from "../components/HomeButton";
import { LoadingOverlay } from "../components/LoadingOverlay";
import { Badge } from "../components/Ui";
import { EmptyState, ErrorState } from "../components/states";
import { useAuth } from "../context/AuthContext";
import { COLORS, CONTENT_MAX_WIDTH, FONTS, RADIUS, WIDE_BREAKPOINT } from "../constants/config";
import { RootStackParamList } from "../navigation/types";
import type { ConcernStatus, ConcernTeamView } from "../types";

const STATUS_TONE: Record<ConcernStatus, "neutral" | "connected" | "returned"> = {
  received: "neutral",
  under_review: "connected",
  resolved: "returned",
};

const STATUS_LABEL: Record<ConcernStatus, string> = {
  received: "Received",
  under_review: "Under review",
  resolved: "Resolved",
};

export function EnquiryInboxScreen() {
  const { token } = useAuth();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [rows, setRows] = useState<ConcernTeamView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [filter, setFilter] = useState<ConcernStatus | null>(null);
  const { width } = useWindowDimensions();
  const wide = width >= WIDE_BREAKPOINT;

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setError(null);
      setRows(await fetchAllConcerns(token));
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load]),
  );

  if (loading && !wide) return <LoadingOverlay label="Loading reports" />;
  if (error) return <ErrorState error={error} onRetry={load} />;

  const reportRow = (c: ConcernTeamView, style?: object) => (
    <Pressable
      key={c.id}
      style={({ pressed }) => [styles.row, style, pressed && styles.pressed]}
      onPress={() => navigation.navigate("EnquiryConcernDetail", { concernId: c.id })}
    >
      <View style={styles.rowTop}>
        <Text style={styles.rowTitle}>{c.category_label}</Text>
        <Badge label={STATUS_LABEL[c.status]} tone={STATUS_TONE[c.status]} />
      </View>
      <Text style={styles.rowReporter}>
        {c.reporter_vtu_id}
        {c.reporter_name ? ` · ${c.reporter_name}` : ""}
      </Text>
      <Text style={styles.rowPreview} numberOfLines={2}>
        {c.description}
      </Text>
      <Text style={styles.rowDate}>{new Date(c.created_at).toLocaleString()}</Text>
    </Pressable>
  );

  if (wide) {
    const shown = filter ? rows.filter((c) => c.status === filter) : rows;
    return (
      <DesktopPage
        active="safety"
        loading={loading && rows.length === 0}
        eyebrow="Campus safety · Enquiry team"
        title="Enquiry inbox"
        subtitle="Visible only to the enquiry team. Reporters see only their own reports."
      >
        <View style={styles.statRow}>
          {(Object.keys(STATUS_LABEL) as ConcernStatus[]).map((key) => {
            const active = filter === key;
            return (
              <Pressable
                key={key}
                onPress={() => setFilter(active ? null : key)}
                style={({ pressed }) => [
                  styles.stat,
                  active && styles.statActive,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.statValue}>{rows.filter((c) => c.status === key).length}</Text>
                <Text style={styles.statLabel}>{STATUS_LABEL[key]}</Text>
              </Pressable>
            );
          })}
          <View style={[styles.stat, styles.statTotal]}>
            <Ionicons name="file-tray-full-outline" size={18} color="#fff" />
            <Text style={[styles.statValue, styles.statValueInk]}>{rows.length}</Text>
            <Text style={[styles.statLabel, styles.statLabelInk]}>All reports</Text>
          </View>
        </View>
        {shown.length === 0 ? (
          <EmptyState
            title={filter ? `Nothing ${STATUS_LABEL[filter].toLowerCase()}` : "Nothing pending"}
            message={filter ? "Pick another status above." : "New reports will appear here."}
            compact
          />
        ) : (
          <View style={styles.grid}>{shown.map((c) => reportRow(c, styles.gridCell))}</View>
        )}
      </DesktopPage>
    );
  }

  return (
    <ConnectionGate>
      <View style={styles.root}>
        <ConnectionBanner />
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) + 8 }]}>
          <View style={styles.headerTop}>
            <View style={styles.headerText}>
              <Text style={styles.title} numberOfLines={2}>
                Enquiry inbox
              </Text>
              <Text style={styles.subtitle}>Visible only to the enquiry team</Text>
            </View>
            <HomeButton />
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          {rows.length === 0 ? (
            <EmptyState title="Nothing pending" message="New reports will appear here." compact />
          ) : (
            rows.map((c) => reportRow(c))
          )}
        </ScrollView>
      </View>
    </ConnectionGate>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: 20, paddingBottom: 10 },
  headerTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  headerText: { flex: 1, minWidth: 0, paddingRight: 4 },
  title: {
    fontFamily: FONTS.display,
    fontSize: 26,
    color: COLORS.text,
    letterSpacing: -0.4,
    lineHeight: 32,
  },
  subtitle: { marginTop: 6, fontFamily: FONTS.sans, fontSize: 12, color: COLORS.textMuted },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    width: "100%",
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: "center",
  },
  row: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.xl,
    padding: 16,
    marginBottom: 12,
  },
  rowTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  rowTitle: { fontFamily: FONTS.sansBold, fontSize: 14, color: COLORS.text },
  rowReporter: { marginTop: 6, fontFamily: FONTS.sansSemi, fontSize: 12, color: COLORS.primary },
  rowPreview: { marginTop: 6, fontFamily: FONTS.sans, fontSize: 12.5, color: COLORS.textMuted, lineHeight: 18 },
  rowDate: { marginTop: 8, fontFamily: FONTS.sansMedium, fontSize: 10.5, color: "#98A2B3" },
  pressed: { opacity: 0.92 },
  statRow: { flexDirection: "row", gap: 14, marginBottom: 18 },
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
  statTotal: { backgroundColor: COLORS.primary, borderColor: COLORS.primary, gap: 2 },
  statValue: { fontFamily: FONTS.display, fontSize: 22, color: COLORS.text },
  statValueInk: { color: "#fff" },
  statLabel: { fontFamily: FONTS.sansMedium, fontSize: 12, color: COLORS.textMuted },
  statLabelInk: { color: "rgba(255,255,255,.75)" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 14 },
  gridCell: { width: "48.5%", flexGrow: 1, marginBottom: 0 },
});
