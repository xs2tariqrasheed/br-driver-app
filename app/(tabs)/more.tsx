import Button, { IconButton } from "@/components/Button";
import Header from "@/components/Header";
import Logo from "@/components/Logo";
import Typography from "@/components/Typography";
import { textColors } from "@/constants/colors";
import { CONTACT_BASE, URLS } from "@/constants/global";
import { useAuth } from "@/context/AuthContext";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import React, { useMemo, useRef } from "react";
import {
  FlatList,
  Image,
  Linking,
  Platform,
  SafeAreaView,
  Share,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

type MoreItem = {
  key: string;
  title: string;
  icon: any;
  onClick?: () => void;
};

const ITEMS: MoreItem[] = [
  {
    key: "profile",
    title: "Profile",
    icon: require("@/assets/images/more/profile-icon.png"),
  },
  {
    key: "inbox",
    title: "Inbox",
    icon: require("@/assets/images/more/inbox-icon.png"),
  },
  {
    key: "contact-base",
    title: "Contact Base",
    icon: require("@/assets/images/more/contact-base-icon.png"),
  },
  {
    key: "coming-soon",
    title: "Coming Soon",
    icon: require("@/assets/images/more/coming-soon-icon.png"),
  },
  {
    key: "share-app",
    title: "Share App",
    icon: require("@/assets/images/more/share-icon.png"),
  },
  {
    key: "app-settings",
    title: "App Settings",
    icon: require("@/assets/images/more/settings-icon.png"),
  },
  {
    key: "delete-profile",
    title: "Delete Profile",
    icon: require("@/assets/images/more/delete-profile-icon.png"),
  },
  {
    key: "change-password",
    title: "Change Password",
    icon: require("@/assets/images/more/change-password-icon.png"),
  },
  {
    key: "logout",
    title: "Logout",
    icon: require("@/assets/images/more/logout-icon.png"),
  },
];

export default function MoreScreen() {
  const router = useRouter();
  const [, setAuth] = useAuth();
  const logoutSheetRef = useRef<BottomSheetModal>(null);
  const logoutSnapPoints = useMemo(() => ["28%"], []);
  const deleteProfileSheetRef = useRef<BottomSheetModal>(null);
  const deleteProfileSnapPoints = useMemo(() => ["28%"], []);
  const contactBaseSheetRef = useRef<BottomSheetModal>(null);
  const contactBaseSnapPoints = useMemo(() => ["38%"], []);

  const handleShareApp = async () => {
    try {
      const isIOS = Platform.OS === "ios";
      const storeUrl = isIOS ? URLS.appStore : URLS.playStore;
      const message = `Check out the BR Driver app! Download it here: ${storeUrl}`;
      await Share.share({ message, url: storeUrl, title: "BR Driver" });
    } catch (error) {
      // noop: silently ignore share cancellation/errors
    }
  };

  const data: MoreItem[] = ITEMS.map((item) => {
    if (item.key === "change-password") {
      return {
        ...item,
        onClick: () => router.push("/(screens)/more/update-password"),
      };
    }
    if (item.key === "delete-profile") {
      return {
        ...item,
        onClick: () => deleteProfileSheetRef.current?.present(),
      };
    }
    if (item.key === "logout") {
      return { ...item, onClick: () => logoutSheetRef.current?.present() };
    }
    if (item.key === "contact-base") {
      return {
        ...item,
        onClick: () => contactBaseSheetRef.current?.present(),
      };
    }
    if (item.key === "share-app") {
      return {
        ...item,
        onClick: handleShareApp,
      };
    }
    if (item.key === "app-settings") {
      return {
        ...item,
        onClick: () => router.push("/(screens)/more/app-settings"),
      };
    }
    return item;
  });

  const renderItem = ({ item }: { item: MoreItem }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      style={styles.card}
      onPress={item.onClick}
    >
      <Image source={item.icon} style={styles.icon} />
      <Typography type="bodyLarge" weight="bold" style={styles.cardTitle}>
        {item.title}
      </Typography>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header title="More" hideBackIcon />
      <View style={styles.content}>
        <View style={styles.logoRow}>
          <Logo size="Large" />
        </View>

        <FlatList
          data={data}
          renderItem={renderItem}
          keyExtractor={(item) => item.key}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={styles.column}
          contentContainerStyle={styles.listContent}
        />
      </View>
      <BottomSheetModal
        ref={logoutSheetRef}
        snapPoints={logoutSnapPoints}
        enablePanDownToClose
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            appearsOnIndex={0}
            disappearsOnIndex={-1}
            opacity={0.7}
            enableTouchThrough={true}
            pressBehavior="close"
          />
        )}
        style={styles.bottomSheetContainer}
      >
        <BottomSheetView>
          <View style={styles.sheetContainer}>
            <Typography
              type="titleMedium"
              weight="semibold"
              style={styles.sheetTitleText}
            >
              Are You Sure?
            </Typography>
            <Typography
              type="bodyLarge"
              weight="regular"
              style={styles.sheetDescriptionText}
            >
              Are you sure you want to logout? This action cannot be undone.
            </Typography>

            <View style={styles.sheetButtonsRow}>
              <Button
                variant="outlined"
                rounded="half"
                block="half"
                onPress={() => logoutSheetRef.current?.dismiss()}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                rounded="half"
                block="half"
                onPress={async () => {
                  await setAuth(null);
                  logoutSheetRef.current?.dismiss();
                  router.replace("/(screens)/auth/login");
                }}
              >
                Yes, Logout
              </Button>
            </View>
          </View>
        </BottomSheetView>
      </BottomSheetModal>

      {/* Delete Profile Confirmation */}
      <BottomSheetModal
        ref={deleteProfileSheetRef}
        snapPoints={deleteProfileSnapPoints}
        enablePanDownToClose
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            appearsOnIndex={0}
            disappearsOnIndex={-1}
            opacity={0.7}
            enableTouchThrough={true}
            pressBehavior="close"
          />
        )}
        style={styles.bottomSheetContainer}
      >
        <BottomSheetView>
          <View style={styles.sheetContainer}>
            <Typography
              type="titleMedium"
              weight="semibold"
              style={styles.sheetTitleText}
            >
              Are You Sure?
            </Typography>
            <Typography
              type="bodyLarge"
              weight="regular"
              style={styles.sheetDescriptionText}
            >
              Are you sure you want to delete your profile? This action cannot
              be undone.
            </Typography>

            <View style={styles.sheetButtonsRow}>
              <Button
                variant="outlined"
                rounded="half"
                block="half"
                onPress={() => deleteProfileSheetRef.current?.dismiss()}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                rounded="half"
                block="half"
                onPress={() => {
                  deleteProfileSheetRef.current?.dismiss();
                  router.push(
                    "/(screens)/auth/verify-otp?context=delete-profile"
                  );
                }}
              >
                Yes, Delete
              </Button>
            </View>
          </View>
        </BottomSheetView>
      </BottomSheetModal>

      {/* Contact Base */}
      <BottomSheetModal
        ref={contactBaseSheetRef}
        snapPoints={contactBaseSnapPoints}
        enablePanDownToClose
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            appearsOnIndex={0}
            disappearsOnIndex={-1}
            opacity={0.7}
            enableTouchThrough={true}
            pressBehavior="close"
          />
        )}
        style={styles.bottomSheetContainer}
      >
        <BottomSheetView>
          <View style={styles.sheetContainer}>
            <View style={styles.sheetHeaderRow}>
              <Typography
                type="titleMedium"
                weight="semibold"
                style={styles.sheetTitleText}
              >
                Contact Base
              </Typography>
              <IconButton
                size={1}
                rounded={true}
                icon={
                  <Image
                    source={require("@/assets/images/black-cross.png")}
                    style={styles.iconSize24}
                  />
                }
                onPress={() => contactBaseSheetRef.current?.dismiss()}
              />
            </View>

            <View style={styles.addressRow}>
              <Image
                source={require("@/assets/images/contact-base-location-icon.png")}
                style={styles.addressIcon}
              />
              <Typography
                type="bodyMedium"
                weight="semibold"
                style={styles.addressText}
              >
                {CONTACT_BASE.address}
              </Typography>
            </View>

            <View style={styles.contactList}>
              {[
                {
                  label: "Driver Relations",
                  phone: CONTACT_BASE.driverRelationsPhone,
                },
                {
                  label: "Business Office",
                  phone: CONTACT_BASE.businessOfficePhone,
                },
              ].map((item) => (
                <TouchableOpacity
                  key={item.label}
                  style={styles.contactRow}
                  activeOpacity={0.7}
                  onPress={() => Linking.openURL(`tel:${item.phone}`)}
                >
                  <Typography
                    type="subHeadingLarge"
                    weight="bold"
                    style={styles.contactLabel}
                  >
                    {item.label}
                  </Typography>
                  <Typography
                    type="bodyMedium"
                    weight="regular"
                    style={styles.contactNumber}
                  >
                    {item.phone}
                  </Typography>
                </TouchableOpacity>
              ))}
            </View>
            <Button
              variant="primary"
              rounded="half"
              onPress={() =>
                Linking.openURL(`tel:${CONTACT_BASE.dispatcherPhone}`)
              }
            >
              Call Dispatcher
            </Button>
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: textColors.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 24,
    paddingBottom: 16,
  },
  logoRow: {
    alignItems: "center",
    marginBottom: 24,
  },
  listContent: {
    paddingBottom: 24,
    rowGap: 12,
  },
  column: {
    justifyContent: "space-between",
    marginBottom: 12,
  },
  card: {
    width: "48%",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: textColors.grey200,
    borderRadius: 12,
    backgroundColor: textColors.white,
    paddingVertical: 18,
    paddingHorizontal: 12,
    gap: 8,
  },
  icon: {
    width: 24,
    height: 24,
    resizeMode: "contain",
  },
  cardTitle: {
    color: textColors.grey800,
  },
  bottomSheetContainer: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  sheetContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    backgroundColor: textColors.white,
    gap: 12,
  },
  sheetTitleText: {
    color: textColors.black,
  },
  sheetDescriptionText: {
    color: textColors.black,
  },
  sheetButtonsRow: {
    flexDirection: "row",
    gap: 12,
  },
  sheetHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconSize24: {
    width: 24,
    height: 24,
  },
  sheetDivider: {
    height: 1,
    backgroundColor: textColors.grey100,
    marginTop: 4,
    marginBottom: 8,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  addressIcon: {
    width: 24,
    height: 24,
    resizeMode: "contain",
  },
  addressText: {
    color: textColors.black,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  contactLabel: {
    color: textColors.black,
  },
  contactNumber: {
    color: textColors.black,
  },
  contactList: {
    marginVertical: 8,
  },
});
