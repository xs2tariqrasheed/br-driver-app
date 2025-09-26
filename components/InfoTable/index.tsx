/**
 * @fileoverview InfoTable Component - A table component for displaying structured data
 *
 * This component displays data in a card format with:
 * - Title at the top
 * - Data rows with labels and values
 * - Optional footer with total calculation
 * - Proper typography using SF Pro fonts
 * - Consistent spacing and dividers
 */

import { textColors } from "@/constants/colors";
import { StyleSheet, View } from "react-native";
import Divider from "../Divider";
import Typography from "../Typography";

export interface InfoTableDataItem {
  label: string;
  value: string | number;
}

export interface InfoTableProps {
  /** Array of data items to display */
  data: InfoTableDataItem[];
  /** Title of the info table */
  title: string;
  /** Whether to show footer with total (default: true) */
  showFooter?: boolean;
}

/**
 * InfoTable component that displays structured data in a card format
 *
 * @example
 * ```tsx
 * <InfoTable
 *   title="Fare Detail"
 *   data={[
 *     { label: "Ride Price", value: "$20.25" },
 *     { label: "Tolls (EZ Pass)", value: "$0.75" },
 *     { label: "Tips", value: "$2.00" },
 *     { label: "Discount", value: "$00.00" },
 *     { label: "Service Charges", value: "$4.00" },
 *     { label: "Fuel Surcharge", value: "$3.25" },
 *     { label: "NYC Congestion Surcharge", value: "$10.25" }
 *   ]}
 *   showFooter={true}
 * />
 * ```
 */
export default function InfoTable({
  data,
  title,
  showFooter = true,
}: InfoTableProps) {
  // Calculate total for footer (only if showFooter is true)
  const calculateTotal = () => {
    if (!showFooter) return 0;

    return data.reduce((sum, item) => {
      const value =
        typeof item.value === "string"
          ? parseFloat(item.value.replace(/[^0-9.-]/g, "")) || 0
          : item.value;
      return sum + value;
    }, 0);
  };

  const total = calculateTotal();

  return (
    <View style={styles.container}>
      {/* Title */}
      <View style={styles.titleContainer}>
        <Typography type="headingSmall" weight="semibold" style={styles.title}>
          {title}
        </Typography>
        <Divider height={1} color={textColors.grey100} marginTop={16} />
      </View>

      {/* Data Rows */}
      {data.map((item, index) => (
        <View key={index}>
          <View style={styles.row}>
            <Typography
              type="subHeadingLarge"
              weight="bold"
              style={styles.label}
            >
              {item.label}
            </Typography>
            <Typography
              type="headingSmall"
              weight="regular"
              style={styles.value}
            >
              {item.value}
            </Typography>
          </View>
          {index < data.length - 1 && (
            <Divider
              height={1}
              color={textColors.grey100}
              marginVertical={14}
            />
          )}
        </View>
      ))}

      {/* Footer with Total */}
      {showFooter && (
        <>
          <Divider height={1} color={textColors.black} marginVertical={14} />
          <View style={styles.footerRow}>
            <Typography
              type="titleExtraLarge"
              weight="bold"
              style={styles.totalLabel}
            >
              Total
            </Typography>
            <Typography
              type="titleExtraLarge"
              weight="bold"
              style={styles.totalValue}
            >
              ${total.toFixed(2)}
            </Typography>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    backgroundColor: textColors.grey0,
    borderRadius: 12,
    padding: 10,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: textColors.grey100,
  },
  titleContainer: {
    alignItems: "center",
    marginBottom: 14,
  },
  title: {
    color: textColors.black,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    color: textColors.black,
    flex: 1,
  },
  value: {
    color: textColors.black,
    textAlign: "right",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    color: textColors.black,
    flex: 1,
  },
  totalValue: {
    color: textColors.black,
    textAlign: "right",
  },
});
