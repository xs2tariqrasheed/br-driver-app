import ActiveRideInitializer from "@/components/ActiveRideInitializer";
import Header from "@/components/Header";
import DriverOffline from "@/components/DriverOffline";
import { useDriver } from "@/context/DriverContext";
import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";

export default function ActiveJobScreen() {
  const [driver] = useDriver();
  const router = useRouter();

  const handleBackPress = () => {
    router.push("/(tabs)");
  };

  return (
    <View style={styles.container}>
      <Header title="Active Job" onBackPress={handleBackPress} />
      {!driver?.online ? (
        <DriverOffline />
      ) : (
        <ActiveRideInitializer />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
});
