import Header from "@/components/Header";
import NotificationBottomSheet from "@/components/NotificationBottomSheet";
import NotificationItem from "@/components/NotificationItem";
import { ThemedView } from "@/components/ThemedView";
import Typography from "@/components/Typography";
import { textColors } from "@/constants/colors";
import {
  NotificationItem as NotificationItemType,
  useDriver,
} from "@/context/DriverContext";
import { Image } from "expo-image";
import { router, Stack } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

type TabType = "All" | "Unread" | "Read";

const NotificationsScreen: React.FC = () => {
  const {
    notifications,
    markNotificationAsRead,
    addNotifications,
    getNotificationById,
    deleteNotification,
    deleteAllNotifications,
  } = useDriver();
  const [selectedNotification, setSelectedNotification] =
    useState<NotificationItemType | null>(null);
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("All");
  // Sample notifications are now initialized in DriverContext

  const handleNotificationPress = async (notificationId: string) => {
    const notification = getNotificationById(notificationId);
    if (!notification) return;

    // Mark as read if it's unread
    if (notification.messageType === "unread") {
      await markNotificationAsRead(notificationId);
    }

    // Open bottom sheet with notification details
    setSelectedNotification(notification);
    setBottomSheetOpen(true);
  };

  const handleBottomSheetClose = () => {
    setBottomSheetOpen(false);
    setSelectedNotification(null);
  };

  const handleSendReply = (reply: string) => {
    Alert.alert(
      "Reply Sent",
      `Your reply: "${reply}" has been sent successfully.`
    );
    console.log("Reply sent:", reply);
    // Here you would typically send the reply to your backend
  };

  const handleDeleteNotification = async (notificationId: string) => {
    Alert.alert(
      "Delete Notification",
      "Are you sure you want to delete this notification?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteNotification(notificationId);
          },
        },
      ]
    );
  };

  const handleDeleteAll = async () => {
    if (notifications.length === 0) return;

    Alert.alert(
      "Delete All Notifications",
      "Are you sure you want to delete all notifications? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete All",
          style: "destructive",
          onPress: async () => {
            await deleteAllNotifications();
          },
        },
      ]
    );
  };

  // Filter notifications based on active tab
  const filteredNotifications = notifications.filter((notification) => {
    switch (activeTab) {
      case "Unread":
        return notification.messageType === "unread";
      case "Read":
        return notification.messageType === "read";
      case "All":
      default:
        return true;
    }
  });

  // Tab component
  const TabNavigator = () => {
    const tabs: TabType[] = ["All", "Unread", "Read"];

    return (
      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Typography
              type="bodyLarge"
              weight={activeTab === tab ? "bold" : "regular"}
              style={[
                styles.tabText,
                activeTab === tab
                  ? styles.activeTabText
                  : styles.inactiveTabText,
              ]}
            >
              {tab}
            </Typography>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      <Stack.Screen options={{ headerShown: false }} />
      <Header
        title="Notifications"
        hideBackIcon={false}
        onBackPress={() => router.back()}
        rightAccessory={
          notifications.length > 0 ? (
            <TouchableOpacity
              style={styles.deleteAllButton}
              onPress={handleDeleteAll}
              activeOpacity={0.6}
            >
              <Image
                source={require("@/assets/images/delete-icon.png")}
                style={styles.deleteAllIcon}
                contentFit="contain"
              />
              <Typography
                type="bodySmall"
                weight="medium"
                style={styles.deleteAllText}
              >
                Clear All
              </Typography>
            </TouchableOpacity>
          ) : null
        }
      />

      {/* Tab Navigator */}
      <TabNavigator />

      {filteredNotifications.length > 0 ? (
        <ScrollView style={{ flex: 1 }}>
          {filteredNotifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              id={notification.id}
              messageTitle={notification.messageTitle}
              messageBody={notification.messageBody}
              dateTime={notification.dateTime}
              messageType={notification.messageType}
              isSpecial={notification.isSpecial}
              onPress={handleNotificationPress}
              onDelete={handleDeleteNotification}
            />
          ))}
        </ScrollView>
      ) : (
        <View style={{ padding: 16 }}>
          <Typography type="bodyLarge" weight="regular">
            {activeTab === "All"
              ? "No notifications yet."
              : `No ${activeTab.toLowerCase()} notifications.`}
          </Typography>
        </View>
      )}

      {/* Notification Bottom Sheet */}
      <NotificationBottomSheet
        open={bottomSheetOpen}
        onClose={handleBottomSheetClose}
        notification={selectedNotification}
        onSendReply={handleSendReply}
      />
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: "row",
    backgroundColor: textColors.white,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: textColors.grey100,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
    borderBottomWidth: 4,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: textColors.teal700,
  },
  tabText: {
    textAlign: "center",
  },
  activeTabText: {
    color: textColors.black,
  },
  inactiveTabText: {
    color: "#717171",
  },
  deleteAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  deleteAllIcon: {
    width: 16,
    height: 16,
    tintColor: textColors.red500,
  },
  deleteAllText: {
    color: textColors.red500,
  },
});

export default NotificationsScreen;
