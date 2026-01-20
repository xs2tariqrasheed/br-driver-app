/**
 * @fileoverview FutureJobOffersScreen Component - Screen-level component for managing future job offers
 *
 * This component handles:
 * - Fetching future job offers from FutureJobOffersContext
 * - External sorting (controlled by parent component)
 * - Show/hide hidden jobs toggle functionality
 * - Scrollable list with FlatList (shows first 3 items initially)
 * - Functional "View +X More" button to expand all jobs
 * - Empty state handling
 * - Error handling and loading states
 * - Integration with availability confirmation functionality
 */

import { textColors } from "@/constants/colors";
import { EMPTY_STATE_MESSAGES } from "@/constants/global";
import { useFutureJobOffers } from "@/context/FutureJobOffersContext";
import { usePackageInfo } from "@/context/PackageInfoContext";
import { useSpecialRequirements } from "@/context/SpecialRequirementsContext";
import { logger } from "@/utils/helpers";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Image,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import FutureJobOfferItem from "../FutureJobOfferItem";
import RideItemSkeleton from "../Loader/RideItemSkeleton";
import Typography from "../Typography";

interface FutureJobOffersScreenProps {
  style?: ViewStyle;
  sortBy?: "time" | "distance";
  showHiddenJobs?: boolean;
}

const log = logger();

export default function FutureJobOffersScreen({
  style,
  sortBy: externalSortBy = "distance",
  showHiddenJobs,
}: FutureJobOffersScreenProps) {
  const { futureOffers, loading, error } = useFutureJobOffers();
  const { openSpecialRequirements } = useSpecialRequirements();
  const { openPackageInfo } = usePackageInfo();
  const [showAllJobs, setShowAllJobs] = useState<boolean>(false);

  // Filter future offers based on showHiddenJobs flag
  const filteredJobs = useMemo(() => {
    log(`[FutureJobOffersScreen] filteredJobs useMemo triggered`);
    log(
      `[FutureJobOffersScreen] futureOffers length: ${futureOffers?.length || 0
      }`
    );
    log(`[FutureJobOffersScreen] showHiddenJobs: ${showHiddenJobs}`);

    if (!futureOffers || futureOffers.length === 0) {
      log(`[FutureJobOffersScreen] No future offers available`);
      return [];
    }

    let filtered: any[];

    if (showHiddenJobs) {
      // Show all offers (offered, accepted, rejected, expired)
      filtered = futureOffers;
      log(
        `[FutureJobOffersScreen] Showing all ${futureOffers.length} future offers (including hidden/rejected/expired)`
      );
    } else {
      // Show only active offers (offered or accepted)
      filtered = futureOffers.filter(
        (offer) => offer.status === "offered" || offer.status === "accepted"
      );
      log(
        `[FutureJobOffersScreen] Showing ${filtered.length} active offers (offered/accepted only) out of ${futureOffers.length} total`
      );
    }

    log(`[FutureJobOffersScreen] Returning ${filtered.length} offers`);
    return filtered;
  }, [futureOffers, showHiddenJobs]);

  // Sort jobs based on external sort criteria
  // This sorting works for all offer types including future offers
  const sortedJobs = useMemo(() => {
    log(`[FutureJobOffersScreen] sortedJobs useMemo triggered`);
    log(
      `[FutureJobOffersScreen] filteredJobs length: ${filteredJobs?.length || 0
      }`
    );
    log(`[FutureJobOffersScreen] sortBy: ${externalSortBy}`);

    if (!filteredJobs || filteredJobs.length === 0) {
      return [];
    }

    const sorted = [...filteredJobs].sort((a, b) => {
      if (externalSortBy === "time") {
        // Sort by pickup time (ascending - shortest time first)
        const timeA = a.pickupTime ?? Infinity;
        const timeB = b.pickupTime ?? Infinity;
        return timeA - timeB;
      } else {
        // Sort by pickup distance (ascending - shortest distance first)
        const distanceA = a.pickupDistance ?? Infinity;
        const distanceB = b.pickupDistance ?? Infinity;
        return distanceA - distanceB;
      }
    });

    log(`[FutureJobOffersScreen] sortedJobs result length: ${sorted.length}`);
    log(
      `[FutureJobOffersScreen] First 3 sorted offers:`,
      sorted.slice(0, 3).map((o) => ({
        id: o.id,
        pickupTime: o.pickupTime,
        pickupDistance: o.pickupDistance,
      }))
    );
    return sorted;
  }, [filteredJobs, externalSortBy]);

  // Handle "View +X More" click
  const handleViewMorePress = useCallback(() => {
    setShowAllJobs(true);
    log(`[FutureJobOffersScreen] Showing all ${sortedJobs.length} jobs`);
  }, [sortedJobs.length]);

  const handleShowSpecialRequirements = (data: any) => {
    // Open the special requirements modal
    openSpecialRequirements(data);
  };

  const handleShowPackage = (data: any) => {
    // Open the package info modal
    openPackageInfo(data);
  };

  // Render "View +X More" indicator
  const renderViewMoreIndicator = () => {
    const additionalJobsCount = sortedJobs.length - 3;
    if (additionalJobsCount <= 0 || showAllJobs) return null;

    return (
      <TouchableOpacity
        style={styles.viewMoreContainer}
        onPress={handleViewMorePress}
        activeOpacity={0.7}
      >
        <Typography
          type="labelSmall"
          weight="semibold"
          style={styles.viewMoreText}
        >
          Click here to view +{additionalJobsCount} more
        </Typography>
        <Image
          source={require("@/assets/images/double-down-arrows-icon.png")}
          style={styles.viewMoreIcon}
          resizeMode="contain"
        />
      </TouchableOpacity>
    );
  };

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <Typography
        type="headingLarge"
        weight="semibold"
        style={styles.emptyStateTitle}
      >
        {EMPTY_STATE_MESSAGES.NO_JOBS_TITLE}
      </Typography>
      <Typography
        type="bodyLarge"
        weight="regular"
        style={styles.emptyStateMessage}
      >
        {EMPTY_STATE_MESSAGES.NO_FUTURE_JOBS_MESSAGE}
      </Typography>
    </View>
  );

  // Render error state
  const renderErrorState = () => (
    <View style={styles.errorStateContainer}>
      <Typography
        type="bodyMedium"
        weight="semibold"
        style={styles.errorStateTitle}
      >
        Unable to Load Future Jobs
      </Typography>
      <Typography
        type="bodyMedium"
        weight="regular"
        style={styles.errorStateMessage}
      >
        Something went wrong while loading future jobs. Please try again.
      </Typography>
    </View>
  );

  // Render loading state
  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      {Array.from({ length: 2 }).map((_, index) => (
        <View key={index} style={styles.skeletonWrapper}>
          <RideItemSkeleton />
        </View>
      ))}
    </View>
  );

  // Get jobs for display based on showAllJobs state
  const displayJobs = showAllJobs ? sortedJobs : sortedJobs.slice(0, 3);
  const hasMoreJobs = !showAllJobs && sortedJobs.length > 3;

  // Reset showAllJobs when data changes
  useEffect(() => {
    setShowAllJobs(false);
    log("[FutureJobOffersScreen] Reset showAllJobs due to data change");
  }, [sortedJobs.length]);

  // Show loading state when loading
  if (loading) {
    return (
      <View style={[styles.container, style]}>{renderLoadingState()}</View>
    );
  }

  // Show error state if there's an error
  if (error) {
    return <View style={[styles.container, style]}>{renderErrorState()}</View>;
  }

  // Render job item for FlatList
  const renderJobItem = ({ item }: { item: any }) => {
    return (
      <View style={styles.jobItemWrapper}>
        <FutureJobOfferItem
          id={item.id}
          rideType={item.rideType}
          peopleCount={item.peopleCount}
          rating={item.rating}
          hasSpecialRequirements={item.hasSpecialRequirements}
          onPressSpecialRequirements={() => {
            handleShowSpecialRequirements(item?.specialRequirements);
          }}
          onPressPackage={() => {
            handleShowPackage(item?.packageInfo);
          }}
          hasPackage={item.hasPackage}
          pickupTime={item.pickupTime}
          pickupDistance={item.pickupDistance}
          pickupAddress={item.pickupAddress}
          dropoffTime={item.dropoffTime}
          dropoffDistance={item.dropoffDistance}
          dropoffAddress={item.dropoffAddress}
          rideTime={item.rideTime}
          rideDistance={item.rideDistance}
          totalPrice={item.totalPrice}
          driverEarn={item.driverEarn}
          availabilityConfirmed={item.availabilityConfirmed}
          notes={item.notes}
          pickupDate={item.pickupDate}
          scheduledPickupTime={item.scheduledPickupTime}
        />
      </View>
    );
  };

  return (
    <View style={[styles.container, style]}>
      {sortedJobs.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={displayJobs}
          keyExtractor={(item) => item.id}
          renderItem={renderJobItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: Platform.OS === "ios" && showAllJobs ? "20%" : 20 }]}
          ListFooterComponent={hasMoreJobs ? renderViewMoreIndicator : null}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 10,
  },
  jobItemWrapper: {
    marginBottom: 16,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  emptyStateTitle: {
    color: textColors.black,
    textAlign: "center",
    marginBottom: 12,
  },
  emptyStateMessage: {
    color: textColors.grey600,
    textAlign: "center",
    lineHeight: 22,
  },
  errorStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  errorStateTitle: {
    color: textColors.red500,
    textAlign: "center",
    marginBottom: 12,
  },
  errorStateMessage: {
    color: textColors.grey600,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 22,
  },
  loadingContainer: {
    flex: 1,
    paddingHorizontal: 10,
  },
  skeletonWrapper: {
    marginBottom: 20,
  },
  viewMoreContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: Platform.OS === "android" ? 8 : -16,
  },
  viewMoreText: {
    fontFamily: "SF-Pro-Display-Semibold",
    fontSize: 12,
    color: textColors.black,
    marginRight: 8,
  },
  viewMoreIcon: {
    width: 16,
    height: 16,
  },
});
