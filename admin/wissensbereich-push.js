/* DAR Admin · Wissensbereich Themen · scoped notification routing preview.
   NO API keys, no subscriptions, no OneSignal send, no publication.
   Global posts retain existing pipeline; targeted delivery is fail-closed. */
(function(global){
 "use strict";
 if(global.DARWissensbereichPushAdmin)return;
 const MATRIX=Object.freeze({
  global:{woman:true,man:true,neutral:true},
  knowledge_woman:{woman:true,man:false,neutral:false},
  knowledge_man:{woman:false,man:true,neutral:false}
 });
 const LABEL={woman:"Frauenprofil",man:"Männerprofil",neutral:"Neutral"};
 const TYPE={global:"Allgemeiner Beitrag",knowledge_woman:"Wissensbereich Frauen",knowledge_man:"Wissensbereich Männer"};
 function assess({type,profile,globalOptIn=false,knowledgeOptIn=false,segmentVerified=false,authorized=false}={}){
  const t=Object.prototype.hasOwnProperty.call(MATRIX,type)?type:"invalid";
  const g=Object.prototype.hasOwnProperty.call(LABEL,profile)?profile:"unknown";
  if(t==="invalid"||g==="unknown")return {eligible:false,reason:"Unbekannte Zielgruppe oder Profil – gesperrt"};
  if(!MATRIX[t][g])return {eligible:false,reason:"Profil gehört nicht zu dieser Zielgruppe"};
  if(t==="global")return {eligible:globalOptIn===true,reason:globalOptIn===true?"Bestehende globale Push-Regel (unverändert)":"Keine Einwilligung für globale Benachrichtigungen"};
  if(knowledgeOptIn!==true)return {eligible:false,reason:"Keine ausdrückliche Einwilligung für Wissensbereich-Benachrichtigungen"};
  if(segmentVerified!==true)return {eligible:false,reason:"Profilsegment auf dem Empfängergerät nicht serverseitig verifiziert"};
  if(authorized!==true)return {eligible:false,reason:"Gesonderte OneSignal-/Spur-Freigabe fehlt"};
  return {eligible:true,reason:"Nur für nachweislich abonnierte, exakt passende Empfänger; Auslieferung separat freigeben"};
 }
 function render(){
  const lines=[
   ["global","Allgemeine Beiträge","✓","✓","✓"],
   ["knowledge_woman","Wissensbereich Frauen","✓","–","–"],
   ["knowledge_man","Wissensbereich Männer","–","✓","–"]
  ];
  return '<section class="wkp-admin" aria-label="Wissensbereich Themen Push-Regeln">'+
   '<div class="wkp-heading"><span class="wkp-eyebrow">DĀR AL TAWḤĪD · ZENTRALE</span><h2>Wissensbereich Themen</h2><p>Gezielte Wissensmitteilungen pro freiwillig gewähltem Profil. Die normale globale Beitragsregel bleibt bestehen.</p></div>'+
   '<div class="wkp-panel"><div class="wkp-title"><h3>Empfängerregel</h3><span class="wkp-status">Versand gesperrt</span></div>'+
   '<div class="wkp-scroll"><table><thead><tr><th>Benachrichtigung</th><th>Frau</th><th>Mann</th><th>Neutral</th></tr></thead><tbody>'+
   lines.map(row=>'<tr><th scope="row">'+row[1]+'</th>'+row.slice(2).map(v=>'<td class="'+(v==="✓"?"wkp-yes":"wkp-no")+'">'+v+'</td>').join("")+'</tr>').join("")+
   '</tbody></table></div><p class="wkp-note">✓ nur mit gültiger Zustimmung und Berechtigung. Neutral bleibt von Frauen-/Männer-Wissensmeldungen ausgeschlossen; allgemeine Meldungen bleiben verfügbar.</p></div>'+
   '<div class="wkp-panel"><div class="wkp-title"><h3>Zielgruppenprüfung</h3><span>Ohne tatsächlichen Versand</span></div>'+
   '<div class="wkp-fields"><label>Art der Meldung<select id="wkpType" class="field"><option value="global">Allgemeiner Beitrag</option><option value="knowledge_woman">Wissensbereich Frauen</option><option value="knowledge_man">Wissensbereich Männer</option></select></label>'+
   '<label>Profil des Empfängers<select id="wkpProfile" class="field"><option value="neutral">Neutral</option><option value="woman">Frau</option><option value="man">Mann</option></select></label></div>'+
   '<div class="wkp-checks"><label><input id="wkpGlobalOpt" type="checkbox" checked> Allgemeine Push-Einwilligung</label><label><input id="wkpKnowledgeOpt" type="checkbox"> Wissensbereich-Einwilligung</label></div>'+
   '<div class="wkp-result" role="status" aria-live="polite" id="wkpResult">Zielgruppe wird geprüft.</div>'+
   '<p class="wkp-note">Diese Prüfung ist eine Vorschau. Sie kennt weder fremde Geräteprofile noch aktuelle Empfängerzahlen und kann keinen Versand auslösen.</p></div>'+
   '<div class="wkp-panel"><div class="wkp-title"><h3>Freigabe- und Sicherheitskette</h3><span>Verbindlich</span></div>'+
   '<ol><li>Quellengeprüfter, deduplizierter Inhalt und eindeutige kanonische Beitrags-ID</li>'+
   '<li>Live-Veröffentlichung über den bestehenden DĀR Admin und bestätigte Auslieferung</li>'+
   '<li>Freiwillige Profilwahl und separate Wissensbereich-Push-Einwilligung je Installation</li>'+
   '<li>Verifiziertes OneSignal-Segment <strong>genau einer</strong> Zielgruppe; bei Neutral keine Wissensbereich-Segmente</li>'+
   '<li>Eigenständige Benachrichtigungsfreigabe nach dem bestehenden Push-Lock mit Kennwort und Spurfreigabe</li></ol>'+
   '<p class="wkp-warning"><strong>Kein Fallback auf „Subscribed Users“, „DAR_PUSH“ oder „alle“ bei Wissensbereich-Meldungen.</strong> Fehlt ein Profilsegment, eine Einwilligung oder Freigabe, ist der Versand blockiert. Globale Beitragsmeldungen werden nicht geändert.</p></div>'+
   '</section>';
 }
 function bind(){
  const root=document.querySelector(".wkp-admin");if(!root)return;
  const ids=["wkpType","wkpProfile","wkpGlobalOpt","wkpKnowledgeOpt"];
  const el=Object.fromEntries(ids.map(id=>[id,root.querySelector("#"+id)]));
  const update=()=>{
   const type=el.wkpType.value,profile=el.wkpProfile.value;
   const result=assess({type,profile,globalOptIn:el.wkpGlobalOpt.checked,knowledgeOptIn:el.wkpKnowledgeOpt.checked,segmentVerified:false,authorized:false});
   const panel=root.querySelector("#wkpResult");
   panel.textContent=(result.eligible?"Allgemeine Meldung nach bestehender Regel möglich: ":"Für diese Prüfung keine Zielzustellung: ")+result.reason;
   panel.dataset.allowed=result.eligible?"yes":"no";
  };
  ids.forEach(id=>el[id].addEventListener("change",update));update();
 }
 global.DARWissensbereichPushAdmin=Object.freeze({render,bind,assess,MATRIX,VERSION:1});
})(window);
