import React, { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { fetchHostelOptions, fetchMyHostelComplaints } from "../api/hostel";
import { ConnectionBanner } from "../components/ConnectionBanner";
import { SidebarShell } from "../components/SidebarShell";
import { Badge } from "../components/Ui";
import { EmptyState, ErrorState } from "../components/states";
import { useAuth } from "../context/AuthContext";
import { COLORS, CONTENT_MAX_WIDTH, FONTS, RADIUS, SHADOW, WIDE_BREAKPOINT } from "../constants/config";
import { HOSTEL_STATUS_LABEL, HOSTEL_STATUS_TONE, complaintPlace } from "../constants/hostel";
import { RootStackParamList } from "../navigation/types";
import type { HostelComplaint } from "../types";

/** Hostel complaint box — the student's own complaints and the way to file one. */
export function HostelScreen() {
  const { token } = useAuth();
  const { width } = useWindowDimensions();
  const wide = width >= WIDE_BREAKPOINT;
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [complaints, setComplaints] = useState<HostelComplaint[]>([]);
  const [isStaff, setIsStaff] = useState(false);
  const [minWords, setMinWords] = useState(200);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setError(null);
      const [mine, options] = await Promise.all([
        fetchMyHostelComplaints(token),
        fetchHostelOptions(token),
      ]);
      setComplaints(mine);
      setIsStaff(options.is_hostel_staff);
      setMinWords(options.min_words);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    // Refetch quietly on refocus — only the first visit shows a loader.
    useCallback(() => {
      load();
    }, [load]),
  );

  if (error) return <ErrorState error={error} onRetry={load} />;

  return (
    <SidebarShell active="hostel" loading={loading} loadingHint="Checking your complaints…">
      <ConnectionBanner />
      <View style={[styles.header, { paddingTop: wide ? 28 : 12 }]}>
        <Text style={styles.title}>Hostel complaints</Text>
        <Text style={styles.subtitle}>
          Plumbing, food, electrical and other problems in your hostel
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle" size={16} color={COLORS.primary} />
            <Text style={styles.infoEyebrow}>How this works</Text>
          </View>
          <Text style={styles.infoBody}>
            Choose your hostel and block, explain the problem in at least {minWords} words, and
            attach a photo of it. Your complaint goes to the hostel office. Its status and their
            reply show up here.
          </Text>
        </View>

        <Pressable
          style={({ pressed }) => [styles.newBtn, pressed && styles.pressed]}
          onPress={() => navigation.navigate("HostelComplaintNew")}
        >
          <View style={styles.newBtnIcon}>
            <Ionicons name="add" size={18} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.newBtnTitle}>Register a complaint</Text>
            <Text style={styles.newBtnSub}>Leaks, spoiled food, broken fans, no water…</Text>
          </View>
        </Pressable>

        {isStaff ? (
          <Pressable
            style={({ pressed }) => [styles.staffBtn, pressed && styles.pressed]}
            onPress={() => navigation.navigate("HostelInbox")}
          >
            <Ionicons name="file-tray-full-outline" size={16} color={COLORS.primary} />
            <Text style={styles.staffBtnText}>Hostel office inbox</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
          </Pressable>
        ) : null}

        <Text style={styles.sectionLabel}>Your complaints</Text>
        {complaints.length === 0 ? (
          <EmptyState
            title="No complaints yet"
            message="Complaints you register will show up here with their status."
            compact
          />
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
                  {complaintPlace(c)} · {new Date(c.created_at).toLocaleDateString()}
                </Text>
              </View>
              <Badge label={HOSTEL_STATUS_LABEL[c.status]} tone={HOSTEL_STATUS_TONE[c.status]} />
            </Pressable>
          ))
        )}
      </ScrollView>
    </SidebarShell>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 10,
    width: "100%",
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: "center",
  },
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
  infoCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.xl,
    padding: 16,
    marginBottom: 14,
    ...SHADOW.soft,
  },
  infoHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  infoEyebrow: {
    fontFamily: FONTS.sansBold,
    fontSize: 11,
    color: COLORS.primary,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  infoBody: { fontFamily: FONTS.sansMedium, fontSize: 13, color: COLORS.text, lineHeight: 20 },
  newBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xl,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 12,
    ...SHADOW.soft,
  },
  newBtnIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  newBtnTitle: { color: "#fff", fontFamily: FONTS.sansBold, fontSize: 15 },
  newBtnSub: { color: "rgba(255,255,255,.75)", fontFamily: FONTS.sans, fontSize: 12, marginTop: 2 },
  staffBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.xl,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  staffBtnText: { flex: 1, fontFamily: FONTS.sansSemi, fontSize: 13, color: COLORS.text },
  sectionLabel: {
    fontFamily: FONTS.sansBold,
    fontSize: 11,
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 8,
    marginBottom: 10,
  },
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
