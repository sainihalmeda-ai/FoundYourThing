import React, { useMemo } from "react";
import { Image, Platform, Pressable, ScrollView, StyleSheet, Text, View, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { resolveImageUrl } from "../../api/client";
import { Badge } from "../Ui";
import { UserAvatarPlaceholder } from "../UserAvatarPlaceholder";
import { PressScale } from "../PressScale";
import { COLORS, FONTS, RADIUS, SHADOW } from "../../constants/config";
import { timeAgo } from "../../lib/timeAgo";
import type { Item } from "../../types";
import type { HomeStats } from "./types";

/** Conic-gradient ring — web only (no SVG lib on native); native gets a flat circle. */
function ringStyle(stops: string): ViewStyle {
  if (Platform.OS !== "web") return { backgroundColor: COLORS.surfaceMuted };
  return { backgroundImage: `conic-gradient(${stops})` } as ViewStyle;
}

export function HomeDesktop({
  firstName,
  vtuId,
  stats,
  statsLoading,
  allItems,
  allItemsLoading,
  onReportLost,
  onReportFound,
  onBrowse,
  onSafety,
  onOpenItem,
}: {
  firstName: string;
  vtuId?: string;
  stats: HomeStats;
  statsLoading: boolean;
  allItems: Item[];
  allItemsLoading: boolean;
  onReportLost: () => void;
  onReportFound: () => void;
  onBrowse: () => void;
  onSafety: () => void;
  onOpenItem: (itemId: number) => void;
}) {
  const recoveredPct =
    stats && stats.items_reported > 0
      ? Math.round((stats.items_returned / stats.items_reported) * 100)
      : 0;

  const { lostPct, foundPct, categories, recent } = useMemo(() => {
    const lost = allItems.filter((i) => i.item_type === "lost").length;
    const found = allItems.length - lost;
    const total = allItems.length || 1;
    const counts = new Map<string, number>();
    allItems.forEach((i) => counts.set(i.category_label, (counts.get(i.category_label) ?? 0) + 1));
    const cats = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
    const sorted = [...allItems].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
    return {
      lostPct: Math.round((lost / total) * 100),
      foundPct: Math.round((found / total) * 100),
      categories: cats,
      recent: sorted.slice(0, 8),
    };
  }, [allItems]);

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      {/* Welcome + stat rings */}
      <View style={styles.topRow}>
        <View style={styles.welcomeCard}>
          <UserAvatarPlaceholder initial={firstName.charAt(0).toUpperCase()} size={68} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.welcomeEyebrow}>Welcome back</Text>
            <Text style={styles.welcomeName}>
              {firstName}
              {vtuId ? <Text style={styles.welcomeVtu}> · {vtuId}</Text> : null}
            </Text>
            <Text style={styles.welcomeBlurb}>
              {statsLoading
                ? "Loading campus activity…"
                : `${stats?.items_reported ?? 0} items reported and ${stats?.registered_users ?? 0} verified accounts across campus this term.`}
            </Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <View
            style={[
              styles.ring,
              ringStyle(`${COLORS.primary} 0% ${recoveredPct}%, ${COLORS.surfaceMuted} ${recoveredPct}% 100%`),
            ]}
          >
            <View style={styles.ringHole}>
              <Text style={styles.ringValue}>{statsLoading ? "—" : `${recoveredPct}%`}</Text>
              <Text style={styles.ringCaption}>recovered</Text>
            </View>
          </View>
          <View>
            <Text style={styles.statLabel}>Reports filed</Text>
            <Text style={styles.statBig}>{statsLoading ? "—" : stats?.items_reported ?? 0}</Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <View
            style={[
              styles.ring,
              styles.ringSmall,
              ringStyle(`${COLORS.accent} 0% ${lostPct}%, ${COLORS.gold} ${lostPct}% 100%`),
            ]}
          >
            <View style={[styles.ringHole, styles.ringHoleSmall]} />
          </View>
          <View>
            <Text style={styles.statLabel}>Lost vs found</Text>
            <View style={{ marginTop: 6, gap: 4 }}>
              <Legend color={COLORS.accent} label={`Lost ${allItemsLoading ? "—" : `${lostPct}%`}`} />
              <Legend color={COLORS.gold} label={`Found ${allItemsLoading ? "—" : `${foundPct}%`}`} />
            </View>
          </View>
        </View>
      </View>

      {/* Quick actions */}
      <Text style={styles.sectionLabel}>Quick actions</Text>
      <View style={styles.quickGrid}>
        <PressScale style={[styles.quickCard, styles.quickCardInk]} onPress={onReportLost} accessibilityRole="button">
          <View style={[styles.quickIcon, styles.quickIconInk]}>
            <Ionicons name="add" size={18} color="#fff" />
          </View>
          <Text style={styles.quickTitleInk}>Report lost item</Text>
        </PressScale>
        <PressScale style={styles.quickCard} onPress={onReportFound} accessibilityRole="button">
          <View style={styles.quickIcon}>
            <Ionicons name="arrow-undo-outline" size={18} color={COLORS.primary} />
          </View>
          <Text style={styles.quickTitle}>Report found item</Text>
        </PressScale>
        <PressScale style={styles.quickCard} onPress={onBrowse} accessibilityRole="button">
          <View style={[styles.quickIcon, { backgroundColor: "rgba(200,155,60,.14)" }]}>
            <Ionicons name="search" size={18} color={COLORS.gold} />
          </View>
          <Text style={styles.quickTitle}>Browse campus feed</Text>
        </PressScale>
        <PressScale
          style={[styles.quickCard, styles.quickCardSafety]}
          onPress={onSafety}
          accessibilityRole="button"
        >
          <View style={[styles.quickIcon, { backgroundColor: "rgba(169,31,35,.08)" }]}>
            <Ionicons name="shield-checkmark-outline" size={18} color={COLORS.accent} />
          </View>
          <Text style={styles.quickTitle}>Report a concern</Text>
        </PressScale>
      </View>

      {/* Categories */}
      <Text style={styles.sectionLabel}>Browse by category</Text>
      <View style={styles.chipRow}>
        {allItemsLoading ? (
          <Text style={styles.mutedText}>Loading…</Text>
        ) : categories.length === 0 ? (
          <Text style={styles.mutedText}>No reports yet.</Text>
        ) : (
          categories.map(([label, count]) => (
            <View key={label} style={styles.chip}>
              <View style={styles.chipDot} />
              <Text style={styles.chipLabel}>{label}</Text>
              <Text style={styles.chipCount}>{count}</Text>
            </View>
          ))
        )}
      </View>

      {/* Recent activity */}
      <View style={styles.tableCard}>
        <View style={styles.tableHeader}>
          <Text style={styles.tableTitle}>Recent activity</Text>
          <Pressable onPress={onBrowse}>
            <Text style={styles.tableViewAll}>View all</Text>
          </Pressable>
        </View>

        {allItemsLoading ? (
          <Text style={[styles.mutedText, { padding: 20 }]}>Loading recent activity…</Text>
        ) : recent.length === 0 ? (
          <Text style={[styles.mutedText, { padding: 20 }]}>Nothing reported yet.</Text>
        ) : (
          <>
            <View style={styles.tableColHeader}>
              <Text style={[styles.colHead, { flex: 2.4 }]}>Item</Text>
              <Text style={[styles.colHead, { flex: 1.4 }]}>Category</Text>
              <Text style={[styles.colHead, { flex: 1.4 }]}>Location</Text>
              <Text style={[styles.colHead, { flex: 1 }]}>Status</Text>
              <Text style={[styles.colHead, { flex: 1.2 }]}>Reporter</Text>
              <Text style={[styles.colHead, { flex: 1, textAlign: "right" }]}>When</Text>
            </View>
            {recent.map((item) => (
              <Pressable
                key={item.id}
                style={({ pressed }) => [styles.tableRow, pressed && styles.tableRowPressed]}
                onPress={() => onOpenItem(item.id)}
              >
                <View style={{ flex: 2.4, flexDirection: "row", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <RowThumb uri={resolveImageUrl(item.image_url)} />
                  <Text style={styles.cellTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                </View>
                <Text style={[styles.cell, { flex: 1.4 }]} numberOfLines={1}>
                  {item.category_label}
                </Text>
                <Text style={[styles.cell, { flex: 1.4 }]} numberOfLines={1}>
                  {item.location}
                </Text>
                <View style={{ flex: 1 }}>
                  <Badge
                    label={item.status === "recovered" ? "Returned" : item.item_type === "lost" ? "Lost" : "Found"}
                    tone={item.status === "recovered" ? "returned" : item.item_type}
                  />
                </View>
                <Text style={[styles.cell, { flex: 1.2 }]} numberOfLines={1}>
                  {item.reporter_vtu_id}
                </Text>
                <Text style={[styles.cellMuted, { flex: 1, textAlign: "right" }]}>
                  {timeAgo(item.created_at)}
                </Text>
              </Pressable>
            ))}
          </>
        )}
      </View>
    </ScrollView>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: color }} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

function RowThumb({ uri }: { uri?: string | null }) {
  const [failed, setFailed] = React.useState(false);
  if (!uri || failed) {
    return (
      <View style={[styles.rowThumb, styles.rowThumbFallback]}>
        <Ionicons name="image-outline" size={14} color={COLORS.textMuted} />
      </View>
    );
  }
  return <Image source={{ uri }} style={styles.rowThumb} resizeMode="cover" onError={() => setFailed(true)} />;
}

const styles = StyleSheet.create({
  scroll: { padding: 28, paddingBottom: 48, flexGrow: 1 },
  topRow: { flexDirection: "row", gap: 20, marginBottom: 24 },
  welcomeCard: {
    flex: 1.6,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS["2xl"],
    padding: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    ...SHADOW.soft,
  },
  welcomeEyebrow: {
    fontFamily: FONTS.sansBold,
    fontSize: 11,
    color: "rgba(255,255,255,.6)",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  welcomeName: {
    marginTop: 6,
    fontFamily: FONTS.display,
    fontSize: 24,
    color: "#fff",
  },
  welcomeVtu: {
    fontFamily: FONTS.sansMedium,
    fontSize: 14,
    color: "rgba(255,255,255,.55)",
  },
  welcomeBlurb: {
    marginTop: 10,
    fontFamily: FONTS.sans,
    fontSize: 12.5,
    color: "rgba(255,255,255,.68)",
    lineHeight: 18,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS["2xl"],
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    ...SHADOW.soft,
  },
  ring: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  ringSmall: { width: 72, height: 72, borderRadius: 36 },
  ringHole: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: COLORS.card,
    alignItems: "center",
    justifyContent: "center",
  },
  ringHoleSmall: { width: 52, height: 52, borderRadius: 26 },
  ringValue: { fontFamily: FONTS.display, fontSize: 17, color: COLORS.primary },
  ringCaption: { fontFamily: FONTS.sans, fontSize: 8.5, color: COLORS.textMuted },
  statLabel: {
    fontFamily: FONTS.sansBold,
    fontSize: 10.5,
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  statBig: { marginTop: 6, fontFamily: FONTS.display, fontSize: 22, color: COLORS.text },
  legendText: { fontFamily: FONTS.sansMedium, fontSize: 11, color: COLORS.text },
  sectionLabel: {
    fontFamily: FONTS.sansBold,
    fontSize: 11.5,
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },
  quickGrid: { flexDirection: "row", gap: 16, marginBottom: 24 },
  quickCard: {
    flex: 1,
    height: 116,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    padding: 16,
    justifyContent: "space-between",
    ...SHADOW.soft,
  },
  quickCardInk: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  quickCardSafety: { borderColor: "rgba(169,31,35,.25)" },
  quickIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: COLORS.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  quickIconInk: { backgroundColor: "rgba(255,255,255,.14)" },
  quickTitle: { fontFamily: FONTS.displayMedium, fontSize: 14.5, color: COLORS.text },
  quickTitleInk: { fontFamily: FONTS.displayMedium, fontSize: 14.5, color: "#fff" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.pill,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  chipDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.primary },
  chipLabel: { fontFamily: FONTS.sansSemi, fontSize: 12.5, color: COLORS.text },
  chipCount: { fontFamily: FONTS.sansMedium, fontSize: 11, color: "#98A2B3" },
  mutedText: { fontFamily: FONTS.sans, fontSize: 12.5, color: COLORS.textMuted },
  tableCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS["2xl"],
    paddingTop: 18,
    paddingBottom: 6,
    ...SHADOW.soft,
  },
  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  tableTitle: { fontFamily: FONTS.display, fontSize: 16, color: COLORS.text },
  tableViewAll: { fontFamily: FONTS.sansBold, fontSize: 12, color: COLORS.primary },
  tableColHeader: { flexDirection: "row", paddingHorizontal: 20, paddingBottom: 10 },
  colHead: {
    fontFamily: FONTS.sansBold,
    fontSize: 10.5,
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  tableRowPressed: { backgroundColor: "#FAFBFC" },
  rowThumb: { width: 32, height: 32, borderRadius: 8, backgroundColor: COLORS.surfaceMuted, flexShrink: 0 },
  rowThumbFallback: { alignItems: "center", justifyContent: "center" },
  cellTitle: { flex: 1, fontFamily: FONTS.sansBold, fontSize: 13, color: COLORS.text },
  cell: { fontFamily: FONTS.sans, fontSize: 12.5, color: COLORS.textMuted },
  cellMuted: { fontFamily: FONTS.sansMedium, fontSize: 11.5, color: "#98A2B3" },
});
