/**
 * @fileoverview InfoTable Examples - Usage examples for the InfoTable component
 */

import { StyleSheet, View } from "react-native";
import InfoTable, { InfoTableDataItem } from "./index";

const ExampleData: InfoTableDataItem[] = [
  { label: "Ride Price", value: "$20.25" },
  { label: "Tolls (EZ Pass)", value: "$0.75" },
  { label: "Tips", value: "$2.00" },
  { label: "Discount", value: "$00.00" },
  { label: "Service Charges", value: "$4.00" },
  { label: "Fuel Surcharge", value: "$3.25" },
  { label: "NYC Congestion Surcharge", value: "$10.25" },
];

const ExampleDataWithoutFooter: InfoTableDataItem[] = [
  { label: "Driver Name", value: "John Doe" },
  { label: "Vehicle Type", value: "Sedan" },
  { label: "License Plate", value: "ABC-123" },
  { label: "Rating", value: "4.8" },
];

/**
 * Example usage of InfoTable component
 */
export default function InfoTableExamples() {
  return (
    <View style={styles.container}>
      {/* Example with footer (default) */}
      <InfoTable title="Fare Detail" data={ExampleData} showFooter={true} />

      {/* Example without footer */}
      <InfoTable
        title="Driver Information"
        data={ExampleDataWithoutFooter}
        showFooter={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 20,
  },
});
