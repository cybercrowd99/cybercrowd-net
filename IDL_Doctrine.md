# IDL Doctrine

## CyberCrowd Identity Doctrine

IDL means **Identity Defense Layer**.

The IDL is the protected layer around a human identity, a session, a lane, and the digital footprint that proves continuity. It is not a login page. It is not a payment gate. It is not a popularity system. It is not an authority engine by itself.

The IDL exists to answer one question:

> Is this identity movement still connected to the protected human lane it claims to belong to?

If the answer is yes, the IDL may allow passage to the next organ.
If the answer is no, the IDL stops the movement.

The IDL does not grant ownership.
The IDL does not elevate authority.
The IDL does not replace consent.
The IDL does not decide value.
The IDL only protects continuity.

---

## 1. Protected Human Center

At the center of the IDL is the protected human.

The human is not treated as a wallet, button, account number, traffic source, or extractable data object. The human is the center of the lane. The surrounding systems exist to protect that human’s continuity, presence, work, memory, movement, and proof.

The human center must not be exposed directly to outside systems.

External organs may request proof.
External organs may request passage.
External organs may request temporary movement.
External organs may not own the human center.

---

## 2. Digital Human Footprint

The digital human footprint is the observable trail that shows a human, session, device, lane, or work event has continuity.

A footprint can include:

* session records
* last seen timestamps
* lane identifiers
* presence tokens
* heartbeat records
* device witness records
* KC proof blocks
* LOT records
* allocator leases
* work or movement proof

The footprint is not the human.
The footprint is evidence around the human.

The footprint may support a decision, but it must not become the owner of the identity.

---

## 3. Presence Turnstile

The Presence Turnstile belongs to the IDL / Presence lane.

It validates:

* tenant identity
* session ownership
* lane continuity
* presence token validity
* session freshness
* last seen timing

It may produce:

* KC block
* LOT block
* symbolic pass result

It does not grant access.
It does not elevate authority.
It does not collapse identity.
It does not allocate ports.
It does not own auth.

The Presence Turnstile only confirms whether a live identity lane may continue moving.

---

## 4. Collapse Gate Separation

The Collapse Gate is not the Presence Turnstile.

The Collapse Gate belongs to the Identity Collapse lane.

It records irreversible human collapse intent, writes the collapse record, and creates the sync trail required for that event.

Presence Turnstile and Collapse Gate must never share the same filename, namespace, or authority lane.

Presence Turnstile asks:

> Is this live identity lane still present and continuous?

Collapse Gate asks:

> Has the human intentionally triggered an irreversible collapse action?

These are different gates.

They must stay separate.

---

## 5. Lane Continuity

A lane is a protected path of movement.

A lane may represent:

* a session
* a worker
* a device
* a job
* a proof trail
* a service organ
* a digital identity path
* a temporary port allocation

Lane continuity means the movement still belongs to the same protected path it started from.

If a session changes lanes without permission, the IDL must reject it.

If a device claims a lane it does not belong to, the IDL must reject it.

If a presence token belongs to another lane, the IDL must reject it.

The lane is the path.
The tenant is the owner context.
The session is the moving state.
The presence token is the proof pulse.

---

## 6. Presence Is Flexible, Authority Is Rigid

Presence may be flexible.

A phone may heartbeat.
A camera may witness.
A mic may submit proof.
A picture may support a work trail.
A session may update last seen.
A device may disappear and return with a new token.

Authority must stay rigid.

A witness cannot become the owner.
A heartbeat cannot become consent.
A camera cannot grant access.
A stale device cannot revive a dead session.
A token cannot elevate itself.

The IDL allows flexible proof around rigid authority.

---

## 7. Obsolete Phone Edge Witnesses

Expired or obsolete phones may operate as low-cost edge witness devices.

They may provide:

* camera proof
* microphone proof
* picture proof
* local presence heartbeat
* lane witness signal
* job proof
* before/after proof
* temporary service presence

They must remain low-trust.

They must not hold master secrets.
They must not own identity.
They must not grant access.
They must not become the final authority.
They must be revocable.
They must be allowed to disappear safely.

An obsolete phone is a witness node, not a crown.

---

## 8. Allocator Relationship

The Ephemeral Port Allocator belongs to the movement layer.

It gives short-lived, collision-safe lanes for temporary service movement.

The allocator may support IDL movement by giving a device, session, worker, or service a temporary safe port or lane. The allocator does not decide identity. It only prevents movement collisions.

The allocator can say:

> This temporary lane is available.

The allocator cannot say:

> This human is authorized.

The IDL protects identity continuity.
The allocator protects temporary movement capacity.

They can work together, but they are not the same organ.

---

## 9. KC Blocks

KC blocks are symbolic proof blocks.

A KC block records that a specific validation decision occurred.

For the Presence Turnstile, a KC block may show:

* tenant ID
* session ID
* lane ID
* decision
* timestamp
* symbolic proof context

KC blocks do not create authority by themselves.

They are proof records, not crowns.

---

## 10. LOT Blocks

LOT means the ledger-of-trace style proof trail used to record where a decision belongs.

A LOT block may show:

* lot name
* item name
* tenant ID
* session ID
* lane ID
* timestamp

LOT blocks are used to preserve traceability.

They do not replace the human.
They do not override consent.
They do not grant permanent authority.

They show what happened, where it happened, and which lane it belonged to.

---

## 11. TTL and Last Seen Doctrine

A session must remain fresh.

The IDL must check:

* TTL is valid
* last_seen is valid
* last_seen is not in the future
* session age has not exceeded TTL
* expired sessions are rejected

Bad TTL means the system configuration is unsafe.
Bad last_seen means the session record is unsafe.
Future last_seen means clock drift or corrupted state.
Expired session means the lane is no longer fresh.

Freshness protects the human center from stale movement.

---

## 12. Turnstile Response Doctrine

A turnstile response should be clear and symbolic.

Failure reasons should be specific enough to debug without exposing secrets.

Examples:

* method-not-allowed
* invalid-json
* missing-fields
* tenant-not-found
* session-mismatch
* lane-mismatch
* presence-invalid
* invalid-session-ttl
* invalid-session-record
* clock-drift
* session-expired

A failed turnstile response must not partially pass.

A passed turnstile response may return symbolic proof, but it must still not grant authority beyond the next organ’s rules.

---

## 13. No Invisible Punishment

The IDL must not silently punish a human, tenant, session, device, or lane.

If the IDL rejects movement, it should return a clear reason.

A rule that cannot survive being named should not control the lane.

---

## 14. Separation of Organs

The IDL must remain separated from other organs.

It must not be merged with:

* auth verification
* collapse gate
* allocator authority
* payment systems
* UI pages
* HTML
* advertising
* scoring systems
* permanent identity ownership

Each organ has a lane.

A clean lane is safer than a clever pile.

---

## 15. Doctrine Summary

The IDL protects the human center by validating continuity.

The human stays protected.
The footprint stays evidence.
The presence token stays proof.
The session stays temporary.
The lane stays traceable.
The allocator stays mechanical.
The witness device stays low-trust.
The turnstile stays pass/fail.
The collapse gate stays separate.
The system does not turn proof into ownership.

CyberCrowd IDL doctrine:

> Protect the human.
> Verify the lane.
> Allow movement only while presence remains fresh.
> Never confuse observation with authority.
> Never confuse proof with ownership.
