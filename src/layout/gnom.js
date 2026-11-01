// ДРАКОН-ГРАФ — модуль перенесён из прототипа graf/engine.js (этап 1, без изменения поведения)
import { calloutEl, headerEl, memoEl } from './elements.js';
import { S } from '../state.js';
import { fitPW } from '../text/wrap.js';

const M0=10;
function layGnom(root,W,opts){
  let y=M0,s='';const num=(opts['нумерация']||'да')!=='нет';
  const cr=root.children.some(c=>c.kind==='memo'&&c.children.some(q=>q.kind==='callout'&&q.pos!=='снизу'));
  const PW=fitPW(root.children.filter(c=>c.kind==='memo'),150,(W-2*M0)*0.4);
  for(const c of root.children){if(c.kind!=='memo')continue;const e=memoEl(c,W-2*M0,{num:num?S.NUM++:0,cr,pw:PW});s+=e.svg(M0,y);y+=e.h+14;}
  return{h:y,svg:s};
}
function headerBlock(hd,W,maxW,centerX,minX){ // заголовок + выноска справа от него
  const he=headerEl(hd?hd.text:'',maxW);const hcs=hd?hd.children.filter(c=>c.kind==='callout'||c.kind==='rule'):[];
  let hx=centerX-he.w/2;if(minX!==undefined)hx=Math.max(minX,hx);
  const hc=hcs.length?calloutEl({...hcs[0],square:hcs[0].square||hcs[0].kind==='rule'},Math.min(230,Math.max(150,W-he.w-60))):null;
  if(hc&&hx+he.w+hc.w+30>W)hx=Math.max(minX!==undefined?minX:M0,W-M0-he.w-hc.w-24);
  const hcy=M0+Math.max(he.h/2,hc?Math.min(hc.h/2,24):0);const hy=hcy-he.h/2;
  let s=he.svg(hx,hy);if(hc)s+=hc.svg(hx+he.w+18,hcy-Math.min(hc.h/2,24),{side:'left',tx:hx+he.w-2,ty:hcy});
  const bottom=Math.max(hy+he.h,hc?hcy-Math.min(hc.h/2,24)+hc.h:0);
  return{svg:s,hx,hw:he.w,hcy,bottom,cx:hx+he.w/2,hBottom:hy+he.h};
}

export { M0, headerBlock, layGnom };
