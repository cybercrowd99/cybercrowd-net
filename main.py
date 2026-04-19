import js
from js import Response

def on_fetch(request):
    try:
        with open("index.html", "r") as f:
            html_content = f.read()
        return Response.new(html_content, headers={"content-type": "text/html"})
    except Exception as e:
        return Response.new(f"Error loading index: {str(e)}", status=500)
