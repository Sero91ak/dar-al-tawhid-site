#!/usr/bin/env python3
"""Build TAWḤĪD KIDS audio audition catalog from existing and future local audio.
No provider API, no spending, no publication or forged approval.
Read-only except explicit --write to root JSON used by noindex listening page.
"""
from __future__ import annotations
import argparse, hashlib, json, pathlib, re, urllib.parse

ROOT=pathlib.Path(__file__).resolve().parents[2]
ASSETS=ROOT/"kids/assets"
OUTPUT=ROOT/"audio-pruefzentrale-katalog-v1.json"
AUDIO_EXT={".m4a",".mp3",".aac",".ogg",".wav",".opus"}
SOURCES=[
 ("quiz-v4","Quiz · V4 – Fragen & Antworten","quiz-v4-full-rebuild-public.json"),
 ("quiz","Quiz · weitere Aufnahmen","quiz-audio.json"),
 ("dua-de","Duʿāʾ · Deutsch","dua-audio.json"),
 ("dua-ar","Duʿāʾ · Arabisch Fuṣḥā","dua-arabic-audio.json"),
 ("dua-slow","Duʿāʾ · Arabisch langsam","dua-arabic-slow-audio.json"),
 ("dua-word","Duʿāʾ · Wörter einzeln","dua-word-audio.json"),
 ("alphabet","Arabisches Alphabet","alphabet-audio.json"),
 ("terms","Islamische Begriffe","term-learning-audio.json"),
 ("academy","Akademie & Unterricht","academy-audio.json"),
 ("stories-prophet","Geschichten · Propheten","prophet-stories.json"),
 ("stories-companions","Geschichten · Gefährten","mubashshirun-stories.json"),
 ("stories-sahabiyyat","Geschichten · Ṣaḥābiyyāt","sahabiyyat-stories.json"),
 ("stories-short","Geschichten · Kurzgeschichten","short-stories-voice.json"),
 ("owner","Weitere Originalstimmen","owner-voice-audio.json"),
 ("other","Weitere Sprachaufnahmen","audio-generation-import.json"),
]
DETAIL_LABEL={"question":"Frage","correct":"Richtige Antwort / Lob","retry":"Erneut versuchen","explanation":"Erklärung","source":"Quellenhinweis","encouragement":"Ermutigung","intro":"Einleitung","outro":"Abschluss"}
SHA_RE=re.compile(r"^[a-f0-9]{64}$")
entries=[]
seen={}
stats={}

def add(group,title,clip,source,subtitle="",sortkey=""):
    if not isinstance(clip,dict): return
    url=clip.get("url") or clip.get("audioUrl") or clip.get("src")
    if not isinstance(url,str): return
    u=urllib.parse.urlsplit(url)
    if u.scheme or u.netloc: return  # Never copy remote temporary or token-protected URLs.
    path=u.path
    if not path.startswith("/kids/assets/") or pathlib.PurePosixPath(path).suffix.lower() not in AUDIO_EXT: return
    if ".." in pathlib.PurePosixPath(path).parts: return
    file=ROOT/path.lstrip("/")
    if not file.is_file():
        stats["missingFileReferences"]=stats.get("missingFileReferences",0)+1
        return
    # Physical files are unique review objects even if many original manifests reference them.
    if path in seen: return
    expected=clip.get("sha256") or clip.get("audioSha256") or ""
    expected=expected if isinstance(expected,str) and SHA_RE.fullmatch(expected) else ""
    if expected:
        actual=hashlib.sha256(file.read_bytes()).hexdigest()
        integrity="passed" if actual==expected else "mismatch"
    else:
        actual=hashlib.sha256(file.read_bytes()).hexdigest()
        integrity="computed-from-local-file"
    if integrity=="mismatch":
        stats["invalidShaFiles"]=stats.get("invalidShaFiles",0)+1
    title=(str(title or path.rsplit("/",1)[-1]).strip() or path.rsplit("/",1)[-1])[:190]
    subtitle=(str(subtitle or "").strip())[:220]
    duration=clip.get("durationSeconds") or clip.get("durationSec") or clip.get("duration") or 0
    try: duration=round(float(duration),2)
    except (TypeError,ValueError): duration=0
    record={"id":hashlib.sha256(path.encode()).hexdigest()[:20],
      "group":group,"title":title,"subtitle":subtitle,"url":url,
      "sha256":actual,"durationSec":duration,"integrity":integrity,
      "sourceManifest":source,"originalModel":clip.get("modelId") or "",
      "originalHumanListeningApproved":clip.get("humanListeningApproved") is True,
      "sort":sortkey}
    if record["url"].startswith("//"): return
    entries.append(record);seen[path]=record["id"]

def harvest(node,group,source,title="",subtitle="",depth=0):
    if depth>12: return
    if isinstance(node,dict):
        if isinstance(node.get("url") or node.get("audioUrl") or node.get("src"),str):
            add(group,title or node.get("title") or node.get("text") or node.get("label") or "",
                node,source,subtitle)
            return
        for key,child in node.items():
            if key in ("image","hero","poster","artwork","sourceRefs","sources","primaryReferences","policy","visualEvidence"): continue
            if isinstance(child,(dict,list)):
                child_title=title
                if key not in ("entries","items","questions","clips","audio","audioMaster","voice","voiceKids","narration","records"):
                    child_title=(title+" · " if title else "")+str(key)[:110]
                harvest(child,group,source,child_title,subtitle,depth+1)
    elif isinstance(node,list):
        for i,child in enumerate(node):
            if isinstance(child,dict):
                n=child.get("title") or child.get("name") or child.get("short") or child.get("id") or title
                harvest(child,group,source,str(n),subtitle,depth+1)

def build():
    data_dir=ROOT/"kids/data"
    used=set()
    for group,label,name in SOURCES:
        file=data_dir/name
        if not file.is_file(): continue
        used.add(name)
        try: data=json.loads(file.read_text(encoding="utf-8"))
        except (OSError,ValueError) as e:
            stats["badManifestCount"]=stats.get("badManifestCount",0)+1
            continue
        if name=="quiz-v4-full-rebuild-public.json":
            for qid,q in data.get("questions",{}).items():
                for kind,clip in (q.get("clips") or {}).items():
                    text=clip.get("text","") if isinstance(clip,dict) else ""
                    add(group,f"{qid} · {DETAIL_LABEL.get(kind,kind)}",clip,name,
                        str(text)[:175]+" · "+q.get("ageBand",""))
        elif isinstance(data.get("entries"),dict):
            for text,clip in data["entries"].items():
                if isinstance(clip,dict) and isinstance(clip.get("url"),str):
                    add(group,clip.get("text") or str(text),clip,name,subtitle=str(text)[:175])
                else:
                    harvest(clip,group,name,str(text)[:100])
        else:
            harvest(data.get("items") or data.get("stories") or data,group,name)
    # Future audio manifests automatically join on the next CI run.
    for pattern in ("*audio*.json","*voice*.json","*stories*.json"):
        for file in sorted(data_dir.glob(pattern)):
            if file.name in used: continue
            try: data=json.loads(file.read_text(encoding="utf-8"))
            except (OSError,ValueError): continue
            harvest(data.get("entries") or data.get("items") or data,"additional",file.name,file.stem)
            used.add(file.name)
    # Catch every orphaned local audio without treating it as approved.
    for file in sorted(ASSETS.rglob("*")):
        if not file.is_file() or file.suffix.lower() not in AUDIO_EXT: continue
        path="/"+str(file.relative_to(ROOT)).replace("\\","/")
        if path in seen: continue
        folder=file.parent.name
        group="unassigned"
        if "quiz" in folder or "quiz" in path: group="quiz-archive"
        elif "dua" in path: group="dua-archive"
        elif "alphabet" in path: group="alphabet"
        elif "prophet" in path: group="stories-prophet"
        elif "sahabiyyat" in path: group="stories-sahabiyyat"
        elif "mubashshirun" in path: group="stories-companions"
        elif "academy" in path: group="academy"
        elif "term" in path: group="terms"
        add(group, file.stem.replace("-"," ").replace("_"," "), {"url":path}, "local-audio-file-scan", folder)
    entries.sort(key=lambda a:(a["group"],a["sort"],a["title"].casefold(),a["id"]))
    groups={}
    for item in entries:
        groups[item["group"]]=groups.get(item["group"],0)+1
        item.pop("sort",None)
    categories=[{"id":g,"title":label,"count":groups.get(g,0)} for g,label,_ in SOURCES if groups.get(g)]
    for g,label in [("additional","Weitere neue Audio-Manifeste"),("quiz-archive","Quiz · vorhandene Archivdateien"),("dua-archive","Duʿāʾ · vorhandene Archivdateien"),("unassigned","Weitere Audiodateien ohne Zuordnung")]:
        if groups.get(g):categories.append({"id":g,"title":label,"count":groups[g]})
    # Nested source paths that are not named in the fixed list still remain visible.
    for g in sorted(set(groups)-{c["id"] for c in categories}):
        categories.append({"id":g,"title":g,"count":groups[g]})
    doc={"schemaVersion":1,"collection":"TAWḤĪD KIDS · Audioprüfzentrale",
       "reviewOnly":True,"humanApprovalAutomatic":False,"newTtsGeneration":False,
       "source":"canonical local media metadata + local audio file scan",
       "salafEmbeddedSeparately":33,
       "categories":categories,"entries":entries,
       "statistics":{"audioFiles":len(entries),"groups":len(categories),**stats}}
    return doc

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--write",action="store_true")
    args=parser.parse_args()
    doc=build()
    assert len(doc["entries"])==len({e["url"].split("?")[0] for e in doc["entries"]})
    assert all(e["sha256"] and e["url"].startswith("/kids/assets/") for e in doc["entries"])
    if not doc["entries"]: raise RuntimeError("Audio index unexpectedly empty")
    print("PASS: audio index",doc["statistics"],"categories:",[(x["id"],x["count"]) for x in doc["categories"]])
    if args.write:
        OUTPUT.write_text(json.dumps(doc,ensure_ascii=False,separators=(",",":"))+"\n",encoding="utf-8")
        print("SAVED",OUTPUT.relative_to(ROOT),"bytes",OUTPUT.stat().st_size)
if __name__=="__main__":main()
