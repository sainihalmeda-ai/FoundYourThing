import React from "react";
import { COLORS } from "../../constants/config";
import { StateAction, StateView } from "./StateView";

type Props = {
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  compact?: boolean;
};

export function SuccessState({
  title = "All set",
  message = "Your action completed successfully.",
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
  compact,
}: Props) {
  const actions: StateAction[] = [];
  if (actionLabel && onAction) {
    actions.push({ label: actionLabel, onPress: onAction });
  }
  if (secondaryLabel && onSecondary) {
    actions.push({
      label: secondaryLabel,
      onPress: onSecondary,
      variant: "secondary",
    });
  }

  return (
    <StateView
      icon="checkmark-circle"
      iconColor={COLORS.success}
      iconBg="rgba(59,185,116,0.14)"
      title={title}
      message={message}
      actions={actions}
      compact={compact}
      pulse
    />
  );
}
