export async function hashPassword(password, email) {
  const encoder = new TextEncoder();
  const salt = encoder.encode(email.toLowerCase());

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: 150000,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );

  return Array.from(new Uint8Array(derivedBits))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function verifyPassword(password, email, storedHash) {
  const hash = await hashPassword(password, email);
  return hash === storedHash;
}

export function mintSession(email) {
  const now = Date.now();

  return {
    eat: generateToken(),
    email: email.toLowerCase(),
    epoch: now,
    issuedAt: now,
    expiresAt: now + 86400 * 7 * 1000,
    band: "user",
    type: "EAT_SESSION",
  };
}
