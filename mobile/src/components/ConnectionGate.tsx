import React from "react";
import { useConnection } from "../context/ConnectionContext";
import { OfflineState } from "./states/OfflineState";
import { SlowNetworkState } from "./states/SlowNetworkState";

type Props = {
  children: React.ReactNode;
  /** When true, show a full-page slow network screen instead of a banner only. */
  blockOnSlow?: boolean;
};

/**
 * Gates children behind connectivity. Shows dedicated offline / slow pages.
 */
export function ConnectionGate({ children, blockOnSlow = false }: Props) {
  const { state, refresh, dismissSlow } = useConnection();

  if (state === "offline") {
    return <OfflineState onRetry={refresh} />;
  }

  if (blockOnSlow && state === "slow") {
    return (
      <SlowNetworkState onRetry={refresh} onContinue={dismissSlow} />
    );
  }

  return <>{children}</>;
}
