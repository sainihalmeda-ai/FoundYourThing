import React from "react";
import { Pressable, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ClaimsScreen } from "../screens/ClaimsScreen";
import { FeedScreen } from "../screens/FeedScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { ItemDetailScreen } from "../screens/ItemDetailScreen";
import { ReportScreen } from "../screens/ReportScreen";
import { COLORS } from "../constants/config";
import type { MainTabParamList, RootStackParamList } from "./types";
import { navigate } from "./navigationRef";

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function TabLabel({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text
      style={{
        fontSize: 11,
        fontWeight: focused ? "800" : "600",
        color: focused ? COLORS.primary : COLORS.textMuted,
        marginBottom: 2,
      }}
    >
      {label}
    </Text>
  );
}

function HomeHeaderButton() {
  return (
    <Pressable
      onPress={() => navigate("MainTabs")}
      style={{ marginRight: 12, padding: 6 }}
      accessibilityLabel="Go to home"
    >
      <Ionicons name="home" size={22} color={COLORS.primary} />
    </Pressable>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: COLORS.surface },
        headerTitleStyle: { fontWeight: "800", color: COLORS.text },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          height: 62,
          paddingTop: 4,
          paddingBottom: 4,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          title: "FoundYourThing",
          tabBarLabel: ({ focused }) => <TabLabel label="Home" focused={focused} />,
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={size ?? 22}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="FeedTab"
        component={FeedScreen}
        options={{
          title: "Campus feed",
          tabBarLabel: ({ focused }) => <TabLabel label="Browse" focused={focused} />,
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? "search" : "search-outline"}
              size={size ?? 22}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="ClaimsTab"
        component={ClaimsScreen}
        options={{
          title: "Requests",
          tabBarLabel: ({ focused }) => <TabLabel label="Requests" focused={focused} />,
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? "mail" : "mail-outline"}
              size={size ?? 22}
              color={color}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

/** Authenticated stack: tabs + detail/report screens. */
export function AppStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerRight: () => <HomeHeaderButton />,
      }}
    >
      <Stack.Screen
        name="MainTabs"
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="Report" component={ReportScreen} options={{ title: "New report" }} />
      <Stack.Screen name="ItemDetail" component={ItemDetailScreen} options={{ title: "Item details" }} />
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: "FoundYourThing" }} />
      <Stack.Screen name="Feed" component={FeedScreen} options={{ title: "Campus feed" }} />
      <Stack.Screen name="Claims" component={ClaimsScreen} options={{ title: "Incoming requests" }} />
    </Stack.Navigator>
  );
}
