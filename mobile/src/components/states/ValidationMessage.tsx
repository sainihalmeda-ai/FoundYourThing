import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { COLORS, FONTS, RADIUS } from "../../constants/config";

type Props = {
  message: string | null | undefined;
  /** Field-level hint under an input */
  field?: boolean;
};

/** Inline form validation / API validation message. */
export function ValidationMessage({ message, field = false }: Props) {
  if (!message) return null;

  return (
    <View style={[styles.wrap, field && styles.fieldWrap]}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: "rgba(238,52,59,0.1)",
    borderRadius: RADIUS.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(238,52,59,0.25)",
  },
  fieldWrap: {
    backgroundColor: "transparent",
    borderWidth: 0,
    paddingHorizontal: 2,
    paddingVertical: 0,
    marginTop: 6,
    marginBottom: 4,
  },
  text: {
    color: COLORS.danger,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: FONTS.sansMedium,
  },
});
