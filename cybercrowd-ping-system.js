/**
 * cybercrowd-ping-system.js
 *
 * CyberCrowd PING System
 *
 * ONE JOB:
 * Create free relevant movement from:
 *
 * IDENTITY
 * I CAN
 * Evidence
 * Object
 * Intent
 * Proximity
 * SYNC
 * Magic Cursor surface
 *
 * This is NOT email.
 * This is NOT chat.
 * This is NOT search.
 * This is the PING layer.
 */

const CyberCrowdPingSystem = (() => {
  const identities = new Map();
  const capabilities = new Map();
  const objects = new Map();
  const intents = new Map();
  const pings = new Map();
  const sync = new Map();
  const presence = new Map();

  const carriers = new Map();

  const CONFIG = {
    defaultRadiusMiles: 5,
    maxIntentAgeMs: 1000 * 60 * 60 * 24 * 30,
    allowSelfPing: false
  };

  function now() {
    return new Date().toISOString();
  }

  function makeId(prefix) {
    return prefix + "." + Date.now() + "." + Math.random().toString(36).slice(2, 10);
  }

  function cleanText(value) {
    if (typeof value !== "string") return "";
    return value.trim();
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function normalizeTags(value) {
    if (!value) return [];

    const list = Array.isArray(value)
      ? value
      : String(value).split(",");

    return Array.from(
      new Set(
        list
          .map((item) => String(item).trim().toLowerCase())
          .filter(Boolean)
      )
    );
  }

  function words(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .split(/\s+/)
      .filter(Boolean);
  }

  function normalizeArea(area) {
    if (!area || typeof area !== "object") return null;

    const lat = Number(area.lat);
    const lng = Number(area.lng);

    return {
      label: cleanText(area.label),
      lat: Number.isFinite(lat) ? lat : null,
      lng: Number.isFinite(lng) ? lng : null
    };
  }

  function milesBetween(a, b) {
    if (!a || !b) return Infinity;
    if (!Number.isFinite(a.lat) || !Number.isFinite(a.lng)) return Infinity;
    if (!Number.isFinite(b.lat) || !Number.isFinite(b.lng)) return Infinity;

    const earthMiles = 3958.7613;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);

    const h =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) *
        Math.cos(lat2) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    return 2 * earthMiles * Math.asin(Math.sqrt(h));
  }

  function toRad(value) {
    return value * Math.PI / 180;
  }

  function requireIdentity(identityId) {
    if (!identityId || !identities.has(identityId)) {
      throw new Error("IDENTITY_NOT_FOUND");
    }
  }

  function addSync(targetId, event) {
    if (!sync.has(targetId)) {
      sync.set(targetId, []);
    }

    sync.get(targetId).push({
      sync_id: makeId("SYNC"),
      at: now(),
      ...event
    });
  }

  function createIdentity(input) {
    const id = cleanText(input && input.id) || makeId("IDL");

    const identity = {
      id,
      name: cleanText(input && input.name) || id,
      respect: Number(input && input.respect) || 0,
      area: normalizeArea(input && input.area),
      created_at: now(),
      updated_at: now(),
      metadata: (input && input.metadata) || {}
    };

    identities.set(id, identity);

    addSync(id, {
      type: "identity_created"
    });

    return clone(identity);
  }

  function attachICan(identityId, statement, evidence) {
    requireIdentity(identityId);

    const id = makeId("ICAN");

    const capability = {
      id,
      identity_id: identityId,
      statement: cleanText(statement),
      evidence: Array.isArray(evidence) ? evidence : [evidence || {}],
      created_at: now(),
      active: true
    };

    if (!capability.statement) {
      throw new Error("ICAN_REQUIRED");
    }

    capabilities.set(id, capability);

    addSync(identityId, {
      type: "ican_attached",
      capability_id: id,
      statement: capability.statement
    });

    return clone(capability);
  }

  function publishObject(input) {
    const ownerIdentityId = input && input.owner_identity_id;

    requireIdentity(ownerIdentityId);

    const id = cleanText(input.id) || makeId("OBJ");

    const object = {
      id,
      owner_identity_id: ownerIdentityId,
      title: cleanText(input.title) || "Untitled Object",
      type: cleanText(input.type) || "object",
      tags: normalizeTags(input.tags),
      area: normalizeArea(input.area),
      status: cleanText(input.status) || "available",
      price: input.price || null,
      created_at: now(),
      updated_at: now(),
      metadata: input.metadata || {}
    };

    objects.set(id, object);

    addSync(id, {
      type: "object_published",
      owner_identity_id: ownerIdentityId
    });

    return clone(object);
  }

  function rememberIntent(input) {
    const identityId = input && input.identity_id;

    requireIdentity(identityId);

    const id = cleanText(input.id) || makeId("INTENT");

    const intent = {
      id,
      identity_id: identityId,
      phrase: cleanText(input.phrase),
      tags: normalizeTags(input.tags),
      area: normalizeArea(input.area),
      radius_miles: Number(input.radius_miles) || CONFIG.defaultRadiusMiles,
      created_at: now(),
      active: true,
      metadata: input.metadata || {}
    };

    if (!intent.phrase && intent.tags.length === 0) {
      throw new Error("INTENT_REQUIRED");
    }

    intents.set(id, intent);

    addSync(identityId, {
      type: "intent_remembered",
      intent_id: id,
      phrase: intent.phrase
    });

    return clone(intent);
  }

  function setPresence(identityId, input) {
    requireIdentity(identityId);

    const record = {
      identity_id: identityId,
      active_surface: cleanText(input && input.active_surface),
      looking_at: cleanText(input && input.looking_at),
      surfaces: Array.isArray(input && input.surfaces) ? input.surfaces : [],
      updated_at: now()
    };

    presence.set(identityId, record);

    return clone(record);
  }

  function chooseSurface(identityId) {
    const record = presence.get(identityId);

    if (!record) return null;
    if (record.looking_at) return record.looking_at;
    if (record.active_surface) return record.active_surface;
    if (record.surfaces.length) return record.surfaces[0];

    return null;
  }

  function objectMatchesIntent(object, intent) {
    if (!object || object.status !== "available") {
      return {
        match: false,
        reason: "object_not_available"
      };
    }

    const objectWords = new Set([
      ...words(object.title),
      ...words(object.type),
      ...object.tags
    ]);

    const intentWords = new Set([
      ...words(intent.phrase),
      ...intent.tags
    ]);

    let score = 0;

    intentWords.forEach((word) => {
      if (objectWords.has(word)) score += 1;
    });

    if (score <= 0) {
      return {
        match: false,
        reason: "no_capability_or_object_match"
      };
    }

    const distance = milesBetween(intent.area, object.area);

    if (Number.isFinite(distance) && distance > intent.radius_miles) {
      return {
        match: false,
        reason: "outside_proximity",
        distance_miles: Math.round(distance * 100) / 100
      };
    }

    return {
      match: true,
      reason: "intent_met_object_in_proximity",
      score,
      distance_miles: Number.isFinite(distance)
        ? Math.round(distance * 100) / 100
        : null
    };
  }

  function createPing(input) {
    const fromIdentityId = input.from_identity_id;
    const toIdentityId = input.to_identity_id;

    requireIdentity(fromIdentityId);
    requireIdentity(toIdentityId);

    if (!CONFIG.allowSelfPing && fromIdentityId === toIdentityId) {
      throw new Error("SELF_PING_BLOCKED");
    }

    const id = makeId("PING");

    const ping = {
      id,
      kind: cleanText(input.kind) || "relevant_movement",
      from_identity_id: fromIdentityId,
      to_identity_id: toIdentityId,
      object_id: input.object_id || null,
      intent_id: input.intent_id || null,
      reason: cleanText(input.reason) || "Relevant movement",
      surface: chooseSurface(toIdentityId),
      free: true,
      status: "created",
      created_at: now(),
      routed_at: null,
      metadata: input.metadata || {}
    };

    pings.set(id, ping);

    addSync(id, {
      type: "ping_created",
      kind: ping.kind,
      from_identity_id: fromIdentityId,
      to_identity_id: toIdentityId,
      object_id: ping.object_id,
      intent_id: ping.intent_id
    });

    routePing(id);

    return clone(pings.get(id));
  }

  function routePing(pingId) {
    const ping = pings.get(pingId);

    if (!ping) {
      throw new Error("PING_NOT_FOUND");
    }

    carriers.forEach((handler, name) => {
      try {
        handler(clone(ping));
      } catch (error) {
        addSync(ping.id, {
          type: "carrier_failed",
          carrier: name,
          error: error.message
        });
      }
    });

    ping.status = "routed";
    ping.routed_at = now();

    return clone(ping);
  }

  function noticeObject(input) {
    const object = input.id && objects.has(input.id)
      ? objects.get(input.id)
      : publishObject(input);

    const matches = [];

    intents.forEach((intent) => {
      if (!intent.active) return;

      const age = Date.now() - new Date(intent.created_at).getTime();

      if (age > CONFIG.maxIntentAgeMs) return;

      if (!CONFIG.allowSelfPing && intent.identity_id === object.owner_identity_id) {
        return;
      }

      const result = objectMatchesIntent(object, intent);

      if (!result.match) return;

      const ping = createPing({
        kind: "proximity_match",
        from_identity_id: intent.identity_id,
        to_identity_id: object.owner_identity_id,
        object_id: object.id,
        intent_id: intent.id,
        reason: result.reason,
        metadata: {
          match: result,
          intent_phrase: intent.phrase,
          object_title: object.title
        }
      });

      matches.push({
        intent: clone(intent),
        object: clone(object),
        ping
      });
    });

    return {
      object: clone(object),
      matches,
      count: matches.length
    };
  }

  function selectObject(identityId, objectId) {
    requireIdentity(identityId);

    const object = objects.get(objectId);

    if (!object) {
      throw new Error("OBJECT_NOT_FOUND");
    }

    return createPing({
      kind: "human_selection",
      from_identity_id: identityId,
      to_identity_id: object.owner_identity_id,
      object_id: object.id,
      reason: "Human selected object",
      metadata: {
        object_title: object.title
      }
    });
  }

  function registerCarrier(name, handler) {
    const cleanName = cleanText(name);

    if (!cleanName || typeof handler !== "function") {
      throw new Error("CARRIER_REQUIRED");
    }

    carriers.set(cleanName, handler);

    return true;
  }

  function getSync(targetId) {
    return clone(sync.get(targetId) || []);
  }

  function listPings(identityId) {
    requireIdentity(identityId);

    return Array.from(pings.values())
      .filter((ping) => {
        return ping.from_identity_id === identityId || ping.to_identity_id === identityId;
      })
      .map(clone);
  }

  function exportState() {
    return clone({
      identities: Array.from(identities.values()),
      capabilities: Array.from(capabilities.values()),
      objects: Array.from(objects.values()),
      intents: Array.from(intents.values()),
      pings: Array.from(pings.values()),
      sync: Array.from(sync.entries()),
      presence: Array.from(presence.values())
    });
  }

  registerCarrier("internal", function internalCarrier(ping) {
    addSync(ping.id, {
      type: "carrier_internal",
      status: "queued"
    });
  });

  return {
    createIdentity,
    attachICan,
    publishObject,
    rememberIntent,
    setPresence,
    noticeObject,
    selectObject,
    createPing,
    routePing,
    registerCarrier,
    getSync,
    listPings,
    exportState
  };
})();

if (typeof window !== "undefined") {
  window.CyberCrowdPingSystem = CyberCrowdPingSystem;
}

export default CyberCrowdPingSystem;
