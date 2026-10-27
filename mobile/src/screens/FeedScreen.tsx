import React, { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  LayoutChangeEvent,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fetchItems } from "../api/auth";
import { ConnectionBanner } from "../components/ConnectionBanner";
import { DaylightBackdrop } from "../components/SpatialBackdrop";
import { ErrorState } from "../components/ErrorState";
import { HomeButton } from "../components/HomeButton";
import { SidebarShell } from "../components/SidebarShell";
import { ItemCard } from "../components/ItemCard";
import { FeedDesktop } from "../components/feed/FeedDesktop";
import { PageEnter } from "../components/PageEnter";
import {
  EmptyState,
  NoSearchResultsState,
} from "../components/states";
import { useAuth } from "../context/AuthContext";
import { matchesQuery, returnedLast } from "../lib/feedFilter";
import { RootStackParamList } from "../navigation/types";
import { COLORS, FONTS, RADIUS, SHADOW, WIDE_BREAKPOINT } from "../constants/config";
import type { Item } from "../types";

type FeedTab = "lost" | "found" | "mine";
const TAB_ORDER: FeedTab[] = ["lost", "found", "mine"];

export function FeedScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const wide = width >= WIDE_BREAKPOINT;
  const { token, user } = useAuth();
  const [campusItems, setCampusItems] = useState<Item[]>([]);
  const [myItems, setMyItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<FeedTab>("found");
  const [segmentW, setSegmentW] = useState(0);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setError(null);
      const [campus, mine] = await Promise.all([
        fetchItems(token),
        fetchItems(token, { mine: true }),
      ]);
      setCampusItems(campus);
      setMyItems(mine);
      setUpdatedAt(new Date());
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useFocusEffect(
    // Refetch quietly on refocus — only the first visit shows a loader.
    useCallback(() => {
      load();
    }, [load]),
  );

  const onSegmentLayout = (e: LayoutChangeEvent) => {
    setSegmentW(e.nativeEvent.layout.width);
  };

  const cellW = Math.max((segmentW - 8) / 3, 0);
  const pillLeft = 4 + TAB_ORDER.indexOf(tab) * cellW;

  const sectionItems = useMemo(
    () =>
      tab === "mine"
        ? myItems
        : returnedLast(campusItems.filter((item) => item.item_type === tab)),
    [campusItems, myItems, tab],
  );

  const filtered = useMemo(
    () => sectionItems.filter((item) => matchesQuery(item, query)),
    [sectionItems, query],
  );

  const refresh = () => {
    setRefreshing(true);
    load();
  };

  /** Claim / answer buttons on a card — only on other students' open reports. */
  const cardActions = (item: Item) => ({
    onRaiseLostClaim:
      item.item_type === "found" &&
      item.reporter_vtu_id !== user?.vtu_id &&
      item.status !== "recovered"
        ? () => navigation.navigate("Report", { mode: "lost", linkFoundId: item.id })
        : undefined,
    onAnswerLost:
      item.item_type === "lost" && item.reporter_vtu_id !== user?.vtu_id
        ? () => navigation.navigate("Report", { mode: "found", linkLostId: item.id })
        : undefined,
  });

  if (error) return <ErrorState error={error} onRetry={load} />;

  if (wide) {
    return (
      <SidebarShell
        active="feed"
        loading={loading}
        loadingLabel="Loading campus feed"
        backdrop={<DaylightBackdrop />}
      >
        <ConnectionBanner />
        <FeedDesktop
          campusItems={campusItems}
          myItems={myItems}
          myVtu={user?.vtu_id}
          refreshing={refreshing}
          updatedAt={updatedAt}
          onRefresh={refresh}
          onOpen={(item) => navigation.navigate("ItemDetail", { itemId: item.id })}
          cardActions={cardActions}
          onReport={(mode) => navigation.navigate("Report", { mode })}
        />
      </SidebarShell>
    );
  }

  const tabs: { key: FeedTab; label: string }[] = [
    { key: "lost", label: "Lost" },
    { key: "found", label: "Found" },
    { key: "mine", label: "My items" },
  ];

  const content = (
    <>
      <ConnectionBanner />
      <PageEnter
          style={[
            styles.header,
            { paddingTop: Math.max(insets.top, 12) + 8 },
          ]}
        >
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.title}>Campus feed</Text>
              <Text style={styles.subtitle}>Only valuables reported here</Text>
            </View>
            <View style={styles.headerActions}>
              <Pressable
                style={styles.refreshBtn}
                accessibilityLabel="Refresh feed"
                onPress={refresh}
              >
                <Ionicons name="refresh" size={18} color={COLORS.primary} />
              </Pressable>
              <HomeButton />
            </View>
          </View>

          <View style={styles.searchWrap}>
            <Ionicons name="search" size={16} color={COLORS.textMuted} />
            <TextInput
              style={styles.search}
              value={query}
              onChangeText={setQuery}
              placeholder="Search phone, wallet, ID…"
              placeholderTextColor={COLORS.textMuted}
              autoCapitalize="none"
              clearButtonMode="while-editing"
            />
            {query ? (
              <Pressable
                onPress={() => setQuery("")}
                hitSlop={8}
                style={styles.clearBtn}
              >
                <Ionicons name="close" size={14} color={COLORS.textMuted} />
              </Pressable>
            ) : null}
          </View>

          <View style={styles.segment} onLayout={onSegmentLayout}>
            <View
              style={[
                styles.segmentPill,
                { width: cellW, transform: [{ translateX: pillLeft }] },
              ]}
            />
            {tabs.map((entry) => {
              const active = tab === entry.key;
              return (
                <Pressable
                  key={entry.key}
                  style={styles.segmentItem}
                  onPress={() => setTab(entry.key)}
                >
                  <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                    {entry.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </PageEnter>

        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor={COLORS.accent}
            />
          }
          renderItem={({ item }) => (
            <ItemCard
              item={item}
              isMine={item.reporter_vtu_id === user?.vtu_id}
              onPress={() => navigation.navigate("ItemDetail", { itemId: item.id })}
              {...cardActions(item)}
            />
          )}
          ListEmptyComponent={
            query.trim() ? (
              <NoSearchResultsState
                query={query.trim()}
                onClear={() => setQuery("")}
                compact
              />
            ) : (
              <EmptyState
                title={
                  tab === "mine"
                    ? "You haven’t posted yet"
                    : "Nothing here yet"
                }
                message={
                  tab === "mine"
                    ? "Items you report appear here until recovered or reopened."
                    : tab === "lost"
                      ? "When someone reports a lost valuable, it shows here."
                      : "When someone reports a found valuable, it shows here."
                }
                actionLabel="Report an item"
                onAction={() => navigation.navigate("Report", { mode: tab === "found" ? "found" : "lost" })}
                compact
              />
            )
          }
        />
    </>
  );

  return (
    <SidebarShell
      active="feed"
      loading={loading}
      loadingLabel="Loading campus feed"
      loadingHint="Fetching the latest lost & found reports…"
      backdrop={<DaylightBackdrop />}
    >
      {content}
    </SidebarShell>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  title: {
    fontFamily: FONTS.display,
    fontSize: 26,
    color: COLORS.text,
    letterSpacing: -0.4,
  },
  subtitle: {
    marginTop: 6,
    fontFamily: FONTS.sans,
    fontSize: 12,
    color: COLORS.textMuted,
  },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS["2xl"],
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  search: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: COLORS.text,
    fontFamily: FONTS.sansMedium,
  },
  clearBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  segment: {
    flexDirection: "row",
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: RADIUS["2xl"],
    padding: 4,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    position: "relative",
  },
  segmentPill: {
    position: "absolute",
    top: 4,
    bottom: 4,
    left: 0,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    ...SHADOW.soft,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    zIndex: 1,
  },
  segmentText: {
    fontFamily: FONTS.sansMedium,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  segmentTextActive: {
    color: COLORS.text,
    fontFamily: FONTS.sansSemi,
  },
  list: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
    flexGrow: 1,
  },
});
