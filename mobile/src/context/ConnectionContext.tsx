import NetInfo, { NetInfoState } from "@react-native-community/netinfo";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { checkServerHealth } from "../api/client";
import type { ConnectionState } from "../types";

type RefreshOpts = { coldStart?: boolean };

type ConnectionContextValue = {
  state: ConnectionState;
  message: string;
  /** True when the API is reachable (includes slow network). */
  canUseApi: boolean;
  refresh: (opts?: RefreshOpts) => Promise<void>;
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
  /** First open / after failure should wait for Render cold start. */
  const preferColdStart = useRef(true);

  const refresh = useCallback(async (opts?: RefreshOpts) => {
    const coldStart = opts?.coldStart ?? preferColdStart.current;
    setState("checking");
    setMessage(
      coldStart
        ? "Waking campus server… first open after idle can take up to a minute."
        : "Checking connection...",
    );

    const net = await NetInfo.fetch();
    if (!net.isConnected) {
      setSlowDismissed(false);
      preferColdStart.current = true;
      setState("offline");
      setMessage("No internet connection. Reports will not upload until you are back online.");
      return;
    }

    const healthy = await checkServerHealth(undefined, { coldStart });
    if (!healthy) {
      setSlowDismissed(false);
      preferColdStart.current = true;
      setState("server_down");
      setMessage(
        "Campus server is not responding yet. Wait a moment and tap Retry — free hosting sleeps when idle.",
      );
      return;
    }

    preferColdStart.current = false;

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
    void refresh({ coldStart: true });
    const unsubscribe = NetInfo.addEventListener(() => {
      void refresh({ coldStart: false });
    });
    const interval = setInterval(() => {
      void refresh({ coldStart: false });
    }, 45000);
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
    // Mount-only: avoid re-subscribing when refresh identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Allow login/report while the first health probe is still waking Render.
  const canUseApi =
    state === "online" || state === "slow" || state === "checking";

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
