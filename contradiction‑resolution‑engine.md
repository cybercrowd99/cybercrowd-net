# contradiction‑resolution‑engine.md

Organ: Contradiction Resolution Engine (CRE)
Layer: Sovereign Continuity Layer
KC‑REF: C‑CRE‑04
Stability Class: Tier‑2 Interpretive Organ

Purpose:
The Contradiction Resolution Engine resolves conflicting identity signals so the system does not overreact or misjudge the user. It determines which signals are valid, which are noise, and which require escalation.

1. ROLE IN THE CONTINUITY SPINE
The CRE sits between the Identity Escalation Engine (IEE) and the Guardian Layer. It receives:
- Confidence score
- Drift vectors
- Contradiction flags
- Environmental integrity checks
- Device continuity signals
- Behavioral deviation metrics

Its job is to interpret contradictions and decide whether they represent:
- harmless noise
- recoverable mismatch
- meaningful threat
- hard spoofing

2. CONTRADICTION TYPES
Soft Contradiction:
- Minor mismatch between two signals
- Usually caused by lighting, angle, or micro‑movement

Medium Contradiction:
- Multiple mismatches across different vectors
- May indicate drift or partial spoofing

Hard Contradiction:
- Direct conflict between trusted signals
- Example: device vector says “same user” while facial vector says “different user”

Terminal Contradiction:
- Impossible combination of signals
- Example: environmental spoofing + device mismatch + behavioral mismatch

3. RESOLUTION LOGIC
Soft:
- Down‑weight the noisy signal
- Re‑sample facial telemetry
- Maintain session

Medium:
- Cross‑check with peripheral resonance
- Request additional frames
- Notify IEE to enter WATCH

Hard:
- Trigger step‑up verification
- Require device reconfirmation
- Notify IEE to enter CHALLENGE

Terminal:
- Freeze session
- Notify Guardian Layer
- Require full re‑authentication

4. SIGNAL WEIGHTING MODEL
Each signal is assigned a dynamic weight:
- Facial Stability Weight
- Device Continuity Weight
- Environmental Integrity Weight
- Behavioral Consistency Weight
- Drift Acceleration Weight

Final contradiction score:
score = (Σ weighted mismatches) − (Σ stabilizing signals)

5. OUTPUT ACTIONS
- Cleaned signal set
- Contradiction severity level
- Recommended escalation state
- Stability confidence delta
- Guardian Layer notification (if needed)

6. KC‑BLOCK
KC‑POINT‑05
Line 1: “Contradiction is not failure — it is information waiting to be sorted.”
Line 2: C‑CRE‑04
Line 3: Value: 0.86 → 0.89
