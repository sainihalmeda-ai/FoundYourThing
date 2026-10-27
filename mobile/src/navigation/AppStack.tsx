import React from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  BottomTabBar,
  createBottomTabNavigator,
  type BottomTabBarProps,
} from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HomeButton } from "../components/HomeButton";
import { AboutScreen } from "../screens/AboutScreen";
import { ClaimsScreen } from "../screens/ClaimsScreen";
import { ConcernDetailScreen } from "../screens/ConcernDetailScreen";
import { EnquiryConcernDetailScreen } from "../screens/EnquiryConcernDetailScreen";
import { EnquiryInboxScreen } from "../screens/EnquiryInboxScreen";
import { FeedScreen } from "../screens/FeedScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { HostelComplaintDetailScreen } from "../screens/HostelComplaintDetailScreen";
import { HostelComplaintFormScreen } from "../screens/HostelComplaintFormScreen";
import { HostelInboxScreen } from "../screens/HostelInboxScreen";
import { HostelScreen } from "../screens/HostelScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { ItemDetailScreen } from "../screens/ItemDetailScreen";
import { ReportConcernScreen } from "../screens/ReportConcernScreen";
import { ReportScreen } from "../screens/ReportScreen";
import { SafetyScreen } from "../screens/SafetyScreen";
import { SectionChooserScreen } from "../screens/SectionChooserScreen";
import { COLORS, FONTS, RADIUS, SHADOW, TAB_BAR, WIDE_BREAKPOINT } from "../constants/config";
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
  const { width } = useWindowDimensions();
  // The desktop dashboard (HomeScreen's wide layout) brings its own
  // sidebar nav that already covers Home/Browse/Requests — a bottom
  // tab bar under it would just be a second, redundant nav surface.
  const wide = width >= WIDE_BREAKPOINT;

  return (
    <Tab.Navigator
      tabBar={(props) => (wide ? null : <FloatingTabBar {...props} />)}
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
        // Cross-fade + shift instead of an instant cut when switching tabs.
        // On wide screens the sidebar lives inside each screen, so shifting
        // would drag it along — SidebarShell animates just the content there.
        animation: wide ? "none" : "shift",
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
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          title: "Profile",
          headerShown: false,
          tabBarLabel: "Profile",
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name="person" nameOutline="person-outline" />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

/** Authenticated stack: tabs + detail/report screens. */
export function AppStack() {
  const { width } = useWindowDimensions();
  const wide = width >= WIDE_BREAKPOINT;
  return (
    <Stack.Navigator
      initialRouteName="Chooser"
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
        // `fade_from_bottom` isn't implemented by react-native-screens on
        // Android/web, so those platforms were getting an instant cut with
        // no animation at all. slide_from_right has consistent cross-platform
        // (including web) support.
        animation: "slide_from_right",
        animationDuration: 280,
      }}
    >
      <Stack.Screen
        name="Chooser"
        component={SectionChooserScreen}
        options={{ headerShown: false }}
      />
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
      <Stack.Screen name="About" component={AboutScreen} options={{ title: "About" }} />
      <Stack.Screen
        name="Safety"
        component={SafetyScreen}
        // Safety is a sidebar page on desktop: SidebarShell animates it and the
        // sidebar replaces the stack header, so drop both there.
        options={{
          title: "Report a concern",
          headerShown: !wide,
          animation: wide ? "none" : "slide_from_right",
        }}
      />
      <Stack.Screen
        name="ReportConcern"
        component={ReportConcernScreen}
        options={{ title: "Report a concern" }}
      />
      <Stack.Screen
        name="ConcernDetail"
        component={ConcernDetailScreen}
        options={{ title: "Your report" }}
      />
      <Stack.Screen
        name="EnquiryInbox"
        component={EnquiryInboxScreen}
        options={{ title: "Enquiry inbox" }}
      />
      <Stack.Screen
        name="EnquiryConcernDetail"
        component={EnquiryConcernDetailScreen}
        options={{ title: "Report detail" }}
      />
      <Stack.Screen
        name="Hostel"
        component={HostelScreen}
        // A sidebar page on desktop, same as Safety above.
        options={{
          title: "Hostel complaints",
          headerShown: !wide,
          animation: wide ? "none" : "slide_from_right",
        }}
      />
      <Stack.Screen
        name="HostelComplaintNew"
        component={HostelComplaintFormScreen}
        options={{ title: "New complaint" }}
      />
      <Stack.Screen
        name="HostelComplaintDetail"
        component={HostelComplaintDetailScreen}
        options={{ title: "Complaint" }}
      />
      <Stack.Screen
        name="HostelInbox"
        component={HostelInboxScreen}
        options={{ title: "Hostel office inbox" }}
      />
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
