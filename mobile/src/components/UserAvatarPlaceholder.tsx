import React, { useState } from "react";
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS } from "../constants/config";

/**
 * Welcome-poster avatar — shows the user's real uploaded photo when there
 * is one, otherwise an initial on a navy badge. The small camera badge
 * doubles as the "tap to add/change a photo" affordance when `onPress` is
 * given (upload happens in the caller — this component just triggers it
 * and shows a spinner while `loading` is true).
 */
export function UserAvatarPlaceholder({
  initial,
  photoUri,
  size = 72,
  onPress,
  loading = false,
}: {
  initial: string;
  photoUri?: string | null;
  size?: number;
  onPress?: () => void;
  loading?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const badgeSize = Math.round(size * 0.36);
  const showPhoto = Boolean(photoUri) && !failed;

  const content = (
    <View style={{ width: size, height: size }}>
      {showPhoto ? (
        <Image
          source={{ uri: photoUri as string }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          onError={() => setFailed(true)}
        />
      ) : (
        <View
          style={[
            styles.circle,
            { width: size, height: size, borderRadius: size / 2 },
          ]}
        >
          <Text style={[styles.letter, { fontSize: size * 0.4 }]}>{initial}</Text>
        </View>
      )}
      {loading ? (
        <View style={[styles.loadingOverlay, { borderRadius: size / 2 }]}>
          <ActivityIndicator size="small" color="#fff" />
        </View>
      ) : onPress ? (
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
      ) : null}
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      accessibilityRole="button"
      accessibilityLabel={showPhoto ? "Change profile photo" : "Add a profile photo"}
    >
      {content}
    </Pressable>
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
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(20,31,66,.55)",
    alignItems: "center",
    justifyContent: "center",
  },
});
