// ДРАКОН-ГРАФ — модуль перенесён из прототипа graf/engine.js (этап 1, без изменения поведения)
import { attachedExample, boxEl, calloutEl, headerEl, itemEl, memoEl, rich } from './elements.js';
import { M0 } from './gnom.js';
import { razbor } from './razbor.js';
import { hasSeg } from '../parse/lexer.js';
import { S } from '../state.js';
import { G, blockArrow, txt } from '../svg/primitives.js';
import { pretty } from '../text/math.js';
import { tw } from '../text/measure.js';
import { fitPW } from '../text/wrap.js';

function layScene(root,W){
  {const a=root.children;for(let i=1;i<a.length;i++){if(a[i].kind==='rule'&&a[i].targets.length&&a[i-1].kind==='example'){
      let j=i+1;while(j<a.length&&a[j].kind==='rule')j++;if(j<a.length&&a[j].kind==='example')continue;
      const r=a.splice(i,1)[0];let e=i-1;while(e>0&&a[e-1].kind==='rule')e--;a.splice(e,0,r);}}}
  const k=root.children;let y=M0,s='';let rules=[];const iw=W-2*M0;const CW=k.some(c=>['memo','item','text','group'].includes(c.kind))?iw:Math.min(iw,480);const cw=(d)=>S.STRICT?CW:d;
  const cr=k.some(c=>c.kind==='memo'&&c.children.some(q=>q.kind==='callout'&&q.pos!=='снизу'));
  const flushRules=()=>{rules.forEach(r=>{const e=calloutEl({text:r.text,children:r.children,square:true},cw(Math.min(iw,420)));s+=e.svg((W-e.w)/2,y);y+=e.h+12;
    if(r.targets.length)S.WARN.push('Правило со стрелкой не нашло пример под собой: поставьте строку «пример:» сразу после правила.');});rules=[];};
  for(let i=0;i<k.length;i++){const c=k[i];
    if(c.kind!=='rule'&&c.kind!=='example')flushRules();
    if(c.kind==='header'){const he=headerEl(c.text,W*0.7);s+=he.svg((W-he.w)/2,y);y+=he.h+12;}
    else if(c.kind==='rule'){if(c.targets.length)rules.push(c);else{const e=calloutEl({text:c.text,children:c.children,square:true},cw(Math.min(iw,420)));s+=e.svg((W-e.w)/2,y);y+=e.h+12;}}
    else if(c.kind==='example'){const deps=c.children.filter(q=>q.kind==='dep');
      const plainEx=!hasSeg(c.text)||c.children.some(q=>q.rel);
      if(plainEx&&!rules.length){const e=attachedExample(c,cw(Math.min(iw,480)));s+=e.svg((W-e.w)/2,y);y+=e.h+12;}
      else{if(c.counter){s+=txt(['Контрпример ×'],W/2,y,{anchor:'middle',italic:true,fill:'#8B0000'});y+=S.LH+2;}
        const r=razbor(c.text,iw,{box:true,minBox:S.STRICT?CW:0,bold:true,size:14,rules,deps,style:S.LSTYLE==='auto'||S.LSTYLE==='inset'?'pill':S.LSTYLE});s+=G(M0,y,r.svg);y+=r.h+14;
        const code=c.children.filter(q=>q.kind==='code');if(code.length){const rr=rich([{t:'code',lines:code.map(q=>q.text)}],iw);s+=rr.svg(M0,y-10);y+=rr.h;}}
      rules=[];}
    else if(c.kind==='memo'){const e=memoEl(c,iw,{cr,pw:fitPW(k.filter(q=>q.kind==='memo'),150,iw*0.4)});s+=e.svg(M0,y);y+=e.h+12;}
    else if(c.kind==='item'||c.kind==='text'||c.kind==='group'){const e=itemEl(c.kind==='group'?{text:c.text,children:c.children.map(q=>q.kind==='item'?{...q,kind:'marker'}:q)}:c,iw,{auto:true});s+=e.svg(M0,y);y+=e.h+12;}
    else if(c.kind==='arrow'){const bw=cw(Math.min(iw,340));const e=boxEl(c.text,bw,{shape:'plain',auto:true});const x=(W-bw)/2;s+=e.svg(x,y);y+=e.h;
      const more=k.slice(i+1).some(q=>q.kind!=='blank');if(more){s+=blockArrow(W/2,y,40,26,false);y+=30;}else y+=12;}
    else if(c.kind==='callout'){const e=calloutEl(c,cw(Math.min(iw,420)));s+=e.svg((W-e.w)/2,y);y+=e.h+12;}
    else if(c.kind==='link'){const e=boxEl(c.parts.join(' · '),Math.min(iw,Math.max(120,tw(pretty(c.parts.join(' · ')),true)+40)),{shape:'round',bold:true});s+=e.svg((W-e.w)/2,y);y+=e.h+12;}
    else if(c.kind==='code'){const lines=[c.text];while(k[i+1]&&k[i+1].kind==='code')lines.push(k[++i].text);const r=rich([{t:'code',lines}],iw);s+=r.svg(M0,y);y+=r.h+6;}
    else if(c.kind==='image'){const r=rich([{t:'img',text:c.text}],S.STRICT?CW+16:iw);s+=r.svg(S.STRICT?(W-CW-16)/2:M0,y);y+=r.h+6;}
    else if(c.kind==='pair')S.WARN.push('Пара «><» внутри сцены не рисуется: вынесите очную ставку в отдельную зону через ---');
  }
  flushRules();
  return{h:y,svg:s};
}

/* ============================ ПРОВЕРКИ ============================ */

export { layScene };
