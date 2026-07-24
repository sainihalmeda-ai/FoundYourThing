import { apiRequest } from "../api/client";
import { clearToken, getToken, saveToken } from "../lib/tokenStorage";
import type { Claim, Item, MatchResult, User } from "../types";

export { clearToken, getToken, saveToken };

export async function registerUser(payload: {
  vtu_id: string;
  full_name: string;
  department: string;
  email: string;
  phone: string;
  password: string;
}) {
  return apiRequest<{ access_token: string; user: User }>("/api/auth/register", {
    method: "POST",
    body: payload,
  });
}

export async function loginUser(vtu_id: string, password: string) {
  return apiRequest<{ access_token: string; user: User }>("/api/auth/login", {
    method: "POST",
    body: { vtu_id, password },
  });
}

export async function refreshSession(token: string) {
  return apiRequest<{ access_token: string; user: User }>("/api/auth/refresh", {
    method: "POST",
    token,
  });
}

export async function fetchMe(token: string) {
  return apiRequest<User>("/api/auth/me", { token });
}

export async function fetchMetadata(token: string) {
  return apiRequest<{
    categories: { id: string; label: string }[];
    locations: string[];
    policy: { valuables_only: boolean; privacy: string };
  }>("/api/items/meta", { token });
}

export async function fetchItems(
  token: string,
  options?: { itemType?: "lost" | "found"; mine?: boolean },
) {
  const params = new URLSearchParams();
  if (options?.itemType) params.set("item_type", options.itemType);
  if (options?.mine) params.set("mine", "true");
  const query = params.toString() ? `?${params.toString()}` : "";
  return apiRequest<Item[]>(`/api/items${query}`, { token });
}

export async function fetchItem(token: string, itemId: number) {
  return apiRequest<Item>(`/api/items/${itemId}`, { token });
}

export async function createItem(token: string, form: FormData) {
  return apiRequest<Item>("/api/items", {
    method: "POST",
    token,
    body: form,
    retries: 0,
  });
}

export async function fetchMatches(token: string, itemId: number) {
  return apiRequest<MatchResult[]>(`/api/items/${itemId}/matches`, { token });
}

export async function createClaim(token: string, matchId: number, message: string) {
  return apiRequest<Claim>("/api/claims", {
    method: "POST",
    token,
    body: { match_id: matchId, message },
  });
}

export async function claimAgainstFound(
  token: string,
  foundItemId: number,
  lostItemId: number,
  message?: string,
) {
  return apiRequest<Claim>("/api/claims/against-found", {
    method: "POST",
    token,
    body: {
      found_item_id: foundItemId,
      lost_item_id: lostItemId,
      message: message ?? "I saw this on the campus found feed and believe it is mine.",
    },
  });
}

export async function fetchIncomingClaims(token: string) {
  return apiRequest<Claim[]>("/api/claims/incoming", { token });
}

export async function fetchMyClaims(token: string) {
  return apiRequest<Claim[]>("/api/claims/mine", { token });
}

export async function respondClaim(token: string, claimId: number, accept: boolean) {
  return apiRequest<Claim>(`/api/claims/${claimId}/respond`, {
    method: "POST",
    token,
    body: { accept },
  });
}

export async function reportClaimMismatch(token: string, claimId: number) {
  return apiRequest<Claim>(`/api/claims/${claimId}/mismatch`, {
    method: "POST",
    token,
  });
}

export async function confirmClaimRecovered(token: string, claimId: number) {
  return apiRequest<Claim>(`/api/claims/${claimId}/confirm-recovered`, {
    method: "POST",
    token,
  });
}
