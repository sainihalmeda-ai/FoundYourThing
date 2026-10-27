"""Checks that a hostel complaint is a real 200-word description, not padding.

Mirrored in mobile/src/lib/complaintText.ts for the live word counter —
change both together so the app never accepts what the server rejects.
"""

from __future__ import annotations

import re
from collections import Counter

from app.constants import MAX_COMPLAINT_WORDS, MIN_COMPLAINT_WORDS

# A word is a run of letters, optionally joined by ' or - (don't, ground-floor).
# Numbers alone ("101", "2") don't count toward the minimum.
_WORD_RE = re.compile(r"[A-Za-z]+(?:['’-][A-Za-z]+)*")
# "aaaa", "hmmmm" — the same letter four or more times in a row.
_STRETCHED_RE = re.compile(r"([A-Za-z])\1{3,}")

# Honest writing repeats common words, but a genuine 200-word complaint
# still uses well over this many different words.
MIN_DISTINCT_WORDS = 80
# No single word may make up more than this share of the text.
MAX_SINGLE_WORD_SHARE = 0.15


def count_words(text: str) -> int:
    return len(_WORD_RE.findall(text))


def complaint_text_problem(text: str) -> str | None:
    """Why this description can't be accepted, or None if it's fine."""
    words = [w.lower() for w in _WORD_RE.findall(text)]
    total = len(words)

    if total < MIN_COMPLAINT_WORDS:
        return (
            f"Describe the problem in at least {MIN_COMPLAINT_WORDS} words "
            f"(you have {total})."
        )
    if total > MAX_COMPLAINT_WORDS:
        return f"Keep the complaint under {MAX_COMPLAINT_WORDS} words (you have {total})."

    if len(set(words)) < MIN_DISTINCT_WORDS:
        return "The description repeats the same few words. Explain the problem in your own words."

    _, top_count = Counter(words).most_common(1)[0]
    if top_count / total > MAX_SINGLE_WORD_SHARE:
        return "The description repeats one word too often. Explain the problem in your own words."

    stretched = sum(1 for w in words if _STRETCHED_RE.search(w))
    if stretched / total > 0.05:
        return "The description contains filler text. Explain the problem in your own words."

    return None
