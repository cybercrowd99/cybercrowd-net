// setup-token-store.js
// CyberCrowd — Setup Token Storage Layer
// JOB: Store the token record in KV.
// NO email sending. NO Postmark. NO UI. NO side effects beyond KV write.

export async function storeSetupToken(env, tokenRecord) {
  try {
    if (!env || !env.CYBERCROWD_SETUP_KV) {
      return { success: false, reason: "kv-not-configured" };
    }

    if (!tokenRecord || !tokenRecord.token) {
      return { success: false, reason: "invalid-token-record" };
    }

    const key = `setup:${tokenRecord.token}`;

    await env.CYBERCROWD_SETUP_KV.put(key, JSON.stringify(tokenRecord), {
      expirationTtl: 60 * 60 * 24 // 24 hours
    });

    return { success: true };
  } catch (err) {
    return {
      success: false,
      reason: "kv-exception",
      error: err?.message || "unknown"
    };
  }
}
