import { NotificationType } from "@/constants/global";
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
} from "react";

export interface NotificationData {
  type: NotificationType;
  title: string;
  subtitle?: string;
  message: string;
  modal?: boolean;
  autoHide?: boolean;
}

interface NotificationState {
  isOpen: boolean;
  data: NotificationData | null;
}

type NotificationAction =
  | { type: "OPEN"; payload: NotificationData }
  | { type: "CLOSE" };

const initialState: NotificationState = {
  isOpen: false,
  data: null,
};

function notificationReducer(
  state: NotificationState,
  action: NotificationAction
): NotificationState {
  switch (action.type) {
    case "OPEN":
      return { isOpen: true, data: action.payload };
    case "CLOSE":
      return { isOpen: false, data: null };
    default:
      return state;
  }
}

type NotificationContextValue = {
  isOpen: boolean;
  data: NotificationData | null;
  showNotification: (data: NotificationData) => void;
  hideNotification: () => void;
};

const NotificationContext = createContext<NotificationContextValue | undefined>(
  undefined
);

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, dispatch] = useReducer(notificationReducer, initialState);

  const showNotification = useCallback((data: NotificationData) => {
    dispatch({ type: "OPEN", payload: data });
  }, []);

  const hideNotification = useCallback(() => {
    dispatch({ type: "CLOSE" });
  }, []);

  const contextValue = useMemo<NotificationContextValue>(
    () => ({
      isOpen: state.isOpen,
      data: state.data,
      showNotification,
      hideNotification,
    }),
    [state.isOpen, state.data, showNotification, hideNotification]
  );

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return ctx;
}
