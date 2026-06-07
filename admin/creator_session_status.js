// admin/creator_session_status.js
export async function onRequest(context) {
  const req = context.request;
  const headers = req.headers;

  const token =
    headers.get("authorization") ||
    headers.get("x-at-bat-token") ||
    null;

  if (!token) {
    return json({
      hasCreatorAtBat: false,
      reason: "missing_creator_at_bat"
    });
  }

  const parts = token.split(".");
  if (parts.length !== 2) {
    return json({
      hasCreatorAtBat: true,
      validFormat: false,
      reason: "malformed_scorebook_entry"
    });
  }

  const [ball] = parts;

  if (!ball.startsWith("cc_creator_at_bat|")) {
    return json({
      hasCreatorAtBat: true,
      validFormat: false,
      reason: "invalid_creator_ball_format"
    });
  }

  const segments = ball.split("|");
  const inning = parseInt(segments[1], 10);

  if (isNaN(inning)) {
    return json({
      hasCreatorAtBat: true,
      validFormat: false,
      reason: "invalid_inning"
    });
  }

  const now = Date.now();
  const currentInning = Math.floor(now / (15 * 60 * 1000));

  const age = currentInning - inning;

  let status = "current";
  if (age > 0) status = "stale";
  if (age > 2) status = "expired";

  return json({
    hasCreatorAtBat: true,
    validFormat: true,
    inning,
    currentInning,
    age,
    status
  });
}

function json(obj) {
  return new Response(JSON.stringify(obj, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
}
