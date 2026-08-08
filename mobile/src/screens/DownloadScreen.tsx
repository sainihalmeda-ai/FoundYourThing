import React from "react";
import { Linking, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PageEnter } from "../components/PageEnter";
import { AppButton } from "../components/Ui";
import { APK_DOWNLOAD_URL, COLORS, FONTS, RADIUS, SHADOW } from "../constants/config";
import { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Download">;

export function DownloadScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  const openApk = () => {
    void Linking.openURL(APK_DOWNLOAD_URL);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 }]}>
      <PageEnter style={styles.card}>
        <View style={styles.badge}>
          <Ionicons name="phone-portrait-outline" size={14} color={COLORS.accent} />
          <Text style={styles.badgeText}>Android · Campus install</Text>
        </View>
        <Text style={styles.title}>
          Found<Text style={styles.accent}>Your</Text>Thing
        </Text>
        <Text style={styles.sub}>
          Download the FYT Android app. After install it uses the live API — no computer
          needed.
        </Text>
        <AppButton label="Download FYT APK" onPress={openApk} />
        <Text style={styles.hint}>
          On your phone: tap the button → allow Install unknown apps if asked → Install.
        </Text>
        {Platform.OS === "web" ? (
          <Pressable onPress={() => navigation.navigate("Login")} style={styles.back}>
            <Text style={styles.backText}>Back to sign in</Text>
          </Pressable>
        ) : (
          <Pressable onPress={() => navigation.goBack()} style={styles.back}>
            <Text style={styles.backText}>Back</Text>
          </Pressable>
        )}
      </PageEnter>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  card: {
    maxWidth: 440,
    width: "100%",
    alignSelf: "center",
    backgroundColor: COLORS.card,
    borderRadius: RADIUS["3xl"],
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 28,
    ...SHADOW.lift,
  },
  badge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  badgeText: {
    fontFamily: FONTS.sansSemi,
    fontSize: 12,
    color: COLORS.textMuted,
  },
  title: {
    marginTop: 20,
    fontFamily: FONTS.display,
    fontSize: 34,
    color: COLORS.text,
    letterSpacing: -0.6,
  },
  accent: {
    fontFamily: FONTS.display,
    color: COLORS.accent,
    fontStyle: "italic",
  },
  sub: {
    marginTop: 10,
    marginBottom: 22,
    fontFamily: FONTS.sans,
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.textMuted,
  },
  hint: {
    marginTop: 16,
    fontFamily: FONTS.sans,
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.textMuted,
  },
  back: { marginTop: 20, alignSelf: "center", padding: 8 },
  backText: {
    fontFamily: FONTS.sansSemi,
    fontSize: 14,
    color: COLORS.accent,
  },
});
