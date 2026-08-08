import React, { useCallback, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fetchIncomingClaims, respondClaim } from "../api/auth";
import { resolveImageUrl } from "../api/client";
import { ConnectionBanner } from "../components/ConnectionBanner";
import { ConnectionGate } from "../components/ConnectionGate";
import { DaylightBackdrop } from "../components/SpatialBackdrop";
import { ErrorState } from "../components/ErrorState";
import { HomeButton } from "../components/HomeButton";
import { LoadingOverlay } from "../components/LoadingOverlay";
import { MatchScore } from "../components/MatchScore";
import { PhotoView } from "../components/PhotoView";
import { AppButton, Badge } from "../components/Ui";
import { EmptyState, SuccessState } from "../components/states";
import { useAuth } from "../context/AuthContext";
import { dismissIncomingClaim } from "../lib/acceptedClaimNotices";
import { COLORS, FONTS, RADIUS, SHADOW } from "../constants/config";
import type { Claim } from "../types";
import { ApiError } from "../types";

export function ClaimsScreen() {
  const { token, user } = useAuth();
  const insets = useSafeAreaInsets();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [respondingId, setRespondingId] = useState<number | null>(null);
  const [success, setSuccess] = useState<{ title: string; message: string } | null>(null);
  const [photoSide, setPhotoSide] = useState<Record<number, "theirs" | "yours">>({});

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
          ? "Phone numbers are now visible to both parties. Please meet on campus."
          : "No contact details were shared. Phone numbers stay hidden.",
      });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err : new Error("Action failed. Try again."));
    } finally {
      setRespondingId(null);
    }
  };

  if (loading) {
    return (
      <LoadingOverlay label="Loading requests" hint="Checking claims waiting for you…" />
    );
  }
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
        <DaylightBackdrop />
        <ConnectionBanner />
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) + 8 }]}>
          <View style={styles.headerTop}>
            <View style={styles.headerText}>
              <Text style={styles.title} numberOfLines={2}>
                Incoming requests
              </Text>
              <Text style={styles.subtitle}>Verify carefully before sharing contact</Text>
            </View>
            <HomeButton />
          </View>
        </View>
        <FlatList
          data={claims}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            // Either side can start the conversation, so work out which report is yours.
            const iOwnLost = item.match.lost_item.reporter_vtu_id === user?.vtu_id;
            const yours = iOwnLost ? item.match.lost_item : item.match.found_item;
            const theirs = iOwnLost ? item.match.found_item : item.match.lost_item;
            const side = photoSide[item.id] ?? "theirs";
            const imageUrl = side === "theirs" ? theirs.image_url : yours.image_url;
            return (
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  <Badge label="Pending" tone="connected" />
                  <Text style={styles.claimFrom}>
                    {iOwnLost
                      ? `${item.counterparty.vtu_id} may have found your item`
                      : `Claim from ${item.counterparty.vtu_id}`}
                  </Text>
                </View>
                {item.counterparty.full_name ? (
                  <Text style={styles.maskedName}>{item.counterparty.full_name}</Text>
                ) : null}

                <View style={styles.photoToggle}>
                  {(["theirs", "yours"] as const).map((key) => (
                    <Pressable
                      key={key}
                      style={[styles.toggleItem, side === key && styles.toggleItemActive]}
                      onPress={() => setPhotoSide((prev) => ({ ...prev, [item.id]: key }))}
                    >
                      <Text style={[styles.toggleText, side === key && styles.toggleTextActive]}>
                        {key === "theirs" ? "Their photo" : "Your photo"}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <PhotoView uri={resolveImageUrl(imageUrl)} style={styles.photo} />

                <Text style={styles.itemTitle}>{theirs.title}</Text>
                <MatchScore percent={item.match.combined_score} />
                <Text style={styles.message}>{item.message || "No message"}</Text>

                <AppButton
                  label={respondingId === item.id ? "Working..." : "Accept & share"}
                  onPress={() => respond(item.id, true)}
                  disabled={respondingId === item.id}
                  loading={respondingId === item.id}
                />
                <AppButton
                  label="Reject"
                  onPress={() => respond(item.id, false)}
                  variant="danger"
                  disabled={respondingId === item.id}
                  style={{ marginTop: 10 }}
                />
              </View>
            );
          }}
          ListEmptyComponent={
            <EmptyState
              title="All clear"
              message="No pending claims right now. When someone claims an item you found, it shows up here."
              compact
            />
          }
        />
      </View>
    </ConnectionGate>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 10,
    zIndex: 2,
    backgroundColor: "transparent",
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  headerText: { flex: 1, minWidth: 0, paddingRight: 4 },
  title: {
    fontFamily: FONTS.display,
    fontSize: 26,
    color: COLORS.text,
    letterSpacing: -0.4,
    lineHeight: 32,
  },
  subtitle: {
    marginTop: 6,
    fontFamily: FONTS.sans,
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 18,
  },
  list: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24, flexGrow: 1 },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.soft,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 6,
  },
  claimFrom: {
    flex: 1,
    flexShrink: 1,
    minWidth: 140,
    fontFamily: FONTS.sansSemi,
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 18,
  },
  maskedName: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 10,
  },
  photoToggle: {
    flexDirection: "row",
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: RADIUS["2xl"],
    padding: 4,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  toggleItem: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: "center",
  },
  toggleItemActive: { backgroundColor: COLORS.card, ...SHADOW.soft },
  toggleText: {
    fontFamily: FONTS.sansMedium,
    fontSize: 12,
    color: COLORS.textMuted,
  },
  toggleTextActive: { color: COLORS.text, fontFamily: FONTS.sansSemi },
  photo: {
    width: "100%",
    height: 240,
    borderRadius: RADIUS["2xl"],
    marginBottom: 12,
  },
  itemTitle: {
    fontFamily: FONTS.sansSemi,
    fontSize: 16,
    color: COLORS.text,
  },
  meta: {
    marginTop: 4,
    fontFamily: FONTS.sans,
    color: COLORS.textMuted,
    fontSize: 13,
  },
  message: {
    marginVertical: 12,
    fontFamily: FONTS.sans,
    color: COLORS.text,
    lineHeight: 20,
  },
});
