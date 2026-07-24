import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useConnection } from "../context/ConnectionContext";
import { COLORS } from "../constants/config";

export function ConnectionBanner() {
  const { state, message, refresh, dismissSlow } = useConnection();

  if (state === "online" || state === "checking") {
    return null;
  }

  const background =
    state === "offline"
      ? COLORS.offline
      : state === "server_down"
        ? COLORS.danger
        : state === "slow"
          ? COLORS.warning
          : COLORS.warning;

  const title =
    state === "offline"
      ? "You are offline"
      : state === "server_down"
        ? "Server unavailable"
        : "Slow network";

  return (
    <View style={[styles.banner, { backgroundColor: background }]}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      <View style={styles.row}>
        <Pressable style={styles.button} onPress={refresh}>
          <Text style={styles.buttonText}>Retry connection</Text>
        </Pressable>
        {state === "slow" ? (
          <Pressable style={styles.button} onPress={dismissSlow}>
            <Text style={styles.buttonText}>Dismiss</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  message: {
    color: "#fff",
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
  },
  row: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  button: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 12,
  },
});
