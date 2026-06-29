/* TaxiPro Serienfahrten-System – Vollversion */
(function(){
'use strict';

const WD_MAP={mo:1,di:2,mi:3,do:4,fr:5,sa:6,so:0};
const WD_LABELS=['So','Mo','Di','Mi','Do','Fr','Sa'];
const MONTH_NAMES=['januar','februar','märz','april','mai','juni','juli','august','september','oktober','november','dezember'];
const SERIE_TYPES=[
  {id:'dialyse',label:'💧 Dialyse'},{id:'chemo',label:'🏥 Chemo'},{id:'strahlen',label:'☢️ Strahlentherapie'},
  {id:'reha',label:'💪 Reha'},{id:'tagespflege',label:'🏠 Tagespflege'},{id:'schueler',label:'🎒 Schülerfahrt'},
  {id:'rechn_serie',label:'🟡 Regelm. Rechnungsfahrt'},{id:'sonstige',label:'🔄 Sonstige Dauerfahrt'}
];
const KTS_RIDE_KINDS=[
  {id:'dialyse',label:'Dialyse'},{id:'chemo',label:'Chemo'},{id:'strahlen',label:'Strahlentherapie'},
  {id:'reha',label:'Reha'},{id:'arzt',label:'Arzt'},{id:'krankenhaus',label:'Krankenhaus'},{id:'sonstige',label:'Sonstige Krankenfahrt'}
];
const CHECK_STATUS={
  draft:'Entwurf',preview:'Wartet auf Prüfung',checked:'Geprüft',approved:'Freigegeben',exported:'Exportiert',done:'Abgeschlossen'
};
const TRIP_STATUS={
  geplant:'Geplant',gefahren:'Gefahren',nicht_gefahren:'Nicht gefahren',nur_hin:'Nur Hinfahrt',
  nur_rueck:'Nur Rückfahrt',storniert:'Storniert',geprueft:'Geprüft'
};
const KTS_TEMPLATE_FIELDS=['Kunde','Monat','Datum','Hinfahrt','Rückfahrt','Strecke','Kilometer','Gesamtkilometer','Unterschrift','Bemerkung'];
const RE_TEMPLATE_FIELDS=['Kunde','Rechnungsempfänger','Monat','Datum','Hinfahrt','Rückfahrt','Strecke','Preis','Gesamtbetrag','Unterschrift','Bemerkung'];

let recurringOrders=[],seriesPreviews=[],monthlySummaries=[],auditLogs=[],templates=[];
let ssSelectedWd=new Set([1,3,5]),ssPreviewId=null,ssMonthDetailId=null;

function ssLoad(){
  try{recurringOrders=JSON.parse(localStorage.getItem('tp_ro')||'[]');}catch(e){recurringOrders=[];}
  try{seriesPreviews=JSON.parse(localStorage.getItem('tp_sp')||'[]');}catch(e){seriesPreviews=[];}
  try{monthlySummaries=JSON.parse(localStorage.getItem('tp_ms')||'[]');}catch(e){monthlySummaries=[];}
  try{auditLogs=JSON.parse(localStorage.getItem('tp_audit')||'[]');}catch(e){auditLogs=[];}
  try{templates=JSON.parse(localStorage.getItem('tp_tpl')||'[]');}catch(e){templates=[];}
  if(!templates.length){
    templates=[
      {id:'tpl_kts',templateType:'kts',name:'Krankenfahrten-Unterschriftszettel',fields:KTS_TEMPLATE_FIELDS},
      {id:'tpl_re',templateType:'rechn',name:'Rechnungsfahrten-Unterschriftszettel',fields:RE_TEMPLATE_FIELDS}
    ];
    localStorage.setItem('tp_tpl',JSON.stringify(templates));
  }
}
function ssSave(){
  localStorage.setItem('tp_ro',JSON.stringify(recurringOrders));
  localStorage.setItem('tp_sp',JSON.stringify(seriesPreviews));
  localStorage.setItem('tp_ms',JSON.stringify(monthlySummaries));
  localStorage.setItem('tp_audit',JSON.stringify(auditLogs.slice(-500)));
  localStorage.setItem('tp_tpl',JSON.stringify(templates));
  if(typeof save==='function') save();
}
function ssAudit(action,entityType,entityId,detail){
  auditLogs.push({id:Date.now()+Math.random().toString(36).slice(2),action,entityType,entityId,detail,createdAt:Date.now(),user:'Büro'});
  ssSave();
}
function ssCustName(c){return c?`${c.lname||''} ${c.fname||''}`.trim():'–';}
function ssCustAddr(c){return c?[c.street,c.plz,c.city].filter(Boolean).join(', '):'';}
function ssOrderType(c,orderType){
  if(orderType) return orderType;
  if(!c) return 'sonstige';
  if(c.type==='re'||c.excelType==='rechn') return 'rechn';
  if(c.type==='kts'||c.excelType==='kts') return 'kts';
  return 'sonstige';
}
function ssIsKts(t){return t==='kts'||t==='krank';}
function ssIsRe(t){return t==='rechn'||t==='re';}
function ssFmtDate(iso){
  if(!iso) return '–';
  const p=iso.split('-');if(p.length<3) return iso;
  return `${p[2]}.${p[1]}.${p[0]}`;
}
function ssMonthKey(startDate){return(startDate||'').slice(0,7);}
function ssParseWeekdays(text){
  const t=String(text||'').toLowerCase().replace(/\./g,'').replace(/\s+/g,'');
  const set=new Set();
  if(/mo-fr|montag-freitag|werktag|täglich|taeglich|daily/.test(t)) [1,2,3,4,5].forEach(d=>set.add(d));
  else Object.entries(WD_MAP).forEach(([k,v])=>{if(new RegExp('\\b'+k+'\\b|'+k+'[^a-z]').test(t)||t.includes(k)) set.add(v);});
  return [...set].sort((a,b)=>a-b);
}
function ssParseMonthYear(text,refYear){
  const t=String(text||'').toLowerCase();
  const y=(t.match(/20\d{2}/)||[])[0]||String(refYear||new Date().getFullYear());
  let m=MONTH_NAMES.findIndex(n=>t.includes(n));
  if(m<0){const mm=(t.match(/(?:im\s|\/|\.)?(0?[1-9]|1[0-2])(?:\.|\/)?(20\d{2})?/)||[])[1];if(mm) m=parseInt(mm,10)-1;}
  if(m<0) m=new Date().getMonth();
  return{year:parseInt(y,10),month:m};
}
function ssDatesInRange(startDate,endDate,weekdays){
  const out=[],start=new Date(startDate+'T12:00:00'),end=new Date(endDate+'T12:00:00');
  if(isNaN(start)||isNaN(end)||start>end) return out;
  const wdSet=new Set(weekdays);
  for(let d=new Date(start);d<=end;d.setDate(d.getDate()+1)){
    if(!wdSet.size||wdSet.has(d.getDay())){
      const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');
      out.push(`${y}-${m}-${day}`);
    }
  }
  return out;
}
function ssMonthBounds(year,month){
  const y=parseInt(year,10),m=parseInt(month,10),last=new Date(y,m+1,0).getDate();
  return{start:`${y}-${String(m+1).padStart(2,'0')}-01`,end:`${y}-${String(m+1).padStart(2,'0')}-${String(last).padStart(2,'0')}`};
}
function ssCalcStats(dates,hasOut,hasRet,kmOne,priceOne){
  const days=dates.length,legsPerDay=(hasOut?1:0)+(hasRet?1:0),singleTrips=days*legsPerDay;
  const km=parseFloat(kmOne)||0,price=parseFloat(priceOne)||0;
  return{totalDays:days,totalSingleTrips:singleTrips,totalKm:singleTrips*km,totalPrice:singleTrips*price,legsPerDay};
}
function ssValidateOrder(o,cust){
  const issues=[];
  if(!o.customerId) issues.push('Kein Kunde gewählt');
  if(!o.pickupAddress&&!ssCustAddr(cust)) issues.push('Abholadresse fehlt');
  if(!o.destinationAddress&&!cust?.excelDest&&!cust?.stammHosp) issues.push('Zieladresse fehlt');
  if(!o.startDate||!o.endDate) issues.push('Zeitraum unvollständig');
  if(!o.weekdays?.length&&!o.customDates?.length) issues.push('Keine Wochentage/Tage gewählt');
  if(!o.hasOutbound&&!o.hasReturn) issues.push('Hin- oder Rückfahrt wählen');
  if(ssIsKts(o.orderType)&&!parseFloat(o.kmOneWay||cust?.excelKm)) issues.push('Kilometer fehlen (KTS)');
  if(ssIsRe(o.orderType)&&!parseFloat(o.priceOneWay||cust?.excelPrice)) issues.push('Preis fehlt (RE)');
  if(ssIsKts(o.orderType)&&cust&&!cust.ktsPresent) issues.push('Hinweis: KTS nicht als vorhanden markiert');
  return issues;
}
function ssBuildPreviewTrips(order,cust,dates){
  const km=parseFloat(order.kmOneWay||cust?.excelKm)||0;
  const price=parseFloat(order.priceOneWay||cust?.excelPrice)||0;
  const type=ssIsRe(order.orderType)?'rechn':ssIsKts(order.orderType)?'krank':'normal';
  const from=order.pickupAddress||ssCustAddr(cust);
  const to=order.destinationAddress||cust?.excelDest||cust?.stammHosp||'';
  return dates.map(date=>{
    const wd=new Date(date+'T12:00:00').getDay(),flags=[];
    if(!from||!to) flags.push('Strecke unvollständig');
    if(ssIsKts(order.orderType)&&!km) flags.push('Km fehlt');
    if(ssIsRe(order.orderType)&&!price) flags.push('Preis fehlt');
    return{
      id:(typeof uid==='function'?uid():Date.now()+Math.random().toString(36).slice(2)),
      recurringOrderId:order.id,customerId:order.customerId,month:date.slice(0,7),date,
      weekday:WD_LABELS[wd],outbound:!!order.hasOutbound,returnTrip:!!order.hasReturn,
      outboundTime:order.outboundTime||'08:00',returnTime:order.returnTime||'14:00',
      kmOneWay:km,priceOneWay:price,from,to,type,status:'geplant',checked:false,flags
    };
  });
}
function ssGeneratePreview(orderId){
  const order=recurringOrders.find(o=>o.id===orderId);if(!order) return null;
  const cust=(typeof customers!=='undefined'?customers:[]).find(c=>c.id===order.customerId);
  const issues=ssValidateOrder(order,cust);
  const dates=order.customDates?.length?order.customDates.slice().sort():ssDatesInRange(order.startDate,order.endDate,order.weekdays||[]);
  const stats=ssCalcStats(dates,order.hasOutbound,order.hasReturn,order.kmOneWay||cust?.excelKm,order.priceOneWay||cust?.excelPrice);
  const preview={
    id:(typeof uid==='function'?uid():'sp'+Date.now()),recurringOrderId:order.id,customerId:order.customerId,
    month:ssMonthKey(order.startDate),orderType:order.orderType,status:'preview',issues,stats,
    trips:ssBuildPreviewTrips(order,cust,dates),createdAt:Date.now()
  };
  seriesPreviews=seriesPreviews.filter(p=>p.recurringOrderId!==order.id||p.status!=='preview');
  seriesPreviews.push(preview);order.status='preview';order.updatedAt=Date.now();
  ssSave();ssPreviewId=preview.id;ssAudit('preview_created','series_preview',preview.id,ssCustName(cust));
  return preview;
}
function ssApprovePreview(previewId){
  const preview=seriesPreviews.find(p=>p.id===previewId);if(!preview) return false;
  const order=recurringOrders.find(o=>o.id===preview.recurringOrderId);
  const cust=(typeof customers!=='undefined'?customers:[]).find(c=>c.id===preview.customerId);
  if(!order||!cust||typeof rides==='undefined') return false;
  if(preview.issues?.length&&!confirm('Es gibt offene Hinweise. Trotzdem freigeben?')) return false;
  const groupId=(typeof uid==='function'?uid():'sg'+Date.now());
  preview.trips.forEach(t=>{
    const legs=[];if(t.outbound) legs.push({dir:'hin',time:t.outboundTime});
    if(t.returnTrip) legs.push({dir:'rueck',time:t.returnTime});
    if(!legs.length) legs.push({dir:'hin-rueck',time:t.outboundTime});
    legs.forEach(leg=>{
      rides.push({
        id:(typeof uid==='function'?uid():Date.now()+Math.random().toString(36).slice(2)),
        type:t.type,customerId:t.customerId,date:t.date,time:leg.time,from:t.from,to:t.to,
        km:t.kmOneWay||'',amount:ssIsRe(t.type)?t.priceOneWay:'',betrag:ssIsRe(t.type)?t.priceOneWay:'',
        verordnung:cust.approvalPresent?'ja':'',zuzahlung:t.type==='krank'?(typeof normalizeZuzahlung==='function'?normalizeZuzahlung(cust.zuzahlungStatus||'NB'):'NB'):'',
        note:order.notes||'',serie:true,serieType:order.serieType||'sonstige',serieGroupId:groupId,
        recurringOrderId:order.id,tripStatus:'geplant',reviewStatus:'pending',
        excelDir:leg.dir==='hin'?'hin':leg.dir==='rueck'?'rueck':'hin-rueck',source:'series',localUpdated:Date.now()
      });
    });
  });
  let summary=monthlySummaries.find(s=>s.customerId===preview.customerId&&s.month===preview.month&&s.orderType===preview.orderType);
  const summaryData={
    totalDays:preview.stats.totalDays,totalSingleTrips:preview.stats.totalSingleTrips,
    totalKm:preview.stats.totalKm,totalPrice:preview.stats.totalPrice,
    checkStatus:'approved',exportStatus:'open',updatedAt:Date.now()
  };
  if(!summary){
    monthlySummaries.push({id:(typeof uid==='function'?uid():'ms'+Date.now()),customerId:preview.customerId,month:preview.month,orderType:preview.orderType,recurringOrderId:order.id,createdAt:Date.now(),...summaryData});
  }else Object.assign(summary,summaryData);
  preview.status='approved';order.status='active';order.updatedAt=Date.now();
  ssSave();ssAudit('series_approved','series_preview',previewId,`${preview.stats.totalDays} Tage`);
  if(typeof updateCounts==='function') updateCounts();
  if(typeof renderCalendar==='function') renderCalendar();
  if(typeof renderToday==='function') renderToday();
  if(typeof renderReviewView==='function') renderReviewView();
  if(typeof toast==='function') toast(`${preview.stats.totalDays} Fahrtage freigegeben – Prüfliste prüfen`,'ok');
  ssSwitchView('review');return true;
}
function ssRejectPreview(previewId){
  seriesPreviews=seriesPreviews.filter(p=>p.id!==previewId);ssSave();
  if(typeof toast==='function') toast('Vorschau verworfen','warn');
}
function ssRecalcSummary(summaryId){
  const s=monthlySummaries.find(x=>x.id===summaryId);if(!s) return;
  const trips=(typeof rides!=='undefined'?rides:[]).filter(r=>r.customerId===s.customerId&&r.date?.startsWith(s.month)&&r.tripStatus!=='storniert');
  const days=new Set(trips.map(t=>t.date)).size;
  const cust=(typeof customers!=='undefined'?customers:[]).find(c=>c.id===s.customerId);
  const km=parseFloat(cust?.excelKm||0),price=parseFloat(cust?.excelPrice||0);
  s.totalDays=days;s.totalSingleTrips=trips.length;
  s.totalKm=ssIsKts(s.orderType)?trips.reduce((a,t)=>a+(parseFloat(t.km)||km),0):0;
  s.totalPrice=ssIsRe(s.orderType)?trips.reduce((a,t)=>a+(parseFloat(t.amount||t.betrag)||price),0):0;
  s.updatedAt=Date.now();ssSave();
}
function ssSetSummaryStatus(id,status){
  const s=monthlySummaries.find(x=>x.id===id);if(!s) return;
  s.checkStatus=status;if(status==='exported') s.exportStatus='done';
  if(status==='done') s.exportStatus='done';
  s.updatedAt=Date.now();ssSave();ssAudit('status_change','monthly_summary',id,status);
  if(typeof toast==='function') toast('Status: '+CHECK_STATUS[status],'ok');
  ssOpenMonthDetail(id);
}
function ssSetRideTripStatus(rideId,status){
  const r=(typeof rides!=='undefined'?rides:[]).find(x=>x.id===rideId);if(!r) return;
  r.tripStatus=status;r.localUpdated=Date.now();
  if(status==='storniert') r.reviewStatus='rejected';
  if(status==='geprueft') r.reviewStatus='approved';
  ssSave();ssRecalcSummary(ssMonthDetailId);
  ssOpenMonthDetail(ssMonthDetailId);
}
function ssDeleteRide(rideId){
  if(!confirm('Fahrt wirklich löschen?')) return;
  if(typeof rides!=='undefined') rides=rides.filter(r=>r.id!==rideId);
  ssSave();ssRecalcSummary(ssMonthDetailId);ssOpenMonthDetail(ssMonthDetailId);
}
function ssParseListImport(text){
  const blocks=String(text||'').split(/\n\s*\n|\n(?=Kunde\s*[:\-]?)/i).map(b=>b.trim()).filter(Boolean);
  return blocks.map(block=>{
    const lines=block.split('\n').map(l=>l.trim()).filter(Boolean);
    const nameLine=lines.find(l=>/^kunde\s*[:\-]/i.test(l))||lines[0]||'';
    const name=nameLine.replace(/^kunde\s*[:\-]\s*[a-z]?\s*/i,'').split(',')[0].trim();
    const addrMatch=block.match(/([^,\n]+,\s*\d{4,5}\s+[^,\n]+)/);
    const destLine=lines.find(l=>/^ziel\s*[:\-]/i.test(l));
    const dest=destLine?destLine.replace(/^ziel\s*[:\-]\s*/i,'').trim():'';
    const lower=block.toLowerCase();
    const orderType=/rechnungsfahrt|\bre\b|rechnung/.test(lower)?'rechn':/krankenfahrt|kts|dialyse|chemo|strahlen/.test(lower)?'kts':'sonstige';
    const hasRet=/hin\s*(und|\+|&)?\s*rück|hin\s*und\s*rück|↔|beide|rückfahrt/.test(lower);
    const kmMatch=block.match(/(\d+(?:[.,]\d+)?)\s*km/i);
    const priceMatch=block.match(/(\d+(?:[.,]\d+)?)\s*€/);
    const weekdays=ssParseWeekdays(lines.find(l=>/(mo|di|mi|do|fr|sa|so)/i.test(l))||block);
    const bounds=ssMonthBounds(ssParseMonthYear(block).year,ssParseMonthYear(block).month);
    const issues=[];if(!name) issues.push('Name fehlt');if(!dest) issues.push('Ziel fehlt');
    if(orderType==='kts'&&!kmMatch) issues.push('Kilometer fehlt');
    if(orderType==='rechn'&&!priceMatch) issues.push('Preis fehlt');
    if(!weekdays.length) issues.push('Wochentage unklar');
    return{id:(typeof uid==='function'?uid():'imp'+Date.now()+Math.random()),parsed:{
      customerName:name,pickupAddress:addrMatch?addrMatch[1]:'',destinationAddress:dest,orderType,
      startDate:bounds.start,endDate:bounds.end,weekdays,hasOutbound:true,hasReturn:hasRet,
      kmOneWay:kmMatch?kmMatch[1].replace(',','.'):'',priceOneWay:priceMatch?priceMatch[1].replace(',','.'):'',
      notes:block.slice(0,200)},issues,raw:block};
  });
}
function ssFindCustomerByName(name){
  const q=String(name||'').toLowerCase().trim();
  return (typeof customers!=='undefined'?customers:[]).find(c=>{
    const full=`${c.fname||''} ${c.lname||''}`.toLowerCase(),rev=`${c.lname||''} ${c.fname||''}`.toLowerCase();
    return full.includes(q)||rev.includes(q)||q.includes(full.trim());
  });
}
function ssCreateOrderFromImport(item){
  let cust=ssFindCustomerByName(item.parsed.customerName);
  if(!cust){
    const parts=item.parsed.customerName.split(/\s+/);
    cust={id:(typeof uid==='function'?uid():'c'+Date.now()),fname:parts.slice(1).join(' ')||parts[0],lname:parts.length>1?parts[0]:'',
      street:item.parsed.pickupAddress.split(',')[0]?.trim()||'',plz:'',city:'',
      type:item.parsed.orderType==='rechn'?'re':'kts',excelKm:item.parsed.kmOneWay,excelPrice:item.parsed.priceOneWay,
      excelDest:item.parsed.destinationAddress,stammHosp:item.parsed.destinationAddress,zuzahlungStatus:'NB',source:'import'};
    if(typeof customers!=='undefined'){customers.push(cust);if(typeof save==='function') save();}
  }
  const order={id:(typeof uid==='function'?uid():'ro'+Date.now()),customerId:cust.id,orderType:item.parsed.orderType,
    serieType:item.parsed.orderType==='kts'?'dialyse':'rechn_serie',startDate:item.parsed.startDate,endDate:item.parsed.endDate,
    weekdays:item.parsed.weekdays,customDates:[],hasOutbound:true,hasReturn:item.parsed.hasReturn,
    outboundTime:'08:00',returnTime:'14:00',pickupAddress:item.parsed.pickupAddress||ssCustAddr(cust),
    destinationAddress:item.parsed.destinationAddress,kmOneWay:item.parsed.kmOneWay||cust.excelKm||'',
    priceOneWay:item.parsed.priceOneWay||cust.excelPrice||'',status:'draft',notes:item.parsed.notes||'',
    createdAt:Date.now(),updatedAt:Date.now()};
  recurringOrders.push(order);ssSave();
  return ssGeneratePreview(order.id);
}
function ssDashboardWarnings(){
  const w=[];
  (typeof customers!=='undefined'?customers:[]).forEach(c=>{
    if(!ssCustAddr(c)) w.push({level:'err',text:`${ssCustName(c)}: Adresse fehlt`,action:()=>{if(typeof openCustDetail==='function') openCustDetail(c.id);}});
    if((c.type==='kts'||!c.type)&&!c.excelKm&&c.type!=='re') w.push({level:'warn',text:`${ssCustName(c)}: Kilometer fehlt`,action:()=>{if(typeof openCustDetail==='function') openCustDetail(c.id);}});
    if(c.type==='re'&&!c.excelPrice) w.push({level:'warn',text:`${ssCustName(c)}: Preis fehlt`,action:()=>{if(typeof openCustDetail==='function') openCustDetail(c.id);}});
    if(!c.stammHosp&&!c.excelDest) w.push({level:'warn',text:`${ssCustName(c)}: Zieladresse fehlt`,action:()=>{if(typeof openCustDetail==='function') openCustDetail(c.id);}});
  });
  seriesPreviews.filter(p=>p.status==='preview').forEach(p=>{
    const c=(typeof customers!=='undefined'?customers:[]).find(x=>x.id===p.customerId);
    w.push({level:'warn',text:`Prüfliste offen: ${ssCustName(c)} · ${p.month}`,action:()=>ssSwitchView('series-preview')});
  });
  monthlySummaries.filter(s=>!['done','exported'].includes(s.checkStatus)).forEach(s=>{
    const c=(typeof customers!=='undefined'?customers:[]).find(x=>x.id===s.customerId);
    w.push({level:'warn',text:`Monatsliste ${s.month}: ${ssCustName(c)}`,action:()=>{ssMonthDetailId=s.id;ssSwitchView('monthly-list');ssOpenMonthDetail(s.id);}});
  });
  return w;
}
function ssSwitchView(v){if(typeof switchView==='function') switchView(v);}
function ssWorkflowHtml(){
  return `<div class="ss-workflow"><span class="on">1 Kunde</span><span class="arr">→</span><span class="on">2 Serie</span><span class="arr">→</span><span class="on">3 Prüfung</span><span class="arr">→</span><span>4 Freigabe</span><span class="arr">→</span><span>5 Monatsliste</span><span class="arr">→</span><span>6 Unterschrift</span></div>`;
}
function ssRenderDashboard(){
  const el=document.getElementById('ss-dashboard-body');if(!el) return;
  const warnings=ssDashboardWarnings(),month=new Date().toISOString().slice(0,7);
  const pendingPreviews=seriesPreviews.filter(p=>p.status==='preview').length;
  const openReview=(typeof rides!=='undefined'?rides.filter(r=>r.reviewStatus==='pending'||!r.reviewStatus).length:0);
  el.innerHTML=`${ssWorkflowHtml()}
    <div class="ss-hero"><h2>📊 Serienfahrten-Zentrale</h2><p>Professionelles System für Krankenfahrten, Rechnungsfahrten, Monatslisten und Unterschriftszettel</p></div>
    <div class="ss-quick"><button class="tb-btn primary" type="button" onclick="ssSwitchView('series-orders')">＋ Serienauftrag</button>
      <button class="tb-btn" type="button" onclick="ssSwitchView('series-import')">📋 Listenimport</button>
      <button class="tb-btn" type="button" onclick="ssSwitchView('series-preview')">🔍 Prüfliste (${pendingPreviews})</button></div>
    <div class="ss-grid">
      <div class="ss-stat warn" onclick="ssSwitchView('series-preview')"><b>${pendingPreviews}</b><span>Offene Vorschauen</span></div>
      <div class="ss-stat" onclick="ssSwitchView('review')"><b>${openReview}</b><span>Fahrten prüfen</span></div>
      <div class="ss-stat kts" onclick="ssSwitchView('kts-module')"><b>${monthlySummaries.filter(s=>s.month===month&&ssIsKts(s.orderType)).length}</b><span>KTS Monat</span></div>
      <div class="ss-stat re" onclick="ssSwitchView('re-module')"><b>${monthlySummaries.filter(s=>s.month===month&&ssIsRe(s.orderType)).length}</b><span>RE Monat</span></div>
      <div class="ss-stat ok" onclick="ssSwitchView('signatures')"><b>${monthlySummaries.filter(s=>s.month===month).length}</b><span>Unterschriften</span></div>
      <div class="ss-stat err"><b>${warnings.filter(x=>x.level==='err').length}</b><span>Fehler</span></div>
    </div>
    <div class="ss-panel"><h3>⚠️ Kontrollliste</h3>${warnings.length?`<div class="ss-warn-list">${warnings.slice(0,15).map((w,i)=>`<div class="ss-warn-item ${w.level==='err'?'err':''}" data-warn="${i}">${w.text}</div>`).join('')}</div>`:'<div class="ss-empty">✅ Keine offenen Punkte</div>'}</div>`;
  el.querySelectorAll('[data-warn]').forEach(node=>{const w=warnings[parseInt(node.dataset.warn,10)];if(w?.action) node.onclick=w.action;});
}
function ssFillOrderFromCustomer(){
  const custId=document.getElementById('ss-o-cust')?.value;
  const cust=(typeof customers!=='undefined'?customers:[]).find(c=>c.id===custId);
  if(!cust) return;
  const km=document.getElementById('ss-o-km');if(km) km.value=cust.excelKm||'';
  const pr=document.getElementById('ss-o-price');if(pr) pr.value=cust.excelPrice||'';
  const out=document.getElementById('ss-o-out');if(out) out.value=cust.defaultReturn!==false?'1':'0';
  const ret=document.getElementById('ss-o-ret');if(ret) ret.value=cust.defaultReturn!==false?'1':'0';
}
function ssRenderSeriesOrders(){
  const el=document.getElementById('ss-series-orders-body');if(!el) return;
  const custOpts=(typeof customers!=='undefined'?customers:[]).map(c=>`<option value="${c.id}">${escAttr(ssCustName(c))} (${c.type==='re'?'RE':'KTS'})</option>`).join('');
  const bounds=ssMonthBounds(new Date().getFullYear(),new Date().getMonth());
  el.innerHTML=`${ssWorkflowHtml()}<div class="ss-toolbar"><h2>🔁 Serienfahrten</h2></div>
    <div class="ss-panel"><h3>Neuer Serienauftrag</h3><div class="ss-form">
      <div class="fr2 fr"><div class="fr"><label>Kunde *</label><select id="ss-o-cust" onchange="ssFillOrderFromCustomer()"><option value="">– wählen –</option>${custOpts}</select></div>
      <div class="fr"><label>Serienart</label><select id="ss-o-serie">${SERIE_TYPES.map(s=>`<option value="${s.id}">${s.label}</option>`).join('')}</select></div></div>
      <div class="fr2 fr"><div class="fr"><label>Von</label><input type="date" id="ss-o-start" value="${bounds.start}"/></div>
      <div class="fr"><label>Bis</label><input type="date" id="ss-o-end" value="${bounds.end}"/></div></div>
      <div class="fr"><label>Wochentage</label><div class="ss-weekdays" id="ss-o-wd">${WD_LABELS.map((l,i)=>`<span class="ss-wd${ssSelectedWd.has(i)?' on':''}" data-wd="${i}" onclick="ssToggleWd(${i})">${l}</span>`).join('')}</div></div>
      <div class="fr2 fr"><div class="fr"><label>Hinfahrt</label><select id="ss-o-out"><option value="1">Ja</option><option value="0">Nein</option></select></div>
      <div class="fr"><label>Rückfahrt</label><select id="ss-o-ret"><option value="1">Ja</option><option value="0">Nein</option></select></div></div>
      <div class="fr2 fr"><div class="fr"><label>Uhrzeit Hin</label><input type="time" id="ss-o-tout" value="08:00"/></div>
      <div class="fr"><label>Uhrzeit Rück</label><input type="time" id="ss-o-tret" value="14:00"/></div></div>
      <div class="fr2 fr"><div class="fr"><label>Km einfach (KTS)</label><input type="number" id="ss-o-km" step="0.1" placeholder="28"/></div>
      <div class="fr"><label>Preis € (RE)</label><input type="number" id="ss-o-price" step="0.01" placeholder="22"/></div></div>
      <div class="fr"><label>Bemerkung</label><input type="text" id="ss-o-note"/></div>
      <div class="ss-actions"><button class="tb-btn primary" type="button" onclick="ssSubmitOrder()">🔍 Vorschau erzeugen (Prüfliste)</button></div>
    </div></div>
    <div class="ss-panel"><h3>Aktive Serienaufträge</h3><div id="ss-order-list">${ssRenderOrderListHtml()}</div></div>`;
}
function ssRenderOrderListHtml(){
  if(!recurringOrders.length) return '<div class="ss-empty">Noch keine Serienaufträge</div>';
  return [...recurringOrders].sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0)).map(o=>{
    const c=(typeof customers!=='undefined'?customers:[]).find(x=>x.id===o.customerId);
    return `<div class="ss-list-card" onclick="ssShowOrderPreview('${o.id}')"><div class="ss-list-card-head"><b class="${ssIsKts(o.orderType)?'ss-type-kts':'ss-type-re'}">${escAttr(ssCustName(c))}</b><span class="ss-status ${o.status||'draft'}">${o.status||'draft'}</span></div>
    <div class="ss-list-card-meta">${ssFmtDate(o.startDate)} – ${ssFmtDate(o.endDate)} · ${(o.weekdays||[]).map(d=>WD_LABELS[d]).join(', ')}</div></div>`;
  }).join('');
}
function ssToggleWd(d){
  if(ssSelectedWd.has(d)) ssSelectedWd.delete(d); else ssSelectedWd.add(d);
  document.querySelectorAll('#ss-o-wd .ss-wd').forEach(el=>el.classList.toggle('on',ssSelectedWd.has(parseInt(el.dataset.wd,10))));
}
function ssSubmitOrder(){
  const custId=document.getElementById('ss-o-cust')?.value;if(!custId){toast('Kunde wählen','warn');return;}
  const cust=customers.find(c=>c.id===custId);
  const order={id:uid(),customerId:custId,orderType:ssOrderType(cust),serieType:document.getElementById('ss-o-serie')?.value||'sonstige',
    startDate:document.getElementById('ss-o-start')?.value,endDate:document.getElementById('ss-o-end')?.value,weekdays:[...ssSelectedWd],customDates:[],
    hasOutbound:document.getElementById('ss-o-out')?.value!=='0',hasReturn:document.getElementById('ss-o-ret')?.value!=='0',
    outboundTime:document.getElementById('ss-o-tout')?.value||'08:00',returnTime:document.getElementById('ss-o-tret')?.value||'14:00',
    pickupAddress:ssCustAddr(cust),destinationAddress:cust?.excelDest||cust?.stammHosp||'',
    kmOneWay:document.getElementById('ss-o-km')?.value||cust?.excelKm||'',priceOneWay:document.getElementById('ss-o-price')?.value||cust?.excelPrice||'',
    status:'draft',notes:document.getElementById('ss-o-note')?.value||'',createdAt:Date.now(),updatedAt:Date.now()};
  recurringOrders.push(order);const preview=ssGeneratePreview(order.id);
  toast('Vorschau erzeugt','ok');ssPreviewId=preview?.id;ssSwitchView('series-preview');
}
function ssShowOrderPreview(orderId){
  let p=seriesPreviews.find(x=>x.recurringOrderId===orderId&&x.status==='preview');
  if(!p) p=ssGeneratePreview(orderId);
  if(p){ssPreviewId=p.id;ssSwitchView('series-preview');}
}
function ssRenderPreview(){
  const el=document.getElementById('ss-preview-body');if(!el) return;
  const previews=seriesPreviews.filter(p=>p.status==='preview');
  if(!previews.length){el.innerHTML='<div class="ss-empty">Keine offenen Vorschauen. <button class="tb-btn primary" type="button" onclick="ssSwitchView(\'series-orders\')">Serienauftrag erstellen</button></div>';return;}
  const active=previews.find(p=>p.id===ssPreviewId)||previews[0];ssPreviewId=active.id;
  const cust=customers.find(c=>c.id===active.customerId),order=recurringOrders.find(o=>o.id===active.recurringOrderId),st=active.stats||{};
  el.innerHTML=`${ssWorkflowHtml()}<div class="ss-toolbar"><h2>🔍 Prüfliste vor Freigabe</h2></div>
    <div class="ss-panel"><div class="ss-list-card-head"><div><b>${escAttr(ssCustName(cust))}</b> · ${active.month} · <span class="${ssIsKts(active.orderType)?'ss-type-kts':'ss-type-re'}">${ssIsKts(active.orderType)?'Krankenfahrt':'Rechnungsfahrt'}</span></div><span class="ss-status preview">${CHECK_STATUS.preview}</span></div>
    <div class="ss-summary-box"><div>Kunde<b>${escAttr(ssCustName(cust))}</b></div><div>Strecke<b>${escAttr(ssCustAddr(cust))} → ${escAttr(order?.destinationAddress||cust?.excelDest||'')}</b></div>
    <div>Fahrtage<b>${st.totalDays||0}</b></div><div>Einfache Fahrten<b>${st.totalSingleTrips||0}</b></div>
    <div>${ssIsKts(active.orderType)?'Gesamt-km':'Gesamtpreis'}<b>${ssIsKts(active.orderType)?(st.totalKm||0)+' km':(st.totalPrice||0).toFixed(2)+' €'}</b></div></div>
    ${active.issues?.length?`<div class="ss-warn-list" style="margin-bottom:10px">${active.issues.map(i=>`<div class="ss-warn-item">${escAttr(i)}</div>`).join('')}</div>`:''}
    <div class="ss-table-wrap"><table class="ss-preview-table"><thead><tr><th>Datum</th><th>Tag</th><th>Hin</th><th>Rück</th><th>${ssIsKts(active.orderType)?'km':'€'}</th><th>Hinweis</th></tr></thead>
    <tbody>${(active.trips||[]).slice(0,50).map(t=>`<tr class="${t.flags?.length?'flag-warn':''}"><td>${ssFmtDate(t.date)}</td><td>${t.weekday}</td><td>${t.outbound?'✓':''}</td><td>${t.returnTrip?'✓':''}</td><td>${ssIsKts(active.orderType)?t.kmOneWay:t.priceOneWay}</td><td>${(t.flags||[]).join(', ')}</td></tr>`).join('')}${active.trips?.length>50?`<tr><td colspan="6">… +${active.trips.length-50} weitere</td></tr>`:''}</tbody></table></div>
    <div class="ss-actions"><button class="tb-btn primary" type="button" onclick="ssApprovePreview('${active.id}')">✅ Freigeben → Monatsliste</button>
    <button class="tb-btn" type="button" onclick="ssRejectPreview('${active.id}');ssRenderPreview()">✕ Verwerfen</button>
    ${previews.length>1?`<select onchange="ssPreviewId=this.value;ssRenderPreview()">${previews.map(p=>{const c2=customers.find(x=>x.id===p.customerId);return `<option value="${p.id}" ${p.id===active.id?'selected':''}>${escAttr(ssCustName(c2))}</option>`;}).join('')}</select>`:''}</div></div>`;
}
function ssRenderImport(){
  const el=document.getElementById('ss-import-body');if(!el) return;
  el.innerHTML=`${ssWorkflowHtml()}<div class="ss-toolbar"><h2>📋 Listenimport</h2></div>
    <div class="ss-panel"><p class="ss-hint">Mehrere Kunden mit Leerzeile trennen. Beispiel unten einfügen.</p>
    <textarea class="ss-import-area" id="ss-import-text">Kunde A: Hermann Müller, Gartenstraße 10, Meckenheim
Ziel: UKB Bonn
Krankenfahrt
Mo/Mi/Fr im Juli
Hin und Rückfahrt
Kilometer: 28 km einfach

Kunde B: Fatma Yilmaz, Hauptstraße 5, Rheinbach
Ziel: Tagespflege Bonn
Rechnungsfahrt
Mo-Fr im Juli
Preis: 24 € einfache Fahrt</textarea>
    <div class="ss-actions"><button class="tb-btn primary" type="button" onclick="ssRunImport()">🔍 Analysieren</button></div>
    <div id="ss-import-results"></div></div>`;
}
function ssRunImport(){
  const parsed=ssParseListImport(document.getElementById('ss-import-text')?.value||'');
  const box=document.getElementById('ss-import-results');if(!box) return;
  if(!parsed.length){box.innerHTML='<div class="ss-empty">Kein Import erkannt</div>';return;}
  box.innerHTML=parsed.map(item=>`<div class="ss-list-card"><div class="ss-list-card-head"><b>${escAttr(item.parsed.customerName)}</b><span class="${ssIsKts(item.parsed.orderType)?'ss-type-kts':'ss-type-re'}">${ssIsKts(item.parsed.orderType)?'KTS':'RE'}</span></div>
    <div class="ss-list-card-meta">${escAttr(item.parsed.destinationAddress)} · ${item.parsed.weekdays.map(d=>WD_LABELS[d]).join(', ')}${item.parsed.kmOneWay?' · '+item.parsed.kmOneWay+' km':''}${item.parsed.priceOneWay?' · '+item.parsed.priceOneWay+' €':''}</div>
    ${item.issues.length?`<div class="ss-warn-list">${item.issues.map(i=>`<div class="ss-warn-item">${escAttr(i)}</div>`).join('')}</div>`:''}
    <div class="ss-actions"><button class="tb-btn primary btn-sm" type="button" onclick="ssImportItem('${item.id}')">Vorschau erzeugen</button></div></div>`).join('');
  window.__ssImportCache=parsed;
}
function ssImportItem(id){const item=(window.__ssImportCache||[]).find(x=>x.id===id);if(!item) return;const p=ssCreateOrderFromImport(item);if(p){ssPreviewId=p.id;ssSwitchView('series-preview');}}
function ssRenderTypeModule(type,elId,title,icon){
  const el=document.getElementById(elId);if(!el) return;
  const month=new Date().toISOString().slice(0,7);
  const custs=(typeof customers!=='undefined'?customers:[]).filter(c=>type==='kts'?(c.type==='kts'||!c.type||c.excelType==='kts'):c.type==='re'||c.excelType==='rechn');
  const sums=monthlySummaries.filter(s=>s.month===month&&(type==='kts'?ssIsKts(s.orderType):ssIsRe(s.orderType)));
  el.innerHTML=`<div class="ss-toolbar"><h2>${icon} ${title}</h2><button class="tb-btn primary" type="button" onclick="ssSwitchView('series-orders')">＋ Serie</button></div>
    <div class="ss-grid">${custs.slice(0,6).map(c=>`<div class="ss-stat ${type==='kts'?'kts':'re'}"><b>${c.excelKm||c.excelPrice||'–'}</b><span>${escAttr(ssCustName(c))}</span></div>`).join('')||'<div class="ss-empty">Keine Kunden</div>'}</div>
    <div class="ss-panel"><h3>Monatslisten ${month}</h3>${sums.length?sums.map(s=>{const c=customers.find(x=>x.id===s.customerId);return `<div class="ss-list-card" onclick="ssOpenMonthDetail('${s.id}')"><div class="ss-list-card-head"><b>${escAttr(ssCustName(c))}</b><span class="ss-status ${s.checkStatus||'draft'}">${CHECK_STATUS[s.checkStatus]||'Entwurf'}</span></div>
    <div class="ss-list-card-meta">${s.totalDays||0} Tage · ${type==='kts'?(s.totalKm||0)+' km':(s.totalPrice||0).toFixed(2)+' €'}</div></div>`;}).join(''):'<div class="ss-empty">Noch keine Listen – Serienauftrag freigeben</div>'}</div>
    <div class="ss-panel"><h3>Kundenstamm (${custs.length})</h3>${custs.map(c=>`<div class="ss-list-card" onclick="openCustDetail('${c.id}')"><div class="ss-list-card-head"><b>${escAttr(ssCustName(c))}</b><span>${type==='kts'?(c.excelKm||'?')+' km':(c.excelPrice||'?')+' €'}</span></div>
    <div class="ss-list-card-meta">${escAttr(c.excelDest||c.stammHosp||'Ziel fehlt')} · ${escAttr(ssCustAddr(c)||'Adresse fehlt')}</div></div>`).join('')||'<div class="ss-empty">Kunden anlegen</div>'}</div>`;
}
function ssRenderKts(){ssRenderTypeModule('kts','ss-kts-body','Krankenfahrten (KTS)','🔴');}
function ssRenderRe(){ssRenderTypeModule('re','ss-re-body','Rechnungsfahrten (RE)','🟡');}
function ssRenderMonthlyList(){
  const el=document.getElementById('ss-monthly-body');if(!el) return;
  if(ssMonthDetailId){ssOpenMonthDetail(ssMonthDetailId);return;}
  const month=document.getElementById('ss-month-filter')?.value||new Date().toISOString().slice(0,7);
  const filter=document.getElementById('ss-month-type')?.value||'all';
  let list=monthlySummaries.filter(s=>s.month===month);
  if(filter==='kts') list=list.filter(s=>ssIsKts(s.orderType));
  if(filter==='re') list=list.filter(s=>ssIsRe(s.orderType));
  el.innerHTML=`<div class="ss-toolbar"><h2>📅 Monats-Auftragslisten</h2>
    <input type="month" id="ss-month-filter" value="${month}" onchange="ssMonthDetailId=null;ssRenderMonthlyList()"/>
    <select id="ss-month-type" onchange="ssRenderMonthlyList()"><option value="all">Alle</option><option value="kts" ${filter==='kts'?'selected':''}>KTS</option><option value="re" ${filter==='re'?'selected':''}>RE</option></select></div>
    ${list.length?list.map(s=>{const c=customers.find(x=>x.id===s.customerId);return `<div class="ss-list-card" onclick="ssOpenMonthDetail('${s.id}')">
    <div class="ss-list-card-head"><b class="${ssIsKts(s.orderType)?'ss-type-kts':'ss-type-re'}">${escAttr(ssCustName(c))}</b><span class="ss-status ${s.checkStatus||'draft'}">${CHECK_STATUS[s.checkStatus]||'Entwurf'}</span></div>
    <div class="ss-list-card-meta">${s.totalDays||0} Tage · ${s.totalSingleTrips||0} Fahrten · ${ssIsKts(s.orderType)?(s.totalKm||0)+' km':(s.totalPrice||0).toFixed(2)+' €'} · Export: ${s.exportStatus||'offen'}</div></div>`;}).join(''):'<div class="ss-empty">Keine Monatslisten – Serienauftrag erstellen und freigeben</div>'}`;
}
function ssOpenMonthDetail(summaryId){
  ssMonthDetailId=summaryId;
  const s=monthlySummaries.find(x=>x.id===summaryId);if(!s) return;
  ssRecalcSummary(summaryId);
  const c=customers.find(x=>x.id===s.customerId);
  const trips=rides.filter(r=>r.customerId===s.customerId&&r.date?.startsWith(s.month)).sort((a,b)=>(a.date||'').localeCompare(b.date||'')||(a.time||'').localeCompare(b.time||''));
  const el=document.getElementById('ss-monthly-body');if(!el) return;
  el.innerHTML=`<div class="ss-toolbar"><h2>📋 ${escAttr(ssCustName(c))} · ${s.month}</h2><button class="tb-btn" type="button" onclick="ssMonthDetailId=null;ssRenderMonthlyList()">← Zurück</button></div>
    <div class="ss-panel"><div class="ss-summary-box"><div>Fahrtage<b>${s.totalDays||0}</b></div><div>Fahrten<b>${s.totalSingleTrips||0}</b></div>
    <div>Gesamt<b>${ssIsKts(s.orderType)?(s.totalKm||0)+' km':(s.totalPrice||0).toFixed(2)+' €'}</b></div>
    <div>Status<b>${CHECK_STATUS[s.checkStatus]||s.checkStatus}</b></div></div>
    <div class="ss-table-wrap"><table class="ss-preview-table"><thead><tr><th>Datum</th><th>Zeit</th><th>Hin/Rück</th><th>km/€</th><th>Prüfung</th><th>Fahrtstatus</th><th>Aktion</th></tr></thead>
    <tbody>${trips.map(t=>`<tr><td>${ssFmtDate(t.date)}</td><td>${t.time||''}</td><td>${typeof excelDirLabel==='function'?excelDirLabel(t.excelDir||'hin-rueck'):t.excelDir||''}</td>
    <td>${ssIsRe(t.type)?(t.amount||t.betrag||''):t.km||''}</td><td>${t.reviewStatus||'–'}</td>
    <td><select onchange="ssSetRideTripStatus('${t.id}',this.value)" onclick="event.stopPropagation()">${Object.entries(TRIP_STATUS).map(([k,v])=>`<option value="${k}" ${t.tripStatus===k?'selected':''}>${v}</option>`).join('')}</select></td>
    <td><button class="tb-btn btn-sm" type="button" onclick="event.stopPropagation();ssDeleteRide('${t.id}')">🗑️</button></td></tr>`).join('')}</tbody></table></div>
    <div class="ss-actions">
      <button class="tb-btn" type="button" onclick="ssSetSummaryStatus('${s.id}','checked')">✓ Geprüft</button>
      <button class="tb-btn primary" type="button" onclick="ssSetSummaryStatus('${s.id}','approved')">✅ Freigegeben</button>
      <button class="tb-btn" type="button" onclick="ssSetSummaryStatus('${s.id}','exported')">📤 Exportiert</button>
      <button class="tb-btn" type="button" onclick="ssSetSummaryStatus('${s.id}','done')">🏁 Abgeschlossen</button>
      <button class="tb-btn primary" type="button" onclick="ssPrintSignatureSheet('${s.customerId}','${s.month}')">✍️ Unterschriftszettel</button>
      <button class="tb-btn" type="button" onclick="exportReviewPdf(customers.find(c=>c.id==='${s.customerId}'),'${s.month}')">📄 PDF</button></div></div>`;
}
function ssPrintSignatureSheet(custId,month){
  const c=customers.find(x=>x.id===custId);if(!c){toast('Kunde nicht gefunden','warn');return;}
  const isRe=c.type==='re'||c.excelType==='rechn';
  const trips=rides.filter(r=>r.customerId===custId&&r.date?.startsWith(month)&&r.tripStatus!=='storniert').sort((a,b)=>(a.date||'').localeCompare(b.date||''));
  if(!trips.length){toast('Keine Fahrten','warn');return;}
  const km=parseFloat(c.excelKm||trips[0]?.km)||0,price=parseFloat(c.excelPrice||trips[0]?.amount||trips[0]?.betrag)||0;
  const days=new Set(trips.map(t=>t.date)).size,singles=trips.length;
  const totalKm=trips.reduce((a,t)=>a+(parseFloat(t.km)||km),0);
  const totalPrice=trips.reduce((a,t)=>a+(parseFloat(t.amount||t.betrag)||price),0);
  const addr=ssCustAddr(c),dest=c.excelDest||c.stammHosp||trips[0]?.to||'';
  const tpl=templates.find(t=>t.templateType===(isRe?'rechn':'kts'));
  const rows=trips.map((t,i)=>`<tr><td>${i+1}</td><td>${ssFmtDate(t.date)}</td><td>${WD_LABELS[new Date(t.date+'T12:00:00').getDay()]}</td><td>${t.time||''}</td>
    <td>${t.excelDir==='hin'||t.excelDir==='hin-rueck'?'✓':''}</td><td>${t.excelDir==='rueck'||t.excelDir==='hin-rueck'?'✓':''}</td>
    <td>${isRe?price.toFixed(2):km}</td><td style="height:32px;border-bottom:1px dotted #666"></td></tr>`).join('');
  const w=window.open('','_blank');
  w.document.write(`<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><title>Unterschrift ${escAttr(ssCustName(c))}</title>
<style>@page{margin:12mm}body{font-family:Arial,sans-serif;font-size:11px;padding:14px}h1{font-size:15px;margin:0 0 6px}.meta{font-size:11px;line-height:1.55;margin-bottom:10px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #222;padding:4px 6px;font-size:10px}th{background:#eee}.foot{margin-top:16px;font-size:11px;line-height:1.6}.sig{margin-top:22px;display:grid;grid-template-columns:1fr 1fr;gap:20px}.sig div{border-top:1px solid #000;padding-top:5px;font-size:10px}</style></head><body>
<h1>${isRe?'Unterschriftszettel Rechnungsfahrten':'Unterschriftszettel Krankenfahrten (KTS)'}</h1>
<div class="meta"><strong>${escAttr(ssCustName(c))}</strong>${isRe&&c.invoiceRecipient?'<br>Rechnungsempfänger: '+escAttr(c.invoiceRecipient):isRe&&c.org?'<br>Rechnungsempfänger: '+escAttr(c.org):''}
<br>Monat: ${month}<br>Abholadresse: ${escAttr(addr)}<br>Ziel: ${escAttr(dest)}<br>Strecke: ${escAttr(addr)} → ${escAttr(dest)}
${!isRe&&c.ktsPresent?'<br>KTS: vorhanden':''}${!isRe&&c.approvalPresent?'<br>Genehmigung: vorhanden':''}${!isRe&&c.zuzahlungStatus?'<br>Zuzahlung: '+escAttr(c.zuzahlungStatus):''}</div>
<table><thead><tr><th>Nr</th><th>Datum</th><th>Tag</th><th>Zeit</th><th>Hin</th><th>Rück</th><th>${isRe?'Preis €':'km'}</th><th>Unterschrift</th></tr></thead><tbody>${rows}</tbody></table>
<div class="foot"><strong>Zusammenfassung:</strong> ${days} Fahrtage · ${singles} einfache Fahrten · ${isRe?'Gesamtbetrag: '+totalPrice.toFixed(2)+' €':'Gesamtkilometer: '+totalKm+' km'}</div>
<div class="sig"><div>Unterschrift Patient / Kunde</div><div>Datum · Stempel · Fahrer optional</div></div>
<p style="font-size:9px;color:#666;margin-top:16px">${escAttr(tpl?.name||'TaxiPro')} · ${new Date().toLocaleString('de-DE')}</p></body></html>`);
  w.document.close();setTimeout(()=>w.print(),500);
  ssAudit('signature_print','customer',custId,month);
}
function ssRenderSignatures(){
  const el=document.getElementById('ss-signatures-body');if(!el) return;
  const month=document.getElementById('ss-sig-month')?.value||new Date().toISOString().slice(0,7);
  const sums=monthlySummaries.filter(s=>s.month===month);
  el.innerHTML=`<div class="ss-toolbar"><h2>✍️ Unterschriftszettel</h2><input type="month" id="ss-sig-month" value="${month}" onchange="ssRenderSignatures()"/></div>
    <div class="ss-panel"><p class="ss-hint">Getrennte Vorlagen KTS (rot) und RE (gelb). Daten aus freigegebenen Monatslisten.</p>
    ${sums.length?sums.map(s=>{const c=customers.find(x=>x.id===s.customerId);return `<div class="ss-list-card"><div class="ss-list-card-head"><b class="${ssIsKts(s.orderType)?'ss-type-kts':'ss-type-re'}">${escAttr(ssCustName(c))}</b><span class="ss-status ${s.checkStatus||'draft'}">${CHECK_STATUS[s.checkStatus]||''}</span></div>
    <div class="ss-list-card-meta">${s.totalDays||0} Tage · ${ssIsKts(s.orderType)?(s.totalKm||0)+' km':(s.totalPrice||0).toFixed(2)+' €'}</div>
    <div class="ss-actions"><button class="tb-btn primary btn-sm" type="button" onclick="ssPrintSignatureSheet('${s.customerId}','${s.month}')">🖨️ Drucken</button></div></div>`;}).join(''):'<div class="ss-empty">Keine Monatslisten für diesen Monat</div>'}</div>`;
}
function ssRenderTemplates(){
  const el=document.getElementById('ss-templates-body');if(!el) return;
  el.innerHTML=`<div class="ss-toolbar"><h2>📄 Vorlagenverwaltung</h2></div>
    ${templates.map(t=>`<div class="ss-panel"><h3 class="${t.templateType==='kts'?'ss-type-kts':'ss-type-re'}">${escAttr(t.name)}</h3>
    <p class="ss-hint">Felder werden automatisch aus Monatsdaten befüllt:</p>
    <div class="ss-tag-row">${(t.fields||[]).map(f=>`<span class="ss-tag">${escAttr(f)}</span>`).join('')}</div>
    <div class="ss-actions"><button class="tb-btn btn-sm" type="button" onclick="ssSwitchView('signatures')">→ Unterschriftszettel drucken</button></div></div>`).join('')}
    <div class="ss-panel"><h3>Hinweis</h3><p class="ss-hint">Excel-Vorlagen (KTS A14–E41, RE A11–G40) bleiben unter Kunde → Abrechnung. PDF-Unterschriftszettel nutzen die integrierten Vorlagen oben.</p></div>`;
}
function ssRenderSettings(){
  const el=document.getElementById('ss-settings-body');if(!el) return;
  const role=localStorage.getItem('tp_ss_role')||'admin';
  el.innerHTML=`<div class="ss-toolbar"><h2>⚙️ Einstellungen</h2></div>
    <div class="ss-panel"><h3>Rolle</h3><div class="fr"><label>Benutzerrolle</label><select id="ss-role" onchange="localStorage.setItem('tp_ss_role',this.value);ssRenderSettings()">
    <option value="admin" ${role==='admin'?'selected':''}>Admin</option><option value="buero" ${role==='buero'?'selected':''}>Büro / Disposition</option><option value="readonly" ${role==='readonly'?'selected':''}>Nur Lesen</option></select></div>
    <p class="ss-hint">Aktuell: ${role==='admin'?'Voller Zugriff':role==='buero'?'Disposition':'Nur Ansicht'}</p></div>
    <div class="ss-panel"><h3>Daten & Backup</h3><div class="ss-actions">
    <button class="tb-btn" type="button" onclick="exportBackup()">💾 Backup speichern</button>
    <button class="tb-btn" type="button" onclick="document.getElementById('import-file').click()">📂 Backup laden</button></div></div>
    <div class="ss-panel"><h3>Änderungsprotokoll (letzte 20)</h3>
    <div class="ss-table-wrap"><table class="ss-preview-table"><thead><tr><th>Zeit</th><th>Aktion</th><th>Details</th></tr></thead>
    <tbody>${auditLogs.slice(-20).reverse().map(a=>`<tr><td>${new Date(a.createdAt).toLocaleString('de-DE')}</td><td>${escAttr(a.action)}</td><td>${escAttr(a.detail||a.entityId||'')}</td></tr>`).join('')||'<tr><td colspan="3">Noch keine Einträge</td></tr>'}</tbody></table></div></div>`;
}
function ssOnView(v){
  if(v==='dashboard') ssRenderDashboard();
  if(v==='series-orders') ssRenderSeriesOrders();
  if(v==='series-preview') ssRenderPreview();
  if(v==='series-import') ssRenderImport();
  if(v==='monthly-list') ssRenderMonthlyList();
  if(v==='signatures') ssRenderSignatures();
  if(v==='kts-module') ssRenderKts();
  if(v==='re-module') ssRenderRe();
  if(v==='templates') ssRenderTemplates();
  if(v==='settings') ssRenderSettings();
}

ssLoad();
window.ssSwitchView=ssSwitchView;
window.ssToggleWd=ssToggleWd;
window.ssSubmitOrder=ssSubmitOrder;
window.ssShowOrderPreview=ssShowOrderPreview;
window.ssApprovePreview=ssApprovePreview;
window.ssRejectPreview=ssRejectPreview;
window.ssRunImport=ssRunImport;
window.ssImportItem=ssImportItem;
window.ssRenderMonthlyList=ssRenderMonthlyList;
window.ssOpenMonthDetail=ssOpenMonthDetail;
window.ssPrintSignatureSheet=ssPrintSignatureSheet;
window.ssOnView=ssOnView;
window.ssLoad=ssLoad;
window.ssFillOrderFromCustomer=ssFillOrderFromCustomer;
window.ssSetSummaryStatus=ssSetSummaryStatus;
window.ssSetRideTripStatus=ssSetRideTripStatus;
window.ssDeleteRide=ssDeleteRide;
document.addEventListener('DOMContentLoaded',()=>ssLoad());
})();
