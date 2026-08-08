export type User = {
  vtu_id: string;
  full_name?: string | null;
  department?: string | null;
  phone?: string | null;
  role?: string | null;
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
