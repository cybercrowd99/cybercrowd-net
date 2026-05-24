/* ============================================================
   adWorm — AUTO-FILTER ENGINE
   CyberCrowd Layer 1 Broadcast Subsystem
   Enforces: 1970s PBS-safe doctrine
   No AI. No ML. Pure rule-based filtering.
   ============================================================ */

/* ============================================================
   PROHIBITED KEYWORDS (hard block)
   ============================================================ */

const HARD_BLOCK = [
  // sexual content
  "nude", "nudity", "sex", "porn", "xxx", "fetish",
  "dick", "pussy", "cock", "cum", "boobs", "tits",
  "ass", "butt", "anal", "bdsm",

  // violence
  "kill", "murder", "blood", "gore", "shoot", "stab",

  // hate / extremist
  "nazi", "kkk", "racist", "hate",

  // political manipulation
  "vote for", "campaign", "election", "political ad"
];

/* ============================================================
   FILETYPE CHECKS
   ============================================================ */

function isAllowedFileType(file) {
  if (!file) return true;

  const allowed = ["image/", "video/"];
  return allowed.some(prefix => file.type.startsWith(prefix));
}

/* ============================================================
   TEXT CHECKS
   ============================================================ */

function containsHardBlock(text) {
  if (!text) return false;

  const lower = text.toLowerCase();
  return HARD_BLOCK.some(term => lower.includes(term));
}

/* ============================================================
   MAIN FILTER FUNCTION
   ============================================================ */

export async function runAutoFilter(submission) {
  const { asset, copy } = submission;

  // 1. File type check
  if (!isAllowedFileType(asset)) {
    return {
      pass: false,
      message: "Rejected: Unsupported file type."
    };
  }

  // 2. Filename keyword check
  if (asset && containsHardBlock(asset.name)) {
    return {
      pass: false,
      message: "Rejected: Asset filename contains prohibited content."
    };
  }

  // 3. Copy text keyword check
  if (containsHardBlock(copy)) {
    return {
      pass: false,
      message: "Rejected: Copy contains prohibited content."
    };
  }

  // 4. If all checks pass
  return {
    pass: true,
    message: "Passed: Auto-filter cleared. Awaiting human review."
  };
}
