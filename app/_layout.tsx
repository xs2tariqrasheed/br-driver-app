import DevFloatingButton from "@/components/DevFloatingButton";
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
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { BidAcceptedProvider } from "@/context/BidAcceptedContext";
import { BidBottomSheetProvider } from "@/context/BidBottomSheetContext";
import { BidExpiredProvider } from "@/context/BidExpiredContext";
import { BidUnsuccessfulProvider } from "@/context/BidUnsuccessfulContext";
import { BidWaitingTimerProvider } from "@/context/BidWaitingTimerContext";
import {
  BroadcastJobOffersProvider,
  useBroadcastJobOffers,
} from "@/context/BroadcastJobOffersContext";
import { ChatProvider, useChat } from "@/context/ChatContext";
import { ContentProvider } from "@/context/ContentContext";
import { DevSettingsProvider } from "@/context/DevSettingsContext";
import { DriverProvider } from "@/context/DriverContext";
import { FutureJobOffersProvider } from "@/context/FutureJobOffersContext";
import { ModalManagerProvider } from "@/context/ModalManagerContext";
import { NetworkProvider } from "@/context/NetworkContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { OverlayInsetsProvider } from "@/context/OverlayInsetsContext";
import { PackageInfoProvider } from "@/context/PackageInfoContext";
import { RideOfferProvider, useRideOffer } from "@/context/RideOfferContext";
import { SettingsProvider } from "@/context/SettingsContext";
import { SpecialRequirementsProvider } from "@/context/SpecialRequirementsContext";
import { registerTokenIfNeeded } from "@/services/pushNotificationService";
import { coerceTripId } from "@/types/pushNotifications";
import { getStorageItem } from "@/utils/helpers";
import { speechManager } from "@/utils/speechManager";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { useFonts } from "expo-font";
import * as Notifications from "expo-notifications";
import { SplashScreen, Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import { Platform, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Host } from "react-native-portalize";
import "react-native-reanimated";

// Keep the native splash screen visible while we load resources
SplashScreen.preventAutoHideAsync();

function PushNotificationsBootstrap() {
  const router = useRouter();
  const [auth] = useAuth();
  const { openChat } = useChat();
  const { broadcastOffers } = useBroadcastJobOffers();
  const { getTemporaryRideByTripId, showRideOfferModal } = useRideOffer();

  const responseSub = useRef<Notifications.Subscription | null>(null);
  const handledInitialResponse = useRef(false);
  const tokenRegistrationAttempted = useRef(false);

  const handleResponse = async (
    response: Notifications.NotificationResponse,
    isReplayFromColdStart: boolean,
  ) => {
    const data = response.notification.request.content.data;
    const type = (data as any)?.type as string | undefined;
    const tripId = coerceTripId(data);

    if (type === "chat-message") {
      try {
        openChat?.();
      } catch {
        router.push("/(screens)/chat");
      }
      return;
    }

    if (tripId) {
      // Best effort:
      // 1) If the app process is still alive, we might already have the offer in memory.
      // 2) If not, route to tabs so sockets can reconnect and deliver the offer.
      const tempRide = getTemporaryRideByTripId(tripId);
      if (tempRide) {
        showRideOfferModal(tempRide as any);
        return;
      }

      const broadcastOffer = broadcastOffers.find(
        (o) => String(o.tripOffer?.tripId) === String(tripId),
      );
      if (broadcastOffer) {
        showRideOfferModal(broadcastOffer as any);
        return;
      }

      router.replace("/(tabs)");
      return;
    }

    // Only redirect to notifications when the user just tapped a notification.
    // Skip for cold-start replay: getLastNotificationResponseAsync() can return
    // a stale response, which would wrongly redirect on every app open/refresh.
    if (!isReplayFromColdStart) {
      router.push("/(screens)/notifications");
    }
  };

  useEffect(() => {
    if (!responseSub.current) {
      responseSub.current =
        Notifications.addNotificationResponseReceivedListener((response) =>
          handleResponse(response, false),
        );
    }

    (async () => {
      if (handledInitialResponse.current) return;
      handledInitialResponse.current = true;
      try {
        const last = await Notifications.getLastNotificationResponseAsync();
        if (last) {
          await handleResponse(last, true);
        }
      } catch {
        // ignore
      }
    })();

    return () => {
      if (responseSub.current) {
        Notifications.removeNotificationSubscription(responseSub.current);
        responseSub.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const userId = auth?.user?.id;
    if (!userId) {
      tokenRegistrationAttempted.current = false;
      return;
    }
    if (tokenRegistrationAttempted.current) return;
    tokenRegistrationAttempted.current = true;

    (async () => {
      try {
        await registerTokenIfNeeded(String(userId));
      } catch {
        tokenRegistrationAttempted.current = false;
      }
    })();
  }, [auth?.user?.id]);

  return null;
}

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
          <OverlayInsetsProvider>
            <BottomSheetModalProvider>
              <DevSettingsProvider>
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
                                                            Platform.OS ===
                                                            "android"
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
                                                            title:
                                                              "Notifications",
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
                                                            presentation:
                                                              "fullScreenModal",
                                                          }}
                                                        />
                                                        <Stack.Screen
                                                          name="(screens)/ride-offer"
                                                          options={{
                                                            headerShown: false,
                                                            // iOS fix: don't present as a native full-screen modal, otherwise
                                                            // provider-level RN Modals (e.g. ETAModal) can appear behind it.
                                                            presentation:
                                                              Platform.OS ===
                                                              "ios"
                                                                ? "card"
                                                                : "fullScreenModal",
                                                          }}
                                                        />
                                                        <Stack.Screen
                                                          name="(screens)/in-app-webview"
                                                          options={{
                                                            headerShown: false,
                                                          }}
                                                        />
                                                        <Stack.Screen
                                                          name="(screens)/developer-settings"
                                                          options={{
                                                            title:
                                                              "Developer Settings",
                                                          }}
                                                        />
                                                      </Stack>
                                                      <StatusBar style="dark" />
                                                      <PushNotificationsBootstrap />
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
                                                      <View
                                                        style={{
                                                          position: "absolute",
                                                          top: 0,
                                                          left: 0,
                                                          right: 0,
                                                          bottom: 0,
                                                        }}
                                                        pointerEvents="box-none"
                                                      >
                                                        <DevFloatingButton />
                                                      </View>
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
              </DevSettingsProvider>
            </BottomSheetModalProvider>
          </OverlayInsetsProvider>
        </Host>
      </GestureHandlerRootView>
    </>
  );
}
