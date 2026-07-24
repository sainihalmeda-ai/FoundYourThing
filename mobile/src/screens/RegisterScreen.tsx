import React, { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ConnectionBanner } from "../components/ConnectionBanner";
import { Field, PrimaryButton, ScreenShell } from "../components/Ui";
import { OfflineState, ValidationMessage } from "../components/states";
import { useAuth } from "../context/AuthContext";
import { useConnection } from "../context/ConnectionContext";
import { hasErrors, validateRegister } from "../lib/validation";
import { RootStackParamList } from "../navigation/types";
import { ApiError } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "Register">;

export function RegisterScreen(_props: Props) {
  const { register } = useAuth();
  const { state, canUseApi, refresh } = useConnection();
  const [form, setForm] = useState({
    vtu_id: "",
    full_name: "",
    department: "",
    email: "",
    phone: "",
    password: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const update = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const onSubmit = async () => {
    setFormError(null);
    const errors = validateRegister(form);
    setFieldErrors(errors);
    if (hasErrors(errors)) return;

    if (!canUseApi) {
      setFormError("Backend is not connected. Start backend/start.ps1 in another terminal.");
      return;
    }
    setSubmitting(true);
    try {
      await register({
        ...form,
        vtu_id: form.vtu_id.trim().toUpperCase(),
      });
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
          title="Join campus network"
          subtitle="Only valuable-item reports are allowed. Your phone is hidden from everyone until mutual consent."
        >
          <Field
            label="VTU ID"
            value={form.vtu_id}
            onChangeText={(v) => update("vtu_id", v)}
            placeholder="VTU27680"
            autoCapitalize="characters"
            error={fieldErrors.vtu_id}
          />
          <Field
            label="Full name"
            value={form.full_name}
            onChangeText={(v) => update("full_name", v)}
            autoCapitalize="words"
            error={fieldErrors.full_name}
          />
          <Field
            label="Department"
            value={form.department}
            onChangeText={(v) => update("department", v)}
            placeholder="CSE"
            autoCapitalize="characters"
            error={fieldErrors.department}
          />
          <Field
            label="College email"
            value={form.email}
            onChangeText={(v) => update("email", v)}
            placeholder="you@college.edu"
            error={fieldErrors.email}
          />
          <Field
            label="Phone (private until consent)"
            value={form.phone}
            onChangeText={(v) => update("phone", v)}
            placeholder="10-digit mobile"
            error={fieldErrors.phone}
          />
          <Field
            label="Password"
            value={form.password}
            onChangeText={(v) => update("password", v)}
            secureTextEntry
            error={fieldErrors.password}
          />
          <ValidationMessage message={formError} />
          <PrimaryButton
            label={submitting ? "Creating..." : "Create account"}
            onPress={onSubmit}
            disabled={submitting}
          />
        </ScreenShell>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
