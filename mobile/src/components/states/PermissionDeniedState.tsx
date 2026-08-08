import React from "react";
import { COLORS } from "../../constants/config";
import { StateAction, StateView } from "./StateView";

type Props = {
  title?: string;
  message?: string;
  permissionName?: string;
  onOpenSettings?: () => void;
  onRetry?: () => void;
  compact?: boolean;
};

export function PermissionDeniedState({
  title = "Permission needed",
  message,
  permissionName = "this feature",
  onOpenSettings,
  onRetry,
  compact,
}: Props) {
  const actions: StateAction[] = [];
  if (onRetry) {
    actions.push({ label: "Allow access", onPress: onRetry });
  }
  if (onOpenSettings) {
    actions.push({
      label: "Open settings",
      onPress: onOpenSettings,
      variant: "secondary",
    });
  }

  return (
    <StateView
      icon="shield-outline"
      iconColor={COLORS.danger}
      iconBg="rgba(238,52,59,0.12)"
      title={title}
      message={
        message ??
        `Access to ${permissionName} was denied. Enable it to continue using this part of FoundYourThing.`
      }
      hint="You can change this anytime in your device settings."
      actions={actions}
      compact={compact}
    />
  );
}
