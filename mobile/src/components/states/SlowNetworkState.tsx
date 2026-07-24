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
  title = "Slow network",
  message = "Your connection is taking longer than usual. Requests may time out or feel delayed.",
  onRetry,
  onContinue,
  compact,
}: Props) {
  const actions: StateAction[] = [];
  if (onRetry) {
    actions.push({ label: "Retry", onPress: onRetry });
  }
  if (onContinue) {
    actions.push({ label: "Continue anyway", onPress: onContinue, variant: "secondary" });
  }

  return (
    <StateView
      icon="…"
      iconColor={COLORS.warning}
      iconBg="#FFF4D6"
      title={title}
      message={message}
      hint="Switch to a stronger Wi‑Fi network or move somewhere with better signal."
      actions={actions}
      compact={compact}
    />
  );
}
