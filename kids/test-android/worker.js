/* DĀR AL TAWḤĪD KIDS TEST — Android/iOS/browser preview ONLY.
 * Source: kids-test-staging branch. Separate workers.dev hostname.
 * No dar-al-tawhid.de route, app store update, or production publishing.
 * Requests with side effects are rejected; beta routes are never indexed.
 */
const ROBOTS="noindex, nofollow, noarchive";
const BASE_HEADERS={"Cache-Control":"no-store, max-age=0","X-Robots-Tag":ROBOTS,"X-Content-Type-Options":"nosniff","Referrer-Policy":"same-origin","X-Kids-Environment":"test"};
function reply(body,status=200,type="text/plain; charset=utf-8",method="GET"){
 return new Response(method==="HEAD"?null:body,{status,headers:{"Content-Type":type,...BASE_HEADERS}});
}
const manifest={
 name:"DĀR AL TAWḤĪD KIDS TEST",
 short_name:"KIDS TEST",
 description:"Isolierte Android-Test-Web-App für DĀR AL TAWḤĪD KIDS – keine Besucher-Version",
 id:"/kids/test-android-app",
 start_url:"/kids/start.html?env=kids-test",
 scope:"/kids/",
 display:"standalone",
 background_color:"#092736",
 theme_color:"#092736",
 orientation:"portrait-primary",
 icons:[
  {src:"/kids/icons/icon-192.png?v=logo28",sizes:"192x192",type:"image/png",purpose:"any"},
  {src:"/kids/icons/icon-512.png?v=logo28",sizes:"512x512",type:"image/png",purpose:"any maskable"}
 ]
};
export default {
 async fetch(request,env){
  const url=new URL(request.url),path=url.pathname,method=request.method;
  if(method!=="GET"&&method!=="HEAD")return reply("KIDS TEST: Schreibzugriffe gesperrt",405,"text/plain; charset=utf-8",method);
  if(path.includes("\\")||/%(?:2f|5c|00)/i.test(path))return reply("Ungültiger Pfad",400,"text/plain; charset=utf-8",method);
  if(path==="/"||path==="/kids/test"){
   const dest=new URL("/kids/test-install.html",url);
   return Response.redirect(dest.toString(),302);
  }
  if(path==="/kids"||path==="/kids/"){
   return Response.redirect(new URL("/kids/start",url).toString(),302);
  }
  if(path==="/kids/manifest.webmanifest"){
   return reply(JSON.stringify(manifest),200,"application/manifest+json; charset=utf-8",method);
  }
  if(!path.startsWith("/kids/"))return reply("Nur KIDS-TEST-Dateien",404,"text/plain; charset=utf-8",method);
  if(/^\/kids\/(?:test-android|creator-test|tools)(?:\/|$)/i.test(path)
    ||/^\/kids\/api\//i.test(path))return reply("KIDS TEST: Funktion nicht freigegeben",404,"text/plain; charset=utf-8",method);
  // Cloudflare's pretty-URL canonicalization redirects /kids/start.html to
  // /kids/start. Never redirect the latter back to .html: that causes loops.
  // Resolve the canonical asset inside this Worker, mirroring the visitor's
  // guarded asset resolution, while retaining this staging-only hostname.
  let asset=null;
  const pretty=path.match(/^\/kids\/(start|index|shell)(?:\.html)?\/?$/);
  if(pretty){
   for(const candidate of ["/kids/"+pretty[1],"/kids/"+pretty[1]+".html"]){
    const dest=new URL(request.url);dest.pathname=candidate;
    const result=await env.ASSETS.fetch(new Request(dest.toString(),request));
    if(result&&result.status===200){asset=result;break;}
   }
   if(!asset)return reply("Kids Test Startseite nicht erreichbar",503,"text/plain; charset=utf-8",method);
  } else {
   asset=await env.ASSETS.fetch(request);
  }
  const headers=new Headers(asset.headers);
  headers.set("X-Kids-Environment","test");
  headers.set("X-Robots-Tag",ROBOTS);
  headers.set("X-Content-Type-Options","nosniff");
  headers.set("Referrer-Policy","same-origin");
  if(/\.(?:html?|js|css|json|webmanifest)$/i.test(path)||asset.status!==200){
   headers.set("Cache-Control","no-store, max-age=0");
   headers.set("CDN-Cache-Control","no-store");
  }
  return new Response(method==="HEAD"?null:asset.body,{status:asset.status,statusText:asset.statusText,headers});
 }
};
