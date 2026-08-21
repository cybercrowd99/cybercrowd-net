async function requestCyberCrowdEntry(email, turnstileToken) {
  return fetch("/api/auth/request-entry", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email: email,
      "cf-turnstile-response": turnstileToken
    })
  });
}
