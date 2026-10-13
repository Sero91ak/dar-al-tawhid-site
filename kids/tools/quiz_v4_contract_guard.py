#!/usr/bin/env python3
"""No-credit 900-item speech parity and safety gate. No model calls."""
import json
import subprocess
import sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/"kids/tools"))
from quiz_joy_v4_script import prepare
catalog=json.loads((ROOT/"kids/data/quiz-kids.json").read_text(encoding="utf-8"))["items"]
assert len(catalog)==900, "expected 900 Quiz questions"
assert len({q["id"] for q in catalog})==900, "duplicate ID"
assert all(q["ageBand"] in ("4-6","7-8","9-10") for q in catalog)
all_py={q["id"]:{key:prepare(q)[key] for key in
 ("questionAudioText","correctAudioText","retryAudioText","explanationAudioText")}
 for q in catalog}
js=r"""
const fs=require('fs'),vm=require('vm');
global.window={};
vm.runInThisContext(fs.readFileSync('kids/quiz-v4-bridge.js','utf8'),{filename:'kids/quiz-v4-bridge.js'});
const all=JSON.parse(fs.readFileSync('kids/data/quiz-kids.json','utf8')).items;
const out={};
for(const q of all)out[q.id]=window.DARKidsQuizV4.speech(q);
process.stdout.write(JSON.stringify(out));
"""
p=subprocess.run(["node","-e",js],cwd=ROOT,capture_output=True,text=True,check=True)
all_js=json.loads(p.stdout)
for q in catalog:
    id=q["id"]
    if all_py[id]!=all_js.get(id):
        raise SystemExit(f"V4 text mismatch in {id}: {all_py[id]!r} != {all_js.get(id)!r}")
    if not all_py[id]["questionAudioText"] or len(all_py[id]["questionAudioText"])>800:
        raise SystemExit(f"Missing/oversized question in {id}")
    if not all_py[id]["explanationAudioText"].startswith("Das merken wir uns: "):
        raise SystemExit(f"Explanation missing in {id}")
assert sum(q["ageBand"]=="4-6" for q in catalog)==300
assert sum(q["ageBand"]=="7-8" for q in catalog)==300
assert sum(q["ageBand"]=="9-10" for q in catalog)==300
print("PASS: 900 deterministic exact JS/Python V4 clips; 300 questions/age, no credits used.")
