APP: Flight Director Organ
--------------------------

Purpose:
The APP Flight Director organ coordinates the Advanced Protocol Protections stack as a single flight profile. It translates posture and telemetry into coherent operating modes for all APP organs and exposes a unified status view of the APP system.

1. Role in the APP Stack

The Flight Director sits above individual organs:

- Consumes:
  - posture from the Gyroscope
  - timing profiles from the Stability Clock
  - risk summaries from the Risk Controller
  - load and latency summaries from Dispatcher and Temporal Ghosting
  - anomaly summaries from the Refinery

- Produces:
  - a current “flight profile” (mode + parameters)
  - configuration snapshots for APP organs
  - a unified status surface for observability

2. Flight Profile

The flight profile is a structured description of APP’s current operating mode, for example:

- Mode:
  - NORMAL
  - ELEVATED
  - HIGH_ALERT
  - DEGRADED

- Targets:
  - target_latency_band
  - acceptable_error_rate
  - throttle_aggressiveness
  - forensic_depth

- Hints:
  - preferred scaling ranges for key organs
  - advisory flags (e.g., “protect-tenants-X-more-aggressively”)

The profile is versioned and timestamped so changes can be audited.

3. Coordination with Organs

The Flight Director does not micromanage internals; it sets intent:

- Dispatcher:
  - Receives hints about prioritization (e.g., critical routes vs best-effort).
- Temporal Ghosting:
  - Receives target latency bands and normalization strictness.
- Stability Clock:
  - Receives mode information to select appropriate timing profiles.
- Invariant Mapping:
  - Receives posture hints to choose more conservative or relaxed response postures.
- Risk Controller:
  - Receives global mode to tune thresholds and phase-shift sensitivity.
- Refinery:
  - Receives forensic_depth to adjust enrichment and retention.
- Gyroscope:
  - Provides posture and receives confirmation that the profile is applied.

4. Unified Status Surface

The Flight Director exposes a consolidated status view:

- Current mode and flight profile.
- Summaries:
  - request rate bands
  - latency bands vs targets
  - throttle/deny ratios
  - anomaly density
- Health indicators for each APP organ (up/down/degraded).

This status surface is internal to CyberCrowd and intended for operators or higher-level governance organs, not external clients.

5. Control Loop

The Flight Director runs a periodic loop:

- Read posture from Gyroscope.
- Read key telemetry summaries.
- Determine if a profile change is needed.
- If so:
  - Construct a new flight profile.
  - Distribute it to APP organs.
  - Record the change for audit.

Profile changes are deliberate and bounded; the Flight Director avoids oscillation by using hysteresis or minimum dwell times in each mode.

6. Doctrine

The APP Flight Director organ adheres to the following doctrine:

- The APP stack should behave as one coordinated system, not isolated parts.
- High-level defensive intent (flight profile) must be explicit and observable.
- Mode changes must be deliberate, auditable, and stable over reasonable intervals.
- The Flight Director sets direction; individual organs implement mechanics.

This document defines the operational contract and design intent of the APP Flight Director Organ within CyberCrowd’s Advanced Protocol Protections.
