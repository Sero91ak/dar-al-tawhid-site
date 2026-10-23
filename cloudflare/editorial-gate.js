/* DĀR AL TAWḤĪD · canonical editorial entry.
   The separate /redaktion/ login is retired. The existing DAR Admin
   application owns the editorial workspace under its Social/Redaktion tab. */
const ROOT="/redaktion";
const headers={
 "Cache-Control":"private, no-store, max-age=0",
 "CDN-Cache-Control":"no-store",
 "X-Robots-Tag":"noindex, nofollow, noarchive",
 "X-Content-Type-Options":"nosniff",
 "Referrer-Policy":"no-referrer"
};
export async function editorialOwnerAccess(request,url,env){
 const p=url.pathname;
 if(p!==ROOT&&!p.startsWith(ROOT+"/"))return null;
 if(request.method!=="GET"&&request.method!=="HEAD")
  return new Response("Method Not Allowed",{status:405,headers:{...headers,Allow:"GET, HEAD"}});
 if(p===ROOT||p===ROOT+"/"||p===ROOT+"/index.html")
  return new Response(null,{status:302,headers:{...headers,Location:"/admin/?tab=social"}});
 return new Response("Not Found",{status:404,headers});
}
