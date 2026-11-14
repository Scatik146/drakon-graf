// ДРАКОН-ГРАФ — модуль перенесён из прототипа graf/engine.js (этап 1, без изменения поведения)
import { razbor } from './razbor.js';
import { hasSeg } from '../parse/lexer.js';
import { content } from '../parse/parser.js';
import { S } from '../state.js';
import { G, L, headerEllipse, memoRect, n1, pointerPath, rect, txt, wedge } from '../svg/primitives.js';
import { fx, mathOn, mathSvg, mathVExt, pretty, withDisp } from '../text/math.js';
import { tw } from '../text/measure.js';
import { longWord, wrap, wrapNH } from '../text/wrap.js';

function rich(z,w,o={}){
  const P=8,parts=[];let h=P;
  const iw=w-2*P-(o.padL||0)-(o.padR||0),x0=P+(o.padL||0);
  const add=(f,hh)=>{const off=h;parts.push((x,y)=>f(x,y+off));h+=hh+4;};
  let prev=null;const GAP=7;
  const mlOf=it=>it.t==='m'?wrap(it.text,iw-14).length>1:it.t==='p'?wrap(it.text,iw,o.bold).length>1:true;
  for(const it of z){
    if(it.gap)h+=6;
    if(S.STRICT&&prev){const ml=mlOf(it);
      // отбивка: между частями разного вида и между многострочными пунктами; однострочные пункты — плотно
      if(it.t!==prev.t||(it.t==='m'&&(ml||prev.ml)))h+=GAP;
      it.ml=ml;}
    else if(S.STRICT)it.ml=mlOf(it);
    prev=it;
    if(it.t==='p'){const ls=wrap(it.text,iw,o.bold);
      // строка с высокой формулой (дробь, корень, стрелка вектора) раздвигается по формуле (задание 008); обычные строки — как раньше
      const A0=S.FS-2,D0=S.LH-A0,vh=ls.map(l=>{const e=mathVExt(l,S.FS);return{A:Math.max(A0,e.a+2),D:Math.max(D0,e.d+3)};});
      if(vh.every(v=>v.A===A0&&v.D===D0))add((x,y)=>txt(ls,x+x0+(o.center?iw/2:0),y,{anchor:o.center?'middle':'start',bold:o.bold}),ls.length*S.LH);
      else{const H=vh.reduce((q,v)=>q+v.A+v.D,0);add((x,y)=>{let yy=y,out='';ls.forEach((l,i)=>{out+=txt([l],x+x0+(o.center?iw/2:0),yy+vh[i].A-A0,{anchor:o.center?'middle':'start',bold:o.bold});yy+=vh[i].A+vh[i].D;});return out;},H);}}
    else if(it.t==='rz'){const st=S.LSTYLE==='auto'?(o.onWhite?'pill':'inset'):S.LSTYLE;
      if(st==='inset'){const r=razbor(it.text,iw-16,{style:'pill'});const bw=Math.min(iw,r.w+16),dx=o.center?(iw-bw)/2:0;
        add((x,y)=>rect(x+x0+dx,y,bw,r.h+12,S.C.ex,S.C.exb,4,1)+G(x+x0+dx+8,y+6,r.svg),r.h+12);}
      else{const r=razbor(it.text,iw,{style:st});const dx=o.center?(iw-r.w)/2:0;add((x,y)=>G(x+x0+Math.max(0,dx),y,r.svg),r.h);}}
    else if(it.t==='deriv'){const inset=!o.onWhite;const iw2=iw-(inset?16:0);
      const sw=Math.max(...it.rows.map(r=>tw(r.sign,false,S.FS+1)))+8;
      const ex=it.rows.map(r=>wrap(r.ex,iw2*0.62-sw,false,S.FS+1));const exW=Math.min(iw2*0.62,Math.max(...ex.map(l=>Math.max(...l.map(q=>tw(q,false,S.FS+1)))))+sw+14);
      const why=it.rows.map(r=>r.why?wrap(r.why,iw2-exW-18,false,S.FS-1):[]);
      const rh=it.rows.map((r,i)=>Math.max(ex[i].length*(S.FS+5),why[i].length*(S.FS+2)));const H=rh.reduce((a,b)=>a+b+5,0)+(inset?10:0);
      add((x,y)=>{const X=x+x0+(inset?8:0);let s2=inset?rect(x+x0,y,iw,H,S.C.ex,S.C.exb,4,1):'';let yy=y+(inset?5:0);
        it.rows.forEach((r,i)=>{s2+=txt([r.sign],X+sw-4,yy,{anchor:'end',size:S.FS+1,bold:true})+txt(ex[i],X+sw+2,yy,{size:S.FS+1,lh:S.FS+5});
          if(r.why){s2+=L(X+exW-4,yy+2,X+exW-4,yy+rh[i]-2,S.C.line,1)+txt(why[i],X+exW+4,yy+1,{italic:true,size:S.FS-1,lh:S.FS+2,fill:'#5a2a00'});}
          yy+=rh[i]+5;});return s2;},H);}
    else if(it.t==='m'){const ls=wrap(it.text,iw-14);add((x,y)=>`<circle cx="${n1(x+x0+4)}" cy="${n1(y+7)}" r="4.2" fill="${S.C.mark}"/>`+txt(ls,x+x0+14,y),ls.length*S.LH);}
    else if(it.t==='bar'){const ls=wrap(it.text,iw-12);const hh=ls.length*S.LH;add((x,y)=>L(x+x0+2,y+1,x+x0+2,y+hh-1,'#333',2)+txt(ls,x+x0+10,y),hh);}
    else if(it.t==='f'&&mathOn()){ // выключная формула: MathJax, блок по высоте формулы (этап 3)
      const f=fx(pretty(it.text).replace(/[\uF000-\uF7FF]/g,''),true);const fh=f.h*15,fw=f.w*15;const hh=Math.max(19,fh)+14;
      if(f.err)S.WARN.push('Формула не разобрана: $$'+it.text+'$$');
      add((x,y)=>rect(x+x0,y,iw,hh,'#fff',S.C.line,0,2)+mathSvg(f,x+x0+(iw-fw)/2,y+(hh-fh)/2+f.asc*15,15,'#111',true),hh);}
    else if(it.t==='f'){const ls=wrap('$'+it.text+'$',iw-20,true,15);const hh=ls.length*19+14;add((x,y)=>rect(x+x0,y,iw,hh,'#fff',S.C.line,0,2)+txt(ls,x+x0+iw/2,y+7,{anchor:'middle',bold:true,size:15,lh:19}),hh);}
    else if(it.t==='code'){const cl=it.lines.map(l=>l.replace(/\s+$/,''));const hh=cl.length*15+10;const cw=Math.min(iw,Math.max(...cl.map(l=>tw(l,false,12,true)))+16);
      add((x,y)=>rect(x+x0,y,cw,hh,S.C.code,S.C.codeb,3,1)+txt(cl,x+x0+8,y+5,{mono:true,size:12,lh:15}),hh);}
    else if(it.t==='img'){const hh=64;add((x,y)=>rect(x+x0,y,iw,hh,'#fff','#999',4,1,'5 3')+txt(['рисунок: '+it.text],x+x0+iw/2,y+hh/2-8,{anchor:'middle',italic:true,fill:'#666'}),hh);}
    else if(it.t==='brace'){const lw=iw*0.55;let hh=0;const rows=it.items.map(m=>{const ls=wrap(m.text,lw-14);const r={ls,y:hh};hh+=ls.length*S.LH;return r;});
      const rl=wrap(it.text,iw-lw-22);hh=Math.max(hh,rl.length*S.LH);
      add((x,yy)=>{const bx=x+x0+lw+2;let s=rows.map(r=>`<circle cx="${n1(x+x0+4)}" cy="${n1(yy+r.y+7)}" r="4.2" fill="${S.C.mark}"/>`+txt(r.ls,x+x0+14,yy+r.y)).join('');
        const y1=yy+1,y2=yy+hh-1,ym=(y1+y2)/2;
        s+=`<path d="M${n1(bx)},${n1(y1)}q6,0 6,6V${n1(ym-5)}q0,5 6,5q-6,0 -6,5V${n1(y2-6)}q0,6 -6,6" fill="none" stroke="#333" stroke-width="1.3"/>`;
        return s+txt(rl,bx+16,ym-rl.length*S.LH/2);},hh);}
  }
  h+=P-4;
  return{h:Math.max(h,o.minH||0),svg:(x,y,hh)=>{const dy=hh?(hh-h)/2:0;return parts.map(p=>p(x,y+dy)).join('');}};
}
// привязанный пример (белый) под фигурой
function attachedExample(c,w){
  const z=content({text:c.text,children:c.children});const r=rich(z,w,{center:!z.some(q=>q.t==='m'||q.t==='code'),onWhite:true});const th=S.LH+2;const h=r.h+th;
  return{w,h,svg:(x,y,t)=>{let s=rect(x,y,w,h,S.C.ex,S.C.exb,6,1.2);
    if(t)s+=wedge(x+w*0.3-8,y,x+w*0.3+8,y,t.tx,t.ty,S.C.ex,S.C.exb);
    return s+txt([c.counter?'Контрпример ×':'Пример'],x+w/2,y+5,{anchor:'middle',italic:true,fill:c.counter?'#8B0000':'#555'})+r.svg(x,y+th);}};
}
function calloutEl(c,w){
  const z=content(c);const r=rich(z,w,{center:!z.some(q=>q.t==='m'||q.t==='code')});const h=r.h;
  return{w,h,svg:(x,y,t)=>{let s=rect(x,y,w,h,S.C.fill,S.C.line,c.square?3:10,1.2);
    if(t){if(t.side==='left'){const by=y+Math.min(h/2,22);s+=wedge(x,by-7,x,by+7,t.tx+1,t.ty,S.C.fill,S.C.line);}
      else{const bx=x+w*0.3;s+=wedge(bx-8,y,bx+8,y,t.tx,t.ty,S.C.fill,S.C.line);}}
    return s+r.svg(x,y);}};
}
// всё, что висит под фигурой: выноски снизу и примеры
function hangers(node,w,below){
  const out=[];for(const c of node.children){
    const hw=S.STRICT?Math.min(w*0.85,360):0;
    if(c.kind==='example')out.push(attachedExample(c,hw||Math.min(w*0.9,Math.max(260,w*0.6))));
    else if(c.kind==='rule')out.push(calloutEl({...c,square:true},hw||Math.min(w*0.8,320)));
    else if(c.kind==='callout'&&below(c))out.push(calloutEl(c,hw||Math.min(w*0.8,320)));}
  return out;
}
function memoEl(node,W,o={}){
  const pw=o.pw||150,numW=o.num?40:0;const near=o.num&&S.NUMNEAR;
  const callouts=node.children.filter(c=>c.kind==='callout');
  const right=o.cr&&!near?callouts.filter(c=>c.pos==='справа'||(!c.pos&&c.text.length<=70&&!c.children.length)):[];
  const crW=o.cr&&!near?170:0;
  const mw=W-pw-10-numW-crW;
  const pz=hasSeg(node.pointer)?[{t:'rz',text:node.pointer}]:null;
  const pl=wrapNH(node.pointer,pw-26);const pr=pz?rich(pz,pw-12):null;const pH=pr?pr.h:pl.length*S.LH+14;
  const r=withDisp(()=>rich(content(node),mw));const rcs=right.map(c=>calloutEl(c,crW-14));const h=Math.max(pH,r.h,30,...rcs.map(c=>c.h));
  const hs=hangers(node,mw,c=>!right.includes(c));
  const bh=hs.reduce((s,c)=>s+c.h+22,0);
  return{h:h+bh,cy:h/2,svg:(x,y)=>{
    let s=pointerPath(x,y+(h-pH)/2,pw,pH)+(pr?pr.svg(x,y+(h-pH)/2):txt(pl,x+(pw-12)/2,y+(h-pH)/2+7,{anchor:'middle'}));
    s+=`<g class="memo" onclick="this.classList.toggle('open')">`+memoRect(x+pw+10,y,mw,h)+`<g class="memo-t">`+r.svg(x+pw+10,y,h)+`</g></g>`;
    if(o.num)s+=rect(x+W-numW+10,y+h/2-13,26,26,S.C.fill)+txt([String(o.num)],x+W-numW+23,y+h/2-8,{anchor:'middle',bold:true});
    rcs.forEach(c=>{const cx=x+pw+10+mw+14;const yy=y+Math.max(0,(h-c.h)/2);s+=c.svg(cx,yy,{side:'left',tx:x+pw+10+mw,ty:yy+Math.min(c.h/2,22)});});
    let by=y+h+22;hs.forEach(c=>{const cx=x+pw+10+mw-c.w-10;s+=c.svg(cx,by,{side:'top',tx:cx+c.w*0.3+14,ty:by-21});by+=c.h+22;});
    return s;}};
}
function itemEl(node,w,o={}){
  const z=content(node);let ctr=false;
  if(o.auto&&S.STRICT&&z.length===1&&z[0].t==='p'&&wrap(z[0].text,w-16).length===1)ctr=true; // одна строка — по центру
  const r=rich(z,w,{center:ctr});
  const hs=hangers(node,w,()=>true);const bh=hs.reduce((s,c)=>s+c.h+20,0);
  return{h:r.h+bh,cy:r.h/2,svg:(x,y)=>{let s=`<g class="memo" onclick="this.classList.toggle('open')">`+memoRect(x,y,w,r.h)+`<g class="memo-t">`+r.svg(x,y)+`</g></g>`;
    let by=y+r.h+20;hs.forEach(c=>{const cx=x+w-c.w-20;s+=c.svg(cx,by,{side:'top',tx:cx+c.w*0.3+12,ty:by-19});by+=c.h+20;});return s;}};
}
function boxEl(text,w,o={}){
  const z=hasSeg(text)?[{t:'rz',text}]:null;const r=z?rich(z,w,{center:true}):null;
  let sz=S.FS;if(o.nohyph){while(sz>S.FS-1&&longWord(text,o.bold,sz)>w-16)sz--;}
  const ls=o.nohyph?wrapNH(text,w-16,o.bold,sz):wrap(text,w-16,o.bold);const lh=sz+3;const h=Math.max(r?r.h:ls.length*lh+12,o.minH||0);
  return{w,h,svg:(x,y,hh)=>{const H=hh||h;let s='';
    if(o.shape==='round')s+=rect(x,y,w,H,o.fill||S.C.orange,S.C.line,Math.min(12,H/2));
    else if(o.shape==='plain')s+=rect(x,y,w,H,S.C.fill);
    else s+=memoRect(x,y,w,H);
    const left=o.auto&&S.STRICT&&ls.length>1;
    return s+(r?r.svg(x,y,H):txt(ls,left?x+8:x+w/2,y+(H-ls.length*lh)/2,{anchor:left?'start':'middle',bold:o.bold,size:sz,lh}));}};
}
function headerEl(text,maxW){
  const w0=Math.min(maxW,Math.max(220,tw(pretty(text),true)*0.75+90));
  const ls=wrapNH(text,w0-70,true);const h=ls.length*S.LH+24;
  return{w:w0,h,svg:(x,y)=>headerEllipse(x,y,w0,h)+txt(ls,x+w0/2,y+12,{anchor:'middle',bold:true})};
}

/* ============================ ВЫБОР СХЕМЫ ============================ */

export { attachedExample, boxEl, calloutEl, hangers, headerEl, itemEl, memoEl, rich };
