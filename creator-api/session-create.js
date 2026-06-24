import { withGroundAI } from "./with-ground-ai.js";

export default withGroundAI(async (req, state, context) => {
  const body = await req.json().catch(() => null);

  if (!body || !body["identity-active-id"]) {
    return new Response(
      JSON.stringify({ ok: false, reason: "missing-identity-active-id" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const identityActiveId = String(body["identity-active-id"] || "").trim();
  const email = String(body.email || "").trim().toLowerCase();

  const result = await context.env.SESSION_CREATE.fetch(
    context.env.SESSION_CREATE_URL,
    {
      method: "POST",
      body: JSON.stringify({
        "identity-active-id": identityActiveId,
        email
      }),
      headers: { "Content-Type": "application/json" }
    }
  );

  const session = await result.json();

  return new Response(
    JSON.stringify({
      ok: true,
      session,
      groundAI: state
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}, {
  alpha: 1,
  expected: 1,
  Tp: 1,
  Tf: 1,
  loadGradient: 0,
  routes: ["default"]
});
