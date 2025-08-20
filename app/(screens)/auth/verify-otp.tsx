import React, { useEffect, useMemo, useRef, useState } from "react";
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

import Button from "@/components/Button";
import Header from "@/components/Header";
import Logo from "@/components/Logo";
import { showToast } from "@/components/Toast";
import Typography from "@/components/Typography";
import { textColors } from "@/constants/colors";
import { AUTH_ENDPOINTS } from "@/constants/endpoints";
import { OTP_LENGTH, OTP_RESEND_SECONDS } from "@/constants/global";
import { usePost } from "@/hooks/usePost";
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
  const { context } = useLocalSearchParams<{ context?: string }>();
  const [otp, setOtp] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [verified, setVerified] = useState<boolean>(false);
  const [secondsLeft, setSecondsLeft] = useState<number>(OTP_RESEND_SECONDS);
  const inputRef = useRef<TextInput>(null);
  const caretOpacity = useRef(new Animated.Value(1)).current;
  const caretAnimRef = useRef<Animated.CompositeAnimation | null>(null);
  const [isFocused, setIsFocused] = useState<boolean>(true);

  const { execute: verifyOtp, loading: verifying } = usePost<
    any,
    { otp: string }
  >(AUTH_ENDPOINTS.verifyOtp);
  const { execute: resendOtp, loading: resending } = usePost<any, {}>(
    AUTH_ENDPOINTS.requestOtp
  );

  const disabled = verifying || resending;

  // Start countdown
  /** Countdown timer for the resend link. */
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

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
      await verifyOtp({ otp });
      showToast("OTP verified", { variant: "success", position: "top" });
      setVerified(true);
      // Success style briefly then navigate
      setTimeout(() => {
        if (context === "forgot-user-id") {
          showToast(
            "Success! We've reset your User ID and sent the new one to your email. Use it to log in next time.",
            { variant: "success", position: "top" }
          );
          router.replace("/(screens)/auth/login");
        } else {
          router.replace("/(screens)/auth/reset-password");
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
      await resendOtp({});
      showToast("OTP resent", { variant: "success", position: "top" });
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

          {/* Optional explicit Verify button for accessibility */}
          <Button
            variant="primary"
            rounded="half"
            onPress={handleVerify}
            loading={verifying}
            disabled={disabled || otp.length !== OTP_LENGTH}
          >
            Verify
          </Button>
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
    textDecorationLine: "underline",
  },
  caret: {
    width: 2,
    height: 24,
    backgroundColor: textColors.black,
  },
});
