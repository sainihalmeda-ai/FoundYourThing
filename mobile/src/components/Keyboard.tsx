import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  type ScrollViewProps,
  View,
} from "react-native";

/**
 * Always use RN KeyboardAvoidingView + ScrollView.
 *
 * react-native-keyboard-controller is not in Expo Go and has crashed some
 * release APKs at startup (native KeyboardProvider → permanent black screen).
 * Prefer the built-in path everywhere so phone and web stay consistent.
 */

type ProviderProps = { children: React.ReactNode };

export function KeyboardProvider({ children }: ProviderProps) {
  return <View style={{ flex: 1 }}>{children}</View>;
}

type AwareProps = ScrollViewProps & {
  bottomOffset?: number;
  children?: React.ReactNode;
};

export const KeyboardAwareScrollView = React.forwardRef<ScrollView, AwareProps>(
  function KeyboardAwareScrollView(
    { bottomOffset = 0, contentContainerStyle, children, ...rest },
    ref,
  ) {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={bottomOffset}
      >
        <ScrollView
          ref={ref}
          contentContainerStyle={contentContainerStyle}
          keyboardShouldPersistTaps="handled"
          {...rest}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    );
  },
);
