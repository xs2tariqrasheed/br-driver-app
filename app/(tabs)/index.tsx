import { Image } from "expo-image";
import React from "react";
import { StyleSheet, View } from "react-native";

import Button from "@/components/Button";
import Examples from "@/components/Examples";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "expo-router";

export default function HomeScreen() {
  const router = useRouter();
  const [, setAuth] = useAuth();
  return (
    <ParallaxScrollView
      headerBackgroundColor="#A1CEDC"
      headerImage={
        <Image
          source={require("@/assets/images/partial-react-logo.png")}
          style={styles.reactLogo}
        />
      }
    >
      <Examples />
      <View style={styles.logoutContainer}>
        <Button
          variant="primary"
          rounded="half"
          onPress={async () => {
            await setAuth(null);
            router.replace("/(screens)/auth/login");
          }}
        >
          Logout
        </Button>
      </View>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: "absolute",
  },
  logoutContainer: {
    padding: 16,
  },
});
