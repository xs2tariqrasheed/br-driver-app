import Typography from "@/components/Typography";
import { textColors } from "@/constants/colors";
import React from "react";
import { Image, ImageSourcePropType, StyleSheet, View } from "react-native";

interface RequirementRowProps {
  icon: ImageSourcePropType;
  title: string;
  description?: string;
  rightElement: React.ReactNode;
}

const RequirementRow: React.FC<RequirementRowProps> = ({
  icon,
  title,
  description,
  rightElement,
}) => {
  return (
    <View style={styles.row}>
      <Image source={icon} style={styles.icon} />
      {description ? (
        <View style={styles.rowContent}>
          <Typography
            type="bodyMedium"
            weight="semibold"
            style={styles.rowTitle}
          >
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
      ) : (
        <Typography type="bodyMedium" weight="semibold" style={styles.rowTitle}>
          {title}
        </Typography>
      )}
      {rightElement}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  icon: {
    width: 20,
    height: 20,
    resizeMode: "contain",
    marginRight: 8,
  },
  rowTitle: {
    flex: 1,
    color: textColors.black,
  },
  rowContent: {
    flex: 1,
  },
  description: {
    color: textColors.black,
    fontStyle: "italic",
    marginTop: 2,
  },
});

export default RequirementRow;
