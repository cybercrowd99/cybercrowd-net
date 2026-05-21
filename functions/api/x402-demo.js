export async function onRequest(context) {
  const paymentHeader =
    context.request.headers.get("PAYMENT-SIGNATURE") ||
    context.request.headers.get("X-PAYMENT");

  if (!paymentHeader) {
    return new Response(
      JSON.stringify({
        x402Version: 2,
        error: "payment_required",
        accepts: [
          {
            scheme: "exact",
            network: "eip155:84532",
            price: "$0.001",
            payTo: "0x0000000000000000000000000000000000000000",
            description:
              "CyberCrowd.net x402 test endpoint for agent-native HTTP payment readiness."
          }
        ],
        resource: "https://cybercrowd.net/api/x402-demo"
      }),
      {
        status: 402,
        headers: {
          "Content-Type": "application/json",
          "PAYMENT-REQUIRED": "true"
        }
      }
    );
  }

  return new Response(
    JSON.stringify({
      ok: true,
      service: "CyberCrowd.net x402 demo",
      message:
        "Payment header detected. CyberCrowd x402 test endpoint is reachable.",
      entities: {
        CyberCrowd: "official platform",
        AtomicKricket: "network and media side",
        RetenRecords: "music production side"
      }
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "PAYMENT-RESPONSE": "test-mode-payment-header-detected"
      }
    }
  );
}
