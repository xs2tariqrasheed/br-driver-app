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
import { router, Stack, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

type TabType = "All" | "Unread" | "Read";

const NotificationsScreen: React.FC = () => {
  const {
    notifications,
    fetchNotifications,
    markNotificationAsRead,
    replyToNotification,
    addNotifications,
    getNotificationById,
    deleteNotification,
    deleteAllNotifications,
    isFetchingNotifications,
    isMarkingAsRead,
    isDeletingNotification,
    isReplyingToNotification,
  } = useDriver();
  const [selectedNotification, setSelectedNotification] =
    useState<NotificationItemType | null>(null);
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("Unread");

  // Fetch notifications only when screen is focused
  useFocusEffect(
    useCallback(() => {
      console.log("[NotificationsScreen] useFocusEffect triggered");
      let isActive = true;

      const loadNotifications = async () => {
        if (!isActive) return;
        try {
          console.log("[NotificationsScreen] Calling fetchNotifications");
          await fetchNotifications();
        } catch (error) {
          if (!isActive) return;
          console.error("Error loading notifications:", error);
        }
      };

      loadNotifications();

      // Cleanup function to prevent state updates if component unmounts
      return () => {
        console.log("[NotificationsScreen] useFocusEffect cleanup");
        isActive = false;
      };
    }, [fetchNotifications])
  );

  // Check if any API operation is in progress
  const isProcessing = isFetchingNotifications || isMarkingAsRead || isDeletingNotification || isReplyingToNotification;

  const handleNotificationPress = async (notificationId: string) => {
    if (isProcessing) return; // Prevent action during processing

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

  const handleSendReply = async (reply: string) => {
    if (!selectedNotification) return;

    try {
      await replyToNotification(selectedNotification.id, reply);
      Alert.alert(
        "Reply Sent",
        `Your reply: "${reply}" has been sent successfully.`
      );
      console.log("Reply sent:", reply);
    } catch (error: any) {
      console.error("Error sending reply:", error);
      Alert.alert(
        "Error",
        error?.message || "Failed to send reply. Please try again.",
        [{ text: "OK" }]
      );
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    if (isProcessing) return; // Prevent action during processing

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
            try {
              await deleteNotification(notificationId);
              // The notification will be automatically removed from the UI
              // due to the context state update
            } catch (error) {
              console.error("Failed to delete notification:", error);
              Alert.alert(
                "Error",
                "Failed to delete notification. Please try again.",
                [{ text: "OK" }]
              );
            }
          },
        },
      ]
    );
  };

  const handleDeleteAll = async () => {
    if (notifications.length === 0 || isProcessing) return; // Prevent action during processing

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
            try {
              await deleteAllNotifications();
              // All notifications will be automatically removed from the UI
              // due to the context state update
            } catch (error) {
              console.error("Failed to delete all notifications:", error);
              Alert.alert(
                "Error",
                "Failed to delete all notifications. Please try again.",
                [{ text: "OK" }]
              );
            }
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
    <SafeAreaView style={{ flex: 1 }}>
      <ThemedView style={{ flex: 1 }}>
        <Stack.Screen options={{ headerShown: false }} />
        <Header
        title="Notifications"
        hideBackIcon={false}
        onBackPress={() => router.back()}
        rightAccessory={
          notifications.length > 0 ? (
            <TouchableOpacity
              style={[styles.deleteAllButton, isProcessing && styles.disabledButton]}
              onPress={handleDeleteAll}
              activeOpacity={0.6}
              disabled={isProcessing}
            >
              <Image
                source={require("@/assets/images/delete-icon.png")}
                style={[styles.deleteAllIcon, isProcessing && styles.disabledIcon]}
                contentFit="contain"
              />
              <Typography
                type="bodySmall"
                weight="medium"
                style={[styles.deleteAllText, isProcessing && styles.disabledText]}
              >
                Clear All
              </Typography>
            </TouchableOpacity>
          ) : null
        }
      />

      {/* Tab Navigator */}
      <TabNavigator />

      {isFetchingNotifications ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={textColors.teal700} />
          <Typography type="bodyMedium" weight="regular" style={styles.loadingText}>
            Loading notifications...
          </Typography>
        </View>
      ) : filteredNotifications.length > 0 ? (
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
        isReplying={isReplyingToNotification}
        />
      </ThemedView>
    </SafeAreaView>
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
  disabledButton: {
    opacity: 0.5,
  },
  disabledIcon: {
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    color: textColors.grey600,
  },
});

export default NotificationsScreen;
