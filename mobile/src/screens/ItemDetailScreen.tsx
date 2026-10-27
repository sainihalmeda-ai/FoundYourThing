import React, { useCallback, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
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
import { DesktopCard, DesktopPage } from "../components/DesktopPage";
import { ErrorState } from "../components/ErrorState";
import { LoadingOverlay } from "../components/LoadingOverlay";
import { MATCH_TONE_COLORS, MatchScore } from "../components/MatchScore";
import { PhotoView } from "../components/PhotoView";
import { SidebarShell } from "../components/SidebarShell";
import { AppButton, Badge } from "../components/Ui";
import { EmptyState, SuccessState } from "../components/states";
import { useAuth } from "../context/AuthContext";
import { matchConfidence } from "../lib/matchConfidence";
import { timeAgo } from "../lib/timeAgo";
import { RootStackParamList } from "../navigation/types";
import {
  COLORS,
  CONTENT_MAX_WIDTH,
  FONTS,
  RADIUS,
  SHADOW,
  WIDE_BREAKPOINT,
} from "../constants/config";
import type { Item, MatchResult } from "../types";
import { ApiError } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "ItemDetail">;

const STATUS_LABEL: Record<string, string> = {
  open: "Open",
  matched: "Possible match found",
  claim_pending: "Claim pending",
  connected: "Owner and finder connected",
  recovered: "Returned to owner",
  closed: "Closed",
};

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 6) return phone;
  return `${digits.slice(0, 2)}•••• ${digits.slice(-4)}`;
}

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
  const [showPhone, setShowPhone] = useState(false);
  const [revealPhone, setRevealPhone] = useState(false);
  const { width } = useWindowDimensions();
  const wide = width >= WIDE_BREAKPOINT;

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
      setRevealPhone(false);
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

  if (loading && !wide) {
    return (
      <LoadingOverlay label="Loading item" hint="Pulling details and possible matches…" />
    );
  }
  if (error || (!item && !loading)) {
    return <ErrorState error={error ?? new Error("Item not found")} onRetry={load} />;
  }

  /** Desktop keeps the sidebar around full-page states too. */
  const page = (node: React.ReactNode) =>
    wide ? (
      <SidebarShell active="feed" loading={loading && !item}>
        {node}
      </SidebarShell>
    ) : (
      <>{node}</>
    );

  if (!item) return page(null); // Desktop first load — SidebarShell shows its spinner.

  if (claimSuccess) {
    return page(
      <SuccessState
        title="Request sent"
        message="The finder will only see your VTU ID and masked name until they accept. Phone stays hidden until then."
        actionLabel="Back to item"
        onAction={() => setClaimSuccess(false)}
      />,
    );
  }

  if (reopened) {
    return page(
      <SuccessState
        title="Reports reopened"
        message="Both items are live on the campus feed again so other matches can appear."
        actionLabel="Back to feed"
        onAction={() => navigation.navigate("MainTabs", { screen: "FeedTab" })}
        secondaryLabel="Stay on item"
        onSecondary={() => setReopened(false)}
      />,
    );
  }

  if (recovered) {
    return page(
      <SuccessState
        title="Marked returned"
        message="Claim status is done. Contact details are hidden again. Found report stays as campus trust history."
        actionLabel="Back to feed"
        onAction={() => navigation.navigate("MainTabs", { screen: "FeedTab" })}
      />,
    );
  }

  const isOwner = user?.vtu_id === item.reporter_vtu_id;
  const itemReturned = item.status === "recovered" || item.status === "closed";
  const openToAnswer =
    !isOwner &&
    !itemReturned &&
    item.status !== "connected" &&
    item.status !== "claim_pending";
  const canRaiseFromFound = item.item_type === "found" && openToAnswer;
  /** Someone browsing the feed recognises a lost item they picked up. */
  const canAnswerLost = item.item_type === "lost" && openToAnswer;

  const unlockedPhone =
    !itemReturned && (item.reporter_phone || matches.some((m) => m.counterparty.phone && m.claim_status === "accepted"));

  // ---- Page pieces, arranged below as one column (phone) or two (desktop) ----

  const badges = (
    <View style={styles.badgeRow}>
      <Badge label={item.item_type === "lost" ? "Lost" : "Found"} tone={item.item_type} />
      {itemReturned ? <Badge label="Returned" tone="returned" /> : null}
      {item.status === "connected" ? <Badge label="Connected" tone="connected" /> : null}
      {item.is_urgent && !itemReturned ? <Badge label="Urgent" tone="urgent" /> : null}
      {isOwner ? <Badge label="Yours" tone="mine" /> : null}
    </View>
  );

  const heroPhoto = (style: object) => (
    <PhotoView
      uri={resolveImageUrl(item.image_url)}
      style={style}
      fallbackLabel={item.title}
      fallbackHint={`${item.category_label} · ${item.location} — identify from details below`}
    />
  );

  const returnedNote = itemReturned ? (
    <View style={styles.returnedNote}>
      <Ionicons name="shield-checkmark" size={16} color={COLORS.success} />
      <Text style={styles.returnedText}>
        Returned to owner. Contact details are hidden — kept as trust history.
      </Text>
    </View>
  ) : null;

  const reporterPhone =
    !itemReturned && item.reporter_phone ? (
      <Pressable
        style={styles.phoneCard}
        onPress={() => {
          setShowPhone(true);
          setRevealPhone(true);
        }}
      >
        <Ionicons name="call" size={18} color={COLORS.accent} />
        <View style={{ flex: 1 }}>
          <Text style={styles.phoneLabel}>Contact unlocked</Text>
          <Text style={styles.phoneValue}>
            {revealPhone ? item.reporter_phone : maskPhone(item.reporter_phone)}
          </Text>
        </View>
        <Text style={styles.reveal}>{revealPhone ? "Hide" : "Show"}</Text>
      </Pressable>
    ) : null;

  const description = (
    <Text style={styles.description}>{item.description || "No extra details provided."}</Text>
  );

  const raiseBoxes = (
    <>
      {canRaiseFromFound ? (
        <View style={styles.raiseBox}>
          <Text style={[styles.sectionTitle, styles.raiseTitle]}>Looks familiar?</Text>
          <Text style={styles.hint}>
            Raise a lost claim with your photo. The finder will compare both images.
          </Text>
          <AppButton
            label="This looks like mine — raise claim"
            onPress={() => navigation.navigate("Report", { mode: "lost", linkFoundId: item.id })}
          />
        </View>
      ) : null}
      {canAnswerLost ? (
        <View style={styles.raiseBox}>
          <Text style={[styles.sectionTitle, styles.raiseTitle]}>Did you pick this up?</Text>
          <Text style={styles.hint}>
            Post a found report with your photo. The owner compares both images and decides —
            your phone number stays hidden until they accept.
          </Text>
          <AppButton
            label="Looks like I found it — raise found report"
            onPress={() => navigation.navigate("Report", { mode: "found", linkLostId: item.id })}
          />
        </View>
      ) : null}
    </>
  );

  const matchList =
    matches.length === 0 ? (
      <EmptyState
        title="No strong matches yet"
        message="Check back when more lost or found reports arrive on campus."
        compact
      />
    ) : (
      matches.map((match) => {
        const canRequest = item.item_type === "lost" && isOwner && !match.claim_status;
        const showResolve = match.claim_status === "accepted" && Boolean(match.claim_id);
        const isDone = match.claim_status === "done";
        const phoneOk = Boolean(match.counterparty.phone) && !isDone && !itemReturned;
        const palette = MATCH_TONE_COLORS[matchConfidence(match.combined_score).tone];

        return (
          <View key={match.id} style={styles.matchCard}>
            <View style={styles.scoreRow}>
              <View
                style={[
                  styles.scoreRing,
                  { backgroundColor: palette.background, borderColor: palette.text },
                ]}
              >
                <Text style={[styles.scoreNum, { color: palette.text }]}>
                  {Math.round(match.combined_score)}
                </Text>
                <Text style={[styles.scorePct, { color: palette.text }]}>%</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.matchTitle}>{match.counterparty_item.title}</Text>
                <Text style={styles.meta}>Other party · {match.counterparty.vtu_id}</Text>
                {match.counterparty.full_name ? (
                  <Text style={styles.meta}>Name · {match.counterparty.full_name}</Text>
                ) : null}
              </View>
            </View>
            <MatchScore percent={match.combined_score} />

            {phoneOk ? (
              <Pressable
                style={styles.phoneCard}
                onPress={() => {
                  setShowPhone(true);
                  setRevealPhone(true);
                }}
              >
                <Ionicons name="call" size={18} color={COLORS.accent} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.phoneLabel}>Contact unlocked</Text>
                  <Text style={styles.phoneValue}>
                    {revealPhone ? match.counterparty.phone : maskPhone(match.counterparty.phone!)}
                  </Text>
                </View>
              </Pressable>
            ) : null}

            {canRequest ? (
              <AppButton
                label={claimingId === match.id ? "Sending..." : "This is mine — request contact"}
                onPress={() => requestClaim(match.id)}
                disabled={claimingId === match.id}
                loading={claimingId === match.id}
                style={{ marginTop: 10 }}
              />
            ) : null}
            {match.claim_status && !isDone ? (
              <Text style={styles.claimStatus}>Claim · {match.claim_status}</Text>
            ) : null}
            {isDone ? <Text style={styles.doneStatus}>Done — item returned</Text> : null}
            {showResolve ? (
              <View style={styles.resolveBox}>
                <Text style={styles.resolveTitle}>Met in person?</Text>
                <Text style={styles.hint}>
                  Mark returned to hide contact again. Lost report closes; found stays as history.
                </Text>
                <AppButton
                  label={actionBusy ? "Working..." : "Same item — mark returned"}
                  onPress={() => onRecovered(match.claim_id!)}
                  disabled={actionBusy}
                  variant="gold"
                />
                <AppButton
                  label="Not the same — reopen"
                  onPress={() => onMismatch(match.claim_id!)}
                  variant="ghost"
                  style={{ marginTop: 8 }}
                />
              </View>
            ) : null}
          </View>
        );
      })
    );

  const phoneModal = (
    <Modal visible={showPhone && Boolean(unlockedPhone)} transparent animationType="fade">
      <Pressable style={styles.modalBackdrop} onPress={() => setShowPhone(false)}>
        <View style={styles.modalCard}>
          <Ionicons name="checkmark-circle" size={28} color={COLORS.gold} />
          <Text style={styles.modalTitle}>Contact unlocked</Text>
          <Text style={styles.modalBody}>Please meet on campus to complete the handover.</Text>
          <AppButton label="Got it" onPress={() => setShowPhone(false)} />
        </View>
      </Pressable>
    </Modal>
  );

  if (wide) {
    const facts: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }[] = [
      { icon: "pricetag-outline", label: "Category", value: item.category_label },
      { icon: "location-outline", label: "Location", value: item.location },
      { icon: "pulse-outline", label: "Status", value: STATUS_LABEL[item.status] ?? item.status },
      {
        icon: "person-outline",
        label: "Reported by",
        value: item.reporter_name
          ? `${item.reporter_name} · ${item.reporter_vtu_id}`
          : item.reporter_vtu_id,
      },
      {
        icon: "calendar-outline",
        label: "Posted",
        value: `${new Date(item.created_at).toLocaleDateString()} · ${timeAgo(item.created_at)}`,
      },
      {
        icon: "sparkles-outline",
        label: "AI matches",
        value: matches.length === 1 ? "1 possible match" : `${matches.length} possible matches`,
      },
    ];

    return (
      <DesktopPage
        active="feed"
        eyebrow={`Lost & Found · ${item.item_type === "lost" ? "Lost" : "Found"} item`}
        title={item.title}
        subtitle={`${item.category_label} · ${item.location} · posted ${timeAgo(item.created_at).toLowerCase()}`}
        headerRight={badges}
        sideWidth={420}
        overlay={phoneModal}
        main={
          <>
            <DesktopCard>{heroPhoto(styles.deskPhoto)}</DesktopCard>
            <DesktopCard>
              <Text style={styles.deskCardTitle}>Details</Text>
              <View style={styles.factGrid}>
                {facts.map((f) => (
                  <View key={f.label} style={styles.fact}>
                    <View style={styles.factIcon}>
                      <Ionicons name={f.icon} size={15} color={COLORS.primary} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.factLabel}>{f.label}</Text>
                      <Text style={styles.factValue} numberOfLines={2}>
                        {f.value}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
              <Text style={styles.factLabel}>Description</Text>
              {description}
              {returnedNote}
              {reporterPhone}
            </DesktopCard>
          </>
        }
        side={
          <>
            {raiseBoxes}
            <DesktopCard>
              <View style={styles.matchHeader}>
                <Text style={styles.deskCardTitle}>AI possible matches</Text>
                <View style={styles.countPill}>
                  <Text style={styles.countPillText}>{matches.length}</Text>
                </View>
              </View>
              {matchList}
            </DesktopCard>
            <View style={styles.privacyCard}>
              <Ionicons name="lock-closed-outline" size={15} color={COLORS.primary} />
              <Text style={styles.privacyText}>
                Only VTU IDs are shown here. Phone numbers are shared only after the finder
                accepts a request, and hidden again once the item is returned.
              </Text>
            </View>
          </>
        }
      />
    );
  }

  return (
    <ConnectionGate>
      <View style={styles.root}>
        <ConnectionBanner />
        <ScrollView contentContainerStyle={styles.scroll}>
          {heroPhoto(styles.hero)}
          <View style={styles.sheet}>
            {badges}
            <Text style={styles.title}>{item.title}</Text>
            <View style={styles.metaRow}>
              <Ionicons name="location-outline" size={14} color={COLORS.textMuted} />
              <Text style={styles.meta}>
                {item.category_label} · {item.location}
              </Text>
            </View>
            <Text style={[styles.meta, styles.reporterMeta]}>
              Reporter · {item.reporter_vtu_id}
            </Text>
            {item.reporter_name ? (
              <Text style={styles.meta}>Name · {item.reporter_name}</Text>
            ) : null}
            {returnedNote}
            {reporterPhone}
            {description}
            {raiseBoxes}
            <Text style={styles.sectionTitle}>AI possible matches</Text>
            {matchList}
          </View>
        </ScrollView>
        {phoneModal}
      </View>
    </ConnectionGate>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  deskCardTitle: { fontFamily: FONTS.displayMedium, fontSize: 17, color: COLORS.text },
  deskPhoto: { width: "100%", height: 340, borderRadius: RADIUS.lg },
  factGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 12, marginBottom: 16 },
  fact: {
    width: "31.5%",
    flexGrow: 1,
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    padding: 10,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  factIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: COLORS.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  factLabel: {
    fontFamily: FONTS.sansBold,
    fontSize: 10.5,
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  factValue: { marginTop: 2, fontFamily: FONTS.sansSemi, fontSize: 13, color: COLORS.text },
  matchHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  countPill: {
    minWidth: 24,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: "center",
  },
  countPillText: { fontFamily: FONTS.sansBold, fontSize: 11.5, color: "#fff" },
  privacyCard: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    padding: 14,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.surfaceMuted,
  },
  privacyText: {
    flex: 1,
    fontFamily: FONTS.sans,
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.textMuted,
  },
  raiseTitle: { marginTop: 0 },
  scroll: {
    paddingBottom: 40,
    width: "100%",
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: "center",
  },
  hero: {
    width: "100%",
    height: 320,
    paddingBottom: 28,
  },
  sheet: {
    marginTop: -28,
    marginHorizontal: 16,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.lift,
  },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 10 },
  title: {
    fontFamily: FONTS.display,
    fontSize: 24,
    color: COLORS.text,
    letterSpacing: -0.4,
  },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8 },
  meta: {
    marginTop: 4,
    color: COLORS.textMuted,
    fontFamily: FONTS.sans,
    fontSize: 13,
  },
  reporterMeta: { marginTop: 10 },
  description: {
    marginTop: 14,
    color: COLORS.text,
    lineHeight: 22,
    fontFamily: FONTS.sans,
  },
  returnedNote: {
    marginTop: 12,
    flexDirection: "row",
    gap: 8,
    backgroundColor: "rgba(34,197,94,0.12)",
    borderRadius: RADIUS.xl,
    padding: 12,
  },
  returnedText: {
    flex: 1,
    fontFamily: FONTS.sansMedium,
    fontSize: 13,
    color: COLORS.success,
    lineHeight: 18,
  },
  phoneCard: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(0,156,165,0.1)",
    borderRadius: RADIUS["2xl"],
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(0,156,165,0.25)",
  },
  phoneLabel: {
    fontFamily: FONTS.sansSemi,
    fontSize: 12,
    color: COLORS.accent,
  },
  phoneValue: {
    fontFamily: FONTS.sansBold,
    fontSize: 16,
    color: COLORS.text,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  reveal: {
    fontFamily: FONTS.sansSemi,
    fontSize: 12,
    color: COLORS.primary,
  },
  sectionTitle: {
    marginTop: 22,
    marginBottom: 10,
    fontSize: 20,
    fontFamily: FONTS.displayMedium,
    color: COLORS.text,
  },
  matchCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  scoreRow: { flexDirection: "row", gap: 12, alignItems: "center" },
  scoreRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,156,165,0.08)",
  },
  scoreNum: {
    fontFamily: FONTS.display,
    fontSize: 18,
    color: COLORS.primary,
    lineHeight: 20,
  },
  scorePct: {
    fontFamily: FONTS.sansBold,
    fontSize: 10,
    color: COLORS.accent,
    marginTop: -2,
  },
  matchTitle: {
    fontFamily: FONTS.sansBold,
    fontSize: 15,
    color: COLORS.text,
  },
  claimStatus: {
    marginTop: 8,
    color: COLORS.goldForeground,
    fontFamily: FONTS.sansBold,
  },
  doneStatus: {
    marginTop: 8,
    color: COLORS.success,
    fontFamily: FONTS.sansBold,
  },
  hint: {
    marginTop: 6,
    marginBottom: 10,
    color: COLORS.textMuted,
    lineHeight: 20,
    fontSize: 13,
    fontFamily: FONTS.sans,
  },
  resolveBox: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  raiseBox: {
    marginTop: 16,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  resolveTitle: {
    fontFamily: FONTS.sansBold,
    color: COLORS.text,
    marginBottom: 4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15,27,45,0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    backgroundColor: COLORS.card,
    borderRadius: RADIUS["3xl"],
    padding: 24,
    alignItems: "center",
    ...SHADOW.lift,
  },
  modalTitle: {
    marginTop: 10,
    fontFamily: FONTS.display,
    fontSize: 24,
    color: COLORS.text,
  },
  modalBody: {
    marginTop: 8,
    marginBottom: 18,
    textAlign: "center",
    fontFamily: FONTS.sans,
    color: COLORS.textMuted,
    lineHeight: 20,
  },
});
