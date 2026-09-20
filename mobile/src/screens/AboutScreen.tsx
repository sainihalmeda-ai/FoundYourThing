import React from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ConnectionBanner } from "../components/ConnectionBanner";
import { COLORS, CONTENT_MAX_WIDTH, FONTS, RADIUS, SHADOW } from "../constants/config";

type Section = {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  body: string;
};

const SECTIONS: Section[] = [
  {
    icon: "shield-checkmark-outline",
    title: "Who can use it",
    body:
      "Only college identity numbers are accepted at registration — a VTU number for students or a TTS number for staff. Anyone else is refused at signup and at login, so every account on the platform is a verified member of the campus.",
  },
  {
    icon: "eye-off-outline",
    title: "What's public, and when",
    body:
      "A report shows only its photo, category, location and the reporter's VTU/TTS ID. A masked name appears once a claim is raised. Full name and phone number are revealed only after the finder explicitly accepts the claim — never automatically.",
  },
  {
    icon: "sparkles-outline",
    title: "How matching works",
    body:
      "New reports are compared against the opposite list (lost vs. found) using image and text similarity. Suggested matches show a confidence score; nothing is auto-connected — a person always makes the final call before contact details are shared.",
  },
  {
    icon: "lock-closed-outline",
    title: "How accounts are secured",
    body:
      "Passwords are hashed with bcrypt and never stored in plain text. Sessions use short-lived JWT tokens (10-minute expiry) rather than a permanent login, so an unattended device doesn't stay signed in indefinitely.",
  },
  {
    icon: "server-outline",
    title: "Where data lives",
    body:
      "Item and account records are stored in a managed Postgres database (Supabase). Item photos are kept as durable database rows rather than disk files, so they survive server restarts and redeploys.",
  },
];

export function AboutScreen() {
  return (
    <View style={styles.root}>
      <ConnectionBanner />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.uniRow}>
          <Image
            source={require("../../assets/veltech-logo.png")}
            style={styles.uniLogo}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.title}>About FoundYourThing</Text>
        <Text style={styles.subtitle}>
          A privacy-first campus lost & found platform, proposed as a pilot for Vel Tech
          Rangarajan Dr. Sagunthala R&D Institute of Science and Technology, Avadi, Chennai.
        </Text>

        {SECTIONS.map((section) => (
          <View key={section.title} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.iconWrap}>
                <Ionicons name={section.icon} size={16} color={COLORS.accent} />
              </View>
              <Text style={styles.cardTitle}>{section.title}</Text>
            </View>
            <Text style={styles.cardBody}>{section.body}</Text>
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Built by Meda Sai Nihal, CSE (AI & Data Science) · FoundYourThing 2026
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  scroll: {
    padding: 20,
    paddingBottom: 48,
    width: "100%",
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: "center",
  },
  uniRow: { alignItems: "center", marginBottom: 8 },
  uniLogo: { width: 200, height: 72 },
  title: {
    marginTop: 12,
    fontFamily: FONTS.display,
    fontSize: 26,
    color: COLORS.text,
    textAlign: "center",
    letterSpacing: -0.4,
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 22,
    fontFamily: FONTS.sans,
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
    marginBottom: 12,
    ...SHADOW.soft,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: "rgba(169,31,35,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontFamily: FONTS.sansSemi,
    fontSize: 14,
    color: COLORS.text,
  },
  cardBody: {
    fontFamily: FONTS.sans,
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 20,
  },
  footer: { marginTop: 8, alignItems: "center" },
  footerText: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    color: COLORS.textMuted,
  },
});
