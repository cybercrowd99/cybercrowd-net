# CYBERCROWD LIVE R2 BUCKET CREATION

Execute in Cloudflare dashboard
OR terminal with Wrangler authenticated.

---

# CREATE ORDER

## 1
cybercrowd-ledger-events

Purpose:
Canonical append-only ledger authority.

Visibility:
Private

---

## 2
cybercrowd-replay

Purpose:
Replay survivability engine.

Visibility:
Private

---

## 3
cybercrowd-deadletter

Purpose:
Malformed payload quarantine.

Visibility:
Private

---

## 4
cybercrowd-archive

Purpose:
Canonical historical continuity archive.

Visibility:
Private

---

## 5
cybercrowd-lineage

Purpose:
Ownership and provenance authority.

Visibility:
Private

---

## 6
cybercrowd-governance

Purpose:
Governance overrides and audit authority.

Visibility:
Private

---

## 7
cybercrowd-node-heartbeats

Purpose:
Mesh telemetry and heartbeat propagation.

Visibility:
Private

---

## 8
cybercrowd-sequester

Purpose:
Raw intake quarantine layer.

Visibility:
Private

---

## 9
cybercrowd-graphics

Purpose:
Static overlays and graphics delivery.

Visibility:
Public

---

## 10
cybercrowd-teasers

Purpose:
Public teaser media delivery.

Visibility:
Public

---

## 11
cybercrowd-surface-cache

Purpose:
Accelerated public edge cache.

Visibility:
Public

---

## 12
cybercrowd-album

Purpose:
Long-form creator media archive.

Visibility:
Private

---

# POST-CREATION RULES

DO NOT:
- attach all buckets immediately
- expose private buckets publicly
- bind governance into public workers
- route replay into cache layer
- merge archive with cache systems

NEXT PHASE:
Worker bucket bindings.
