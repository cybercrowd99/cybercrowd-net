export async function onRequest(context) {
  const ua = context.request.headers.get("user-agent") || "";

  const lower = ua.toLowerCase();

  let device = "unknown";
  if (lower.includes("mobile")) device = "mobile";
  else if (lower.includes("tablet")) device = "tablet";
  else if (lower.includes("bot") || lower.includes("crawler") || lower.includes("spider")) device = "bot";
  else device = "desktop";

  let os = "unknown";
  if (lower.includes("windows")) os = "windows";
  else if (lower.includes("mac os") || lower.includes("macintosh")) os = "macos";
  else if (lower.includes("linux")) os = "linux";
  else if (lower.includes("android")) os = "android";
  else if (lower.includes("ios") || lower.includes("iphone") || lower.includes("ipad")) os = "ios";

  let browser = "unknown";
  if (lower.includes("chrome")) browser = "chrome";
  else if (lower.includes("safari") && !lower.includes("chrome")) browser = "safari";
  else if (lower.includes("firefox")) browser = "firefox";
  else if (lower.includes("edge")) browser = "edge";

  return new Response(JSON.stringify({
    ua,
    device,
    os,
    browser
  }, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
}
