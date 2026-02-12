import Header from "@/components/Header";
import NotificationBottomSheet from "@/components/NotificationBottomSheet";
import NotificationItem from "@/components/NotificationItem";
import { ThemedView } from "@/components/ThemedView";
import Typography from "@/components/Typography";
import { textColors } from "@/constants/colors";
import { NOTIFICATIONS_CONTENT_KEYS } from "@/content/notifications-keys";
import {
  NotificationItem as NotificationItemType,
  useDriver,
} from "@/context/DriverContext";
import { useGetContent } from "@/hooks/useGetContent";
import { Image } from "expo-image";
import { router, Stack, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
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
  // Page Content Start
  const { getContent } = useGetContent();
  const {
    headerTitle,
    actionClearAll,
    tabAll,
    tabUnread,
    tabRead,
    loadingMessage,
    emptyAll,
    emptyFilteredPrefix,
    emptyFilteredSuffix,
    alertReplySentTitle,
    alertReplySentMessage,
    alertErrorTitle,
    alertReplyFailed,
    alertOk,
    alertDeleteTitle,
    alertDeleteMessage,
    alertDeleteCancel,
    alertDeleteConfirm,
    alertDeleteFailed,
    alertDeleteAllTitle,
    alertDeleteAllMessage,
    alertDeleteAllConfirm,
    alertDeleteAllFailed,
  } = useMemo(() => {
    const get = getContent;

    return {
      headerTitle: get(NOTIFICATIONS_CONTENT_KEYS.HEADER_TITLE),
      actionClearAll: get(NOTIFICATIONS_CONTENT_KEYS.ACTION_CLEAR_ALL),
      tabAll: get(NOTIFICATIONS_CONTENT_KEYS.TAB_ALL),
      tabUnread: get(NOTIFICATIONS_CONTENT_KEYS.TAB_UNREAD),
      tabRead: get(NOTIFICATIONS_CONTENT_KEYS.TAB_READ),
      loadingMessage: get(NOTIFICATIONS_CONTENT_KEYS.LOADING_MESSAGE),
      emptyAll: get(NOTIFICATIONS_CONTENT_KEYS.EMPTY_ALL),
      emptyFilteredPrefix: get(
        NOTIFICATIONS_CONTENT_KEYS.EMPTY_FILTERED_PREFIX,
      ),
      emptyFilteredSuffix: get(
        NOTIFICATIONS_CONTENT_KEYS.EMPTY_FILTERED_SUFFIX,
      ),
      alertReplySentTitle: get(
        NOTIFICATIONS_CONTENT_KEYS.ALERT_REPLY_SENT_TITLE,
      ),
      alertReplySentMessage: get(
        NOTIFICATIONS_CONTENT_KEYS.ALERT_REPLY_SENT_MESSAGE,
      ),
      alertErrorTitle: get(NOTIFICATIONS_CONTENT_KEYS.ALERT_ERROR_TITLE),
      alertReplyFailed: get(NOTIFICATIONS_CONTENT_KEYS.ALERT_REPLY_FAILED),
      alertOk: get(NOTIFICATIONS_CONTENT_KEYS.ALERT_OK),
      alertDeleteTitle: get(NOTIFICATIONS_CONTENT_KEYS.ALERT_DELETE_TITLE),
      alertDeleteMessage: get(NOTIFICATIONS_CONTENT_KEYS.ALERT_DELETE_MESSAGE),
      alertDeleteCancel: get(NOTIFICATIONS_CONTENT_KEYS.ALERT_DELETE_CANCEL),
      alertDeleteConfirm: get(NOTIFICATIONS_CONTENT_KEYS.ALERT_DELETE_CONFIRM),
      alertDeleteFailed: get(NOTIFICATIONS_CONTENT_KEYS.ALERT_DELETE_FAILED),
      alertDeleteAllTitle: get(
        NOTIFICATIONS_CONTENT_KEYS.ALERT_DELETE_ALL_TITLE,
      ),
      alertDeleteAllMessage: get(
        NOTIFICATIONS_CONTENT_KEYS.ALERT_DELETE_ALL_MESSAGE,
      ),
      alertDeleteAllConfirm: get(
        NOTIFICATIONS_CONTENT_KEYS.ALERT_DELETE_ALL_CONFIRM,
      ),
      alertDeleteAllFailed: get(
        NOTIFICATIONS_CONTENT_KEYS.ALERT_DELETE_ALL_FAILED,
      ),
    };
  }, [getContent]);
  // Page Content End

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
    }, [fetchNotifications]),
  );

  // Check if any API operation is in progress
  const isProcessing =
    isFetchingNotifications ||
    isMarkingAsRead ||
    isDeletingNotification ||
    isReplyingToNotification;

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
      Alert.alert(alertReplySentTitle, alertReplySentMessage);
    } catch (error: any) {
      console.error("Error sending reply:", error);
      Alert.alert(alertErrorTitle, error?.message || alertReplyFailed, [
        { text: alertOk },
      ]);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    if (isProcessing) return; // Prevent action during processing

    Alert.alert(alertDeleteTitle, alertDeleteMessage, [
      {
        text: alertDeleteCancel,
        style: "cancel",
      },
      {
        text: alertDeleteConfirm,
        style: "destructive",
        onPress: async () => {
          try {
            await deleteNotification(notificationId);
            // The notification will be automatically removed from the UI
            // due to the context state update
          } catch (error) {
            console.error("Failed to delete notification:", error);
            Alert.alert(alertErrorTitle, alertDeleteFailed, [
              { text: alertOk },
            ]);
          }
        },
      },
    ]);
  };

  const handleDeleteAll = async () => {
    if (notifications.length === 0 || isProcessing) return; // Prevent action during processing

    Alert.alert(alertDeleteAllTitle, alertDeleteAllMessage, [
      {
        text: alertDeleteCancel,
        style: "cancel",
      },
      {
        text: alertDeleteAllConfirm,
        style: "destructive",
        onPress: async () => {
          try {
            await deleteAllNotifications();
            // All notifications will be automatically removed from the UI
            // due to the context state update
          } catch (error) {
            console.error("Failed to delete all notifications:", error);
            Alert.alert(alertErrorTitle, alertDeleteAllFailed, [
              { text: alertOk },
            ]);
          }
        },
      },
    ]);
  };

  // Filter notifications based on active tab (use stable tab id)
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

  // Tab component – use stable keys (tab id) to avoid duplicate key when content is loading
  const TAB_IDS = ["All", "Unread", "Read"] as const;
  const TabNavigator = ({ read, unread, all }: any) => {
    const tabs: { id: (typeof TAB_IDS)[number]; label: string }[] = [
      { id: "All", label: all },
      { id: "Unread", label: unread },
      { id: "Read", label: read },
    ];

    return (
      <View style={styles.tabContainer}>
        {tabs.map(({ id, label }) => (
          <TouchableOpacity
            key={id}
            style={[styles.tab, activeTab === id && styles.activeTab]}
            onPress={() => setActiveTab(id)}
          >
            <Typography
              type="bodyLarge"
              weight={activeTab === id ? "bold" : "regular"}
              style={[
                styles.tabText,
                activeTab === id
                  ? styles.activeTabText
                  : styles.inactiveTabText,
              ]}
            >
              {label}
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
          title={headerTitle}
          hideBackIcon={false}
          onBackPress={() => router.back()}
          rightAccessory={
            notifications.length > 0 ? (
              <TouchableOpacity
                style={[
                  styles.deleteAllButton,
                  isProcessing && styles.disabledButton,
                ]}
                onPress={handleDeleteAll}
                activeOpacity={0.6}
                disabled={isProcessing}
              >
                <Image
                  source={require("@/assets/images/delete-icon.png")}
                  style={[
                    styles.deleteAllIcon,
                    isProcessing && styles.disabledIcon,
                  ]}
                  contentFit="contain"
                />
                <Typography
                  type="bodySmall"
                  weight="medium"
                  style={[
                    styles.deleteAllText,
                    isProcessing && styles.disabledText,
                  ]}
                >
                  {actionClearAll}
                </Typography>
              </TouchableOpacity>
            ) : null
          }
        />

        {/* Tab Navigator */}
        <TabNavigator read={tabRead} unread={tabUnread} all={tabAll} />

        {isFetchingNotifications ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={textColors.teal700} />
            <Typography
              type="bodyMedium"
              weight="regular"
              style={styles.loadingText}
            >
              {loadingMessage}
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
                ? emptyAll
                : `${emptyFilteredPrefix} ${activeTab.toLowerCase()} ${emptyFilteredSuffix}`}
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
