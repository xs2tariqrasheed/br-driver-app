import BottomSheet from "@/components/BottomSheet";
import Button from "@/components/Button";
import DriverOffline from "@/components/DriverOffline";
import Toggle from "@/components/Form/Toggle";
import Header from "@/components/Header";
import LiveJobOffersScreen from "@/components/LiveJobOffersScreen";
import PermissionGate from "@/components/PermissionGate";
import Typography from "@/components/Typography";
import { textColors } from "@/constants/colors";
import {
  DRIVER_STATUS,
  DRIVER_TYPES,
  URLS,
  type DriverStatusLabel,
} from "@/constants/global";
import { useAuth } from "@/context/AuthContext";
import { useDriver } from "@/context/DriverContext";
import { useSettings } from "@/context/SettingsContext";
import { logger } from "@/utils/helpers";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
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
  const { notifications } = useDriver();
  const [settings, setSettings] = useSettings();
  const statusValue: DriverStatusLabel = driver?.online
    ? DRIVER_STATUS.ONLINE
    : DRIVER_STATUS.OFFLINE;
  const labels: [DriverStatusLabel, DriverStatusLabel] = [
    DRIVER_STATUS.OFFLINE,
    DRIVER_STATUS.ONLINE,
  ];

  // Check if user is an independent operator
  const isIndependentOperator =
    auth?.user?.type === DRIVER_TYPES.INDEPENDENT_OPERATOR;

  // View hidden jobs toggle state
  const [showHiddenJobs, setShowHiddenJobs] = useState<boolean>(false);

  // Sorting bottom sheet state
  const [sortSheetOpen, setSortSheetOpen] = useState<boolean>(false);
  const openSortSheet = () => {
    setSortBy(activeSortBy);
    setSortSheetOpen(true);
  };
  const closeSortSheet = () => setSortSheetOpen(false);
  type SortKey = "time" | "distance";
  const [sortBy, setSortBy] = useState<SortKey>("distance");
  const [activeSortBy, setActiveSortBy] = useState<SortKey>("distance");

  // Ride Types bottom sheet state
  const [sheetOpen, setSheetOpen] = useState<boolean>(false);
  const openRideTypes = () => setSheetOpen(true);
  const closeRideTypes = () => setSheetOpen(false);

  // Logger function
  const log = logger();
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

  const handleSaveRideTypes = async () => {
    await setSettings({
      ...settings,
      ridePreferences: {
        ...settings.ridePreferences,
        rideTypes: { economy, sedan, suv, luxury },
      },
    });
    closeRideTypes();
  };

  const handleSelectSort = (key: SortKey) => {
    setSortBy(key);
  };

  const handleApplySort = () => {
    setActiveSortBy(sortBy);
    closeSortSheet();
  };

  const handleResetSort = () => {
    const def: SortKey = "distance";
    setSortBy(def);
    setActiveSortBy(def);
    closeSortSheet();
  };

  // Handle view hidden jobs toggle
  const handleToggleHiddenJobs = () => {
    const newState = !showHiddenJobs;
    setShowHiddenJobs(newState);
    log(`[HomeScreen] Show hidden jobs toggled: ${newState ? "ON" : "OFF"}`);
  };

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

  return (
    <PermissionGate>
      <SafeAreaView style={styles.container}>
        <Header
          title="Home"
          hideBackIcon
          leftAccessory={
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => router.push("/notifications" as any)}
              hitSlop={8}
              style={styles.bellButton}
            >
              <RNImage
                source={bellIconSource}
                style={styles.bellIcon}
                resizeMode="contain"
              />
              {hasUnreadNotifications && unreadCount > 0 && (
                <View style={styles.notificationBadge}>
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
                setValue={(next: string) => {
                  void setDriver({
                    ...(driver ?? {}),
                    online: next === DRIVER_STATUS.ONLINE,
                  });
                }}
                size={styles.headerToggleSize}
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
                  onPress: openRideTypes,
                },
                {
                  key: "heat-map",
                  image: require("@/assets/images/home/heat-map-icon.png"),
                  onPress: () => router.push("/(screens)/heat-map" as any),
                },
                {
                  key: "desired-locations",
                  image: require("@/assets/images/home/desired-locations-icon.png"),
                  onPress: () =>
                    router.push("/(screens)/desired-destinations" as any),
                },
                {
                  key: "settings",
                  image: require("@/assets/images/more/settings-icon.png"),
                  onPress: () => router.push("/(screens)/settings" as any),
                },
                // Hide future-jobs for independent operators
                ...(isIndependentOperator
                  ? []
                  : [
                      {
                        key: "future-jobs",
                        image: require("@/assets/images/home/future-jobs-icon.png"),
                        onPress: () => log("Future Jobs pressed"),
                      },
                    ]),
                // Show live-jobs only for independent operators
                ...(isIndependentOperator
                  ? [
                      {
                        key: "live-jobs",
                        image: require("@/assets/images/home/live-jobs-icon.png"),
                        onPress: () => log("Live Jobs pressed"),
                      },
                    ]
                  : []),
                {
                  key: "jump-portal",
                  image: require("@/assets/images/home/jump-portal-icon.png"),
                  onPress: () => void Linking.openURL(URLS.driverPortal),
                },
                {
                  key: "mute-notifications",
                  image: require("@/assets/images/home/mute-notifications-icon.png"),
                  onPress: () => log("Mute Notifications pressed"),
                },
              ].map((item) => (
                <TouchableOpacity
                  key={item.key}
                  accessibilityRole="button"
                  onPress={item.onPress}
                  hitSlop={8}
                  style={styles.iconButton}
                  activeOpacity={0.7}
                >
                  <RNImage
                    source={item.image}
                    style={styles.icon}
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
                  onPress: handleToggleHiddenJobs,
                },
                {
                  key: "sorting",
                  image: require("@/assets/images/home/sorting-icon.png"),
                  onPress: openSortSheet,
                },
              ].map((item) => (
                <TouchableOpacity
                  key={item.key}
                  accessibilityRole="button"
                  onPress={item.onPress}
                  hitSlop={8}
                  style={styles.iconButton}
                  activeOpacity={0.7}
                >
                  <RNImage
                    source={item.image}
                    style={styles.icon}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
        {!driver?.online ? (
          <DriverOffline />
        ) : (
          <LiveJobOffersScreen
            sortBy={activeSortBy}
            showHiddenJobs={showHiddenJobs}
          />
        )}
        {/* Ride Types Bottom Sheet */}
        <BottomSheet
          open={sheetOpen}
          onClose={closeRideTypes}
          snapPoints={["35%"]}
          headerTitle="Choose Your Ride Type"
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
                />
              </View>
            </View>
            <View style={styles.sheetFooter}>
              <Button
                rounded="half"
                variant="primary"
                onPress={handleSaveRideTypes}
              >
                Save
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
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    width: 24,
    height: 24,
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
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: textColors.white,
    fontSize: 10,
    lineHeight: 12,
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
