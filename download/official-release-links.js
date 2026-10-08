/* DAR AL TAWḤĪD · Official Android release link switchboard.
 * Only the official public non-prerelease GitHub Release can enable APK links.
 * Draft / no APK / missing checksum => visitors remain on the installation guide.
 */
(function(){
  "use strict";
  const OWNER="Sero91ak";
  const REPO="dar-al-tawhid-site";
  const BASE="https://github.com/"+OWNER+"/"+REPO+"/releases/download/";
  const API="https://api.github.com/repos/"+OWNER+"/"+REPO+"/releases?per_page=20";
  const EXPECTED={adult:"dar-al-tawhid-android.apk",tv:"dar-al-tawhid-tv.apk"};
  const REGEX=/^android-website-v1\.[0-9]+$/;
  const HEX=/^sha256:[a-f0-9]{64}$/i;
  function verifiedAsset(release,name){
    if(!release||release.draft||release.prerelease||!REGEX.test(release.tag_name||""))return null;
    const asset=(release.assets||[]).find(a=>a&&a.name===name);
    if(!asset||asset.state!=="uploaded"||asset.size<10000)return null;
    if(!HEX.test(asset.digest||""))return null;
    const expected=BASE+encodeURIComponent(release.tag_name)+"/"+name;
    if(asset.browser_download_url!==expected)return null;
    return {href:expected,version:release.tag_name,digest:asset.digest};
  }
  function updateLink(key,asset){
    const link=document.getElementById(key==="adult"?"direct-android-apk":"direct-android-tv-apk");
    const label=document.getElementById(key==="adult"?"direct-android-label":"direct-android-tv-label");
    if(!link||!label)return;
    link.href=asset.href;
    link.rel="noopener noreferrer";
    link.setAttribute("aria-label",(key==="adult"?"Android-App":"Android-TV-App")+" herunterladen");
    label.textContent=key==="adult"?"DAR AL TAWḤĪD · APK laden":"DAR AL TAWḤĪD TV · APK laden";
  }
  function updateDownloadPage(key,asset){
    const button=document.getElementById("apk-"+key);
    const pending=document.getElementById("pending-"+key);
    const status=document.getElementById("status-"+key);
    if(!button||!pending||!status)return;
    button.href=asset.href;
    button.rel="noopener noreferrer";
    button.removeAttribute("download"); // download attribute does not apply across domains
    button.hidden=false;
    pending.hidden=true;
    status.classList.add("ready");
    const label=status.querySelector("span:last-child");
    if(label)label.textContent="Geprüfte Release-Datei · "+asset.version;
  }
  async function activate(){
    try{
      const response=await fetch(API,{headers:{"Accept":"application/vnd.github+json"},cache:"default",credentials:"omit"});
      if(!response.ok)return;
      const releases=await response.json();
      if(!Array.isArray(releases))return;
      const r=releases.find(x=>x&&!x.draft&&!x.prerelease&&REGEX.test(x.tag_name||""));
      if(!r)return;
      // The release contains both separate signed packages. Missing any package keeps both inactive.
      const adult=verifiedAsset(r,EXPECTED.adult);
      const tv=verifiedAsset(r,EXPECTED.tv);
      if(!adult||!tv)return;
      updateLink("adult",adult);
      updateLink("tv",tv);
      updateDownloadPage("adult",adult);
      updateDownloadPage("tv",tv);
    }catch(_){
      // Fail closed: a missing API response must never expose a dead or unverified APK.
    }
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",activate,{once:true});
  else activate();
})();
