// ДРАКОН-ГРАФ — модуль перенесён из прототипа graf/engine.js (этап 1, без изменения поведения)
import { S } from '../state.js';
import { pretty } from './math.js';
import { tw } from './measure.js';

// слово шире строки — переносим по слогам: после гласной, хвост не короче 2 букв и с гласной
function hyph(w,maxW,bold,size,mono){if(mono||tw(w,bold,size,mono)<=maxW||!/^[а-яё]{6,}$/i.test(w))return[w];
  const V=/[аеёиоуыэюя]/i,Cn=/[бвгджзклмнпрстфхцчшщ]/i;let best=0;
  for(let i=2;i<=w.length-2;i++){const a=w[i-1],b=w[i],tail=w.slice(i),head=w.slice(0,i);
    if(!V.test(head)||!V.test(tail))continue;
    if(/^[ьъй]/i.test(tail)||/^[бвгджзклмнпрстфхцчшщ][ьъ]/i.test(tail))continue; // не «-льник», не «-ь…»
    let ok=false;
    if(V.test(a))ok=!(Cn.test(b)&&b.toLowerCase()===(w[i+1]||'').toLowerCase()); // после гласной, но не перед удвоенной: «-нная»
    else if(/[ьй]/i.test(a))ok=true;                                              // после ь, й: «прямоуголь-ник»
    else if(Cn.test(a)&&a.toLowerCase()===b.toLowerCase())ok=true;               // между удвоенными: «рамм» → «рам-мы»
    else if(/[рлмн]/i.test(a)&&Cn.test(b)&&V.test(w[i+1]||''))ok=true;              // после сонорной перед согласной: «пар-та», «кон-фета»
    if(ok&&tw(head+'-',bold,size,mono)<=maxW)best=i;}
  if(!best)return[w];return[w.slice(0,best)+'-',...hyph(w.slice(best),maxW,bold,size,mono)];}
// неразрывные связки (Мильчин): короткий предлог/союз + следующее слово; слово + тире; число + единица; группы разрядов; № и §
const NB=' ';
const GLUE_PRE=/^(в|во|на|с|со|к|ко|и|а|но|не|ни|по|о|об|обо|от|до|из|за|у|для|при|без|над|под|про|или|что|же|да|№|§)$/i;
const UNIT_B='кг|г|мг|т|м|см|мм|км|дм|с|мс|ч|мин|сут|Н|кН|Дж|кДж|МДж|Вт|кВт|В|кВ|мВ|А|мА|Ом|кОм|Па|кПа|МПа|К|°C|°С|Вб|Тл|Гц|кГц|МГц|л|мл|бит|байт|Кбайт|Мбайт|Гбайт|%|‰|руб\\.?|р\\.|коп\\.?|шт\\.?';
const UNIT_RE=new RegExp('^('+UNIT_B+')([/·]('+UNIT_B+')|[²³])*[.,;:!?)]*$');
function glueWords(words){const u=[];let gl=false;
  for(const w of words){
    if(u.length&&(gl||/^[—–]$/.test(w)||(/\d$/.test(u[u.length-1])&&(/^\d{3}([,.]\d+)?[.,;:)]*$/.test(w)||UNIT_RE.test(w))))){u[u.length-1]+=NB+w;}
    else u.push(w);
    gl=GLUE_PRE.test(w)&&!/^[—–]$/.test(w);}
  return u;}
function splitNL(s){const out=[];let cur='',m=false,c=false;
  for(let i=0;i<s.length;i++){const ch=s[i];if(ch==='$')m=!m;else if(ch==='`')c=!c;
    if(!m&&!c&&ch==='\\'&&s[i+1]==='n'){out.push(cur);cur='';i++;continue;}
    if(!m&&!c&&ch==='\\'&&s[i+1]==='t'){cur+='\uE001';i++;continue;}cur+=ch;}
  out.push(cur);return out;}
function wrap(text,maxW,bold,size,mono){
  const out=[];const T=x=>x.replace(//g,'    ');
  const lay=(units,W0,noH)=>{const ls=[];let cur='';
    for(const w0 of units){const parts=(S.HYPH&&!noH&&!w0.includes(NB))?hyph(w0,W0,bold,size,mono):[w0];
      for(const w of parts){const t=cur?cur+' '+w:w;if(tw(T(t),bold,size,mono)<=W0||!cur)cur=t;else{ls.push(cur);cur=w;}}}
    ls.push(cur);return ls;};
  for(const part of splitNL(String(text))){
    const words=pretty(part).split(/[ \t\r\n]+/).filter(Boolean);
    const units=mono?words:glueWords(words);
    let ls=lay(units,maxW);
    // короткая концевая строка: подбираем меньшую ширину с тем же числом строк — строки выравниваются по длине
    if(!mono&&ls.length>=2){const wl=l=>tw(T(l),bold,size,mono);const last=wl(ls[ls.length-1]),mx=Math.max(...ls.map(wl));
      // выравниваем без новых переносов и без вылезания за ширину
      const fits=L2=>L2.every(l=>wl(l)<=maxW+0.5);
      if(last<mx*0.4&&!ls.some(l=>/-$/.test(l))){let lo=maxW*0.55,hi=maxW;for(let k=0;k<12;k++){const m=(lo+hi)/2;const t2=lay(units,m,true);if(t2.length===ls.length&&fits(t2))hi=m;else lo=m;}
        const b2=lay(units,hi,true);if(b2.length===ls.length&&fits(b2))ls=b2;}}
    out.push(...ls);}
  return out.length?out:[''];
}
function longWord(t,bold,size){return Math.max(0,...pretty(String(t||'')).split(/\s+/).filter(Boolean).map(w=>tw(w,bold,size)));}
function fitPW(memos,base,max){return Math.min(max,Math.max(base,...memos.map(m=>longWord(m.pointer)+30)));}
function wrapNH(text,maxW,bold,size,mono){const h=S.HYPH;S.HYPH=false;try{return wrap(text,maxW,bold,size,mono);}finally{S.HYPH=h;}}

export { GLUE_PRE, NB, UNIT_B, UNIT_RE, fitPW, glueWords, hyph, longWord, splitNL, wrap, wrapNH };
