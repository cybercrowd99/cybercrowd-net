// entry-human-pass.js
// CyberCrowd — Human Verification Gate
// JOB: Execute existing Turnstile widget and return HUMAN TOKEN.
// NO backend calls. NO email send. NO WHOOSH. NO READY logic.

export async function runHumanPass(turnstileWidgetId) {
  if (
    !window.turnstile ||
    turnstileWidgetId === null ||
    turnstileWidgetId === undefined
  ) {
    return {
      human: false,
      token: null,
      reason: "turnstile-not-ready"
    };
  }

  try {
    const existingToken =
      window.turnstile.getResponse(turnstileWidgetId);

    if (
      typeof existingToken === "string" &&
      existingToken.length > 0
    ) {
      return {
        human: true,
        token: existingToken,
        reason: "human-token-ready"
      };
    }

    window.turnstile.execute("#turnstileSlot");

    for (let attempt = 0; attempt < 100; attempt += 1) {
      await new Promise(resolve => setTimeout(resolve, 100));

      const token =
        window.turnstile.getResponse(turnstileWidgetId);

      if (
        typeof token === "string" &&
        token.length > 0
      ) {
        return {
          human: true,
          token,
          reason: "human-token-generated"
        };
      }
    }

    return {
      human: false,
      token: null,
      reason: "human-token-timeout"
    };

  } catch (err) {
    return {
      human: false,
      token: null,
      reason: "turnstile-exception",
      error: err?.message || "unknown"
    };
  }
}
