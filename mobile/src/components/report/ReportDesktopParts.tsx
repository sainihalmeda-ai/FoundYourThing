import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PhotoView } from "../PhotoView";
import { Badge } from "../Ui";
import { COLORS, FONTS, RADIUS, SHADOW } from "../../constants/config";

/** Pieces of the desktop report page (ReportScreen's wide layout). */

type IconName = keyof typeof Ionicons.glyphMap;

/** Numbered white card — one step of the report form. */
export function StepCard({
  step,
  title,
  icon,
  done,
  children,
}: {
  step?: number;
  title: string;
  icon: IconName;
  /** Turns the step number into a green check once its fields are filled. */
  done?: boolean;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        {step != null ? (
          <View style={[styles.stepDot, done && styles.stepDotDone]}>
            {done ? (
              <Ionicons name="checkmark" size={13} color="#fff" />
            ) : (
              <Text style={styles.stepNum}>{step}</Text>
            )}
          </View>
        ) : null}
        <Text style={styles.cardTitle}>{title}</Text>
        <Ionicons name={icon} size={16} color={COLORS.textMuted} />
      </View>
      {children}
    </View>
  );
}

/** Lost / Found switch in the page header. */
export function ModeToggle({
  mode,
  onChange,
}: {
  mode: "lost" | "found";
  onChange: (mode: "lost" | "found") => void;
}) {
  return (
    <View style={styles.toggle}>
      {(["lost", "found"] as const).map((m) => (
        <Pressable
          key={m}
          onPress={() => onChange(m)}
          style={[styles.toggleBtn, mode === m && styles.toggleBtnActive]}
          accessibilityRole="button"
          accessibilityState={{ selected: mode === m }}
        >
          <Ionicons
            name={m === "lost" ? "search-outline" : "hand-left-outline"}
            size={14}
            color={mode === m ? "#fff" : COLORS.textMuted}
          />
          <Text style={[styles.toggleText, mode === m && styles.toggleTextActive]}>
            {m === "lost" ? "I lost something" : "I found something"}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export type ReadyCheck = { label: string; done: boolean };

/** Live preview of how the report will look on the feed, plus a readiness checklist. */
export function ReportPreview({
  mode,
  photoUri,
  title,
  categoryLabel,
  location,
  isUrgent,
  checks,
}: {
  mode: "lost" | "found";
  photoUri: string | null;
  title: string;
  categoryLabel: string;
  location: string;
  isUrgent: boolean;
  checks: ReadyCheck[];
}) {
  const ready = checks.filter((c) => c.done).length;
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Preview on the feed</Text>
        <Ionicons name="eye-outline" size={16} color={COLORS.textMuted} />
      </View>

      <View style={styles.previewItem}>
        {photoUri ? (
          <PhotoView uri={photoUri} style={styles.previewPhoto} expandable={false} />
        ) : (
          <View style={[styles.previewPhoto, styles.previewEmpty]}>
            <Ionicons name="image-outline" size={22} color="rgba(255,255,255,0.6)" />
            <Text style={styles.previewEmptyText}>Your photo appears here</Text>
          </View>
        )}
        <View style={styles.previewBody}>
          <View style={styles.previewBadges}>
            <Badge label={mode === "lost" ? "Lost" : "Found"} tone={mode} />
            {mode === "lost" && isUrgent ? <Badge label="Urgent" tone="urgent" /> : null}
          </View>
          <Text style={styles.previewTitle} numberOfLines={1}>
            {title.trim() || "Short title"}
          </Text>
          <Text style={styles.previewMeta} numberOfLines={1}>
            {categoryLabel || "Category"} · {location || "Location"}
          </Text>
        </View>
      </View>

      <View style={styles.readyHeader}>
        <Text style={styles.readyLabel}>Ready to post</Text>
        <Text style={styles.readyCount}>
          {ready} of {checks.length}
        </Text>
      </View>
      <View style={styles.readyTrack}>
        <View
          style={[
            styles.readyFill,
            { width: `${(ready / checks.length) * 100}%` },
            ready === checks.length && styles.readyFillDone,
          ]}
        />
      </View>
      <View style={styles.checkList}>
        {checks.map((c) => (
          <View key={c.label} style={styles.checkRow}>
            <Ionicons
              name={c.done ? "checkmark-circle" : "ellipse-outline"}
              size={15}
              color={c.done ? COLORS.success : COLORS.border}
            />
            <Text style={[styles.checkText, c.done && styles.checkTextDone]}>{c.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const NEXT_STEPS: Record<"lost" | "found", { icon: IconName; title: string; body: string }[]> = {
  lost: [
    {
      icon: "megaphone-outline",
      title: "Goes live on the campus feed",
      body: "Only your VTU ID is shown with it.",
    },
    {
      icon: "sparkles-outline",
      title: "AI looks for matching found items",
      body: "Possible matches show up with a match %.",
    },
    {
      icon: "people-outline",
      title: "Contact shared only on consent",
      body: "Phone numbers are shared after the finder accepts.",
    },
  ],
  found: [
    {
      icon: "megaphone-outline",
      title: "Goes live on the campus feed",
      body: "Only your VTU ID is shown with it.",
    },
    {
      icon: "sparkles-outline",
      title: "AI looks for the owner's lost report",
      body: "Possible owners show up with a match %.",
    },
    {
      icon: "shield-checkmark-outline",
      title: "You decide who gets it",
      body: "Accept a request only when the details match.",
    },
  ],
};

export function NextSteps({ mode }: { mode: "lost" | "found" }) {
  return (
    <View style={[styles.card, styles.nextCard]}>
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, styles.nextTitle]}>What happens next</Text>
        <Ionicons name="git-network-outline" size={16} color="rgba(255,255,255,.7)" />
      </View>
      {NEXT_STEPS[mode].map((s, i) => (
        <View key={s.title} style={styles.nextRow}>
          <View style={styles.nextIcon}>
            <Ionicons name={s.icon} size={15} color="#fff" />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.nextStepTitle}>
              {i + 1}. {s.title}
            </Text>
            <Text style={styles.nextStepBody}>{s.body}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.xl,
    padding: 16,
    ...SHADOW.soft,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  cardTitle: { flex: 1, fontFamily: FONTS.displayMedium, fontSize: 15, color: COLORS.text },
  stepDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  stepDotDone: { backgroundColor: COLORS.success },
  stepNum: { fontFamily: FONTS.sansBold, fontSize: 11, color: COLORS.primary },

  toggle: {
    flexDirection: "row",
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.pill,
    padding: 4,
    gap: 4,
  },
  toggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: RADIUS.pill,
  },
  toggleBtnActive: { backgroundColor: COLORS.primary },
  toggleText: { fontFamily: FONTS.sansSemi, fontSize: 12.5, color: COLORS.textMuted },
  toggleTextActive: { color: "#fff" },

  previewItem: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    overflow: "hidden",
  },
  previewPhoto: { height: 112, borderRadius: 0 },
  previewEmpty: {
    backgroundColor: COLORS.primaryDark,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  previewEmptyText: { fontFamily: FONTS.sansMedium, fontSize: 11.5, color: "rgba(255,255,255,0.65)" },
  previewBody: { padding: 12 },
  previewBadges: { flexDirection: "row", gap: 6, marginBottom: 6 },
  previewTitle: { fontFamily: FONTS.sansBold, fontSize: 14, color: COLORS.text },
  previewMeta: { marginTop: 2, fontFamily: FONTS.sans, fontSize: 11.5, color: COLORS.textMuted },

  readyHeader: { flexDirection: "row", justifyContent: "space-between", marginTop: 14 },
  readyLabel: { fontFamily: FONTS.sansSemi, fontSize: 12, color: COLORS.text },
  readyCount: { fontFamily: FONTS.sansBold, fontSize: 12, color: COLORS.primary },
  readyTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.surfaceMuted,
    overflow: "hidden",
    marginTop: 6,
  },
  readyFill: { height: 6, borderRadius: 3, backgroundColor: COLORS.gold },
  readyFillDone: { backgroundColor: COLORS.success },
  checkList: { marginTop: 10, gap: 5 },
  checkRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  checkText: { fontFamily: FONTS.sansMedium, fontSize: 12, color: COLORS.textMuted },
  checkTextDone: { color: COLORS.text },

  nextCard: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  nextTitle: { color: "#fff" },
  nextRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  nextIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  nextStepTitle: { fontFamily: FONTS.sansBold, fontSize: 12.5, color: "#fff" },
  nextStepBody: { marginTop: 2, fontFamily: FONTS.sans, fontSize: 11.5, color: "rgba(255,255,255,.72)" },
});
