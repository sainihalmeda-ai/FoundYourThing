import React, { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fetchAllConcerns } from "../api/auth";
import { ConnectionBanner } from "../components/ConnectionBanner";
import { ConnectionGate } from "../components/ConnectionGate";
import { HomeButton } from "../components/HomeButton";
import { LoadingOverlay } from "../components/LoadingOverlay";
import { Badge } from "../components/Ui";
import { EmptyState, ErrorState } from "../components/states";
import { useAuth } from "../context/AuthContext";
import { COLORS, CONTENT_MAX_WIDTH, FONTS, RADIUS } from "../constants/config";
import { RootStackParamList } from "../navigation/types";
import type { ConcernStatus, ConcernTeamView } from "../types";

const STATUS_TONE: Record<ConcernStatus, "neutral" | "connected" | "returned"> = {
  received: "neutral",
  under_review: "connected",
  resolved: "returned",
};

const STATUS_LABEL: Record<ConcernStatus, string> = {
  received: "Received",
  under_review: "Under review",
  resolved: "Resolved",
};

export function EnquiryInboxScreen() {
  const { token } = useAuth();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [rows, setRows] = useState<ConcernTeamView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setError(null);
      setRows(await fetchAllConcerns(token));
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load]),
  );

  if (loading) return <LoadingOverlay label="Loading reports" />;
  if (error) return <ErrorState error={error} onRetry={load} />;

  return (
    <ConnectionGate>
      <View style={styles.root}>
        <ConnectionBanner />
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) + 8 }]}>
          <View style={styles.headerTop}>
            <View style={styles.headerText}>
              <Text style={styles.title} numberOfLines={2}>
                Enquiry inbox
              </Text>
              <Text style={styles.subtitle}>Visible only to the enquiry team</Text>
            </View>
            <HomeButton />
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          {rows.length === 0 ? (
            <EmptyState title="Nothing pending" message="New reports will appear here." compact />
          ) : (
            rows.map((c) => (
              <Pressable
                key={c.id}
                style={({ pressed }) => [styles.row, pressed && styles.pressed]}
                onPress={() => navigation.navigate("EnquiryConcernDetail", { concernId: c.id })}
              >
                <View style={styles.rowTop}>
                  <Text style={styles.rowTitle}>{c.category_label}</Text>
                  <Badge label={STATUS_LABEL[c.status]} tone={STATUS_TONE[c.status]} />
                </View>
                <Text style={styles.rowReporter}>
                  {c.reporter_vtu_id}
                  {c.reporter_name ? ` · ${c.reporter_name}` : ""}
                </Text>
                <Text style={styles.rowPreview} numberOfLines={2}>
                  {c.description}
                </Text>
                <Text style={styles.rowDate}>{new Date(c.created_at).toLocaleString()}</Text>
              </Pressable>
            ))
          )}
        </ScrollView>
      </View>
    </ConnectionGate>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: 20, paddingBottom: 10 },
  headerTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  headerText: { flex: 1, minWidth: 0, paddingRight: 4 },
  title: {
    fontFamily: FONTS.display,
    fontSize: 26,
    color: COLORS.text,
    letterSpacing: -0.4,
    lineHeight: 32,
  },
  subtitle: { marginTop: 6, fontFamily: FONTS.sans, fontSize: 12, color: COLORS.textMuted },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    width: "100%",
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: "center",
  },
  row: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.xl,
    padding: 16,
    marginBottom: 12,
  },
  rowTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  rowTitle: { fontFamily: FONTS.sansBold, fontSize: 14, color: COLORS.text },
  rowReporter: { marginTop: 6, fontFamily: FONTS.sansSemi, fontSize: 12, color: COLORS.primary },
  rowPreview: { marginTop: 6, fontFamily: FONTS.sans, fontSize: 12.5, color: COLORS.textMuted, lineHeight: 18 },
  rowDate: { marginTop: 8, fontFamily: FONTS.sansMedium, fontSize: 10.5, color: "#98A2B3" },
  pressed: { opacity: 0.92 },
});
