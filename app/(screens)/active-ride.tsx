import BottomSheet from "@/components/BottomSheet";
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
  NOTIFICATION_TYPES,
  RIDE_TOGGLE_LABELS,
  RIDE_TYPES,
  RideToggleLabel,
  SWIPE_BUTTON_STATES,
  SWIPE_BUTTON_TITLES,
  SwipeButtonState,
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

  const handleToggle = (next: string) => {
    setToggleValue(next as RideToggleLabel);
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
      { icon: "sos.png", onPress: () => console.log("SOS"), key: "sos" },
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
      onPress: () => console.log("Cancel Ride"),
      key: "cancel-ride",
    },
    {
      icon: "update-eta.png",
      onPress: () => console.log("Update ETA"),
      key: "update-eta",
    },
    { icon: "sos.png", onPress: () => console.log("SOS"), key: "sos" },
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
    shadowColor: textColors.black,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
    paddingVertical: 14,
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
});
