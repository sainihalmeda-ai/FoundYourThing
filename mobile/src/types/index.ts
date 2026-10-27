export type User = {
  vtu_id: string;
  full_name?: string | null;
  department?: string | null;
  phone?: string | null;
  role?: string | null;
  photo_url?: string | null;
};

export type Item = {
  id: number;
  item_type: "lost" | "found";
  category: string;
  category_label: string;
  title: string;
  description: string;
  location: string;
  status: string;
  is_urgent: boolean;
  image_url: string;
  reporter_vtu_id: string;
  reporter_department?: string | null;
  reporter_name?: string | null;
  reporter_phone?: string | null;
  created_at: string;
};

/** The signed-in user's own history (GET /api/auth/me/profile). */
export type Profile = {
  returned_count: number;
  lost_count: number;
  recovered_lost_count: number;
  member_since: string;
  returned_items: Item[];
  found_items: Item[];
  lost_items: Item[];
};

export type MatchResult = {
  id: number;
  combined_score: number;
  image_score: number;
  text_score: number;
  counterparty: User;
  counterparty_item: Item;
  claim_status?: string | null;
  claim_id?: number | null;
};

export type Claim = {
  id: number;
  status: string;
  message: string;
  created_at: string;
  responded_at?: string | null;
  counterparty: User;
  match: {
    id: number;
    combined_score: number;
    lost_item: Item;
    found_item: Item;
  };
};

export type ConcernStatus = "received" | "under_review" | "resolved";

export type Concern = {
  id: number;
  category: string;
  category_label: string;
  description: string;
  location: string;
  status: ConcernStatus;
  team_note: string;
  created_at: string;
  updated_at: string;
};

/** Enquiry-team-only view — adds who filed it. */
export type ConcernTeamView = Concern & {
  reporter_vtu_id: string;
  reporter_name?: string | null;
  reporter_phone?: string | null;
  reporter_department?: string | null;
};

export type ApiErrorKind =
  | "offline"
  | "timeout"
  | "server"
  | "unauthorized"
  | "validation"
  | "unknown";

export class ApiError extends Error {
  kind: ApiErrorKind;
  status?: number;
  /** Underlying platform error, kept for on-device debugging. */
  detail?: string;

  constructor(
    message: string,
    kind: ApiErrorKind,
    status?: number,
    detail?: string,
  ) {
    super(message);
    this.kind = kind;
    this.status = status;
    this.detail = detail;
  }
}

export type ConnectionState =
  | "online"
  | "offline"
  | "checking"
  | "server_down"
  | "slow";
