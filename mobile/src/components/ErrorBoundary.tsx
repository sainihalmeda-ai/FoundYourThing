import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { COLORS, FONTS, RADIUS } from "../constants/config";

type Props = { children: React.ReactNode };

type State = { error: Error | null };

/**
 * Release APKs swallow JS errors as a blank screen. Surface them instead.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    if (__DEV__) console.error("[ErrorBoundary]", error);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <View style={styles.root}>
        <Text style={styles.title}>FYT hit a startup error</Text>
        <Text style={styles.body}>
          {this.state.error.message || "Unknown error"}
        </Text>
        <Pressable
          style={styles.btn}
          onPress={() => this.setState({ error: null })}
        >
          <Text style={styles.btnText}>Try again</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.inkTop,
    padding: 28,
    justifyContent: "center",
  },
  title: {
    fontFamily: FONTS.display,
    fontSize: 26,
    color: "#FFFFFF",
    marginBottom: 12,
  },
  body: {
    fontFamily: FONTS.sans,
    fontSize: 14,
    lineHeight: 20,
    color: "rgba(255,255,255,0.78)",
    marginBottom: 24,
  },
  btn: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.accent,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: RADIUS.pill,
  },
  btnText: {
    fontFamily: FONTS.sansSemi,
    color: "#FFFFFF",
    fontSize: 14,
  },
});
