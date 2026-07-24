import NetInfo, { NetInfoState } from "@react-native-community/netinfo";
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
  /** True when the API is reachable (includes slow network). */
  canUseApi: boolean;
  refresh: () => Promise<void>;
  dismissSlow: () => void;
};

const ConnectionContext = createContext<ConnectionContextValue | undefined>(
  undefined,
);

function isSlowNetwork(net: NetInfoState): boolean {
  if (!net.isConnected) return false;
  if (net.type === "cellular" && net.details && "cellularGeneration" in net.details) {
    const gen = net.details.cellularGeneration;
    return gen === "2g" || gen === "3g";
  }
  return false;
}

export function ConnectionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ConnectionState>("checking");
  const [message, setMessage] = useState("Checking connection...");
  const [slowDismissed, setSlowDismissed] = useState(false);

  const refresh = useCallback(async () => {
    setState("checking");
    setMessage("Checking connection...");

    const net = await NetInfo.fetch();
    if (!net.isConnected) {
      setSlowDismissed(false);
      setState("offline");
      setMessage("No internet connection. Reports will not upload until you are back online.");
      return;
    }

    const healthy = await checkServerHealth();
    if (!healthy) {
      setSlowDismissed(false);
      setState("server_down");
      setMessage(
        "Internet is available, but the FoundYourThing server is unreachable. Start the backend or update EXPO_PUBLIC_API_URL.",
      );
      return;
    }

    if (isSlowNetwork(net) && !slowDismissed) {
      setState("slow");
      setMessage("Your network looks slow. Uploads and matching may take longer than usual.");
      return;
    }

    setState("online");
    setMessage("Connected to campus server.");
  }, [slowDismissed]);

  const dismissSlow = useCallback(() => {
    setSlowDismissed(true);
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

  const canUseApi = state === "online" || state === "slow";

  const value = useMemo(
    () => ({ state, message, canUseApi, refresh, dismissSlow }),
    [state, message, canUseApi, refresh, dismissSlow],
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
