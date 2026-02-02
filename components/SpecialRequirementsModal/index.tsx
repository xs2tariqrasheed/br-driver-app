import Button from "@/components/Button";
import Divider from "@/components/Divider";
import Typography from "@/components/Typography";
import { textColors } from "@/constants/colors";
import { useOverlayInsets } from "@/context/OverlayInsetsContext";
import { useModalManager } from "@/context/ModalManagerContext";
import { useSpecialRequirements } from "@/context/SpecialRequirementsContext";
import React from "react";
import {
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Checkbox from "../SpecialRequirementsSheet/Checkbox";
import ChildSeatRow from "../SpecialRequirementsSheet/ChildSeatRow";
import RequirementRow from "../SpecialRequirementsSheet/RequirementRow";
import ValueBox from "../SpecialRequirementsSheet/ValueBox";

const { height: screenHeight } = Dimensions.get("window");

const SpecialRequirementsModal: React.FC = () => {
  const { isOpen, data, closeSpecialRequirements } = useSpecialRequirements();
  const { registerModal, unregisterModal } = useModalManager();
  const { overlayBottomInset } = useOverlayInsets();

  // Register with Modal Manager
  React.useEffect(() => {
    registerModal("specialRequirements", () => closeSpecialRequirements());
    return () => unregisterModal("specialRequirements");
  }, [registerModal, unregisterModal, closeSpecialRequirements]);

  if (!data) return null;

  const {
    totalPassengers = 0,
    bags = 0,
    pets = false,
    wheelchair = false,
    childSeat,
    armedDriver = false,
    driverLanguage = "English",
  } = data;

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={closeSpecialRequirements}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={closeSpecialRequirements}
      >
        <View
          style={styles.container}
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
              Special Requirements
            </Typography>
            <View style={styles.placeholder} />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={closeSpecialRequirements}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.content}
            contentContainerStyle={{ paddingBottom: 20 + overlayBottomInset }}
            showsVerticalScrollIndicator={false}
          >
            {/* Section 1: Rider Details */}
            <Typography
              type="bodyLarge"
              weight="semibold"
              style={styles.sectionTitle}
            >
              Rider Details
            </Typography>

            {/* Total Passengers Row */}
            <RequirementRow
              icon={require("@/assets/images/sepcialRequirments/total-passengers.png")}
              title="Total Passengers"
              rightElement={<ValueBox value={totalPassengers} />}
            />

            {/* Bags Row */}
            <RequirementRow
              icon={require("@/assets/images/sepcialRequirments/bags.png")}
              title="Bags"
              description="Number of bags that would require trunk space."
              rightElement={<ValueBox value={bags} />}
            />

            <Divider marginVertical={16} />

            {/* Section 2: Pets and Wheelchair */}
            <RequirementRow
              icon={require("@/assets/images/sepcialRequirments/pets.png")}
              title="Pets"
              rightElement={<Checkbox checked={pets} />}
            />

            <RequirementRow
              icon={require("@/assets/images/sepcialRequirments/wheelchair.png")}
              title="Wheelchair"
              rightElement={<Checkbox checked={wheelchair} />}
            />

            <Divider marginVertical={16} />

            {/* Section 3: Child Seat */}
            <View style={styles.sectionHeader}>
              <Image
                source={require("@/assets/images/sepcialRequirments/child-seat.png")}
                style={styles.sectionIcon}
              />
              <Typography
                type="bodyMedium"
                weight="semibold"
                style={styles.sectionTitle}
              >
                Child Seat:
              </Typography>
            </View>

            {/* Infant */}
            <ChildSeatRow
              title="Infant"
              description='Rear facing 4 to 35 LBS, up to 32"'
              value={childSeat?.infant || 0}
            />

            {/* Toddler */}
            <ChildSeatRow
              title="Toddler"
              description="Forward facing 9 to 40 LBS, 2yrs+"
              value={childSeat?.toddler || 0}
            />

            {/* Booster */}
            <ChildSeatRow
              title="Booster"
              description='Over 4 yrs+, 40" to 63"'
              value={childSeat?.booster || 0}
            />

            <Divider marginVertical={16} />

            {/* Section 4: Armed Driver and Language */}
            <RequirementRow
              icon={require("@/assets/images/sepcialRequirments/armed-driver.png")}
              title="Armed driver"
              rightElement={<Checkbox checked={armedDriver} />}
            />

            <RequirementRow
              icon={require("@/assets/images/sepcialRequirments/language.png")}
              title="Driver Language"
              rightElement={
                <Typography
                  type="bodyMedium"
                  weight="semibold"
                  style={styles.languageTitle}
                >
                  {driverLanguage}
                </Typography>
              }
            />

            {/* Continue Button */}
            <Button
              variant="primary"
              onPress={closeSpecialRequirements}
              style={styles.continueButton}
              rounded="half"
            >
              Continue
            </Button>
          </ScrollView>
        </View>
      </TouchableOpacity>
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
    maxHeight: screenHeight * 0.85,
    zIndex: 10001,
    elevation: 10001,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: textColors.white,
    borderWidth: 2,
    borderColor: textColors.black,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    fontSize: 18,
    color: textColors.black,
    fontWeight: "700",
  },
  headerTitle: {
    color: textColors.black,
    fontSize: 18,
  },
  placeholder: {
    width: 32,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionIcon: {
    width: 20,
    height: 20,
    resizeMode: "contain",
    marginRight: 8,
  },
  sectionTitle: {
    color: textColors.black,
  },
  continueButton: {
    marginVertical: 24,
  },
  languageTitle: {
    color: textColors.black,
  },
});

export default SpecialRequirementsModal;
