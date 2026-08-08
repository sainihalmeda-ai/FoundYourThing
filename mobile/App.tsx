import "react-native-reanimated";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  useFonts,
  Fraunces_400Regular,
  Fraunces_600SemiBold,
  Fraunces_700Bold,
} from "@expo-google-fonts/fraunces";
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
} from "@expo-google-fonts/manrope";
import { AuthProvider } from "./src/context/AuthContext";
import { ConnectionProvider } from "./src/context/ConnectionContext";
import { ErrorBoundary } from "./src/components/ErrorBoundary";
import { KeyboardProvider } from "./src/components/Keyboard";
import { AppNavigator } from "./src/navigation/AppNavigator";
import { COLORS } from "./src/constants/config";
import { checkForAppUpdates } from "./src/lib/checkForUpdates";

export default function App() {
  const [fontsLoaded] = useFonts({
    Fraunces_400Regular,
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
  });
  const [fontsTimedOut, setFontsTimedOut] = React.useState(false);

  React.useEffect(() => {
    const id = setTimeout(() => setFontsTimedOut(true), 2500);
    return () => clearTimeout(id);
  }, []);

  // Defer OTA — never block first paint. Updates apply on a later cold start.
  React.useEffect(() => {
    const id = setTimeout(() => {
      void checkForAppUpdates();
    }, 8000);
    return () => clearTimeout(id);
  }, []);

  if (!fontsLoaded && !fontsTimedOut) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: COLORS.inkTop,
        }}
      >
        <ActivityIndicator color="#FFFFFF" size="large" />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <KeyboardProvider>
          <ConnectionProvider>
            <AuthProvider>
              <AppNavigator />
              <StatusBar style="light" />
            </AuthProvider>
          </ConnectionProvider>
        </KeyboardProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
