// src/runtime/router.ts
// CyberCrowd — NET / CORE / CASES Runtime Router
// ONE JOB: Provide routing surfaces for NET / CORE / CASES execution.

export class CyberCrowdRouter {
  route(request: Request): Response {
    const url = new URL(request.url);
    const path = url.pathname;

    // NET surface
    if (path.startsWith("/net")) {
      return this.netSurface(request);
    }

    // CORE surface
    if (path.startsWith("/core")) {
      return this.coreSurface(request);
    }

    // CASES surface
    if (path.startsWith("/cases")) {
      return this.casesSurface(request);
    }

    // Default runtime boundary
    return new Response(
      JSON.stringify(
        {
          system: "CyberCrowd",
          site: "NET",
          core: "CORE",
          cases: "CASES",
          status: "LIVE",
          execution: "RUNTIME",
          route: "boundary",
          requestUrl: request.url,
        },
        null,
        2,
      ),
      {
        status: 200,
        headers: { "content-type": "application/json" },
      },
    );
  }

  private netSurface(request: Request): Response {
    return new Response(
      JSON.stringify(
        {
          surface: "NET",
          status: "ACTIVE",
          execution: "RUNTIME",
          requestUrl: request.url,
        },
        null,
        2,
      ),
      {
        status: 200,
        headers: { "content-type": "application/json" },
      },
    );
  }

  private coreSurface(request: Request): Response {
    return new Response(
      JSON.stringify(
        {
          surface: "CORE",
          status: "ACTIVE",
          execution: "RUNTIME",
          requestUrl: request.url,
        },
        null,
        2,
      ),
      {
        status: 200,
        headers: { "content-type": "application/json" },
      },
    );
  }

  private casesSurface(request: Request): Response {
    return new Response(
      JSON.stringify(
        {
          surface: "CASES",
          status: "ACTIVE",
          execution: "RUNTIME",
          requestUrl: request.url,
        },
        null,
        2,
      ),
      {
        status: 200,
        headers: { "content-type": "application/json" },
      },
    );
  }
}
