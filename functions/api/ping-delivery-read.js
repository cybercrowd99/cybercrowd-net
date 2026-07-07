/**
 * functions/api/ping-delivery-read.js
 *
 * CyberCrowd PING Delivery Read
 *
 * ONE JOB:
 * Read delivery records for one ping.
 *
 * This does NOT create delivery.
 * This does NOT update ping status.
 * This does NOT acknowledge the ping.
 */

import { json, cleanText } from "../ping-shared/ping-basic.js";
import { readVerifiedIdentity } from "../ping-shared/ping-session.js";
import { readJsonKey, readIndex } from "../ping-shared/ping-kv.js";

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestGet(context) {
  const { request, env } = context;

  if (!env || !env.IDENTITY) {
    return json({ ok: false, error: "IDENTITY_KV_MISSING" }, 500);
  }

  const identityId = await readVerifiedIdentity(request, env);

  if (!identityId) {
    return json({ ok: false, error: "SESSION_REQUIRED" }, 401);
  }

  const url = new URL(request.url);
  const pingId = cleanText(url.searchParams.get("ping_id") || url.searchParams.get("pingId"));

  if (!pingId) {
    return json({ ok: false, error: "PING_ID_REQUIRED" }, 400);
  }

  const ping = await readJsonKey(env, "ping:" + pingId);

  if (!ping) {
    return json({ ok: false, error: "PING_NOT_FOUND" }, 404);
  }

  if (ping.from_identity_id !== identityId && ping.to_identity_id !== identityId) {
    return json({ ok: false, error: "PING_ACCESS_DENIED" }, 403);
  }

  const ids = await readIndex(env, "ping-delivery:index:ping:" + pingId);
  const deliveries = [];

  for (const id of ids) {
    const delivery = await readJsonKey(env, "ping-delivery:" + id);

    if (!delivery) continue;

    deliveries.push({
      id: delivery.id,
      ping_id: delivery.ping_id,
      carrier_route_id: delivery.carrier_route_id || null,
      surface: delivery.surface || "unknown",
      carrier: delivery.carrier || "internal",
      status: delivery.status || "unknown",
      delivered_at: delivery.delivered_at || null
    });
  }

  return json({
    ok: true,
    ping_id: pingId,
    count: deliveries.length,
    deliveries
  });
}
