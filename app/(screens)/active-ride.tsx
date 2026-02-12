import BottomSheet from "@/components/BottomSheet";
import ConfirmationModal from "@/components/ConfirmationModal";
import ETABottomSheet from "@/components/ETABottomSheet";
import TextArea from "@/components/Form/TextArea";
import Toggle from "@/components/Form/Toggle";
import Header from "@/components/Header";
import JobDetails from "@/components/JobDetails";
import RideAction from "@/components/RideAction";
import RideLocations from "@/components/RideLocations";
import RideMap from "@/components/RideMap";
import { activeTripApiClient } from "@/config/apiConfig";
import { textColors } from "@/constants/colors";
import {
  openPhoneDialer,
  openWhatsApp,
  tripDetailsApiResponseToJobOffer,
} from "@/utils/helpers";

import AddTollBottomSheet from "@/components/AddTollBottomSheet";
import { useToast } from "@/components/Toast";
import Typography from "@/components/Typography";
import { ACTIVE_TRIP_ROUTES } from "@/constants/endpoints";
import {
  ACTION_ICON_SOURCE_MAP,
  API_CLIENT_TYPES,
  CANCEL_RIDE_REASONS,
  CancelRideReason,
  CAR_TYPE,
  DRIVER_ACTIONS,
  RIDE_STATES,
  RIDE_TYPES,
  RideToggleLabel,
  SOS_NUMBERS,
  SWIPE_BUTTON_STATES,
  SwipeButtonState,
  VEHICLE_ISSUE_OFFLINE_HOURS,
} from "@/constants/global";
import { ACTIVE_RIDE_CONTENT_KEYS } from "@/content/active-ride-keys";
import { useAuth } from "@/context/AuthContext";
import { useBroadcastJobOffers } from "@/context/BroadcastJobOffersContext";
import { useChat } from "@/context/ChatContext";
import { useDriver } from "@/context/DriverContext";
import { useActiveTripSocket } from "@/hooks/useActiveTripSocket";
import { useFetch } from "@/hooks/useFetch";
import { useGetContent } from "@/hooks/useGetContent";
import { usePost } from "@/hooks/usePost";
import { useSocket } from "@/hooks/useSocket";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  PixelRatio,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

export default function ActiveRideScreen() {
  const { getContent } = useGetContent();

  // page content
  const {
    headerTitle,
    headerEnRoute,
    headerOnScene,
    headerLoaded,
    headerStop,
    headerCompleted,
    toggleMap,
    toggleDetails,
    loadingTrip,
    loadingAddress,
    errorTitle,
    errorMessage,
    errorRetry,
    completionLoading,
    completionSubtext,
    swipeMarkArrived,
    swipeStartRide,
    swipeCompleteRide,
    swipeRestartRide,
    swipeProcessing,
    toastCirclingNotified,
    toastCirclingFailed,
    toastMarkedArrived,
    toastRideStarted,
    toastRideCompleted,
    toastRideStopped,
    toastActionFailed,
    toastPhoneUnavailable,
    toastChatFailed,
    toastCancelFailed,
    toastTripCancelled,
    toastCancelTripFailed,
    toastEtaUpdated,
    toastEtaFailed,
    toastEtaError,
    contactSheetTitle,
    contactPhoneLabel,
    contactPhoneNa,
    contactCallCellular,
    contactChat,
    contactWhatsapp,
    sosSheetTitle,
    sosCallDispatch,
    sosCall911,
    cancelSheetTitle,
    cancelSelectReasonLabel,
    cancelChooseReason,
    cancelAddCommentsLabel,
    cancelCommentsPlaceholder,
    cancelContinue,
    cancelReasonsSheetTitle,
    cancelReasonVehicleIssue,
    cancelReasonCustomerNoShow,
    cancelReasonWrongAddress,
    cancelReasonSafetyConcern,
    cancelReasonPersonalEmergency,
    cancelReasonOther,
    confirmTitle,
    confirmDescriptionVehicleIssuePrefix,
    confirmDescriptionVehicleIssueSuffix,
    confirmDescriptionDefault,
    confirmCancel,
    confirmConfirm,
    confirmLoading,
    etaSheetTitle,
    etaSheetDescription,
    etaFetching,
    etaUpdating,
    etaButton,
    errorLoadTrip,
    errorEtaMissing,
  } = useMemo(() => {
    const get = getContent;
    return {
      headerTitle: get(ACTIVE_RIDE_CONTENT_KEYS.HEADER_TITLE),
      headerEnRoute: get(ACTIVE_RIDE_CONTENT_KEYS.HEADER_EN_ROUTE),
      headerOnScene: get(ACTIVE_RIDE_CONTENT_KEYS.HEADER_ON_SCENE),
      headerLoaded: get(ACTIVE_RIDE_CONTENT_KEYS.HEADER_LOADED),
      headerStop: get(ACTIVE_RIDE_CONTENT_KEYS.HEADER_STOP),
      headerCompleted: get(ACTIVE_RIDE_CONTENT_KEYS.HEADER_COMPLETED),
      toggleMap: get(ACTIVE_RIDE_CONTENT_KEYS.TOGGLE_MAP),
      toggleDetails: get(ACTIVE_RIDE_CONTENT_KEYS.TOGGLE_DETAILS),
      loadingTrip: get(ACTIVE_RIDE_CONTENT_KEYS.LOADING_TRIP),
      loadingAddress: get(ACTIVE_RIDE_CONTENT_KEYS.LOADING_ADDRESS),
      errorTitle: get(ACTIVE_RIDE_CONTENT_KEYS.ERROR_TITLE),
      errorMessage: get(ACTIVE_RIDE_CONTENT_KEYS.ERROR_MESSAGE),
      errorRetry: get(ACTIVE_RIDE_CONTENT_KEYS.ERROR_RETRY),
      completionLoading: get(ACTIVE_RIDE_CONTENT_KEYS.COMPLETION_LOADING),
      completionSubtext: get(ACTIVE_RIDE_CONTENT_KEYS.COMPLETION_SUBTEXT),
      swipeMarkArrived: get(ACTIVE_RIDE_CONTENT_KEYS.SWIPE_MARK_ARRIVED),
      swipeStartRide: get(ACTIVE_RIDE_CONTENT_KEYS.SWIPE_START_RIDE),
      swipeCompleteRide: get(ACTIVE_RIDE_CONTENT_KEYS.SWIPE_COMPLETE_RIDE),
      swipeRestartRide: get(ACTIVE_RIDE_CONTENT_KEYS.SWIPE_RESTART_RIDE),
      swipeProcessing: get(ACTIVE_RIDE_CONTENT_KEYS.SWIPE_PROCESSING),
      toastCirclingNotified: get(
        ACTIVE_RIDE_CONTENT_KEYS.TOAST_CIRCLING_NOTIFIED,
      ),
      toastCirclingFailed: get(ACTIVE_RIDE_CONTENT_KEYS.TOAST_CIRCLING_FAILED),
      toastMarkedArrived: get(ACTIVE_RIDE_CONTENT_KEYS.TOAST_MARKED_ARRIVED),
      toastRideStarted: get(ACTIVE_RIDE_CONTENT_KEYS.TOAST_RIDE_STARTED),
      toastRideCompleted: get(ACTIVE_RIDE_CONTENT_KEYS.TOAST_RIDE_COMPLETED),
      toastRideStopped: get(ACTIVE_RIDE_CONTENT_KEYS.TOAST_RIDE_STOPPED),
      toastActionFailed: get(ACTIVE_RIDE_CONTENT_KEYS.TOAST_ACTION_FAILED),
      toastPhoneUnavailable: get(
        ACTIVE_RIDE_CONTENT_KEYS.TOAST_PHONE_UNAVAILABLE,
      ),
      toastChatFailed: get(ACTIVE_RIDE_CONTENT_KEYS.TOAST_CHAT_FAILED),
      toastCancelFailed: get(ACTIVE_RIDE_CONTENT_KEYS.TOAST_CANCEL_FAILED),
      toastTripCancelled: get(ACTIVE_RIDE_CONTENT_KEYS.TOAST_TRIP_CANCELLED),
      toastCancelTripFailed: get(
        ACTIVE_RIDE_CONTENT_KEYS.TOAST_CANCEL_TRIP_FAILED,
      ),
      toastEtaUpdated: get(ACTIVE_RIDE_CONTENT_KEYS.TOAST_ETA_UPDATED),
      toastEtaFailed: get(ACTIVE_RIDE_CONTENT_KEYS.TOAST_ETA_FAILED),
      toastEtaError: get(ACTIVE_RIDE_CONTENT_KEYS.TOAST_ETA_ERROR),
      contactSheetTitle: get(ACTIVE_RIDE_CONTENT_KEYS.CONTACT_SHEET_TITLE),
      contactPhoneLabel: get(ACTIVE_RIDE_CONTENT_KEYS.CONTACT_PHONE_LABEL),
      contactPhoneNa: get(ACTIVE_RIDE_CONTENT_KEYS.CONTACT_PHONE_NA),
      contactCallCellular: get(ACTIVE_RIDE_CONTENT_KEYS.CONTACT_CALL_CELLULAR),
      contactChat: get(ACTIVE_RIDE_CONTENT_KEYS.CONTACT_CHAT),
      contactWhatsapp: get(ACTIVE_RIDE_CONTENT_KEYS.CONTACT_WHATSAPP),
      sosSheetTitle: get(ACTIVE_RIDE_CONTENT_KEYS.SOS_SHEET_TITLE),
      sosCallDispatch: get(ACTIVE_RIDE_CONTENT_KEYS.SOS_CALL_DISPATCH),
      sosCall911: get(ACTIVE_RIDE_CONTENT_KEYS.SOS_CALL_911),
      cancelSheetTitle: get(ACTIVE_RIDE_CONTENT_KEYS.CANCEL_SHEET_TITLE),
      cancelSelectReasonLabel: get(
        ACTIVE_RIDE_CONTENT_KEYS.CANCEL_SELECT_REASON_LABEL,
      ),
      cancelChooseReason: get(ACTIVE_RIDE_CONTENT_KEYS.CANCEL_CHOOSE_REASON),
      cancelAddCommentsLabel: get(
        ACTIVE_RIDE_CONTENT_KEYS.CANCEL_ADD_COMMENTS_LABEL,
      ),
      cancelCommentsPlaceholder: get(
        ACTIVE_RIDE_CONTENT_KEYS.CANCEL_COMMENTS_PLACEHOLDER,
      ),
      cancelContinue: get(ACTIVE_RIDE_CONTENT_KEYS.CANCEL_CONTINUE),
      cancelReasonsSheetTitle: get(
        ACTIVE_RIDE_CONTENT_KEYS.CANCEL_REASONS_SHEET_TITLE,
      ),
      cancelReasonVehicleIssue: get(
        ACTIVE_RIDE_CONTENT_KEYS.CANCEL_REASON_VEHICLE_ISSUE,
      ),
      cancelReasonCustomerNoShow: get(
        ACTIVE_RIDE_CONTENT_KEYS.CANCEL_REASON_CUSTOMER_NO_SHOW,
      ),
      cancelReasonWrongAddress: get(
        ACTIVE_RIDE_CONTENT_KEYS.CANCEL_REASON_WRONG_ADDRESS,
      ),
      cancelReasonSafetyConcern: get(
        ACTIVE_RIDE_CONTENT_KEYS.CANCEL_REASON_SAFETY_CONCERN,
      ),
      cancelReasonPersonalEmergency: get(
        ACTIVE_RIDE_CONTENT_KEYS.CANCEL_REASON_PERSONAL_EMERGENCY,
      ),
      cancelReasonOther: get(ACTIVE_RIDE_CONTENT_KEYS.CANCEL_REASON_OTHER),
      confirmTitle: get(ACTIVE_RIDE_CONTENT_KEYS.CONFIRM_TITLE),
      confirmDescriptionVehicleIssuePrefix: get(
        ACTIVE_RIDE_CONTENT_KEYS.CONFIRM_DESCRIPTION_VEHICLE_ISSUE_PREFIX,
      ),
      confirmDescriptionVehicleIssueSuffix: get(
        ACTIVE_RIDE_CONTENT_KEYS.CONFIRM_DESCRIPTION_VEHICLE_ISSUE_SUFFIX,
      ),
      confirmDescriptionDefault: get(
        ACTIVE_RIDE_CONTENT_KEYS.CONFIRM_DESCRIPTION_DEFAULT,
      ),
      confirmCancel: get(ACTIVE_RIDE_CONTENT_KEYS.CONFIRM_CANCEL),
      confirmConfirm: get(ACTIVE_RIDE_CONTENT_KEYS.CONFIRM_CONFIRM),
      confirmLoading: get(ACTIVE_RIDE_CONTENT_KEYS.CONFIRM_LOADING),
      etaSheetTitle: get(ACTIVE_RIDE_CONTENT_KEYS.ETA_SHEET_TITLE),
      etaSheetDescription: get(ACTIVE_RIDE_CONTENT_KEYS.ETA_SHEET_DESCRIPTION),
      etaFetching: get(ACTIVE_RIDE_CONTENT_KEYS.ETA_FETCHING),
      etaUpdating: get(ACTIVE_RIDE_CONTENT_KEYS.ETA_UPDATING),
      etaButton: get(ACTIVE_RIDE_CONTENT_KEYS.ETA_BUTTON),
      errorLoadTrip: get(ACTIVE_RIDE_CONTENT_KEYS.ERROR_LOAD_TRIP),
      errorEtaMissing: get(ACTIVE_RIDE_CONTENT_KEYS.ERROR_ETA_MISSING),
    };
  }, [getContent]);
  // end page content

  // Header title by ride state (from dynamic content)
  const headerTitleByState = useMemo(
    () => ({
      [RIDE_STATES.EN_ROUTE]: headerEnRoute,
      [RIDE_STATES.ON_SCENE]: headerOnScene,
      [RIDE_STATES.LOADED]: headerLoaded,
      [RIDE_STATES.STOPPED]: headerStop,
      [RIDE_STATES.COMPLETED]: headerCompleted,
    }),
    [headerEnRoute, headerOnScene, headerLoaded, headerStop, headerCompleted],
  );

  // Swipe button title by state (from dynamic content)
  const swipeTitleByState = useMemo(
    () => ({
      [SWIPE_BUTTON_STATES.MARK_ARRIVED]: swipeMarkArrived,
      [SWIPE_BUTTON_STATES.START_RIDE]: swipeStartRide,
      [SWIPE_BUTTON_STATES.END_RIDE]: swipeCompleteRide,
      [SWIPE_BUTTON_STATES.RESTART_RIDE]: swipeRestartRide,
    }),
    [swipeMarkArrived, swipeStartRide, swipeCompleteRide, swipeRestartRide],
  );

  // Toggle labels from dynamic content (Map / Details)
  const labels: [RideToggleLabel, RideToggleLabel] = useMemo(
    () => [toggleMap as RideToggleLabel, toggleDetails as RideToggleLabel],
    [toggleMap, toggleDetails],
  );

  // Cancel reason display list (same order as CANCEL_RIDE_REASONS for mapping)
  const cancelReasonDisplayList = useMemo(
    () => [
      cancelReasonVehicleIssue,
      cancelReasonCustomerNoShow,
      cancelReasonWrongAddress,
      cancelReasonSafetyConcern,
      cancelReasonPersonalEmergency,
      cancelReasonOther,
    ],
    [
      cancelReasonVehicleIssue,
      cancelReasonCustomerNoShow,
      cancelReasonWrongAddress,
      cancelReasonSafetyConcern,
      cancelReasonPersonalEmergency,
      cancelReasonOther,
    ],
  );

  // Keep bottom sheet snapPoints stable to avoid re-renders (and TextInput focus loss)
  // while the active trip screen updates in real-time (socket/location updates).
  const updateEtaSnapPoints = useMemo<(string | number)[]>(
    () => ["40%", "60%"],
    [],
  );
  const updateEtaSnapPointsWhenKeyboardVisible = useMemo<(string | number)[]>(
    () => ["90%", "95%"],
    [],
  );

  // Get params from navigation
  const params = useLocalSearchParams();
  const {
    getRetrievalId,
    getTripId,
    setRetrievalId,
    setTripId,
    setRideState,
    getRideState,
    removeRideState,
    removeRetrievalId,
    removeTripId,
    getLastBidETA,
    clearLastBidETA,
  } = useDriver();
  const [auth] = useAuth();
  const driverId = auth?.user?.id;
  const { clearNonDemoBroadcastOffers } = useBroadcastJobOffers();
  const { openChat, customerInfo, loadCustomerInfo } = useChat();
  const { showToast } = useToast();

  // Active trip socket connection
  const { connectActiveTripSocket, disconnectActiveTripSocket, socketStatus } =
    useActiveTripSocket();

  // Offers socket connection (for reconnecting after trip completion)
  const {
    connectSocket: connectOffersSocket,
    disconnectSocket: disconnectOffersSocket,
  } = useSocket({
    driverId: driverId,
  });

  const [toggleValue, setToggleValue] = useState<RideToggleLabel>(
    () => toggleMap as RideToggleLabel,
  );

  const [isDriverReachedOnPickup, setIsDriverReachedOnPickup] =
    useState<boolean>(false);

  const [swipeButtonState, setSwipeButtonState] = useState<SwipeButtonState>(
    SWIPE_BUTTON_STATES.MARK_ARRIVED,
  );

  // Dynamic width for header toggle (Map/Details) similar to Home screen status toggle
  const { width: screenWidth } = useWindowDimensions();
  const headerToggleSize = useMemo(() => {
    // IMPORTANT: Toggle "labeled" variant splits width into 2 equal cells.
    // Each cell has paddingHorizontal: 8 and label fontSize: 12 with numberOfLines=1,
    // so width must be computed from the longest label's rendered width to avoid truncation.
    const fontScale = PixelRatio.getFontScale?.() ?? 1;
    const labelFontSize = 12;
    const cellPaddingX = 8 * 2; // left+right padding per cell (Toggle styles.labeledCell)
    const extraBuffer = 6; // small safety buffer for bold weight + wider glyphs

    const longestLabelLength = Math.max(...labels.map((l) => String(l).length));

    // Approximate average glyph width for SF Pro @ 12px: ~0.52em per character.
    // Multiply by fontScale to respect accessibility font scaling.
    const approxCharWidth = labelFontSize * 0.52 * fontScale;
    const requiredHalfWidth =
      longestLabelLength * approxCharWidth + cellPaddingX + extraBuffer;
    const requiredTotalWidth = Math.ceil(requiredHalfWidth * 2);

    // Keep it within the screen so it never goes off-screen.
    // We allow a large share of the width because labels must never truncate.
    const maxAllowed = Math.floor(screenWidth * 0.9);
    const finalWidth = Math.min(maxAllowed, requiredTotalWidth);

    return { width: finalWidth, height: 28 } as const;
  }, [screenWidth, labels]);

  // Ride state management
  const [currentRideState, setCurrentRideState] = useState<string>(
    RIDE_STATES.EN_ROUTE,
  );
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);
  const [isCompletingRide, setIsCompletingRide] = useState<boolean>(false);
  const [isMapReady, setIsMapReady] = useState<boolean>(false);
  // Data fetching state (declared early so it's available for UI gating)
  const [jobOfferData, setJobOfferData] = useState<any>(null);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const [dataError, setDataError] = useState<string | null>(null);

  // Swipe button visibility + animation
  const swipeOpacity = useRef(new Animated.Value(0)).current;
  const showSwipe =
    !isActionLoading && !isCompletingRide && isMapReady && !isLoadingData;
  useEffect(() => {
    if (showSwipe) {
      swipeOpacity.setValue(0);
      Animated.timing(swipeOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    } else {
      swipeOpacity.stopAnimation();
      swipeOpacity.setValue(0);
    }
  }, [showSwipe, swipeOpacity]);

  // (moved above)

  // API call for fetching active trip data when no params
  const {
    data: apiData,
    loading: apiLoading,
    error: apiError,
    execute: fetchActiveTrip,
  } = useFetch<any>(
    driverId ? `${ACTIVE_TRIP_ROUTES.RETRIEVAL_ID}/${driverId}` : "",
    API_CLIENT_TYPES.ACTIVE_TRIP,
  );

  // API call for driver actions
  const { execute: submitDriverAction } = usePost(
    ACTIVE_TRIP_ROUTES.DRIVER_ACTION,
    API_CLIENT_TYPES.ACTIVE_TRIP,
  );
  const { execute: cancelTrip, loading: isCancellingTrip } = usePost(
    ACTIVE_TRIP_ROUTES.CANCEL,
    API_CLIENT_TYPES.ACTIVE_TRIP,
  );
  const { execute: updateETA, loading: isUpdatingETA } = usePost(
    ACTIVE_TRIP_ROUTES.UPDATE_ETA,
    API_CLIENT_TYPES.ACTIVE_TRIP,
  );

  // Fetch driver ETA
  const [driverETA, setDriverETA] = useState<{
    eta: number;
    note?: string;
  } | null>(null);

  const { execute: fetchETA, loading: isFetchingETA } = useFetch(
    ACTIVE_TRIP_ROUTES.GET_ETA,
    API_CLIENT_TYPES.ACTIVE_TRIP,
  );

  // Function to fetch driver ETA
  const loadDriverETA = useCallback(async () => {
    if (!driverId || !jobOfferData?.id) {
      console.log("⚠️ [Get ETA] Missing required data:", {
        driverId,
        jobOfferId: jobOfferData?.id,
      });
      return;
    }

    try {
      // Use tripNumber if available, otherwise use id
      const tripIdToSend =
        jobOfferData.tripNumber || jobOfferData.tripId || jobOfferData.id;

      const response = await fetchETA({
        tripId: tripIdToSend,
        driverId,
      });

      // Check DB response format: jHeader.responseCode === 0 means success
      const responseCode = response?.jHeader?.responseCode;
      const isSuccess =
        responseCode === 0 ||
        responseCode === "0" ||
        responseCode === undefined;

      if (isSuccess && response?.jData) {
        // Extract ETA and note from jData
        // Response structure: { driver_eta_in_minutes: number, driver_eta_notes: string }
        console.log("📥 [Get ETA] Response jData:", response.jData);

        const eta = response.jData.driver_eta_in_minutes;
        const note = response.jData.driver_eta_notes;

        if (eta !== undefined && eta !== null) {
          const etaNumber =
            typeof eta === "string" ? parseInt(eta, 10) : Number(eta);
          const finalNote = note && note.trim() !== "" ? note : undefined;

          setDriverETA({
            eta: etaNumber,
            note: finalNote,
          });
        } else {
          // No ETA in response (common for biddable offers until backend persists bid ETA).
          // Use ETA from last submitted bid so the ETA tag still shows on the map.
          const lastBid = getLastBidETA();
          const currentTripId =
            jobOfferData.tripNumber ||
            jobOfferData.tripId ||
            jobOfferData.id ||
            (jobOfferData as any)?.tripOffer?.tripId;
          const tripIdsMatch =
            lastBid &&
            currentTripId &&
            (String(lastBid.tripId) === String(currentTripId) ||
              String(lastBid.tripId) ===
                String((jobOfferData as any)?.tripOffer?.tripId));

          if (tripIdsMatch && lastBid) {
            setDriverETA({ eta: lastBid.eta });
            clearLastBidETA(lastBid.tripId);
            updateETA({
              tripId: tripIdToSend,
              driverId: driverId!,
              eta: lastBid.eta,
            }).catch(() => {});
          } else {
            setDriverETA(null);
          }
        }
      } else {
        console.log("⚠️ [Get ETA] Response not successful or missing jData:", {
          isSuccess,
          hasJData: !!response?.jData,
          responseCode: response?.jHeader?.responseCode,
        });
      }
    } catch (error) {
      console.error("Error fetching ETA:", error);
      // Don't set error state, just log it
    }
  }, [
    driverId,
    jobOfferData?.id,
    jobOfferData?.tripNumber,
    jobOfferData?.tripId,
    fetchETA,
    getLastBidETA,
    clearLastBidETA,
    updateETA,
  ]);

  // Load ride state on component mount
  useEffect(() => {
    const loadRideState = async () => {
      try {
        const { rideState } = await getRideState();
        if (rideState) {
          setCurrentRideState(rideState);
          // Update UI based on stored ride state
          updateUIForRideState(rideState);
        }
      } catch (error) {
        console.error("Error loading ride state:", error);
      }
    };

    loadRideState();
    // Remove getRideState from dependencies to prevent infinite re-renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      // Disconnect active trip socket when component unmounts
      console.log("🔌 Cleaning up active trip socket on unmount");
      disconnectActiveTripSocket();

      // Reconnect offers socket when leaving active ride screen
      console.log("🔌 Reconnecting offers socket on unmount");
      connectOffersSocket();
    };
  }, [disconnectActiveTripSocket, connectOffersSocket]);

  // Data fetching and transformation logic
  useEffect(() => {
    const loadJobOfferData = async () => {
      try {
        setIsLoadingData(true);
        setDataError(null);

        // Check if we have data from params (from ActiveRideInitializer)
        if (params.activeTripData) {
          console.log("Using data from params:", params.activeTripData);
          const parsedData = JSON.parse(params.activeTripData as string);

          // Transform the data using the helper function
          const transformedData = transformServerDataToJobOffer(parsedData);
          setJobOfferData(transformedData);
          setIsLoadingData(false);

          // Connect to active trip socket after data is loaded
          try {
            // Store IDs in parallel
            await Promise.all([
              setRetrievalId(parsedData?.retrievalId),
              setTripId(parsedData?.activeTrip?.tripId),
            ]);

            const fallbackTripId = parsedData?.activeTrip?.tripId;
            const fallbackRetrievalId = parsedData?.retrievalId;

            if (fallbackRetrievalId && fallbackTripId && driverId) {
              console.log("🔌 Connecting to active trip socket...");

              // Disconnect offers socket before connecting to active trip socket
              console.log("🔌 Disconnecting offers socket...");
              disconnectOffersSocket();

              await connectActiveTripSocket(
                driverId,
                fallbackRetrievalId,
                fallbackTripId,
              );
              console.log("✅ Active trip socket connected");
            }
          } catch (error) {
            console.error("❌ Failed to connect active trip socket:", error);
          }
          return;
        }

        // If no params, check if we have retrievalId and fetch data
        if (driverId) {
          await fetchActiveTrip();
        } else {
          throw new Error("No active trip data available");
        }
      } catch (error) {
        console.error("Error loading job offer data:", error);
        setDataError(error instanceof Error ? error.message : errorLoadTrip);
        setIsLoadingData(false);
      }
    };

    loadJobOfferData();
    // Remove function dependencies to prevent infinite re-renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.activeTripData, driverId]);

  // Load customer info when screen renders
  useEffect(() => {
    if (driverId) {
      loadCustomerInfo(driverId);
    }
  }, [driverId, loadCustomerInfo]);

  // Fetch ETA when job offer data is available
  useEffect(() => {
    if (jobOfferData?.id && driverId) {
      loadDriverETA();
    }
  }, [jobOfferData?.id, driverId, loadDriverETA]);

  // Fetch full trip details from API on load (same as trip-details screen: GET trip-by-number)
  const [tripDetailsFetchedOnLoad, setTripDetailsFetchedOnLoad] =
    useState(false);
  const tripDetailsLoadedFromApiRef = useRef(false);
  useEffect(() => {
    const fetchTripDetailsOnLoad = async () => {
      if (!jobOfferData || tripDetailsFetchedOnLoad) return;

      const tripNumber =
        jobOfferData.tripNumber || jobOfferData.trip_number || jobOfferData.id;

      if (!tripNumber) {
        setTripDetailsFetchedOnLoad(true);
        return;
      }
      // Skip if trip number looks like a UUID (API expects numeric trip number)
      if (tripNumber.includes("-") && tripNumber.length > 20) {
        setTripDetailsFetchedOnLoad(true);
        return;
      }

      try {
        const endpoint = `${ACTIVE_TRIP_ROUTES.GET_TRIP_BY_NUMBER}/${tripNumber}`;
        const response = await activeTripApiClient.get(endpoint);
        const responseData = response.data as any;

        const responseCode = responseData?.jHeader?.responseCode;
        const isSuccess =
          responseCode === 0 ||
          responseCode === "0" ||
          responseCode === undefined;
        if (isSuccess && responseData?.data) {
          const fetchedJobOffer = tripDetailsApiResponseToJobOffer(
            responseData.data,
          );
          if (fetchedJobOffer) {
            const mergedJobOffer = {
              ...jobOfferData,
              ...fetchedJobOffer,
              id: jobOfferData?.id ?? fetchedJobOffer.id,
              pickupAddress:
                jobOfferData?.pickupAddress ?? fetchedJobOffer.pickupAddress,
              dropoffAddress:
                jobOfferData?.dropoffAddress ?? fetchedJobOffer.dropoffAddress,
              totalPrice:
                jobOfferData?.totalPrice ?? fetchedJobOffer.totalPrice,
              driverEarn:
                jobOfferData?.driverEarn ?? fetchedJobOffer.driverEarn,
              rideType: jobOfferData?.rideType ?? fetchedJobOffer.rideType,
              carType: jobOfferData?.carType ?? fetchedJobOffer.carType,
              hasSpecialRequirements:
                jobOfferData?.hasSpecialRequirements ??
                fetchedJobOffer.hasSpecialRequirements,
              hasPackage:
                jobOfferData?.hasPackage ?? fetchedJobOffer.hasPackage,
              pickupTime:
                jobOfferData?.pickupTime ?? fetchedJobOffer.pickupTime,
              pickupDistance:
                jobOfferData?.pickupDistance ?? fetchedJobOffer.pickupDistance,
              dropoffTime:
                jobOfferData?.dropoffTime ?? fetchedJobOffer.dropoffTime,
              dropoffDistance:
                jobOfferData?.dropoffDistance ??
                fetchedJobOffer.dropoffDistance,
              rideTime: jobOfferData?.rideTime ?? fetchedJobOffer.rideTime,
              rideDistance:
                jobOfferData?.rideDistance ?? fetchedJobOffer.rideDistance,
              peopleCount:
                jobOfferData.peopleCount ?? fetchedJobOffer?.peopleCount,
              rating: jobOfferData.rating ?? fetchedJobOffer?.rating,
              dateTime: jobOfferData.dateTime ?? fetchedJobOffer?.dateTime,
            };
            setJobOfferData(mergedJobOffer);
            tripDetailsLoadedFromApiRef.current = true;
          }
        }
      } catch (err) {
        console.warn(
          "⚠️ [ActiveRide] Could not fetch trip details on load:",
          err,
        );
      } finally {
        setTripDetailsFetchedOnLoad(true);
      }
    };

    fetchTripDetailsOnLoad();
  }, [jobOfferData, tripDetailsFetchedOnLoad]);

  // Fetch trip details when switching to details view (fallback if not yet loaded)
  const [tripDetailsFetched, setTripDetailsFetched] = useState(false);

  useEffect(() => {
    const loadTripDetailsForDetailsView = async () => {
      // Only fetch when toggle is switched to DETAILS view
      if (toggleValue !== toggleDetails) {
        // Reset fetch flag when switching away from details
        if (tripDetailsFetched) {
          setTripDetailsFetched(false);
        }
        return;
      }

      // If already fetched for this session, skip
      if (tripDetailsFetched) {
        console.log(
          "📥 [ActiveRide] Trip details already fetched in this session, skipping",
        );
        return;
      }

      // If jobOfferData doesn't exist yet, wait
      if (!jobOfferData) {
        console.log(
          "📥 [ActiveRide] Job offer data not available yet, waiting...",
        );
        return;
      }

      // If we already loaded full details from API (on load or when Details tab fetched), skip
      if (tripDetailsLoadedFromApiRef.current) {
        setTripDetailsFetched(true);
        return;
      }

      try {
        // Get tripNumber from jobOfferData or tripId
        const { tripId: storedTripId } = await getTripId();
        const tripNumber =
          jobOfferData?.tripNumber ||
          jobOfferData?.trip_number ||
          jobOfferData?.id ||
          storedTripId;

        if (!tripNumber) {
          console.warn(
            "📥 [ActiveRide] No trip number available for fetching details",
          );
          return;
        }

        // Skip if tripNumber looks like a UUID (contains dashes and is long)
        if (tripNumber.includes("-") && tripNumber.length > 20) {
          console.warn(
            "📥 [ActiveRide] Trip number appears to be UUID, skipping fetch",
          );
          return;
        }

        const endpoint = `${ACTIVE_TRIP_ROUTES.GET_TRIP_BY_NUMBER}/${tripNumber}`;
        const response = await activeTripApiClient.get(endpoint);
        const responseData = response.data as any;

        const responseCode = responseData?.jHeader?.responseCode;
        const isSuccess =
          responseCode === 0 ||
          responseCode === "0" ||
          responseCode === undefined;

        if (isSuccess && responseData?.data) {
          const fetchedJobOffer = tripDetailsApiResponseToJobOffer(
            responseData.data,
          );

          if (fetchedJobOffer) {
            const mergedJobOffer = {
              ...jobOfferData,
              ...fetchedJobOffer,
              id: jobOfferData?.id ?? fetchedJobOffer.id,
              pickupAddress:
                jobOfferData?.pickupAddress ?? fetchedJobOffer.pickupAddress,
              dropoffAddress:
                jobOfferData?.dropoffAddress ?? fetchedJobOffer.dropoffAddress,
              peopleCount:
                fetchedJobOffer.peopleCount ?? jobOfferData?.peopleCount,
              rating: fetchedJobOffer.rating ?? jobOfferData?.rating,
            };

            setJobOfferData(mergedJobOffer);
            setTripDetailsFetched(true);
            tripDetailsLoadedFromApiRef.current = true;
          }
        } else {
          const errorMsg =
            responseData?.jHeader?.message || "Failed to fetch trip details";
          console.error("❌ [ActiveRide] API Error:", errorMsg);
          console.error("❌ [ActiveRide] Response Code:", responseCode);
        }
      } catch (err: any) {
        console.error(
          "❌ [ActiveRide] Error Response Status:",
          err?.response?.status ?? err,
        );
      }
    };

    loadTripDetailsForDetailsView();
  }, [toggleValue, jobOfferData, getTripId, tripDetailsFetched]);

  // Handle API data when fetched
  useEffect(() => {
    if (apiData && !apiLoading && !params.activeTripData) {
      const transformedData = transformServerDataToJobOffer(apiData);
      setJobOfferData(transformedData);
      setIsLoadingData(false);

      // Connect to active trip socket after API data is loaded
      const connectSocket = async () => {
        try {
          // Store API data IDs in parallel if they exist
          if (apiData?.retrievalId || apiData?.activeTrip?.tripId) {
            await Promise.all([
              apiData?.retrievalId
                ? setRetrievalId(apiData.retrievalId)
                : Promise.resolve(),
              apiData?.activeTrip?.tripId
                ? setTripId(apiData.activeTrip.tripId)
                : Promise.resolve(),
            ]);
          }

          const { retrievalId } = await getRetrievalId();
          const { tripId } = await getTripId();

          const fallbackTripId = apiData?.activeTrip?.tripId || retrievalId;
          const fallbackRetrievalId = apiData?.retrievalId || tripId;

          if (fallbackRetrievalId && fallbackTripId && driverId) {
            console.log("🔌 Connecting to active trip socket...");

            // Disconnect offers socket before connecting to active trip socket
            console.log("🔌 Disconnecting offers socket...");
            disconnectOffersSocket();

            await connectActiveTripSocket(
              driverId,
              fallbackRetrievalId,
              fallbackTripId,
            );
            console.log("✅ Active trip socket connected");
          }
        } catch (error) {
          console.error("❌ Failed to connect active trip socket:", error);
        }
      };
      connectSocket();
    }
  }, [apiData, apiLoading, params.activeTripData]);

  // Handle API errors
  useEffect(() => {
    if (apiError && !params.activeTripData) {
      console.error("API error:", apiError);
      setDataError(apiError);
      setIsLoadingData(false);
    }
  }, [apiError, params.activeTripData]);

  // Update UI based on ride state
  const updateUIForRideState = (rideState: string) => {
    switch (rideState) {
      case RIDE_STATES.EN_ROUTE:
        setSwipeButtonState(SWIPE_BUTTON_STATES.MARK_ARRIVED);
        setIsDriverReachedOnPickup(false);
        break;
      case RIDE_STATES.ON_SCENE:
        setSwipeButtonState(SWIPE_BUTTON_STATES.START_RIDE);
        setIsDriverReachedOnPickup(true);
        break;
      case RIDE_STATES.LOADED:
        setSwipeButtonState(SWIPE_BUTTON_STATES.END_RIDE);
        setIsDriverReachedOnPickup(true);
        break;
      case RIDE_STATES.STOPPED:
        setSwipeButtonState(SWIPE_BUTTON_STATES.RESTART_RIDE);
        setIsDriverReachedOnPickup(true);
        break;
      case RIDE_STATES.COMPLETED:
        // Handle completion - this will be handled in the action handler
        break;
      default:
        console.warn("Unknown ride state:", rideState);
    }
  };

  // Handle driver action API call
  const handleDriverAction = async (action: string) => {
    if (!driverId || !jobOfferData?.id) {
      console.error("Missing driverId or tripId for action:", action);
      return false;
    }

    try {
      setIsActionLoading(true);

      const response = await submitDriverAction({
        tripId: jobOfferData.id,
        driverId,
        action,
      });

      if (response?.success) {
        console.log(`Driver action "${action}" submitted successfully`);
        return true;
      } else {
        console.error("Failed to submit driver action:", response);
        return false;
      }
    } catch (error) {
      console.error("Error submitting driver action:", error);
      return false;
    } finally {
      setIsActionLoading(false);
    }
  };

  // Transform server data to job offer format
  const transformServerDataToJobOffer = (serverData: any) => {
    try {
      // If the data is already in the correct format, return it
      if (serverData.activeTrip && serverData.retrievalId) {
        const activeTrip = serverData.activeTrip;

        // Generate addresses from coordinates using real addresses
        const generateAddressFromCoordinates = (
          lat: number,
          lng: number,
          type: "pickup" | "dropoff",
        ): string => {
          // Use the provided Lahore addresses
          if (type === "pickup") {
            // PU location: 31.3709° N, 74.3648° E
            return "99C7+8WV, Service Road, Kahna Nau, Lahore";
          } else {
            // DO location: 31.4244° N, 74.3574° E
            return "18-KM Main Lahore – Kasur Rd، opp. Descon Head Office, Shadab Garden, Lahore";
          }
        };

        // Use fare from API when present, else default for driver earnings
        const defaultFare = 25.0;
        const totalPrice = activeTrip.fare ?? defaultFare;
        const driverEarn = Math.round(totalPrice * 0.8);

        // Use dynamic ride details from API when present (from GET /retrieval-id)
        const pickupTime = activeTrip.pickupTime ?? 5;
        const pickupDistance = activeTrip.pickupDistance ?? 0.8;
        const dropoffTime = activeTrip.dropoffTime ?? 15;
        const dropoffDistance = activeTrip.dropoffDistance ?? 3.2;
        const rideTime = activeTrip.rideTime ?? 20;
        const rideDistance = activeTrip.rideDistance ?? 4.0;

        // Map backend tripType to RIDE_TYPES (one-way, round-trip, hourly)
        const tripTypeToRideType: Record<
          string,
          (typeof RIDE_TYPES)[keyof typeof RIDE_TYPES]
        > = {
          ONE_WAY: RIDE_TYPES.ONE_WAY,
          ROUND_TRIP: RIDE_TYPES.ROUND_TRIP,
          HOURLY: RIDE_TYPES.HOURLY,
        };
        const rideType =
          activeTrip.tripType && tripTypeToRideType[activeTrip.tripType]
            ? tripTypeToRideType[activeTrip.tripType]
            : RIDE_TYPES.ONE_WAY;

        // Map backend serviceType to carType (lowercase for CAR_TYPE)
        const serviceTypeToCarType: Record<string, string> = {
          ECONOMY_LITE: CAR_TYPE.ECONOMY,
          ECONOMY: CAR_TYPE.ECONOMY,
          SEDAN: CAR_TYPE.SEDAN,
          SUV: CAR_TYPE.SUV,
          LUXURY: CAR_TYPE.LUXURY,
        };
        const carType =
          activeTrip.serviceType &&
          serviceTypeToCarType[activeTrip.serviceType.toUpperCase()]
            ? serviceTypeToCarType[activeTrip.serviceType.toUpperCase()]
            : CAR_TYPE.SEDAN;
        const carTypeDisplay =
          activeTrip.serviceType &&
          serviceTypeToCarType[activeTrip.serviceType.toUpperCase()]
            ? serviceTypeToCarType[activeTrip.serviceType.toUpperCase()]
            : CAR_TYPE.SEDAN;
        const carTypeDisplayLabel =
          carTypeDisplay.charAt(0).toUpperCase() +
          carTypeDisplay.slice(1).toLowerCase();

        const peopleCount =
          activeTrip.noOfPassengers ??
          activeTrip.peopleCount ??
          activeTrip.people_count ??
          2;
        const ratingRaw =
          activeTrip.passengerRating ??
          activeTrip.passenger_rating ??
          activeTrip.rating;
        const rating =
          typeof ratingRaw === "number"
            ? ratingRaw
            : ratingRaw != null && ratingRaw !== ""
              ? (() => {
                  const n = parseFloat(String(ratingRaw).trim());
                  return Number.isNaN(n) ? 4.8 : n;
                })()
              : 4.8;

        return {
          id: activeTrip.tripId,
          dateTime: new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          }),
          rideType,
          carType,
          peopleCount,
          rating,
          hasSpecialRequirements:
            activeTrip.hasSpecialRequirements ??
            activeTrip.has_special_requirements ??
            false,
          onPressSpecialRequirements: () => console.log("Special requirements"),
          hasPackage: activeTrip.hasPackage ?? activeTrip.has_package ?? false,
          onPressPackage: () => console.log("Package pressed"),
          pickupTime,
          pickupDistance,
          pickupAddress:
            activeTrip.pickup.address ||
            generateAddressFromCoordinates(
              activeTrip.pickup.lat,
              activeTrip.pickup.lng,
              "pickup",
            ),
          dropoffTime,
          dropoffDistance,
          dropoffAddress:
            activeTrip.dropoff.address ||
            generateAddressFromCoordinates(
              activeTrip.dropoff.lat,
              activeTrip.dropoff.lng,
              "dropoff",
            ),
          rideTime,
          rideDistance,
          totalPrice,
          driverEarn,
          hideActionButton: true,
          onButtonClick: () => console.log("Accept pressed"),
          driverInstructions: "Please call customer when you arrive",
          fareDetails: [
            {
              label: "Ride Price",
              value: `$${totalPrice.toFixed(2)}`,
            },
            {
              label: "Tolls (EZ Pass)",
              value: "$2.50",
            },
            { label: "Tips", value: "$0.00" },
            {
              label: "Discount",
              value: "$0.00",
            },
            {
              label: "Service Charges",
              value: "$1.50",
            },
            {
              label: "Fuel Surcharge",
              value: "$1.00",
            },
            {
              label: "NYC Congestion Surcharge",
              value: "$2.75",
            },
          ],
          customerDetails: [
            { label: "Name", value: "John Smith" },
            {
              label: "Required Car Type",
              value: carTypeDisplayLabel,
            },
            {
              label: "Offer Price",
              value: `$${totalPrice.toFixed(2)}`,
            },
            {
              label: "Account No.",
              value: "123456789",
            },
            {
              label: "Profile No.",
              value: "987654321",
            },
          ],
        };
      }

      // Fallback: return null if data format is unexpected
      console.warn("Unexpected server data format:", serverData);
      return null;
    } catch (error) {
      console.error("Error transforming server data:", error);
      return null;
    }
  };

  // Bottom sheet state & handlers
  const [contactCustomerSheetOpen, setContactCustomerSheetOpen] =
    useState<boolean>(false);
  const [sosSheetOpen, setSosSheetOpen] = useState<boolean>(false);
  const [cancelRideSheetOpen, setCancelRideSheetOpen] =
    useState<boolean>(false);
  const [reasonsSheetOpen, setReasonsSheetOpen] = useState<boolean>(false);
  const [confirmationModalOpen, setConfirmationModalOpen] =
    useState<boolean>(false);
  const [updateETASheetOpen, setUpdateETASheetOpen] = useState<boolean>(false);
  const [addTollSheetOpen, setAddTollSheetOpen] = useState<boolean>(false);
  // Cancel ride state
  const [selectedReason, setSelectedReason] = useState<CancelRideReason | null>(
    null,
  );
  const [cancelComments, setCancelComments] = useState<string>("");

  const handleToggle = (next: string) => {
    setToggleValue(next as RideToggleLabel);
  };

  const handleSos = () => {
    setSosSheetOpen(true);
  };

  const handleCancelRide = () => {
    setCancelRideSheetOpen(true);
  };

  const handleUpdateETA = async () => {
    // Fetch current ETA after opening the sheet
    setUpdateETASheetOpen(true);
    await loadDriverETA();
  };

  const handleAddToll = () => {
    setAddTollSheetOpen(true);
  };

  const handleCircling = async () => {
    if (isActionLoading) return;
    const success = await handleDriverAction(DRIVER_ACTIONS.CIRCLING);
    if (success) {
      showToast(toastCirclingNotified, "success", "top");
    } else {
      showToast(toastCirclingFailed, "error", "top");
    }
  };

  const handleDetails = () => {
    setToggleValue(toggleDetails as RideToggleLabel);
  };

  // Handle stop action
  const handleStop = async () => {
    if (isActionLoading) return; // Prevent multiple actions

    try {
      setIsActionLoading(true);

      // Call the API with stop action
      const success = await handleDriverAction(DRIVER_ACTIONS.STOP);

      if (success) {
        // Update local state
        setCurrentRideState(RIDE_STATES.STOPPED);
        await setRideState(RIDE_STATES.STOPPED);

        // Update UI
        setSwipeButtonState(SWIPE_BUTTON_STATES.RESTART_RIDE);

        console.log("Ride stopped successfully");
      } else {
        console.error("Failed to stop ride");
      }
    } catch (error) {
      console.error("Error stopping ride:", error);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSwipeComplete = async () => {
    if (isActionLoading) return; // Prevent multiple actions

    try {
      let action: string;
      let newRideState: string;
      let newSwipeState: SwipeButtonState;

      switch (swipeButtonState) {
        case SWIPE_BUTTON_STATES.MARK_ARRIVED:
          action = DRIVER_ACTIONS.ARRIVED;
          newRideState = RIDE_STATES.ON_SCENE;
          newSwipeState = SWIPE_BUTTON_STATES.START_RIDE;
          break;
        case SWIPE_BUTTON_STATES.START_RIDE:
          action = DRIVER_ACTIONS.START;
          newRideState = RIDE_STATES.LOADED;
          newSwipeState = SWIPE_BUTTON_STATES.END_RIDE;
          break;
        case SWIPE_BUTTON_STATES.END_RIDE:
          action = DRIVER_ACTIONS.COMPLETED;
          newRideState = RIDE_STATES.COMPLETED;
          newSwipeState = SWIPE_BUTTON_STATES.MARK_ARRIVED; // This won't be used
          break;
        case SWIPE_BUTTON_STATES.RESTART_RIDE:
          action = DRIVER_ACTIONS.START;
          newRideState = RIDE_STATES.LOADED;
          newSwipeState = SWIPE_BUTTON_STATES.END_RIDE;
          break;
        default:
          console.warn("Unknown swipe button state:", swipeButtonState);
          return;
      }

      // Call the API
      const success = await handleDriverAction(action);

      if (success) {
        // Update local state
        setCurrentRideState(newRideState);
        await setRideState(newRideState);

        // Update UI
        setSwipeButtonState(newSwipeState);

        // Handle special cases
        if (action === DRIVER_ACTIONS.ARRIVED) {
          setIsDriverReachedOnPickup(true);
          showToast(toastMarkedArrived, "success", "top");
        } else if (action === DRIVER_ACTIONS.START) {
          console.log("Ride started");
          showToast(toastRideStarted, "success", "top");
        } else if (action === DRIVER_ACTIONS.COMPLETED) {
          // Handle ride completion
          console.log("Ride completed, redirecting to feedback screen...");
          showToast(toastRideCompleted, "success", "top");
          await handleRideCompletion();
          return;
        } else if (action === DRIVER_ACTIONS.STOP) {
          showToast(toastRideStopped, "success", "top");
        }
      } else {
        // Show error message or handle failure
        console.error("Failed to submit driver action:", action);
        showToast(toastActionFailed, "error", "top");
      }
    } catch (error) {
      console.error("Error in handleSwipeComplete:", error);
    }
  };

  // Handle ride completion
  const handleRideCompletion = async () => {
    try {
      console.log("Starting ride completion process...");

      // Set completion loading state
      setIsCompletingRide(true);

      // Get tripId and customerId before clearing them
      const { tripId: storedTripId } = await getTripId();
      const tripIdForFeedback =
        storedTripId || jobOfferData?.tripId || jobOfferData?.id;
      const customerIdForFeedback =
        jobOfferData?.customerId || jobOfferData?.activeTrip?.customerId;

      // Disconnect active trip socket
      console.log("🔌 Disconnecting active trip socket...");
      disconnectActiveTripSocket();

      // Reconnect offers socket
      console.log("🔌 Reconnecting offers socket...");
      await connectOffersSocket();

      // Remove retrieval ID and trip ID in parallel
      await Promise.all([removeRetrievalId(), removeTripId()]);
      console.log("Removed retrieval ID and trip ID");

      await removeRideState();
      console.log("Removed ride state");

      // Clear only non-demo broadcast offers when ride is completed
      clearNonDemoBroadcastOffers();
      console.log("Cleared non-demo broadcast offers");

      // Redirect to feedback screen with trip data
      console.log("Redirecting to feedback screen...");
      // Extract trip number from tripId if it's a trip number format (not UUID)
      const tripNumberForFeedback =
        tripIdForFeedback && !tripIdForFeedback.includes("-")
          ? tripIdForFeedback
          : jobOfferData?.tripNumber || "";

      router.replace({
        pathname: "/(screens)/feedback",
        params: {
          tripId: tripIdForFeedback || "",
          tripNumber: tripNumberForFeedback,
          customerId: customerIdForFeedback || "",
        },
      });
    } catch (error) {
      console.error("Error handling ride completion:", error);
      // Reset loading state on error
      setIsCompletingRide(false);
    }
  };

  const closeContactCustomerSheet = useCallback(() => {
    setContactCustomerSheetOpen(false);
  }, []);

  const closeSosSheet = useCallback(() => {
    setSosSheetOpen(false);
  }, []);

  const closeCancelRideSheet = useCallback(() => {
    setCancelRideSheetOpen(false);
  }, []);

  const closeReasonsSheet = useCallback(() => {
    setReasonsSheetOpen(false);
  }, []);

  const closeConfirmationModal = useCallback(() => {
    setConfirmationModalOpen(false);
  }, []);

  const closeUpdateETASheet = useCallback(() => {
    setUpdateETASheetOpen(false);
    // Don't reset ETA data - keep it for the map display
    // ETA will be persisted and shown on the map
  }, []);

  const closeAddTollSheet = useCallback(() => {
    setAddTollSheetOpen(false);
  }, []);

  const handleContactCustomer = () => {
    setContactCustomerSheetOpen(true);
  };

  const actionButtons: any[] = [
    {
      icon: "details.png",
      onPress: handleDetails,
      key: "details",
      disabled: isCompletingRide,
    },
    {
      icon: "make-stop.png",
      onPress: handleStop,
      key: "make-stop",
      disabled:
        isActionLoading ||
        currentRideState !== RIDE_STATES.LOADED ||
        isCompletingRide,
    },
    {
      icon: "add-toll.png",
      onPress: handleAddToll,
      key: "add-toll",
      disabled: isCompletingRide,
    },
    {
      icon: "circling.png",
      onPress: handleCircling,
      key: "circling",
      disabled: isActionLoading || isCompletingRide,
    },
    {
      icon: "cancel-ride.png",
      onPress: handleCancelRide,
      key: "cancel-ride",
      disabled: isCompletingRide,
    },
    {
      icon: "update-eta.png",
      onPress: handleUpdateETA,
      key: "update-eta",
      disabled: isCompletingRide,
    },
    {
      icon: "sos.png",
      onPress: handleSos,
      key: "sos",
      disabled: isCompletingRide,
    },
    {
      icon: "contact-customer.png",
      onPress: handleContactCustomer,
      key: "contact-customer",
      disabled: isCompletingRide,
    },
  ];

  // Get customer phone number from ChatContext (same as chat modal)
  // ChatContext provides customerInfo with structure: { name: string, phone: string }
  const customerPhone = customerInfo?.phone || "";

  // Contact action functions
  const handleCallCustomer = async () => {
    if (!customerPhone) {
      showToast(toastPhoneUnavailable, "error", "top");
      return;
    }
    try {
      await openPhoneDialer(customerPhone);
    } catch (error) {
      // Error handling is done within the helper function
    }
    closeContactCustomerSheet();
  };

  const handleSendSMS = async () => {
    try {
      closeContactCustomerSheet();
      // Wait a bit for the bottom sheet to close before opening chat
      await new Promise((resolve) => setTimeout(resolve, 300));
      await openChat();
    } catch (error: any) {
      console.error("Failed to open chat:", error);
      // Show error message to user
      const errorMessage = error?.message || toastChatFailed;
      showToast(errorMessage, "error", "top");
    }
  };

  const handleWhatsApp = async () => {
    if (!customerPhone) {
      showToast(toastPhoneUnavailable, "error", "top");
      return;
    }
    try {
      await openWhatsApp(customerPhone);
    } catch (error) {
      // Error handling is done within the helper function
    }
    closeContactCustomerSheet();
  };

  // SOS action functions
  const handleCallDispatch = async () => {
    try {
      await openPhoneDialer(SOS_NUMBERS.DISPATCH);
    } catch (error) {
      // Error handling is done within the helper function
    }
    closeSosSheet();
  };

  const handleCall911 = async () => {
    try {
      await openPhoneDialer(SOS_NUMBERS.EMERGENCY);
    } catch (error) {
      // Error handling is done within the helper function
    }
    closeSosSheet();
  };

  // Cancel ride handlers
  const handleOpenReasons = () => {
    setReasonsSheetOpen(true);
  };

  const handleSelectReason = (reason: CancelRideReason) => {
    setSelectedReason(reason);
    closeReasonsSheet();
  };

  const handleContinueCancel = () => {
    if (selectedReason) {
      setConfirmationModalOpen(true);
    }
  };

  const handleConfirmCancel = async () => {
    if (!selectedReason) {
      return;
    }

    try {
      // Get tripId and driverId
      const { tripId: currentTripId } = await getTripId();
      const currentDriverId = auth?.user?.id;

      if (!currentTripId || !currentDriverId) {
        console.error("Missing tripId or driverId for cancellation");
        showToast(toastCancelFailed, "error", "top");
        return;
      }

      // Map cancel reason to database format
      // Database expects uppercase with underscores (e.g., "VEHICLE_ISSUE", "CUSTOMER_NO_SHOW")
      const reasonMap: Record<CancelRideReason, string> = {
        "Vehicle Issue": "VEHICLE_ISSUE",
        "Customer No Show": "CUSTOMER_NO_SHOW",
        "Wrong Address": "WRONG_ADDRESS",
        "Safety Concern": "SAFETY_CONCERN",
        "Personal Emergency": "PERSONAL_EMERGENCY",
        Other: "OTHER",
      };

      const dbReason = reasonMap[selectedReason] || "OTHER";

      console.log("🎯 Cancelling trip:", {
        tripId: currentTripId,
        driverId: currentDriverId,
        reason: selectedReason,
        dbReason,
        comments: cancelComments,
      });

      // Call cancel trip API
      const cancelResponse = await cancelTrip({
        tripId: currentTripId,
        driverId: currentDriverId,
        reason: dbReason,
        comments: cancelComments || undefined,
        cancelledBy: "DRIVER",
      });

      // Handle response - usePost extracts nested 'data' property if it exists
      // Backend returns: { success: true, message: '...', data: dbResponse }
      // Hook extracts: response.data.data (which is dbResponse, no success field)
      // So if success field is missing, the API call succeeded (no error thrown)
      const response = cancelResponse as any;
      if (response?.success === false) {
        throw new Error(
          response?.error || response?.message || "Failed to cancel trip",
        );
      }

      // If we get here, either success is true or the hook extracted nested data (meaning success)

      console.log("✅ Trip cancelled successfully in database");

      // Disconnect active trip socket
      console.log("🔌 Disconnecting active trip socket...");
      disconnectActiveTripSocket();

      // Reconnect offers socket
      console.log("🔌 Reconnecting offers socket...");
      await connectOffersSocket();

      // Clean up trip data - ensure all cleanup completes before navigation
      console.log("🧹 Cleaning up trip data...");
      await Promise.all([
        removeRetrievalId(),
        removeTripId(),
        removeRideState(),
      ]);
      console.log("✅ Trip data cleaned up");

      // Clear only non-demo broadcast offers when ride is cancelled
      clearNonDemoBroadcastOffers();
      console.log("Cleared non-demo broadcast offers");

      // Close modals and reset state
      closeConfirmationModal();
      closeCancelRideSheet();
      setSelectedReason(null);
      setCancelComments("");

      // Show success message
      showToast(toastTripCancelled, "success", "top");

      // Small delay to ensure context updates propagate before navigation
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Navigate to home
      router.replace("/(tabs)");
    } catch (error) {
      console.error("Error handling ride cancellation:", error);
      showToast(
        error instanceof Error ? error.message : toastCancelTripFailed,
        "error",
        "top",
      );
    }
  };

  const handleGoBack = () => {
    closeConfirmationModal();
  };

  // Update ETA handler
  const handleUpdateETASubmit = useCallback(
    async (eta: number, note?: string) => {
      if (!driverId || !jobOfferData?.id) {
        console.error("Missing driverId or tripId for ETA update");
        showToast(errorEtaMissing, "error", "top");
        return;
      }

      try {
        const response = await updateETA({
          tripId: jobOfferData.id,
          driverId,
          eta,
          note: note || undefined, // Only include note if provided
        });

        // Check DB response format: jHeader.responseCode === 0 means success
        const responseCode = response?.jHeader?.responseCode;
        const isSuccess =
          responseCode === 0 ||
          responseCode === "0" ||
          responseCode === undefined;

        if (isSuccess) {
          showToast(toastEtaUpdated, "success", "top");
          // Re-fetch ETA from DB to get the updated values (including note)
          try {
            await loadDriverETA();
            // Small delay to ensure state update propagates before closing sheet
            await new Promise((resolve) => setTimeout(resolve, 100));
          } catch (error) {
            console.error("Error re-fetching ETA after update:", error);
            // Still close the sheet even if re-fetch fails
            // Update local state optimistically
            setDriverETA({ eta, note: note || undefined });
          }
          closeUpdateETASheet();
        } else {
          console.error("Failed to update ETA:", response);
          const errorMessage = response?.jHeader?.message || toastEtaFailed;
          showToast(errorMessage, "error", "top");
        }
      } catch (error) {
        console.error("Error updating ETA:", error);
        showToast(toastEtaError, "error", "top");
      }
    },
    [
      driverId,
      jobOfferData?.id,
      updateETA,
      showToast,
      closeUpdateETASheet,
      loadDriverETA,
    ],
  );

  // Add Toll handler
  const handleAddTollSubmit = (tollAmount: number) => {
    console.log("Toll amount added:", tollAmount);
    closeAddTollSheet();
  };

  // Extract coordinates from API data or params
  const mapCoordinates = useMemo(() => {
    let pickupCoords: { lat: number; lng: number } | undefined;
    let dropoffCoords: { lat: number; lng: number } | undefined;

    if (apiData?.activeTrip?.pickup) {
      pickupCoords = {
        lat: apiData.activeTrip.pickup.lat,
        lng: apiData.activeTrip.pickup.lng,
      };
    } else if (params.activeTripData) {
      try {
        const parsedData = JSON.parse(params.activeTripData as string);
        if (parsedData?.activeTrip?.pickup) {
          pickupCoords = {
            lat: parsedData.activeTrip.pickup.lat,
            lng: parsedData.activeTrip.pickup.lng,
          };
        }
      } catch (e) {
        console.error("Error parsing activeTripData for pickup:", e);
      }
    }

    if (apiData?.activeTrip?.dropoff) {
      dropoffCoords = {
        lat: apiData.activeTrip.dropoff.lat,
        lng: apiData.activeTrip.dropoff.lng,
      };
    } else if (params.activeTripData) {
      try {
        const parsedData = JSON.parse(params.activeTripData as string);
        if (parsedData?.activeTrip?.dropoff) {
          dropoffCoords = {
            lat: parsedData.activeTrip.dropoff.lat,
            lng: parsedData.activeTrip.dropoff.lng,
          };
        }
      } catch (e) {
        console.error("Error parsing activeTripData for dropoff:", e);
      }
    }

    return { pickupCoords, dropoffCoords };
  }, [apiData, params.activeTripData]);

  // Loading state
  if (isLoadingData) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={textColors.teal700} />
          <Text style={styles.loadingText}>{loadingTrip}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (dataError || !jobOfferData) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <Header
          title={headerTitle}
          onBackPress={() => router.replace("/(tabs)")}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>{errorTitle}</Text>
          <Text style={styles.errorMessage}>{dataError || errorMessage}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setDataError(null);
              setIsLoadingData(true);
              // Retry loading data
              if (params.activeTripData) {
                const parsedData = JSON.parse(params.activeTripData as string);
                const transformedData =
                  transformServerDataToJobOffer(parsedData);
                setJobOfferData(transformedData);
                setIsLoadingData(false);
              } else {
                fetchActiveTrip();
              }
            }}
          >
            <Text style={styles.retryButtonText}>{errorRetry}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Completion Loading Overlay */}
      {isCompletingRide && (
        <View style={styles.completionOverlay}>
          <View style={styles.completionLoadingContainer}>
            <ActivityIndicator size="large" color={textColors.teal700} />
            <Text style={styles.completionLoadingText}>
              {completionLoading}
            </Text>
            <Text style={styles.completionSubText}>{completionSubtext}</Text>
          </View>
        </View>
      )}

      <Header
        title={
          headerTitleByState[
            currentRideState as keyof typeof headerTitleByState
          ] ?? headerEnRoute
        }
        rightAccessory={
          <View style={styles.toggleWrap}>
            <Toggle
              variant="labeled"
              labels={labels}
              value={toggleValue}
              setValue={handleToggle}
              size={headerToggleSize}
            />
          </View>
        }
        onBackPress={() => router.replace("/(tabs)")}
      />
      <View
        style={[
          styles.actionBarContainer,
          (!isMapReady || isLoadingData) && { opacity: 0.5 },
        ]}
      >
        {/* Action Bar */}
        {actionButtons.length > 0 && (
          <ScrollView
            style={styles.actionBar}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.actionBarContent}
          >
            {actionButtons.map((button) => (
              <TouchableOpacity
                key={button.key}
                style={[
                  styles.actionButton,
                  button.disabled && styles.actionButtonDisabled,
                ]}
                onPress={button.onPress}
                disabled={
                  !button.onPress ||
                  button.disabled ||
                  !isMapReady ||
                  isLoadingData
                }
              >
                <View
                  style={[
                    styles.actionButtonContainer,
                    button.disabled && styles.actionButtonContainerDisabled,
                  ]}
                >
                  <Image
                    source={
                      ACTION_ICON_SOURCE_MAP[button.icon] ||
                      ACTION_ICON_SOURCE_MAP["details.png"]
                    }
                    style={[
                      styles.actionIcon,
                      button.disabled && styles.actionIconDisabled,
                    ]}
                    resizeMode="contain"
                  />
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      <View style={styles.rideLocationsContainer}>
        <RideLocations
          pickupAddress={
            currentRideState === RIDE_STATES.EN_ROUTE
              ? jobOfferData?.pickupAddress || loadingAddress
              : ""
          }
          dropoffAddress={
            currentRideState === RIDE_STATES.LOADED
              ? jobOfferData?.dropoffAddress || loadingAddress
              : ""
          }
          showFreeWaitTimer={
            currentRideState === RIDE_STATES.ON_SCENE ||
            currentRideState === RIDE_STATES.STOPPED
          }
          resetCountdown={
            currentRideState !== RIDE_STATES.ON_SCENE &&
            currentRideState !== RIDE_STATES.STOPPED
          }
        />
      </View>

      {/* Always render both components, but control visibility */}
      <View
        style={[
          styles.detailsContainer,
          {
            display: toggleValue === toggleDetails ? "flex" : "none",
          },
        ]}
      >
        <JobDetails jobOffer={jobOfferData} showActionBar={false} />
      </View>

      <View
        style={[
          styles.mapContainer,
          { display: toggleValue === toggleMap ? "flex" : "none" },
        ]}
      >
        <RideMap
          pickupAddress={jobOfferData?.pickupAddress || loadingAddress}
          dropoffAddress={jobOfferData?.dropoffAddress || loadingAddress}
          pickupCoordinates={mapCoordinates.pickupCoords}
          dropoffCoordinates={mapCoordinates.dropoffCoords}
          eta={
            isDriverReachedOnPickup
              ? ""
              : driverETA?.eta
                ? `${driverETA.eta} mins`
                : ""
          }
          showWazeButton={true}
          rideStatus={
            headerTitleByState[
              currentRideState as keyof typeof headerTitleByState
            ] ?? headerEnRoute
          }
          onMapReady={() => {
            setIsMapReady(true);
            console.log("Map ready");
          }}
          onError={(error) => console.error("Map error:", error)}
        />
      </View>

      {toggleValue === toggleMap && showSwipe && (
        <Animated.View style={{ opacity: swipeOpacity }}>
          <RideAction
            leftComponent={
              <Image
                source={require("@/assets/images/actions/circling.png")}
                style={{
                  width: 20,
                  height: 20,
                  opacity: isActionLoading || isCompletingRide ? 0.5 : 1,
                }}
              />
            }
            swipeTitle={
              isActionLoading || isCompletingRide
                ? swipeProcessing
                : (swipeTitleByState[swipeButtonState] ?? swipeMarkArrived)
            }
            onSwipeComplete={() => {
              if (!isActionLoading && !isCompletingRide) {
                handleSwipeComplete();
              }
            }}
            disabled={
              isActionLoading ||
              isCompletingRide ||
              !isMapReady ||
              isLoadingData
            }
            onLeftPress={handleCircling}
            onRightPress={handleContactCustomer}
            rightComponent={
              <Image
                source={require("@/assets/images/actions/contact-customer.png")}
                style={{
                  width: 20,
                  height: 20,
                  opacity: isActionLoading || isCompletingRide ? 0.5 : 1,
                }}
              />
            }
          />
        </Animated.View>
      )}

      {/* Contact Customer Bottom Sheet */}
      <BottomSheet
        open={contactCustomerSheetOpen}
        onClose={closeContactCustomerSheet}
        snapPoints={[250]}
        headerTitle={contactSheetTitle}
      >
        <Typography
          type="bodyLarge"
          weight="bold"
          style={styles.sheetHeaderText}
        >
          {contactPhoneLabel} {customerPhone || contactPhoneNa}
        </Typography>
        <View style={styles.sheetContainer}>
          {[
            {
              label: contactCallCellular,
              iconUrl: require("@/assets/images/phone-call.png"),
              onPress: handleCallCustomer,
            },
            {
              label: contactChat,
              iconUrl: require("@/assets/images/sms.png"),
              onPress: handleSendSMS,
            },
            {
              label: contactWhatsapp,
              iconUrl: require("@/assets/images/whatsapp.png"),
              onPress: handleWhatsApp,
            },
          ].map((item) => (
            <View key={item.label}>
              <TouchableOpacity
                key={item.label}
                style={styles.sheetRow}
                disabled={false}
                onPress={item.onPress}
              >
                <Typography
                  type="bodyLarge"
                  weight="medium"
                  style={styles.sheetOptionText}
                >
                  {item.label}
                </Typography>
                <Image
                  source={
                    item.iconUrl ||
                    require("@/assets/images/black-arrow-right.png")
                  }
                  style={styles.iconSize24}
                />
              </TouchableOpacity>
              <View style={styles.sheetDivider} />
            </View>
          ))}
        </View>
      </BottomSheet>

      {/* SOS Bottom Sheet */}
      <BottomSheet
        open={sosSheetOpen}
        onClose={closeSosSheet}
        snapPoints={[250]}
        headerTitle={sosSheetTitle}
      >
        <View style={styles.sheetContainer}>
          {[
            {
              label: sosCallDispatch,
              iconUrl: require("@/assets/images/phone-call.png"),
              onPress: handleCallDispatch,
            },
            {
              label: sosCall911,
              iconUrl: require("@/assets/images/sos-call.png"),
              onPress: handleCall911,
            },
          ].map((item) => (
            <View key={item.label}>
              <TouchableOpacity
                key={item.label}
                style={styles.sheetRow}
                disabled={false}
                onPress={item.onPress}
              >
                <Typography
                  type="bodyLarge"
                  weight="medium"
                  style={styles.sheetOptionText}
                >
                  {item.label}
                </Typography>
                <Image
                  source={
                    item.iconUrl ||
                    require("@/assets/images/black-arrow-right.png")
                  }
                  style={styles.iconSize24}
                />
              </TouchableOpacity>
              <View style={styles.sheetDivider} />
            </View>
          ))}
        </View>
      </BottomSheet>

      {/* Cancel Ride Bottom Sheet */}
      <BottomSheet
        open={cancelRideSheetOpen}
        onClose={closeCancelRideSheet}
        scrollable
        snapPoints={["45%", "65%"]}
        snapPointsWhenKeyboardVisible={["85%", "95%"]}
        swipeToClose={false}
        headerTitle={cancelSheetTitle}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.cancelRideContainer}>
          {/* Select Reason Section */}
          <View style={styles.cancelRideSection}>
            <Typography
              type="bodyLarge"
              weight="medium"
              style={styles.cancelRideLabel}
            >
              {cancelSelectReasonLabel}
            </Typography>
            <TouchableOpacity
              onPress={handleOpenReasons}
              style={styles.cancelRideDropdown}
            >
              <Typography
                type="bodyLarge"
                weight="medium"
                style={
                  selectedReason
                    ? styles.cancelRideSelectedText
                    : styles.cancelRidePlaceholder
                }
                numberOfLines={1}
              >
                {selectedReason
                  ? (cancelReasonDisplayList[
                      CANCEL_RIDE_REASONS.indexOf(selectedReason)
                    ] ?? selectedReason)
                  : cancelChooseReason}
              </Typography>
              <Image
                source={require("@/assets/images/black-down-arrow-icon.png")}
                style={styles.cancelRideDropdownIcon}
              />
            </TouchableOpacity>
          </View>

          {/* Add Comments Section */}
          <View style={styles.cancelRideSection}>
            <Typography
              type="bodyLarge"
              weight="medium"
              style={styles.cancelRideLabel}
            >
              {cancelAddCommentsLabel}
            </Typography>
            <TextArea
              placeholder={cancelCommentsPlaceholder}
              value={cancelComments}
              onChangeText={setCancelComments}
              numberOfLines={3}
              style={styles.cancelRideTextArea}
            />
          </View>

          {/* Continue Button */}
          <TouchableOpacity
            style={[
              styles.cancelRideContinueButton,
              !selectedReason && styles.cancelRideContinueButtonDisabled,
            ]}
            onPress={handleContinueCancel}
            disabled={!selectedReason}
          >
            <Typography
              type="bodyLarge"
              weight="semibold"
              disabled={!selectedReason}
              style={[
                styles.cancelRideContinueButtonText,
                !selectedReason && styles.cancelRideContinueButtonTextDisabled,
              ]}
            >
              {cancelContinue}
            </Typography>
          </TouchableOpacity>
        </View>
      </BottomSheet>

      {/* Reasons Selection Bottom Sheet */}
      <BottomSheet
        open={reasonsSheetOpen}
        onClose={closeReasonsSheet}
        snapPoints={["45%"]}
        headerTitle={cancelReasonsSheetTitle}
      >
        <View style={styles.sheetContainer}>
          {CANCEL_RIDE_REASONS.map((reason, i) => {
            const selected = selectedReason === reason;
            const displayLabel = cancelReasonDisplayList[i] ?? reason;
            return (
              <View key={reason}>
                <TouchableOpacity
                  style={styles.sheetRow}
                  onPress={() => handleSelectReason(reason)}
                >
                  <Typography
                    type={selected ? "titleMedium" : "bodyLarge"}
                    weight={selected ? "bold" : "medium"}
                    style={styles.textBlack}
                  >
                    {displayLabel}
                  </Typography>
                </TouchableOpacity>
                <View style={styles.sheetDivider} />
              </View>
            );
          })}
        </View>
      </BottomSheet>

      {/* Confirmation Modal */}
      <ConfirmationModal
        open={confirmationModalOpen}
        title={confirmTitle}
        description={
          selectedReason === "Vehicle Issue"
            ? `${confirmDescriptionVehicleIssuePrefix} ${VEHICLE_ISSUE_OFFLINE_HOURS} ${confirmDescriptionVehicleIssueSuffix}`
            : confirmDescriptionDefault
        }
        onConfirm={handleConfirmCancel}
        onCancel={handleGoBack}
        cancelButtonText={confirmCancel}
        confirmButtonText={confirmConfirm}
        loading={isCancellingTrip}
        loadingText={confirmLoading}
      />

      {/* Update ETA Bottom Sheet */}
      <ETABottomSheet
        open={updateETASheetOpen}
        onClose={closeUpdateETASheet}
        onSubmit={handleUpdateETASubmit}
        snapPoints={updateEtaSnapPoints}
        snapPointsWhenKeyboardVisible={updateEtaSnapPointsWhenKeyboardVisible}
        swipeToClose={false}
        variant="update"
        headerTitle={etaSheetTitle}
        description={etaSheetDescription}
        showNoteSection={true}
        buttonText={
          isFetchingETA ? etaFetching : isUpdatingETA ? etaUpdating : etaButton
        }
        isLoading={isUpdatingETA || isFetchingETA}
        initialEta={driverETA?.eta}
        initialNote={driverETA?.note}
      />

      {/* Add Toll Bottom Sheet */}
      <AddTollBottomSheet
        open={addTollSheetOpen}
        onClose={closeAddTollSheet}
        onSubmit={handleAddTollSubmit}
        snapPoints={["45%"]}
        initialSnapIndex={0}
        showHeader={true}
        backdrop={true}
        swipeToClose={false}
        isLoading={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: textColors.white },
  toggleWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingRight: 10,
  },
  actionBarContainer: {
    padding: 10,
  },
  actionBar: {
    paddingHorizontal: 0,
  },
  actionBarContent: {
    paddingHorizontal: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    alignItems: "center",
    marginRight: 12,
  },
  actionButtonContainer: {
    width: 54,
    height: 42,
    backgroundColor: textColors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: textColors.grey300,
    justifyContent: "center",
    alignItems: "center",
  },
  actionIcon: {
    width: 20,
    height: 20,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonContainerDisabled: {
    backgroundColor: textColors.grey100,
    borderColor: textColors.grey200,
  },
  actionIconDisabled: {
    opacity: 0.5,
  },
  rideLocationsContainer: {
    padding: 10,
  },
  detailsContainer: {
    flex: 1,
  },
  mapContainer: {
    flex: 1,
    marginBottom: 85,
  },

  // bottom sheet
  sheetContainer: {
    paddingTop: 12,
    paddingHorizontal: 12,
    backgroundColor: textColors.white,
    gap: 12,
  },
  sheetDivider: {
    height: 1,
    backgroundColor: textColors.grey100,
    marginTop: 12,
  },
  sheetRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  iconSize24: {
    width: 24,
    height: 24,
  },
  sheetOptionText: {
    fontSize: 16,
    color: textColors.black,
  },
  sheetHeaderText: {
    fontSize: 20,
    color: textColors.black,
    marginBottom: 8,
  },

  // Cancel ride styles
  cancelRideContainer: {
    paddingTop: 20,
    gap: 20,
  },
  cancelRideSection: {
    gap: 8,
  },
  cancelRideLabel: {
    fontSize: 16,
    color: textColors.black,
  },
  cancelRideDropdown: {
    height: 48,
    borderWidth: 1,
    borderColor: textColors.grey200,
    borderRadius: 8,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cancelRideSelectedText: {
    color: textColors.black,
  },
  cancelRidePlaceholder: {
    color: textColors.grey400,
  },
  cancelRideDropdownIcon: {
    width: 24,
    height: 24,
    resizeMode: "contain",
  },
  cancelRideTextArea: {
    marginTop: 0,
  },
  cancelRideContinueButton: {
    height: 48,
    backgroundColor: textColors.teal600,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelRideContinueButtonDisabled: {
    backgroundColor: textColors.grey100,
  },
  cancelRideContinueButtonText: {
    color: textColors.white,
    fontSize: 16,
  },
  cancelRideContinueButtonTextDisabled: {
    color: textColors.grey500,
  },
  textBlack: {
    color: textColors.black,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: textColors.white,
  },
  loadingText: {
    fontSize: 16,
    color: textColors.grey600,
    marginTop: 16,
    textAlign: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: textColors.white,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: textColors.black,
    marginBottom: 16,
    textAlign: "center",
  },
  errorMessage: {
    fontSize: 16,
    color: textColors.grey600,
    marginBottom: 20,
    textAlign: "center",
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
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  completionOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    zIndex: 9999,
    justifyContent: "center",
    alignItems: "center",
  },
  completionLoadingContainer: {
    backgroundColor: textColors.white,
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    minWidth: 280,
    shadowColor: textColors.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  completionLoadingText: {
    fontSize: 18,
    fontWeight: "600",
    color: textColors.black,
    marginTop: 16,
    textAlign: "center",
  },
  completionSubText: {
    fontSize: 14,
    color: textColors.grey600,
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
  },
});
