import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { TrustBadges } from "../TrustBadges";
import { AppButton } from "../Ui";
import { COLORS, FONTS, RADIUS } from "../../constants/config";

/** Policy footer shared by every Home layout — trust badges, safety reporting, APK link, About, logout. */
export function HomeUtilityFooter({
  onOpenApk,
  onAbout,
  onSafety,
  onLogout,
}: {
  onOpenApk: () => void;
  onAbout: () => void;
  onSafety: () => void;
  onLogout: () => void;
}) {
  return (
    <View>
      <TrustBadges />

      <Pressable
        style={({ pressed }) => [styles.safetyCard, pressed && styles.pressed]}
        onPress={onSafety}
        accessibilityRole="button"
        accessibilityLabel="Report a safety concern, private"
      >
        <View style={styles.safetyIcon}>
          <Ionicons name="shield-checkmark-outline" size={16} color={COLORS.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.safetyTitle}>Report a safety concern</Text>
          <Text style={styles.safetySub}>Ragging, harassment or bullying — private, separate from Lost &amp; Found</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
      </Pressable>

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
  safetyCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.xl,
    padding: 14,
    marginBottom: 14,
  },
  safetyIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "rgba(169,31,35,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  safetyTitle: { fontFamily: FONTS.sansBold, fontSize: 13.5, color: COLORS.text },
  safetySub: { marginTop: 2, fontFamily: FONTS.sans, fontSize: 11.5, color: COLORS.textMuted, lineHeight: 16 },
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
