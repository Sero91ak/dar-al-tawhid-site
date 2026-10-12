/* KIDS_IPAD_REVIEW_ONLY_V1
 * Independent temporary QA endpoint. Never bound to dar-al-tawhid.de,
 * adult test, real children, paid APIs or creator-only endpoints.
 */
const ROBOTS="noindex, nofollow, noarchive";
function denied(msg,status=404){
  return new Response(msg,{status,headers:{"Content-Type":"text/plain; charset=utf-8",
  "Cache-Control":"no-store","X-Robots-Tag":ROBOTS,
  "X-Content-Type-Options":"nosniff","X-Frame-Options":"DENY"}});
}
export default {
 async fetch(request,env){
  const u=new URL(request.url),path=u.pathname;
  if(!["GET","HEAD"].includes(request.method))return denied("Read-only preview",405);
  if(path==="/"||path==="/kids"||path==="/kids/"){
    return Response.redirect(new URL("/kids/start",u),302);
  }
  // Cloudflare Assets resolves /kids/start to start.html automatically.
  // Never redirect /kids/start back to /kids/start.html (would loop 307/302).
  if(path.includes("\\")||/%(?:2f|5c|00)/i.test(path)||/\.\./.test(path))return denied("Invalid URL",400);
  const allowed=path.startsWith("/kids/") ||
    /^\/desktop-preview\/assets\/kids-academy-[\w-]+\.(?:jpg|jpeg|png|webp|svg)$/i.test(path);
  if(!allowed)return denied("Only Kids layout review assets are available");
  if(/^\/kids\/(?:tools|creator-test|ipad-review|api)(?:\/|$)/i.test(path)||
     /^\/kids\/akademie\/stimmen-test-v14\.html$/i.test(path))return denied("QA source/private tools are not public");
  const res=await env.ASSETS.fetch(request);
  const h=new Headers(res.headers);
  h.set("X-Robots-Tag",ROBOTS);
  h.set("X-Content-Type-Options","nosniff");
  h.set("X-Frame-Options","DENY");
  h.set("Referrer-Policy","same-origin");
  h.set("Cache-Control","private, no-store, max-age=0");
  h.set("CDN-Cache-Control","no-store");
  return new Response(request.method==="HEAD"?null:res.body,{status:res.status,statusText:res.statusText,headers:h});
 }
};
