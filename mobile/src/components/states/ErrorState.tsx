import React from "react";
import { ApiError } from "../../types";
import { COLORS } from "../../constants/config";
import { StateAction, StateView } from "./StateView";
import { OfflineState } from "./OfflineState";
import { SlowNetworkState } from "./SlowNetworkState";
import { SessionExpiredState } from "./SessionExpiredState";

type Props = {
  error: unknown;
  onRetry?: () => void;
  onSignIn?: () => void;
  compact?: boolean;
};

function getMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong.";
}

function getHint(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.kind === "server") {
      return "Backend error — verify Python server logs.";
    }
    if (error.kind === "validation") {
      return "Check the details you entered and try again.";
    }
  }
  return "If this keeps happening, restart the app and backend.";
}

export function ErrorState({ error, onRetry, onSignIn, compact }: Props) {
  if (error instanceof ApiError) {
    if (error.kind === "offline") {
      return <OfflineState onRetry={onRetry} compact={compact} />;
    }
    if (error.kind === "timeout") {
      return <SlowNetworkState onRetry={onRetry} compact={compact} />;
    }
    if (error.kind === "unauthorized") {
      return <SessionExpiredState onSignIn={onSignIn} compact={compact} />;
    }
  }

  const actions: StateAction[] = [];
  if (onRetry) {
    actions.push({ label: "Retry", onPress: onRetry });
  }

  return (
    <StateView
      icon="!"
      iconColor={COLORS.danger}
      iconBg="#FCE8E8"
      title="Could not complete request"
      message={getMessage(error)}
      hint={getHint(error)}
      actions={actions}
      compact={compact}
    />
  );
}
