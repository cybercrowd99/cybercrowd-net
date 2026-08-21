// entry-human-pass.js
// CyberCrowd — Human Verification Gate
// JOB: Run Turnstile and return HUMAN TOKEN.
// NO backend calls. NO email send. NO WHOOSH. NO READY logic.

export async function runHumanPass(turnstileWidgetId) {
  return new Promise((resolve, reject) => {
    if (!window.turnstile || !turnstileWidgetId) {
      return resolve({
        human: false,
        token: null,
        reason: "turnstile-not-ready"
      });
    }

    try {
      // Cloudflare Turnstile client-side token request
      window.turnstile.execute(turnstileWidgetId, {
        action: "entry"
      }).then(token => {
        if (typeof token === "string" && token.length > 0) {
          resolve({
            human: true,
            token,
            reason: "human-token-generated"
          });
        } else {
          resolve({
            human: false,
            token: null,
            reason: "empty-token"
          });
        }
      }).catch(err => {
        resolve({
          human: false,
          token: null,
          reason: "turnstile-error",
          error: err?.message || "unknown"
        });
      });
    } catch (err) {
      resolve({
        human: false,
        token: null,
        reason: "turnstile-exception",
        error: err?.message || "unknown"
      });
    }
  });
}
