import ActiveOfferLoader from "@/components/ActiveOfferLoader";
import BottomSheet from "@/components/BottomSheet";
import Button from "@/components/Button";
import DriverOffline from "@/components/DriverOffline";
import Toggle from "@/components/Form/Toggle";
import FutureJobOffersScreen from "@/components/FutureJobOffersScreen";
import Header from "@/components/Header";
import LiveJobOffersScreen from "@/components/LiveJobOffersScreen";
import MuteNotificationsSheet from "@/components/MuteNotificationsSheet";
import PermissionGate from "@/components/PermissionGate";
import { showToast } from "@/components/Toast";
import Typography from "@/components/Typography";
import { textColors } from "@/constants/colors";
import { DRIVER_ENDPOINTS } from "@/constants/endpoints";
import {
  CAR_TYPE,
  DRIVER_STATUS,
  DRIVER_TYPES,
  OFFER_TYPES,
  PREVIOUS_LOCATION_STORAGE_KEY,
  URLS,
  type DriverStatusLabel,
} from "@/constants/global";
import { useAuth } from "@/context/AuthContext";
import {
  createDemoNotifications,
  useDriver,
} from "@/context/DriverContext";
import { useRideOffer } from "@/context/RideOfferContext";
import { useSettings } from "@/context/SettingsContext";
import { useDelete } from "@/hooks/useDelete";
import { usePost } from "@/hooks/usePost";
import { useSocket } from "@/hooks/useSocket";
import { logger, removeStorageItem, setStorageItem } from "@/utils/helpers";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  Linking,
  Image as RNImage,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

export default function HomeScreen() {
  const router = useRouter();
  const [auth] = useAuth();
  const [driver, setDriver] = useDriver();
  const { notifications, getRetrievalId, addNotifications, removeRetrievalId, removeTripId } = useDriver();
  const { hasAnyActiveOffer, setHasAnyActiveOffer } = useRideOffer();
  const settingsContext = useSettings();
  const [settings, setSettings, status] = settingsContext;
  const { isLoading: isSavingSettings, error: settingsError, clearError: clearSettingsError } = status;
  const { connectSocket, disconnectSocket } = useSocket({
    driverId: auth?.user?.id,
  });
  // Offline API using shared delete hook
  const { execute: deleteOnlineLocation, loading: offlineLoading } = useDelete(
    DRIVER_ENDPOINTS.markOffline(auth?.user?.id || "")
  );

  // Online location API using shared post hook
  const { execute: postOnlineLocation, loading: onlineLocationLoading } =
    usePost(DRIVER_ENDPOINTS.postOnlineLocation(auth?.user?.id || ""));

  // Driver status API using shared post hook
  const { execute: updateDriverStatus, loading: statusLoading } = usePost(
    DRIVER_ENDPOINTS.updateStatus(auth?.user?.id || "")
  );

  // Interval is managed centrally in OnlineLocationTracker (app/_layout)

  const statusValue: DriverStatusLabel = driver?.online
    ? DRIVER_STATUS.ONLINE
    : DRIVER_STATUS.OFFLINE;
  const labels: [DriverStatusLabel, DriverStatusLabel] = [
    DRIVER_STATUS.OFFLINE,
    DRIVER_STATUS.ONLINE,
  ];

  // Calculate dynamic toggle size based on screen width and label text
  const toggleSize = useMemo(() => {
    const screenWidth = Dimensions.get("window").width;
    // Get the longer label text (OFFLINE = 7 chars, ONLINE = 6 chars)
    const maxLabelLength = Math.max(
      DRIVER_STATUS.OFFLINE.length,
      DRIVER_STATUS.ONLINE.length
    );
    
    // Font size is 12px (from Toggle component: fontSize: 12)
    // Average character width is approximately 7-8px for 12px font
    // Add extra padding for spacing: 16px padding per side + gap between labels
    const charWidth = 8; // Increased from 7.5 to account for wider characters
    const horizontalPadding = 40; // Increased from 32 to 40 for better spacing
    const labelGap = 12; // Increased from 8 to 12 for better separation
    const baseWidth = maxLabelLength * charWidth + horizontalPadding + labelGap;
    
    // Minimum width ensures readability - increased for small devices
    const minWidth = screenWidth < 375 ? 140 : 130; // Higher min for small screens
    // Maximum width: don't exceed 45% of screen width (leaves room for header elements)
    const maxWidth = Math.min(screenWidth * 0.45, 220);
    
    // For smaller screens (< 375px), add extra padding to ensure text doesn't get cut off
    const isSmallScreen = screenWidth < 375;
    const width = isSmallScreen 
      ? Math.max(baseWidth * 1.4, minWidth) // Increased multiplier from 1.25 to 1.4
      : Math.max(baseWidth * 1.15, minWidth); // Slight increase for all screens
    
    // Clamp width between min and max
    const finalWidth = Math.min(Math.max(width, minWidth), maxWidth);
    
    return {
      width: finalWidth,
      height: 28, // Keep height consistent with original design
    };
  }, []);

  // Check if user is an independent operator
  const isIndependentOperator =
    auth?.user?.type === DRIVER_TYPES.INDEPENDENT_OPERATOR;

  // View hidden jobs toggle state
  const [showHiddenJobs, setShowHiddenJobs] = useState<boolean>(false);

  // Active view state for hired drivers (live/future toggle)
  // Default to "hired" to show HIRED type by default
  const [activeView, setActiveView] = useState<"live" | "future" | "hired">(
    "hired"
  );

  // Local loading state for online toggle (includes location fetch time)
  const [isTogglingOnline, setIsTogglingOnline] = useState<boolean>(false);

  // Sorting bottom sheet state
  const [sortSheetOpen, setSortSheetOpen] = useState<boolean>(false);
  type SortKey = "time" | "distance";
  const [sortBy, setSortBy] = useState<SortKey>("distance"); // Temporary selection in sheet
  const [activeSortBy, setActiveSortBy] = useState<SortKey>("distance"); // Active sorting applied to offers
  
  const openSortSheet = () => {
    // Reset sortBy to current activeSortBy when opening sheet
    setSortBy(activeSortBy);
    setSortSheetOpen(true);
  };
  
  const closeSortSheet = () => {
    // Reset sortBy to activeSortBy when closing without applying
    setSortBy(activeSortBy);
    setSortSheetOpen(false);
  };

  // Ride Types bottom sheet state
  const [sheetOpen, setSheetOpen] = useState<boolean>(false);
  // Store initial toggle states when sheet opens (for revert on error)
  const initialToggleStatesRef = useRef<{
    economy: boolean;
    sedan: boolean;
    suv: boolean;
    luxury: boolean;
  } | null>(null);
  
  const openRideTypes = () => {
    // Store initial states when opening the sheet
    initialToggleStatesRef.current = {
      economy,
      sedan,
      suv,
      luxury,
    };
    setSheetOpen(true);
  };
  const closeRideTypes = () => {
    setSheetOpen(false);
    // Clear the ref when closing
    initialToggleStatesRef.current = null;
  };

  // Mute Notifications bottom sheet state
  const [muteSheetOpen, setMuteSheetOpen] = useState<boolean>(false);
  const openMuteSheet = () => setMuteSheetOpen(true);
  const closeMuteSheet = () => setMuteSheetOpen(false);

  // Logger function
  const log = logger();
  const demoNotificationsInitialized = useRef(false);

  // Show error toast when settings error occurs
  useEffect(() => {
    if (settingsError) {
      showToast(settingsError, {
        variant: "error",
        position: "top",
      });
      clearSettingsError();
    }
  }, [settingsError, clearSettingsError]);

  // Initialize demo notifications on mount
  useEffect(() => {
    // Skip if already initialized
    if (demoNotificationsInitialized.current) {
      return;
    }

    const initializeDemoNotifications = async () => {
      // Check if demo notifications already exist
      const hasDemoNotifications = notifications.some((notification) =>
        notification.id.startsWith("demo-notification-")
      );

      if (!hasDemoNotifications) {
        log("[HomeScreen] Initializing demo notifications");
        const demoNotifications = createDemoNotifications();
        await addNotifications(demoNotifications);
        demoNotificationsInitialized.current = true;
        log(
          `[HomeScreen] Added ${demoNotifications.length} demo notifications`
        );
      } else {
        demoNotificationsInitialized.current = true;
      }
    };

    initializeDemoNotifications();
  }, [notifications, addNotifications, log]);

  const [economy, setEconomy] = useState<boolean>(
    settings.ridePreferences.rideTypes.economy
  );
  const [sedan, setSedan] = useState<boolean>(
    settings.ridePreferences.rideTypes.sedan
  );
  const [suv, setSuv] = useState<boolean>(
    settings.ridePreferences.rideTypes.suv
  );
  const [luxury, setLuxury] = useState<boolean>(
    settings.ridePreferences.rideTypes.luxury
  );

  // Determine which ride types are enabled based on car type
  const getRideTypeDisabled = useMemo(() => {
    const carType = driver?.carType;
    
    if (!carType) {
      // If no car type, allow all (fallback)
      return {
        economy: false,
        sedan: false,
        suv: false,
        luxury: false,
      };
    }

    // Luxury: all enabled
    if (carType === CAR_TYPE.LUXURY) {
      return {
        economy: false,
        sedan: false,
        suv: false,
        luxury: false,
      };
    }

    // Sedan: only Sedan and Economy enabled
    if (carType === CAR_TYPE.SEDAN) {
      return {
        economy: false,
        sedan: false,
        suv: true,
        luxury: true,
      };
    }

    // SUV: SUV, Sedan, and Economy enabled
    if (carType === CAR_TYPE.SUV) {
      return {
        economy: false,
        sedan: false,
        suv: false,
        luxury: true,
      };
    }

    // Economy: only Economy enabled
    if (carType === CAR_TYPE.ECONOMY) {
      return {
        economy: false,
        sedan: true,
        suv: true,
        luxury: true,
      };
    }

    // Default: allow all
    return {
      economy: false,
      sedan: false,
      suv: false,
      luxury: false,
    };
  }, [driver?.carType]);

  const handleSaveRideTypes = async () => {
    // Store current states before save attempt
    const currentStates = {
      economy,
      sedan,
      suv,
      luxury,
    };

    try {
      await setSettings({
        ...settings,
        ridePreferences: {
          ...settings.ridePreferences,
          rideTypes: { economy, sedan, suv, luxury },
        },
      });
      showToast("Offer type preferences saved successfully", {
        variant: "success",
        position: "top",
      });
      closeRideTypes();
    } catch (error: any) {
      // Revert to initial states on error
      if (initialToggleStatesRef.current) {
        setEconomy(initialToggleStatesRef.current.economy);
        setSedan(initialToggleStatesRef.current.sedan);
        setSuv(initialToggleStatesRef.current.suv);
        setLuxury(initialToggleStatesRef.current.luxury);
      }
      
      // Error is handled by context and shown via useEffect
      const errorMessage =
        error?.message || "Failed to save offer type preferences";
      showToast(errorMessage, {
        variant: "error",
        position: "top",
      });
    }
  };

  const handleSelectSort = (key: SortKey) => {
    // Update temporary selection (only affects UI in sheet)
    setSortBy(key);
  };

  const handleApplySort = () => {
    // Apply the selected sort to active sorting
    setActiveSortBy(sortBy);
    log(`[HomeScreen] Applied sorting: ${sortBy}`);
    closeSortSheet();
  };

  const handleResetSort = () => {
    // Reset to default sorting (distance)
    const def: SortKey = "distance";
    setSortBy(def);
    setActiveSortBy(def);
    log(`[HomeScreen] Reset sorting to default: ${def}`);
    closeSortSheet();
  };

  // Handle view hidden jobs toggle
  const handleToggleHiddenJobs = () => {
    const newState = !showHiddenJobs;
    setShowHiddenJobs(newState);
  };

  // Handle driver status toggle with API call for offline
  const handleDriverStatusToggle = async (next: string) => {
    const isGoingOnline = next === DRIVER_STATUS.ONLINE;
    const isGoingOffline = next === DRIVER_STATUS.OFFLINE;

    // If going online, call API first with current location
    if (isGoingOnline) {
      try {
        setIsTogglingOnline(true); // Start loading immediately

        // Get current location for first post (permission already granted by PermissionGate)
        const first = await Location.getCurrentPositionAsync({});
        const payload = {
          lat: first.coords.latitude,
          lng: first.coords.longitude,
        };

        // Call the online location API first
        log("[HomeScreen] Posting initial location to go online");
        await postOnlineLocation(payload as any);

        // Update driver status to online in database
        log("[HomeScreen] Updating driver status to online");
        const statusResponse = await updateDriverStatus({ isOnline: true });

        // Check if the API response indicates failure
        if (statusResponse && typeof statusResponse === "object") {
          const isSuccess =
            statusResponse.success !== false &&
            (statusResponse.data?.jHeader?.responseCode === "0" ||
              statusResponse.data?.jHeader?.responseCode === 0 ||
              statusResponse.data?.jHeader?.responseCode === undefined);

          if (!isSuccess) {
            const errorMessage =
              statusResponse.message ||
              statusResponse.data?.jHeader?.message ||
              "Failed to update driver status to online";
            log("[HomeScreen] Driver status update failed:", errorMessage);
            throw new Error(errorMessage);
          }
        }

        log("[HomeScreen] Driver status updated to online successfully");

        // Store the location for future tracking
        await setStorageItem(
          PREVIOUS_LOCATION_STORAGE_KEY,
          JSON.stringify(payload)
        );

        // Connect to socket when going online
        try {
          await connectSocket();
          log("[HomeScreen] Socket connected successfully");
        } catch (error) {
          log("[HomeScreen] Failed to connect socket:", error);
        }

        // ONLY set driver online if everything above succeeded
        await setDriver({ ...(driver ?? {}), online: true });
        showToast("You are now Online", { variant: "success" });

        // Interval loop is managed centrally in OnlineLocationTracker
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to go online.";
        log("[HomeScreen] Error going online:", error);
        showToast(message, { variant: "error" });
        // Don't set driver online if API fails
      } finally {
        setIsTogglingOnline(false); // Stop loading
      }
      return;
    }

    // If going offline, check for active ride first
    if (isGoingOffline) {
      try {
        // Check if driver has an active ride
        const { retrievalId } = await getRetrievalId();
        if (retrievalId) {
          Alert.alert(
            "Active Ride Detected",
            "You have an active ride that needs to be completed. Please first cancel the active ride or mark it as completed before going offline.",
            [
              {
                text: "OK",
                style: "default",
              },
            ],
            { cancelable: true }
          );
          return; // Prevent going offline
        }

        log("[HomeScreen] Marking driver as offline via API");
        
        // Update driver status to offline in database
        log("[HomeScreen] Updating driver status to offline");
        const statusResponse = await updateDriverStatus({ isOnline: false });

        // Check if the API response indicates failure
        if (statusResponse && typeof statusResponse === "object") {
          const isSuccess =
            statusResponse.success !== false &&
            (statusResponse.data?.jHeader?.responseCode === "0" ||
              statusResponse.data?.jHeader?.responseCode === 0 ||
              statusResponse.data?.jHeader?.responseCode === undefined);

          if (!isSuccess) {
            const errorMessage =
              statusResponse.message ||
              statusResponse.data?.jHeader?.message ||
              "Failed to update driver status to offline";
            log("[HomeScreen] Driver status update failed:", errorMessage);
            throw new Error(errorMessage);
          }
        }

        log("[HomeScreen] Driver status updated to offline successfully");

        // Delete online location
        await deleteOnlineLocation();

        // Clear the previous location storage
        await removeStorageItem(PREVIOUS_LOCATION_STORAGE_KEY);
        log("[HomeScreen] Cleared previous location storage");

        // Disconnect socket
        try {
          disconnectSocket();
          log("[HomeScreen] Socket disconnected successfully");
        } catch (error) {
          log("[HomeScreen] Error disconnecting socket:", error);
        }

        // ONLY update driver state if everything above succeeded
        setHasAnyActiveOffer(false);
        await setDriver({
          ...(driver ?? {}),
          online: false,
        });

        showToast("You are now Offline", { variant: "success" });
        log("[HomeScreen] Driver successfully marked as offline");
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to go offline. Please try again.";
        showToast(message, { variant: "error" });
        log("[HomeScreen] Error marking driver offline:", error);
      }
    }
  };

  // Interval/AppState are managed globally in OnlineLocationTracker

  // Determine which bell icon to show based on notification status
  const hasUnreadNotifications = notifications.some(
    (notification) => notification.messageType === "unread"
  );
  const unreadCount = notifications.filter(
    (notification) => notification.messageType === "unread"
  ).length;
  const bellIconSource = hasUnreadNotifications
    ? require("@/assets/images/red-bell-icon.png")
    : require("@/assets/images/black-bell-icon.png");

  // Calculate dynamic badge dimensions based on count
  const getBadgeDimensions = (count: number) => {
    const displayCount = count > 99 ? "99+" : count.toString();
    const textLength = displayCount.length;

    // Base dimensions for single digit
    let minWidth = 16;
    let height = 16;

    // Adjust for different count ranges
    if (textLength === 1) {
      // Single digit (1-9)
      minWidth = 16;
      height = 16;
    } else if (textLength === 2) {
      // Double digit (10-99)
      minWidth = 22;
      height = 16;
    } else if (textLength === 3) {
      // Triple digit (100+ or 99+)
      minWidth = 24;
      height = 16;
    }

    return { minWidth, height };
  };

  const badgeDimensions = getBadgeDimensions(unreadCount);

  // Icon highlighting logic
  const getIconStyle = (iconKey: string) => {
    if (iconKey === "live-jobs" && activeView === "live") {
      return { tintColor: textColors.teal600 };
    }
    if (iconKey === "future-jobs" && activeView === "future") {
      return { tintColor: textColors.teal600 };
    }
    // No highlighting for "hired" state (default state)
    return {};
  };

  // Handle icon press for hired drivers
  const handleIconPress = (iconKey: string) => {
    if (iconKey === "live-jobs") {
      setActiveView("live");
      log("Live Jobs pressed - switched to live view");
    } else if (iconKey === "future-jobs") {
      if (activeView === "hired" || activeView === "live") {
        setActiveView("future");
      } else if (activeView === "future") {
        setActiveView("hired");
      }
      log(
        `Future Jobs pressed - switched to ${
          activeView === "hired" || activeView === "live" ? "future" : "hired"
        } view`
      );
    } else {
      // Handle other icon presses
      if (iconKey === "view-hidden-jobs") {
        handleToggleHiddenJobs();
      } else if (iconKey === "sorting") {
        openSortSheet();
      } else if (iconKey === "ride-type") {
        openRideTypes();
      } else if (iconKey === "heat-map") {
        router.push("/(tabs)/heat-map" as any);
      } else if (iconKey === "desired-locations") {
        router.push("/(tabs)/desired-destinations" as any);
      } else if (iconKey === "settings") {
        router.push("/(tabs)/settings" as any);
      } else if (iconKey === "jump-portal") {
        void Linking.openURL(URLS.driverPortal);
      } else if (iconKey === "mute-notifications") {
        openMuteSheet();
      }
    }
  };

  return (
    <PermissionGate>
      <SafeAreaView style={styles.container}>
        <Header
          title="Home"
          hideBackIcon
          leftAccessory={
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => router.push("/(tabs)/notifications" as any)}
              hitSlop={8}
              style={styles.bellButton}
            >
              <RNImage
                source={bellIconSource}
                style={styles.bellIcon}
                resizeMode="contain"
              />
              {hasUnreadNotifications && unreadCount > 0 && (
                <View
                  style={[
                    styles.notificationBadge,
                    {
                      minWidth: badgeDimensions.minWidth,
                      height: badgeDimensions.height,
                    },
                  ]}
                >
                  <Typography
                    type="labelSmall"
                    weight="bold"
                    style={styles.badgeText}
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Typography>
                </View>
              )}
            </TouchableOpacity>
          }
          rightAccessory={
            <View style={styles.toggleWrap}>
              <Toggle
                variant="labeled"
                labels={labels}
                value={statusValue}
                setValue={handleDriverStatusToggle}
                size={toggleSize}
                disabled={
                  offlineLoading || onlineLocationLoading || isTogglingOnline
                }
                loading={
                  offlineLoading || onlineLocationLoading || isTogglingOnline
                }
              />
            </View>
          }
        />
        {driver?.online && (
          <View style={styles.iconBar}>
            {/** Left group of actions */}
            <View style={styles.iconGroup}>
              {[
                {
                  key: "ride-type",
                  image: require("@/assets/images/home/ride-type-icon.png"),
                },
                {
                  key: "heat-map",
                  image: require("@/assets/images/home/heat-map-icon.png"),
                },
                {
                  key: "desired-locations",
                  image: require("@/assets/images/home/desired-locations-icon.png"),
                },
                {
                  key: "settings",
                  image: require("@/assets/images/more/settings-icon.png"),
                },
                // Show live-jobs and future-jobs only for hired drivers
                ...(isIndependentOperator
                  ? []
                  : [
                      {
                        key: "live-jobs",
                        image: require("@/assets/images/home/live-jobs-icon.png"),
                      },
                      {
                        key: "future-jobs",
                        image: require("@/assets/images/home/future-jobs-icon.png"),
                      },
                    ]),
                {
                  key: "jump-portal",
                  image: require("@/assets/images/home/jump-portal-icon.png"),
                },
                {
                  key: "mute-notifications",
                  image: require("@/assets/images/home/mute-notifications-icon.png"),
                },
              ].map((item) => (
                <TouchableOpacity
                  key={item.key}
                  accessibilityRole="button"
                  onPress={() => handleIconPress(item.key)}
                  hitSlop={8}
                  style={styles.iconButton}
                  activeOpacity={0.7}
                >
                  <RNImage
                    source={item.image}
                    style={[styles.icon, getIconStyle(item.key)]}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/** Right group: View hidden jobs + Sorting */}
            <View style={styles.iconGroup}>
              {[
                {
                  key: "view-hidden-jobs",
                  image: showHiddenJobs
                    ? require("@/assets/images/home/view-hidden-jobs-active.png")
                    : require("@/assets/images/home/view-hidden-jobs-icon.png"),
                },
                {
                  key: "sorting",
                  image: require("@/assets/images/home/sorting-icon.png"),
                },
              ].map((item) => (
                <TouchableOpacity
                  key={item.key}
                  accessibilityRole="button"
                  onPress={() => handleIconPress(item.key)}
                  hitSlop={8}
                  style={styles.iconButton}
                  activeOpacity={0.7}
                >
                  <RNImage
                    source={item.image}
                    style={[styles.icon, getIconStyle(item.key)]}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
        {!driver?.online ? (
          <DriverOffline />
        ) : hasAnyActiveOffer ? (
          <ActiveOfferLoader />
        ) : !isIndependentOperator && activeView === "future" ? (
          <FutureJobOffersScreen
            sortBy={activeSortBy}
            showHiddenJobs={showHiddenJobs}
          />
        ) : (
          <LiveJobOffersScreen
            sortBy={activeSortBy}
            showHiddenJobs={showHiddenJobs}
            type={
              isIndependentOperator
                ? OFFER_TYPES.LIVE
                : activeView === "live"
                ? OFFER_TYPES.LIVE
                : OFFER_TYPES.HIRED
            }
          />
        )}
        {/* Ride Types Bottom Sheet */}
        <BottomSheet
          open={sheetOpen}
          onClose={closeRideTypes}
          snapPoints={["35%"]}
          headerTitle="Choose Your Offer Type"
        >
          <View style={styles.sheetContainer}>
            <View style={styles.sheetGroup}>
              <View style={styles.sheetRow}>
                <Typography
                  type="bodyLarge"
                  weight="medium"
                  style={styles.textBlack16}
                >
                  Economy
                </Typography>
                <Toggle
                  variant="switch"
                  value={economy}
                  setValue={setEconomy}
                  size={styles.toggleSmall}
                  disabled={getRideTypeDisabled.economy || isSavingSettings}
                />
              </View>
              <View style={styles.sheetRow}>
                <Typography
                  type="bodyLarge"
                  weight="medium"
                  style={styles.textBlack16}
                >
                  Sedan
                </Typography>
                <Toggle
                  variant="switch"
                  value={sedan}
                  setValue={setSedan}
                  size={styles.toggleSmall}
                  disabled={getRideTypeDisabled.sedan || isSavingSettings}
                />
              </View>
              <View style={styles.sheetRow}>
                <Typography
                  type="bodyLarge"
                  weight="medium"
                  style={styles.textBlack16}
                >
                  SUV
                </Typography>
                <Toggle
                  variant="switch"
                  value={suv}
                  setValue={setSuv}
                  size={styles.toggleSmall}
                  disabled={getRideTypeDisabled.suv || isSavingSettings}
                />
              </View>
              <View style={styles.sheetRow}>
                <Typography
                  type="bodyLarge"
                  weight="medium"
                  style={styles.textBlack16}
                >
                  Luxury
                </Typography>
                <Toggle
                  variant="switch"
                  value={luxury}
                  setValue={setLuxury}
                  size={styles.toggleSmall}
                  disabled={getRideTypeDisabled.luxury || isSavingSettings}
                />
              </View>
            </View>
            <View style={styles.sheetFooter}>
              <Button
                rounded="half"
                variant="primary"
                onPress={handleSaveRideTypes}
                loading={isSavingSettings}
                disabled={isSavingSettings}
              >
                {isSavingSettings ? "Saving..." : "Save"}
              </Button>
            </View>
          </View>
        </BottomSheet>

        {/* Sorting Bottom Sheet */}
        <BottomSheet
          open={sortSheetOpen}
          onClose={closeSortSheet}
          snapPoints={["25%"]}
          headerTitle="Sort Rides By"
        >
          <View style={styles.sheetContainer}>
            <View style={styles.sheetGroup}>
              <TouchableOpacity
                style={styles.sheetRow}
                onPress={() => handleSelectSort("time")}
              >
                <View style={styles.rowLeft}>
                  <RNImage
                    source={require("@/assets/images/clock-icon.png")}
                    style={styles.icon24}
                  />
                  <Typography
                    type="bodyLarge"
                    weight="medium"
                    style={styles.textBlack16}
                  >
                    Pickup Time
                  </Typography>
                </View>
                <RNImage
                  source={
                    sortBy === "time"
                      ? require("@/assets/images/radio-checked.png")
                      : require("@/assets/images/radio-uncheck.png")
                  }
                  style={styles.icon24}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sheetRow}
                onPress={() => handleSelectSort("distance")}
              >
                <View style={styles.rowLeft}>
                  <RNImage
                    source={require("@/assets/images/location-icon.png")}
                    style={styles.icon24}
                  />
                  <Typography
                    type="bodyLarge"
                    weight="medium"
                    style={styles.textBlack16}
                  >
                    Pickup Distance
                  </Typography>
                </View>
                <RNImage
                  source={
                    sortBy === "distance"
                      ? require("@/assets/images/radio-checked.png")
                      : require("@/assets/images/radio-uncheck.png")
                  }
                  style={styles.icon24}
                />
              </TouchableOpacity>
            </View>
            <View style={styles.sheetButtonsRow}>
              <TouchableOpacity
                style={[styles.sheetButton, styles.sheetButtonOutlined]}
                onPress={handleResetSort}
              >
                <Typography
                  type="bodyLarge"
                  weight="semibold"
                  style={styles.sheetButtonOutlinedText}
                >
                  Reset
                </Typography>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sheetButton, styles.sheetButtonPrimary]}
                onPress={handleApplySort}
              >
                <Typography
                  type="bodyLarge"
                  weight="semibold"
                  style={styles.sheetButtonPrimaryText}
                >
                  Apply
                </Typography>
              </TouchableOpacity>
            </View>
          </View>
        </BottomSheet>

        {/* Mute Notifications Bottom Sheet */}
        <MuteNotificationsSheet open={muteSheetOpen} onClose={closeMuteSheet} />
      </SafeAreaView>
    </PermissionGate>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: textColors.white,
  },
  iconBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: textColors.white,
  },
  iconGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    width: 28,
    height: 28,
  },

  bellButton: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: 10,
    position: "relative",
  },
  bellIcon: {
    width: 24,
    height: 24,
  },
  notificationBadge: {
    position: "absolute",
    top: -2,
    left: 18,
    backgroundColor: textColors.red500,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: textColors.white,
    fontSize: 10,
    lineHeight: 10,
  },
  toggleWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingRight: 10,
  },
  // Bottom sheet styles
  sheetContainer: {
    paddingTop: 24,
    backgroundColor: textColors.white,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  sheetTitle: { color: textColors.black },
  icon24: { width: 24, height: 24, resizeMode: "contain" },
  sheetGroup: { gap: 8 },
  sheetRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  textBlack16: { color: textColors.black, fontSize: 16 },
  sheetFooter: { paddingTop: 12 },
  sheetButtonsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 16,
  },
  sheetButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetButtonOutlined: {
    borderWidth: 1,
    borderColor: textColors.teal600,
    backgroundColor: textColors.white,
  },
  sheetButtonOutlinedText: { color: textColors.black },
  sheetButtonPrimary: {
    backgroundColor: textColors.teal600,
  },
  sheetButtonPrimaryText: { color: textColors.white },
  // Sizes
  headerToggleSize: { width: 112, height: 28 },
  toggleSmall: { width: 42, height: 24 },
});
