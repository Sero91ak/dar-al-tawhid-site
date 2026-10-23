#!/usr/bin/env node
"use strict";
/* Restricted local studio preview server. Use only inside a private Codespace. */
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname,"..");
const PORT = Number(process.env.PORT || 8765);
const PREFIXES = [
  "/design-studio/","/test/","/assets/","/data/","/content/","/pwa/",
  "/q/","/quelle/","/quellen/","/ios/","/android/","/tv/",
  "/posts.json","/version.json","/manifest.json","/favicon.ico",
  "/app-logo-original.png","/app-share-image.png","/watermark-circle.png",
  "/watermark-my-logo.png","/watermark-my-logo-full.png"
];
const MIME = {
  ".html":"text/html; charset=utf-8",".htm":"text/html; charset=utf-8",
  ".css":"text/css; charset=utf-8",".js":"text/javascript; charset=utf-8",
  ".mjs":"text/javascript; charset=utf-8",".json":"application/json; charset=utf-8",
  ".svg":"image/svg+xml",".png":"image/png",".jpg":"image/jpeg",".jpeg":"image/jpeg",
  ".webp":"image/webp",".gif":"image/gif",".ico":"image/x-icon",
  ".woff":"font/woff",".woff2":"font/woff2",".ttf":"font/ttf",".otf":"font/otf",
  ".mp3":"audio/mpeg",".m4a":"audio/mp4",".mp4":"video/mp4",".webm":"video/webm",
  ".webmanifest":"application/manifest+json",".txt":"text/plain; charset=utf-8",
  ".xml":"application/xml; charset=utf-8"
};

function notFound(res,code=404,message="Nicht gefunden"){
  res.writeHead(code,{"Content-Type":"text/plain; charset=utf-8","Cache-Control":"no-store"});
  res.end(message);
}
const server=http.createServer((req,res)=>{
  if(req.method!=="GET" && req.method!=="HEAD")return notFound(res,405,"Methode nicht erlaubt");
  let pathname;
  try{pathname=decodeURIComponent(new URL(req.url,"http://localhost").pathname);}
  catch(e){return notFound(res,400,"Ungültige URL");}
  if(pathname==="/"){res.writeHead(302,{"Location":"/design-studio/","Cache-Control":"no-store"});return res.end();}
  const segments=pathname.split("/");
  if(segments.some(s=>s===".."||s==="."||s.startsWith(".")))return notFound(res,403,"Pfad gesperrt");
  const allowed=PREFIXES.some(p=>p.endsWith("/")?pathname.startsWith(p):pathname===p);
  if(!allowed)return notFound(res,403,"Nicht im Vorschauzugriff");
  if(pathname.endsWith("/"))pathname+="index.html";
  const file=path.resolve(ROOT,"."+pathname);
  if(!file.startsWith(ROOT+path.sep))return notFound(res,403,"Pfad gesperrt");
  const ext=path.extname(file).toLowerCase();
  if(!MIME[ext])return notFound(res,403,"Dateityp gesperrt");
  fs.stat(file,(err,stat)=>{
    if(err||!stat.isFile())return notFound(res);
    const headers={"Content-Type":MIME[ext],"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"};
    const range=req.headers.range;
    let start=0,end=stat.size-1,status=200;
    if(range){
      const match=/^bytes=(\d*)-(\d*)$/.exec(range);
      if(!match)return notFound(res,416,"Ungültiger Bereich");
      start=match[1]?Number(match[1]):Math.max(0,stat.size-Number(match[2]));
      end=match[1]?(match[2]?Number(match[2]):end):end;
      if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<0||start> end||end>=stat.size){
        res.writeHead(416,{"Content-Range":"bytes */"+stat.size});return res.end();
      }
      status=206;headers["Content-Range"]="bytes "+start+"-"+end+"/"+stat.size;
    }
    headers["Accept-Ranges"]="bytes";
    headers["Content-Length"]=Math.max(0,end-start+1);
    res.writeHead(status,headers);
    if(req.method==="HEAD")return res.end();
    fs.createReadStream(file,{start,end}).on("error",()=>res.destroy()).pipe(res);
  });
});
server.listen(PORT,"0.0.0.0",()=>{
  console.log("DAR Visual Design Studio: http://localhost:"+PORT+"/design-studio/");
  console.log("SICHERHEIT: Codespaces-Port ausschließlich PRIVAT belassen.");
  console.log("Dieser Server ändert und veröffentlicht keine Dateien.");
});
