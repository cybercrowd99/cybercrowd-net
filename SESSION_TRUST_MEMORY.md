# SESSION_TRUST_MEMORY

## Purpose
The Session Trust Memory (STM) stores trust‑related signals during a single session.  
It provides short‑term continuity without writing anything to browser state or creating long‑term identifiers.

## What It Stores
- recent identity confidence values  
- drift snapshots  
- resonance strength  
- contradiction flags  
- escalation level  
- anchor stability  
- last verified action  
- last verification timestamp  

## How It Works
- receives updates from all trust modules  
- stores values in session‑local volatile memory  
- clears values when the session ends  
- never writes to cookies, localStorage, or persistent storage  
- supports trust decisions without creating tracking vectors  

## Memory Rules
**Volatile Only**  
All data exists only in RAM for the duration of the session.

**No Persistence**  
Nothing is saved across tabs, windows, or reloads.

**No Cross‑Site Leakage**  
Memory is isolated per origin and cannot be shared.

**No Fingerprinting**  
Values are not stable enough to identify a user.

## Update Logic
- updates on every trust cycle  
- smooths values to avoid spikes  
- clears stale entries  
- resets when trust anchor resets  
- drops memory on session termination  

## Security Objectives
- support trust decisions without tracking  
- maintain continuity without persistence  
- prevent cross‑site identity leakage  
- avoid fingerprinting vectors  
- ensure privacy and sovereignty  

## Summary
The Session Trust Memory provides short‑term trust continuity inside a session without creating any persistent identity traces.  
It supports the trust engine while preserving user sovereignty.
