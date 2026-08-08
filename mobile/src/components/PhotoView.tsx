import React, { useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, RADIUS } from "../constants/config";

type Props = {
  uri?: string | null;
  /** Sizing for the frame (height/width/radius). */
  style?: StyleProp<ViewStyle>;
  /** Tap opens a full-screen lightbox. Turn off inside pressable cards. */
  expandable?: boolean;
};

/**
 * Item photo that is always shown whole (never cropped), letterboxed on an
 * ink backdrop, with an optional full-screen viewer.
 */
export function PhotoView({ uri, style, expandable = true }: Props) {
  const [open, setOpen] = useState(false);

  const frame = (
    <View style={[styles.frame, style]}>
      {uri ? <Image source={{ uri }} style={styles.image} resizeMode="contain" /> : null}
      {uri && expandable ? (
        <View style={styles.expandBadge}>
          <Ionicons name="expand-outline" size={13} color="#FFFFFF" />
        </View>
      ) : null}
    </View>
  );

  if (!uri || !expandable) return frame;

  return (
    <>
      <Pressable onPress={() => setOpen(true)}>{frame}</Pressable>
      <Modal
        visible={open}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.lightbox} onPress={() => setOpen(false)}>
          <Image source={{ uri }} style={styles.full} resizeMode="contain" />
          <View style={styles.close}>
            <Ionicons name="close" size={22} color="#FFFFFF" />
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: "100%",
    backgroundColor: COLORS.inkTop,
    overflow: "hidden",
    justifyContent: "center",
  },
  image: { width: "100%", height: "100%" },
  expandBadge: {
    position: "absolute",
    right: 10,
    bottom: 10,
    width: 26,
    height: 26,
    borderRadius: RADIUS.pill,
    backgroundColor: "rgba(4,13,30,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  lightbox: {
    flex: 1,
    backgroundColor: "rgba(4,13,30,0.96)",
    alignItems: "center",
    justifyContent: "center",
  },
  full: { width: "100%", height: "100%" },
  close: {
    position: "absolute",
    top: 48,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: RADIUS.pill,
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
});
