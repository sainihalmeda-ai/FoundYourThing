import React from "react";
import { COLORS } from "../../constants/config";
import { StateAction, StateView } from "./StateView";

type Props = {
  title?: string;
  message?: string;
  onRetry?: () => void;
  compact?: boolean;
};

export function OfflineState({
  title = "You’re offline",
  message = "No connection to the campus server. Check Wi‑Fi or mobile data — reports won’t upload until you’re back online.",
  onRetry,
  compact,
}: Props) {
  const actions: StateAction[] = [];
  if (onRetry) {
    actions.push({ label: "Try again", onPress: onRetry });
  }

  return (
    <StateView
      icon="cloud-offline-outline"
      iconColor={COLORS.primaryForeground}
      iconBg={COLORS.offline}
      title={title}
      message={message}
      hint="Airplane mode, weak signal, or a captive Wi‑Fi login page are the usual culprits."
      actions={actions}
      compact={compact}
      pulse
    />
  );
}
