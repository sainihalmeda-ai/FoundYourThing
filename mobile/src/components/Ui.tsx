import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
} from "react-native";
import { COLORS } from "../constants/config";
import { ValidationMessage } from "./states/ValidationMessage";

export function PrimaryButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      style={[styles.primaryButton, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

export function SecondaryButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.secondaryButton} onPress={onPress}>
      <Text style={styles.secondaryButtonText}>{label}</Text>
    </Pressable>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  autoCapitalize = "none",
  error,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  error?: string | null;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, error ? styles.inputError : null]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
      />
      <ValidationMessage message={error} field />
    </View>
  );
}

export function ScreenShell({
  title,
  subtitle,
  children,
  style,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.screen, style]}>
      <Text style={styles.screenTitle}>{title}</Text>
      {subtitle ? <Text style={styles.screenSubtitle}>{subtitle}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontWeight: "700",
    fontSize: 16,
  },
  disabled: {
    opacity: 0.5,
  },
  fieldWrap: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 6,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.text,
  },
  inputError: {
    borderColor: COLORS.danger,
  },
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 20,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.text,
  },
  screenSubtitle: {
    marginTop: 6,
    marginBottom: 18,
    color: COLORS.textMuted,
    lineHeight: 20,
  },
});
