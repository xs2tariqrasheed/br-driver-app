import Typography from "@/components/Typography";
import { textColors } from "@/constants/colors";
import React from "react";
import { StyleSheet, View } from "react-native";

interface ValueBoxProps {
  value: number;
}

const ValueBox: React.FC<ValueBoxProps> = ({ value }) => {
  const hasValue = value > 0;

  return (
    <View
      style={[
        styles.valueBox,
        hasValue ? styles.valueBoxActive : styles.valueBoxInactive,
      ]}
    >
      <Typography
        type="bodyMedium"
        weight="regular"
        style={hasValue ? styles.valueTextActive : styles.valueTextInactive}
      >
        {value.toString().padStart(2, "0")}
      </Typography>
    </View>
  );
};

const styles = StyleSheet.create({
  valueBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  valueBoxActive: {
    borderColor: textColors.teal700,
  },
  valueBoxInactive: {
    borderColor: textColors.black,
  },
  valueTextActive: {
    color: textColors.teal700,
  },
  valueTextInactive: {
    color: textColors.black,
  },
});

export default ValueBox;
