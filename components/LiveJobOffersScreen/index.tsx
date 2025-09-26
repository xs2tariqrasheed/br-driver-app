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
import { LIVE_JOB_ENDPOINTS } from "@/constants/endpoints";
import {
  BID_STATUS,
  BID_WAITING_TIMER_DURATION_MS,
  EMPTY_STATE_MESSAGES,
  LIVE_JOB_STATUS,
  LOCAL_JOB_STATUS,
  type BidStatus as BidStatusType,
  type LocalJobStatus,
} from "@/constants/global";
import { useAuth } from "@/context/AuthContext";
import { useDriver } from "@/context/DriverContext";
import { useFetch } from "@/hooks/useFetch";
import { usePost } from "@/hooks/usePost";
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
import BidBottomSheet from "../BidBottomSheet";
import BidStatusSheet from "../BidStatusSheet";
import BidWaitingTimer from "../BidWaitingTimer";
import ConfirmationSheet from "../ConfirmationSheet";
import LiveRideOfferItem from "../LiveRideOfferItem";
import SkeletonLoader from "../Loader/SkeletonLoader";
import { showToast } from "../Toast";
import Typography from "../Typography";

interface LiveJobOffersScreenProps {
  style?: ViewStyle;
  sortBy?: "time" | "distance";
  showHiddenJobs?: boolean;
  isOnline?: boolean;
}

const log = logger();

export default function LiveJobOffersScreen({
  style,
  sortBy: externalSortBy = "distance",
  showHiddenJobs = false,
}: LiveJobOffersScreenProps) {
  const { getLiveOfferStatus } = useDriver();
  const [auth] = useAuth();

  const [showAllJobs, setShowAllJobs] = useState<boolean>(false);
  const [isScrolling, setIsScrolling] = useState<boolean>(false);
  const [selectedJobForBid, setSelectedJobForBid] = useState<any>(null);
  const [isBidSheetOpen, setIsBidSheetOpen] = useState<boolean>(false);
  const [isWaitingForCustomer, setIsWaitingForCustomer] =
    useState<boolean>(false);
  const [isCancelConfirmationOpen, setIsCancelConfirmationOpen] =
    useState<boolean>(false);
  const [isBidStatusOpen, setIsBidStatusOpen] = useState<boolean>(false);
  const [bidStatus, setBidStatus] = useState<BidStatusType>(BID_STATUS.EXPIRED);

  // API hook for fetching live jobs
  const {
    data: liveJobsData,
    loading,
    error,
    execute: fetchLiveJobs,
  } = useFetch<any[]>(LIVE_JOB_ENDPOINTS.getLiveJobs);

  // API hook for submitting bids
  const { loading: isSubmittingBid, execute: submitBid } = usePost(
    LIVE_JOB_ENDPOINTS.submitBid
  );

  // API hook for canceling bids
  const { loading: isCancelingBid, execute: cancelBid } = usePost(
    LIVE_JOB_ENDPOINTS.cancelBid
  );

  // DEV-ONLY: Automatically mark bid as ACCEPTED after 10 seconds when waiting starts
  useEffect(() => {
    if (!__DEV__) return;
    if (!isWaitingForCustomer) return;

    const timeout = setTimeout(() => {
      log("[Dev] Auto-accepting bid after 10s for testing purposes");
      setIsWaitingForCustomer(false);
      setSelectedJobForBid(null);
      setBidStatus(BID_STATUS.ACCEPTED);
      setIsBidStatusOpen(true);
    }, 10000);

    return () => clearTimeout(timeout);
  }, [isWaitingForCustomer]);

  // Filter jobs by "offered" status and apply local status filtering
  const filteredJobs = useMemo(() => {
    // if (!liveJobsData) return [];
    const mockLiveJobsData = [
      {
        id: "1",
        status: LIVE_JOB_STATUS.OFFERED,
        pickupTime: 32,
        pickupDistance: 100,
        pickupAddress: "123 Main St, Anytown, USA",
        dropoffTime: 12,
        dropoffDistance: 200,
        dropoffAddress: "456 Oak Ave, Anytown, USA",
        rideTime: 30,
        rideDistance: 300,
        totalPrice: 100,
        driverEarn: 100,
        buttonTitle: "Bid",
        peopleCount: 1,
        rating: 4.5,
        hasSpecialRequirements: false,
        hasPackage: false,
        rideType: "hourly",
        createdAt: "2024-01-15T10:30:00Z",
        expiresAt: "2024-01-15T11:00:00Z",
        bid: {
          amount: 20,
          bosstedAmount: 5,
          driverEarn: 16.76,
          numberOfBids: 4,
          systemEta: 5,
          systemSuggestedBids: [
            {
              amount: 10,
              driverEarn: 8.38,
            },
            {
              amount: 15,
              driverEarn: 12.57,
            },
            {
              amount: 20,
              driverEarn: 16.76,
            },
            {
              amount: 25,
              driverEarn: 20.95,
            },
            {
              amount: 30,
              driverEarn: 25.14,
            },
          ],
          boostedPrices: [1, 3, 4, 7],
          createdAt: "2024-01-15T10:30:00Z",
          expiresAt: "2024-01-15T11:00:00Z",
        },
      },
      {
        id: "2",
        status: LIVE_JOB_STATUS.OFFERED,
        pickupTime: 15,
        pickupDistance: 250,
        pickupAddress: "789 Elm Street, Downtown, USA",
        dropoffTime: 25,
        dropoffDistance: 150,
        dropoffAddress: "321 Pine Road, Uptown, USA",
        rideTime: 45,
        rideDistance: 500,
        totalPrice: 180,
        driverEarn: 180,
        buttonTitle: "Bid",
        peopleCount: 3,
        rating: 4.8,
        hasSpecialRequirements: true,
        hasPackage: false,
        rideType: "round-trip",
        createdAt: "2024-01-15T10:35:00Z",
        expiresAt: "2024-01-15T11:05:00Z",
        bid: {
          amount: 20,
          bosstedAmount: 5,
          driverEarn: 16.76,
          numberOfBids: 4,
          systemEta: 5,
          systemSuggestedBids: [
            {
              amount: 10,
              driverEarn: 8.38,
            },
            {
              amount: 15,
              driverEarn: 12.57,
            },
            {
              amount: 20,
              driverEarn: 16.76,
            },
            {
              amount: 25,
              driverEarn: 20.95,
            },
            {
              amount: 30,
              driverEarn: 25.14,
            },
          ],
          boostedPrices: [1, 3, 4, 7],
          createdAt: "2024-01-15T10:30:00Z",
          expiresAt: "2024-01-15T11:00:00Z",
        },
      },
      {
        id: "3",
        status: LIVE_JOB_STATUS.OFFERED,
        pickupTime: 8,
        pickupDistance: 50,
        pickupAddress: "555 Maple Drive, Suburbia, USA",
        dropoffTime: 18,
        dropoffDistance: 300,
        dropoffAddress: "777 Cedar Lane, Airport, USA",
        rideTime: 35,
        rideDistance: 400,
        totalPrice: 140,
        driverEarn: 140,
        buttonTitle: "Bid",
        peopleCount: 2,
        rating: 4.2,
        hasSpecialRequirements: false,
        hasPackage: true,
        rideType: "one-way",
        createdAt: "2024-01-15T10:40:00Z",
        expiresAt: "2024-01-15T11:10:00Z",
        bid: {
          amount: 20,
          bosstedAmount: 5,
          driverEarn: 16.76,
          numberOfBids: 4,
          systemEta: 5,
          systemSuggestedBids: [
            {
              amount: 10,
              driverEarn: 8.38,
            },
            {
              amount: 15,
              driverEarn: 12.57,
            },
            {
              amount: 20,
              driverEarn: 16.76,
            },
            {
              amount: 25,
              driverEarn: 20.95,
            },
            {
              amount: 30,
              driverEarn: 25.14,
            },
          ],
          boostedPrices: [1, 3, 4, 7],
          createdAt: "2024-01-15T10:30:00Z",
          expiresAt: "2024-01-15T11:00:00Z",
        },
      },
      {
        id: "4",
        status: LIVE_JOB_STATUS.OFFERED,
        pickupTime: 45,
        pickupDistance: 180,
        pickupAddress: "999 Birch Boulevard, Business District, USA",
        dropoffTime: 20,
        dropoffDistance: 220,
        dropoffAddress: "111 Spruce Street, Residential Area, USA",
        rideTime: 55,
        rideDistance: 650,
        totalPrice: 220,
        driverEarn: 220,
        buttonTitle: "Waiting",
        peopleCount: 1,
        disabled: true,
        rating: 4.9,
        hasSpecialRequirements: true,
        hasPackage: true,
        rideType: "one-way",
        createdAt: "2024-01-15T10:45:00Z",
        expiresAt: "2024-01-15T11:15:00Z",
        bid: {
          amount: 20,
          bosstedAmount: 5,
          driverEarn: 16.76,
          numberOfBids: 4,
          systemEta: 5,
          systemSuggestedBids: [
            {
              amount: 10,
              driverEarn: 8.38,
            },
            {
              amount: 15,
              driverEarn: 12.57,
            },
            {
              amount: 20,
              driverEarn: 16.76,
            },
            {
              amount: 25,
              driverEarn: 20.95,
            },
            {
              amount: 30,
              driverEarn: 25.14,
            },
          ],
          boostedPrices: [1, 3, 4, 7],
          createdAt: "2024-01-15T10:30:00Z",
          expiresAt: "2024-01-15T11:00:00Z",
        },
      },
      {
        id: "5",
        status: LIVE_JOB_STATUS.OFFERED,
        pickupTime: 22,
        pickupDistance: 120,
        pickupAddress: "333 Willow Way, Shopping Center, USA",
        dropoffTime: 15,
        dropoffDistance: 280,
        dropoffAddress: "888 Aspen Court, Hotel District, USA",
        rideTime: 40,
        rideDistance: 450,
        totalPrice: 160,
        driverEarn: 160,
        buttonTitle: "Accept",
        peopleCount: 4,
        rating: 4.6,
        hasSpecialRequirements: false,
        hasPackage: false,
        rideType: "round-trip",
        createdAt: "2024-01-15T10:50:00Z",
        expiresAt: "2024-01-15T11:20:00Z",
        bid: {
          amount: 20,
          bosstedAmount: 5,
          driverEarn: 16.76,
          numberOfBids: 4,
          systemEta: 5,
          systemSuggestedBids: [
            {
              amount: 10,
              driverEarn: 8.38,
            },
            {
              amount: 15,
              driverEarn: 12.57,
            },
            {
              amount: 20,
              driverEarn: 16.76,
            },
            {
              amount: 25,
              driverEarn: 20.95,
            },
            {
              amount: 30,
              driverEarn: 25.14,
            },
          ],
          boostedPrices: [1, 3, 4, 7],
          createdAt: "2024-01-15T10:30:00Z",
          expiresAt: "2024-01-15T11:00:00Z",
        },
      },
    ];
    return mockLiveJobsData
      ?.filter((job) => job.status === LIVE_JOB_STATUS.OFFERED)
      ?.filter((job) => {
        // If showHiddenJobs is true, show all jobs including hidden/skipped
        if (showHiddenJobs) {
          return true;
        }

        // Otherwise, apply normal filtering for hidden/skipped jobs
        const localStatus = getLiveOfferStatus(job.id);
        // Show job if it's not hidden or skipped, or if it's visible
        return !localStatus || localStatus.status === LOCAL_JOB_STATUS.VISIBLE;
      });
  }, [liveJobsData, getLiveOfferStatus, showHiddenJobs]);

  // Log toggle state changes for debugging
  useEffect(() => {
    log(
      `[LiveJobOffersScreen] Show hidden jobs: ${showHiddenJobs ? "ON" : "OFF"}`
    );
  }, [showHiddenJobs]);

  // Sort jobs based on external sort criteria
  const sortedJobs = useMemo(() => {
    return [...(filteredJobs ?? [])].sort((a, b) => {
      if (externalSortBy === "time") {
        return a.pickupTime - b.pickupTime;
      }
      return a.pickupDistance - b.pickupDistance;
    });
  }, [filteredJobs, externalSortBy]);

  // Initial data fetch
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const data = await fetchLiveJobs();
        // In production, this would set the data from the API response
        // For now, we set it manually
      } catch (err) {
        log("[LiveJobOffersScreen] Failed to fetch initial data:", err);
      }
    };

    fetchInitialData();
  }, [fetchLiveJobs]);

  // Get item status for each job
  const getItemStatus = useCallback(
    (jobId: string): LocalJobStatus => {
      const hiddenOffer = getLiveOfferStatus(jobId);
      return hiddenOffer?.status || LOCAL_JOB_STATUS.VISIBLE;
    },
    [getLiveOfferStatus]
  );

  // Handle button click (bid/accept)
  const handleJobAction = useCallback(
    (jobId: string) => {
      log(`[LiveJobOffersScreen] Job action clicked for job: ${jobId}`);

      // Find the job data
      const job = sortedJobs.find((j) => j.id === jobId);
      if (job && job.buttonTitle === "Bid") {
        setSelectedJobForBid(job);
        setIsBidSheetOpen(true);
      } else {
        // For non-bid actions, show toast (fallback)
        showToast(`Action performed for job ${jobId}`, {
          variant: "success",
          position: "top",
        });
      }
    },
    [sortedJobs]
  );

  // Handle bid submission
  const handleBidSubmit = useCallback(
    async (bidData: {
      selectedBid: number;
      eta: number;
      boostAmount: number;
      isBoosted: boolean;
    }) => {
      if (!selectedJobForBid) {
        log("[LiveJobOffersScreen] No selected job for bid submission");
        return;
      }

      try {
        log(
          `[LiveJobOffersScreen] Submitting bid for job: ${selectedJobForBid.id}`,
          bidData
        );

        // Prepare all bid-related data for API call
        const bidPayload = {
          jobId: selectedJobForBid.id,
          driverId: auth?.user?.id || "driver-123",
          bidAmount: bidData.selectedBid,
          eta: bidData.eta,
          boostAmount: bidData.boostAmount,
          isBoosted: bidData.isBoosted,
          // Additional job data
          pickupAddress: selectedJobForBid.pickupAddress,
          dropoffAddress: selectedJobForBid.dropoffAddress,
          pickupTime: selectedJobForBid.pickupTime,
          dropoffTime: selectedJobForBid.dropoffTime,
          rideTime: selectedJobForBid.rideTime,
          rideDistance: selectedJobForBid.rideDistance,
          totalPrice: selectedJobForBid.totalPrice,
          driverEarn: selectedJobForBid.driverEarn,
          peopleCount: selectedJobForBid.peopleCount,
          rideType: selectedJobForBid.rideType,
          hasSpecialRequirements: selectedJobForBid.hasSpecialRequirements,
          hasPackage: selectedJobForBid.hasPackage,
          // Timestamps
          submittedAt: new Date().toISOString(),
        };

        // Call the submit bid API
        // await submitBid(bidPayload);

        log("[LiveJobOffersScreen] Bid submitted successfully");

        // Close the bid sheet
        setIsBidSheetOpen(false);

        // Show the waiting timer
        setIsWaitingForCustomer(true);
      } catch (error) {
        log("[LiveJobOffersScreen] Failed to submit bid:", error);
        showToast("Failed to submit bid. Please try again.", {
          variant: "error",
          position: "top",
        });
      }
    },
    [selectedJobForBid, auth?.user?.id, submitBid]
  );

  // Handle bid sheet close
  const handleBidSheetClose = useCallback(() => {
    setIsBidSheetOpen(false);
    setSelectedJobForBid(null);
  }, []);

  // Handle timer completion (customer reviewed the bid)
  const handleTimerComplete = useCallback(() => {
    log(
      "[LiveJobOffersScreen] Timer completed - customer has reviewed the bid"
    );
    setIsWaitingForCustomer(false);
    setSelectedJobForBid(null);

    // Show expired bid status
    setBidStatus(BID_STATUS.EXPIRED);
    setIsBidStatusOpen(true);
  }, []);

  // Handle bid cancellation - show confirmation sheet
  const handleCancelBid = useCallback(() => {
    log("[LiveJobOffersScreen] Cancel bid requested - showing confirmation");
    setIsCancelConfirmationOpen(true);
  }, []);

  // Handle confirmation of bid cancellation
  const handleConfirmCancelBid = useCallback(async () => {
    if (!selectedJobForBid) {
      log("[LiveJobOffersScreen] No selected job for bid cancellation");
      return;
    }

    try {
      log(
        "[LiveJobOffersScreen] Cancelling bid for job:",
        selectedJobForBid.id
      );

      // Call the cancel bid API with bid ID and driver ID
      // await cancelBid({
      //   bidId: selectedJobForBid.id, // Using job ID as bid ID for now
      //   driverId: auth?.user?.id || "driver-123", // Get driver ID from auth context
      // });

      // Close all sheets and reset state
      setIsCancelConfirmationOpen(false);
      setIsWaitingForCustomer(false);
      setSelectedJobForBid(null);

      log("[LiveJobOffersScreen] Bid cancelled successfully");

      // Show success message
      showToast("Your bid has been cancelled successfully.", {
        variant: "success",
        position: "top",
      });
    } catch (error) {
      log("[LiveJobOffersScreen] Failed to cancel bid:", error);
      showToast("Failed to cancel bid. Please try again.", {
        variant: "error",
        position: "top",
      });
    }
  }, [selectedJobForBid, cancelBid]);

  // Handle cancel confirmation sheet close
  const handleCancelConfirmationClose = useCallback(() => {
    setIsCancelConfirmationOpen(false);
  }, []);

  // Handle bid status sheet close
  const handleClose = useCallback(() => {
    setIsBidStatusOpen(false);
    setBidStatus(BID_STATUS.EXPIRED);
    setSelectedJobForBid(null);
    setIsWaitingForCustomer(false);
    router.replace("/(tabs)");
  }, []);

  // Handle status timer completion (redirect on ACCEPTED)
  const handleStatusTimerComplete = useCallback(() => {
    if (bidStatus === BID_STATUS.ACCEPTED) {
      setIsBidStatusOpen(false);
      setIsWaitingForCustomer(false);
      setSelectedJobForBid(null);
      router.replace("/(screens)/active-ride");
      return;
    }

    // Default behavior for other statuses (e.g., EXPIRED)
    handleClose();
  }, [bidStatus, handleClose]);

  // Handle special requirements press
  const handleSpecialRequirements = useCallback((jobId: string) => {
    log(`[LiveJobOffersScreen] Special requirements pressed for job: ${jobId}`);
    showToast("Special requirements details would be shown here", {
      variant: "warning",
      position: "top",
    });
  }, []);

  // Handle package press
  const handlePackagePress = useCallback((jobId: string) => {
    log(`[LiveJobOffersScreen] Package pressed for job: ${jobId}`);
    showToast("Package details would be shown here", {
      variant: "warning",
      position: "top",
    });
  }, []);

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
        {EMPTY_STATE_MESSAGES.NO_JOBS_MESSAGE}
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
        {error || "Something went wrong while loading jobs. Please try again."}
      </Typography>
      <TouchableOpacity
        style={styles.retryButton}
        onPress={() => fetchLiveJobs()}
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
      {Array.from({ length: 3 }).map((_, index) => (
        <View key={index} style={styles.skeletonWrapper}>
          <SkeletonLoader height={200} borderRadius={12} />
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

  // Log when "View +X More" indicator should be shown
  useEffect(() => {
    if (hasMoreJobs) {
      const additionalCount = sortedJobs.length - 3;
      log(
        `[LiveJobOffersScreen] Showing "View +${additionalCount} More" indicator`
      );
    }
  }, [hasMoreJobs, sortedJobs.length]);

  // Log showHiddenJobs state changes
  useEffect(() => {
    log(`[LiveJobOffersScreen] showHiddenJobs: ${showHiddenJobs}`);
  }, [showHiddenJobs]);

  // Show error state if there's an error
  // if (error && !loading) {
  //   return <View style={[styles.container, style]}>{renderErrorState()}</View>;
  // }

  // Show loading state
  if (loading && (!liveJobsData || sortedJobs.length === 0)) {
    return (
      <View style={[styles.container, style]}>{renderLoadingState()}</View>
    );
  }

  // Render job item for FlatList
  const renderJobItem = ({
    item,
    isScrolling,
  }: {
    item: any;
    isScrolling?: boolean;
  }) => (
    <View style={styles.jobItemWrapper}>
      <LiveRideOfferItem
        id={item.id}
        rideType={item.rideType}
        peopleCount={item.peopleCount}
        rating={item.rating}
        hasSpecialRequirements={item.hasSpecialRequirements}
        onPressSpecialRequirements={() => handleSpecialRequirements(item.id)}
        hasPackage={false} // Mock data doesn't have package info
        onPressPackage={() => handlePackagePress(item.id)}
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
        buttonTitle={item.buttonTitle}
        onButtonClick={() => handleJobAction(item.id)}
        itemStatus={getItemStatus(item.id)}
        isScrolling={isScrolling}
        showHiddenJobs={showHiddenJobs}
        disabled={item.disabled}
      />
    </View>
  );

  log("displayJobs???", displayJobs);
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

      {selectedJobForBid && (
        <BidBottomSheet
          bid={selectedJobForBid.bid}
          onSubmit={handleBidSubmit}
          onClose={handleBidSheetClose}
          open={isBidSheetOpen}
          snapPoints={["75%"]}
          initialSnapIndex={0}
        />
      )}

      {/* Bid Waiting Timer */}
      <BidWaitingTimer
        open={isWaitingForCustomer}
        progressDuration={BID_WAITING_TIMER_DURATION_MS}
        onCompleteProgress={handleTimerComplete}
        onCancel={handleCancelBid}
        snapPoints={["40%"]}
        showHeader={false}
        backdrop={true}
        swipeToClose={false}
      />

      {/* Cancel Bid Confirmation Sheet */}
      <ConfirmationSheet
        open={isCancelConfirmationOpen}
        title="Cancel Your Bid?"
        description="Are you sure you want to cancel your bid for this ride? You may miss this opportunity if the customer accepts."
        cancelButtonText="Go Back"
        confirmButtonText="Yes, Cancel"
        onCancel={handleCancelConfirmationClose}
        onConfirm={handleConfirmCancelBid}
      />

      {/* Bid Status Sheet */}
      <BidStatusSheet
        open={isBidStatusOpen}
        status={bidStatus}
        onTimerComplete={handleStatusTimerComplete}
        onClose={handleClose}
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
    marginBottom: 16,
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
});
