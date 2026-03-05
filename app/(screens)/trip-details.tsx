import Header from '@/components/Header';
import JobDetails from '@/components/JobDetails';
import Typography from '@/components/Typography';
import { activeTripApiClient } from '@/config/apiConfig';
import { textColors } from '@/constants/colors';
import { ACTIVE_TRIP_ROUTES } from '@/constants/endpoints';
import { useBroadcastJobOffers } from '@/context/BroadcastJobOffersContext';
import {
  TRIP_DETAILS_CONTENT_KEYS,
  TRIP_DETAILS_CUSTOMER_LABEL_KEYS,
  TRIP_DETAILS_FARE_LABEL_KEYS,
} from '@/content/trip-details-keys';
import { useGetContent } from '@/hooks/useGetContent';
import {
  formatDateTimeToReadableFormat,
  tripDetailsApiResponseToJobOffer,
} from '@/utils/helpers';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRideOffer } from '@/context/RideOfferContext';

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
    disabled: broadcastOffer.status !== 'offered',
    onButtonClick: () => {},
    driverInstructions: getContent(
      TRIP_DETAILS_CONTENT_KEYS.DEMO_INSTRUCTIONS_LABEL
    ),
    fareDetails: [
      {
        label: getContent(TRIP_DETAILS_CONTENT_KEYS.FARE_RIDE_PRICE_LABEL),
        value: `$${broadcastOffer.totalPrice.toFixed(2)}`,
      },
      {
        label: getContent(TRIP_DETAILS_CONTENT_KEYS.FARE_TOLLS_LABEL),
        value: '$0.00',
      },
      {
        label: getContent(TRIP_DETAILS_CONTENT_KEYS.FARE_TIPS_LABEL),
        value: '$0.00',
      },
      {
        label: getContent(TRIP_DETAILS_CONTENT_KEYS.FARE_DISCOUNT_LABEL),
        value: '$0.00',
      },
      {
        label: getContent(TRIP_DETAILS_CONTENT_KEYS.FARE_SERVICE_CHARGES_LABEL),
        value: '$1.50',
      },
      {
        label: getContent(TRIP_DETAILS_CONTENT_KEYS.FARE_FUEL_SURCHARGE_LABEL),
        value: '$1.00',
      },
    ],
    customerDetails: [
      {
        label: getContent(TRIP_DETAILS_CONTENT_KEYS.CUSTOMER_NAME_LABEL),
        value: 'Customer',
      },
      {
        label: getContent(TRIP_DETAILS_CONTENT_KEYS.CUSTOMER_CAR_TYPE_LABEL),
        value: 'Sedan',
      },
      {
        label: getContent(TRIP_DETAILS_CONTENT_KEYS.CUSTOMER_OFFER_PRICE_LABEL),
        value: `$${broadcastOffer.totalPrice.toFixed(2)}`,
      },
      {
        label: getContent(TRIP_DETAILS_CONTENT_KEYS.CUSTOMER_ACCOUNT_LABEL),
        value: '123456789',
      },
      {
        label: getContent(TRIP_DETAILS_CONTENT_KEYS.CUSTOMER_PROFILE_NO_LABEL),
        value: '987654321',
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
  const { currentOffer: sequentialOffer, getTemporaryRideByTripId } =
    useRideOffer();
  const [jobOfferData, setJobOfferData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const content = useMemo(
    () => ({
      headerTitle: getContent(TRIP_DETAILS_CONTENT_KEYS.HEADER_TITLE),
      errorPrefixLabel: getContent(
        TRIP_DETAILS_CONTENT_KEYS.ERROR_PREFIX_LABEL
      ),
      actionRetryLabel: getContent(
        TRIP_DETAILS_CONTENT_KEYS.ACTION_RETRY_LABEL
      ),
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
        broadcastOffers?.find((o: any) => o.id === params.offerId) ?? {},
        getContent
      )
    );
    setIsLoading(false);
  };

  /**
   * Load trip details from API (single source of truth for real trips).
   * Empty/null values from API are shown as "N/A".
   */
  const loadTripDetailsFromApi = async () => {
    if (!params.tripNumber && !params.offerId) return;
    const tripNumber = params.tripNumber || params.offerId;
    try {
      setIsLoading(true);
      setError(null);

      const activeBroadcastOffer =
        broadcastOffers?.find((o: any) => o.id === tripNumber) ?? null;
      const activeSequentialOffer =
        sequentialOffer &&
        String(sequentialOffer.tripOffer?.tripId) === String(tripNumber)
          ? sequentialOffer
          : tripNumber
          ? getTemporaryRideByTripId(tripNumber)
          : null;

      const activeOffer = activeBroadcastOffer ?? activeSequentialOffer ?? null;

      const endpoint = `${ACTIVE_TRIP_ROUTES.GET_TRIP_BY_NUMBER}/${tripNumber}`;

      // Add a client-side timeout so slow or hanging networks don't keep the loader spinning forever.
      const REQUEST_TIMEOUT_MS = 15000; // 15 seconds
      const timeoutError = new Error(
        "Request timed out. Please check your internet connection and try again.",
      );

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(timeoutError), REQUEST_TIMEOUT_MS),
      );

      const response = (await Promise.race([
        activeTripApiClient.get(endpoint),
        timeoutPromise,
      ])) as any;
      const responseData = response.data as any;

      const isSuccess =
        responseData?.success === true && responseData?.data?.trip != null;
      const tripPayload = responseData?.data?.trip ?? responseData?.data;

      if (isSuccess && tripPayload) {
        const jobOfferFromApi = tripDetailsApiResponseToJobOffer(tripPayload);
        if (jobOfferFromApi) {
          const appendRideTimeAndDistance = {
            ...jobOfferFromApi,
            pickupTime: activeOffer?.pickupTime ?? 0,
            pickupDistance: activeOffer?.pickupDistance ?? 0,
            dropoffTime: activeOffer?.dropoffTime ?? 0,
            dropoffDistance: Number(activeOffer?.dropoffDistance) ?? 0,
            rideTime: activeOffer?.rideTime ?? 0,
            rideDistance: Number(activeOffer?.rideDistance) ?? 0,
          };
          setJobOfferData(
            applyContentLabelsToJobOffer(appendRideTimeAndDistance, getContent)
          );
          setIsLoading(false);
        } else {
          setIsLoading(false);
          setError(getContent(TRIP_DETAILS_CONTENT_KEYS.ERROR_FETCH_LABEL));
        }
      } else {
        const errorMsg =
          responseData?.message ??
          responseData?.error ??
          getContent(TRIP_DETAILS_CONTENT_KEYS.ERROR_FETCH_LABEL);
        setError(errorMsg);
        setIsLoading(false);
      }
    } catch (err: any) {
      const message =
        err?.message ||
        getContent(TRIP_DETAILS_CONTENT_KEYS.ERROR_LOAD_LABEL);
      setError(message);
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const isDemoOffer = params?.offerId?.includes('demo-');
    // Demo offers: use broadcast offers for testing only
    if (isDemoOffer) {
      loadDemoDetails();
    } else {
      // Real trips: single source of truth from API (N/A for empty/null)
      loadTripDetailsFromApi();
    }
  }, [params.offerId, params.tripNumber, broadcastOffers, sequentialOffer]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <Header title={content.headerTitle} onBackPress={() => router.back()} />
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={textColors.teal900}/>
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
          <Typography
            type="bodyMedium"
            weight="regular"
            style={styles.errorMessage}
          >
            {content.errorPrefixLabel}
            {error}
          </Typography>
          <TouchableOpacity
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
          </TouchableOpacity>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: textColors.teal900,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    color: textColors.teal900,
  },
  errorMessage: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    color: textColors.black,
  },
});
