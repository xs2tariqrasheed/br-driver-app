import Typography from "@/components/Typography";
import { Tabs, usePathname } from "expo-router";
import { Image, ImageProps, Platform, StyleSheet, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/HapticTab";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { textColors } from "@/constants/colors";

const SHOW_EXAMPLES = process.env.EXPO_PUBLIC_SHOW_EXAMPLES === "true";

export default function TabLayout() {
  const pathname = usePathname();
  const hideTabs = pathname === "/(screens)/active-ride";
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
              paddingBottom: Math.max(insets.bottom, minPadding),
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
  // Make tab item width responsive - smaller on smaller screens
  const tabItemWidth = Math.min(90, Math.max(70, width * 0.18));
  
  return (
    <View
      style={[
        styles.itemContainer,
        { width: tabItemWidth },
        focused && styles.itemContainerFocused,
      ]}
    >
      <Image source={source} style={styles.icon} resizeMode="contain" />
      <Typography type="labelLarge" weight="semibold" style={styles.label}>
        {label}
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  itemContainer: {
    // width is now dynamic based on screen size
    height: 64,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 0,
    borderColor: textColors.black,
    borderRadius: 14,
  },
  itemContainerFocused: {
    borderWidth: 1,
  },
  icon: {
    width: 24,
    height: 24,
    tintColor: textColors.black,
  },
  label: {
    color: textColors.black,
  },
});
