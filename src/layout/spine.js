// ДРАКОН-ГРАФ — модуль перенесён из прототипа graf/engine.js (этап 1, без изменения поведения)
import { boxEl, itemEl, memoEl } from './elements.js';
import { M0, headerBlock } from './gnom.js';
import { L } from '../svg/primitives.js';
import { pretty } from '../text/math.js';
import { tw } from '../text/measure.js';
import { fitPW } from '../text/wrap.js';

function laySpine(root,W){
  const k=root.children;const hd=k.find(c=>c.kind==='header');const link=k.find(c=>c.kind==='link');
  const linkE=link?boxEl(link.parts[0],Math.min(W*0.42,Math.max(80,tw(pretty(link.parts[0]),true)+30)),{shape:'round',bold:true}):null;
  const sx=M0+(linkE?linkE.w/2:4);let s='',y=M0;
  const hb=headerBlock(hd,W,W*0.62,W/2+10,sx+40);s+=hb.svg;const hcy=hb.hcy;s+=L(sx,hcy,hb.hx,hcy);
  y=hb.bottom+14;let top=hcy;
  if(linkE){s+=L(sx,hcy,sx,y);s+=linkE.svg(sx-linkE.w/2,y);top=y+linkE.h;y+=linkE.h+12;}
  const rx=sx+16,rw=W-rx-M0;let lastCy=top;
  const cr=k.some(c=>c.kind==='memo'&&c.children.some(q=>q.kind==='callout'&&q.pos!=='снизу'));
  for(const c of k){let e;
    if(c.kind==='memo')e=memoEl(c,rw,{cr,pw:fitPW(k.filter(q=>q.kind==='memo'),Math.min(150,rw*0.3),rw*0.4)});
    else if(c.kind==='item'||c.kind==='text')e=itemEl(c,rw);
    else if(c.kind==='group')e=combUnder(c,rw);
    else continue;
    s+=e.svg(rx,y);s+=L(sx,y+e.cy,rx,y+e.cy);lastCy=y+e.cy;y+=e.h+12;}
  s=L(sx,top,sx,lastCy)+s;
  return{h:y,svg:s};
}
function combUnder(g,w){
  const head=itemEl({text:g.text,children:g.children.filter(c=>['callout','example'].includes(c.kind))},w);
  const items=g.children.filter(c=>['item','text','marker'].includes(c.kind));
  const k=items.length<=3?1:(items.length<=8?2:3);const sizes=[...Array(k)].map((_,i)=>Math.floor(items.length/k)+(i<items.length%k?1:0));
  const cx0=14,colW=(w-cx0-(k-1)*14)/k;let st=0;
  const cols=sizes.map(sz=>{let yy=0;const els=items.slice(st,st+sz).map(it=>{const e=itemEl({text:it.text,children:it.children},colW-12);const r={e,y:yy};yy+=e.h+8;return r;});st+=sz;return{els,h:yy};});
  const ch=Math.max(...cols.map(c=>c.h));
  return{h:head.h+12+ch,cy:head.cy,svg:(x,y)=>{let s=head.svg(x,y);const y0=y+head.h+12;
    cols.forEach((c,i)=>{const sx=x+cx0+i*(colW+14);let last=y0;
      c.els.forEach(r=>{s+=r.e.svg(sx+12,y0+r.y);s+=L(sx,y0+r.y+r.e.cy,sx+12,y0+r.y+r.e.cy);last=y0+r.y+r.e.cy;});
      s=L(sx,y+head.h,sx,last)+s;});return s;}};
}

export { combUnder, laySpine };
