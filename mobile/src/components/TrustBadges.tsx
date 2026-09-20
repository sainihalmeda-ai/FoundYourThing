import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS, RADIUS } from "../constants/config";

const BADGES: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
}[] = [
  { icon: "shield-checkmark-outline", label: "VTU / TTS verified only" },
  { icon: "lock-closed-outline", label: "Consent-based contact sharing" },
];

export function TrustBadges() {
  return (
    <View style={styles.row}>
      {BADGES.map((badge) => (
        <View key={badge.label} style={styles.badge}>
          <Ionicons name={badge.icon} size={13} color={COLORS.accent} />
          <Text style={styles.text}>{badge.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(169,31,35,0.08)",
    borderWidth: 1,
    borderColor: "rgba(169,31,35,0.2)",
    borderRadius: RADIUS.pill,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  text: {
    fontFamily: FONTS.sansSemi,
    fontSize: 11,
    color: COLORS.accent,
  },
});
