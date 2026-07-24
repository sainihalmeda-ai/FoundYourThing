import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import { COLORS, SESSION_DURATION_MS, SESSION_WARN_MS } from "../constants/config";

function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/** Top-of-screen countdown for the 10-minute login session. */
export function SessionBanner() {
  const { token, remainingMs, isExpiringSoon } = useAuth();

  if (!token) return null;

  const progress = Math.min(1, remainingMs / SESSION_DURATION_MS);
  const urgent = isExpiringSoon || remainingMs <= SESSION_WARN_MS;

  return (
    <View style={[styles.banner, urgent && styles.bannerUrgent]}>
      <View style={styles.row}>
        <Text style={styles.label}>Session</Text>
        <Text style={[styles.time, urgent && styles.timeUrgent]}>
          {formatRemaining(remainingMs)} left
        </Text>
      </View>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            { width: `${Math.max(2, progress * 100)}%` },
            urgent && styles.fillUrgent,
          ]}
        />
      </View>
      <Text style={styles.hint}>
        {urgent
          ? "Session ending soon — choose Continue to stay signed in."
          : "Your session lasts 10 minutes. You’ll get a reminder before it ends."}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: COLORS.primaryDark,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
  },
  bannerUrgent: {
    backgroundColor: "#8A4B08",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  time: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
    fontVariant: ["tabular-nums"],
  },
  timeUrgent: {
    color: "#FFE8A3",
  },
  track: {
    marginTop: 8,
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.25)",
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: COLORS.accent,
  },
  fillUrgent: {
    backgroundColor: COLORS.warning,
  },
  hint: {
    marginTop: 8,
    color: "rgba(255,255,255,0.85)",
    fontSize: 11,
    lineHeight: 16,
  },
});
