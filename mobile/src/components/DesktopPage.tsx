import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { ConnectionBanner } from "./ConnectionBanner";
import { DesktopPageHeader } from "./DesktopPageHeader";
import type { SidebarSection } from "./DesktopSidebar";
import { SidebarShell } from "./SidebarShell";
import { useDesktopLayout } from "../lib/useDesktopLayout";
import { COLORS, RADIUS, SHADOW } from "../constants/config";

/**
 * Desktop frame for pages opened on top of a sidebar section (item
 * details, report forms, safety reports…): sidebar + page header + either
 * a main/side column pair or free-form children. Phones never use this —
 * each screen keeps its own phone layout.
 */
export function DesktopPage({
  active,
  loading = false,
  eyebrow,
  title,
  subtitle,
  headerRight,
  back = true,
  main,
  side,
  sideWidth = 380,
  children,
  overlay,
}: {
  active: SidebarSection;
  loading?: boolean;
  eyebrow: string;
  title: string;
  subtitle?: React.ReactNode;
  headerRight?: React.ReactNode;
  back?: boolean;
  /** Wide left column. */
  main?: React.ReactNode;
  /** Narrower right column (actions, status, help). */
  side?: React.ReactNode;
  sideWidth?: number;
  /** Free-form body instead of main/side. */
  children?: React.ReactNode;
  /** Rendered outside the scroll view, e.g. modals. */
  overlay?: React.ReactNode;
}) {
  const { contentWidth } = useDesktopLayout();
  // Side column drops below the main one when the main one would get too narrow.
  const stacked = contentWidth < sideWidth + 460;
  return (
    <SidebarShell active={active} loading={loading}>
      <ConnectionBanner />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <DesktopPageHeader
          eyebrow={eyebrow}
          title={title}
          subtitle={subtitle}
          right={headerRight}
          back={back}
        />
        {children ?? (
          <View style={[styles.grid, stacked && styles.gridStacked]}>
            {/* Stacked columns get their natural height (flex: 1 here would collapse them). */}
            <View style={stacked ? styles.stackedCol : styles.main}>{main}</View>
            {side ? (
              <View style={stacked ? styles.stackedCol : [styles.side, { width: sideWidth }]}>
                {side}
              </View>
            ) : null}
          </View>
        )}
      </ScrollView>
      {overlay}
    </SidebarShell>
  );
}

/** Plain white card used inside DesktopPage columns. */
export function DesktopCard({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: object;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 28,
    paddingTop: 20,
    paddingBottom: 32,
    width: "100%",
    maxWidth: 1240,
    alignSelf: "center",
  },
  grid: { flexDirection: "row", alignItems: "flex-start", gap: 20 },
  main: { flex: 1, minWidth: 0, gap: 16 },
  side: { gap: 16 },
  gridStacked: { flexDirection: "column", alignItems: "stretch" },
  stackedCol: { width: "100%", gap: 16 },
  card: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.xl,
    padding: 16,
    ...SHADOW.soft,
  },
});
