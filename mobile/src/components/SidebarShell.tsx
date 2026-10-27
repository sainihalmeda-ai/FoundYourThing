import React, { useCallback, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { COLORS, WIDE_BREAKPOINT } from "../constants/config";
import { ConnectionGate } from "./ConnectionGate";
import { DesktopSidebar, type SidebarSection } from "./DesktopSidebar";
import { LoadingOverlay } from "./LoadingOverlay";

// Built-in Animated only — Reanimated crashed the production APK.
const useNativeDriver = Platform.OS !== "web";

/**
 * Page frame for the sidebar sections (Home, Feed, Profile, Safety).
 *
 * Desktop: sidebar stays fixed, the content pane fades/rises in on every
 * focus, and loading shows a spinner inside the pane — never a full-screen
 * overlay, which used to blank the sidebar on each switch.
 * Phone: plain full-screen page; loading keeps the full-screen overlay.
 *
 * Navigators skip their own transition on wide screens (AppStack.tsx) so
 * they don't slide the sidebar along with the page.
 */
export function SidebarShell({
  active,
  pendingCount,
  loading = false,
  loadingLabel = "Loading",
  loadingHint,
  backdrop,
  children,
}: {
  active: SidebarSection;
  pendingCount?: number;
  loading?: boolean;
  loadingLabel?: string;
  loadingHint?: string;
  /** Decorative layer rendered behind the content (e.g. DaylightBackdrop). */
  backdrop?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { width } = useWindowDimensions();
  const desktop = width >= WIDE_BREAKPOINT;

  if (!desktop) {
    if (loading) return <LoadingOverlay label={loadingLabel} hint={loadingHint} />;
    return (
      <ConnectionGate>
        <View style={styles.root}>
          {backdrop}
          {children}
        </View>
      </ConnectionGate>
    );
  }

  return (
    <ConnectionGate>
      <View style={styles.desktopRoot}>
        <DesktopSidebar active={active} pendingCount={pendingCount} />
        {/* Remount when loading finishes so the real content animates in too. */}
        <AnimatedPane key={loading ? "loading" : "ready"}>
          {backdrop}
          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={COLORS.accent} size="large" />
            </View>
          ) : (
            children
          )}
        </AnimatedPane>
      </View>
    </ConnectionGate>
  );
}

function AnimatedPane({ children }: { children: React.ReactNode }) {
  const progress = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      progress.setValue(0);
      const anim = Animated.timing(progress, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver,
      });
      anim.start();
      return () => anim.stop();
    }, [progress]),
  );

  return (
    <Animated.View
      style={{
        flex: 1,
        opacity: progress,
        transform: [
          { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [28, 0] }) },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  desktopRoot: { flex: 1, flexDirection: "row", backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
});
