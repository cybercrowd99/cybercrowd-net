import { anchorEndpointWrapper } from "../rigid-core/anchor-endpoint-wrapper.js";

export function withGroundAI(handler, options = {}) {
  return async (context) => {
    return anchorEndpointWrapper(
      context.request,

      // real creator api logic
      async (req, state) => {
        return handler(req, state, context);
      },

      // ground-ai tuning per endpoint
      {
        alpha: options.alpha ?? 1,
        expected: options.expected ?? 1,
        Tp: options.Tp ?? 1,
        Tf: options.Tf ?? 1,
        loadGradient: options.loadGradient ?? 0,
        routes: options.routes ?? ["default"]
      }
    );
  };
}
