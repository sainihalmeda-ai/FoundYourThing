/**
 * Hostel complaint text rules — mirrors backend/app/services/complaint_text.py
 * so the live word counter agrees with the server. Change both together.
 */

// A word is a run of letters, optionally joined by ' or - (don't, ground-floor).
const WORD_RE = /[A-Za-z]+(?:['’-][A-Za-z]+)*/g;
const STRETCHED_RE = /([A-Za-z])\1{3,}/;

export const MIN_DISTINCT_WORDS = 80;
const MAX_SINGLE_WORD_SHARE = 0.15;

function words(text: string): string[] {
  return (text.match(WORD_RE) ?? []).map((w) => w.toLowerCase());
}

export function countWords(text: string): number {
  return words(text).length;
}

/** Why this description can't be accepted, or null if it's fine. */
export function complaintTextProblem(
  text: string,
  minWords: number,
  maxWords: number,
): string | null {
  const list = words(text);
  const total = list.length;

  if (total < minWords) {
    return `Describe the problem in at least ${minWords} words (you have ${total}).`;
  }
  if (total > maxWords) {
    return `Keep the complaint under ${maxWords} words (you have ${total}).`;
  }

  const counts = new Map<string, number>();
  for (const w of list) counts.set(w, (counts.get(w) ?? 0) + 1);

  if (counts.size < MIN_DISTINCT_WORDS) {
    return "The description repeats the same few words. Explain the problem in your own words.";
  }
  if (Math.max(...counts.values()) / total > MAX_SINGLE_WORD_SHARE) {
    return "The description repeats one word too often. Explain the problem in your own words.";
  }
  const stretched = list.filter((w) => STRETCHED_RE.test(w)).length;
  if (stretched / total > 0.05) {
    return "The description contains filler text. Explain the problem in your own words.";
  }
  return null;
}
