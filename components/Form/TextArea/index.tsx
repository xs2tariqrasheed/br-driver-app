import Typography from "@/components/Typography";
import { SF_PRO_FONTS } from "@/components/Typography/constants";
import { textColors } from "@/constants/colors";
import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from "react-native";

export type TextAreaProps = {
  /** Optional label shown above the textarea */
  label?: string;
  /** Disable interaction and apply disabled visuals */
  disabled?: boolean;
  /** Field name used to lookup error from errors[name] (react-hook-form) */
  name?: string;
  /** errors object from react-hook-form. If errors[name] exists, textarea shows error state */
  errors?: Record<string, any>;
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
  /** Placeholder text */
  placeholder?: string;
  /** Number of lines for the textarea */
  numberOfLines?: number;
} & Omit<
  TextInputProps,
  "value" | "onChangeText" | "editable" | "style" | "multiline"
>;

function InnerTextArea(
  props: TextAreaProps & {
    value: string;
    onChangeText: (text: string) => void;
    textInputRef: React.RefObject<TextInput>;
  }
) {
  const {
    label,
    disabled = false,
    name,
    errors,
    value,
    onChangeText,
    style,
    inputStyle,
    labelStyle,
    placeholder,
    numberOfLines = 4,
    onBlur: onBlurProp,
    textInputRef,
    ...rest
  } = props;

  const [isFocused, setIsFocused] = useState(false);

  const hasValue = (value ?? "").length > 0;
  const isActive = isFocused || hasValue;

  const getErrorByPath = (obj: any, path?: string) => {
    if (!obj || !path) return undefined;
    const normalized = path.replace(/\[(\d+)\]/g, ".$1");
    return normalized.split(".").reduce((acc: any, key: string) => {
      if (acc && typeof acc === "object" && key in acc) return acc[key];
      return undefined;
    }, obj);
  };

  const fieldError = getErrorByPath(errors, name);
  const hasError = Boolean(fieldError);
  const errorMessage =
    (fieldError &&
      (fieldError.message ||
        (typeof fieldError === "string" ? fieldError : undefined))) ||
    undefined;

  const borderStyle = StyleSheet.create({
    borderColor: {
      borderColor: hasError
        ? textColors.red500
        : isActive
        ? textColors.teal900
        : textColors.grey200,
    },
    borderWidth: {
      borderWidth: hasError ? 2 : isActive ? 2 : 1,
    },
  });

  return (
    <>
      {label && (
        <Typography
          type="bodyMedium"
          weight="medium"
          style={[styles.label, labelStyle]}
        >
          {label}
        </Typography>
      )}

      <View
        style={[
          styles.container,
          {
            ...borderStyle.borderColor,
            ...borderStyle.borderWidth,
          },
          disabled && styles.disabled,
          style,
        ]}
      >
        <TextInput
          ref={textInputRef}
          value={value}
          onChangeText={onChangeText}
          editable={!disabled}
          placeholder={placeholder}
          placeholderTextColor={textColors.grey400}
          onFocus={() => setIsFocused(true)}
          onBlur={(e) => {
            setIsFocused(false);
            onBlurProp?.(e);
          }}
          cursorColor={disabled ? undefined : textColors.teal900}
          selectionColor={textColors.teal900}
          multiline
          numberOfLines={numberOfLines}
          textAlignVertical="top"
          style={[
            styles.input,
            { color: hasError ? textColors.red500 : textColors.black },
            inputStyle,
          ]}
          {...rest}
        />
      </View>

      {hasError && errorMessage ? (
        <Typography type="labelLarge" weight="regular" style={styles.errorText}>
          {errorMessage}
        </Typography>
      ) : null}
    </>
  );
}

const TextArea = forwardRef<TextInput, TextAreaProps>(function TextArea(
  props: TextAreaProps,
  ref
) {
  const { value, onChangeText, ...rest } = props;
  const innerRef = useRef<TextInput>(null);

  useImperativeHandle(ref, () => innerRef.current as TextInput, []);

  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState("");
  const controlledValue =
    (isControlled ? (value as string) : internalValue) ?? "";
  const handleChange = (text: string) => {
    if (isControlled) {
      onChangeText?.(text);
    } else {
      setInternalValue(text);
      onChangeText?.(text);
    }
  };

  return (
    <InnerTextArea
      {...rest}
      value={controlledValue}
      onChangeText={handleChange}
      textInputRef={innerRef as React.RefObject<TextInput>}
    />
  );
});

const styles = StyleSheet.create({
  container: {
    minHeight: 100,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: textColors.grey200,
    backgroundColor: textColors.white,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  disabled: {
    backgroundColor: textColors.grey100,
    opacity: 0.8,
  },
  label: {
    color: textColors.black,
    marginBottom: 8,
  },
  input: {
    minHeight: 80,
    fontSize: 16,
    fontFamily: SF_PRO_FONTS.Medium,
    color: textColors.black,
    lineHeight: 20,
  },
  errorText: {
    color: textColors.red500,
    marginLeft: 4,
    marginTop: 4,
    fontSize: 12,
  },
});

export default TextArea;
