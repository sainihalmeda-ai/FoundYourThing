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
  title = "No internet",
  message = "You’re offline. Check Wi‑Fi or mobile data, then try again. Reports won’t upload until you’re back online.",
  onRetry,
  compact,
}: Props) {
  const actions: StateAction[] = [];
  if (onRetry) {
    actions.push({ label: "Try again", onPress: onRetry });
  }

  return (
    <StateView
      icon="⌀"
      iconColor="#fff"
      iconBg={COLORS.offline}
      title={title}
      message={message}
      hint="Airplane mode, weak signal, or captive Wi‑Fi portals are common causes."
      actions={actions}
      compact={compact}
    />
  );
}
