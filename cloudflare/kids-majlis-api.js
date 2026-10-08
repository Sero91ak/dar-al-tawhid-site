/* DĀR KIDS MAJLIS: protected parent-code pilot API, disabled until secret config. */
import { synthesizeDarVoice, isVoiceConfigured } from "./video-studio/voice.js";
import KIDS_VERIFIED_CONTENT from "../kids/data/verified-content.json";
const P="/kids/api/majlis/", C="dar_kids_majlis_pilot", TTL=1200000, enc=new TextEncoder();
const TOPICS=[
 ["allah",/wer ist allah|wer ist gott|schöpfer|tawh[iī]d|einzigkeit allahs/i,"Allah ist unser Schöpfer. Er ist Einer und niemand ist so wie Er. Das lernen wir in Sūrah al-Ikhlāṣ. Magst du die kurze Sūrah im Qurʾān-Bereich hören?","Qurʾān 112:1–4"],
 ["islam",/was ist islam|bedeutet islam|fünf säulen/i,"Islam bedeutet, dass wir Allah allein anbeten und auf Ihn hören. Dazu gehören zum Beispiel das Gebet, die Zakāh und das Fasten im Ramaḍān. Wir lernen das Schritt für Schritt.","Ṣaḥīḥ Muslim, Ḥadīṯ von Ǧibrīl (Nr. 8)"],
 ["prophet",/wer ist muhammad|wer war muhammad|wer ist der prophet|letzte prophet/i,"Muḥammad ﷺ ist der Gesandte Allahs und der letzte Prophet. Wir lieben und achten ihn und lernen aus seiner Sunnah, wie wir gut handeln.","Qurʾān 33:40"],
 ["prayer",/warum beten|salah|ṣalah|das gebet|wie oft beten|wie viele gebete/i,"Wir beten, um Allah zu dienen und uns an Ihn zu erinnern. Es gibt fünf Pflichtgebete am Tag. In unserem Gebetstrainer kannst du ihre Bewegungen und Worte in Ruhe lernen.","Qurʾān 20:14; Ṣaḥīḥ al-Buḫārī, Nr. 46"],
 ["wudu",/wudu|wuḍū|gebetswaschung|waschen vor dem gebet/i,"Vor dem Gebet machen wir die Gebetswaschung, die Wuḍūʾ heißt. Dazu gehören Gesicht und Arme zu waschen, über den Kopf zu streichen und die Füße zu waschen. Die genauen Schritte kannst du mit deinen Eltern üben.","Qurʾān 5:6"],
 ["dua",/dua|duʿā|bittgebet/i,"Duʿāʾ bedeutet, Allah um etwas Gutes zu bitten. Du darfst Ihn um Hilfe bitten und Ihm danken. In ‚Meine Duʿāʾ‘ kannst du kleine authentische Bittgebete hören und lernen.","Qurʾān 40:60"],
 ["quran",/quran|qurʾan|koran/i,"Der Qurʾān ist Allahs Offenbarung. Er zeigt uns den richtigen Weg. Du kannst mit kurzen Sūren anfangen, sie hören und Wort für Wort mitlernen.","Qurʾān 2:2; 17:9"],
 ["ramadan",/ramadan|ramaḍān|fasten/i,"Im Ramaḍān fasten Muslime, für die das Fasten Pflicht ist. Wir üben Geduld, Dankbarkeit und gute Taten. Für Kinder gelten andere Regeln als für Erwachsene; besprich das mit deinen Eltern.","Qurʾān 2:183"],
 ["parents",/meine eltern|mama|papa|mutter|vater|eltern helfen/i,"Allah lehrt uns, liebevoll und respektvoll mit unseren Eltern umzugehen. Du kannst ihnen mit kleinen Dingen helfen und freundlich mit ihnen sprechen.","Qurʾān 17:23–24"],
 ["honesty",/lügen|wahrheit|ehrlich sein|ehrlichkeit/i,"Die Wahrheit zu sagen ist eine schöne Eigenschaft. Auch wenn du einen Fehler gemacht hast, darfst du ehrlich sein und versuchen, es besser zu machen.","Qurʾān 9:119"],
 ["zakat",/zakat|zakāh|armen helfen|spenden/i,"Zakāh ist eine Pflichtabgabe unter bestimmten Bedingungen. Damit wird auch bedürftigen Menschen geholfen. Kinder können schon heute lernen, großzügig und hilfsbereit zu sein.","Qurʾān 2:43"],
 ["aqidah",/schirk|shirk|ʿaqīdah|aqida|glaubenslehre/i,"ʿAqīdah ist das, was wir über Allah und unseren Glauben lernen. Tawḥīd bedeutet, Allah allein anzubeten. Schwierige Fragen über einzelne Menschen klären wir gemeinsam mit den Eltern.","Qurʾān 112:1–4; 4:36"],
 ["iman",/was ist iman|was ist īmān|sechs säulen des glaubens|sechs glaubenssäulen|glaube an die engel/i,"Īmān bedeutet Glaube. Im Ḥadīṯ von Ǧibrīl lernen wir die sechs Glaubensgrundlagen: Allah, Seine Engel, Seine Bücher, Seine Gesandten, den Jüngsten Tag und die Vorherbestimmung. Wir lernen sie Schritt für Schritt.","Ṣaḥīḥ Muslim, Nr. 8"],
 ["names",/allahs namen|namen allahs|eigenschaften allahs|asm[aā]ʾ|asma wa sifat/i,"Allah hat die schönsten Namen. Wir rufen Ihn mit Seinen schönen Namen an. Allah ist einzigartig; niemand ist so wie Er.","Qurʾān 7:180; 42:11"],
 ["ibadah",/was ist ibadah|was ist ʿibādah|was bedeutet anbetung|was ist anbetung/i,"ʿIbādah heißt, Allah zu dienen. Dazu gehören das Gebet, Duʿāʾ und gute Taten mit aufrichtiger Absicht. Allah hat uns erschaffen, damit wir Ihm dienen.","Qurʾān 51:56; Ṣaḥīḥ al-Buḫārī, Nr. 1"],
 ["adab",/was ist adab|was ist akhlaq|guter charakter|gutes benehmen|freundlich sein|gutes wort/i,"Adab bedeutet gutes Benehmen. Sprich freundlich, halte dein Versprechen und sei hilfsbereit. Ein gutes Wort ist schon eine schöne Tat.","Ṣaḥīḥ al-Buḫārī, Nr. 2989; 6018"],
 ["akhirah",/jüngster tag|jüngste tag|leben nach dem tod|auferstehung|was ist akhirah|āḫirah/i,"Der Jüngste Tag gehört zu unserem Glauben. Allah wird die Menschen auferwecken und gerecht über ihre Taten urteilen. Wir dürfen auf Allahs Barmherzigkeit hoffen und Gutes tun.","Qurʾān 22:7; 99:7–8"],
 ["neighbor",/meine nachbarn|meinen nachbarn|nachbar|nachbarin/i,"Zum guten islamischen Verhalten gehört, freundlich zu unseren Nachbarn zu sein und ihnen nichts Böses zuzufügen.","Ṣaḥīḥ al-Buḫārī, Nr. 6014"],
 ["qibla",/qibla|qiblah|kaaba|kaʿba|wohin beten wir|in welche richtung beten/i,"Wenn wir beten, wenden wir uns in Richtung der Kaʿbah in Makkah. Diese Gebetsrichtung heißt Qiblah. Deine Eltern können dir zeigen, wo sie bei euch liegt.","Qurʾān 2:144"],
 ["niyyah",/niyyah|niyya|gute absicht|warum ist absicht wichtig/i,"Niyyah bedeutet Absicht. Allah weiß, was wir im Herzen vorhaben. Darum ist es schön, eine gute Tat aufrichtig für Allah zu tun.","Ṣaḥīḥ al-Buḫārī, Nr. 1"]

];
// This content is shared with the Kids app and explicitly labelled "verified" by its editors.
// Specific matcher wins over generic words like Duʿāʾ; an age-disallowed match falls back safely.
const VERIFIED_MATCHERS=[
 ["dua-032-rabbi-zidni-ilma",/rabbi zidni|zidn[iī]|du[aʿā]+.*wissen|wissen.*du[aʿā]+|bittgebet.*wissen|mehr wissen/i],
 ["dua-044-rabbana-ghfir-li-wa-li-walidayya",/du[aʿā]+.*eltern|bittgebet.*eltern|du[aʿā]+.*mama|du[aʿā]+.*papa|für meine eltern beten/i],
 ["dua-052-rabbi-anzilni-munzalan-mubarakan",/gesegnet ankommen|du[aʿā]+.*ankomm|bittgebet.*ankomm|du[aʿā]+.*reise/i],
 ["dua-079-rabbi-audhu-bika-min-hamazati-sh-shayatin",/du[aʿā]+.*schutz|bittgebet.*schutz|schutz.*bittgebet|einflüsterungen/i],
 ["dua-059-sayyid-al-istighfar",/sayyid.al.istighfar|großes.*vergebung.*du[aʿā]+|du[aʿā]+.*vergebung/i],
 ["had-0020-truth",/warum.*wahrheit|warum.*nicht lügen|wahrheit sagen|sag die wahrheit/i],
 ["had-0068-good-word",/gutes wort|freundliche worte|freundlich sprechen/i],
 ["had-0012-speech-neighbor",/nachbar.*gut.*sprechen|gutes.*nachbar.*sagen/i],
 ["had-0098-neighbor",/recht.*nachbar|gut.*nachbar|nachbarn helfen|nachbarn nett/i],
 ["aishah-ansar-learning",/sch[aä]m.*fragen|scham.*lernen|traue mich nicht.*fragen/i]
];
const ALL_VERIFIED=[
 ...(KIDS_VERIFIED_CONTENT?.duas||[]),
 ...(KIDS_VERIFIED_CONTENT?.hadithLessons||[]),
 ...(KIDS_VERIFIED_CONTENT?.earlyLessons||[])
].filter(item=>item?.verificationStatus==="verified"&&item.source&&item.id);
const VERIFIED_BY_ID=new Map(ALL_VERIFIED.map(x=>[String(x.id),x]));
function libraryAnswer(item,age){
 if(!item||item.verificationStatus!=="verified"||!item.ages?.includes(age))return null;
 const explanation=String(item.childExplanation||"").trim(),title=String(item.title||"").trim();
 if(!title||!explanation||!item.source)return null;
 const hasArabic=typeof item.arabic==="string"&&item.arabic.length>0&&item.arabic.length<115;
 const intro=hasArabic?
   ("In „Meine Duʿāʾ“ kannst du „"+title+"“ lernen. "+explanation+" Das arabische Duʿāʾ lautet: "+item.arabic):
   ("Unsere geprüfte Lektion „"+title+"“ erklärt es so: "+explanation+" Du findest sie auch in der Kinder-App.");
 return {id:"library:"+item.id,text:intro,source:String(item.source)};
}
function matchedLibrary(text,age){
 for(const [id,re] of VERIFIED_MATCHERS)if(re.test(text)){
   const item=VERIFIED_BY_ID.get(id);
   return libraryAnswer(item,age)||{id:"age_restricted",text:"Dieses Thema erklären wir für deine Altersstufe lieber gemeinsam mit deinen Eltern. Du kannst sie bitten, den passenden Lernbereich zu öffnen.",source:null};
 }
 return null;
}
const BASIC={unknown:"Das ist eine interessante Frage! Dafür habe ich hier noch keine ausreichend geprüfte Kinderantwort. Frag bitte deine Eltern. Gemeinsam könnt ihr in den Wissensbereichen unserer App nachschauen.",
privacy:"Persönliche Daten gehören nicht in einen Chat. Sprich darüber mit deinen Eltern, ja?",
help:"Das klingt wichtig. Bitte sprich jetzt mit einem Erwachsenen, dem du vertraust. Wenn du gerade in Gefahr bist, hol sofort Hilfe. Du musst damit nicht allein bleiben.",
restricted:"Das ist eine schwierige Frage. Für eine sichere Antwort sprich bitte mit deinen Eltern oder einer vertrauenswürdigen erwachsenen Fachperson."};
const json=(x,status=200,headers={})=>new Response(JSON.stringify(x),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer",...headers}});
function configured(env){return env.KIDS_MAJLIS_PARENT_AUTH_ENABLED==="true"&&String(env.KIDS_MAJLIS_PARENT_PASSCODE||"").length>=24&&String(env.KIDS_MAJLIS_SIGNING_KEY||"").length>=32&&!!env.KIDS_MAJLIS_LIMITER?.limit&&!!env.KIDS_MAJLIS_VOICE_LIMITER?.limit}
function validOrigin(req){const origin=req.headers.get("Origin")||"";const sameSite=req.headers.get("Sec-Fetch-Site")||"";return req.headers.get("X-DAR-Majlis-Original-Host")==="dar-al-tawhid.de"&&sameSite!=="cross-site"&&(origin==="https://dar-al-tawhid.de"||(req.method==="GET"&&!origin&&sameSite==="same-origin"))}
const b64=s=>{let out="";for(const v of enc.encode(s))out+=String.fromCharCode(v);return btoa(out).replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_")};
const un64=s=>{s=s.replace(/-/g,"+").replace(/_/g,"/");const raw=atob(s.padEnd(Math.ceil(s.length/4)*4,"="));return new TextDecoder().decode(Uint8Array.from(raw,c=>c.charCodeAt(0)))};
async function key(env){return crypto.subtle.importKey("raw",enc.encode(env.KIDS_MAJLIS_SIGNING_KEY),{name:"HMAC",hash:"SHA-256"},false,["sign","verify"])}
async function sign(data,env){const body=b64(JSON.stringify(data));const raw=new Uint8Array(await crypto.subtle.sign("HMAC",await key(env),enc.encode(body)));return body+"."+btoa(String.fromCharCode(...raw)).replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_")}
async function verify(token,env,kind){try{const parts=String(token||"").split(".");if(parts.length!==2||parts[0].length>2000)return null;const raw=atob(parts[1].replace(/-/g,"+").replace(/_/g,"/").padEnd(Math.ceil(parts[1].length/4)*4,"="));const ok=await crypto.subtle.verify("HMAC",await key(env),Uint8Array.from(raw,c=>c.charCodeAt(0)),enc.encode(parts[0]));if(!ok)return null;const data=JSON.parse(un64(parts[0]));return data.kind===kind&&data.exp>Date.now()&&data.exp<Date.now()+TTL+1000?data:null}catch(_){return null}}
function cookie(value,age){return C+"="+(value||"")+"; HttpOnly; Secure; SameSite=Strict; Path="+P+"; Max-Age="+age}
async function session(req,env){const raw=req.headers.get("Cookie")||"";const pair=raw.split(";").map(s=>s.trim()).find(x=>x.startsWith(C+"="));return verify(pair?pair.slice(C.length+1):"",env,"session")}
async function body(req,max=1600){if(!(req.headers.get("Content-Type")||"").startsWith("application/json"))return null;const txt=await req.text();if(txt.length>max)return null;try{return JSON.parse(txt)}catch(_){return null}}
async function throttle(req,env,voice=false){const ip=req.headers.get("CF-Connecting-IP")||"unknown",limiter=voice?env.KIDS_MAJLIS_VOICE_LIMITER:env.KIDS_MAJLIS_LIMITER;const result=await limiter.limit({key:(voice?"voice-":"core-")+ip.slice(0,64)});return result?.success===true}
function clean(s){const t=String(s||"").normalize("NFKC").replace(/[\u0000-\u001f\u007f]/g," ").trim();return t.length<=350?t:""}
function choose(q,age){
 const text=clean(q);
 if(/angst vor|tut mir weh|schlägt mich|will sterben|verletze mich|missbrauch|suizid|selbst verletzen|habe angst|bin in gefahr/i.test(text))return {id:"help",text:BASIC.help,source:null};
 if(/adresse|telefonnummer|passwort|mein name ist|ich wohne|schick.*foto|(?:\+?\d[\d\s()-]{8,})/i.test(text))return {id:"privacy",text:BASIC.privacy,source:null};
 if(/takf[iī]r|k[aā]fir|ungläubig|jihad|dschihad|gewalt|anschlag|bombe|waffe|fatw[aā]|scheidung|sex/i.test(text))return {id:"restricted",text:BASIC.restricted,source:null};
 const library=matchedLibrary(text,age);if(library)return library;
 for(const row of TOPICS)if(row[1].test(text))return {id:row[0],text:age==="4–5"?row[2].split(/(?<=[.!?])\s+/u).slice(0,2).join(" "):row[2],source:row[3]};
 return {id:"unknown",text:BASIC.unknown,source:null};
}
function capabilities(env){return {transcribe:env.KIDS_MAJLIS_STT_ENABLED==="true"&&!!env.AI?.run,voice:env.KIDS_MAJLIS_TTS_ENABLED==="true"&&!!String(env.ELEVENLABS_VOICE_ID||"").trim()&&String(env.ELEVENLABS_MODEL_ID||"")==="eleven_v4"&&!!String(env.ELEVENLABS_PRONUNCIATION_DICTIONARY_ID||"").trim()&&isVoiceConfigured(env)}}
async function handleSession(req,env){
 if(req.method==="GET"){const s=await session(req,env);return json({ok:true,mode:"parent_code_pilot",authorized:!!s,expiresAt:s?.exp||null,capabilities:capabilities(env)})}
 if(req.method==="DELETE")return json({ok:true,authorized:false},200,{"Set-Cookie":cookie("",0)});
 if(req.method!=="POST")return json({ok:false,error:"method_not_allowed"},405);
 const supplied=String((await body(req,256))?.code||"");if(supplied.length<24||supplied.length>256)return json({ok:false,error:"invalid_parent_code"},403);
 const bytes=await Promise.all([crypto.subtle.digest("SHA-256",enc.encode(supplied)),crypto.subtle.digest("SHA-256",enc.encode(env.KIDS_MAJLIS_PARENT_PASSCODE))]);const a=new Uint8Array(bytes[0]),b=new Uint8Array(bytes[1]);let difference=0;for(let i=0;i<a.length;i++)difference|=a[i]^b[i];
 if(difference)return json({ok:false,error:"invalid_parent_code"},403);
 const exp=Date.now()+TTL,token=await sign({kind:"session",nonce:crypto.randomUUID(),exp},env);
 return json({ok:true,authorized:true,expiresAt:exp,mode:"parent_code_pilot",capabilities:capabilities(env)},200,{"Set-Cookie":cookie(token,1200)});
}
async function handleAnswer(req,env,user){
 if(req.method!=="POST")return json({ok:false,error:"method_not_allowed"},405);
 const input=await body(req),q=clean(input?.question);
 if(!q)return json({ok:false,error:"invalid_question"},400);
 const age=["4–5","6–8","9–10"].includes(input?.age)?input.age:"6–8";
 const answer=choose(q,age);
 const answerId=await sign({kind:"answer",id:answer.id,age,nonce:user.nonce,exp:Math.min(Date.now()+480000,user.exp)},env);
 return json({ok:true,answer:answer.text,source:answer.source,answerId,verified:!!answer.source,mode:"curated_only"});
}
function validAudio(bytes,mime){return (mime.includes("webm")&&bytes[0]===0x1a&&bytes[1]===0x45&&bytes[2]===0xdf&&bytes[3]===0xa3)||(mime.includes("mp4")&&bytes[4]===0x66&&bytes[5]===0x74&&bytes[6]===0x79&&bytes[7]===0x70)||(mime.includes("ogg")&&bytes[0]===79&&bytes[1]===103&&bytes[2]===103&&bytes[3]===83)}
function encodeAudio(bytes){let s="";for(let i=0;i<bytes.length;i+=8192)s+=String.fromCharCode(...bytes.slice(i,i+8192));return btoa(s)}
async function handleSTT(req,env){
 if(req.method!=="POST")return json({ok:false,error:"method_not_allowed"},405);
 if(env.KIDS_MAJLIS_STT_ENABLED!=="true"||!env.AI?.run)return json({ok:false,error:"transcription_not_enabled"},503);
 if(!(req.headers.get("Content-Type")||"").toLowerCase().startsWith("multipart/form-data"))return json({ok:false,error:"wrong_content_type"},415);
 if(Number(req.headers.get("Content-Length")||0)>950000)return json({ok:false,error:"recording_too_large"},413);
 let form;try{form=await req.formData()}catch(_){return json({ok:false,error:"invalid_recording"},400)}
 const file=form.get("audio");if(!file||!file.arrayBuffer||file.size<1000||file.size>900000)return json({ok:false,error:"invalid_audio_size"},413);
 const bytes=new Uint8Array(await file.arrayBuffer());if(!validAudio(bytes,String(file.type||"").toLowerCase()))return json({ok:false,error:"audio_format_unsupported"},415);
 try{
   const result=await env.AI.run("@cf/openai/whisper-large-v3-turbo",{audio:encodeAudio(bytes),task:"transcribe",vad_filter:true});
   const text=clean(result?.text);if(!text)return json({ok:false,error:"transcription_unclear"},422);
   return json({ok:true,text,needsConfirmation:true});
 }catch(_){return json({ok:false,error:"transcription_failed"},502)}
}
async function handleSpeech(req,env,user){
 if(req.method!=="POST")return json({ok:false,error:"method_not_allowed"},405);
 if(env.KIDS_MAJLIS_TTS_ENABLED!=="true"||!String(env.ELEVENLABS_VOICE_ID||"").trim()||String(env.ELEVENLABS_MODEL_ID||"")!=="eleven_v4"||!String(env.ELEVENLABS_PRONUNCIATION_DICTIONARY_ID||"").trim()||!isVoiceConfigured(env))return json({ok:false,error:"owner_voice_not_enabled"},503);
 if(!(await throttle(req,env,true)))return json({ok:false,error:"voice_rate_limited"},429);
 const payload=await body(req,3000),reference=await verify(payload?.answerId,env,"answer");
 if(!reference||reference.nonce!==user.nonce||!["4–5","6–8","9–10"].includes(reference.age))return json({ok:false,error:"invalid_answer_reference"},403);
 const topic=TOPICS.find(x=>x[0]===reference.id);
 const libraryItem=reference.id.startsWith("library:")?VERIFIED_BY_ID.get(reference.id.slice(8)):null;
 const resolvedLibrary=libraryAnswer(libraryItem,reference.age);
 if(!topic&&!resolvedLibrary)return json({ok:false,error:"unapproved_answer"},403);
 const text=resolvedLibrary?.text||(reference.age==="4–5"?topic[2].split(/(?<=[.!?])\s+/u).slice(0,2).join(" "):topic[2]);
 try{
   const response=await synthesizeDarVoice(env,text,{profile:"kids_lesson",timestamps:false});
   if(!response.ok||!response.bytes)return json({ok:false,error:"voice_generation_failed"},502);
   return new Response(response.bytes,{status:200,headers:{"Content-Type":"audio/mpeg","Cache-Control":"no-store, private","X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer"}});
 }catch(_){return json({ok:false,error:"voice_generation_failed"},502)}
}
export async function handleKidsMajlisApi(req,env){
 const url=new URL(req.url),path=url.pathname;
 if(!path.startsWith(P))return null;
 if(!validOrigin(req))return json({ok:false,error:"origin_not_allowed"},403);
 if(!configured(env))return json({ok:false,error:"majlis_parent_backend_not_configured"},503);
 if(!(await throttle(req,env)))return json({ok:false,error:"rate_limited"},429);
 const endpoint=path.slice(P.length);
 if(endpoint==="session")return handleSession(req,env);
 const user=await session(req,env);
 if(!user)return json({ok:false,error:"parent_session_required"},401);
 if(endpoint==="answer")return handleAnswer(req,env,user);
 if(endpoint==="transcribe")return handleSTT(req,env);
 if(endpoint==="speak")return handleSpeech(req,env,user);
 return json({ok:false,error:"not_found"},404);
}
export const kidsMajlisTesting={choose,clean,validAudio,configured};