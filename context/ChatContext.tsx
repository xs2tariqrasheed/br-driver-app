import {
  ACTIVE_TRIP_SOCKET_EVENTS,
  API_CLIENT_TYPES,
} from "@/constants/global";
import { useAuth } from "@/context/AuthContext";
import { useDriver } from "@/context/DriverContext";
import { useModalManager } from "@/context/ModalManagerContext";
import { useActiveTripSocket } from "@/hooks/useActiveTripSocket";
import { useFetch } from "@/hooks/useFetch";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export interface Message {
  id: string;
  text: string;
  sender: "driver" | "customer";
  timestamp: string;
  status?: "sending" | "sent" | "delivered" | "failed";
}

interface ChatState {
  isOpen: boolean;
  messages: Message[];
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
  customerInfo: {
    name: string;
    phone: string;
  };
}

interface ChatContextValue {
  // State
  isOpen: boolean;
  messages: Message[];
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
  customerInfo: { name: string; phone: string };

  // Actions
  openChat: () => void;
  closeChat: () => void;
  sendMessage: (text: string) => void;
  clearError: () => void;
}

const initialState: ChatState = {
  isOpen: false,
  messages: [],
  isLoading: false,
  isSending: false,
  error: null,
  customerInfo: {
    name: "Ryan Reynolds",
    phone: "1234567890",
  },
};

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ChatState>(initialState);
  const { registerModal, unregisterModal } = useModalManager();
  const { getTripId } = useDriver();
  const [auth] = useAuth();
  const driverId = auth?.user?.id;

  const { onActiveTripEvent, emitActiveTripEvent } = useActiveTripSocket();

  // Fetch message history
  const {
    data: messageHistory,
    loading: historyLoading,
    error: historyError,
    execute: fetchMessageHistory,
  } = useFetch<Message[]>(
    state.isOpen ? `/messages/history/${state.customerInfo.phone}` : "",
    API_CLIENT_TYPES.ACTIVE_TRIP
  );

  // Register modal with ModalManager
  useEffect(() => {
    registerModal("chatModal", closeChat);
    return () => unregisterModal("chatModal");
  }, [registerModal, unregisterModal]);

  // Handle message history fetch
  useEffect(() => {
    if (state.isOpen && !historyLoading && messageHistory) {
      setState((prev) => ({
        ...prev,
        messages: messageHistory,
        isLoading: false,
        error: null,
      }));
    }
  }, [messageHistory, historyLoading, state.isOpen]);

  // Handle history fetch error
  useEffect(() => {
    if (state.isOpen && historyError) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: "Failed to load message history",
      }));
    }
  }, [historyError, state.isOpen]);

  // Socket event listeners
  useEffect(() => {
    if (!state.isOpen) return;

    // Listen for new messages
    const cleanupNewMessage = onActiveTripEvent(
      ACTIVE_TRIP_SOCKET_EVENTS.NEW_MESSAGE,
      (data: any) => {
        console.log("💬 New message received in chat:", data);

        const newMessage: Message = {
          id: `msg-${Date.now()}-${Math.random()}`,
          text: data.message || "New message",
          sender: "customer",
          timestamp: new Date(data.ts || Date.now()).toISOString(),
          status: "sent",
        };

        setState((prev) => ({
          ...prev,
          messages: [...prev.messages, newMessage],
        }));
      }
    );

    // Listen for error events to handle message sending failures
    const cleanupError = onActiveTripEvent("error", (data: any) => {
      console.log("💬 Error event received:", data);

      // Check if this error is related to message sending
      if (data.type === "message" || data.messageId) {
        setState((prev) => ({
          ...prev,
          messages: prev.messages.map((msg) =>
            msg.status === "sending" ? { ...msg, status: "failed" } : msg
          ),
          isSending: false,
          error: data.message || "Failed to send message",
        }));
      }
    });

    return () => {
      cleanupNewMessage();
      cleanupError();
    };
  }, [state.isOpen, onActiveTripEvent]);

  const openChat = useCallback(async () => {
    console.log("💬 Opening chat modal");

    setState((prev) => ({
      ...prev,
      isOpen: true,
      isLoading: true,
      error: null,
    }));

    // Fetch message history
    try {
      await fetchMessageHistory();
    } catch (error) {
      console.error("❌ Failed to fetch message history:", error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: "Failed to load message history",
      }));
    }
  }, [fetchMessageHistory]);

  const closeChat = useCallback(() => {
    console.log("💬 Closing chat modal");

    setState((prev) => ({
      ...prev,
      isOpen: false,
      messages: [],
      isLoading: false,
      isSending: false,
      error: null,
    }));
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || state.isSending || !driverId) return;

      const { tripId } = await getTripId();
      if (!tripId) {
        setState((prev) => ({
          ...prev,
          error: "No active trip found",
        }));
        return;
      }

      const newMessage: Message = {
        id: `msg-${Date.now()}-${Math.random()}`,
        text: text.trim(),
        sender: "driver",
        timestamp: new Date().toISOString(),
        status: "sending",
      };

      // Add message to UI immediately
      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, newMessage],
        isSending: true,
        error: null,
      }));

      // Emit socket event
      try {
        const messagePayload = {
          tripId,
          userId: driverId, // Backend expects userId, not driverId
          message: text.trim(),
          timestamp: newMessage.timestamp,
        };
        console.log("💬 Message payload:", JSON.stringify(messagePayload));
        // Send as object, not stringified
        emitActiveTripEvent(
          ACTIVE_TRIP_SOCKET_EVENTS.SEND_MESSAGE,
          JSON.stringify(messagePayload)
        );

        // Mark message as delivered after 2 seconds
        setTimeout(() => {
          setState((prev) => {
            // Only update if still sending and this is the last message
            const lastMessage = prev.messages[prev.messages.length - 1];
            if (
              lastMessage &&
              lastMessage.status === "sending" &&
              lastMessage.id === newMessage.id
            ) {
              return {
                ...prev,
                messages: prev.messages.map((msg) =>
                  msg.id === newMessage.id
                    ? { ...msg, status: "delivered" }
                    : msg
                ),
                isSending: false,
              };
            }
            return prev;
          });
        }, 2000); // 2 second delay to mark as delivered
      } catch (error) {
        console.error("❌ Failed to send message:", error);
        setState((prev) => ({
          ...prev,
          messages: prev.messages.map((msg, index) =>
            index === prev.messages.length - 1 && msg.status === "sending"
              ? { ...msg, status: "failed" }
              : msg
          ),
          isSending: false,
          error: "Failed to send message",
        }));
      }
    },
    [state.isSending, driverId, getTripId, emitActiveTripEvent]
  );

  const clearError = useCallback(() => {
    setState((prev) => ({
      ...prev,
      error: null,
    }));
  }, []);

  const contextValue = useMemo<ChatContextValue>(
    () => ({
      isOpen: state.isOpen,
      messages: state.messages,
      isLoading: state.isLoading,
      isSending: state.isSending,
      error: state.error,
      customerInfo: state.customerInfo,
      openChat,
      closeChat,
      sendMessage,
      clearError,
    }),
    [
      state.isOpen,
      state.messages,
      state.isLoading,
      state.isSending,
      state.error,
      state.customerInfo,
      openChat,
      closeChat,
      sendMessage,
      clearError,
    ]
  );

  return (
    <ChatContext.Provider value={contextValue}>{children}</ChatContext.Provider>
  );
}

export function useChat(): ChatContextValue {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
