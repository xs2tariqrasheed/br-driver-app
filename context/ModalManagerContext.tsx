import { createContext, ReactNode, useContext, useRef } from "react";
import { Platform } from "react-native";

interface ModalManagerContextType {
  /**
   * Request permission to open a modal by name. On iOS, only one modal can be
   * active at a time; additional requests will be queued by priority. The
   * returned promise resolves when the caller is allowed to open (i.e., becomes
   * the active slot). Callers should then render their modal and later call
   * requestClose(name) when they actually close it.
   */
  requestOpen: (args: {
    name: string;
    priority?: number;
    group?: string; // Used to treat related modals as a single flow
  }) => Promise<void>;

  /**
   * Signal that a modal has closed. If it was the active modal, the next item
   * in the queue (if any) will be granted permission to open.
   */
  requestClose: (name?: string) => void;

  /** Close all registered modals immediately and clear queue/state. */
  closeAllModals: () => void;

  /** Register/unregister close functions for programmatic closes (e.g., preemptions). */
  registerModal: (name: string, closeFunction: () => void) => void;
  unregisterModal: (name: string) => void;
}

const ModalManagerContext = createContext<ModalManagerContextType | undefined>(
  undefined
);

export function ModalManagerProvider({ children }: { children: ReactNode }) {
  const modalRefs = useRef<Map<string, () => void>>(new Map());
  const activeModalNameRef = useRef<string | null>(null);
  const activeGroupRef = useRef<string | undefined>(undefined);
  const lastGrantTimestampRef = useRef<number>(0);
  const lastRequestRef = useRef<Map<string, number>>(new Map());

  type QueuedRequest = {
    name: string;
    priority: number;
    group?: string;
    resolve: () => void;
    reject: (error?: unknown) => void;
  };
  const queueRef = useRef<QueuedRequest[]>([]);

  const getIsIOS = () => Platform.OS === "ios";

  const grantNextFromQueue = () => {
    const queue = queueRef.current;
    if (queue.length === 0) {
      activeModalNameRef.current = null;
      activeGroupRef.current = undefined;
      return;
    }
    // Pick highest-priority request (stable: first among equals)
    let maxIdx = 0;
    for (let i = 1; i < queue.length; i++) {
      if (queue[i].priority > queue[maxIdx].priority) {
        maxIdx = i;
      }
    }
    const [next] = queue.splice(maxIdx, 1);
    activeModalNameRef.current = next.name;
    activeGroupRef.current = next.group;
    try {
      next.resolve();
    } catch {
      // No-op; caller promise handlers should be resilient
    }
  };

  const requestOpen: ModalManagerContextType["requestOpen"] = ({
    name,
    priority = 0,
    group,
  }) => {
    return new Promise<void>((resolve, reject) => {
      const key = `${group || "_"}:${name}`;
      // Debounce duplicate open requests within 200ms
      const now = Date.now();
      const lastAt = lastRequestRef.current.get(key) || 0;
      if (now - lastAt < 200) {
        // If already active or queued, just noop-resolve to prevent flicker
        if (
          activeModalNameRef.current === name ||
          queueRef.current.some((q) => q.name === name && q.group === group)
        ) {
          resolve();
          return;
        }
      }
      lastRequestRef.current.set(key, now);

      const isIOS = getIsIOS();
      const activeName = activeModalNameRef.current;
      const activeGroup = activeGroupRef.current;

      // Idempotent: if this modal is already active, resolve immediately
      if (activeName === name) {
        resolve();
        return;
      }

      // On iOS (and optionally everywhere for consistency), serialize
      if (isIOS) {
        if (activeName) {
          // If same flow group, allow immediate (swap within flow)
          if (group && activeGroup && group === activeGroup) {
            activeModalNameRef.current = name;
            resolve();
            return;
          }
          // Otherwise, enqueue by priority
          queueRef.current.push({ name, priority, group, resolve, reject });
          return;
        }
        // No active modal, grant immediately
        activeModalNameRef.current = name;
        activeGroupRef.current = group;
        resolve();
        return;
      }

      // Non-iOS: keep behavior consistent by default (serialize similarly)
      if (activeName) {
        if (group && activeGroup && group === activeGroup) {
          activeModalNameRef.current = name;
          resolve();
          return;
        }
        queueRef.current.push({ name, priority, group, resolve, reject });
        return;
      }
      activeModalNameRef.current = name;
      activeGroupRef.current = group;
      resolve();
    });
  };

  const requestClose: ModalManagerContextType["requestClose"] = (name) => {
    const activeName = activeModalNameRef.current;
    // Only the active modal can advance the queue
    if (!activeName) return;
    if (name && name !== activeName) return;
    // Clear active and grant next
    activeModalNameRef.current = null;
    activeGroupRef.current = undefined;
    lastGrantTimestampRef.current = Date.now();
    grantNextFromQueue();
  };

  const registerModal = (name: string, closeFunction: () => void) => {
    modalRefs.current.set(name, closeFunction);
  };

  const unregisterModal = (name: string) => {
    modalRefs.current.delete(name);
  };

  const closeAllModals = () => {
    console.log("🔽 Closing all registered modals");
    modalRefs.current.forEach((closeFunction, name) => {
      try {
        console.log(`🔽 Closing modal: ${name}`);
        closeFunction();
      } catch (error) {
        console.error(`❌ Error closing modal ${name}:`, error);
      }
    });
    // Reset orchestrator state
    activeModalNameRef.current = null;
    activeGroupRef.current = undefined;
    // Reject any queued requests to avoid dangling promises
    const queued = queueRef.current.splice(0, queueRef.current.length);
    queued.forEach((q) => q.reject(new Error("Closed all modals")));
  };

  const value: ModalManagerContextType = {
    requestOpen,
    requestClose,
    closeAllModals,
    registerModal,
    unregisterModal,
  };

  // Development watchdog for stuck active modal (>30s without close)
  if (process.env.NODE_ENV !== "production") {
    if (activeModalNameRef.current) {
      const since = Date.now() - lastGrantTimestampRef.current;
      if (since > 30000) {
        console.warn(
          `⏱️ ModalManager watchdog: Active modal '${activeModalNameRef.current}' held for ${since}ms. Consider calling requestClose.`
        );
        lastGrantTimestampRef.current = Date.now();
      }
    }
  }

  return (
    <ModalManagerContext.Provider value={value}>
      {children}
    </ModalManagerContext.Provider>
  );
}

export function useModalManager(): ModalManagerContextType {
  const context = useContext(ModalManagerContext);
  if (context === undefined) {
    throw new Error(
      "useModalManager must be used within a ModalManagerProvider"
    );
  }
  return context;
}
