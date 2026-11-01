// ДРАКОН-ГРАФ — модуль перенесён из прототипа graf/engine.js (этап 1, без изменения поведения)
import { boxEl, calloutEl, itemEl } from './elements.js';
import { M0, headerBlock } from './gnom.js';
import { L } from '../svg/primitives.js';
import { pretty } from '../text/math.js';
import { tw } from '../text/measure.js';

function layRuler(root,W,two){
  const k=root.children;const hd=k.find(c=>c.kind==='header');const items=k.filter(c=>c.kind==='item');
  const hb=headerBlock(hd,W,W*0.6,W/2);let s=hb.svg,y=hb.hBottom;const HX=hb.cx;
  const busY=Math.max(y+14,hb.bottom+6);y=busY+14;const n=items.length,g=12;
  let n1_=two?Math.floor(n/2)+1:n;if(n1_>n)n1_=n;
  let iw=Math.min(150,Math.max(...items.map(i=>tw(pretty(i.text))+22),64));
  if(n1_*iw+(n1_-1)*g>W-2*M0)iw=(W-2*M0-(n1_-1)*g)/n1_;
  const gap=two?Math.max(g,Math.min(40,(W-2*M0-n1_*iw)/(n1_-1||1))):g;
  const rowW=n1_*iw+(n1_-1)*gap,x0=(W-rowW)/2;
  const els=items.map(i=>boxEl(i.text,iw));const h1=Math.max(...els.slice(0,n1_).map(e=>e.h));
  const xs=[];
  els.slice(0,n1_).forEach((e,i)=>{const x=x0+i*(iw+gap);xs.push(x+iw/2);s+=e.svg(x,y,h1);s+=L(x+iw/2,busY,x+iw/2,y);});
  let extra=0;items.slice(0,n1_).forEach((it,i)=>{const c=it.children.find(q=>q.kind==='callout');if(!c)return;const ce=calloutEl(c,iw);s+=ce.svg(x0+i*(iw+gap),y+h1+18,{side:'top',tx:xs[i]+iw*0.15,ty:y+h1});extra=Math.max(extra,ce.h+18);});
  let yEnd=y+h1+extra;
  if(two&&n>n1_){const y2=y+h1+14;const n2=n-n1_;const h2=Math.max(...els.slice(n1_).map(e=>e.h));
    for(let j=0;j<n2;j++){const gx=x0+(j+1)*(iw+gap)-gap/2+(n1_-1-n2)*(iw+gap)/2;s+=els[n1_+j].svg(gx-iw/2,y2,h2);s+=L(gx,busY,gx,y2);xs.push(gx);}
    yEnd=y2+h2;}
  s=L(Math.min(...xs,HX),busY,Math.max(...xs,HX),busY)+L(HX,hb.hBottom,HX,busY)+s;
  return{h:yEnd+M0,svg:s};
}
function layComb(root,W,withLink){
  const k=root.children;const hd=k.find(c=>c.kind==='header');const items=k.filter(c=>c.kind==='item');const link=k.find(c=>c.kind==='link');
  const hb=headerBlock(hd,W,W*0.6,W/2);let s=hb.svg,y=hb.hBottom;const HX=hb.cx;const yB=hb.bottom;
  const nc=items.length<=8?2:3;const sizes=[...Array(nc)].map((_,i)=>Math.floor(items.length/nc)+(i<items.length%nc?1:0));
  const cg=18,colW=(W-2*M0-(nc-1)*cg)/nc;let topY;
  if(withLink&&link){const le=boxEl(link.parts[0],W-2*M0,{shape:'round'});const ly=Math.max(y+12,yB+6);s+=L(HX,y,HX,ly);s+=le.svg(M0,ly);topY=ly+le.h;y=topY+12;}
  else{const busY=Math.max(y+14,yB+6);topY=busY;y=busY+14;const xs=[...Array(nc)].map((_,i)=>M0+i*(colW+cg)+2);s+=L(Math.min(xs[0],HX),busY,Math.max(xs[nc-1],HX),busY)+L(HX,hb.hBottom,HX,busY);}
  let maxY=y,st=0;
  sizes.forEach((sz,i)=>{const sx=M0+i*(colW+cg)+2;let yy=y,last=yy;
    items.slice(st,st+sz).forEach(it=>{const e=itemEl(it,colW-14);s+=e.svg(sx+12,yy);s+=L(sx,yy+e.cy,sx+12,yy+e.cy);last=yy+e.cy;yy+=e.h+8;});
    st+=sz;s+=L(sx,topY,sx,last);maxY=Math.max(maxY,yy);});
  return{h:maxY+M0,svg:s};
}

export { layComb, layRuler };
