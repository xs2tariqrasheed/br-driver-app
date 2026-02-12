import ActiveRideInitializer from "@/components/ActiveRideInitializer";
import DriverOffline from "@/components/DriverOffline";
import Header from "@/components/Header";
import { ACTIVE_JOB_CONTENT_KEYS } from "@/content/(tabs)/active-job-keys";
import { useDriver } from "@/context/DriverContext";
import { useGetContent } from "@/hooks/useGetContent";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { SafeAreaView, StyleSheet } from "react-native";

export default function ActiveJobScreen() {
  const { getContent } = useGetContent();

  const { headerTitle, offlineMessage } = useMemo(() => {
    const get = getContent;
    return {
      headerTitle: get(ACTIVE_JOB_CONTENT_KEYS.HEADER_TITLE),
      offlineMessage: get(ACTIVE_JOB_CONTENT_KEYS.OFFLINE_MESSAGE),
    };
  }, [getContent]);

  const [driver] = useDriver();
  const router = useRouter();

  const handleBackPress = () => {
    router.push("/(tabs)");
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title={headerTitle} onBackPress={handleBackPress} />
      {!driver?.online ? (
        <DriverOffline message={offlineMessage} />
      ) : (
        <ActiveRideInitializer />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
});
