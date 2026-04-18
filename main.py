from js import Response

def on_fetch(request):
    # This reads your index.html and sends it to the browser
    with open("index.html", "r") as f:
        html_content = f.read()
    return Response.new(html_content, headers={"content-type": "text/html"})

