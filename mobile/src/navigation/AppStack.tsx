import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  BottomTabBar,
  createBottomTabNavigator,
  type BottomTabBarProps,
} from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HomeButton } from "../components/HomeButton";
import { ClaimsScreen } from "../screens/ClaimsScreen";
import { FeedScreen } from "../screens/FeedScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { ItemDetailScreen } from "../screens/ItemDetailScreen";
import { ReportScreen } from "../screens/ReportScreen";
import { COLORS, FONTS, RADIUS, SHADOW, TAB_BAR } from "../constants/config";
import type { MainTabParamList, RootStackParamList } from "./types";

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function TabIcon({
  focused,
  name,
  nameOutline,
}: {
  focused: boolean;
  name: keyof typeof Ionicons.glyphMap;
  nameOutline: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Ionicons
        name={focused ? name : nameOutline}
        size={18}
        color={focused ? COLORS.primary : COLORS.textMuted}
      />
    </View>
  );
}

/**
 * Floating pill nav that still occupies layout space (not position:absolute),
 * so Home / Feed / Requests content never scrolls underneath it.
 */
function FloatingTabBar(props: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.tabBarDock,
        { paddingBottom: Math.max(insets.bottom, TAB_BAR.bottomGap) },
      ]}
    >
      <View style={styles.tabBarPill}>
        <BottomTabBar
          {...props}
          style={styles.tabBarInner}
        />
      </View>
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: COLORS.background },
        headerShadowVisible: false,
        headerTitleStyle: {
          fontFamily: FONTS.displayMedium,
          fontSize: 18,
          color: COLORS.text,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: { backgroundColor: "transparent", borderTopWidth: 0, elevation: 0 },
        tabBarItemStyle: styles.tabItem,
        tabBarLabelStyle: styles.tabLabel,
        sceneStyle: { backgroundColor: COLORS.background },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          title: "FoundYourThing",
          headerShown: false,
          tabBarLabel: "Home",
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name="home" nameOutline="home-outline" />
          ),
        }}
      />
      <Tab.Screen
        name="FeedTab"
        component={FeedScreen}
        options={{
          title: "Campus feed",
          headerShown: false,
          tabBarLabel: "Browse",
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name="compass" nameOutline="compass-outline" />
          ),
        }}
      />
      <Tab.Screen
        name="ClaimsTab"
        component={ClaimsScreen}
        options={{
          title: "Incoming requests",
          headerShown: false,
          tabBarLabel: "Requests",
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name="mail" nameOutline="mail-outline" />
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
        headerStyle: { backgroundColor: COLORS.background },
        headerShadowVisible: false,
        headerTintColor: COLORS.primary,
        headerTitleStyle: {
          fontFamily: FONTS.displayMedium,
          color: COLORS.text,
        },
        contentStyle: { backgroundColor: COLORS.background },
        headerRight: () => <HomeButton />,
        animation: Platform.OS === "ios" ? "slide_from_right" : "fade_from_bottom",
        animationDuration: 220,
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

const styles = StyleSheet.create({
  tabBarDock: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  tabBarPill: {
    height: TAB_BAR.height,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.98)",
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
    ...SHADOW.lift,
  },
  tabBarInner: {
    backgroundColor: "transparent",
    borderTopWidth: 0,
    elevation: 0,
    height: TAB_BAR.height,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabItem: {
    borderRadius: RADIUS.xl,
  },
  tabLabel: {
    fontFamily: FONTS.sansMedium,
    fontSize: 11,
    marginTop: 2,
    letterSpacing: -0.2,
  },
  iconWrap: {
    width: 36,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapActive: {
    backgroundColor: COLORS.surfaceMuted,
  },
});
