// ДРАКОН-ГРАФ — модуль перенесён из прототипа graf/engine.js (этап 1, без изменения поведения)
import { layEpaulets } from './layout/epaulets.js';
import { layFaceoff } from './layout/faceoff.js';
import { M0, layGnom } from './layout/gnom.js';
import { layRank } from './layout/rank.js';
import { layComb, layRuler } from './layout/ruler.js';
import { layScene } from './layout/scene.js';
import { laySpine } from './layout/spine.js';
import { layTree } from './layout/tree.js';
import { lint } from './lint.js';
import { OPT, normKw } from './parse/lexer.js';
import { parse } from './parse/parser.js';
import { chooseScheme } from './schemes.js';
import { PAL, S, freshState } from './state.js';
import { G, L } from './svg/primitives.js';

function renderZone(src,W,gopts){
  const {root,opts}=parse(src);Object.assign(opts,gopts,{схема:opts['схема'],профиль:opts['профиль']});opts.__W=W;
  if(!root.children.length)return null;
  const scheme=chooseScheme(root,opts);const sc=scheme.replace(/ё/g,'е');let r;
  if(sc==='гном')r=layGnom(root,W,opts);
  else if(['батарея','лестница','лестница со связкой','лестница с гребенкой'].includes(sc))r=laySpine(root,W);
  else if(sc==='линейка')r=layRuler(root,W,false);
  else if(sc==='шахматы')r=layRuler(root,W,true);
  else if(sc==='гребенка')r=layComb(root,W,false);
  else if(sc==='гребенка со связкой')r=layComb(root,W,true);
  else if(sc==='эполеты')r=layEpaulets(root,W);
  else if(sc.startsWith('очная ставка')||sc==='двуглавый змей')r=layFaceoff(root,W);
  else if(sc==='дерево')r=layTree(root,W);
  else if(sc==='шеренга')r=layRank(root,W);
  else r=layScene(root,W);
  return{scheme,svg:r.svg,h:r.h,warns:lint(root,sc,opts)};
}
function render(src,W,ro={}){
  Object.assign(S,freshState()); /* новое состояние на каждый вызов */ S.WARN=[];S.NUM=1;Object.assign(S.C,ro.bw?PAL.bw:PAL.color);S.LSTYLE=ro.labels||'auto';S.STRICT=ro.strict!==undefined?!!ro.strict:true;S.NUMNEAR=ro.numNear!==undefined?!!ro.numNear:true; /* v8: вариант Б и номера у блока — основные */
  const gopts={};src.split('\n').forEach(l=>{const m=normKw(l.trim()).match(OPT);if(m&&m[1]!=='схема')gopts[m[1]]=m[2].trim();});
  if(gopts['ширина'])W=parseInt(gopts['ширина'])||W;
  {const cl=parseInt(gopts['класс']||'0');S.FS=!cl?14:cl<=6?15:cl<=9?14:13;S.LH=S.FS+3;} // кегль по классу (СанПиН: младшим крупнее)
  if(gopts['начать с'])S.NUM=parseInt(gopts['начать с'])||1;
  const zones=src.split(/^\s*-{3,}\s*$/m);let y=0,svg='',schemes=[],warns=[];
  zones.forEach((z,i)=>{const r=renderZone(z,W,gopts);if(!r)return;
    if(svg)svg+=L(M0,y+4,W-M0,y+4,S.C.sep,1.5,'6 4'),y+=12;
    svg+=G(0,y,r.svg);y+=r.h;schemes.push(r.scheme);warns.push(...r.warns);});
  if(zones.filter(z=>z.trim()&&z.split('\n').some(l=>l.trim()&&!/^\s*#/.test(l)&&!OPT.test(normKw(l.trim())))).length>5)warns.push(`Зон больше 5 — одна схема перегружена; разделите на две схемы.`);
  return{scheme:schemes.join(' + '),svg,h:y+4,warns:[...warns,...S.WARN]};
}

export { render, renderZone };
