const ITERATIONS = 150000;
const KEY_LENGTH_BITS = 256;
const HASH_ALGORITHM = "SHA-256";

function bytesToBase64(bytes) {
  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary);
}

function base64ToBytes(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function safeEqual(left, right) {
  if (left.length !== right.length) {
    return false;
  }

  let result = 0;

  for (let index = 0; index < left.length; index += 1) {
    result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return result === 0;
}

export function validatePasswordShape(password) {
  if (typeof password !== "string") {
    return false;
  }

  if (password.length < 8) {
    return false;
  }

  if (password.length > 19) {
    return false;
  }

  return true;
}

export function createPasswordSalt() {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return bytesToBase64(salt);
}

export async function hashPassword(password, saltBase64) {
  const encoder = new TextEncoder();
  const salt = base64ToBytes(saltBase64);

  const baseKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: ITERATIONS,
      hash: HASH_ALGORITHM
    },
    baseKey,
    KEY_LENGTH_BITS
  );

  return bytesToBase64(new Uint8Array(derivedBits));
}

export async function createPasswordRecord(password) {
  const salt = createPasswordSalt();
  const hash = await hashPassword(password, salt);

  return {
    algorithm: "PBKDF2",
    hashAlgorithm: HASH_ALGORITHM,
    iterations: ITERATIONS,
    keyLengthBits: KEY_LENGTH_BITS,
    salt,
    hash
  };
}

export async function verifyPassword(password, record) {
  if (!record || record.algorithm !== "PBKDF2") {
    return false;
  }

  const hash = await hashPassword(password, record.salt);
  return safeEqual(hash, record.hash);
}
