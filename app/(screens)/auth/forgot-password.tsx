import { useMemo } from "react";
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
import { FORGOT_PASSWORD_CONTENT_KEYS } from "@/content/(screens)/auth/forgot-password-keys";
import { useGetContent } from "@/hooks/useGetContent";
import { usePost } from "@/hooks/usePost";
import { useRouter } from "expo-router";

type ForgotFormValues = {
  loginId: string;
  companyId: string;
};

/**
 * Renders the Forgot Password screen.
 * - Collects Login ID and Company ID
 * - Requests an OTP via API
 * - Navigates to Verify OTP on success
 */
export default function ForgotPasswordScreen() {
  const { getContent } = useGetContent();
  const router = useRouter();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotFormValues>({
    defaultValues: { loginId: "", companyId: "" },
    mode: "onChange",
  });

  const { execute: requestOtp, loading } = usePost<any, ForgotFormValues>(
    AUTH_ENDPOINTS.requestOtp,
    API_CLIENT_TYPES.AUTH,
  );

  // Page Content
  const {
    pageTitle,
    introTitle,
    introDescription,
    formLoginIdLabel,
    formLoginIdPlaceholder,
    formLoginIdValidationRequired,
    formCompanyIdLabel,
    formCompanyIdPlaceholder,
    formCompanyIdValidationRequired,
    actionSendOtp,
    toastSuccess,
    toastError,
  } = useMemo(() => {
    const get = getContent;
    return {
      pageTitle: get(FORGOT_PASSWORD_CONTENT_KEYS.PAGE_TITLE),
      introTitle: get(FORGOT_PASSWORD_CONTENT_KEYS.INTRO_TITLE),
      introDescription: get(FORGOT_PASSWORD_CONTENT_KEYS.INTRO_DESCRIPTION),
      formLoginIdLabel: get(FORGOT_PASSWORD_CONTENT_KEYS.FORM_LOGIN_ID_LABEL),
      formLoginIdPlaceholder: get(
        FORGOT_PASSWORD_CONTENT_KEYS.FORM_LOGIN_ID_PLACEHOLDER,
      ),
      formLoginIdValidationRequired: get(
        FORGOT_PASSWORD_CONTENT_KEYS.FORM_LOGIN_ID_VALIDATION_REQUIRED,
      ),
      formCompanyIdLabel: get(
        FORGOT_PASSWORD_CONTENT_KEYS.FORM_COMPANY_ID_LABEL,
      ),
      formCompanyIdPlaceholder: get(
        FORGOT_PASSWORD_CONTENT_KEYS.FORM_COMPANY_ID_PLACEHOLDER,
      ),
      formCompanyIdValidationRequired: get(
        FORGOT_PASSWORD_CONTENT_KEYS.FORM_COMPANY_ID_VALIDATION_REQUIRED,
      ),
      actionSendOtp: get(FORGOT_PASSWORD_CONTENT_KEYS.ACTION_SEND_OTP),
      toastSuccess: get(
        FORGOT_PASSWORD_CONTENT_KEYS.FORGOT_PASSWORD_TOAST_SUCCESS,
      ),
      toastError: get(FORGOT_PASSWORD_CONTENT_KEYS.FORGOT_PASSWORD_TOAST_ERROR),
    };
  }, [getContent]);
  // Page Content End

  /**
   * Sends an OTP to the user for password reset.
   * @param data Login ID and Company ID values
   */
  const onSubmit = async (data: ForgotFormValues) => {
    try {
      const response = await requestOtp(data);

      showToast(response?.message || toastSuccess, {
        variant: "success",
        position: "top",
      });
      router.push({
        pathname: "/(screens)/auth/verify-otp",
        params: {
          context: "forgot-password",
          email: data.loginId, // loginId is email behind the scenes
          companyId: data.companyId,
        },
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
              name="loginId"
              rules={{ required: formLoginIdValidationRequired }}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label={formLoginIdLabel}
                  placeholder={formLoginIdPlaceholder}
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
