// DIGITAL/app/dispatcher.ts
// APP: Dispatcher Organ

import { v4 as uuidv4 } from "uuid";

export async function dispatcher(request: Request) {
  const received_at = Date.now();

  // correlation_id for end‑to‑end traceability
  const correlation_id = uuidv4();

  // extract metadata
  const method = request.method;
  const url = new URL(request.url);
  const path = url.pathname;
  const query = Object.fromEntries(url.searchParams.entries());

  // size band
  const contentLength = Number(request.headers.get("content-length") || 0);
  const size_band =
    contentLength < 5_000
      ? "small"
      : contentLength < 50_000
      ? "medium"
      : "large";

  // client hints (optional)
  const client_hints = {
    ua: request.headers.get("user-agent") || null,
    ip: request.headers.get("cf-connecting-ip") || null,
    cf: request.headers.get("cf-ray") || null
  };

  // upstream auth context (optional)
  const upstream_auth = request.headers.get("x-auth-context") || null;

  // canonical envelope
  const envelope = {
    correlation_id,
    received_at,
    method,
    path,
    query_summary: query,
    size_band,
    client_hints,
    upstream_auth
  };

  // GHOST PATH — defensive, forensic, internal
  const ghostEnvelope = {
    ...envelope,
    internal_annotations: {
      // placeholder for future risk history, anomaly flags, etc.
    }
  };

  // MIRROR PATH — client‑facing, stable, contract‑bound
  const mirrorEnvelope = {
    ...envelope
    // no internal annotations
  };

  // return both paths to the APP runtime
  return {
    correlation_id,
    ghost: ghostEnvelope,
    mirror: mirrorEnvelope
  };
}
