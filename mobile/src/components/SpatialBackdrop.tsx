import React, { useMemo } from "react";
import { Platform, StyleSheet, View, ViewStyle } from "react-native";
import { COLORS } from "../constants/config";

type Variant = "ink" | "light";

/**
 * Architectural plot grid from campus-connect — spatial atmosphere only.
 * pointerEvents none so it never blocks taps.
 */
export function GridPlot({
  variant = "ink",
  style,
  opacity = 1,
}: {
  variant?: Variant;
  style?: ViewStyle;
  opacity?: number;
}) {
  const line = variant === "ink" ? "rgba(255,255,255,0.06)" : "rgba(16,42,86,0.045)";
  const size = 44;
  const cols = 14;
  const rows = 12;

  const lines = useMemo(
    () => (
      <>
        {Array.from({ length: cols }, (_, i) => (
          <View
            key={`v${i}`}
            style={{
              position: "absolute",
              left: i * size,
              top: 0,
              bottom: 0,
              width: StyleSheet.hairlineWidth * 2,
              backgroundColor: line,
            }}
          />
        ))}
        {Array.from({ length: rows }, (_, i) => (
          <View
            key={`h${i}`}
            style={{
              position: "absolute",
              top: i * size,
              left: 0,
              right: 0,
              height: StyleSheet.hairlineWidth * 2,
              backgroundColor: line,
            }}
          />
        ))}
      </>
    ),
    [line],
  );

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity }, style]}>
      {lines}
    </View>
  );
}

/** Daylight wash behind authenticated screens. */
export function DaylightBackdrop() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View
        style={[
          StyleSheet.absoluteFill,
          Platform.OS === "web"
            ? ({
                backgroundImage:
                  "radial-gradient(1100px 520px at 50% -12%, rgba(255,255,255,0.9), transparent 65%), linear-gradient(180deg, #F7F8FA, #F4F5F7)",
              } as ViewStyle)
            : { backgroundColor: COLORS.background },
        ]}
      />
      <GridPlot variant="light" opacity={0.9} style={{ height: 280, bottom: undefined }} />
    </View>
  );
}

/** Navy ink surface for splash / brand panels. */
export function InkSurface({ children, style }: { children?: React.ReactNode; style?: ViewStyle }) {
  return (
    <View
      style={[
        styles.ink,
        Platform.OS === "web"
          ? ({
              backgroundImage:
                "radial-gradient(900px 460px at 20% 0%, rgba(16,42,86,0.85), transparent 62%), linear-gradient(180deg, #102A56, #09182F)",
            } as ViewStyle)
          : null,
        style,
      ]}
    >
      <GridPlot variant="ink" opacity={0.5} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  ink: {
    backgroundColor: COLORS.inkTop,
    overflow: "hidden",
    position: "relative",
  },
});
