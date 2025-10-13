import BottomSheet from "@/components/BottomSheet";
import ConfirmationModal from "@/components/ConfirmationModal";
import ETABottomSheet from "@/components/ETABottomSheet";
import TextArea from "@/components/Form/TextArea";
import Toggle from "@/components/Form/Toggle";
import Header from "@/components/Header";
import JobDetails from "@/components/JobDetails";
import Notification from "@/components/Notification";
import RideAction from "@/components/RideAction";
import RideLocations from "@/components/RideLocations";
import RideMap from "@/components/RideMap";
import { textColors } from "@/constants/colors";
import { openPhoneDialer, openSMSApp, openWhatsApp } from "@/utils/helpers";

import Typography from "@/components/Typography";
import {
  ACTION_ICON_SOURCE_MAP,
  CANCEL_RIDE_REASONS,
  CancelRideReason,
  NOTIFICATION_TYPES,
  RIDE_TOGGLE_LABELS,
  RIDE_TYPES,
  RideToggleLabel,
  SOS_NUMBERS,
  SWIPE_BUTTON_STATES,
  SWIPE_BUTTON_TITLES,
  SwipeButtonState,
  VEHICLE_ISSUE_OFFLINE_HOURS,
} from "@/constants/global";
import { router, Stack } from "expo-router";
import { useCallback, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

export default function ActiveRideScreen() {
  const labels: [RideToggleLabel, RideToggleLabel] = [
    RIDE_TOGGLE_LABELS.MAP,
    RIDE_TOGGLE_LABELS.DETAILS,
  ];

  const [toggleValue, setToggleValue] = useState<RideToggleLabel>(
    RIDE_TOGGLE_LABELS.MAP
  );

  const [isDriverReachedOnPickup, setIsDriverReachedOnPickup] =
    useState<boolean>(false);

  const [swipeButtonState, setSwipeButtonState] = useState<SwipeButtonState>(
    SWIPE_BUTTON_STATES.MARK_ARRIVED
  );

  // Notification state
  const [showNotification, setShowNotification] = useState<boolean>(false);
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

  const jobOffer = {
    id: "job-123",
    dateTime: "Tuesday, Dec 7th, 10:15 am",
    rideType: RIDE_TYPES.ONE_WAY,
    peopleCount: 2,
    rating: 3.5,
    hasSpecialRequirements: true,
    onPressSpecialRequirements: () => console.log("Special requirements"),
    hasPackage: false,
    onPressPackage: () => console.log("Package pressed"),
    pickupTime: 13,
    pickupDistance: 3.4,
    pickupAddress: "Pascal Ave N & N Terrace AR. Roseville\n69 Main Street",
    dropoffTime: 24,
    dropoffDistance: 3.4,
    dropoffAddress: "3272 Gale Ave Long Island City NY 11101",
    rideTime: 49,
    rideDistance: 23.4,
    totalPrice: 55,
    driverEarn: 46,
    hideBidButton: true,
    onButtonClick: () => console.log("Accept pressed"),
    driverInstructions:
      "Please wear the mask while driving and make sure to fasten the seat belt and keep the car clean and neat",
    fareDetails: [
      { label: "Ride Price", value: "$20.25" },
      { label: "Tolls (EZ Pass)", value: "$0.75" },
      { label: "Tips", value: "$2.00" },
      { label: "Discount", value: "$00.00" },
      { label: "Service Charges", value: "$4.00" },
      { label: "Fuel Surcharge", value: "$3.25" },
      { label: "NYC Congestion Surcharge", value: "$10.25" },
    ],
    customerDetails: [
      { label: "Name", value: "John Smith" },
      { label: "Required Car Type", value: "SUV" },
      { label: "Offer Price", value: "$55.50" },
      { label: "Account No.", value: "Wes123456789" },
      { label: "Profile No.", value: "123-12321-12" },
    ],
    actionButtons: [
      {
        icon: "accept.png",
        onPress: () => console.log("Accept"),
        key: "accept",
      },
      {
        icon: "reject.png",
        onPress: () => console.log("Reject"),
        key: "reject",
      },
      { icon: "hide.png", onPress: () => console.log("Hide"), key: "hide" },
      { icon: "skip.png", onPress: () => console.log("Skip"), key: "skip" },
      {
        icon: "make-stop.png",
        onPress: () => console.log("Make Stop"),
        key: "make-stop",
      },
      {
        icon: "add-toll.png",
        onPress: () => console.log("Add Toll"),
        key: "add-toll",
      },
      {
        icon: "circling.png",
        onPress: () => console.log("Circling"),
        key: "circling",
      },
      {
        icon: "cancel-ride.png",
        onPress: () => console.log("Cancel Ride"),
        key: "cancel-ride",
      },
      {
        icon: "update-eta.png",
        onPress: () => console.log("Update ETA"),
        key: "update-eta",
      },
      { icon: "sos.png", onPress: handleSos, key: "sos" },
      {
        icon: "contact-customer.png",
        onPress: () => console.log("Contact Customer"),
        key: "contact-customer",
      },
      {
        icon: "details.png",
        onPress: () => console.log("Details"),
        key: "details",
      },
    ],
  };

  const handleDetails = () => {
    setToggleValue(RIDE_TOGGLE_LABELS.DETAILS);
  };

  const handleSwipeComplete = () => {
    switch (swipeButtonState) {
      case SWIPE_BUTTON_STATES.MARK_ARRIVED:
        setIsDriverReachedOnPickup(true);
        setSwipeButtonState(SWIPE_BUTTON_STATES.START_RIDE);
        break;
      case SWIPE_BUTTON_STATES.START_RIDE:
        setShowNotification(true);
        // Handle start ride logic
        setSwipeButtonState(SWIPE_BUTTON_STATES.END_RIDE);
        break;
      case SWIPE_BUTTON_STATES.END_RIDE:
        // Handle end ride logic
        console.log("Ride ended");
        break;
      default:
        console.warn("Unknown swipe button state:", swipeButtonState);
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

  const handleContactCustomer = () => {
    setContactCustomerSheetOpen(true);
  };

  const actionButtons: any[] = [
    {
      icon: "details.png",
      onPress: handleDetails,
      key: "details",
    },
    {
      icon: "make-stop.png",
      onPress: () => console.log("Make Stop"),
      key: "make-stop",
    },
    {
      icon: "add-toll.png",
      onPress: () => console.log("Add Toll"),
      key: "add-toll",
    },
    {
      icon: "circling.png",
      onPress: () => console.log("Circling"),
      key: "circling",
    },
    {
      icon: "cancel-ride.png",
      onPress: handleCancelRide,
      key: "cancel-ride",
    },
    {
      icon: "update-eta.png",
      onPress: handleUpdateETA,
      key: "update-eta",
    },
    { icon: "sos.png", onPress: handleSos, key: "sos" },
    {
      icon: "contact-customer.png",
      onPress: handleContactCustomer,
      key: "contact-customer",
    },
  ];

  const customerPhone = "1234567890";

  // Contact action functions
  const handleCallCustomer = async () => {
    try {
      await openPhoneDialer(customerPhone);
    } catch (error) {
      // Error handling is done within the helper function
    }
    closeContactCustomerSheet();
  };

  const handleSendSMS = async () => {
    try {
      await openSMSApp(customerPhone);
    } catch (error) {
      // Error handling is done within the helper function
    }
    closeContactCustomerSheet();
  };

  const handleWhatsApp = async () => {
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

  const handleConfirmCancel = () => {
    // Handle cancel ride logic here
    console.log("Ride cancelled:", {
      reason: selectedReason,
      comments: cancelComments,
    });
    closeConfirmationModal();
    closeCancelRideSheet();
    // Reset state
    setSelectedReason(null);
    setCancelComments("");
    // Navigate to home
    router.replace("/(tabs)");
  };

  const handleGoBack = () => {
    closeConfirmationModal();
  };

  // Update ETA handler
  const handleUpdateETASubmit = (eta: number, note?: string) => {
    // Handle ETA update logic here
    console.log("ETA updated:", { eta, note });
    closeUpdateETASheet();
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Notification Component */}
      <Notification
        type={NOTIFICATION_TYPES.AUTHORIZATION}
        title="Blink Ride"
        subtitle="Authorization"
        message="Please make a stop as requested by the customer and wait 8 mins you will be paid extra for this stop"
        visible={showNotification}
        onDismiss={() => setShowNotification(false)}
        showDismissButton={true}
        modal={true}
      />

      <Header
        title={isDriverReachedOnPickup ? "On Scene" : "En Route"}
        rightAccessory={
          <View style={styles.toggleWrap}>
            <Toggle
              variant="labeled"
              labels={labels}
              value={toggleValue}
              setValue={handleToggle}
              size={styles.headerToggleSize}
            />
          </View>
        }
        onBackPress={() => router.replace("/(tabs)")}
      />
      <View style={styles.actionBarContainer}>
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
                style={styles.actionButton}
                onPress={button.onPress}
                disabled={!button.onPress || button.disabled}
              >
                <View style={styles.actionButtonContainer}>
                  <Image
                    source={
                      ACTION_ICON_SOURCE_MAP[button.icon] ||
                      ACTION_ICON_SOURCE_MAP["details.png"]
                    }
                    style={styles.actionIcon}
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
            isDriverReachedOnPickup
              ? ""
              : "99C7+8WV, Service Road, Kahna Nau, Lahore"
          }
          showFreeWaitTimer={isDriverReachedOnPickup}
          resetCountdown={!isDriverReachedOnPickup}
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
        <JobDetails jobOffer={jobOffer} showActionBar={false} />
      </View>

      <View
        style={[
          styles.mapContainer,
          { display: toggleValue === RIDE_TOGGLE_LABELS.MAP ? "flex" : "none" },
        ]}
      >
        <RideMap
          pickupAddress="99C7+8WV, Service Road, Kahna Nau, Lahore"
          dropoffAddress="18-KM Main Lahore – Kasur Rd، opp. Descon Head Office,"
          eta={isDriverReachedOnPickup ? "" : "10 mins"}
          showWazeButton={true}
          rideStatus={isDriverReachedOnPickup ? "On Scene" : "En Route"}
          onMapReady={() => console.log("Map ready")}
          onError={(error) => console.error("Map error:", error)}
        />
      </View>

      {toggleValue === RIDE_TOGGLE_LABELS.MAP && (
        <RideAction
          leftComponent={
            <TouchableOpacity>
              <Image
                source={require("@/assets/images/actions/circling.png")}
                style={{ width: 20, height: 20 }}
              />
            </TouchableOpacity>
          }
          swipeTitle={SWIPE_BUTTON_TITLES[swipeButtonState]}
          onSwipeComplete={() => {
            handleSwipeComplete();
          }}
          rightComponent={
            <TouchableOpacity onPress={handleContactCustomer}>
              <Image
                source={require("@/assets/images/actions/contact-customer.png")}
                style={{ width: 20, height: 20 }}
              />
            </TouchableOpacity>
          }
        />
      )}

      {/* Forgot Bottom Sheet */}
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
          Phone: {customerPhone}
        </Typography>
        <View style={styles.sheetContainer}>
          {[
            {
              label: "Call Using Cellular",
              iconUrl: require("@/assets/images/phone-call.png"),
              onPress: handleCallCustomer,
            },
            {
              label: "Send SMS",
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
        snapPointsWhenKeyboardVisible={["75%"]}
        headerTitle="Cancel Ride"
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
      />

      {/* Update ETA Bottom Sheet */}
      <ETABottomSheet
        open={updateETASheetOpen}
        onClose={closeUpdateETASheet}
        onSubmit={handleUpdateETASubmit}
        snapPoints={["45%"]}
        snapPointsWhenKeyboardVisible={["80%"]}
        variant="update"
        headerTitle="Update ETA"
        description="Let the rider know if your arrival time has changed."
        showNoteSection={true}
        buttonText="Update ETA"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: textColors.white },
  toggleWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingRight: 10,
  },
  headerToggleSize: { width: 112, height: 28 },
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
});
