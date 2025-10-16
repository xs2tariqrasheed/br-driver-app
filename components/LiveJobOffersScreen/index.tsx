/**
 * @fileoverview LiveJobOffersScreen Component - Screen-level component for managing live job offers
 *
 * This component handles:
 * - API calls to fetch live job offers
 * - Filtering jobs by "offered" status
 * - Auto-refresh every 60 seconds
 * - External sorting (controlled by parent component)
 * - Show/hide hidden jobs toggle functionality
 * - Scrollable list with FlatList (shows first 3 items initially)
 * - Functional "View +X More" button to expand all jobs
 * - Smart scroll detection to disable swipe gestures during scrolling
 * - Swipe gestures disabled when viewing hidden jobs (prevents re-skipping)
 * - Empty state handling
 * - Error handling and loading states
 * - Integration with swipe/hide functionality
 */

import { textColors } from "@/constants/colors";
import {
  EMPTY_STATE_MESSAGES,
  LOCAL_JOB_STATUS,
  OFFER_TYPES,
  type LocalJobStatus,
  type OfferType,
} from "@/constants/global";
import { useAuth } from "@/context/AuthContext";
import { useBidBottomSheet } from "@/context/BidBottomSheetContext";
import { useBidWaitingTimer } from "@/context/BidWaitingTimerContext";
import { useBroadcastJobOffers } from "@/context/BroadcastJobOffersContext";
import { useDriver } from "@/context/DriverContext";
import { usePackageInfo } from "@/context/PackageInfoContext";
import { useRideOffer } from "@/context/RideOfferContext";
import { useSpecialRequirements } from "@/context/SpecialRequirementsContext";
import { logger } from "@/utils/helpers";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import ETAModal from "../ETAModal";
import LiveRideOfferItem from "../LiveRideOfferItem";
import RideItemSkeleton from "../Loader/RideItemSkeleton";
import { showToast } from "../Toast";
import Typography from "../Typography";

interface LiveJobOffersScreenProps {
  style?: ViewStyle;
  sortBy?: "time" | "distance";
  isOnline?: boolean;
  showHiddenJobs?: boolean;
  type?: OfferType;
}

const log = logger();

export default function LiveJobOffersScreen({
  style,
  sortBy: externalSortBy = "distance",
  showHiddenJobs,
  type = OFFER_TYPES.LIVE,
}: LiveJobOffersScreenProps) {
  const { getLiveOfferStatus, getRetrievalId } = useDriver();
  const [auth] = useAuth();
  const { broadcastOffers, updateBroadcastOffer, clearAllBroadcastOffers } =
    useBroadcastJobOffers();
  const {
    showRideOfferModal,
    submitETA,
    isSubmitETALoading,
    submitBid,
    submitBidForBroadcastOffer,
    isSubmitBidLoading,
  } = useRideOffer();
  const { openSpecialRequirements } = useSpecialRequirements();
  const { openPackageInfo } = usePackageInfo();
  const { showBidBottomSheet } = useBidBottomSheet();
  const { showBidWaitingTimer } = useBidWaitingTimer();
  const [showAllJobs, setShowAllJobs] = useState<boolean>(false);
  const [isScrolling, setIsScrolling] = useState<boolean>(false);
  const [hasTimedOut, setHasTimedOut] = useState<boolean>(false);
  const [isETAModalOpen, setIsETAModalOpen] = useState<boolean>(false);
  const [isAnyTripInProgress, setIsAnyTripInProgress] =
    useState<boolean>(false);
  const [selectedJobForAccept, setSelectedJobForAccept] = useState<any>(null);
  const [selectedJobForBid, setSelectedJobForBid] = useState<any>(null);

  // On mount, check if a retrievalId exists; if yes, show trip in progress state
  useEffect(() => {
    (async () => {
      try {
        const { retrievalId } = await getRetrievalId();
        if (retrievalId) {
          console.log("RetrievalId found, showing trip in progress state");
          setIsAnyTripInProgress(true);
        } else {
          console.log("No retrievalId found, showing job offers");
          setIsAnyTripInProgress(false);
        }
      } catch (error) {
        console.error("Error checking retrievalId:", error);
        // On error, assume no trip in progress
        setIsAnyTripInProgress(false);
      }
    })();
  }, [getRetrievalId]);

  // Track which offer is being processed (skip/hide operation)
  const [processingOfferId, setProcessingOfferId] = useState<string | null>(
    null
  );

  // Timeout effect: Show empty state after 7 seconds if no offers received
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (broadcastOffers.length === 0) {
        setHasTimedOut(true);
        log("[LiveJobOffersScreen] Timeout reached - showing empty state");
      }
    }, 3000); // 3 seconds timeout

    return () => clearTimeout(timeout);
  }, [broadcastOffers.length]);

  // Reset timeout state when offers are received
  useEffect(() => {
    if (broadcastOffers.length > 0) {
      setHasTimedOut(false);
    }
  }, [broadcastOffers.length]);

  // Filter broadcast offers based on showHiddenJobs flag
  const filteredJobs = useMemo(() => {
    log(`[LiveJobOffersScreen] filteredJobs useMemo triggered`);
    log(
      `[LiveJobOffersScreen] broadcastOffers length: ${
        broadcastOffers?.length || 0
      }`
    );
    log(`[LiveJobOffersScreen] showHiddenJobs: ${showHiddenJobs}`);

    if (!broadcastOffers || broadcastOffers.length === 0) {
      log(`[LiveJobOffersScreen] No broadcast offers available`);
      return [];
    }

    let filtered: any[];

    if (showHiddenJobs) {
      // Show all offers (offered, accepted, skipped, hidden, expired)
      filtered = broadcastOffers;
      log(
        `[LiveJobOffersScreen] Showing all ${broadcastOffers.length} broadcast offers (including hidden/skipped/expired)`
      );
    } else {
      // Show only active offers (offered or accepted)
      filtered = broadcastOffers.filter(
        (offer) => offer.status === "offered" || offer.status === "accepted"
      );
      log(
        `[LiveJobOffersScreen] Showing ${filtered.length} active offers (offered/accepted only) out of ${broadcastOffers.length} total`
      );
    }

    log(`[LiveJobOffersScreen] Returning ${filtered.length} offers`);
    return filtered;
  }, [broadcastOffers, showHiddenJobs]);

  // Sort jobs based on external sort criteria
  const sortedJobs = useMemo(() => {
    log(`[LiveJobOffersScreen] sortedJobs useMemo triggered`);
    log(
      `[LiveJobOffersScreen] filteredJobs length: ${filteredJobs?.length || 0}`
    );

    const sorted = [...(filteredJobs ?? [])].sort((a, b) => {
      if (externalSortBy === "time") {
        return a.pickupTime - b.pickupTime;
      }
      return a.pickupDistance - b.pickupDistance;
    });

    log(`[LiveJobOffersScreen] sortedJobs result length: ${sorted.length}`);
    return sorted;
  }, [filteredJobs, externalSortBy]);

  // Data is now managed by the BroadcastJobOffersContext
  // No need for initial data fetch as data comes from global listeners

  // Get item status for each job
  const getItemStatus = useCallback(
    (jobId: string): LocalJobStatus | "expired" | "accepted" | "offered" => {
      const hiddenOffer = getLiveOfferStatus(jobId);
      const broadcastOffer = broadcastOffers.find(
        (offer) => offer.id === jobId
      );

      // Check if the offer is expired in the broadcast context FIRST (highest priority)
      if (broadcastOffer?.status === "expired") {
        console.log(`  - returning expired status (highest priority)`);
        return "expired";
      }

      // For fresh offers (status "offered"), always return "offered" regardless of previous status
      if (broadcastOffer?.status === "offered") {
        console.log(
          `  - fresh offer, returning offered status (ignoring previous status)`
        );
        return "offered";
      }

      // Check broadcast offer status for user actions (accepted, skipped, hidden)
      if (broadcastOffer?.status === "accepted") {
        console.log(`  - returning accepted status from broadcast offer`);
        return "accepted";
      } else if (broadcastOffer?.status === "skipped") {
        console.log(`  - returning skipped status from broadcast offer`);
        return "skipped";
      } else if (broadcastOffer?.status === "hidden") {
        console.log(`  - returning hidden status from broadcast offer`);
        return "hidden";
      }

      // Fallback to hiddenOffer status for backward compatibility
      if (hiddenOffer?.status) {
        console.log(
          `  - returning hidden status from hiddenOffer: ${hiddenOffer.status}`
        );
        return hiddenOffer.status;
      }

      console.log(`  - returning visible status`);
      return LOCAL_JOB_STATUS.VISIBLE;
    },
    [getLiveOfferStatus, broadcastOffers]
  );

  // Handle button click (bid/accept)
  const handleJobAction = useCallback(
    (jobId: string) => {
      log(`[LiveJobOffersScreen] Job action clicked for job: ${jobId}`);

      // Find the job data
      const job = sortedJobs.find((j) => j.id === jobId);
      if (!job) return;

      // Check if job is expired (but still allow interaction for debugging)
      const now = new Date();
      const isExpired = job.status === "expired";

      if (isExpired) {
        log(
          `[LiveJobOffersScreen] Job ${jobId} is expired, but allowing action for debugging`
        );
        // Don't return - allow the action to proceed
      }

      if (job.bidable) {
        // Store the selected job for bid submission
        setSelectedJobForBid(job);

        // Handle bidable offers - show bid bottom sheet
        const bidData = {
          amount: 20, // Default bid amount - this should come from the job data
          bosstedAmount: 5,
          driverEarn: job.driverEarn,
          numberOfBids: 4,
          systemEta: 5,
          systemSuggestedBids: [
            { amount: 10, driverEarn: 8.38 },
            { amount: 15, driverEarn: 12.57 },
            { amount: 20, driverEarn: 16.76 },
            { amount: 25, driverEarn: 20.95 },
            { amount: 30, driverEarn: 25.14 },
          ],
          boostedPrices: [1, 3, 4, 7],
          createdAt: job.timestamp,
        };

        // Show bid bottom sheet with submission callback
        showBidBottomSheet(bidData, (bidData) =>
          handleBidSubmitted(bidData, job)
        );
        log(`[LiveJobOffersScreen] Opening bid bottom sheet for job: ${jobId}`);
      } else {
        // Handle non-bidable offers - show ETA modal for acceptance
        setSelectedJobForAccept(job);
        setIsETAModalOpen(true);
        log(`[LiveJobOffersScreen] Opening ETA modal for job: ${jobId}`);
      }
    },
    [sortedJobs, showRideOfferModal, showBidBottomSheet]
  );

  // Handle bid submission from bid bottom sheet
  const handleBidSubmitted = useCallback(
    async (bidData: any, job?: any) => {
      try {
        log("[LiveJobOffersScreen] Bid submitted from bottom sheet:", bidData);
        log("[LiveJobOffersScreen] Job data:", job);

        // Use job parameter if provided, otherwise fall back to selectedJobForBid
        const jobToUse = job || selectedJobForBid;

        if (!jobToUse) {
          log("[LiveJobOffersScreen] No job data available for bid submission");
          return;
        }

        // Call the submit bid API with the selected bid amount and tripId
        const result = await submitBidForBroadcastOffer(
          jobToUse.tripOffer.tripId,
          bidData.selectedBid
        );

        if (result?.success) {
          log("[LiveJobOffersScreen] Bid submitted successfully");

          // Mark the offer as accepted in the context
          updateBroadcastOffer(jobToUse.id, { status: "accepted" });
          log(`[LiveJobOffersScreen] Marked job ${jobToUse.id} as accepted`);
          setSelectedJobForBid(null);

          // Show waiting timer for customer response
          showBidWaitingTimer();
          log("[LiveJobOffersScreen] Showing bid waiting timer");
        }
      } catch (error) {
        log("[LiveJobOffersScreen] Failed to submit bid:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to submit bid. Please try again.";
        showToast(errorMessage, {
          variant: "error",
          position: "top",
        });
      }
    },
    [
      submitBidForBroadcastOffer,
      selectedJobForBid,
      updateBroadcastOffer,
      showBidWaitingTimer,
    ]
  );

  // Handle ETA submission for accept flow
  const handleETASubmit = useCallback(
    async (eta: number) => {
      if (!selectedJobForAccept) {
        log("[LiveJobOffersScreen] No selected job for ETA submission");
        return;
      }

      try {
        log(
          `[LiveJobOffersScreen] Submitting ETA for job: ${selectedJobForAccept.id}`,
          eta
        );

        // Call the submit ETA API
        await submitETA(eta);

        log("[LiveJobOffersScreen] ETA submitted successfully");

        // Mark the offer as accepted in the context
        updateBroadcastOffer(selectedJobForAccept.id, { status: "accepted" });
        log(
          `[LiveJobOffersScreen] Marked job ${selectedJobForAccept.id} as accepted`
        );

        // Show success toast
        showToast("Ride accepted successfully!", {
          variant: "success",
          position: "top",
        });

        // Close the ETA modal
        setIsETAModalOpen(false);
        setSelectedJobForAccept(null);

        // Redirect to active ride screen
        router.replace("/(screens)/active-ride");
      } catch (error) {
        log("[LiveJobOffersScreen] Failed to submit ETA:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to submit ETA. Please try again.";
        showToast(errorMessage, {
          variant: "error",
          position: "top",
        });
      }
    },
    [selectedJobForAccept, submitETA]
  );

  // Handle "View +X More" click
  const handleViewMorePress = useCallback(() => {
    setShowAllJobs(true);
    log(`[LiveJobOffersScreen] Showing all ${sortedJobs.length} jobs`);
  }, [sortedJobs.length]);

  // Handle scroll events
  const handleScrollBeginDrag = useCallback(() => {
    setIsScrolling(true);
    log("[LiveJobOffersScreen] Scrolling started - swipe gestures disabled");
  }, []);

  const handleScrollEndDrag = useCallback(() => {
    setIsScrolling(false);
    log("[LiveJobOffersScreen] Scrolling ended - swipe gestures enabled");
  }, []);

  const handleShowSpecialRequirements = (data: any) => {
    // Open the special requirements modal (overlay on top of ride offer modal)
    openSpecialRequirements(data);
  };

  const handleShowPackage = (data: any) => {
    // Open the package info modal (overlay on top of ride offer modal)
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
          View +{additionalJobsCount} More
        </Typography>
        <Image
          source={require("@/assets/images/double-down-arrows-icon.png")}
          style={styles.viewMoreIcon}
          resizeMode="contain"
        />
      </TouchableOpacity>
    );
  };

  // Render trip in progress state
  const renderTripInProgressState = () => (
    <View style={styles.tripInProgressContainer}>
      <Typography
        type="headingLarge"
        weight="semibold"
        style={styles.tripInProgressTitle}
      >
        Trip in Progress
      </Typography>
      <Typography
        type="bodyLarge"
        weight="regular"
        style={styles.tripInProgressMessage}
      >
        You currently have an active trip. Complete your current ride to receive
        new job offers.
      </Typography>
      <Image
        source={require("@/assets/images/ride-inprogress.gif")}
        style={styles.tripInProgressIcon}
        resizeMode="contain"
      />
      <TouchableOpacity
        style={styles.viewActiveRideButton}
        onPress={() => router.push("/(screens)/active-ride")}
        activeOpacity={0.7}
      >
        <Typography
          type="bodyLarge"
          weight="semibold"
          style={styles.viewActiveRideButtonText}
        >
          View Active Ride
        </Typography>
      </TouchableOpacity>
    </View>
  );

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
        {type === OFFER_TYPES.LIVE
          ? EMPTY_STATE_MESSAGES.NO_JOBS_MESSAGE
          : EMPTY_STATE_MESSAGES.NO_HIRED_JOBS_MESSAGE}
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
        Unable to Load Jobs
      </Typography>
      <Typography
        type="bodyMedium"
        weight="regular"
        style={styles.errorStateMessage}
      >
        Something went wrong while loading jobs. Please try again.
      </Typography>
      <TouchableOpacity
        style={styles.retryButton}
        onPress={() => {
          // Refresh the broadcast offers by clearing and re-fetching
          clearAllBroadcastOffers();
        }}
      >
        <Typography
          type="bodyLarge"
          weight="semibold"
          style={styles.retryButtonText}
        >
          Retry
        </Typography>
      </TouchableOpacity>
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

  // Reset showAllJobs when data changes (e.g., after auto-refresh)
  useEffect(() => {
    setShowAllJobs(false);
    log("[LiveJobOffersScreen] Reset showAllJobs due to data change");
  }, [sortedJobs.length]); // Reset when job count changes

  // Clean up selected job when component unmounts or data changes
  useEffect(() => {
    return () => {
      setSelectedJobForBid(null);
      setSelectedJobForAccept(null);
    };
  }, []);

  // Log when "View +X More" indicator should be shown
  useEffect(() => {
    if (hasMoreJobs) {
      const additionalCount = sortedJobs.length - 3;
      log(
        `[LiveJobOffersScreen] Showing "View +${additionalCount} More" indicator`
      );
    }
  }, [hasMoreJobs, sortedJobs.length]);

  // Error handling is now managed by the BroadcastJobOffersContext

  // Show trip in progress state if driver has an active trip
  if (isAnyTripInProgress) {
    return (
      <View style={[styles.container, style]}>
        {renderTripInProgressState()}
      </View>
    );
  }

  // Show loading state only when there are no broadcast offers yet and timeout hasn't occurred
  if (broadcastOffers.length === 0 && !hasTimedOut) {
    return (
      <View style={[styles.container, style]}>{renderLoadingState()}</View>
    );
  }

  // Show empty state if no offers and timeout has occurred
  if (broadcastOffers.length === 0 && hasTimedOut) {
    return <View style={[styles.container, style]}>{renderEmptyState()}</View>;
  }

  // Render job item for FlatList
  const renderJobItem = ({
    item,
    isScrolling,
  }: {
    item: any;
    isScrolling?: boolean;
  }) => {
    // Disable this item if another offer is being processed
    const isAnotherOfferProcessing =
      processingOfferId !== null && processingOfferId !== item.id;

    // Determine disabled state based on actual status
    let isDisabled = false;

    // Check if action has been taken
    if (item.status === "accepted") {
      isDisabled = true;
    } else if (item.status === "skipped") {
      isDisabled = true;
    } else if (item.status === "hidden") {
      isDisabled = true;
    } else if (item.status === "expired") {
      isDisabled = true;
    } else {
      isDisabled = false;
    }

    // Disable if another offer is being processed
    if (isAnotherOfferProcessing) {
      isDisabled = true;
    }

    return (
      <View style={styles.jobItemWrapper}>
        <LiveRideOfferItem
          type={type}
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
          bidable={item.bidable}
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
          onButtonClick={() => handleJobAction(item.id)}
          itemStatus={getItemStatus(item.id)}
          isScrolling={isScrolling}
          disabled={isDisabled}
          processingOfferId={processingOfferId}
          onProcessingStart={(offerId) => setProcessingOfferId(offerId)}
          onProcessingEnd={() => setProcessingOfferId(null)}
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
          renderItem={(props) => renderJobItem({ ...props, isScrolling })}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          ListFooterComponent={hasMoreJobs ? renderViewMoreIndicator : null}
          onScrollBeginDrag={handleScrollBeginDrag}
          onScrollEndDrag={handleScrollEndDrag}
          onMomentumScrollEnd={handleScrollEndDrag}
        />
      )}

      {/* ETA Modal for Accept Flow */}
      <ETAModal
        open={isETAModalOpen}
        onClose={() => {
          setIsETAModalOpen(false);
          setSelectedJobForAccept(null);
        }}
        onSubmit={handleETASubmit}
        isLoading={isSubmitETALoading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 10,
    paddingBottom: 20,
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
  retryButton: {
    backgroundColor: textColors.teal600,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: textColors.white,
    textAlign: "center",
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
    marginTop: 8,
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
  tripInProgressContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  tripInProgressIcon: {
    width: "100%",
    height: 300,
  },
  tripInProgressTitle: {
    color: textColors.black,
    textAlign: "center",
  },
  tripInProgressMessage: {
    color: textColors.grey600,
    textAlign: "center",
    lineHeight: 22,
    marginTop: 10,
  },
  viewActiveRideButton: {
    marginTop: -26,
    backgroundColor: textColors.teal600,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  viewActiveRideButtonText: {
    color: textColors.white,
    textAlign: "center",
  },
});
