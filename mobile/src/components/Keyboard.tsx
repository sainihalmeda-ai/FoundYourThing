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
 * app with "Something went wrong." Use the native module only when linked;
 * fall back to KeyboardAvoidingView + ScrollView otherwise.
 */
const isExpoGo = Constants.appOwnership === "expo";

function loadNativeKeyboard(): typeof import("react-native-keyboard-controller") | null {
  if (isExpoGo) return null;
  try {
    return require("react-native-keyboard-controller") as typeof import("react-native-keyboard-controller");
  } catch {
    return null;
  }
}

type ProviderProps = { children: React.ReactNode };

export function KeyboardProvider({ children }: ProviderProps) {
  const native = loadNativeKeyboard();
  if (!native) {
    return <View style={{ flex: 1 }}>{children}</View>;
  }
  const { KeyboardProvider: NativeProvider } = native;
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
    const native = loadNativeKeyboard();
    if (!native) {
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

    const { KeyboardAwareScrollView: NativeAware } = native;
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
