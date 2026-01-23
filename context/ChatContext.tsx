import { activeTripApiClient } from "@/config/apiConfig";
import {
  ACTIVE_TRIP_SOCKET_EVENTS
} from "@/constants/global";
import { useAuth } from "@/context/AuthContext";
import { useDriver } from "@/context/DriverContext";
import { useModalManager } from "@/context/ModalManagerContext";
import { useActiveTripSocket } from "@/hooks/useActiveTripSocket";
import { router } from "expo-router";
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
  loadCustomerInfo: (driverId: string) => Promise<{ name: string; phone: string } | null>;
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

  // No RN Modal registration needed when using a screen, but keep a central close entry
  // Note: closeChat is defined later, so we'll register it in a separate effect


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

        setState((prev) => {
          // Add new message and sort by timestamp to maintain order
          const updatedMessages = [...prev.messages, newMessage];
          updatedMessages.sort((a, b) => {
            const timeA = new Date(a.timestamp).getTime();
            const timeB = new Date(b.timestamp).getTime();
            return timeA - timeB; // Ascending order (oldest first)
          });
          return {
            ...prev,
            messages: updatedMessages,
          };
        });
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
    try {
      console.log("💬 Opening chat modal");

      // Get tripId first
      const { tripId } = await getTripId();

      // Load customer info if not already loaded
      let customerInfo = state.customerInfo;
      if (driverId && (!customerInfo?.phone || !customerInfo?.name || customerInfo.name === "Ryan Reynolds")) {
        const loadedInfo = await loadCustomerInfo(driverId);
        if (loadedInfo) {
          customerInfo = loadedInfo;
        }
      }

      // Validate customer info before proceeding
      if (!customerInfo?.name || customerInfo.name === "Ryan Reynolds") {
        console.warn("⚠️ Using default customer name - customer info not available");
        customerInfo = {
          name: "Customer",
          phone: customerInfo?.phone || "",
        };
      }

      // Set state first to open modal - wrap in try-catch for safety
      try {
        setState((prev) => ({
          ...prev,
          isOpen: true,
          isLoading: true,
          error: null,
          customerInfo, // Update with fetched customer info
        }));
        // Navigate to chat screen (full-screen modal presentation)
        router.push("/(screens)/chat");
      } catch (stateError: any) {
        console.error("❌ Error setting state:", stateError);
        throw new Error("Failed to initialize chat modal");
      }

      // Fetch message history
      try {

        if (tripId) {
          // Fetch message history directly using API client
          try {
            const response = await activeTripApiClient.get(
              `/active-trips/active-trips/messages/history/${tripId}`,
              {
                params: { page: 1, limit: 50 },
              }
            );

            const responseData = response.data as any;

            // Log the response for debugging
            console.log("💬 [Chat History] API Response:", JSON.stringify({
              success: responseData.success,
              hasMessages: !!responseData.messages,
              hasChatMessages: !!responseData.data?.chatMessages,
              messagesLength: Array.isArray(responseData.messages) ? responseData.messages.length : 'N/A',
              chatMessagesLength: Array.isArray(responseData.data?.chatMessages) ? responseData.data.chatMessages.length : 'N/A',
            }, null, 2));

            // Check multiple possible locations for messages (DB returns chatMessages, not messages)
            const messages = responseData.messages || responseData.data?.chatMessages || responseData.data?.messages || responseData.data?.message || [];

            if (responseData.success && Array.isArray(messages) && messages.length > 0) {
              // Transform API response to Message format
              // DB returns: chatMessagesRecId, message, senderEntity, sentAt
              const transformedMessages: Message[] = messages.map((msg: any) => {
                // Parse timestamp - DB returns "2026-01-12 13:32:14.000000" format
                let timestamp = msg.sentAt || msg.message_ts || msg.timestamp || msg.P_MESSAGE_TS || new Date().toISOString();

                // Convert DB timestamp format to ISO if needed
                if (typeof timestamp === 'string' && timestamp.includes(' ') && !timestamp.includes('T')) {
                  // Format: "2026-01-12 13:32:14.000000" -> "2026-01-12T13:32:14.000Z"
                  timestamp = timestamp.replace(' ', 'T').replace(/\.\d+$/, '') + 'Z';
                }

                return {
                  id: msg.chatMessagesRecId?.toString() || msg.message_rec_id?.toString() || msg.message_id?.toString() || `msg-${Date.now()}-${Math.random()}`,
                  text: msg.message || msg.message_text || msg.P_MESSAGE || '',
                  sender: msg.senderEntity === 'CUSTOMER' || msg.sender_entity === 'CUSTOMER' || msg.P_SENDER_ENTITY === 'CUSTOMER' ? 'customer' : 'driver',
                  timestamp: timestamp,
                  status: 'sent',
                };
              });

              // Sort messages by timestamp in ascending order (oldest first, newest at bottom)
              transformedMessages.sort((a, b) => {
                const timeA = new Date(a.timestamp).getTime();
                const timeB = new Date(b.timestamp).getTime();
                return timeA - timeB; // Ascending order (oldest first)
              });

              console.log(`💬 [Chat History] Transformed and sorted ${transformedMessages.length} messages (oldest to newest)`);
              setState((prev) => ({
                ...prev,
                messages: transformedMessages,
                isLoading: false,
                error: null,
              }));
            } else {
              console.log(`💬 [Chat History] No messages found or empty array. Response:`, {
                success: responseData.success,
                messagesCount: Array.isArray(messages) ? messages.length : 'not an array',
                checkedLocations: {
                  responseDataMessages: responseData.messages?.length || 0,
                  dataChatMessages: responseData.data?.chatMessages?.length || 0,
                  dataMessages: responseData.data?.messages?.length || 0,
                },
              });
              // No messages or empty response
              setState((prev) => ({
                ...prev,
                isLoading: false,
                messages: [],
                error: null,
              }));
            }
          } catch (fetchError: any) {
            console.error("❌ Failed to fetch message history:", fetchError);
            // Continue with empty messages - user can still send messages
            setState((prev) => ({
              ...prev,
              isLoading: false,
              messages: [],
              error: fetchError?.message || "Failed to load message history. You can still send messages.",
            }));
          }
        } else {
          // If no tripId, just open empty chat
          setState((prev) => ({
            ...prev,
            isLoading: false,
            messages: [],
          }));
        }
      } catch (error: any) {
        console.error("❌ Failed to fetch message history:", error);
        // Update state with error, but keep modal open so user can still send messages
        try {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error:
              error?.message ||
              "Failed to load message history. You can still send messages.",
            messages: [], // Start with empty messages
          }));
        } catch (stateError: any) {
          console.error("❌ Error updating state with error:", stateError);
          // If we can't update state, close modal
          setState((prev) => ({
            ...prev,
            isOpen: false,
            isLoading: false,
            error: null,
          }));
          throw new Error("Failed to handle error state");
        }
      }
    } catch (error: any) {
      console.error("❌ Critical error opening chat modal:", error);
      // If critical error, close modal and reset state safely
      try {
        setState((prev) => ({
          ...prev,
          isOpen: false,
          isLoading: false,
          error: null,
        }));
      } catch (stateError: any) {
        console.error("❌ Error resetting state:", stateError);
      }
      // Re-throw so caller can handle it
      throw new Error(
        error?.message || "Failed to open chat. Please try again."
      );
    }
  }, [getTripId, driverId, state.customerInfo]);

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
    try {
      if (router.canGoBack()) {
        router.back();
      } else {
        // If no previous screen, navigate to home tabs
        router.replace("/(tabs)");
      }
    } catch (error) {
      // Fallback to home if navigation fails
      try {
        router.replace("/(tabs)");
      } catch { }
    }
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

      // Add message to UI immediately and maintain sort order
      setState((prev) => {
        const updatedMessages = [...prev.messages, newMessage];
        // Sort by timestamp to maintain chronological order
        updatedMessages.sort((a, b) => {
          const timeA = new Date(a.timestamp).getTime();
          const timeB = new Date(b.timestamp).getTime();
          return timeA - timeB; // Ascending order (oldest first)
        });
        return {
          ...prev,
          messages: updatedMessages,
          isSending: true,
          error: null,
        };
      });

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

  // Load customer info from active trip
  const loadCustomerInfo = useCallback(async (driverIdParam: string): Promise<{ name: string; phone: string } | null> => {
    try {
      // Skip if already loaded and not default values
      const currentInfo = state.customerInfo;
      if (currentInfo?.name && currentInfo.name !== "Ryan Reynolds" && currentInfo.name !== "Customer") {
        console.log("💬 Customer info already loaded, skipping fetch");
        return currentInfo;
      }

      console.log("💬 Loading customer info from active trip...");
      const activeTripResponse = await activeTripApiClient.get(
        `/active-trips/active-trips/retrieval-id/${driverIdParam}`
      );

      const activeTripData = activeTripResponse.data as any;
      if (activeTripData?.activeTrip) {
        const activeTrip = activeTripData.activeTrip;
        const customerId = activeTrip.customerId;

        // Extract customer_rec_id from customerId (e.g., "c-1" -> 1)
        let customerRecId: number | null = null;
        if (customerId) {
          // Try to extract numeric ID from customerId
          if (customerId.startsWith('c-')) {
            const match = customerId.match(/\d+$/);
            if (match) {
              customerRecId = parseInt(match[0], 10);
            }
          } else if (!isNaN(Number(customerId))) {
            customerRecId = parseInt(customerId, 10);
          }
        }

        let customerInfo: { name: string; phone: string } | null = null;

        // If we have customer_rec_id, fetch customer details from API
        if (customerRecId) {
          try {
            console.log(`💬 Fetching customer details for customer_rec_id: ${customerRecId}`);
            const customerResponse = await activeTripApiClient.get(
              `/active-trips/active-trips/customer/${customerRecId}`
            );

            const customerData = customerResponse.data as any;
            if (customerData?.success && customerData?.customer) {
              const customer = customerData.customer;
              const customerName = customer.name || "Customer";
              const customerPhone = customer.phone || "";

              if (customerName && customerName !== "Customer") {
                customerInfo = {
                  name: customerName,
                  phone: customerPhone,
                };
                console.log("💬 Customer info fetched from API:", customerInfo);
              }
            }
          } catch (apiError: any) {
            console.warn("⚠️ Failed to fetch customer details from API:", apiError);
          }
        }

        // Fallback: Try to get customer info directly from active trip if DB fetch failed
        if (!customerInfo || customerInfo.name === "Customer") {
          const customerName =
            activeTrip.customer?.name ||
            activeTrip.customerName ||
            activeTrip.customer_name ||
            activeTrip.customerDetails?.name ||
            "Customer";

          const customerPhone =
            activeTrip.customer?.phone ||
            activeTrip.customerPhone ||
            activeTrip.customer_phone ||
            activeTrip.customerDetails?.phone ||
            "";

          if (customerName && customerName !== "Customer") {
            customerInfo = {
              name: customerName,
              phone: customerPhone,
            };
            console.log("💬 Customer info fetched from active trip:", customerInfo);
          }
        }

        // Update state with customer info if we got it
        if (customerInfo && customerInfo.name !== "Customer") {
          setState((prev) => ({
            ...prev,
            customerInfo,
          }));
          return customerInfo;
        }
      }
      return null;
    } catch (fetchError: any) {
      console.warn("⚠️ Failed to fetch customer info from active trip:", fetchError);
      return null;
    }
  }, [state.customerInfo]);

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
      loadCustomerInfo,
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
      loadCustomerInfo,
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
