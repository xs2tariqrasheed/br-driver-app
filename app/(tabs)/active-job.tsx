import ActiveRideInitializer from "@/components/ActiveRideInitializer";
import DriverOffline from "@/components/DriverOffline";
import { useDriver } from "@/context/DriverContext";

export default function ActiveJobScreen() {
  const [driver] = useDriver();

  // Show DriverOffline component when driver is offline
  if (!driver?.online) {
    return <DriverOffline />;
  }

  // Show ActiveRideInitializer when driver is online
  return <ActiveRideInitializer />;
}
