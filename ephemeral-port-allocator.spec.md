# Ephemeral Port Allocator — Specification

## 1. Purpose

Define a deterministic, concurrency-safe **ephemeral port allocator** that:
- Avoids port collisions across many concurrent callers.
- Reclaims ports quickly and predictably when clients disappear.
- Exposes enough state to debug “port exhaustion” and “stuck lease” issues.
- Can be implemented in a serverless / distributed environment.

This spec is **behavioral**: it describes inputs, outputs, invariants, and failure modes,
not a specific language or framework.

---

## 2. Port range and configuration

**Config parameters:**

- **`PORT_MIN`**:  
  \- Type: integer  
  \- Example: `49152`  
  \- Meaning: inclusive lower bound of ephemeral port range.

- **`PORT_MAX`**:  
  \- Type: integer  
  \- Example: `65535`  
  \- Meaning: inclusive upper bound of ephemeral port range.

- **`LEASE_TTL_MS`**:  
  \- Type: integer  
  \- Example: `30000` (30 seconds)  
  \- Meaning: maximum time a lease is valid without heartbeat.

- **`HEARTBEAT_GRACE_MS`**:  
  \- Type: integer  
  \- Example: `10000` (10 seconds)  
  \- Meaning: grace window after TTL before lease is considered reclaimable.

- **`MAX_RETRIES_PER_REQUEST`**:  
  \- Type: integer  
  \- Example: `8`  
  \- Meaning: maximum attempts to find a free port before returning “exhausted”.

**Invariants:**

- `PORT_MIN < PORT_MAX`
- The total capacity is `CAPACITY = PORT_MAX - PORT_MIN + 1`.
- The allocator MUST never return a port outside `[PORT_MIN, PORT_MAX]`.

---

## 3. Data model

### 3.1 Lease record

Each allocated port is represented as a **lease**:

- **`port`**: integer (within `[PORT_MIN, PORT_MAX]`)
- **`tenant_id`**: string (logical owner; e.g. service, user, or organ)
- **`lease_id`**: string (unique per allocation; UUID or similar)
- **`created_at_ms`**: integer (epoch ms)
- **`last_heartbeat_ms`**: integer (epoch ms)
- **`status`**: enum: `"active" | "reclaiming" | "expired"`

**Primary key:**

- `port` is globally unique at any time.
- Secondary index by `tenant_id` is recommended for debugging and cleanup.

### 3.2 Global cursor

To achieve deterministic, fair allocation, the allocator maintains a **global cursor**:

- **`cursor_port`**: integer in `[PORT_MIN, PORT_MAX]`

Semantics:

- Each allocation attempt starts from `cursor_port`, scanning forward (wrapping at `PORT_MAX`).
- When a port is successfully allocated, `cursor_port` is advanced to `port + 1` (with wrap).
- The cursor is stored in a shared, atomic location (e.g. a single row or DO).

---

## 4. Operations

### 4.1 Allocate port

**Endpoint (conceptual):**

- `allocate(tenant_id: string) -> AllocationResult`

**AllocationResult:**

- **`ok`**: boolean
- **`port`**: integer | null
- **`lease_id`**: string | null
- **`reason`**: string | null (e.g. `"exhausted"`, `"invalid-tenant"`, `"internal-error"`)

**Algorithm (high-level):**

1. **Validate input**  
   - If `tenant_id` is empty or invalid, return `{ ok: false, reason: "invalid-tenant" }`.

2. **Load cursor**  
   - Read `cursor_port`. If missing, initialize to `PORT_MIN`.

3. **Scan for free port**  
   - For up to `MAX_RETRIES_PER_REQUEST` *or* `CAPACITY` iterations (whichever is smaller):
     1. Let `candidate = cursor_port`.
     2. If `candidate > PORT_MAX`, wrap to `PORT_MIN`.
     3. Check lease record for `candidate`:
        - If **no record** exists → treat as free.
        - If record exists:
          - If `status = "active"` and not expired → skip.
          - If expired or reclaimable → attempt to **reclaim** (see 4.3).
     4. If free or reclaimable:
        - Create new lease:
          - `port = candidate`
          - `tenant_id = input tenant`
          - `lease_id = new UUID`
          - `created_at_ms = now`
          - `last_heartbeat_ms = now`
          - `status = "active"`
        - Persist lease atomically with a **conditional write**:
          - Condition: no conflicting active lease for `port`.
        - If conditional write fails (race), advance `cursor_port` and continue.
        - If write succeeds:
          - Advance `cursor_port = candidate + 1` (with wrap).
          - Return `{ ok: true, port: candidate, lease_id }`.

4. **Exhaustion**  
   - If no port can be allocated after the scan:
     - Return `{ ok: false, reason: "exhausted" }`.

**Concurrency requirement:**

- The allocator MUST use atomic / conditional operations so that two concurrent
  allocators cannot both successfully allocate the same `port`.

---

### 4.2 Heartbeat

**Endpoint:**

- `heartbeat(tenant_id: string, lease_id: string, port: number) -> HeartbeatResult`

**HeartbeatResult:**

- **`ok`**: boolean
- **`reason`**: string | null (e.g. `"not-found"`, `"tenant-mismatch"`, `"expired"`)

**Behavior:**

1. Lookup lease by `port`.
2. If no lease → `{ ok: false, reason: "not-found" }`.
3. If `lease.lease_id != lease_id` → `{ ok: false, reason: "not-found" }` (treat as stale).
4. If `lease.tenant_id != tenant_id` → `{ ok: false, reason: "tenant-mismatch" }`.
5. Compute `now_ms`.
6. If `now_ms > lease.created_at_ms + LEASE_TTL_MS + HEARTBEAT_GRACE_MS`:
   - Lease is considered **expired**; allocator MAY:
     - Mark `status = "expired"`.
     - Return `{ ok: false, reason: "expired" }`.
7. Otherwise:
   - Update `last_heartbeat_ms = now_ms`.
   - Ensure `status = "active"`.
   - Return `{ ok: true, reason: null }`.

---

### 4.3 Reclaim

Reclaim is triggered in two ways:

- **Inline reclaim** during allocation (when a candidate port has an expired lease).
- **Background reclaim** via a periodic sweeper.

**Reclaim rules:**

- A lease is reclaimable if:
  - `now_ms > last_heartbeat_ms + LEASE_TTL_MS + HEARTBEAT_GRACE_MS`
- Reclaim action:
  - Delete the lease record OR mark `status = "expired"` and remove it from the active set.
  - Reclaim MUST be atomic with respect to allocation:
    - Use conditional delete/update: only reclaim if `lease_id` and timestamps match.

---

### 4.4 Release

**Endpoint:**

- `release(tenant_id: string, lease_id: string, port: number) -> ReleaseResult`

**ReleaseResult:**

- **`ok`**: boolean
- **`reason`**: string | null

**Behavior:**

1. Lookup lease by `port`.
2. If not found → `{ ok: false, reason: "not-found" }`.
3. If `lease.lease_id != lease_id` → `{ ok: false, reason: "not-found" }`.
4. If `lease.tenant_id != tenant_id` → `{ ok: false, reason: "tenant-mismatch" }`.
5. Delete lease record (or mark `status = "expired"` and remove from active index).
6. Return `{ ok: true, reason: null }`.

---

## 5. Expiration semantics

### 5.1 Active vs expired

- A lease is **active** if:
  - `now_ms <= last_heartbeat_ms + LEASE_TTL_MS`
- A lease is in **grace** if:
  - `last_heartbeat_ms + LEASE_TTL_MS < now_ms <= last_heartbeat_ms + LEASE_TTL_MS + HEARTBEAT_GRACE_MS`
- A lease is **expired** if:
  - `now_ms > last_heartbeat_ms + LEASE_TTL_MS + HEARTBEAT_GRACE_MS`

Allocators MAY reclaim leases in grace, but SHOULD prefer reclaiming only fully expired leases
to avoid flapping when clocks are slightly skewed.

---

## 6. Determinism and fairness

### 6.1 Round-robin cursor

- The global `cursor_port` ensures that allocations sweep the range in a predictable order.
- This avoids “hot spots” where low ports are always used first.

### 6.2 Tenant-aware sharding (optional)

To reduce contention in multi-tenant scenarios, an implementation MAY:

- Derive a **tenant shard offset**:
  - `offset = hash(tenant_id) mod CAPACITY`
- Start scanning from:
  - `candidate = PORT_MIN + ((cursor_port - PORT_MIN + offset) mod CAPACITY)`

This keeps the global cursor but biases each tenant’s search to a different slice of the range.

---

## 7. Observability

The allocator MUST expose at least:

- **`GET /ports/active`** (or equivalent API):
  - Returns a summary:
    - `total_capacity`
    - `active_count`
    - `expired_count` (if tracked)
    - `by_tenant`: array of `{ tenant_id, active_count }` (optional)

- **`GET /ports/tenant/:tenant_id`**:
  - Returns active leases for that tenant:
    - `port`, `lease_id`, `created_at_ms`, `last_heartbeat_ms`, `status`.

- **Metrics (recommended)**:
  - `port_allocations_total`
  - `port_allocations_failed_exhausted_total`
  - `port_reclaims_total`
  - `port_heartbeats_total`
  - `port_heartbeats_failed_total`

---

## 8. Error handling

### 8.1 Exhaustion

- When no port can be allocated:
  - Return `{ ok: false, reason: "exhausted" }`.
  - Do NOT partially allocate or leak leases.

### 8.2 Internal errors

- On backing store failures or unexpected exceptions:
  - Return `{ ok: false, reason: "internal-error" }`.
  - Log full context: tenant, attempted port, cursor, error.

---

## 9. Security and isolation

- `tenant_id` MUST be validated and authenticated by the caller’s auth layer.
- The allocator MUST NOT allow a tenant to:
  - Release or heartbeat another tenant’s lease.
  - Enumerate other tenants’ leases via public APIs.

---

## 10. Implementation notes

- Backing store options:
  - KV + Durable Object
  - Small relational DB with row-level locking
  - Any store that supports conditional writes / CAS

- Recommended:
  - Keep lease records small and indexed by `port`.
  - Use a single “cursor” record with atomic update.

This spec is complete enough to implement a first version of the ephemeral port allocator
and plug it into any organ that needs safe, short-lived port assignments.
