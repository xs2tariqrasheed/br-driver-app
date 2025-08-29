import { URLS } from "@/constants/global";
import { useIsFocused } from "@react-navigation/native";
import React, { useEffect } from "react";
import { Linking, SafeAreaView, StyleSheet } from "react-native";

export default function EarningsScreen() {
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      // Open earnings portal when the tab is focused
      Linking.openURL(URLS.earningsPortal);
    }
  }, [isFocused]);

  // Minimal wrapper to satisfy RN screen requirement
  return <SafeAreaView style={styles.container} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
