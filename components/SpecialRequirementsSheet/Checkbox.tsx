import { textColors } from "@/constants/colors";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface CheckboxProps {
  checked: boolean;
}

const Checkbox: React.FC<CheckboxProps> = ({ checked }) => {
  if (checked) {
    return (
      <View style={styles.checkboxChecked}>
        <Text style={styles.checkmark}>✓</Text>
      </View>
    );
  }

  return <View style={styles.checkbox} />;
};

const styles = StyleSheet.create({
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: textColors.black,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: textColors.white,
  },
  checkboxChecked: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: textColors.black,
    alignItems: "center",
    justifyContent: "center",
  },
  checkmark: {
    color: textColors.white,
    fontSize: 12,
    fontWeight: "bold",
  },
});

export default Checkbox;
