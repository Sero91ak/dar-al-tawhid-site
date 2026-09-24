#!/usr/bin/env python3
import os, sys, requests

API_KEY=os.environ.get("ELEVENLABS_API_KEY")
if not API_KEY:
    raise SystemExit("ELEVENLABS_API_KEY fehlt")
path=sys.argv[1] if len(sys.argv)>1 else "dar_al_tawhid_alias_master.pls"
name=sys.argv[2] if len(sys.argv)>2 else "DAR AL TAWHID - Islamisches Aussprachewoerterbuch DE"
url="https://api.elevenlabs.io/v1/pronunciation-dictionaries/add-from-file"
with open(path,"rb") as fh:
    r=requests.post(url,headers={"xi-api-key":API_KEY},files={"file":fh},data={"name":name,"description":"DAR AL TAWHID islamisches Aussprachewoerterbuch DE"},timeout=120)
print(r.status_code)
print(r.text)
r.raise_for_status()