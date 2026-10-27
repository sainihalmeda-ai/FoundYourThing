import React, { useEffect, useRef } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { resolveImageUrl } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { navigate } from "../navigation/navigationRef";
import { useSidebarPref } from "../context/SidebarContext";
import {
  SIDEBAR_COMPACT_WIDTH,
  SIDEBAR_WIDTH,
  useDesktopLayout,
} from "../lib/useDesktopLayout";
import { UserAvatarPlaceholder } from "./UserAvatarPlaceholder";
import { COLORS, FONTS } from "../constants/config";

export type SidebarSection =
  | "home"
  | "feed"
  | "claims"
  | "profile"
  | "safety"
  | "hostel"
  | "about";

type NavGroup = "lost-found" | "safety" | "hostel";

const NAV_GROUPS: { key: NavGroup; label: string }[] = [
  { key: "lost-found", label: "Lost & Found" },
  { key: "safety", label: "Campus safety" },
  { key: "hostel", label: "Hostel" },
];

const NAV_ITEMS: {
  key: SidebarSection;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  go: () => void;
  group: NavGroup;
}[] = [
  {
    key: "home",
    label: "Dashboard",
    icon: "home-outline",
    go: () => navigate("MainTabs", { screen: "HomeTab" }),
    group: "lost-found",
  },
  {
    key: "feed",
    label: "Browse feed",
    icon: "compass-outline",
    go: () => navigate("MainTabs", { screen: "FeedTab" }),
    group: "lost-found",
  },
  {
    key: "claims",
    label: "Requests",
    icon: "mail-outline",
    go: () => navigate("MainTabs", { screen: "ClaimsTab" }),
    group: "lost-found",
  },
  {
    key: "profile",
    label: "Profile",
    icon: "person-circle-outline",
    go: () => navigate("MainTabs", { screen: "ProfileTab" }),
    group: "lost-found",
  },
  {
    key: "safety",
    label: "Report a concern",
    icon: "shield-checkmark-outline",
    go: () => navigate("Safety"),
    group: "safety",
  },
  {
    key: "hostel",
    label: "Hostel complaints",
    icon: "bed-outline",
    go: () => navigate("Hostel"),
    group: "hostel",
  },
];

/** Persistent left nav shown on wide (desktop-width) screens in place of the bottom tab bar. */
export function DesktopSidebar({
  active,
  pendingCount = 0,
}: {
  active: SidebarSection;
  pendingCount?: number;
}) {
  const { user, logout } = useAuth();
  // Icon-only rail: the user's show/hide choice, or automatic in narrow windows.
  const { compactNav: compact } = useDesktopLayout();
  const { setCollapsed } = useSidebarPref();

  // Slide between the two widths rather than jumping (layout prop, so JS driver).
  const width = useRef(new Animated.Value(compact ? SIDEBAR_COMPACT_WIDTH : SIDEBAR_WIDTH)).current;
  useEffect(() => {
    Animated.timing(width, {
      toValue: compact ? SIDEBAR_COMPACT_WIDTH : SIDEBAR_WIDTH,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [compact, width]);

  const toggle = (
    <Pressable
      onPress={() => setCollapsed(!compact)}
      accessibilityRole="button"
      accessibilityLabel={compact ? "Show sidebar" : "Hide sidebar"}
      {...({ title: compact ? "Show sidebar" : "Hide sidebar" } as object)}
      hitSlop={6}
      style={({ pressed }) => [styles.toggle, pressed && styles.itemPressed]}
    >
      <Ionicons
        name={compact ? "chevron-forward" : "chevron-back"}
        size={14}
        color={COLORS.textMuted}
      />
    </Pressable>
  );
  const firstName =
    user?.full_name?.trim().split(/\s+/)[0] || user?.vtu_id?.replace(/^VTU/i, "") || "Student";
  const initial = firstName.charAt(0).toUpperCase();

  return (
    <Animated.View style={[styles.root, compact && styles.rootCompact, { width }]}>
      <View style={[styles.brandRow, compact && styles.brandRowCompact]}>
        <View style={styles.brandMark}>
          <Text style={styles.brandMarkText}>FYT</Text>
        </View>
        {compact ? null : (
          <Text style={styles.brandName} numberOfLines={1}>
            FoundYourThing
          </Text>
        )}
        {toggle}
      </View>

      {NAV_GROUPS.map((group, index) => (
        <React.Fragment key={group.key}>
          {compact ? (
            index > 0 ? <View style={styles.groupDivider} /> : null
          ) : (
            <Text style={[styles.groupLabel, index > 0 && { marginTop: 20 }]}>{group.label}</Text>
          )}
          {NAV_ITEMS.filter((i) => i.group === group.key).map((item) => (
            <SidebarItem
              key={item.key}
              label={item.label}
              icon={item.icon}
              active={active === item.key}
              onPress={item.go}
              badge={item.key === "claims" && pendingCount > 0 ? pendingCount : undefined}
              compact={compact}
            />
          ))}
        </React.Fragment>
      ))}

      <View style={{ flex: 1 }} />

      <SidebarItem
        label="About & privacy"
        icon="information-circle-outline"
        active={active === "about"}
        onPress={() => navigate("About")}
        compact={compact}
      />

      <View style={styles.divider} />

      <View style={[styles.userRow, compact && styles.userRowCompact]}>
        <UserAvatarPlaceholder
          initial={initial}
          photoUri={user?.photo_url ? resolveImageUrl(user.photo_url) : null}
          size={34}
        />
        {compact ? null : (
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.userName} numberOfLines={1}>
              {firstName}
            </Text>
            <Text style={styles.userId} numberOfLines={1}>
              {user?.vtu_id}
            </Text>
          </View>
        )}
        <Pressable
          onPress={logout}
          hitSlop={8}
          accessibilityLabel="Log out"
          style={({ pressed }) => pressed && { opacity: 0.6 }}
        >
          <Ionicons name="log-out-outline" size={18} color={COLORS.textMuted} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

function SidebarItem({
  label,
  icon,
  active,
  onPress,
  badge,
  compact = false,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  active: boolean;
  onPress: () => void;
  badge?: number;
  /** Icon only (the label becomes the accessibility label / hover title). */
  compact?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      accessibilityLabel={label}
      // Web shows this as a hover tooltip on the icon rail.
      {...(compact ? ({ title: label } as object) : null)}
      style={({ pressed }) => [
        styles.item,
        compact && styles.itemCompact,
        active && styles.itemActive,
        pressed && !active && styles.itemPressed,
      ]}
    >
      <Ionicons name={icon} size={compact ? 20 : 18} color={active ? "#fff" : COLORS.textMuted} />
      {compact ? null : (
        <Text style={[styles.itemLabel, active && styles.itemLabelActive]}>{label}</Text>
      )}
      {badge ? (
        <View style={[styles.badge, compact && styles.badgeCompact]}>
          <Text style={styles.badgeText}>{badge > 9 ? "9+" : badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    width: SIDEBAR_WIDTH,
    flexShrink: 0,
    overflow: "hidden",
    backgroundColor: COLORS.card,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  rootCompact: { width: SIDEBAR_COMPACT_WIDTH, paddingHorizontal: 12, alignItems: "stretch" },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 2, marginBottom: 28 },
  brandRowCompact: { flexDirection: "column", justifyContent: "center", paddingHorizontal: 0 },
  toggle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.card,
  },
  groupDivider: { height: 1, backgroundColor: COLORS.divider, marginVertical: 12, marginHorizontal: 8 },
  itemCompact: { justifyContent: "center", paddingHorizontal: 0, height: 44 },
  badgeCompact: { position: "absolute", top: 4, right: 6 },
  userRowCompact: { flexDirection: "column", paddingHorizontal: 0, gap: 12 },
  brandMark: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  brandMarkText: { color: "#fff", fontFamily: FONTS.sansBold, fontSize: 10 },
  brandName: { flex: 1, fontFamily: FONTS.displayMedium, fontSize: 14.5, color: COLORS.text },
  groupLabel: {
    paddingHorizontal: 14,
    fontFamily: FONTS.sansBold,
    fontSize: 10,
    color: "#98A2B3",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 4,
  },
  itemActive: { backgroundColor: COLORS.primary },
  itemPressed: { backgroundColor: COLORS.surfaceMuted },
  itemLabel: { fontFamily: FONTS.sansSemi, fontSize: 13, color: COLORS.textMuted, flex: 1 },
  itemLabelActive: { color: "#fff" },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.danger,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: { color: "#fff", fontSize: 10, fontFamily: FONTS.sansBold },
  divider: { height: 1, backgroundColor: COLORS.divider, marginVertical: 12, marginHorizontal: 6 },
  userRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 8 },
  userName: { fontFamily: FONTS.sansBold, fontSize: 12.5, color: COLORS.text },
  userId: { fontFamily: FONTS.sansMedium, fontSize: 10.5, color: "#98A2B3", marginTop: 1 },
});
