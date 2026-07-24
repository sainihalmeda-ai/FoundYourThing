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
  message = "Your login session ended for security. Sign in again to keep browsing campus reports.",
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
      icon="◎"
      iconColor={COLORS.warning}
      iconBg="#FFF4D6"
      title={title}
      message={message}
      hint="This happens after long idle time or when the server rejects your token."
      actions={actions}
      compact={compact}
    />
  );
}
