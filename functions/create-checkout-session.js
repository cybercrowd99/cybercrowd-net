export async function onRequestPost(context) {
  const { env } = context;

  const stripeSecretKey = env.STRIPE_SECRET_KEY;
  const priceId = env.STRIPE_PRICE_ID;
  const domain = env.YOUR_DOMAIN || "https://cybercrowd.net";

  if (!stripeSecretKey || !priceId) {
    return new Response("Missing Stripe environment variables.", { status: 500 });
  }

  const body = new URLSearchParams();

  body.append("mode", "payment");
  body.append("line_items[0][price]", priceId);
  body.append("line_items[0][quantity]", "1");
  body.append("success_url", `${domain}/success.html?session_id={CHECKOUT_SESSION_ID}`);
  body.append("cancel_url", `${domain}/page2.html`);

  const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${stripeSecretKey}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });

  const session = await stripeResponse.json();

  if (!stripeResponse.ok) {
    return new Response(JSON.stringify(session, null, 2), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  return Response.redirect(session.url, 303);
}
