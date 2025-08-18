import { SF_PRO_FONTS } from "@/components/Typography/constants";
import { textColors } from "@/constants/colors";
import React, {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
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
  /** Field name used to lookup error from errors[name] (react-hook-form) */
  name?: string;
  /** errors object from react-hook-form. If errors[name] exists, input shows error state */
  errors?: Record<string, any>;
  /** Optional icon element */
  icon?: React.ReactNode;
  /** Position of the optional icon. Defaults to "left" */
  iconPosition?: IconPosition;
  /** Default: "text". Maps to keyboard/security props */
  inputType?: InputType;
  /** Optional right icon element or icon type */
  rightIcon?: React.ReactNode | "info";
  /** Callback when right icon is clicked */
  onRightIconClick?: () => void;
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

const getKeyboardProps = (
  type: InputType | undefined,
  isPasswordVisible?: boolean
) => {
  const inputType: InputType = type ?? "text";
  switch (inputType) {
    case "password":
      return {
        secureTextEntry: !isPasswordVisible,
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
    textInputRef: React.RefObject<TextInput>;
  }
) {
  const {
    label,
    disabled = false,
    name,
    errors,
    icon,
    iconPosition = "left",
    inputType = "text",
    rightIcon,
    onRightIconClick,
    value,
    onChangeText,
    style,
    inputStyle,
    labelStyle,
    placeholder,
    onBlur: onBlurProp,
    textInputRef,
    ...rest
  } = props;

  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

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

  // Do not memoize against `errors` because RHF uses a Proxy that can keep the same
  // reference while inner values change. Recompute each render to reflect latest state.
  const fieldError = getErrorByPath(errors, name);
  const hasError = Boolean(fieldError);
  const errorMessage =
    (fieldError &&
      (fieldError.message ||
        (typeof fieldError === "string" ? fieldError : undefined))) ||
    undefined;

  const keyboardProps = useMemo(
    () => getKeyboardProps(inputType, isPasswordVisible),
    [inputType, isPasswordVisible]
  );

  const togglePasswordVisibility = () => {
    const wasFocused = isFocused;
    setIsPasswordVisible((prev) => !prev);
    if (wasFocused) {
      setTimeout(() => {
        textInputRef.current?.focus();
      }, 0);
    }
  };

  const renderNode = (node?: React.ReactNode) => {
    if (typeof node === "string") {
      return <Text style={styles.iconText}>{node}</Text>;
    }
    return node ?? null;
  };

  const renderRightIcon = () => {
    const hasPasswordEye = inputType === "password";
    const hasCustomRightIcon = Boolean(rightIcon);

    if (!hasPasswordEye && !hasCustomRightIcon) return null;

    const iconContent =
      rightIcon === "info" ? (
        <Image
          source={require("@/assets/images/info.png")}
          style={styles.iconImage}
        />
      ) : (
        renderNode(rightIcon as React.ReactNode)
      );

    return (
      <View style={styles.rightIconWrapper}>
        {hasPasswordEye ? (
          <TouchableOpacity
            onPress={togglePasswordVisibility}
            style={styles.rightIconContainer}
          >
            <Image
              source={
                isPasswordVisible
                  ? require("@/assets/images/eye-off.png")
                  : require("@/assets/images/eye.png")
              }
              style={styles.iconImage}
            />
          </TouchableOpacity>
        ) : null}

        {hasCustomRightIcon ? (
          <>
            {rightIcon === "info" && <View style={styles.divider} />}
            <TouchableOpacity
              onPress={() => {
                const wasFocused = isFocused;
                onRightIconClick?.();
                if (wasFocused) {
                  setTimeout(() => {
                    textInputRef.current?.focus();
                  }, 0);
                }
              }}
              style={styles.rightIconContainer}
            >
              {iconContent}
            </TouchableOpacity>
          </>
        ) : null}
      </View>
    );
  };

  const boderStyle = StyleSheet.create({
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
          <View style={styles.iconLeft}>{renderNode(icon)}</View>
        ) : null}

        <View style={styles.inputWrap}>
          {label && isActive ? (
            <Text style={[styles.floatingLabel, labelStyle]}>{label}</Text>
          ) : null}
          <TextInput
            ref={textInputRef}
            value={value}
            onChangeText={onChangeText}
            editable={!disabled}
            placeholder={isActive ? undefined : placeholder}
            placeholderTextColor={textColors.grey400}
            onFocus={() => setIsFocused(true)}
            onBlur={(e) => {
              setIsFocused(false);
              // forward to external onBlur (RHF Controller)
              // @ts-ignore native/web event types
              onBlurProp?.(e);
            }}
            cursorColor={disabled ? undefined : textColors.teal900}
            selectionColor={textColors.teal900}
            {...keyboardProps}
            style={[
              styles.input,
              { color: hasError ? textColors.red500 : textColors.black },
              inputStyle,
            ]}
            {...rest}
          />
        </View>

        {icon && iconPosition === "right" ? (
          <View style={styles.iconRight}>{renderNode(icon)}</View>
        ) : null}

        {renderRightIcon()}
      </View>

      {hasError && errorMessage ? (
        <Text
          style={{
            color: textColors.red500,
            marginLeft: 20,
            marginTop: -8,
            fontSize: 12,
            fontFamily: SF_PRO_FONTS.Regular,
          }}
        >
          {errorMessage}
        </Text>
      ) : null}
    </>
  );
}

const Input = forwardRef<TextInput, InputProps>(function Input(
  props: InputProps,
  ref
) {
  const { value, onChangeText, inputType = "text", ...rest } = props as any;
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
    <InnerInput
      {...rest}
      inputType={inputType}
      value={controlledValue}
      onChangeText={handleChange}
      textInputRef={innerRef}
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
  rightIconWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  rightIconContainer: {
    padding: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  iconImage: {
    width: 18,
    height: 18,
    resizeMode: "contain",
  },
  iconText: {
    fontSize: 16,
    fontFamily: SF_PRO_FONTS.Medium,
    color: textColors.grey700,
  },
  divider: {
    width: 1.5,
    height: 24,
    backgroundColor: textColors.grey200,
    marginHorizontal: 2,
  },
});

export default Input;
