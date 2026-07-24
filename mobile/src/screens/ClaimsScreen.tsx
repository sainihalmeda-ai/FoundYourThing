import React, { useCallback, useState } from "react";
import { FlatList, Image, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { fetchIncomingClaims, respondClaim } from "../api/auth";
import { resolveImageUrl } from "../api/client";
import { ConnectionBanner } from "../components/ConnectionBanner";
import { ConnectionGate } from "../components/ConnectionGate";
import { ErrorState } from "../components/ErrorState";
import { LoadingOverlay } from "../components/LoadingOverlay";
import { PrimaryButton, ScreenShell, SecondaryButton } from "../components/Ui";
import { EmptyState, SuccessState } from "../components/states";
import { useAuth } from "../context/AuthContext";
import { dismissIncomingClaim } from "../lib/acceptedClaimNotices";
import { COLORS } from "../constants/config";
import type { Claim } from "../types";
import { ApiError } from "../types";

export function ClaimsScreen() {
  const { token } = useAuth();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [respondingId, setRespondingId] = useState<number | null>(null);
  const [success, setSuccess] = useState<{ title: string; message: string } | null>(null);

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
      setSuccess(null);
      load();
    }, [load]),
  );

  const respond = async (claimId: number, accept: boolean) => {
    if (!token) return;
    setRespondingId(claimId);
    try {
      await respondClaim(token, claimId, accept);
      await dismissIncomingClaim(claimId);
      setSuccess({
        title: accept ? "Contact shared" : "Request rejected",
        message: accept
          ? "Phone numbers are now visible to both parties."
          : "No contact details were shared. Phone numbers stay hidden.",
      });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err : new Error("Action failed. Try again."));
    } finally {
      setRespondingId(null);
    }
  };

  if (loading) return <LoadingOverlay label="Loading requests..." />;
  if (error) return <ErrorState error={error} onRetry={() => { setError(null); load(); }} />;
  if (success) {
    return (
      <SuccessState
        title={success.title}
        message={success.message}
        actionLabel="Back to requests"
        onAction={() => setSuccess(null)}
      />
    );
  }

  return (
    <ConnectionGate>
      <View style={styles.root}>
        <ConnectionBanner />
        <ScreenShell
          title="Incoming requests"
          subtitle="Someone thinks you found their item. Compare the photos, then accept only if you trust the match."
        >
          <FlatList
            data={claims}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.photos}>
                  <View style={styles.photoWrap}>
                    <Image
                      source={{ uri: resolveImageUrl(item.match.lost_item.image_url) }}
                      style={styles.photo}
                    />
                    <Text style={styles.photoLabel}>Their lost</Text>
                  </View>
                  <View style={styles.photoWrap}>
                    <Image
                      source={{ uri: resolveImageUrl(item.match.found_item.image_url) }}
                      style={styles.photo}
                    />
                    <Text style={styles.photoLabel}>Your found</Text>
                  </View>
                </View>
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
            ListEmptyComponent={
              <EmptyState
                title="No pending requests"
                message="When someone claims an item you reported, it will show up here."
                compact
              />
            }
          />
        </ScreenShell>
      </View>
    </ConnectionGate>
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
  photos: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  photoWrap: { flex: 1 },
  photo: {
    width: "100%",
    height: 96,
    borderRadius: 10,
    backgroundColor: "#EEF2F7",
  },
  photoLabel: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textMuted,
    textAlign: "center",
  },
  title: { fontSize: 16, fontWeight: "800", color: COLORS.text },
  meta: { marginTop: 4, color: COLORS.textMuted },
  message: { marginVertical: 10, color: COLORS.text, lineHeight: 20 },
});
