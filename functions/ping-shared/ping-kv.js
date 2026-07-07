/**
 * functions/ping-shared/ping-kv.js
 *
 * CyberCrowd PING KV Helper
 *
 * ONE JOB:
 * Read JSON keys and append simple ID indexes in IDENTITY KV.
 */

const INDEX_TTL_SECONDS = 60 * 60 * 24 * 90;
const MAX_INDEX_ITEMS = 100;

export async function readJsonKey(env, key) {
  if (!env || !env.IDENTITY || !key) {
    return null;
  }

  const raw = await env.IDENTITY.get(key);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function readIndex(env, key) {
  if (!env || !env.IDENTITY || !key) {
    return [];
  }

  const raw = await env.IDENTITY.get(key);

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);

    if (Array.isArray(parsed)) {
      return parsed.filter((item) => typeof item === "string" && item.trim());
    }

    return [];
  } catch {
    return [];
  }
}

export async function appendIndex(env, key, value) {
  if (!env || !env.IDENTITY || !key || !value) {
    return;
  }

  const raw = await env.IDENTITY.get(key);

  let list = [];

  if (raw) {
    try {
      const parsed = JSON.parse(raw);

      if (Array.isArray(parsed)) {
        list = parsed;
      }
    } catch {
      list = [];
    }
  }

  list = list.filter((item) => item !== value);
  list.unshift(value);
  list = list.slice(0, MAX_INDEX_ITEMS);

  await env.IDENTITY.put(key, JSON.stringify(list), {
    expirationTtl: INDEX_TTL_SECONDS
  });
}
