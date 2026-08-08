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

function getTitle(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.kind === "server") return "Server hiccup";
    if (error.kind === "validation") return "Check those details";
  }
  return "Something went wrong";
}

function getMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "We couldn’t finish that. Give it another try in a moment.";
}

function getHint(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.kind === "server") {
      return "The campus backend replied with an error. Retry once, then check the server if it persists.";
    }
    if (error.kind === "validation") {
      return "Fix the highlighted fields and submit again.";
    }
  }
  return "A quick retry usually clears this. If not, reload the app.";
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
    actions.push({ label: "Try again", onPress: onRetry });
  }

  return (
    <StateView
      icon="alert-circle-outline"
      iconColor={COLORS.danger}
      iconBg="rgba(238,52,59,0.12)"
      title={getTitle(error)}
      message={getMessage(error)}
      hint={getHint(error)}
      actions={actions}
      compact={compact}
    />
  );
}
