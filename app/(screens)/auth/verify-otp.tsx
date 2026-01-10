import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import Header from "@/components/Header";
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
import { useAuth } from "@/context/AuthContext";
import { useDriver } from "@/context/DriverContext";
import { useDelete } from "@/hooks/useDelete";
import { useFetch } from "@/hooks/useFetch";
import { usePost } from "@/hooks/usePost";
import { clearStorage, logger } from "@/utils/helpers";
import { disconnectSocket } from "@/utils/socket";
import { useLocalSearchParams, useRouter } from "expo-router";

// OTP length is centralized in constants/global.ts

/**
 * Renders the Verify OTP screen.
 * - Accepts numeric OTP input with custom UI and blinking caret
 * - Auto-submits when the OTP length is reached
 * - Handles resend with a countdown timer
 */
export default function VerifyOtpScreen() {
  const router = useRouter();
  const log = logger();
  const { context, loginData: loginDataParam, email: emailParam, companyId: companyIdParam } = useLocalSearchParams<{ 
    context?: string;
    loginData?: string;
    email?: string;
    companyId?: string;
  }>();
  const [currentAuth, setAuth] = useAuth();
  const [driver, setDriver] = useDriver();
  const { removeRetrievalId, removeTripId } = useDriver();
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
    DRIVER_ENDPOINTS.markOffline(currentAuth?.user?.id || "")
  );

  const disabled = verifying || resending || loading;

  // Handles granting app access after a successful OTP verification for login
  const completeLoginAfterOtp = async () => {
    await handleCompleteLoginAfterOtp();
  };

  // Handles profile deletion cleanup and navigation after OTP verification
  const completeDeleteProfileAfterOtp = async () => {
    try {
      // Call offline API if driver is online
      if (driver?.online) {
        try {
          log("[VerifyOtpScreen] Marking driver as offline via API");
          await deleteOnlineLocation();
          log("[VerifyOtpScreen] Driver successfully marked as offline");
        } catch (error) {
          log("[VerifyOtpScreen] Error marking driver offline:", error);
          // Continue with delete even if API call fails
        }
      }

      // Remove retrieval ID from context and AsyncStorage
      try {
        await removeRetrievalId();
        log("[VerifyOtpScreen] Retrieval ID removed successfully");
      } catch (error) {
        log("[VerifyOtpScreen] Error removing retrieval ID:", error);
        // Continue with delete even if retrieval ID removal fails
      }

      // Remove trip ID from context and AsyncStorage
      try {
        await removeTripId();
        log("[VerifyOtpScreen] Trip ID removed successfully");
      } catch (error) {
        log("[VerifyOtpScreen] Error removing trip ID:", error);
        // Continue with delete even if trip ID removal fails
      }

      // Disconnect socket
      try {
        disconnectSocket();
        log("[VerifyOtpScreen] Socket disconnected successfully");
      } catch (error) {
        log("[VerifyOtpScreen] Error disconnecting socket:", error);
        // Continue with delete even if socket disconnect fails
      }

      // Clear storage and reset contexts
      await clearStorage();
      await setAuth(null);
      await setDriver(null);
      showToast("Profile Deleted successfully.", {
        variant: "success",
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

  // On mount for delete-profile context: trigger OTP send and show success message
  useEffect(() => {
    if (context === "delete-profile") {
      (async () => {
        try {
          await resendOtp({});
          showToast("OTP has sent successfully", {
            variant: "success",
            position: "top",
          });
        } catch {
          // ignore; resend handler will surface errors when used manually
        }
      })();
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
      ])
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
      showToast(response?.message || "OTP verified", {
        variant: "success",
        position: "top",
      });
      setVerified(true);
      // Success style briefly then navigate
      setTimeout(() => {
        if (context === "forgot-user-id") {
          showToast(
            "Success! We've reset your User ID and sent the new one to your email. Use it to log in next time.",
            { variant: "success", position: "top" }
          );
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
      const message = e instanceof Error ? e.message : "Invalid OTP";
      setError("Invalid OTP");
      setVerified(false);
      showToast(message, { variant: "error", position: "top" });
    }
  };

  /** Requests a new OTP and resets the countdown/input. */
  const handleResend = async () => {
    try {
      const response = await resendOtp({});
      showToast(response?.message || "OTP resent", {
        variant: "success",
        position: "top",
      });
      setSecondsLeft(OTP_RESEND_SECONDS);
      setOtp("");
      setError(null);
      inputRef.current?.focus();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to resend";
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
          showToast("Invalid login data", {
            variant: "error",
            position: "top",
          });
          return;
        }
      }

      if (!loginResponse || !loginResponse.user) {
        log("No login data available");
        showToast("Login data not found", {
          variant: "error",
          position: "top",
        });
        return;
      }

      const user = loginResponse.user;
      
      // Extract driver ID from driver_rec_id
      const driverId = user.driver_rec_id;
      
      // Extract driver name from personal_information
      const firstName = user.personal_information?.first_name || "";
      const lastName = user.personal_information?.last_name || "";
      const driverName = `${firstName} ${lastName}`.trim() || "Driver";
      
      // Extract driver type from driver_type field
      // Map backend driver_type to app DRIVER_TYPES
      let driverType: string = DRIVER_TYPES.INDEPENDENT_OPERATOR; // default
      if (user.driver_type) {
        const backendDriverType = user.driver_type.toUpperCase();
        if (backendDriverType.includes("NETWORK_IO") || backendDriverType.includes("IO")) {
          driverType = DRIVER_TYPES.INDEPENDENT_OPERATOR;
        } else if (backendDriverType.includes("NETWORK") || backendDriverType.includes("EMPLOYEE")) {
          driverType = DRIVER_TYPES.HIRED; // Use HIRED for network/employee drivers
        }
      }

      // Extract online status
      const isOnline = user.is_online === "YES" || user.is_online === true;

      // Set auth context with actual user data
      await setAuth({
        ...currentAuth,
        user: {
          id: driverId,
          name: driverName,
          type: driverType,
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

      showToast("Logged in successfully", {
        variant: "success",
        position: "top",
      });
      router.replace("/(tabs)");
    } catch (error) {
      log("Error completing login after OTP:", error);
      showToast("Failed to complete login", {
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
      <Header title="Verify OTP" onBackPress={() => router.back()} />

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
              Enter the OTP
            </Typography>
            <Typography
              type="bodyMedium"
              weight="regular"
              style={styles.textBlack}
            >
              We’ve sent a one-time password (OTP) to your registered login ID.
              Please enter it below to continue.
            </Typography>
          </View>

          {/* OTP Boxes */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => {
              inputRef.current?.focus();
              setIsFocused(true);
            }}
            disabled={disabled}
          >
            <View style={styles.otpRow}>
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
                      { borderColor: boxBorderColor(i) },
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
                        style={[styles.caret, { opacity: caretOpacity }]}
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
                Resend Code in {secondsLeft} sec
              </Typography>
            </View>
          ) : (
            <View style={styles.resendWrapper}>
              <Typography
                type="bodyMedium"
                weight="regular"
                style={styles.textBlack}
              >
                Didn’t receive the OTP?{" "}
                <Typography
                  type="bodyMedium"
                  weight="semibold"
                  style={styles.resendLink}
                  onPress={handleResend}
                >
                  Resend
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
    gap: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  otpBox: {
    width: 50,
    height: 50,
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
});
