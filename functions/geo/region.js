export async function onRequest(context) {
  const cf = context.request.cf || {};

  const country = cf.country || "XX";

  let region = "global";

  if (["US", "CA", "MX"].includes(country)) region = "north-america";
  else if (["GB", "FR", "DE", "IT", "ES", "NL", "SE", "NO", "FI"].includes(country)) region = "europe";
  else if (["JP", "KR", "CN", "TW", "SG", "HK"].includes(country)) region = "asia";
  else if (["BR", "AR", "CL", "CO"].includes(country)) region = "south-america";
  else if (["AU", "NZ"].includes(country)) region = "oceania";
  else if (["ZA", "NG", "EG", "KE"].includes(country)) region = "africa";

  return new Response(JSON.stringify({
    country,
    region
  }, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
}
