import React, { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fetchIncomingClaims, fetchItems, fetchStats } from "../api/auth";
import { ConnectionBanner } from "../components/ConnectionBanner";
import { ConnectionGate } from "../components/ConnectionGate";
import { DaylightBackdrop } from "../components/SpatialBackdrop";
import { HomeLayoutSwitcher } from "../components/home/HomeLayoutSwitcher";
import { HomePortal } from "../components/home/HomePortal";
import { HomeGrid } from "../components/home/HomeGrid";
import { HomeFeed } from "../components/home/HomeFeed";
import type { HomeStats } from "../components/home/types";
import { useAuth } from "../context/AuthContext";
import { COLORS, CONTENT_MAX_WIDTH } from "../constants/config";
import { getHomeLayout, saveHomeLayout, type HomeLayout } from "../lib/homeLayoutPreference";
import { openFytApkPage } from "../lib/apk";
import { RootStackParamList } from "../navigation/types";
import type { Item } from "../types";

export function HomeScreen() {
  const { user, token, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [pendingCount, setPendingCount] = useState(0);
  const [stats, setStats] = useState<HomeStats>(null);
  const [layout, setLayout] = useState<HomeLayout>("portal");
  const [recentItems, setRecentItems] = useState<Item[]>([]);
  const [recentLoading, setRecentLoading] = useState(true);

  const firstName =
    user?.full_name?.trim().split(/\s+/)[0] ||
    user?.vtu_id?.replace(/^VTU/i, "") ||
    "Student";

  useEffect(() => {
    getHomeLayout().then(setLayout);
  }, []);

  const handleLayoutChange = useCallback((next: HomeLayout) => {
    setLayout(next);
    saveHomeLayout(next);
  }, []);

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
      (async () => {
        if (!token) return;
        try {
          const data = await fetchStats(token);
          if (alive) setStats(data);
        } catch {
          // Leave stats null — the strip just shows a loading dash, not a fake number.
        }
      })();
      return () => {
        alive = false;
      };
    }, [token]),
  );

  const loadRecent = useCallback(async () => {
    if (!token) return;
    try {
      const items = await fetchItems(token);
      const sorted = [...items].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
      setRecentItems(sorted.slice(0, 6));
    } catch {
      // Leave whatever was already loaded — the feed just won't refresh this time.
    } finally {
      setRecentLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (layout === "feed") loadRecent();
  }, [layout, loadRecent]);

  useFocusEffect(
    useCallback(() => {
      if (layout === "feed") loadRecent();
    }, [layout, loadRecent]),
  );

  const shared = {
    firstName,
    vtuId: user?.vtu_id,
    stats,
    statsLoading: !stats,
    pendingCount,
    // The switcher dock above already eats the safe-area inset — variants
    // just need a small gap under it, not the inset again.
    topInset: 14,
    onReportLost: () => navigation.navigate("Report", { mode: "lost" }),
    onReportFound: () => navigation.navigate("Report", { mode: "found" }),
    onBrowse: () => navigation.navigate("Feed"),
    onRequests: () => navigation.navigate("Claims"),
    onOpenApk: openFytApkPage,
    onAbout: () => navigation.navigate("About"),
    onLogout: logout,
  };

  return (
    <ConnectionGate>
      <View style={styles.root}>
        <DaylightBackdrop />
        <ConnectionBanner />
        <View
          style={[
            styles.switcherDock,
            { paddingTop: Math.max(insets.top, 12) + 8 },
          ]}
        >
          <HomeLayoutSwitcher value={layout} onChange={handleLayoutChange} />
          <Pressable
            style={({ pressed }) => [styles.sectionBtn, pressed && styles.sectionBtnPressed]}
            onPress={() => navigation.navigate("Safety")}
            accessibilityRole="button"
            accessibilityLabel="Switch to Campus Safety"
          >
            <Ionicons name="shield-checkmark-outline" size={16} color={COLORS.accent} />
          </Pressable>
        </View>
        <View style={{ flex: 1 }}>
          {layout === "grid" ? (
            <HomeGrid {...shared} />
          ) : layout === "feed" ? (
            <HomeFeed
              {...shared}
              recentItems={recentItems}
              recentLoading={recentLoading}
              onOpenItem={(itemId) => navigation.navigate("ItemDetail", { itemId })}
            />
          ) : (
            <HomePortal {...shared} />
          )}
        </View>
      </View>
    </ConnectionGate>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  switcherDock: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    paddingHorizontal: 20,
    paddingBottom: 8,
    width: "100%",
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: "center",
  },
  sectionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionBtnPressed: { opacity: 0.85 },
});
