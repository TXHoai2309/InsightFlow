import urllib.request
import json
import os

api_key = "AIzaSyCsw5k-VUvkg7J3LAvYKmaJyu3JTweTbUI" # from .env.local
url = f"https://firestore.googleapis.com/v1/projects/datainsightflow/databases/(default)/documents/notifications?key={api_key}"

payload = {
    "fields": {
        "title": {"stringValue": "Test"},
        "message": {"stringValue": "Test message"},
        "type": {"stringValue": "new_consultation"},
        "recipient_role": {"stringValue": "admin"},
        "read": {"booleanValue": False}
    }
}

req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers={'Content-Type': 'application/json'})

try:
    with urllib.request.urlopen(req) as response:
        print(response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print(e.read().decode('utf-8'))
