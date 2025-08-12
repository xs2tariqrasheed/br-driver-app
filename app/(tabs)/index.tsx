import { Image } from "expo-image";
import { StyleSheet } from "react-native";

import Button, { IconButton } from "@/components/Button";
import ParallaxScrollView from "@/components/ParallaxScrollView";
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
      <Button variant="primary">Primary Full</Button>
      <Button variant="primary" block="half">
        Primary Half
      </Button>
      <Button variant="outlined">Outlined Full</Button>
      <Button variant="outlined" block="half">
        Outlined Half
      </Button>
      <Button variant="danger">Danger Full</Button>
      <Button variant="danger" block="half">
        Danger Half
      </Button>
      <Button loading>Loading...</Button>
      <Button loading block="half">
        Loading Half
      </Button>
      <Button disabled>Disabled Full</Button>
      <Button disabled block="half">
        Disabled Half
      </Button>
      <Button variant="primary" rounded="full">
        Primary Rounded Full
      </Button>
      <Button variant="primary" block="half" rounded="full">
        Primary Rounded Half
      </Button>
      <Button variant="outlined" rounded="full">
        Outlined Rounded Full
      </Button>
      <Button variant="outlined" block="half" rounded="half">
        Outlined Rounded Half
      </Button>
      <Button
        variant="primary"
        rounded="full"
        icon={<IconSymbol name="chevron.right" size={20} color="white" />}
      >
        Primary With Icon
      </Button>
      <Button
        variant="outlined"
        rounded="full"
        icon={<IconSymbol name="chevron.right" size={20} color="black" />}
      >
        Outlined With Icon
      </Button>
      <Button
        variant="danger"
        rounded="full"
        icon={<IconSymbol name="chevron.left" size={20} color="white" />}
        iconPosition="left"
      >
        Danger With Left Icon
      </Button>
      <IconButton
        size={4}
        rounded={true}
        disabled={false}
        icon={<IconSymbol name="chevron.left" size={20} color="white" />}
      />
      <IconButton
        size={4}
        rounded={false}
        disabled={false}
        icon={<IconSymbol name="chevron.right" size={20} color="white" />}
      />
      <IconButton
        size={3}
        rounded={true}
        disabled={false}
        icon={<IconSymbol name="chevron.left" size={20} color="white" />}
      />
      <IconButton
        size={3}
        rounded={false}
        disabled={false}
        icon={<IconSymbol name="chevron.right" size={20} color="white" />}
      />
      <IconButton
        size={2}
        rounded={true}
        disabled={false}
        icon={<IconSymbol name="xmark" size={20} color="white" />}
      />
      <IconButton
        size={2}
        rounded={false}
        disabled={false}
        icon={<IconSymbol name="chevron.right" size={20} color="white" />}
      />
      <IconButton
        size={1}
        rounded={true}
        disabled={false}
        icon={<IconSymbol name="chevron.left" size={20} color="white" />}
      />
      <IconButton
        size={1}
        rounded={false}
        disabled={false}
        icon={<IconSymbol name="chevron.right" size={20} color="white" />}
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
