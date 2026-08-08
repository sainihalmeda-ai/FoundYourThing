import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import { ConnectionGate } from "../components/ConnectionGate";
import { DaylightBackdrop } from "../components/SpatialBackdrop";
import { ErrorState } from "../components/ErrorState";
import { HomeButton } from "../components/HomeButton";
import { ItemCard } from "../components/ItemCard";
import { LoadingOverlay } from "../components/LoadingOverlay";
import { PageEnter } from "../components/PageEnter";
import {
  EmptyState,
  NoSearchResultsState,
} from "../components/states";
import { useAuth } from "../context/AuthContext";
import { RootStackParamList } from "../navigation/types";
import { COLORS, FONTS, RADIUS, SHADOW } from "../constants/config";
import type { Item } from "../types";

type FeedTab = "lost" | "found" | "mine";
const TAB_ORDER: FeedTab[] = ["lost", "found", "mine"];

export function FeedScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const { token, user } = useAuth();
  const [campusItems, setCampusItems] = useState<Item[]>([]);
  const [myItems, setMyItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<FeedTab>("found");
  const [segmentW, setSegmentW] = useState(0);

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
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load]),
  );

  const onSegmentLayout = (e: LayoutChangeEvent) => {
    setSegmentW(e.nativeEvent.layout.width);
  };

  const cellW = Math.max((segmentW - 8) / 3, 0);
  const pillLeft = 4 + TAB_ORDER.indexOf(tab) * cellW;

  const sectionItems = useMemo(() => {
    if (tab === "mine") return myItems;
    const list = campusItems.filter((item) => item.item_type === tab);
    return [...list].sort((a, b) => {
      const ar = a.status === "recovered" ? 1 : 0;
      const br = b.status === "recovered" ? 1 : 0;
      return ar - br;
    });
  }, [campusItems, myItems, tab]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sectionItems;
    return sectionItems.filter((item) => {
      const haystack = [
        item.title,
        item.description,
        item.location,
        item.category_label,
        item.reporter_vtu_id,
        item.status,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [sectionItems, query]);

  if (loading) {
    return (
      <LoadingOverlay
        label="Loading campus feed"
        hint="Fetching the latest lost & found reports…"
      />
    );
  }
  if (error) return <ErrorState error={error} onRetry={load} />;

  const tabs: { key: FeedTab; label: string }[] = [
    { key: "lost", label: "Lost" },
    { key: "found", label: "Found" },
    { key: "mine", label: "My items" },
  ];

  return (
    <ConnectionGate>
      <View style={styles.root}>
        <DaylightBackdrop />
        <ConnectionBanner />
        <PageEnter
          style={[
            styles.header,
            { paddingTop: Math.max(insets.top, 12) + 8 },
            wide && styles.wideCol,
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
                onPress={() => {
                  setRefreshing(true);
                  load();
                }}
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
          contentContainerStyle={[styles.list, wide && styles.wideCol]}
          numColumns={wide ? 2 : 1}
          key={wide ? "wide" : "narrow"}
          columnWrapperStyle={wide ? styles.columnWrap : undefined}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
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
          renderItem={({ item }) => (
            <View style={wide ? styles.gridItem : undefined}>
              <ItemCard
                item={item}
                isMine={item.reporter_vtu_id === user?.vtu_id}
                onPress={() => navigation.navigate("ItemDetail", { itemId: item.id })}
                onRaiseLostClaim={
                  item.item_type === "found" &&
                  item.reporter_vtu_id !== user?.vtu_id &&
                  item.status !== "recovered"
                    ? () =>
                        navigation.navigate("Report", {
                          mode: "lost",
                          linkFoundId: item.id,
                        })
                    : undefined
                }
                onAnswerLost={
                  item.item_type === "lost" && item.reporter_vtu_id !== user?.vtu_id
                    ? () =>
                        navigation.navigate("Report", {
                          mode: "found",
                          linkLostId: item.id,
                        })
                    : undefined
                }
              />
            </View>
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
                onAction={() => navigation.navigate("Home")}
                compact
              />
            )
          }
        />
      </View>
    </ConnectionGate>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  wideCol: {
    width: "100%",
    maxWidth: 768,
    alignSelf: "center",
  },
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
  columnWrap: {
    gap: 12,
  },
  gridItem: {
    flex: 1,
  },
});
