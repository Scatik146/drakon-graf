// ДРАКОН-ГРАФ — модуль перенесён из прототипа graf/engine.js (этап 1, без изменения поведения)
import { scanSegs } from '../parse/lexer.js';
import { S } from '../state.js';
import { L, n1, rect, txt, wedge } from '../svg/primitives.js';
import { mathVExt, pretty, plain, withDisp } from '../text/math.js';
import { tw } from '../text/measure.js';
import { longWord, wrap } from '../text/wrap.js';

function sentenceTokens(s){return scanSegs(s);}
function pill(text,maxW){const ls=wrap(text,maxW-18);const w=Math.max(...ls.map(l=>tw(l)))+20;return{ls,w,h:ls.length*S.LH+8};}
// подпись под частью примера: обычная ширина до 150 px; длинная подпись (3 строки и больше) расширяется,
// пока не уложится в 2 строки (не шире 320 px и ширины рисунка) — не узкий столбец слов (задание 008)
function labelPill(text,maxW){let c=pill(text,150);const lim=Math.min(320,maxW);
  for(let w=160;c.ls.length>2&&w<=lim;w+=10)c=pill(text,w);return c;}
function spreadRow(arr,lo,hi){arr.sort((p,q)=>p.t-q.t);arr.forEach(o=>o.x=o.t-o.c.w/2);
  for(let i=0;i<arr.length;i++)arr[i].x=Math.max(arr[i].x,lo,i?arr[i-1].x+arr[i-1].c.w+8:lo);
  for(let i=arr.length-1;i>=0;i--)arr[i].x=Math.min(arr[i].x,i<arr.length-1?arr[i+1].x-arr[i].c.w-8:hi-arr[i].c.w);}
/* razbor: text с сегментами. o.box — белая рамка «Пример»; o.rules — правила-выноски со стрелками; o.deps — ломаные стрелки */
/* Формулы в примере набираются выключными (withDisp) — дроби и индексы не мельчают (задание 008).
   Высокая формула раздвигает свою строку: у каждой части — высота над линией шрифта (A) и под ней (D);
   строка берёт наибольшие, пометка — рамку по своей формуле с запасом. Без высоких формул всё как раньше. */
function razbor(text,maxW,o={}){return withDisp(()=>razbor0(text,maxW,o));}
function razbor0(text,maxW,o={}){
  const fs=o.size||S.FS,bold=!!o.bold,pad=o.box?14:0;const style=o.style||'pill';
  const toks=sentenceTokens(text);const segH=fs+9,lh=segH+7;const innerW=maxW-2*pad;
  const A0=segH/2+fs/2-2,D0=segH-A0,PADV=5; // линия шрифта в обычной пометке: A0 над ней, D0 под ней
  const vext=(str,isSeg)=>{const e=mathVExt(str,fs);const pv=isSeg?PADV:1;return{A:Math.max(A0,e.a+pv),D:Math.max(D0,e.d+pv)};};
  const lines=[[]];let cw=0;const segs=[];
  const add=p=>{if(cw+p.w>innerW&&cw>0){lines.push([]);cw=0;if(p.t==='txt'&&!p.text.trim())return;}
    p.x=cw;lines[lines.length-1].push(p);cw+=p.w;};
  for(const t of toks){
    if(t.t==='txt')(t.text.match(/\$[^$]*\$|`[^`]*`|\s+|[^\s$`]+|[$`]/g)||[]).forEach(w=>{const pw=pretty(w);add({t:'txt',text:w,pw,...vext(pw,false),w:tw(pw,bold,fs,/^`/.test(w))});});
    else{const empty=!t.text.trim();const mono=/^`[^`]*`$/.test(t.text.trim());const pt=pretty(t.text);const v=empty?{A:A0,D:D0}:vext(pt,true);const tall=v.A+v.D>segH+0.5;
      const w=empty?10:tw(pt,bold,fs,mono)+(style==='brace'?4:(pt.trim().length<=2?12:16))+(tall&&style!=='brace'?10:0);const seg={...t,pt,w,mono,empty,...v};segs.push(seg);add(seg);}
  }
  const lineW=lines.map(l=>l.length?Math.max(...l.map(p=>p.x+p.w)):0);const contentW=Math.max(...lineW,10);
  const boxW=o.box?Math.min(maxW,Math.max(o.minBox||0,contentW+2*pad+4)):contentW;const bx=o.box?(maxW-boxW)/2:0;
  const findSeg=n=>{const q=n.toLowerCase();return segs.find(g=>g.label.toLowerCase()===q)||segs.find(g=>plain(g.text).trim().toLowerCase()===q)||segs.find(g=>g.label.toLowerCase().includes(q))||segs.find(g=>g.text&&plain(g.text).toLowerCase().includes(q));};
  const rules=o.rules||[],deps=o.deps||[];let svg='';
  lines.forEach((ln,li)=>{const lx=bx+(o.box?(boxW-lineW[li])/2:0);ln.forEach(p=>{p.ax=lx+p.x;});});
  let ruleW=rules.length?Math.min(250,(maxW-(rules.length-1)*12)/rules.length):0;
  // правило при связях: ставим с той стороны связи, где нет её второго конца, — стрелка правила входит в цель сбоку и не пересекает связь
  // подпись связи сдвигается прочь от правила: её край — у конца связи
  const depPillX=(ax,bxx,w,side)=>{const mx=(ax+bxx)/2;if(side==='L')return Math.max(mx-w/2,Math.min(ax,bxx)-8);if(side==='R')return Math.min(mx-w/2,Math.max(ax,bxx)+8-w);return mx-w/2;};
  const depG=deps.map(d=>{const A=findSeg(d.a),B=findSeg(d.b);if(!A||!B)return null;const c=pill(d.text,220);const ax=A.ax+A.w/2,bxx=B.ax+B.w/2;
    return{L:Math.min(A.ax,B.ax,depPillX(ax,bxx,c.w,'L')),R:Math.max(A.ax+A.w,B.ax+B.w,depPillX(ax,bxx,c.w,'R')+c.w)};}).filter(Boolean);
  let ruleSide=null,ruleX0=null;
  if(rules.length&&depG.length){const n=rules.length;const depL=Math.min(...depG.map(q=>q.L)),depR=Math.max(...depG.map(q=>q.R));
    const tgs=rules.flatMap(r=>r.targets.map(findSeg).filter(Boolean));const tc=tgs.length?tgs.reduce((q,g)=>q+g.ax+g.w/2,0)/tgs.length:maxW/2;
    const need=Math.max(...rules.map(r=>Math.max(longWord(r.text)+24,Math.min(tw(pretty(r.text))+24,130))));
    const wR=(maxW-(depR+18)-(n-1)*12)/n,wL=(depL-18-(n-1)*12)/n;
    for(const sd of (tc-depL)<(depR-tc)?['L','R']:['R','L']){const wA=sd==='R'?wR:wL;
      if(wA>=need){ruleSide=sd;ruleW=Math.min(ruleW,wA);ruleX0=sd==='R'?depR+18:depL-18-n*ruleW-(n-1)*12;break;}}}
  const rl=rules.map(r=>{const ls=wrap(r.text,ruleW-16);return{r,ls,h:ls.length*S.LH+12};});
  const rh=rl.length?Math.max(...rl.map(q=>q.h)):0;
  // полоса связей: высота — по самой высокой подписи связи
  const dh=deps.length?Math.max(...deps.map(d=>pill(d.text,220).h)):0;
  const depTop=(rh?rh+14:0)+Math.max(10,dh/2+2);
  let y=deps.length?depTop+Math.max(20,dh/2+12):(rh?rh+30:0);
  const boxY=y;const sy=boxY+(o.box?9:0);
  let ly=sy;lines.forEach((ln,li)=>{const lx=bx+(o.box?(boxW-lineW[li])/2:0);const LA=Math.max(A0,...ln.map(p=>p.A||A0)),LD=Math.max(D0,...ln.map(p=>p.D||D0));
    ln.forEach(p=>{const a=p.A||A0,d=p.D||D0;p.ax=lx+p.x;p.base=ly+LA;p.ay=p.base-a;p.h=a+d;});ly+=LA+LD+7;});
  const boxH=ly-sy-7+(o.box?18:0)+(style==='brace'?6:0);
  if(o.box)svg+=rect(bx,boxY,boxW,boxH,S.C.ex,S.C.exb,0,1.6);
  const pillF=style==='white'?'#fff':S.C.fill, pillS=style==='white'?S.C.exb:S.C.line;
  lines.forEach(ln=>ln.forEach(p=>{
    const ty0=p.base-(fs-2); // верх строки текста: линия шрифта общая для всей строки примера
    if(p.t==='txt')svg+=txt([p.pw],p.ax,ty0,{bold,size:fs,mono:/^`/.test(p.text)});
    else if(p.empty)svg+=L(p.ax+p.w/2,p.ay+2,p.ax+p.w/2,p.ay+p.h-2,S.C.exb,1,'2 2'); // пустое место
    else if(style==='brace'){svg+=txt([p.pt],p.ax+p.w/2,ty0,{anchor:'middle',bold,size:fs,mono:p.mono});
      if(p.label){const y1=p.ay+p.h,x1=p.ax+1,x2=p.ax+p.w-1,xm=(x1+x2)/2;svg+=`<path d="M${n1(x1)},${n1(y1-3)}q0,4 4,4H${n1(xm-3)}q3,0 3,4q0,-4 3,-4H${n1(x2-4)}q4,0 4,-4" fill="none" stroke="${S.C.line}" stroke-width="1.2"/>`;}}
    else svg+=rect(p.ax+1,p.ay,p.w-2,p.h,'#fff',S.C.exb,segH/2,1.1)+txt([p.pt],p.ax+p.w/2,ty0,{anchor:'middle',bold,size:fs,mono:p.mono});
  }));
  if(rl.length){const objs=rl.map(q=>{const tg=q.r.targets.map(n=>{const s=findSeg(n);if(!s)S.WARN.push(`Правило: не найдена часть «${n}» в примере`);return s;}).filter(Boolean);
      return{q,tg,t:tg.length?tg.reduce((s,g)=>s+g.ax+g.w/2,0)/tg.length:maxW/2,c:{w:ruleW}};});
    spreadRow(objs,0,maxW);
    if(ruleSide)objs.sort((a,b)=>a.t-b.t).forEach((ob,i)=>ob.x=ruleX0+i*(ruleW+12));
    objs.forEach(({q,tg,x})=>{const ry=rh-q.h;svg+=rect(x,ry,ruleW,q.h,S.C.fill,S.C.line,3,1.2);
      tg.forEach(g=>{const sR=ruleSide==='R'&&g.ax+g.w<x+10,sL=ruleSide==='L'&&g.ax>x+ruleW-10;
        const gx=sR?g.ax+g.w+1:sL?g.ax-1:g.ax+g.w/2,gy=(sR||sL)?g.ay+g.h/2:g.ay;const b=sR?x+10:sL?x+ruleW-26:Math.max(x+10,Math.min(x+ruleW-26,gx-8));svg+=wedge(b,ry+q.h,b+16,ry+q.h,gx,gy,S.C.fill,S.C.line);});
      svg+=txt(q.ls,x+ruleW/2,ry+6,{anchor:'middle'});});}
  deps.forEach(d=>{const A=findSeg(d.a),B=findSeg(d.b);if(!A||!B){S.WARN.push(`Связь: не найдены части «${d.a}» → «${d.b}»`);return;}
    const ax=A.ax+A.w/2,bxx=B.ax+B.w/2,top=depTop;
    svg+=`<path d="M${n1(ax)},${n1(A.ay)}V${n1(top)}H${n1(bxx)}V${n1(B.ay-3)}" fill="none" stroke="${S.C.line}" stroke-width="1.8"/><path d="M${n1(bxx-5)},${n1(B.ay-9)}L${n1(bxx)},${n1(B.ay)}L${n1(bxx+5)},${n1(B.ay-9)}Z" fill="${S.C.line}"/>`;
    const c=pill(d.text,220);const px=Math.max(0,Math.min(maxW-c.w,depPillX(ax,bxx,c.w,ruleSide)));svg+=rect(px,top-c.h/2,c.w,c.h,S.C.fill,S.C.line,c.h/2,1.1)+txt(c.ls,px+c.w/2,top-c.h/2+4,{anchor:'middle'});});
  y=boxY+boxH;
  // подписи снизу: текст примера НЕ раздвигается; подписи раскладываются по рядам,
  // хвост — вертикальный, хвосты не пересекают чужие подписи
  const bl=segs.filter(g=>g.label).map(g=>({g,c:style==='brace'?{ls:wrap(g.label,140,false,S.FS-1),w:0,h:0}:labelPill(g.label,maxW),t:g.ax+g.w/2}));
  if(bl.length){
    if(style==='brace')bl.forEach(o=>{o.c.w=Math.max(...o.c.ls.map(l=>tw(l,false,S.FS-1)))+6;o.c.h=o.c.ls.length*(S.FS+2)+2;});
    const rowH=Math.max(...bl.map(o=>o.c.h))+8;const gap=10;const placed=[];
    // сначала — один ряд: порядок подписей = порядку частей, хвосты могут идти наклонно и не пересекаются;
    // новый ряд — только если в один не помещается или наклон слишком большой
    const oneRow=(()=>{const arr=bl.map(o=>({o,t:o.t,c:o.c})).sort((p,q)=>p.t-q.t);const G=10;
      arr.forEach(a=>a.x=a.t-a.c.w/2);
      for(let i=0;i<arr.length;i++)arr[i].x=Math.max(arr[i].x,0,i?arr[i-1].x+arr[i-1].c.w+G:0);
      for(let i=arr.length-1;i>=0;i--)arr[i].x=Math.min(arr[i].x,i<arr.length-1?arr[i+1].x-arr[i].c.w-G:maxW-arr[i].c.w);
      if(arr[0].x<-0.5)return null;let off=0;
      arr.forEach(a=>{const d=a.t<a.x+8?a.x+8-a.t:a.t>a.x+a.c.w-8?a.t-(a.x+a.c.w-8):0;off=Math.max(off,d);});
      if(off>70)return null;arr.forEach(a=>{a.o.x=a.x;a.o.r=0;placed.push(a.o);});return{off};})();
    // ряд за рядом: подпись встаёт в ряд, если не налезает на соседей и НЕ закрывает хвосты ещё не размещённых
    let rest=oneRow?[]:[...bl].sort((p,q)=>p.t-q.t);
    // по рядам: подпись может сдвинуться вбок за свою часть (хвост наклонный, не больше 70 px), чтобы встать рядом выше;
    // хвост не пересекает чужие подписи и хвосты; подпись не загораживает хвосты тех, кто встанет ниже
    const by0=y+(style==='brace'?6:18);
    const tailOf=(o,x,r)=>{const b=Math.max(x+4,Math.min(x+o.c.w-16,o.t-6));return[b+6,by0+r*rowH,o.t,o.g.ay+o.g.h];};
    const segX=(a,b)=>{const[x1,y1,x2,y2]=a,[x3,y3,x4,y4]=b;const d=(x2-x1)*(y4-y3)-(y2-y1)*(x4-x3);if(Math.abs(d)<1e-9)return false;
      const u=((x3-x1)*(y4-y3)-(y3-y1)*(x4-x3))/d,v=((x3-x1)*(y2-y1)-(y3-y1)*(x2-x1))/d;return u>0.02&&u<0.98&&v>0.02&&v<0.98;};
    const segRect=(sg,rx,ry,rw,rh2,m)=>{for(let k=1;k<24;k++){const px=sg[0]+(sg[2]-sg[0])*k/24,py=sg[1]+(sg[3]-sg[1])*k/24;if(px>rx-m&&px<rx+rw+m&&py>ry-m&&py<ry+rh2+m)return true;}return false;};
    for(let r=0;rest.length&&r<12;r++){const left=[];
      for(const o of rest){const others=rest.filter(q=>q!==o&&!q.done).map(q=>q.t);
        const W2=o.c.w/2,cands=[];for(let d=0;d<=W2+70;d+=3){cands.push(o.t-W2+d);if(d)cands.push(o.t-W2-d);}
        let ok=false;
        for(const x0 of cands){const x=Math.max(0,Math.min(x0,maxW-o.c.w));
          const tl=tailOf(o,x,r);if(Math.abs(tl[0]-o.t)>70)continue;
          if(placed.some(q=>q.r===r&&x<q.x+q.c.w+gap&&q.x<x+o.c.w+gap))continue;
          if(others.some(t=>t>x-16&&t<x+o.c.w+16))continue;
          {const lo=Math.min(tl[0],o.t)-8,hi=Math.max(tl[0],o.t)+8;if(others.some(t=>t>lo&&t<hi&&Math.abs(t-o.t)>2))continue;} // наклонный хвост не идёт над чужой частью
          if(placed.some(q=>segRect(tl,q.x,by0+q.r*rowH,q.c.w,q.c.h,10)||segX(tl,tailOf(q,q.x,q.r))))continue; // запас 10 px: хвост — клин до 12 px у основания
          o.x=x;o.r=r;o.done=true;placed.push(o);ok=true;break;}
        if(!ok)left.push(o);}
      rest=left;}
    rest.forEach(o=>{o.r=(placed.length?Math.max(...placed.map(q=>q.r)):-1)+1;o.x=Math.max(0,Math.min(o.t-o.c.w/2,maxW-o.c.w));placed.push(o);});
    const by=y+(style==='brace'?6:18)+(oneRow?Math.min(30,oneRow.off/5):0);const nR=Math.max(...placed.map(q=>q.r))+1;
    placed.forEach(o=>{const yy=by+o.r*rowH;const tx=o.t,ty=o.g.ay+o.g.h+(style==='brace'?5:0);
      if(style==='brace'){if(yy>ty+2)svg+=L(tx,ty,Math.max(o.x+4,Math.min(o.x+o.c.w-4,tx)),yy,S.C.line,1);
        svg+=txt(o.c.ls,o.x+o.c.w/2,yy,{anchor:'middle',italic:true,size:S.FS-1,lh:S.FS+2,fill:'#5a2a00'});}
      else{svg+=rect(o.x,yy,o.c.w,o.c.h,pillF,pillS,o.c.h/2,1.1);
        const b=Math.max(o.x+4,Math.min(o.x+o.c.w-16,tx-6));
        svg+=wedge(b,yy,b+12,yy,tx,ty,pillF,pillS)+txt(o.c.ls,o.x+o.c.w/2,yy+4,{anchor:'middle'});}});
    y=by+nR*rowH-6;
    if(bl.length>7)S.WARN.push('В одном примере больше 7 подписей — разбейте пример на два (одна зона — одна мысль).');
  }
  return{w:o.box?maxW:Math.max(contentW,...bl.map(o=>o.x+o.c.w)),h:y,svg,segs};
}

/* ============================ СОДЕРЖИМОЕ ФИГУР ============================ */

export { labelPill, pill, razbor, sentenceTokens, spreadRow };
