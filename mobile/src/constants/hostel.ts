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

export const HOSTEL_GROUPS: { key: "boys" | "girls"; label: string }[] = [
  { key: "boys", label: "Boys hostels" },
  { key: "girls", label: "Girls hostels" },
];

/** "Prince Hostel · Block B · Room 214" — block/room only when given. */
export function complaintPlace(c: Pick<HostelComplaint, "hostel_label" | "block" | "room">): string {
  const parts = [c.hostel_label];
  if (c.block) parts.push(`Block ${c.block}`);
  if (c.room) parts.push(`Room ${c.room}`);
  return parts.join(" · ");
}
