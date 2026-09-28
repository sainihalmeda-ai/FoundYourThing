import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS, RADIUS } from "../../constants/config";
import type { HomeLayout } from "../../lib/homeLayoutPreference";

const OPTIONS: { key: HomeLayout; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: "portal", label: "Portal", icon: "albums-outline" },
  { key: "grid", label: "Grid", icon: "grid-outline" },
  { key: "feed", label: "Feed", icon: "list-outline" },
];

/** Lets the pilot audience compare all three Home directions live. */
export function HomeLayoutSwitcher({
  value,
  onChange,
}: {
  value: HomeLayout;
  onChange: (layout: HomeLayout) => void;
}) {
  return (
    <View style={styles.row} accessibilityRole="tablist">
      {OPTIONS.map((opt) => {
        const active = opt.key === value;
        return (
          <Pressable
            key={opt.key}
            onPress={() => onChange(opt.key)}
            style={[styles.item, active && styles.itemActive]}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${opt.label} layout`}
          >
            <Ionicons
              name={opt.icon}
              size={13}
              color={active ? COLORS.primaryForeground : COLORS.textMuted}
            />
            <Text style={[styles.text, active && styles.textActive]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 4,
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.pill,
    padding: 3,
    alignSelf: "flex-start",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: RADIUS.pill,
  },
  itemActive: {
    backgroundColor: COLORS.primary,
  },
  text: {
    fontFamily: FONTS.sansSemi,
    fontSize: 11,
    color: COLORS.textMuted,
  },
  textActive: {
    color: COLORS.primaryForeground,
  },
});
