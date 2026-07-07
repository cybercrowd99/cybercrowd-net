/**
 * functions/api/ping-delivery-create.js
 *
 * CyberCrowd PING Delivery Create
 *
 * ONE JOB:
 * Record final delivery after a selected carrier route exists.
 *
 * This does NOT create a ping.
 * This does NOT choose a carrier route.
 * This does NOT acknowledge the ping.
 * This does NOT read delivery history.
 */

import { json, readJson, cleanText, makeId } from "../ping-shared/ping-basic.js";
import { readVerifiedIdentity } from "../ping-shared/ping-session.js";
import { readJsonKey, appendIndex } from "../ping-shared/ping-kv.js";
import { appendSync } from "../ping-shared/ping-sync.js";
import { checkCarrierRouteForDelivery } from "../ping-shared/carrier-route-check.js";

const DELIVERY_TTL_SECONDS = 60 * 60 * 24 * 30;
const INDEX_TTL_SECONDS = 60 * 60 * 24 * 90;

const ALLOWED_DELIVERY_STATUS = new Set([
  "delivered",
  "visible",
  "queued",
  "failed",
  "missed"
]);

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env || !env.IDENTITY) {
    return json({ ok: false, error: "IDENTITY_KV_MISSING" }, 500);
  }

  const actorIdentityId = await readVerifiedIdentity(request, env);

  if (!actorIdentityId) {
    return json({ ok: false, error: "SESSION_REQUIRED" }, 401);
  }

  const body = await readJson(request);

  if (!body) {
    return json({ ok: false, error: "JSON_REQUIRED" }, 400);
  }

  const pingId = cleanText(body.ping_id || body.pingId || body.id);

  if (!pingId) {
    return json({ ok: false, error: "PING_ID_REQUIRED" }, 400);
  }

  const ping = await readJsonKey(env, "ping:" + pingId);

  if (!ping) {
    return json({ ok: false, error: "PING_NOT_FOUND" }, 404);
  }

  const routeId = cleanText(
    body.carrier_route_id ||
    body.carrierRouteId ||
    body.route_id ||
    body.routeId ||
    ping.carrier_route_id ||
    ping.route_id
  );

  if (!routeId) {
    return json({ ok: false, error: "CARRIER_ROUTE_REQUIRED" }, 409);
  }

  const route = await readJsonKey(env, "carrier-route:" + routeId);

  if (!route) {
    return json({ ok: false, error: "CARRIER_ROUTE_NOT_FOUND" }, 404);
  }

  const routeCheck = checkCarrierRouteForDelivery(ping, route, actorIdentityId);

  if (!routeCheck.ok) {
    return json({
      ok: false,
      error: routeCheck.error,
      reason: routeCheck.reason
    }, routeCheck.status);
  }

  const status = cleanText(body.status || "delivered").toLowerCase();

  if (!ALLOWED_DELIVERY_STATUS.has(status)) {
    return json({
      ok: false,
      error: "DELIVERY_STATUS_NOT_ALLOWED",
      allowed: Array.from(ALLOWED_DELIVERY_STATUS)
    }, 400);
  }

  const now = new Date().toISOString();
  const deliveryId = makeId("DELIVERY");

  const delivery = {
    id: deliveryId,
    ping_id: pingId,
    carrier_route_id: routeId,

    from_identity_id: ping.from_identity_id,
    to_identity_id: ping.to_identity_id,
    actor_identity_id: actorIdentityId,

    surface: cleanText(body.surface || route.surface || ping.surface || "unknown"),
    carrier: cleanText(body.carrier || route.carrier || "internal"),
    status,

    object_id: ping.object_id || null,
    intent_id: ping.intent_id || null,

    delivered_at: now,
    created_at: now,
    updated_at: now
  };

  await env.IDENTITY.put(
    "ping-delivery:" + delivery.id,
    JSON.stringify(delivery),
    { expirationTtl: DELIVERY_TTL_SECONDS }
  );

  await appendIndex(env, "ping-delivery:index:ping:" + pingId, delivery.id);
  await appendIndex(env, "ping-delivery:index:to:" + ping.to_identity_id, delivery.id);

  const nextPing = {
    ...ping,
    carrier_route_id: routeId,
    delivery_id: delivery.id,
    delivery_status: status,
    status: status === "failed" ? "delivery_failed" : "delivered",
    delivered_at: now,
    updated_at: now
  };

  await env.IDENTITY.put(
    "ping:" + pingId,
    JSON.stringify(nextPing),
    { expirationTtl: DELIVERY_TTL_SECONDS }
  );

  await appendSync(env, pingId, {
    type: "ping_delivered",
    ping_id: pingId,
    delivery_id: delivery.id,
    carrier_route_id: routeId,
    status,
    at: now
  });

  return json({
    ok: true,
    delivery_id: delivery.id,
    ping_id: pingId,
    carrier_route_id: routeId,
    status
  });
}
