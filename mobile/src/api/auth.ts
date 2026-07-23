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

export async function fetchItems(token: string, itemType?: "lost" | "found") {
  const query = itemType ? `?item_type=${itemType}` : "";
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

export async function fetchIncomingClaims(token: string) {
  return apiRequest<Claim[]>("/api/claims/incoming", { token });
}

export async function respondClaim(token: string, claimId: number, accept: boolean) {
  return apiRequest<Claim>(`/api/claims/${claimId}/respond`, {
    method: "POST",
    token,
    body: { accept },
  });
}
