#!/usr/bin/env node
'use strict';
// Test-only: regenerate Android PWA icons from the actual 180x180 iOS touch icon.
// No visitor/KIDS assets change; Node stdlib only, run before test Worker deploy.
const fs=require('fs'),path=require('path'),zlib=require('zlib');
const ROOT=path.resolve(process.cwd());
const SRC=path.join(ROOT,'test-apple-touch-icon.png');
const OUT=path.join(ROOT,'test/assets');
const signature=Buffer.from([137,80,78,71,13,10,26,10]);
const crcTable=Array.from({length:256},(_,v)=>{for(let k=0;k<8;k++)v=(v&1)?(0xedb88320^(v>>>1)):(v>>>1);return v>>>0});
function crc(b){let v=0xffffffff;for(let i=0;i<b.length;i++)v=crcTable[(v^b[i])&255]^(v>>>8);return (v^0xffffffff)>>>0}
function chunk(name,raw){const type=Buffer.from(name,'ascii'),len=Buffer.alloc(4),sum=Buffer.alloc(4);len.writeUInt32BE(raw.length);sum.writeUInt32BE(crc(Buffer.concat([type,raw])));return Buffer.concat([len,type,raw,sum])}
function decodePNG(bytes){
 if(!bytes.subarray(0,8).equals(signature))throw new Error('Invalid input PNG signature');
 let width=0,height=0,bpp=0,idat=[],off=8;
 while(off<bytes.length){
  if(off+12>bytes.length)throw new Error('Truncated PNG');const n=bytes.readUInt32BE(off),type=bytes.toString('ascii',off+4,off+8),data=bytes.subarray(off+8,off+8+n);if(off+12+n>bytes.length)throw new Error('Truncated PNG data');
  if(type==='IHDR') {width=data.readUInt32BE(0);height=data.readUInt32BE(4);if(data[8]!==8||![2,6].includes(data[9])||data[10]!==0||data[11]!==0||data[12]!==0)throw new Error('Expected noninterlaced 8-bit RGB or RGBA PNG');bpp=data[9]===2?3:4;}
  else if(type==='IDAT')idat.push(data);
  off+=n+12;if(type==='IEND')break;
 }
 if(width!==180||height!==180||!bpp)throw new Error('Original iOS test icon must be 180x180 RGB/RGBA');
 const unpack=zlib.inflateSync(Buffer.concat(idat)),stride=width*bpp,output=Buffer.alloc(stride*height);let si=0;
 function paeth(a,b,c){const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);return pa<=pb&&pa<=pc?a:pb<=pc?b:c}
 for(let y=0;y<height;y++){
  const filter=unpack[si++];if(filter>4)throw new Error('Unsupported PNG filter');
  for(let x=0;x<stride;x++){
   if(si>=unpack.length)throw new Error('Truncated deflated PNG pixels');
   const a=x>=bpp?output[y*stride+x-bpp]:0,b=y>0?output[(y-1)*stride+x]:0,c=y>0&&x>=bpp?output[(y-1)*stride+x-bpp]:0;
   const adj=filter===0?0:filter===1?a:filter===2?b:filter===3?Math.floor((a+b)/2):paeth(a,b,c);
   output[y*stride+x]=(unpack[si++]+adj)&255;
  }
 }
 return {width,height,bpp,buffer:output};
}
function resize(png,size){
 const row=size*png.bpp,raw=Buffer.alloc(size*(row+1));
 for(let y=0;y<size;y++){
  let sy=(y+.5)*png.height/size-.5,loY=Math.max(0,Math.floor(sy)),hiY=Math.min(png.height-1,Math.ceil(sy)),fy=Math.min(1,Math.max(0,sy-loY));
  for(let x=0;x<size;x++){
   let sx=(x+.5)*png.width/size-.5,loX=Math.max(0,Math.floor(sx)),hiX=Math.min(png.width-1,Math.ceil(sx)),fx=Math.min(1,Math.max(0,sx-loX));
   for(let c=0;c<png.bpp;c++){
    const a=png.buffer[(loY*png.width+loX)*png.bpp+c],b=png.buffer[(loY*png.width+hiX)*png.bpp+c],d=png.buffer[(hiY*png.width+loX)*png.bpp+c],e=png.buffer[(hiY*png.width+hiX)*png.bpp+c];
    raw[y*(row+1)+1+x*png.bpp+c]=Math.round((a*(1-fx)+b*fx)*(1-fy)+(d*(1-fx)+e*fx)*fy);
   }
  }
 }
 const head=Buffer.alloc(13);head.writeUInt32BE(size,0);head.writeUInt32BE(size,4);head[8]=8;head[9]=png.bpp===3?2:6;
 return Buffer.concat([signature,chunk('IHDR',head),chunk('IDAT',zlib.deflateSync(raw,{level:9})),chunk('IEND',Buffer.alloc(0))]);
}
const original=decodePNG(fs.readFileSync(SRC));fs.mkdirSync(OUT,{recursive:true});
for(const size of [192,512]){const name='dar-test-apple-icon-'+size+'.png',data=resize(original,size);fs.writeFileSync(path.join(OUT,name),data);console.log(name+' '+size+'x'+size+' '+data.length+' bytes')}
