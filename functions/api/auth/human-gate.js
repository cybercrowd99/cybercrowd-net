// CyberCrowd Human Gate – Policy Only
// No token creation. No KV. No email sending. No session. No cookie.
// Decides only: human_passed or human_failed.

export function humanGate(turnstileResult) {
  // turnstileResult is expected to be:
  // { success: boolean, score?: number, action?: string }

  if (!turnstileResult || turnstileResult.success !== true) {
    return {
      human_passed: false,
      reason: "human_failed"
    };
  }

  // Optional: score-based policy (non-authority, advisory only)
  if (typeof turnstileResult.score === "number" && turnstileResult.score < 0.5) {
    return {
      human_passed: false,
      reason: "low_score"
    };
  }

  return {
    human_passed: true
  };
}
