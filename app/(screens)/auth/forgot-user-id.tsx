import React from "react";
import { Controller, useForm } from "react-hook-form";
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import Button from "@/components/Button";
import Input from "@/components/Form/Input";
import Header from "@/components/Header";
import Logo from "@/components/Logo";
import { showToast } from "@/components/Toast";
import Typography from "@/components/Typography";
import { textColors } from "@/constants/colors";
import { AUTH_ENDPOINTS } from "@/constants/endpoints";
import { usePost } from "@/hooks/usePost";
import { useRouter } from "expo-router";

type ForgotUserIdFormValues = {
  companyId: string;
  email: string;
  phone: string;
};

/**
 * Renders the Forgot User ID screen.
 * - Collects Company ID, Email, and Phone
 * - Requests an OTP via API
 * - Navigates to Verify OTP on success
 */
export default function ForgotUserIdScreen() {
  const router = useRouter();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotUserIdFormValues>({
    defaultValues: { companyId: "", email: "", phone: "" },
    mode: "onChange",
  });

  const { execute: requestOtp, loading } = usePost<any, ForgotUserIdFormValues>(
    AUTH_ENDPOINTS.requestOtp
  );

  /**
   * Sends an OTP to the user for recovering their User ID.
   * @param data Company ID, Email, and Phone values
   */
  const onSubmit = async (data: ForgotUserIdFormValues) => {
    try {
      await requestOtp(data);
      showToast("OTP sent successfully", {
        variant: "success",
        position: "top",
      });
      router.push({
        pathname: "/(screens)/auth/verify-otp",
        params: { context: "forgot-user-id" },
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to send OTP";
      showToast(message, { variant: "error", position: "top" });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Forgot User Id" onBackPress={() => router.back()} />

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
              Verify Your Identity
            </Typography>
            <Typography
              type="bodyMedium"
              weight="regular"
              style={styles.textBlack}
            >
              Enter your Company ID, Email and phone to receive a one-time
              password (OTP) for resetting your password.
            </Typography>
          </View>

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
              name="email"
              rules={{
                required: "Email is required.",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Enter a valid email.",
                },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Email"
                  placeholder="Enter your email"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  inputType="email"
                  name="email"
                  errors={errors as any}
                  autoCapitalize="none"
                />
              )}
            />

            <Controller
              control={control}
              name="phone"
              rules={{
                required: "Phone is required.",
                minLength: { value: 7, message: "Enter a valid phone." },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Phone"
                  placeholder="Enter your phone"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  inputType="number"
                  name="phone"
                  errors={errors as any}
                />
              )}
            />

            <Button
              variant="primary"
              rounded="half"
              onPress={handleSubmit(onSubmit)}
              loading={loading}
              disabled={loading}
            >
              Send OTP
            </Button>
          </View>
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
  formGroup: {
    gap: 12,
  },
  textBlack: {
    color: textColors.black,
  },
});
