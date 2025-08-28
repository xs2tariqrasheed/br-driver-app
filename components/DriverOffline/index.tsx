import Typography from "@/components/Typography";
import { textColors } from "@/constants/colors";
import React from "react";
import { Image as RNImage, StyleSheet, View } from "react-native";

export interface DriverOfflineProps {
  style?: any;
}

const DriverOffline: React.FC<DriverOfflineProps> = ({ style }) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.content}>
        <RNImage
          source={require("@/assets/images/driver-offline.png")}
          style={styles.image}
          resizeMode="contain"
        />
        <Typography
          type="bodyLarge"
          weight="regular"
          style={styles.description}
        >
          You are offline. Switch your status to online to start receiving jobs,
          viewing job listings, and accessing other features.
        </Typography>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: textColors.white,
    paddingHorizontal: 20,
  },
  content: {
    alignItems: "center",
    maxWidth: 300,
  },
  image: {
    width: 128,
    height: 128,
    marginBottom: 24,
  },
  description: {
    textAlign: "center",
    color: textColors.grey700,
    lineHeight: 22,
  },
});

export default DriverOffline;
