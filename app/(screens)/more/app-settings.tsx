import Accordion from "@/components/Accordion";
import Toggle from "@/components/Form/Toggle";
import Header from "@/components/Header";
import Loader from "@/components/Loader";
import { showToast } from "@/components/Toast";
import Typography from "@/components/Typography";
import { textColors } from "@/constants/colors";
import { DRIVER_TYPES } from "@/constants/global";
import { APP_SETTINGS_CONTENT_KEYS } from "@/content/(screens)/more/app-settings-keys";
import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/context/SettingsContext";
import { useGetContent } from "@/hooks/useGetContent";
import { useRouter } from "expo-router";
import { useEffect, useMemo } from "react";
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

export default function AppSettingsScreen() {
  // Page Content Start
  const { getContent } = useGetContent();
  const {
    headerTitle,
    loadingMessage,
    toastSaved,
    sectionLogin,
    sectionRidePreferences,
    sectionAvailability,
    sectionSafety,
    sectionNotifications,
    sectionAppInfo,
    appInfoVersionLabel,
    loginFaceRecognition,
    loginFaceId,
    loginFingerprint,
    notificationsMuteJobOffers,
    notificationsMuteAll,
    ridePreferencesHomePageLabel,
    ridePreferencesHomePageLiveJobs,
    ridePreferencesHomePageFutureReservations,
    ridePreferencesHomePageLongDistance,
    ridePreferencesHomePagePets,
    ridePreferencesHomePagePackage,
    ridePreferencesRideTypesLabel,
    ridePreferencesRideTypesEconomy,
    ridePreferencesRideTypesSedan,
    ridePreferencesRideTypesSuv,
    ridePreferencesRideTypesLuxury,
    emptyState,
    appVersion,
  } = useMemo(() => {
    const get = getContent;
    return {
      headerTitle: get(APP_SETTINGS_CONTENT_KEYS.HEADER_TITLE),
      loadingMessage: get(APP_SETTINGS_CONTENT_KEYS.LOADING_MESSAGE),
      toastSaved: get(APP_SETTINGS_CONTENT_KEYS.TOAST_SAVED),
      sectionLogin: get(APP_SETTINGS_CONTENT_KEYS.SECTION_LOGIN),
      sectionRidePreferences: get(
        APP_SETTINGS_CONTENT_KEYS.SECTION_RIDE_PREFERENCES,
      ),
      sectionAvailability: get(APP_SETTINGS_CONTENT_KEYS.SECTION_AVAILABILITY),
      sectionSafety: get(APP_SETTINGS_CONTENT_KEYS.SECTION_SAFETY),
      sectionNotifications: get(
        APP_SETTINGS_CONTENT_KEYS.SECTION_NOTIFICATIONS,
      ),
      sectionAppInfo: get(APP_SETTINGS_CONTENT_KEYS.SECTION_APP_INFO),
      appInfoVersionLabel: get(
        APP_SETTINGS_CONTENT_KEYS.APP_INFO_VERSION_LABEL,
      ),
      loginFaceRecognition: get(
        APP_SETTINGS_CONTENT_KEYS.LOGIN_FACE_RECOGNITION,
      ),
      loginFaceId: get(APP_SETTINGS_CONTENT_KEYS.LOGIN_FACE_ID),
      loginFingerprint: get(APP_SETTINGS_CONTENT_KEYS.LOGIN_FINGERPRINT),
      notificationsMuteJobOffers: get(
        APP_SETTINGS_CONTENT_KEYS.NOTIFICATIONS_MUTE_JOB_OFFERS,
      ),
      notificationsMuteAll: get(
        APP_SETTINGS_CONTENT_KEYS.NOTIFICATIONS_MUTE_ALL,
      ),
      ridePreferencesHomePageLabel: get(
        APP_SETTINGS_CONTENT_KEYS.RIDE_PREFERENCES_HOME_PAGE_LABEL,
      ),
      ridePreferencesHomePageLiveJobs: get(
        APP_SETTINGS_CONTENT_KEYS.RIDE_PREFERENCES_HOME_PAGE_LIVE_JOBS,
      ),
      ridePreferencesHomePageFutureReservations: get(
        APP_SETTINGS_CONTENT_KEYS.RIDE_PREFERENCES_HOME_PAGE_FUTURE_RESERVATIONS,
      ),
      ridePreferencesHomePageLongDistance: get(
        APP_SETTINGS_CONTENT_KEYS.RIDE_PREFERENCES_HOME_PAGE_LONG_DISTANCE,
      ),
      ridePreferencesHomePagePets: get(
        APP_SETTINGS_CONTENT_KEYS.RIDE_PREFERENCES_HOME_PAGE_PETS,
      ),
      ridePreferencesHomePagePackage: get(
        APP_SETTINGS_CONTENT_KEYS.RIDE_PREFERENCES_HOME_PAGE_PACKAGE,
      ),
      ridePreferencesRideTypesLabel: get(
        APP_SETTINGS_CONTENT_KEYS.RIDE_PREFERENCES_RIDE_TYPES_LABEL,
      ),
      ridePreferencesRideTypesEconomy: get(
        APP_SETTINGS_CONTENT_KEYS.RIDE_PREFERENCES_RIDE_TYPES_ECONOMY,
      ),
      ridePreferencesRideTypesSedan: get(
        APP_SETTINGS_CONTENT_KEYS.RIDE_PREFERENCES_RIDE_TYPES_SEDAN,
      ),
      ridePreferencesRideTypesSuv: get(
        APP_SETTINGS_CONTENT_KEYS.RIDE_PREFERENCES_RIDE_TYPES_SUV,
      ),
      ridePreferencesRideTypesLuxury: get(
        APP_SETTINGS_CONTENT_KEYS.RIDE_PREFERENCES_RIDE_TYPES_LUXURY,
      ),
      emptyState: get(APP_SETTINGS_CONTENT_KEYS.EMPTY_STATE),
      appVersion: get(APP_SETTINGS_CONTENT_KEYS.APP_VERSION),
    };
  }, [getContent]);
  // Page Content End

  const router = useRouter();
  const settingsContext = useSettings();
  const [settings, setSettings, status] = settingsContext;
  const { isLoading, error, clearError } = status;
  const [auth] = useAuth();

  // Check if user is an independent operator
  const isIndependentOperator =
    auth?.user?.type === DRIVER_TYPES.INDEPENDENT_OPERATOR;

  // Show error toast when error occurs
  useEffect(() => {
    if (error) {
      showToast(error, { variant: "error", position: "top" });
      clearError();
    }
  }, [error, clearError]);

  // Helper function to create async toggle handler
  const createToggleHandler = (updateFn: (next: boolean) => any) => {
    return async (next: boolean) => {
      try {
        await setSettings(updateFn(next));
        showToast(toastSaved, {
          variant: "success",
          position: "top",
        });
      } catch (e) {
        // Error is handled by context and shown via useEffect
      }
    };
  };

  // App Settings screen configuration
  const settingsItemsConfig = [
    { key: "login", label: sectionLogin },
    { key: "ride-preferences", label: sectionRidePreferences },
    { key: "availability", label: sectionAvailability },
    { key: "safety", label: sectionSafety },
    { key: "notifications", label: sectionNotifications },
    { key: "app-info", label: sectionAppInfo },
  ];
  const settingsItems = settingsItemsConfig.map((item) => ({
    key: item.key,
    label: item.label,
    icon: (
      <Image
        source={require("@/assets/images/app-settings-icon.png")}
        style={styles.icon}
      />
    ),
    children:
      item.key === "app-info" ? (
        <View style={styles.infoRow}>
          <Typography
            type="bodyMedium"
            weight="semibold"
            style={styles.infoLabel}
          >
            {appInfoVersionLabel}
          </Typography>
          <Typography
            type="bodyMedium"
            weight="regular"
            style={styles.infoValue}
          >
            {appVersion}
          </Typography>
        </View>
      ) : item.key === "login" ? (
        <View style={styles.group}>
          <View style={styles.row}>
            <Typography type="bodyLarge" weight="medium" style={styles.text16}>
              {loginFaceRecognition}
            </Typography>
            <Toggle
              variant="switch"
              value={settings.loginSettings.enableFaceRecognition}
              setValue={async (next: boolean) => {
                try {
                  await setSettings({
                    ...settings,
                    loginSettings: {
                      ...settings.loginSettings,
                      enableFaceRecognition: next,
                    },
                  });
                  showToast(toastSaved, {
                    variant: "success",
                    position: "top",
                  });
                } catch (e) {
                  // Error is handled by context and shown via useEffect
                }
              }}
              disabled={isLoading}
              size={styles.toggle}
            />
          </View>
          <View style={styles.row}>
            <Typography type="bodyLarge" weight="medium" style={styles.text16}>
              {loginFaceId}
            </Typography>
            <Toggle
              variant="switch"
              value={settings.loginSettings.enableFaceId}
              setValue={async (next: boolean) => {
                try {
                  await setSettings({
                    ...settings,
                    loginSettings: {
                      ...settings.loginSettings,
                      enableFaceId: next,
                    },
                  });
                  showToast(toastSaved, {
                    variant: "success",
                    position: "top",
                  });
                } catch (e) {
                  // Error is handled by context and shown via useEffect
                }
              }}
              disabled={isLoading}
              size={styles.toggle}
            />
          </View>
          <View style={styles.row}>
            <Typography type="bodyLarge" weight="medium" style={styles.text16}>
              {loginFingerprint}
            </Typography>
            <Toggle
              variant="switch"
              value={settings.loginSettings.enableFingerprint}
              setValue={async (next: boolean) => {
                try {
                  await setSettings({
                    ...settings,
                    loginSettings: {
                      ...settings.loginSettings,
                      enableFingerprint: next,
                    },
                  });
                  showToast(toastSaved, {
                    variant: "success",
                    position: "top",
                  });
                } catch (e) {
                  // Error is handled by context and shown via useEffect
                }
              }}
              disabled={isLoading}
              size={styles.toggle}
            />
          </View>
        </View>
      ) : item.key === "notifications" ? (
        <View style={styles.group}>
          <View style={styles.row}>
            <Typography type="bodyLarge" weight="medium" style={styles.text16}>
              {notificationsMuteJobOffers}
            </Typography>
            <Toggle
              variant="switch"
              value={settings.notifications.muteJobOffers}
              setValue={async (next: boolean) => {
                try {
                  await setSettings({
                    ...settings,
                    notifications: {
                      ...settings.notifications,
                      muteJobOffers: next,
                    },
                  });
                  showToast(toastSaved, {
                    variant: "success",
                    position: "top",
                  });
                } catch (e) {
                  // Error is handled by context and shown via useEffect
                }
              }}
              disabled={isLoading}
              size={styles.toggle}
            />
          </View>
          <View style={styles.row}>
            <Typography type="bodyLarge" weight="medium" style={styles.text16}>
              {notificationsMuteAll}
            </Typography>
            <Toggle
              variant="switch"
              value={settings.notifications.muteAll}
              setValue={async (next: boolean) => {
                try {
                  await setSettings({
                    ...settings,
                    notifications: {
                      ...settings.notifications,
                      muteAll: next,
                    },
                  });
                  showToast(toastSaved, {
                    variant: "success",
                    position: "top",
                  });
                } catch (e) {
                  // Error is handled by context and shown via useEffect
                }
              }}
              disabled={isLoading}
              size={styles.toggle}
            />
          </View>
        </View>
      ) : item.key === "ride-preferences" ? (
        <Accordion
          items={[
            {
              key: "ride-home-page",
              label: ridePreferencesHomePageLabel,
              icon: (
                <Image
                  source={require("@/assets/images/app-settings-icon.png")}
                  style={styles.icon}
                />
              ),
              children: (
                <View style={styles.group}>
                  {/* Hide Live Jobs and Future Reservations for independent operators */}
                  {!isIndependentOperator && (
                    <>
                      <View style={styles.row}>
                        <Typography
                          type="bodyLarge"
                          weight="medium"
                          style={styles.text16}
                        >
                          {ridePreferencesHomePageLiveJobs}
                        </Typography>
                        <Toggle
                          variant="switch"
                          value={settings.ridePreferences.homePage.liveJobs}
                          setValue={createToggleHandler((next) => ({
                            ...settings,
                            ridePreferences: {
                              ...settings.ridePreferences,
                              homePage: {
                                ...settings.ridePreferences.homePage,
                                liveJobs: next,
                              },
                            },
                          }))}
                          disabled={isLoading}
                          size={styles.toggle}
                        />
                      </View>
                      <View style={styles.row}>
                        <Typography
                          type="bodyLarge"
                          weight="medium"
                          style={styles.text16}
                        >
                          {ridePreferencesHomePageFutureReservations}
                        </Typography>
                        <Toggle
                          variant="switch"
                          value={
                            settings.ridePreferences.homePage.futureReservations
                          }
                          setValue={createToggleHandler((next) => ({
                            ...settings,
                            ridePreferences: {
                              ...settings.ridePreferences,
                              homePage: {
                                ...settings.ridePreferences.homePage,
                                futureReservations: next,
                              },
                            },
                          }))}
                          disabled={isLoading}
                          size={styles.toggle}
                        />
                      </View>
                    </>
                  )}
                  <View style={styles.row}>
                    <Typography
                      type="bodyLarge"
                      weight="medium"
                      style={styles.text16}
                    >
                      {ridePreferencesHomePageLongDistance}
                    </Typography>
                    <Toggle
                      variant="switch"
                      value={
                        settings.ridePreferences.homePage.longDistanceIntercity
                      }
                      setValue={createToggleHandler((next) => ({
                        ...settings,
                        ridePreferences: {
                          ...settings.ridePreferences,
                          homePage: {
                            ...settings.ridePreferences.homePage,
                            longDistanceIntercity: next,
                          },
                        },
                      }))}
                      disabled={isLoading}
                      size={styles.toggle}
                    />
                  </View>
                  <View style={styles.row}>
                    <Typography
                      type="bodyLarge"
                      weight="medium"
                      style={styles.text16}
                    >
                      {ridePreferencesHomePagePets}
                    </Typography>
                    <Toggle
                      variant="switch"
                      value={settings.ridePreferences.homePage.pets}
                      setValue={createToggleHandler((next) => ({
                        ...settings,
                        ridePreferences: {
                          ...settings.ridePreferences,
                          homePage: {
                            ...settings.ridePreferences.homePage,
                            pets: next,
                          },
                        },
                      }))}
                      disabled={isLoading}
                      size={styles.toggle}
                    />
                  </View>
                  <View style={styles.row}>
                    <Typography
                      type="bodyLarge"
                      weight="medium"
                      style={styles.text16}
                    >
                      {ridePreferencesHomePagePackage}
                    </Typography>
                    <Toggle
                      variant="switch"
                      value={settings.ridePreferences.homePage.package}
                      setValue={createToggleHandler((next) => ({
                        ...settings,
                        ridePreferences: {
                          ...settings.ridePreferences,
                          homePage: {
                            ...settings.ridePreferences.homePage,
                            package: next,
                          },
                        },
                      }))}
                      disabled={isLoading}
                      size={styles.toggle}
                    />
                  </View>
                </View>
              ),
            },
            {
              key: "ride-types",
              label: ridePreferencesRideTypesLabel,
              icon: (
                <Image
                  source={require("@/assets/images/app-settings-icon.png")}
                  style={styles.icon}
                />
              ),
              children: (
                <View style={styles.group}>
                  <View style={styles.row}>
                    <Typography
                      type="bodyLarge"
                      weight="medium"
                      style={styles.text16}
                    >
                      {ridePreferencesRideTypesEconomy}
                    </Typography>
                    <Toggle
                      variant="switch"
                      value={settings.ridePreferences.rideTypes.economy}
                      setValue={createToggleHandler((next) => ({
                        ...settings,
                        ridePreferences: {
                          ...settings.ridePreferences,
                          rideTypes: {
                            ...settings.ridePreferences.rideTypes,
                            economy: next,
                          },
                        },
                      }))}
                      disabled={isLoading}
                      size={styles.toggle}
                    />
                  </View>
                  <View style={styles.row}>
                    <Typography
                      type="bodyLarge"
                      weight="medium"
                      style={styles.text16}
                    >
                      {ridePreferencesRideTypesSedan}
                    </Typography>
                    <Toggle
                      variant="switch"
                      value={settings.ridePreferences.rideTypes.sedan}
                      setValue={createToggleHandler((next) => ({
                        ...settings,
                        ridePreferences: {
                          ...settings.ridePreferences,
                          rideTypes: {
                            ...settings.ridePreferences.rideTypes,
                            sedan: next,
                          },
                        },
                      }))}
                      disabled={isLoading}
                      size={styles.toggle}
                    />
                  </View>
                  <View style={styles.row}>
                    <Typography
                      type="bodyLarge"
                      weight="medium"
                      style={styles.text16}
                    >
                      {ridePreferencesRideTypesSuv}
                    </Typography>
                    <Toggle
                      variant="switch"
                      value={settings.ridePreferences.rideTypes.suv}
                      setValue={createToggleHandler((next) => ({
                        ...settings,
                        ridePreferences: {
                          ...settings.ridePreferences,
                          rideTypes: {
                            ...settings.ridePreferences.rideTypes,
                            suv: next,
                          },
                        },
                      }))}
                      disabled={isLoading}
                      size={styles.toggle}
                    />
                  </View>
                  <View style={styles.row}>
                    <Typography
                      type="bodyLarge"
                      weight="medium"
                      style={styles.text16}
                    >
                      {ridePreferencesRideTypesLuxury}
                    </Typography>
                    <Toggle
                      variant="switch"
                      value={settings.ridePreferences.rideTypes.luxury}
                      setValue={createToggleHandler((next) => ({
                        ...settings,
                        ridePreferences: {
                          ...settings.ridePreferences,
                          rideTypes: {
                            ...settings.ridePreferences.rideTypes,
                            luxury: next,
                          },
                        },
                      }))}
                      disabled={isLoading}
                      size={styles.toggle}
                    />
                  </View>
                </View>
              ),
            },
          ]}
        />
      ) : (
        <View>
          <Typography type="bodyMedium" weight="regular" style={styles.noData}>
            {emptyState}
          </Typography>
        </View>
      ),
  }));

  return (
    <SafeAreaView style={styles.container}>
      <Header title={headerTitle} onBackPress={() => router.back()} />
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <Loader size="medium" />
          <Typography type="bodyMedium" style={styles.loadingText}>
            {loadingMessage}
          </Typography>
        </View>
      )}
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        pointerEvents={isLoading ? "none" : "auto"}
      >
        <Accordion items={settingsItems} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: textColors.white,
  },
  content: {
    paddingVertical: 24,
    paddingHorizontal: 12,
  },
  icon: {
    width: 24,
    height: 24,
    resizeMode: "contain",
  },
  noData: {
    color: textColors.black,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  infoLabel: {
    color: textColors.black,
  },
  infoValue: {
    color: textColors.black,
  },
  group: {
    gap: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  text16: {
    fontSize: 16,
    color: textColors.black,
  },
  toggle: {
    width: 42,
    height: 24,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    zIndex: 1000,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    color: textColors.black,
  },
});
