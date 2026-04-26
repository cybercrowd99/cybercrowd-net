from js import Response

async def on_fetch(request, env):
    try:
        return await env.ASSETS.fetch(request)
    except Exception as e:
        return Response.new(
            f"Error [CC-2001]: {str(e)}",
            status=500,
            headers={"content-type": "text/plain; charset=utf-8"}
        )
