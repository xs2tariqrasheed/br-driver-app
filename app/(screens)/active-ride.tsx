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
import { textColors } from "@/constants/colors";
import { openPhoneDialer, openWhatsApp } from "@/utils/helpers";

import AddTollBottomSheet from "@/components/AddTollBottomSheet";
import { useToast } from "@/components/Toast";
import Typography from "@/components/Typography";
import { ACTIVE_TRIP_ROUTES } from "@/constants/endpoints";
import {
  ACTION_ICON_SOURCE_MAP,
  API_CLIENT_TYPES,
  CANCEL_RIDE_REASONS,
  CancelRideReason,
  DRIVER_ACTIONS,
  RIDE_HEADER_TITLES,
  RIDE_STATES,
  RIDE_TOGGLE_LABELS,
  RIDE_TYPES,
  RideToggleLabel,
  SOS_NUMBERS,
  SWIPE_BUTTON_STATES,
  SWIPE_BUTTON_TITLES,
  SwipeButtonState,
  VEHICLE_ISSUE_OFFLINE_HOURS,
} from "@/constants/global";
import { useAuth } from "@/context/AuthContext";
import { useBroadcastJobOffers } from "@/context/BroadcastJobOffersContext";
import { useChat } from "@/context/ChatContext";
import { useDriver } from "@/context/DriverContext";
import { useActiveTripSocket } from "@/hooks/useActiveTripSocket";
import { useFetch } from "@/hooks/useFetch";
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
  View
} from "react-native";

export default function ActiveRideScreen() {
  const labels: [RideToggleLabel, RideToggleLabel] = useMemo(
    () => [RIDE_TOGGLE_LABELS.MAP, RIDE_TOGGLE_LABELS.DETAILS],
    []
  );

  // Keep bottom sheet snapPoints stable to avoid re-renders (and TextInput focus loss)
  // while the active trip screen updates in real-time (socket/location updates).
  const updateEtaSnapPoints = useMemo<(string | number)[]>(
    () => ["40%", "60%"],
    []
  );
  const updateEtaSnapPointsWhenKeyboardVisible = useMemo<(string | number)[]>(
    () => ["90%", "95%"],
    []
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
  } = useDriver();
  const [auth] = useAuth();
  const driverId = auth?.user?.id;
  const { clearNonDemoBroadcastOffers } = useBroadcastJobOffers();
  const { openChat, customerInfo } = useChat();
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
    RIDE_TOGGLE_LABELS.MAP
  );

  const [isDriverReachedOnPickup, setIsDriverReachedOnPickup] =
    useState<boolean>(false);

  const [swipeButtonState, setSwipeButtonState] = useState<SwipeButtonState>(
    SWIPE_BUTTON_STATES.MARK_ARRIVED
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
    RIDE_STATES.EN_ROUTE
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
  const showSwipe = !isActionLoading && !isCompletingRide && isMapReady && !isLoadingData;
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
    API_CLIENT_TYPES.ACTIVE_TRIP
  );

  // API call for driver actions
  const { execute: submitDriverAction } = usePost(
    ACTIVE_TRIP_ROUTES.DRIVER_ACTION,
    API_CLIENT_TYPES.ACTIVE_TRIP
  );
  const { execute: cancelTrip, loading: isCancellingTrip } = usePost(
    ACTIVE_TRIP_ROUTES.CANCEL,
    API_CLIENT_TYPES.ACTIVE_TRIP
  );
  const { execute: updateETA, loading: isUpdatingETA } = usePost(
    ACTIVE_TRIP_ROUTES.UPDATE_ETA,
    API_CLIENT_TYPES.ACTIVE_TRIP
  );

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
                fallbackTripId
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
        setDataError(
          error instanceof Error ? error.message : "Failed to load trip data"
        );
        setIsLoadingData(false);
      }
    };

    loadJobOfferData();
    // Remove function dependencies to prevent infinite re-renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.activeTripData, driverId]);

  // Handle API data when fetched
  useEffect(() => {
    if (apiData && !apiLoading && !params.activeTripData) {
      console.log("Using data from API:", apiData);
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
              fallbackTripId
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
          type: "pickup" | "dropoff"
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

        // Calculate driver earnings (80% of total price - using a default fare for now)
        const defaultFare = 25.0; // Default fare since it's not in the API response
        const driverEarn = Math.round(defaultFare * 0.8);

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
          rideType: RIDE_TYPES.ONE_WAY,
          peopleCount: 2,
          rating: 4.8,
          hasSpecialRequirements: false,
          onPressSpecialRequirements: () => console.log("Special requirements"),
          hasPackage: false,
          onPressPackage: () => console.log("Package pressed"),
          pickupTime: 5,
          pickupDistance: 0.8,
          pickupAddress:
            activeTrip.pickup.address ||
            generateAddressFromCoordinates(
              activeTrip.pickup.lat,
              activeTrip.pickup.lng,
              "pickup"
            ),
          dropoffTime: 15,
          dropoffDistance: 3.2,
          dropoffAddress:
            activeTrip.dropoff.address ||
            generateAddressFromCoordinates(
              activeTrip.dropoff.lat,
              activeTrip.dropoff.lng,
              "dropoff"
            ),
          rideTime: 20,
          rideDistance: 4.0,
          totalPrice: defaultFare,
          driverEarn: driverEarn,
          hideActionButton: true,
          onButtonClick: () => console.log("Accept pressed"),
          driverInstructions: "Please call customer when you arrive",
          fareDetails: [
            {
              label: "Ride Price",
              value: `$${defaultFare.toFixed(2)}`,
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
              value: "Sedan",
            },
            {
              label: "Offer Price",
              value: `$${defaultFare.toFixed(2)}`,
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
    null
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

  const handleUpdateETA = () => {
    setUpdateETASheetOpen(true);
  };

  const handleAddToll = () => {
    setAddTollSheetOpen(true);
  };
  const handleDetails = () => {
    setToggleValue(RIDE_TOGGLE_LABELS.DETAILS);
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
          showToast("Marked arrived successfully", "success", "top");
        } else if (action === DRIVER_ACTIONS.START) {
          console.log("Ride started");
          showToast("Ride started", "success", "top");
        } else if (action === DRIVER_ACTIONS.COMPLETED) {
          // Handle ride completion
          console.log("Ride completed, redirecting to feedback screen...");
          showToast("Ride completed", "success", "top");
          await handleRideCompletion();
          return;
        } else if (action === DRIVER_ACTIONS.STOP) {
          showToast("Ride stopped", "success", "top");
        }
      } else {
        // Show error message or handle failure
        console.error("Failed to submit driver action:", action);
        // You could show a toast or error message here
        showToast("Action failed. Please try again.", "error", "top");
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
      const tripIdForFeedback = storedTripId || jobOfferData?.tripId || jobOfferData?.id;
      const customerIdForFeedback = jobOfferData?.customerId || jobOfferData?.activeTrip?.customerId;

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
      router.replace({
        pathname: "/(screens)/feedback",
        params: {
          tripId: tripIdForFeedback || "",
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
      onPress: () => {
        console.log("Circling");
        showToast(
          "The customer has been notified that you are circling.",
          "success",
          "top"
        );
      },
      key: "circling",
      disabled: isCompletingRide,
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
  const customerPhone = customerInfo?.phone || "";

  // Contact action functions
  const handleCallCustomer = async () => {
    if (!customerPhone) {
      showToast("Customer phone number is not available", "error", "top");
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
      const errorMessage =
        error?.message || "Failed to open chat. Please try again.";
      showToast(errorMessage, "error", "top");
    }
  };

  const handleWhatsApp = async () => {
    if (!customerPhone) {
      showToast("Customer phone number is not available", "error", "top");
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
        showToast("Unable to cancel trip. Please try again.", "error", "top");
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
        "Other": "OTHER",
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
        throw new Error(response?.error || response?.message || "Failed to cancel trip");
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
      showToast("Trip cancelled successfully", "success", "top");

      // Small delay to ensure context updates propagate before navigation
      await new Promise(resolve => setTimeout(resolve, 500));

      // Navigate to home
      router.replace("/(tabs)");
    } catch (error) {
      console.error("Error handling ride cancellation:", error);
      showToast(
        error instanceof Error
          ? error.message
          : "Failed to cancel trip. Please try again.",
        "error",
        "top"
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
        showToast("Unable to update ETA. Missing trip information.", "error", "top");
        return;
      }

      try {
        const response = await updateETA({
          tripId: jobOfferData.id,
          driverId,
          eta,
          note: note || undefined, // Only include note if provided
        });

        if (response?.success) {
          showToast("ETA updated successfully", "success", "top");
          closeUpdateETASheet();
        } else {
          console.error("Failed to update ETA:", response);
          showToast(
            response?.error || "Failed to update ETA. Please try again.",
            "error",
            "top"
          );
        }
      } catch (error) {
        console.error("Error updating ETA:", error);
        showToast("An error occurred while updating ETA. Please try again.", "error", "top");
      }
    },
    [driverId, jobOfferData?.id, updateETA, showToast, closeUpdateETASheet]
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
          <Text style={styles.loadingText}>Loading trip data...</Text>
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
          title="Active Ride"
          onBackPress={() => router.replace("/(tabs)")}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Unable to Load Trip Data</Text>
          <Text style={styles.errorMessage}>
            {dataError || "No active trip data available"}
          </Text>
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
            <Text style={styles.retryButtonText}>Retry</Text>
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
            <Text style={styles.completionLoadingText}>Completing ride...</Text>
            <Text style={styles.completionSubText}>
              Please wait while we process your ride completion
            </Text>
          </View>
        </View>
      )}

      <Header
        title={
          RIDE_HEADER_TITLES[
            currentRideState as keyof typeof RIDE_HEADER_TITLES
          ] || "En Route"
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
      <View style={[styles.actionBarContainer, (!isMapReady || isLoadingData) && { opacity: 0.5 }]}>
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
                disabled={!button.onPress || button.disabled || !isMapReady || isLoadingData}
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
              ? jobOfferData?.pickupAddress || "Loading address..."
              : ""
          }
          dropoffAddress={
            currentRideState === RIDE_STATES.LOADED
              ? jobOfferData?.dropoffAddress || "Loading address..."
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
            display:
              toggleValue === RIDE_TOGGLE_LABELS.DETAILS ? "flex" : "none",
          },
        ]}
      >
        <JobDetails jobOffer={jobOfferData} showActionBar={false} />
      </View>

      <View
        style={[
          styles.mapContainer,
          { display: toggleValue === RIDE_TOGGLE_LABELS.MAP ? "flex" : "none" },
        ]}
      >
        <RideMap
          pickupAddress={jobOfferData?.pickupAddress || "Loading address..."}
          dropoffAddress={jobOfferData?.dropoffAddress || "Loading address..."}
          pickupCoordinates={mapCoordinates.pickupCoords}
          dropoffCoordinates={mapCoordinates.dropoffCoords}
          eta={isDriverReachedOnPickup ? "" : "10 mins"}
          showWazeButton={true}
          rideStatus={
            RIDE_HEADER_TITLES[
              currentRideState as keyof typeof RIDE_HEADER_TITLES
            ] || "En Route"
          }
          onMapReady={() => {
            setIsMapReady(true);
            console.log("Map ready");
          }}
          onError={(error) => console.error("Map error:", error)}
        />
      </View>

      {toggleValue === RIDE_TOGGLE_LABELS.MAP && showSwipe && (
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
                ? "Processing..."
                : SWIPE_BUTTON_TITLES[swipeButtonState]
            }
            onSwipeComplete={() => {
              if (!isActionLoading && !isCompletingRide) {
                handleSwipeComplete();
              }
            }}
            disabled={isActionLoading || isCompletingRide || !isMapReady || isLoadingData}
            onLeftPress={() => {
              console.log("Circling");
              showToast(
                "The customer has been notified that you are circling.",
                "success",
                "top"
              );
            }}
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
        headerTitle="Contact Customer"
      >
        <Typography
          type="bodyLarge"
          weight="bold"
          style={styles.sheetHeaderText}
        >
          Phone: {customerPhone || "N/A"}
        </Typography>
        <View style={styles.sheetContainer}>
          {[
            {
              label: "Call Using Cellular",
              iconUrl: require("@/assets/images/phone-call.png"),
              onPress: handleCallCustomer,
            },
            {
              label: "Chat",
              iconUrl: require("@/assets/images/sms.png"),
              onPress: handleSendSMS,
            },
            {
              label: "WhatsApp",
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
        headerTitle="SOS"
      >
        <View style={styles.sheetContainer}>
          {[
            {
              label: "Call Dispatch",
              iconUrl: require("@/assets/images/phone-call.png"),
              onPress: handleCallDispatch,
            },
            {
              label: "Call 911",
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
        headerTitle="Cancel Ride"
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
              Select a Reason
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
                {selectedReason || "Choose reason..."}
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
              Add Comments
            </Typography>
            <TextArea
              placeholder="Type Here"
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
              Continue
            </Typography>
          </TouchableOpacity>
        </View>
      </BottomSheet>

      {/* Reasons Selection Bottom Sheet */}
      <BottomSheet
        open={reasonsSheetOpen}
        onClose={closeReasonsSheet}
        snapPoints={["45%"]}
        headerTitle="Select Reason"
      >
        <View style={styles.sheetContainer}>
          {CANCEL_RIDE_REASONS.map((reason) => {
            const selected = selectedReason === reason;
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
                    {reason}
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
        title="Are You Sure?"
        description={
          selectedReason === "Vehicle Issue"
            ? `You'll be set offline for ${VEHICLE_ISSUE_OFFLINE_HOURS} hours to resolve vehicle issues. This can't be undone. Frequent bailouts may affect your score or job offers.`
            : "This action cannot be undone. Cancellation may affect your driver score or future ride preferences."
        }
        onConfirm={handleConfirmCancel}
        onCancel={handleGoBack}
        cancelButtonText="Go Back"
        confirmButtonText="Yes, Cancel"
        loading={isCancellingTrip}
        loadingText="Cancelling..."
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
        headerTitle="Update ETA"
        description="Let the rider know if your arrival time has changed."
        showNoteSection={true}
        buttonText="Update ETA"
        isLoading={isUpdatingETA}
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
