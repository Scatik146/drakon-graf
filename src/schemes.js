// ДРАКОН-ГРАФ — модуль перенесён из прототипа graf/engine.js (этап 1, без изменения поведения)
import { SCHEME_EN, splitOutside } from './parse/lexer.js';
import { pretty } from './text/math.js';
import { tw } from './text/measure.js';

function chooseScheme(root,opts){
  const k=root.children;const cnt=t=>k.filter(c=>c.kind===t).length;
  if(opts['схема']){const v=opts['схема'].toLowerCase().replace(/ё/g,'е');return SCHEME_EN[v]||v;}
  {const lk=k.find(c=>c.kind==='link');if(lk&&lk.parts.length>=2&&k.some(c=>c.kind==='memo'&&splitOutside(c.text,' | ').length>=2))return 'шеренга';}
  if(k.some(c=>['example','rule','code','image','dep'].includes(c.kind))||(cnt('arrow')&&!cnt('pair')&&cnt('header')<2))return 'сцена';
  const H=cnt('header'),P=cnt('pair'),Z=cnt('memo'),M=cnt('item'),Gr=cnt('group'),S=cnt('link');
  if((opts['профиль']||'').toLowerCase()==='гном'||(!H&&Z&&!M&&!Gr))return 'гном';
  if(H>=2)return 'двуглавый змей';
  if(P)return P>1?'очная ставка многоэтажная':(S?'очная ставка со связкой':'очная ставка');
  if(Z)return 'батарея';
  if(Gr){if(k.some(g=>g.kind==='group'&&g.children.some(c=>c.kind==='group')))return 'дерево';if(M)return 'лестница с гребенкой';return 'эполеты';}
  const items=k.filter(c=>c.kind==='item');const n=items.length;
  const plain=items.every(i=>!i.children.some(c=>!['callout','blank'].includes(c.kind)));
  const maxLen=Math.max(0,...items.map(i=>pretty(i.text).length));
  const W=+(opts.__W||680);
  const natural=items.reduce((s,i)=>s+Math.min(150,Math.max(64,tw(pretty(i.text))+22)),0)+(n-1)*12;
  if(items.some(i=>i.num))return S?'лестница со связкой':'лестница';
  if(S)return (n>=5&&maxLen<=60&&plain)?'гребенка со связкой':'лестница со связкой';
  if(plain&&maxLen<=32){if(natural<=W-20)return 'линейка';if(n<=12)return 'шахматы';return 'гребенка';}
  if(plain&&n>=8&&maxLen<=60)return 'гребенка';
  return 'лестница';
}

/* ============================ РАСКЛАДКИ СХЕМ ============================ */

export { chooseScheme };
