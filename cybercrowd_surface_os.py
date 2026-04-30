import json
import time
import urllib.parse
import urllib.request
from http.server import BaseHTTPRequestHandler

LICENSE_FILE = "wdig_license.json"
CYBERCROWD_API = "https://cybercrowd.net"

def save_license_token(token):
    with open(LICENSE_FILE, "w", encoding="utf-8") as f:
        json.dump({
            "license_token": token,
            "activated_at": int(time.time())
        }, f, indent=2)

def load_license_token():
    try:
        with open(LICENSE_FILE, "r", encoding="utf-8") as f:
            return json.load(f).get("license_token")
    except Exception:
        return None
