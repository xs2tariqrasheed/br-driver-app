import { GlobalActiveTripListener } from "@/components/GlobalActiveTripListener";
import GlobalRideOfferModal from "@/components/GlobalRideOfferModal";
import { GlobalSocketListener } from "@/components/GlobalSocketListener";
import NetworkNotification from "@/components/NetworkNotification";
import NotificationModal from "@/components/NotificationModal";
import OnlineLocationTracker from "@/components/OnlineLocationTracker";
import PackageInfoModal from "@/components/PackageInfoModal";
import SpecialRequirementsModal from "@/components/SpecialRequirementsModal";
import { ToastProvider } from "@/components/Toast";
import { AuthProvider } from "@/context/AuthContext";
import { BidAcceptedProvider } from "@/context/BidAcceptedContext";
import { BidBottomSheetProvider } from "@/context/BidBottomSheetContext";
import { BidExpiredProvider } from "@/context/BidExpiredContext";
import { BidUnsuccessfulProvider } from "@/context/BidUnsuccessfulContext";
import { BidWaitingTimerProvider } from "@/context/BidWaitingTimerContext";
import { BroadcastJobOffersProvider } from "@/context/BroadcastJobOffersContext";
import { ContentProvider } from "@/context/ContentContext";
import { DriverProvider } from "@/context/DriverContext";
import { ModalManagerProvider } from "@/context/ModalManagerContext";
import { NetworkProvider } from "@/context/NetworkContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { PackageInfoProvider } from "@/context/PackageInfoContext";
import { RideOfferProvider } from "@/context/RideOfferContext";
import { SettingsProvider } from "@/context/SettingsContext";
import { SpecialRequirementsProvider } from "@/context/SpecialRequirementsContext";
import { speechManager } from "@/utils/speechManager";
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
      // Initialize speech manager for instant voice alerts
      speechManager.initialize();
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
                <NetworkProvider>
                  <DriverProvider>
                    <SettingsProvider>
                      <ModalManagerProvider>
                        <RideOfferProvider>
                          <SpecialRequirementsProvider>
                            <PackageInfoProvider>
                              <BidExpiredProvider>
                                <BidBottomSheetProvider>
                                  <BidWaitingTimerProvider>
                                    <BidAcceptedProvider>
                                      <BidUnsuccessfulProvider>
                                        <BroadcastJobOffersProvider>
                                          <NotificationProvider>
                                            <ToastProvider>
                                              <Stack initialRouteName="(screens)/auth">
                                                <Stack.Screen
                                                  name="(screens)/auth"
                                                  options={{
                                                    headerShown: false,
                                                  }}
                                                />
                                                <Stack.Screen
                                                  name="(screens)/more"
                                                  options={{
                                                    headerShown: false,
                                                  }}
                                                />
                                                <Stack.Screen
                                                  name="(tabs)"
                                                  options={{
                                                    headerShown: false,
                                                  }}
                                                />
                                                <Stack.Screen name="+not-found" />
                                                <Stack.Screen
                                                  name="(screens)/notifications"
                                                  options={{
                                                    title: "Notifications",
                                                  }}
                                                />
                                                <Stack.Screen
                                                  name="(screens)/heat-map"
                                                  options={{
                                                    headerShown: false,
                                                  }}
                                                />
                                              </Stack>
                                              <StatusBar style="auto" />
                                              {/* Global Socket Listener */}
                                              <GlobalSocketListener />
                                              {/* Global Active Trip Socket Listener */}
                                              <GlobalActiveTripListener />
                                              {/* Online Location Tracker */}
                                              <OnlineLocationTracker />
                                              {/* Special Requirements Modal */}
                                              <SpecialRequirementsModal />
                                              {/* Package Info Modal */}
                                              <PackageInfoModal />
                                              {/* Global Ride Offer Modal */}
                                              <GlobalRideOfferModal />
                                              {/* Visual Notification Manager */}
                                              <NotificationModal />
                                              {/* Network Status Notification */}
                                              <NetworkNotification />
                                            </ToastProvider>
                                          </NotificationProvider>
                                        </BroadcastJobOffersProvider>
                                      </BidUnsuccessfulProvider>
                                    </BidAcceptedProvider>
                                  </BidWaitingTimerProvider>
                                </BidBottomSheetProvider>
                              </BidExpiredProvider>
                            </PackageInfoProvider>
                          </SpecialRequirementsProvider>
                        </RideOfferProvider>
                      </ModalManagerProvider>
                    </SettingsProvider>
                  </DriverProvider>
                </NetworkProvider>
              </AuthProvider>
            </ContentProvider>
          </BottomSheetModalProvider>
        </Host>
      </GestureHandlerRootView>
    </>
  );
}
