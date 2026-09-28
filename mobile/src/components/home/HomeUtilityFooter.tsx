import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { TrustBadges } from "../TrustBadges";
import { AppButton } from "../Ui";
import { COLORS, FONTS } from "../../constants/config";

/** Policy footer shared by every Home layout — trust badges, APK link, About, logout. */
export function HomeUtilityFooter({
  onOpenApk,
  onAbout,
  onLogout,
}: {
  onOpenApk: () => void;
  onAbout: () => void;
  onLogout: () => void;
}) {
  return (
    <View>
      <TrustBadges />

      <Pressable style={({ pressed }) => [styles.row, pressed && styles.pressed]} onPress={onOpenApk}>
        <Ionicons name="logo-android" size={16} color={COLORS.accent} />
        <Text style={styles.rowText}>Get the Android app · Download FYT APK</Text>
      </Pressable>

      <Pressable style={({ pressed }) => [styles.row, pressed && styles.pressed]} onPress={onAbout}>
        <Ionicons name="information-circle-outline" size={16} color={COLORS.textMuted} />
        <Text style={[styles.rowText, { color: COLORS.textMuted }]}>
          About FoundYourThing &amp; privacy model
        </Text>
      </Pressable>

      <AppButton label="Log out" onPress={onLogout} variant="ghost" style={{ marginTop: 8 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  rowText: {
    fontFamily: FONTS.sansSemi,
    fontSize: 13,
    color: COLORS.accent,
  },
  pressed: { opacity: 0.92 },
});
