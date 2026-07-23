import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ConnectionBanner } from "../components/ConnectionBanner";
import { Field, PrimaryButton, ScreenShell, SecondaryButton } from "../components/Ui";
import { useAuth } from "../context/AuthContext";
import { useConnection } from "../context/ConnectionContext";
import { RootStackParamList } from "../navigation/types";
import { ApiError } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

export function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const { state } = useConnection();
  const [vtuId, setVtuId] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onSubmit = async () => {
    setErrorMessage(null);
    if (state !== "online") {
      setErrorMessage("Backend is not connected. Start backend/start.ps1 in another terminal.");
      return;
    }
    setSubmitting(true);
    try {
      await login(vtuId.trim().toUpperCase(), password);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Try again.";
      setErrorMessage(message);
      Alert.alert("Login failed", message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.root}>
      <ConnectionBanner />
      <ScrollView>
        <ScreenShell
          title="Welcome back"
          subtitle="Log in with your campus VTU ID. Your phone number stays private until a finder accepts your claim."
        >
          <Field label="VTU ID" value={vtuId} onChangeText={setVtuId} placeholder="VTU27680" autoCapitalize="characters" />
          <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry />
          {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
          <PrimaryButton label={submitting ? "Signing in..." : "Sign in"} onPress={onSubmit} disabled={submitting} />
          <SecondaryButton label="Create account" onPress={() => navigation.navigate("Register")} />
        </ScreenShell>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  error: {
    color: "#D64545",
    marginBottom: 12,
    lineHeight: 20,
  },
});
