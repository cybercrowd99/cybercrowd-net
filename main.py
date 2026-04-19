import js
from js import Response

def on_fetch(request):
    try:
        with open("index.html", "r") as f:
            html_content = f.read()
        return Response.new(html_content, headers={"content-type": "text/html"})
    except Exception as e:
        return Response.new(f"Error [CC-2001]: {str(e)}", status=500)
