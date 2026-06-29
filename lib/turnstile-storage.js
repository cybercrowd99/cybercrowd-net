// lib/turnstile-storage.js
// identity / presence-turnstile-storage
//
// Storage adapter for the Presence Turnstile lane.
//
// Owns:
// - tenant lookup
// - session lookup
// - presence-token verification
// - last_seen update
//
// Does NOT:
// - grant access
// - elevate authority
// - handle collapse intent
// - allocate ports
// - render UI / HTML

export class TurnstileStorage {
  constructor(kv) {
    if (!kv) {
      throw new Error("TURNSTILE_STORAGE_BINDING_REQUIRED");
    }

    this.kv = kv;
  }

  async getTenant(tenant_id) {
    const tenant = cleanId(tenant_id);

    if (!tenant) {
      return null;
    }

    const record = await this.getJson(tenantKey(tenant));

    if (!record) {
      return null;
    }

    if (record.tenant_id && record.tenant_id !== tenant) {
      return null;
    }

    if (record.status === "disabled" || record.status === "revoked") {
      return null;
    }

    return {
      ...record,
      tenant_id: record.tenant_id || tenant
    };
  }

  async getSession(session_id) {
    const session = cleanId(session_id);

    if (!session) {
      return null;
    }

    const record = await this.getJson(sessionKey(session));

    if (!record) {
      return null;
    }

    if (record.session_id && record.session_id !== session) {
      return null;
    }

    if (record.status === "disabled" || record.status === "revoked") {
      return null;
    }

    return {
      ...record,
      session_id: record.session_id || session
    };
  }

  async verifyPresence(tenant_id, session_id, presence_token) {
    const tenant = cleanId(tenant_id);
    const session = cleanId(session_id);
    const token = cleanToken(presence_token);

    if (!tenant || !session || !token) {
      return false;
    }

    const record = await this.getJson(presenceKey(tenant, session, token));

    if (!record) {
      return false;
    }

    if (record.tenant_id !== tenant) {
      return false;
    }

    if (record.session_id !== session) {
      return false;
    }

    if (record.presence_token && record.presence_token !== token) {
      return false;
    }

    if (record.status === "disabled" || record.status === "revoked") {
      return false;
    }

    const now = Date.now();
    const expiresAt = Number(record.expires_at_ms || 0);

    if (Number.isFinite(expiresAt) && expiresAt > 0 && now >= expiresAt) {
      return false;
    }

    return true;
  }

  async updateLastSeen(session_id, now_ms) {
    const session = cleanId(session_id);
    const now = Number(now_ms);

    if (!session) {
      return false;
    }

    if (!Number.isFinite(now) || now <= 0) {
      return false;
    }

    const key = sessionKey(session);
    const record = await this.getJson(key);

    if (!record) {
      return false;
    }

    const next = {
      ...record,
      session_id: record.session_id || session,
      last_seen: now,
      updated_at_ms: now
    };

    await this.putJson(key, next);

    return true;
  }

  // Build/test helper.
  // Presence issuance can later move into its own organ.
  async putTenant(tenant_id, record = {}) {
    const tenant = cleanId(tenant_id);

    if (!tenant) {
      return false;
    }

    const now = Date.now();

    await this.putJson(tenantKey(tenant), {
      tenant_id: tenant,
      status: "active",
      created_at_ms: now,
      updated_at_ms: now,
      ...record
    });

    return true;
  }

  // Build/test helper.
  async putSession(session_id, record = {}) {
    const session = cleanId(session_id);

    if (!session) {
      return false;
    }

    const now = Date.now();

    await this.putJson(sessionKey(session), {
      session_id: session,
      status: "active",
      created_at_ms: now,
      updated_at_ms: now,
      last_seen: now,
      ...record
    });

    return true;
  }

  // Build/test helper.
  async putPresence(tenant_id, session_id, presence_token, record = {}) {
    const tenant = cleanId(tenant_id);
    const session = cleanId(session_id);
    const token = cleanToken(presence_token);

    if (!tenant || !session || !token) {
      return false;
    }

    const now = Date.now();

    await this.putJson(presenceKey(tenant, session, token), {
      tenant_id: tenant,
      session_id: session,
      presence_token: token,
      status: "active",
      issued_at_ms: now,
      created_at_ms: now,
      updated_at_ms: now,
      ...record
    });

    return true;
  }

  async revokePresence(tenant_id, session_id, presence_token) {
    const tenant = cleanId(tenant_id);
    const session = cleanId(session_id);
    const token = cleanToken(presence_token);

    if (!tenant || !session || !token) {
      return false;
    }

    const key = presenceKey(tenant, session, token);
    const record = await this.getJson(key);

    if (!record) {
      return false;
    }

    await this.putJson(key, {
      ...record,
      status: "revoked",
      revoked_at_ms: Date.now()
    });

    return true;
  }

  async getJson(key) {
    if (!key) {
      return null;
    }

    const value = await this.kv.get(key, { type: "json" });

    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return null;
    }

    return value;
  }

  async putJson(key, value) {
    await this.kv.put(key, JSON.stringify(value));
  }
}

export function tenantKey(tenant_id) {
  return `presence:tenant:${tenant_id}`;
}

export function sessionKey(session_id) {
  return `presence:session:${session_id}`;
}

export function presenceKey(tenant_id, session_id, presence_token) {
  return `presence:token:${tenant_id}:${session_id}:${presence_token}`;
}

function cleanId(value) {
  if (typeof value !== "string") {
    return null;
  }

  const clean = value.trim();

  if (!clean) {
    return null;
  }

  if (clean.length > 160) {
    return null;
  }

  if (!/^[a-zA-Z0-9._:@/-]+$/.test(clean)) {
    return null;
  }

  return clean;
}

function cleanToken(value) {
  if (typeof value !== "string") {
    return null;
  }

  const clean = value.trim();

  if (!clean) {
    return null;
  }

  if (clean.length > 512) {
    return null;
  }

  if (!/^[a-zA-Z0-9._:@/+=$-]+$/.test(clean)) {
    return null;
  }

  return clean;
}
