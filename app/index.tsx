import { textColors } from "@/constants/colors";
import { Redirect, Stack } from "expo-router";
import { useEffect, useState } from "react";
import { Image, StyleSheet, View } from "react-native";

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <Image
          source={require("../assets/images/logo.gif")}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Redirect href="/(screens)/auth/login" />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: textColors.white,
  },
  logo: {
    width: 200,
    height: 200,
  },
});
