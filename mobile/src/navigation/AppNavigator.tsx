import React from "react";
import { View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { LoadingOverlay } from "../components/LoadingOverlay";
import { useAuth } from "../context/AuthContext";
import { ClaimsScreen } from "../screens/ClaimsScreen";
import { FeedScreen } from "../screens/FeedScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { ItemDetailScreen } from "../screens/ItemDetailScreen";
import { LoginScreen } from "../screens/LoginScreen";
import { RegisterScreen } from "../screens/RegisterScreen";
import { ReportScreen } from "../screens/ReportScreen";
import { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  const { token, loading } = useAuth();

  if (loading) {
    return <LoadingOverlay label="Restoring session..." />;
  }

  return (
    <NavigationContainer>
      <View style={{ flex: 1 }}>
        <Stack.Navigator screenOptions={{ headerShown: true }}>
          {token ? (
            <>
              <Stack.Screen name="Home" component={HomeScreen} options={{ title: "FoundYourThing" }} />
              <Stack.Screen name="Report" component={ReportScreen} options={{ title: "New report" }} />
              <Stack.Screen name="Feed" component={FeedScreen} />
              <Stack.Screen name="ItemDetail" component={ItemDetailScreen} options={{ title: "Item details" }} />
              <Stack.Screen name="Claims" component={ClaimsScreen} />
            </>
          ) : (
            <>
              <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
              <Stack.Screen name="Register" component={RegisterScreen} options={{ title: "Register" }} />
            </>
          )}
        </Stack.Navigator>
      </View>
    </NavigationContainer>
  );
}
