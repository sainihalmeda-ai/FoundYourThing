import React from "react";
import { COLORS } from "../../constants/config";
import { StateAction, StateView } from "./StateView";

type Props = {
  title?: string;
  message?: string;
  onRetry?: () => void;
  onContinue?: () => void;
  compact?: boolean;
};

export function SlowNetworkState({
  title = "Connection is slow",
  message = "Your network is taking longer than usual. Requests may time out or feel delayed.",
  onRetry,
  onContinue,
  compact,
}: Props) {
  const actions: StateAction[] = [];
  if (onRetry) {
    actions.push({ label: "Retry", onPress: onRetry });
  }
  if (onContinue) {
    actions.push({
      label: "Continue anyway",
      onPress: onContinue,
      variant: "secondary",
    });
  }

  return (
    <StateView
      icon="hourglass-outline"
      iconColor="#A9791B"
      iconBg="rgba(235,189,87,0.22)"
      title={title}
      message={message}
      hint="Switch to a stronger Wi‑Fi network or move somewhere with better signal."
      actions={actions}
      compact={compact}
      pulse
    />
  );
}
