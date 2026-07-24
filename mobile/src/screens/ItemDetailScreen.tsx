import React, { useCallback, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import {
  confirmClaimRecovered,
  createClaim,
  fetchItem,
  fetchMatches,
  reportClaimMismatch,
} from "../api/auth";
import { resolveImageUrl } from "../api/client";
import { ConnectionBanner } from "../components/ConnectionBanner";
import { ConnectionGate } from "../components/ConnectionGate";
import { ErrorState } from "../components/ErrorState";
import { LoadingOverlay } from "../components/LoadingOverlay";
import { PrimaryButton, ScreenShell, SecondaryButton } from "../components/Ui";
import { EmptyState, SuccessState } from "../components/states";
import { useAuth } from "../context/AuthContext";
import { RootStackParamList } from "../navigation/types";
import { COLORS } from "../constants/config";
import type { Item, MatchResult } from "../types";
import { ApiError } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "ItemDetail">;

export function ItemDetailScreen({ route, navigation }: Props) {
  const { itemId } = route.params;
  const { token, user } = useAuth();
  const [item, setItem] = useState<Item | null>(null);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [claimingId, setClaimingId] = useState<number | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [reopened, setReopened] = useState(false);
  const [recovered, setRecovered] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setError(null);
      const [itemData, matchData] = await Promise.all([
        fetchItem(token, itemId),
        fetchMatches(token, itemId),
      ]);
      setItem(itemData);
      setMatches(matchData);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [token, itemId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      setClaimSuccess(false);
      setReopened(false);
      setRecovered(false);
      load();
    }, [load]),
  );

  const requestClaim = async (matchId: number) => {
    if (!token) return;
    setClaimingId(matchId);
    try {
      await createClaim(token, matchId, "This looks like my valuable item.");
      setClaimSuccess(true);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err : new Error("Claim failed. Try again."));
    } finally {
      setClaimingId(null);
    }
  };

  const onMismatch = async (claimId: number) => {
    if (!token) return;
    setActionBusy(true);
    try {
      await reportClaimMismatch(token, claimId);
      setReopened(true);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err : new Error("Could not reopen reports."));
    } finally {
      setActionBusy(false);
    }
  };

  const onRecovered = async (claimId: number) => {
    if (!token) return;
    setActionBusy(true);
    try {
      await confirmClaimRecovered(token, claimId);
      setRecovered(true);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err : new Error("Could not close reports."));
    } finally {
      setActionBusy(false);
    }
  };

  if (loading) return <LoadingOverlay label="Loading item..." />;
  if (error || !item) {
    return <ErrorState error={error ?? new Error("Item not found")} onRetry={load} />;
  }

  if (claimSuccess) {
    return (
      <SuccessState
        title="Request sent"
        message="The finder will only see your VTU ID and masked name until they accept. Phone stays hidden until then."
        actionLabel="Back to item"
        onAction={() => setClaimSuccess(false)}
      />
    );
  }

  if (reopened) {
    return (
      <SuccessState
        title="Reports reopened"
        message="Both items are live on the campus feed again so other matches can appear. This pair will not reconnect automatically."
        actionLabel="Back to feed"
        onAction={() => navigation.navigate("Feed")}
        secondaryLabel="Stay on item"
        onSecondary={() => setReopened(false)}
      />
    );
  }

  if (recovered) {
    return (
      <SuccessState
        title="Marked returned"
        message="Claim status is done. The lost report was removed from history. The found report stays on campus feed as success history so students can trust the app."
        actionLabel="Back to feed"
        onAction={() => navigation.navigate("Feed")}
      />
    );
  }

  const isOwner = user?.vtu_id === item.reporter_vtu_id;
  const itemReturned = item.status === "recovered" || item.status === "closed";
  const canRaiseFromFound =
    item.item_type === "found" &&
    !isOwner &&
    !itemReturned &&
    item.status !== "connected" &&
    item.status !== "claim_pending";

  return (
    <ConnectionGate>
      <View style={styles.root}>
        <ConnectionBanner />
        <ScrollView>
          <ScreenShell title={item.title} subtitle={`${item.category_label} · ${item.location}`}>
            <Image source={{ uri: resolveImageUrl(item.image_url) }} style={styles.image} />
            <Text style={styles.meta}>Status: {item.status}</Text>
            <Text style={styles.meta}>Reporter VTU ID: {item.reporter_vtu_id}</Text>
            {item.reporter_name ? <Text style={styles.meta}>Name: {item.reporter_name}</Text> : null}
            {!itemReturned && item.reporter_phone ? (
              <Text style={styles.phone}>Phone: {item.reporter_phone}</Text>
            ) : null}
            <Text style={styles.description}>{item.description || "No extra details provided."}</Text>

            {canRaiseFromFound ? (
              <View style={styles.raiseBox}>
                <Text style={styles.resolveTitle}>Looks familiar?</Text>
                <Text style={styles.hint}>
                  You can raise a lost claim from here without browsing elsewhere. You’ll upload your photo and details, then the finder gets a request.
                </Text>
                <PrimaryButton
                  label="This is mine — raise lost claim"
                  onPress={() =>
                    navigation.navigate("Report", {
                      mode: "lost",
                      linkFoundId: item.id,
                    })
                  }
                />
              </View>
            ) : null}

            <Text style={styles.sectionTitle}>AI possible matches</Text>
            {matches.length === 0 ? (
              <EmptyState
                title="No strong matches yet"
                message="Check back when more lost or found reports arrive on campus."
                compact
              />
            ) : (
              matches.map((match) => {
                const canRequest =
                  item.item_type === "lost" &&
                  isOwner &&
                  !match.claim_status;
                const showResolve =
                  match.claim_status === "accepted" && Boolean(match.claim_id);
                const isDone = match.claim_status === "done";
                const showPhone = Boolean(match.counterparty.phone) && !isDone && !itemReturned;

                return (
                  <View key={match.id} style={styles.matchCard}>
                    <Text style={styles.score}>{match.combined_score}% possible match</Text>
                    <Text style={styles.meta}>Other party: {match.counterparty.vtu_id}</Text>
                    {match.counterparty.full_name ? (
                      <Text style={styles.meta}>Name: {match.counterparty.full_name}</Text>
                    ) : null}
                    {showPhone ? (
                      <Text style={styles.phone}>Phone: {match.counterparty.phone}</Text>
                    ) : null}
                    <Text style={styles.meta}>{match.counterparty_item.title}</Text>
                    {canRequest ? (
                      <PrimaryButton
                        label={claimingId === match.id ? "Sending..." : "This is mine — request contact"}
                        onPress={() => requestClaim(match.id)}
                        disabled={claimingId === match.id}
                      />
                    ) : null}
                    {match.claim_status && !isDone ? (
                      <Text style={styles.claimStatus}>Claim status: {match.claim_status}</Text>
                    ) : null}
                    {isDone ? (
                      <Text style={styles.doneStatus}>Claim status: done — item returned</Text>
                    ) : null}
                    {showResolve ? (
                      <View style={styles.resolveBox}>
                        <Text style={styles.resolveTitle}>Met in person?</Text>
                        <Text style={styles.hint}>
                          If this is the same item, mark it returned. The lost report will be removed; your found report stays as success history.
                        </Text>
                        <PrimaryButton
                          label={actionBusy ? "Working..." : "Same item — mark returned (done)"}
                          onPress={() => onRecovered(match.claim_id!)}
                          disabled={actionBusy}
                        />
                        <SecondaryButton
                          label="Not the same — reopen both reports"
                          onPress={() => onMismatch(match.claim_id!)}
                        />
                      </View>
                    ) : null}
                  </View>
                );
              })
            )}
          </ScreenShell>
        </ScrollView>
      </View>
    </ConnectionGate>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  image: {
    width: "100%",
    height: 220,
    borderRadius: 14,
    backgroundColor: "#EEF2F7",
    marginBottom: 12,
  },
  meta: { color: COLORS.textMuted, marginBottom: 4 },
  phone: { color: COLORS.success, fontWeight: "700", marginBottom: 4 },
  description: { marginTop: 8, color: COLORS.text, lineHeight: 21 },
  sectionTitle: {
    marginTop: 20,
    marginBottom: 10,
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.text,
  },
  matchCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  score: {
    color: COLORS.primary,
    fontWeight: "800",
    fontSize: 16,
    marginBottom: 6,
  },
  claimStatus: {
    marginTop: 8,
    color: COLORS.warning,
    fontWeight: "700",
  },
  doneStatus: {
    marginTop: 8,
    color: COLORS.success,
    fontWeight: "800",
  },
  hint: {
    marginTop: 8,
    color: COLORS.textMuted,
    lineHeight: 20,
    fontSize: 13,
  },
  resolveBox: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  raiseBox: {
    marginTop: 16,
    marginBottom: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  resolveTitle: {
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 4,
  },
});
