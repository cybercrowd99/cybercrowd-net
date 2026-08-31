// request-entry-client.js
// CyberCrowd — SEND Gate (Button 4)
// JOB: POST /api/auth/send-verification with email.
// Server-issued cc_human_pass cookie carries human authority.
// NO WHOOSH. NO overlay. NO UI mutation. NO token creation.

export async function sendVerificationRequest(readyState) {
  // Must be ready
  if (!readyState || readyState.ready !== true) {
    return {
      success: false,
      reason: "not-ready",
      status: "blocked"
    };
  }

  const payload = {
    email: readyState.email
  };

  try {
    const response = await fetch("/api/auth/send-verification", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    // Backend should return JSON
    const result = await response.json().catch(() => ({
      success: false,
      reason: "invalid-json"
    }));

    // Normalize backend response
    if (result && result.success === true) {
      return {
        success: true,
        reason: "email-sent",
        backend: result
      };
    }

    return {
      success: false,
      reason: "backend-failure",
      backend: result
    };

  } catch (err) {
    return {
      success: false,
      reason: "network-error",
      error: err?.message || "unknown"
    };
  }
}
