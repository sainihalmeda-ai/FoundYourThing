import React, { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ConnectionBanner } from "../components/ConnectionBanner";
import { Field, PrimaryButton, ScreenShell, SecondaryButton } from "../components/Ui";
import { OfflineState, ValidationMessage } from "../components/states";
import { useAuth } from "../context/AuthContext";
import { useConnection } from "../context/ConnectionContext";
import { hasErrors, validateLogin } from "../lib/validation";
import { RootStackParamList } from "../navigation/types";
import { ApiError } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

export function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const { state, canUseApi, refresh } = useConnection();
  const [vtuId, setVtuId] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const onSubmit = async () => {
    setFormError(null);
    const errors = validateLogin(vtuId, password);
    setFieldErrors(errors);
    if (hasErrors(errors)) return;

    if (!canUseApi) {
      setFormError("Backend is not connected. Start backend/start.ps1 in another terminal.");
      return;
    }
    setSubmitting(true);
    try {
      await login(vtuId.trim().toUpperCase(), password);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Try again.";
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (state === "offline") {
    return <OfflineState onRetry={refresh} />;
  }

  return (
    <View style={styles.root}>
      <ConnectionBanner />
      <ScrollView>
        <ScreenShell
          title="Welcome back"
          subtitle="Log in with your campus VTU ID. Your phone number stays private until a finder accepts your claim."
        >
          <Field
            label="VTU ID"
            value={vtuId}
            onChangeText={(text) => {
              setVtuId(text);
              setFieldErrors((prev) => ({ ...prev, vtuId: "" }));
            }}
            placeholder="VTU27680"
            autoCapitalize="characters"
            error={fieldErrors.vtuId}
          />
          <Field
            label="Password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setFieldErrors((prev) => ({ ...prev, password: "" }));
            }}
            secureTextEntry
            error={fieldErrors.password}
          />
          <ValidationMessage message={formError} />
          <PrimaryButton
            label={submitting ? "Signing in..." : "Sign in"}
            onPress={onSubmit}
            disabled={submitting}
          />
          <SecondaryButton label="Create account" onPress={() => navigation.navigate("Register")} />
        </ScreenShell>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
