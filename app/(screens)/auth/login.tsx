import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Image,
  KeyboardAvoidingView,
  Linking,
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
import { showToast } from "@/components/Toast";
import Typography from "@/components/Typography";
import { textColors } from "@/constants/colors";
import { AUTH_ENDPOINTS } from "@/constants/endpoints";
import { BiometricMethod, URLS } from "@/constants/global";
import { useAuth } from "@/context/AuthContext";
import { usePost } from "@/hooks/usePost";
import { logger } from "@/utils/helpers";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import * as LocalAuthentication from "expo-local-authentication";
import { useFocusEffect, useRouter } from "expo-router";

type LoginFormValues = {
  companyId: string;
  loginId: string;
  password: string;
};

/**
 * Caller: Navigation system (Expo Router) - triggered when user navigates to /auth/login route
 * Page/Screen: Login screen - user authentication entry point
 * Purpose: Collects user credentials and initiates authentication; provides account recovery options
 * Input/Output:
 *   - Input: None (initializes internal state via react-hook-form)
 *   - Output: JSX tree rendering the login UI; dispatches submit via onSubmit handler
 * Description:
 *   - Initializes a controlled form with validation for company ID, login ID, and password
 *   - Renders header, logo, descriptive copy, and inputs using design system components
 *   - Submits validated credentials using handleSubmit(onSubmit)
 *   - Exposes recovery and quick-auth shortcuts (biometrics placeholders) and a "Forgot" bottom sheet
 * Expected Outcome:
 *   - Users can enter credentials, see validation feedback, and trigger sign-in
 *   - Bottom sheet opens/closes smoothly; UI adapts to keyboard on iOS and Android
 */
/**
 * Renders the Login screen.
 * - Initializes and validates the login form
 * - Submits credentials to the auth API
 * - Provides bottom sheets for forgotten credentials and biometric prompts
 */
export default function LoginScreen() {
  const router = useRouter();
  const [auth, setAuth] = useAuth();
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LoginFormValues>({
    defaultValues: { companyId: "", loginId: "", password: "" },
    mode: "onChange",
  });

  // API: login
  const {
    loading: submitting,
    error: submitError,
    execute: submitLogin,
  } = usePost<any, LoginFormValues>(AUTH_ENDPOINTS.login);

  /**
   * Handles validated form submission.
   * Params:
   *   - data: LoginFormValues containing companyId, loginId, password (validated by react-hook-form)
   * Side-effects:
   *   - Currently logs payload; replace with authentication request and navigation on success
   * Error handling:
   *   - Validation errors surfaced by react-hook-form via `errors`
   */
  /**
   * Submits the login form when validation passes.
   * @param data Parsed and validated form values
   */
  const onSubmit = async (data: LoginFormValues) => {
    const log = logger();
    log("Login submit", data);
    try {
      const response = {
        token: "1234567890",
        user: { id: "1234567890", name: "John Doe" },
      }; //await submitLogin(data);
      // Expect response to include token and optionally user info
      await setAuth(response as any);
      showToast("Logged in successfully", {
        variant: "success",
        position: "top",
      });
      router.replace("/(tabs)");
    } catch (e) {
      // Error state handled by hook; show toast as well
      const message = e instanceof Error ? e.message : "Login failed";
      showToast(message, { variant: "error", position: "top" });
    }
  };
  // If already authenticated, redirect to home
  useEffect(() => {
    if (auth && auth.token) {
      router.replace("/(tabs)");
    }
  }, [auth, router]);

  // Also react to hook error state changes (defensive)
  /**
   * Reflect asynchronous submit errors via toast notifications.
   */
  useEffect(() => {
    if (submitError) {
      showToast(submitError, { variant: "error", position: "top" });
    }
  }, [submitError]);

  // Bottom sheet state & handlers
  const forgotSheetRef = useRef<BottomSheetModal>(null);
  const biometricSheetRef = useRef<BottomSheetModal>(null);
  const successSheetRef = useRef<BottomSheetModal>(null);
  const [biometricTitle, setBiometricTitle] = useState<string>("");
  const [biometricDescription, setBiometricDescription] = useState<string>("");
  const [supportedTypes, setSupportedTypes] = useState<number[]>([]);
  /**
   * Memoized snap points for the Forgot bottom sheet to prevent unnecessary recalculations.
   */
  const snapPoints = useMemo(() => ["30%"], []);
  /**
   * Opens the Forgot options bottom sheet.
   * Preconditions: `forgotSheetRef` must point to a mounted BottomSheetModal.
   */
  /** Opens the "Forgot" bottom sheet. */
  const openForgotSheet = useCallback(() => {
    forgotSheetRef.current?.present();
  }, []);
  /**
   * Closes the Forgot options bottom sheet.
   * No-op if the sheet is not currently presented.
   */
  /** Closes the "Forgot" bottom sheet. */
  const closeForgotSheet = useCallback(() => {
    forgotSheetRef.current?.dismiss();
  }, []);

  // Reset form whenever this screen gains focus
  useFocusEffect(
    useCallback(() => {
      reset({ companyId: "", loginId: "", password: "" });
    }, [reset])
  );

  /**
   * Opens the biometric info bottom sheet with a title and description.
   */
  const openBiometricSheet = useCallback(
    (title: string, description: string) => {
      setBiometricTitle(title);
      setBiometricDescription(description);
      biometricSheetRef.current?.present();
    },
    []
  );

  /** Closes the biometric bottom sheet. */
  const closeBiometricSheet = useCallback(() => {
    biometricSheetRef.current?.dismiss();
  }, []);

  /** Opens OS settings and closes biometric sheet. */
  const handleOpenSettings = useCallback(() => {
    Linking.openSettings();
    closeBiometricSheet();
  }, [closeBiometricSheet]);

  // Biometric authentication methods type is centralized in constants/global.ts

  // Messages centralized in constants/global.ts

  /**
   * Human-friendly labels and messages for unsupported or not-enabled biometrics
   */
  const getMethodDisplayName = (method: BiometricMethod): string => {
    if (method === "fingerprint") return "Fingerprint";
    if (method === "faceId") return "Face ID";
    return "Face Recognition";
  };

  const getUnsupportedCopy = (method: BiometricMethod) => {
    const title = `${getMethodDisplayName(method)} Not Supported`;
    let description = "This biometric option is not available on this device.";
    if (method !== "fingerprint") {
      if (Platform.OS === "android") {
        description =
          "Your device's Face Unlock is not exposed to apps by the system. You can still sign in using fingerprint or your password.";
      } else {
        description = "This device does not support Face ID.";
      }
    }
    return { title, description };
  };

  const getNotEnabledCopy = (method: BiometricMethod) => {
    const isFace = method !== "fingerprint";
    const title = isFace
      ? "Face recognition not set up"
      : "Fingerprint not set up";
    const description = isFace
      ? "Please enroll your face in device settings and try again."
      : "Please enroll your fingerprint in device settings and try again.";
    return { title, description };
  };

  /**
   * Checks device biometric availability and prompts authentication.
   * Falls back to info sheet if unsupported or not enrolled.
   */
  const checkAndPromptBiometrics = useCallback(
    async (method: BiometricMethod) => {
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();

        if (!hasHardware || !isEnrolled) {
          const { title, description } = getNotEnabledCopy(method);
          openBiometricSheet(title, description);
          return;
        }

        // Optionally, we could proceed to authenticate here.
        // For now, just trigger a simple prompt to validate everything is set up.
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: "Authenticate",
          cancelLabel: "Cancel",
          disableDeviceFallback: false,
        });
        if (result?.success) {
          successSheetRef.current?.present();
        }
      } catch (err) {
        const { title, description } = getNotEnabledCopy(method);
        openBiometricSheet(title, description);
      }
    },
    [openBiometricSheet]
  );

  /** On mount, read supported device biometric types. */
  useEffect(() => {
    (async () => {
      try {
        const types =
          await LocalAuthentication.supportedAuthenticationTypesAsync();
        setSupportedTypes(types);
      } catch {
        setSupportedTypes([]);
      }
    })();
  }, []);

  /**
   * Returns whether the given biometric method is supported by the device.
   */
  const isMethodSupported = (method: BiometricMethod) => {
    if (!supportedTypes || supportedTypes.length === 0) return false;
    if (method === "fingerprint") {
      return supportedTypes.includes(
        LocalAuthentication.AuthenticationType.FINGERPRINT
      );
    }
    // Both Face ID and Face Recognition map to FACIAL_RECOGNITION at the API level
    return supportedTypes.includes(
      LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION
    );
  };

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
              <TouchableOpacity onPress={openForgotSheet} disabled={submitting}>
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
              loading={submitting}
              disabled={submitting}
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
                method: "fingerprint" as BiometricMethod,
              },
              {
                icon: require("@/assets/images/face-id.png"),
                title: "Face ID",
                method: "faceId" as BiometricMethod,
              },
              {
                icon: require("@/assets/images/facial-recognition.png"),
                title: "Face Recognition",
                method: "faceRecognition" as BiometricMethod,
              },
            ].map((option) => {
              const supported = isMethodSupported(option.method);
              const cardStyle = styles.authCard;
              const iconStyle = styles.authIcon;
              const textStyle = styles.authText;

              return (
                <TouchableOpacity
                  style={cardStyle}
                  activeOpacity={0.8}
                  key={option.title}
                  onPress={() => {
                    if (supported) {
                      void checkAndPromptBiometrics(option.method);
                    } else {
                      const { title, description } = getUnsupportedCopy(
                        option.method
                      );
                      openBiometricSheet(title, description);
                    }
                  }}
                  disabled={submitting}
                >
                  <Image source={option.icon} style={iconStyle} />
                  <Typography
                    type="labelLarge"
                    weight="semibold"
                    style={textStyle}
                  >
                    {option.title}
                  </Typography>
                </TouchableOpacity>
              );
            })}
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

          <Button
            variant="primary"
            rounded="half"
            disabled={submitting}
            onPress={() => Linking.openURL(URLS.requestRegistration)}
          >
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
                disabled={submitting}
              />
            </View>

            {[
              {
                label: "Forgot Password",
                onPress: () => {
                  closeForgotSheet();
                  router.push("/(screens)/auth/forgot-password");
                },
              },
              {
                label: "Forgot User Id",
                onPress: () => {
                  closeForgotSheet();
                  router.push("/(screens)/auth/forgot-user-id");
                },
              },
            ].map((item) => (
              <View key={item.label}>
                <TouchableOpacity
                  key={item.label}
                  style={styles.sheetRow}
                  disabled={submitting}
                  onPress={item.onPress}
                >
                  <Typography
                    type="bodyLarge"
                    weight="medium"
                    style={styles.sheetOptionText}
                  >
                    {item.label}
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

      {/* Biometric Permission Bottom Sheet */}
      <BottomSheetModal
        ref={biometricSheetRef}
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
                style={styles.biometricTitleText}
              >
                {biometricTitle}
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
                onPress={closeBiometricSheet}
                disabled={submitting}
              />
            </View>

            <Typography
              type="bodyLarge"
              weight="regular"
              style={styles.biometricDescriptionText}
            >
              {biometricDescription}
            </Typography>

            <Button
              variant="primary"
              rounded="half"
              onPress={handleOpenSettings}
              disabled={submitting}
            >
              Open Settings
            </Button>
          </View>
        </BottomSheetView>
      </BottomSheetModal>

      {/* Success Bottom Sheet (non-dismissible) */}
      <BottomSheetModal
        ref={successSheetRef}
        snapPoints={["60%"]}
        enablePanDownToClose={false}
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            appearsOnIndex={0}
            disappearsOnIndex={-1}
            opacity={0.7}
            enableTouchThrough={false}
            pressBehavior="none"
          />
        )}
        style={styles.bottomSheetContainer}
      >
        <BottomSheetView>
          <View style={styles.sheetContainer}>
            <View style={styles.successIconWrapper}>
              <Image
                source={require("@/assets/images/identity-confirmed.png")}
                style={styles.successIcon}
              />
            </View>

            <Typography
              type="headingLarge"
              weight="semibold"
              style={styles.successTitle}
            >
              Identity Verified!
            </Typography>

            <Typography
              type="bodyLarge"
              weight="regular"
              style={styles.successDescription}
            >
              Welcome aboard, John Smith! We're thrilled to have you as our
              captain. Let’s hit the road and make every journey a great one!
            </Typography>
            <Typography
              type="bodyLarge"
              weight="regular"
              style={styles.successDescription}
            >
              You're now part of a trusted community of drivers dedicated to
              delivering great service. Stay safe, drive smart, and enjoy the
              journey ahead.
            </Typography>
            <Typography
              type="bodyLarge"
              weight="regular"
              style={styles.successDescription}
            >
              From short trips to long hauls, every mile you drive matters.
              Let’s build a smooth, successful ride experience together.
            </Typography>

            <Button
              variant="primary"
              rounded="half"
              onPress={() => {
                successSheetRef.current?.dismiss();
                router.replace("/(tabs)");
              }}
            >
              Continue
            </Button>
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
  authCardDisabled: {
    borderColor: textColors.grey100,
    backgroundColor: textColors.grey100,
    opacity: 0.6,
  },
  authIcon: {
    width: 36,
    height: 36,
    resizeMode: "contain",
    marginBottom: 8,
  },
  authIconDisabled: {
    tintColor: textColors.grey700,
  },
  authText: {
    color: textColors.black,
  },
  authTextDisabled: {
    color: textColors.grey700,
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
  biometricTitleText: {
    fontSize: 21,
    color: textColors.black,
  },
  biometricDescriptionText: {
    fontSize: 16,
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
  successIconWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  successIcon: {
    width: 64,
    height: 64,
    resizeMode: "contain",
  },
  successTitle: {
    fontSize: 24,
    color: textColors.black,
    textAlign: "left",
    marginBottom: 8,
  },
  successDescription: {
    fontSize: 16,
    color: textColors.black,
  },
});
