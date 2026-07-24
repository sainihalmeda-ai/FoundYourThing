import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { COLORS } from "../constants/config";
import { ApiError } from "../types";

/**
 * Center modal when the 10-minute session is almost over.
 * Continue = refresh token / extend session.
 * Proceed = end session and return to login.
 */
export function SessionExpiringModal() {
  const { isExpiringSoon, remainingMs, continueSession, logout } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isExpiringSoon) return null;

  const seconds = Math.max(0, Math.ceil(remainingMs / 1000));

  const onContinue = async () => {
    setBusy(true);
    setError(null);
    try {
      await continueSession();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not extend session. Please sign in again.",
      );
    } finally {
      setBusy(false);
    }
  };

  const onProceed = async () => {
    setBusy(true);
    await logout();
    setBusy(false);
  };

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Session almost over</Text>
          <Text style={styles.message}>
            Your login expires in about {seconds} second{seconds === 1 ? "" : "s"}.
            Continue to stay signed in for another 10 minutes, or proceed to sign out.
          </Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {busy ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 12 }} />
          ) : (
            <View style={styles.actions}>
              <Pressable style={styles.primary} onPress={onContinue}>
                <Text style={styles.primaryText}>Continue</Text>
              </Pressable>
              <Pressable style={styles.secondary} onPress={onProceed}>
                <Text style={styles.secondaryText}>Proceed</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(16, 42, 67, 0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 8,
    textAlign: "center",
  },
  message: {
    fontSize: 15,
    color: COLORS.textMuted,
    lineHeight: 22,
    textAlign: "center",
  },
  error: {
    marginTop: 12,
    color: COLORS.danger,
    textAlign: "center",
    fontSize: 13,
  },
  actions: {
    marginTop: 18,
    gap: 10,
  },
  primary: {
    backgroundColor: COLORS.primary,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  secondary: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
  },
  secondaryText: {
    color: COLORS.primary,
    fontWeight: "700",
    fontSize: 15,
  },
});
