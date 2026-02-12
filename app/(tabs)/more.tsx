import CustomBottomSheet from "@/components/BottomSheet";
import Button from "@/components/Button";
import ConfirmationSheet from "@/components/ConfirmationSheet";
import Header from "@/components/Header";
import Logo from "@/components/Logo";
import Typography from "@/components/Typography";
import { useBottomTabOverflow } from "@/components/ui/TabBarBackground";
import { textColors } from "@/constants/colors";
import { BASE_OFFICE_ENDPOINTS, DRIVER_ENDPOINTS } from "@/constants/endpoints";
import {
  API_CLIENT_TYPES,
  DB_ACTION_DEFAULTS,
  DRIVER_STORAGE_KEY,
  NOTIFICATIONS_BACKUP_STORAGE_KEY,
  URLS,
} from "@/constants/global";
import { MORE_CONTENT_KEYS } from "@/content/(tabs)/more-keys";
import { useAuth } from "@/context/AuthContext";
import { useDriver } from "@/context/DriverContext";
import { SETTINGS_STORAGE_KEY } from "@/context/SettingsContext";
import { useDelete } from "@/hooks/useDelete";
import { useGetContent } from "@/hooks/useGetContent";
import { usePost } from "@/hooks/usePost";
import {
  clearStorageSelectively,
  getStorageItem,
  logger,
  setStorageItem,
} from "@/utils/helpers";
import { buildRequest } from "@/utils/requestBuilder";
import { disconnectSocket } from "@/utils/socket";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
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

type BaseOfficeContactDetails = {
  full_address: string | null;
  primary_phone_number: string | null; // dispatcher
  primary_email_address: string | null;
  driver_relations_phone_number: string | null;
};

export default function MoreScreen() {
  const { getContent } = useGetContent();
  const {
    headerTitle,
    itemProfile,
    itemInbox,
    itemContactBase,
    itemShareApp,
    itemAppSettings,
    itemDeleteProfile,
    itemChangePassword,
    itemLogout,
    logoutConfirmTitle,
    logoutConfirmDescription,
    logoutConfirmCancel,
    logoutConfirmConfirm,
    deleteConfirmTitle,
    deleteConfirmDescription,
    deleteConfirmCancel,
    deleteConfirmConfirm,
    contactSheetTitle,
    contactLoading,
    contactEmpty,
    contactDriverRelations,
    contactDispatcher,
    contactCallDispatcher,
    shareTitle,
    shareMessage,
  } = useMemo(() => {
    const get = getContent;
    return {
      headerTitle: get(MORE_CONTENT_KEYS.HEADER_TITLE),
      itemProfile: get(MORE_CONTENT_KEYS.ITEM_PROFILE),
      itemInbox: get(MORE_CONTENT_KEYS.ITEM_INBOX),
      itemContactBase: get(MORE_CONTENT_KEYS.ITEM_CONTACT_BASE),
      itemShareApp: get(MORE_CONTENT_KEYS.ITEM_SHARE_APP),
      itemAppSettings: get(MORE_CONTENT_KEYS.ITEM_APP_SETTINGS),
      itemDeleteProfile: get(MORE_CONTENT_KEYS.ITEM_DELETE_PROFILE),
      itemChangePassword: get(MORE_CONTENT_KEYS.ITEM_CHANGE_PASSWORD),
      itemLogout: get(MORE_CONTENT_KEYS.ITEM_LOGOUT),
      logoutConfirmTitle: get(MORE_CONTENT_KEYS.LOGOUT_CONFIRM_TITLE),
      logoutConfirmDescription: get(
        MORE_CONTENT_KEYS.LOGOUT_CONFIRM_DESCRIPTION,
      ),
      logoutConfirmCancel: get(MORE_CONTENT_KEYS.LOGOUT_CONFIRM_CANCEL),
      logoutConfirmConfirm: get(MORE_CONTENT_KEYS.LOGOUT_CONFIRM_CONFIRM),
      deleteConfirmTitle: get(MORE_CONTENT_KEYS.DELETE_CONFIRM_TITLE),
      deleteConfirmDescription: get(
        MORE_CONTENT_KEYS.DELETE_CONFIRM_DESCRIPTION,
      ),
      deleteConfirmCancel: get(MORE_CONTENT_KEYS.DELETE_CONFIRM_CANCEL),
      deleteConfirmConfirm: get(MORE_CONTENT_KEYS.DELETE_CONFIRM_CONFIRM),
      contactSheetTitle: get(MORE_CONTENT_KEYS.CONTACT_SHEET_TITLE),
      contactLoading: get(MORE_CONTENT_KEYS.CONTACT_LOADING),
      contactEmpty: get(MORE_CONTENT_KEYS.CONTACT_EMPTY),
      contactDriverRelations: get(MORE_CONTENT_KEYS.CONTACT_DRIVER_RELATIONS),
      contactDispatcher: get(MORE_CONTENT_KEYS.CONTACT_DISPATCHER),
      contactCallDispatcher: get(MORE_CONTENT_KEYS.CONTACT_CALL_DISPATCHER),
      shareTitle: get(MORE_CONTENT_KEYS.SHARE_TITLE),
      shareMessage: get(MORE_CONTENT_KEYS.SHARE_MESSAGE),
    };
  }, [getContent]);

  const items: MoreItem[] = [
    {
      key: "profile",
      title: itemProfile,
      icon: require("@/assets/images/more/profile-icon.png"),
    },
    {
      key: "inbox",
      title: itemInbox,
      icon: require("@/assets/images/more/inbox-icon.png"),
    },
    {
      key: "contact-base",
      title: itemContactBase,
      icon: require("@/assets/images/more/contact-base-icon.png"),
    },
    {
      key: "share-app",
      title: itemShareApp,
      icon: require("@/assets/images/more/share-icon.png"),
    },
    {
      key: "app-settings",
      title: itemAppSettings,
      icon: require("@/assets/images/more/settings-icon.png"),
    },
    {
      key: "delete-profile",
      title: itemDeleteProfile,
      icon: require("@/assets/images/more/delete-profile-icon.png"),
    },
    {
      key: "change-password",
      title: itemChangePassword,
      icon: require("@/assets/images/more/change-password-icon.png"),
    },
    {
      key: "logout",
      title: itemLogout,
      icon: require("@/assets/images/more/logout-icon.png"),
    },
  ];

  const router = useRouter();
  const log = logger();
  const [auth, setAuth] = useAuth();
  const [driver, setDriver] = useDriver();
  const { removeRetrievalId, removeTripId } = useDriver();
  const [logoutSheetOpen, setLogoutSheetOpen] = useState(false);
  const [deleteProfileSheetOpen, setDeleteProfileSheetOpen] = useState(false);
  const [contactBaseSheetOpen, setContactBaseSheetOpen] = useState(false);
  const [baseOfficeContactDetails, setBaseOfficeContactDetails] =
    useState<BaseOfficeContactDetails | null>(null);
  const [baseOfficeError, setBaseOfficeError] = useState<string | null>(null);
  const bottomTabOverflow = useBottomTabOverflow();

  // Offline API using shared delete hook
  const { execute: deleteOnlineLocation } = useDelete(
    DRIVER_ENDPOINTS.markOffline(auth?.user?.id || ""),
  );

  const {
    execute: fetchBaseOfficeContactDetailsApi,
    loading: baseOfficeLoading,
  } = usePost<any>(
    BASE_OFFICE_ENDPOINTS.getContactDetails,
    API_CLIENT_TYPES.SETTINGS,
  );

  const fetchBaseOfficeContacts = async () => {
    try {
      setBaseOfficeError(null);
      setBaseOfficeContactDetails(null);

      const user = auth?.user as Record<string, unknown> | undefined;
      const toNum = (v: unknown, d: number) => {
        if (v == null) return d;
        const n = typeof v === "number" ? v : parseInt(String(v), 10);
        return Number.isFinite(n) ? n : d;
      };
      const actionCode = "CMN.S.BASE_OFFICE_CONTACT_DETAILS";
      const requestBody = await buildRequest(
        actionCode,
        {
          P_ACTION_CODE: actionCode,
          P_AFFILIATE_NUM: toNum(
            user?.affiliate_num ?? user?.affiliateNum,
            DB_ACTION_DEFAULTS.AFFILIATE_NUM,
          ),
          P_APP_NAME: DB_ACTION_DEFAULTS.APP_NAME,
          P_COMPANY_ID: toNum(
            user?.company_id ?? user?.companyId,
            DB_ACTION_DEFAULTS.COMPANY_ID,
          ),
        },
        {
          source: "NativeApp",
          includeGPS: false,
          includeActionCode: true,
        },
      );

      const dbResponse = await fetchBaseOfficeContactDetailsApi(requestBody);
      const candidate =
        dbResponse?.jData?.baseOfficeContactDetails ??
        dbResponse?.data?.jData?.baseOfficeContactDetails ??
        dbResponse?.baseOfficeContactDetails;

      const hasAnyValue =
        candidate &&
        (candidate.full_address ||
          candidate.primary_phone_number ||
          candidate.primary_email_address ||
          candidate.driver_relations_phone_number);

      if (!hasAnyValue) {
        setBaseOfficeError("No base contacts founds");
        setBaseOfficeContactDetails(null);
        return;
      }

      setBaseOfficeContactDetails(candidate as BaseOfficeContactDetails);
    } catch {
      setBaseOfficeError("No base contacts founds");
      setBaseOfficeContactDetails(null);
    }
  };

  useEffect(() => {
    if (!contactBaseSheetOpen) return;
    fetchBaseOfficeContacts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contactBaseSheetOpen]);

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
            JSON.stringify(notificationsBackup),
          );
          log(
            "[MoreScreen] Notifications backed up successfully:",
            notificationsBackup.notifications.length,
            "notifications",
          );
        } catch (parseError) {
          log(
            "[MoreScreen] Error parsing driver data for notifications backup:",
            parseError,
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
      log(
        "[MoreScreen] Storage cleared selectively, settings and notifications preserved",
      );
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
      const message = `${shareMessage} ${storeUrl}`;
      await Share.share({ message, url: storeUrl, title: shareTitle });
    } catch (error) {
      // noop: silently ignore share cancellation/errors
    }
  };

  const data: MoreItem[] = items.map((item) => {
    if (item.key === "profile") {
      return {
        ...item,
        onClick: () => router.push("/(screens)/profile"),
      };
    }
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
          setDeleteProfileSheetOpen(true);
        },
      };
    }
    if (item.key === "logout") {
      return {
        ...item,
        onClick: () => {
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
      <Header title={headerTitle} hideBackIcon />
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
        title={logoutConfirmTitle}
        description={logoutConfirmDescription}
        cancelButtonText={logoutConfirmCancel}
        confirmButtonText={logoutConfirmConfirm}
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
        title={deleteConfirmTitle}
        description={deleteConfirmDescription}
        cancelButtonText={deleteConfirmCancel}
        confirmButtonText={deleteConfirmConfirm}
        onCancel={() => setDeleteProfileSheetOpen(false)}
        onConfirm={() => {
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
        headerTitle={contactSheetTitle}
        onClose={() => {
          setContactBaseSheetOpen(false);
          setBaseOfficeContactDetails(null);
          setBaseOfficeError(null);
        }}
      >
        {baseOfficeLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={textColors.grey700} />
            <Typography type="bodyMedium" style={styles.loadingText}>
              {contactLoading}
            </Typography>
          </View>
        ) : baseOfficeError || !baseOfficeContactDetails ? (
          <View style={styles.emptyContainer}>
            <Typography type="bodyMedium" style={styles.emptyText}>
              {contactEmpty}
            </Typography>
          </View>
        ) : (
          <>
            {!!baseOfficeContactDetails.full_address && (
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
                  {baseOfficeContactDetails.full_address}
                </Typography>
              </View>
            )}

            <View style={styles.contactList}>
              {[
                {
                  label: contactDriverRelations,
                  phone: baseOfficeContactDetails.driver_relations_phone_number,
                },
                {
                  label: contactDispatcher,
                  phone: baseOfficeContactDetails.primary_phone_number,
                },
              ].map((item) => {
                const disabled = !item.phone;
                return (
                  <TouchableOpacity
                    key={item.label}
                    style={[
                      styles.contactRow,
                      disabled ? styles.contactRowDisabled : null,
                    ]}
                    activeOpacity={0.7}
                    disabled={disabled}
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
                      {item.phone || "-"}
                    </Typography>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Button
              variant="primary"
              rounded="half"
              disabled={
                baseOfficeLoading ||
                !baseOfficeContactDetails.primary_phone_number
              }
              onPress={() =>
                Linking.openURL(
                  `tel:${baseOfficeContactDetails.primary_phone_number}`,
                )
              }
            >
              {contactCallDispatcher}
            </Button>
          </>
        )}
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
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
  },
  loadingText: {
    color: textColors.grey700,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  emptyText: {
    color: textColors.grey700,
  },
  contactRowDisabled: {
    opacity: 0.5,
  },
});
