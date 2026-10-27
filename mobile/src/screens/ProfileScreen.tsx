import React, { useCallback, useState } from "react";
import {
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fetchProfile } from "../api/auth";
import { resolveImageUrl } from "../api/client";
import { ConnectionBanner } from "../components/ConnectionBanner";
import { ErrorState } from "../components/ErrorState";
import { HomeButton } from "../components/HomeButton";
import { SidebarShell } from "../components/SidebarShell";
import { UserAvatarPlaceholder } from "../components/UserAvatarPlaceholder";
import { FINDER_BADGES, currentBadge, nextBadge } from "../constants/badges";
import { COLORS, FONTS, RADIUS, SHADOW, WIDE_BREAKPOINT } from "../constants/config";
import { useAuth } from "../context/AuthContext";
import type { RootStackParamList } from "../navigation/types";
import type { Item, Profile } from "../types";

type HistoryTab = "returned" | "lost" | "found";

function itemStatusLabel(item: Item): { label: string; color: string } {
  if (item.item_type === "found") {
    if (item.status === "recovered") return { label: "Returned", color: "#2F855A" };
    if (item.status === "claim_pending" || item.status === "connected")
      return { label: "Owner in touch", color: COLORS.warning };
    return { label: "Waiting for owner", color: COLORS.textMuted };
  }
  if (item.status === "closed" || item.status === "recovered")
    return { label: "Got it back", color: "#2F855A" };
  if (item.status === "claim_pending" || item.status === "connected")
    return { label: "Finder in touch", color: COLORS.warning };
  return { label: "Still searching", color: COLORS.accent };
}

export function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const desktop = width >= WIDE_BREAKPOINT;
  const { token, user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<HistoryTab>("returned");

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setError(null);
      setProfile(await fetchProfile(token));
    } catch (err) {
      setError(err);
    } finally {
      setRefreshing(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (error && !profile) return <ErrorState error={error} onRetry={load} />;
  if (!profile) {
    return (
      <SidebarShell
        active="profile"
        loading
        loadingLabel="Loading your profile"
        loadingHint="Gathering your history…"
      >
        {null}
      </SidebarShell>
    );
  }

  const returned = profile.returned_count;
  const badge = currentBadge(returned);
  const upcoming = nextBadge(returned);
  const prevMin = badge?.min ?? 0;
  const progress = upcoming ? (returned - prevMin) / (upcoming.min - prevMin) : 1;
  const firstName =
    user?.full_name?.trim().split(/\s+/)[0] || user?.vtu_id?.replace(/^VTU/i, "") || "Student";

  const history: Record<HistoryTab, Item[]> = {
    returned: profile.returned_items,
    lost: profile.lost_items,
    found: profile.found_items,
  };
  const tabs: { key: HistoryTab; label: string; empty: string }[] = [
    {
      key: "returned",
      label: `Returned · ${profile.returned_items.length}`,
      empty: "Items you hand back to their owners show up here.",
    },
    {
      key: "lost",
      label: `Lost · ${profile.lost_items.length}`,
      empty: "You haven't reported anything lost.",
    },
    {
      key: "found",
      label: `Found · ${profile.found_items.length}`,
      empty: "Found items still waiting for their owner show up here.",
    },
  ];
  const activeTab = tabs.find((t) => t.key === tab)!;

  const content = (
    <>
      <ConnectionBanner />
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: Math.max(insets.top, 12) + 8 },
          wide && styles.scrollWide,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={COLORS.accent}
          />
        }
      >
        <View style={styles.headerTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Profile</Text>
            <Text style={styles.subtitle}>Your history · only you can see this page</Text>
          </View>
          {!desktop ? <HomeButton /> : null}
        </View>

        {/* Identity + earned tagline */}
        <View style={[styles.hero, wide && styles.heroWide]}>
          <UserAvatarPlaceholder
            initial={firstName.charAt(0).toUpperCase()}
            photoUri={user?.photo_url ? resolveImageUrl(user.photo_url) : null}
            size={wide ? 84 : 68}
          />
          <View style={styles.heroText}>
            <Text style={styles.heroName} numberOfLines={1}>
              {user?.full_name || firstName}
            </Text>
            <Text style={styles.heroMeta}>
              {user?.vtu_id}
              {user?.department ? ` · ${user.department}` : ""}
            </Text>
            {badge ? (
              <View style={styles.taglineWrap}>
                <View style={[styles.taglinePill, { backgroundColor: badge.tint }]}>
                  <Ionicons name={badge.icon} size={13} color={badge.color} />
                  <Text style={[styles.taglinePillText, { color: badge.color }]}>
                    {badge.title}
                  </Text>
                </View>
                <Text style={styles.taglineText}>{badge.tagline}</Text>
              </View>
            ) : (
              <Text style={styles.taglineText}>
                Return a found item to earn your first tagline.
              </Text>
            )}
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard icon="heart" value={returned} label="Items returned" color="#2F855A" />
          <StatCard icon="search" value={profile.lost_count} label="Lost reports" color={COLORS.accent} />
          <StatCard
            icon="checkmark-done"
            value={profile.recovered_lost_count}
            label="Got back"
            color={COLORS.primary}
          />
        </View>

        {/* Progress to next tier */}
        <View style={styles.progressCard}>
          <View style={styles.progressHead}>
            <Text style={styles.progressTitle}>
              {upcoming
                ? `${upcoming.min - returned} more ${upcoming.min - returned === 1 ? "return" : "returns"} to unlock "${upcoming.title}"`
                : "Every tagline unlocked — thank you."}
            </Text>
            <Text style={styles.progressCount}>
              {returned}
              {upcoming ? ` / ${upcoming.min}` : ""}
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.max(progress * 100, returned > 0 || !upcoming ? 4 : 0)}%`,
                  backgroundColor: (upcoming ?? badge)?.color ?? COLORS.primary,
                },
              ]}
            />
          </View>
        </View>

        {/* Taglines */}
        <Text style={styles.sectionLabel}>Finder taglines</Text>
        <Text style={styles.sectionHint}>
          A token of respect for returning what others lost. Counted only when the owner confirms the
          handover.
        </Text>
        <View style={styles.badgeGrid}>
          {FINDER_BADGES.map((b) => {
            const unlocked = returned >= b.min;
            return (
              <View
                key={b.min}
                style={[
                  styles.badgeCard,
                  wide ? styles.badgeCardWide : styles.badgeCardNarrow,
                  !unlocked && styles.badgeLocked,
                ]}
              >
                <View
                  style={[
                    styles.badgeIcon,
                    { backgroundColor: unlocked ? b.color : COLORS.surfaceMuted },
                  ]}
                >
                  <Ionicons
                    name={unlocked ? b.icon : "lock-closed"}
                    size={20}
                    color={unlocked ? "#fff" : COLORS.textMuted}
                  />
                </View>
                <Text
                  style={[styles.badgeTitle, !unlocked && { color: COLORS.textMuted }]}
                  numberOfLines={2}
                >
                  {b.title}
                </Text>
                <Text style={[styles.badgeReq, unlocked && { color: b.color }]}>
                  {unlocked ? "Unlocked" : `${b.min} ${b.min === 1 ? "return" : "returns"}`}
                </Text>
              </View>
            );
          })}
        </View>

        {/* History */}
        <Text style={[styles.sectionLabel, { marginTop: 26 }]}>Your items</Text>
        <View style={styles.chips}>
          {tabs.map((t) => {
            const active = t.key === tab;
            return (
              <Pressable
                key={t.key}
                onPress={() => setTab(t.key)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{t.label}</Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.listCard}>
          {history[tab].length === 0 ? (
            <Text style={styles.empty}>{activeTab.empty}</Text>
          ) : (
            history[tab].map((item, i) => {
              const status = itemStatusLabel(item);
              return (
                <Pressable
                  key={item.id}
                  onPress={() => navigation.navigate("ItemDetail", { itemId: item.id })}
                  style={[styles.row, i > 0 && styles.rowDivider]}
                >
                  <Image source={{ uri: resolveImageUrl(item.image_url) }} style={styles.thumb} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.rowTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.rowMeta} numberOfLines={1}>
                      {item.category_label} · {item.location}
                    </Text>
                  </View>
                  <Text style={[styles.rowStatus, { color: status.color }]}>{status.label}</Text>
                </Pressable>
              );
            })
          )}
        </View>
      </ScrollView>
    </>
  );

  return <SidebarShell active="profile">{content}</SidebarShell>;
}

function StatCard({
  icon,
  value,
  label,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: number;
  label: string;
  color: string;
}) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={16} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  scrollWide: { paddingHorizontal: 32, width: "100%", maxWidth: 1080, alignSelf: "center" },
  headerTop: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 16 },
  title: { fontFamily: FONTS.display, fontSize: 26, color: COLORS.text, letterSpacing: -0.4 },
  subtitle: { fontFamily: FONTS.sans, fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  hero: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS["2xl"],
    padding: 20,
    ...SHADOW.soft,
  },
  heroWide: { padding: 26, gap: 22 },
  heroText: { flex: 1, minWidth: 0 },
  heroName: { fontFamily: FONTS.display, fontSize: 22, color: "#fff" },
  heroMeta: {
    fontFamily: FONTS.sansMedium,
    fontSize: 12.5,
    color: "rgba(255,255,255,.7)",
    marginTop: 2,
  },
  taglineWrap: { marginTop: 10, gap: 6 },
  taglinePill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
  },
  taglinePillText: { fontFamily: FONTS.sansBold, fontSize: 12.5 },
  taglineText: {
    fontFamily: FONTS.sans,
    fontSize: 12.5,
    color: "rgba(255,255,255,.82)",
    marginTop: 8,
    lineHeight: 18,
  },
  statsRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statValue: { fontFamily: FONTS.display, fontSize: 24, color: COLORS.text, marginTop: 6 },
  statLabel: { fontFamily: FONTS.sansMedium, fontSize: 11.5, color: COLORS.textMuted },
  progressCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  progressHead: { flexDirection: "row", alignItems: "center", gap: 10 },
  progressTitle: { flex: 1, fontFamily: FONTS.sansSemi, fontSize: 13, color: COLORS.text },
  progressCount: { fontFamily: FONTS.sansBold, fontSize: 13, color: COLORS.textMuted },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.surfaceMuted,
    marginTop: 10,
    overflow: "hidden",
  },
  progressFill: { height: 8, borderRadius: 4 },
  sectionLabel: {
    fontFamily: FONTS.sansBold,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: COLORS.textMuted,
    marginTop: 24,
  },
  sectionHint: {
    fontFamily: FONTS.sans,
    fontSize: 12.5,
    color: COLORS.textMuted,
    marginTop: 4,
    lineHeight: 18,
  },
  badgeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 12 },
  badgeCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  badgeCardNarrow: { width: "48%", flexGrow: 1 },
  badgeCardWide: { width: "18%", flexGrow: 1 },
  badgeLocked: { backgroundColor: COLORS.surface },
  badgeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeTitle: {
    fontFamily: FONTS.sansBold,
    fontSize: 13,
    color: COLORS.text,
    textAlign: "center",
    marginTop: 10,
    minHeight: 34,
  },
  badgeReq: { fontFamily: FONTS.sansSemi, fontSize: 11.5, color: COLORS.textMuted, marginTop: 2 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontFamily: FONTS.sansSemi, fontSize: 12.5, color: COLORS.text },
  chipTextActive: { color: "#fff" },
  listCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  empty: {
    fontFamily: FONTS.sans,
    fontSize: 13,
    color: COLORS.textMuted,
    padding: 20,
    textAlign: "center",
  },
  row: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12 },
  rowDivider: { borderTopWidth: 1, borderTopColor: COLORS.divider },
  thumb: { width: 44, height: 44, borderRadius: 10, backgroundColor: COLORS.surfaceMuted },
  rowTitle: { fontFamily: FONTS.sansBold, fontSize: 14, color: COLORS.text },
  rowMeta: { fontFamily: FONTS.sans, fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  rowStatus: { fontFamily: FONTS.sansBold, fontSize: 12 },
});
