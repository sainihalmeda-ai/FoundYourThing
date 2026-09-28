import React, { useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { resolveImageUrl } from "../../api/client";
import { Badge } from "../Ui";
import { Reveal } from "../Reveal";
import { PressScale } from "../PressScale";
import { HomeUtilityFooter } from "./HomeUtilityFooter";
import { COLORS, CONTENT_MAX_WIDTH, FONTS, RADIUS, SHADOW } from "../../constants/config";
import { timeAgo } from "../../lib/timeAgo";
import type { HomeFeedExtraProps, HomeVariantProps } from "./types";

/** C — Activity feed first: recent campus items right on Home, actions collapsed to pills. */
export function HomeFeed({
  firstName,
  stats,
  statsLoading,
  pendingCount,
  topInset,
  onReportLost,
  onReportFound,
  onRequests,
  onOpenApk,
  onAbout,
  onLogout,
  recentItems,
  recentLoading,
  onOpenItem,
}: HomeVariantProps & HomeFeedExtraProps) {
  return (
    <ScrollView
      contentContainerStyle={[styles.scroll, { paddingTop: topInset, paddingBottom: 28 }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.topRow}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.brand}>FoundYourThing</Text>
          <View style={styles.statLine}>
            <View style={styles.liveDot} />
            <Text style={styles.statLineText} numberOfLines={1}>
              {statsLoading
                ? "Loading campus activity…"
                : `${stats?.items_reported ?? 0} reported · ${stats?.items_returned ?? 0} returned this term`}
            </Text>
          </View>
        </View>
        <PressScale
          style={styles.requestsBtn}
          onPress={onRequests}
          accessibilityRole="button"
          accessibilityLabel="Requests"
        >
          <Ionicons name="mail-outline" size={17} color={COLORS.primary} />
          {pendingCount > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{pendingCount > 9 ? "9+" : pendingCount}</Text>
            </View>
          ) : null}
        </PressScale>
      </View>

      <Text style={styles.hello}>Hi {firstName} — here’s what’s happening on campus.</Text>

      <View style={styles.actionRow}>
        <PressScale
          style={[styles.pill, styles.pillPrimary]}
          onPress={onReportLost}
          accessibilityRole="button"
          accessibilityLabel="Report lost item"
        >
          <Ionicons name="add" size={15} color="#fff" />
          <Text style={styles.pillPrimaryText}>Report lost</Text>
        </PressScale>
        <PressScale
          style={[styles.pill, styles.pillOutline]}
          onPress={onReportFound}
          accessibilityRole="button"
          accessibilityLabel="Report found item"
        >
          <Ionicons name="add" size={15} color={COLORS.primary} />
          <Text style={styles.pillOutlineText}>Report found</Text>
        </PressScale>
      </View>

      <View style={styles.feed}>
        {recentLoading ? (
          <Text style={styles.loadingText}>Loading recent activity…</Text>
        ) : recentItems.length === 0 ? (
          <Text style={styles.loadingText}>Nothing reported yet — be the first.</Text>
        ) : (
          recentItems.map((item, i) => (
            <Reveal key={item.id} delay={i * 55}>
              <Pressable
                style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
                onPress={() => onOpenItem(item.id)}
              >
                <FeedThumb uri={resolveImageUrl(item.image_url)} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View style={styles.cardTop}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Badge
                      label={item.status === "recovered" ? "Returned" : item.item_type === "lost" ? "Lost" : "Found"}
                      tone={item.status === "recovered" ? "returned" : item.item_type}
                    />
                  </View>
                  <Text style={styles.cardMeta} numberOfLines={1}>
                    {item.category_label} · {item.location}
                  </Text>
                  <Text style={styles.cardTime}>
                    {timeAgo(item.created_at)} · {item.reporter_vtu_id}
                  </Text>
                </View>
              </Pressable>
            </Reveal>
          ))
        )}
      </View>

      <HomeUtilityFooter onOpenApk={onOpenApk} onAbout={onAbout} onLogout={onLogout} />
    </ScrollView>
  );
}

/**
 * Small square feed thumbnail — cropped, unlike PhotoView (which never crops
 * and has a 160px minHeight built for full-size hero/card photos, too tall
 * for a compact 56px row avatar).
 */
function FeedThumb({ uri }: { uri?: string | null }) {
  const [failed, setFailed] = useState(false);
  if (!uri || failed) {
    return (
      <View style={[styles.thumb, styles.thumbFallback]}>
        <Ionicons name="image-outline" size={18} color={COLORS.textMuted} />
      </View>
    );
  }
  return (
    <Image source={{ uri }} style={styles.thumb} resizeMode="cover" onError={() => setFailed(true)} />
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 20,
    width: "100%",
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: "center",
  },
  topRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  brand: {
    fontFamily: FONTS.display,
    fontSize: 19,
    color: COLORS.primary,
    letterSpacing: -0.3,
  },
  statLine: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.success },
  statLineText: { fontFamily: FONTS.sansMedium, fontSize: 11.5, color: COLORS.textMuted, flexShrink: 1 },
  requestsBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.danger,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: { color: "#fff", fontSize: 9, fontFamily: FONTS.sansBold },
  hello: {
    marginTop: 14,
    marginBottom: 10,
    fontFamily: FONTS.sansMedium,
    fontSize: 13,
    color: COLORS.text,
  },
  actionRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  pill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    borderRadius: RADIUS.pill,
    paddingVertical: 12,
  },
  pillPrimary: { backgroundColor: COLORS.primary, ...SHADOW.soft },
  pillPrimaryText: { color: "#fff", fontFamily: FONTS.sansBold, fontSize: 12.5 },
  pillOutline: { backgroundColor: COLORS.card, borderWidth: 1.5, borderColor: COLORS.primary },
  pillOutlineText: { color: COLORS.primary, fontFamily: FONTS.sansBold, fontSize: 12.5 },
  feed: { gap: 10, marginBottom: 14 },
  loadingText: {
    fontFamily: FONTS.sans,
    fontSize: 13,
    color: COLORS.textMuted,
    paddingVertical: 12,
    textAlign: "center",
  },
  card: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 10,
    flexDirection: "row",
    gap: 12,
    ...SHADOW.soft,
  },
  cardPressed: { opacity: 0.92 },
  thumb: { width: 56, height: 56, borderRadius: 12, flexShrink: 0, backgroundColor: COLORS.surfaceMuted },
  thumbFallback: { alignItems: "center", justifyContent: "center" },
  cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  cardTitle: { flex: 1, fontFamily: FONTS.sansSemi, fontSize: 14, color: COLORS.text },
  cardMeta: { marginTop: 4, fontFamily: FONTS.sans, fontSize: 11.5, color: COLORS.textMuted },
  cardTime: { marginTop: 4, fontFamily: FONTS.sansMedium, fontSize: 10.5, color: "#98A2B3" },
});
