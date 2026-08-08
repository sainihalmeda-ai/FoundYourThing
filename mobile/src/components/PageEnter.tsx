import React from "react";
import { StyleProp, View, ViewStyle } from "react-native";

/** Plain wrapper — kept API-compatible; animations removed for APK stability. */
export function PageEnter({
  children,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={style}>{children}</View>;
}

export function FadeEnter({
  children,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={style}>{children}</View>;
}
