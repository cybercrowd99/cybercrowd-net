import { anchorEndpointWrapper } from "./anchor-endpoint-wrapper.js";

export async function onRequest(context) {
  return anchorEndpointWrapper(
    context.request,

    // real endpoint logic
    async (req, state) => {
      // example response using the ground-ai state
      return new Response(
        JSON.stringify({
          ok: true,
          message: "endpoint executed",
          groundAI: state
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    },

    // ground-ai options (can be tuned per endpoint)
    {
      alpha: 1,
      expected: 1,
      Tp: 1,
      Tf: 1,
      loadGradient: 0,
      routes: ["default"]
    }
  );
}
