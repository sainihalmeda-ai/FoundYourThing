import React from "react";
import { View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ClaimNoticeHost } from "../components/ClaimNoticeHost";
import { LoadingOverlay } from "../components/LoadingOverlay";
import { SessionBanner } from "../components/SessionBanner";
import { SessionExpiringModal } from "../components/SessionExpiringModal";
import { useAuth } from "../context/AuthContext";
import { LoginScreen } from "../screens/LoginScreen";
import { RegisterScreen } from "../screens/RegisterScreen";
import { AppStack } from "./AppStack";
import { navigationRef } from "./navigationRef";
import { RootStackParamList } from "./types";

const AuthStack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  const { token, loading } = useAuth();

  if (loading) {
    return <LoadingOverlay label="Restoring session..." />;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <View style={{ flex: 1 }}>
        {token ? <SessionBanner /> : null}
        {token ? (
          <>
            <AppStack />
            <ClaimNoticeHost />
            <SessionExpiringModal />
          </>
        ) : (
          <AuthStack.Navigator>
            <AuthStack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <AuthStack.Screen name="Register" component={RegisterScreen} options={{ title: "Register" }} />
          </AuthStack.Navigator>
        )}
      </View>
    </NavigationContainer>
  );
}
