// ДРАКОН-ГРАФ — модуль перенесён из прототипа graf/engine.js (этап 1, без изменения поведения)
import { scanSegs, splitOutside } from './parse/lexer.js';

function lint(root,scheme,opts){
  const w=[];const cls=parseInt(opts['класс']||'0');const maxWords=!cls?15:cls<=4?8:cls<=7?10:cls<=9?12:15;
  const sentences=t=>String(t).split(' | ').join('. ').replace(/^/,'').replace(/\$\$[\s\S]*?\$\$/g,'Ф').replace(/\$[^$]*\$/g,'Ф').replace(/`[^`]*`/g,'К').replace(/\[([^\]]*)\]\{[^}]*\}/g,'$1').replace(/\[([^\]]*)\]/g,'$1').split(/(?<=[.!?])\s+/).filter(s=>s.trim());
  (function walk(n){for(const c of n.children){
    if(c.kind!=='code'&&c.kind!=='formula'){const texts=[c.text,c.pointer,c.left,c.right].filter(Boolean);
      texts.forEach(t=>sentences(t).forEach(s=>{const k=s.split(/\s+/).filter(x=>/[\wа-яё]/i.test(x)).length;if(k>maxWords)w.push(`Длинное предложение: ${k} слов при норме до ${maxWords}${cls?' для '+cls+' кл.':''} — «${s.slice(0,50)}…»`);}));}
    if(c.kind==='memo'&&c.def&&c.text&&!/^(это)(\s|$)/i.test(c.text))w.push(`Определение «${c.pointer}» лучше начинать со слова «Это…» (ГНОМ, правило 2).`);
    if((c.kind==='memo'||c.kind==='item')&&c.text&&!c.text.includes(' | ')&&sentences(c.text).length>=3&&!c.children.some(q=>q.kind==='marker'))w.push(`В блоке «${(c.pointer||c.text).slice(0,40)}» три и больше мыслей — разбейте на зоны маркерами (ГНОМ, правило 3).`);
    if(c.kind==='pair'&&!c.lz&&(!c.left||!c.right))w.push('В очной ставке у пары нет второй половины.');
    walk(c);}})(root);
  // пункт 8: точка в конце (Мильчин) — предложение в блоке с точкой; заголовок, ячейка, подпись — без
  {const strip=t=>String(t||'').replace(/\$\$[\s\S]*?\$\$/g,'Ф').replace(/\$[^$]*\$/g,'Ф').replace(/`[^`]*`/g,'К').replace(/\[([^\]]*)\]\{[^}]*\}/g,'$1').trim();
   const VERB=/^([а-яё]+(ет|ют|ит|ят|ется|ются|ится|ятся|ал|ала|ало|али|ил|ила|ило|или|ел|ела|ело|ели|ен|ена|ено|ены|ан|ана|ано|аны|ть|ться|ешь|ишь)|равен|равна|равно|равны|есть|можно|нельзя|нужно|надо)$/i;
   const endDot=t=>/[^.]\.$/.test(t)&&!/(^|[\s(])[а-яёa-z]{1,4}\.$/i.test(t); // точка сокращения («тыс.», «см.») — не конечная
   const isSent=t=>/^[А-ЯЁ]/.test(t)&&(t.match(/[а-яё]{2,}/gi)||[]).length>=3&&t.toLowerCase().split(/[^а-яё]+/).some(w=>VERB.test(w)); // предложение: есть сказуемое
   let noDot=0,ex='';
   (function wk(n){for(const c of n.children){
     if(c.kind==='header'&&endDot(strip(c.text)))w.push(`Заголовок «${strip(c.text).slice(0,30)}»: в заголовке точку не ставят.`);
     if(c.kind==='memo'&&scheme==='шеренга'&&splitOutside(c.text||'',' | ').some(q=>endDot(strip(q))))w.push(`Шеренга, строка «${c.pointer}»: в ячейках таблицы точку не ставят.`);
     if((c.kind==='memo'&&scheme!=='шеренга'||c.kind==='rule')&&c.text){const t=strip(c.text);if(isSent(t)&&!/[.!?…:]$/.test(t)){noDot++;if(!ex)ex=t.slice(0,40);}}
     if(c.text&&scanSegs(c.text).some(g=>g.t==='seg'&&endDot(g.label.trim())))w.push('Подпись в {…}: в подписях точку не ставят.');
     wk(c);}})(root);
   if(noDot)w.push(`Блоков-предложений без точки в конце: ${noDot} (например, «${ex}…»). Предложение заканчивается точкой; заголовки, ячейки и подписи — без точки.`);}
  const items=root.children.filter(c=>c.kind==='item').length;
  if(scheme==='линейка'&&items>7)w.push('В линейке больше 7 элементов — лучше «Шахматы» или «Гребенка».');
  // мягкие пределы (7 ± 2): только подсказки, схема рисуется всегда
  {const memos=root.children.filter(c=>c.kind==='memo').length;
   if(scheme==='шеренга'){const lk=root.children.find(c=>c.kind==='link');if(lk&&lk.parts.length>5)w.push(`Шеренга: ${lk.parts.length} столбцов — больше 5 трудно сравнивать глазом; разбейте на две шеренги.`);}
   else if((scheme==='батарея'||scheme==='гном')&&memos>7)w.push(`${scheme==='гном'?'ГНОМ':'Батарея'}: ${memos} блоков — больше 7 трудно запомнить; разбейте на группы или на две зоны через ---.`);
   if(scheme==='дерево'){const lv=[];(function d(n,k){for(const c of n.children)if(['group','item','text'].includes(c.kind)){lv[k]=(lv[k]||0)+1;d(c,k+1);}})(root,0);
     lv.forEach((n,k)=>{if(n>7)w.push(`Дерево: на уровне ${k+1} узлов ${n} — больше 7; объедините узлы в группы.`);});}
   let depth=0;(function dp(n,k){for(const c of n.children){if(c.kind==='blank')continue;depth=Math.max(depth,k);dp(c,k+1);}})(root,1);
   if(depth>4)w.push(`Вложенность ${depth-1} уровня — глубже 3 трудно читать; вынесите часть в отдельную зону.`);}
  if(!root.children.some(c=>c.kind==='header')&&!['гном','сцена'].includes(scheme))w.push('Нет строки «тема:» — заголовка схемы.');
  return w;
}

/* ============================ СБОРКА ============================ */

export { lint };
