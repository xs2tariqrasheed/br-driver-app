import { Image } from "expo-image";
import { StyleSheet } from "react-native";

import Accordion from "@/components/Accordion";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { colors } from "@/constants/colors";

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
        items={[
          {
            key: "1",
            label: "This is panel header 1",
            icon: (
              <IconSymbol
                name="chevron.right"
                size={18}
                weight="medium"
                color={colors.icon}
              />
            ),
            children: (
              <>
                <ThemedText>Panel 1 content line A</ThemedText>
                <ThemedText>Panel 1 content line B</ThemedText>
                <ThemedText>Panel 1 content line C</ThemedText>
              </>
            ),
          },
          {
            key: "2",
            label: "This is panel header 2",
            children: (
              <>
                <ThemedText>Panel 2 content line A</ThemedText>
                <ThemedText>Panel 2 content line B</ThemedText>
              </>
            ),
          },
          {
            key: "3",
            label: "This is panel header 3 (disabled)",
            disabled: true,
            children: (
              <>
                <ThemedText>Panel 3 content (disabled)</ThemedText>
              </>
            ),
          },
        ]}
        defaultActiveKey={["1"]}
        onChange={(keyOrKeys) => {
          //console.log("Accordion changed:", keyOrKeys);
        }}
      />
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
