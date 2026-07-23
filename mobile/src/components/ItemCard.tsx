import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { resolveImageUrl } from "../api/client";
import type { Item } from "../types";
import { COLORS } from "../constants/config";

export function ItemCard({
  item,
  onPress,
}: {
  item: Item;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <Image source={{ uri: resolveImageUrl(item.image_url) }} style={styles.image} />
      <View style={styles.content}>
        <Text style={styles.badge}>{item.item_type === "lost" ? "LOST" : "FOUND"}</Text>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.meta}>{item.category_label} · {item.location}</Text>
        <Text style={styles.vtu}>Reporter: {item.reporter_vtu_id}</Text>
        {item.is_urgent ? <Text style={styles.urgent}>Urgent valuable</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  image: {
    width: 96,
    height: 96,
    backgroundColor: "#EEF2F7",
  },
  content: {
    flex: 1,
    padding: 12,
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#E6F0FF",
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: "700",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    overflow: "hidden",
  },
  title: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },
  meta: {
    marginTop: 4,
    color: COLORS.textMuted,
    fontSize: 13,
  },
  vtu: {
    marginTop: 6,
    color: COLORS.primaryDark,
    fontWeight: "600",
    fontSize: 13,
  },
  urgent: {
    marginTop: 4,
    color: COLORS.warning,
    fontWeight: "700",
    fontSize: 12,
  },
});
