import React from "react";
import { COLORS } from "../../constants/config";
import { StateAction, StateView } from "./StateView";

type Props = {
  query?: string;
  title?: string;
  message?: string;
  onClear?: () => void;
  compact?: boolean;
};

export function NoSearchResultsState({
  query,
  title = "No matches",
  message,
  onClear,
  compact,
}: Props) {
  const actions: StateAction[] = [];
  if (onClear) {
    actions.push({ label: "Clear search", onPress: onClear, variant: "secondary" });
  }

  return (
    <StateView
      icon="search-outline"
      iconColor={COLORS.primary}
      iconBg="rgba(15,39,80,0.08)"
      title={title}
      message={
        message ??
        (query
          ? `Nothing matched “${query}”. Try a different title, location, or category.`
          : "Try a different search term.")
      }
      actions={actions}
      compact={compact}
    />
  );
}
