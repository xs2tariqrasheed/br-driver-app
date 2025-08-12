import { Image } from "expo-image";
import { StyleSheet } from "react-native";

import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import Accordion from "@/components/Accordion";
import { colors } from "@/constants/colors";
import { IconSymbol } from "@/components/ui/IconSymbol";

export default function HomeScreen() {
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
      <Accordion
        icon={
          <IconSymbol
            name="chevron.right"
            size={18}
            weight="medium"
            color={colors.icon}
          />
        }
        title="Hello"
      >
        <ThemedText>Hello</ThemedText>
        <ThemedText>Hello</ThemedText>
        <ThemedText>Hello</ThemedText>
      </Accordion>
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
});
