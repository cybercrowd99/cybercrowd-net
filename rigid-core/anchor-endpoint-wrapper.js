import { anchorLink } from "./anchor-link.js";

export async function anchorEndpointWrapper(request, handler, options = {}) {
  const {
    alpha = 1,
    expected = 1,
    Tp = 1,
    Tf = 1,
    loadGradient = 0,
    routes = ["default"]
  } = options;

  // ask Ground‑AI for permission + speed + routing
  const state = anchorLink({ alpha, expected, Tp, Tf, loadGradient, routes });

  // if unsafe → block immediately
  if (!state.ok) {
    return new Response(
      JSON.stringify({ error: "ground-ai-blocked", reason: "integrity-failed" }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  // if route not allowed → block
  if (!state.routes.includes("default")) {
    return new Response(
      JSON.stringify({ error: "ground-ai-blocked", reason: "route-not-allowed" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  // if safe → run the real endpoint
  return handler(request, state);
}
