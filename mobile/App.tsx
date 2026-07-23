import { StatusBar } from "expo-status-bar";
import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./src/context/AuthContext";
import { ConnectionProvider } from "./src/context/ConnectionContext";
import { AppNavigator } from "./src/navigation/AppNavigator";

export default function App() {
  return (
    <SafeAreaProvider>
      <ConnectionProvider>
        <AuthProvider>
          <AppNavigator />
          <StatusBar style="dark" />
        </AuthProvider>
      </ConnectionProvider>
    </SafeAreaProvider>
  );
}
