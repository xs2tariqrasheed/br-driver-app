import React, { useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { useOverlayInsets } from "@/context/OverlayInsetsContext";

import Button from "@/components/Button";
import Input from "@/components/Form/Input";
import PasswordRequirements from "@/components/Form/Password/Requirements";
import PasswordStrength from "@/components/Form/Password/Strength";
import Header from "@/components/Header";
import Logo from "@/components/Logo";
import { showToast } from "@/components/Toast";
import Typography from "@/components/Typography";
import { textColors } from "@/constants/colors";
import { AUTH_ENDPOINTS } from "@/constants/endpoints";
import { API_CLIENT_TYPES } from "@/constants/global";
import { RESET_PASSWORD_CONTENT_KEYS } from "@/content/(screens)/auth/reset-password-keys";
import { useGetContent } from "@/hooks/useGetContent";
import { usePost } from "@/hooks/usePost";
import { useLocalSearchParams, useRouter } from "expo-router";

type ResetFormValues = {
  password: string;
  confirmPassword: string;
};

export default function ResetPasswordScreen() {
  const { getContent } = useGetContent();

  const {
    pageTitle,
    introTitle,
    introDescription,
    formPasswordLabel,
    formPasswordPlaceholder,
    formPasswordValidationRequired,
    formConfirmPasswordLabel,
    formConfirmPasswordPlaceholder,
    formConfirmPasswordValidationRequired,
    formConfirmPasswordValidationMismatch,
    actionReset,
    toastErrorMissingParams,
    toastSuccess,
    toastError,
  } = useMemo(() => {
    const get = getContent;
    return {
      pageTitle: get(RESET_PASSWORD_CONTENT_KEYS.PAGE_TITLE),
      introTitle: get(RESET_PASSWORD_CONTENT_KEYS.INTRO_TITLE),
      introDescription: get(RESET_PASSWORD_CONTENT_KEYS.INTRO_DESCRIPTION),
      formPasswordLabel: get(RESET_PASSWORD_CONTENT_KEYS.FORM_PASSWORD_LABEL),
      formPasswordPlaceholder: get(
        RESET_PASSWORD_CONTENT_KEYS.FORM_PASSWORD_PLACEHOLDER,
      ),
      formPasswordValidationRequired: get(
        RESET_PASSWORD_CONTENT_KEYS.FORM_PASSWORD_VALIDATION_REQUIRED,
      ),
      formConfirmPasswordLabel: get(
        RESET_PASSWORD_CONTENT_KEYS.FORM_CONFIRM_PASSWORD_LABEL,
      ),
      formConfirmPasswordPlaceholder: get(
        RESET_PASSWORD_CONTENT_KEYS.FORM_CONFIRM_PASSWORD_PLACEHOLDER,
      ),
      formConfirmPasswordValidationRequired: get(
        RESET_PASSWORD_CONTENT_KEYS.FORM_CONFIRM_PASSWORD_VALIDATION_REQUIRED,
      ),
      formConfirmPasswordValidationMismatch: get(
        RESET_PASSWORD_CONTENT_KEYS.FORM_CONFIRM_PASSWORD_VALIDATION_MISMATCH,
      ),
      actionReset: get(RESET_PASSWORD_CONTENT_KEYS.ACTION_RESET),
      toastErrorMissingParams: get(
        RESET_PASSWORD_CONTENT_KEYS.TOAST_ERROR_MISSING_PARAMS,
      ),
      toastSuccess: get(RESET_PASSWORD_CONTENT_KEYS.TOAST_SUCCESS),
      toastError: get(RESET_PASSWORD_CONTENT_KEYS.TOAST_ERROR),
    };
  }, [getContent]);
  // Page Content End

  const router = useRouter();
  const {
    email: emailParam,
    code: codeParam,
    companyId: companyIdParam,
  } = useLocalSearchParams<{
    email?: string;
    code?: string;
    companyId?: string;
  }>();
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetFormValues>({
    defaultValues: { password: "", confirmPassword: "" },
    mode: "onChange",
  });

  const passwordValue = watch("password");
  const confirmValue = watch("confirmPassword");

  // API: reset password
  const {
    loading: submitting,
    error: submitError,
    execute: resetPassword,
  } = usePost<
    any,
    { email: string; code: string; newPassword: string; companyId?: string }
  >(AUTH_ENDPOINTS.resetPassword, API_CLIENT_TYPES.AUTH);

  // Manual visibility override for helper panels via Info icon
  // null => follow auto rule (visible when field has value)
  // true/false => force show/hide regardless of value
  const [passwordPanelsOverride, setPasswordPanelsOverride] = React.useState<
    boolean | null
  >(null);
  const [confirmPanelsOverride, setConfirmPanelsOverride] = React.useState<
    boolean | null
  >(null);

  const onSubmit = async () => {
    // Validate that we have email, OTP code, and companyId from previous screen
    if (!emailParam || !codeParam || !companyIdParam) {
      showToast(toastErrorMissingParams, {
        variant: "error",
        position: "top",
      });
      router.replace("/(screens)/auth/forgot-password");
      return;
    }

    try {
      const response = await resetPassword({
        email: emailParam,
        code: codeParam,
        newPassword: passwordValue,
        companyId: companyIdParam, // Required: must be provided
      });
      showToast(response?.message || toastSuccess, {
        variant: "success",
        position: "top",
      });
      router.replace("/(screens)/auth/login");
    } catch (e) {
      const message = e instanceof Error ? e.message : toastError;
      showToast(message, { variant: "error", position: "top" });
    }
  };

  // Reflect async errors from the hook
  React.useEffect(() => {
    if (submitError) {
      showToast(submitError, { variant: "error", position: "top" });
    }
  }, [submitError]);

  const handlePasswordInfoToggle = () => {
    setPasswordPanelsOverride((prev) => {
      const autoVisible = (passwordValue?.length ?? 0) > 0;
      if (prev === null) return !autoVisible; // toggle from auto state
      return !prev;
    });
  };
  const handleConfirmInfoToggle = () => {
    setConfirmPanelsOverride((prev) => {
      const autoVisible = (confirmValue?.length ?? 0) > 0;
      if (prev === null) return !autoVisible;
      return !prev;
    });
  };
  // Strength from PasswordStrength callbacks
  const [isPasswordStrong, setIsPasswordStrong] = React.useState(false);
  const [isConfirmStrong, setIsConfirmStrong] = React.useState(false);

  const canSubmit =
    Boolean(passwordValue && confirmValue) &&
    passwordValue === confirmValue &&
    isPasswordStrong &&
    isConfirmStrong;

  const { overlayBottomInset } = useOverlayInsets();

  return (
    <SafeAreaView style={[styles.container, { paddingBottom: overlayBottomInset }]}>
      <Header title={pageTitle} onBackPress={() => router.back()} />

      <KeyboardAvoidingView
        style={styles.keyboardAvoiding}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
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
              name="password"
              rules={{
                required: formPasswordValidationRequired,
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label={formPasswordLabel}
                  placeholder={formPasswordPlaceholder}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  inputType="password"
                  rightIcon="info"
                  onRightIconClick={handlePasswordInfoToggle}
                  name="password"
                  errors={errors as any}
                />
              )}
            />

            {(
              passwordPanelsOverride !== null
                ? passwordPanelsOverride
                : (passwordValue?.length ?? 0) > 0
            ) ? (
              <View style={styles.helperGroup}>
                <PasswordStrength
                  password={passwordValue}
                  onChange={setIsPasswordStrong}
                />
                <PasswordRequirements password={passwordValue} />
              </View>
            ) : null}

            <Controller
              control={control}
              name="confirmPassword"
              rules={{
                required: formConfirmPasswordValidationRequired,
                validate: (val) =>
                  val === passwordValue ||
                  formConfirmPasswordValidationMismatch,
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label={formConfirmPasswordLabel}
                  placeholder={formConfirmPasswordPlaceholder}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  inputType="password"
                  rightIcon="info"
                  onRightIconClick={handleConfirmInfoToggle}
                  name="confirmPassword"
                  errors={errors as any}
                />
              )}
            />

            {(
              confirmPanelsOverride !== null
                ? confirmPanelsOverride
                : (confirmValue?.length ?? 0) > 0
            ) ? (
              <View style={styles.helperGroup}>
                <PasswordStrength
                  password={confirmValue}
                  onChange={setIsConfirmStrong}
                />
                <PasswordRequirements password={confirmValue} />
              </View>
            ) : null}

            <Button
              variant="primary"
              rounded="half"
              onPress={handleSubmit(onSubmit)}
              loading={submitting}
              disabled={submitting || !canSubmit}
            >
              {actionReset}
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
    paddingTop: 32,
    paddingBottom: 32,
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
  helperGroup: {
    gap: 8,
  },
  textBlack: {
    color: textColors.black,
  },
});
