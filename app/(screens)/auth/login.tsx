import React, { useCallback, useMemo, useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

import Button, { IconButton } from "@/components/Button";
import Input from "@/components/Form/Input";
import Header from "@/components/Header";
import Logo from "@/components/Logo";
import Typography from "@/components/Typography";
import { textColors } from "@/constants/colors";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";

type LoginFormValues = {
  companyId: string;
  loginId: string;
  password: string;
};

export default function LoginScreen() {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    defaultValues: { companyId: "", loginId: "", password: "" },
    mode: "onChange",
  });

  const onSubmit = (data: LoginFormValues) => {
    console.log("Login submit", data);
  };

  // Bottom sheet state & handlers
  const forgotSheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ["30%"], []);
  const openForgotSheet = useCallback(() => {
    forgotSheetRef.current?.present();
  }, []);
  const closeForgotSheet = useCallback(() => {
    forgotSheetRef.current?.dismiss();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Login" hideBackIcon onBackPress={undefined} />

      <KeyboardAvoidingView
        style={styles.keyboardAvoiding}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={100}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View style={styles.centeredRow}>
            <Logo size="Large" />
          </View>

          {/* Title & Description */}
          <View style={styles.titleGroup}>
            <Typography
              type="titleExtraLarge"
              weight="semibold"
              style={styles.textBlack}
            >
              Access Your Account
            </Typography>
            <Typography
              type="bodyMedium"
              weight="regular"
              style={styles.textBlack}
            >
              Sign in to access your account, manage rides, and start earning.
            </Typography>
          </View>

          {/* Form */}
          <View style={styles.formGroup}>
            <Controller
              control={control}
              name="companyId"
              rules={{ required: "Company ID is required." }}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Company ID"
                  placeholder="Enter your company ID"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  name="companyId"
                  errors={errors as any}
                />
              )}
            />

            <Controller
              control={control}
              name="loginId"
              rules={{ required: "Login ID is required." }}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Login ID"
                  placeholder="Enter your login ID"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  name="loginId"
                  errors={errors as any}
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              rules={{
                required: "Password is required.",
                minLength: { value: 8, message: "Minimum 8 characters." },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Password"
                  placeholder="Enter your password"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  inputType="password"
                  name="password"
                  errors={errors as any}
                />
              )}
            />

            <View style={styles.alignEndRow}>
              <TouchableOpacity onPress={openForgotSheet}>
                <Typography
                  type="bodyMedium"
                  weight="semibold"
                  style={styles.textBlack}
                >
                  Forgot?
                </Typography>
              </TouchableOpacity>
            </View>

            <Button
              variant="primary"
              rounded="half"
              onPress={handleSubmit(onSubmit)}
            >
              Sign In
            </Button>
          </View>

          {/* Or divider */}
          <View style={styles.orRow}>
            <View style={styles.hr} />
            <Typography
              type="bodyMedium"
              weight="regular"
              style={styles.textGrey700}
            >
              Or
            </Typography>
            <View style={styles.hr} />
          </View>

          {/* Auth options */}
          <View style={styles.authRow}>
            {[
              {
                icon: require("@/assets/images/finger-print.png"),
                title: "Fingerprint",
                onPress: () => {
                  console.log("Fingerprint");
                },
              },
              {
                icon: require("@/assets/images/face-id.png"),
                title: "Face ID",
                onPress: () => {
                  console.log("Face ID");
                },
              },
              {
                icon: require("@/assets/images/facial-recognition.png"),
                title: "Face Recognition",
                onPress: () => {
                  console.log("Face Recognition");
                },
              },
            ].map((option) => (
              <TouchableOpacity
                style={styles.authCard}
                activeOpacity={0.8}
                key={option.title}
                onPress={option.onPress}
              >
                <Image source={option.icon} style={styles.authIcon} />
                <Typography
                  type="labelLarge"
                  weight="semibold"
                  style={styles.authText}
                >
                  {option.title}
                </Typography>
              </TouchableOpacity>
            ))}
          </View>

          {/* Footer */}
          <View style={styles.centeredRow}>
            <Typography
              type="bodyMedium"
              weight="regular"
              style={styles.textBlack}
            >
              Don't have an account?
            </Typography>
          </View>

          <Button variant="primary" rounded="half">
            Request Registration
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Forgot Bottom Sheet */}
      <BottomSheetModal
        ref={forgotSheetRef}
        snapPoints={snapPoints}
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
            <View style={styles.sheetHeader}>
              <Typography
                type="headingLarge"
                weight="semibold"
                style={styles.sheetTitleText}
              >
                Forgot?
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
                onPress={closeForgotSheet}
              />
            </View>

            {["Forgot Password", "Forgot User Id"].map((label) => (
              <View key={label}>
                <TouchableOpacity key={label} style={styles.sheetRow}>
                  <Typography
                    type="bodyLarge"
                    weight="medium"
                    style={styles.sheetOptionText}
                  >
                    {label}
                  </Typography>
                  <Image
                    source={require("@/assets/images/black-arrow-right.png")}
                    style={styles.iconSize16}
                  />
                </TouchableOpacity>
                <View style={styles.sheetDivider} />
              </View>
            ))}
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoiding: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  content: {
    paddingHorizontal: 12,
    paddingVertical: 32,
    gap: 20,
  },
  centeredRow: {
    alignItems: "center",
  },
  titleGroup: {
    gap: 4,
  },
  formGroup: {
    gap: 12,
  },
  orRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  hr: {
    flex: 1,
    height: 1,
    backgroundColor: textColors.grey100,
  },
  textBlack: {
    color: textColors.black,
  },
  textGrey700: {
    color: textColors.grey700,
  },
  authRow: {
    flexDirection: "row",
    gap: 12,
  },
  authCard: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: textColors.teal700,
    borderRadius: 8,
    paddingVertical: 16,
    backgroundColor: textColors.white,
  },
  authIcon: {
    width: 36,
    height: 36,
    resizeMode: "contain",
    marginBottom: 8,
  },
  authText: {
    color: textColors.black,
  },
  sheetContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    backgroundColor: textColors.white,
    gap: 12,
  },
  bottomSheetContainer: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: textColors.grey100,
  },
  sheetDivider: {
    height: 1,
    backgroundColor: textColors.grey100,
    marginTop: 12,
  },
  sheetRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  alignEndRow: {
    alignItems: "flex-end",
  },
  sheetTitleText: {
    fontSize: 21,
    color: textColors.black,
  },
  iconSize24: {
    width: 24,
    height: 24,
  },
  sheetOptionText: {
    fontSize: 16,
    color: textColors.black,
  },
  iconSize16: {
    width: 16,
    height: 16,
  },
});
