import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { COLORS, FONTS, RADIUS, SHADOW } from "../constants/config";

type Stat = { label: string; value: number };

/** Live counts from the API — never fabricated placeholder numbers. */
export function StatsStrip({ stats, loading }: { stats: Stat[]; loading?: boolean }) {
  return (
    <View style={styles.row}>
      {stats.map((stat) => (
        <View key={stat.label} style={styles.tile}>
          <Text style={styles.value}>{loading ? "—" : stat.value}</Text>
          <Text style={styles.label}>{stat.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  tile: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.xl,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: "center",
    ...SHADOW.soft,
  },
  value: {
    fontFamily: FONTS.display,
    fontSize: 24,
    color: COLORS.primary,
    letterSpacing: -0.4,
  },
  label: {
    marginTop: 4,
    fontFamily: FONTS.sansMedium,
    fontSize: 10.5,
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: 13,
  },
});
