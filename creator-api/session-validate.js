import { withGroundAI } from "./with-ground-ai.js";

export default withGroundAI(async (req, state, context) => {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return new Response(
      JSON.stringify({ ok: false, reason: "missing-token" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // validate using your existing session validation logic
  const result = await context.env.SESSION_VALIDATE.fetch(
    context.env.SESSION_VALIDATE_URL,
    {
      method: "POST",
      body: JSON.stringify({ token }),
      headers: { "Content-Type": "application/json" }
    }
  );

  const validation = await result.json();

  return new Response(
    JSON.stringify({
      ok: true,
      validation,
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
