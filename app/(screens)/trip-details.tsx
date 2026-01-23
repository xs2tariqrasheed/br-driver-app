import Header from "@/components/Header";
import JobDetails from "@/components/JobDetails";
import { activeTripApiClient } from "@/config/apiConfig";
import { textColors } from "@/constants/colors";
import { ACTIVE_TRIP_ROUTES } from "@/constants/endpoints";
import { useBroadcastJobOffers } from "@/context/BroadcastJobOffersContext";
import { transformTripDetailsFromDb, transformTripDetailsToJobOffer } from "@/utils/helpers";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, View } from "react-native";

/**
 * Transform broadcast offer to JobDetails format
 */
function transformBroadcastOfferToJobOffer(broadcastOffer: any) {
  return {
    id: broadcastOffer.id,
    dateTime: new Date(broadcastOffer.timestamp).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }),
    rideType: broadcastOffer.rideType,
    peopleCount: broadcastOffer.peopleCount,
    rating: broadcastOffer.rating,
    hasSpecialRequirements: broadcastOffer.hasSpecialRequirements,
    onPressSpecialRequirements: () => { },
    hasPackage: broadcastOffer.hasPackage,
    onPressPackage: () => { },
    pickupTime: broadcastOffer.pickupTime,
    pickupDistance: broadcastOffer.pickupDistance,
    pickupAddress: broadcastOffer.pickupAddress,
    dropoffTime: broadcastOffer.dropoffTime,
    dropoffDistance: broadcastOffer.dropoffDistance,
    dropoffAddress: broadcastOffer.dropoffAddress,
    rideTime: broadcastOffer.rideTime,
    rideDistance: broadcastOffer.rideDistance,
    totalPrice: broadcastOffer.totalPrice,
    driverEarn: broadcastOffer.driverEarn,
    buttonTitle: broadcastOffer.buttonTitle,
    disabled: broadcastOffer.status !== "offered",
    onButtonClick: () => { },
    driverInstructions: "Please arrive on time and follow customer instructions.",
    fareDetails: [
      {
        label: "Ride Price",
        value: `$${broadcastOffer.totalPrice.toFixed(2)}`,
      },
      {
        label: "Tolls (EZ Pass)",
        value: "$0.00",
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
    ],
    customerDetails: [
      { label: "Name", value: "Customer" },
      {
        label: "Required Car Type",
        value: "Sedan",
      },
      {
        label: "Offer Price",
        value: `$${broadcastOffer.totalPrice.toFixed(2)}`,
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
    expiredAt: broadcastOffer.expiredAt,
  };
}

export default function TripDetailsScreen() {
  const params = useLocalSearchParams<{ offerId?: string; tripNumber?: string }>();
  const { broadcastOffers } = useBroadcastJobOffers();
  const [jobOfferData, setJobOfferData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTripData = async () => {
      // Priority 1: If tripNumber is provided, fetch from API
      if (params.tripNumber) {
        try {
          setIsLoading(true);
          setError(null);
          const endpoint = `${ACTIVE_TRIP_ROUTES.GET_TRIP_BY_NUMBER}/${params.tripNumber}`;

          const response = await activeTripApiClient.get(endpoint);
          const responseData = response.data as any;

          const responseCode = responseData?.jHeader?.responseCode;
          const isSuccess = responseCode === 0 || responseCode === "0" || responseCode === undefined;

          if (isSuccess && responseData?.data) {
            const transformed = transformTripDetailsFromDb(responseData.data);
            if (transformed) {
              const jobOffer = transformTripDetailsToJobOffer(transformed);
              setJobOfferData(jobOffer);
            } else {
              console.error("❌ [TripDetails] Failed to transform trip data");
              setError("Failed to parse trip data");
            }
          } else {
            const errorMsg = responseData?.jHeader?.message || "Failed to fetch trip details";
            console.error("❌ [TripDetails] API Error:", errorMsg);
            console.error("❌ [TripDetails] Response Code:", responseCode);
            setError(errorMsg);
          }
        } catch (err: any) {
          console.error("❌ [TripDetails] Error Type:", err?.name);
          if (err?.response) {
            console.error("❌ [TripDetails] Error Response Status:", err.response.status);
          }
          setError(err?.message || "Failed to load trip details");
        } finally {
          setIsLoading(false);
        }
        return;
      }

      // Priority 2: If offerId is provided, use broadcast offers
      if (params.offerId) {
        const offer = broadcastOffers.find((o) => o.id === params.offerId);
        if (offer) {
          const transformed = transformBroadcastOfferToJobOffer(offer);
          setJobOfferData(transformed);
        }
      }
    };

    loadTripData();
  }, [params.offerId, params.tripNumber, broadcastOffers]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Trip Details" onBackPress={() => router.back()} />
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={textColors.teal900} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Trip Details" onBackPress={() => router.back()} />
        <View style={styles.emptyContainer}>
          {/* Could add error message display here */}
        </View>
      </SafeAreaView>
    );
  }

  if (!jobOfferData) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Trip Details" onBackPress={() => router.back()} />
        <View style={styles.emptyContainer}>
          {/* Could add loading or error state here */}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <Header title="Trip Details" onBackPress={() => router.back()} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <JobDetails jobOffer={jobOfferData} showActionBar={false} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: textColors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

