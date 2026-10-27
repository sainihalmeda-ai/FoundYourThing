import type { Ionicons } from "@expo/vector-icons";

/**
 * Finder recognition tiers — a token of respect for students who hand
 * found items back. Counted from found reports that reached "recovered"
 * (both sides confirmed the handover), so they can't be farmed by posting.
 * Thresholds front-load the early tiers: returns are rare on one campus,
 * and the first few should come quickly enough to feel reachable.
 */
export type FinderBadge = {
  min: number;
  title: string;
  tagline: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  tint: string;
};

export const FINDER_BADGES: FinderBadge[] = [
  {
    min: 1,
    title: "First Good Deed",
    tagline: "Returned their first item — someone's day got better.",
    icon: "heart",
    color: "#2F855A",
    tint: "#E6F4EC",
  },
  {
    min: 3,
    title: "Helping Hand",
    tagline: "Three owners reunited with what they lost.",
    icon: "hand-left",
    color: "#2B6CB0",
    tint: "#E6EFFA",
  },
  {
    min: 5,
    title: "Campus Samaritan",
    tagline: "Known for doing the right thing, every time.",
    icon: "people",
    color: "#2C7A7B",
    tint: "#E3F3F3",
  },
  {
    min: 10,
    title: "Trusted Finder",
    tagline: "Ten returns. Campus trusts you with its valuables.",
    icon: "shield-checkmark",
    color: "#223874",
    tint: "#E7EAF3",
  },
  {
    min: 20,
    title: "Honesty Champion",
    tagline: "Twenty times the honest choice was the only choice.",
    icon: "ribbon",
    color: "#6B46C1",
    tint: "#EFEAFB",
  },
  {
    min: 30,
    title: "Guardian of Lost Things",
    tagline: "Nothing stays lost for long around you.",
    icon: "key",
    color: "#B7791F",
    tint: "#FBF1E1",
  },
  {
    min: 45,
    title: "Campus Hero",
    tagline: "A name students are glad to see on a found report.",
    icon: "medal",
    color: "#C05621",
    tint: "#FCEDE3",
  },
  {
    min: 60,
    title: "Pillar of Trust",
    tagline: "Sixty reunions — the backbone of this community.",
    icon: "diamond",
    color: "#A91F23",
    tint: "#F8E6E7",
  },
  {
    min: 80,
    title: "Legend of Lost & Found",
    tagline: "Stories about you get told to the freshers.",
    icon: "star",
    color: "#97266D",
    tint: "#F8E5F0",
  },
  {
    min: 100,
    title: "Icon of Integrity",
    tagline: "One hundred returns. The highest honour on campus.",
    icon: "trophy",
    color: "#8A6A12",
    tint: "#FBF3D9",
  },
];

/** Highest badge earned, or null before the first return. */
export function currentBadge(returned: number): FinderBadge | null {
  let earned: FinderBadge | null = null;
  for (const badge of FINDER_BADGES) {
    if (returned >= badge.min) earned = badge;
  }
  return earned;
}

export function nextBadge(returned: number): FinderBadge | null {
  return FINDER_BADGES.find((badge) => returned < badge.min) ?? null;
}
