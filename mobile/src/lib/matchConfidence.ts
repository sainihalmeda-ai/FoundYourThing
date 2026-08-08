/**
 * Turns a match percentage into words a student can act on.
 *
 * The score is a photo-similarity measure, not proof of ownership, so a low
 * number has to read as "look at the pictures yourself" rather than as a
 * quiet failure.
 */

export type MatchTone = "strong" | "fair" | "weak";

export type MatchConfidence = {
  label: string;
  hint: string;
  tone: MatchTone;
};

export function matchConfidence(percent: number): MatchConfidence {
  if (percent >= 85) {
    return {
      label: "Very strong",
      hint: "The two photos are nearly identical.",
      tone: "strong",
    };
  }
  if (percent >= 65) {
    return {
      label: "Strong",
      hint: "The photos look alike. Check the small details before you meet.",
      tone: "strong",
    };
  }
  if (percent >= 45) {
    return {
      label: "Possible",
      hint: "Only a partial resemblance. Compare both photos closely.",
      tone: "fair",
    };
  }
  return {
    label: "Weak",
    hint: "The photos do not look alike. Trust the pictures, not the score.",
    tone: "weak",
  };
}
