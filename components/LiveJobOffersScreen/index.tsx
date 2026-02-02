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
 * - Functional "Click here to view +X more" button to expand all jobs
 * - Smart scroll detection to disable swipe gestures during scrolling
 * - Swipe gestures disabled when viewing hidden jobs (prevents re-skipping)
 * - Empty state handling
 * - Error handling and loading states
 * - Integration with swipe/hide functionality
 */

import { textColors } from "@/constants/colors";
import { ACTIVE_TRIP_ROUTES, LIVE_JOB_ENDPOINTS } from "@/constants/endpoints";
import {
  API_CLIENT_TYPES,
  EMPTY_STATE_MESSAGES,
  LOCAL_JOB_STATUS,
  OFFER_TYPES,
  TRIP_OFFER_ACTIONS,
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
import { usePost } from "@/hooks/usePost";
import { logger } from "@/utils/helpers";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Image,
  Platform,
  Pressable,
  RefreshControl,
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
  const [driver] = useDriver();
  const { getLiveOfferStatus } = useDriver();
  const [auth] = useAuth();
  const {
    broadcastOffers,
    updateBroadcastOffer,
    removeBroadcastOffer,
    clearAllBroadcastOffers,
    resetDemoOffers,
  } = useBroadcastJobOffers();
  const {
    showRideOfferModal,
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
  const [isSubmitETALoading, setIsSubmitETALoading] = useState<boolean>(false);

  // API hook for submitting driver response for broadcast offers
  const { execute: submitDriverResponse } = usePost(
    LIVE_JOB_ENDPOINTS.driverResponse,
    API_CLIENT_TYPES.AUCTION
  );

  // API hook for updating ETA (non-blocking, used after trip acceptance)
  const { execute: updateETA } = usePost(
    ACTIVE_TRIP_ROUTES.UPDATE_ETA,
    API_CLIENT_TYPES.ACTIVE_TRIP
  );

  // Reactively track trip-in-progress based on driver context changes
  useEffect(() => {
    const hasActiveTrip = !!driver?.retrievalId && !!driver?.tripId;
    setIsAnyTripInProgress(hasActiveTrip);
  }, [driver?.retrievalId, driver?.tripId]);

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
      `[LiveJobOffersScreen] broadcastOffers length: ${broadcastOffers?.length || 0
      }`
    );
    log(`[LiveJobOffersScreen] showHiddenJobs: ${showHiddenJobs}`);

    if (!broadcastOffers || broadcastOffers.length === 0) {
      log(`[LiveJobOffersScreen] No broadcast offers available`);
      return [];
    }

    let filtered: any[];

    if (showHiddenJobs) {
      // Show all offers (offered, accepted, skipped, hidden, expired, rejected, bidding)
      filtered = broadcastOffers;
      log(
        `[LiveJobOffersScreen] Showing all ${broadcastOffers.length} broadcast offers (including hidden/skipped/expired/rejected)`
      );
    } else {
      // Show active offers, and offers that can be re-bid (rejected/expired)
      filtered = broadcastOffers.filter(
        (offer) =>
          offer.status === "offered" ||
          offer.status === "bidding" ||
          offer.status === "accepted" ||
          offer.status === "rejected" ||
          offer.status === "expired"
      );
      log(
        `[LiveJobOffersScreen] Showing ${filtered.length} visible offers out of ${broadcastOffers.length} total`
      );
    }

    log(`[LiveJobOffersScreen] Returning ${filtered.length} offers`);
    return filtered;
  }, [broadcastOffers, showHiddenJobs]);

  // Sort jobs based on external sort criteria
  // This sorting works for all offer types including demo offers, live offers, and hired offers
  const sortedJobs = useMemo(() => {
    log(`[LiveJobOffersScreen] sortedJobs useMemo triggered`);
    log(
      `[LiveJobOffersScreen] filteredJobs length: ${filteredJobs?.length || 0}`
    );
    log(`[LiveJobOffersScreen] sortBy: ${externalSortBy}`);

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

    log(`[LiveJobOffersScreen] sortedJobs result length: ${sorted.length}`);
    return sorted;
  }, [filteredJobs, externalSortBy]);

  // Data is now managed by the BroadcastJobOffersContext
  // No need for initial data fetch as data comes from global listeners

  // Get item status for each job
  const getItemStatus = useCallback(
    (jobId: string): LocalJobStatus | "expired" | "accepted" | "offered" | "rejected" | "bidding" | "offer-expired" => {
      const hiddenOffer = getLiveOfferStatus(jobId);
      const broadcastOffer = broadcastOffers.find(
        (offer) => offer.id === jobId
      );

      // Check if the offer is truly expired in the broadcast context FIRST (highest priority)
      if (broadcastOffer?.status === "offer-expired") {
        console.log(`  - returning offer-expired status (highest priority)`);
        return "offer-expired";
      }

      // Check if the bid is expired in the broadcast context
      if (broadcastOffer?.status === "expired") {
        console.log(`  - returning bid expired status`);
        return "expired";
      }

      // Check if the offer is rejected in the broadcast context
      if (broadcastOffer?.status === "rejected") {
        console.log(`  - returning rejected status`);
        return "rejected";
      }

      // Check if the offer is bidding in the broadcast context
      if (broadcastOffer?.status === "bidding") {
        console.log(`  - returning bidding status`);
        return "bidding";
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

      // Check job status
      const isExpired = job.status === "expired";
      const isRejected = job.status === "rejected";
      const isBidding = job.status === "bidding";

      // Allow rebidding for rejected or expired bids
      // This check must come BEFORE the isBidding check to handle cases where 
      // the status might be stuck or transitioning
      if ((isExpired || isRejected) && job.bidable) {
        log(
          `[LiveJobOffersScreen] Job ${jobId} is ${job.status}, allowing rebid. Resetting status to offered.`
        );
        // Reset status to "offered" to allow rebidding
        updateBroadcastOffer(jobId, { status: "offered" });
        // Proceed with opening the bid sheet
      } else if (isBidding) {
        log(`[LiveJobOffersScreen] Job ${jobId} is already in bidding state, waiting for customer`);
        showToast("Waiting for customer response...", { variant: "warning", position: "top" });
        return;
      }
      if (job.bidable) {
        // Store the selected job for bid submission
        setSelectedJobForBid(job);

        // Handle bidable offers - show bid bottom sheet
        const bidData = {
          amount: job?.fare || job?.tripOffer?.fare, // Default bid amount - this should come from the job data
          bosstedAmount: 5,
          driverEarn: job?.driverEarn,
          numberOfBids: job?.peopleCount,
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
    [sortedJobs, showRideOfferModal, showBidBottomSheet, updateBroadcastOffer]
  );

  // Handle bid submission from bid bottom sheet
  const handleBidSubmitted = useCallback(
    async (bidData: any, job?: any) => {
      // Use job parameter if provided, otherwise fall back to selectedJobForBid
      const jobToUse = job || selectedJobForBid;

      try {
        log("[LiveJobOffersScreen] Bid submitted from bottom sheet:", bidData);
        log("[LiveJobOffersScreen] Job data:", jobToUse);

        if (!jobToUse) {
          log("[LiveJobOffersScreen] No job data available for bid submission");
          return;
        }

        // Skip API call for demo offers
        if (jobToUse.id?.startsWith("demo-") || jobToUse.tripOffer?.tripId?.startsWith("demo-")) {
          log("[LiveJobOffersScreen] Demo offer detected - skipping API call for bid");
          showToast("Demo offer: Bid submitted locally (no API call)", {
            variant: "success",
            position: "top",
          });
          setSelectedJobForBid(null);
          showBidWaitingTimer();
          log("[LiveJobOffersScreen] Showing bid waiting timer for demo offer");
          return;
        }

        // Call the submit bid API with the selected bid amount, eta, boostAmount and tripId
        const result = await submitBidForBroadcastOffer(
          jobToUse.tripOffer.tripId,
          bidData.selectedBid || jobToUse.fare || jobToUse.tripOffer?.fare,
          bidData.eta,
          bidData.isBoosted ? bidData.boostAmount : undefined
        );

        if (result?.success) {
          log("[LiveJobOffersScreen] Bid submitted successfully");

          // Update offer status to "bidding" to prevent expiration
          // This ensures the offer won't expire while waiting for customer response
          updateBroadcastOffer(jobToUse.tripOffer.tripId, {
            status: "bidding" as any, // Set status to bidding to prevent expiration
          });
          log("[LiveJobOffersScreen] Updated offer status to 'bidding' to prevent expiration");

          // For broadcast offers, don't change status to "accepted" immediately
          // The offer should remain bidable until customer accepts or offer expires
          // Only close the bid modal and show waiting timer
          setSelectedJobForBid(null);

          // Show waiting timer for customer response
          showBidWaitingTimer(jobToUse);
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

        // If trip is expired, remove it from the list as per user request
        if (errorMessage.toLowerCase().includes("expired")) {
          if (jobToUse?.id) {
            removeBroadcastOffer(jobToUse.id);
            log(`[LiveJobOffersScreen] Removed expired offer ${jobToUse.id} after failed bid`);
          }
        }
      }
    },
    [
      submitBidForBroadcastOffer,
      selectedJobForBid,
      updateBroadcastOffer,
      removeBroadcastOffer,
      showBidWaitingTimer,
    ]
  );

  // Handle ETA submission for accept flow (broadcast offers)
  const handleETASubmit = useCallback(
    async (eta: number) => {
      if (!selectedJobForAccept) {
        log("[LiveJobOffersScreen] No selected job for ETA submission");
        return;
      }

      const driverId = auth?.user?.id;
      const tripId = selectedJobForAccept.tripOffer?.tripId;

      if (!driverId || !tripId) {
        log("[LiveJobOffersScreen] Missing driverId or tripId");
        showToast("Unable to accept offer. Please try again.", {
          variant: "error",
          position: "top",
        });
        return;
      }

      // Skip API call for demo offers
      if (selectedJobForAccept.id?.startsWith("demo-") || tripId?.startsWith("demo-")) {
        log("[LiveJobOffersScreen] Demo offer detected - skipping API call for ETA");
        showToast("Demo offer: Ride accepted locally (no API call)", {
          variant: "success",
          position: "top",
        });

        // Mark the offer as accepted in the context
        updateBroadcastOffer(selectedJobForAccept.id, { status: "accepted" });
        log(
          `[LiveJobOffersScreen] Marked demo job ${selectedJobForAccept.id} as accepted`
        );

        // Close the ETA modal
        setIsETAModalOpen(false);
        setSelectedJobForAccept(null);

        // Don't redirect for demo offers - just show success message
        return;
      }

      try {
        setIsSubmitETALoading(true);
        log(
          `[LiveJobOffersScreen] Submitting ETA for broadcast offer: ${selectedJobForAccept.id}`,
          `tripId: ${tripId}, ETA: ${eta}`
        );

        // Call the API directly for broadcast offers
        await submitDriverResponse({
          driverId: driverId,
          tripId: tripId,
          response: TRIP_OFFER_ACTIONS.ACCEPT,
          eta: eta, // ETA is sent but will be ignored by backend for non-biddable offers
        });

        log("[LiveJobOffersScreen] ETA submitted successfully for broadcast offer");

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

        // Add a small delay before redirecting to allow backend to initialize the trip
        // This prevents "Active trip resource not found" error
        log("[LiveJobOffersScreen] Waiting for backend to initialize trip before redirecting...");
        await new Promise((resolve) => setTimeout(resolve, 1500)); // 1.5 second delay

        // Non-blocking: Try to update ETA in the database (don't block navigation if it fails)
        // This is for non-biddable offers where ETA was provided but may not be stored in DB
        try {
          log("[LiveJobOffersScreen] Attempting to update ETA in database (non-blocking)...");
          await updateETA({
            tripId: tripId,
            driverId: driverId,
            eta: eta,
          });
          log("[LiveJobOffersScreen] ✅ ETA updated in database successfully");
        } catch (etaError) {
          // Don't block the user - just notify them that ETA update failed
          log("[LiveJobOffersScreen] ⚠️ Failed to update ETA in database (non-blocking):", etaError);
          showToast(
            "Ride accepted! ETA update failed. You can update it later during the active ride.",
            {
              variant: "error",
              position: "top",
            }
          );
        }

        // Redirect to active ride screen
        log("[LiveJobOffersScreen] Redirecting to active-ride screen");
        router.replace("/(screens)/active-ride");
      } catch (error) {
        log("[LiveJobOffersScreen] Failed to submit ETA for broadcast offer:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to accept ride offer. Please try again.";
        showToast(errorMessage, {
          variant: "error",
          position: "top",
        });

        // If trip is expired, remove it from the list
        if (errorMessage.toLowerCase().includes("expired")) {
          if (selectedJobForAccept?.id) {
            removeBroadcastOffer(selectedJobForAccept.id);
            log(`[LiveJobOffersScreen] Removed expired offer ${selectedJobForAccept.id} after failed ETA`);
          }
          setIsETAModalOpen(false);
          setSelectedJobForAccept(null);
        }
        // On error, keep the ETA modal open so user can retry
      } finally {
        setIsSubmitETALoading(false);
      }
    },
    [selectedJobForAccept, auth, submitDriverResponse, updateBroadcastOffer, removeBroadcastOffer, updateETA, showToast, log]
  );

  // Handle "Click here to view +X more" click
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

  // Handle pull-to-refresh
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    log("[LiveJobOffersScreen] Pull-to-refresh triggered");
    try {
      // Reset demo offers to default state
      if (resetDemoOffers) {
        await resetDemoOffers();
        log("[LiveJobOffersScreen] Demo offers reset successfully");
      } else {
        // Fallback: clear all and let context re-initialize
        clearAllBroadcastOffers();
        log("[LiveJobOffersScreen] Cleared all offers - will re-initialize");
      }
    } catch (error) {
      log("[LiveJobOffersScreen] Error refreshing offers:", error);
    } finally {
      setRefreshing(false);
    }
  }, [resetDemoOffers, clearAllBroadcastOffers, log]);

  const handleShowSpecialRequirements = (data: any, offerId?: string) => {
    // Check if this is a demo offer and data is missing
    if (offerId?.startsWith("demo-") && !data) {
      // Provide dummy special requirements data for demo offers
      const dummyData = {
        totalPassengers: 2,
        bags: 3,
        pets: true,
        wheelchair: false,
        childSeat: {
          infant: 0,
          toddler: 1,
          booster: 0,
        },
        armedDriver: false,
        driverLanguage: "English",
      };
      openSpecialRequirements(dummyData);
    } else {
      // Open the special requirements modal with provided data
      openSpecialRequirements(data || {});
    }
  };

  const handleShowPackage = (data: any, offerId?: string) => {
    // Check if this is a demo offer and data is missing
    if (offerId?.startsWith("demo-") && !data) {
      // Provide dummy package info data for demo offers
      const dummyData = {
        numberOfPackages: 2,
        weight: "5.5 Kg",
        phoneNumber: "+1 (555) 123-4567",
        recipientName: "John Doe",
        instructions:
          "Please handle with care. Deliver to the front door. Ring the doorbell twice.",
      };
      openPackageInfo(dummyData);
    } else {
      // Open the package info modal with provided data
      openPackageInfo(data || {});
    }
  };

  // Render "Click here to view +X more" indicator
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

  // Log when "Click here to view +X more" indicator should be shown
  useEffect(() => {
    if (hasMoreJobs) {
      const additionalCount = sortedJobs.length - 3;
      log(
        `[LiveJobOffersScreen] Showing "Click here to view +${additionalCount} more" indicator`
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
    // IMPORTANT: Distinguish between:
    // - "expired" = bid expired (allow rebidding if bidable)
    // - "offer-expired" = entire offer/trip expired (disable all actions)
    let isDisabled = false;

    // Check if action has been taken
    if (item.status === "accepted") {
      isDisabled = true;
    } else if (item.status === "skipped") {
      isDisabled = true;
    } else if (item.status === "hidden") {
      isDisabled = true;
    } else if (item.status === "offer-expired") {
      // Offer itself expired - disable all actions (no rebidding allowed)
      isDisabled = true;
    } else if (item.status === "expired" && item.bidable) {
      // Bid expired but offer still active - allow rebidding
      isDisabled = false;
    } else if (item.status === "rejected" && item.bidable) {
      // Bid rejected but offer still active - allow rebidding
      isDisabled = false;
    } else if (item.status === "expired" && !item.bidable) {
      // Non-bidable offers that are expired should be disabled
      isDisabled = true;
    } else {
      isDisabled = false;
    }

    // Disable if another offer is being processed
    if (isAnotherOfferProcessing) {
      isDisabled = true;
    }

    // Handle item press to navigate to trip details
    // Only navigate if not disabled and not pressing the button area
    const handleItemPress = () => {
      if (!isDisabled) {
        router.push({
          pathname: "/(screens)/trip-details",
          params: { offerId: item.id },
        });
      }
    };

    return (
      <Pressable
        style={({ pressed }) => [
          styles.jobItemWrapper,
          pressed && !isDisabled && styles.jobItemPressed,
        ]}
        onPress={handleItemPress}
        disabled={isDisabled}
      >
        <LiveRideOfferItem
          type={type}
          id={item.id}
          rideType={item.rideType}
          peopleCount={item.peopleCount}
          rating={item.rating}
          hasSpecialRequirements={item.hasSpecialRequirements}
          onPressSpecialRequirements={() => {
            handleShowSpecialRequirements(item?.specialRequirements, item.id);
          }}
          onPressPackage={() => {
            handleShowPackage(item?.packageInfo, item.id);
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
          expiredAt={item.expiredAt}
          carType={item.carType}
        />
      </Pressable>
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
          contentContainerStyle={[styles.scrollContent, { paddingBottom: Platform.OS === "ios" && showAllJobs ? "20%" : 20 }]}
          ListFooterComponent={hasMoreJobs ? renderViewMoreIndicator : null}
          onScrollBeginDrag={handleScrollBeginDrag}
          onScrollEndDrag={handleScrollEndDrag}
          onMomentumScrollEnd={handleScrollEndDrag}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
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
  },
  jobItemWrapper: {
    marginBottom: 16,
  },
  jobItemPressed: {
    opacity: 0.9,
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
    marginTop: Platform.OS === "android" ? 8 : -16,
    paddingBottom: 100,
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
    paddingHorizontal: 20,
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
