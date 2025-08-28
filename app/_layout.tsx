import { ToastHost } from "@/components/Toast";
import { AuthProvider } from "@/context/AuthContext";
import { DriverProvider } from "@/context/DriverContext";
import { SettingsProvider } from "@/context/SettingsContext";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { useFonts } from "expo-font";
import { SplashScreen, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Host } from "react-native-portalize";
import "react-native-reanimated";

// Keep the native splash screen visible while we load resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    "SF-Pro-Display-Regular": require("../assets/fonts/SF-Pro-Display-Regular.otf"),
    "SF-Pro-Display-Medium": require("../assets/fonts/SF-Pro-Display-Medium.otf"),
    "SF-Pro-Display-Semibold": require("../assets/fonts/SF-Pro-Display-Semibold.otf"),
    "SF-Pro-Display-Bold": require("../assets/fonts/SF-Pro-Display-Bold.otf"),
    "SF-Pro-Display-Black": require("../assets/fonts/SF-Pro-Display-Black.otf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Host>
          <BottomSheetModalProvider>
            <AuthProvider>
              <DriverProvider>
                <SettingsProvider>
                  <Stack initialRouteName="(screens)/auth">
                    <Stack.Screen
                      name="(screens)/auth"
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen
                      name="(screens)/more"
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen
                      name="(tabs)"
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen name="+not-found" />
                    <Stack.Screen
                      name="notifications"
                      options={{ title: "Notifications" }}
                    />
                  </Stack>
                  <StatusBar style="auto" />
                  <ToastHost />
                </SettingsProvider>
              </DriverProvider>
            </AuthProvider>
          </BottomSheetModalProvider>
        </Host>
      </GestureHandlerRootView>
    </>
  );
}
