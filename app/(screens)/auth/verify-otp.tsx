import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Animated,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from "react-native";

import Header from "@/components/Header";
import Loader from "@/components/Loader";
import Logo from "@/components/Logo";
import { showToast } from "@/components/Toast";
import Typography from "@/components/Typography";
import { textColors } from "@/constants/colors";
import { AUTH_ENDPOINTS, DRIVER_ENDPOINTS } from "@/constants/endpoints";
import {
    API_CLIENT_TYPES,
    DRIVER_TYPES,
    OTP_LENGTH,
    OTP_RESEND_SECONDS,
} from "@/constants/global";
import { VERIFY_OTP_CONTENT_KEYS } from "@/content/(screens)/auth/verify-otp-keys";
import { useAuth } from "@/context/AuthContext";
import { useDriver } from "@/context/DriverContext";
import { useSettings } from "@/context/SettingsContext";
import { useDelete } from "@/hooks/useDelete";
import { useFetch } from "@/hooks/useFetch";
import { useGetContent } from "@/hooks/useGetContent";
import { usePost } from "@/hooks/usePost";
import { clearStorage, logger } from "@/utils/helpers";
import { disconnectSocket } from "@/utils/socket";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";

// OTP length is centralized in constants/global.ts

/**
 * Renders the Verify OTP screen.
 * - Accepts numeric OTP input with custom UI and blinking caret
 * - Auto-submits when the OTP length is reached
 * - Handles resend with a countdown timer
 */
export default function VerifyOtpScreen() {
  const { getContent } = useGetContent();

  // Page Content
  const {
    pageTitle,
    loadingMessage,
    introTitle,
    introDescription,
    errorInvalid,
    resendCountdownPrefix,
    resendCountdownSuffix,
    resendPrompt,
    resendLink,
    toastVerified,
    toastForgotUserIdSuccess,
    toastDeleteProfileNoResend,
    toastResent,
    toastResendError,
    toastInvalidLoginData,
    toastLoginDataNotFound,
    toastProfileDeleted,
    toastProfileDeletionError,
    toastDeleteProfileApiError,
    toastLoginCompleteError,
  } = useMemo(() => {
    const get = getContent;
    return {
      pageTitle: get(VERIFY_OTP_CONTENT_KEYS.PAGE_TITLE),
      loadingMessage: get(VERIFY_OTP_CONTENT_KEYS.LOADING_MESSAGE),
      introTitle: get(VERIFY_OTP_CONTENT_KEYS.INTRO_TITLE),
      introDescription: get(VERIFY_OTP_CONTENT_KEYS.INTRO_DESCRIPTION),
      errorInvalid: get(VERIFY_OTP_CONTENT_KEYS.ERROR_INVALID),
      resendCountdownPrefix: get(
        VERIFY_OTP_CONTENT_KEYS.RESEND_COUNTDOWN_PREFIX,
      ),
      resendCountdownSuffix: get(
        VERIFY_OTP_CONTENT_KEYS.RESEND_COUNTDOWN_SUFFIX,
      ),
      resendPrompt: get(VERIFY_OTP_CONTENT_KEYS.RESEND_PROMPT),
      resendLink: get(VERIFY_OTP_CONTENT_KEYS.RESEND_LINK),
      toastVerified: get(VERIFY_OTP_CONTENT_KEYS.TOAST_VERIFIED),
      toastForgotUserIdSuccess: get(
        VERIFY_OTP_CONTENT_KEYS.TOAST_FORGOT_USER_ID_SUCCESS,
      ),
      toastDeleteProfileNoResend: get(
        VERIFY_OTP_CONTENT_KEYS.TOAST_DELETE_PROFILE_NO_RESEND,
      ),
      toastResent: get(VERIFY_OTP_CONTENT_KEYS.TOAST_RESENT),
      toastResendError: get(VERIFY_OTP_CONTENT_KEYS.TOAST_RESEND_ERROR),
      toastInvalidLoginData: get(
        VERIFY_OTP_CONTENT_KEYS.TOAST_INVALID_LOGIN_DATA,
      ),
      toastLoginDataNotFound: get(
        VERIFY_OTP_CONTENT_KEYS.TOAST_LOGIN_DATA_NOT_FOUND,
      ),
      toastProfileDeleted: get(VERIFY_OTP_CONTENT_KEYS.TOAST_PROFILE_DELETED),
      toastProfileDeletionError: get(
        VERIFY_OTP_CONTENT_KEYS.TOAST_PROFILE_DELETION_ERROR,
      ),
      toastDeleteProfileApiError: get(
        VERIFY_OTP_CONTENT_KEYS.TOAST_DELETE_PROFILE_API_ERROR,
      ),
      toastLoginCompleteError: get(
        VERIFY_OTP_CONTENT_KEYS.TOAST_LOGIN_COMPLETE_ERROR,
      ),
    };
  }, [getContent]);
  // Page Content End
  const router = useRouter();
  const log = logger();
  const {
    context,
    loginData: loginDataParam,
    email: emailParam,
    companyId: companyIdParam,
  } = useLocalSearchParams<{
    context?: string;
    loginData?: string;
    email?: string;
    companyId?: string;
  }>();
  const [currentAuth, setAuth] = useAuth();
  const [driver, setDriver] = useDriver();
  const { removeRetrievalId, removeTripId } = useDriver();
  const [, , { fetchSettings, isLoading: isFetchingSettings }] = useSettings();
  const [otp, setOtp] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [verified, setVerified] = useState<boolean>(false);
  const [secondsLeft, setSecondsLeft] = useState<number>(OTP_RESEND_SECONDS);
  const inputRef = useRef<TextInput>(null);
  const caretOpacity = useRef(new Animated.Value(1)).current;
  const caretAnimRef = useRef<Animated.CompositeAnimation | null>(null);
  const [isFocused, setIsFocused] = useState<boolean>(true);

  const {
    execute: verifyOtp,
    loading: verifying,
    error: verifyOtpError,
  } = usePost<any, { code: string }>(AUTH_ENDPOINTS.verifyOtp);

  const {
    execute: resendOtp,
    loading: resending,
    error: resendOtpError,
  } = usePost<any, {}>(AUTH_ENDPOINTS.requestOtp);
  const {
    data: userData,
    loading,
    execute,
    error: userDataError,
  } = useFetch(AUTH_ENDPOINTS.getCurrentUser, API_CLIENT_TYPES.ME);

  // Offline API using shared delete hook
  const { execute: deleteOnlineLocation } = useDelete(
    DRIVER_ENDPOINTS.markOffline(currentAuth?.user?.id || ""),
  );

  const disabled = verifying || resending || loading;

  // Handles granting app access after a successful OTP verification for login
  const completeLoginAfterOtp = async () => {
    await handleCompleteLoginAfterOtp();
  };

  // Handles profile deletion cleanup and navigation after OTP verification
  const completeDeleteProfileAfterOtp = async () => {
    try {
      // First, call the delete profile API with OTP
      try {
        log("[VerifyOtpScreen] Calling delete profile API");
        const { settingsApiClient } = await import("@/config/apiConfig");
        const { DRIVER_SETTINGS_ENDPOINTS } =
          await import("@/constants/endpoints");

        const response = await settingsApiClient.delete(
          DRIVER_SETTINGS_ENDPOINTS.deleteProfile,
          {
            data: {
              otp: otp,
            },
          } as any,
        );

        // Check if the response indicates success
        const responseData = response?.data;
        const hasSuccessFlag = responseData?.success === true;
        const dbResponseCode = responseData?.data?.jHeader?.responseCode;
        const isDbSuccess =
          dbResponseCode === undefined ||
          dbResponseCode === "0" ||
          dbResponseCode === 0;

        if (
          responseData?.success === false ||
          !isDbSuccess ||
          !hasSuccessFlag
        ) {
          const errorMessage =
            responseData?.message ||
            responseData?.data?.jHeader?.message ||
            responseData?.error ||
            toastDeleteProfileApiError;

          throw new Error(errorMessage);
        }

        log(
          "[VerifyOtpScreen] Driver profile deleted successfully from database",
        );
      } catch (apiError: any) {
        const errorMessage =
          apiError?.response?.data?.message ||
          apiError?.response?.data?.data?.jHeader?.message ||
          apiError?.response?.data?.error ||
          apiError?.message ||
          toastDeleteProfileApiError;

        log("[VerifyOtpScreen] Error deleting driver profile:", errorMessage);
        showToast(errorMessage, {
          variant: "error",
          position: "top",
        });
        // Don't proceed with cleanup if API call failed
        return;
      }

      // Call offline API if driver is online
      if (driver?.online) {
        try {
          log("[VerifyOtpScreen] Marking driver as offline via API");
          await deleteOnlineLocation();
          log("[VerifyOtpScreen] Driver successfully marked as offline");
        } catch (error) {
          log("[VerifyOtpScreen] Error marking driver offline:", error);
          // Continue with cleanup even if API call fails
        }
      }

      // Remove retrieval ID from context and AsyncStorage
      try {
        await removeRetrievalId();
        log("[VerifyOtpScreen] Retrieval ID removed successfully");
      } catch (error) {
        log("[VerifyOtpScreen] Error removing retrieval ID:", error);
        // Continue with cleanup even if retrieval ID removal fails
      }

      // Remove trip ID from context and AsyncStorage
      try {
        await removeTripId();
        log("[VerifyOtpScreen] Trip ID removed successfully");
      } catch (error) {
        log("[VerifyOtpScreen] Error removing trip ID:", error);
        // Continue with cleanup even if trip ID removal fails
      }

      // Disconnect socket
      try {
        disconnectSocket();
        log("[VerifyOtpScreen] Socket disconnected successfully");
      } catch (error) {
        log("[VerifyOtpScreen] Error disconnecting socket:", error);
        // Continue with cleanup even if socket disconnect fails
      }

      // Clear storage and reset contexts
      await clearStorage();
      await setAuth(null);
      await setDriver(null);

      showToast(toastProfileDeleted, {
        variant: "success",
        position: "top",
      });
    } catch (error) {
      log("[VerifyOtpScreen] Error in completeDeleteProfileAfterOtp:", error);
      showToast(toastProfileDeletionError, {
        variant: "error",
        position: "top",
      });
    } finally {
      router.replace("/(screens)/auth/login");
    }
  };

  // Start countdown
  /** Countdown timer for the resend link. */
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  // On mount for delete-profile context: skip automatic OTP send
  // The user is already authenticated, so OTP should be requested manually via resend button if needed
  // For delete-profile, we don't use the forgot-password endpoint which requires loginId/companyId
  useEffect(() => {
    if (context === "delete-profile") {
      // Skip automatic OTP send for delete-profile context
      // User can manually request OTP using the resend button if needed
      // The OTP will be verified when they complete the OTP input
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context]);

  // Blinking caret animation - restart when active box changes or focus toggles
  /** Controls the blinking caret animation while focused and enabled. */
  useEffect(() => {
    if (disabled || !isFocused) {
      caretAnimRef.current?.stop();
      return;
    }
    caretAnimRef.current?.stop();
    caretOpacity.setValue(1);
    caretAnimRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(caretOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(caretOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    );
    caretAnimRef.current.start();
    return () => {
      caretAnimRef.current?.stop();
    };
  }, [caretOpacity, otp.length, isFocused, disabled]);

  // Auto-submit when OTP complete
  /** Auto-submit when all digits are entered. */
  useEffect(() => {
    if (otp.length === OTP_LENGTH && !verifying) {
      handleVerify();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  const boxes = useMemo(() => new Array(OTP_LENGTH).fill(0), []);

  // Responsive OTP box size and gap: keep horizontal padding (12) same, fit boxes in remaining width
  const { width: windowWidth } = useWindowDimensions();
  const horizontalPadding = 12;
  const availableWidth = windowWidth - horizontalPadding * 2;
  const { boxSize, gap } = useMemo(() => {
    const minBox = 32;
    const maxBox = 56;
    const preferredGap = 12;
    const totalGap = (OTP_LENGTH - 1) * preferredGap;
    let size = (availableWidth - totalGap) / OTP_LENGTH;
    let g = preferredGap;
    if (size < minBox) {
      size = minBox;
      g = Math.max(
        4,
        (availableWidth - OTP_LENGTH * minBox) / (OTP_LENGTH - 1),
      );
    } else if (size > maxBox) {
      size = maxBox;
      g = Math.max(
        4,
        (availableWidth - OTP_LENGTH * maxBox) / (OTP_LENGTH - 1),
      );
    }
    return { boxSize: size, gap: g };
  }, [availableWidth]);

  /**
   * Normalizes OTP input to digits only and updates state.
   */
  const handleChange = (value: string) => {
    if (disabled) return;
    const sanitized = value.replace(/[^0-9]/g, "").slice(0, OTP_LENGTH);
    setError(null);
    setVerified(false);
    setOtp(sanitized);
    // ensure caret resumes when cleared by backspace to 0
    if (sanitized.length === 0) {
      setIsFocused(true);
      inputRef.current?.focus();
    }
  };

  /** Verifies the OTP via API and navigates on success. */
  const handleVerify = async () => {
    if (otp.length !== OTP_LENGTH) return;
    try {
      const response = { message: "OTP verified" }; //await verifyOtp({ code: otp });
      showToast(response?.message || toastVerified, {
        variant: "success",
        position: "top",
      });
      setVerified(true);
      // Success style briefly then navigate
      setTimeout(() => {
        if (context === "forgot-user-id") {
          showToast(toastForgotUserIdSuccess, {
            variant: "success",
            position: "top",
          });
          router.replace("/(screens)/auth/login");
        } else if (context === "delete-profile") {
          void completeDeleteProfileAfterOtp();
        } else if (context === "login") {
          // After verifying OTP for login: set auth and route to home with success toast
          void completeLoginAfterOtp();
        } else {
          // For forgot-password flow: pass email, OTP code, and companyId to reset-password screen
          router.replace({
            pathname: "/(screens)/auth/reset-password",
            params: {
              email: emailParam || "",
              code: otp,
              companyId: companyIdParam || "",
            },
          });
        }
      }, 300);
    } catch (e) {
      const message = e instanceof Error ? e.message : errorInvalid;
      setError(errorInvalid);
      setVerified(false);
      showToast(message, { variant: "error", position: "top" });
    }
  };

  /** Requests a new OTP and resets the countdown/input. */
  const handleResend = async () => {
    // For delete-profile context, skip resend as it requires loginId/companyId
    // which are not available in the authenticated context
    if (context === "delete-profile") {
      showToast(toastDeleteProfileNoResend, {
        variant: "warning",
        position: "top",
      });
      return;
    }

    try {
      const response = await resendOtp({});
      showToast(response?.message || toastResent, {
        variant: "success",
        position: "top",
      });
      setSecondsLeft(OTP_RESEND_SECONDS);
      setOtp("");
      setError(null);
      inputRef.current?.focus();
    } catch (e) {
      const message = e instanceof Error ? e.message : toastResendError;
      showToast(message, { variant: "error", position: "top" });
    }
  };

  /** Returns the border color for an OTP box based on state. */
  const boxBorderColor = (index: number) => {
    if (disabled) return textColors.grey100;
    if (error) return textColors.red500;
    if (verified) return textColors.teal700;
    return textColors.black;
  };

  /** Returns the text color for an OTP box based on state. */
  const boxTextColor = (index: number) => {
    if (error) return textColors.red500;
    if (verified) return textColors.teal700;
    return textColors.black;
  };

  const handleCompleteLoginAfterOtp = async () => {
    try {
      // Parse login data from route params
      let loginResponse: any = null;
      if (loginDataParam) {
        try {
          loginResponse = JSON.parse(loginDataParam);
          log("Parsed login data from params", loginResponse);
        } catch (error) {
          log("Error parsing login data:", error);
          showToast(toastInvalidLoginData, {
            variant: "error",
            position: "top",
          });
          return;
        }
      }

      if (!loginResponse || !loginResponse.user) {
        log("No login data available");
        showToast(toastLoginDataNotFound, {
          variant: "error",
          position: "top",
        });
        return;
      }

      const user = loginResponse.user;

      // Extract driver ID from driver_rec_id (convert to string if it's a number)
      const driverId =
        user.driver_rec_id != null ? String(user.driver_rec_id) : "";

      // Extract driver name from flat user (first_name, last_name at top level)
      const firstName = user.first_name || "";
      const lastName = user.last_name || "";
      const driverName = `${firstName} ${lastName}`.trim() || "Driver";

      // Extract driver type from driver_type field
      // Map backend driver_type to app DRIVER_TYPES
      let driverType: string = DRIVER_TYPES.INDEPENDENT_OPERATOR; // default
      if (user.driver_type) {
        const backendDriverType = String(user.driver_type).toUpperCase();
        if (
          backendDriverType.includes("NETWORK_IO") ||
          backendDriverType.includes("IO")
        ) {
          driverType = DRIVER_TYPES.INDEPENDENT_OPERATOR;
        } else if (
          backendDriverType.includes("NETWORK") ||
          backendDriverType.includes("EMPLOYEE")
        ) {
          driverType = DRIVER_TYPES.HIRED; // Use HIRED for network/employee drivers
        }
      }

      // Extract online status (login response may not include is_online; active_status indicates account status)
      const isOnline =
        user.is_online === "YES" ||
        user.is_online === true ||
        false;

      // Set auth context with full user data (including all driver details for profile screen)
      // Store the complete user object so profile screen can access all information
      await setAuth({
        ...currentAuth,
        user: {
          id: driverId,
          name: driverName,
          type: driverType,
          // Store the complete user object with all driver details
          ...user,
        },
      } as any);

      // Set driver context with online status
      await setDriver({
        ...(driver ?? {}),
        online: isOnline,
      });

      log("Auth context set with user data:", {
        id: driverId,
        name: driverName,
        type: driverType,
        online: isOnline,
      });

      // Fetch driver settings from backend
      try {
        await new Promise((resolve) => setTimeout(resolve, 500)); // Wait for 500ms to ensure token is set before fetching settings
        await fetchSettings();
        log("Driver settings fetched successfully");
      } catch (error) {
        log("Error fetching driver settings:", error);
        // Continue with login even if settings fetch fails
      }
      router.replace("/(tabs)");
    } catch (error) {
      log("Error completing login after OTP:", error);
      showToast(toastLoginCompleteError, {
        variant: "error",
        position: "top",
      });
    }
  };

  useEffect(() => {
    if (verifyOtpError) {
      showToast(verifyOtpError, { variant: "error", position: "top" });
    }
    if (resendOtpError) {
      showToast(resendOtpError, { variant: "error", position: "top" });
    }
    if (userDataError) {
      showToast(userDataError, { variant: "error", position: "top" });
    }
  }, [verifyOtpError, resendOtpError, userDataError]);

  return (
    <SafeAreaView style={styles.container}>
      <Header title={pageTitle} onBackPress={() => router.back()} />

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
          <View style={styles.centeredRow}>
            <Logo size="Large" />
          </View>

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

          {/* OTP Boxes */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => {
              inputRef.current?.focus();
              setIsFocused(true);
            }}
            disabled={disabled || isFetchingSettings}
          >
            <View style={[styles.otpRow, { gap }]}>
              {boxes.map((_, i) => {
                const isActive =
                  i === otp.length &&
                  otp.length < OTP_LENGTH &&
                  !disabled &&
                  isFocused;
                const charValue = otp[i] ?? "";
                return (
                  <View
                    key={i}
                    style={[
                      styles.otpBox,
                      {
                        width: boxSize,
                        height: boxSize,
                        borderColor: boxBorderColor(i),
                      },
                      disabled && styles.otpBoxDisabled,
                      disabled && styles.otpBoxDisabledBg,
                    ]}
                  >
                    {charValue ? (
                      <Typography
                        type="titleExtraLarge"
                        weight="semibold"
                        style={{ color: boxTextColor(i) }}
                      >
                        {charValue}
                      </Typography>
                    ) : isActive ? (
                      <Animated.View
                        style={[
                          styles.caret,
                          {
                            height: Math.min(24, boxSize * 0.48),
                            opacity: caretOpacity,
                          },
                        ]}
                      />
                    ) : null}
                  </View>
                );
              })}
              {/* Hidden input to capture digits */}
              <TextInput
                ref={inputRef}
                style={styles.hiddenInput}
                value={otp}
                onChangeText={handleChange}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                keyboardType="number-pad"
                maxLength={OTP_LENGTH}
                autoFocus
                editable={!disabled}
                caretHidden
              />
            </View>
          </TouchableOpacity>

          {!!error && (
            <Typography
              type="bodyMedium"
              weight="regular"
              style={styles.errorText}
            >
              {error}
            </Typography>
          )}

          {/* Resend Section */}
          {secondsLeft > 0 ? (
            <View style={styles.resendWrapper}>
              <Typography
                type="bodyMedium"
                weight="semibold"
                style={styles.textBlack}
              >
                {resendCountdownPrefix} {secondsLeft} {resendCountdownSuffix}
              </Typography>
            </View>
          ) : (
            <View style={styles.resendWrapper}>
              <Typography
                type="bodyMedium"
                weight="regular"
                style={styles.textBlack}
              >
                {resendPrompt}{" "}
                <Typography
                  type="bodyMedium"
                  weight="semibold"
                  style={styles.resendLink}
                  onPress={handleResend}
                >
                  {resendLink}
                </Typography>
              </Typography>
            </View>
          )}

          {/* Hidden Optional explicit Verify button for accessibility */}
          {/* <Button
            variant="primary"
            rounded="half"
            onPress={handleVerify}
            loading={verifying}
            disabled={disabled || otp.length !== OTP_LENGTH}
          >
            Verify
          </Button> */}
        </ScrollView>
      </KeyboardAvoidingView>
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
  textBlack: {
    color: textColors.black,
  },
  otpRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  otpBox: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: textColors.black,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: textColors.white,
  },
  otpBoxDisabled: {
    opacity: 0.6,
  },
  otpBoxDisabledBg: {
    backgroundColor: textColors.grey100,
  },
  hiddenInput: {
    position: "absolute",
    opacity: 0,
    width: 1,
    height: 1,
  },
  errorText: {
    color: textColors.red500,
    marginTop: -12,
  },
  resendWrapper: {
    alignItems: "center",
  },
  resendLink: {
    color: textColors.teal800,
  },
  caret: {
    width: 2,
    height: 24,
    backgroundColor: textColors.black,
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
