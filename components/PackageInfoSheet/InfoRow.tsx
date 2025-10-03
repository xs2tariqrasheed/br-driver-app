import Typography from "@/components/Typography";
import { textColors } from "@/constants/colors";
import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

interface InfoRowProps {
  label: string;
  value: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value, style }) => {
  return (
    <View style={[styles.row, style]}>
      <Typography type="bodyMedium" weight="semibold" style={styles.label}>
        {label}
      </Typography>
      {typeof value === "string" ? (
        <Typography type="bodyMedium" weight="regular" style={styles.value}>
          {value}
        </Typography>
      ) : (
        value
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  label: {
    flex: 1,
    color: textColors.black,
  },
  value: {
    color: textColors.black,
    textAlign: "right",
  },
});

export default InfoRow;
