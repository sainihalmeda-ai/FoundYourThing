import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { COLORS, FONTS, RADIUS, SHADOW } from "../constants/config";

type Stat = { label: string; value: number };

/** Live counts from the API — never fabricated placeholder numbers. */
export function StatsStrip({ stats, loading }: { stats: Stat[]; loading?: boolean }) {
  return (
    <View style={styles.panel}>
      <Text style={styles.panelTitle}>Live campus activity</Text>
      {stats.map((stat, index) => (
        <View key={stat.label} style={[styles.row, index === 0 && styles.rowFirst]}>
          <Text style={styles.label}>{stat.label}</Text>
          <Text style={styles.value}>{loading ? "—" : stat.value}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.xl,
    paddingHorizontal: 16,
    marginBottom: 20,
    ...SHADOW.soft,
  },
  panelTitle: {
    paddingTop: 14,
    paddingBottom: 8,
    fontFamily: FONTS.sansBold,
    fontSize: 11,
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  rowFirst: { borderTopWidth: 0 },
  label: {
    fontFamily: FONTS.sansMedium,
    fontSize: 13,
    color: COLORS.text,
  },
  value: {
    fontFamily: FONTS.display,
    fontSize: 17,
    color: COLORS.primary,
    letterSpacing: -0.3,
  },
});
