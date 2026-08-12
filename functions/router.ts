// functions/router.ts
// CyberCrowd — Pages Runtime Router
// ONE JOB: Route NET / CORE / CASES surfaces through Pages Functions.

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  // NET surface
  if (path.startsWith("/net")) {
    return new Response(
      JSON.stringify(
        {
          surface: "NET",
          status: "ACTIVE",
          execution: "PAGES_RUNTIME",
          requestUrl: request.url
        },
        null,
        2
      ),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  }

  // CORE surface
  if (path.startsWith("/core")) {
    return new Response(
      JSON.stringify(
        {
          surface: "CORE",
          status: "ACTIVE",
          execution: "PAGES_RUNTIME",
          requestUrl: request.url
        },
        null,
        2
      ),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  }

  // CASES surface
  if (path.startsWith("/cases")) {
    return new Response(
      JSON.stringify(
        {
          surface: "CASES",
          status: "ACTIVE",
          execution: "PAGES_RUNTIME",
          requestUrl: request.url
        },
        null,
        2
      ),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  }

  // Default boundary
  return new Response(
    JSON.stringify(
      {
        system: "CyberCrowd",
        site: "NET",
        core: "CORE",
        cases: "CASES",
        status: "LIVE",
        execution: "PAGES_RUNTIME",
        route: "boundary",
        requestUrl: request.url
      },
      null,
      2
    ),
    { status: 200, headers: { "content-type": "application/json" } }
  );
}
