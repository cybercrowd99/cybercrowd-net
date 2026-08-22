// CYBERCROWD
// REPO: cybercrowd99/cybercrowd-net
// PATH: auth/src/verify.ts
//
// DEPLOYED CELL:
// cybercrowd-auth
//
// BUILD LAW:
// 1 FILE
// 1 JOB
// 1 FUNCTION PATH
//
// JOB:
// Create and consume the CyberCrowd verification-token state.
//
// TRACK:
// auth/src/router.ts
// → createVerificationToken()
// → VERIFY_KV
// → email link returns
// → consumeVerificationToken()
// → VERIFY_KV
// → DB verified state
// → token deleted
//
// SECURITY BOUNDARY:
// TOKEN is one-time state.
// VERIFY_KV stores the temporary proof.
// DB records successful verification.
//
// RECOVERY LOCK:
// No router change.
// No email.ts change.
// No frontend change.
// No new helper.
// No bridge.
// No envelope.
// No session logic.
//
// REPAIR:
// Do not cache reads of a one-time verification token.
// Read directly from VERIFY_KV before consume/delete.

export async function createVerificationToken(env, email) {
  const token = Array.from(
    crypto.getRandomValues(new Uint8Array(32))
  )
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const key = `verify:${token}`;

  await env.VERIFY_KV.put(
    key,
    email,
    {
      expirationTtl: 900
    }
  );

  return token;
}

export async function consumeVerificationToken(env, token) {
  const key = `verify:${token}`;

  const email = await env.VERIFY_KV.get(key);

  if (!email) {
    return {
      ok: false,
      reason: "invalid_or_expired"
    };
  }

  await env.DB
    .prepare(
      "UPDATE users SET verified = 1 WHERE email = ?"
    )
    .bind(email)
    .run();

  await env.VERIFY_KV.delete(key);

  return {
    ok: true,
    email
  };
}
