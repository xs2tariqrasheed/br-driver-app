import { checkPasswordRequirements } from "@/components/Form/Password/Strength/utils";
import Typography from "@/components/Typography";
import { textColors } from "@/constants/colors";
import React, { useMemo } from "react";
import { Image, StyleSheet, View } from "react-native";

export interface PasswordRequirementsProps {
  password?: string | null;
}

const PasswordRequirements: React.FC<PasswordRequirementsProps> = ({
  password,
}) => {
  const value = password ?? "";

  const checks = useMemo(() => {
    const req = checkPasswordRequirements(value);

    return [
      {
        key: "minLength",
        label: "Must be at least 8 characters long.",
        met: req.hasMinLength,
      },
      {
        key: "uppercase",
        label: "Must contain at least one uppercase letter (A–Z)",
        met: req.hasUppercase,
      },
      {
        key: "lowercase",
        label: "Must contain at least one lowercase letter (a–z)",
        met: req.hasLowercase,
      },
      {
        key: "number",
        label: "Must include at least one number (0–9).",
        met: req.hasNumber,
      },
      {
        key: "special",
        label: "Must include at least one special character.",
        met: req.hasSpecialChar,
      },
    ];
  }, [value]);

  return (
    <View style={styles.container}>
      <Typography type="headingSmall" weight="medium" style={styles.title}>
        Password Requirements
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
