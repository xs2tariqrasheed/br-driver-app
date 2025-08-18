import { SF_PRO_FONTS } from "@/components/Typography/constants";
import { textColors } from "@/constants/colors";
import React, { forwardRef, useMemo, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from "react-native";

type IconPosition = "left" | "right";

type InputType = "text" | "password" | "email" | "number";

export type BaseInputProps = {
  /** Optional label shown as floating text when focused or has value */
  label?: string;
  /** Disable interaction and apply disabled visuals */
  disabled?: boolean;
  /** Optional icon element */
  icon?: React.ReactNode;
  /** Position of the optional icon. Defaults to "left" */
  iconPosition?: IconPosition;
  /** Default: "text". Maps to keyboard/security props */
  inputType?: InputType;
  /** Controlled value for external control */
  value?: string;
  /** Callback when text changes (controlled mode) */
  onChangeText?: (text: string) => void;
  /** Container style override */
  style?: StyleProp<ViewStyle>;
  /** TextInput style override */
  inputStyle?: StyleProp<TextStyle>;
  /** Label style override */
  labelStyle?: StyleProp<TextStyle>;
} & Omit<TextInputProps, "value" | "onChangeText" | "editable" | "style">;

export type InputProps = BaseInputProps;

const getKeyboardProps = (type: InputType | undefined) => {
  const inputType: InputType = type ?? "text";
  switch (inputType) {
    case "password":
      return {
        secureTextEntry: true as const,
        keyboardType: "default" as const,
      };
    case "email":
      return {
        secureTextEntry: false as const,
        keyboardType: "email-address" as const,
        autoCapitalize: "none" as const,
      };
    case "number":
      return {
        secureTextEntry: false as const,
        keyboardType: "number-pad" as const,
      };
    case "text":
    default:
      return {
        secureTextEntry: false as const,
        keyboardType: "default" as const,
      };
  }
};

function InnerInput(
  props: BaseInputProps & {
    value: string;
    onChangeText: (text: string) => void;
  }
) {
  const {
    label,
    disabled = false,
    icon,
    iconPosition = "left",
    inputType = "text",
    value,
    onChangeText,
    style,
    inputStyle,
    labelStyle,
    placeholder,
    ...rest
  } = props;

  const [isFocused, setIsFocused] = useState(false);

  const hasValue = (value ?? "").length > 0;
  const isActive = isFocused || hasValue;

  const keyboardProps = useMemo(() => getKeyboardProps(inputType), [inputType]);

  const boderStyle = StyleSheet.create({
    borderColor: {
      borderColor: isActive ? textColors.teal900 : textColors.grey200,
    },
    borderWidth: {
      borderWidth: isActive ? 2 : 1,
    },
  });

  return (
    <View
      style={[
        styles.container,
        {
          ...boderStyle.borderColor,
          ...boderStyle.borderWidth,
        },
        disabled && styles.disabled,
        style,
      ]}
    >
      {icon && iconPosition === "left" ? (
        <View style={styles.iconLeft}>{icon}</View>
      ) : null}

      <View style={styles.inputWrap}>
        {label && isActive ? (
          <Text style={[styles.floatingLabel, labelStyle]}>{label}</Text>
        ) : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          editable={!disabled}
          placeholder={isActive ? undefined : placeholder}
          placeholderTextColor={textColors.grey400}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          cursorColor={disabled ? undefined : textColors.teal900}
          selectionColor={textColors.teal900}
          {...keyboardProps}
          style={[
            styles.input,
            { color: isActive ? textColors.black : textColors.black },
            inputStyle,
          ]}
          {...rest}
        />
      </View>

      {icon && iconPosition === "right" ? (
        <View style={styles.iconRight}>{icon}</View>
      ) : null}
    </View>
  );
}

const Input = forwardRef<TextInput, InputProps>(function Input(
  props: InputProps,
  ref
) {
  const { value, onChangeText, inputType = "text", ...rest } = props as any;
  const controlledValue = (value ?? "") as string;
  const handleChange = (text: string) => {
    onChangeText?.(text);
  };

  return (
    <InnerInput
      {...rest}
      inputType={inputType}
      value={controlledValue}
      onChangeText={handleChange}
    />
  );
});

const styles = StyleSheet.create({
  container: {
    minHeight: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: textColors.grey200,
    backgroundColor: textColors.white,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  disabled: {
    backgroundColor: textColors.grey100,
    opacity: 0.8,
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
  inputWrap: {
    flex: 1,
    justifyContent: "center",
  },
  floatingLabel: {
    color: textColors.grey700,
    fontFamily: SF_PRO_FONTS.Medium,
    fontSize: 12,
    marginBottom: -8,
    marginVertical: 6,
    marginLeft: 4,
  },
  input: {
    minHeight: 24,
    paddingVertical: 10,
    fontSize: 16,
    fontFamily: SF_PRO_FONTS.Medium,
    color: textColors.black,
  },
});

export default Input;
