import Typography from "@/components/Typography";
import { textColors } from "@/constants/colors";
import React, { createContext, useContext, useEffect, useState } from "react";
import {
  Image,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Toast } from "toastify-react-native";

export type ToastVariant = "success" | "warning" | "error";
export type ToastPosition = "top" | "bottom";

type ToastContentProps = {
  text1?: string;
  hide?: () => void;
  variant: ToastVariant;
};

type ToastState = {
  visible: boolean;
  message: string;
  variant: ToastVariant;
  position: ToastPosition;
};

type ToastContextType = {
  showToast: (
    message: string,
    variant?: ToastVariant,
    position?: ToastPosition
  ) => void;
  hideToast: () => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

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

// Custom Toast Modal Component
const ToastModal: React.FC<{
  visible: boolean;
  message: string;
  variant: ToastVariant;
  position: ToastPosition;
  onHide: () => void;
}> = ({ visible, message, variant, position, onHide }) => {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        onHide();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [visible, onHide]);

  const getPositionStyle = () => {
    if (position === "top") {
      return {
        top: Math.round(height * 0.01) + (insets?.top ?? 0),
      };
    } else {
      return {
        bottom: Math.round(height * 0.01) + (insets?.bottom ?? 0),
      };
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onHide}
    >
      <View style={[styles.modalOverlay, getPositionStyle()]}>
        <ToastContent text1={message} variant={variant} hide={onHide} />
      </View>
    </Modal>
  );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toastState, setToastState] = useState<ToastState>({
    visible: false,
    message: "",
    variant: "success",
    position: "top",
  });

  const showToast = (
    message: string,
    variant: ToastVariant = "success",
    position: ToastPosition = "top"
  ) => {
    setToastState({
      visible: true,
      message,
      variant,
      position,
    });
  };

  const hideToast = () => {
    setToastState((prev) => ({ ...prev, visible: false }));
  };

  const contextValue: ToastContextType = {
    showToast,
    hideToast,
  };

  // Set global context for backward compatibility
  useEffect(() => {
    setGlobalToastContext(contextValue);
    return () => {
      setGlobalToastContext(null as any);
    };
  }, [contextValue]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastModal
        visible={toastState.visible}
        message={toastState.message}
        variant={toastState.variant}
        position={toastState.position}
        onHide={hideToast}
      />
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export const ToastHost: React.FC = () => {
  return null; // This component is no longer needed with the new implementation
};

// Global toast instance for backward compatibility
let globalToastContext: ToastContextType | null = null;

export function setGlobalToastContext(context: ToastContextType) {
  globalToastContext = context;
}

export function showToast(
  message: string,
  options?: {
    variant?: ToastVariant;
    position?: ToastPosition;
  }
) {
  const { variant = "success", position = "top" } = options || {};

  // Use the global toast context if available
  if (globalToastContext) {
    globalToastContext.showToast(message, variant, position);
  } else {
    // Fallback to the original implementation
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
}

const styles = StyleSheet.create({
  modalOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 999999,
    elevation: 999999,
  },
  container: {
    width: "90%",
    minHeight: 42,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 100000,
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
