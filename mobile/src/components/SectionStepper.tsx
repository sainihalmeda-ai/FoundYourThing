import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS, RADIUS } from "../constants/config";

/**
 * Explicit "go to the other section" control — Lost & Found and Campus
 * Safety are deliberately separate interfaces (per the two-poster chooser),
 * so neither has a shared nav to switch between them. Without this, the
 * only way back was an unlabeled home icon or a native back gesture that
 * doesn't exist on web.
 */
export function SectionStepper({
  direction,
  label,
  onPress,
}: {
  direction: "back" | "forward";
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.pill, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`Switch to ${label}`}
    >
      {direction === "back" ? (
        <Ionicons name="chevron-back" size={14} color={COLORS.primary} />
      ) : null}
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
      {direction === "forward" ? (
        <Ionicons name="chevron-forward" size={14} color={COLORS.primary} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.pill,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  pressed: { opacity: 0.85 },
  label: {
    fontFamily: FONTS.sansSemi,
    fontSize: 12,
    color: COLORS.primary,
  },
});
