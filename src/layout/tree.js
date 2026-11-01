// ДРАКОН-ГРАФ — модуль перенесён из прототипа graf/engine.js (этап 1, без изменения поведения)
import { boxEl, headerEl } from './elements.js';
import { M0 } from './gnom.js';
import { S } from '../state.js';
import { L } from '../svg/primitives.js';
import { pretty } from '../text/math.js';
import { tw } from '../text/measure.js';

function layTree(root,W){
  const k=root.children;const hd=k.find(c=>c.kind==='header');
  const kids=n=>n.children.filter(c=>['group','item','text'].includes(c.kind));
  const leaves=n=>{const c=kids(n);return c.length?c.reduce((s,q)=>s+leaves(q),0):1;};
  const rootN={text:hd?hd.text:'',children:k.filter(c=>['group','item','text'].includes(c.kind))};
  const nl=leaves(rootN);const g=10;const fit=(W-2*M0-(nl-1)*g)/nl;
  const allLeaves=[];(function lv(n){const c=kids(n);if(!c.length)allLeaves.push(n);else c.forEach(lv);})(rootN);
  const needWord=Math.max(...allLeaves.map(n=>Math.max(...pretty(n.text).split(/\s+/).map(w=>tw(w)))))+22;
  const needAll=Math.max(...allLeaves.map(n=>tw(pretty(n.text))))+22;
  const lw=Math.max(66,Math.min(150,fit)); // если самое длинное слово шире (needWord) — перенос по слогам в wrap
  function meas(n){const c=kids(n);if(!c.length)n._w=lw;else{c.forEach(meas);n._w=c.reduce((s,q)=>s+q._w,0)+(c.length-1)*g;}}
  meas(rootN);
  // уровни: одна ширина (по самому длинному тексту, но не шире своего места) и одна высота
  const byD=[];(function dd(n,d){if(n!==rootN)(byD[d]=byD[d]||[]).push(n);kids(n).forEach(q=>dd(q,d+1));})(rootN,0);
  byD.forEach(arr=>{if(!arr)return;const want=Math.max(...arr.map(n=>tw(pretty(n.text.replace(/:$/,'')))+24));
    const w=Math.max(Math.min(lw,want),Math.min(want,...arr.map(n=>n._w)));
    arr.forEach(n=>n._e=boxEl(n.text.replace(/:$/,''),Math.min(Math.max(w,kids(n).length?Math.min(want,n._w):w),n._w),{shape:kids(n).length?'plain':undefined,nohyph:kids(n).length>0}));
    const hh=Math.max(...arr.map(n=>n._e.h));arr.forEach(n=>n._h=hh);});
  let s='';let maxY=0;
  if(rootN._w>W-2*M0+1)S.WARN.push('Дерево не помещается по ширине: сократите подписи или разбейте на два дерева.');
  function draw(n,x,y,isRoot){let h;
    if(isRoot){const he=headerEl(n.text,W*0.6);s+=he.svg(x+(n._w-he.w)/2,y);h=he.h;}
    else{h=n._h||n._e.h;s+=n._e.svg(x+(n._w-n._e.w)/2,y,h);}
    maxY=Math.max(maxY,y+h);const c=kids(n);if(!c.length)return;
    const busY=y+h+12;let cx=x;const centers=[];const cy=busY+12;
    c.forEach(q=>{centers.push(cx+q._w/2);draw(q,cx,cy,false);cx+=q._w+g;});
    s+=L(x+n._w/2,y+h,x+n._w/2,busY);if(centers.length>1)s+=L(centers[0],busY,centers[centers.length-1],busY);
    centers.forEach(c0=>s+=L(c0,busY,c0,cy));}
  draw(rootN,(W-rootN._w)/2,M0,true);
  return{h:maxY+M0,svg:s};
}
// Шеренга: сравнение трёх и более объектов по признакам (таблица Паронджанова)

export { layTree };
