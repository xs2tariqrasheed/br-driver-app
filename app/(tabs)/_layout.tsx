import Typography from "@/components/Typography";
import { Tabs, usePathname } from "expo-router";
import { Image, ImageProps, Platform, StyleSheet, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/HapticTab";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { textColors } from "@/constants/colors";

const SHOW_EXAMPLES = process.env.EXPO_PUBLIC_SHOW_EXAMPLES === "true";

// Only hide tabs on active ride related screens
const TAB_HIDDEN_PATHS = [
  "/(screens)/active-ride",
  "/(screens)/chat",
  "/(screens)/ride-offer",
  "/(screens)/trip-details",
  "/(screens)/feedback",
  "/(screens)/desired-destinations-map",
  "/(tabs)/desired-destinations-map",
  "/desired-destinations-map", // Add path without group prefix
];

export default function TabLayout() {
  const pathname = usePathname();
  // Hide tabs only on active ride related screens
  // Show tabs on all other screens including notifications, settings, desired-destinations, etc.
  const hideTabs = TAB_HIDDEN_PATHS.some((route) =>
    pathname?.startsWith(route)
  ) || pathname?.includes("desired-destinations-map");
  const insets = useSafeAreaInsets();
  
  // Calculate dynamic tab bar height
  // Base height: 64px for tab items + safe area bottom inset
  // Minimum height: 64px + 8px padding, Maximum: responsive to screen
  const baseTabHeight = 64;
  const minPadding = 8;
  const tabBarHeight = Math.max(
    baseTabHeight + minPadding,
    baseTabHeight + insets.bottom + minPadding
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: (props) => (
          <HapticTab {...props} pressColor={textColors.teal200} />
        ),
        tabBarBackground: TabBarBackground,
        tabBarShowLabel: false,
        tabBarStyle: [
          Platform.select({
            ios: {
              // Use a transparent background on iOS to show the blur effect
              position: "absolute",
              height: tabBarHeight,
              // paddingBottom: Math.max(insets.bottom, minPadding),
              paddingTop: 18,
            },
            default: { 
              height: tabBarHeight,
              paddingTop: Math.max(insets.top, 8),
              paddingBottom: Math.max(insets.bottom, minPadding),
            },
          }),
          hideTabs ? { display: "none" } : null,
        ] as any,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => (
            <TabItem
              label="Home"
              focused={focused}
              source={require("@/assets/images/home-icon.png")}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="active-job"
        options={{
          title: "Active Job",
          tabBarIcon: ({ focused }) => (
            <TabItem
              label="Active Job"
              focused={focused}
              source={require("@/assets/images/active-jobs-icon.png")}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="earnings"
        options={{
          title: "Earnings",
          tabBarIcon: ({ focused }) => (
            <TabItem
              label="Earnings"
              focused={focused}
              source={require("@/assets/images/earnings-icon.png")}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: "More",
          tabBarIcon: ({ focused }) => (
            <TabItem
              label="More"
              focused={focused}
              source={require("@/assets/images/more-icon.png")}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="examples"
        options={{
          // Hide this tab entirely when the flag is false
          href: SHOW_EXAMPLES ? undefined : null,
          title: "Examples",
          tabBarIcon: ({ focused }) => (
            <TabItem
              label="Examples"
              focused={focused}
              source={require("@/assets/images/more-icon.png")}
            />
          ),
        }}
      />
      {/* Stack screens accessible within tabs - hidden from tab bar */}
      <Tabs.Screen
        name="notifications"
        options={{
          href: null, // Hide from tab bar but accessible via navigation
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          href: null, // Hide from tab bar but accessible via navigation
        }}
      />
      <Tabs.Screen
        name="desired-destinations"
        options={{
          href: null, // Hide from tab bar but accessible via navigation
        }}
      />
      <Tabs.Screen
        name="desired-destinations-map"
        options={{
          href: null, // Hide from tab bar but accessible via navigation
        }}
      />
      <Tabs.Screen
        name="heat-map"
        options={{
          href: null, // Hide from tab bar but accessible via navigation
        }}
      />
    </Tabs>
  );
}

function TabItem({
  label,
  focused,
  source,
}: {
  label: string;
  focused: boolean;
  source: ImageProps["source"];
}) {
  const { width } = useWindowDimensions();
  // Make tab item width responsive - ensure "Active Job" fits on small screens
  // For small screens (< 375px), use wider width to accommodate longer labels
  const isSmallScreen = width < 375;
  const baseWidth = isSmallScreen ? 95 : 90; // Slightly wider for small screens
  const tabItemWidth = Math.min(baseWidth, Math.max(baseWidth, width * 0.25));
  
  return (
    <View
      style={[
        styles.itemContainer,
        { width: tabItemWidth },
        focused && styles.itemContainerFocused,
      ]}
    >
      <Image
        source={source}
        style={[styles.icon, focused && styles.iconFocused]}
        resizeMode="contain"
      />
      <Typography
        type="labelLarge"
        weight="semibold"
        style={[styles.label, focused && styles.labelFocused]}
        numberOfLines={1}
      >
        {label}
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  itemContainer: {
    // width is now dynamic based on screen size
    height: 64,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "transparent",
    backgroundColor: "transparent",
  },
  itemContainerFocused: {
    borderColor: textColors.teal500,
    backgroundColor: textColors.teal0,
  },
  icon: {
    width: 24,
    height: 24,
    tintColor: textColors.black,
  },
  iconFocused: {
    tintColor: textColors.teal800,
  },
  label: {
    color: textColors.grey700,
    textAlign: "center",
    flexShrink: 0, // Prevent text from shrinking
  },
  labelFocused: {
    color: textColors.teal900,
    textAlign: "center",
    flexShrink: 0, // Prevent text from shrinking
  },
});
