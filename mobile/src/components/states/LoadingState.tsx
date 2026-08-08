import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { COLORS, FONTS } from "../../constants/config";

type Props = {
  label?: string;
  hint?: string;
  compact?: boolean;
};

/** Boot / session restore — no Reanimated (native worklets crashed some APKs). */
export function LoadingState({
  label = "Loading...",
  hint,
  compact = false,
}: Props) {
  return (
    <View style={[styles.container, compact && styles.compact]}>
      <ActivityIndicator color={COLORS.accent} size="large" />
      <Text style={styles.label}>{label}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
    backgroundColor: COLORS.inkTop,
  },
  compact: {
    flex: 0,
    paddingVertical: 40,
    backgroundColor: "transparent",
  },
  label: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: FONTS.sansSemi,
    color: "#FFFFFF",
    textAlign: "center",
  },
  hint: {
    marginTop: 8,
    fontSize: 13,
    fontFamily: FONTS.sans,
    color: "rgba(255,255,255,0.72)",
    textAlign: "center",
    maxWidth: 280,
    lineHeight: 18,
  },
});
