// ДРАКОН-ГРАФ — модуль перенесён из прототипа graf/engine.js (этап 1, без изменения поведения)
import { MONO, S } from '../state.js';

const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const n1=v=>(+v).toFixed(1);
function txt(lines,x,y,o={}){
  const a=o.anchor||'start',sz=o.size||S.FS,lh=o.lh||S.LH;
  return lines.map(l=>String(l).replace(/\uE001/g,'\u00A0\u00A0\u00A0\u00A0')).map((l,i)=>`<text x="${n1(x)}" y="${n1(y+i*lh+sz-2)}" font-size="${sz}" text-anchor="${a}"${o.bold?' font-weight="bold"':''}${o.italic?' font-style="italic"':''}${o.mono?` font-family='${MONO}' xml:space="preserve"`:''} fill="${o.fill||'#111'}">${esc(l)}</text>`).join('');
}
const G=(x,y,s)=>`<g transform="translate(${n1(x)},${n1(y)})">${s}</g>`;
const L=(x1,y1,x2,y2,c,w,dash)=>`<line x1="${n1(x1)}" y1="${n1(y1)}" x2="${n1(x2)}" y2="${n1(y2)}" stroke="${c||S.C.line}" stroke-width="${w||1.5}"${dash?` stroke-dasharray="${dash}"`:''}/>`;
const rect=(x,y,w,h,f,s,rx,sw,dash)=>`<rect x="${n1(x)}" y="${n1(y)}" width="${n1(w)}" height="${n1(h)}" rx="${rx||0}" fill="${f}" stroke="${s||S.C.line}" stroke-width="${sw||1.5}"${dash?` stroke-dasharray="${dash}"`:''}/>`;
const memoRect=(x,y,w,h)=>rect(x+2,y+2,w,h,S.C.line,S.C.line)+rect(x,y,w,h,S.C.fill);
function pointerPath(x,y,w,h){const d=Math.min(14,h/2);return `<path d="M${n1(x)},${n1(y)}H${n1(x+w-d)}L${n1(x+w)},${n1(y+h/2)}L${n1(x+w-d)},${n1(y+h)}H${n1(x)}Z" fill="${S.C.fill}" stroke="${S.C.line}" stroke-width="1.5"/>`;}
function counterPath(x,y,w,h){const d=Math.min(14,h/2);return `<path d="M${n1(x+d)},${n1(y)}H${n1(x+w)}V${n1(y+h)}H${n1(x+d)}L${n1(x)},${n1(y+h/2)}Z" fill="${S.C.fill}" stroke="${S.C.line}" stroke-width="1.5"/>`;}
function headerEllipse(x,y,w,h){const cx=x+w/2,cy=y+h/2;
  return `<ellipse cx="${n1(cx)}" cy="${n1(cy)}" rx="${n1(w/2)}" ry="${n1(h/2)}" fill="${S.C.fill}" stroke="${S.C.line}" stroke-width="1.5"/><ellipse cx="${n1(cx)}" cy="${n1(cy)}" rx="${n1(w/2-4)}" ry="${n1(h/2-3)}" fill="none" stroke="${S.C.line}" stroke-width="1.2"/>`;}
function ellY(x,ex,ey,ew,eh,bottom){const cx=ex+ew/2,cy=ey+eh/2,rx=ew/2,ry=eh/2;const k=Math.max(0,1-((x-cx)/rx)**2);return cy+(bottom?1:-1)*ry*Math.sqrt(k);}
function wedge(b1x,b1y,b2x,b2y,ax,ay,f,s){ // клин выноски; рисовать ПОСЛЕ фигуры выноски
  return `<g data-k="tail"><path d="M${n1(b1x)},${n1(b1y)}L${n1(ax)},${n1(ay)}L${n1(b2x)},${n1(b2y)}" fill="${f}" stroke="${s}" stroke-width="1.2"/>`+L(b1x+(b2x-b1x)*0.1,b1y+(b2y-b1y)*0.1,b2x-(b2x-b1x)*0.1,b2y-(b2y-b1y)*0.1,f,2.8)+'</g>';
}
function blockArrow(cx,y,w,h,up){const sw=w*0.45,hh=h*0.5;
  return up?`<path d="M${cx-sw/2},${y+h}V${y+hh}H${cx-w/2}L${cx},${y}L${cx+w/2},${y+hh}H${cx+sw/2}V${y+h}" fill="${S.C.fill}" stroke="${S.C.line}" stroke-width="1.5"/>`
           :`<path d="M${cx-sw/2},${y}V${y+hh}H${cx-w/2}L${cx},${y+h}L${cx+w/2},${y+hh}H${cx+sw/2}V${y}" fill="${S.C.fill}" stroke="${S.C.line}" stroke-width="1.5"/>`;}

export { G, L, blockArrow, counterPath, ellY, esc, headerEllipse, memoRect, n1, pointerPath, rect, txt, wedge };
