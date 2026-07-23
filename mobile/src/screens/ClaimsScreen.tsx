import React, { useCallback, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { fetchIncomingClaims, respondClaim } from "../api/auth";
import { ConnectionBanner } from "../components/ConnectionBanner";
import { ErrorState } from "../components/ErrorState";
import { LoadingOverlay } from "../components/LoadingOverlay";
import { PrimaryButton, ScreenShell, SecondaryButton } from "../components/Ui";
import { useAuth } from "../context/AuthContext";
import { RootStackParamList } from "../navigation/types";
import { COLORS } from "../constants/config";
import type { Claim } from "../types";
import { ApiError } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "Claims">;

export function ClaimsScreen(_props: Props) {
  const { token } = useAuth();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [respondingId, setRespondingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setError(null);
      setClaims(await fetchIncomingClaims(token));
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load]),
  );

  const respond = async (claimId: number, accept: boolean) => {
    if (!token) return;
    setRespondingId(claimId);
    try {
      await respondClaim(token, claimId, accept);
      Alert.alert(
        accept ? "Contact shared" : "Request rejected",
        accept
          ? "Phone numbers are now visible to both parties."
          : "No contact details were shared.",
      );
      await load();
    } catch (err) {
      Alert.alert("Action failed", err instanceof ApiError ? err.message : "Try again.");
    } finally {
      setRespondingId(null);
    }
  };

  if (loading) return <LoadingOverlay label="Loading requests..." />;
  if (error) return <ErrorState error={error} onRetry={load} />;

  return (
    <View style={styles.root}>
      <ConnectionBanner />
      <ScreenShell
        title="Incoming requests"
        subtitle="Someone thinks you found their item. Accept only if you trust the match."
      >
        <FlatList
          data={claims}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.title}>{item.match.lost_item.title}</Text>
              <Text style={styles.meta}>Claimant VTU ID: {item.counterparty.vtu_id}</Text>
              {item.counterparty.full_name ? (
                <Text style={styles.meta}>Name: {item.counterparty.full_name}</Text>
              ) : null}
              <Text style={styles.meta}>Match score: {item.match.combined_score}%</Text>
              <Text style={styles.message}>{item.message || "No message"}</Text>
              <PrimaryButton
                label={respondingId === item.id ? "Working..." : "Accept & share phone"}
                onPress={() => respond(item.id, true)}
                disabled={respondingId === item.id}
              />
              <SecondaryButton
                label="Reject"
                onPress={() => respond(item.id, false)}
              />
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No pending contact requests.</Text>}
        />
      </ScreenShell>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  title: { fontSize: 16, fontWeight: "800", color: COLORS.text },
  meta: { marginTop: 4, color: COLORS.textMuted },
  message: { marginVertical: 10, color: COLORS.text, lineHeight: 20 },
  empty: { color: COLORS.textMuted, marginTop: 8 },
});
