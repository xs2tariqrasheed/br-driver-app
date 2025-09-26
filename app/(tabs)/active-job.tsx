import { router } from "expo-router";
import { useEffect } from "react";

export default function ActiveJobScreen() {
  useEffect(() => {
    router.replace("/(screens)/active-ride");
  }, []);
  return null;
}
