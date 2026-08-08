import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  Easing,
  FadeIn,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { COLORS, FONTS, SHADOW } from "../../constants/config";

type Props = {
  label?: string;
  /** Optional second line under the label */
  hint?: string;
  compact?: boolean;
};

function BounceDot({ delay }: { delay: number }) {
  const bounce = useSharedValue(0);

  useEffect(() => {
    bounce.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration: 480, easing: Easing.inOut(Easing.quad) }),
        -1,
        true,
      ),
    );
  }, [bounce, delay]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(bounce.value, [0, 1], [0.35, 1]),
    transform: [{ translateY: interpolate(bounce.value, [0, 1], [0, -4]) }],
  }));

  return <Animated.View style={[styles.dot, style]} />;
}

export function LoadingState({
  label = "Loading...",
  hint,
  compact = false,
}: Props) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
      -1,
      false,
    );
  }, [progress]);

  const ringOuter = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(progress.value, [0, 1], [0.86, 1.18]) }],
    opacity: interpolate(progress.value, [0, 0.5, 1], [0.35, 0.18, 0]),
  }));

  const ringMid = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(progress.value, [0, 1], [0.92, 1.08]) }],
    opacity: interpolate(progress.value, [0, 0.55, 1], [0.5, 0.22, 0]),
  }));

  const spin = useAnimatedStyle(() => ({
    transform: [{ rotate: `${progress.value * 360}deg` }],
  }));

  return (
    <View style={[styles.container, compact && styles.compact]}>
      <Animated.View entering={FadeIn.duration(320)} style={styles.inner}>
        <View style={styles.orbWrap}>
          <Animated.View style={[styles.ring, styles.ringOuter, ringOuter]} />
          <Animated.View style={[styles.ring, styles.ringMid, ringMid]} />
          <View style={styles.core}>
            <Animated.View style={spin}>
              <Ionicons name="sync-outline" size={28} color={COLORS.accent} />
            </Animated.View>
          </View>
        </View>

        <Text style={styles.label}>{label}</Text>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}

        <View style={styles.dots}>
          <BounceDot delay={0} />
          <BounceDot delay={160} />
          <BounceDot delay={320} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
    padding: 28,
  },
  compact: {
    flex: 0,
    paddingVertical: 48,
    backgroundColor: "transparent",
  },
  inner: {
    alignItems: "center",
    maxWidth: 300,
  },
  orbWrap: {
    width: 120,
    height: 120,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 22,
  },
  ring: {
    position: "absolute",
    borderRadius: 999,
    borderWidth: 2,
    borderColor: COLORS.accent,
  },
  ringOuter: {
    width: 112,
    height: 112,
  },
  ringMid: {
    width: 92,
    height: 92,
    opacity: 0.5,
  },
  core: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOW.soft,
  },
  label: {
    fontFamily: FONTS.displayMedium,
    fontSize: 20,
    color: COLORS.text,
    textAlign: "center",
    letterSpacing: -0.3,
  },
  hint: {
    marginTop: 8,
    fontFamily: FONTS.sans,
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.textMuted,
    textAlign: "center",
  },
  dots: {
    flexDirection: "row",
    gap: 7,
    marginTop: 18,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.accent,
  },
});
