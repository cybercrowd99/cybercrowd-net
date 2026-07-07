/**
 * functions/ping-shared/carrier-route-check.js
 *
 * CyberCrowd Carrier Route Check
 *
 * ONE JOB:
 * Confirm a selected carrier route belongs to this ping.
 */

import { cleanText } from "./ping-basic.js";

export function checkCarrierRouteForDelivery(ping, route, actorIdentityId) {
  const routeId = cleanText(route.id || route.route_id || route.routeId);
  const routePingId = cleanText(route.ping_id || route.pingId);
  const routeStatus = cleanText(route.status).toLowerCase();

  if (!routeId) {
    return fail(500, "CARRIER_ROUTE_ID_MISSING", "route_record_missing_id");
  }

  if (routePingId !== ping.id && routePingId !== ping.ping_id) {
    return fail(409, "CARRIER_ROUTE_PING_MISMATCH", "route_does_not_belong_to_ping");
  }

  if (routeStatus !== "selected") {
    return fail(409, "CARRIER_ROUTE_NOT_SELECTED", "route_status_must_be_selected");
  }

  if (actorIdentityId !== ping.from_identity_id && actorIdentityId !== ping.to_identity_id) {
    return fail(403, "DELIVERY_ACCESS_DENIED", "actor_not_part_of_ping");
  }

  return {
    ok: true,
    status: 200,
    reason: "carrier_route_valid"
  };
}

function fail(status, error, reason) {
  return {
    ok: false,
    status,
    error,
    reason
  };
}
