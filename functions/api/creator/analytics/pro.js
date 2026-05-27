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
  if (tier !== "pro") {
    return new Response(JSON.stringify({ error: "pro tier required" }), {
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

  // event-type grouping
  const byType = {};
  for (const e of events) {
    byType[e.type] = (byType[e.type] || 0) + 1;
  }

  // hourly distribution
  const hourly = Array(24).fill(0);
  for (const e of events) {
    const hour = new Date(e.timestamp).getHours();
    hourly[hour]++;
  }

  // weekly distribution (0 = Sunday)
  const weekly = Array(7).fill(0);
  for (const e of events) {
    const day = new Date(e.timestamp).getDay();
    weekly[day]++;
  }

  // top activity windows
  const topHour = hourly.indexOf(Math.max(...hourly));
  const topDay = weekly.indexOf(Math.max(...weekly));

  return new Response(JSON.stringify({
    ok: true,
    userId,
    insights: {
      byType,
      hourly,
      weekly,
      topHour,
      topDay
    }
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
