import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { COLORS } from "../../constants/config";

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
    backgroundColor: "#FCE8E8",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#F5C2C2",
  },
  fieldWrap: {
    backgroundColor: "transparent",
    borderWidth: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
    marginTop: -8,
    marginBottom: 12,
  },
  text: {
    color: COLORS.danger,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
  },
});
