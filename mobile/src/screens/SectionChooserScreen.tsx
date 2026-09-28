import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GridPlot, InkSurface } from "../components/SpatialBackdrop";
import { PressScale } from "../components/PressScale";
import { SessionBanner } from "../components/SessionBanner";
import { useAuth } from "../context/AuthContext";
import { COLORS, CONTENT_MAX_WIDTH, FONTS, RADIUS } from "../constants/config";
import { RootStackParamList } from "../navigation/types";

export function SectionChooserScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const firstName =
    user?.full_name?.trim().split(/\s+/)[0] ||
    user?.vtu_id?.replace(/^VTU/i, "") ||
    "Student";

  return (
    <View style={styles.root}>
      <View
        style={[
          styles.content,
          { paddingTop: Math.max(insets.top, 12) + 16, paddingBottom: Math.max(insets.bottom, 20) + 16 },
        ]}
      >
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>Welcome</Text>
            <Text style={styles.name}>{firstName}</Text>
          </View>
          <SessionBanner />
        </View>

        <Text style={styles.prompt}>What do you need?</Text>

        <PressScale
          style={styles.tile}
          onPress={() => navigation.navigate("MainTabs")}
          accessibilityRole="button"
          accessibilityLabel="Lost and Found"
        >
          <InkSurface style={styles.tileFill}>
            <View style={styles.tileIcon}>
              <Ionicons name="bag-handle-outline" size={26} color="#fff" />
            </View>
            <Text style={styles.tileTitleInk}>Lost &amp; Found</Text>
            <Text style={styles.tileSubInk}>Report or find a lost valuable on campus</Text>
            <View style={styles.tileArrow}>
              <Ionicons
                name="arrow-up"
                size={16}
                color="#fff"
                style={{ transform: [{ rotate: "45deg" }] }}
              />
            </View>
          </InkSurface>
        </PressScale>

        <PressScale
          style={[styles.tile, styles.tileSafety]}
          onPress={() => navigation.navigate("Safety")}
          accessibilityRole="button"
          accessibilityLabel="Campus safety, report a concern"
        >
          <View style={styles.tileFill}>
            <GridPlot variant="light" opacity={0.5} />
            <View style={[styles.tileIcon, styles.tileIconSafety]}>
              <Ionicons name="shield-checkmark-outline" size={26} color={COLORS.accent} />
            </View>
            <Text style={styles.tileTitle}>Campus Safety</Text>
            <Text style={styles.tileSub}>
              Privately report ragging, harassment or bullying
            </Text>
            <View style={[styles.tileArrow, styles.tileArrowSafety]}>
              <Ionicons
                name="arrow-up"
                size={16}
                color={COLORS.accent}
                style={{ transform: [{ rotate: "45deg" }] }}
              />
            </View>
          </View>
        </PressScale>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    width: "100%",
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 8,
  },
  eyebrow: {
    fontFamily: FONTS.sansMedium,
    fontSize: 12,
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1.4,
  },
  name: {
    fontFamily: FONTS.display,
    fontSize: 30,
    color: COLORS.text,
    letterSpacing: -0.5,
    marginTop: 6,
  },
  prompt: {
    fontFamily: FONTS.sansSemi,
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 20,
    marginBottom: 12,
  },
  tile: {
    flex: 1,
    borderRadius: RADIUS["2xl"],
    overflow: "hidden",
    marginBottom: 16,
  },
  tileSafety: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tileFill: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  tileIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,.14)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  tileIconSafety: {
    backgroundColor: "rgba(169,31,35,0.08)",
  },
  tileTitleInk: {
    fontFamily: FONTS.display,
    fontSize: 26,
    color: "#fff",
    letterSpacing: -0.5,
  },
  tileSubInk: {
    marginTop: 8,
    fontFamily: FONTS.sans,
    fontSize: 13,
    color: "rgba(255,255,255,.7)",
    lineHeight: 19,
    maxWidth: 260,
  },
  tileTitle: {
    fontFamily: FONTS.display,
    fontSize: 26,
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  tileSub: {
    marginTop: 8,
    fontFamily: FONTS.sans,
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 19,
    maxWidth: 260,
  },
  tileArrow: {
    position: "absolute",
    top: 20,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  tileArrowSafety: {
    backgroundColor: COLORS.surfaceMuted,
  },
});
