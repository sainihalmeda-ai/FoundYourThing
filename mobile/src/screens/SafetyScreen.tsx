import React, { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fetchConcernTeamAccess, fetchMyConcerns } from "../api/auth";
import { ConnectionBanner } from "../components/ConnectionBanner";
import { ConnectionGate } from "../components/ConnectionGate";
import { DesktopSidebar } from "../components/DesktopSidebar";
import { HomeButton } from "../components/HomeButton";
import { LoadingOverlay } from "../components/LoadingOverlay";
import { SectionStepper } from "../components/SectionStepper";
import { Badge } from "../components/Ui";
import { EmptyState, ErrorState } from "../components/states";
import { useAuth } from "../context/AuthContext";
import { COLORS, CONTENT_MAX_WIDTH, FONTS, RADIUS, SHADOW, WIDE_BREAKPOINT } from "../constants/config";
import { navigate as navigateGlobal } from "../navigation/navigationRef";
import { RootStackParamList } from "../navigation/types";
import type { Concern, ConcernStatus } from "../types";

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

export function SafetyScreen() {
  const { token } = useAuth();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const wide = width >= WIDE_BREAKPOINT;
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [concerns, setConcerns] = useState<Concern[]>([]);
  const [isTeam, setIsTeam] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setError(null);
      const [mine, access] = await Promise.all([
        fetchMyConcerns(token),
        fetchConcernTeamAccess(token),
      ]);
      setConcerns(mine);
      setIsTeam(access.is_enquiry_team);
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

  if (loading) {
    return <LoadingOverlay label="Loading" hint="Checking your reports…" />;
  }
  if (error) return <ErrorState error={error} onRetry={load} />;

  const content = (
    <>
      <ConnectionBanner />
      <View style={[styles.header, { paddingTop: wide ? 8 : Math.max(insets.top, 12) + 8 }]}>
        <View style={styles.headerTop}>
          <View style={styles.headerText}>
            <Text style={styles.title} numberOfLines={2}>
              Report a concern
            </Text>
            <Text style={styles.subtitle}>Private — only you and the enquiry team can see this</Text>
          </View>
          {wide ? (
            <SectionStepper
              direction="back"
              label="Lost & Found"
              onPress={() => navigateGlobal("MainTabs", { screen: "HomeTab" })}
            />
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <SectionStepper
                direction="back"
                label="Lost & Found"
                onPress={() => navigateGlobal("MainTabs", { screen: "HomeTab" })}
              />
              <HomeButton />
            </View>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Ionicons name="shield-checkmark" size={16} color={COLORS.accent} />
              <Text style={styles.infoEyebrow}>How this works</Text>
            </View>
            <Text style={styles.infoBody}>
              Your report goes directly and privately to the college's enquiry team — never to
              other students. They may contact you to hear the full picture before looking into
              it. Nothing is posted publicly by this app; any public action is the college's
              decision, made outside this app.
            </Text>
            <Text style={styles.infoMuted}>
              In immediate danger? Contact campus security or the police first. National
              Anti-Ragging Helpline: 1800-180-5522. This form supplements, not replaces, your
              college's official Anti-Ragging Committee.
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [styles.newBtn, pressed && styles.pressed]}
            onPress={() => navigation.navigate("ReportConcern")}
          >
            <View style={styles.newBtnIcon}>
              <Ionicons name="add" size={18} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.newBtnTitle}>File a new report</Text>
              <Text style={styles.newBtnSub}>Ragging, harassment, bullying, or another concern</Text>
            </View>
          </Pressable>

          {isTeam ? (
            <Pressable
              style={({ pressed }) => [styles.teamBtn, pressed && styles.pressed]}
              onPress={() => navigation.navigate("EnquiryInbox")}
            >
              <Ionicons name="briefcase-outline" size={16} color={COLORS.primary} />
              <Text style={styles.teamBtnText}>Enquiry team inbox</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
            </Pressable>
          ) : null}

          <Text style={styles.sectionLabel}>Your reports</Text>
          {concerns.length === 0 ? (
            <EmptyState
              title="Nothing filed yet"
              message="Reports you file will show up here with their status."
              compact
            />
          ) : (
            concerns.map((c) => (
              <Pressable
                key={c.id}
                style={({ pressed }) => [styles.row, pressed && styles.pressed]}
                onPress={() => navigation.navigate("ConcernDetail", { concernId: c.id })}
              >
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.rowTitle}>{c.category_label}</Text>
                  <Text style={styles.rowMeta} numberOfLines={1}>
                    {new Date(c.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <Badge label={STATUS_LABEL[c.status]} tone={STATUS_TONE[c.status]} />
              </Pressable>
            ))
          )}
      </ScrollView>
    </>
  );

  return (
    <ConnectionGate>
      {wide ? (
        <View style={styles.desktopRoot}>
          <DesktopSidebar active="safety" />
          <View style={{ flex: 1 }}>{content}</View>
        </View>
      ) : (
        <View style={styles.root}>{content}</View>
      )}
    </ConnectionGate>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  desktopRoot: { flex: 1, flexDirection: "row", backgroundColor: COLORS.background },
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
  subtitle: {
    marginTop: 6,
    fontFamily: FONTS.sans,
    fontSize: 12,
    color: COLORS.textMuted,
  },
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
    color: COLORS.accent,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  infoBody: {
    fontFamily: FONTS.sansMedium,
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 20,
  },
  infoMuted: {
    marginTop: 10,
    fontFamily: FONTS.sans,
    fontSize: 11.5,
    color: COLORS.textMuted,
    lineHeight: 17,
  },
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
  teamBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.xl,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  teamBtnText: { flex: 1, fontFamily: FONTS.sansSemi, fontSize: 13, color: COLORS.text },
  sectionLabel: {
    fontFamily: FONTS.sansBold,
    fontSize: 11,
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
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
