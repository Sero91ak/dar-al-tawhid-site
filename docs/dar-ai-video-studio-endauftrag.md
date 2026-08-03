# Verbindlicher Endauftrag – DAR KI-Video-Beiträge

**Status:** umgesetzt als festes Template `dar-standard-v2` (Storyboard/Compose v3)  
**Branch:** `cursor/video-studio-dar-brand-standard-e34c` · PR #440  
**Regel:** Staging zuerst · kein Auto-Feed · kein Auto-Push · Live nur nach ausdrücklicher Freigabe

## Endziel

Autonomes DAR-Premium-Video: **bewegter DAR-Bildbeitrag** mit Stimme, Atmosphäre, Branding und klarer Lesbarkeit – kein generisches KI-/TikTok-Video.

## Fester Automatik-Standard (bei jedem „Video-Beitrag autonom erstellen“)

1. Aussage prüfen  
2. Storyboard + Themenatmosphäre  
3. Referenz-/Clip-Generierung (gesichtslos)  
4. Exakte DAR-Männerstimme (ElevenLabs)  
5. Abschnittsweise Texteinblendungen  
6. Shotstack **Production** Compose (kein Stage-Wasserzeichen)  
7. QA-Gate  
8. Admin: Vorschau → Download → Teilen → intern freigeben → optional Feed/Push (manuell)

## Branding (Pflicht)

- DAR AL TAWḤĪD  
- Eigenes Wasserzeichen-Logo  
- CTA: „Folgt für mehr Wissen aus Qurʾān & Sunnah“  
- Social: Telegram `@dar_al_tauhid` · Website `dar-al-tauhid.de` · Instagram `@dar_at_tawhid`  
- Credit: `by Serhat Abu Malik`  
- **Kein** Shotstack-/fal-/Stage-Logo in der Endfassung

## Textarchitektur

Brand (optional Thema) → Sprecher (`… رحمه الله sagte:`) → Aussage 2–4 Blöcke → Quelle → CTA/Social/Credit

## Format

1080×1920 · 9:16 · MP4 · Safe Areas

## Freigabe

| Schritt | Automatisch? |
|---|---|
| Erzeugen / QA | ja |
| Vorschau / Download / Teilen | manuell in Admin |
| Intern freigeben | manuell |
| Feed | optional, manuell, `confirm:true`, **kein Live auto** |
| Push | optional, manuell, Staging blockiert Besucher-Push |

## Infrastruktur

fal.ai · ElevenLabs · Shotstack (stage=Vorschau, v1=Endfassung) · Cloudflare Worker · R2 · Admin-App
