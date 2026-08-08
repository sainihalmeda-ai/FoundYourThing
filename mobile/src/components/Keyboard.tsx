import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  type ScrollViewProps,
  View,
} from "react-native";
import Constants from "expo-constants";

/**
 * react-native-keyboard-controller is NOT bundled in Expo Go and crashes the
 * app with "Something went wrong." Use the native module only in dev builds /
 * production; fall back to KeyboardAvoidingView + ScrollView in Expo Go.
 */
const isExpoGo = Constants.appOwnership === "expo";

type ProviderProps = { children: React.ReactNode };

export function KeyboardProvider({ children }: ProviderProps) {
  if (isExpoGo) {
    return <View style={{ flex: 1 }}>{children}</View>;
  }

  // Lazy require so Expo Go never loads the unlinked native module.
  const { KeyboardProvider: NativeProvider } =
    require("react-native-keyboard-controller") as typeof import("react-native-keyboard-controller");
  return <NativeProvider>{children}</NativeProvider>;
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
    if (isExpoGo) {
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
    }

    const { KeyboardAwareScrollView: NativeAware } =
      require("react-native-keyboard-controller") as typeof import("react-native-keyboard-controller");
    return (
      <NativeAware
        ref={ref as never}
        bottomOffset={bottomOffset}
        contentContainerStyle={contentContainerStyle}
        {...rest}
      >
        {children}
      </NativeAware>
    );
  },
);
