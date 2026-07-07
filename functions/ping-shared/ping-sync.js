/**
 * functions/ping-shared/ping-sync.js
 *
 * CyberCrowd PING Sync Append
 *
 * ONE JOB:
 * Append one sync event to one target trail.
 */

import { makeId } from "./ping-basic.js";

const INDEX_TTL_SECONDS = 60 * 60 * 24 * 90;
const MAX_SYNC_ITEMS = 100;

export async function appendSync(env, targetId, event) {
  if (!env || !env.IDENTITY || !targetId || !event) {
    return;
  }

  const key = "sync:" + targetId;
  const raw = await env.IDENTITY.get(key);

  let trail = [];

  if (raw) {
    try {
      const parsed = JSON.parse(raw);

      if (Array.isArray(parsed)) {
        trail = parsed;
      }
    } catch {
      trail = [];
    }
  }

  trail.unshift({
    sync_id: makeId("SYNC"),
    ...event
  });

  trail = trail.slice(0, MAX_SYNC_ITEMS);

  await env.IDENTITY.put(key, JSON.stringify(trail), {
    expirationTtl: INDEX_TTL_SECONDS
  });
}
