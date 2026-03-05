import { textColors } from '@/constants/colors';
import { LIVE_JOB_ENDPOINTS } from '@/constants/endpoints';
import {
  API_CLIENT_TYPES,
  ETA_BUFFER_MINUTES_MAX,
  ETA_BUFFER_MINUTES_MIN,
} from '@/constants/global';

import { BID_BOTTOM_SHEET_CONTENT_KEYS } from '@/content/components/bid-bottom-sheet-keys';
import { useSettings } from '@/context/SettingsContext';
import { useFetch } from '@/hooks/useFetch';
import { useGetContent } from '@/hooks/useGetContent';
import {
  getPercentFromAutoBidStrategy,
  SystemSuggestedBid,
  transformBidPrices,
} from '@/utils/helpers';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Button from '../Button';
import Counter from '../Counter';
import Divider from '../Divider';
import Toggle from '../Form/Toggle';
import SkeletonLoader from '../Loader/SkeletonLoader';
import Typography from '../Typography';

export interface BidData {
  amount: number | string;
  bosstedAmount: number;
  driverEarn: number;
  numberOfBids: number;
  systemEta: number;
  systemSuggestedBids: SystemSuggestedBid[];
  boostedPrices: number[];
  createdAt: string;
}

export interface BidBottomSheetModalProps {
  bid: BidData;
  onSubmit: (data: {
    selectedBid: number;
    eta: number;
    boostAmount: number;
    isBoosted: boolean;
  }) => void;
  onClose: () => void;
  open?: boolean;
  isLoading?: boolean;
}

/**
 * BidBottomSheetModal Component
 * A modal version of BidBottomSheet with the same UI and logic.
 * Matches the UI style of SpecialRequirementsModal and PackageInfoModal.
 */
const BidBottomSheetModal: React.FC<BidBottomSheetModalProps> = ({
  bid,
  onSubmit,
  onClose,
  open = false,
  isLoading = false,
}) => {
  const {
    amount: rawAmount,
    systemEta,
    systemSuggestedBids: initialSystemSuggestedBids,
    boostedPrices: initialBoostedPrices,
    numberOfBids,
  } = bid;

  // Ensure amount is always a number (backend/parent may send "30.00" as string)
  const amount =
    typeof rawAmount === 'number'
      ? rawAmount
      : (() => {
          const parsed = parseFloat(String(rawAmount));
          return Number.isFinite(parsed) ? parsed : 0;
        })();

  const { height: screenHeight } = Dimensions.get('window');
  const MAX_HEIGHT = screenHeight * 0.95;

  // Get content
  const { getContent } = useGetContent();
  const {
    headerTitle,
    sectionAdjustPrice,
    sectionEtaLabel,
    sectionEtaSuffix,
    sectionBoostLabel,
    sectionBoostSuffix,
    actionSubmit,
  } = useMemo(() => {
    const get = getContent;
    return {
      headerTitle: get(BID_BOTTOM_SHEET_CONTENT_KEYS.HEADER_TITLE),
      sectionAdjustPrice: get(
        BID_BOTTOM_SHEET_CONTENT_KEYS.SECTION_ADJUST_PRICE
      ),
      sectionEtaLabel: get(BID_BOTTOM_SHEET_CONTENT_KEYS.SECTION_ETA_LABEL),
      sectionEtaSuffix: get(BID_BOTTOM_SHEET_CONTENT_KEYS.SECTION_ETA_SUFFIX),
      sectionBoostLabel: get(BID_BOTTOM_SHEET_CONTENT_KEYS.SECTION_BOOST_LABEL),
      sectionBoostSuffix: get(
        BID_BOTTOM_SHEET_CONTENT_KEYS.SECTION_BOOST_SUFFIX
      ),
      actionSubmit: get(BID_BOTTOM_SHEET_CONTENT_KEYS.ACTION_SUBMIT),
    };
  }, [getContent]);

  // Fetch system suggested bid prices
  const { execute: fetchBidPrices, loading: isLoadingPrices } = useFetch(
    LIVE_JOB_ENDPOINTS.getSystemSuggestedBidPrices,
    API_CLIENT_TYPES.AUCTION
  );

  // State for fetched prices
  const [fetchedSystemSuggestedBids, setFetchedSystemSuggestedBids] = useState<
    SystemSuggestedBid[] | null
  >(null);
  const [fetchedBoostedPrices, setFetchedBoostedPrices] = useState<
    number[] | null
  >(null);
  const [fetchedBidsOnThisJob, setFetchedBidsOnThisJob] = useState<
    string | null
  >(null);
  const [fetchedDriverPayoutPercentage, setFetchedDriverPayoutPercentage] =
    useState<number | null>(null);

  // Use fetched prices if available, otherwise use initial prices
  const systemSuggestedBids =
    fetchedSystemSuggestedBids || initialSystemSuggestedBids;
  const boostedPrices = fetchedBoostedPrices || initialBoostedPrices;

  const [selectedBid, setSelectedBid] = useState(amount);
  const [eta, setEta] = useState(systemEta);
  const [isBoosted, setIsBoosted] = useState(false);
  const [boostAmount, setBoostAmount] = useState(boostedPrices[0] || 0);

  const [settings] = useSettings();
  const prevOpenRef = useRef(false);

  // Apply saved driver settings when modal opens (ETA buffer, Boost My Bid, Adjust Price %)
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      prevOpenRef.current = true;
      const etaMinutes = settings.etaBufferMinutes ?? 0;
      const etaVal = Math.min(
        ETA_BUFFER_MINUTES_MAX,
        Math.max(ETA_BUFFER_MINUTES_MIN, systemEta + etaMinutes)
      );
      setEta(etaVal);

      const featured = settings.featuredDriverPriceUSD ?? 0;
      if (featured > 0) {
        setIsBoosted(true);
        setBoostAmount(featured);
      } else {
        setIsBoosted(false);
      }

      if (settings.autoBidEnabled && settings.autoBidStrategy != null) {
        const pct = getPercentFromAutoBidStrategy(settings.autoBidStrategy);
        const adjusted = amount * (1 + pct / 100);
        setSelectedBid(adjusted);
      } else {
        setSelectedBid(amount);
      }
    }
    if (!open) prevOpenRef.current = false;
  }, [
    open,
    amount,
    systemEta,
    settings.etaBufferMinutes,
    settings.featuredDriverPriceUSD,
    settings.autoBidEnabled,
    settings.autoBidStrategy,
    systemSuggestedBids,
    boostedPrices,
    initialSystemSuggestedBids,
  ]);

  // Fetch prices when modal opens
  useEffect(() => {
    if (open) {
      const loadBidPrices = async () => {
        try {
          const response = await fetchBidPrices();

          // Check DB response format
          const responseCode = response?.jHeader?.responseCode;
          const isSuccess =
            responseCode === 0 ||
            responseCode === '0' ||
            responseCode === undefined;

          if (isSuccess && response) {
            // Transform from raw DB response structure
            // useFetch extracts response.data.data ?? response.data, so response is the DB response
            const jData = response.jData || response.data?.jData;
            const systemSuggestedPrices = jData?.system_suggested_prices;

            if (systemSuggestedPrices) {
              // Use helper function to transform the data
              const transformed = transformBidPrices(systemSuggestedPrices);

              if (transformed.systemSuggestedBids.length > 0) {
                setFetchedSystemSuggestedBids(transformed.systemSuggestedBids);
              }
              if (transformed.boostedPrices.length > 0) {
                setFetchedBoostedPrices(transformed.boostedPrices);
              }
              if (transformed.bidsOnThisJob !== null) {
                setFetchedBidsOnThisJob(transformed.bidsOnThisJob);
              }
              if (transformed.driverPayoutPercentage !== null) {
                setFetchedDriverPayoutPercentage(
                  transformed.driverPayoutPercentage
                );
              }
            } else {
              console.log(
                '⚠️ [BidBottomSheetModal] No system_suggested_prices found in response'
              );
            }
          }
        } catch (error) {
          console.error('Error fetching bid prices:', error);
          // Continue with initial prices if fetch fails
        }
      };

      loadBidPrices();
    }
  }, [open, fetchBidPrices]);

  // Get min and max values from suggested bids
  // const minBid =
  //   systemSuggestedBids.length > 0
  //     ? Math.min(...systemSuggestedBids.map((b) => b.amount))
  //     : amount;
  // const maxBid =
  //   systemSuggestedBids.length > 0
  //     ? Math.max(...systemSuggestedBids.map((b) => b.amount))
  //     : amount;
  // const minBoost = boostedPrices.length > 0 ? Math.min(...boostedPrices) : 0;
  // const maxBoost = boostedPrices.length > 0 ? Math.max(...boostedPrices) : 0;

  // Find the selected bid data
  const selectedBidData = systemSuggestedBids.find(
    (b) => b.amount === selectedBid
  );

  // Calculate driver earnings for selected bid
  // driver_payout_percentage is the system charge percentage, so driver earns: bidAmount * (1 - systemChargePercentage)
  const calculateDriverEarn = (bidAmount: number): number => {
    const systemChargePercentage =
      fetchedDriverPayoutPercentage !== null
        ? fetchedDriverPayoutPercentage / 100
        : 0.15; // Default 15% system charge (85% driver payout)
    const earn = bidAmount * (1 - systemChargePercentage);
    // Keep cents precision so small charges (e.g., 2.5%) are visible
    return Math.round(earn * 100) / 100;
  };

  const handleSubmit = () => {
    onSubmit({
      selectedBid,
      eta,
      boostAmount,
      isBoosted,
    });
  };

  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View
          style={[styles.container, { maxHeight: MAX_HEIGHT }]}
          onStartShouldSetResponder={() => true}
          onResponderGrant={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View style={styles.header}>
            <Typography
              type="bodyLarge"
              weight="semibold"
              style={styles.headerTitle}
            >
              {headerTitle}
            </Typography>
            <View style={styles.placeholder} />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              disabled={isLoading}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Header */}
            <View
              style={[
                styles.peopleSectionHeader,
                { paddingVertical: isBoosted ? 0 : 10 },
              ]}
            >
              <View />
              <View style={styles.peopleSection}>
                <Image
                  source={require('@/assets/images/peoples.png')}
                  style={styles.peopleIcon}
                />
                {isLoadingPrices ? (
                  <SkeletonLoader
                    width={40}
                    height={20}
                    borderRadius={4}
                    animated={true}
                  />
                ) : (
                  <Typography
                    type="bodyLarge"
                    weight="regular"
                    style={styles.peopleText}
                  >
                    {fetchedBidsOnThisJob !== null
                      ? fetchedBidsOnThisJob
                      : `< ${numberOfBids}`}
                  </Typography>
                )}
              </View>
            </View>
            {/* Adjust Price Heading */}
            <Typography
              type="bodyLarge"
              weight="semibold"
              style={styles.sectionHeading}
            >
              {sectionAdjustPrice}
            </Typography>
            {/* Suggested Bid Buttons */}
            <View style={styles.suggestedBidsContainer}>
              {isLoadingPrices ? (
                // Show skeleton loaders matching the bid button structure
                <>
                  {[1, 2, 3, 4, 5].map((index) => (
                    <View key={`skeleton-${index}`} style={styles.bidButton}>
                      <SkeletonLoader
                        width="100%"
                        height={20}
                        borderRadius={4}
                        animated={true}
                      />
                    </View>
                  ))}
                </>
              ) : (
                systemSuggestedBids.map((suggestedBid) => (
                  <Pressable
                    key={suggestedBid.amount}
                    style={[
                      styles.bidButton,
                      selectedBid === suggestedBid.amount &&
                        styles.selectedBidButton,
                    ]}
                    onPress={() => setSelectedBid(suggestedBid.amount)}
                  >
                    <Typography
                      type="bodyLarge"
                      weight="semibold"
                      style={[
                        styles.bidButtonText,
                        selectedBid === suggestedBid.amount &&
                          styles.selectedBidButtonText,
                      ]}
                    >
                      ${suggestedBid.amount}
                    </Typography>
                  </Pressable>
                ))
              )}
            </View>

            {/* Bid Counter */}
            {isLoadingPrices ? (
              <View style={styles.counterSkeletonContainer}>
                <SkeletonLoader
                  width="100%"
                  height={50}
                  borderRadius={8}
                  animated={true}
                />
              </View>
            ) : (
              <Counter
                editable={true}
                value={selectedBid}
                onChange={setSelectedBid}
                //NOTE: HIDDEN MIN AND MAX VALUES FOR NOW WILL BE ADDED BACK LATER
                // min={minBid}
                // max={maxBid}
                min={1}
                step={1}
                formatLabel={(value) => {
                  const earn = calculateDriverEarn(value);
                  return `$${value?.toFixed(2)} ($${earn.toFixed(2)})`;
                }}
              />
            )}

            <Divider marginVertical={24} />

            {/* ETA Section */}
            <View style={styles.etaSection}>
              <Typography
                type="bodyLarge"
                weight="semibold"
                style={styles.etaSectionTitle}
              >
                {sectionEtaLabel}{' '}
                <Typography
                  type="bodyLarge"
                  weight="regular"
                  style={styles.etaSectionTitle}
                >
                  {sectionEtaSuffix}
                </Typography>
              </Typography>
              {isLoadingPrices ? (
                <View style={styles.counterSkeletonContainer}>
                  <SkeletonLoader
                    width="100%"
                    height={50}
                    borderRadius={8}
                    animated={true}
                  />
                </View>
              ) : (
                <Counter
                  editable={true}
                  containerStyle={styles.etaCounterContainer}
                  value={eta}
                  onChange={setEta}
                  min={1}
                  max={30}
                  step={1}
                  formatLabel={(value) => `${value} mins`}
                />
              )}
            </View>

            <Divider marginBottom={20} marginTop={-1} />

            {/* Boost Section */}
            <View style={styles.boostSection}>
              <View style={styles.boostHeader}>
                <Typography
                  type="bodyLarge"
                  weight="semibold"
                  style={styles.sectionTitle}
                >
                  {sectionBoostLabel}{' '}
                  <Typography
                    type="bodyLarge"
                    weight="regular"
                    style={styles.etaSectionTitle}
                  >
                    {sectionBoostSuffix}
                  </Typography>
                </Typography>
                {isLoadingPrices ? (
                  <SkeletonLoader
                    width={42}
                    height={24}
                    borderRadius={12}
                    animated={true}
                  />
                ) : (
                  <Toggle
                    value={isBoosted}
                    setValue={setIsBoosted}
                    size={{ width: 42, height: 24 }}
                  />
                )}
              </View>

              {isLoadingPrices ? (
                <>
                  <View style={styles.boostButtonsContainer}>
                    {[1, 2, 3, 4].map((index) => (
                      <View
                        key={`boost-skeleton-${index}`}
                        style={styles.bidButton}
                      >
                        <SkeletonLoader
                          width="100%"
                          height={20}
                          borderRadius={4}
                          animated={true}
                        />
                      </View>
                    ))}
                  </View>
                  <View style={styles.counterSection}>
                    <SkeletonLoader
                      width="100%"
                      height={50}
                      borderRadius={8}
                      animated={true}
                    />
                  </View>
                </>
              ) : (
                isBoosted && (
                  <>
                    {/* Boost Amount Buttons */}
                    <View style={styles.boostButtonsContainer}>
                      {boostedPrices?.map((boostPrice) => (
                        <Pressable
                          key={boostPrice}
                          style={[
                            styles.bidButton,
                            boostAmount === boostPrice &&
                              styles.selectedBidButton,
                          ]}
                          onPress={() => setBoostAmount(boostPrice)}
                        >
                          <Typography
                            type="bodyLarge"
                            weight="semibold"
                            style={[
                              styles.boostButtonText,
                              boostAmount === boostPrice &&
                                styles.selectedBoostButtonText,
                            ]}
                          >
                            ${boostPrice}
                          </Typography>
                        </Pressable>
                      ))}
                    </View>

                    {/* Boost Counter */}
                    <View
                      style={[
                        styles.counterSection,
                        { marginTop: isBoosted ? -10 : 'auto' },
                      ]}
                    >
                      <Counter
                        editable={true}
                        value={boostAmount}
                        onChange={setBoostAmount}
                        min={1}
                        step={1}
                        formatLabel={(value) => `$${value}`}
                      />
                    </View>
                  </>
                )
              )}
            </View>

            {/* Submit Button */}
            <View
              style={[
                styles.submitSection,
                { marginTop: isBoosted ? -24 : 'auto' },
              ]}
              onStartShouldSetResponder={() => false}
            >
              <Button
                variant="primary"
                rounded="half"
                onPress={handleSubmit}
                loading={isLoading}
                disabled={isLoading || isLoadingPrices}
              >
                {actionSubmit}
              </Button>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    zIndex: 10001,
    elevation: 10001,
  },
  container: {
    backgroundColor: textColors.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  content: {
    paddingHorizontal: 10,
    paddingTop: 20,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: textColors.grey100,
  },
  peopleSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: textColors.white,
    borderWidth: 2,
    borderColor: textColors.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: textColors.black,
    fontWeight: '700',
  },
  headerTitle: {
    color: textColors.black,
    fontSize: 18,
  },
  placeholder: {
    width: 32,
  },
  title: {
    color: textColors.black,
    fontSize: 21,
  },
  peopleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  peopleIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  peopleText: {
    color: textColors.black,
    fontWeight: 'bold',
  },
  suggestedBidsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  bidButton: {
    flex: 1,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: textColors.grey200,
    backgroundColor: textColors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedBidButton: {
    borderColor: textColors.teal900,
    backgroundColor: textColors.teal900,
  },
  bidButtonText: {
    color: textColors.black,
  },
  selectedBidButtonText: {
    color: textColors.white,
  },
  counterSection: {
    marginBottom: 24,
  },
  counterLabel: {
    color: textColors.black,
    marginBottom: 8,
  },
  counterSkeletonContainer: {
    marginTop: 16,
    width: '100%',
  },
  etaCounterContainer: {
    width: '100%',
  },
  etaSection: {
    flexDirection: 'column',
    gap: 0,
    marginBottom: 24,
  },
  sectionTitle: {
    color: textColors.black,
  },
  sectionHeading: {
    color: textColors.black,
    marginBottom: 12,
  },
  etaSectionTitle: {
    color: textColors.black,
  },
  boostSection: {
    marginBottom: 24,
  },
  boostHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  boostButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },

  boostButtonText: {
    color: textColors.black,
  },
  selectedBoostButtonText: {
    color: textColors.white,
  },
  submitSection: {
    paddingBottom: 20,
  },
});

export default BidBottomSheetModal;
