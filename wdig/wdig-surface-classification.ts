export type SurfaceFormFactor = "mobile" | "tablet" | "desktop" | "unknown";

export interface SurfaceSnapshot {
  viewportWidth?: number | null;
  viewportHeight?: number | null;
  devicePixelRatio?: number | null;
  maxTouchPoints?: number | null;
  pointer?: "coarse" | "fine" | "none" | "unknown";
  orientation?: "portrait" | "landscape" | "unknown";
  platform?: string | null;
  ua?: string | null;
  formFactor?: SurfaceFormFactor;
}

export interface WdigSurfaceClassification {
  formFactor: SurfaceFormFactor;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

function coerceNumber(value: unknown): number | null {
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  return null;
}

function coercePointer(value: unknown): SurfaceSnapshot["pointer"] {
  if (value === "coarse" || value === "fine" || value === "none" || value === "unknown") {
    return value;
  }
  return "unknown";
}

function coerceOrientation(value: unknown): SurfaceSnapshot["orientation"] {
  if (value === "portrait" || value === "landscape" || value === "unknown") {
    return value;
  }
  return "unknown";
}

export function normalizeSurfaceSnapshot(raw: unknown): SurfaceSnapshot {
  if (!raw || typeof raw !== "object") {
    return {};
  }

  const anyRaw: any = raw;

  return {
    viewportWidth: coerceNumber(anyRaw.viewportWidth),
    viewportHeight: coerceNumber(anyRaw.viewportHeight),
    devicePixelRatio: coerceNumber(anyRaw.devicePixelRatio),
    maxTouchPoints: coerceNumber(anyRaw.maxTouchPoints),
    pointer: coercePointer(anyRaw.pointer),
    orientation: coerceOrientation(anyRaw.orientation),
    platform: typeof anyRaw.platform === "string" ? anyRaw.platform : null,
    ua: typeof anyRaw.ua === "string" ? anyRaw.ua : null,
    formFactor: anyRaw.formFactor as SurfaceFormFactor | undefined
  };
}

function deriveFormFactor(snapshot: SurfaceSnapshot): SurfaceFormFactor {
  if (snapshot.formFactor && snapshot.formFactor !== "unknown") {
    return snapshot.formFactor;
  }

  const w = snapshot.viewportWidth ?? 0;
  const h = snapshot.viewportHeight ?? 0;
  const minDim = Math.min(w, h);
  const maxDim = Math.max(w, h);
  const touch = (snapshot.maxTouchPoints ?? 0) > 0;
  const pointer = snapshot.pointer ?? "unknown";

  if (!w || !h) return "unknown";

  if (touch && pointer === "coarse") {
    if (maxDim >= 900) return "tablet";
    return "mobile";
  }

  if (!touch && pointer === "fine") {
    return "desktop";
  }

  if (minDim <= 600 && touch) return "mobile";
  if (maxDim >= 900) return "tablet";

  return "desktop";
}

export function classifySurface(rawSnapshot: unknown): WdigSurfaceClassification {
  const snapshot = normalizeSurfaceSnapshot(rawSnapshot);
  const formFactor = deriveFormFactor(snapshot);

  return {
    formFactor,
    isMobile: formFactor === "mobile",
    isTablet: formFactor === "tablet",
    isDesktop: formFactor === "desktop"
  };
}
