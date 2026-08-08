import React from "react";
import { Pressable, StyleProp, StyleSheet, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { navigate } from "../navigation/navigationRef";
import { COLORS } from "../constants/config";

/** Jumps to the Home tab from anywhere, including nested stack screens. */
export function HomeButton({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable
      accessibilityLabel="Go to home"
      hitSlop={8}
      onPress={() => navigate("MainTabs", { screen: "HomeTab" })}
      style={({ pressed }) => [styles.button, pressed && styles.pressed, style]}
    >
      <Ionicons name="home" size={18} color={COLORS.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    backgroundColor: COLORS.surfaceMuted,
  },
});
