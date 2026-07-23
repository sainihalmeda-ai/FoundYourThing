import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useConnection } from "../context/ConnectionContext";
import { COLORS } from "../constants/config";

export function ConnectionBanner() {
  const { state, message, refresh } = useConnection();

  if (state === "online" || state === "checking") {
    return null;
  }

  const background =
    state === "offline" ? COLORS.offline : state === "server_down" ? COLORS.danger : COLORS.warning;

  return (
    <View style={[styles.banner, { backgroundColor: background }]}>
      <Text style={styles.title}>
        {state === "offline" ? "You are offline" : "Server unavailable"}
      </Text>
      <Text style={styles.message}>{message}</Text>
      <Pressable style={styles.button} onPress={refresh}>
        <Text style={styles.buttonText}>Retry connection</Text>
      </Pressable>
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
  button: {
    marginTop: 8,
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
