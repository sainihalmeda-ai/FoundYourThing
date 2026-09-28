import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS } from "../constants/config";

/**
 * Placeholder "welcome poster" avatar — an initial on a navy badge with a
 * small camera badge marking it as a stand-in. Swap for the user's real
 * uploaded photo once profile photos exist; nothing else in the layout
 * should need to change (same size prop, same slot).
 */
export function UserAvatarPlaceholder({
  initial,
  size = 72,
}: {
  initial: string;
  size?: number;
}) {
  const badgeSize = Math.round(size * 0.36);
  return (
    <View style={{ width: size, height: size }}>
      <View
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      >
        <Text style={[styles.letter, { fontSize: size * 0.4 }]}>{initial}</Text>
      </View>
      <View
        style={[
          styles.badge,
          {
            width: badgeSize,
            height: badgeSize,
            borderRadius: badgeSize / 2,
            right: -2,
            bottom: -2,
          },
        ]}
      >
        <Ionicons name="camera" size={badgeSize * 0.55} color={COLORS.primary} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    backgroundColor: "rgba(255,255,255,.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.28)",
    alignItems: "center",
    justifyContent: "center",
  },
  letter: {
    fontFamily: FONTS.display,
    fontWeight: "700",
    color: "#fff",
  },
  badge: {
    position: "absolute",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
});
