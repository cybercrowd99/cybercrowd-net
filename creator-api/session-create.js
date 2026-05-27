import { withGroundAI } from "./with-ground-ai.js";

export default withGroundAI(async (req, state, context) => {
  const body = await req.json().catch(() => null);

  if (!body || !body.email) {
    return new Response(
      JSON.stringify({ ok: false, reason: "missing-email" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // call your existing session-create worker
  const result = await context.env.SESSION_CREATE.fetch(
    context.env.SESSION_CREATE_URL,
    {
      method: "POST",
      body: JSON.stringify({ email: body.email }),
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
