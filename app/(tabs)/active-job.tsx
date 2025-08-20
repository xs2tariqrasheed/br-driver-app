import Typography from "@/components/Typography";
import React from "react";
import { StyleSheet, View } from "react-native";

export default function ActiveJobScreen() {
  return (
    <View style={styles.container}>
      <Typography type="titleMedium" weight="semibold">
        Active Job
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
});
