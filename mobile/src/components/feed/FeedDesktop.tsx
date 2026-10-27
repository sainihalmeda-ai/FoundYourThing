import React, { useMemo, useState } from "react";
import {
  LayoutChangeEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ItemCard } from "../ItemCard";
import { PressScale } from "../PressScale";
import { EmptyState } from "../states";
import { COLORS, FONTS, RADIUS, SHADOW } from "../../constants/config";
import { countBy, matchesQuery, returnedLast } from "../../lib/feedFilter";
import { useDesktopLayout } from "../../lib/useDesktopLayout";
import type { Item } from "../../types";

type FeedTab = "lost" | "found" | "mine";

const CARD_MIN_WIDTH = 250;
const GRID_GAP = 16;

/**
 * Desktop Browse feed: stat strip, a filter rail (search / category /
 * location / hide returned), and a responsive card grid — the same
 * dashboard look as Home instead of a narrow phone column.
 */
export function FeedDesktop({
  campusItems,
  myItems,
  myVtu,
  refreshing,
  updatedAt,
  onRefresh,
  onOpen,
  cardActions,
  onReport,
}: {
  campusItems: Item[];
  myItems: Item[];
  myVtu?: string;
  refreshing: boolean;
  updatedAt: Date | null;
  onRefresh: () => void;
  onOpen: (item: Item) => void;
  /** Claim / answer handlers for a card, or undefined when they don't apply. */
  cardActions: (item: Item) => { onRaiseLostClaim?: () => void; onAnswerLost?: () => void };
  onReport: (mode: "lost" | "found") => void;
}) {
  const [tab, setTab] = useState<FeedTab>("found");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [location, setLocation] = useState<string | null>(null);
  const [hideReturned, setHideReturned] = useState(false);
  const [gridWidth, setGridWidth] = useState(0);
  const [searchFocused, setSearchFocused] = useState(false);
  // In a narrow window the filter rail moves above the grid instead of beside it.
  const { contentWidth } = useDesktopLayout();
  const railOnTop = contentWidth < 860;

  const stats = useMemo(() => {
    const open = (type: "lost" | "found") =>
      campusItems.filter((i) => i.item_type === type && i.status !== "recovered").length;
    return {
      lost: open("lost"),
      found: open("found"),
      returned: campusItems.filter((i) => i.status === "recovered").length,
      mine: myItems.length,
    };
  }, [campusItems, myItems]);

  // Items in the chosen tab, before category/location/search narrow them.
  const tabItems = useMemo(
    () =>
      tab === "mine"
        ? myItems
        : returnedLast(campusItems.filter((i) => i.item_type === tab)),
    [campusItems, myItems, tab],
  );

  const categories = useMemo(() => countBy(tabItems, (i) => i.category_label), [tabItems]);
  const locations = useMemo(() => countBy(tabItems, (i) => i.location), [tabItems]);

  const results = useMemo(
    () =>
      tabItems.filter(
        (i) =>
          (!category || i.category_label === category) &&
          (!location || i.location === location) &&
          (!hideReturned || i.status !== "recovered") &&
          matchesQuery(i, query),
      ),
    [tabItems, category, location, hideReturned, query],
  );

  const filtersOn = Boolean(category || location || hideReturned || query.trim());
  const clearFilters = () => {
    setCategory(null);
    setLocation(null);
    setHideReturned(false);
    setQuery("");
  };
  const switchTab = (next: FeedTab) => {
    setTab(next);
    // A category/location from the other tab may not exist in this one.
    setCategory(null);
    setLocation(null);
  };

  const cols = Math.max(2, Math.floor((gridWidth + GRID_GAP) / (CARD_MIN_WIDTH + GRID_GAP)));
  const cardWidth = gridWidth ? (gridWidth - GRID_GAP * (cols - 1)) / cols : 0;
  const onGridLayout = (e: LayoutChangeEvent) => setGridWidth(e.nativeEvent.layout.width);

  const tabLabel = tab === "lost" ? "lost" : tab === "found" ? "found" : "of your";

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.eyebrow}>Lost &amp; Found</Text>
          <Text style={styles.title}>Campus feed</Text>
          <Text style={styles.subtitle}>
            Only valuables are reported here
            {updatedAt
              ? ` · updated ${updatedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
              : ""}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
            onPress={onRefresh}
            accessibilityLabel="Refresh feed"
          >
            <Ionicons
              name={refreshing ? "hourglass-outline" : "refresh"}
              size={17}
              color={COLORS.primary}
            />
          </Pressable>
          <PressScale style={[styles.actionBtn, styles.actionInk]} onPress={() => onReport("lost")}>
            <Ionicons name="add" size={16} color="#fff" />
            <Text style={styles.actionInkText}>Report lost</Text>
          </PressScale>
          <PressScale style={styles.actionBtn} onPress={() => onReport("found")}>
            <Ionicons name="arrow-undo-outline" size={15} color={COLORS.primary} />
            <Text style={styles.actionText}>Report found</Text>
          </PressScale>
        </View>
      </View>

      {/* Stat strip — doubles as the Lost / Found / Mine switch */}
      <View style={styles.statRow}>
        <StatTile
          label="Open lost"
          value={stats.lost}
          icon="search-outline"
          color={COLORS.accent}
          active={tab === "lost"}
          onPress={() => switchTab("lost")}
        />
        <StatTile
          label="Open found"
          value={stats.found}
          icon="hand-left-outline"
          color={COLORS.gold}
          active={tab === "found"}
          onPress={() => switchTab("found")}
        />
        <StatTile label="Returned to owners" value={stats.returned} icon="checkmark-done-outline" color="#2F855A" />
        <StatTile
          label="Your posts"
          value={stats.mine}
          icon="person-outline"
          color={COLORS.primary}
          active={tab === "mine"}
          onPress={() => switchTab("mine")}
        />
      </View>

      <View style={[styles.body, railOnTop && styles.bodyStacked]}>
        {/* Filter rail */}
        <View style={[styles.rail, railOnTop && styles.railTop]}>
          <View
            style={[
              styles.searchWrap,
              railOnTop && styles.searchWrapTop,
              searchFocused && styles.searchWrapFocused,
            ]}
          >
            <Ionicons name="search" size={15} color={COLORS.textMuted} />
            <TextInput
              style={styles.search}
              value={query}
              onChangeText={setQuery}
              placeholder="Search phone, wallet, ID…"
              placeholderTextColor={COLORS.textMuted}
              autoCapitalize="none"
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
            {query ? (
              <Pressable onPress={() => setQuery("")} hitSlop={8}>
                <Ionicons name="close-circle" size={16} color={COLORS.textMuted} />
              </Pressable>
            ) : null}
          </View>

          <View style={[styles.railCard, railOnTop && styles.railCardTop]}>
            <Text style={styles.railLabel}>Category</Text>
            <FilterRow label="All categories" count={tabItems.length} active={!category} onPress={() => setCategory(null)} />
            {categories.map(([name, count]) => (
              <FilterRow
                key={name}
                label={name}
                count={count}
                active={category === name}
                onPress={() => setCategory(category === name ? null : name)}
              />
            ))}
          </View>

          {locations.length > 0 ? (
            <View style={[styles.railCard, railOnTop && styles.railCardTop]}>
              <Text style={styles.railLabel}>Location</Text>
              <View style={styles.locChips}>
                {locations.map(([name, count]) => {
                  const active = location === name;
                  return (
                    <Pressable
                      key={name}
                      onPress={() => setLocation(active ? null : name)}
                      style={[styles.locChip, active && styles.locChipActive]}
                    >
                      <Text style={[styles.locChipText, active && styles.locChipTextActive]}>
                        {name} · {count}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}

          <View style={[styles.railCard, styles.switchCard]}>
            <Text style={styles.switchLabel}>Hide returned items</Text>
            <Switch
              value={hideReturned}
              onValueChange={setHideReturned}
              trackColor={{ false: COLORS.surfaceMuted, true: COLORS.primary }}
              thumbColor={COLORS.card}
            />
          </View>
        </View>

        {/* Results */}
        <View style={styles.results}>
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsTitle}>
              {results.length} {tabLabel} item{results.length === 1 ? "" : "s"}
              {category ? ` · ${category}` : ""}
              {location ? ` · ${location}` : ""}
            </Text>
            {filtersOn ? (
              <Pressable onPress={clearFilters} style={styles.clearBtn}>
                <Ionicons name="close" size={13} color={COLORS.primary} />
                <Text style={styles.clearText}>Clear filters</Text>
              </Pressable>
            ) : null}
          </View>

          <View style={styles.grid} onLayout={onGridLayout}>
            {results.length === 0 ? (
              <View style={{ width: "100%" }}>
                <EmptyState
                  title={filtersOn ? "No matches" : tab === "mine" ? "You haven’t posted yet" : "Nothing here yet"}
                  message={
                    filtersOn
                      ? "Try another category or location, or clear the filters."
                      : tab === "mine"
                        ? "Items you report appear here until recovered or reopened."
                        : `When someone reports a ${tab} valuable, it shows here.`
                  }
                  actionLabel={filtersOn ? "Clear filters" : "Report an item"}
                  onAction={filtersOn ? clearFilters : () => onReport(tab === "found" ? "found" : "lost")}
                  compact
                />
              </View>
            ) : cardWidth > 0 ? (
              results.map((item) => (
                <View key={item.id} style={{ width: cardWidth }}>
                  <ItemCard
                    item={item}
                    compact
                    isMine={item.reporter_vtu_id === myVtu}
                    onPress={() => onOpen(item)}
                    {...cardActions(item)}
                  />
                </View>
              ))
            ) : null}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

function StatTile({
  label,
  value,
  icon,
  color,
  active,
  onPress,
}: {
  label: string;
  value: number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.stat,
        active && styles.statActive,
        pressed && onPress ? styles.pressed : null,
      ]}
    >
      <View style={[styles.statIcon, { backgroundColor: `${color}1A` }]}>
        <Ionicons name={icon} size={17} color={color} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel} numberOfLines={2}>
          {label}
        </Text>
      </View>
      {active ? <View style={[styles.statDot, { backgroundColor: color }]} /> : null}
    </Pressable>
  );
}

function FilterRow({
  label,
  count,
  active,
  onPress,
}: {
  label: string;
  count: number;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.filterRow, active && styles.filterRowActive, pressed && styles.pressed]}
    >
      <Text style={[styles.filterText, active && styles.filterTextActive]} numberOfLines={1}>
        {label}
      </Text>
      <Text style={[styles.filterCount, active && styles.filterCountActive]}>{count}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 32,
    width: "100%",
    maxWidth: 1440,
    alignSelf: "center",
  },
  header: { flexDirection: "row", alignItems: "flex-end", gap: 16, marginBottom: 18 },
  eyebrow: {
    fontFamily: FONTS.sansBold,
    fontSize: 11,
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  title: { marginTop: 4, fontFamily: FONTS.display, fontSize: 28, color: COLORS.text, letterSpacing: -0.5 },
  subtitle: { marginTop: 4, fontFamily: FONTS.sans, fontSize: 12.5, color: COLORS.textMuted },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 40,
    paddingHorizontal: 16,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionInk: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  actionText: { fontFamily: FONTS.sansSemi, fontSize: 13, color: COLORS.primary },
  actionInkText: { fontFamily: FONTS.sansSemi, fontSize: 13, color: "#fff" },

  statRow: { flexDirection: "row", flexWrap: "wrap", gap: 14, marginBottom: 20 },
  stat: {
    flex: 1,
    minWidth: 140,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.xl,
    paddingVertical: 12,
    paddingHorizontal: 14,
    ...SHADOW.soft,
  },
  statActive: { borderColor: COLORS.primary, borderWidth: 1.5 },
  statIcon: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  statValue: { fontFamily: FONTS.display, fontSize: 20, color: COLORS.text },
  statLabel: { fontFamily: FONTS.sansMedium, fontSize: 11.5, color: COLORS.textMuted },
  statDot: { width: 8, height: 8, borderRadius: 4 },

  body: { flexDirection: "row", alignItems: "flex-start", gap: 20 },
  rail: { width: 250, gap: 14 },
  bodyStacked: { flexDirection: "column", alignItems: "stretch" },
  railTop: { width: "100%", flexDirection: "row", flexWrap: "wrap", alignItems: "flex-start" },
  railCardTop: { flex: 1, minWidth: 240 },
  searchWrap: {
    minWidth: 240,
    flexGrow: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    paddingHorizontal: 12,
  },
  searchWrapFocused: { borderColor: COLORS.primary },
  searchWrapTop: { width: "100%" },
  search: {
    flex: 1,
    paddingVertical: 11,
    fontSize: 13.5,
    color: COLORS.text,
    fontFamily: FONTS.sansMedium,
    // The wrapper's border shows focus; drop the browser's inner focus box.
    ...(Platform.OS === "web" ? ({ outlineStyle: "none" } as object) : null),
  },
  railCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.xl,
    padding: 12,
  },
  railLabel: {
    fontFamily: FONTS.sansBold,
    fontSize: 10.5,
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
    paddingHorizontal: 6,
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  filterRowActive: { backgroundColor: COLORS.surfaceMuted },
  filterText: { flex: 1, fontFamily: FONTS.sansMedium, fontSize: 12.5, color: COLORS.textMuted },
  filterTextActive: { color: COLORS.primary, fontFamily: FONTS.sansBold },
  filterCount: {
    minWidth: 22,
    textAlign: "center",
    fontFamily: FONTS.sansSemi,
    fontSize: 11,
    color: COLORS.textMuted,
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: 9,
    paddingHorizontal: 6,
    paddingVertical: 1,
    overflow: "hidden",
  },
  filterCountActive: { backgroundColor: COLORS.primary, color: "#fff" },
  locChips: { flexDirection: "row", flexWrap: "wrap", gap: 6, paddingHorizontal: 4 },
  locChip: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  locChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  locChipText: { fontFamily: FONTS.sansMedium, fontSize: 11.5, color: COLORS.textMuted },
  locChipTextActive: { color: "#fff" },
  switchCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  switchLabel: { fontFamily: FONTS.sansSemi, fontSize: 12.5, color: COLORS.text, paddingLeft: 6 },

  results: { flex: 1, minWidth: 0 },
  resultsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    minHeight: 28,
  },
  resultsTitle: { fontFamily: FONTS.sansSemi, fontSize: 13.5, color: COLORS.text },
  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surfaceMuted,
  },
  clearText: { fontFamily: FONTS.sansSemi, fontSize: 12, color: COLORS.primary },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: GRID_GAP },
  pressed: { opacity: 0.85 },
});
