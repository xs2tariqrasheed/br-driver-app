import Typography from "@/components/Typography";
import { Tabs } from "expo-router";
import React from "react";
import { Image, ImageProps, Platform, StyleSheet, View } from "react-native";

import { HapticTab } from "@/components/HapticTab";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { textColors } from "@/constants/colors";

const SHOW_EXAMPLES = process.env.EXPO_PUBLIC_SHOW_EXAMPLES === "true";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: (props) => (
          <HapticTab {...props} pressColor={textColors.teal200} />
        ),
        tabBarBackground: TabBarBackground,
        tabBarShowLabel: false,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: "absolute",
            height: 76,
          },
          default: { height: 76, paddingTop: 20 },
        }),
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
  return (
    <View
      style={[styles.itemContainer, focused && styles.itemContainerFocused]}
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
    width: 90,
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
