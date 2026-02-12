import { checkPasswordRequirements } from "@/components/Form/Password/Strength/utils";
import Typography from "@/components/Typography";
import { textColors } from "@/constants/colors";
import { PASSWORD_FORM_CONTENT_KEYS } from "@/content/components/password-keys";
import { useGetContent } from "@/hooks/useGetContent";
import React, { useMemo } from "react";
import { Image, StyleSheet, View } from "react-native";

export interface PasswordRequirementsProps {
  password?: string | null;
}

const PasswordRequirements: React.FC<PasswordRequirementsProps> = ({
  password,
}) => {
  const value = password ?? "";

  // Page Content Start
  const { getContent } = useGetContent();
  const {
    requirementsTitle,
    requirementsMinLength,
    requirementsUppercase,
    requirementsLowercase,
    requirementsNumber,
    requirementsSpecial,
  } = useMemo(() => {
    const get = getContent;
    return {
      requirementsTitle: get(PASSWORD_FORM_CONTENT_KEYS.REQUIREMENTS_TITLE),
      requirementsMinLength: get(
        PASSWORD_FORM_CONTENT_KEYS.REQUIREMENTS_MIN_LENGTH,
      ),
      requirementsUppercase: get(
        PASSWORD_FORM_CONTENT_KEYS.REQUIREMENTS_UPPERCASE,
      ),
      requirementsLowercase: get(
        PASSWORD_FORM_CONTENT_KEYS.REQUIREMENTS_LOWERCASE,
      ),
      requirementsNumber: get(PASSWORD_FORM_CONTENT_KEYS.REQUIREMENTS_NUMBER),
      requirementsSpecial: get(PASSWORD_FORM_CONTENT_KEYS.REQUIREMENTS_SPECIAL),
    };
  }, [getContent]);
  // Page Content End
  const checks = useMemo(() => {
    const req = checkPasswordRequirements(value);

    return [
      {
        key: "minLength",
        label: requirementsMinLength,
        met: req.hasMinLength,
      },
      {
        key: "uppercase",
        label: requirementsUppercase,
        met: req.hasUppercase,
      },
      {
        key: "lowercase",
        label: requirementsLowercase,
        met: req.hasLowercase,
      },
      {
        key: "number",
        label: requirementsNumber,
        met: req.hasNumber,
      },
      {
        key: "special",
        label: requirementsSpecial,
        met: req.hasSpecialChar,
      },
    ];
  }, [value]);

  return (
    <View style={styles.container}>
      <Typography type="headingSmall" weight="medium" style={styles.title}>
        {requirementsTitle}
      </Typography>

      <View style={styles.list}>
        {checks.map((item) => (
          <View key={item.key} style={styles.row}>
            {item.met ? (
              <Image
                source={require("@/assets/images/green-check.png")}
                style={styles.checkIcon}
              />
            ) : (
              <Typography
                type="bodyLarge"
                weight="regular"
                style={styles.bullet}
                accessibilityElementsHidden
                importantForAccessibility="no"
              >
                •
              </Typography>
            )}

            <Typography
              type="bodyMedium"
              weight={item.met ? "bold" : "regular"}
              style={item.met ? styles.metText : styles.unmetText}
            >
              {item.label}
            </Typography>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  title: {
    color: textColors.black,
    marginBottom: 8,
  },
  list: {
    marginTop: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  checkIcon: {
    width: 18,
    height: 18,
    resizeMode: "contain",
    marginRight: 8,
    marginTop: 1,
  },
  bullet: {
    color: textColors.black,
    marginRight: 12,
    lineHeight: 18,
  },
  unmetText: {
    color: textColors.black,
  },
  metText: {
    color: textColors.greenCheck,
  },
});

export default PasswordRequirements;
