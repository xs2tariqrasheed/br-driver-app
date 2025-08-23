import Header from "@/components/Header";
import { ThemedView } from "@/components/ThemedView";
import Typography from "@/components/Typography";
import { Stack } from "expo-router";
import React from "react";
import { View } from "react-native";

const NotificationsScreen: React.FC = () => {
  return (
    <ThemedView style={{ flex: 1 }}>
      <Stack.Screen options={{ headerShown: false }} />
      <Header title="Notifications" hideBackIcon={false} />
      <View style={{ padding: 16 }}>
        <Typography type="bodyLarge" weight="regular">
          No notifications yet.
        </Typography>
      </View>
    </ThemedView>
  );
};

export default NotificationsScreen;
