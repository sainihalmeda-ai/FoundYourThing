import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SessionBanner } from "../SessionBanner";
import { Reveal } from "../Reveal";
import { PressScale } from "../PressScale";
import { HomeUtilityFooter } from "./HomeUtilityFooter";
import { COLORS, CONTENT_MAX_WIDTH, FONTS, RADIUS, SHADOW } from "../../constants/config";
import type { HomeVariantProps } from "./types";

/** B — Dashboard grid: launcher-style equal-weight tiles, stats as scroll chips. */
export function HomeGrid({
  firstName,
  vtuId,
  stats,
  statsLoading,
  pendingCount,
  topInset,
  onReportLost,
  onReportFound,
  onBrowse,
  onRequests,
  onOpenApk,
  onAbout,
  onSafety,
  onLogout,
}: HomeVariantProps) {
  const chips = [
    { label: "reported", value: stats?.items_reported, dot: COLORS.primary },
    { label: "returned", value: stats?.items_returned, dot: COLORS.success },
    { label: "verified", value: stats?.registered_users, dot: COLORS.gold },
  ];

  return (
    <ScrollView
      contentContainerStyle={[styles.scroll, { paddingTop: topInset, paddingBottom: 28 }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.topBar}>
        <Text style={styles.brand}>FoundYourThing</Text>
        <SessionBanner />
      </View>
      <Text style={styles.hello}>
        Hi {firstName}
        {vtuId ? ` — ${vtuId}` : ""}
      </Text>

      <View style={styles.grid}>
        <Reveal delay={0} style={styles.gridCell}>
          <PressScale
            style={[styles.tile, styles.tileInk]}
            onPress={onReportLost}
            accessibilityRole="button"
            accessibilityLabel="I lost something"
          >
            <View style={styles.tileIconWrap}>
              <Ionicons name="arrow-up" size={20} color="#fff" style={{ transform: [{ rotate: "45deg" }] }} />
            </View>
            <Text style={styles.tileInkLabel}>I lost{"\n"}something</Text>
          </PressScale>
        </Reveal>
        <Reveal delay={60} style={styles.gridCell}>
          <PressScale
            style={[styles.tile, styles.tileCard]}
            onPress={onReportFound}
            accessibilityRole="button"
            accessibilityLabel="I found something"
          >
            <View style={[styles.tileIconWrap, styles.tileIconWrapMuted]}>
              <Ionicons name="return-down-back-outline" size={18} color={COLORS.primary} />
            </View>
            <Text style={styles.tileLabel}>I found{"\n"}something</Text>
          </PressScale>
        </Reveal>
        <Reveal delay={120} style={styles.gridCell}>
          <PressScale
            style={[styles.tile, styles.tileCard]}
            onPress={onBrowse}
            accessibilityRole="button"
            accessibilityLabel="Browse feed"
          >
            <View style={[styles.tileIconWrap, styles.tileIconWrapMuted]}>
              <Ionicons name="search" size={18} color={COLORS.primary} />
            </View>
            <Text style={styles.tileLabel}>Browse feed</Text>
          </PressScale>
        </Reveal>
        <Reveal delay={180} style={styles.gridCell}>
          <PressScale
            style={[styles.tile, styles.tileCard]}
            onPress={onRequests}
            accessibilityRole="button"
            accessibilityLabel="Requests"
          >
            <View style={[styles.tileIconWrap, styles.tileIconWrapMuted]}>
              <Ionicons name="mail-outline" size={18} color={COLORS.primary} />
            </View>
            <Text style={styles.tileLabel}>Requests</Text>
            {pendingCount > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingCount > 9 ? "9+" : pendingCount}</Text>
              </View>
            ) : null}
          </PressScale>
        </Reveal>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        {chips.map((chip, i) => (
          <Reveal key={chip.label} delay={240 + i * 60} style={styles.chip}>
            <View style={[styles.chipDot, { backgroundColor: chip.dot }]} />
            <Text style={styles.chipText}>
              {statsLoading ? "—" : chip.value ?? 0} {chip.label}
            </Text>
          </Reveal>
        ))}
      </ScrollView>

      <Reveal delay={420} style={styles.policyCard}>
        <View style={styles.policyHeader}>
          <Ionicons name="sparkles" size={13} color={COLORS.accent} />
          <Text style={styles.policyEyebrow}>Policy</Text>
        </View>
        <Text style={styles.policyBody}>
          Valuables only — phones, wallets, watches, IDs, bags, earbuds, keys, laptops.
        </Text>
      </Reveal>

      <HomeUtilityFooter onOpenApk={onOpenApk} onAbout={onAbout} onSafety={onSafety} onLogout={onLogout} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 20,
    width: "100%",
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: "center",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 2,
  },
  brand: {
    fontFamily: FONTS.display,
    fontSize: 19,
    color: COLORS.primary,
    letterSpacing: -0.3,
  },
  hello: {
    marginTop: 4,
    marginBottom: 16,
    fontFamily: FONTS.sansMedium,
    fontSize: 12,
    color: COLORS.textMuted,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  gridCell: { width: "47%" },
  tile: {
    aspectRatio: 1,
    borderRadius: 22,
    padding: 18,
    justifyContent: "space-between",
  },
  tileInk: { backgroundColor: COLORS.inkTop, ...SHADOW.soft },
  tileCard: { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, ...SHADOW.soft },
  tileIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  tileIconWrapMuted: { backgroundColor: COLORS.surfaceMuted },
  tileInkLabel: {
    fontFamily: FONTS.display,
    fontWeight: "700",
    fontSize: 16,
    lineHeight: 20,
    color: "#fff",
  },
  tileLabel: {
    fontFamily: FONTS.display,
    fontWeight: "700",
    fontSize: 15,
    lineHeight: 19,
    color: COLORS.text,
  },
  badge: {
    position: "absolute",
    top: 14,
    right: 14,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.danger,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: { color: "#fff", fontSize: 10, fontFamily: FONTS.sansBold },
  chipRow: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 18,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.pill,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  chipDot: { width: 6, height: 6, borderRadius: 3 },
  chipText: { fontFamily: FONTS.sansSemi, fontSize: 12, color: COLORS.text },
  policyCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  policyHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  policyEyebrow: {
    fontFamily: FONTS.sansBold,
    fontSize: 11,
    color: COLORS.accent,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  policyBody: {
    marginTop: 8,
    fontFamily: FONTS.sansMedium,
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 19,
  },
});
