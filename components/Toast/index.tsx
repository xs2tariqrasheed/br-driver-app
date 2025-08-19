import Typography from "@/components/Typography";
import { textColors } from "@/constants/colors";
import React from "react";
import {
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ToastManager, { Toast } from "toastify-react-native";

export type ToastVariant = "success" | "warning" | "error";
export type ToastPosition = "top" | "bottom";

type ToastContentProps = {
  text1?: string;
  hide?: () => void;
  variant: ToastVariant;
};

const VARIANT_TO_COLOR: Record<ToastVariant, string> = {
  success: textColors.green700,
  warning: textColors.yellow400,
  error: textColors.red500,
};

const ToastContent: React.FC<ToastContentProps> = ({
  text1,
  hide,
  variant,
}) => {
  const onClose = () => {
    if (typeof hide === "function") hide();
    else Toast.hide();
  };

  return (
    <View
      style={[styles.container, { backgroundColor: VARIANT_TO_COLOR[variant] }]}
    >
      <Typography type="labelLarge" weight="bold" style={styles.message}>
        {text1}
      </Typography>
      <TouchableOpacity
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close toast"
      >
        <Image
          source={require("../../assets/images/black-cross.png")}
          style={styles.closeIcon}
          resizeMode="contain"
        />
      </TouchableOpacity>
    </View>
  );
};

export const ToastHost: React.FC = () => {
  const config = {
    success: (props: any) => <ToastContent {...props} variant="success" />,
    warn: (props: any) => <ToastContent {...props} variant="warning" />,
    error: (props: any) => <ToastContent {...props} variant="error" />,
  } as const;

  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const dynamicTopOffset = Math.round(height * 0.01) + (insets?.top ?? 0);

  return (
    <ToastManager
      config={config}
      useModal={false}
      topOffset={dynamicTopOffset}
      showProgressBar={false}
      width="90%"
    />
  );
};

export function showToast(
  message: string,
  options?: {
    variant?: ToastVariant;
    position?: ToastPosition;
  }
) {
  const { variant = "success", position = "top" } = options || {};

  const mapVariantToLibraryType = (
    v: ToastVariant
  ): "success" | "error" | "warn" => {
    if (v === "warning") return "warn";
    if (v === "error") return "error";
    return "success";
  };

  Toast.show({
    type: mapVariantToLibraryType(variant),
    text1: message,
    position,
    autoHide: true,
    visibilityTime: 5000,
    useModal: false,
  });
}

const styles = StyleSheet.create({
  container: {
    width: "90%",
    minHeight: 42,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  message: {
    flex: 1,
    color: textColors.white,
    fontWeight: "700",
    fontSize: 14,
    lineHeight: 24,
  },
  closeIcon: {
    width: 24,
    height: 24,
  },
});

export default ToastHost;
