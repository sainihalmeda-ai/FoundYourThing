import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PhotoView } from "./PhotoView";
import { COLORS, FONTS, RADIUS } from "../constants/config";
import { matchConfidence, type MatchTone } from "../lib/matchConfidence";

const MATCH_TONE_COLORS: Record<MatchTone, { text: string; background: string }> = {
  strong: { text: COLORS.success, background: "rgba(34,197,94,0.12)" },
  fair: { text: COLORS.gold, background: "rgba(200,155,60,0.16)" },
  weak: { text: COLORS.danger, background: "rgba(239,68,68,0.12)" },
};

// Built-in Animated only — Reanimated crashed the production APK.
const nativeDriver = Platform.OS !== "web";

/**
 * The checks the matcher really runs (backend/app/services/embeddings.py):
 * a small thumbnail for layout, an edge-direction histogram for shape,
 * a colour histogram, then the title/details text. The scores themselves
 * were computed when the reports were posted — this animates that
 * comparison and reveals the real numbers; it never invents per-step ones.
 */
const STEPS: { label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: "Comparing photo layout", icon: "grid-outline" },
  { label: "Comparing shape & edges", icon: "shapes-outline" },
  { label: "Comparing colours", icon: "color-palette-outline" },
  { label: "Comparing title & details", icon: "document-text-outline" },
];
const STEP_MS = 650;
const COUNT_MS = 900;
// Phases: 1..4 = that step is running, 5 = counting up the overall score, 6 = done.
const SCORING = STEPS.length + 1;
const DONE = STEPS.length + 2;

// Where the "feature points" blink while shape/colour are being compared.
const FEATURE_POINTS = [
  [0.22, 0.3],
  [0.68, 0.22],
  [0.45, 0.55],
  [0.3, 0.78],
  [0.75, 0.7],
  [0.55, 0.38],
];

const clampPct = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

export function MatchAnalyzer({
  leftUri,
  leftLabel,
  rightUri,
  rightLabel,
  imageScore,
  textScore,
  combinedScore,
  photoHeight = 170,
}: {
  leftUri: string;
  leftLabel: string;
  rightUri: string;
  rightLabel: string;
  /** Percentages (0–100) as sent by the API. */
  imageScore: number;
  textScore: number;
  combinedScore: number;
  photoHeight?: number;
}) {
  const image = clampPct(imageScore);
  const text = clampPct(textScore);
  const overall = clampPct(combinedScore);
  const verdict = matchConfidence(overall);
  const palette = MATCH_TONE_COLORS[verdict.tone];

  const [run, setRun] = useState(0);
  const [phase, setPhase] = useState(0);
  const [shown, setShown] = useState(0);

  const scan = useRef(new Animated.Value(0)).current;
  const scanOpacity = useRef(new Animated.Value(1)).current;
  const points = useRef(new Animated.Value(0)).current;
  const photoBar = useRef(new Animated.Value(0)).current;
  const textBar = useRef(new Animated.Value(0)).current;
  const counter = useRef(new Animated.Value(0)).current;

  // Drive the step sequence; restarts on Replay.
  useEffect(() => {
    setPhase(1);
    setShown(0);
    [photoBar, textBar, counter].forEach((v) => v.setValue(0));
    scanOpacity.setValue(1);

    const timers = STEPS.map((_, i) => setTimeout(() => setPhase(i + 2), STEP_MS * (i + 1)));
    const anims: Animated.CompositeAnimation[] = [];

    timers.push(
      // Photo checks done → photo bar fills.
      setTimeout(() => {
        const a = Animated.timing(photoBar, {
          toValue: image,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        });
        anims.push(a);
        a.start();
      }, STEP_MS * 3),
      // Text check done → text bar fills and the overall score counts up.
      setTimeout(() => {
        const a = Animated.parallel([
          Animated.timing(textBar, {
            toValue: text,
            duration: 600,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          }),
          Animated.timing(counter, {
            toValue: overall,
            duration: COUNT_MS,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          }),
          Animated.timing(scanOpacity, { toValue: 0, duration: 500, useNativeDriver: nativeDriver }),
        ]);
        anims.push(a);
        a.start();
      }, STEP_MS * 4),
      setTimeout(() => setPhase(DONE), STEP_MS * 4 + COUNT_MS),
    );

    const id = counter.addListener(({ value }) => setShown(Math.round(value)));
    return () => {
      timers.forEach(clearTimeout);
      anims.forEach((a) => a.stop());
      counter.removeListener(id);
    };
  }, [run, image, text, overall, photoBar, textBar, counter, scanOpacity]);

  // Scan line sweeps while analysing; feature points blink during shape/colour.
  useEffect(() => {
    if (phase >= DONE) return;
    const sweep = Animated.loop(
      Animated.sequence([
        Animated.timing(scan, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.quad), useNativeDriver: nativeDriver }),
        Animated.timing(scan, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.quad), useNativeDriver: nativeDriver }),
      ]),
    );
    const blink = Animated.loop(
      Animated.sequence([
        Animated.timing(points, { toValue: 1, duration: 300, useNativeDriver: nativeDriver }),
        Animated.timing(points, { toValue: 0.25, duration: 300, useNativeDriver: nativeDriver }),
      ]),
    );
    sweep.start();
    blink.start();
    return () => {
      sweep.stop();
      blink.stop();
    };
  }, [phase >= DONE, scan, points]); // eslint-disable-line react-hooks/exhaustive-deps

  const analysing = phase < DONE;
  const showPoints = phase === 2 || phase === 3;
  const scanY = scan.interpolate({ inputRange: [0, 1], outputRange: [0, photoHeight - 26] });

  const frame = (uri: string, label: string) => (
    <View style={[styles.frame, { height: photoHeight }]}>
      <PhotoView uri={uri} style={{ height: photoHeight, borderRadius: 0 }} />
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {showPoints
          ? FEATURE_POINTS.map(([x, y]) => (
              <Animated.View
                key={`${x}-${y}`}
                style={[
                  styles.point,
                  { left: `${x * 100}%`, top: `${y * 100}%`, opacity: points },
                ]}
              />
            ))
          : null}
        <Animated.View
          style={[styles.scanBand, { opacity: scanOpacity, transform: [{ translateY: scanY }] }]}
        >
          <View style={styles.scanLine} />
        </Animated.View>
        <View style={[styles.corner, styles.cornerTL]} />
        <View style={[styles.corner, styles.cornerTR]} />
        <View style={[styles.corner, styles.cornerBL]} />
        <View style={[styles.corner, styles.cornerBR]} />
        <View style={styles.frameLabel}>
          <Text style={styles.frameLabelText}>{label}</Text>
        </View>
      </View>
    </View>
  );

  const barWidth = (v: Animated.Value) =>
    v.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] });

  return (
    <View>
      <View style={styles.photos}>
        {frame(leftUri, leftLabel)}
        <View style={styles.link}>
          <Ionicons name={analysing ? "scan-outline" : "git-compare-outline"} size={14} color="#fff" />
        </View>
        {frame(rightUri, rightLabel)}
      </View>

      <View style={styles.statusRow}>
        {analysing ? (
          <>
            <View style={styles.liveDot} />
            <Text style={styles.statusText}>
              {phase >= SCORING
                ? "Calculating the overall match…"
                : `Analysing… ${STEPS[Math.max(phase - 1, 0)].label.toLowerCase()}`}
            </Text>
          </>
        ) : (
          <>
            <Ionicons name="checkmark-circle" size={15} color={COLORS.success} />
            <Text style={styles.statusText}>Analysis complete</Text>
            <Pressable onPress={() => setRun((r) => r + 1)} style={styles.replay} hitSlop={6}>
              <Ionicons name="refresh" size={12} color={COLORS.primary} />
              <Text style={styles.replayText}>Replay</Text>
            </Pressable>
          </>
        )}
      </View>

      <View style={styles.resultRow}>
        <View style={[styles.scoreBox, { borderColor: analysing ? COLORS.border : palette.text }]}>
          <Text style={[styles.scoreValue, { color: analysing ? COLORS.textMuted : palette.text }]}>
            {shown}
            <Text style={styles.scorePct}>%</Text>
          </Text>
          <Text style={styles.scoreCaption}>overall match</Text>
        </View>
        <View style={styles.steps}>
          {STEPS.map((step, i) => {
            const state = phase > i + 1 ? "done" : phase === i + 1 ? "active" : "waiting";
            return (
              <View key={step.label} style={styles.stepRow}>
                <Ionicons
                  name={state === "done" ? "checkmark-circle" : step.icon}
                  size={14}
                  color={
                    state === "done"
                      ? COLORS.success
                      : state === "active"
                        ? COLORS.primary
                        : COLORS.border
                  }
                />
                <Text
                  style={[
                    styles.stepText,
                    state === "active" && styles.stepTextActive,
                    state === "done" && styles.stepTextDone,
                  ]}
                  numberOfLines={1}
                >
                  {step.label}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.bars}>
        <ScoreBar label="Photo similarity" value={image} width={barWidth(photoBar)} filled={phase > 3} />
        <ScoreBar label="Title & details" value={text} width={barWidth(textBar)} filled={phase > 4} />
      </View>

      {!analysing ? (
        <View style={[styles.verdict, { backgroundColor: palette.background }]}>
          <Text style={[styles.verdictTitle, { color: palette.text }]}>{verdict.label} match</Text>
          <Text style={styles.verdictHint}>{verdict.hint}</Text>
        </View>
      ) : null}
      <Text style={styles.footnote}>
        Overall leans on the photo (85%) with title & details adding 15%. Scores were worked
        out when the reports were posted — always check the photos yourself.
      </Text>
    </View>
  );
}

function ScoreBar({
  label,
  value,
  width,
  filled,
}: {
  label: string;
  value: number;
  width: Animated.AnimatedInterpolation<string>;
  filled: boolean;
}) {
  return (
    <View style={styles.barRow}>
      <Text style={styles.barLabel}>{label}</Text>
      <View style={styles.barTrack}>
        <Animated.View style={[styles.barFill, { width }]} />
      </View>
      <Text style={styles.barValue}>{filled ? `${value}%` : "—"}</Text>
    </View>
  );
}

const CORNER = 16;
const styles = StyleSheet.create({
  photos: { flexDirection: "row", alignItems: "center", gap: 8 },
  frame: {
    flex: 1,
    borderRadius: RADIUS.lg,
    overflow: "hidden",
    backgroundColor: COLORS.primaryDark,
  },
  link: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: -18,
    zIndex: 2,
    borderWidth: 2,
    borderColor: COLORS.card,
  },
  scanBand: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 26,
    justifyContent: "flex-end",
    backgroundColor: "rgba(200,155,60,0.16)",
  },
  scanLine: { height: 2, backgroundColor: COLORS.gold },
  point: {
    position: "absolute",
    width: 8,
    height: 8,
    marginLeft: -4,
    marginTop: -4,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: "#fff",
    backgroundColor: COLORS.gold,
  },
  corner: { position: "absolute", width: CORNER, height: CORNER, borderColor: COLORS.gold },
  cornerTL: { top: 8, left: 8, borderTopWidth: 2, borderLeftWidth: 2 },
  cornerTR: { top: 8, right: 8, borderTopWidth: 2, borderRightWidth: 2 },
  cornerBL: { bottom: 8, left: 8, borderBottomWidth: 2, borderLeftWidth: 2 },
  cornerBR: { bottom: 8, right: 8, borderBottomWidth: 2, borderRightWidth: 2 },
  frameLabel: {
    position: "absolute",
    left: 10,
    bottom: 10,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: RADIUS.pill,
    backgroundColor: "rgba(20,31,66,0.78)",
  },
  frameLabelText: { fontFamily: FONTS.sansSemi, fontSize: 10.5, color: "#fff" },

  statusRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.accent },
  statusText: { flex: 1, fontFamily: FONTS.sansSemi, fontSize: 12.5, color: COLORS.text },
  replay: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surfaceMuted,
  },
  replayText: { fontFamily: FONTS.sansSemi, fontSize: 11.5, color: COLORS.primary },

  resultRow: { flexDirection: "row", gap: 12, marginTop: 10, alignItems: "stretch" },
  scoreBox: {
    width: 104,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  scoreValue: { fontFamily: FONTS.display, fontSize: 32, lineHeight: 38 },
  scorePct: { fontFamily: FONTS.sansBold, fontSize: 16 },
  scoreCaption: { fontFamily: FONTS.sansMedium, fontSize: 10.5, color: COLORS.textMuted },
  steps: { flex: 1, minWidth: 0, gap: 5, justifyContent: "center" },
  stepRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  stepText: { flex: 1, fontFamily: FONTS.sansMedium, fontSize: 12, color: "#98A2B3" },
  stepTextActive: { color: COLORS.primary, fontFamily: FONTS.sansBold },
  stepTextDone: { color: COLORS.text },

  bars: { marginTop: 12, gap: 7 },
  barRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  barLabel: { width: 108, fontFamily: FONTS.sansMedium, fontSize: 11.5, color: COLORS.textMuted },
  barTrack: {
    flex: 1,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.surfaceMuted,
    overflow: "hidden",
  },
  barFill: { height: 7, borderRadius: 4, backgroundColor: COLORS.primary },
  barValue: {
    width: 38,
    textAlign: "right",
    fontFamily: FONTS.sansBold,
    fontSize: 12,
    color: COLORS.text,
  },

  verdict: { marginTop: 12, borderRadius: RADIUS.lg, padding: 10 },
  verdictTitle: { fontFamily: FONTS.sansBold, fontSize: 13 },
  verdictHint: { marginTop: 2, fontFamily: FONTS.sans, fontSize: 12, lineHeight: 17, color: COLORS.text },
  footnote: {
    marginTop: 8,
    fontFamily: FONTS.sans,
    fontSize: 10.5,
    lineHeight: 15,
    color: "#98A2B3",
  },
});
