import Header from "@/components/Header";
import { ThemedView } from "@/components/ThemedView";
import Typography from "@/components/Typography";
import React from "react";
import { View } from "react-native";

const NotificationsScreen: React.FC = () => {
  return (
    <ThemedView style={{ flex: 1 }}>
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
