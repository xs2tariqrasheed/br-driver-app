import Toggle from "@/components/Form/Toggle";
import Header from "@/components/Header";
import { SkeletonLoader } from "@/components/Loader";
import { textColors } from "@/constants/colors";
import { DRIVER_STATUS, type DriverStatusLabel } from "@/constants/global";
import { useDriver } from "@/context/DriverContext";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  Image as RNImage,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

export default function HomeScreen() {
  const router = useRouter();
  const [driver, setDriver] = useDriver();
  const statusValue: DriverStatusLabel = driver?.online
    ? DRIVER_STATUS.ONLINE
    : DRIVER_STATUS.OFFLINE;
  const labels: [DriverStatusLabel, DriverStatusLabel] = useMemo(
    () => [DRIVER_STATUS.OFFLINE, DRIVER_STATUS.ONLINE],
    []
  );

  return (
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
              source={require("@/assets/images/red-bell-icon.png")}
              style={styles.bellIcon}
              resizeMode="contain"
            />
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
              size={{ width: 112, height: 28 }}
            />
          </View>
        }
      />
      <View style={styles.iconBar}>
        {/** Left group of actions */}
        <View style={styles.iconGroup}>
          {[
            {
              key: "ride-type",
              image: require("@/assets/images/home/ride-type-icon.png"),
              onPress: () => console.log("Ride type pressed"),
            },
            {
              key: "heat-map",
              image: require("@/assets/images/home/heat-map-icon.png"),
              onPress: () => console.log("Heat map pressed"),
            },
            {
              key: "desired-locations",
              image: require("@/assets/images/home/desired-locations-icon.png"),
              onPress: () => console.log("Desired locations pressed"),
            },
            {
              key: "settings",
              image: require("@/assets/images/more/settings-icon.png"),
              onPress: () => router.push("/(screens)/more/app-settings" as any),
            },
            {
              key: "future-jobs",
              image: require("@/assets/images/home/future-jobs-icon.png"),
              onPress: () => console.log("Future Jobs pressed"),
            },
            {
              key: "live-jobs",
              image: require("@/assets/images/home/live-jobs-icon.png"),
              onPress: () => console.log("Live Jobs pressed"),
            },
            {
              key: "jump-portal",
              image: require("@/assets/images/home/jump-portal-icon.png"),
              onPress: () => console.log("Switch to Driver Portal pressed"),
            },
            {
              key: "mute-notifications",
              image: require("@/assets/images/home/mute-notifications-icon.png"),
              onPress: () => console.log("Mute Notifications pressed"),
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
              image: require("@/assets/images/home/view-hidden-jobs-icon.png"),
              onPress: () => console.log("View hidden Jobs pressed"),
            },
            {
              key: "sorting",
              image: require("@/assets/images/home/sorting-icon.png"),
              onPress: () => console.log("Sorting pressed"),
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
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollViewContent}
      >
        <View style={styles.container}>
          {Array.from({ length: 10 }).map((_, index) => (
            <View key={index} style={styles.skeletonContainer}>
              <SkeletonLoader />
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: textColors.white,
  },
  scrollViewContent: {
    paddingHorizontal: 10,
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
  skeletonContainer: {
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: "absolute",
  },
  logoutContainer: {
    padding: 16,
  },
  bellButton: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: 10,
  },
  bellIcon: {
    width: 24,
    height: 24,
  },
  toggleWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingRight: 10,
  },
});
