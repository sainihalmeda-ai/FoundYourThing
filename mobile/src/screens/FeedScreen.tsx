import React, { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { fetchItems } from "../api/auth";
import { ConnectionBanner } from "../components/ConnectionBanner";
import { ConnectionGate } from "../components/ConnectionGate";
import { ErrorState } from "../components/ErrorState";
import { ItemCard } from "../components/ItemCard";
import { LoadingOverlay } from "../components/LoadingOverlay";
import { ScreenShell } from "../components/Ui";
import {
  EmptyState,
  NoSearchResultsState,
} from "../components/states";
import { useAuth } from "../context/AuthContext";
import { RootStackParamList } from "../navigation/types";
import { COLORS } from "../constants/config";
import type { Item } from "../types";

type FeedTab = "lost" | "found" | "mine";

export function FeedScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { token, user } = useAuth();
  const [campusItems, setCampusItems] = useState<Item[]>([]);
  const [myItems, setMyItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<FeedTab>("lost");

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

  const sectionItems = useMemo(() => {
    if (tab === "mine") return myItems;
    const list = campusItems.filter((item) => item.item_type === tab);
    // Active reports first; returned found history at the bottom.
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

  if (loading) return <LoadingOverlay label="Loading campus feed..." />;
  if (error) return <ErrorState error={error} onRetry={load} />;

  const lostCount = campusItems.filter(
    (i) => i.item_type === "lost" && i.status !== "recovered",
  ).length;
  const foundActive = campusItems.filter(
    (i) => i.item_type === "found" && i.status !== "recovered",
  ).length;
  const foundReturned = campusItems.filter(
    (i) => i.item_type === "found" && i.status === "recovered",
  ).length;

  return (
    <ConnectionGate>
      <View style={styles.root}>
        <ConnectionBanner />
        <ScreenShell
          title="Campus feed"
          subtitle="After a real return, lost reports are removed. Successfully returned found items stay here so campus can trust the app."
        >
          <View style={styles.tabs}>
            {(
              [
                { key: "lost" as const, label: `Lost (${lostCount})` },
                {
                  key: "found" as const,
                  label:
                    foundReturned > 0
                      ? `Found (${foundActive}+${foundReturned})`
                      : `Found (${foundActive})`,
                },
                { key: "mine" as const, label: `My items (${myItems.length})` },
              ] as const
            ).map((entry) => (
              <Pressable
                key={entry.key}
                style={[styles.tab, tab === entry.key && styles.tabActive]}
                onPress={() => setTab(entry.key)}
              >
                <Text style={[styles.tabText, tab === entry.key && styles.tabTextActive]}>
                  {entry.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {tab === "found" && foundReturned > 0 ? (
            <Text style={styles.historyNote}>
              Green RETURNED badges are success history — items already given back to owners.
            </Text>
          ) : null}
          <TextInput
            style={styles.search}
            value={query}
            onChangeText={setQuery}
            placeholder={
              tab === "mine" ? "Search your reports…" : `Search ${tab} items…`
            }
            placeholderTextColor={COLORS.textMuted}
            autoCapitalize="none"
            clearButtonMode="while-editing"
          />
          <FlatList
            data={filtered}
            keyExtractor={(item) => String(item.id)}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  load();
                }}
              />
            }
            renderItem={({ item }) => (
              <ItemCard
                item={item}
                isMine={item.reporter_vtu_id === user?.vtu_id}
                onPress={() => navigation.navigate("ItemDetail", { itemId: item.id })}
                onRaiseLostClaim={
                  tab === "found" &&
                  item.reporter_vtu_id !== user?.vtu_id &&
                  item.status !== "recovered"
                    ? () =>
                        navigation.navigate("Report", {
                          mode: "lost",
                          linkFoundId: item.id,
                        })
                    : undefined
                }
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
                      ? "No reports from you yet"
                      : tab === "lost"
                        ? "No lost reports"
                        : "No found reports"
                  }
                  message={
                    tab === "mine"
                      ? "Items you report appear here. After a real match they leave the public feed but stay here until recovered or reopened."
                      : tab === "lost"
                        ? "When someone reports a lost valuable, it shows in this section."
                        : "When someone reports a found valuable, it shows in this section."
                  }
                  actionLabel="Report an item"
                  onAction={() => navigation.navigate("Home")}
                  compact
                />
              )
            }
          />
        </ScreenShell>
      </View>
    </ConnectionGate>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  tabs: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabText: {
    color: COLORS.text,
    fontWeight: "700",
    fontSize: 12,
    textAlign: "center",
  },
  tabTextActive: {
    color: "#fff",
  },
  historyNote: {
    marginBottom: 10,
    color: COLORS.success,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "600",
  },
  search: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: COLORS.text,
    marginBottom: 12,
  },
});
