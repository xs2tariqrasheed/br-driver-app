import { textColors } from "@/constants/colors";
import React, { useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Button from "../Button";
import Counter from "../Counter";
import Divider from "../Divider";
import Toggle from "../Form/Toggle";
import Typography from "../Typography";

export interface SystemSuggestedBid {
  amount: number;
  driverEarn: number;
}

export interface BidData {
  amount: number;
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
    amount,
    systemEta,
    systemSuggestedBids,
    boostedPrices,
    numberOfBids,
  } = bid;
  const [selectedBid, setSelectedBid] = useState(amount);
  const [eta, setEta] = useState(systemEta);
  const [isBoosted, setIsBoosted] = useState(false);
  const [boostAmount, setBoostAmount] = useState(boostedPrices[0] || 0);

  // Get min and max values from suggested bids
  const minBid = Math.min(...systemSuggestedBids.map((b) => b.amount));
  const maxBid = Math.max(...systemSuggestedBids.map((b) => b.amount));
  const minBoost = Math.min(...boostedPrices);
  const maxBoost = Math.max(...boostedPrices);

  // Find the selected bid data
  const selectedBidData = systemSuggestedBids.find(
    (b) => b.amount === selectedBid
  );

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
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Typography
              type="bodyLarge"
              weight="semibold"
              style={styles.headerTitle}
            >
              Customize Your Bid
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
            <View style={styles.peopleSectionHeader}>
              <View />
              <View style={styles.peopleSection}>
                <Image
                  source={require("@/assets/images/peoples.png")}
                  style={styles.peopleIcon}
                />
                <Typography
                  type="bodyLarge"
                  weight="regular"
                  style={styles.peopleText}
                >
                  &lt; {numberOfBids}
                </Typography>
              </View>
            </View>
            {/* Suggested Bid Buttons */}
            <View style={styles.suggestedBidsContainer}>
              {systemSuggestedBids.map((suggestedBid) => (
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
              ))}
            </View>

            {/* Bid Counter */}
            <Counter
              value={selectedBid}
              onChange={setSelectedBid}
              min={minBid}
              max={maxBid}
              step={1}
              formatLabel={(value) =>
                `$${value} ($${selectedBidData?.driverEarn || 0})`
              }
            />

            <Divider marginVertical={24} />

            {/* ETA Section */}
            <View style={styles.etaSection}>
              <Typography
                type="bodyLarge"
                weight="semibold"
                style={styles.etaSectionTitle}
              >
                Est.Time of Arrival{" "}
                <Typography
                  type="bodyLarge"
                  weight="regular"
                  style={styles.etaSectionTitle}
                >
                  (ETA)
                </Typography>
              </Typography>
              <Counter
                containerStyle={styles.etaCounterContainer}
                value={eta}
                onChange={setEta}
                min={1}
                max={30}
                step={1}
                formatLabel={(value) => `${value} mins`}
              />
            </View>

            {/* Boost Section */}
            <View style={styles.boostSection}>
              <View style={styles.boostHeader}>
                <Typography
                  type="bodyLarge"
                  weight="semibold"
                  style={styles.sectionTitle}
                >
                  Boost My Bid{" "}
                  <Typography
                    type="bodyLarge"
                    weight="regular"
                    style={styles.etaSectionTitle}
                  >
                    (Put me on top)
                  </Typography>
                </Typography>
                <Toggle
                  value={isBoosted}
                  setValue={setIsBoosted}
                  size={{ width: 42, height: 24 }}
                />
              </View>

              {isBoosted && (
                <>
                  {/* Boost Amount Buttons */}
                  <View style={styles.boostButtonsContainer}>
                    {boostedPrices.map((boostPrice) => (
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
                  <View style={styles.counterSection}>
                    <Counter
                      value={boostAmount}
                      onChange={setBoostAmount}
                      min={minBoost}
                      max={maxBoost}
                      step={1}
                      formatLabel={(value) => `$${value}`}
                    />
                  </View>
                </>
              )}
            </View>

            {/* Submit Button */}
            <View style={styles.submitSection}>
              <Button variant="primary" rounded="half" onPress={handleSubmit}>
                Submit
              </Button>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
    zIndex: 10001,
    elevation: 10001,
  },
  container: {
    backgroundColor: textColors.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    maxHeight: "85%",
  },
  content: {
    paddingHorizontal: 10,
    paddingTop: 20,
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: textColors.grey100,
  },
  peopleSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 20,
    backgroundColor: textColors.grey100,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    fontSize: 16,
    color: textColors.black,
    fontWeight: "600",
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
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  peopleIcon: {
    width: 24,
    height: 24,
    resizeMode: "contain",
  },
  peopleText: {
    color: textColors.black,
    fontWeight: "bold",
  },
  suggestedBidsContainer: {
    flexDirection: "row",
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
    alignItems: "center",
    justifyContent: "center",
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
  etaCounterContainer: {
    flex: 1,
  },
  etaSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  sectionTitle: {
    color: textColors.black,
  },
  etaSectionTitle: {
    flex: 1,
    marginTop: 16,
    color: textColors.black,
  },
  boostSection: {
    marginBottom: 24,
  },
  boostHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  boostButtonsContainer: {
    flexDirection: "row",
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
    marginTop: "auto",
    paddingBottom: 20,
  },
});

export default BidBottomSheetModal;
