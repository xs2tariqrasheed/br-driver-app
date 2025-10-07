import GlobalRideOfferModal from "@/components/GlobalRideOfferModal";
import { GlobalSocketListener } from "@/components/GlobalSocketListener";
import OnlineLocationTracker from "@/components/OnlineLocationTracker";
import PackageInfoModal from "@/components/PackageInfoModal";
import PackageInfoSheet from "@/components/PackageInfoSheet";
import SpecialRequirementsModal from "@/components/SpecialRequirementsModal";
import SpecialRequirementsSheet from "@/components/SpecialRequirementsSheet";
import { ToastHost } from "@/components/Toast";
import { AuthProvider } from "@/context/AuthContext";
import { BidAcceptedProvider } from "@/context/BidAcceptedContext";
import { BidBottomSheetProvider } from "@/context/BidBottomSheetContext";
import { BidExpiredProvider } from "@/context/BidExpiredContext";
import { BidUnsuccessfulProvider } from "@/context/BidUnsuccessfulContext";
import { BidWaitingTimerProvider } from "@/context/BidWaitingTimerContext";
import { BroadcastJobOffersProvider } from "@/context/BroadcastJobOffersContext";
import { ContentProvider } from "@/context/ContentContext";
import { DriverProvider } from "@/context/DriverContext";
import { PackageInfoProvider } from "@/context/PackageInfoContext";
import { RideOfferProvider } from "@/context/RideOfferContext";
import { SettingsProvider } from "@/context/SettingsContext";
import { SpecialRequirementsProvider } from "@/context/SpecialRequirementsContext";
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
            <ContentProvider>
              <AuthProvider>
                <DriverProvider>
                  <SettingsProvider>
                    <RideOfferProvider>
                      <SpecialRequirementsProvider>
                        <PackageInfoProvider>
                          <BroadcastJobOffersProvider>
                            <BidExpiredProvider>
                              <BidBottomSheetProvider>
                                <BidWaitingTimerProvider>
                                  <BidAcceptedProvider>
                                    <BidUnsuccessfulProvider>
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
                                          name="(screens)/notifications"
                                          options={{ title: "Notifications" }}
                                        />
                                        <Stack.Screen
                                          name="(screens)/heat-map"
                                          options={{ headerShown: false }}
                                        />
                                      </Stack>
                                      <StatusBar style="auto" />
                                      <ToastHost />
                                      {/* Global Socket Listener */}
                                      <GlobalSocketListener />
                                      {/* Online Location Tracker */}
                                      <OnlineLocationTracker />
                                      {/* Special Requirements Sheet */}
                                      <SpecialRequirementsSheet />
                                      {/* Package Info Sheet */}
                                      <PackageInfoSheet />
                                      {/* Special Requirements Modal */}
                                      <SpecialRequirementsModal />
                                      {/* Package Info Modal */}
                                      <PackageInfoModal />
                                      {/* Global Ride Offer Modal */}
                                      <GlobalRideOfferModal />
                                    </BidUnsuccessfulProvider>
                                  </BidAcceptedProvider>
                                </BidWaitingTimerProvider>
                              </BidBottomSheetProvider>
                            </BidExpiredProvider>
                          </BroadcastJobOffersProvider>
                        </PackageInfoProvider>
                      </SpecialRequirementsProvider>
                    </RideOfferProvider>
                  </SettingsProvider>
                </DriverProvider>
              </AuthProvider>
            </ContentProvider>
          </BottomSheetModalProvider>
        </Host>
      </GestureHandlerRootView>
    </>
  );
}
