#!/usr/bin/env python3
"""Statically reject malformed paid V4 workflow code BEFORE synthesis."""
import ast
import pathlib

root=pathlib.Path(__file__).resolve().parents[2]
path=root/".github/workflows/build-kids-quiz-owner-voice.yml"
s=path.read_text(encoding="utf-8")
lines=s.splitlines()
blocks=[]
for i,line in enumerate(lines):
    if line.strip()!="python3 - <<'PY'":continue
    indent=len(line)-len(line.lstrip())
    body=[]
    for j in range(i+1,len(lines)):
        if lines[j].strip()=="PY" and len(lines[j])-len(lines[j].lstrip())==indent:
            source="\n".join(body)+"\n"
            ast.parse(source,filename=f"{path}:heredoc:{i+1}")
            blocks.append((i+1,j+1))
            break
        text=lines[j]
        if text.strip() and not text.startswith(" "*indent):
            raise SystemExit(f"Heredoc early unindented termination at {j+1}")
        body.append(text[indent:] if len(text)>=indent else "")
    else:
        raise SystemExit(f"Unclosed GitHub Python heredoc starting at {i+1}")

if len(blocks)<2:
    raise SystemExit("No paid workflow code found for syntax guard")
must_contain=[
    "quiz_composed_parts",
    "compose_clips(",
    "maxPlannedV4CharactersPerRun",
    "planned_chars>max_chars",
    "max_attempts=1 if model_id.startswith('eleven_v4')",
    "actions/upload-artifact@v4",
    "quiz-v4-phrase-audio-v1",
]
for needle in must_contain:
    if needle not in s:raise SystemExit("Missing budget safeguard: "+needle)
if "[quiz-v4-pilot-20261013]" in s or "cron: '17 * * * *'" in s:
    raise SystemExit("Unattended paid Quiz V4 launch must be disabled")
if s.index("Upload recoverable V4 audio")>s.index("Audit source sentences"):
    raise SystemExit("Paid audio recovery must happen before later failure-prone QA")
print(f"PASS: {len(blocks)} Python here-docs syntax valid; V4 job manual-only, capped and loss-safe")
