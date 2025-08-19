import { Stack } from "expo-router";
import React from "react";

export default function AuthLayout() {
  return (
    <Stack initialRouteName="login">
      <Stack.Screen name="login" options={{ headerShown: false }} />
    </Stack>
  );
}
