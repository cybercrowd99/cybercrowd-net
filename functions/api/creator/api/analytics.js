import { validateApiKey } from "../../../creator/api/validate-key.js";

export async function onRequest({ request, env }) {
  const apiKey = request.headers.get("X-API-Key");

  const validation = await validateApiKey(env, apiKey);
  if (!validation.ok) {
    return new Response(JSON.stringify({ error: validation.error }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  const { userId } = validation;

  // load events
  const prefix = `event:${userId}:`;
  const { keys } = await env.CREATOR.list({ prefix });

  const events = [];
  for (const key of keys) {
    const raw = await env.CREATOR.get(key.name);
    if (!raw) continue;
    events.push(JSON.parse(raw));
  }

  events.sort((a, b) => b.timestamp - a.timestamp);

  // growth metrics
  const now = Date.now();
  const day = 86400000;

  let last7 = 0;
  let last30 = 0;

  for (const e of events) {
    if (now - e.timestamp <= 7 * day) last7++;
    if (now - e.timestamp <= 30 * day) last30++;
  }

  // pro insights
  const hourly = Array(24).fill(0);
  const weekly = Array(7).fill(0);
  const byType = {};

  for (const e of events) {
    const hour = new Date(e.timestamp).getHours();
    const dayIndex = new Date(e.timestamp).getDay();
    hourly[hour]++;
    weekly[dayIndex]++;
    byType[e.type] = (byType[e.type] || 0) + 1;
  }

  const proInsights = {
    byType,
    hourly,
    weekly,
    topHour: hourly.indexOf(Math.max(...hourly)),
    topDay: weekly.indexOf(Math.max(...weekly))
  };

  return new Response(JSON.stringify({
    ok: true,
    events,
    growth: {
      last7Days: last7,
      last30Days: last30
    },
    proInsights
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
