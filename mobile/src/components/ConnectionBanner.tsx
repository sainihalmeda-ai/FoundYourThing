import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useConnection } from "../context/ConnectionContext";
import { COLORS, FONTS, RADIUS } from "../constants/config";

export function ConnectionBanner() {
  const { state, refresh, dismissSlow } = useConnection();

  if (state === "online") {
    return null;
  }

  const message =
    state === "checking"
      ? "Waking campus server… first open after idle can take up to a minute."
      : state === "offline"
        ? "You’re offline. Reports won’t upload until you’re back."
        : state === "server_down"
          ? "Server sleeping or unreachable. Tap Retry and wait — free hosting wakes slowly."
          : state === "slow"
            ? "Network is slow. Requests may take longer."
            : "Connection issue.";

  const title =
    state === "checking"
      ? "Connecting"
      : state === "offline"
        ? "No internet"
        : state === "server_down"
          ? "Server unavailable"
          : "Slow network";

  return (
    <View style={styles.banner}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {state !== "checking" ? (
        <View style={styles.row}>
          <Pressable style={styles.button} onPress={() => void refresh({ coldStart: true })}>
            <Text style={styles.buttonText}>Retry</Text>
          </Pressable>
          {state === "slow" ? (
            <Pressable style={styles.button} onPress={dismissSlow}>
              <Text style={styles.buttonText}>Continue</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
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
