import Header from "@/components/Header";
import JobDetails from "@/components/JobDetails";
import Typography from "@/components/Typography";
import { activeTripApiClient } from "@/config/apiConfig";
import { textColors } from "@/constants/colors";
import { ACTIVE_TRIP_ROUTES } from "@/constants/endpoints";
import { useBroadcastJobOffers } from "@/context/BroadcastJobOffersContext";
import {
  TRIP_DETAILS_CONTENT_KEYS,
  TRIP_DETAILS_CUSTOMER_LABEL_KEYS,
  TRIP_DETAILS_FARE_LABEL_KEYS,
} from "@/content/trip-details-keys";
import { useGetContent } from "@/hooks/useGetContent";
import {
  formatDateTimeToReadableFormat,
  tripDetailsApiResponseToJobOffer,
} from "@/utils/helpers";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

/**
 * Apply content labels to job offer fare/customer details (for API-sourced data).
 */
function applyContentLabelsToJobOffer(
  jobOffer: any,
  getContent: (key: string) => string
): any {
  if (!jobOffer) return jobOffer;
  const fareDetails = Array.isArray(jobOffer.fareDetails)
    ? jobOffer.fareDetails.map((item: any, i: number) => ({
        ...item,
        label: TRIP_DETAILS_FARE_LABEL_KEYS[i]
          ? getContent(TRIP_DETAILS_FARE_LABEL_KEYS[i])
          : item.label,
      }))
    : jobOffer.fareDetails;
  const customerDetails = Array.isArray(jobOffer.customerDetails)
    ? jobOffer.customerDetails.map((item: any, i: number) => ({
        ...item,
        label: TRIP_DETAILS_CUSTOMER_LABEL_KEYS[i]
          ? getContent(TRIP_DETAILS_CUSTOMER_LABEL_KEYS[i])
          : item.label,
      }))
    : jobOffer.customerDetails;
  return { ...jobOffer, fareDetails, customerDetails };
}

/**
 * Transform broadcast offer to JobDetails format for demo details (uses content labels).
 */
function transformBroadcastOfferToJobOfferForDemo(
  broadcastOffer: any,
  getContent: (key: string) => string
) {
  return {
    id: broadcastOffer.id,
    dateTime: formatDateTimeToReadableFormat(broadcastOffer.timestamp),
    rideType: broadcastOffer.rideType,
    peopleCount: broadcastOffer.peopleCount,
    rating: broadcastOffer.rating,
    hasSpecialRequirements: broadcastOffer.hasSpecialRequirements,
    onPressSpecialRequirements: () => {},
    hasPackage: broadcastOffer.hasPackage,
    onPressPackage: () => {},
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
    onButtonClick: () => {},
    driverInstructions: getContent(TRIP_DETAILS_CONTENT_KEYS.DEMO_INSTRUCTIONS_LABEL),
    fareDetails: [
      {
        label: getContent(TRIP_DETAILS_CONTENT_KEYS.FARE_RIDE_PRICE_LABEL),
        value: `$${broadcastOffer.totalPrice.toFixed(2)}`,
      },
      {
        label: getContent(TRIP_DETAILS_CONTENT_KEYS.FARE_TOLLS_LABEL),
        value: "$0.00",
      },
      {
        label: getContent(TRIP_DETAILS_CONTENT_KEYS.FARE_TIPS_LABEL),
        value: "$0.00",
      },
      {
        label: getContent(TRIP_DETAILS_CONTENT_KEYS.FARE_DISCOUNT_LABEL),
        value: "$0.00",
      },
      {
        label: getContent(TRIP_DETAILS_CONTENT_KEYS.FARE_SERVICE_CHARGES_LABEL),
        value: "$1.50",
      },
      {
        label: getContent(TRIP_DETAILS_CONTENT_KEYS.FARE_FUEL_SURCHARGE_LABEL),
        value: "$1.00",
      },
    ],
    customerDetails: [
      {
        label: getContent(TRIP_DETAILS_CONTENT_KEYS.CUSTOMER_NAME_LABEL),
        value: "Customer",
      },
      {
        label: getContent(TRIP_DETAILS_CONTENT_KEYS.CUSTOMER_CAR_TYPE_LABEL),
        value: "Sedan",
      },
      {
        label: getContent(TRIP_DETAILS_CONTENT_KEYS.CUSTOMER_OFFER_PRICE_LABEL),
        value: `$${broadcastOffer.totalPrice.toFixed(2)}`,
      },
      {
        label: getContent(TRIP_DETAILS_CONTENT_KEYS.CUSTOMER_ACCOUNT_LABEL),
        value: "123456789",
      },
      {
        label: getContent(TRIP_DETAILS_CONTENT_KEYS.CUSTOMER_PROFILE_NO_LABEL),
        value: "987654321",
      },
    ],
    expiredAt: broadcastOffer.expiredAt,
  };
}

export default function TripDetailsScreen() {
  const params = useLocalSearchParams<{
    offerId?: string;
    tripNumber?: string;
  }>();
  const { getContent } = useGetContent();
  const { broadcastOffers } = useBroadcastJobOffers();
  const [jobOfferData, setJobOfferData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const content = useMemo(
    () => ({
      headerTitle: getContent(TRIP_DETAILS_CONTENT_KEYS.HEADER_TITLE),
      errorPrefixLabel: getContent(TRIP_DETAILS_CONTENT_KEYS.ERROR_PREFIX_LABEL),
      actionRetryLabel: getContent(TRIP_DETAILS_CONTENT_KEYS.ACTION_RETRY_LABEL),
      emptyStateLabel: getContent(TRIP_DETAILS_CONTENT_KEYS.EMPTY_STATE_LABEL),
      errorFetchLabel: getContent(TRIP_DETAILS_CONTENT_KEYS.ERROR_FETCH_LABEL),
      errorLoadLabel: getContent(TRIP_DETAILS_CONTENT_KEYS.ERROR_LOAD_LABEL),
    }),
    [getContent]
  );

  /**
   * Load trip data broadcast offers for demo details
   */
  const loadDemoDetails = () => {
    setJobOfferData(
      transformBroadcastOfferToJobOfferForDemo(
        broadcastOffers.find((o) => o.id === params.offerId) ?? {},
        getContent
      )
    );
    setIsLoading(false);
  };

  /**
   * Load trip details from API
   */
  const loadTripDetailsFromApi = async () => {
    // If tripNumber or offerId is provided, fetch from API
    if (params.tripNumber || params.offerId) {
      try {
        const tripNumber = params.tripNumber || params.offerId;
        setIsLoading(true);
        setError(null);
        const endpoint = `${ACTIVE_TRIP_ROUTES.GET_TRIP_BY_NUMBER}/${tripNumber}`;

        const response = await activeTripApiClient.get(endpoint);
        const responseData = response.data as any;

        const responseCode = responseData?.jHeader?.responseCode;
        const isSuccess =
          responseCode === 0 ||
          responseCode === "0" ||
          responseCode === undefined;

        if (isSuccess && responseData?.data) {
          const jobOfferDataFromApi = tripDetailsApiResponseToJobOffer(
            responseData.data
          );
          const jobOfferDataFromBroadcast = broadcastOffers.find(
            (o) => o.id === tripNumber
          );

          if (jobOfferDataFromBroadcast || jobOfferDataFromApi) {
            const merged = {
              ...jobOfferDataFromBroadcast,
              fareDetails: jobOfferDataFromApi?.fareDetails,
              customerDetails: jobOfferDataFromApi?.customerDetails,
              driverInstructions: jobOfferDataFromApi?.driverInstructions,
              dateTime: formatDateTimeToReadableFormat(
                jobOfferDataFromBroadcast?.timestamp ??
                  jobOfferDataFromApi?.dateTime
              ),
            };
            setJobOfferData(applyContentLabelsToJobOffer(merged, getContent));
          }
        } else {
          const errorMsg =
            responseData?.jHeader?.message ||
            getContent(TRIP_DETAILS_CONTENT_KEYS.ERROR_FETCH_LABEL);
          console.error("❌ [TripDetails] API Error:", errorMsg);
          console.error("❌ [TripDetails] Response Code:", responseCode);
          setError(errorMsg);
        }
      } catch (err: any) {
        console.error("❌ [TripDetails] Error Type:", err?.name);
        if (err?.response) {
          console.error(
            "❌ [TripDetails] Error Response Status:",
            err.response.status
          );
        }
        setError(
          err?.message ||
            getContent(TRIP_DETAILS_CONTENT_KEYS.ERROR_LOAD_LABEL)
        );
      } finally {
        setIsLoading(false);
      }
      return;
    }
  };

  useEffect(() => {
    const isDemoOffer = params?.offerId?.includes("demo-");
    // If demo offer, set job offer data from broadcast offers for the demo details
    if (isDemoOffer) {
      loadDemoDetails();
    } else {
      // Otherwise, load trip data from API
      loadTripDetailsFromApi();
    }
  }, [params.offerId, params.tripNumber, broadcastOffers]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <Header title={content.headerTitle} onBackPress={() => router.back()} />
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={textColors.teal900} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <Header title={content.headerTitle} onBackPress={() => router.back()} />
        <View style={styles.emptyContainer}>
          <Text>
            {content.errorPrefixLabel}
            {error}
          </Text>
          <Pressable
            style={styles.retryButton}
            onPress={() => loadTripDetailsFromApi()}
            disabled={isLoading}
          >
            <Typography
              type="bodyMedium"
              weight="semibold"
              style={styles.retryButtonText}
            >
              {content.actionRetryLabel}
            </Typography>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!jobOfferData) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <Header title={content.headerTitle} onBackPress={() => router.back()} />
        <View style={styles.emptyContainer}>
          <Text>{content.emptyStateLabel}</Text>
          <Pressable
            style={styles.retryButton}
            onPress={() => loadTripDetailsFromApi()}
            disabled={isLoading}
          >
            <Typography
              type="bodyMedium"
              weight="semibold"
              style={styles.retryButtonText}
            >
              {content.actionRetryLabel}
            </Typography>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <Header title={content.headerTitle} onBackPress={() => router.back()} />
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
  retryButton: {
    marginTop: 20,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    color: textColors.white,
  },
});
