import React from "react";
import { COLORS } from "../../constants/config";
import { StateAction, StateView } from "./StateView";
import { useAuth } from "../../context/AuthContext";

type Props = {
  title?: string;
  message?: string;
  onSignIn?: () => void;
  compact?: boolean;
};

export function SessionExpiredState({
  title = "Session expired",
  message = "Your login ended for security. Sign in again to keep browsing campus reports.",
  onSignIn,
  compact,
}: Props) {
  const { logout } = useAuth();

  const handleSignIn = async () => {
    if (onSignIn) {
      onSignIn();
      return;
    }
    await logout();
  };

  const actions: StateAction[] = [
    { label: "Sign in again", onPress: handleSignIn },
  ];

  return (
    <StateView
      icon="lock-closed-outline"
      iconColor="#A9791B"
      iconBg="rgba(235,189,87,0.22)"
      title={title}
      message={message}
      hint="This happens after idle time, or when the server rejects an old token."
      actions={actions}
      compact={compact}
    />
  );
}
