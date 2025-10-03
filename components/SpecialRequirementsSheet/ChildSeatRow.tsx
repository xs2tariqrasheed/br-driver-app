import Typography from "@/components/Typography";
import { textColors } from "@/constants/colors";
import React from "react";
import { StyleSheet, View } from "react-native";
import ValueBox from "./ValueBox";

interface ChildSeatRowProps {
  title: string;
  description: string;
  value: number;
}

const ChildSeatRow: React.FC<ChildSeatRowProps> = ({
  title,
  description,
  value,
}) => {
  return (
    <View style={styles.childSeatRow}>
      <View style={styles.childSeatLeft}>
        <Typography type="bodyMedium" weight="semibold" style={styles.title}>
          {title}
        </Typography>
        <Typography
          type="labelMedium"
          weight="regular"
          style={styles.description}
        >
          {description}
        </Typography>
      </View>
      <ValueBox value={value} />
    </View>
  );
};

const styles = StyleSheet.create({
  childSeatRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  childSeatLeft: {
    flex: 1,
  },
  title: {
    color: textColors.black,
  },
  description: {
    color: textColors.black,
    fontStyle: "italic",
    marginTop: 2,
  },
});

export default ChildSeatRow;
