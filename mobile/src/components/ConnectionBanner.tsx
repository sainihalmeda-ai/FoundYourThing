import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useConnection } from "../context/ConnectionContext";
import { COLORS, FONTS, RADIUS } from "../constants/config";

/**
 * Every fresh page load re-checks the server from scratch (see
 * ConnectionContext), which is correct — Render's free tier really does
 * sleep. But a healthy local/warm server answers in well under a second,
 * so showing "Waking campus server…" immediately made every single
 * refresh flash a banner that read as a disconnect even when nothing was
 * ever down. Only show it once "checking" has actually run long enough
 * to plausibly be a real cold start.
 */
const CHECKING_BANNER_DELAY_MS = 900;

export function ConnectionBanner() {
  const { state, refresh, dismissSlow } = useConnection();
  const [showChecking, setShowChecking] = useState(false);

  useEffect(() => {
    if (state !== "checking") {
      setShowChecking(false);
      return;
    }
    const id = setTimeout(() => setShowChecking(true), CHECKING_BANNER_DELAY_MS);
    return () => clearTimeout(id);
  }, [state]);

  if (state === "online") {
    return null;
  }
  if (state === "checking" && !showChecking) {
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
