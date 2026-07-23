import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ApiError } from "../types";
import { COLORS } from "../constants/config";

type Props = {
  error: unknown;
  onRetry?: () => void;
};

function getMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong.";
}

function getHint(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.kind === "offline") {
      return "Check Wi‑Fi or mobile data, then tap Retry.";
    }
    if (error.kind === "timeout") {
      return "The server may be slow or your API URL may be wrong.";
    }
    if (error.kind === "server") {
      return "Backend error — verify Python server logs.";
    }
  }
  return "If this keeps happening, restart the app and backend.";
}

export function ErrorState({ error, onRetry }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Could not complete request</Text>
      <Text style={styles.message}>{getMessage(error)}</Text>
      <Text style={styles.hint}>{getHint(error)}</Text>
      {onRetry ? (
        <Pressable style={styles.button} onPress={onRetry}>
          <Text style={styles.buttonText}>Retry</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: COLORS.background,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    color: COLORS.danger,
    lineHeight: 22,
  },
  hint: {
    marginTop: 10,
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 20,
  },
  button: {
    marginTop: 18,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
  },
});
