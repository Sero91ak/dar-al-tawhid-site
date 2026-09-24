const fs=require("fs");
const path=require("path");

const root=path.resolve(__dirname,"..");
const kids=path.join(root,"test","kids");
const pict=/[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}]/gu;
const allowedExt=new Set([".html",".js",".json",".css"]);
const failures=[];

function walk(dir){
  for(const name of fs.readdirSync(dir)){
    const p=path.join(dir,name);
    const st=fs.statSync(p);
    if(st.isDirectory()){ walk(p); continue; }
    if(!allowedExt.has(path.extname(name))) continue;
    const text=fs.readFileSync(p,"utf8");
    const found=[...new Set(text.match(pict)||[])];
    if(found.length) failures.push(path.relative(root,p)+": system emoji/pictograph found: "+found.join(" "));
  }
}
walk(kids);

const indexPath=path.join(kids,"index.html");
const index=fs.readFileSync(indexPath,"utf8");
if(index.includes("kids-icons-v11.svg")) failures.push("test/kids/index.html: legacy sprite reference kids-icons-v11.svg is forbidden");
if(!index.includes("KIDS_REAL_ASSET_ICON_FINAL_V11")) failures.push("test/kids/index.html: real-asset icon system marker missing");

for(const file of ["dua-kids.json","quiz-kids.json","verified-content.json"]){
  const obj=JSON.parse(fs.readFileSync(path.join(kids,"data",file),"utf8"));
  (function inspect(v,keyPath){
    if(Array.isArray(v)){v.forEach((x,i)=>inspect(x,keyPath+"["+i+"]"));return}
    if(v&&typeof v==="object"){
      for(const [k,x] of Object.entries(v)){
        const kp=keyPath?keyPath+"."+k:k;
        if((k==="scene"||k==="symbol")&&typeof x==="string"&&!/^[a-z0-9-]+$/.test(x)){
          failures.push("test/kids/data/"+file+": "+kp+" must be a semantic asset token, got "+JSON.stringify(x));
        }
        inspect(x,kp);
      }
    }
  })(obj,"");
}

if(!fs.existsSync(path.join(kids,"KIDS_DESIGN_RULES.md"))) failures.push("test/kids/KIDS_DESIGN_RULES.md missing");

if(failures.length){
  console.error("\nDĀR AL TAWḤĪD Kids design-system guard failed:\n- "+failures.join("\n- "));
  process.exit(1);
}
console.log("Kids design-system guard: OK — no system emojis, no legacy sprite, semantic visual tokens only.");
