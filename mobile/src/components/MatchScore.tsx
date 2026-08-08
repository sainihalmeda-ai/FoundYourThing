import React from "react";
import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import { matchConfidence, MatchTone } from "../lib/matchConfidence";
import { COLORS, FONTS, RADIUS } from "../constants/config";

export const MATCH_TONE_COLORS: Record<MatchTone, { text: string; background: string }> = {
  strong: { text: COLORS.success, background: "rgba(34,197,94,0.12)" },
  fair: { text: COLORS.gold, background: "rgba(200,155,60,0.16)" },
  weak: { text: COLORS.danger, background: "rgba(239,68,68,0.12)" },
};

/** Percentage plus the plain-English caveat that goes with it. */
export function MatchScore({
  percent,
  style,
}: {
  percent: number;
  style?: StyleProp<ViewStyle>;
}) {
  const value = Math.round(percent);
  const { label, hint, tone } = matchConfidence(value);
  const palette = MATCH_TONE_COLORS[tone];

  return (
    <View style={style}>
      <View style={[styles.pill, { backgroundColor: palette.background }]}>
        <Text style={[styles.pillText, { color: palette.text }]}>
          {value}% photo match · {label}
        </Text>
      </View>
      <Text style={styles.hint}>{hint}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: "flex-start",
    borderRadius: RADIUS.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 6,
  },
  pillText: {
    fontFamily: FONTS.sansBold,
    fontSize: 12,
  },
  hint: {
    marginTop: 6,
    fontFamily: FONTS.sans,
    fontSize: 12,
    lineHeight: 17,
    color: COLORS.textMuted,
  },
});
