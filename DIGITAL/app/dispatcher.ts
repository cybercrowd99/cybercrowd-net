APP: Dispatcher Organ
---------------------

Purpose:
The APP Dispatcher organ is the front door of Advanced Protocol Protections. Its role is to accept incoming requests, normalize them into a shared internal representation, and route them into the Ghost and Mirror paths in a way that preserves traceability, stability, and defensive readiness.

1. Responsibilities

The dispatcher is responsible for:

- Accepting all inbound protocol requests at the APP boundary.
- Normalizing request metadata into a standard internal format.
- Assigning a correlation_id for end-to-end tracing.
- Routing each request into:
  - Ghost Path (defense and forensics)
  - Mirror Path (client-facing stability and contract enforcement)
- Ensuring that both paths receive consistent context.

2. Request Normalization

Upon receiving a request, the dispatcher constructs an internal envelope:

- Core fields:
  - correlation_id
  - received_at (timestamp)
  - method, path, query summary
  - size band (small/medium/large)
  - client hints (where available)
- Optional fields:
  - upstream auth context
  - tenant or namespace identifiers
  - preliminary risk hints (e.g., rate band, known source)

This envelope is the canonical representation passed to all APP organs.

3. Bifurcation into Ghost and Mirror Paths

The dispatcher performs a clean split:

- Ghost Path:
  - Receives the full envelope.
  - Forwards it to defensive organs such as Temporal Ghosting and the Refinery.
  - May include additional internal-only annotations (e.g., prior risk history).

- Mirror Path:
  - Receives the same envelope (minus any sensitive internal annotations).
  - Drives the client-facing response pipeline.
  - Coordinates with timing and contract enforcement layers.

The split is logical, not deceptive: both paths operate on the same underlying request, but with different responsibilities and performance constraints.

4. Correlation and Traceability

To support forensics and debugging, the dispatcher guarantees:

- Every request gets a unique correlation_id.
- All downstream events, logs, and refinery records reference this id.
- Defensive decisions can be traced back to the original request envelope.
- Mirror Path responses can be linked to Ghost Path observations.

This makes it possible to reconstruct full interaction narratives without compromising the stability of the live system.

5. Interaction with Other APP Organs

The dispatcher is the upstream dependency for:

- Temporal Ghosting:
  - Receives envelopes from the dispatcher.
  - Applies timing normalization and bifurcated execution logic.

- Refinery:
  - Receives structured events derived from dispatcher envelopes and downstream decisions.
  - Uses correlation_id and metadata for aggregation and analysis.

Future APP organs (e.g., specialized anomaly detectors, tenant-specific policies) can subscribe to the dispatcher’s normalized envelopes without altering the external protocol surface.

6. Doctrine

The APP Dispatcher organ adheres to the following doctrine:

- Single entry point for APP processing.
- No external deception; all behavior remains consistent with the public API.
- Strict normalization before routing.
- Deterministic bifurcation into Ghost and Mirror paths.
- Strong correlation and traceability for all downstream activity.

This document defines the operational contract and design intent of the APP Dispatcher Organ within CyberCrowd’s Advanced Protocol Protections.
