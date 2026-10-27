import { useWindowDimensions } from "react-native";
import { WIDE_BREAKPOINT } from "../constants/config";

/** Below this window width the desktop sidebar shrinks to an icon rail. */
export const COMPACT_NAV_BELOW = 1180;
export const SIDEBAR_WIDTH = 240;
export const SIDEBAR_COMPACT_WIDTH = 76;
/** Horizontal padding desktop pages put around their content. */
const PAGE_GUTTER = 56;

/**
 * Desktop layout facts in one place:
 * - `wide`: use the sidebar layout at all (vs. the phone layout)
 * - `compactNav`: sidebar is the narrow icon rail
 * - `contentWidth`: roughly how much room a page has for its columns, so
 *   pages can stack or regroup columns instead of squeezing them.
 */
export function useDesktopLayout() {
  const { width } = useWindowDimensions();
  const wide = width >= WIDE_BREAKPOINT;
  const compactNav = wide && width < COMPACT_NAV_BELOW;
  const sidebar = !wide ? 0 : compactNav ? SIDEBAR_COMPACT_WIDTH : SIDEBAR_WIDTH;
  return { wide, compactNav, contentWidth: width - sidebar - PAGE_GUTTER };
}
