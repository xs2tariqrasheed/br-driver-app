import Button from "@/components/Button";
import Header from "@/components/Header";
import Logo from "@/components/Logo";
import Typography from "@/components/Typography";
import { textColors } from "@/constants/colors";
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
  SafeAreaView,
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

  const data: MoreItem[] = ITEMS.map((item) => {
    if (item.key === "change-password") {
      return {
        ...item,
        onClick: () => router.push("/(screens)/more/update-password"),
      };
    }
    if (item.key === "logout") {
      return { ...item, onClick: () => logoutSheetRef.current?.present() };
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
});
