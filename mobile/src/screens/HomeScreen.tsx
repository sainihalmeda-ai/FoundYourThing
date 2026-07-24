import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ConnectionBanner } from "../components/ConnectionBanner";
import { ConnectionGate } from "../components/ConnectionGate";
import { PrimaryButton, ScreenShell, SecondaryButton } from "../components/Ui";
import { useAuth } from "../context/AuthContext";
import { RootStackParamList } from "../navigation/types";
import { COLORS } from "../constants/config";

export function HomeScreen() {
  const { user, logout } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <ConnectionGate>
      <View style={styles.root}>
        <ConnectionBanner />
        <ScreenShell
          title="FoundYourThing"
          subtitle="Campus lost & found for valuable items only. Privacy first: only VTU IDs are public until both sides agree to share contact."
        >
          <View style={styles.card}>
            <Text style={styles.welcome}>Signed in as {user?.vtu_id}</Text>
            <Text style={styles.note}>
              Pens and pencils are not accepted. Report phones, watches, wallets, ID cards, bags, and other valuables.
            </Text>
          </View>

          <PrimaryButton
            label="I lost something"
            onPress={() => navigation.navigate("Report", { mode: "lost" })}
          />
          <View style={styles.gap} />
          <PrimaryButton
            label="I found something"
            onPress={() => navigation.navigate("Report", { mode: "found" })}
          />
          <SecondaryButton label="Browse campus feed" onPress={() => navigation.navigate("Feed")} />
          <SecondaryButton
            label="Incoming contact requests"
            onPress={() => navigation.navigate("Claims")}
          />
          <SecondaryButton label="Log out" onPress={logout} />
        </ScreenShell>
      </View>
    </ConnectionGate>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  welcome: {
    fontWeight: "700",
    color: COLORS.text,
    fontSize: 16,
  },
  note: {
    marginTop: 8,
    color: COLORS.textMuted,
    lineHeight: 20,
  },
  gap: { height: 10 },
});
