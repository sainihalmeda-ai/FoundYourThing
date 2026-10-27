import React, { useCallback, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fetchIncomingClaims, respondClaim } from "../api/auth";
import { resolveImageUrl } from "../api/client";
import { ConnectionBanner } from "../components/ConnectionBanner";
import { DaylightBackdrop } from "../components/SpatialBackdrop";
import { ErrorState } from "../components/ErrorState";
import { HomeButton } from "../components/HomeButton";
import { MatchAnalyzer } from "../components/MatchAnalyzer";
import { useDesktopLayout } from "../lib/useDesktopLayout";
import { SidebarShell } from "../components/SidebarShell";
import { AppButton, Badge } from "../components/Ui";
import { EmptyState, SuccessState } from "../components/states";
import { useAuth } from "../context/AuthContext";
import { dismissIncomingClaim } from "../lib/acceptedClaimNotices";
import {
  COLORS,
  CONTENT_MAX_WIDTH,
  FONTS,
  RADIUS,
  SHADOW,
} from "../constants/config";
import type { Claim } from "../types";
import { ApiError } from "../types";

const VERIFY_TIPS = [
  "Compare both photos yourself — the score is only a guide.",
  "Ask about a mark only the real owner would know.",
  "Accepting shares both phone numbers. Meet on campus.",
];

export function ClaimsScreen() {
  const { token, user } = useAuth();
  const insets = useSafeAreaInsets();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [respondingId, setRespondingId] = useState<number | null>(null);
  const [success, setSuccess] = useState<{ title: string; message: string } | null>(null);
  const { wide, contentWidth } = useDesktopLayout();
  const stackCard = contentWidth < 880;

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
    // Refetch quietly on refocus — only the first visit shows a loader.
    useCallback(() => {
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
    <SidebarShell
      active="claims"
      pendingCount={claims.length}
      loading={loading}
      loadingLabel="Loading requests"
      loadingHint="Checking claims waiting for you…"
      backdrop={<DaylightBackdrop />}
    >
      <ConnectionBanner />
      <View
        style={[
          styles.header,
          { paddingTop: wide ? 24 : Math.max(insets.top, 12) + 8 },
          wide && styles.listWide,
        ]}
      >
        <View style={styles.headerTop}>
          <View style={styles.headerText}>
            <Text style={styles.title} numberOfLines={2}>
              Incoming requests
            </Text>
            <Text style={styles.subtitle}>Verify carefully before sharing contact</Text>
          </View>
          {wide ? null : <HomeButton />}
        </View>
      </View>
      <FlatList
        data={claims}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[styles.list, wide && styles.listWide]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => {
          // Either side can start the conversation, so work out which report is yours.
          const iOwnLost = item.match.lost_item.reporter_vtu_id === user?.vtu_id;
          const yours = iOwnLost ? item.match.lost_item : item.match.found_item;
          const theirs = iOwnLost ? item.match.found_item : item.match.lost_item;
          const busy = respondingId === item.id;

          const analysis = (
            <MatchAnalyzer
              leftUri={resolveImageUrl(theirs.image_url)}
              leftLabel="Their photo"
              rightUri={resolveImageUrl(yours.image_url)}
              rightLabel="Your photo"
              imageScore={item.match.image_score}
              textScore={item.match.text_score}
              combinedScore={item.match.combined_score}
              photoHeight={wide ? 250 : 150}
            />
          );

          const who = (
            <>
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
            </>
          );

          const message = (
            <View style={styles.messageBox}>
              <Ionicons name="chatbubble-ellipses-outline" size={14} color={COLORS.textMuted} />
              <Text style={styles.message}>{item.message || "No message"}</Text>
            </View>
          );

          const actions = (
            <>
              <AppButton
                label={busy ? "Working..." : "Accept & share"}
                onPress={() => respond(item.id, true)}
                disabled={busy}
                loading={busy}
              />
              <AppButton
                label="Reject"
                onPress={() => respond(item.id, false)}
                variant="danger"
                disabled={busy}
                style={{ marginTop: 10 }}
              />
            </>
          );

          if (wide) {
            return (
              <View style={[styles.card, styles.cardWide, stackCard && styles.cardWideStacked]}>
                <View style={styles.analysisCol}>{analysis}</View>
                <View style={styles.detailCol}>
                  {who}
                  <Text style={styles.itemLabel}>Their item</Text>
                  <Text style={styles.itemTitle}>{theirs.title}</Text>
                  <Text style={styles.meta}>
                    {theirs.category_label} · {theirs.location}
                  </Text>
                  <Text style={[styles.itemLabel, { marginTop: 10 }]}>Your report</Text>
                  <Text style={styles.meta}>{yours.title}</Text>
                  {message}
                  <View style={styles.tips}>
                    <Text style={styles.tipsTitle}>Before you accept</Text>
                    {VERIFY_TIPS.map((tip) => (
                      <View key={tip} style={styles.tipRow}>
                        <Ionicons name="checkmark" size={13} color={COLORS.primary} />
                        <Text style={styles.tipText}>{tip}</Text>
                      </View>
                    ))}
                  </View>
                  {actions}
                </View>
              </View>
            );
          }

          return (
            <View style={styles.card}>
              {who}
              {analysis}
              <Text style={[styles.itemTitle, { marginTop: 12 }]}>{theirs.title}</Text>
              {message}
              {actions}
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
    </SidebarShell>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 10,
    zIndex: 2,
    backgroundColor: "transparent",
    width: "100%",
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: "center",
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
  list: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    flexGrow: 1,
    width: "100%",
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: "center",
  },
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
  listWide: { maxWidth: 1180, paddingHorizontal: 28 },
  cardWide: { flexDirection: "row", gap: 24, padding: 20 },
  cardWideStacked: { flexDirection: "column" },
  analysisCol: { flex: 1.5, minWidth: 0 },
  detailCol: { flex: 1, minWidth: 0 },
  itemLabel: {
    marginTop: 6,
    fontFamily: FONTS.sansBold,
    fontSize: 10.5,
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  tips: {
    marginBottom: 14,
    padding: 12,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.divider,
    gap: 5,
  },
  tipsTitle: { fontFamily: FONTS.sansBold, fontSize: 12, color: COLORS.text, marginBottom: 2 },
  tipRow: { flexDirection: "row", gap: 6, alignItems: "flex-start" },
  tipText: { flex: 1, fontFamily: FONTS.sans, fontSize: 12, lineHeight: 17, color: COLORS.textMuted },
  messageBox: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
    marginVertical: 12,
    padding: 10,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surfaceMuted,
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
    flex: 1,
    fontFamily: FONTS.sans,
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 19,
  },
});
