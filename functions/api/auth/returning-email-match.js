// CYBERCROWD
//
// FILE:
// functions/api/auth/returning-email-match.js
//
// BUILD LAW:
// 1 FILE
// 1 JOB
// 1 FUNCTION
//
// JOB:
// Match one returning-member email
// to its already-stored identity/uIDL address.
//
// INPUT:
// email
//
// LOOKUP:
// user-email:${email}
//
// OUTPUT:
// identity_active_id
//
// DOES NOT OWN:
// Turnstile #1.
// Turnstile #2.
// Turnstile #3 rendering.
// Manual email input.
// Password input.
// Password verification.
// Identity creation.
// uIDL creation.
// Session.
// Cookie.
// Routing.
// UI.
// Movement.
// Turnstile #4.

export async function onRequestPost(context) {
  const {
    request,
    env
  } = context;

  const body =
    await request
      .json()
      .catch(() => null);

  const email =
    String(
      body?.email || ""
    )
      .trim()
      .toLowerCase();

  if (!email) {
    return new Response(
      JSON.stringify({
        success: false,
        matched: false,
        error: "email_missing"
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store"
        }
      }
    );
  }

  if (!env?.IDENTITY) {
    return new Response(
      JSON.stringify({
        success: false,
        matched: false,
        error: "identity_storage_missing"
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store"
        }
      }
    );
  }

  const identityActiveId =
    String(
      await env.IDENTITY.get(
        `user-email:${email}`
      ) || ""
    ).trim();

  if (!identityActiveId) {
    return new Response(
      JSON.stringify({
        success: true,
        matched: false
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store"
        }
      }
    );
  }

  return new Response(
    JSON.stringify({
      success: true,
      matched: true,
      identity_active_id:
        identityActiveId
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      }
    }
  );
}
