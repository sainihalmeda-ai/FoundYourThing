import { apiRequest } from "./client";
import { UPLOAD_TIMEOUT_MS } from "../constants/config";
import type { HostelComplaint, HostelComplaintOptions, HostelComplaintStatus } from "../types";

/** Hostels, blocks, categories and the word limits — served by the backend. */
export async function fetchHostelOptions(token: string) {
  return apiRequest<HostelComplaintOptions>("/api/hostel-complaints/options", { token });
}

export async function createHostelComplaint(token: string, form: FormData) {
  return apiRequest<HostelComplaint>("/api/hostel-complaints", {
    method: "POST",
    token,
    body: form,
    // Never retry: a repeat of a request that actually landed files it twice.
    retries: 0,
    timeoutMs: UPLOAD_TIMEOUT_MS,
  });
}

export async function fetchMyHostelComplaints(token: string) {
  return apiRequest<HostelComplaint[]>("/api/hostel-complaints/mine", { token });
}

/** The filer or hostel staff only — anyone else gets a 404. */
export async function fetchHostelComplaint(token: string, complaintId: number) {
  return apiRequest<HostelComplaint>(`/api/hostel-complaints/${complaintId}`, { token });
}

/** Hostel staff only — the server 403s everyone else. */
export async function fetchAllHostelComplaints(token: string, hostel?: string) {
  const query = hostel ? `?hostel=${encodeURIComponent(hostel)}` : "";
  return apiRequest<HostelComplaint[]>(`/api/hostel-complaints${query}`, { token });
}

export async function updateHostelComplaint(
  token: string,
  complaintId: number,
  payload: { status: HostelComplaintStatus; staff_note: string },
) {
  return apiRequest<HostelComplaint>(`/api/hostel-complaints/${complaintId}`, {
    method: "PATCH",
    token,
    body: payload,
  });
}
