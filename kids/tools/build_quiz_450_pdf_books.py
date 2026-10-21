#!/usr/bin/env python3
"""Create two original, legible and searchable PDF books from the official 900
TAWḤĪD KIDS questions and the persisted 450/450 editorial selection.

Each has exactly 450 unabridged questions and original IDs, every choice,
answer key, explanation, original Qurʾān/Hadith source. No citations are URLs.
No data changes, TTS, network connections or live deployment.
"""
from __future__ import annotations

import argparse
import json
import math
import os
from collections import Counter, OrderedDict
from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Table, TableStyle, Spacer,
    PageBreak, KeepTogether, CondPageBreak
)

ROOT = Path(__file__).resolve().parents[2]
CATALOG_FILE = ROOT / "kids/data/quiz-kids.json"
SELECTED_FILE = ROOT / "kids/data/quiz-v4-selected-450.json"
OUTPUT_DIR = ROOT / "kids/downloads"
AGES = ("4-6", "7-8", "9-10")
AGE_LABEL = {"4-6": "4–6 Jahre", "7-8": "7–8 Jahre", "9-10": "9–10 Jahre"}
NAVY = colors.HexColor("#11283B")
CREAM = colors.HexColor("#FBF8F1")
INK = colors.HexColor("#1F3040")
MUTED = colors.HexColor("#596676")
GOLD = colors.HexColor("#B48C43")
LINE = colors.HexColor("#DCE1E2")
PALETTE = {"4-6": colors.HexColor("#246C73"), "7-8": colors.HexColor("#8C587E"), "9-10": colors.HexColor("#A8783A")}
GREEN = colors.HexColor("#216C51")
PALE_GREEN = colors.HexColor("#EAF5EC")
WIDTH, HEIGHT = A4
MARGIN_L, MARGIN_R = 19*mm, 19*mm
CONTENT_W = WIDTH-MARGIN_L-MARGIN_R

def find_font(name, fallback):
    paths = ["/usr/share/fonts/truetype/noto/NotoSans-" + name + ".ttf",
             "/usr/share/fonts/truetype/dejavu/DejaVuSans" + ("-Bold" if name == "Bold" else "") + ".ttf",
             fallback]
    return next((p for p in paths if Path(p).is_file()), fallback)

def register_fonts():
    normal = find_font("Regular", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf")
    bold = find_font("Bold", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf")
    pdfmetrics.registerFont(TTFont("KIDS", normal))
    pdfmetrics.registerFont(TTFont("KIDS-Bold", bold))
    pdfmetrics.registerFontFamily("KIDS", normal="KIDS", bold="KIDS-Bold")

register_fonts()
STYLES = {
    "cover_tag": ParagraphStyle("cover_tag", fontName="KIDS-Bold", fontSize=12,
                                leading=18, textColor=colors.HexColor("#E9C98E"), alignment=TA_LEFT),
    "cover_title": ParagraphStyle("cover_title", fontName="KIDS-Bold", fontSize=31,
                                  leading=39, textColor=colors.white),
    "cover_intro": ParagraphStyle("cover_intro", fontName="KIDS", fontSize=12,
                                  leading=19, textColor=colors.HexColor("#DFE8E8")),
    "cover_bullet": ParagraphStyle("cover_bullet", fontName="KIDS", fontSize=11,
                                   leading=20, textColor=colors.white),
    "chapter": ParagraphStyle("chapter", fontName="KIDS-Bold", fontSize=19,
                              leading=27, textColor=NAVY, spaceAfter=11),
    "age_head": ParagraphStyle("age_head", fontName="KIDS-Bold", fontSize=16,
                               leading=22, textColor=NAVY, spaceAfter=7),
    "category": ParagraphStyle("category", fontName="KIDS-Bold", fontSize=11.5,
                               leading=16.5, textColor=NAVY, spaceBefore=10, spaceAfter=5),
    "question_id": ParagraphStyle("question_id", fontName="KIDS-Bold", fontSize=7.6,
                                  leading=12, textColor=MUTED),
    "question": ParagraphStyle("question", fontName="KIDS-Bold", fontSize=10.4,
                               leading=15.2, textColor=NAVY),
    "option": ParagraphStyle("option", fontName="KIDS", fontSize=9.0,
                             leading=13.3, textColor=INK),
    "option_correct": ParagraphStyle("option_correct", fontName="KIDS-Bold", fontSize=9.0,
                                     leading=13.3, textColor=GREEN),
    "detail": ParagraphStyle("detail", fontName="KIDS", fontSize=9.0,
                             leading=13.9, textColor=INK),
    "source": ParagraphStyle("source", fontName="KIDS", fontSize=8.4,
                             leading=12.4, textColor=MUTED),
    "notice": ParagraphStyle("notice", fontName="KIDS", fontSize=10.1,
                             leading=16, textColor=INK),
    "toc": ParagraphStyle("toc", fontName="KIDS", fontSize=10,
                          leading=17, textColor=INK),
}

def clean(txt):
    # All original content stays unchanged apart from XML-safe rendering.
    return escape(str(txt or ""), {"'":"&#39;", '"':"&quot;"})

def load():
    catalog=json.loads(CATALOG_FILE.read_text(encoding="utf-8"))
    selected=json.loads(SELECTED_FILE.read_text(encoding="utf-8"))
    items=catalog["items"]
    by_id={q["id"]:q for q in items}
    if len(items)!=900 or len(by_id)!=900:
        raise ValueError("Expected 900 distinct canonical quiz questions")
    if selected["counts"]["selectedForFirstAudioRelease"]!=450:
        raise ValueError("Unexpected selection manifest")
    select_ids=[id for age in AGES for id in selected["bands"][age]["ids"]]
    reserve_ids=[id for age in AGES for id in selected["reservedIds"][age]]
    if len(select_ids)!=450 or len(reserve_ids)!=450:
        raise ValueError("Unexpected 450/450 sizes")
    if set(select_ids)&set(reserve_ids) or set(select_ids)|set(reserve_ids)!=set(by_id):
        raise ValueError("Selected/reserved ID sets overlap or do not cover catalog")
    if sum(id not in by_id for id in select_ids+reserve_ids):
        raise ValueError("One or more quiz IDs do not exist in catalog")
    for q in items:
        if sum(bool(a["correct"]) for a in q["answers"])!=1:
            raise ValueError("Invalid one-true-answer question: "+q["id"])
        if not q.get("explanation") or not q.get("source") or not q.get("category"):
            raise ValueError("Missing explanation/source/category: "+q["id"])
    for age in AGES:
        if sum(q["ageBand"]==age for q in items)!=300:
            raise ValueError("Wrong canonical age partition")
        if len(selected["bands"][age]["ids"])!=150 or len(selected["reservedIds"][age])!=150:
            raise ValueError("Each book must show 150 per age")
    return by_id, select_ids, reserve_ids, selected

def draw_page(canvas,doc,mode):
    canvas.saveState()
    page = doc.page
    canvas.setFillColor(CREAM if page>1 else NAVY)
    canvas.rect(0,0,WIDTH,HEIGHT,fill=1,stroke=0)
    if page==1:
        canvas.setStrokeColor(colors.HexColor("#345263"))
        canvas.setLineWidth(1)
        for radius in (48*mm,67*mm,86*mm):
            canvas.circle(WIDTH-6*mm,HEIGHT-17*mm,radius,fill=0,stroke=1)
        canvas.setFillColor(GOLD)
        canvas.roundRect(18*mm, HEIGHT-51*mm, 46*mm, 2.7*mm, 1*mm,stroke=0,fill=1)
    else:
        canvas.setStrokeColor(GOLD)
        canvas.setLineWidth(1.2)
        canvas.line(MARGIN_L,HEIGHT-21*mm,WIDTH-MARGIN_R,HEIGHT-21*mm)
        canvas.setFont("KIDS-Bold",8.2)
        canvas.setFillColor(NAVY)
        canvas.drawString(MARGIN_L,HEIGHT-18.3*mm,"TAWḤĪD KIDS  /  QUIZ")
        canvas.setFont("KIDS",8)
        canvas.setFillColor(MUTED)
        canvas.drawRightString(WIDTH-MARGIN_R,HEIGHT-18.3*mm,mode)
        canvas.setStrokeColor(LINE)
        canvas.line(MARGIN_L,18*mm,WIDTH-MARGIN_R,18*mm)
        canvas.setFont("KIDS",7.7)
        canvas.setFillColor(MUTED)
        canvas.drawString(MARGIN_L,13.1*mm,"dar-al-tawhid.de  •  Qurʾān & Sunnah")
        canvas.drawRightString(WIDTH-MARGIN_R,13.1*mm,f"Seite {page}")
    canvas.restoreState()

def question_card(q,age):
    accent = PALETTE[age]
    rows = [
      [Paragraph(f"FRAGE {int(q['number']):03d}    •    {clean(q['category'])}    •    {clean(q['topic'])}", STYLES["question_id"])],
      [Paragraph(clean(q["question"]), STYLES["question"])]
    ]
    for i,answer in enumerate(q["answers"]):
        prefix = "RICHTIG" if answer["correct"] else chr(ord("A")+i)
        prefix = f"{chr(ord('A')+i)}  ·  " + ("RICHTIGE ANTWORT: " if answer["correct"] else "")
        key = "option_correct" if answer["correct"] else "option"
        rows.append([Paragraph(prefix+clean(answer["label"]),STYLES[key])])
    rows += [
      [Paragraph("<b>Erklärung:</b> "+clean(q["explanation"]), STYLES["detail"])],
      [Paragraph("<b>Quelle:</b> "+clean(q["source"]), STYLES["source"])]
    ]
    tbl=Table(rows,colWidths=[CONTENT_W-20],hAlign="LEFT")
    styles=[("BACKGROUND",(0,0),(-1,-1),colors.white),
            ("BOX",(0,0),(-1,-1),.65,LINE),
            ("LINEBEFORE",(0,0),(0,-1),3.5,accent),
            ("LEFTPADDING",(0,0),(-1,-1),9),
            ("RIGHTPADDING",(0,0),(-1,-1),9),
            ("TOPPADDING",(0,0),(-1,-1),2.6),
            ("BOTTOMPADDING",(0,0),(-1,-1),2.6),
            ("TOPPADDING",(0,0),(-1,0),7),
            ("BOTTOMPADDING",(0,-1),(-1,-1),7),
            ("VALIGN",(0,0),(-1,-1),"TOP")]
    for i,answer in enumerate(q["answers"],start=2):
        if answer["correct"]:
            styles.append(("BACKGROUND",(0,i),(-1,i),PALE_GREEN))
    tbl.setStyle(TableStyle(styles))
    return tbl

def get_group(by_id, id_list, age):
    group=[by_id[id] for id in id_list if by_id[id]["ageBand"]==age]
    if len(group)!=150:
        raise ValueError("Not precisely 150 records for "+age)
    ordered=sorted(group,key=lambda q:(str(q["category"]).casefold(),int(q["number"])))
    return ordered

def make_book(filename,kind,by_id,ids):
    selected = kind=="start"
    label = "STARTAUSWAHL" if selected else "ERWEITERUNGSRESERVE"
    mode = "450 ausgewählte Quizfragen" if selected else "450 weitere Quizfragen"
    subtitle = ("450 ausgewählte Fragen für die erste vertonte Ausbaustufe" if selected
                else "450 weitere Fragen – vollständige Reserve für spätere Erweiterungen")
    target=OUTPUT_DIR/filename
    doc=SimpleDocTemplate(str(target),pagesize=A4,
        leftMargin=MARGIN_L,rightMargin=MARGIN_R,
        topMargin=26*mm,bottomMargin=23*mm,
        title="TAWḤĪD KIDS | "+mode,
        author="TAWḤĪD KIDS",
        subject="Islamische Quizfragen, 150 je Altersgruppe, Antworten und Quellen")
    elements=[]
    elements.append(Spacer(1,37*mm))
    elements.append(Paragraph("TAWḤĪD KIDS",STYLES["cover_tag"]))
    elements.append(Spacer(1,11*mm))
    elements.append(Paragraph("450 QUIZFRAGEN",STYLES["cover_title"]))
    elements.append(Spacer(1,8*mm))
    elements.append(Paragraph(label,STYLES["cover_tag"]))
    elements.append(Spacer(1,8*mm))
    elements.append(Paragraph(clean(subtitle),STYLES["cover_intro"]))
    elements.append(Spacer(1,28*mm))
    for age in AGES:
        elements.append(Paragraph("150 Fragen  ·  "+AGE_LABEL[age],STYLES["cover_bullet"]))
    elements.append(Spacer(1,19*mm))
    elements.append(Paragraph("Fragen  •  Antwortmöglichkeiten  •  richtige Lösung  •  Erklärung  •  Quelle",STYLES["cover_intro"]))
    elements.append(Spacer(1,11*mm))
    elements.append(Paragraph("Geordnet nach Altersgruppe und Thema. Mit Original-Fragennummern für die spätere Audio-Produktion.",STYLES["cover_intro"]))
    elements.append(PageBreak())
    elements.append(Paragraph("Übersicht",STYLES["chapter"]))
    status=("<b>Band 1 – Startauswahl.</b> Diese Fragen sind für die erste Audioproduktion ausgewählt. "
            "Die Auswahl alleine bestätigt noch keine fertige Vertonung oder Veröffentlichung."
            if selected else
            "<b>Band 2 – Erweiterungsreserve.</b> Diese Fragen bleiben vollständig für die spätere Audio-Erweiterung erhalten. "
            "Die Bezeichnung „Reserve“ sagt nichts über ihre bisherige Sichtbarkeit im vorhandenen Web-Quiz aus.")
    elements.append(Paragraph(status,STYLES["notice"]))
    elements.append(Spacer(1,6*mm))
    elements.append(Paragraph("Die Antworten sind zur inhaltlichen Prüfung deutlich markiert. Die Quellenangaben stammen aus dem bestehenden Quizkatalog und sind keine externen Links.",STYLES["notice"]))
    elements.append(Spacer(1,8*mm))
    table_data=[[Paragraph("<b>Altersgruppe</b>",STYLES["toc"]),
                 Paragraph("<b>Fragen</b>",STYLES["toc"]),
                 Paragraph("<b>Themenbereiche</b>",STYLES["toc"])]]
    groups={}
    for age in AGES:
        group=get_group(by_id,ids,age)
        groups[age]=group
        cats=OrderedDict()
        for q in group:
            cats[q["category"]]=cats.get(q["category"],0)+1
        table_data.append([Paragraph(AGE_LABEL[age],STYLES["toc"]),
                           Paragraph(str(len(group)),STYLES["toc"]),
                           Paragraph(str(len(cats)),STYLES["toc"])])
    t=Table(table_data,colWidths=[72*mm,30*mm,CONTENT_W-102*mm])
    t.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,0),colors.HexColor("#EEF0EC")),
                           ("LINEBELOW",(0,0),(-1,-1),.6,LINE),
                           ("VALIGN",(0,0),(-1,-1),"TOP"),
                           ("TOPPADDING",(0,0),(-1,-1),7),
                           ("BOTTOMPADDING",(0,0),(-1,-1),7)]))
    elements.append(t)
    elements.append(Spacer(1,11*mm))
    elements.append(Paragraph("Originalnummern bleiben unverändert: So lassen sich die Fragen später exakt den Audiodateien zuordnen, ohne den Lernfortschritt zu verlieren.",STYLES["notice"]))
    for age_idx,age in enumerate(AGES):
        if age_idx:
            elements.append(PageBreak())
        else:
            elements.append(Spacer(1,8*mm))
            elements.append(CondPageBreak(82*mm))
        group=groups[age]
        elements.append(Paragraph("Quizfragen  ·  "+AGE_LABEL[age],STYLES["age_head"]))
        elements.append(Paragraph("150 Fragen · nach Themen geordnet · mit Antworten, Erklärungen und Quellen",STYLES["notice"]))
        elements.append(Spacer(1,5*mm))
        current=None
        for q in group:
            cat=q["category"]
            if cat!=current:
                elements.append(CondPageBreak(72*mm))
                elements.append(Paragraph(clean(cat),STYLES["category"]))
                current=cat
            # One question + all options + explanation + source must never be
            # split across pages. KeepTogether prevents ReportLab table-row splits.
            elements.append(KeepTogether([question_card(q,age), Spacer(1,3.2*mm)]))
    doc.build(elements,
      onFirstPage=lambda canvas,doc:draw_page(canvas,doc,mode),
      onLaterPages=lambda canvas,doc:draw_page(canvas,doc,mode))
    return target

def inspect(output):
    try:
        import fitz
    except ImportError:
        return {"file":str(output),"sizeBytes":output.stat().st_size,"check":"fitz-not-installed"}
    pdf=fitz.open(str(output))
    texts=" ".join(page.get_text() for page in pdf)
    # FRAGE label appears once per card. Count robustly with re.
    import re
    labels=re.findall(r"\bFRAGE\s+[0-9]{3}\b",texts)
    if len(labels)!=450:
        raise RuntimeError(f"PDF {output.name} contains {len(labels)} visible question cards, expected 450")
    for page_num,page in enumerate(pdf,1):
        page_text=page.get_text()
        question_count=len(re.findall(r"\bFRAGE\s+[0-9]{3}\b",page_text))
        sources_count=page_text.count("Quelle:")
        explanations_count=page_text.count("Erklärung:")
        if question_count!=sources_count or question_count!=explanations_count:
            raise RuntimeError(f"Page {page_num} has split question cards: {question_count} questions, {explanations_count} explanations, {sources_count} sources")
    if len(pdf)<10 or output.stat().st_size<100000:
        raise RuntimeError("Suspiciously small PDF")
    for idx in [0,1,len(pdf)//2,len(pdf)-1]:
        if not pdf[idx].get_text().strip():
            raise RuntimeError("Empty PDF page "+str(idx))
    return {"file":str(output),"pages":len(pdf),"questionCards":len(labels),
            "sizeBytes":output.stat().st_size,"verified":True}

def main():
    global OUTPUT_DIR
    p=argparse.ArgumentParser()
    p.add_argument("--output-dir",type=Path,default=OUTPUT_DIR)
    args=p.parse_args()
    OUTPUT_DIR=args.output_dir
    OUTPUT_DIR.mkdir(parents=True,exist_ok=True)
    by_id,first,remaining,_=load()
    out1=make_book("TAWHID_KIDS_450_Startfragen.pdf","start",by_id,first)
    out2=make_book("TAWHID_KIDS_450_Erweiterungsfragen.pdf","reserve",by_id,remaining)
    reports=[inspect(x) for x in [out1,out2]]
    print("KIDS_450_450_PDF_VERIFIED "+json.dumps(reports,ensure_ascii=False),flush=True)

if __name__=="__main__":
    main()
