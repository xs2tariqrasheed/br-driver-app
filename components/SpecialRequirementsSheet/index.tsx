import BottomSheet from "@/components/BottomSheet";
import BottomSheetModal from "@/components/BottomSheetModal";
import Button from "@/components/Button";
import Divider from "@/components/Divider";
import Typography from "@/components/Typography";
import { textColors } from "@/constants/colors";
import { useSpecialRequirements } from "@/context/SpecialRequirementsContext";
import React from "react";
import { Image, StyleSheet, View } from "react-native";
import Checkbox from "./Checkbox";
import ChildSeatRow from "./ChildSeatRow";
import RequirementRow from "./RequirementRow";
import ValueBox from "./ValueBox";

const SpecialRequirementsSheet: React.FC = () => {
  const { isOpen, data, closeSpecialRequirements } = useSpecialRequirements();

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
    <BottomSheetModal visible={isOpen} onClose={closeSpecialRequirements}>
      <BottomSheet
        open={true}
        onClose={closeSpecialRequirements}
        snapPoints={["85%"]}
        initialSnapIndex={0}
        headerTitle="Special Requirements"
        showHeader={true}
        scrollable={true}
      >
        <View style={styles.container}>
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
        </View>
      </BottomSheet>
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  container: {
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

export default SpecialRequirementsSheet;
