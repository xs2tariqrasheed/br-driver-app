import Accordion from "@/components/Accordion";
import Toggle from "@/components/Form/Toggle";
import Header from "@/components/Header";
import Loader from "@/components/Loader";
import { showToast } from "@/components/Toast";
import Typography from "@/components/Typography";
import { textColors } from "@/constants/colors";
import { APP_SETTINGS_ITEMS, APP_VERSION, DRIVER_TYPES } from "@/constants/global";
import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/context/SettingsContext";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

export default function AppSettingsScreen() {
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
  const createToggleHandler = (updateFn: (next: boolean) => SettingsObject) => {
    return async (next: boolean) => {
      try {
        await setSettings(updateFn(next));
        showToast("Settings saved successfully", {
          variant: "success",
          position: "top",
        });
      } catch (e) {
        // Error is handled by context and shown via useEffect
      }
    };
  };

  const items = APP_SETTINGS_ITEMS.map((item) => ({
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
            Version
          </Typography>
          <Typography
            type="bodyMedium"
            weight="regular"
            style={styles.infoValue}
          >
            {APP_VERSION}
          </Typography>
        </View>
      ) : item.key === "login" ? (
        <View style={styles.group}>
          <View style={styles.row}>
            <Typography type="bodyLarge" weight="medium" style={styles.text16}>
              Enable Face Recognition Login
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
                  showToast("Settings saved successfully", {
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
              Enable Face ID Login
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
                  showToast("Settings saved successfully", {
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
              Enable Fingerprint Login
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
                  showToast("Settings saved successfully", {
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
              Mute Job Offers
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
                  showToast("Settings saved successfully", {
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
              Mute All
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
                  showToast("Settings saved successfully", {
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
              label: "Home Page",
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
                          Live Jobs
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
                          Future Reservations
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
                      Long Distance/Intercity
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
                      Pets
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
                      Package
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
              label: "Ride Types",
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
                      Economy
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
                      Sedan
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
                      SUV
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
                      Luxury
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
            No Data Found
          </Typography>
        </View>
      ),
  }));

  return (
    <SafeAreaView style={styles.container}>
      <Header title="App Settings" onBackPress={() => router.back()} />
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <Loader size="medium" />
          <Typography type="bodyMedium" style={styles.loadingText}>
            Saving settings...
          </Typography>
        </View>
      )}
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        pointerEvents={isLoading ? "none" : "auto"}
      >
        <Accordion items={items} />
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
