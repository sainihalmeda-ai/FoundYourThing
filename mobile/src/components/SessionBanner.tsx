import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { COLORS, FONTS, RADIUS, SESSION_WARN_MS } from "../constants/config";

function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

/** Compact secure-session pill (Campus Connect style). */
export function SessionBanner() {
  const { token, remainingMs, isExpiringSoon } = useAuth();

  if (!token) return null;

  const urgent = isExpiringSoon || remainingMs <= SESSION_WARN_MS;

  return (
    <View style={[styles.pill, urgent && styles.pillUrgent]}>
      <Ionicons
        name={urgent ? "time-outline" : "shield-checkmark"}
        size={14}
        color={urgent ? COLORS.danger : COLORS.accent}
      />
      <Text style={[styles.text, urgent && styles.textUrgent]}>
        Secure · {formatRemaining(remainingMs)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pillUrgent: {
    borderColor: "rgba(239,68,68,0.25)",
  },
  text: {
    fontFamily: FONTS.sansMedium,
    fontSize: 11,
    color: COLORS.textMuted,
  },
  textUrgent: {
    color: COLORS.danger,
  },
});
