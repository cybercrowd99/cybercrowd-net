import { getCapabilities } from "../../creator/capability-matrix.js";

export async function onRequest({ request, env }) {
  const token = request.headers.get("Authorization");

  if (!token) {
    return new Response(JSON.stringify({ error: "no session" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  const userId = await env.SESSION.get(token);
  if (!userId) {
    return new Response(JSON.stringify({ error: "invalid session" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  const tier = await env.CREATOR.get(`tier:${userId}`) || "free";
  const capabilities = getCapabilities(tier);

  const draftCount = parseInt((await env.CREATOR.get(`meta:${userId}:draftCount`)) || "0", 10);
  const publishCount = parseInt((await env.CREATOR.get(`meta:${userId}:publishCount`)) || "0", 10);
  const lastPublishAt = (await env.CREATOR.get(`meta:${userId}:lastPublishAt`)) || null;

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

  // compute growth metrics
  const now = Date.now();
  const day = 86400000;

  let last7 = 0;
  let last30 = 0;

  for (const e of events) {
    if (now - e.timestamp <= 7 * day) last7++;
    if (now - e.timestamp <= 30 * day) last30++;
  }

  // pro insights (only if tier = pro)
  let proInsights = null;

  if (tier === "pro") {
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

    proInsights = {
      byType,
      hourly,
      weekly,
      topHour: hourly.indexOf(Math.max(...hourly)),
      topDay: weekly.indexOf(Math.max(...weekly))
    };
  }

  return new Response(JSON.stringify({
    ok: true,
    userId,
    tier,
    capabilities,
    counts: {
      drafts: draftCount,
      published: publishCount,
      lastPublishAt
    },
    analytics: {
      events,
      last7Days: last7,
      last30Days: last30
    },
    proInsights
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
