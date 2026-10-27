import React, { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Easing, Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { fetchProfile } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import { FINDER_BADGES, currentBadge, nextBadge, type FinderBadge } from "../constants/badges";
import { navigate } from "../navigation/navigationRef";
import { COLORS, FONTS, RADIUS, SHADOW } from "../constants/config";

// Built-in Animated only — Reanimated crashed the production APK.
const nativeDriver = Platform.OS !== "web";
const POLL_MS = 30000;
const seenKey = (vtu: string) => `fyt_seen_badge_min_${vtu}`;

/**
 * Celebrates a newly earned finder tagline once. Returns are confirmed by
 * the other student (claim → handover), often while the finder isn't in the
 * app, so this checks the profile periodically and compares the earned tier
 * with the last one this device celebrated.
 */
export function BadgeCelebrationHost() {
  const { token, user } = useAuth();
  const [shown, setShown] = useState<{ badge: FinderBadge; returned: number } | null>(null);

  const check = useCallback(async () => {
    if (!token || !user?.vtu_id) return;
    try {
      const profile = await fetchProfile(token);
      const badge = currentBadge(profile.returned_count);
      if (!badge) return;
      const seen = Number((await AsyncStorage.getItem(seenKey(user.vtu_id))) ?? 0);
      if (badge.min > seen) setShown({ badge, returned: profile.returned_count });
    } catch {
      // Celebrations are a nicety — never surface an error for them.
    }
  }, [token, user?.vtu_id]);

  useEffect(() => {
    // Give login / claim pop-ups a moment first.
    const first = setTimeout(check, 2500);
    const id = setInterval(check, POLL_MS);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [check]);

  if (!shown || !user?.vtu_id) return null;

  const close = async (thenOpenProfile: boolean) => {
    await AsyncStorage.setItem(seenKey(user.vtu_id), String(shown.badge.min)).catch(() => {});
    setShown(null);
    if (thenOpenProfile) navigate("MainTabs", { screen: "ProfileTab" });
  };

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent>
      <View style={styles.backdrop}>
        <Celebration
          key={shown.badge.min}
          badge={shown.badge}
          returned={shown.returned}
          onProfile={() => close(true)}
          onClose={() => close(false)}
        />
      </View>
    </Modal>
  );
}

const CONFETTI = 26;
const RAYS = 12;

function Celebration({
  badge,
  returned,
  onProfile,
  onClose,
}: {
  badge: FinderBadge;
  returned: number;
  onProfile: () => void;
  onClose: () => void;
}) {
  const card = useRef(new Animated.Value(0)).current;
  const medal = useRef(new Animated.Value(0)).current;
  const wobble = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;
  const burst = useRef(new Animated.Value(0)).current;
  const text = useRef(new Animated.Value(0)).current;

  // Fixed pseudo-random confetti so each piece has its own direction, colour and size.
  const pieces = useRef(
    Array.from({ length: CONFETTI }, (_, i) => {
      const angle = (i / CONFETTI) * Math.PI * 2 + (i % 3) * 0.17;
      const dist = 110 + ((i * 37) % 70);
      return {
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist * 0.8 + 40, // a little gravity
        rotate: `${(i % 2 ? 1 : -1) * (180 + ((i * 53) % 360))}deg`,
        color: [badge.color, COLORS.gold, COLORS.primary, COLORS.accent, "#22C55E"][i % 5],
        w: 6 + (i % 3) * 2,
        h: i % 2 ? 10 : 6,
      };
    }),
  ).current;

  useEffect(() => {
    Animated.spring(card, { toValue: 1, friction: 7, tension: 60, useNativeDriver: nativeDriver }).start();
    Animated.sequence([
      Animated.delay(250),
      Animated.parallel([
        Animated.spring(medal, { toValue: 1, friction: 4, tension: 70, useNativeDriver: nativeDriver }),
        Animated.timing(burst, {
          toValue: 1,
          duration: 1300,
          easing: Easing.out(Easing.quad),
          useNativeDriver: nativeDriver,
        }),
      ]),
      Animated.sequence([
        Animated.timing(wobble, { toValue: 1, duration: 120, useNativeDriver: nativeDriver }),
        Animated.timing(wobble, { toValue: -1, duration: 160, useNativeDriver: nativeDriver }),
        Animated.timing(wobble, { toValue: 0, duration: 120, useNativeDriver: nativeDriver }),
      ]),
    ]).start();
    Animated.timing(text, {
      toValue: 1,
      duration: 500,
      delay: 650,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: nativeDriver,
    }).start();
    const rays = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 9000, easing: Easing.linear, useNativeDriver: nativeDriver }),
    );
    rays.start();
    return () => rays.stop();
  }, [card, medal, wobble, burst, text, spin]);

  const next = nextBadge(returned);
  const tier = FINDER_BADGES.findIndex((b) => b.min === badge.min) + 1;
  const prevMin = badge.min;
  const progress = next ? (returned - prevMin) / (next.min - prevMin) : 1;

  return (
    <Animated.View
      style={[
        styles.card,
        {
          opacity: card,
          transform: [
            { translateY: card.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) },
            { scale: card.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) },
          ],
        },
      ]}
    >
      <View style={styles.stage}>
        {/* Sun rays */}
        <Animated.View
          style={[
            styles.rays,
            {
              opacity: medal.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: "clamp" }),
              transform: [{ rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] }) }],
            },
          ]}
          pointerEvents="none"
        >
          {Array.from({ length: RAYS }, (_, i) => (
            <View
              key={i}
              style={[
                styles.ray,
                { backgroundColor: badge.tint, transform: [{ rotate: `${(360 / RAYS) * i}deg` }] },
              ]}
            />
          ))}
        </Animated.View>

        {/* Confetti burst */}
        {pieces.map((p, i) => (
          <Animated.View
            key={i}
            pointerEvents="none"
            style={[
              styles.confetti,
              {
                width: p.w,
                height: p.h,
                backgroundColor: p.color,
                opacity: burst.interpolate({ inputRange: [0, 0.1, 0.75, 1], outputRange: [0, 1, 1, 0] }),
                transform: [
                  { translateX: burst.interpolate({ inputRange: [0, 1], outputRange: [0, p.x] }) },
                  { translateY: burst.interpolate({ inputRange: [0, 1], outputRange: [0, p.y] }) },
                  { rotate: burst.interpolate({ inputRange: [0, 1], outputRange: ["0deg", p.rotate] }) },
                ],
              },
            ]}
          />
        ))}

        {/* Medal */}
        <Animated.View
          style={[
            styles.medalRing,
            { borderColor: badge.tint },
            {
              transform: [
                { scale: medal },
                { rotate: wobble.interpolate({ inputRange: [-1, 1], outputRange: ["-10deg", "10deg"] }) },
              ],
            },
          ]}
        >
          <View style={[styles.medal, { backgroundColor: badge.color }]}>
            <Ionicons name={badge.icon} size={44} color="#fff" />
          </View>
        </Animated.View>
      </View>

      <Animated.View
        style={{
          opacity: text,
          transform: [{ translateY: text.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
        }}
      >
        <Text style={styles.eyebrow}>New tagline unlocked · Tier {tier} of {FINDER_BADGES.length}</Text>
        <Text style={[styles.title, { color: badge.color }]}>{badge.title}</Text>
        <Text style={styles.tagline}>{badge.tagline}</Text>
        <Text style={styles.count}>
          {returned} item{returned === 1 ? "" : "s"} returned to their owners
        </Text>

        <View style={styles.nextBox}>
          <View style={styles.nextHead}>
            <Text style={styles.nextLabel}>
              {next ? `Next: ${next.title}` : "Highest tagline reached"}
            </Text>
            {next ? (
              <Text style={styles.nextCount}>
                {returned} / {next.min}
              </Text>
            ) : null}
          </View>
          <View style={styles.track}>
            <View
              style={[
                styles.fill,
                { width: `${Math.max(4, Math.min(1, progress) * 100)}%`, backgroundColor: badge.color },
              ]}
            />
          </View>
        </View>

        <Pressable style={[styles.primary, { backgroundColor: badge.color }]} onPress={onProfile}>
          <Ionicons name="person-circle-outline" size={18} color="#fff" />
          <Text style={styles.primaryText}>See it on my profile</Text>
        </Pressable>
        <Pressable style={styles.secondary} onPress={onClose}>
          <Text style={styles.secondaryText}>Awesome, thanks!</Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const STAGE = 170;
const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15,27,45,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS["3xl"],
    padding: 22,
    paddingTop: 10,
    alignItems: "stretch",
    ...SHADOW.lift,
  },
  stage: { height: STAGE, alignItems: "center", justifyContent: "center" },
  rays: {
    position: "absolute",
    width: STAGE,
    height: STAGE,
    alignItems: "center",
    justifyContent: "center",
  },
  ray: { position: "absolute", width: 14, height: STAGE, borderRadius: 7, opacity: 0.85 },
  confetti: { position: "absolute", borderRadius: 2 },
  medalRing: {
    width: 108,
    height: 108,
    borderRadius: 54,
    borderWidth: 6,
    backgroundColor: COLORS.card,
    alignItems: "center",
    justifyContent: "center",
  },
  medal: { width: 84, height: 84, borderRadius: 42, alignItems: "center", justifyContent: "center" },
  eyebrow: {
    fontFamily: FONTS.sansBold,
    fontSize: 11,
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
    textAlign: "center",
  },
  title: { marginTop: 6, fontFamily: FONTS.display, fontSize: 28, textAlign: "center" },
  tagline: {
    marginTop: 6,
    fontFamily: FONTS.sansMedium,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.text,
    textAlign: "center",
  },
  count: { marginTop: 6, fontFamily: FONTS.sans, fontSize: 12.5, color: COLORS.textMuted, textAlign: "center" },
  nextBox: {
    marginTop: 16,
    padding: 12,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  nextHead: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  nextLabel: { fontFamily: FONTS.sansSemi, fontSize: 12.5, color: COLORS.text },
  nextCount: { fontFamily: FONTS.sansBold, fontSize: 12.5, color: COLORS.textMuted },
  track: { height: 7, borderRadius: 4, backgroundColor: COLORS.surfaceMuted, overflow: "hidden" },
  fill: { height: 7, borderRadius: 4 },
  primary: {
    // The modal focuses this button on web; its colour already marks it.
    ...(Platform.OS === "web" ? ({ outlineStyle: "none" } as object) : null),
    marginTop: 16,
    flexDirection: "row",
    gap: 8,
    borderRadius: RADIUS["2xl"],
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: { color: "#fff", fontFamily: FONTS.sansBold },
  secondary: { marginTop: 6, paddingVertical: 12, alignItems: "center" },
  secondaryText: { fontFamily: FONTS.sansSemi, color: COLORS.textMuted },
});
