// src/Digital_Human_Footprint.ts
// CyberCrowd — Digital Human Footprint Organ
//
// Defines and implements the mechanical footprint record.
//
// Purpose:
// - Record participation.
// - Preserve proof of movement.
// - Preserve surface/moment/activity trace.
// - Keep visibility bounded.
// - No elevation.
// - No extraction.
// - No hidden authority.
// - No auth ownership.
// - No presence ownership.
// - No collapse ownership.
// - Pure proof-of-participation organ.

export type FootprintVisibility =
  | "private"
  | "shared-with-creator"
  | "system-only";

export type FootprintActivityType =
  | "view"
  | "create"
  | "collaborate"
  | "upgrade"
  | "pass-use"
  | "archive";

export interface FootprintRecord {
  footprint_id: string;
  human_id: string;
  moment_id: string;
  surface_id: string;
  activity_type: FootprintActivityType;
  value_link_id?: string | null;
  visibility: FootprintVisibility;
  created_at_ms: number;
}

export interface FootprintQuery {
  human_id?: string;
  surface_id?: string;
  activity_type?: FootprintActivityType;
  since_ms?: number;
  until_ms?: number;
  limit?: number;
}

export interface FootprintWriteRequest {
  human_id: string;
  moment_id: string;
  surface_id: string;
  activity_type: FootprintActivityType;
  value_link_id?: string | null;
  visibility?: FootprintVisibility;
}

export interface FootprintWriteResponse {
  ok: boolean;
  footprint?: FootprintRecord;
  error?: string;
}

export interface FootprintListResponse {
  ok: boolean;
  records: FootprintRecord[];
  error?: string;
}

export interface FootprintOrgan {
  write(req: FootprintWriteRequest): Promise<FootprintWriteResponse>;

  list(query: FootprintQuery): Promise<FootprintListResponse>;

  get(footprint_id: string): Promise<FootprintRecord | null>;
}

export class InMemoryDigitalHumanFootprintOrgan implements FootprintOrgan {
  private readonly recordsById = new Map<string, FootprintRecord>();

  async write(req: FootprintWriteRequest): Promise<FootprintWriteResponse> {
    const human_id = cleanId(req.human_id);
    const moment_id = cleanId(req.moment_id);
    const surface_id = cleanId(req.surface_id);
    const activity_type = cleanActivityType(req.activity_type);
    const visibility = cleanVisibility(req.visibility ?? "private");
    const value_link_id = cleanNullableId(req.value_link_id ?? null);

    if (!human_id) {
      return {
        ok: false,
        error: "HUMAN_ID_REQUIRED"
      };
    }

    if (!moment_id) {
      return {
        ok: false,
        error: "MOMENT_ID_REQUIRED"
      };
    }

    if (!surface_id) {
      return {
        ok: false,
        error: "SURFACE_ID_REQUIRED"
      };
    }

    if (!activity_type) {
      return {
        ok: false,
        error: "ACTIVITY_TYPE_INVALID"
      };
    }

    if (!visibility) {
      return {
        ok: false,
        error: "VISIBILITY_INVALID"
      };
    }

    const footprint: FootprintRecord = {
      footprint_id: makeFootprintId(),
      human_id,
      moment_id,
      surface_id,
      activity_type,
      value_link_id,
      visibility,
      created_at_ms: Date.now()
    };

    this.recordsById.set(footprint.footprint_id, footprint);

    return {
      ok: true,
      footprint: cloneFootprint(footprint)
    };
  }

  async list(query: FootprintQuery): Promise<FootprintListResponse> {
    const human_id = cleanOptionalId(query.human_id);
    const surface_id = cleanOptionalId(query.surface_id);
    const activity_type = cleanOptionalActivityType(query.activity_type);

    const since_ms =
      typeof query.since_ms === "number" && Number.isFinite(query.since_ms)
        ? query.since_ms
        : null;

    const until_ms =
      typeof query.until_ms === "number" && Number.isFinite(query.until_ms)
        ? query.until_ms
        : null;

    const limit =
      typeof query.limit === "number" &&
      Number.isInteger(query.limit) &&
      query.limit > 0
        ? Math.min(query.limit, 500)
        : 100;

    const records: FootprintRecord[] = [];

    for (const record of this.recordsById.values()) {
      if (human_id && record.human_id !== human_id) continue;
      if (surface_id && record.surface_id !== surface_id) continue;
      if (activity_type && record.activity_type !== activity_type) continue;
      if (since_ms !== null && record.created_at_ms < since_ms) continue;
      if (until_ms !== null && record.created_at_ms > until_ms) continue;

      records.push(cloneFootprint(record));
    }

    records.sort((a, b) => b.created_at_ms - a.created_at_ms);

    return {
      ok: true,
      records: records.slice(0, limit)
    };
  }

  async get(footprint_id: string): Promise<FootprintRecord | null> {
    const id = cleanId(footprint_id);

    if (!id) {
      return null;
    }

    const record = this.recordsById.get(id);

    if (!record) {
      return null;
    }

    return cloneFootprint(record);
  }
}

// Utility: ID generation.
// Mechanical only.
// This ID does not grant authority.
export function makeFootprintId(): string {
  if (
    typeof globalThis.crypto !== "undefined" &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return globalThis.crypto.randomUUID();
  }

  return (
    "fp-" +
    Math.random().toString(16).slice(2) +
    "-" +
    Date.now().toString(16)
  );
}

export function isFootprintVisibility(
  value: unknown
): value is FootprintVisibility {
  return (
    value === "private" ||
    value === "shared-with-creator" ||
    value === "system-only"
  );
}

export function isFootprintActivityType(
  value: unknown
): value is FootprintActivityType {
  return (
    value === "view" ||
    value === "create" ||
    value === "collaborate" ||
    value === "upgrade" ||
    value === "pass-use" ||
    value === "archive"
  );
}

function cloneFootprint(record: FootprintRecord): FootprintRecord {
  return {
    footprint_id: record.footprint_id,
    human_id: record.human_id,
    moment_id: record.moment_id,
    surface_id: record.surface_id,
    activity_type: record.activity_type,
    value_link_id: record.value_link_id ?? null,
    visibility: record.visibility,
    created_at_ms: record.created_at_ms
  };
}

function cleanActivityType(value: unknown): FootprintActivityType | null {
  return isFootprintActivityType(value) ? value : null;
}

function cleanOptionalActivityType(
  value: unknown
): FootprintActivityType | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  return cleanActivityType(value);
}

function cleanVisibility(value: unknown): FootprintVisibility | null {
  return isFootprintVisibility(value) ? value : null;
}

function cleanOptionalId(value: unknown): string | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  return cleanNullableId(value);
}

function cleanNullableId(value: unknown): string | null {
  const clean = cleanId(value);
  return clean || null;
}

function cleanId(value: unknown): string {
  if (typeof value !== "string" && typeof value !== "number") {
    return "";
  }

  const clean = String(value).trim();

  if (!clean) {
    return "";
  }

  if (clean.length > 180) {
    return "";
  }

  if (!/^[a-zA-Z0-9._:@/+=$-]+$/.test(clean)) {
    return "";
  }

  return clean;
}
