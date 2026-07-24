import React from "react";
import { Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";
import { COLORS } from "../../constants/config";

export type StateAction = {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
};

type Props = {
  icon: string;
  iconColor?: string;
  iconBg?: string;
  title: string;
  message: string;
  hint?: string;
  actions?: StateAction[];
  compact?: boolean;
  style?: ViewStyle;
};

export function StateView({
  icon,
  iconColor = COLORS.primary,
  iconBg = "#E8F0FA",
  title,
  message,
  hint,
  actions = [],
  compact = false,
  style,
}: Props) {
  return (
    <View style={[styles.container, compact && styles.compact, style]}>
      <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
        <Text style={[styles.icon, { color: iconColor }]}>{icon}</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      {actions.length > 0 ? (
        <View style={styles.actions}>
          {actions.map((action) => (
            <Pressable
              key={action.label}
              style={[
                styles.button,
                action.variant === "secondary" ? styles.buttonSecondary : styles.buttonPrimary,
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 28,
    backgroundColor: COLORS.background,
  },
  compact: {
    flex: 0,
    paddingVertical: 32,
    backgroundColor: "transparent",
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  icon: {
    fontSize: 28,
    fontWeight: "700",
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 320,
  },
  hint: {
    marginTop: 10,
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 300,
    opacity: 0.85,
  },
  actions: {
    marginTop: 22,
    width: "100%",
    maxWidth: 280,
    gap: 10,
  },
  button: {
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonPrimary: {
    backgroundColor: COLORS.primary,
  },
  buttonSecondary: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  buttonTextSecondary: {
    color: COLORS.primary,
  },
});
