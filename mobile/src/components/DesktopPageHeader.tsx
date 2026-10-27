import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { COLORS, FONTS, RADIUS } from "../constants/config";

/**
 * Title block for desktop sidebar pages that are opened on top of another
 * page (item details, report forms, …). Replaces the stack header, which
 * AppStack hides on wide screens: a Back pill + eyebrow, the page title,
 * an optional subtitle, and optional actions on the right.
 */
export function DesktopPageHeader({
  eyebrow,
  title,
  subtitle,
  right,
  back = true,
}: {
  eyebrow: string;
  title: string;
  subtitle?: React.ReactNode;
  right?: React.ReactNode;
  back?: boolean;
}) {
  const navigation = useNavigation();
  const goBack = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else (navigation as { navigate: (name: string) => void }).navigate("MainTabs");
  };

  return (
    <View style={styles.row}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={styles.eyebrowRow}>
          {back ? (
            <Pressable
              onPress={goBack}
              style={({ pressed }) => [styles.backPill, pressed && { opacity: 0.7 }]}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons name="chevron-back" size={14} color={COLORS.primary} />
              <Text style={styles.backText}>Back</Text>
            </Pressable>
          ) : null}
          <Text style={styles.eyebrow} numberOfLines={1}>
            {eyebrow}
          </Text>
        </View>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 18,
  },
  eyebrowRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  backPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingVertical: 4,
    paddingLeft: 6,
    paddingRight: 10,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  backText: { fontFamily: FONTS.sansSemi, fontSize: 12.5, color: COLORS.primary },
  eyebrow: {
    flexShrink: 1,
    fontFamily: FONTS.sansBold,
    fontSize: 11,
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  title: {
    marginTop: 6,
    fontFamily: FONTS.display,
    fontSize: 28,
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 4,
    maxWidth: 720,
    fontFamily: FONTS.sans,
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.textMuted,
  },
  right: { flexDirection: "row", alignItems: "center", gap: 10 },
});
