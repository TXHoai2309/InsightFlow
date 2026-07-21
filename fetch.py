import urllib.request
import json

try:
    req = urllib.request.Request("http://localhost:3000/api/debug-notif")
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode('utf-8'))
        with open("out.json", "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
except urllib.error.HTTPError as e:
    with open("out.json", "w", encoding="utf-8") as f:
        f.write(e.read().decode('utf-8'))
