// ДРАКОН-ГРАФ — модуль перенесён из прототипа graf/engine.js (этап 1, без изменения поведения)
import { boxEl, itemEl } from './elements.js';
import { M0, headerBlock } from './gnom.js';
import { hasSeg } from '../parse/lexer.js';
import { L } from '../svg/primitives.js';

function layEpaulets(root,W){
  const k=root.children;const hd=k.find(c=>c.kind==='header');const gs=k.filter(c=>c.kind==='group');
  const hb=headerBlock(hd,W,W*0.6,W/2);let s=hb.svg,y=hb.hBottom;const HX=hb.cx;
  const busY=Math.max(y+14,hb.bottom+6);y=busY+14;const n=gs.length,cg=14,colW=(W-2*M0-(n-1)*cg)/n;const xs=[];let maxY=y;
  const eps=gs.map(g=>boxEl(g.text.replace(/:$/,''),colW,{shape:'round',nohyph:true}));const eh=Math.max(...eps.map(e=>e.h));
  gs.forEach((g,i)=>{const x=M0+i*(colW+cg);xs.push(x+colW/2);s+=eps[i].svg(x,y,eh);s+=L(x+colW/2,busY,x+colW/2,y);
    const sx=x+10;let yy=y+eh+10,last=yy;
    g.children.filter(c=>['item','text','marker'].includes(c.kind)).forEach(it=>{const e=itemEl(it,colW-22);s+=e.svg(x+22,yy);s+=L(sx,yy+e.cy,x+22,yy+e.cy);last=yy+e.cy;yy+=e.h+8;});
    s+=L(sx,y+eh,sx,last);maxY=Math.max(maxY,yy);});
  s=L(Math.min(xs[0],HX),busY,Math.max(xs[n-1],HX),busY)+L(HX,hb.hBottom,HX,busY)+s;
  return{h:maxY+M0,svg:s};
}
function splitPairKids(p){
  const l=[{t:hasSeg(p.left)?'rz':'p',text:p.left}],r=[{t:hasSeg(p.right)?'rz':'p',text:p.right}];
  for(const c of p.children){if(c.kind!=='marker')continue;let m;
    if(m=c.text.match(/^(?:п|прав[оа]?)\s*:\s*(.*)$/i))r.push({t:'m',text:m[1]});
    else if(m=c.text.match(/^(?:л|лев[оа]?)\s*:\s*(.*)$/i))l.push({t:'m',text:m[1]});
    else l.push({t:'m',text:c.text});}
  return{l:l.filter(z=>z.text),r:r.filter(z=>z.text)};
}

export { layEpaulets, splitPairKids };
