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

  const tier = await env.CREATOR.get(`tier:${userId}`);
  if (tier !== "creator" && tier !== "pro") {
    return new Response(JSON.stringify({ error: "not a creator" }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }

  const prefix = `event:${userId}:`;
  const { keys } = await env.CREATOR.list({ prefix });

  const events = [];
  for (const key of keys) {
    const raw = await env.CREATOR.get(key.name);
    if (!raw) continue;
    events.push(JSON.parse(raw));
  }

  events.sort((a, b) => b.timestamp - a.timestamp);

  const now = Date.now();
  const day = 86400000;

  let totalEvents = events.length;
  let lastActive = events[0]?.timestamp || null;

  let last7 = 0;
  let last30 = 0;

  for (const e of events) {
    if (now - e.timestamp <= 7 * day) last7++;
    if (now - e.timestamp <= 30 * day) last30++;
  }

  // streak calculation
  let streak = 0;
  let currentDay = new Date(now).setHours(0,0,0,0);

  const daysWithEvents = new Set(
    events.map(e => new Date(e.timestamp).setHours(0,0,0,0))
  );

  while (daysWithEvents.has(currentDay)) {
    streak++;
    currentDay -= day;
  }

  return new Response(JSON.stringify({
    ok: true,
    userId,
    growth: {
      totalEvents,
      lastActive,
      last7Days: last7,
      last30Days: last30,
      streak
    }
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
