import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { COLORS } from "../../constants/config";

type Props = {
  label?: string;
  compact?: boolean;
};

export function LoadingState({ label = "Loading...", compact = false }: Props) {
  return (
    <View style={[styles.container, compact && styles.compact]}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
    padding: 24,
  },
  compact: {
    flex: 0,
    paddingVertical: 40,
    backgroundColor: "transparent",
  },
  label: {
    marginTop: 14,
    color: COLORS.textMuted,
    fontSize: 15,
    fontWeight: "500",
  },
});
