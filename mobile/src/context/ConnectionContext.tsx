import NetInfo from "@react-native-community/netinfo";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { checkServerHealth } from "../api/client";
import type { ConnectionState } from "../types";

type ConnectionContextValue = {
  state: ConnectionState;
  message: string;
  refresh: () => Promise<void>;
};

const ConnectionContext = createContext<ConnectionContextValue | undefined>(
  undefined,
);

export function ConnectionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ConnectionState>("checking");
  const [message, setMessage] = useState("Checking connection...");

  const refresh = useCallback(async () => {
    setState("checking");
    setMessage("Checking connection...");

    const net = await NetInfo.fetch();
    if (!net.isConnected) {
      setState("offline");
      setMessage("No internet connection. Reports will not upload until you are back online.");
      return;
    }

    const healthy = await checkServerHealth();
    if (!healthy) {
      setState("server_down");
      setMessage(
        "Internet is available, but the FoundYourThing server is unreachable. Start the backend or update EXPO_PUBLIC_API_URL.",
      );
      return;
    }

    setState("online");
    setMessage("Connected to campus server.");
  }, []);

  useEffect(() => {
    refresh();
    const unsubscribe = NetInfo.addEventListener(() => {
      refresh();
    });
    const interval = setInterval(refresh, 30000);
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [refresh]);

  const value = useMemo(
    () => ({ state, message, refresh }),
    [state, message, refresh],
  );

  return (
    <ConnectionContext.Provider value={value}>{children}</ConnectionContext.Provider>
  );
}

export function useConnection() {
  const context = useContext(ConnectionContext);
  if (!context) {
    throw new Error("useConnection must be used within ConnectionProvider");
  }
  return context;
}
