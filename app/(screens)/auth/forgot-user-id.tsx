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
import { API_CLIENT_TYPES } from "@/constants/global";
import { FORGOT_USER_ID_CONTENT_KEYS } from "@/content/(screens)/auth/forgot-user-id-keys";
import { useGetContent } from "@/hooks/useGetContent";
import { usePost } from "@/hooks/usePost";
import { useRouter } from "expo-router";
import { useMemo } from "react";

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
  const { getContent } = useGetContent();

  // Page Content
  const {
    pageTitle,
    introTitle,
    introDescription,
    formCompanyIdLabel,
    formCompanyIdPlaceholder,
    formCompanyIdValidationRequired,
    formEmailLabel,
    formEmailPlaceholder,
    formEmailValidationRequired,
    formEmailValidationInvalid,
    formPhoneLabel,
    formPhonePlaceholder,
    formPhoneValidationRequired,
    formPhoneValidationInvalid,
    actionSendOtp,
    toastSuccess,
    toastError,
  } = useMemo(() => {
    const get = getContent;
    return {
      pageTitle: get(FORGOT_USER_ID_CONTENT_KEYS.PAGE_TITLE),
      introTitle: get(FORGOT_USER_ID_CONTENT_KEYS.INTRO_TITLE),
      introDescription: get(FORGOT_USER_ID_CONTENT_KEYS.INTRO_DESCRIPTION),
      formCompanyIdLabel: get(
        FORGOT_USER_ID_CONTENT_KEYS.FORM_COMPANY_ID_LABEL,
      ),
      formCompanyIdPlaceholder: get(
        FORGOT_USER_ID_CONTENT_KEYS.FORM_COMPANY_ID_PLACEHOLDER,
      ),
      formCompanyIdValidationRequired: get(
        FORGOT_USER_ID_CONTENT_KEYS.FORM_COMPANY_ID_VALIDATION_REQUIRED,
      ),
      formEmailLabel: get(FORGOT_USER_ID_CONTENT_KEYS.FORM_EMAIL_LABEL),
      formEmailPlaceholder: get(
        FORGOT_USER_ID_CONTENT_KEYS.FORM_EMAIL_PLACEHOLDER,
      ),
      formEmailValidationRequired: get(
        FORGOT_USER_ID_CONTENT_KEYS.FORM_EMAIL_VALIDATION_REQUIRED,
      ),
      formEmailValidationInvalid: get(
        FORGOT_USER_ID_CONTENT_KEYS.FORM_EMAIL_VALIDATION_INVALID,
      ),
      formPhoneLabel: get(FORGOT_USER_ID_CONTENT_KEYS.FORM_PHONE_LABEL),
      formPhonePlaceholder: get(
        FORGOT_USER_ID_CONTENT_KEYS.FORM_PHONE_PLACEHOLDER,
      ),
      formPhoneValidationRequired: get(
        FORGOT_USER_ID_CONTENT_KEYS.FORM_PHONE_VALIDATION_REQUIRED,
      ),
      formPhoneValidationInvalid: get(
        FORGOT_USER_ID_CONTENT_KEYS.FORM_PHONE_VALIDATION_INVALID,
      ),
      actionSendOtp: get(FORGOT_USER_ID_CONTENT_KEYS.ACTION_SEND_OTP),
      toastSuccess: get(FORGOT_USER_ID_CONTENT_KEYS.TOAST_SUCCESS),
      toastError: get(FORGOT_USER_ID_CONTENT_KEYS.TOAST_ERROR),
    };
  }, [getContent]);
  // Page Content End

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotUserIdFormValues>({
    defaultValues: { companyId: "", email: "", phone: "" },
    mode: "onChange",
  });

  const { execute: requestOtp, loading } = usePost<any, ForgotUserIdFormValues>(
    AUTH_ENDPOINTS.requestOtpForUserId,
    API_CLIENT_TYPES.AUTH,
  );

  /**
   * Sends an OTP to the user for recovering their User ID.
   * @param data Company ID, Email, and Phone values
   */
  const onSubmit = async (data: ForgotUserIdFormValues) => {
    try {
      // Backend validates this endpoint as:
      //   { companyId, email, phone }
      // and internally maps email -> P_EMAIL_OR_PHONE when calling DB.
      const response = await requestOtp({
        companyId: data.companyId,
        email: data.email.trim(),
        phone: data.phone.trim(),
      });

      showToast(response?.message || toastSuccess, {
        variant: "success",
        position: "top",
      });
      router.push({
        pathname: "/(screens)/auth/verify-otp",
        params: { context: "forgot-user-id" },
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : toastError;
      showToast(message, { variant: "error", position: "top" });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title={pageTitle} onBackPress={() => router.back()} />

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

          <View style={styles.formGroup}>
            <Controller
              control={control}
              name="companyId"
              rules={{ required: formCompanyIdValidationRequired }}
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
              name="email"
              rules={{
                required: formEmailValidationRequired,
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: formEmailValidationInvalid,
                },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label={formEmailLabel}
                  placeholder={formEmailPlaceholder}
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
                required: formPhoneValidationRequired,
                minLength: { value: 7, message: formPhoneValidationInvalid },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label={formPhoneLabel}
                  placeholder={formPhonePlaceholder}
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
              {actionSendOtp}
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
