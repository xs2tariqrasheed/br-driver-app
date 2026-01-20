import { GlobalActiveTripListener } from "@/components/GlobalActiveTripListener";
import { GlobalSocketListener } from "@/components/GlobalSocketListener";
import NetworkNotification from "@/components/NetworkNotification";
import NotificationModal from "@/components/NotificationModal";
import OnlineLocationTracker from "@/components/OnlineLocationTracker";
import PackageInfoModal from "@/components/PackageInfoModal";
import SpecialRequirementsModal from "@/components/SpecialRequirementsModal";
import { ToastProvider } from "@/components/Toast";
import { updateBaseUrls } from "@/config/apiConfig";
import { DEPLOYED_BASE_URL_STORAGE_KEY } from "@/constants/global";
import { AuthProvider } from "@/context/AuthContext";
import { BidAcceptedProvider } from "@/context/BidAcceptedContext";
import { BidBottomSheetProvider } from "@/context/BidBottomSheetContext";
import { BidExpiredProvider } from "@/context/BidExpiredContext";
import { BidUnsuccessfulProvider } from "@/context/BidUnsuccessfulContext";
import { BidWaitingTimerProvider } from "@/context/BidWaitingTimerContext";
import { BroadcastJobOffersProvider } from "@/context/BroadcastJobOffersContext";
import { ChatProvider } from "@/context/ChatContext";
import { ContentProvider } from "@/context/ContentContext";
import { DriverProvider } from "@/context/DriverContext";
import { FutureJobOffersProvider } from "@/context/FutureJobOffersContext";
import { ModalManagerProvider } from "@/context/ModalManagerContext";
import { NetworkProvider } from "@/context/NetworkContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { PackageInfoProvider } from "@/context/PackageInfoContext";
import { RideOfferProvider } from "@/context/RideOfferContext";
import { SettingsProvider } from "@/context/SettingsContext";
import { SpecialRequirementsProvider } from "@/context/SpecialRequirementsContext";
import { getStorageItem } from "@/utils/helpers";
import { speechManager } from "@/utils/speechManager";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { useFonts } from "expo-font";
import { SplashScreen, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Platform } from "react-native";
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

  // Check for deployed base URL on startup to initialize API clients
  useEffect(() => {
    (async () => {
      try {
        const baseUrl = await getStorageItem(DEPLOYED_BASE_URL_STORAGE_KEY);
        if (baseUrl) {
          updateBaseUrls(baseUrl);
        }
      } catch (e) {
        console.error("Error checking base URL:", e);
      }
    })();
  }, []);

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
                        <ChatProvider>
                          <RideOfferProvider>
                            <SpecialRequirementsProvider>
                              <PackageInfoProvider>
                                <BroadcastJobOffersProvider>
                                  <BidExpiredProvider>
                                    <BidBottomSheetProvider>
                                      <BidWaitingTimerProvider>
                                        <BidAcceptedProvider>
                                          <BidUnsuccessfulProvider>
                                            <FutureJobOffersProvider>
                                              <NotificationProvider>
                                                <ToastProvider>
                                                  <Stack
                                                    initialRouteName="(screens)/auth"
                                                    screenOptions={{
                                                      contentStyle:
                                                        Platform.OS === "android"
                                                          ? {
                                                              paddingTop: 24,
                                                            }
                                                          : undefined,
                                                    }}
                                                  >
                                                    <Stack.Screen
                                                      name="(screens)/auth"
                                                      options={{
                                                        headerShown: false,
                                                      }}
                                                    />
                                                    <Stack.Screen
                                                      name="(screens)/base-url-setup"
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
                                                    <Stack.Screen
                                                      name="(screens)/chat"
                                                      options={{
                                                        headerShown: false,
                                                        presentation: "fullScreenModal",
                                                      }}
                                                    />
                                                    <Stack.Screen
                                                      name="(screens)/ride-offer"
                                                      options={{
                                                        headerShown: false,
                                                        // iOS fix: don't present as a native full-screen modal, otherwise
                                                        // provider-level RN Modals (e.g. ETAModal) can appear behind it.
                                                        presentation:
                                                          Platform.OS === "ios"
                                                            ? "card"
                                                            : "fullScreenModal",
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
                                                  {/* Global Modals */}
                                                  <NotificationModal />
                                                  <NetworkNotification />
                                                  <PackageInfoModal />
                                                  <SpecialRequirementsModal />
                                                </ToastProvider>
                                              </NotificationProvider>
                                            </FutureJobOffersProvider>
                                          </BidUnsuccessfulProvider>
                                        </BidAcceptedProvider>
                                      </BidWaitingTimerProvider>
                                    </BidBottomSheetProvider>
                                  </BidExpiredProvider>
                                </BroadcastJobOffersProvider>
                              </PackageInfoProvider>
                            </SpecialRequirementsProvider>
                          </RideOfferProvider>
                        </ChatProvider>
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
