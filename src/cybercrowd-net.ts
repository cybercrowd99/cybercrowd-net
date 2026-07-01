// src/cybercrowd-net.ts
//
// CyberCrowd Net Entry Point
//
// ONE JOB:
// Provide the top-level CyberCrowd-net surface for the entire application.
//
// No hidden logic.
// No adapter loading.
// No binding chain calls.
// No swallowing core.
// No magic loaders.

import { createCyberCrowdNetSurface } from "./net-surface";

export const CyberCrowdNet = createCyberCrowdNetSurface();
