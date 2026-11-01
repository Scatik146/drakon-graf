// ДРАКОН-ГРАФ — модуль перенесён из прототипа graf/engine.js (этап 1, без изменения поведения)
import { boxEl, headerEl, rich } from './elements.js';
import { splitPairKids } from './epaulets.js';
import { M0 } from './gnom.js';
import { hasSeg } from '../parse/lexer.js';
import { S } from '../state.js';
import { L, blockArrow, counterPath, ellY, headerEllipse, pointerPath, txt } from '../svg/primitives.js';
import { pretty } from '../text/math.js';
import { tw } from '../text/measure.js';
import { wrapNH } from '../text/wrap.js';

function layFaceoff(root,W){
  const k=root.children;const hds=k.filter(c=>c.kind==='header');const pairs=k.filter(c=>c.kind==='pair');
  const link=k.find(c=>c.kind==='link');const arrows=k.filter(c=>c.kind==='arrow');
  const snake=hds.length>=2,multi=pairs.length>1||snake;
  const gapMid=26,inset=multi?18:0;const half=(W-2*M0-gapMid)/2;
  const lx=M0+inset,lw=half-inset,rxp=M0+half+gapMid,rw=half-inset;const SL=M0+6,SR=W-M0-6;
  let s='',y=M0;let spineTop=null;
  if(snake){const a=headerEl(hds[0].text,half-inset),b=headerEl(hds[1].text,half-inset);const hh=Math.max(a.h,b.h);
    const ax=lx+(lw-a.w)/2,bx=rxp+(rw-b.w)/2;s+=a.svg(ax,y+(hh-a.h)/2)+b.svg(bx,y+(hh-b.h)/2);
    spineTop=[{x:SL,y:y+hh/2,from:ax},{x:SR,y:y+hh/2,from:bx+b.w}];y+=hh+14;}
  else{const hd=hds[0];const lwMax=link?Math.max(...link.parts.map(q=>Math.max(70,tw(pretty(q||''),true)+30))):0;
    const hw=multi?(link?W-2*(M0+lwMax/2+14):W-2*M0-90):W-2*M0-half*0.4;const ls=wrapNH(hd?hd.text:'',hw-120,true);const hh=ls.length*S.LH+24;const hx=(W-hw)/2,hcy=y+hh/2;
    s+=headerEllipse(hx,y,hw,hh)+txt(ls,W/2,y+12,{anchor:'middle',bold:true});
    const ex=[M0+half*0.3,W-M0-half*0.3];let yb=y+hh+16;
    if(link){const parts=[link.parts[0]||'',link.parts[1]||''];const les=parts.map(p=>boxEl(p,Math.max(70,tw(pretty(p),true)+30),{shape:'round',bold:true}));
      const lh=Math.max(...les.map(l=>l.h));
      les.forEach((le,i)=>{
        if(multi){const x=i?W-M0-le.w:M0,cx=x+le.w/2;const ex0=i?hx+hw:hx;s+=L(ex0,hcy,cx,hcy)+L(cx,hcy,cx,yb);s+=le.svg(x,yb,lh);}
        else{const cx=ex[i];s+=L(cx,ellY(cx,hx,y,hw,hh,true),cx,yb);s+=le.svg(cx-le.w/2,yb,lh);s+=L(cx,yb+lh,cx,yb+lh+16);}});
      if(multi)spineTop=[{x:SL,y:yb+lh},{x:SR,y:yb+lh}];
      y=yb+lh+16;}
    else{if(multi){spineTop=[{x:SL,y:hcy,from:hx},{x:SR,y:hcy,from:hx+hw}];y+=hh+14;}
      else{ex.forEach(cx=>s+=L(cx,ellY(cx,hx,y,hw,hh,true),cx,yb));y=yb;}}
  }
  const rows=[];
  pairs.forEach(p=>{const lc=p.children.some(c=>c.kind==='marker')?splitPairKids(p):null;
    const LZ=p.lz||(lc?lc.l:[{t:hasSeg(p.left)?'rz':'p',text:p.left}]),RZ=p.rz||(lc?lc.r:[{t:hasSeg(p.right)?'rz':'p',text:p.right}]);
    const a=rich(LZ,lw,{padR:12}),b=rich(RZ,rw,{padL:12});const h=Math.max(a.h,b.h,30);
    s+=pointerPath(lx,y,lw,h)+`<g class="memo" onclick="this.classList.toggle('open')"><g class="memo-t">`+a.svg(lx,y,h)+`</g></g>`;
    s+=counterPath(rxp,y,rw,h)+`<g class="memo" onclick="this.classList.toggle('open')"><g class="memo-t">`+b.svg(rxp,y,h)+`</g></g>`;
    const ty=y+h/2;[-3.5,0,3.5].forEach(d=>s+=L(lx+lw,ty+d,rxp,ty+d,S.C.tie,1.6));
    rows.push(ty);y+=h+12;});
  if(spineTop&&rows.length){const last=rows[rows.length-1];
    s+=L(spineTop[0].x,spineTop[0].y,spineTop[0].x,last)+L(spineTop[1].x,spineTop[1].y,spineTop[1].x,last);
    if(spineTop[0].from!==undefined)s+=L(spineTop[0].x,spineTop[0].y,spineTop[0].from,spineTop[0].y)+L(spineTop[1].x,spineTop[1].y,spineTop[1].from,spineTop[1].y);
    rows.forEach(r=>{s+=L(spineTop[0].x,r,lx,r)+L(spineTop[1].x,r,rxp+rw,r);});}
  if(arrows.length){y+=4;
    const D=14; // глубина острого угла фигуры: нижние блоки — по прямым сторонам колонок
    if(arrows.length===1||arrows.some(a=>a.dbl)){const a2=arrows.find(a=>a.dbl)||arrows[0];const x1=lx,x2=rxp+rw,bw=x2-x1;const e=boxEl(a2.text,bw,{shape:'plain'});
      [lx+(lw-D)/2,rxp+D+(rw-D)/2].forEach(cx=>s+=blockArrow(cx,y,36,26,true));s+=e.svg(x1,y+25);y+=25+e.h+8;}
    else{const es=arrows.slice(0,2).map((a,i)=>{const x1=i?rxp+D:lx,bw=(i?rw:lw)-D;return{x1,bw,e:boxEl(a.text,bw,{shape:'plain'})};});
      const hmax=Math.max(...es.map(q=>q.e.h));es.forEach(q=>{s+=blockArrow(q.x1+q.bw/2,y,36,26,true)+q.e.svg(q.x1,y+25,hmax);});y+=25+hmax+8;}}
  return{h:y+M0,svg:s};
}

export { layFaceoff };
