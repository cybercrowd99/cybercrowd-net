// CyberCrowd — Email Format Validator
// JOB: Accept raw email string and return VALID or INVALID.
// NO side effects. NO backend calls. NO Turnstile. NO WHOOSH.

export function validateEmail(rawEmail) {
  if (typeof rawEmail !== "string") {
    return { valid: false, reason: "not-a-string" };
  }

  const email = rawEmail.trim();

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const isValid = emailPattern.test(email);

  return {
    valid: isValid,
    reason: isValid ? "valid-email" : "invalid-email",
    email
  };
}
