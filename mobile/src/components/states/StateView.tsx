import React from "react";
import { Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS, RADIUS, SHADOW } from "../../constants/config";

export type StateAction = {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
};

type IconName = React.ComponentProps<typeof Ionicons>["name"];

type Props = {
  icon: IconName;
  iconColor?: string;
  iconBg?: string;
  title: string;
  message: string;
  hint?: string;
  actions?: StateAction[];
  compact?: boolean;
  pulse?: boolean;
  style?: ViewStyle;
};

/** Empty / offline / error panels — no Reanimated (safe on release APKs). */
export function StateView({
  icon,
  iconColor = COLORS.accent,
  iconBg = COLORS.card,
  title,
  message,
  hint,
  actions = [],
  compact = false,
  style,
}: Props) {
  return (
    <View style={[styles.container, compact && styles.compact, style]}>
      <View style={styles.inner}>
        <View style={styles.iconWrap}>
          <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
            <Ionicons name={icon} size={36} color={iconColor} />
          </View>
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}

        {actions.length > 0 ? (
          <View style={styles.actions}>
            {actions.map((action) => (
              <Pressable
                key={action.label}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.button,
                  action.variant === "secondary"
                    ? styles.buttonSecondary
                    : styles.buttonPrimary,
                  pressed && styles.buttonPressed,
                ]}
                onPress={action.onPress}
              >
                <Text
                  style={[
                    styles.buttonText,
                    action.variant === "secondary" && styles.buttonTextSecondary,
                  ]}
                >
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 28,
    backgroundColor: COLORS.background,
    overflow: "visible",
  },
  compact: {
    flex: 0,
    paddingVertical: 48,
    paddingTop: 56,
    backgroundColor: "transparent",
    overflow: "visible",
  },
  inner: {
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
    overflow: "visible",
  },
  iconWrap: {
    width: 112,
    height: 112,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    overflow: "visible",
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    ...SHADOW.soft,
  },
  title: {
    fontSize: 24,
    fontFamily: FONTS.display,
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 10,
    letterSpacing: -0.4,
  },
  message: {
    fontSize: 14,
    fontFamily: FONTS.sans,
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: 21,
    maxWidth: 320,
  },
  hint: {
    marginTop: 12,
    fontSize: 13,
    fontFamily: FONTS.sansMedium,
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: 19,
    maxWidth: 300,
    opacity: 0.9,
  },
  actions: {
    marginTop: 24,
    width: "100%",
    maxWidth: 280,
    gap: 10,
  },
  button: {
    paddingVertical: 14,
    borderRadius: RADIUS["2xl"],
    alignItems: "center",
  },
  buttonPrimary: {
    backgroundColor: COLORS.primary,
  },
  buttonSecondary: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  buttonPressed: {
    opacity: 0.88,
  },
  buttonText: {
    color: COLORS.primaryForeground,
    fontFamily: FONTS.sansBold,
    fontSize: 15,
  },
  buttonTextSecondary: {
    color: COLORS.text,
  },
});
