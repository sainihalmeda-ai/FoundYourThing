import React from "react";
import { View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as ExpoLinking from "expo-linking";
import { ClaimNoticeHost } from "../components/ClaimNoticeHost";
import { LoadingOverlay } from "../components/LoadingOverlay";
import { SessionExpiringModal } from "../components/SessionExpiringModal";
import { useAuth } from "../context/AuthContext";
import { DownloadScreen } from "../screens/DownloadScreen";
import { LoginScreen } from "../screens/LoginScreen";
import { RegisterScreen } from "../screens/RegisterScreen";
import { AppStack } from "./AppStack";
import { navigationRef } from "./navigationRef";
import { RootStackParamList } from "./types";
import { COLORS } from "../constants/config";

const AuthStack = createNativeStackNavigator<RootStackParamList>();

const linking = {
  prefixes: [
    ExpoLinking.createURL("/"),
    "https://foundyourthing-web.onrender.com",
    "http://localhost:8081",
  ],
  config: {
    screens: {
      Login: "",
      Register: "register",
      Download: "download",
    },
  },
};

export function AppNavigator() {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <LoadingOverlay
        label="Restoring session"
        hint="Checking your campus login…"
      />
    );
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      linking={token ? undefined : linking}
    >
      <View style={{ flex: 1, backgroundColor: COLORS.background }}>
        {token ? (
          <>
            <AppStack />
            <ClaimNoticeHost />
            <SessionExpiringModal />
          </>
        ) : (
          <AuthStack.Navigator
            screenOptions={{
              headerStyle: { backgroundColor: COLORS.background },
              headerShadowVisible: false,
              headerTintColor: COLORS.primary,
              contentStyle: { backgroundColor: COLORS.background },
              animation: "fade",
              animationDuration: 220,
            }}
          >
            <AuthStack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <AuthStack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
            <AuthStack.Screen
              name="Download"
              component={DownloadScreen}
              options={{ headerShown: false, title: "Download FYT APK" }}
            />
          </AuthStack.Navigator>
        )}
      </View>
    </NavigationContainer>
  );
}
