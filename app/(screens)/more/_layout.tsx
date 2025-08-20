import { Stack } from "expo-router";
import React from "react";

export default function MoreLayout() {
  return (
    <Stack>
      <Stack.Screen name="update-password" options={{ headerShown: false }} />
    </Stack>
  );
}
