import React from "react";
import { COLORS } from "../../constants/config";
import { StateAction, StateView } from "./StateView";

type Props = {
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
};

export function EmptyState({
  title = "Nothing here yet",
  message = "When something appears, it will show up in this list.",
  actionLabel,
  onAction,
  compact,
}: Props) {
  const actions: StateAction[] = [];
  if (actionLabel && onAction) {
    actions.push({ label: actionLabel, onPress: onAction });
  }

  return (
    <StateView
      icon="file-tray-outline"
      iconColor={COLORS.accent}
      iconBg={COLORS.card}
      title={title}
      message={message}
      actions={actions}
      compact={compact}
    />
  );
}
