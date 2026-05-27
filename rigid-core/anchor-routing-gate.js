export function anchorRoutingGate(integrityValue, routes) {
  // if the ground says "not safe", nothing leaves
  if (integrityValue !== 1) {
    return [];
  }

  // if safe, return the allowed routes
  return routes;
}
