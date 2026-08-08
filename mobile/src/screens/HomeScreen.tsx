import React, { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fetchIncomingClaims } from "../api/auth";
import { ConnectionBanner } from "../components/ConnectionBanner";
import { ConnectionGate } from "../components/ConnectionGate";
import { PageEnter } from "../components/PageEnter";
import { DaylightBackdrop, GridPlot } from "../components/SpatialBackdrop";
import { SessionBanner } from "../components/SessionBanner";
import { AppButton } from "../components/Ui";
import { useAuth } from "../context/AuthContext";
import { COLORS, FONTS, SHADOW } from "../constants/config";
import { openFytApkPage } from "../lib/apk";
import { RootStackParamList } from "../navigation/types";

export function HomeScreen() {
  const { user, token, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [pendingCount, setPendingCount] = useState(0);

  const firstName =
    user?.full_name?.trim().split(/\s+/)[0] ||
    user?.vtu_id?.replace(/^VTU/i, "") ||
    "Student";

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        if (!token) return;
        try {
          const claims = await fetchIncomingClaims(token);
          if (alive) setPendingCount(claims.filter((c) => c.status === "pending").length);
        } catch {
          if (alive) setPendingCount(0);
        }
      })();
      return () => {
        alive = false;
      };
    }, [token]),
  );

  return (
    <ConnectionGate>
      <View style={styles.root}>
        <DaylightBackdrop />
        <ConnectionBanner />
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: Math.max(insets.top, 12) + 8, paddingBottom: 28 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <PageEnter>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>Welcome back</Text>
              <Text style={styles.name}>{firstName}</Text>
              <Text style={styles.vtu}>{user?.vtu_id}</Text>
            </View>
            <SessionBanner />
          </View>

          <Pressable
            style={({ pressed }) => [styles.tileInk, pressed && styles.pressed]}
            onPress={() => navigation.navigate("Report", { mode: "lost" })}
          >
            <GridPlot variant="ink" opacity={0.5} />
            <View style={{ flex: 1, zIndex: 1 }}>
              <Text style={styles.tileInkTitle}>I lost something</Text>
              <Text style={styles.tileInkDesc}>Post a lost item — AI matches instantly.</Text>
            </View>
            <View style={[styles.tileInkArrow, { zIndex: 1 }]}>
              <Ionicons name="arrow-up" size={18} color="#fff" style={{ transform: [{ rotate: "45deg" }] }} />
            </View>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.tileCard, pressed && styles.pressed]}
            onPress={() => navigation.navigate("Report", { mode: "found" })}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.tileCardTitle}>I found something</Text>
              <Text style={styles.tileCardDesc}>Return a valuable to its owner.</Text>
            </View>
            <View style={styles.tileMutedArrow}>
              <Ionicons name="arrow-up" size={16} color={COLORS.primary} style={{ transform: [{ rotate: "45deg" }] }} />
            </View>
          </Pressable>

          <View style={styles.secondaryRow}>
            <Pressable
              style={({ pressed }) => [styles.secondaryTile, pressed && styles.pressed]}
              onPress={() => navigation.navigate("Feed")}
            >
              <View style={styles.secondaryIcon}>
                <Ionicons name="search" size={16} color={COLORS.primary} />
              </View>
              <Text style={styles.secondaryLabel}>Browse feed</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.secondaryTile, pressed && styles.pressed]}
              onPress={() => navigation.navigate("Claims")}
            >
              <View style={styles.secondaryIcon}>
                <Ionicons name="mail-outline" size={16} color={COLORS.primary} />
              </View>
              <Text style={styles.secondaryLabel}>Requests</Text>
              {pendingCount > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{pendingCount > 9 ? "9+" : pendingCount}</Text>
                </View>
              ) : null}
            </Pressable>
          </View>

          <View style={styles.policyCard}>
            <View style={styles.policyHeader}>
              <Ionicons name="sparkles" size={14} color={COLORS.accent} />
              <Text style={styles.policyEyebrow}>Policy</Text>
            </View>
            <Text style={styles.policyBody}>
              Valuables only. Phones, wallets, watches, IDs, bags, earbuds, keys, laptops.
            </Text>
            <Text style={styles.policyMuted}>
              Pens, pencils and consumables aren’t accepted — it keeps the feed useful.
            </Text>
          </View>

          <View style={styles.privacyNote}>
            <Ionicons name="shield-checkmark" size={14} color={COLORS.accent} />
            <Text style={styles.privacyText}>
              VTU ID is the only thing others see until you both accept a claim.
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [styles.apkRow, pressed && styles.pressed]}
            onPress={openFytApkPage}
          >
            <Ionicons name="logo-android" size={16} color={COLORS.accent} />
            <Text style={styles.apkRowText}>Get the Android app · Download FYT APK</Text>
          </Pressable>

          <AppButton label="Log out" onPress={logout} variant="ghost" style={{ marginTop: 8 }} />
          </PageEnter>
        </ScrollView>
      </View>
    </ConnectionGate>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  scroll: { paddingHorizontal: 20, paddingTop: 20 },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 28,
  },
  eyebrow: {
    fontFamily: FONTS.sansMedium,
    fontSize: 12,
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1.4,
  },
  name: {
    fontFamily: FONTS.display,
    fontSize: 38,
    color: COLORS.text,
    letterSpacing: -0.6,
    marginTop: 10,
    lineHeight: 44,
  },
  vtu: {
    fontFamily: FONTS.sansMedium,
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 8,
    letterSpacing: 0.3,
  },
  tileInk: {
    backgroundColor: COLORS.inkTop,
    borderRadius: 20,
    padding: 24,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 12,
    overflow: "hidden",
    position: "relative",
    ...SHADOW.soft,
  },
  tileInkTitle: {
    fontFamily: FONTS.display,
    fontSize: 22,
    color: COLORS.primaryForeground,
    letterSpacing: -0.4,
  },
  tileInkDesc: {
    marginTop: 10,
    fontFamily: FONTS.sans,
    fontSize: 13,
    color: "rgba(255,255,255,0.65)",
    lineHeight: 20,
  },
  tileInkArrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  tileCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 24,
    flexDirection: "row",
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
    marginBottom: 20,
    ...SHADOW.soft,
  },
  tileCardTitle: {
    fontFamily: FONTS.display,
    fontSize: 22,
    color: COLORS.text,
    letterSpacing: -0.4,
  },
  tileCardDesc: {
    marginTop: 10,
    fontFamily: FONTS.sans,
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 20,
  },
  tileMutedArrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryRow: { flexDirection: "row", gap: 16, marginBottom: 20 },
  secondaryTile: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    padding: 20,
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 12,
    position: "relative",
    ...SHADOW.soft,
  },
  secondaryIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryLabel: {
    fontFamily: FONTS.sansSemi,
    fontSize: 13,
    color: COLORS.text,
    letterSpacing: -0.2,
  },
  badge: {
    position: "absolute",
    top: 16,
    right: 16,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.danger,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontFamily: FONTS.sansBold,
  },
  policyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 24,
    marginBottom: 14,
    ...SHADOW.soft,
  },
  policyHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  policyEyebrow: {
    fontFamily: FONTS.sansBold,
    fontSize: 11,
    color: COLORS.accent,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  policyBody: {
    marginTop: 10,
    fontFamily: FONTS.sansMedium,
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 21,
  },
  policyMuted: {
    marginTop: 6,
    fontFamily: FONTS.sans,
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 18,
  },
  privacyNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  privacyText: {
    flex: 1,
    fontFamily: FONTS.sans,
    fontSize: 11,
    color: COLORS.textMuted,
    lineHeight: 16,
  },
  apkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  apkRowText: {
    fontFamily: FONTS.sansSemi,
    fontSize: 13,
    color: COLORS.accent,
  },
  pressed: { opacity: 0.92, transform: [{ scale: 0.985 }] },
});
