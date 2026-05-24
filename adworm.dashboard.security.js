/* ============================================================
   adWorm — SECURITY DOCTRINE MODULE
   CyberCrowd Layer 1 Broadcast Subsystem
   Purpose: Canonical rulebook for content safety
   No filtering. No routing. Doctrine only.
   ============================================================ */

/* ============================================================
   1970s PBS-SAFE DOCTRINE (NON-NEGOTIABLE)
   ============================================================ */

export const DOCTRINE = {
  description:
    "Content must be safe for a 7-year-old child watching 1970s PBS programming such as Schoolhouse Rock, Sesame Street, or Mr. Rogers. No exceptions.",

  prohibited: {
    sexual: [
      "nudity", "nude", "sex", "porn", "xxx", "fetish",
      "genitals", "dick", "pussy", "cock", "cum",
      "boobs", "tits", "ass", "anal", "bdsm"
    ],
    violence: [
      "kill", "murder", "blood", "gore", "shoot", "stab"
    ],
    hate: [
      "nazi", "kkk", "racist", "hate"
    ],
    political: [
      "vote for", "campaign", "election", "political ad"
    ]
  },

  allowedDescription:
    "Content must be wholesome, friendly, educational, and non-threatening. If it wouldn't air on 1970s PBS, it is not allowed."
};

/* ============================================================
   UTILITY: CHECK IF A TERM IS PROHIBITED
   ============================================================ */

/**
 * Check if a given text contains any prohibited terms.
 * @param {string} text
 * @returns {string|null} - returns the category if violated
 */
export function checkDoctrineViolation(text) {
  if (!text) return null;

  const lower = text.toLowerCase();

  for (const category in DOCTRINE.prohibited) {
    const terms = DOCTRINE.prohibited[category];
    if (terms.some(term => lower.includes(term))) {
      return category;
    }
  }

  return null;
}

/* ============================================================
   UTILITY: GET FULL DOCTRINE SUMMARY
   ============================================================ */

export function getDoctrineSummary() {
  return {
    description: DOCTRINE.description,
    prohibitedCategories: Object.keys(DOCTRINE.prohibited),
    allowedDescription: DOCTRINE.allowedDescription
  };
}
