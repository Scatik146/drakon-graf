// ДРАКОН-ГРАФ — модуль перенесён из прототипа graf/engine.js (этап 1, без изменения поведения)
import { boxEl, rich } from './elements.js';
import { M0, headerBlock } from './gnom.js';
import { hasSeg, splitOutside } from '../parse/lexer.js';
import { content } from '../parse/parser.js';
import { S } from '../state.js';
import { L, blockArrow, memoRect, pointerPath, txt } from '../svg/primitives.js';
import { longWord, wrapNH } from '../text/wrap.js';

function layRank(root,W){
  const k=root.children;const hd=k.find(c=>c.kind==='header');const lk=k.find(c=>c.kind==='link');
  const cols=lk.parts;const n=cols.length;const rows=k.filter(c=>c.kind==='memo');
  {const KN={example:'пример:',counter:'контрпример:',image:'рисунок:',callout:'выноска:',item:'пункт',text:'текст',pair:'сравнение «><»',rule:'правило:'};
   k.forEach(c=>{if(!['header','link','memo','arrow','blank'].includes(c.kind))S.WARN.push(`Шеренга: ${KN[c.kind]||c.kind} не показывается в таблице — вынесите в отдельную зону через ---`);});
   rows.forEach(r=>{if(r.children&&r.children.some(q=>q.kind!=='blank'))S.WARN.push(`Шеренга: вложенное в строку «${r.pointer}» не показывается — вынесите в отдельную зону через ---`);});}
  const pw=Math.min(W*0.3,Math.max(Math.min(150,Math.max(90,W*0.2)),...k.filter(c=>c.kind==='memo').map(c=>longWord(c.pointer)+30))),gx=8,x0=M0,cx0=x0+pw+12;const cw=(W-M0-cx0-(n-1)*gx)/n;
  if(cw<90)S.WARN.push('Шеренга: столбцы слишком узкие — сократите число столбцов или текст в ячейках.');
  const hb=headerBlock(hd,W,W*0.6,cx0+(W-M0-cx0)/2);let s=hb.svg;
  const busY=hb.bottom+12;
  const heads=cols.map(c=>boxEl(c,cw,{shape:'round',bold:true,nohyph:true}));const hh=Math.max(...heads.map(h=>h.h));
  let y=busY+12;const xs=[];
  heads.forEach((h,i)=>{const x=cx0+i*(cw+gx);xs.push(x+cw/2);s+=h.svg(x,y,hh);s+=L(x+cw/2,busY,x+cw/2,y);});
  s=L(Math.min(xs[0],hb.cx),busY,Math.max(xs[n-1],hb.cx),busY)+L(hb.cx,hb.hBottom,hb.cx,busY)+s;
  y+=hh+10;
  rows.forEach(r=>{let cells=splitOutside(r.text,' | ').map(q=>q.trim());
    if(cells.length!==n)S.WARN.push(`Шеренга: в строке «${r.pointer}» ячеек ${cells.length}, а столбцов ${n}`);
    while(cells.length<n)cells.push('—');cells=cells.slice(0,n);
    const rc=cells.map(c=>rich(content({text:c,children:[]}),cw,{center:!hasSeg(c)}));
    const pl=wrapNH(r.pointer,pw-26);const pH=pl.length*S.LH+14;const h=Math.max(pH,...rc.map(q=>q.h),30);
    s+=pointerPath(x0,y+(h-pH)/2,pw,pH)+txt(pl,x0+(pw-12)/2,y+(h-pH)/2+7,{anchor:'middle'});
    rc.forEach((q,i)=>{const x=cx0+i*(cw+gx);s+=`<g class="memo" onclick="this.classList.toggle('open')">`+memoRect(x,y,cw,h)+`<g class="memo-t">`+q.svg(x,y,h)+`</g></g>`;});
    y+=h+8;});
  k.filter(c=>c.kind==='arrow').forEach(a=>{const bw=Math.min(W-2*M0,420);const e=boxEl(a.text,bw,{shape:'plain'});const cx=cx0+(W-M0-cx0)/2;
    s+=blockArrow(cx,y+2,36,24,true)+e.svg(cx-bw/2,y+25);y+=25+e.h+8;});
  return{h:y+M0,svg:s};
}
// Сцена «Правило и пример» и любые смешанные элементы — сверху вниз, без соединительных линий

export { layRank };
