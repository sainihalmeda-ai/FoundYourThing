import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useConnection } from "../context/ConnectionContext";
import { COLORS, FONTS, RADIUS } from "../constants/config";

export function ConnectionBanner() {
  const { state, refresh, dismissSlow } = useConnection();

  if (state === "online" || state === "checking") {
    return null;
  }

  const message =
    state === "offline"
      ? "You’re offline. Reports won’t upload until you’re back."
      : state === "server_down"
        ? "Server unavailable. Start the backend, then retry."
        : state === "slow"
          ? "Network is slow. Requests may take longer."
          : "Connection issue.";

  const title =
    state === "offline"
      ? "No internet"
      : state === "server_down"
        ? "Server unavailable"
        : "Slow network";

  return (
    <View style={styles.banner}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      <View style={styles.row}>
        <Pressable style={styles.button} onPress={refresh}>
          <Text style={styles.buttonText}>Retry</Text>
        </Pressable>
        {state === "slow" ? (
          <Pressable style={styles.button} onPress={dismissSlow}>
            <Text style={styles.buttonText}>Continue</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: COLORS.primaryDark,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    color: COLORS.primaryForeground,
    fontFamily: FONTS.sansBold,
    fontSize: 13,
  },
  message: {
    marginTop: 4,
    color: "rgba(251,248,241,0.85)",
    fontFamily: FONTS.sans,
    fontSize: 12,
    lineHeight: 17,
  },
  row: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  button: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: RADIUS.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  buttonText: {
    color: COLORS.primaryForeground,
    fontFamily: FONTS.sansSemi,
    fontSize: 12,
  },
});
