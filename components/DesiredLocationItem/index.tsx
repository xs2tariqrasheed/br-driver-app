import Typography from "@/components/Typography";
import { textColors } from "@/constants/colors";
import React from "react";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";

export type DesiredLocationItemProps = {
  priority: string; // e.g., "P1"
  address: string;
  /** When true, shows a small "Expired" tag so user knows to delete before adding more */
  isExpired?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
};

const DesiredLocationItem: React.FC<DesiredLocationItemProps> = ({
  priority,
  address,
  isExpired,
  onEdit,
  onDelete,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.rowTop}>
        <View style={styles.priorityRow}>
          <Typography type="bodyLarge" weight="bold" style={styles.textBlack16}>
            {priority}
          </Typography>
          {isExpired && (
            <View style={styles.expiredTag}>
              <Typography type="labelSmall" weight="semibold" style={styles.expiredTagText}>
                Expired
              </Typography>
            </View>
          )}
        </View>
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
  priorityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  expiredTag: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  expiredTagText: {
    color: "#B91C1C",
    fontSize: 11,
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
