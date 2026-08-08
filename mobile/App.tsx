import { StatusBar } from "expo-status-bar";
import React from "react";
import { ActivityIndicator, Text, View } from "react-native";
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
import { COLORS, FONTS } from "./src/constants/config";

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
    const id = setTimeout(() => setFontsTimedOut(true), 1500);
    return () => clearTimeout(id);
  }, []);

  if (!fontsLoaded && !fontsTimedOut) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color="#FFFFFF" size="large" />
        <Text style={styles.bootText}>Starting FYT…</Text>
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

const styles = {
  boot: {
    flex: 1 as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: COLORS.inkTop,
    gap: 12,
  },
  bootText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: FONTS.sansSemi,
  },
};
