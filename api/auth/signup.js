export async function onRequestPost(context) {
  return Response.json(
    {
      diagnostic: true,
      source_test: "api/auth/signup.js",
      marker: "CYBERCROWD_PUSH_SOURCE_TEST_2026_05_19",
      message: "This file is the active signup push source."
    },
    {
      status: 418,
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}

export async function onRequestGet(context) {
  return Response.json(
    {
      diagnostic: true,
      source_test: "api/auth/signup.js",
      marker: "CYBERCROWD_PUSH_SOURCE_TEST_2026_05_19",
      message: "GET marker active. This proves api/auth/signup.js deployed."
    },
    {
      status: 418,
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}
