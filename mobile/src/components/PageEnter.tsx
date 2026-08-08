import React from "react";
import { StyleProp, ViewStyle } from "react-native";
import Animated, { Easing, FadeInDown, FadeIn } from "react-native-reanimated";

/** Short page / panel enter — matches campus-connect 0.22s ease. */
export function PageEnter({
  children,
  delay = 0,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay)
        .duration(220)
        .easing(Easing.bezier(0.4, 0, 0.2, 1))}
      style={style}
    >
      {children}
    </Animated.View>
  );
}

export function FadeEnter({
  children,
  delay = 0,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Animated.View
      entering={FadeIn.delay(delay)
        .duration(220)
        .easing(Easing.bezier(0.4, 0, 0.2, 1))}
      style={style}
    >
      {children}
    </Animated.View>
  );
}
