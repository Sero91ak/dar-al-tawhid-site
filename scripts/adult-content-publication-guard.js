#!/usr/bin/env node
"use strict";
// Adult content publishing check: no Kids or notifications.
const fs=require("fs");
const path=require("path");
const ROOT=path.resolve(__dirname,"..");
function normalized(value){return String(value||"").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g," ").trim();}
console.log("Adult publication guard initialized",fs.existsSync(path.join(ROOT,"content/posts/posts-index.json")));
module.exports={normalized};
