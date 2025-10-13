import { textColors } from "@/constants/colors";
import { StyleSheet, View } from "react-native";
import SkeletonLoader from "./SkeletonLoader";

/**
 * Ultra-minimal skeleton component that mimics the structure of a LiveRideOfferItem
 * with white background and very few strategic skeleton elements for a clean, attractive look
 */
export default function RideItemSkeleton({
  animated = true,
}: { animated?: boolean } = {}) {
  return (
    <View style={styles.container}>
      {/* Header Section - Minimal skeleton */}
      <View style={styles.headerSection}>
        <SkeletonLoader
          width={60}
          height={16}
          borderRadius={8}
          animated={false}
        />
        <SkeletonLoader
          width={40}
          height={16}
          borderRadius={8}
          animated={false}
        />
        <SkeletonLoader
          width={20}
          height={20}
          borderRadius={10}
          animated={false}
        />
        <SkeletonLoader
          width={20}
          height={20}
          borderRadius={10}
          animated={false}
        />
        <SkeletonLoader
          width={30}
          height={16}
          borderRadius={8}
          animated={false}
        />
      </View>

      {/* Address Section - Simplified content skeleton */}
      <View style={styles.addressSection}>
        {/* Left side - Ride type indicator */}
        <SkeletonLoader
          width={28}
          height={80}
          borderRadius={8}
          animated={false}
        />

        {/* Right side - Address information - Only 2 skeletons */}
        <View style={styles.rightSection}>
          <SkeletonLoader
            width={240}
            height={16}
            borderRadius={6}
            animated={animated}
          />
          <SkeletonLoader
            width={200}
            height={16}
            borderRadius={6}
            animated={animated}
          />
        </View>
      </View>

      {/* Footer Section - Minimal pricing and button */}
      <View style={styles.footerSection}>
        <SkeletonLoader
          width={80}
          height={16}
          borderRadius={8}
          animated={false}
        />
        <SkeletonLoader
          width={60}
          height={16}
          borderRadius={8}
          animated={false}
        />
        <SkeletonLoader
          width={70}
          height={16}
          borderRadius={8}
          animated={false}
        />
        <SkeletonLoader
          width={80}
          height={32}
          borderRadius={16}
          animated={false}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: textColors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: textColors.grey100,
    padding: 16,
    gap: 16,
  },
  headerSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "transparent",
  },
  addressSection: {
    flexDirection: "row",
    backgroundColor: "transparent",
    alignItems: "flex-start",
    gap: 16,
  },
  rightSection: {
    flex: 1,
    justifyContent: "space-between",
    minHeight: 65,
    gap: 8,
  },
  footerSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "transparent",
    gap: 12,
  },
});
