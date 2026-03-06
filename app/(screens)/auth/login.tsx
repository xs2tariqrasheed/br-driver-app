import { useCallback, useEffect, useMemo, useState } from "react";
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

import BottomSheet from "@/components/BottomSheet";
import Button from "@/components/Button";
import Input from "@/components/Form/Input";
import Header from "@/components/Header";
import Loader from "@/components/Loader";
import Logo from "@/components/Logo";
import { showToast } from "@/components/Toast";
import Typography from "@/components/Typography";
import { textColors } from "@/constants/colors";
import { AUTH_ENDPOINTS } from "@/constants/endpoints";
import {
  API_CLIENT_TYPES,
  BiometricMethod,
  SYSTEM_SETTINGS_KEYS,
} from "@/constants/global";
import { LOGIN_CONTENT_KEYS } from "@/content/(screens)/auth/login-keys";
import { useAuth } from "@/context/AuthContext";
import { useOverlayInsets } from "@/context/OverlayInsetsContext";
import { useSettings } from "@/context/SettingsContext";
import { useGetContent } from "@/hooks/useGetContent";
import { usePost } from "@/hooks/usePost";
import { logger } from "@/utils/helpers";
import * as LocalAuthentication from "expo-local-authentication";
import { useFocusEffect, useRouter } from "expo-router";
import { APP_SETTINGS_CONTENT_KEYS } from "@/content/(screens)/more/app-settings-keys";

type LoginFormValues = {
  companyId: string;
  loginId: string; // UI label is "Login ID" but value is emailOrPhone
  password: string;
};

const LOGIN_DEFAULT_VALUES: LoginFormValues = {
  companyId: "1",
  loginId: "mk@example.com",
  password: "123456",
};

/**
 * Caller: Navigation system (Expo Router) - triggered when user navigates to /auth/login route
 * Page/Screen: Login screen - user authentication entry point
 * Purpose: Collects user credentials and initiates authentication; provides account recovery options
 * Input/Output:
 *   - Input: None (initializes internal state via react-hook-form)
 *   - Output: JSX tree rendering the login UI; dispatches submit via onSubmit handler
 * Description:
 *   - Initializes a controlled form with validation for email/phone and password
 *   - Renders header, logo, descriptive copy, and inputs using design system components
 *   - Submits validated credentials to backend API using DB request format (jHeader, jMetaData, jData)
 *   - Exposes recovery and quick-auth shortcuts (biometrics placeholders) and a "Forgot" bottom sheet
 * Expected Outcome:
 *   - Users can enter credentials, see validation feedback, and trigger sign-in
 *   - Bottom sheet opens/closes smoothly; UI adapts to keyboard on iOS and Android
 *   - Successful login navigates to OTP verification screen
 */
/**
 * Renders the Login screen.
 * - Initializes and validates the login form (email/phone and password)
 * - Submits credentials to the auth API with proper DB request format
 * - Provides bottom sheets for forgotten credentials and biometric prompts
 */
export default function LoginScreen() {
  const { getContent } = useGetContent();
  const router = useRouter();
  const log = logger();
  const [auth, setAuth] = useAuth() as any;
  const { overlayBottomInset } = useOverlayInsets();
  const [isFetchingSettings, setIsFetchingSettings] = useState(false);
  const [settings, , { fetchSettings }] = useSettings();

  // Page Content
  const {
    pageTitle,
    loadingMessage,
    introTitle,
    introDescription,
    formCompanyIdLabel,
    formCompanyIdPlaceholder,
    formCompanyIdValidationRequired,
    formLoginIdLabel,
    formLoginIdPlaceholder,
    formLoginIdValidationRequired,
    formLoginIdValidationInvalid,
    formPasswordLabel,
    formPasswordPlaceholder,
    formPasswordValidationRequired,
    formPasswordValidationMinLength,
    forgotLink,
    actionSign,
    actionSigningIn,
    dividerOr,
    biometricFingerprintTitle,
    biometricFaceIdTitle,
    biometricFaceRecognitionTitle,
    biometricNotSupportedReason,
    biometricUnsupportedFingerprintTitle,
    biometricUnsupportedFaceIdTitle,
    biometricUnsupportedFaceRecognitionTitle,
    biometricUnsupportedDescriptionDefault,
    biometricUnsupportedDescriptionAndroidFace,
    biometricUnsupportedDescriptionIosFace,
    biometricNotEnabledFaceTitle,
    biometricNotEnabledFingerprintTitle,
    biometricNotEnabledFaceDescription,
    biometricNotEnabledFingerprintDescription,
    biometricPromptMessage,
    biometricPromptCancel,
    footerNoAccount,
    actionRequestRegistration,
    forgotSheetHeaderTitle,
    forgotSheetOptionPassword,
    forgotSheetOptionUserId,
    biometricSheetButtonOpenSettings,
    successSheetTitle,
    successSheetWelcomePrefix,
    successSheetWelcomeSuffix,
    successSheetDescriptionCommunity,
    successSheetDescriptionJourney,
    successSheetButtonContinue,
    errorGeneric,
    inAppWebviewRequestRegistrationTitle,
    driverWebAppProdUrl,
    appVersion,
  } = useMemo(() => {
    const get = getContent;
    return {
      pageTitle: get(LOGIN_CONTENT_KEYS.PAGE_TITLE),
      loadingMessage: get(LOGIN_CONTENT_KEYS.LOADING_MESSAGE),
      introTitle: get(LOGIN_CONTENT_KEYS.INTRO_TITLE),
      introDescription: get(LOGIN_CONTENT_KEYS.INTRO_DESCRIPTION),
      formCompanyIdLabel: get(LOGIN_CONTENT_KEYS.FORM_COMPANY_ID_LABEL),
      formCompanyIdPlaceholder: get(
        LOGIN_CONTENT_KEYS.FORM_COMPANY_ID_PLACEHOLDER,
      ),
      formCompanyIdValidationRequired: get(
        LOGIN_CONTENT_KEYS.FORM_COMPANY_ID_VALIDATION_REQUIRED,
      ),
      formLoginIdLabel: get(LOGIN_CONTENT_KEYS.FORM_LOGIN_ID_LABEL),
      formLoginIdPlaceholder: get(LOGIN_CONTENT_KEYS.FORM_LOGIN_ID_PLACEHOLDER),
      formLoginIdValidationRequired: get(
        LOGIN_CONTENT_KEYS.FORM_LOGIN_ID_VALIDATION_REQUIRED,
      ),
      formLoginIdValidationInvalid: get(
        LOGIN_CONTENT_KEYS.FORM_LOGIN_ID_VALIDATION_INVALID,
      ),
      formPasswordLabel: get(LOGIN_CONTENT_KEYS.FORM_PASSWORD_LABEL),
      formPasswordPlaceholder: get(
        LOGIN_CONTENT_KEYS.FORM_PASSWORD_PLACEHOLDER,
      ),
      formPasswordValidationRequired: get(
        LOGIN_CONTENT_KEYS.FORM_PASSWORD_VALIDATION_REQUIRED,
      ),
      formPasswordValidationMinLength: get(
        LOGIN_CONTENT_KEYS.FORM_PASSWORD_VALIDATION_MIN_LENGTH,
      ),
      forgotLink: get(LOGIN_CONTENT_KEYS.FORGOT_LINK),
      actionSign: get(LOGIN_CONTENT_KEYS.ACTION_SIGN_IN),
      actionSigningIn: get(LOGIN_CONTENT_KEYS.ACTION_SIGNING_IN),
      dividerOr: get(LOGIN_CONTENT_KEYS.DIVIDER_OR),
      biometricFingerprintTitle: get(
        LOGIN_CONTENT_KEYS.BIOMETRIC_FINGERPRINT_TITLE,
      ),
      biometricFaceIdTitle: get(LOGIN_CONTENT_KEYS.BIOMETRIC_FACE_ID_TITLE),
      biometricFaceRecognitionTitle: get(
        LOGIN_CONTENT_KEYS.BIOMETRIC_FACE_RECOGNITION_TITLE,
      ),
      biometricNotSupportedReason: get(
        LOGIN_CONTENT_KEYS.BIOMETRIC_NOT_SUPPORTED_REASON,
      ),
      biometricUnsupportedFingerprintTitle: get(
        LOGIN_CONTENT_KEYS.BIOMETRIC_UNSUPPORTED_FINGERPRINT_TITLE,
      ),
      biometricUnsupportedFaceIdTitle: get(
        LOGIN_CONTENT_KEYS.BIOMETRIC_UNSUPPORTED_FACE_ID_TITLE,
      ),
      biometricUnsupportedFaceRecognitionTitle: get(
        LOGIN_CONTENT_KEYS.BIOMETRIC_UNSUPPORTED_FACE_RECOGNITION_TITLE,
      ),
      biometricUnsupportedDescriptionDefault: get(
        LOGIN_CONTENT_KEYS.BIOMETRIC_UNSUPPORTED_DESCRIPTION_DEFAULT,
      ),
      biometricUnsupportedDescriptionAndroidFace: get(
        LOGIN_CONTENT_KEYS.BIOMETRIC_UNSUPPORTED_DESCRIPTION_ANDROID_FACE,
      ),
      biometricUnsupportedDescriptionIosFace: get(
        LOGIN_CONTENT_KEYS.BIOMETRIC_UNSUPPORTED_DESCRIPTION_IOS_FACE,
      ),
      biometricNotEnabledFaceTitle: get(
        LOGIN_CONTENT_KEYS.BIOMETRIC_NOT_ENABLED_FACE_TITLE,
      ),
      biometricNotEnabledFingerprintTitle: get(
        LOGIN_CONTENT_KEYS.BIOMETRIC_NOT_ENABLED_FINGERPRINT_TITLE,
      ),
      biometricNotEnabledFaceDescription: get(
        LOGIN_CONTENT_KEYS.BIOMETRIC_NOT_ENABLED_FACE_DESCRIPTION,
      ),
      biometricNotEnabledFingerprintDescription: get(
        LOGIN_CONTENT_KEYS.BIOMETRIC_NOT_ENABLED_FINGERPRINT_DESCRIPTION,
      ),
      biometricPromptMessage: get(LOGIN_CONTENT_KEYS.BIOMETRIC_PROMPT_MESSAGE),
      biometricPromptCancel: get(LOGIN_CONTENT_KEYS.BIOMETRIC_PROMPT_CANCEL),
      footerNoAccount: get(LOGIN_CONTENT_KEYS.FOOTER_NO_ACCOUNT),
      actionRequestRegistration: get(
        LOGIN_CONTENT_KEYS.ACTION_REQUEST_REGISTRATION,
      ),
      forgotSheetHeaderTitle: get(LOGIN_CONTENT_KEYS.FORGOT_SHEET_HEADER_TITLE),
      forgotSheetOptionPassword: get(
        LOGIN_CONTENT_KEYS.FORGOT_SHEET_OPTION_PASSWORD,
      ),
      forgotSheetOptionUserId: get(
        LOGIN_CONTENT_KEYS.FORGOT_SHEET_OPTION_USER_ID,
      ),
      biometricSheetButtonOpenSettings: get(
        LOGIN_CONTENT_KEYS.BIOMETRIC_SHEET_BUTTON_OPEN_SETTINGS,
      ),
      successSheetTitle: get(LOGIN_CONTENT_KEYS.SUCCESS_SHEET_TITLE),
      successSheetWelcomePrefix: get(
        LOGIN_CONTENT_KEYS.SUCCESS_SHEET_WELCOME_PREFIX,
      ),
      successSheetWelcomeSuffix: get(
        LOGIN_CONTENT_KEYS.SUCCESS_SHEET_WELCOME_SUFFIX,
      ),
      successSheetDescriptionCommunity: get(
        LOGIN_CONTENT_KEYS.SUCCESS_SHEET_DESCRIPTION_COMMUNITY,
      ),
      successSheetDescriptionJourney: get(
        LOGIN_CONTENT_KEYS.SUCCESS_SHEET_DESCRIPTION_JOURNEY,
      ),
      successSheetButtonContinue: get(
        LOGIN_CONTENT_KEYS.SUCCESS_SHEET_BUTTON_CONTINUE,
      ),
      errorGeneric: get(LOGIN_CONTENT_KEYS.ERROR_GENERIC),
      inAppWebviewRequestRegistrationTitle: get(
        LOGIN_CONTENT_KEYS.IN_APP_WEBVIEW_REQUEST_REGISTRATION_TITLE,
      ),
      driverWebAppProdUrl: get(
        SYSTEM_SETTINGS_KEYS.DRIVER_WEB_APP_PRODUCTION_URL,
      ),
      appVersion: get(APP_SETTINGS_CONTENT_KEYS.APP_VERSION),
    };
  }, [getContent]);
  // Page Content End

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LoginFormValues>({
    defaultValues: LOGIN_DEFAULT_VALUES,
    mode: "onChange",
  });
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // API: login
  const {
    data: loginData,
    loading: submitting,
    error: submitError,
    execute: submitLogin,
  } = usePost<any, any>(AUTH_ENDPOINTS.login, API_CLIENT_TYPES.AUTH);

  /**
   * Handles validated form submission.
   * Params:
   *   - data: LoginFormValues containing loginId (emailOrPhone) and password (validated by react-hook-form)
   * Side-effects:
   *   - Sends authentication request to backend API
   *   - Navigates to OTP verification on success
   * Error handling:
   *   - Validation errors surfaced by react-hook-form via `errors`
   *   - API errors displayed via toast notifications
   */
  /**
   * Submits the login form when validation passes.
   * @param data Parsed and validated form values
   */
  const onSubmit = async (data: LoginFormValues) => {
    log("Login submit", data);

    // Note: loginId field in UI represents emailOrPhone behind the scenes
    // The request interceptor in apiConfig.ts automatically transforms
    // this legacy format (email/password/companyId) to DB format (jHeader, jMetaData, jData)
    // The backend accepts both formats, but DB format is preferred
    const apiPayload = {
      email: data.loginId.trim(), // loginId is actually emailOrPhone
      password: data.password,
      companyId: data.companyId
        ? isNaN(Number(data.companyId))
          ? data.companyId
          : Number(data.companyId)
        : undefined,
    };

    // Keep the UI in a continuous loading state for the whole auth flow
    setIsLoggingIn(true);

    try {
      await submitLogin(apiPayload);
    } catch (e) {
      const message = e instanceof Error ? e.message : errorGeneric;
      showToast(message, { variant: "error", position: "top" });
      setIsLoggingIn(false);
    }
  };

  const handleLoginSuccess = async (loginResponse: any) => {
    // Store only token temporarily, user data will be set after OTP verification
    const existingAuth = auth as any;
    await setAuth({
      ...existingAuth,
      token: loginResponse.token,
    } as any);

    // After login successful login, require OTP verification before granting access
    // Pass login response data to verify-otp screen
    router.push({
      pathname: "/(screens)/auth/verify-otp",
      params: {
        context: "login",
        loginData: JSON.stringify(loginResponse),
      },
    });
  };

  // Fetch settings when user lands on login screen
  useEffect(() => {
    // Fetch settings from backend when component mounts
    // This ensures settings are synced even if user is already logged in
    if (auth?.token) {
      log("Fetching settings on login screen - token exists");
      fetchSettings().catch((error) => {
        log("Failed to fetch settings on login screen:", error);
        // Continue with local settings if fetch fails
      });
    } else {
      log("No token found, skipping settings fetch on login screen");
    }
  }, []); // Only run once on mount

  // Log current settings state for debugging
  useEffect(() => {
    log("Login screen - Current settings state:", {
      enableFingerprint: settings.loginSettings.enableFingerprint,
      enableFaceId: settings.loginSettings.enableFaceId,
      enableFaceRecognition: settings.loginSettings.enableFaceRecognition,
      fullSettings: settings,
    });
  }, [settings]);

  // Also react to hook error state changes (defensive)
  /**
   * Reflect asynchronous submit errors via toast notifications.
   */
  useEffect(() => {
    console.log("Login data", loginData);
    if (loginData?.token) {
      // Bridge the gap between login and settings loading by
      // keeping isLoggingIn true until post-login side-effects complete
      (async () => {
        try {
          await handleLoginSuccess(loginData);
        } finally {
          setIsLoggingIn(false);
        }
      })();
    }

    if (submitError) {
      showToast(submitError, { variant: "error", position: "top" });
      setIsLoggingIn(false);
    }
  }, [submitError, loginData]);

  // Bottom sheet state & handlers
  const [forgotSheetOpen, setForgotSheetOpen] = useState<boolean>(false);
  const [biometricSheetOpen, setBiometricSheetOpen] = useState<boolean>(false);
  const [biometricTitle, setBiometricTitle] = useState<string>("");
  const [biometricDescription, setBiometricDescription] = useState<string>("");
  const [supportedTypes, setSupportedTypes] = useState<number[]>([]);
  const [successSheetOpen, setSuccessSheetOpen] = useState<boolean>(false);
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
    setForgotSheetOpen(true);
  }, []);
  /**
   * Closes the Forgot options bottom sheet.
   * No-op if the sheet is not currently presented.
   */
  /** Closes the "Forgot" bottom sheet. */
  const closeForgotSheet = useCallback(() => {
    setForgotSheetOpen(false);
  }, []);

  // Reset form to default values whenever this screen gains focus
  useFocusEffect(
    useCallback(() => {
      reset(LOGIN_DEFAULT_VALUES);
    }, [reset]),
  );

  /**
   * Opens the biometric info bottom sheet with a title and description.
   */
  const openBiometricSheet = useCallback(
    (title: string, description: string) => {
      setBiometricTitle(title);
      setBiometricDescription(description);
      setBiometricSheetOpen(true);
    },
    [],
  );

  /** Closes the biometric bottom sheet. */
  const closeBiometricSheet = useCallback(() => {
    setBiometricSheetOpen(false);
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
    if (method === "fingerprint") return biometricFingerprintTitle;
    if (method === "faceId") return biometricFaceIdTitle;
    return biometricFaceRecognitionTitle;
  };

  const getUnsupportedCopy = (method: BiometricMethod) => {
    let title: string;
    let description: string;
    if (method === "fingerprint") {
      title = biometricUnsupportedFingerprintTitle;
      description = biometricUnsupportedDescriptionDefault;
    } else if (method === "faceId") {
      title = biometricUnsupportedFaceIdTitle;
      description =
        Platform.OS === "android"
          ? biometricUnsupportedDescriptionAndroidFace
          : biometricUnsupportedDescriptionIosFace;
    } else {
      title = biometricUnsupportedFaceRecognitionTitle;
      description =
        Platform.OS === "android"
          ? biometricUnsupportedDescriptionAndroidFace
          : biometricUnsupportedDescriptionIosFace;
    }
    return { title, description };
  };

  const getNotEnabledCopy = (method: BiometricMethod) => {
    const isFace = method !== "fingerprint";
    const title = isFace
      ? biometricNotEnabledFaceTitle
      : biometricNotEnabledFingerprintTitle;
    const description = isFace
      ? biometricNotEnabledFaceDescription
      : biometricNotEnabledFingerprintDescription;
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
          promptMessage: biometricPromptMessage,
          cancelLabel: biometricPromptCancel,
          disableDeviceFallback: false,
        });
        if (result?.success) {
          // For biometric login, fetch settings after successful auth
          try {
            setIsFetchingSettings(true);
            await new Promise((resolve) => setTimeout(resolve, 500)); // Ensure token/context are settled
            await fetchSettings();
            log("Settings fetched successfully after biometric login");
          } catch (error) {
            setIsFetchingSettings(false);
            log("Failed to fetch settings after biometric login:", error);
            // Continue with local settings if fetch fails
          } finally {
            setIsFetchingSettings(false);
          }
          // Skip identity verified sheet for biometric login and go home directly
          router.replace("/(tabs)");
        }
      } catch (err) {
        const { title, description } = getNotEnabledCopy(method);
        openBiometricSheet(title, description);
      }
    },
    [openBiometricSheet],
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
        LocalAuthentication.AuthenticationType.FINGERPRINT,
      );
    }
    // Both Face ID and Face Recognition map to FACIAL_RECOGNITION at the API level
    return supportedTypes.includes(
      LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
    );
  };
  return (
    <SafeAreaView
      style={[styles.container, { paddingBottom: overlayBottomInset }]}
    >
      <Header title={pageTitle} hideBackIcon onBackPress={undefined} />

      {isFetchingSettings && (
        <View style={styles.loadingOverlay}>
          <Loader size="medium" />
          <Typography type="bodyMedium" style={styles.loadingText}>
            {loadingMessage}
          </Typography>
        </View>
      )}

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
              {introTitle}
            </Typography>
            <Typography
              type="bodyMedium"
              weight="regular"
              style={styles.textBlack}
            >
              {introDescription}
            </Typography>
          </View>

          {/* Form */}
          <View style={styles.formGroup}>
            <Controller
              control={control}
              name="companyId"
              rules={{
                required: formCompanyIdValidationRequired,
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label={formCompanyIdLabel}
                  placeholder={formCompanyIdPlaceholder}
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
              rules={{
                required: formLoginIdValidationRequired,
                validate: (value: string) => {
                  const trimmed = value.trim();
                  if (!trimmed) return formLoginIdValidationRequired;

                  // Login ID can be email or phone number
                  // Check if it's an email
                  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                  // Check if it's a phone number (basic validation - digits, may have +, spaces, dashes, parentheses)
                  const phoneRegex =
                    /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;

                  if (
                    emailRegex.test(trimmed) ||
                    phoneRegex.test(trimmed.replace(/[\s\-\(\)]/g, ""))
                  ) {
                    return true;
                  }

                  return formLoginIdValidationInvalid;
                },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label={formLoginIdLabel}
                  placeholder={formLoginIdPlaceholder}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  name="loginId"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  errors={errors as any}
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              rules={{
                required: formPasswordValidationRequired,
                minLength: {
                  value: 6,
                  message: formPasswordValidationMinLength,
                },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label={formPasswordLabel}
                  placeholder={formPasswordPlaceholder}
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
                  {forgotLink}
                </Typography>
              </TouchableOpacity>
            </View>

            <Button
              variant="primary"
              rounded="half"
              onPress={handleSubmit(onSubmit)}
              loading={isLoggingIn}
              disabled={isLoggingIn}
            >
              {isLoggingIn ? actionSigningIn : actionSign}
            </Button>
          </View>

          {/* Or divider + Auth options (only when any option is enabled) */}
          {(settings.loginSettings.enableFingerprint ||
            settings.loginSettings.enableFaceId ||
            settings.loginSettings.enableFaceRecognition) && (
            <>
              <View style={styles.orRow}>
                <View style={styles.hr} />
                <Typography
                  type="bodyMedium"
                  weight="regular"
                  style={styles.textGrey700}
                >
                  {dividerOr}
                </Typography>
                <View style={styles.hr} />
              </View>

              <View style={styles.authRow}>
                {[
                  {
                    icon: require("@/assets/images/finger-print.png"),
                    title: biometricFingerprintTitle,
                    method: "fingerprint" as BiometricMethod,
                  },
                  {
                    icon: require("@/assets/images/face-id.png"),
                    title: biometricFaceIdTitle,
                    method: "faceId" as BiometricMethod,
                  },
                  {
                    icon: require("@/assets/images/facial-recognition.png"),
                    title: biometricFaceRecognitionTitle,
                    method: "faceRecognition" as BiometricMethod,
                  },
                ]
                  .filter((option) => {
                    if (option.method === "fingerprint")
                      return settings.loginSettings.enableFingerprint;
                    if (option.method === "faceId")
                      return settings.loginSettings.enableFaceId;
                    return settings.loginSettings.enableFaceRecognition;
                  })
                  .map((option) => {
                    const supported = isMethodSupported(option.method);
                    const allowed = true; // already filtered by setting
                    const cardStyle = [
                      styles.authCard,
                      !supported ? styles.authCardDisabled : null,
                    ];
                    const iconStyle = [
                      styles.authIcon,
                      !supported ? styles.authIconDisabled : null,
                    ];
                    const textStyle = [
                      styles.authText,
                      !supported ? styles.authTextDisabled : null,
                    ];
                    const reasonText = !supported
                      ? biometricNotSupportedReason
                      : "";

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
                              option.method,
                            );
                            openBiometricSheet(title, description);
                          }
                        }}
                        disabled={isLoggingIn}
                      >
                        <Image source={option.icon} style={iconStyle as any} />
                        <Typography
                          type="labelLarge"
                          weight="semibold"
                          style={textStyle as any}
                        >
                          {option.title}
                        </Typography>
                        {reasonText ? (
                          <Typography
                            type="labelMedium"
                            weight="regular"
                            style={styles.reasonText}
                          >
                            {reasonText}
                          </Typography>
                        ) : null}
                      </TouchableOpacity>
                    );
                  })}
              </View>
            </>
          )}

          {/* Footer */}
          <View style={styles.centeredRow}>
            <Typography
              type="bodyMedium"
              weight="regular"
              style={styles.textBlack}
            >
              {footerNoAccount}
            </Typography>
          </View>

          <Button
            variant="primary"
            rounded="half"
            disabled={isLoggingIn}
            onPress={() =>
              router.push({
                pathname: "/(screens)/in-app-webview",
                params: {
                  url: `${driverWebAppProdUrl}?token=${auth?.token}`,
                  title: inAppWebviewRequestRegistrationTitle,
                },
              })
            }
          >
            {actionRequestRegistration}
          </Button>

          <View style={styles.centeredRow}>
            <Typography
              type="labelMedium"
              weight="regular"
              style={styles.versionText}
            >
              Version: {appVersion}
            </Typography>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Forgot Bottom Sheet */}
      <BottomSheet
        open={forgotSheetOpen}
        onClose={closeForgotSheet}
        snapPoints={[250]}
        headerTitle={forgotSheetHeaderTitle}
      >
        <View style={styles.sheetContainer}>
          {[
            {
              label: forgotSheetOptionPassword,
              onPress: () => {
                closeForgotSheet();
                router.push("/(screens)/auth/forgot-password" as any);
              },
            },
            {
              label: forgotSheetOptionUserId,
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
                disabled={isLoggingIn}
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
      </BottomSheet>

      {/* Biometric Permission Bottom Sheet */}
      <BottomSheet
        headerTitle={biometricTitle}
        open={biometricSheetOpen}
        onClose={closeBiometricSheet}
        snapPoints={[250]}
      >
        <View style={styles.sheetContainer}>
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
            disabled={isLoggingIn}
          >
            {biometricSheetButtonOpenSettings}
          </Button>
        </View>
      </BottomSheet>

      {/* Success Bottom Sheet (non-dismissible) */}
      <BottomSheet
        open={successSheetOpen}
        onClose={() => {}}
        snapPoints={["50%"]}
        showHeader={false}
      >
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
            {successSheetTitle}
          </Typography>

          <Typography
            type="bodyLarge"
            weight="regular"
            style={styles.successDescription}
          >
            {successSheetWelcomePrefix} {successSheetWelcomeSuffix}
          </Typography>
          <Typography
            type="bodyLarge"
            weight="regular"
            style={styles.successDescription}
          >
            {successSheetDescriptionCommunity}
          </Typography>
          <Typography
            type="bodyLarge"
            weight="regular"
            style={styles.successDescription}
          >
            {successSheetDescriptionJourney}
          </Typography>

          <Button
            variant="primary"
            rounded="half"
            onPress={() => {
              setSuccessSheetOpen(false);
              router.replace("/(tabs)");
            }}
          >
            {successSheetButtonContinue}
          </Button>
        </View>
      </BottomSheet>
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
  reasonText: {
    color: textColors.grey700,
    marginTop: 4,
  },
  sheetContainer: {
    paddingTop: 12,
    backgroundColor: textColors.white,
    gap: 12,
  },
  bottomSheetContainer: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
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
  versionText: {
    color: textColors.grey700,
  },
});
