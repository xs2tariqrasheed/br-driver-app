import Typography from "@/components/Typography";
import { textColors } from "@/constants/colors";
import React from "react";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";

export type DesiredLocationItemProps = {
  priority: string; // e.g., "P1"
  address: string;
  onEdit?: () => void;
  onDelete?: () => void;
};

const DesiredLocationItem: React.FC<DesiredLocationItemProps> = ({
  priority,
  address,
  onEdit,
  onDelete,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.rowTop}>
        <Typography type="bodyLarge" weight="bold" style={styles.textBlack16}>
          {priority}
        </Typography>
        <View style={styles.actions}>
          <TouchableOpacity onPress={onEdit} style={styles.iconBtn}>
            <Image
              source={require("@/assets/images/edit-icon.png")}
              style={styles.icon20}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={onDelete} style={styles.iconBtn}>
            <Image
              source={require("@/assets/images/delete-icon.png")}
              style={[styles.icon20, styles.deleteTint]}
            />
          </TouchableOpacity>
        </View>
      </View>
      <Typography
        type="bodyMedium"
        weight="semibold"
        style={styles.addressText}
      >
        {address}
      </Typography>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: "#D0D0D0",
    borderRadius: 8,
    backgroundColor: "#F7F7F7",
    padding: 6,
  },
  rowTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  actions: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  iconBtn: { width: 24, height: 24, paddingHorizontal: 0 },
  icon20: { width: 20, height: 20, resizeMode: "contain" },
  deleteTint: { tintColor: "#EA1C1C" },
  textBlack16: { color: textColors.black, fontSize: 16 },
  addressText: { color: textColors.black, marginTop: 6 },
});

export default DesiredLocationItem;
