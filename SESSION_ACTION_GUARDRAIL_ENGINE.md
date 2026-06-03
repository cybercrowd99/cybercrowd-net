# SESSION_ACTION_GUARDRAIL_ENGINE

## Purpose
The Session Action Guardrail Engine (SAGE) controls which actions are allowed during a session.  
It uses identity confidence, drift levels, and escalation states to determine whether an action is safe, restricted, or blocked.

## Inputs
- identity confidence score  
- trust escalation level  
- drift severity  
- contradiction level  
- anchor stability  
- signal integrity state  

## Action Categories
**Open Actions**  
Safe actions that require no additional checks.

**Guarded Actions**  
Actions allowed only when identity confidence is stable.

**Restricted Actions**  
Actions allowed only after a light or strong verification step.

**Critical Actions**  
Actions that require maximum trust and cannot proceed during drift or contradictions.

**Blocked Actions**  
Actions that are unsafe until identity is restored.

## Guardrail Logic
- evaluates the requested action  
- checks current trust state  
- compares action sensitivity with confidence level  
- determines required verification  
- approves, restricts, or blocks the action  

## Sensitivity Factors
- financial risk  
- data exposure  
- account control  
- irreversible changes  
- cross‑device operations  
- environment mismatch  

## Guardrail States
**Green**  
Action allowed.

**Yellow**  
Action allowed with verification.

**Orange**  
Action delayed until trust improves.

**Red**  
Action blocked until identity is restored.

## Recovery Logic
- actions move from blocked → restricted → allowed as confidence rises  
- drift reduction lowers restrictions  
- resonance strengthening unlocks guarded actions  
- anchor stability restores critical actions  

## Security Objectives
- prevent unauthorized actions  
- avoid accidental lockouts  
- protect sensitive operations  
- maintain session continuity  
- ensure identity integrity  

## Summary
The Session Action Guardrail Engine determines which actions are safe based on trust conditions.  
It protects the session by applying the right level of restriction without interrupting normal use.
