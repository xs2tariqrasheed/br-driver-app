import CustomBottomSheet from "@/components/BottomSheet";
import Button from "@/components/Button";
import ConfirmationSheet from "@/components/ConfirmationSheet";
import Header from "@/components/Header";
import Logo from "@/components/Logo";
import Typography from "@/components/Typography";
import { useBottomTabOverflow } from "@/components/ui/TabBarBackground";
import { textColors } from "@/constants/colors";
import { DRIVER_ENDPOINTS } from "@/constants/endpoints";
import {
  CONTACT_BASE,
  DRIVER_STORAGE_KEY,
  NOTIFICATIONS_BACKUP_STORAGE_KEY,
  URLS,
} from "@/constants/global";
import { useAuth } from "@/context/AuthContext";
import { useDriver } from "@/context/DriverContext";
import { SETTINGS_STORAGE_KEY } from "@/context/SettingsContext";
import { useDelete } from "@/hooks/useDelete";
import {
  clearStorageSelectively,
  getStorageItem,
  logger,
  setStorageItem,
} from "@/utils/helpers";
import { disconnectSocket } from "@/utils/socket";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  FlatList,
  Image,
  Linking,
  Platform,
  SafeAreaView,
  Share,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

type MoreItem = {
  key: string;
  title: string;
  icon: any;
  onClick?: () => void;
};

const ITEMS: MoreItem[] = [
  {
    key: "profile",
    title: "Profile",
    icon: require("@/assets/images/more/profile-icon.png"),
  },
  {
    key: "inbox",
    title: "Inbox",
    icon: require("@/assets/images/more/inbox-icon.png"),
  },
  {
    key: "contact-base",
    title: "Contact Base",
    icon: require("@/assets/images/more/contact-base-icon.png"),
  },
  {
    key: "coming-soon",
    title: "Coming Soon",
    icon: require("@/assets/images/more/coming-soon-icon.png"),
  },
  {
    key: "share-app",
    title: "Share App",
    icon: require("@/assets/images/more/share-icon.png"),
  },
  {
    key: "app-settings",
    title: "App Settings",
    icon: require("@/assets/images/more/settings-icon.png"),
  },
  {
    key: "delete-profile",
    title: "Delete Profile",
    icon: require("@/assets/images/more/delete-profile-icon.png"),
  },
  {
    key: "change-password",
    title: "Change Password",
    icon: require("@/assets/images/more/change-password-icon.png"),
  },
  {
    key: "logout",
    title: "Logout",
    icon: require("@/assets/images/more/logout-icon.png"),
  },
];

export default function MoreScreen() {
  const router = useRouter();
  const log = logger();
  const [auth, setAuth] = useAuth();
  const [driver, setDriver] = useDriver();
  const { removeRetrievalId, removeTripId } = useDriver();
  const [logoutSheetOpen, setLogoutSheetOpen] = useState(false);
  const [deleteProfileSheetOpen, setDeleteProfileSheetOpen] = useState(false);
  const [contactBaseSheetOpen, setContactBaseSheetOpen] = useState(false);
  const bottomTabOverflow = useBottomTabOverflow();

  // Offline API using shared delete hook
  const { execute: deleteOnlineLocation } = useDelete(
    DRIVER_ENDPOINTS.markOffline(auth?.user?.id || "")
  );

  const handleLogout = async () => {
    // Mark driver as offline via API
    if (driver?.online) {
      try {
        log("[MoreScreen] Marking driver as offline via API");
        await deleteOnlineLocation();
        log("[MoreScreen] Driver successfully marked as offline");
      } catch (error) {
        log("[MoreScreen] Error marking driver offline:", error);
        // Continue with logout even if API call fails
      }
    }

    // Update driver context to mark as offline
    try {
      if (driver) {
        await setDriver({
          ...driver,
          online: false,
        });
        log("[MoreScreen] Driver state updated to offline");
      }
    } catch (error) {
      log("[MoreScreen] Error updating driver state:", error);
      // Continue with logout even if state update fails
    }

    // Disconnect socket
    try {
      disconnectSocket();
      log("[MoreScreen] Socket disconnected successfully");
    } catch (err) {
      log("[MoreScreen] Error disconnecting socket:", err);
      // Continue with logout even if socket disconnect fails
    }
  };

  const handleDataDelete = async () => {
    // Call offline API if driver is online
    if (driver?.online) {
      try {
        log("[MoreScreen] Marking driver as offline via API");
        await deleteOnlineLocation();
        log("[MoreScreen] Driver successfully marked as offline");
      } catch (error) {
        log("[MoreScreen] Error marking driver offline:", error);
        // Continue with logout/delete even if API call fails
      }
    }

    // Remove retrieval ID from context and AsyncStorage
    try {
      await removeRetrievalId();
      log("[MoreScreen] Retrieval ID removed successfully");
    } catch (error) {
      log("[MoreScreen] Error removing retrieval ID:", error);
      // Continue with logout/delete even if retrieval ID removal fails
    }

    // Remove trip ID from context and AsyncStorage
    try {
      await removeTripId();
      log("[MoreScreen] Trip ID removed successfully");
    } catch (error) {
      log("[MoreScreen] Error removing trip ID:", error);
      // Continue with logout/delete even if trip ID removal fails
    }

    // Disconnect socket
    try {
      disconnectSocket();
      log("[MoreScreen] Socket disconnected successfully");
    } catch (error) {
      log("[MoreScreen] Error disconnecting socket:", error);
      // Continue with logout/delete even if socket disconnect fails
    }

    // Extract and backup notifications before clearing storage
    try {
      const driverData = await getStorageItem(DRIVER_STORAGE_KEY);
      if (driverData) {
        try {
          const parsed = JSON.parse(driverData);
          const notificationsBackup = {
            notifications: parsed.notifications || [],
            readNotificationIds: parsed.readNotificationIds || [],
          };
          await setStorageItem(
            NOTIFICATIONS_BACKUP_STORAGE_KEY,
            JSON.stringify(notificationsBackup)
          );
          log(
            "[MoreScreen] Notifications backed up successfully:",
            notificationsBackup.notifications.length,
            "notifications"
          );
        } catch (parseError) {
          log(
            "[MoreScreen] Error parsing driver data for notifications backup:",
            parseError
          );
          // Continue without backup if parsing fails
        }
      } else {
        log("[MoreScreen] No driver data found, skipping notifications backup");
      }
    } catch (error) {
      log("[MoreScreen] Error backing up notifications:", error);
      // Continue with logout even if backup fails
    }

    // Clear storage selectively, preserving settings and notifications backup
    try {
      await clearStorageSelectively([
        SETTINGS_STORAGE_KEY,
        NOTIFICATIONS_BACKUP_STORAGE_KEY,
      ]);
      log("[MoreScreen] Storage cleared selectively, settings and notifications preserved");
    } catch (error) {
      log("[MoreScreen] Error clearing storage selectively:", error);
      // Continue with logout even if storage clearing fails
    }

    // Reset contexts (settings will be preserved in storage)
    await setAuth(null);
    await setDriver(null);
    // Note: Settings are preserved in storage, so we don't reset them here
  };

  const handleShareApp = async () => {
    try {
      const isIOS = Platform.OS === "ios";
      const storeUrl = isIOS ? URLS.appStore : URLS.playStore;
      const message = `Check out the BR Driver app! Download it here: ${storeUrl}`;
      await Share.share({ message, url: storeUrl, title: "BR Driver" });
    } catch (error) {
      // noop: silently ignore share cancellation/errors
    }
  };

  const data: MoreItem[] = ITEMS.map((item) => {
    if (item.key === "change-password") {
      return {
        ...item,
        onClick: () => router.push("/(screens)/more/update-password"),
      };
    }
    if (item.key === "delete-profile") {
      return {
        ...item,
        onClick: () => {
          console.log("[MoreScreen] Delete profile clicked");
          setDeleteProfileSheetOpen(true);
        },
      };
    }
    if (item.key === "logout") {
      return {
        ...item,
        onClick: () => {
          console.log("[MoreScreen] Logout clicked");
          setLogoutSheetOpen(true);
        },
      };
    }
    if (item.key === "contact-base") {
      return {
        ...item,
        onClick: () => setContactBaseSheetOpen(true),
      };
    }
    if (item.key === "share-app") {
      return {
        ...item,
        onClick: handleShareApp,
      };
    }
    if (item.key === "app-settings") {
      return {
        ...item,
        onClick: () => router.push("/(screens)/more/app-settings"),
      };
    }
    if (item.key === "inbox") {
      return {
        ...item,
        onClick: () => router.push("/(tabs)/notifications"),
      };
    }
    return item;
  });

  const renderItem = ({ item }: { item: MoreItem }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      style={styles.card}
      onPress={item.onClick}
      disabled={!item.onClick}
    >
      <Image source={item.icon} style={styles.icon} />
      <Typography type="bodyLarge" weight="bold" style={styles.cardTitle}>
        {item.title}
      </Typography>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header title="More" hideBackIcon />
      <View style={styles.content}>
        <FlatList
          data={data}
          renderItem={renderItem}
          keyExtractor={(item) => item.key}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={styles.column}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: bottomTabOverflow + 24 },
          ]}
          ListHeaderComponent={
            <View style={styles.logoRow}>
              <Logo size="Large" />
            </View>
          }
        />
      </View>
      <ConfirmationSheet
        open={logoutSheetOpen}
        title="Are You Sure?"
        description="Are you sure you want to logout? This action cannot be undone."
        cancelButtonText="Cancel"
        confirmButtonText="Yes, Logout"
        onCancel={() => setLogoutSheetOpen(false)}
        onConfirm={() => {
          handleLogout();
          setLogoutSheetOpen(false);
          router.replace("/(screens)/auth/login");
        }}
      />

      {/* Delete Profile Confirmation */}
      <ConfirmationSheet
        open={deleteProfileSheetOpen}
        title="Are You Sure?"
        description="Are you sure you want to delete your profile? This action cannot be undone."
        cancelButtonText="Cancel"
        confirmButtonText="Yes, Delete"
        onCancel={() => setDeleteProfileSheetOpen(false)}
        onConfirm={() => {
          handleDataDelete();
          setDeleteProfileSheetOpen(false);
          router.push("/(screens)/auth/verify-otp?context=delete-profile");
        }}
      />

      {/* Contact Base */}
      <CustomBottomSheet
        open={contactBaseSheetOpen}
        snapPoints={["38%"]}
        initialSnapIndex={0}
        showHeader={true}
        headerTitle="Contact Base"
        onClose={() => setContactBaseSheetOpen(false)}
      >
        <View style={styles.addressRow}>
          <Image
            source={require("@/assets/images/contact-base-location-icon.png")}
            style={styles.addressIcon}
          />
          <Typography
            type="bodyMedium"
            weight="semibold"
            style={styles.addressText}
          >
            {CONTACT_BASE.address}
          </Typography>
        </View>

        <View style={styles.contactList}>
          {[
            {
              label: "Driver Relations",
              phone: CONTACT_BASE.driverRelationsPhone,
            },
            {
              label: "Business Office",
              phone: CONTACT_BASE.businessOfficePhone,
            },
          ].map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.contactRow}
              activeOpacity={0.7}
              onPress={() => Linking.openURL(`tel:${item.phone}`)}
            >
              <Typography
                type="subHeadingLarge"
                weight="bold"
                style={styles.contactLabel}
              >
                {item.label}
              </Typography>
              <Typography
                type="bodyMedium"
                weight="regular"
                style={styles.contactNumber}
              >
                {item.phone}
              </Typography>
            </TouchableOpacity>
          ))}
        </View>
        <Button
          variant="primary"
          rounded="half"
          onPress={() => Linking.openURL(`tel:${CONTACT_BASE.dispatcherPhone}`)}
        >
          Call Dispatcher
        </Button>
      </CustomBottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: textColors.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 24,
    paddingBottom: 16,
  },
  logoRow: {
    alignItems: "center",
    marginBottom: 24,
  },
  listContent: {
    paddingBottom: 24,
    rowGap: 12,
  },
  column: {
    justifyContent: "space-between",
    marginBottom: 12,
  },
  card: {
    width: "48%",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: textColors.grey200,
    borderRadius: 12,
    backgroundColor: textColors.white,
    paddingVertical: 18,
    paddingHorizontal: 12,
    gap: 8,
  },
  icon: {
    width: 24,
    height: 24,
    resizeMode: "contain",
  },
  cardTitle: {
    color: textColors.grey800,
  },

  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  addressIcon: {
    width: 24,
    height: 24,
    resizeMode: "contain",
  },
  addressText: {
    color: textColors.black,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  contactLabel: {
    color: textColors.black,
  },
  contactNumber: {
    color: textColors.black,
  },
  contactList: {
    marginVertical: 8,
  },
});
