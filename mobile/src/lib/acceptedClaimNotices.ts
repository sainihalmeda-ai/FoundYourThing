import AsyncStorage from "@react-native-async-storage/async-storage";

const DISMISSED_ACCEPTED_KEY = "fyt_dismissed_accepted_claims";
const DISMISSED_INCOMING_KEY = "fyt_dismissed_incoming_claims";

async function readIds(key: string): Promise<number[]> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(Number).filter(Number.isFinite) : [];
  } catch {
    return [];
  }
}

async function addId(key: string, id: number): Promise<void> {
  const existing = await readIds(key);
  if (existing.includes(id)) return;
  await AsyncStorage.setItem(key, JSON.stringify([...existing, id]));
}

export async function getDismissedAcceptedClaimIds(): Promise<number[]> {
  return readIds(DISMISSED_ACCEPTED_KEY);
}

export async function dismissAcceptedClaim(claimId: number): Promise<void> {
  await addId(DISMISSED_ACCEPTED_KEY, claimId);
}

export async function getDismissedIncomingClaimIds(): Promise<number[]> {
  return readIds(DISMISSED_INCOMING_KEY);
}

export async function dismissIncomingClaim(claimId: number): Promise<void> {
  await addId(DISMISSED_INCOMING_KEY, claimId);
}
