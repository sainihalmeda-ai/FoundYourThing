import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ConnectionBanner } from "../components/ConnectionBanner";
import { Field, PrimaryButton, ScreenShell } from "../components/Ui";
import { useAuth } from "../context/AuthContext";
import { useConnection } from "../context/ConnectionContext";
import { RootStackParamList } from "../navigation/types";
import { ApiError } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "Register">;

export function RegisterScreen({ navigation }: Props) {
  const { register } = useAuth();
  const { state } = useConnection();
  const [form, setForm] = useState({
    vtu_id: "",
    full_name: "",
    department: "",
    email: "",
    phone: "",
    password: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const update = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const onSubmit = async () => {
    if (state !== "online") {
      Alert.alert("Server unavailable", "Connect to the backend before registering.");
      return;
    }
    setSubmitting(true);
    try {
      await register({
        ...form,
        vtu_id: form.vtu_id.trim().toUpperCase(),
      });
    } catch (error) {
      Alert.alert("Registration failed", error instanceof ApiError ? error.message : "Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.root}>
      <ConnectionBanner />
      <ScrollView>
        <ScreenShell title="Join campus network" subtitle="Only valuable-item reports are allowed. Your phone is hidden from everyone until mutual consent.">
          <Field label="VTU ID" value={form.vtu_id} onChangeText={(v) => update("vtu_id", v)} placeholder="VTU27680" autoCapitalize="characters" />
          <Field label="Full name" value={form.full_name} onChangeText={(v) => update("full_name", v)} autoCapitalize="words" />
          <Field label="Department" value={form.department} onChangeText={(v) => update("department", v)} placeholder="CSE" autoCapitalize="characters" />
          <Field label="College email" value={form.email} onChangeText={(v) => update("email", v)} placeholder="you@college.edu" />
          <Field label="Phone (private until consent)" value={form.phone} onChangeText={(v) => update("phone", v)} placeholder="10-digit mobile" />
          <Field label="Password" value={form.password} onChangeText={(v) => update("password", v)} secureTextEntry />
          <PrimaryButton label={submitting ? "Creating..." : "Create account"} onPress={onSubmit} disabled={submitting} />
        </ScreenShell>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
