export async function onRequest(context) {
  const cf = context.request.cf || {};

  const tz = cf.timezone || "UTC";

  let zone = "unknown";

  if (tz.startsWith("America/")) zone = "americas";
  else if (tz.startsWith("Europe/")) zone = "europe";
  else if (tz.startsWith("Asia/")) zone = "asia";
  else if (tz.startsWith("Africa/")) zone = "africa";
  else if (tz.startsWith("Australia/") || tz.startsWith("Pacific/")) zone = "oceania";

  return new Response(JSON.stringify({
    timezone: tz,
    zone
  }, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
}
