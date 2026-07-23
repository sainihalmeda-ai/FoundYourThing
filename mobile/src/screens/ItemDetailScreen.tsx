import React, { useCallback, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { createClaim, fetchItem, fetchMatches } from "../api/auth";
import { resolveImageUrl } from "../api/client";
import { ConnectionBanner } from "../components/ConnectionBanner";
import { ErrorState } from "../components/ErrorState";
import { LoadingOverlay } from "../components/LoadingOverlay";
import { PrimaryButton, ScreenShell } from "../components/Ui";
import { useAuth } from "../context/AuthContext";
import { RootStackParamList } from "../navigation/types";
import { COLORS } from "../constants/config";
import type { Item, MatchResult } from "../types";
import { ApiError } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "ItemDetail">;

export function ItemDetailScreen({ route }: Props) {
  const { itemId } = route.params;
  const { token, user } = useAuth();
  const [item, setItem] = useState<Item | null>(null);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [claimingId, setClaimingId] = useState<number | null>(null);

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
      load();
    }, [load]),
  );

  const requestClaim = async (matchId: number) => {
    if (!token) return;
    setClaimingId(matchId);
    try {
      await createClaim(token, matchId, "This looks like my valuable item.");
      Alert.alert(
        "Request sent",
        "The finder will only see your VTU ID and masked name until they accept. Phone stays hidden until then.",
      );
      await load();
    } catch (err) {
      Alert.alert("Claim failed", err instanceof ApiError ? err.message : "Try again.");
    } finally {
      setClaimingId(null);
    }
  };

  if (loading) return <LoadingOverlay label="Loading item..." />;
  if (error || !item) return <ErrorState error={error ?? new Error("Item not found")} onRetry={load} />;

  const isOwner = user?.vtu_id === item.reporter_vtu_id;

  return (
    <View style={styles.root}>
      <ConnectionBanner />
      <ScrollView>
        <ScreenShell title={item.title} subtitle={`${item.category_label} · ${item.location}`}>
          <Image source={{ uri: resolveImageUrl(item.image_url) }} style={styles.image} />
          <Text style={styles.meta}>Status: {item.status}</Text>
          <Text style={styles.meta}>Reporter VTU ID: {item.reporter_vtu_id}</Text>
          {item.reporter_name ? <Text style={styles.meta}>Name: {item.reporter_name}</Text> : null}
          {item.reporter_phone ? <Text style={styles.phone}>Phone: {item.reporter_phone}</Text> : null}
          <Text style={styles.description}>{item.description || "No extra details provided."}</Text>

          <Text style={styles.sectionTitle}>AI possible matches</Text>
          {matches.length === 0 ? (
            <Text style={styles.empty}>No strong matches yet. Check back when more reports arrive.</Text>
          ) : (
            matches.map((match) => (
              <View key={match.id} style={styles.matchCard}>
                <Text style={styles.score}>{match.combined_score}% possible match</Text>
                <Text style={styles.meta}>Other party: {match.counterparty.vtu_id}</Text>
                {match.counterparty.full_name ? (
                  <Text style={styles.meta}>Name: {match.counterparty.full_name}</Text>
                ) : null}
                {match.counterparty.phone ? (
                  <Text style={styles.phone}>Phone: {match.counterparty.phone}</Text>
                ) : null}
                <Text style={styles.meta}>{match.counterparty_item.title}</Text>
                {item.item_type === "lost" && isOwner && !match.claim_status ? (
                  <PrimaryButton
                    label={claimingId === match.id ? "Sending..." : "This is mine — request contact"}
                    onPress={() => requestClaim(match.id)}
                    disabled={claimingId === match.id}
                  />
                ) : null}
                {match.claim_status ? (
                  <Text style={styles.claimStatus}>Claim status: {match.claim_status}</Text>
                ) : null}
              </View>
            ))
          )}
        </ScreenShell>
      </ScrollView>
    </View>
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
  empty: { color: COLORS.textMuted },
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
});
