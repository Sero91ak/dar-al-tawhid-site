#!/usr/bin/env python3
from __future__ import annotations

import re
import unicodedata

FLOW_WEAK_ENDINGS={
    "und","oder","aber","denn","doch","weil","wenn","obwohl","während","damit","dass",
    "um","ohne","statt","anstatt","als","wie","zu","für","mit","von","bei","nach","vor",
    "darum","dazu","dafür","daran","darauf","dabei","davon","davor","danach"
}

INFINITIVE_TRIGGER_FORMS={
    "bitte","bittest","bittet","bitten","bat","baten",
    "fordere","forderst","fordert","fordern","auffordern","aufgefordert",
    "erlaube","erlaubst","erlaubt","erlauben",
    "verbiete","verbietest","verbietet","verbieten",
    "helfe","hilfst","hilft","helfen","half","halfen",
    "versuche","versuchst","versucht","versuchen","versuchte","versuchten",
    "hoffe","hoffst","hofft","hoffen","hoffte","hofften",
    "plane","planst","plant","planen","plante","planten",
    "beginne","beginnst","beginnt","beginnen","begann","begannen",
    "fange","fängst","fängt","fangen","anfangen","angefangen",
    "vergesse","vergisst","vergessen","vergaß","vergaßen",
    "lerne","lernst","lernt","lernen","lernte","lernten",
    "rate","rätst","rät","raten","riet","rieten",
    "empfehle","empfiehlst","empfiehlt","empfehlen","empfahl","empfahlen",
    "verspreche","versprichst","verspricht","versprechen","versprach","versprachen",
    "beschließe","beschließt","beschließen","beschloss","beschlossen",
    "entscheide","entscheidest","entscheidet","entscheiden","entschied","entschieden",
    "wünsche","wünschst","wünscht","wünschen",
    "beabsichtige","beabsichtigst","beabsichtigt","beabsichtigen",
    "scheine","scheinst","scheint","scheinen",
    "drohe","drohst","droht","drohen"
}

def _spoken_infinitive_near_start(text:str):
    head=re.sub(r"\s+"," ",str(text or "").strip().casefold())[:96]
    probe=" ".join(head.split()[:7])
    if re.search(r"\bzu\s+[a-zäöüß][a-zäöüß-]{2,}\b",probe,re.I):
        return True
    if re.search(r"\b[a-zäöüß]{1,10}zu[a-zäöüß]{3,}(?:en|ern|eln)\b",probe,re.I):
        return True
    return False

def _zero_pause_grammar_comma(left:str,right:str):
    l=re.sub(r"\s+"," ",str(left or "").strip().casefold())
    r=re.sub(r"\s+"," ",str(right or "").strip().casefold())
    if not l or not r or not _spoken_infinitive_near_start(r):
        return False,""

    tail=l[-96:]
    if re.search(r"\b(?:darum|dazu|dafür|daran|darauf|dabei|davon|davor|danach)$",tail):
        return True,"pronominaladverb_infinitive"

    tail_words=[re.sub(r"[^a-zäöüß-]","",w) for w in tail.split()[-6:]]
    if any(w in INFINITIVE_TRIGGER_FORMS for w in tail_words):
        return True,"verb_infinitive"

    clause=tail.split(".")[-1].split("!")[-1].split("?")[-1]
    if re.search(r"\b(?:um|ohne|statt|anstatt|außer|als)\b",clause):
        return True,"infinitive_connector"

    return False,""

def analyze_punctuation(text:str):
    """Erstellt einen reinen Prosodieplan. Er ändert den sichtbaren Text nicht."""
    value=str(text or "")
    plan=[]
    for idx,ch in enumerate(value):
        if ch not in ",،;؛:.!?؟…":
            continue
        left=value[:idx]
        right=value[idx+1:]
        if ch in ",،":
            zero,reason=_zero_pause_grammar_comma(left,right)
            if zero:
                pause_class="zero"
            elif re.match(r"\s*(?:und|oder|aber|denn|doch|sowie)\b",right,flags=re.I):
                pause_class="micro"
                reason="coordination"
            else:
                pause_class="short"
                reason="comma"
        elif ch in ";؛:":
            pause_class="phrase"
            reason="phrase_punctuation"
        else:
            pause_class="sentence"
            reason="sentence_end"
        plan.append({
            "index":idx,
            "mark":ch,
            "pause_class":pause_class,
            "reason":reason,
        })
    return plan

def normalize_synthesis_punctuation(text:str):
    value=unicodedata.normalize("NFC",str(text or ""))
    value=value.replace("\u00a0"," ").replace("\u202f"," ")
    value=re.sub(r"[ \t]+"," ",value)
    value=re.sub(r"\s+([,;:!?؟])",r"\1",value)
    value=re.sub(r"([,;:!?؟])(?=[^\s.!?؟…])",r"\1 ",value)

    chars=list(value)
    out=[]
    decisions=[]
    for idx,ch in enumerate(chars):
        if ch not in ",،":
            out.append(ch)
            continue

        zero,reason=_zero_pause_grammar_comma("".join(chars[:idx]),"".join(chars[idx+1:]))
        if zero:
            if out and not out[-1].endswith(" "):
                out.append(" ")
            decisions.append({
                "kind":"zero_pause_grammar_comma",
                "reason":reason,
                "source_index":idx,
            })
        else:
            out.append(ch)

    synthesis=re.sub(r"[ \t]+"," ","".join(out))
    synthesis=re.sub(r" +\n","\n",synthesis)
    return synthesis.strip(),decisions

def validate_render_plan(source_text:str,synthesis_text:str,plan):
    if not synthesis_text:
        raise ValueError("Satzfluss-Vorprüfung: Sprechtext ist leer.")
    if not plan:
        raise ValueError("Satzfluss-Vorprüfung: kein gültiger Renderplan.")

    sentences=[x.strip() for x in re.split(r"(?<=[.!?؟…])\s+",synthesis_text) if x.strip()]
    if not sentences:
        sentences=[synthesis_text]

    issues=[]
    boundaries=[]
    for i,(lang,chunk) in enumerate(plan):
        nxt=plan[i+1] if i+1<len(plan) else None
        prv=plan[i-1] if i>0 else None
        clean=str(chunk or "").strip()
        if not clean:
            issues.append(f"leerer Abschnitt {i+1}")
            continue

        words=re.findall(r"\S+",clean)
        end_word=re.sub(r"[^A-Za-zÄÖÜäöüß]+$","",words[-1]).casefold() if words else ""
        terminal=bool(re.search(r"[.!?؟…]$",clean))
        soft=bool(re.search(r"[,،;؛:]$",clean))

        if lang=="de" and not terminal and not soft and end_word in FLOW_WEAK_ENDINGS:
            if not (nxt and nxt[0]=="ar"):
                issues.append(f"unnatürliche Grenze nach '{end_word}' in Abschnitt {i+1}")

        if lang=="de" and len(words)<=2 and len(plan)>1 and not terminal:
            adjacent_ar=bool((prv and prv[0]=="ar") or (nxt and nxt[0]=="ar"))
            if not adjacent_ar:
                issues.append(f"zu kurzer deutscher Abschnitt {i+1}")

        boundaries.append({
            "index":i+1,
            "language":lang,
            "characters":len(clean),
            "words":len(words),
            "terminal":terminal,
            "soft_punctuation":soft,
            "language_bridge_after":bool(nxt and lang!=nxt[0]),
        })

    if issues:
        raise ValueError("Satzfluss-Vorprüfung fehlgeschlagen: "+"; ".join(issues[:6]))

    return {
        "engine":"strict-sentence-preflight-v2",
        "sentences":len(sentences),
        "segments":len(plan),
        "boundaries":boundaries,
        "source_characters":len(str(source_text or "")),
        "synthesis_characters":len(synthesis_text),
        "passed":True,
    }

def prepare_flow_text(source_text:str,speak_text:str,build_plan):
    synthesis,decisions=normalize_synthesis_punctuation(speak_text)
    plan=build_plan(synthesis)
    report=validate_render_plan(source_text,synthesis,plan)
    report["punctuation_decisions"]=decisions
    report["punctuation_plan"]=analyze_punctuation(speak_text)
    report["zero_pause_grammar_commas"]=len(decisions)
    report["fast_text_only_preflight"]=True
    return synthesis,plan,report
