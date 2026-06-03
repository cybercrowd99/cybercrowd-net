# identity‑escalation‑engine.md

Organ: Identity Escalation Engine (IEE)
Layer: Sovereign Continuity Layer
KC‑REF: C‑IEE‑03
Stability Class: Tier‑2 Reactive Organ

Purpose:
The Identity Escalation Engine determines when the system must escalate trust requirements, trigger step‑up verification, or initiate protective lockdown. It acts as the governor between confidence, risk, and continuity.

1. ROLE IN THE CONTINUITY SPINE
The IEE sits directly after the Identity Confidence Engine (ICE) and consumes:
- Confidence score
- Drift vectors
- Peripheral resonance stability
- Environmental contradiction flags
- Device vector anomalies
- Behavioral mismatch deltas

2. ESCALATION STATES
0 — PASSIVE
- Confidence ≥ 0.82
- No drift acceleration
- No contradictions

1 — WATCH
- Confidence 0.65–0.82
- Mild drift
- One weak contradiction

2 — CHALLENGE
- Confidence 0.42–0.65
- Drift acceleration
- Multiple contradictions

3 — LOCK
- Confidence < 0.42
- Hard contradiction
- Environmental spoofing
- Session freeze required

3. INPUT SIGNALS
- Confidence Score (0–1)
- Drift Vector (magnitude + acceleration)
- Contradiction Flags (boolean array)
- Peripheral Resonance (stability index)
- Environmental Integrity (spoofing probability)
- Device Vector (continuity score)
- Behavioral Signature (deviation index)

4. ESCALATION LOGIC
if confidence >= 0.82 and contradictions == 0:
    state = PASSIVE
elif 0.65 <= confidence < 0.82 or drift.mild:
    state = WATCH
elif 0.42 <= confidence < 0.65 or contradictions >= 2:
    state = CHALLENGE
else:
    state = LOCK

5. OUTPUT ACTIONS
PASSIVE:
- Maintain baseline sampling

WATCH:
- Increase sampling frequency
- Request peripheral reinforcement
- Log soft warnings

CHALLENGE:
- Trigger step‑up verification
- Require fresh facial telemetry
- Require device reconfirmation
- Require behavioral micro‑challenge

LOCK:
- Freeze session
- Require full re‑authentication
- Notify guardian layer

6. KC‑BLOCK
KC‑POINT‑03
Line 1: “Escalation is the spine’s reflex
