#!/usr/bin/env node
/**
 * Q_SOURCE_LIVE_GATE_V1.
 * Production-only HTTP checks after Cloudflare deploy.
 * Never treat a GitHub commit or HTTP 200 showing the app shell as a valid source card.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const list = JSON.parse(await fs.readFile(path.join(root,'q/_registry/shortlinks.json'),'utf8'));
const items = list.links.filter(x=>x.status==='active').map(x=>Number(x.number)).sort((a,b)=>a-b);
const base = process.env.Q_SOURCE_BASE || 'https://dar-al-tawhid.de';
const errors = [];
const sleep = ms => new Promise(ok=>setTimeout(ok,ms));
async function verify(n) {
  const url = base + '/q/' + n + '/';
  for(let attempt=1;attempt<=3;attempt++) {
    try {
      const response = await fetch(url + '?qsource-check=' + Date.now(), {
        headers:{'accept':'text/html','cache-control':'no-cache'},
        redirect:'follow',signal:AbortSignal.timeout(16000)
      });
      const type=response.headers.get('content-type')||'';
      const route=response.headers.get('x-dar-q-route')||'';
      const body=await response.text();
      const actual = new URL(response.url);
      const good = response.status===200 && /text\/html/i.test(type) &&
        actual.pathname==='/q/'+n+'/' &&
        /<body\b[^>]*\bqsource-body\b/i.test(body) &&
        /class\s*=\s*['"][^'"]*\bqsource-page\b/i.test(body) &&
        /class\s*=\s*['"][^'"]*\bqsource-links\b/i.test(body) &&
        /<a\b[^>]*\bqsource-link\b/i.test(body) &&
        body.includes('/q/'+n+'/') &&
        !/Quellenbeleg nicht gefunden|Quellen-Routingfehler/.test(body) &&
        body.length>1400 && route==='direct-static-asset-v2';
      if(good) { console.log('Q'+n+' live OK ('+body.length+' Bytes, '+route+')'); return; }
      if(attempt===3) {
        errors.push('Q'+n+': HTTP '+response.status+', '+type+', route='+route+', path='+actual.pathname+
          ', html='+body.length+' bytes; source-card='+(/qsource-links/.test(body)));
        return;
      }
    } catch(err) {
      if(attempt===3){errors.push('Q'+n+': '+String(err?.message||err));return;}
    }
    await sleep(attempt*1200);
  }
}
let index=0;
async function worker(){
  while(index<items.length){const n=items[index++];await verify(n);}
}
await Promise.all(Array.from({length:6},()=>worker()));
for(const e of errors)console.error('::error::'+e);
if(errors.length){
  console.error('Q source LIVE GATE FAILED: '+errors.length+' / '+items.length+
    ' sources; do NOT send new post push until verified.');
  process.exit(1);
}
console.log('Q source LIVE GATE OK: '+items.length+' numbered source pages publicly serve independent HTML evidence.');
