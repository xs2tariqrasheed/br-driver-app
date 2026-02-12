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
import { UPDATE_PASSWORD_CONTENT_KEYS } from "@/content/(screens)/more/update-password-keys";
import { useGetContent } from "@/hooks/useGetContent";
import { usePost } from "@/hooks/usePost";
import { router } from "expo-router";

type UpdateFormValues = {
  oldPassword: string;
  password: string;
  confirmPassword: string;
};

export default function UpdatePasswordScreen() {
  const getContent = useGetContent();

  const {
    headerTitle,
    introTitle,
    introDescription,
    formOldPasswordLabel,
    formOldPasswordPlaceholder,
    formOldPasswordValidationRequired,
    formPasswordLabel,
    formPasswordPlaceholder,
    formPasswordValidationRequired,
    formConfirmPasswordLabel,
    formConfirmPasswordPlaceholder,
    formConfirmPasswordValidationRequired,
    formConfirmPasswordValidationMismatch,
    actionUpdate,
    toastSuccess,
    toastError,
  } = useMemo(() => {
    const get = getContent.getContent;
    return {
      headerTitle: get(UPDATE_PASSWORD_CONTENT_KEYS.HEADER_TITLE),
      introTitle: get(UPDATE_PASSWORD_CONTENT_KEYS.INTRO_TITLE),
      introDescription: get(UPDATE_PASSWORD_CONTENT_KEYS.INTRO_DESCRIPTION),
      formOldPasswordLabel: get(
        UPDATE_PASSWORD_CONTENT_KEYS.FORM_OLD_PASSWORD_LABEL,
      ),
      formOldPasswordPlaceholder: get(
        UPDATE_PASSWORD_CONTENT_KEYS.FORM_OLD_PASSWORD_PLACEHOLDER,
      ),
      formOldPasswordValidationRequired: get(
        UPDATE_PASSWORD_CONTENT_KEYS.FORM_OLD_PASSWORD_VALIDATION_REQUIRED,
      ),
      formPasswordLabel: get(UPDATE_PASSWORD_CONTENT_KEYS.FORM_PASSWORD_LABEL),
      formPasswordPlaceholder: get(
        UPDATE_PASSWORD_CONTENT_KEYS.FORM_PASSWORD_PLACEHOLDER,
      ),
      formPasswordValidationRequired: get(
        UPDATE_PASSWORD_CONTENT_KEYS.FORM_PASSWORD_VALIDATION_REQUIRED,
      ),
      formConfirmPasswordLabel: get(
        UPDATE_PASSWORD_CONTENT_KEYS.FORM_CONFIRM_PASSWORD_LABEL,
      ),
      formConfirmPasswordPlaceholder: get(
        UPDATE_PASSWORD_CONTENT_KEYS.FORM_CONFIRM_PASSWORD_PLACEHOLDER,
      ),
      formConfirmPasswordValidationRequired: get(
        UPDATE_PASSWORD_CONTENT_KEYS.FORM_CONFIRM_PASSWORD_VALIDATION_REQUIRED,
      ),
      formConfirmPasswordValidationMismatch: get(
        UPDATE_PASSWORD_CONTENT_KEYS.FORM_CONFIRM_PASSWORD_VALIDATION_MISMATCH,
      ),
      actionUpdate: get(UPDATE_PASSWORD_CONTENT_KEYS.ACTION_UPDATE),
      toastSuccess: get(UPDATE_PASSWORD_CONTENT_KEYS.TOAST_SUCCESS),
      toastError: get(UPDATE_PASSWORD_CONTENT_KEYS.TOAST_ERROR),
    };
  }, [getContent]);
  // Page Content End

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<UpdateFormValues>({
    defaultValues: { oldPassword: "", password: "", confirmPassword: "" },
    mode: "onChange",
  });

  const oldPasswordValue = watch("oldPassword");
  const passwordValue = watch("password");
  const confirmValue = watch("confirmPassword");

  // API: update password (authenticated)
  const {
    loading: submitting,
    error: submitError,
    execute: updatePassword,
  } = usePost<
    any,
    { oldPassword: string; password: string; confirmPassword: string }
  >(AUTH_ENDPOINTS.updatePassword, API_CLIENT_TYPES.ME);

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
    try {
      const response = await updatePassword({
        oldPassword: oldPasswordValue,
        password: passwordValue,
        confirmPassword: confirmValue,
      });
      showToast(response?.message || toastSuccess, {
        variant: "success",
        position: "top",
      });
      reset();
      setPasswordPanelsOverride(null);
      setConfirmPanelsOverride(null);
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
    Boolean(oldPasswordValue && passwordValue && confirmValue) &&
    passwordValue === confirmValue &&
    isPasswordStrong &&
    isConfirmStrong;

  return (
    <SafeAreaView style={styles.container}>
      <Header title={headerTitle} onBackPress={() => router.back()} />

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
              name="oldPassword"
              rules={{ required: formOldPasswordValidationRequired }}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label={formOldPasswordLabel}
                  placeholder={formOldPasswordPlaceholder}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  inputType="password"
                  name="oldPassword"
                  errors={errors as any}
                />
              )}
            />

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
              {actionUpdate}
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
  helperGroup: {
    gap: 8,
  },
  textBlack: {
    color: textColors.black,
  },
});
