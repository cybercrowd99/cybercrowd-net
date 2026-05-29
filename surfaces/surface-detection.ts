export type SurfaceFormFactor = "mobile" | "tablet" | "desktop" | "unknown";

export interface SurfaceSnapshot {
  viewportWidth: number | null;
  viewportHeight: number | null;
  devicePixelRatio: number | null;
  maxTouchPoints: number | null;
  pointer: "coarse" | "fine" | "none" | "unknown";
  orientation: "portrait" | "landscape" | "unknown";
  platform: string | null;
  ua: string | null;
  formFactor: SurfaceFormFactor;
}

function getPointerType(): SurfaceSnapshot["pointer"] {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return "unknown";
  }

  if (window.matchMedia("(pointer: coarse)").matches) return "coarse";
  if (window.matchMedia("(pointer: fine)").matches) return "fine";
  if (window.matchMedia("(pointer: none)").matches) return "none";
  return "unknown";
}

function getOrientation(): SurfaceSnapshot["orientation"] {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return "unknown";
  }

  if (window.matchMedia("(orientation: portrait)").matches) return "portrait";
  if (window.matchMedia("(orientation: landscape)").matches) return "landscape";
  return "unknown";
}

function getPlatformHint(): string | null {
  if (typeof navigator === "undefined") return null;

  const anyNav: any = navigator as any;

  if (anyNav.userAgentData && Array.isArray(anyNav.userAgentData.brands)) {
    const brands = anyNav.userAgentData.brands.map((b: any) => b.brand).join(", ");
    return `${anyNav.platform || "unknown"} | ${brands}`;
  }

  return (navigator as Navigator).platform || null;
}

function deriveFormFactor(snapshot: Omit<SurfaceSnapshot, "formFactor">): SurfaceFormFactor {
  const w = snapshot.viewportWidth ?? 0;
  const h = snapshot.viewportHeight ?? 0;
  const minDim = Math.min(w, h);
  const maxDim = Math.max(w, h);
  const touch = (snapshot.maxTouchPoints ?? 0) > 0;
  const pointer = snapshot.pointer;

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

export function captureSurfaceSnapshot(): SurfaceSnapshot {
  if (typeof window === "undefined") {
    return {
      viewportWidth: null,
      viewportHeight: null,
      devicePixelRatio: null,
      maxTouchPoints: null,
      pointer: "unknown",
      orientation: "unknown",
      platform: null,
      ua: null,
      formFactor: "unknown"
    };
  }

  const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
  const devicePixelRatio = window.devicePixelRatio || 1;
  const maxTouchPoints = typeof navigator !== "undefined" ? (navigator as any).maxTouchPoints ?? 0 : 0;
  const pointer = getPointerType();
  const orientation = getOrientation();
  const platform = getPlatformHint();
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : null;

  const base: Omit<SurfaceSnapshot, "formFactor"> = {
    viewportWidth,
    viewportHeight,
    devicePixelRatio,
    maxTouchPoints,
    pointer,
    orientation,
    platform,
    ua
  };

  const formFactor = deriveFormFactor(base);

  return {
    ...base,
    formFactor
  };
}
