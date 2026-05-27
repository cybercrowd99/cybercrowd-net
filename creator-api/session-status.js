import { withGroundAI } from "./with-ground-ai.js";

export default withGroundAI(async (req, state, context) => {
  const session = await context.env.SESSIONS.get(context.request.cf.session_id, {
    type: "json"
  });

  return new Response(
    JSON.stringify({
      ok: true,
      session: session ?? null,
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
