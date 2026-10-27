import React, { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fetchIncomingClaims, fetchItems, fetchStats } from "../api/auth";
import { ConnectionBanner } from "../components/ConnectionBanner";
import { ConnectionGate } from "../components/ConnectionGate";
import { DaylightBackdrop } from "../components/SpatialBackdrop";
import { SectionStepper } from "../components/SectionStepper";
import { SidebarShell } from "../components/SidebarShell";
import { HomeLayoutSwitcher } from "../components/home/HomeLayoutSwitcher";
import { HomePortal } from "../components/home/HomePortal";
import { HomeGrid } from "../components/home/HomeGrid";
import { HomeFeed } from "../components/home/HomeFeed";
import { HomeDesktop } from "../components/home/HomeDesktop";
import type { HomeStats } from "../components/home/types";
import { useAuth } from "../context/AuthContext";
import { COLORS, CONTENT_MAX_WIDTH, WIDE_BREAKPOINT } from "../constants/config";
import { getHomeLayout, saveHomeLayout, type HomeLayout } from "../lib/homeLayoutPreference";
import { openFytApkPage } from "../lib/apk";
import { RootStackParamList } from "../navigation/types";
import type { Item } from "../types";

export function HomeScreen() {
  const { user, token, logout, refreshProfile } = useAuth();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const wide = width >= WIDE_BREAKPOINT;
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [pendingCount, setPendingCount] = useState(0);
  const [stats, setStats] = useState<HomeStats>(null);
  const [statsError, setStatsError] = useState(false);
  const [layout, setLayout] = useState<HomeLayout>("portal");
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [itemsLoading, setItemsLoading] = useState(true);

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

  const loadStats = useCallback(async () => {
    if (!token) return;
    setStatsError(false);
    try {
      const data = await fetchStats(token);
      setStats(data);
    } catch {
      // A failed fetch must not look identical to "still loading" forever —
      // that left the desktop dashboard stuck on "Loading campus activity…"
      // with no way out. statsError lets HomeDesktop show a retry instead.
      setStatsError(true);
    }
  }, [token]);

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
      loadStats();
      return () => {
        alive = false;
      };
    }, [token, loadStats]),
  );

  // Full item list backs both the phone Feed layout (sliced to a preview)
  // and the desktop dashboard's real category/lost-found breakdown — only
  // fetched when one of those is actually showing.
  const loadItems = useCallback(async () => {
    if (!token) return;
    try {
      const items = await fetchItems(token);
      const sorted = [...items].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
      setAllItems(sorted);
    } catch {
      // Leave whatever was already loaded — it just won't refresh this time.
    } finally {
      setItemsLoading(false);
    }
  }, [token]);

  const needsItems = layout === "feed" || wide;

  useEffect(() => {
    if (needsItems) loadItems();
  }, [needsItems, loadItems]);

  useFocusEffect(
    useCallback(() => {
      if (needsItems) loadItems();
    }, [needsItems, loadItems]),
  );

  const recentItems = useMemo(() => allItems.slice(0, 6), [allItems]);

  const shared = {
    firstName,
    vtuId: user?.vtu_id,
    stats,
    statsLoading: !stats && !statsError,
    pendingCount,
    // The switcher dock above already eats the safe-area inset — variants
    // just need a small gap under it, not the inset again.
    topInset: 14,
    onReportLost: () => navigation.navigate("Report", { mode: "lost" }),
    onReportFound: () => navigation.navigate("Report", { mode: "found" }),
    onBrowse: () => navigation.navigate("MainTabs", { screen: "FeedTab" }),
    onRequests: () => navigation.navigate("MainTabs", { screen: "ClaimsTab" }),
    onOpenApk: openFytApkPage,
    onAbout: () => navigation.navigate("About"),
    onLogout: logout,
  };

  if (wide) {
    return (
      <SidebarShell active="home" pendingCount={pendingCount}>
        <HomeDesktop
          firstName={firstName}
          vtuId={user?.vtu_id}
          photoUrl={user?.photo_url}
          token={token}
          onPhotoUploaded={refreshProfile}
          stats={stats}
          statsLoading={!stats && !statsError}
          statsError={statsError}
          onRetryStats={loadStats}
          allItems={allItems}
          allItemsLoading={itemsLoading}
          onReportLost={shared.onReportLost}
          onReportFound={shared.onReportFound}
          onBrowse={shared.onBrowse}
          onSafety={() => navigation.navigate("Safety")}
          onOpenItem={(itemId) => navigation.navigate("ItemDetail", { itemId })}
        />
      </SidebarShell>
    );
  }

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
          <SectionStepper
            direction="forward"
            label="Campus Safety"
            onPress={() => navigation.navigate("Safety")}
          />
        </View>
        <View style={{ flex: 1 }}>
          {layout === "grid" ? (
            <HomeGrid {...shared} />
          ) : layout === "feed" ? (
            <HomeFeed
              {...shared}
              recentItems={recentItems}
              recentLoading={itemsLoading}
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
});
