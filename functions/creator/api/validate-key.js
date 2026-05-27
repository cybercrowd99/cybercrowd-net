export async function validateApiKey(env, apiKey) {
  if (!apiKey) {
    return { ok: false, error: "missing api key" };
  }

  // search for userId by scanning apiKey:* entries
  const prefix = "apiKey:";
  const { keys } = await env.CREATOR.list({ prefix });

  let userId = null;

  for (const key of keys) {
    const stored = await env.CREATOR.get(key.name);
    if (stored === apiKey) {
      userId = key.name.replace("apiKey:", "");
      break;
    }
  }

  if (!userId) {
    return { ok: false, error: "invalid api key" };
  }

  const tier = await env.CREATOR.get(`tier:${userId}`);
  if (tier !== "pro") {
    return { ok: false, error: "pro tier required" };
  }

  return {
    ok: true,
    userId,
    tier
  };
}
