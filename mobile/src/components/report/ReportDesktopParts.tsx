import React from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
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

/** One readiness step; `hint` says what's still needed while it isn't done. */
export type ReadyCheck = { label: string; done: boolean; hint: string };

/**
 * Live preview of the report as the feed will show it — photo with its
 * tags, title, category, location, the details text and who posted it —
 * plus a checklist that highlights whatever is still missing.
 */
export function ReportPreview({
  mode,
  photoUri,
  title,
  categoryLabel,
  location,
  description,
  reporterVtu,
  isUrgent,
  onUrgentChange,
  checks,
}: {
  mode: "lost" | "found";
  photoUri: string | null;
  title: string;
  categoryLabel: string;
  location: string;
  description: string;
  reporterVtu?: string;
  isUrgent: boolean;
  /** Lost reports only: the "pin near the top" switch, shown inside the card. */
  onUrgentChange?: (value: boolean) => void;
  checks: ReadyCheck[];
}) {
  const ready = checks.filter((c) => c.done).length;
  const allReady = ready === checks.length;
  const details = description.trim();

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Preview on the feed</Text>
        <Ionicons name="eye-outline" size={16} color={COLORS.textMuted} />
      </View>

      <View style={styles.previewItem}>
        <View>
          {photoUri ? (
            <PhotoView uri={photoUri} style={styles.previewPhoto} expandable={false} />
          ) : (
            <View style={[styles.previewPhoto, styles.previewEmpty]}>
              <Ionicons name="image-outline" size={26} color="rgba(255,255,255,0.6)" />
              <Text style={styles.previewEmptyText}>Your photo appears here</Text>
            </View>
          )}
          <View style={styles.previewBadges} pointerEvents="none">
            <Badge label={mode === "lost" ? "Lost" : "Found"} tone={mode} />
            {mode === "lost" && isUrgent ? <Badge label="Urgent" tone="urgent" /> : null}
          </View>
        </View>

        <View style={styles.previewBody}>
          <Text
            style={[styles.previewTitle, !title.trim() && styles.placeholderText]}
            numberOfLines={1}
          >
            {title.trim() || "Short title"}
          </Text>
          <View style={styles.previewFacts}>
            <PreviewFact icon="pricetag-outline" value={categoryLabel} placeholder="Category" />
            <PreviewFact icon="location-outline" value={location} placeholder="Location" />
          </View>
          <View style={[styles.detailsBox, !details && styles.detailsBoxEmpty]}>
            <Text style={styles.detailsLabel}>Details</Text>
            <Text
              style={[styles.detailsText, !details && styles.placeholderText]}
              numberOfLines={3}
            >
              {details || "Brand, colour, scratches, stickers — anything that proves it is yours."}
            </Text>
          </View>
          <View style={styles.previewFoot}>
            <View style={styles.footLeft}>
              <Ionicons name="person-outline" size={12} color={COLORS.textMuted} />
              <Text style={styles.footText}>{reporterVtu ?? "Your VTU ID"}</Text>
            </View>
            <View style={styles.timeChip}>
              <Ionicons name="time-outline" size={11} color={COLORS.textMuted} />
              <Text style={styles.timeText}>Just now</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.readyHeader}>
        <Text style={styles.readyLabel}>{allReady ? "Ready to post" : "Still needed"}</Text>
        <Text style={[styles.readyCount, allReady && styles.readyCountDone]}>
          {ready} of {checks.length}
        </Text>
      </View>
      <View style={styles.readyTrack}>
        <View
          style={[
            styles.readyFill,
            { width: `${(ready / checks.length) * 100}%` },
            allReady && styles.readyFillDone,
          ]}
        />
      </View>
      {/* Finished steps shrink to chips; missing ones get a highlighted line each. */}
      <View style={styles.doneChips}>
        {checks
          .filter((c) => c.done)
          .map((c) => (
            <View key={c.label} style={styles.doneChip}>
              <Ionicons name="checkmark-circle" size={13} color={COLORS.success} />
              <Text style={styles.doneChipText}>{c.label}</Text>
            </View>
          ))}
      </View>
      {checks
        .filter((c) => !c.done)
        .map((c) => (
          <View key={c.label} style={styles.todoRow}>
            <Ionicons name="alert-circle" size={15} color={TODO_COLOR} />
            <Text style={styles.checkTextTodo} numberOfLines={1}>
              {c.label}
              <Text style={styles.checkHint}> — {c.hint}</Text>
            </Text>
          </View>
        ))}

      {onUrgentChange ? (
        <View style={styles.urgentRow}>
          <Ionicons name="flash-outline" size={14} color={COLORS.accent} />
          <Text style={styles.urgentText}>Urgent alert — pin near the top</Text>
          <Switch
            value={isUrgent}
            onValueChange={onUrgentChange}
            trackColor={{ false: COLORS.surfaceMuted, true: COLORS.accent }}
            thumbColor={COLORS.card}
          />
        </View>
      ) : null}
    </View>
  );
}

const TODO_COLOR = "#B7791F";

function PreviewFact({
  icon,
  value,
  placeholder,
}: {
  icon: IconName;
  value: string;
  placeholder: string;
}) {
  return (
    <View style={styles.fact}>
      <Ionicons name={icon} size={12} color={COLORS.primary} />
      <Text style={[styles.factText, !value && styles.placeholderText]} numberOfLines={1}>
        {value || placeholder}
      </Text>
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
  previewPhoto: { height: 190, borderRadius: 0 },
  previewEmpty: {
    backgroundColor: COLORS.primaryDark,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  previewEmptyText: { fontFamily: FONTS.sansMedium, fontSize: 11.5, color: "rgba(255,255,255,0.65)" },
  previewBadges: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  previewBody: { padding: 12, gap: 8 },
  previewTitle: { fontFamily: FONTS.sansBold, fontSize: 16, color: COLORS.text },
  placeholderText: { color: "#98A2B3", fontFamily: FONTS.sansMedium },
  previewFacts: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  fact: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    maxWidth: "100%",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surfaceMuted,
  },
  factText: { flexShrink: 1, fontFamily: FONTS.sansSemi, fontSize: 11.5, color: COLORS.primary },
  detailsBox: {
    borderLeftWidth: 3,
    borderLeftColor: COLORS.gold,
    backgroundColor: "rgba(200,155,60,0.08)",
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  detailsBoxEmpty: { borderLeftColor: COLORS.border, backgroundColor: COLORS.surface },
  detailsLabel: {
    fontFamily: FONTS.sansBold,
    fontSize: 10,
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  detailsText: { fontFamily: FONTS.sansMedium, fontSize: 12.5, lineHeight: 17, color: COLORS.text },
  previewFoot: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  footLeft: { flexDirection: "row", alignItems: "center", gap: 4 },
  footText: { fontFamily: FONTS.sansMedium, fontSize: 11, color: COLORS.textMuted },
  timeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surfaceMuted,
  },
  timeText: { fontFamily: FONTS.sansMedium, fontSize: 10.5, color: COLORS.textMuted },

  readyHeader: { flexDirection: "row", justifyContent: "space-between", marginTop: 14 },
  readyLabel: { fontFamily: FONTS.sansSemi, fontSize: 12, color: COLORS.text },
  readyCount: { fontFamily: FONTS.sansBold, fontSize: 12, color: TODO_COLOR },
  readyCountDone: { color: COLORS.success },
  readyTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.surfaceMuted,
    overflow: "hidden",
    marginTop: 6,
  },
  readyFill: { height: 6, borderRadius: 3, backgroundColor: COLORS.gold },
  readyFillDone: { backgroundColor: COLORS.success },
  doneChips: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 },
  doneChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: RADIUS.pill,
    backgroundColor: "rgba(34,197,94,0.1)",
  },
  doneChipText: { fontFamily: FONTS.sansSemi, fontSize: 11.5, color: "#15803D" },
  todoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 6,
    backgroundColor: "#FFF7E6",
    borderWidth: 1,
    borderColor: "#F5D58A",
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  checkTextTodo: { flex: 1, fontFamily: FONTS.sansSemi, fontSize: 12, color: "#8A5A00" },
  checkHint: { fontFamily: FONTS.sans, fontSize: 11, color: "#A0702A" },
  urgentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  urgentText: { flex: 1, fontFamily: FONTS.sansSemi, fontSize: 12, color: COLORS.text },

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
