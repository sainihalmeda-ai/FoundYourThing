import React, { useEffect, useState } from "react";
import {
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeOutUp,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { KeyboardAwareScrollView } from "../components/Keyboard";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ConnectionBanner } from "../components/ConnectionBanner";
import { PageEnter } from "../components/PageEnter";
import { InkSurface } from "../components/SpatialBackdrop";
import { AppButton, Field } from "../components/Ui";
import { OfflineState, ValidationMessage } from "../components/states";
import { useAuth } from "../context/AuthContext";
import { useConnection } from "../context/ConnectionContext";
import { hasErrors, validateLogin, validateRegister } from "../lib/validation";
import { RootStackParamList } from "../navigation/types";
import { COLORS, FONTS, RADIUS, SHADOW } from "../constants/config";
import { ApiError } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "Login">;
type Mode = "login" | "register";

const FEATURES: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  desc: string;
}[] = [
  {
    icon: "shield-checkmark-outline",
    title: "Verified campus identity",
    desc: "Only enrolled VTU / TTS IDs can post or claim.",
  },
  {
    icon: "scan-outline",
    title: "AI-assisted matching",
    desc: "Lost reports are compared against found items instantly.",
  },
  {
    icon: "people-outline",
    title: "Private until you both accept",
    desc: "Numbers are revealed only on a mutual match.",
  },
  {
    icon: "sparkles-outline",
    title: "Valuables only",
    desc: "A curated feed that stays worth checking.",
  },
];

const EASE = Easing.bezier(0.4, 0, 0.2, 1);

export function LoginScreen({ navigation, route }: Props) {
  const { login, register } = useAuth();
  const { state, refresh } = useConnection();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const wide = width >= 900;

  const [mode, setMode] = useState<Mode>(route.params?.mode ?? "login");
  const [vtuId, setVtuId] = useState("");
  const [password, setPassword] = useState("");
  const [form, setForm] = useState({
    full_name: "",
    department: "",
    email: "",
    phone: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const [segmentW, setSegmentW] = useState(0);
  const pillX = useSharedValue(0);

  // Wipe Chrome password-manager paint-in (it ignores autocomplete=off).
  useEffect(() => {
    setVtuId("");
    setPassword("");
    const id = setTimeout(() => {
      setVtuId("");
      setPassword("");
    }, 50);
    const id2 = setTimeout(() => {
      setVtuId("");
      setPassword("");
    }, 400);
    return () => {
      clearTimeout(id);
      clearTimeout(id2);
    };
  }, []);

  useEffect(() => {
    if (route.params?.mode) setMode(route.params.mode);
  }, [route.params?.mode]);

  useEffect(() => {
    if (!segmentW) return;
    const half = (segmentW - 8) / 2;
    pillX.value = withTiming(mode === "login" ? 4 : half + 4, {
      duration: 220,
      easing: EASE,
    });
  }, [mode, segmentW, pillX]);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pillX.value }],
    width: Math.max((segmentW - 8) / 2, 0),
  }));

  const onSegmentLayout = (e: LayoutChangeEvent) => {
    setSegmentW(e.nativeEvent.layout.width);
  };

  const clearField = (key: string) =>
    setFieldErrors((prev) => ({ ...prev, [key]: "" }));

  const onSubmit = async () => {
    setFormError(null);
    if (mode === "login") {
      const errors = validateLogin(vtuId, password);
      setFieldErrors(errors);
      if (hasErrors(errors)) return;
      if (state === "server_down") {
        void refresh({ coldStart: true });
      }
      setSubmitting(true);
      try {
        await login(vtuId.trim().toUpperCase(), password);
      } catch (error) {
        setFormError(error instanceof ApiError ? error.message : "Try again.");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    const payload = {
      vtu_id: vtuId,
      password,
      ...form,
    };
    const errors = validateRegister(payload);
    setFieldErrors(errors);
    if (hasErrors(errors)) return;
    if (state === "server_down") {
      void refresh({ coldStart: true });
    }
    setSubmitting(true);
    try {
      await register({
        ...payload,
        vtu_id: vtuId.trim().toUpperCase(),
      });
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : "Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (state === "offline") {
    return <OfflineState onRetry={refresh} />;
  }

  const formPanel = (
    <PageEnter style={styles.formInner}>
      <View style={[styles.formHeader, wide && styles.formHeaderWide]}>
        <Text style={styles.title}>
          {mode === "login" ? "Welcome back" : "Create account"}
        </Text>
        <Text style={styles.subtitle}>
          {mode === "login"
            ? "Sign in with your college ID and password."
            : "One account for the whole campus."}
        </Text>
      </View>

      <View style={styles.segment} onLayout={onSegmentLayout}>
        <Animated.View style={[styles.segmentPill, pillStyle]} />
        {(["login", "register"] as const).map((m) => {
          const active = mode === m;
          return (
            <Pressable
              key={m}
              style={styles.segmentItem}
              onPress={() => {
                setMode(m);
                setFormError(null);
                setFieldErrors({});
                navigation.setParams({ mode: m });
              }}
            >
              <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                {m === "login" ? "Login" : "Register"}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.fields}>
        <Field
          label="College ID"
          icon="card-outline"
          value={vtuId}
          onChangeText={(text) => {
            setVtuId(text);
            clearField("vtuId");
            clearField("vtu_id");
          }}
          placeholder="Type your VTU or TTS ID"
          autoCapitalize="characters"
          autoComplete="off"
          textContentType="none"
          error={fieldErrors.vtuId || fieldErrors.vtu_id}
        />
        <Field
          label="Password"
          icon="lock-closed-outline"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            clearField("password");
          }}
          placeholder="Enter your password"
          secureTextEntry
          autoComplete="off"
          textContentType="none"
          error={fieldErrors.password}
        />

        {mode === "register" ? (
          <Animated.View
            key="register-fields"
            entering={FadeInDown.duration(220).easing(EASE)}
            exiting={FadeOutUp.duration(160)}
          >
            <Field
              label="Full name"
              icon="person-outline"
              value={form.full_name}
              onChangeText={(v) => {
                setForm((p) => ({ ...p, full_name: v }));
                clearField("full_name");
              }}
              autoCapitalize="words"
              error={fieldErrors.full_name}
            />
            <Field
              label="Department"
              icon="school-outline"
              value={form.department}
              onChangeText={(v) => {
                setForm((p) => ({ ...p, department: v }));
                clearField("department");
              }}
              placeholder="CSE"
              autoCapitalize="characters"
              error={fieldErrors.department}
            />
            <Field
              label="College email"
              icon="mail-outline"
              value={form.email}
              onChangeText={(v) => {
                setForm((p) => ({ ...p, email: v }));
                clearField("email");
              }}
              placeholder="you@college.edu"
              error={fieldErrors.email}
            />
            <Field
              label="Phone (private until consent)"
              icon="call-outline"
              value={form.phone}
              onChangeText={(v) => {
                setForm((p) => ({ ...p, phone: v }));
                clearField("phone");
              }}
              placeholder="10-digit mobile"
              error={fieldErrors.phone}
            />
          </Animated.View>
        ) : null}
      </View>

      <View style={styles.privacy}>
        <Ionicons name="shield-checkmark" size={16} color={COLORS.accent} />
        <Text style={styles.privacyText}>
          Your phone number stays private until{" "}
          <Text style={styles.privacyBold}>both</Text> of you accept.
        </Text>
      </View>

      <ValidationMessage message={formError} />
      <AppButton
        label={
          submitting
            ? mode === "login"
              ? "Signing in..."
              : "Creating..."
            : mode === "login"
              ? "Sign in"
              : "Create account"
        }
        onPress={onSubmit}
        disabled={submitting}
        loading={submitting}
      />
      <Pressable
        onPress={() => navigation.navigate("Download")}
        style={styles.apkLink}
      >
        <Ionicons name="logo-android" size={16} color={COLORS.accent} />
        <Text style={styles.apkLinkText}>Get the Android app · Download FYT APK</Text>
      </Pressable>
      <Text style={styles.sessionNote}>
        Sessions expire after 10 minutes of inactivity.
      </Text>
    </PageEnter>
  );

  const brandPanel = (
    <InkSurface style={styles.brandPanel}>
      <Animated.View entering={FadeIn.duration(280)} style={styles.brandInner}>
        <View style={styles.brandBadge}>
          <Ionicons name="shield-checkmark" size={14} color={COLORS.accent} />
          <Text style={styles.brandBadgeText}>Privacy-first · VTU / TTS</Text>
        </View>
        <Text style={styles.brandTitle}>
          Found<Text style={styles.brandAccent}>Your</Text>Thing
        </Text>
        <View style={styles.brandRule} />
        <Text style={styles.brandDesc}>
          The campus lost & found portal for valuables — calm, verified and private by
          default.
        </Text>
        <View style={styles.featureList}>
          {FEATURES.map((f) => (
            <View key={f.title} style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <Ionicons name={f.icon} size={16} color={COLORS.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>
        <Text style={styles.brandFoot}>
          © FoundYourThing 2026 · Campus Lost & Found Office
        </Text>
      </Animated.View>
    </InkSurface>
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ConnectionBanner />
      <KeyboardAwareScrollView
        contentContainerStyle={[
          styles.scroll,
          wide && styles.scrollWide,
          { paddingBottom: Math.max(insets.bottom, 24) + 16 },
        ]}
        bottomOffset={24}
        keyboardShouldPersistTaps="handled"
      >
        {wide ? (
          <View style={styles.splitCard}>
            {brandPanel}
            <View style={styles.formWide}>{formPanel}</View>
          </View>
        ) : (
          <View style={styles.mobileWrap}>
            <Text style={styles.mobileBrand}>
              Found<Text style={styles.brandAccent}>Your</Text>Thing
            </Text>
            {formPanel}
          </View>
        )}
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 12 },
  scrollWide: {
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  splitCard: {
    flexDirection: "row",
    maxWidth: 1080,
    width: "100%",
    alignSelf: "center",
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    ...SHADOW.lift,
    minHeight: 640,
  },
  brandPanel: {
    flex: 1.05,
    padding: 48,
    justifyContent: "space-between",
  },
  brandInner: { flex: 1, justifyContent: "space-between" },
  brandBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  brandBadgeText: {
    color: "rgba(255,255,255,0.85)",
    fontFamily: FONTS.sansMedium,
    fontSize: 11,
  },
  brandTitle: {
    marginTop: 36,
    fontFamily: FONTS.display,
    fontSize: 40,
    color: COLORS.primaryForeground,
    letterSpacing: -0.8,
    lineHeight: 44,
  },
  brandAccent: {
    fontFamily: FONTS.display,
    color: COLORS.accent,
    fontStyle: "italic",
  },
  brandRule: {
    marginTop: 20,
    width: 56,
    height: 1,
    backgroundColor: COLORS.accent,
  },
  brandDesc: {
    marginTop: 20,
    maxWidth: 340,
    fontFamily: FONTS.sans,
    fontSize: 15,
    lineHeight: 22,
    color: "rgba(255,255,255,0.6)",
  },
  featureList: { marginTop: 40, gap: 22 },
  featureRow: { flexDirection: "row", gap: 14, alignItems: "flex-start" },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  featureTitle: {
    fontFamily: FONTS.sansSemi,
    fontSize: 14,
    color: COLORS.primaryForeground,
    letterSpacing: -0.2,
  },
  featureDesc: {
    marginTop: 4,
    fontFamily: FONTS.sans,
    fontSize: 12.5,
    lineHeight: 18,
    color: "rgba(255,255,255,0.55)",
  },
  brandFoot: {
    marginTop: 40,
    fontFamily: FONTS.sans,
    fontSize: 11,
    color: "rgba(255,255,255,0.4)",
  },
  formWide: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 48,
    paddingVertical: 48,
    backgroundColor: COLORS.card,
  },
  formInner: { width: "100%" },
  mobileWrap: { width: "100%", maxWidth: 480, alignSelf: "center" },
  mobileBrand: {
    fontFamily: FONTS.display,
    fontSize: 28,
    color: COLORS.text,
    marginBottom: 18,
    marginTop: 12,
  },
  formHeader: { marginBottom: 8 },
  formHeaderWide: { alignItems: "center" },
  title: {
    fontFamily: FONTS.display,
    fontSize: 34,
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 10,
    marginBottom: 8,
    fontFamily: FONTS.sans,
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 21,
  },
  segment: {
    marginTop: 18,
    marginBottom: 22,
    flexDirection: "row",
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: RADIUS["2xl"],
    padding: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    position: "relative",
  },
  segmentPill: {
    position: "absolute",
    top: 4,
    bottom: 4,
    left: 0,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    ...SHADOW.soft,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    zIndex: 1,
  },
  segmentText: {
    fontFamily: FONTS.sansMedium,
    fontSize: 13,
    color: COLORS.textMuted,
    textTransform: "capitalize",
  },
  segmentTextActive: {
    color: COLORS.text,
    fontFamily: FONTS.sansSemi,
  },
  fields: { gap: 0 },
  privacy: {
    marginTop: 8,
    marginBottom: 14,
    flexDirection: "row",
    gap: 10,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS["2xl"],
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
  },
  privacyText: {
    flex: 1,
    fontFamily: FONTS.sans,
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 20,
  },
  privacyBold: {
    fontFamily: FONTS.sansSemi,
    color: COLORS.text,
  },
  sessionNote: {
    marginTop: 16,
    textAlign: "center",
    fontFamily: FONTS.sans,
    fontSize: 11,
    color: COLORS.textMuted,
  },
  apkLink: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 8,
  },
  apkLinkText: {
    fontFamily: FONTS.sansSemi,
    fontSize: 13,
    color: COLORS.accent,
  },
});
