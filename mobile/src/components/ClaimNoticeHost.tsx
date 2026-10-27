import React, { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Easing, Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { fetchIncomingClaims, fetchMyClaims } from "../api/auth";
import { resolveImageUrl } from "../api/client";
import { useAuth } from "../context/AuthContext";
import {
  dismissAcceptedClaim,
  dismissIncomingClaim,
  getDismissedAcceptedClaimIds,
  getDismissedIncomingClaimIds,
} from "../lib/acceptedClaimNotices";
import { navigate } from "../navigation/navigationRef";
import { MatchAnalyzer } from "./MatchAnalyzer";
import { PhotoView } from "./PhotoView";
import { COLORS, FONTS, RADIUS, SHADOW } from "../constants/config";
import type { Claim } from "../types";

// Built-in Animated only — Reanimated crashed the production APK.
const nativeDriver = Platform.OS !== "web";

type Notice =
  | { kind: "incoming"; claim: Claim }
  | { kind: "accepted"; claim: Claim };

/**
 * Global popups after login:
 * - New contact request → the animated photo analysis (MatchAnalyzer)
 * - Request accepted → a short "handover" animation that unlocks the phone
 */
export function ClaimNoticeHost() {
  const { token, user } = useAuth();
  const [notice, setNotice] = useState<Notice | null>(null);

  const refresh = useCallback(async () => {
    if (!token) {
      setNotice(null);
      return;
    }
    try {
      const [incoming, mine, dismissedIncoming, dismissedAccepted] = await Promise.all([
        fetchIncomingClaims(token),
        fetchMyClaims(token),
        getDismissedIncomingClaimIds(),
        getDismissedAcceptedClaimIds(),
      ]);

      const incomingHit = incoming.find((c) => !dismissedIncoming.includes(c.id));
      if (incomingHit) {
        setNotice((prev) => sameNotice(prev, "incoming", incomingHit));
        return;
      }

      const acceptedHit = mine.find(
        (c) =>
          c.status === "accepted" &&
          !dismissedAccepted.includes(c.id) &&
          c.match.lost_item.status !== "closed" &&
          c.match.found_item.status !== "recovered",
      );
      if (acceptedHit) {
        setNotice((prev) => sameNotice(prev, "accepted", acceptedHit));
        return;
      }

      setNotice(null);
    } catch {
      // Keep app usable if notices fail.
    }
  }, [token]);

  useEffect(() => {
    refresh();
    if (!token) return;
    const id = setInterval(refresh, 10000);
    return () => clearInterval(id);
  }, [token, refresh]);

  if (!notice) return null;

  const claim = notice.claim;
  const lost = claim.match.lost_item;
  const found = claim.match.found_item;
  // Either side can start the conversation, so work out which report is yours.
  const iOwnLost = lost.reporter_vtu_id === user?.vtu_id;
  const yours = iOwnLost ? lost : found;
  const theirs = iOwnLost ? found : lost;

  const dismiss = async () => {
    if (notice.kind === "incoming") {
      await dismissIncomingClaim(claim.id);
    } else {
      await dismissAcceptedClaim(claim.id);
    }
    setNotice(null);
    setTimeout(refresh, 300);
  };

  const open = async () => {
    const itemId = yours.id;
    const kind = notice.kind;
    await dismiss();
    if (kind === "incoming") {
      navigate("MainTabs", { screen: "ClaimsTab" });
    } else {
      navigate("ItemDetail", { itemId });
    }
  };

  const phone =
    notice.kind === "accepted" &&
    claim.counterparty.phone &&
    lost.status !== "closed" &&
    found.status !== "recovered"
      ? claim.counterparty.phone
      : null;

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent>
      <View style={styles.backdrop}>
        {/* Keyed so a different notice replays its animation from the start. */}
        <PopCard key={`${notice.kind}-${claim.id}`}>
          <Text style={styles.eyebrow}>
            {notice.kind === "incoming" ? "New request" : "Contact unlocked"}
          </Text>
          <Text style={styles.title}>
            {notice.kind === "incoming" ? "New claim request" : "Claim accepted"}
          </Text>
          <Text style={styles.message}>
            {notice.kind === "incoming"
              ? iOwnLost
                ? `${claim.counterparty.vtu_id} thinks they found your lost item. Here is how the two reports compare.`
                : `${claim.counterparty.vtu_id} thinks your found item matches their lost report. Here is how the two reports compare.`
              : `Your request about “${theirs.title}” was accepted. Meet on campus.`}
          </Text>

          {notice.kind === "incoming" ? (
            <View style={{ marginTop: 14 }}>
              <MatchAnalyzer
                leftUri={resolveImageUrl(theirs.image_url)}
                leftLabel="Their photo"
                rightUri={resolveImageUrl(yours.image_url)}
                rightLabel="Your photo"
                imageScore={claim.match.image_score}
                textScore={claim.match.text_score}
                combinedScore={claim.match.combined_score}
                photoHeight={140}
              />
            </View>
          ) : (
            <AcceptedReveal
              theirUri={resolveImageUrl(theirs.image_url)}
              yourUri={resolveImageUrl(yours.image_url)}
              pairLabel={`${lost.title} ↔ ${found.title}`}
              phone={phone}
            />
          )}

          <Pressable style={styles.primary} onPress={open}>
            <Text style={styles.primaryText}>
              {notice.kind === "incoming" ? "Review request" : "View item"}
            </Text>
          </Pressable>
          <Pressable style={styles.secondary} onPress={dismiss}>
            <Text style={styles.secondaryText}>Dismiss</Text>
          </Pressable>
        </PopCard>
      </View>
    </Modal>
  );
}

/** Keep the same object while the polled notice is unchanged, so the animation isn't restarted every 10 s. */
function sameNotice(prev: Notice | null, kind: Notice["kind"], claim: Claim): Notice {
  if (prev && prev.kind === kind && prev.claim.id === claim.id) return prev;
  return { kind, claim };
}

/** The popup card springs up into place. */
function PopCard({ children }: { children: React.ReactNode }) {
  const enter = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(enter, {
      toValue: 1,
      friction: 7,
      tension: 60,
      useNativeDriver: nativeDriver,
    }).start();
  }, [enter]);
  return (
    <Animated.View
      style={[
        styles.card,
        {
          opacity: enter,
          transform: [
            { translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [28, 0] }) },
            { scale: enter.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

const HANDOVER_STEPS = ["Request accepted", "Contact unlocked", "Meet on campus"];

/**
 * "Claim accepted" sequence: the two photos slide together, a check seal
 * pops between them, the lock opens, and the phone number is revealed
 * digit by digit.
 */
function AcceptedReveal({
  theirUri,
  yourUri,
  pairLabel,
  phone,
}: {
  theirUri: string;
  yourUri: string;
  pairLabel: string;
  phone: string | null;
}) {
  const meet = useRef(new Animated.Value(0)).current;
  const seal = useRef(new Animated.Value(0)).current;
  const ripple = useRef(new Animated.Value(0)).current;
  const [unlocked, setUnlocked] = useState(false);
  const [revealed, setRevealed] = useState(0);
  const [stepsDone, setStepsDone] = useState(0);

  useEffect(() => {
    Animated.sequence([
      Animated.delay(200),
      Animated.timing(meet, {
        toValue: 1,
        duration: 650,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: nativeDriver,
      }),
      Animated.spring(seal, { toValue: 1, friction: 4, tension: 90, useNativeDriver: nativeDriver }),
    ]).start();
    const rippleLoop = Animated.loop(
      Animated.timing(ripple, {
        toValue: 1,
        duration: 1400,
        easing: Easing.out(Easing.quad),
        useNativeDriver: nativeDriver,
      }),
      { iterations: 3 },
    );
    const timers = [
      setTimeout(() => rippleLoop.start(), 900),
      setTimeout(() => setStepsDone(1), 950),
      setTimeout(() => {
        setUnlocked(true);
        setStepsDone(2);
      }, 1450),
    ];
    // Then type the phone number out one digit at a time.
    const digits = phone?.length ?? 0;
    for (let i = 1; i <= digits; i += 1) {
      timers.push(setTimeout(() => setRevealed(i), 1550 + i * 75));
    }
    timers.push(setTimeout(() => setStepsDone(3), 1650 + digits * 75));
    return () => {
      timers.forEach(clearTimeout);
      rippleLoop.stop();
    };
  }, [meet, seal, ripple, phone]);

  const slide = (from: number) => ({
    opacity: meet,
    transform: [{ translateX: meet.interpolate({ inputRange: [0, 1], outputRange: [from, 0] }) }],
  });

  const masked = phone
    ? phone
        .split("")
        .map((ch, i) => (i < revealed ? ch : "•"))
        .join("")
    : "";

  return (
    <View style={{ marginTop: 16 }}>
      <View style={styles.photos}>
        <Animated.View style={[styles.photoWrap, slide(-70)]}>
          <PhotoView uri={theirUri} style={styles.photo} />
          <Text style={styles.photoLabel}>Their photo</Text>
        </Animated.View>
        <Animated.View style={[styles.photoWrap, slide(70)]}>
          <PhotoView uri={yourUri} style={styles.photo} />
          <Text style={styles.photoLabel}>Your photo</Text>
        </Animated.View>

        {/* Check seal where the two photos meet. */}
        <View style={styles.sealSpot} pointerEvents="none">
          <Animated.View
            style={[
              styles.ripple,
              {
                opacity: ripple.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] }),
                transform: [{ scale: ripple.interpolate({ inputRange: [0, 1], outputRange: [1, 2.4] }) }],
              },
            ]}
          />
          <Animated.View style={[styles.seal, { transform: [{ scale: seal }] }]}>
            <Ionicons name="checkmark" size={24} color="#fff" />
          </Animated.View>
        </View>
      </View>

      <Text style={styles.meta}>{pairLabel}</Text>

      <View style={styles.steps}>
        {HANDOVER_STEPS.map((label, i) => (
          <View key={label} style={styles.step}>
            <Ionicons
              name={i < stepsDone ? "checkmark-circle" : "ellipse-outline"}
              size={15}
              color={i < stepsDone ? COLORS.success : COLORS.border}
            />
            <Text style={[styles.stepText, i < stepsDone && styles.stepTextDone]}>{label}</Text>
          </View>
        ))}
      </View>

      {phone ? (
        <View style={[styles.phoneBox, unlocked && styles.phoneBoxOpen]}>
          <View style={[styles.lock, unlocked && styles.lockOpen]}>
            <Ionicons
              name={unlocked ? "lock-open" : "lock-closed"}
              size={16}
              color={unlocked ? "#fff" : COLORS.textMuted}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.phoneLabel}>{unlocked ? "Phone unlocked" : "Unlocking contact…"}</Text>
            <Text style={styles.phone}>{masked}</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15,27,45,0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 620,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS["3xl"],
    padding: 22,
    ...SHADOW.lift,
  },
  eyebrow: {
    fontFamily: FONTS.sansBold,
    fontSize: 11,
    color: COLORS.accent,
    textTransform: "uppercase",
    letterSpacing: 1,
    textAlign: "center",
  },
  title: {
    marginTop: 6,
    fontFamily: FONTS.display,
    fontSize: 26,
    color: COLORS.text,
    textAlign: "center",
  },
  message: {
    marginTop: 8,
    fontFamily: FONTS.sans,
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },
  photos: { flexDirection: "row", gap: 14 },
  photoWrap: { flex: 1 },
  photo: { width: "100%", height: 140, borderRadius: RADIUS.xl },
  photoLabel: {
    marginTop: 6,
    fontFamily: FONTS.sansBold,
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: "center",
  },
  sealSpot: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 70 - 26,
    alignItems: "center",
  },
  seal: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.success,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: COLORS.card,
  },
  ripple: {
    position: "absolute",
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.success,
  },
  meta: {
    marginTop: 10,
    textAlign: "center",
    fontFamily: FONTS.sansSemi,
    color: COLORS.text,
    fontSize: 13,
  },
  steps: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 14,
  },
  step: { flexDirection: "row", alignItems: "center", gap: 5 },
  stepText: { fontFamily: FONTS.sansMedium, fontSize: 12, color: "#98A2B3" },
  stepTextDone: { color: COLORS.text, fontFamily: FONTS.sansSemi },
  phoneBox: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  phoneBoxOpen: { backgroundColor: "rgba(34,197,94,0.08)", borderColor: "rgba(34,197,94,0.35)" },
  lock: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  lockOpen: { backgroundColor: COLORS.success },
  phoneLabel: { fontFamily: FONTS.sansSemi, fontSize: 11.5, color: COLORS.textMuted },
  phone: {
    marginTop: 2,
    fontFamily: FONTS.sansBold,
    fontSize: 20,
    color: COLORS.text,
    letterSpacing: 2,
  },
  primary: {
    marginTop: 16,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS["2xl"],
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryText: {
    color: COLORS.primaryForeground,
    fontFamily: FONTS.sansBold,
  },
  secondary: {
    marginTop: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryText: {
    fontFamily: FONTS.sansSemi,
    color: COLORS.textMuted,
  },
});
