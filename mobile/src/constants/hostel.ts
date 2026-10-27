import type { HostelComplaint, HostelComplaintStatus } from "../types";

export const HOSTEL_STATUS_STEPS: { key: HostelComplaintStatus; label: string }[] = [
  { key: "received", label: "Received" },
  { key: "in_progress", label: "In progress" },
  { key: "resolved", label: "Resolved" },
];

export const HOSTEL_STATUS_LABEL: Record<HostelComplaintStatus, string> = {
  received: "Received",
  in_progress: "In progress",
  resolved: "Resolved",
};

export const HOSTEL_STATUS_TONE: Record<HostelComplaintStatus, "neutral" | "connected" | "returned"> = {
  received: "neutral",
  in_progress: "connected",
  resolved: "returned",
};

/** "Boys Hostel 1 · Block B · Room 214" */
export function complaintPlace(c: Pick<HostelComplaint, "hostel_label" | "block" | "room">): string {
  const parts = [c.hostel_label, `Block ${c.block}`];
  if (c.room) parts.push(`Room ${c.room}`);
  return parts.join(" · ");
}
