export async function onRequestGet({ request, env }) {
  try {
    const url = new URL(request.url);
    const identityToken = url.searchParams.get("token");

    if (!identityToken) {
      return Response.json(
        {
          success: false,
          error: "no identity token",
          status: "missing_identity_token",
        },
        {
          status: 401,
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    if (!env.IDENTITY) {
      return Response.json(
        {
          success: false,
          error: "identity store is not active",
          status: "identity_store_missing",
        },
        {
          status: 500,
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    const identityRecord = await env.IDENTITY.get(identityToken);

    if (!identityRecord) {
      return Response.json(
        {
          success: false,
          error: "invalid identity token",
          status: "invalid_identity_token",
        },
        {
          status: 401,
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    let identityData = null;

    try {
      identityData = JSON.parse(identityRecord);
    } catch (parseError) {
      identityData = {
        userId: identityRecord,
      };
    }

    const userId = identityData.userId || "";
    const email = identityData.email || "";

    if (!userId) {
      return Response.json(
        {
          success: false,
          error: "identity token is incomplete",
          status: "incomplete_identity_token",
        },
        {
          status: 401,
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    const redirectUrl = new URL("/.event/quarter-check", url.origin);
    redirectUrl.searchParams.set("redirect", "/verify-success.html");

    return new Response(null, {
      status: 302,
      headers: {
        Location: redirectUrl.toString(),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("CYBERCROWD VERIFY ERROR:", error);

    return Response.json(
      {
        success: false,
        error: "server error",
        status: "verify_exception",
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}
