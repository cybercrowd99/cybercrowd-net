import { CAPABILITY_MATRIX, getCapabilities } from "./capability-matrix.js";

export async function enforceCreatorTier(env, token) {
  if (!token) {
    return { ok: false, error: "no session" };
  }

  const userId = await env.SESSION.get(token);
  if (!userId) {
    return { ok: false, error: "invalid session" };
  }

  const tier = await env.CREATOR.get(`tier:${userId}`) || "free";
  const capabilities = getCapabilities(tier);

  return {
    ok: true,
    userId,
    tier,
    capabilities
  };
}
