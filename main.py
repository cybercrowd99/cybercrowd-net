from workers import WorkerEntrypoint, Response


class Default(WorkerEntrypoint):
    async def fetch(self, request):
        try:
            return await self.env.ASSETS.fetch(request)
        except Exception as e:
            return Response(
                f"Error [CC-2001]: {str(e)}",
                status=500,
                headers={"content-type": "text/plain; charset=utf-8"},
            )
