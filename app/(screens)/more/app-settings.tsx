import Accordion from "@/components/Accordion";
import Toggle from "@/components/Form/Toggle";
import Header from "@/components/Header";
import Typography from "@/components/Typography";
import { textColors } from "@/constants/colors";
import { APP_SETTINGS_ITEMS, APP_VERSION } from "@/constants/global";
import { useSettings } from "@/context/SettingsContext";
import { useRouter } from "expo-router";
import React from "react";
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

export default function AppSettingsScreen() {
  const router = useRouter();
  const [settings, setSettings] = useSettings();

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
              setValue={(next: boolean) =>
                setSettings({
                  ...settings,
                  loginSettings: {
                    ...settings.loginSettings,
                    enableFaceRecognition: next,
                  },
                })
              }
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
              setValue={(next: boolean) =>
                setSettings({
                  ...settings,
                  loginSettings: {
                    ...settings.loginSettings,
                    enableFaceId: next,
                  },
                })
              }
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
              setValue={(next: boolean) =>
                setSettings({
                  ...settings,
                  loginSettings: {
                    ...settings.loginSettings,
                    enableFingerprint: next,
                  },
                })
              }
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
              setValue={(next: boolean) =>
                setSettings({
                  ...settings,
                  notifications: {
                    ...settings.notifications,
                    muteJobOffers: next,
                  },
                })
              }
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
              setValue={(next: boolean) =>
                setSettings({
                  ...settings,
                  notifications: {
                    ...settings.notifications,
                    muteAll: next,
                  },
                })
              }
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
                      setValue={(next: boolean) =>
                        setSettings({
                          ...settings,
                          ridePreferences: {
                            ...settings.ridePreferences,
                            homePage: {
                              ...settings.ridePreferences.homePage,
                              liveJobs: next,
                            },
                          },
                        })
                      }
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
                      setValue={(next: boolean) =>
                        setSettings({
                          ...settings,
                          ridePreferences: {
                            ...settings.ridePreferences,
                            homePage: {
                              ...settings.ridePreferences.homePage,
                              futureReservations: next,
                            },
                          },
                        })
                      }
                      size={styles.toggle}
                    />
                  </View>
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
                      setValue={(next: boolean) =>
                        setSettings({
                          ...settings,
                          ridePreferences: {
                            ...settings.ridePreferences,
                            homePage: {
                              ...settings.ridePreferences.homePage,
                              longDistanceIntercity: next,
                            },
                          },
                        })
                      }
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
                      setValue={(next: boolean) =>
                        setSettings({
                          ...settings,
                          ridePreferences: {
                            ...settings.ridePreferences,
                            homePage: {
                              ...settings.ridePreferences.homePage,
                              pets: next,
                            },
                          },
                        })
                      }
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
                      setValue={(next: boolean) =>
                        setSettings({
                          ...settings,
                          ridePreferences: {
                            ...settings.ridePreferences,
                            homePage: {
                              ...settings.ridePreferences.homePage,
                              package: next,
                            },
                          },
                        })
                      }
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
                      setValue={(next: boolean) =>
                        setSettings({
                          ...settings,
                          ridePreferences: {
                            ...settings.ridePreferences,
                            rideTypes: {
                              ...settings.ridePreferences.rideTypes,
                              economy: next,
                            },
                          },
                        })
                      }
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
                      setValue={(next: boolean) =>
                        setSettings({
                          ...settings,
                          ridePreferences: {
                            ...settings.ridePreferences,
                            rideTypes: {
                              ...settings.ridePreferences.rideTypes,
                              sedan: next,
                            },
                          },
                        })
                      }
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
                      setValue={(next: boolean) =>
                        setSettings({
                          ...settings,
                          ridePreferences: {
                            ...settings.ridePreferences,
                            rideTypes: {
                              ...settings.ridePreferences.rideTypes,
                              suv: next,
                            },
                          },
                        })
                      }
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
                      setValue={(next: boolean) =>
                        setSettings({
                          ...settings,
                          ridePreferences: {
                            ...settings.ridePreferences,
                            rideTypes: {
                              ...settings.ridePreferences.rideTypes,
                              luxury: next,
                            },
                          },
                        })
                      }
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
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
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
});
