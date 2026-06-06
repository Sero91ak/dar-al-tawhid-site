#!/usr/bin/env node
/* DAR AL TAWḤID – tägliche OneSignal-Gebetszeiten-Automatisierung
   Läuft über GitHub Actions und plant die Pushs für den nächsten lokalen Tag. */

const APP_ID = process.env.ONESIGNAL_APP_ID || "786d7cd6-0455-4434-ab14-0c10a7bc6b1e";
const API_KEY = process.env.ONESIGNAL_APP_API_KEY;
const SITE_URL = process.env.SITE_URL || "https://dar-al-tawhid.de/#prayer";
const CITY = process.env.PRAYER_CITY || "Rheinbach";
const CITY_SLUG = process.env.PRAYER_CITY_SLUG || slug(CITY);
const LAT = Number(process.env.PRAYER_LAT || "50.62562");
const LON = Number(process.env.PRAYER_LON || "6.94911");
const ASR_FACTOR = Number(process.env.PRAYER_ASR_FACTOR || "1");
const ANGLE = Number(process.env.PRAYER_ANGLE || "12");

if(!API_KEY){
  console.error("Fehlt: GitHub Secret ONESIGNAL_APP_API_KEY");
  process.exit(1);
}

function slug(value){return String(value||"ort").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"") || "ort";}
function toRad(d){return d*Math.PI/180}
function toDeg(r){return r*180/Math.PI}
function fixAngle(a){return ((a%360)+360)%360}
function fixHour(h){return ((h%24)+24)%24}
function dayOfYear(date){const start=new Date(date.getFullYear(),0,0);return Math.floor((date-start)/86400000)}
function sunTimeForAngle(date,lat,lon,angle,morning){
  const N=dayOfYear(date);const lngHour=lon/15;const t=N+(((morning?6:18)-lngHour)/24);
  const M=(0.9856*t)-3.289;
  let L=M+(1.916*Math.sin(toRad(M)))+(0.020*Math.sin(toRad(2*M)))+282.634;L=fixAngle(L);
  let RA=toDeg(Math.atan(0.91764*Math.tan(toRad(L))));RA=fixAngle(RA);
  const Lquadrant=Math.floor(L/90)*90;const RAquadrant=Math.floor(RA/90)*90;RA=(RA+(Lquadrant-RAquadrant))/15;
  const sinDec=0.39782*Math.sin(toRad(L));const cosDec=Math.cos(Math.asin(sinDec));
  const zenith=90+angle;let cosH=(Math.cos(toRad(zenith))-(sinDec*Math.sin(toRad(lat))))/(cosDec*Math.cos(toRad(lat)));
  if(cosH>1||cosH<-1)return null;
  let H=morning?360-toDeg(Math.acos(cosH)):toDeg(Math.acos(cosH));H=H/15;
  const T=H+RA-(0.06571*t)-6.622;const UT=T-lngHour;const tz=-date.getTimezoneOffset()/60;
  return fixHour(UT+tz);
}
function solarNoon(date,lat,lon){const sunrise=sunTimeForAngle(date,lat,lon,0.833,true);const sunset=sunTimeForAngle(date,lat,lon,0.833,false);if(sunrise==null||sunset==null)return 12;return fixHour((sunrise+sunset)/2)}
function declinationApprox(date){const N=dayOfYear(date);return 23.45*Math.sin(toRad((360/365)*(284+N)))}
function asrTime(date,lat,lon,factor){
  const noon=solarNoon(date,lat,lon);const dec=declinationApprox(date);const angle=toDeg(Math.atan(1/(factor+Math.tan(toRad(Math.abs(lat-dec))))));
  const cosH=(Math.sin(toRad(angle))-Math.sin(toRad(lat))*Math.sin(toRad(dec)))/(Math.cos(toRad(lat))*Math.cos(toRad(dec)));
  if(cosH>1||cosH<-1)return noon+4;
  const H=toDeg(Math.acos(cosH))/15;return fixHour(noon+H);
}
function formatHour(h){const hh=Math.floor(fixHour(h));const mm=Math.round((fixHour(h)-hh)*60);const add=mm>=60?1:0;return `${String((hh+add)%24).padStart(2,"0")}:${String(mm>=60?0:mm).padStart(2,"0")}`}
function dateFromHour(base,h){const d=new Date(base);d.setHours(0,0,0,0);d.setMinutes(Math.round(fixHour(h)*60));return d}
function nextLocalDate(){const d=new Date();d.setDate(d.getDate()+1);d.setHours(0,0,0,0);return d;}
function calculate(date){
  const fajr=sunTimeForAngle(date,LAT,LON,ANGLE,true);const sunrise=sunTimeForAngle(date,LAT,LON,0.833,true);const dhuhr=solarNoon(date,LAT,LON);const asr=asrTime(date,LAT,LON,ASR_FACTOR);const maghrib=sunTimeForAngle(date,LAT,LON,0.833,false);const isha=sunTimeForAngle(date,LAT,LON,ANGLE,false);
  return [
    {key:"fajr",name:"Fajr",time:fajr},
    {key:"dhuhr",name:"Dhuhr",time:dhuhr},
    {key:"asr",name:"ʿAṣr",time:asr},
    {key:"maghrib",name:"Maghrib",time:maghrib},
    {key:"isha",name:"ʿIshāʾ",time:isha}
  ];
}
async function sendOneSignal(prayer, sendAfter){
  const body = {
    app_id: APP_ID,
    target_channel: "push",
    filters: [
      {field:"tag", key:"prayer_notifications", relation:"=", value:"true"},
      {operator:"AND"},
      {field:"tag", key:"prayer_city_slug", relation:"=", value:CITY_SLUG},
      {operator:"AND"},
      {field:"tag", key:"prayer_method", relation:"=", value:"12deg"}
    ],
    headings: {de:`Gebetszeit: ${prayer.name}`, en:`Prayer time: ${prayer.name}`},
    contents: {de:`${prayer.name} ist eingetreten. DAR AL TAWḤID`, en:`${prayer.name} time has entered. DAR AL TAWḤID`},
    url: SITE_URL,
    isAnyWeb: true,
    send_after: sendAfter.toISOString()
  };
  const res = await fetch("https://api.onesignal.com/notifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Authorization": `key ${API_KEY}`
    },
    body: JSON.stringify(body)
  });
  const text = await res.text();
  if(!res.ok){
    console.error(`OneSignal Fehler ${res.status}:`, text);
    process.exitCode = 1;
    return;
  }
  console.log(`Geplant: ${prayer.name} ${formatHour(prayer.time)} ${CITY} -> ${text}`);
}

(async function main(){
  const day = nextLocalDate();
  console.log(`Plane Gebetszeiten für ${CITY} (${CITY_SLUG}) am ${day.toDateString()}`);
  for(const prayer of calculate(day)){
    if(prayer.time == null) continue;
    await sendOneSignal(prayer, dateFromHour(day, prayer.time));
  }
})();
