/* TaxiPro Serienfahrten-System – Kernmodul */
(function(){
'use strict';

const WD_MAP={mo:1,di:2,mi:3,do:4,fr:5,sa:6,so:0};
const WD_LABELS=['So','Mo','Di','Mi','Do','Fr','Sa'];
const MONTH_NAMES=['januar','februar','märz','april','mai','juni','juli','august','september','oktober','november','dezember'];
const SERIE_TYPES=[
  {id:'dialyse',label:'💧 Dialyse'},
  {id:'chemo',label:'🏥 Chemo'},
  {id:'strahlen',label:'☢️ Strahlentherapie'},
  {id:'reha',label:'💪 Reha'},
  {id:'tagespflege',label:'🏠 Tagespflege'},
  {id:'schueler',label:'🎒 Schülerfahrt'},
  {id:'rechn_serie',label:'🟡 Regelm. Rechnungsfahrt'},
  {id:'sonstige',label:'🔄 Sonstige Dauerfahrt'}
];
const CHECK_STATUS={
  draft:'Entwurf',
  preview:'Wartet auf Prüfung',
  checked:'Geprüft',
  approved:'Freigegeben',
  exported:'Exportiert',
  done:'Abgeschlossen'
};

let recurringOrders=[];
let seriesPreviews=[];
let monthlySummaries=[];
let ssSelectedWd=new Set([1,3,5]);
let ssPreviewId=null;

function ssLoad(){
  try{recurringOrders=JSON.parse(localStorage.getItem('tp_ro')||'[]');}catch(e){recurringOrders=[];}
  try{seriesPreviews=JSON.parse(localStorage.getItem('tp_sp')||'[]');}catch(e){seriesPreviews=[];}
  try{monthlySummaries=JSON.parse(localStorage.getItem('tp_ms')||'[]');}catch(e){monthlySummaries=[];}
}
function ssSave(){
  localStorage.setItem('tp_ro',JSON.stringify(recurringOrders));
  localStorage.setItem('tp_sp',JSON.stringify(seriesPreviews));
  localStorage.setItem('tp_ms',JSON.stringify(monthlySummaries));
  if(typeof save==='function') save();
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
function ssMonthKey(startDate,endDate){
  const s=startDate||'';
  return s.slice(0,7);
}
function ssParseWeekdays(text){
  const t=String(text||'').toLowerCase().replace(/\./g,'').replace(/\s+/g,'');
  const set=new Set();
  if(/mo-fr|montag-freitag|werktag/.test(t)) [1,2,3,4,5].forEach(d=>set.add(d));
  else{
    Object.entries(WD_MAP).forEach(([k,v])=>{if(t.includes(k)) set.add(v);});
  }
  return [...set].sort((a,b)=>a-b);
}
function ssParseMonthYear(text,refYear){
  const t=String(text||'').toLowerCase();
  const y=(t.match(/20\d{2}/)||[])[0]||String(refYear||new Date().getFullYear());
  let m=MONTH_NAMES.findIndex(n=>t.includes(n));
  if(m<0){
    const mm=(t.match(/(?:im\s|\/|\.)?(0?[1-9]|1[0-2])(?:\.|\/)?(20\d{2})?/)||[])[1];
    if(mm) m=parseInt(mm,10)-1;
  }
  if(m<0) m=new Date().getMonth();
  return{year:parseInt(y,10),month:m};
}
function ssDatesInRange(startDate,endDate,weekdays){
  const out=[];
  const start=new Date(startDate+'T12:00:00');
  const end=new Date(endDate+'T12:00:00');
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
  const y=parseInt(year,10),m=parseInt(month,10);
  const last=new Date(y,m+1,0).getDate();
  return{
    start:`${y}-${String(m+1).padStart(2,'0')}-01`,
    end:`${y}-${String(m+1).padStart(2,'0')}-${String(last).padStart(2,'0')}`
  };
}
function ssCalcStats(dates,hasOut,hasRet,kmOne,priceOne){
  const days=dates.length;
  const legsPerDay=(hasOut?1:0)+(hasRet?1:0);
  const singleTrips=days*legsPerDay;
  const km=parseFloat(kmOne)||0;
  const price=parseFloat(priceOne)||0;
  return{
    totalDays:days,
    totalSingleTrips:singleTrips,
    totalKm:singleTrips*km,
    totalPrice:singleTrips*price,
    legsPerDay
  };
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
  return issues;
}
function ssBuildPreviewTrips(order,cust,dates){
  const km=parseFloat(order.kmOneWay||cust?.excelKm)||0;
  const price=parseFloat(order.priceOneWay||cust?.excelPrice)||0;
  const type=ssIsRe(order.orderType)?'rechn':ssIsKts(order.orderType)?'krank':'normal';
  const from=order.pickupAddress||ssCustAddr(cust);
  const to=order.destinationAddress||cust?.excelDest||cust?.stammHosp||'';
  return dates.map(date=>{
    const wd=new Date(date+'T12:00:00').getDay();
    const flags=[];
    if(!from) flags.push('missing_route');
    if(!to) flags.push('missing_route');
    if(ssIsKts(order.orderType)&&!km) flags.push('missing_km');
    if(ssIsRe(order.orderType)&&!price) flags.push('missing_amount');
    return{
      id:(typeof uid==='function'?uid():Date.now()+Math.random().toString(36).slice(2)),
      recurringOrderId:order.id,
      customerId:order.customerId,
      month:date.slice(0,7),
      date,
      weekday:WD_LABELS[wd],
      outbound:!!order.hasOutbound,
      returnTrip:!!order.hasReturn,
      outboundTime:order.outboundTime||'08:00',
      returnTime:order.returnTime||'14:00',
      kmOneWay:km,
      priceOneWay:price,
      from,to,
      type,
      status:'geplant',
      checked:false,
      flags
    };
  });
}
function ssGeneratePreview(orderId){
  const order=recurringOrders.find(o=>o.id===orderId);
  if(!order) return null;
  const cust=(typeof customers!=='undefined'?customers:[]).find(c=>c.id===order.customerId);
  const issues=ssValidateOrder(order,cust);
  const dates=order.customDates?.length?order.customDates.slice().sort():
    ssDatesInRange(order.startDate,order.endDate,order.weekdays||[]);
  const stats=ssCalcStats(dates,order.hasOutbound,order.hasReturn,order.kmOneWay||cust?.excelKm,order.priceOneWay||cust?.excelPrice);
  const trips=ssBuildPreviewTrips(order,cust,dates);
  const preview={
    id:(typeof uid==='function'?uid():'sp'+Date.now()),
    recurringOrderId:order.id,
    customerId:order.customerId,
    month:ssMonthKey(order.startDate,order.endDate),
    orderType:order.orderType,
    status:'preview',
    issues,
    stats,
    trips,
    createdAt:Date.now()
  };
  seriesPreviews=seriesPreviews.filter(p=>p.recurringOrderId!==order.id||p.status!=='preview');
  seriesPreviews.push(preview);
  order.status='preview';
  order.updatedAt=Date.now();
  ssSave();
  ssPreviewId=preview.id;
  return preview;
}
function ssApprovePreview(previewId){
  const preview=seriesPreviews.find(p=>p.id===previewId);
  if(!preview) return false;
  const order=recurringOrders.find(o=>o.id===preview.recurringOrderId);
  const cust=(typeof customers!=='undefined'?customers:[]).find(c=>c.id===preview.customerId);
  if(!order||!cust) return false;
  if(preview.issues?.length){
    if(!confirm('Es gibt offene Hinweise. Trotzdem freigeben?')) return false;
  }
  if(typeof rides==='undefined') return false;
  const groupId=(typeof uid==='function'?uid():'sg'+Date.now());
  preview.trips.forEach(t=>{
    const legs=[];
    if(t.outbound) legs.push({dir:'hin',time:t.outboundTime});
    if(t.returnTrip) legs.push({dir:'rueck',time:t.returnTime});
    if(!legs.length) legs.push({dir:'hin-rueck',time:t.outboundTime});
    legs.forEach(leg=>{
      rides.push({
        id:(typeof uid==='function'?uid():Date.now()+Math.random().toString(36).slice(2)),
        type:t.type,
        customerId:t.customerId,
        date:t.date,
        time:leg.time,
        from:t.from,
        to:t.to,
        km:t.kmOneWay||'',
        amount:ssIsRe(t.type)?t.priceOneWay:'',
        betrag:ssIsRe(t.type)?t.priceOneWay:'',
        verordnung:'',
        zuzahlung:t.type==='krank'?(typeof normalizeZuzahlung==='function'?normalizeZuzahlung(cust.zuzahlungStatus||'NB'):'NB'):'',
        note:order.notes||'',
        serie:true,
        serieType:order.serieType||'sonstige',
        serieGroupId:groupId,
        recurringOrderId:order.id,
        reviewStatus:'pending',
        excelDir:leg.dir==='hin'?'hin':leg.dir==='rueck'?'rueck':'hin-rueck',
        source:'series',
        localUpdated:Date.now()
      });
    });
  });
  let summary=monthlySummaries.find(s=>s.customerId===preview.customerId&&s.month===preview.month&&s.orderType===preview.orderType);
  if(!summary){
    summary={
      id:(typeof uid==='function'?uid():'ms'+Date.now()),
      customerId:preview.customerId,
      month:preview.month,
      orderType:preview.orderType,
      recurringOrderId:order.id,
      totalDays:preview.stats.totalDays,
      totalSingleTrips:preview.stats.totalSingleTrips,
      totalKm:preview.stats.totalKm,
      totalPrice:preview.stats.totalPrice,
      checkStatus:'preview',
      exportStatus:'open',
      createdAt:Date.now(),
      updatedAt:Date.now()
    };
    monthlySummaries.push(summary);
  }else{
    Object.assign(summary,{
      totalDays:preview.stats.totalDays,
      totalSingleTrips:preview.stats.totalSingleTrips,
      totalKm:preview.stats.totalKm,
      totalPrice:preview.stats.totalPrice,
      checkStatus:'approved',
      updatedAt:Date.now()
    });
  }
  preview.status='approved';
  order.status='active';
  order.updatedAt=Date.now();
  ssSave();
  if(typeof updateCounts==='function') updateCounts();
  if(typeof renderCalendar==='function') renderCalendar();
  if(typeof renderToday==='function') renderToday();
  if(typeof renderReviewView==='function') renderReviewView();
  if(typeof toast==='function') toast(`${preview.stats.totalDays} Fahrtage freigegeben – bitte in Prüfliste prüfen`,'ok');
  return true;
}
function ssRejectPreview(previewId){
  seriesPreviews=seriesPreviews.filter(p=>p.id!==previewId);
  ssSave();
  if(typeof toast==='function') toast('Vorschau verworfen','warn');
}
function ssParseListImport(text){
  const blocks=String(text||'').split(/\n\s*\n|\n(?=Kunde\s)/i).map(b=>b.trim()).filter(Boolean);
  const results=[];
  blocks.forEach(block=>{
    const lines=block.split('\n').map(l=>l.trim()).filter(Boolean);
    const nameLine=lines.find(l=>/^kunde\s*[:\-]/i.test(l))||lines[0]||'';
    const name=nameLine.replace(/^kunde\s*[:\-]\s*/i,'').split(',')[0].trim();
    const addrMatch=block.match(/([^,\n]+,\s*\d{4,5}\s+[^,\n]+)/);
    const addr=addrMatch?addrMatch[1]:'';
    const destLine=lines.find(l=>/^ziel\s*[:\-]/i.test(l));
    const dest=destLine?destLine.replace(/^ziel\s*[:\-]\s*/i,'').trim():'';
    const lower=block.toLowerCase();
    const orderType=/rechnungsfahrt|rechnung/.test(lower)?'rechn':/krankenfahrt|kts|dialyse|chemo/.test(lower)?'kts':'sonstige';
    const hasOut=/hin\s*(und|\+|&)?\s*rück|hin\s*und\s*rück|↔|beide/.test(lower)||!/nur\s*hin|nur\s*rück/.test(lower);
    const hasRet=hasOut||/rückfahrt/.test(lower);
    const kmMatch=block.match(/(\d+(?:[.,]\d+)?)\s*km/i);
    const priceMatch=block.match(/(\d+(?:[.,]\d+)?)\s*€/);
    const wdText=lines.find(l=>/(mo|di|mi|do|fr|sa|so)/i.test(l))||block;
    const weekdays=ssParseWeekdays(wdText);
    const monthInfo=ssParseMonthYear(block);
    const bounds=ssMonthBounds(monthInfo.year,monthInfo.month);
    const issues=[];
    if(!name) issues.push('Name fehlt');
    if(!dest) issues.push('Ziel fehlt');
    if(orderType==='kts'&&!kmMatch) issues.push('Kilometer fehlt');
    if(orderType==='rechn'&&!priceMatch) issues.push('Preis fehlt');
    if(!weekdays.length) issues.push('Wochentage unklar');
    results.push({
      id:(typeof uid==='function'?uid():'imp'+Date.now()+Math.random()),
      parsed:{
        customerName:name,
        pickupAddress:addr,
        destinationAddress:dest,
        orderType,
        startDate:bounds.start,
        endDate:bounds.end,
        weekdays,
        hasOutbound:true,
        hasReturn:hasRet,
        kmOneWay:kmMatch?kmMatch[1].replace(',','.'):'',
        priceOneWay:priceMatch?priceMatch[1].replace(',','.'):'',
        notes:block.slice(0,200)
      },
      issues,
      raw:block
    });
  });
  return results;
}
function ssFindCustomerByName(name){
  const q=String(name||'').toLowerCase().trim();
  return (typeof customers!=='undefined'?customers:[]).find(c=>{
    const full=`${c.fname||''} ${c.lname||''}`.toLowerCase();
    const rev=`${c.lname||''} ${c.fname||''}`.toLowerCase();
    return full.includes(q)||rev.includes(q)||q.includes(full.trim());
  });
}
function ssCreateOrderFromImport(item){
  let cust=ssFindCustomerByName(item.parsed.customerName);
  if(!cust){
    const parts=item.parsed.customerName.split(/\s+/);
    const fname=parts.slice(1).join(' ')||parts[0];
    const lname=parts.length>1?parts[0]:'';
    cust={
      id:(typeof uid==='function'?uid():'c'+Date.now()),
      fname,lname,
      street:item.parsed.pickupAddress.split(',')[0]?.trim()||'',
      plz:'',city:'',
      type:item.parsed.orderType==='rechn'?'re':'kts',
      excelKm:item.parsed.kmOneWay,
      excelPrice:item.parsed.priceOneWay,
      excelDest:item.parsed.destinationAddress,
      stammHosp:item.parsed.destinationAddress,
      zuzahlungStatus:'NB',
      source:'import'
    };
    if(typeof customers!=='undefined') customers.push(cust);
  }
  const order={
    id:(typeof uid==='function'?uid():'ro'+Date.now()),
    customerId:cust.id,
    orderType:item.parsed.orderType,
    serieType:item.parsed.orderType==='kts'?'dialyse':'rechn_serie',
    startDate:item.parsed.startDate,
    endDate:item.parsed.endDate,
    weekdays:item.parsed.weekdays,
    customDates:[],
    hasOutbound:item.parsed.hasOutbound,
    hasReturn:item.parsed.hasReturn,
    outboundTime:'08:00',
    returnTime:'14:00',
    pickupAddress:item.parsed.pickupAddress||ssCustAddr(cust),
    destinationAddress:item.parsed.destinationAddress,
    kmOneWay:item.parsed.kmOneWay||cust.excelKm||'',
    priceOneWay:item.parsed.priceOneWay||cust.excelPrice||'',
    status:'draft',
    notes:item.parsed.notes||'',
    createdAt:Date.now(),
    updatedAt:Date.now()
  };
  recurringOrders.push(order);
  ssSave();
  return ssGeneratePreview(order.id);
}
function ssDashboardWarnings(){
  const w=[];
  (typeof customers!=='undefined'?customers:[]).forEach(c=>{
    if(!ssCustAddr(c)) w.push({level:'err',text:`${ssCustName(c)}: Adresse fehlt`,action:()=>{if(typeof openCustDetail==='function') openCustDetail(c.id);}});
    if((c.type==='kts'||c.excelType==='kts')&&!c.excelKm) w.push({level:'warn',text:`${ssCustName(c)}: Kilometer fehlt`,action:()=>{if(typeof openCustDetail==='function') openCustDetail(c.id);}});
    if((c.type==='re'||c.excelType==='rechn')&&!c.excelPrice) w.push({level:'warn',text:`${ssCustName(c)}: Preis fehlt`,action:()=>{if(typeof openCustDetail==='function') openCustDetail(c.id);}});
  });
  seriesPreviews.filter(p=>p.status==='preview').forEach(p=>{
    const c=(typeof customers!=='undefined'?customers:[]).find(x=>x.id===p.customerId);
    w.push({level:'warn',text:`Prüfliste offen: ${ssCustName(c)} · ${p.month}`,action:()=>ssSwitchView('series-preview')});
  });
  monthlySummaries.filter(s=>s.checkStatus!=='done'&&s.checkStatus!=='exported').forEach(s=>{
    const c=(typeof customers!=='undefined'?customers:[]).find(x=>x.id===s.customerId);
    w.push({level:'warn',text:`Monatsliste ${s.month}: ${ssCustName(c)} (${CHECK_STATUS[s.checkStatus]||s.checkStatus})`,action:()=>ssSwitchView('monthly-list')});
  });
  return w;
}
function ssSwitchView(v){
  if(typeof switchView==='function') switchView(v);
}
function ssRenderDashboard(){
  const el=document.getElementById('ss-dashboard-body');
  if(!el) return;
  const warnings=ssDashboardWarnings();
  const pendingPreviews=seriesPreviews.filter(p=>p.status==='preview').length;
  const month=new Date().toISOString().slice(0,7);
  const ktsMonth=monthlySummaries.filter(s=>s.month===month&&ssIsKts(s.orderType)).length;
  const reMonth=monthlySummaries.filter(s=>s.month===month&&ssIsRe(s.orderType)).length;
  const openReview=typeof countPendingReview==='function'?countPendingReview():
    (typeof rides!=='undefined'?rides.filter(r=>r.reviewStatus==='pending'||!r.reviewStatus).length:0);
  el.innerHTML=`
    <div class="ss-hero">
      <h2>📊 Serienfahrten-Dashboard</h2>
      <p>Kunde → Serienauftrag → Monatsfahrten → Kontrolle → Freigabe → Unterschriftszettel</p>
    </div>
    <div class="ss-grid">
      <div class="ss-stat warn" onclick="ssSwitchView('series-preview')"><b>${pendingPreviews}</b><span>Offene Prüflisten</span></div>
      <div class="ss-stat" onclick="ssSwitchView('review')"><b>${openReview}</b><span>Prüfung Fahrten</span></div>
      <div class="ss-stat kts" onclick="ssSwitchView('monthly-list')"><b>${ktsMonth}</b><span>KTS Monatslisten</span></div>
      <div class="ss-stat re" onclick="ssSwitchView('monthly-list')"><b>${reMonth}</b><span>RE Monatslisten</span></div>
      <div class="ss-stat ok" onclick="ssSwitchView('series-orders')"><b>${recurringOrders.filter(o=>o.status==='active').length}</b><span>Aktive Serien</span></div>
      <div class="ss-stat err" onclick="ssSwitchView('series-import')"><b>${warnings.filter(x=>x.level==='err').length}</b><span>Kritische Fehler</span></div>
    </div>
    <div class="ss-panel">
      <h3>⚠️ Offene Punkte</h3>
      ${warnings.length?`<div class="ss-warn-list">${warnings.slice(0,12).map((w,i)=>`<div class="ss-warn-item ${w.level==='err'?'err':''}" data-warn="${i}">${w.text}</div>`).join('')}</div>`:'<div class="ss-empty">Keine offenen Warnungen</div>'}
    </div>`;
  el.querySelectorAll('[data-warn]').forEach(node=>{
    const w=warnings[parseInt(node.dataset.warn,10)];
    if(w?.action) node.onclick=w.action;
  });
}
function ssRenderSeriesOrders(){
  const el=document.getElementById('ss-series-orders-body');
  if(!el) return;
  const custOpts=(typeof customers!=='undefined'?customers:[]).map(c=>`<option value="${c.id}">${escAttr(ssCustName(c))}</option>`).join('');
  const now=new Date();
  const ym=now.toISOString().slice(0,7);
  const bounds=ssMonthBounds(now.getFullYear(),now.getMonth());
  el.innerHTML=`
    <div class="ss-toolbar"><h2>🔁 Serienfahrten</h2><button class="tb-btn primary" type="button" onclick="ssResetOrderForm()">＋ Neuer Serienauftrag</button></div>
    <div class="ss-panel">
      <h3>Serienauftrag erstellen</h3>
      <div class="ss-form" id="ss-order-form">
        <div class="fr2 fr">
          <div class="fr"><label>Kunde *</label><select id="ss-o-cust"><option value="">– wählen –</option>${custOpts}</select></div>
          <div class="fr"><label>Serienart</label><select id="ss-o-serie">${SERIE_TYPES.map(s=>`<option value="${s.id}">${s.label}</option>`).join('')}</select></div>
        </div>
        <div class="fr2 fr">
          <div class="fr"><label>Von</label><input type="date" id="ss-o-start" value="${bounds.start}"/></div>
          <div class="fr"><label>Bis</label><input type="date" id="ss-o-end" value="${bounds.end}"/></div>
        </div>
        <div class="fr"><label>Wochentage</label><div class="ss-weekdays" id="ss-o-wd">${WD_LABELS.map((l,i)=>`<span class="ss-wd${ssSelectedWd.has(i)?' on':''}" data-wd="${i}" onclick="ssToggleWd(${i})">${l}</span>`).join('')}</div></div>
        <div class="fr2 fr">
          <div class="fr"><label>Hinfahrt</label><select id="ss-o-out"><option value="1">Ja</option><option value="0">Nein</option></select></div>
          <div class="fr"><label>Rückfahrt</label><select id="ss-o-ret"><option value="1">Ja</option><option value="0">Nein</option></select></div>
        </div>
        <div class="fr2 fr">
          <div class="fr"><label>Uhrzeit Hin</label><input type="time" id="ss-o-tout" value="08:00"/></div>
          <div class="fr"><label>Uhrzeit Rück</label><input type="time" id="ss-o-tret" value="14:00"/></div>
        </div>
        <div class="fr2 fr">
          <div class="fr"><label>Kilometer einfach (KTS)</label><input type="number" id="ss-o-km" min="0" step="0.1" placeholder="z.B. 28"/></div>
          <div class="fr"><label>Preis einfach € (RE)</label><input type="number" id="ss-o-price" min="0" step="0.01" placeholder="z.B. 22"/></div>
        </div>
        <div class="fr"><label>Bemerkung</label><input type="text" id="ss-o-note" placeholder="Optional"/></div>
        <div class="ss-actions">
          <button class="tb-btn primary" type="button" onclick="ssSubmitOrder()">🔍 Vorschau erzeugen</button>
        </div>
      </div>
    </div>
    <div class="ss-panel">
      <h3>Geplante Serienaufträge</h3>
      <div id="ss-order-list">${ssRenderOrderListHtml()}</div>
    </div>`;
}
function ssRenderOrderListHtml(){
  if(!recurringOrders.length) return '<div class="ss-empty">Noch keine Serienaufträge</div>';
  return [...recurringOrders].sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0)).map(o=>{
    const c=(typeof customers!=='undefined'?customers:[]).find(x=>x.id===o.customerId);
    const typeCls=ssIsKts(o.orderType)?'ss-type-kts':ssIsRe(o.orderType)?'ss-type-re':'ss-type-serie';
    return `<div class="ss-list-card" onclick="ssShowOrderPreview('${o.id}')">
      <div class="ss-list-card-head"><b class="${typeCls}">${escAttr(ssCustName(c))}</b><span class="ss-status ${o.status==='active'?'checked':o.status==='preview'?'preview':'draft'}">${o.status||'draft'}</span></div>
      <div class="ss-list-card-meta">${ssFmtDate(o.startDate)} – ${ssFmtDate(o.endDate)} · ${(o.weekdays||[]).map(d=>WD_LABELS[d]).join(', ')||'Tage'} · ${ssIsKts(o.orderType)?'🔴 KTS':'🟡 RE'}</div>
    </div>`;
  }).join('');
}
function ssToggleWd(d){
  if(ssSelectedWd.has(d)) ssSelectedWd.delete(d); else ssSelectedWd.add(d);
  document.querySelectorAll('#ss-o-wd .ss-wd').forEach(el=>el.classList.toggle('on',ssSelectedWd.has(parseInt(el.dataset.wd,10))));
}
function ssResetOrderForm(){ssSelectedWd=new Set([1,3,5]);ssRenderSeriesOrders();}
function ssSubmitOrder(){
  const custId=document.getElementById('ss-o-cust')?.value;
  if(!custId){if(typeof toast==='function') toast('Kunde wählen','warn');return;}
  const cust=(typeof customers!=='undefined'?customers:[]).find(c=>c.id===custId);
  const orderType=ssOrderType(cust);
  const order={
    id:(typeof uid==='function'?uid():'ro'+Date.now()),
    customerId:custId,
    orderType,
    serieType:document.getElementById('ss-o-serie')?.value||'sonstige',
    startDate:document.getElementById('ss-o-start')?.value,
    endDate:document.getElementById('ss-o-end')?.value,
    weekdays:[...ssSelectedWd],
    customDates:[],
    hasOutbound:document.getElementById('ss-o-out')?.value!=='0',
    hasReturn:document.getElementById('ss-o-ret')?.value!=='0',
    outboundTime:document.getElementById('ss-o-tout')?.value||'08:00',
    returnTime:document.getElementById('ss-o-tret')?.value||'14:00',
    pickupAddress:ssCustAddr(cust),
    destinationAddress:cust?.excelDest||cust?.stammHosp||'',
    kmOneWay:document.getElementById('ss-o-km')?.value||cust?.excelKm||'',
    priceOneWay:document.getElementById('ss-o-price')?.value||cust?.excelPrice||'',
    status:'draft',
    notes:document.getElementById('ss-o-note')?.value||'',
    createdAt:Date.now(),
    updatedAt:Date.now()
  };
  recurringOrders.push(order);
  ssSave();
  const preview=ssGeneratePreview(order.id);
  if(typeof toast==='function') toast('Vorschau erzeugt – bitte prüfen','ok');
  ssPreviewId=preview?.id;
  ssSwitchView('series-preview');
}
function ssShowOrderPreview(orderId){
  const p=seriesPreviews.find(x=>x.recurringOrderId===orderId&&x.status==='preview')||seriesPreviews.find(x=>x.recurringOrderId===orderId);
  if(p){ssPreviewId=p.id;ssSwitchView('series-preview');}
  else{
    ssGeneratePreview(orderId);
    ssSwitchView('series-preview');
  }
}
function ssRenderPreview(){
  const el=document.getElementById('ss-preview-body');
  if(!el) return;
  const previews=seriesPreviews.filter(p=>p.status==='preview');
  if(!previews.length){
    el.innerHTML='<div class="ss-empty">Keine offenen Vorschauen – Serienauftrag erstellen oder Listenimport nutzen.</div>';
    return;
  }
  const active=previews.find(p=>p.id===ssPreviewId)||previews[0];
  ssPreviewId=active.id;
  const cust=(typeof customers!=='undefined'?customers:[]).find(c=>c.id===active.customerId);
  const order=recurringOrders.find(o=>o.id===active.recurringOrderId);
  const st=active.stats||{};
  el.innerHTML=`
    <div class="ss-toolbar"><h2>🔍 Prüfliste (Serien-Vorschau)</h2></div>
    <div class="ss-panel">
      <div class="ss-list-card-head">
        <div><b>${escAttr(ssCustName(cust))}</b> · ${active.month} · <span class="${ssIsKts(active.orderType)?'ss-type-kts':'ss-type-re'}">${ssIsKts(active.orderType)?'Krankenfahrt':'Rechnungsfahrt'}</span></div>
        <span class="ss-status preview">${CHECK_STATUS.preview}</span>
      </div>
      <div class="ss-summary-box">
        <div>Fahrtage<b>${st.totalDays||0}</b></div>
        <div>Einfache Fahrten<b>${st.totalSingleTrips||0}</b></div>
        <div>${ssIsKts(active.orderType)?'Gesamt-km':'Gesamtpreis'}<b>${ssIsKts(active.orderType)?(st.totalKm||0)+' km':(st.totalPrice||0).toFixed(2)+' €'}</b></div>
        <div>Hin/Rück<b>${order?.hasOutbound?'Hin':''}${order?.hasOutbound&&order?.hasReturn?' + ':''}${order?.hasReturn?'Rück':''}</b></div>
      </div>
      ${active.issues?.length?`<div class="ss-warn-list" style="margin-bottom:10px">${active.issues.map(i=>`<div class="ss-warn-item">${escAttr(i)}</div>`).join('')}</div>`:''}
      <div style="overflow:auto;max-height:340px">
        <table class="ss-preview-table">
          <thead><tr><th>Datum</th><th>Tag</th><th>Hin</th><th>Rück</th><th>${ssIsKts(active.orderType)?'km':'Preis'}</th><th>Hinweise</th></tr></thead>
          <tbody>${(active.trips||[]).map(t=>`<tr class="${t.flags?.length?'flag-warn':''}"><td>${ssFmtDate(t.date)}</td><td>${t.weekday}</td><td>${t.outbound?'✓':''}</td><td>${t.returnTrip?'✓':''}</td><td>${ssIsKts(active.orderType)?t.kmOneWay:t.priceOneWay}</td><td>${(t.flags||[]).join(', ')}</td></tr>`).join('')}</tbody>
        </table>
      </div>
      <div class="ss-actions">
        <button class="tb-btn primary" type="button" onclick="ssApprovePreview('${active.id}')">✅ Freigeben</button>
        <button class="tb-btn" type="button" onclick="ssRejectPreview('${active.id}');ssRenderPreview()">✕ Verwerfen</button>
        ${previews.length>1?`<select onchange="ssPreviewId=this.value;ssRenderPreview()" style="margin-left:auto">${previews.map(p=>{const c2=(typeof customers!=='undefined'?customers:[]).find(x=>x.id===p.customerId);return `<option value="${p.id}" ${p.id===active.id?'selected':''}>${escAttr(ssCustName(c2))} ${p.month}</option>`;}).join('')}</select>`:''}
      </div>
    </div>`;
}
function ssRenderImport(){
  const el=document.getElementById('ss-import-body');
  if(!el) return;
  el.innerHTML=`
    <div class="ss-toolbar"><h2>📋 Listenimport</h2></div>
    <div class="ss-panel">
      <p style="font-size:12px;color:var(--text2);line-height:1.6;margin:0 0 10px">Text einfügen – die App erzeugt daraus eine strukturierte Prüfliste. Beispiel:<br><em>Kunde: Hermann Müller, Gartenstraße 10<br>Ziel: UKB Bonn · Krankenfahrt · Mo/Mi/Fr im Juli · Hin und Rück · Kilometer: 28 km</em></p>
      <textarea class="ss-import-area" id="ss-import-text" placeholder="Kunde A: …&#10;Ziel: …&#10;Krankenfahrt …"></textarea>
      <div class="ss-actions"><button class="tb-btn primary" type="button" onclick="ssRunImport()">🔍 Import analysieren</button></div>
      <div id="ss-import-results" style="margin-top:12px"></div>
    </div>`;
}
function ssRunImport(){
  const text=document.getElementById('ss-import-text')?.value||'';
  const parsed=ssParseListImport(text);
  const box=document.getElementById('ss-import-results');
  if(!box) return;
  if(!parsed.length){box.innerHTML='<div class="ss-empty">Kein Import erkannt – Format prüfen</div>';return;}
  box.innerHTML=parsed.map(item=>`
    <div class="ss-list-card">
      <div class="ss-list-card-head"><b>${escAttr(item.parsed.customerName)}</b><span class="${ssIsKts(item.parsed.orderType)?'ss-type-kts':'ss-type-re'}">${ssIsKts(item.parsed.orderType)?'KTS':'RE'}</span></div>
      <div class="ss-list-card-meta">${escAttr(item.parsed.destinationAddress)} · ${item.parsed.weekdays.map(d=>WD_LABELS[d]).join(', ')} · ${ssFmtDate(item.parsed.startDate)}–${ssFmtDate(item.parsed.endDate)}${item.parsed.kmOneWay?' · '+item.parsed.kmOneWay+' km':''}${item.parsed.priceOneWay?' · '+item.parsed.priceOneWay+' €':''}</div>
      ${item.issues.length?`<div class="ss-warn-list" style="margin-top:8px">${item.issues.map(i=>`<div class="ss-warn-item">${escAttr(i)}</div>`).join('')}</div>`:''}
      <div class="ss-actions"><button class="tb-btn primary btn-sm" type="button" onclick='ssImportItem(${JSON.stringify(item.id)})'>Vorschau erzeugen</button></div>
    </div>`).join('');
  window.__ssImportCache=parsed;
}
function ssImportItem(id){
  const item=(window.__ssImportCache||[]).find(x=>x.id===id);
  if(!item) return;
  const preview=ssCreateOrderFromImport(item);
  if(preview){ssPreviewId=preview.id;ssSwitchView('series-preview');}
}
function ssRenderMonthlyList(){
  const el=document.getElementById('ss-monthly-body');
  if(!el) return;
  const month=document.getElementById('ss-month-filter')?.value||new Date().toISOString().slice(0,7);
  const list=monthlySummaries.filter(s=>!month||s.month===month);
  el.innerHTML=`
    <div class="ss-toolbar">
      <h2>📅 Monats-Auftragsliste</h2>
      <input type="month" id="ss-month-filter" value="${month}" onchange="ssRenderMonthlyList()"/>
    </div>
    ${list.length?list.map(s=>{
      const c=(typeof customers!=='undefined'?customers:[]).find(x=>x.id===s.customerId);
      const typeCls=ssIsKts(s.orderType)?'ss-type-kts':'ss-type-re';
      return `<div class="ss-list-card" onclick="ssOpenMonthDetail('${s.id}')">
        <div class="ss-list-card-head"><b class="${typeCls}">${escAttr(ssCustName(c))}</b><span class="ss-status ${s.checkStatus||'draft'}">${CHECK_STATUS[s.checkStatus]||s.checkStatus||'Entwurf'}</span></div>
        <div class="ss-list-card-meta">${s.month} · ${s.totalDays||0} Tage · ${s.totalSingleTrips||0} einfache Fahrten · ${ssIsKts(s.orderType)?(s.totalKm||0)+' km gesamt':(s.totalPrice||0).toFixed(2)+' € gesamt'}</div>
      </div>`;
    }).join(''):'<div class="ss-empty">Keine Monatslisten für diesen Zeitraum</div>'}`;
}
function ssOpenMonthDetail(summaryId){
  const s=monthlySummaries.find(x=>x.id===summaryId);
  if(!s) return;
  const c=(typeof customers!=='undefined'?customers:[]).find(x=>x.id===s.customerId);
  const trips=(typeof rides!=='undefined'?rides:[]).filter(r=>r.customerId===s.customerId&&r.date?.startsWith(s.month));
  const el=document.getElementById('ss-monthly-body');
  if(!el) return;
  el.innerHTML=`
    <div class="ss-toolbar"><h2>📋 ${escAttr(ssCustName(c))} · ${s.month}</h2><button class="tb-btn" type="button" onclick="ssRenderMonthlyList()">← Zurück</button></div>
    <div class="ss-panel">
      <div class="ss-summary-box">
        <div>Fahrtage<b>${s.totalDays||0}</b></div>
        <div>Einfache Fahrten<b>${s.totalSingleTrips||0}</b></div>
        <div>Gesamt<b>${ssIsKts(s.orderType)?(s.totalKm||0)+' km':(s.totalPrice||0).toFixed(2)+' €'}</b></div>
      </div>
      <div style="overflow:auto;max-height:360px">
        <table class="ss-preview-table">
          <thead><tr><th>Datum</th><th>Zeit</th><th>Von</th><th>Nach</th><th>km/€</th><th>Status</th></tr></thead>
          <tbody>${trips.map(t=>`<tr><td>${ssFmtDate(t.date)}</td><td>${t.time||''}</td><td>${escAttr(t.from||'')}</td><td>${escAttr(t.to||'')}</td><td>${ssIsRe(t.type)?(t.amount||t.betrag||''):t.km||''}</td><td>${t.reviewStatus||'–'}</td></tr>`).join('')}</tbody>
        </table>
      </div>
      <div class="ss-actions">
        <button class="tb-btn primary" type="button" onclick="ssPrintSignatureSheet('${s.customerId}','${s.month}')">✍️ Unterschriftszettel</button>
        ${typeof exportReviewPdf==='function'?`<button class="tb-btn" type="button" onclick="exportReviewPdf(customers.find(c=>c.id==='${s.customerId}'),'${s.month}')">📄 PDF Export</button>`:''}
      </div>
    </div>`;
}
function ssPrintSignatureSheet(custId,month){
  const c=(typeof customers!=='undefined'?customers:[]).find(x=>x.id===custId);
  if(!c){if(typeof toast==='function') toast('Kunde nicht gefunden','warn');return;}
  const isRe=c.type==='re'||c.excelType==='rechn';
  const trips=(typeof rides!=='undefined'?rides:[]).filter(r=>r.customerId===custId&&r.date?.startsWith(month)).sort((a,b)=>(a.date||'').localeCompare(b.date||''));
  if(!trips.length){if(typeof toast==='function') toast('Keine Fahrten im Monat','warn');return;}
  const km=parseFloat(c.excelKm||trips[0]?.km)||0;
  const price=parseFloat(c.excelPrice||trips[0]?.amount||trips[0]?.betrag)||0;
  const days=new Set(trips.map(t=>t.date)).size;
  const singles=trips.length;
  const totalKm=singles*km;
  const totalPrice=singles*price;
  const addr=ssCustAddr(c);
  const dest=c.excelDest||c.stammHosp||trips[0]?.to||'';
  const rows=trips.map((t,i)=>`<tr><td>${i+1}</td><td>${ssFmtDate(t.date)}</td><td>${t.time||''}</td><td>${t.excelDir==='hin'||t.excelDir==='hin-rueck'?'✓':''}</td><td>${t.excelDir==='rueck'||t.excelDir==='hin-rueck'?'✓':''}</td><td>${isRe?price:km}</td><td style="height:28px;border-bottom:1px dotted #999"></td></tr>`).join('');
  const w=window.open('','_blank');
  w.document.write(`<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><title>Unterschriftszettel ${escAttr(ssCustName(c))} ${month}</title>
<style>@page{margin:14mm}body{font-family:Arial,sans-serif;font-size:11px;padding:16px;color:#111}h1{font-size:16px;margin:0 0 4px}.sub{font-size:12px;margin-bottom:12px}table{width:100%;border-collapse:collapse;margin-top:10px}th,td{border:1px solid #333;padding:5px 6px;text-align:left}th{background:#eee;font-size:10px}.sum{margin-top:14px;font-size:12px;line-height:1.6}.sig{margin-top:24px;display:grid;grid-template-columns:1fr 1fr;gap:24px}.sigbox{border-top:1px solid #111;padding-top:6px;font-size:10px}</style></head><body>
<h1>${isRe?'Unterschriftszettel Rechnungsfahrten':'Unterschriftszettel Krankenfahrten (KTS)'}</h1>
<div class="sub"><strong>${escAttr(ssCustName(c))}</strong>${isRe&&c.org?` · Rechnungsempfänger: ${escAttr(c.org)}`:''} · Monat: ${month}<br>Abholadresse: ${escAttr(addr)} · Ziel: ${escAttr(dest)} · Strecke: ${escAttr(addr)} → ${escAttr(dest)}</div>
<table><thead><tr><th>Nr</th><th>Datum</th><th>Zeit</th><th>Hin</th><th>Rück</th><th>${isRe?'Preis €':'km'}</th><th>Unterschrift</th></tr></thead><tbody>${rows}</tbody></table>
<div class="sum"><strong>Zusammenfassung:</strong> ${days} Fahrtage · ${singles} einfache Fahrten · ${isRe?'Gesamtbetrag: '+totalPrice.toFixed(2)+' €':'Gesamtkilometer: '+totalKm+' km'}${!isRe&&c.zuzahlungStatus?'<br>Zuzahlung: '+escAttr(c.zuzahlungStatus):''}</div>
<div class="sig"><div class="sigbox">Unterschrift Patient/Kunde</div><div class="sigbox">Datum / Stempel</div></div>
<p style="font-size:9px;color:#666;margin-top:20px">TaxiPro Meckenheim · erstellt ${new Date().toLocaleString('de-DE')}</p></body></html>`);
  w.document.close();
  setTimeout(()=>w.print(),500);
}
function ssRenderSignatures(){
  const el=document.getElementById('ss-signatures-body');
  if(!el) return;
  const month=new Date().toISOString().slice(0,7);
  const summaries=monthlySummaries.filter(s=>s.month===month);
  el.innerHTML=`
    <div class="ss-toolbar"><h2>✍️ Unterschriftszettel</h2></div>
    <div class="ss-panel">
      <p style="font-size:12px;color:var(--text2);margin:0 0 12px">Getrennte Vorlagen für Krankenfahrten (KTS) und Rechnungsfahrten (RE). Monatsdaten werden automatisch eingefügt.</p>
      ${summaries.length?summaries.map(s=>{
        const c=(typeof customers!=='undefined'?customers:[]).find(x=>x.id===s.customerId);
        return `<div class="ss-list-card">
          <div class="ss-list-card-head"><b class="${ssIsKts(s.orderType)?'ss-type-kts':'ss-type-re'}">${escAttr(ssCustName(c))}</b><span>${s.month}</span></div>
          <div class="ss-list-card-meta">${s.totalDays||0} Tage · ${ssIsKts(s.orderType)?(s.totalKm||0)+' km':(s.totalPrice||0).toFixed(2)+' €'}</div>
          <div class="ss-actions"><button class="tb-btn primary btn-sm" type="button" onclick="ssPrintSignatureSheet('${s.customerId}','${s.month}')">🖨️ Drucken</button></div>
        </div>`;
      }).join(''):'<div class="ss-empty">Noch keine freigegebenen Monatslisten – zuerst Serienauftrag freigeben.</div>'}
    </div>`;
}
function ssOnView(v){
  if(v==='dashboard') ssRenderDashboard();
  if(v==='series-orders') ssRenderSeriesOrders();
  if(v==='series-preview') ssRenderPreview();
  if(v==='series-import') ssRenderImport();
  if(v==='monthly-list') ssRenderMonthlyList();
  if(v==='signatures') ssRenderSignatures();
}

ssLoad();

window.ssSwitchView=ssSwitchView;
window.ssToggleWd=ssToggleWd;
window.ssResetOrderForm=ssResetOrderForm;
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
window.ssRenderDashboard=ssRenderDashboard;
window.ssRenderSeriesOrders=ssRenderSeriesOrders;
window.ssRenderPreview=ssRenderPreview;
window.ssRenderImport=ssRenderImport;
window.ssRenderSignatures=ssRenderSignatures;
window.ssLoad=ssLoad;

if(typeof document!=='undefined'){
  document.addEventListener('DOMContentLoaded',()=>{ssLoad();});
}
})();
