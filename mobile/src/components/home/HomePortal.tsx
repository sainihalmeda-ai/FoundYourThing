import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { GridPlot } from "../SpatialBackdrop";
import { SessionBanner } from "../SessionBanner";
import { StatsStrip } from "../StatsStrip";
import { Reveal } from "../Reveal";
import { PressScale } from "../PressScale";
import { HomeUtilityFooter } from "./HomeUtilityFooter";
import { COLORS, CONTENT_MAX_WIDTH, FONTS, RADIUS, SHADOW } from "../../constants/config";
import type { HomeVariantProps } from "./types";

/** A — Quiet Portal: the shipped direction, refined with entrance/press animation. */
export function HomePortal({
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
  onLogout,
}: HomeVariantProps) {
  return (
    <ScrollView
      contentContainerStyle={[styles.scroll, { paddingTop: topInset, paddingBottom: 28 }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Reveal style={styles.banner} delay={0}>
        <View style={styles.bannerBrand}>
          <View style={styles.bannerMark}>
            <Text style={styles.bannerMarkText}>FYT</Text>
          </View>
          <View style={styles.bannerText}>
            <Text style={styles.bannerTitle} numberOfLines={1}>
              FoundYourThing
            </Text>
            <Text style={styles.bannerSubtitle} numberOfLines={1}>
              Campus Lost &amp; Found · Vel Tech
            </Text>
          </View>
        </View>
        <View style={styles.bannerSession}>
          <SessionBanner />
        </View>
      </Reveal>

      <Reveal style={styles.welcomeStrip} delay={70}>
        <Text style={styles.welcomeText}>
          Hi <Text style={styles.welcomeName}>{firstName}</Text>
          {vtuId ? ` (${vtuId})` : ""}
        </Text>
        <Text style={styles.welcomeSub}>Welcome back to your dashboard.</Text>
      </Reveal>

      <Reveal delay={140}>
        <StatsStrip
          loading={statsLoading}
          stats={[
            { label: "Items reported", value: stats?.items_reported ?? 0 },
            { label: "Items returned", value: stats?.items_returned ?? 0 },
            { label: "Verified accounts", value: stats?.registered_users ?? 0 },
          ]}
        />
      </Reveal>

      <Reveal delay={210}>
        <PressScale
          style={[styles.tileInk, styles.tileSpacing]}
          onPress={onReportLost}
          accessibilityRole="button"
          accessibilityLabel="I lost something"
        >
          <GridPlot variant="ink" opacity={0.5} />
          <View style={{ flex: 1, zIndex: 1 }}>
            <Text style={styles.tileInkTitle}>I lost something</Text>
            <Text style={styles.tileInkDesc}>Post a lost item — AI matches instantly.</Text>
          </View>
          <View style={[styles.tileInkArrow, { zIndex: 1 }]}>
            <Ionicons
              name="arrow-up"
              size={18}
              color="#fff"
              style={{ transform: [{ rotate: "45deg" }] }}
            />
          </View>
        </PressScale>
      </Reveal>

      <Reveal delay={260}>
        <PressScale
          style={[styles.tileCard, styles.tileSpacing]}
          onPress={onReportFound}
          accessibilityRole="button"
          accessibilityLabel="I found something"
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.tileCardTitle}>I found something</Text>
            <Text style={styles.tileCardDesc}>Return a valuable to its owner.</Text>
          </View>
          <View style={styles.tileMutedArrow}>
            <Ionicons
              name="arrow-up"
              size={16}
              color={COLORS.primary}
              style={{ transform: [{ rotate: "45deg" }] }}
            />
          </View>
        </PressScale>
      </Reveal>

      <Reveal delay={310} style={styles.secondaryRow}>
        <PressScale style={styles.secondaryTile} onPress={onBrowse} accessibilityRole="button">
          <View style={styles.secondaryIcon}>
            <Ionicons name="search" size={16} color={COLORS.primary} />
          </View>
          <Text style={styles.secondaryLabel}>Browse feed</Text>
        </PressScale>

        <PressScale style={styles.secondaryTile} onPress={onRequests} accessibilityRole="button">
          <View style={styles.secondaryIcon}>
            <Ionicons name="mail-outline" size={16} color={COLORS.primary} />
          </View>
          <Text style={styles.secondaryLabel}>Requests</Text>
          {pendingCount > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{pendingCount > 9 ? "9+" : pendingCount}</Text>
            </View>
          ) : null}
        </PressScale>
      </Reveal>

      <Reveal delay={360} style={styles.policyCard}>
        <View style={styles.policyHeader}>
          <Ionicons name="sparkles" size={14} color={COLORS.accent} />
          <Text style={styles.policyEyebrow}>Policy</Text>
        </View>
        <Text style={styles.policyBody}>
          Valuables only. Phones, wallets, watches, IDs, bags, earbuds, keys, laptops.
        </Text>
        <Text style={styles.policyMuted}>
          Pens, pencils and consumables aren’t accepted — it keeps the feed useful.
        </Text>
      </Reveal>

      <HomeUtilityFooter onOpenApk={onOpenApk} onAbout={onAbout} onLogout={onLogout} />
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
  banner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xl,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    ...SHADOW.soft,
  },
  bannerBrand: { flexDirection: "row", alignItems: "center", gap: 10, flexShrink: 1, minWidth: 0 },
  bannerMark: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,.14)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  bannerMarkText: {
    fontFamily: FONTS.sansBold,
    fontSize: 12,
    color: "#fff",
    letterSpacing: 0.4,
  },
  bannerText: { flexShrink: 1, minWidth: 0 },
  bannerTitle: {
    fontFamily: FONTS.displayMedium,
    fontSize: 16,
    color: "#fff",
    letterSpacing: -0.2,
  },
  bannerSubtitle: {
    marginTop: 2,
    fontFamily: FONTS.sansMedium,
    fontSize: 10.5,
    color: "rgba(255,255,255,.72)",
  },
  bannerSession: { flexShrink: 0 },
  welcomeStrip: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.accent,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  welcomeText: {
    fontFamily: FONTS.sansSemi,
    fontSize: 15,
    color: COLORS.text,
  },
  welcomeName: { fontFamily: FONTS.displayMedium },
  welcomeSub: {
    marginTop: 4,
    fontFamily: FONTS.sans,
    fontSize: 12,
    color: COLORS.textMuted,
  },
  tileSpacing: { marginBottom: 12 },
  tileInk: {
    backgroundColor: COLORS.inkTop,
    borderRadius: 20,
    padding: 24,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    overflow: "hidden",
    position: "relative",
    ...SHADOW.soft,
  },
  tileInkTitle: {
    fontFamily: FONTS.display,
    fontSize: 22,
    color: COLORS.primaryForeground,
    letterSpacing: -0.4,
  },
  tileInkDesc: {
    marginTop: 10,
    fontFamily: FONTS.sans,
    fontSize: 13,
    color: "rgba(255,255,255,.65)",
    lineHeight: 20,
  },
  tileInkArrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  tileCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 24,
    flexDirection: "row",
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
    marginBottom: 8,
    ...SHADOW.soft,
  },
  tileCardTitle: {
    fontFamily: FONTS.display,
    fontSize: 22,
    color: COLORS.text,
    letterSpacing: -0.4,
  },
  tileCardDesc: {
    marginTop: 10,
    fontFamily: FONTS.sans,
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 20,
  },
  tileMutedArrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryRow: { flexDirection: "row", gap: 16, marginBottom: 20, marginTop: 12 },
  secondaryTile: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    padding: 20,
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 12,
    position: "relative",
    ...SHADOW.soft,
  },
  secondaryIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryLabel: {
    fontFamily: FONTS.sansSemi,
    fontSize: 13,
    color: COLORS.text,
    letterSpacing: -0.2,
  },
  badge: {
    position: "absolute",
    top: 16,
    right: 16,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.danger,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontFamily: FONTS.sansBold,
  },
  policyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 24,
    marginBottom: 14,
    ...SHADOW.soft,
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
    marginTop: 10,
    fontFamily: FONTS.sansMedium,
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 21,
  },
  policyMuted: {
    marginTop: 6,
    fontFamily: FONTS.sans,
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 18,
  },
});
