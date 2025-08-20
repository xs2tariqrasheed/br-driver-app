import Toggle from "@/components/Form/Toggle";
import Header from "@/components/Header";
import { SkeletonLoader } from "@/components/Loader";
import { textColors } from "@/constants/colors";
import { DRIVER_STATUS, type DriverStatusLabel } from "@/constants/global";
import { useDriver } from "@/context/DriverContext";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  Pressable,
  Image as RNImage,
  SafeAreaView,
  ScrollView,
  StyleSheet,
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
          <Pressable
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
          </Pressable>
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
    padding: 10,
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
