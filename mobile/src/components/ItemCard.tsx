import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { resolveImageUrl } from "../api/client";
import type { Item } from "../types";
import { timeAgo } from "../lib/timeAgo";
import { PhotoView } from "./PhotoView";
import { Badge } from "./Ui";
import { COLORS, FONTS, RADIUS, SHADOW } from "../constants/config";

export function ItemCard({
  item,
  onPress,
  isMine = false,
  onRaiseLostClaim,
  onAnswerLost,
  compact = false,
}: {
  item: Item;
  onPress: () => void;
  isMine?: boolean;
  /** Desktop grid card: smaller photo, one-line title, posted-ago row, short button labels. */
  compact?: boolean;
  onRaiseLostClaim?: () => void;
  onAnswerLost?: () => void;
}) {
  const open =
    !isMine &&
    item.status !== "recovered" &&
    item.status !== "connected" &&
    item.status !== "claim_pending";
  const canRaise = Boolean(onRaiseLostClaim) && item.item_type === "found" && open;
  const canAnswer = Boolean(onAnswerLost) && item.item_type === "lost" && open;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, compact && styles.cardCompact, pressed && { opacity: 0.94, transform: [{ scale: 0.99 }] }]}
      onPress={onPress}
    >
      <View style={styles.imageWrap}>
        <PhotoView
          uri={resolveImageUrl(item.image_url)}
          style={[styles.image, compact && styles.imageCompact]}
          expandable={false}
          fallbackLabel={item.title}
          fallbackHint={`${item.category_label} · ${item.location}`}
        />
        <View style={styles.badgeOverlay} pointerEvents="none">
          <Badge label={item.item_type === "lost" ? "Lost" : "Found"} tone={item.item_type} />
          {isMine ? <Badge label="Yours" tone="mine" /> : null}
          {item.status === "connected" ? <Badge label="Connected" tone="connected" /> : null}
          {item.status === "recovered" ? <Badge label="Returned" tone="returned" /> : null}
          {item.is_urgent ? <Badge label="Urgent" tone="urgent" /> : null}
        </View>
      </View>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={compact ? 1 : 2}>
          {item.title}
        </Text>
        <View style={styles.metaRow}>
          <View style={styles.metaLeft}>
            <Ionicons name="location-outline" size={13} color={COLORS.textMuted} />
            <Text style={styles.meta} numberOfLines={1}>
              {item.category_label} · {item.location}
            </Text>
          </View>
          {compact ? null : (
            <Text style={styles.vtu} numberOfLines={1}>
              {item.reporter_vtu_id}
            </Text>
          )}
        </View>
        {compact ? (
          <View style={styles.footRow}>
            <View style={styles.metaLeft}>
              <Ionicons name="person-outline" size={12} color={COLORS.textMuted} />
              <Text style={styles.vtu} numberOfLines={1}>
                {item.reporter_vtu_id}
              </Text>
            </View>
            <View style={styles.timeChip}>
              <Ionicons name="time-outline" size={11} color={COLORS.textMuted} />
              <Text style={styles.timeText}>{timeAgo(item.created_at)}</Text>
            </View>
          </View>
        ) : null}
        {canRaise ? (
          <Pressable
            style={[styles.claimBtn, compact && styles.claimBtnCompact]}
            onPress={(e) => {
              e.stopPropagation?.();
              onRaiseLostClaim?.();
            }}
          >
            <Text style={styles.claimBtnText}>
              {compact ? "This is mine — raise claim" : "This looks like mine — raise claim"}
            </Text>
          </Pressable>
        ) : null}
        {canAnswer ? (
          <Pressable
            style={[styles.claimBtn, compact && styles.claimBtnCompact]}
            onPress={(e) => {
              e.stopPropagation?.();
              onAnswerLost?.();
            }}
          >
            <Text style={styles.claimBtnText}>
              {compact ? "I found this — tell the owner" : "Looks like I found it — raise found report"}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    ...SHADOW.soft,
  },
  cardCompact: { marginBottom: 0, padding: 10 },
  imageCompact: { height: 150 },
  footRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 8,
  },
  timeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surfaceMuted,
  },
  timeText: { fontFamily: FONTS.sansMedium, fontSize: 10.5, color: COLORS.textMuted },
  claimBtnCompact: { marginTop: 10, paddingVertical: 9 },
  imageWrap: {
    position: "relative",
    borderRadius: RADIUS.xl,
    overflow: "hidden",
    backgroundColor: COLORS.surfaceMuted,
  },
  image: {
    width: "100%",
    height: 180,
  },
  badgeOverlay: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  content: { paddingHorizontal: 8, paddingTop: 14, paddingBottom: 6 },
  title: {
    fontSize: 15,
    fontFamily: FONTS.sansSemi,
    color: COLORS.text,
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 10,
  },
  metaLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  meta: {
    flex: 1,
    color: COLORS.textMuted,
    fontSize: 12,
    fontFamily: FONTS.sans,
  },
  vtu: {
    color: COLORS.textMuted,
    fontFamily: FONTS.sansMedium,
    fontSize: 11,
    letterSpacing: -0.2,
  },
  claimBtn: {
    marginTop: 12,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xl,
    paddingVertical: 11,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  claimBtnText: {
    color: COLORS.primaryForeground,
    fontFamily: FONTS.sansBold,
    fontSize: 12,
    textAlign: "center",
  },
});
