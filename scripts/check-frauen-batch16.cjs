#!/usr/bin/env node
"use strict";
/*
 * DĀR AL TAWḤĪD · Frauen Sammelblock 16
 * READ ONLY. Safe against premature publication/notification.
 * Usage: node scripts/check-frauen-batch16.cjs [status|prepare|prepublish|ready|notify]
 * status    : report status and blockers (exit 0)
 * prepare   : enforce complete structural drafts without bypassing locks
 * prepublish: require source/language/reader QA, ready to propose live release
 * ready     : require all 16 live-verified (after deployment)
 * notify    : require live proof plus authorized, verified OneSignal targeting; never sends
 */
const fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,"..");
const load=(p)=>JSON.parse(fs.readFileSync(path.join(root,p),"utf8"));
const manifest=load("content/admin/frauen-batch-16-2026-11-18.json");
const locale=load("assets/frauen/frauen-entry-locales-v1.json");
const sourceAudit=load("content/admin/frauen-batch16-source-audit-20261118.json");
const codes=["de","ar","en","tr","ku","ckb","bs","fr","es"];
const idSeen=new Set(),urlSeen=new Map(),missing=[],structureErrors=[],detail=[];
const assert=(v,msg)=>{if(!v){missing.push(msg);structureErrors.push(msg)}};
assert(manifest.expectedReleaseCount===16&&manifest.records.length===16,"Release cohort must contain exactly sixteen canonical records");
assert(sourceAudit.sources?.length===16,"Exactly 16 primary-reference audit records required");
assert(sourceAudit.publicationAuthorization===false,"Source audit must not grant production access by itself");
assert(JSON.stringify(manifest.requiredLocales)===JSON.stringify(codes),"Exact nine-language roster changed");
const dataFiles=[...new Set(manifest.records.map(x=>x.sourceFile))];
const files=new Map(dataFiles.map(f=>[f,load(f)]));
for(const r of manifest.records){
  const key=r.id, original=(files.get(r.sourceFile)?.eintraege||[]).filter(e=>e.kennung===key);
  const found=original[0]||{}, l=locale.entries?.[key], errors=[];
  const check=(yes,what,releaseOnly=false)=>{if(!yes){errors.push(what);missing.push(key+": "+what);if(!releaseOnly)structureErrors.push(key+": "+what)}};
  check(!idSeen.has(key),"duplicate canonical ID");idSeen.add(key);
  check(original.length===1,"record missing or duplicate in source file");
  check(found.contentId===key,"contentId must match original kennung");
  check(found.direktnachweisUrl===r.sourceUrl,"original source link changed");
  check(found.quellePrimaerId===r.sourceId,"original source book+number changed");
  const audited=(sourceAudit.sources||[]).find(a=>a.id===key);
  check(Boolean(audited),"source-audit record absent");
  if(audited){
    check(audited.originalSourceId===r.sourceId&&audited.originalSourceUrl===r.sourceUrl,"original reference drift vs source audit");
    check(audited.sourceLocated===true&&audited.directPageStatus==="hadith-page-opens-and-topic-matches","primary page identification incomplete");
    check(audited.independentScholarlySignoff===true,"source-audit scholarly approval outstanding",true);
    check(!audited.needsAttention?.length,"unresolved primary-reference anomaly",true);
  }
  check(typeof found.arabischerOriginalauszug==="string"&&/[\u0600-\u06ff]/.test(found.arabischerOriginalauszug),"Arabic primary-text excerpt absent");
  check(!found.arabischerOriginalauszugNachweis||found.arabischerOriginalauszugNachweis===r.sourceUrl,"Arabic excerpt reference does not match original source");
  check(!Object.hasOwn(found,"qNumber")||found.qAssignmentApprovedByUser===true,"unapproved Q-number");
  check(found.quellenstatus==="geprueft","quellenstatus not yet published",true);
  check(found.freigabeDurchSerhat===true,"author release flag missing");
  check(found.localeCatalogId===key,"locale catalog ID absent");
  const route="#/frauen/"+r.area+"/"+key;
  check(typeof r.area==="string"&&r.area.length>1,"canonical route section missing");
  check(Boolean(l),"nine-language catalog entry missing");
  if(l){
    check(l.id===key&&l.sourceUrl===r.sourceUrl,"locale identity/source URL mismatch");
    check(l.area===r.area,"locale area / reader route differs from parent section");
    const german=found.vollstaendigeAussage||found.inhalt;
    const lesson=found.lehre||found.nutzen;
    check(l.locales?.de?.title===found.titel,"German title changed");
    check(l.locales?.de?.statement===german,"German statement changed");
    check(l.locales?.de?.lesson===lesson,"German lesson changed");
    const sharh=found.redaktionelleErlaeuterung||found.sharh;
    check(l.locales?.de?.sharh===sharh,"German source-linked editorial sharh changed");
    const originalRefNumbers=String(found.quellenanzeige||"").match(/\b\d{2,5}[a-z]?\b/g)||[];
    for(const code of codes){
      const p=l.locales?.[code];
      check(Boolean(p),"missing locale "+code);
      if(!p)continue;
      check(p.lang===code,"invalid locale identity "+code);
      check(p.dir===(["ar","ckb"].includes(code)?"rtl":"ltr"),"invalid writing direction "+code);
      for(const k of ["title","statement","preview","lesson","sharh","source"]){
        check(typeof p[k]==="string"&&p[k].trim().length>=5,"empty "+code+"."+k);
        if(code!=="de"&&["title","statement","lesson","sharh"].includes(k))
          check(p[k]!==l.locales.de?.[k],"untranslated German field "+code+"."+k);
      }
      const translatedRefNumbers=String(p.source||"").match(/\b\d{2,5}[a-z]?\b/g)||[];
      for(const number of originalRefNumbers)check(translatedRefNumbers.includes(number),"original source number "+number+" missing in "+code);
      check(String(p.source||"").length>=22,"incomplete source citation in "+code);
      const labels=["statement","lesson","source","proof","open","back","share","sharh","status","area","shareTop","shareHint","copyText","copyLink","image","shareButton","shareNote","waAria","tgAria","igAria","nativeAria"];
      for(const k of labels)check(typeof p.labels?.[k]==="string"&&p.labels[k].trim().length>=2,"UI label missing "+code+"."+k);
    }
  }
  check(r.translationReview==="approved","independent native-language review pending",true);
  check(r.sourceReview==="approved","source and isnad review pending",true);
  check(r.uiQa==="passed","interactive phone/fold/tablet/desktop QA pending",true);
  check(r.publishQa==="passed","Cloudflare publication verification pending",true);
  if(urlSeen.has(r.sourceUrl))check(false,"duplicate external source URL also in "+urlSeen.get(r.sourceUrl));
  urlSeen.set(r.sourceUrl,key);
  detail.push({id:key,title:r.displayTitle,route,source:r.sourceId,languages:l?Object.keys(l.locales||{}).length:0,ready:errors.length===0,blockers:errors});
}
const lock=load("content/admin/push-lanes-lock.json");
const notification={
  prepared:Boolean(manifest.notificationDraft?.title&&manifest.notificationDraft?.body),
  sent:false,
  reason:"Sending is a separate admin operation after publication. Push-lock, password, global and lane approvals, verified opted-in adult-woman segment and delivery audit are mandatory.",
  pushLocked:lock.locked===true,
  audience:manifest.notificationDraft?.audience
};
const allReady=missing.length===0;
const prepublishExceptions=new Set(["quellenstatus not yet published","Cloudflare publication verification pending"]);
const prepublishReady=structureErrors.length===0&&detail.every(d=>d.blockers.every(reason=>prepublishExceptions.has(reason)));
const notifyReady=allReady&&manifest.state==="published-live-verified"&&
  lock.locked===false&&
  manifest.notificationDraft?.guardStatus==="admin-unlocked"&&
  manifest.notificationDraft?.verifiedSegmentType==="knowledge_woman"&&
  manifest.notificationDraft?.verifiedSegmentAudience==="adult-app AND knowledge-opt-in"&&
  Number.isInteger(manifest.notificationDraft?.verifiedOptInRecipientCount)&&
  manifest.notificationDraft.verifiedOptInRecipientCount>0&&
  manifest.notificationDraft?.requireSeparatePushLockPassword===true&&
  manifest.notificationDraft?.onceOnly===true;
const summary={batch:manifest.id,records:detail.length,structureReady:structureErrors.length===0,structureErrors,prepublishReady,ready:allReady,notifyReady,readyCount:detail.filter(d=>d.ready).length,localeCountExpected:16*9,localeCountFound:detail.reduce((n,d)=>n+d.languages,0),missingCount:missing.length,missing,detail,notification};
console.log(JSON.stringify(summary,null,2));
if(process.argv[2]==="prepare"&&structureErrors.length)process.exitCode=1;
if(process.argv[2]==="prepublish"&&!prepublishReady)process.exitCode=1;
if(process.argv[2]==="ready"&&!allReady)process.exitCode=1;
if(process.argv[2]==="notify"&&!notifyReady)process.exitCode=1;
