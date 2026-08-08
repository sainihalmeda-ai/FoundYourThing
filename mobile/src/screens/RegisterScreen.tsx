import React, { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { COLORS } from "../constants/config";

type Props = NativeStackScreenProps<RootStackParamList, "Register">;

/**
 * Register is folded into the Login auth experience (campus-connect).
 * Keep this route so older navigate("Register") calls still work.
 */
export function RegisterScreen({ navigation }: Props) {
  useEffect(() => {
    navigation.replace("Login", { mode: "register" });
  }, [navigation]);

  return (
    <View style={styles.root}>
      <ActivityIndicator color={COLORS.accent} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },
});
