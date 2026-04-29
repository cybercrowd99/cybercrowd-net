export async function onRequest(context) {
  const url = new URL(context.request.url);
  const path = url.pathname;

  // FREE: 60s teaser snippets
  if (path.includes("_60s.teaser.mp3")) {
    return context.next();
  }

  // ACP Discovery
  if (path === "/.well-known/acp.json") {
    return new Response(JSON.stringify({
      protocol: { name: "acp", version: "1.0" },
      api_base_url: "https://cybercrowd.net/api",
      transports: [{ type: "http", content_types: ["application/json"] }],
      capabilities: {
        services: [{
          id: "album",
          name: "Cybercrowd Album - Full Songs",
          description: "Purchase full album tracks or subscribe",
          pricing: {
            model: "per_request",
            currency: "CRWD",
            amount: "1",
            subscription: { model: "recurring", currency: "CRWD", amount: "10", period: "monthly" }
          }
        }]
      }
    }), { headers: { "Content-Type": "application/json" } });
  }

  // x402 Discovery
  if (path === "/.well-known/x402") {
    return new Response(JSON.stringify({
      protocol: "x402",
      version: "1.0",
      accepts: ["ethereum-base"],
      facilitator: "https://facilitator.x402.org",
      wallet: "0x9DDf20E5F20C7C3F5AbE6A6b0fceB33E7b89c81d",
      network: "base",
      protected_routes: [
        { path: "/api/album/*", amount: "1", currency: "CRWD", description: "Full song" },
        { path: "/api/album/subscription", amount: "10", currency: "CRWD", description: "Monthly subscription" }
      ]
    }), { headers: { "Content-Type": "application/json" } });
  }

  // x402 Payment Required on album routes
  if (path.startsWith("/api/album/")) {
    const paymentHeader = context.request.headers.get("PAYMENT-REQUIRED");
    if (!paymentHeader) {
      return new Response(JSON.stringify({
        error: "Payment Required",
        accepts: ["ethereum-base"],
        amount: "1",
        currency: "CRWD",
        facilitator: "https://facilitator.x402.org",
        wallet: "0x9DDf20E5F20C7C3F5AbE6A6b0fceB33E7b89c81d",
        network: "base",
        subscription_available: true,
        subscription_amount: "10",
        subscription_period: "monthly"
      }), {
        status: 402,
        headers: { "Content-Type": "application/json" }
      });
    }
  }

  // All other requests pass through
  return context.next();
}
