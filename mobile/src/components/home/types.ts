import type { Item } from "../../types";

export type HomeStats = {
  items_reported: number;
  items_returned: number;
  registered_users: number;
} | null;

/** Props every Home layout variant receives from the HomeScreen container. */
export type HomeVariantProps = {
  firstName: string;
  vtuId?: string;
  stats: HomeStats;
  statsLoading: boolean;
  pendingCount: number;
  topInset: number;
  onReportLost: () => void;
  onReportFound: () => void;
  onBrowse: () => void;
  onRequests: () => void;
  onOpenApk: () => void;
  onAbout: () => void;
  onSafety: () => void;
  onLogout: () => void;
};

export type HomeFeedExtraProps = {
  recentItems: Item[];
  recentLoading: boolean;
  onOpenItem: (itemId: number) => void;
};
