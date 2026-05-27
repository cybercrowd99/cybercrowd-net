export function routingGate(integrityValue, routes) {
  // integrityValue is 1 (safe) or 0 (blocked)
  if (integrityValue !== 1) {
    return [];
  }

  // routes is an array like ["twitch", "youtube", "rtmp"]
  return routes;
}
