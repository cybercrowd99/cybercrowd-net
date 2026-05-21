export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  const nodeId = url.searchParams.get("node_id") || "unknown-node";

  const body = new URLSearchParams();
  body.append("mode", "payment");
  body.append("line_items[0][price]", env.STRIPE_WDIG_LICENSE_PRICE_ID);
  body.append("line_items[0][quantity]", "1");

  body.append("metadata[node_id]", nodeId);
  body.append("metadata[product]", "wdig_surface_os_license");

  body.append(
    "success_url",
    `${env.YOUR_DOMAIN}/license-success.html?session_id={CHECKOUT_SESSION_ID}&node_id=${encodeURIComponent(nodeId)}`
  );

  body.append(
    "cancel_url",
    `${env.YOUR_DOMAIN}/license-cancel.html`
  );

  const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });

  const session = await stripeResponse.json();

  if (!stripeResponse.ok) {
    return Response.json(session, { status: 500 });
  }

  return Response.redirect(session.url, 303);
}
