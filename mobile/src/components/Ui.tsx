import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Switch as RNSwitch,
  Text,
  TextInput,
  View,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS, RADIUS, SHADOW } from "../constants/config";
import { ValidationMessage } from "./states/ValidationMessage";

type BtnVariant = "primary" | "secondary" | "ghost" | "danger" | "gold";

export function AppButton({
  label,
  onPress,
  disabled,
  loading,
  variant = "primary",
  style,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: BtnVariant;
  style?: ViewStyle;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const bg =
    variant === "secondary"
      ? COLORS.card
      : variant === "ghost"
        ? "transparent"
        : variant === "danger"
          ? COLORS.danger
          : variant === "gold"
            ? COLORS.gold
            : COLORS.primary;
  const color =
    variant === "secondary" || variant === "ghost"
      ? COLORS.text
      : variant === "gold"
        ? COLORS.goldForeground
        : COLORS.primaryForeground;

  return (
    <Pressable
      disabled={disabled || loading}
      onPressIn={() =>
        Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50, bounciness: 4 }).start()
      }
      onPressOut={() =>
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 4 }).start()
      }
      onPress={onPress}
    >
      <Animated.View
        style={[
          styles.btn,
          { backgroundColor: bg, transform: [{ scale }] },
          variant === "secondary" && styles.btnSecondary,
          variant === "ghost" && styles.btnGhost,
          (disabled || loading) && styles.disabled,
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={color} />
        ) : (
          <Text style={[styles.btnText, { color }]}>{label}</Text>
        )}
      </Animated.View>
    </Pressable>
  );
}

/** @deprecated use AppButton — kept for existing screens */
export function PrimaryButton(props: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return <AppButton {...props} variant="primary" loading={props.disabled && props.label.includes("...")} />;
}

export function SecondaryButton(props: { label: string; onPress: () => void }) {
  return <AppButton {...props} variant="secondary" style={{ marginTop: 10 }} />;
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  autoCapitalize = "none",
  autoComplete = "off",
  textContentType = "none",
  error,
  icon,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  /** Disable browser/password-manager autofill on auth fields. */
  autoComplete?: React.ComponentProps<typeof TextInput>["autoComplete"];
  textContentType?: React.ComponentProps<typeof TextInput>["textContentType"];
  error?: string | null;
  /** Optional leading Ionicons glyph (campus-connect auth fields). */
  icon?: React.ComponentProps<typeof Ionicons>["name"];
}) {
  const [focused, setFocused] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Chrome ignores autocomplete=off on password fields. Keep the input
  // read-only until the user taps it so saved credentials cannot paint in.
  useEffect(() => {
    const id = setTimeout(() => setUnlocked(true), 600);
    return () => clearTimeout(id);
  }, []);

  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, focused && styles.fieldLabelFocus]}>{label}</Text>
      <Pressable
        onPress={() => {
          setUnlocked(true);
          inputRef.current?.focus();
        }}
        style={[
          styles.fieldBox,
          focused && styles.fieldFocused,
          error ? styles.fieldError : null,
        ]}
      >
        {icon ? (
          <Ionicons
            name={icon}
            size={16}
            color={focused ? COLORS.accent : COLORS.textMuted}
            style={styles.fieldIcon}
          />
        ) : null}
        <TextInput
          ref={inputRef}
          style={[styles.input, icon ? styles.inputWithIcon : null]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textMuted}
          secureTextEntry={secureTextEntry}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete === "off" ? "new-password" : autoComplete}
          textContentType={textContentType}
          importantForAutofill="no"
          autoCorrect={false}
          spellCheck={false}
          editable={unlocked || focused}
          onFocus={() => {
            setUnlocked(true);
            setFocused(true);
          }}
          onBlur={() => setFocused(false)}
        />
      </Pressable>
      <ValidationMessage message={error} field />
    </View>
  );
}

export function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

export function Badge({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "lost" | "found" | "returned" | "connected" | "urgent" | "neutral" | "mine";
}) {
  return (
    <View style={[styles.badge, badgeTone[tone]]}>
      <Text style={[styles.badgeText, badgeTextTone[tone]]}>{label}</Text>
    </View>
  );
}

export function PremiumSwitch({
  value,
  onValueChange,
  label,
}: {
  value: boolean;
  onValueChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <View style={styles.switchRow}>
      {label ? <Text style={styles.switchLabel}>{label}</Text> : null}
      <RNSwitch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: COLORS.surfaceMuted, true: COLORS.accent }}
        thumbColor={COLORS.card}
        ios_backgroundColor={COLORS.surfaceMuted}
      />
    </View>
  );
}

export function ScreenShell({
  title,
  subtitle,
  children,
  style,
  compactTitle,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  style?: ViewStyle;
  compactTitle?: boolean;
}) {
  return (
    <View style={[styles.screen, style]}>
      <Text style={[styles.screenTitle, compactTitle && styles.screenTitleCompact]}>{title}</Text>
      {subtitle ? <Text style={styles.screenSubtitle}>{subtitle}</Text> : null}
      {children}
    </View>
  );
}

const badgeTone = StyleSheet.create({
  lost: {
    backgroundColor: "rgba(255,255,255,0.92)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  found: {
    backgroundColor: "rgba(255,255,255,0.92)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  returned: {
    backgroundColor: "rgba(255,255,255,0.92)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  connected: {
    backgroundColor: "rgba(200,155,60,0.15)",
    borderWidth: 1,
    borderColor: "rgba(200,155,60,0.3)",
  },
  urgent: { backgroundColor: COLORS.danger },
  neutral: { backgroundColor: COLORS.surfaceMuted },
  mine: {
    backgroundColor: "rgba(255,255,255,0.92)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
});

const badgeTextTone = StyleSheet.create({
  lost: { color: COLORS.danger },
  found: { color: COLORS.accent },
  returned: { color: COLORS.success },
  connected: { color: COLORS.gold },
  urgent: { color: "#fff" },
  neutral: { color: COLORS.textMuted },
  mine: { color: COLORS.success },
});

const styles = StyleSheet.create({
  btn: {
    paddingVertical: 14,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 56,
    ...SHADOW.soft,
  },
  btnSecondary: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  btnGhost: {
    shadowOpacity: 0,
    elevation: 0,
  },
  btnText: {
    fontFamily: FONTS.sansBold,
    fontSize: 15,
    letterSpacing: -0.2,
  },
  disabled: { opacity: 0.55 },
  fieldWrap: { marginBottom: 14 },
  fieldLabel: {
    marginBottom: 6,
    marginLeft: 2,
    fontFamily: FONTS.sansSemi,
    fontSize: 12,
    color: COLORS.textMuted,
  },
  fieldLabelFocus: { color: COLORS.accent },
  fieldBox: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS["2xl"],
    minHeight: 52,
    justifyContent: "center",
  },
  fieldFocused: {
    borderColor: COLORS.accent,
    ...SHADOW.glow,
  },
  fieldError: { borderColor: COLORS.danger },
  fieldIcon: {
    position: "absolute",
    left: 16,
    top: 17,
    zIndex: 2,
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: COLORS.text,
    fontFamily: FONTS.sansSemi,
  },
  inputWithIcon: { paddingLeft: 44 },
  chip: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    paddingHorizontal: 16,
    height: 40,
    borderRadius: RADIUS.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    color: COLORS.primary,
    fontSize: 13,
    fontFamily: FONTS.sansMedium,
  },
  chipTextActive: {
    color: COLORS.primaryForeground,
    fontFamily: FONTS.sansBold,
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: FONTS.sansBold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 16,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.xl,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  switchLabel: {
    flex: 1,
    color: COLORS.text,
    fontFamily: FONTS.sansSemi,
    fontSize: 14,
  },
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 20,
  },
  screenTitle: {
    fontSize: 26,
    fontFamily: FONTS.displayMedium,
    color: COLORS.text,
    letterSpacing: -0.4,
  },
  screenTitleCompact: { fontSize: 22 },
  screenSubtitle: {
    marginTop: 6,
    marginBottom: 18,
    color: COLORS.textMuted,
    lineHeight: 21,
    fontFamily: FONTS.sans,
    fontSize: 14,
  },
});
