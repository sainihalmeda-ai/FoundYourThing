import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { navigate } from "../navigation/navigationRef";
import { COLORS, FONTS } from "../constants/config";

export type SidebarSection = "home" | "feed" | "claims" | "safety" | "about";

const NAV_ITEMS: {
  key: SidebarSection;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  go: () => void;
  group: "lost-found" | "safety";
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
    key: "safety",
    label: "Report a concern",
    icon: "shield-checkmark-outline",
    go: () => navigate("Safety"),
    group: "safety",
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
  const firstName =
    user?.full_name?.trim().split(/\s+/)[0] || user?.vtu_id?.replace(/^VTU/i, "") || "Student";
  const initial = firstName.charAt(0).toUpperCase();

  return (
    <View style={styles.root}>
      <View style={styles.brandRow}>
        <View style={styles.brandMark}>
          <Text style={styles.brandMarkText}>FYT</Text>
        </View>
        <Text style={styles.brandName}>FoundYourThing</Text>
      </View>

      <Text style={styles.groupLabel}>Lost &amp; Found</Text>
      {NAV_ITEMS.filter((i) => i.group === "lost-found").map((item) => (
        <SidebarItem
          key={item.key}
          label={item.label}
          icon={item.icon}
          active={active === item.key}
          onPress={item.go}
          badge={item.key === "claims" && pendingCount > 0 ? pendingCount : undefined}
        />
      ))}

      <Text style={[styles.groupLabel, { marginTop: 20 }]}>Campus safety</Text>
      {NAV_ITEMS.filter((i) => i.group === "safety").map((item) => (
        <SidebarItem
          key={item.key}
          label={item.label}
          icon={item.icon}
          active={active === item.key}
          onPress={item.go}
        />
      ))}

      <View style={{ flex: 1 }} />

      <SidebarItem
        label="About & privacy"
        icon="information-circle-outline"
        active={active === "about"}
        onPress={() => navigate("About")}
      />

      <View style={styles.divider} />

      <View style={styles.userRow}>
        <View style={styles.userAvatar}>
          <Text style={styles.userAvatarText}>{initial}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.userName} numberOfLines={1}>
            {firstName}
          </Text>
          <Text style={styles.userId} numberOfLines={1}>
            {user?.vtu_id}
          </Text>
        </View>
        <Pressable
          onPress={logout}
          hitSlop={8}
          accessibilityLabel="Log out"
          style={({ pressed }) => pressed && { opacity: 0.6 }}
        >
          <Ionicons name="log-out-outline" size={18} color={COLORS.textMuted} />
        </Pressable>
      </View>
    </View>
  );
}

function SidebarItem({
  label,
  icon,
  active,
  onPress,
  badge,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  active: boolean;
  onPress: () => void;
  badge?: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.item,
        active && styles.itemActive,
        pressed && !active && styles.itemPressed,
      ]}
    >
      <Ionicons name={icon} size={18} color={active ? "#fff" : COLORS.textMuted} />
      <Text style={[styles.itemLabel, active && styles.itemLabelActive]}>{label}</Text>
      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge > 9 ? "9+" : badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    width: 240,
    flexShrink: 0,
    backgroundColor: COLORS.card,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 6, marginBottom: 28 },
  brandMark: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  brandMarkText: { color: "#fff", fontFamily: FONTS.sansBold, fontSize: 10 },
  brandName: { fontFamily: FONTS.displayMedium, fontSize: 14.5, color: COLORS.text },
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
  userAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  userAvatarText: { fontFamily: FONTS.displayMedium, fontSize: 13, color: COLORS.primary },
  userName: { fontFamily: FONTS.sansBold, fontSize: 12.5, color: COLORS.text },
  userId: { fontFamily: FONTS.sansMedium, fontSize: 10.5, color: "#98A2B3", marginTop: 1 },
});
