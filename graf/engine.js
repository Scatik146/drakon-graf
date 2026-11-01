"use strict";
/* ГРАФ v8 — эталон, зафиксирован 30.10.2026. Изменения движка проверяются командой: node tests/run.js */
/* =====================================================================
   ГРАФ v2 — единый язык конспектов (ГРАФ + ГНОМ + МОЛНИЯ)
   Движок раскладки: текст → SVG
   ===================================================================== */
const PAL={color:{line:'#993300',fill:'#FFFF99',orange:'#FFCC66',mark:'#CC6600',tie:'#FF9933',ex:'#FFFFFF',exb:'#333333',code:'#F6F3EA',codeb:'#C9BFA6',sep:'#D8C8A8'},
  bw:{line:'#222222',fill:'#E6E6E6',orange:'#C8C8C8',mark:'#444444',tie:'#666666',ex:'#FFFFFF',exb:'#000000',code:'#F2F2F2',codeb:'#999999',sep:'#BBBBBB'}};
const C={...PAL.color};
let FS=13, LH=16;const MONO='Consolas, "Courier New", monospace', SANS='Arial, Helvetica, sans-serif';
let WARN=[];
const cx2d=document.createElement('canvas').getContext('2d');
function tw(t,bold,size,mono){cx2d.font=(bold?'bold ':'')+(size||FS)+'px '+(mono?MONO:SANS);return cx2d.measureText(t).width;}
const SUP={'0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹','+':'⁺','-':'⁻','−':'⁻','(':'⁽',')':'⁾','=':'⁼',...Object.fromEntries([...'abcdefghijklmnoprstuvwxyz'].map((c,i)=>[c,'ᵃᵇᶜᵈᵉᶠᵍʰⁱʲᵏˡᵐⁿᵒᵖʳˢᵗᵘᵛʷˣʸᶻ'[i]]))};
const SUB={'0':'₀','1':'₁','2':'₂','3':'₃','4':'₄','5':'₅','6':'₆','7':'₇','8':'₈','9':'₉','a':'ₐ','e':'ₑ','x':'ₓ','n':'ₙ','m':'ₘ','k':'ₖ','т':'т','ж':'ж'};
const supify=s=>[...s].map(ch=>SUP[ch]||ch).join(''), subify=s=>[...s].map(ch=>SUB[ch]||ch).join('');
// «Невидимая математика» прототипа: в программе здесь работает KaTeX
function texArgs(f,cmd,n,fn){ // \cmd{a}{b} или \cmd12 — аргумент в скобках или один символ
  let out='',i=0;const key='\\'+cmd;
  while(true){const j=f.indexOf(key,i);if(j<0){out+=f.slice(i);break;}
    const after=f[j+key.length];if(after&&/[A-Za-z]/.test(after)){out+=f.slice(i,j+key.length);i=j+key.length;continue;}
    out+=f.slice(i,j);let k=j+key.length;const args=[];
    for(let a=0;a<n;a++){while(f[k]===' ')k++;if(f[k]==='{'){let d=0,e=k;for(;e<f.length;e++){if(f[e]==='{')d++;else if(f[e]==='}'&&--d===0)break;}args.push(f.slice(k+1,e));k=e+1;}else if(k<f.length){args.push(f[k]);k++;}}
    out+=fn(...args);i=k;}
  return out;}
const grp=a=>/^[\wА-Яа-я.,]+$|^\\?[A-Za-z]+$/.test(a.trim())?a.trim():'('+a.trim()+')';
function mathText(f){
  f=f.replace(/\\q?quad/g,'  ').replace(/\\bar\s*\{?([A-Za-z])\}?/g,'$1̄').replace(/\\left|\\right/g,'');
  f=texArgs(f,'frac',2,(a,b)=>grp(a||'')+'/'+grp(b||''));f=texArgs(f,'dfrac',2,(a,b)=>grp(a||'')+'/'+grp(b||''));
  f=texArgs(f,'sqrt',1,a=>'√'+grp(a||''));
  return f.replace(/\\vec\s*\{?([A-Za-zА-Яа-я])\}?/g,'$1').replace(/\\(log|ln|sin|cos|tg|ctg|lg)(?![a-z])/g,'$1').replace(/\\int/g,'∫').replace(/\\infty/g,'∞').replace(/\\to/g,'→').replace(/\\cup/g,'∪').replace(/\\in\b/g,'∈').replace(/\\neg/g,'¬').replace(/\\sum/g,'Σ').replace(/\\sigma/g,'σ').replace(/\\nu/g,'ν').replace(/\\omega/g,'ω').replace(/\\varphi/g,'φ').replace(/\\varepsilon/g,'ε')
    .replace(/\\pmod\s*(\S+)/g,'(mod $1)').replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g,'$1/$2').replace(/\\cdot/g,'·').replace(/\\ne/g,'≠').replace(/\\le/g,'≤').replace(/\\ge/g,'≥')
    .replace(/\\pm/g,'±').replace(/\\sqrt\{([^}]*)\}/g,'√$1').replace(/\\sqrt/g,'√').replace(/\\rho/g,'ρ').replace(/\\pi/g,'π').replace(/\\Delta/g,'Δ').replace(/\\alpha/g,'α').replace(/\\angle/g,'∠').replace(/\\triangle/g,'△').replace(/\\parallel/g,'∥').replace(/\\perp/g,'⊥')
    .replace(/\\%/g,'%').replace(/\\,/g,' ').replace(/\\text\{([^}]*)\}/g,'$1')
    .replace(/\^\{([^}]*)\}/g,(m,a)=>supify(a)).replace(/\^(.)/g,(m,a)=>supify(a))
    .replace(/_\{([^}]*)\}/g,(m,a)=>subify(a)).replace(/_(.)/g,(m,a)=>subify(a))
    .replace(/<=/g,'≤').replace(/>=/g,'≥').replace(/!=/g,'≠').replace(/\*/g,'·').replace(/sqrt/g,'√').replace(/[{}]/g,'');
}
function pretty(s){return String(s).replace(/(^|[^\\])->/g,'$1→').replace(/\\->/g,'->').replace(/\$([^$]+)\$/g,(m,f)=>mathText(f)).replace(/`([^`]*)`/g,'$1').replace(/\uE000/g,'$').replace(//g,'|').replace(//g,'{').replace(//g,'}');}
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
let HYPH=true; // переносы по слогам разрешены (в заголовках, указателях и шапках — нет)
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
    for(const w0 of units){const parts=(HYPH&&!noH&&!w0.includes(NB))?hyph(w0,W0,bold,size,mono):[w0];
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
function wrapNH(text,maxW,bold,size,mono){const h=HYPH;HYPH=false;try{return wrap(text,maxW,bold,size,mono);}finally{HYPH=h;}}
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const n1=v=>(+v).toFixed(1);
function txt(lines,x,y,o={}){
  const a=o.anchor||'start',sz=o.size||FS,lh=o.lh||LH;
  return lines.map(l=>String(l).replace(/\uE001/g,'\u00A0\u00A0\u00A0\u00A0')).map((l,i)=>`<text x="${n1(x)}" y="${n1(y+i*lh+sz-2)}" font-size="${sz}" text-anchor="${a}"${o.bold?' font-weight="bold"':''}${o.italic?' font-style="italic"':''}${o.mono?` font-family='${MONO}' xml:space="preserve"`:''} fill="${o.fill||'#111'}">${esc(l)}</text>`).join('');
}
const G=(x,y,s)=>`<g transform="translate(${n1(x)},${n1(y)})">${s}</g>`;
const L=(x1,y1,x2,y2,c,w,dash)=>`<line x1="${n1(x1)}" y1="${n1(y1)}" x2="${n1(x2)}" y2="${n1(y2)}" stroke="${c||C.line}" stroke-width="${w||1.5}"${dash?` stroke-dasharray="${dash}"`:''}/>`;
const rect=(x,y,w,h,f,s,rx,sw,dash)=>`<rect x="${n1(x)}" y="${n1(y)}" width="${n1(w)}" height="${n1(h)}" rx="${rx||0}" fill="${f}" stroke="${s||C.line}" stroke-width="${sw||1.5}"${dash?` stroke-dasharray="${dash}"`:''}/>`;
const memoRect=(x,y,w,h)=>rect(x+2,y+2,w,h,C.line,C.line)+rect(x,y,w,h,C.fill);
function pointerPath(x,y,w,h){const d=Math.min(14,h/2);return `<path d="M${n1(x)},${n1(y)}H${n1(x+w-d)}L${n1(x+w)},${n1(y+h/2)}L${n1(x+w-d)},${n1(y+h)}H${n1(x)}Z" fill="${C.fill}" stroke="${C.line}" stroke-width="1.5"/>`;}
function counterPath(x,y,w,h){const d=Math.min(14,h/2);return `<path d="M${n1(x+d)},${n1(y)}H${n1(x+w)}V${n1(y+h)}H${n1(x+d)}L${n1(x)},${n1(y+h/2)}Z" fill="${C.fill}" stroke="${C.line}" stroke-width="1.5"/>`;}
function headerEllipse(x,y,w,h){const cx=x+w/2,cy=y+h/2;
  return `<ellipse cx="${n1(cx)}" cy="${n1(cy)}" rx="${n1(w/2)}" ry="${n1(h/2)}" fill="${C.fill}" stroke="${C.line}" stroke-width="1.5"/><ellipse cx="${n1(cx)}" cy="${n1(cy)}" rx="${n1(w/2-4)}" ry="${n1(h/2-3)}" fill="none" stroke="${C.line}" stroke-width="1.2"/>`;}
function ellY(x,ex,ey,ew,eh,bottom){const cx=ex+ew/2,cy=ey+eh/2,rx=ew/2,ry=eh/2;const k=Math.max(0,1-((x-cx)/rx)**2);return cy+(bottom?1:-1)*ry*Math.sqrt(k);}
function wedge(b1x,b1y,b2x,b2y,ax,ay,f,s){ // клин выноски; рисовать ПОСЛЕ фигуры выноски
  return `<g data-k="tail"><path d="M${n1(b1x)},${n1(b1y)}L${n1(ax)},${n1(ay)}L${n1(b2x)},${n1(b2y)}" fill="${f}" stroke="${s}" stroke-width="1.2"/>`+L(b1x+(b2x-b1x)*0.1,b1y+(b2y-b1y)*0.1,b2x-(b2x-b1x)*0.1,b2y-(b2y-b1y)*0.1,f,2.8)+'</g>';
}
function blockArrow(cx,y,w,h,up){const sw=w*0.45,hh=h*0.5;
  return up?`<path d="M${cx-sw/2},${y+h}V${y+hh}H${cx-w/2}L${cx},${y}L${cx+w/2},${y+hh}H${cx+sw/2}V${y+h}" fill="${C.fill}" stroke="${C.line}" stroke-width="1.5"/>`
           :`<path d="M${cx-sw/2},${y}V${y+hh}H${cx-w/2}L${cx},${y+h}L${cx+w/2},${y+hh}H${cx+sw/2}V${y}" fill="${C.fill}" stroke="${C.line}" stroke-width="1.5"/>`;}

/* ============================ РАЗБОР ТЕКСТА ============================ */
const OPT=/^(схема|ширина|начать с|нумерация|класс|язык)\s*[:=]\s*(.+)$/;
const KINDS='теорема|свойство|признак|следствие|формула|аксиома|алгоритм|закон|метод|команда|единица';
const lowerFirst=s=>s.length>1&&/[а-яёa-z]/.test(s[1])?s[0].toLowerCase()+s.slice(1):s;
// английские синонимы ключевых слов (регистр важен, как в Python: только строчные)
const EN={topic:'тема',link:'связка',arrow:'стрелка',rule:'правило',example:'пример',counterexample:'контрпример',relation:'связь',
  callout:'выноска',note:'уточнение',picture:'рисунок',image:'рисунок',code:'код',def:'опр',theorem:'теорема',property:'свойство',
  criterion:'признак',corollary:'следствие',formula:'формула',axiom:'аксиома',algorithm:'алгоритм',law:'закон',method:'метод',
  command:'команда',unit:'единица',scheme:'схема',grade:'класс',width:'ширина',numbering:'нумерация',lang:'язык',start:'начать с'};
const ENPOS={below:'снизу',right:'справа'};
const SCHEME_EN={gnome:'гном',battery:'батарея',ladder:'лестница',ruler:'линейка',chess:'шахматы',comb:'гребенка',epaulets:'эполеты',
  faceoff:'очная ставка',tree:'дерево',rank:'шеренга',scene:'сцена',snake:'двуглавый змей'};
const KW=new Set(['тема','связка','стрелка','двойная','правило','пример','контрпример','связь','выноска','уточнение','пояснение','рисунок','код','опр','определение','схема','класс','ширина','нумерация','начать','язык','профиль',...KINDS.split('|')]);
function scanSegs(s){s=String(s||'');const out=[];let buf='',i=0,math=false,code=false;
  const flush=()=>{if(buf)out.push({t:'txt',text:buf});buf='';};
  while(i<s.length){const ch=s[i];
    if(ch==='\\'&&(s[i+1]==='['||s[i+1]===']')){buf+=s[i+1];i+=2;continue;}
    if(ch==='$'&&!code){math=!math;buf+=ch;i++;continue;}
    if(ch==='`'&&!math){code=!code;buf+=ch;i++;continue;}
    if(ch==='['&&!math&&!code){let d=1,j=i+1,m2=false;
      let c2=false;while(j<s.length&&d>0){if(s[j]==='$'&&!c2)m2=!m2;else if(s[j]==='`'&&!m2)c2=!c2;else if(!m2&&!c2&&s[j]==='[')d++;else if(!m2&&!c2&&s[j]===']')d--;if(d>0)j++;}
      if(d===0&&s[j+1]==='{'){const k=s.indexOf('}',j+2);if(k>0){flush();out.push({t:'seg',text:s.slice(i+1,j),label:s.slice(j+2,k)});i=k+1;continue;}}}
    buf+=ch;i++;}
  flush();return out;}
const hasSeg=t=>scanSegs(t).some(x=>x.t==='seg');
// разделить строку по разделителю вне $…$ и `…`
function splitOutside(s,sep){const parts=[];let buf='',math=false,code=false;
  for(let i=0;i<s.length;i++){const ch=s[i];if(ch==='$'&&!code)math=!math;else if(ch==='`'&&!math)code=!code;
    if(!math&&!code&&s.startsWith(sep,i)){parts.push(buf);buf='';i+=sep.length-1;continue;}buf+=ch;}
  parts.push(buf);return parts;}
function normKw(t){
  let m=t.match(/^([a-z]+)(\s+(below|right))?(?=\s*:|\s*->|\s+\S.*:)/);
  if(m&&EN[m[1]]&&(/^[a-z]+(\s+(below|right))?\s*:/.test(t)||/^(rule|relation)\b/.test(t)))
    t=EN[m[1]]+(m[3]?' '+ENPOS[m[3]]:'')+t.slice(m[0].length);
  m=t.match(/^[а-яё]+/);if(m&&m[0].includes('ё')&&KW.has(m[0].replace(/ё/g,'е')))t=m[0].replace(/ё/g,'е')+t.slice(m[0].length);
  return t;
}
const REL=/^(<=>|=>|<=|>=|!=|=|≡|⇒|⇔|≤|≥|<|>|≠|≈|→)\s/;
const RELSYM={'<=>':'⇔','=>':'⇒','<=':'≤','>=':'≥','!=':'≠'};
function classify(t){
  let m;t=t.replace(/\\\$/g,'').replace(/\\\|/g,'').replace(/\\\{/g,'').replace(/\\\}/g,'');t=normKw(t); // экранирование: \$ \| \{ \}
  if(m=t.match(/^профиль\s*:\s*(.+)$/)){WARN.push('«профиль:» больше не нужен — ГНОМ выбирается сам; для явного выбора: «схема: гном»');return{kind:'opt',key:'схема',val:m[1].trim()};}
  if(m=t.match(OPT))return{kind:'opt',key:m[1],val:m[2].trim()};
  // 1) ключевые слова (только строчные, только в начале строки)
  if(m=t.match(/^тема\s*:\s*(.*)$/))return{kind:'header',text:m[1]};
  if(m=t.match(/^вопрос\s*:\s*(.+)$/)){WARN.push('«вопрос:» устарело — пишите «тема:»');return{kind:'header',text:m[1]};}
  if(m=t.match(/^почему\s*:\s*(.+)$/)){WARN.push('«почему:» устарело — пишите «стрелка:»');return{kind:'arrow',text:m[1]};}
  if(m=t.match(/^понятие\s*:\s*(.+->.*)$/)){WARN.push('«понятие:» устарело — пишите просто «термин -> ответ»');t=m[1];}
  if(m=t.match(/^связка\s*:\s*(.*)$/))return{kind:'link',parts:splitOutside(m[1],'|').map(s=>s.trim())};
  if(m=t.match(/^(двойная\s+)?стрелка\s*:\s*(.*)$/))return{kind:'arrow',dbl:!!m[1],text:m[2]};
  if(m=t.match(/^правило\s*(?:(?:→|->)\s*([^:]+?))?\s*:\s*(.*)$/))return{kind:'rule',targets:m[1]?m[1].split(',').map(s=>s.trim().replace(/^[«"]|[»"]$/g,'')).filter(Boolean):[],text:m[2]};
  if(m=t.match(/^(контрпример|пример)\s*:\s*(.*)$/))return{kind:'example',counter:m[1]==='контрпример',text:m[2]};
  if(m=t.match(/^связь\s+(.+?)\s*(?:→|->)\s*(.+?)\s*:\s*(.*)$/))return{kind:'dep',a:m[1].replace(/^[«"]|[»"]$/g,''),b:m[2].replace(/^[«"]|[»"]$/g,''),text:m[3]};
  if(m=t.match(/^(выноска|уточнение|пояснение)(?:\s+(снизу|справа))?\s*:\s*(.*)$/))return{kind:'callout',square:m[1]==='уточнение',pos:m[2]||'',text:m[3]};
  if(m=t.match(/^рисунок\s*:\s*(.*)$/))return{kind:'image',text:m[1]};
  if(m=t.match(/^код\s*:\s?(.*)$/))return{kind:'code',text:m[1]};
  if(m=t.match(/^!\[([^\]]*)\]\(([^)]*)\)$/))return{kind:'image',text:m[1]||m[2]};
  if(t.startsWith('`')&&(t.split('`').length-1)%2===1)return{kind:'code',text:t.slice(1)};
  // 2) маркеры начала строки сильнее операторов внутри строки
  const opInside=x=>splitOutside(x,'->').length>1||splitOutside(x,'><').length>1;
  const mk=(kind,text,extra)=>{if(opInside(text))WARN.push(`Строка «${t.slice(0,40)}»: начинается с маркера, поэтому «->»/«><» внутри показаны как текст. Для запоминателя или сравнения уберите маркер.`);return{kind,text,...extra};};
  if(m=t.match(/^[-–]\s+(.*)$/))return mk('item',m[1]);
  if(m=t.match(/^(\d+[.)])\s+(.*)$/))return mk('item',m[1]+' '+m[2],{num:true});
  if(m=t.match(/^[*•]\s+(.*)$/))return mk('marker',m[1]);
  if(m=t.match(/^\|\s+(.*)$/))return{kind:'bar',text:m[1]};
  if(m=t.match(/^\}\s*(.*)$/))return{kind:'brace',text:m[1]};
  if(m=t.match(/^\$\$(.*)\$\$$/))return{kind:'formula',text:m[1]};
  if(REL.test(t))return{kind:'text',text:t,rel:true};   // строка выкладки
  // 3) операторы: «><» сильнее «->»
  {const pp=splitOutside(t,'><');if(pp.length>=2){if(splitOutside(t,'->').length>1)WARN.push(`Строка «${t.slice(0,40)}»: и «><», и «->» — понято как сравнение.`);
    return{kind:'pair',left:pp[0].trim(),right:pp.slice(1).join('><').trim()};}}
  if((m=splitOutside(t,'->')).length>=2){m=[t,m[0],m.slice(1).join('->')];
    let left=m[1].trim(),def=false,mm;
    if(mm=left.match(/^(?:опр|определение)\s*:\s*(.+)$/)){def=true;const term=mm[1].trim();
      left=term.split(/\s+/).length<=2?'Что такое '+lowerFirst(term):term;}
    else if(mm=left.match(new RegExp('^('+KINDS+')\\s*:\\s*(.+)$'))){left=mm[1][0].toUpperCase()+mm[1].slice(1)+' '+mm[2].trim();}
    return{kind:'memo',pointer:left,text:m[2].trim(),def};
  }
  {const mk2=t.match(new RegExp('^('+KINDS+')\\s*:\\s*(.+)$'));if(mk2)return{kind:'memo',pointer:mk2[1][0].toUpperCase()+mk2[1].slice(1),text:mk2[2].trim(),def:false};}
  return{kind:'text',text:t};
}
// обоснование в конце строки выкладки: «… {причина}», не после «]»
function splitReason(s){s=s.trimEnd();if(!s.endsWith('}'))return[s,''];
  let d=0,math=false,code=false;
  for(let i=s.length-1;i>=0;i--){const ch=s[i];if(ch==='$')math=!math;else if(ch==='`')code=!code;
    if(math||code)continue;if(ch==='}')d++;else if(ch==='{'){d--;if(d===0){const pre=s.slice(0,i).trimEnd();if(pre.endsWith(']'))return[s,''];return[pre,s.slice(i+1,-1).trim()];}}}
  return[s,''];}
// что может стоять внутри чего (вариант Б: «фигура и её содержимое»)
const INNER=['marker','bar','brace','formula','code','image','text','blank'], HANG=['callout','example','rule'];
const ALLOW={root:['header','link','memo','pair','item','group','rule','example','arrow','image','code','callout','marker','text','dep','formula','blank'],
  header:['callout','rule','blank'],memo:[...INNER,...HANG,'item'],item:[...INNER,...HANG,'item','group'],group:['item','group','text','marker','callout','example','blank'],
  pair:['marker','blank'],example:['dep','text','code','formula','blank','marker'],rule:[...INNER],callout:['marker','text','formula','code','blank','bar'],
  link:[],arrow:[],image:[],code:[],dep:[],marker:['marker','text'],bar:[],brace:[],formula:[],text:[...INNER,...HANG,'item','group']};
const KNAME={header:'тема:',link:'связка:',memo:'запоминатель',pair:'сравнение ><',item:'пункт',group:'группа',rule:'правило:',example:'пример:',arrow:'стрелка:',image:'рисунок:',code:'код',callout:'выноска:',marker:'маркер *',bar:'черта |',brace:'скобка }',formula:'формула $$',dep:'связь',text:'текст'};
function validate(node){for(const c of node.children){const al=ALLOW[node.kind]||[];
    if(c.kind!=='blank'&&!al.includes(c.kind))WARN.push(`«${KNAME[c.kind]||c.kind}» не может стоять внутри «${KNAME[node.kind]||node.kind}» — проверьте отступ.`);
    validate(c);}}
function parse(src){
  const root={kind:'root',children:[],indent:-1},stack=[root],opts={};
  const srcLines=src.replace(/\t/g,'    ').split('\n');const joined=[];
  for(const l of srcLines){if(joined.length&&/\\$/.test(joined[joined.length-1])&&!/\\\\$/.test(joined[joined.length-1]))joined[joined.length-1]=joined[joined.length-1].slice(0,-1)+' '+l.trim();else joined.push(l);}
  for(const raw of joined){
    if(/^\s*#/.test(raw))continue;
    const t=raw.trim();
    if(!t){const top=stack[stack.length-1];if(top!==root)top.children.push({kind:'blank',children:[]});continue;}
    const ind=raw.match(/^ */)[0].length;
    const n=classify(t);n.indent=ind;n.children=[];
    if(n.kind==='code'){n.text=raw.slice(raw.indexOf('`')+1);} // пробелы кода сохраняем
    while(stack[stack.length-1].indent>=ind&&!(n.kind==='code'&&stack[stack.length-1].kind!=='root'&&stack.length>1&&stack[stack.length-1].indent===ind&&false))stack.pop();
    if(n.kind==='opt'){opts[n.key]=n.val;continue;}
    stack[stack.length-1].children.push(n);stack.push(n);
  }
  // «*… / >< / *…» — пара списков
  {const k=root.children,out=[];for(let i=0;i<k.length;i++){const c=k[i];
    if(c.kind==='pair'&&!c.left&&!c.right&&!c.children.length){const lz=[];while(out.length&&out[out.length-1].kind==='marker')lz.unshift(out.pop());
      const rz=[];while(i+1<k.length&&k[i+1].kind==='marker')rz.push(k[++i]);
      c.lz=lz.map(m=>({t:'m',text:m.text}));c.rz=rz.map(m=>({t:'m',text:m.text}));}
    out.push(c);}root.children=out;}
  // связь после примера относится к нему
  {const k=root.children,out=[];for(const c of k){if(c.kind==='dep'){const last=[...out].reverse().find(q=>q.kind==='example');if(last){last.children.push(c);continue;}}out.push(c);}root.children=out;}
  (function fix(node){for(const c of node.children){fix(c);
    if((c.kind==='text'||c.kind==='item')&&!c.rel&&c.children.some(k=>['item','group'].includes(k.kind)||(k.kind==='text'&&!k.rel)))c.kind='group';
    else if(c.kind==='text'&&node.kind==='root'&&!c.rel)c.kind='item';}})(root);
  validate(root);
  return{root,opts};
}
function content(node){
  const z=[];const pushP=(text,gap)=>{const fm=String(text).match(/^\$\$(.*)\$\$$/);z.push(fm?{t:'f',text:fm[1],gap}:{t:hasSeg(text)?'rz':'p',text,gap});};
  if(node.text)pushP(node.text);
  let gap=false;
  for(const c of node.children){
    if(c.kind==='blank'){gap=true;continue;}
    if(c.kind==='text'&&c.rel){const last=z[z.length-1];const [ex,why]=splitReason(c.text.replace(REL,''));const sign=c.text.match(REL)[1];
      const row={sign:RELSYM[sign]||sign,ex:ex.trim(),why};
      if(last&&last.t==='deriv')last.rows.push(row);
      else if(last&&(last.t==='p'||last.t==='rz')&&!gap){z.pop();const [e0,w0]=splitReason(last.text);z.push({t:'deriv',rows:[{sign:'',ex:e0,why:w0},row]});}
      else z.push({t:'deriv',rows:[row],gap});
      gap=false;continue;}
    if(c.kind==='text'){const last=z[z.length-1];if(last&&last.t==='p'&&!gap&&!hasSeg(c.text))last.text+=' '+c.text;else pushP(c.text,gap);}
    else if(c.kind==='marker'||c.kind==='item')z.push({t:'m',text:c.text,gap});
    else if(c.kind==='bar')z.push({t:'bar',text:c.text,gap});
    else if(c.kind==='formula')z.push({t:'f',text:c.text,gap});
    else if(c.kind==='code'){const last=z[z.length-1];if(last&&last.t==='code'&&!gap)last.lines.push(c.text);else z.push({t:'code',lines:[c.text],gap});}
    else if(c.kind==='image')z.push({t:'img',text:c.text,gap});
    else if(c.kind==='brace'){const items=[];while(z.length&&z[z.length-1].t==='m')items.unshift(z.pop());z.push({t:'brace',items,text:c.text,gap});}
    gap=false;
  }
  return z;
}

/* ================== РАЗБОР (бывшая МОЛНИЯ): [часть]{подпись} ================== */
function sentenceTokens(s){return scanSegs(s);}
function pill(text,maxW){const ls=wrap(text,maxW-18);const w=Math.max(...ls.map(l=>tw(l)))+20;return{ls,w,h:ls.length*LH+8};}
function spreadRow(arr,lo,hi){arr.sort((p,q)=>p.t-q.t);arr.forEach(o=>o.x=o.t-o.c.w/2);
  for(let i=0;i<arr.length;i++)arr[i].x=Math.max(arr[i].x,lo,i?arr[i-1].x+arr[i-1].c.w+8:lo);
  for(let i=arr.length-1;i>=0;i--)arr[i].x=Math.min(arr[i].x,i<arr.length-1?arr[i+1].x-arr[i].c.w-8:hi-arr[i].c.w);}
/* razbor: text с сегментами. o.box — белая рамка «Пример»; o.rules — правила-выноски со стрелками; o.deps — ломаные стрелки */
let NUMNEAR=false; // номер ГНОМа вплотную к блоку (как рис. 30 Паронджанова); выноски справа уходят под блок
let STRICT=false; // вариант Б: одна ширина в колонке сцены, отбивки внутри фигуры
let LSTYLE='auto'; // стиль подписей разбора: auto | pill | inset | white | brace
function razbor(text,maxW,o={}){
  const fs=o.size||FS,bold=!!o.bold,pad=o.box?14:0;const style=o.style||'pill';
  const toks=sentenceTokens(text);const segH=fs+9,lh=segH+7;const innerW=maxW-2*pad;
  const lines=[[]];let cw=0;const segs=[];
  const add=p=>{if(cw+p.w>innerW&&cw>0){lines.push([]);cw=0;if(p.t==='txt'&&!p.text.trim())return;}
    p.x=cw;lines[lines.length-1].push(p);cw+=p.w;};
  for(const t of toks){
    if(t.t==='txt')(t.text.match(/\$[^$]*\$|`[^`]*`|\s+|[^\s$`]+|[$`]/g)||[]).forEach(w=>add({t:'txt',text:w,w:tw(pretty(w),bold,fs,/^`/.test(w))}));
    else{const empty=!t.text.trim();const mono=/^`[^`]*`$/.test(t.text.trim());const pt=pretty(t.text);
      const w=empty?10:tw(pt,bold,fs,mono)+(style==='brace'?4:(pt.trim().length<=2?12:16));const seg={...t,pt,w,mono,empty};segs.push(seg);add(seg);}
  }
  const lineW=lines.map(l=>l.length?Math.max(...l.map(p=>p.x+p.w)):0);const contentW=Math.max(...lineW,10);
  const boxW=o.box?Math.min(maxW,Math.max(o.minBox||0,contentW+2*pad+4)):contentW;const bx=o.box?(maxW-boxW)/2:0;
  const findSeg=n=>{const q=n.toLowerCase();return segs.find(g=>g.label.toLowerCase()===q)||segs.find(g=>pretty(g.text).trim().toLowerCase()===q)||segs.find(g=>g.label.toLowerCase().includes(q))||segs.find(g=>g.text&&pretty(g.text).toLowerCase().includes(q));};
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
  const rl=rules.map(r=>{const ls=wrap(r.text,ruleW-16);return{r,ls,h:ls.length*LH+12};});
  const rh=rl.length?Math.max(...rl.map(q=>q.h)):0;
  // полоса связей: высота — по самой высокой подписи связи
  const dh=deps.length?Math.max(...deps.map(d=>pill(d.text,220).h)):0;
  const depTop=(rh?rh+14:0)+Math.max(10,dh/2+2);
  let y=deps.length?depTop+Math.max(20,dh/2+12):(rh?rh+30:0);
  const boxY=y;const sy=boxY+(o.box?9:0);
  lines.forEach((ln,li)=>{const lx=bx+(o.box?(boxW-lineW[li])/2:0);ln.forEach(p=>{p.ax=lx+p.x;p.ay=sy+li*lh;});});
  const boxH=lines.length*lh-7+(o.box?18:0)+(style==='brace'?6:0);
  if(o.box)svg+=rect(bx,boxY,boxW,boxH,C.ex,C.exb,0,1.6);
  const pillF=style==='white'?'#fff':C.fill, pillS=style==='white'?C.exb:C.line;
  lines.forEach(ln=>ln.forEach(p=>{
    if(p.t==='txt')svg+=txt([pretty(p.text)],p.ax,p.ay+(segH-fs)/2,{bold,size:fs,mono:/^`/.test(p.text)});
    else if(p.empty)svg+=L(p.ax+p.w/2,p.ay+2,p.ax+p.w/2,p.ay+segH-2,C.exb,1,'2 2'); // пустое место
    else if(style==='brace'){svg+=txt([p.pt],p.ax+p.w/2,p.ay+(segH-fs)/2,{anchor:'middle',bold,size:fs,mono:p.mono});
      if(p.label){const y1=p.ay+segH,x1=p.ax+1,x2=p.ax+p.w-1,xm=(x1+x2)/2;svg+=`<path d="M${n1(x1)},${n1(y1-3)}q0,4 4,4H${n1(xm-3)}q3,0 3,4q0,-4 3,-4H${n1(x2-4)}q4,0 4,-4" fill="none" stroke="${C.line}" stroke-width="1.2"/>`;}}
    else svg+=rect(p.ax+1,p.ay,p.w-2,segH,'#fff',C.exb,segH/2,1.1)+txt([p.pt],p.ax+p.w/2,p.ay+(segH-fs)/2,{anchor:'middle',bold,size:fs,mono:p.mono});
  }));
  if(rl.length){const objs=rl.map(q=>{const tg=q.r.targets.map(n=>{const s=findSeg(n);if(!s)WARN.push(`Правило: не найдена часть «${n}» в примере`);return s;}).filter(Boolean);
      return{q,tg,t:tg.length?tg.reduce((s,g)=>s+g.ax+g.w/2,0)/tg.length:maxW/2,c:{w:ruleW}};});
    spreadRow(objs,0,maxW);
    if(ruleSide)objs.sort((a,b)=>a.t-b.t).forEach((ob,i)=>ob.x=ruleX0+i*(ruleW+12));
    objs.forEach(({q,tg,x})=>{const ry=rh-q.h;svg+=rect(x,ry,ruleW,q.h,C.fill,C.line,3,1.2);
      tg.forEach(g=>{const sR=ruleSide==='R'&&g.ax+g.w<x+10,sL=ruleSide==='L'&&g.ax>x+ruleW-10;
        const gx=sR?g.ax+g.w+1:sL?g.ax-1:g.ax+g.w/2,gy=(sR||sL)?g.ay+segH/2:g.ay;const b=sR?x+10:sL?x+ruleW-26:Math.max(x+10,Math.min(x+ruleW-26,gx-8));svg+=wedge(b,ry+q.h,b+16,ry+q.h,gx,gy,C.fill,C.line);});
      svg+=txt(q.ls,x+ruleW/2,ry+6,{anchor:'middle'});});}
  deps.forEach(d=>{const A=findSeg(d.a),B=findSeg(d.b);if(!A||!B){WARN.push(`Связь: не найдены части «${d.a}» → «${d.b}»`);return;}
    const ax=A.ax+A.w/2,bxx=B.ax+B.w/2,top=depTop;
    svg+=`<path d="M${n1(ax)},${n1(A.ay)}V${n1(top)}H${n1(bxx)}V${n1(B.ay-3)}" fill="none" stroke="${C.line}" stroke-width="1.8"/><path d="M${n1(bxx-5)},${n1(B.ay-9)}L${n1(bxx)},${n1(B.ay)}L${n1(bxx+5)},${n1(B.ay-9)}Z" fill="${C.line}"/>`;
    const c=pill(d.text,220);const px=Math.max(0,Math.min(maxW-c.w,depPillX(ax,bxx,c.w,ruleSide)));svg+=rect(px,top-c.h/2,c.w,c.h,C.fill,C.line,c.h/2,1.1)+txt(c.ls,px+c.w/2,top-c.h/2+4,{anchor:'middle'});});
  y=boxY+boxH;
  // подписи снизу: текст примера НЕ раздвигается; подписи раскладываются по рядам,
  // хвост — вертикальный, хвосты не пересекают чужие подписи
  const bl=segs.filter(g=>g.label).map(g=>({g,c:style==='brace'?{ls:wrap(g.label,140,false,FS-1),w:0,h:0}:pill(g.label,150),t:g.ax+g.w/2}));
  if(bl.length){
    if(style==='brace')bl.forEach(o=>{o.c.w=Math.max(...o.c.ls.map(l=>tw(l,false,FS-1)))+6;o.c.h=o.c.ls.length*(FS+2)+2;});
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
    const tailOf=(o,x,r)=>{const b=Math.max(x+4,Math.min(x+o.c.w-16,o.t-6));return[b+6,by0+r*rowH,o.t,o.g.ay+segH];};
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
    placed.forEach(o=>{const yy=by+o.r*rowH;const tx=o.t,ty=o.g.ay+segH+(style==='brace'?5:0);
      if(style==='brace'){if(yy>ty+2)svg+=L(tx,ty,Math.max(o.x+4,Math.min(o.x+o.c.w-4,tx)),yy,C.line,1);
        svg+=txt(o.c.ls,o.x+o.c.w/2,yy,{anchor:'middle',italic:true,size:FS-1,lh:FS+2,fill:'#5a2a00'});}
      else{svg+=rect(o.x,yy,o.c.w,o.c.h,pillF,pillS,o.c.h/2,1.1);
        const b=Math.max(o.x+4,Math.min(o.x+o.c.w-16,tx-6));
        svg+=wedge(b,yy,b+12,yy,tx,ty,pillF,pillS)+txt(o.c.ls,o.x+o.c.w/2,yy+4,{anchor:'middle'});}});
    y=by+nR*rowH-6;
    if(bl.length>7)WARN.push('В одном примере больше 7 подписей — разбейте пример на два (одна зона — одна мысль).');
  }
  return{w:o.box?maxW:Math.max(contentW,...bl.map(o=>o.x+o.c.w)),h:y,svg,segs};
}

/* ============================ СОДЕРЖИМОЕ ФИГУР ============================ */
function rich(z,w,o={}){
  const P=8,parts=[];let h=P;
  const iw=w-2*P-(o.padL||0)-(o.padR||0),x0=P+(o.padL||0);
  const add=(f,hh)=>{const off=h;parts.push((x,y)=>f(x,y+off));h+=hh+4;};
  let prev=null;const GAP=7;
  const mlOf=it=>it.t==='m'?wrap(it.text,iw-14).length>1:it.t==='p'?wrap(it.text,iw,o.bold).length>1:true;
  for(const it of z){
    if(it.gap)h+=6;
    if(STRICT&&prev){const ml=mlOf(it);
      // отбивка: между частями разного вида и между многострочными пунктами; однострочные пункты — плотно
      if(it.t!==prev.t||(it.t==='m'&&(ml||prev.ml)))h+=GAP;
      it.ml=ml;}
    else if(STRICT)it.ml=mlOf(it);
    prev=it;
    if(it.t==='p'){const ls=wrap(it.text,iw,o.bold);add((x,y)=>txt(ls,x+x0+(o.center?iw/2:0),y,{anchor:o.center?'middle':'start',bold:o.bold}),ls.length*LH);}
    else if(it.t==='rz'){const st=LSTYLE==='auto'?(o.onWhite?'pill':'inset'):LSTYLE;
      if(st==='inset'){const r=razbor(it.text,iw-16,{style:'pill'});const bw=Math.min(iw,r.w+16),dx=o.center?(iw-bw)/2:0;
        add((x,y)=>rect(x+x0+dx,y,bw,r.h+12,C.ex,C.exb,4,1)+G(x+x0+dx+8,y+6,r.svg),r.h+12);}
      else{const r=razbor(it.text,iw,{style:st});const dx=o.center?(iw-r.w)/2:0;add((x,y)=>G(x+x0+Math.max(0,dx),y,r.svg),r.h);}}
    else if(it.t==='deriv'){const inset=!o.onWhite;const iw2=iw-(inset?16:0);
      const sw=Math.max(...it.rows.map(r=>tw(r.sign,false,FS+1)))+8;
      const ex=it.rows.map(r=>wrap(r.ex,iw2*0.62-sw,false,FS+1));const exW=Math.min(iw2*0.62,Math.max(...ex.map(l=>Math.max(...l.map(q=>tw(q,false,FS+1)))))+sw+14);
      const why=it.rows.map(r=>r.why?wrap(r.why,iw2-exW-18,false,FS-1):[]);
      const rh=it.rows.map((r,i)=>Math.max(ex[i].length*(FS+5),why[i].length*(FS+2)));const H=rh.reduce((a,b)=>a+b+5,0)+(inset?10:0);
      add((x,y)=>{const X=x+x0+(inset?8:0);let s2=inset?rect(x+x0,y,iw,H,C.ex,C.exb,4,1):'';let yy=y+(inset?5:0);
        it.rows.forEach((r,i)=>{s2+=txt([r.sign],X+sw-4,yy,{anchor:'end',size:FS+1,bold:true})+txt(ex[i],X+sw+2,yy,{size:FS+1,lh:FS+5});
          if(r.why){s2+=L(X+exW-4,yy+2,X+exW-4,yy+rh[i]-2,C.line,1)+txt(why[i],X+exW+4,yy+1,{italic:true,size:FS-1,lh:FS+2,fill:'#5a2a00'});}
          yy+=rh[i]+5;});return s2;},H);}
    else if(it.t==='m'){const ls=wrap(it.text,iw-14);add((x,y)=>`<circle cx="${n1(x+x0+4)}" cy="${n1(y+7)}" r="4.2" fill="${C.mark}"/>`+txt(ls,x+x0+14,y),ls.length*LH);}
    else if(it.t==='bar'){const ls=wrap(it.text,iw-12);const hh=ls.length*LH;add((x,y)=>L(x+x0+2,y+1,x+x0+2,y+hh-1,'#333',2)+txt(ls,x+x0+10,y),hh);}
    else if(it.t==='f'){const ls=wrap('$'+it.text+'$',iw-20,true,15);const hh=ls.length*19+14;add((x,y)=>rect(x+x0,y,iw,hh,'#fff',C.line,0,2)+txt(ls,x+x0+iw/2,y+7,{anchor:'middle',bold:true,size:15,lh:19}),hh);}
    else if(it.t==='code'){const cl=it.lines.map(l=>l.replace(/\s+$/,''));const hh=cl.length*15+10;const cw=Math.min(iw,Math.max(...cl.map(l=>tw(l,false,12,true)))+16);
      add((x,y)=>rect(x+x0,y,cw,hh,C.code,C.codeb,3,1)+txt(cl,x+x0+8,y+5,{mono:true,size:12,lh:15}),hh);}
    else if(it.t==='img'){const hh=64;add((x,y)=>rect(x+x0,y,iw,hh,'#fff','#999',4,1,'5 3')+txt(['рисунок: '+it.text],x+x0+iw/2,y+hh/2-8,{anchor:'middle',italic:true,fill:'#666'}),hh);}
    else if(it.t==='brace'){const lw=iw*0.55;let hh=0;const rows=it.items.map(m=>{const ls=wrap(m.text,lw-14);const r={ls,y:hh};hh+=ls.length*LH;return r;});
      const rl=wrap(it.text,iw-lw-22);hh=Math.max(hh,rl.length*LH);
      add((x,yy)=>{const bx=x+x0+lw+2;let s=rows.map(r=>`<circle cx="${n1(x+x0+4)}" cy="${n1(yy+r.y+7)}" r="4.2" fill="${C.mark}"/>`+txt(r.ls,x+x0+14,yy+r.y)).join('');
        const y1=yy+1,y2=yy+hh-1,ym=(y1+y2)/2;
        s+=`<path d="M${n1(bx)},${n1(y1)}q6,0 6,6V${n1(ym-5)}q0,5 6,5q-6,0 -6,5V${n1(y2-6)}q0,6 -6,6" fill="none" stroke="#333" stroke-width="1.3"/>`;
        return s+txt(rl,bx+16,ym-rl.length*LH/2);},hh);}
  }
  h+=P-4;
  return{h:Math.max(h,o.minH||0),svg:(x,y,hh)=>{const dy=hh?(hh-h)/2:0;return parts.map(p=>p(x,y+dy)).join('');}};
}
// привязанный пример (белый) под фигурой
function attachedExample(c,w){
  const z=content({text:c.text,children:c.children});const r=rich(z,w,{center:!z.some(q=>q.t==='m'||q.t==='code'),onWhite:true});const th=LH+2;const h=r.h+th;
  return{w,h,svg:(x,y,t)=>{let s=rect(x,y,w,h,C.ex,C.exb,6,1.2);
    if(t)s+=wedge(x+w*0.3-8,y,x+w*0.3+8,y,t.tx,t.ty,C.ex,C.exb);
    return s+txt([c.counter?'Контрпример ✗':'Пример'],x+w/2,y+5,{anchor:'middle',italic:true,fill:c.counter?'#8B0000':'#555'})+r.svg(x,y+th);}};
}
function calloutEl(c,w){
  const z=content(c);const r=rich(z,w,{center:!z.some(q=>q.t==='m'||q.t==='code')});const h=r.h;
  return{w,h,svg:(x,y,t)=>{let s=rect(x,y,w,h,C.fill,C.line,c.square?3:10,1.2);
    if(t){if(t.side==='left'){const by=y+Math.min(h/2,22);s+=wedge(x,by-7,x,by+7,t.tx+1,t.ty,C.fill,C.line);}
      else{const bx=x+w*0.3;s+=wedge(bx-8,y,bx+8,y,t.tx,t.ty,C.fill,C.line);}}
    return s+r.svg(x,y);}};
}
// всё, что висит под фигурой: выноски снизу и примеры
function hangers(node,w,below){
  const out=[];for(const c of node.children){
    const hw=STRICT?Math.min(w*0.85,360):0;
    if(c.kind==='example')out.push(attachedExample(c,hw||Math.min(w*0.9,Math.max(260,w*0.6))));
    else if(c.kind==='rule')out.push(calloutEl({...c,square:true},hw||Math.min(w*0.8,320)));
    else if(c.kind==='callout'&&below(c))out.push(calloutEl(c,hw||Math.min(w*0.8,320)));}
  return out;
}
function memoEl(node,W,o={}){
  const pw=o.pw||150,numW=o.num?40:0;const near=o.num&&NUMNEAR;
  const callouts=node.children.filter(c=>c.kind==='callout');
  const right=o.cr&&!near?callouts.filter(c=>c.pos==='справа'||(!c.pos&&c.text.length<=70&&!c.children.length)):[];
  const crW=o.cr&&!near?170:0;
  const mw=W-pw-10-numW-crW;
  const pz=hasSeg(node.pointer)?[{t:'rz',text:node.pointer}]:null;
  const pl=wrapNH(node.pointer,pw-26);const pr=pz?rich(pz,pw-12):null;const pH=pr?pr.h:pl.length*LH+14;
  const r=rich(content(node),mw);const rcs=right.map(c=>calloutEl(c,crW-14));const h=Math.max(pH,r.h,30,...rcs.map(c=>c.h));
  const hs=hangers(node,mw,c=>!right.includes(c));
  const bh=hs.reduce((s,c)=>s+c.h+22,0);
  return{h:h+bh,cy:h/2,svg:(x,y)=>{
    let s=pointerPath(x,y+(h-pH)/2,pw,pH)+(pr?pr.svg(x,y+(h-pH)/2):txt(pl,x+(pw-12)/2,y+(h-pH)/2+7,{anchor:'middle'}));
    s+=`<g class="memo" onclick="this.classList.toggle('open')">`+memoRect(x+pw+10,y,mw,h)+`<g class="memo-t">`+r.svg(x+pw+10,y,h)+`</g></g>`;
    if(o.num)s+=rect(x+W-numW+10,y+h/2-13,26,26,C.fill)+txt([String(o.num)],x+W-numW+23,y+h/2-8,{anchor:'middle',bold:true});
    rcs.forEach(c=>{const cx=x+pw+10+mw+14;const yy=y+Math.max(0,(h-c.h)/2);s+=c.svg(cx,yy,{side:'left',tx:x+pw+10+mw,ty:yy+Math.min(c.h/2,22)});});
    let by=y+h+22;hs.forEach(c=>{const cx=x+pw+10+mw-c.w-10;s+=c.svg(cx,by,{side:'top',tx:cx+c.w*0.3+14,ty:by-21});by+=c.h+22;});
    return s;}};
}
function itemEl(node,w,o={}){
  const z=content(node);let ctr=false;
  if(o.auto&&STRICT&&z.length===1&&z[0].t==='p'&&wrap(z[0].text,w-16).length===1)ctr=true; // одна строка — по центру
  const r=rich(z,w,{center:ctr});
  const hs=hangers(node,w,()=>true);const bh=hs.reduce((s,c)=>s+c.h+20,0);
  return{h:r.h+bh,cy:r.h/2,svg:(x,y)=>{let s=`<g class="memo" onclick="this.classList.toggle('open')">`+memoRect(x,y,w,r.h)+`<g class="memo-t">`+r.svg(x,y)+`</g></g>`;
    let by=y+r.h+20;hs.forEach(c=>{const cx=x+w-c.w-20;s+=c.svg(cx,by,{side:'top',tx:cx+c.w*0.3+12,ty:by-19});by+=c.h+20;});return s;}};
}
function boxEl(text,w,o={}){
  const z=hasSeg(text)?[{t:'rz',text}]:null;const r=z?rich(z,w,{center:true}):null;
  let sz=FS;if(o.nohyph){while(sz>FS-1&&longWord(text,o.bold,sz)>w-16)sz--;}
  const ls=o.nohyph?wrapNH(text,w-16,o.bold,sz):wrap(text,w-16,o.bold);const lh=sz+3;const h=Math.max(r?r.h:ls.length*lh+12,o.minH||0);
  return{w,h,svg:(x,y,hh)=>{const H=hh||h;let s='';
    if(o.shape==='round')s+=rect(x,y,w,H,o.fill||C.orange,C.line,Math.min(12,H/2));
    else if(o.shape==='plain')s+=rect(x,y,w,H,C.fill);
    else s+=memoRect(x,y,w,H);
    const left=o.auto&&STRICT&&ls.length>1;
    return s+(r?r.svg(x,y,H):txt(ls,left?x+8:x+w/2,y+(H-ls.length*lh)/2,{anchor:left?'start':'middle',bold:o.bold,size:sz,lh}));}};
}
function headerEl(text,maxW){
  const w0=Math.min(maxW,Math.max(220,tw(pretty(text),true)*0.75+90));
  const ls=wrapNH(text,w0-70,true);const h=ls.length*LH+24;
  return{w:w0,h,svg:(x,y)=>headerEllipse(x,y,w0,h)+txt(ls,x+w0/2,y+12,{anchor:'middle',bold:true})};
}

/* ============================ ВЫБОР СХЕМЫ ============================ */
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
const M0=10;
let NUM=1;
function layGnom(root,W,opts){
  let y=M0,s='';const num=(opts['нумерация']||'да')!=='нет';
  const cr=root.children.some(c=>c.kind==='memo'&&c.children.some(q=>q.kind==='callout'&&q.pos!=='снизу'));
  const PW=fitPW(root.children.filter(c=>c.kind==='memo'),150,(W-2*M0)*0.4);
  for(const c of root.children){if(c.kind!=='memo')continue;const e=memoEl(c,W-2*M0,{num:num?NUM++:0,cr,pw:PW});s+=e.svg(M0,y);y+=e.h+14;}
  return{h:y,svg:s};
}
function headerBlock(hd,W,maxW,centerX,minX){ // заголовок + выноска справа от него
  const he=headerEl(hd?hd.text:'',maxW);const hcs=hd?hd.children.filter(c=>c.kind==='callout'||c.kind==='rule'):[];
  let hx=centerX-he.w/2;if(minX!==undefined)hx=Math.max(minX,hx);
  const hc=hcs.length?calloutEl({...hcs[0],square:hcs[0].square||hcs[0].kind==='rule'},Math.min(230,Math.max(150,W-he.w-60))):null;
  if(hc&&hx+he.w+hc.w+30>W)hx=Math.max(minX!==undefined?minX:M0,W-M0-he.w-hc.w-24);
  const hcy=M0+Math.max(he.h/2,hc?Math.min(hc.h/2,24):0);const hy=hcy-he.h/2;
  let s=he.svg(hx,hy);if(hc)s+=hc.svg(hx+he.w+18,hcy-Math.min(hc.h/2,24),{side:'left',tx:hx+he.w-2,ty:hcy});
  const bottom=Math.max(hy+he.h,hc?hcy-Math.min(hc.h/2,24)+hc.h:0);
  return{svg:s,hx,hw:he.w,hcy,bottom,cx:hx+he.w/2,hBottom:hy+he.h};
}
function laySpine(root,W){
  const k=root.children;const hd=k.find(c=>c.kind==='header');const link=k.find(c=>c.kind==='link');
  const linkE=link?boxEl(link.parts[0],Math.min(W*0.42,Math.max(80,tw(pretty(link.parts[0]),true)+30)),{shape:'round',bold:true}):null;
  const sx=M0+(linkE?linkE.w/2:4);let s='',y=M0;
  const hb=headerBlock(hd,W,W*0.62,W/2+10,sx+40);s+=hb.svg;const hcy=hb.hcy;s+=L(sx,hcy,hb.hx,hcy);
  y=hb.bottom+14;let top=hcy;
  if(linkE){s+=L(sx,hcy,sx,y);s+=linkE.svg(sx-linkE.w/2,y);top=y+linkE.h;y+=linkE.h+12;}
  const rx=sx+16,rw=W-rx-M0;let lastCy=top;
  const cr=k.some(c=>c.kind==='memo'&&c.children.some(q=>q.kind==='callout'&&q.pos!=='снизу'));
  for(const c of k){let e;
    if(c.kind==='memo')e=memoEl(c,rw,{cr,pw:fitPW(k.filter(q=>q.kind==='memo'),Math.min(150,rw*0.3),rw*0.4)});
    else if(c.kind==='item'||c.kind==='text')e=itemEl(c,rw);
    else if(c.kind==='group')e=combUnder(c,rw);
    else continue;
    s+=e.svg(rx,y);s+=L(sx,y+e.cy,rx,y+e.cy);lastCy=y+e.cy;y+=e.h+12;}
  s=L(sx,top,sx,lastCy)+s;
  return{h:y,svg:s};
}
function combUnder(g,w){
  const head=itemEl({text:g.text,children:g.children.filter(c=>['callout','example'].includes(c.kind))},w);
  const items=g.children.filter(c=>['item','text','marker'].includes(c.kind));
  const k=items.length<=3?1:(items.length<=8?2:3);const sizes=[...Array(k)].map((_,i)=>Math.floor(items.length/k)+(i<items.length%k?1:0));
  const cx0=14,colW=(w-cx0-(k-1)*14)/k;let st=0;
  const cols=sizes.map(sz=>{let yy=0;const els=items.slice(st,st+sz).map(it=>{const e=itemEl({text:it.text,children:it.children},colW-12);const r={e,y:yy};yy+=e.h+8;return r;});st+=sz;return{els,h:yy};});
  const ch=Math.max(...cols.map(c=>c.h));
  return{h:head.h+12+ch,cy:head.cy,svg:(x,y)=>{let s=head.svg(x,y);const y0=y+head.h+12;
    cols.forEach((c,i)=>{const sx=x+cx0+i*(colW+14);let last=y0;
      c.els.forEach(r=>{s+=r.e.svg(sx+12,y0+r.y);s+=L(sx,y0+r.y+r.e.cy,sx+12,y0+r.y+r.e.cy);last=y0+r.y+r.e.cy;});
      s=L(sx,y+head.h,sx,last)+s;});return s;}};
}
function layRuler(root,W,two){
  const k=root.children;const hd=k.find(c=>c.kind==='header');const items=k.filter(c=>c.kind==='item');
  const hb=headerBlock(hd,W,W*0.6,W/2);let s=hb.svg,y=hb.hBottom;const HX=hb.cx;
  const busY=Math.max(y+14,hb.bottom+6);y=busY+14;const n=items.length,g=12;
  let n1_=two?Math.floor(n/2)+1:n;if(n1_>n)n1_=n;
  let iw=Math.min(150,Math.max(...items.map(i=>tw(pretty(i.text))+22),64));
  if(n1_*iw+(n1_-1)*g>W-2*M0)iw=(W-2*M0-(n1_-1)*g)/n1_;
  const gap=two?Math.max(g,Math.min(40,(W-2*M0-n1_*iw)/(n1_-1||1))):g;
  const rowW=n1_*iw+(n1_-1)*gap,x0=(W-rowW)/2;
  const els=items.map(i=>boxEl(i.text,iw));const h1=Math.max(...els.slice(0,n1_).map(e=>e.h));
  const xs=[];
  els.slice(0,n1_).forEach((e,i)=>{const x=x0+i*(iw+gap);xs.push(x+iw/2);s+=e.svg(x,y,h1);s+=L(x+iw/2,busY,x+iw/2,y);});
  let extra=0;items.slice(0,n1_).forEach((it,i)=>{const c=it.children.find(q=>q.kind==='callout');if(!c)return;const ce=calloutEl(c,iw);s+=ce.svg(x0+i*(iw+gap),y+h1+18,{side:'top',tx:xs[i]+iw*0.15,ty:y+h1});extra=Math.max(extra,ce.h+18);});
  let yEnd=y+h1+extra;
  if(two&&n>n1_){const y2=y+h1+14;const n2=n-n1_;const h2=Math.max(...els.slice(n1_).map(e=>e.h));
    for(let j=0;j<n2;j++){const gx=x0+(j+1)*(iw+gap)-gap/2+(n1_-1-n2)*(iw+gap)/2;s+=els[n1_+j].svg(gx-iw/2,y2,h2);s+=L(gx,busY,gx,y2);xs.push(gx);}
    yEnd=y2+h2;}
  s=L(Math.min(...xs,HX),busY,Math.max(...xs,HX),busY)+L(HX,hb.hBottom,HX,busY)+s;
  return{h:yEnd+M0,svg:s};
}
function layComb(root,W,withLink){
  const k=root.children;const hd=k.find(c=>c.kind==='header');const items=k.filter(c=>c.kind==='item');const link=k.find(c=>c.kind==='link');
  const hb=headerBlock(hd,W,W*0.6,W/2);let s=hb.svg,y=hb.hBottom;const HX=hb.cx;const yB=hb.bottom;
  const nc=items.length<=8?2:3;const sizes=[...Array(nc)].map((_,i)=>Math.floor(items.length/nc)+(i<items.length%nc?1:0));
  const cg=18,colW=(W-2*M0-(nc-1)*cg)/nc;let topY;
  if(withLink&&link){const le=boxEl(link.parts[0],W-2*M0,{shape:'round'});const ly=Math.max(y+12,yB+6);s+=L(HX,y,HX,ly);s+=le.svg(M0,ly);topY=ly+le.h;y=topY+12;}
  else{const busY=Math.max(y+14,yB+6);topY=busY;y=busY+14;const xs=[...Array(nc)].map((_,i)=>M0+i*(colW+cg)+2);s+=L(Math.min(xs[0],HX),busY,Math.max(xs[nc-1],HX),busY)+L(HX,hb.hBottom,HX,busY);}
  let maxY=y,st=0;
  sizes.forEach((sz,i)=>{const sx=M0+i*(colW+cg)+2;let yy=y,last=yy;
    items.slice(st,st+sz).forEach(it=>{const e=itemEl(it,colW-14);s+=e.svg(sx+12,yy);s+=L(sx,yy+e.cy,sx+12,yy+e.cy);last=yy+e.cy;yy+=e.h+8;});
    st+=sz;s+=L(sx,topY,sx,last);maxY=Math.max(maxY,yy);});
  return{h:maxY+M0,svg:s};
}
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
    const hw=multi?(link?W-2*(M0+lwMax/2+14):W-2*M0-90):W-2*M0-half*0.4;const ls=wrapNH(hd?hd.text:'',hw-120,true);const hh=ls.length*LH+24;const hx=(W-hw)/2,hcy=y+hh/2;
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
    const ty=y+h/2;[-3.5,0,3.5].forEach(d=>s+=L(lx+lw,ty+d,rxp,ty+d,C.tie,1.6));
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
function layTree(root,W){
  const k=root.children;const hd=k.find(c=>c.kind==='header');
  const kids=n=>n.children.filter(c=>['group','item','text'].includes(c.kind));
  const leaves=n=>{const c=kids(n);return c.length?c.reduce((s,q)=>s+leaves(q),0):1;};
  const rootN={text:hd?hd.text:'',children:k.filter(c=>['group','item','text'].includes(c.kind))};
  const nl=leaves(rootN);const g=10;const fit=(W-2*M0-(nl-1)*g)/nl;
  const allLeaves=[];(function lv(n){const c=kids(n);if(!c.length)allLeaves.push(n);else c.forEach(lv);})(rootN);
  const needWord=Math.max(...allLeaves.map(n=>Math.max(...pretty(n.text).split(/\s+/).map(w=>tw(w)))))+22;
  const needAll=Math.max(...allLeaves.map(n=>tw(pretty(n.text))))+22;
  const lw=Math.max(66,Math.min(150,fit)); // если самое длинное слово шире (needWord) — перенос по слогам в wrap
  function meas(n){const c=kids(n);if(!c.length)n._w=lw;else{c.forEach(meas);n._w=c.reduce((s,q)=>s+q._w,0)+(c.length-1)*g;}}
  meas(rootN);
  // уровни: одна ширина (по самому длинному тексту, но не шире своего места) и одна высота
  const byD=[];(function dd(n,d){if(n!==rootN)(byD[d]=byD[d]||[]).push(n);kids(n).forEach(q=>dd(q,d+1));})(rootN,0);
  byD.forEach(arr=>{if(!arr)return;const want=Math.max(...arr.map(n=>tw(pretty(n.text.replace(/:$/,'')))+24));
    const w=Math.max(Math.min(lw,want),Math.min(want,...arr.map(n=>n._w)));
    arr.forEach(n=>n._e=boxEl(n.text.replace(/:$/,''),Math.min(Math.max(w,kids(n).length?Math.min(want,n._w):w),n._w),{shape:kids(n).length?'plain':undefined,nohyph:kids(n).length>0}));
    const hh=Math.max(...arr.map(n=>n._e.h));arr.forEach(n=>n._h=hh);});
  let s='';let maxY=0;
  if(rootN._w>W-2*M0+1)WARN.push('Дерево не помещается по ширине: сократите подписи или разбейте на два дерева.');
  function draw(n,x,y,isRoot){let h;
    if(isRoot){const he=headerEl(n.text,W*0.6);s+=he.svg(x+(n._w-he.w)/2,y);h=he.h;}
    else{h=n._h||n._e.h;s+=n._e.svg(x+(n._w-n._e.w)/2,y,h);}
    maxY=Math.max(maxY,y+h);const c=kids(n);if(!c.length)return;
    const busY=y+h+12;let cx=x;const centers=[];const cy=busY+12;
    c.forEach(q=>{centers.push(cx+q._w/2);draw(q,cx,cy,false);cx+=q._w+g;});
    s+=L(x+n._w/2,y+h,x+n._w/2,busY);if(centers.length>1)s+=L(centers[0],busY,centers[centers.length-1],busY);
    centers.forEach(c0=>s+=L(c0,busY,c0,cy));}
  draw(rootN,(W-rootN._w)/2,M0,true);
  return{h:maxY+M0,svg:s};
}
// Шеренга: сравнение трёх и более объектов по признакам (таблица Паронджанова)
function layRank(root,W){
  const k=root.children;const hd=k.find(c=>c.kind==='header');const lk=k.find(c=>c.kind==='link');
  const cols=lk.parts;const n=cols.length;const rows=k.filter(c=>c.kind==='memo');
  {const KN={example:'пример:',counter:'контрпример:',image:'рисунок:',callout:'выноска:',item:'пункт',text:'текст',pair:'сравнение «><»',rule:'правило:'};
   k.forEach(c=>{if(!['header','link','memo','arrow','blank'].includes(c.kind))WARN.push(`Шеренга: ${KN[c.kind]||c.kind} не показывается в таблице — вынесите в отдельную зону через ---`);});
   rows.forEach(r=>{if(r.children&&r.children.some(q=>q.kind!=='blank'))WARN.push(`Шеренга: вложенное в строку «${r.pointer}» не показывается — вынесите в отдельную зону через ---`);});}
  const pw=Math.min(W*0.3,Math.max(Math.min(150,Math.max(90,W*0.2)),...k.filter(c=>c.kind==='memo').map(c=>longWord(c.pointer)+30))),gx=8,x0=M0,cx0=x0+pw+12;const cw=(W-M0-cx0-(n-1)*gx)/n;
  if(cw<90)WARN.push('Шеренга: столбцы слишком узкие — сократите число столбцов или текст в ячейках.');
  const hb=headerBlock(hd,W,W*0.6,cx0+(W-M0-cx0)/2);let s=hb.svg;
  const busY=hb.bottom+12;
  const heads=cols.map(c=>boxEl(c,cw,{shape:'round',bold:true,nohyph:true}));const hh=Math.max(...heads.map(h=>h.h));
  let y=busY+12;const xs=[];
  heads.forEach((h,i)=>{const x=cx0+i*(cw+gx);xs.push(x+cw/2);s+=h.svg(x,y,hh);s+=L(x+cw/2,busY,x+cw/2,y);});
  s=L(Math.min(xs[0],hb.cx),busY,Math.max(xs[n-1],hb.cx),busY)+L(hb.cx,hb.hBottom,hb.cx,busY)+s;
  y+=hh+10;
  rows.forEach(r=>{let cells=splitOutside(r.text,' | ').map(q=>q.trim());
    if(cells.length!==n)WARN.push(`Шеренга: в строке «${r.pointer}» ячеек ${cells.length}, а столбцов ${n}`);
    while(cells.length<n)cells.push('—');cells=cells.slice(0,n);
    const rc=cells.map(c=>rich(content({text:c,children:[]}),cw,{center:!hasSeg(c)}));
    const pl=wrapNH(r.pointer,pw-26);const pH=pl.length*LH+14;const h=Math.max(pH,...rc.map(q=>q.h),30);
    s+=pointerPath(x0,y+(h-pH)/2,pw,pH)+txt(pl,x0+(pw-12)/2,y+(h-pH)/2+7,{anchor:'middle'});
    rc.forEach((q,i)=>{const x=cx0+i*(cw+gx);s+=`<g class="memo" onclick="this.classList.toggle('open')">`+memoRect(x,y,cw,h)+`<g class="memo-t">`+q.svg(x,y,h)+`</g></g>`;});
    y+=h+8;});
  k.filter(c=>c.kind==='arrow').forEach(a=>{const bw=Math.min(W-2*M0,420);const e=boxEl(a.text,bw,{shape:'plain'});const cx=cx0+(W-M0-cx0)/2;
    s+=blockArrow(cx,y+2,36,24,true)+e.svg(cx-bw/2,y+25);y+=25+e.h+8;});
  return{h:y+M0,svg:s};
}
// Сцена «Правило и пример» и любые смешанные элементы — сверху вниз, без соединительных линий
function layScene(root,W){
  {const a=root.children;for(let i=1;i<a.length;i++){if(a[i].kind==='rule'&&a[i].targets.length&&a[i-1].kind==='example'){
      let j=i+1;while(j<a.length&&a[j].kind==='rule')j++;if(j<a.length&&a[j].kind==='example')continue;
      const r=a.splice(i,1)[0];let e=i-1;while(e>0&&a[e-1].kind==='rule')e--;a.splice(e,0,r);}}}
  const k=root.children;let y=M0,s='';let rules=[];const iw=W-2*M0;const CW=k.some(c=>['memo','item','text','group'].includes(c.kind))?iw:Math.min(iw,480);const cw=(d)=>STRICT?CW:d;
  const cr=k.some(c=>c.kind==='memo'&&c.children.some(q=>q.kind==='callout'&&q.pos!=='снизу'));
  const flushRules=()=>{rules.forEach(r=>{const e=calloutEl({text:r.text,children:r.children,square:true},cw(Math.min(iw,420)));s+=e.svg((W-e.w)/2,y);y+=e.h+12;
    if(r.targets.length)WARN.push('Правило со стрелкой не нашло пример под собой: поставьте строку «пример:» сразу после правила.');});rules=[];};
  for(let i=0;i<k.length;i++){const c=k[i];
    if(c.kind!=='rule'&&c.kind!=='example')flushRules();
    if(c.kind==='header'){const he=headerEl(c.text,W*0.7);s+=he.svg((W-he.w)/2,y);y+=he.h+12;}
    else if(c.kind==='rule'){if(c.targets.length)rules.push(c);else{const e=calloutEl({text:c.text,children:c.children,square:true},cw(Math.min(iw,420)));s+=e.svg((W-e.w)/2,y);y+=e.h+12;}}
    else if(c.kind==='example'){const deps=c.children.filter(q=>q.kind==='dep');
      const plainEx=!hasSeg(c.text)||c.children.some(q=>q.rel);
      if(plainEx&&!rules.length){const e=attachedExample(c,cw(Math.min(iw,480)));s+=e.svg((W-e.w)/2,y);y+=e.h+12;}
      else{if(c.counter){s+=txt(['Контрпример ✗'],W/2,y,{anchor:'middle',italic:true,fill:'#8B0000'});y+=LH+2;}
        const r=razbor(c.text,iw,{box:true,minBox:STRICT?CW:0,bold:true,size:14,rules,deps,style:LSTYLE==='auto'||LSTYLE==='inset'?'pill':LSTYLE});s+=G(M0,y,r.svg);y+=r.h+14;
        const code=c.children.filter(q=>q.kind==='code');if(code.length){const rr=rich([{t:'code',lines:code.map(q=>q.text)}],iw);s+=rr.svg(M0,y-10);y+=rr.h;}}
      rules=[];}
    else if(c.kind==='memo'){const e=memoEl(c,iw,{cr,pw:fitPW(k.filter(q=>q.kind==='memo'),150,iw*0.4)});s+=e.svg(M0,y);y+=e.h+12;}
    else if(c.kind==='item'||c.kind==='text'||c.kind==='group'){const e=itemEl(c.kind==='group'?{text:c.text,children:c.children.map(q=>q.kind==='item'?{...q,kind:'marker'}:q)}:c,iw,{auto:true});s+=e.svg(M0,y);y+=e.h+12;}
    else if(c.kind==='arrow'){const bw=cw(Math.min(iw,340));const e=boxEl(c.text,bw,{shape:'plain',auto:true});const x=(W-bw)/2;s+=e.svg(x,y);y+=e.h;
      const more=k.slice(i+1).some(q=>q.kind!=='blank');if(more){s+=blockArrow(W/2,y,40,26,false);y+=30;}else y+=12;}
    else if(c.kind==='callout'){const e=calloutEl(c,cw(Math.min(iw,420)));s+=e.svg((W-e.w)/2,y);y+=e.h+12;}
    else if(c.kind==='link'){const e=boxEl(c.parts.join(' · '),Math.min(iw,Math.max(120,tw(pretty(c.parts.join(' · ')),true)+40)),{shape:'round',bold:true});s+=e.svg((W-e.w)/2,y);y+=e.h+12;}
    else if(c.kind==='code'){const lines=[c.text];while(k[i+1]&&k[i+1].kind==='code')lines.push(k[++i].text);const r=rich([{t:'code',lines}],iw);s+=r.svg(M0,y);y+=r.h+6;}
    else if(c.kind==='image'){const r=rich([{t:'img',text:c.text}],STRICT?CW+16:iw);s+=r.svg(STRICT?(W-CW-16)/2:M0,y);y+=r.h+6;}
    else if(c.kind==='pair')WARN.push('Пара «><» внутри сцены не рисуется: вынесите очную ставку в отдельную зону через ---');
  }
  flushRules();
  return{h:y,svg:s};
}

/* ============================ ПРОВЕРКИ ============================ */
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
  WARN=[];NUM=1;Object.assign(C,ro.bw?PAL.bw:PAL.color);LSTYLE=ro.labels||'auto';STRICT=ro.strict!==undefined?!!ro.strict:true;NUMNEAR=ro.numNear!==undefined?!!ro.numNear:true; /* v8: вариант Б и номера у блока — основные */
  const gopts={};src.split('\n').forEach(l=>{const m=normKw(l.trim()).match(OPT);if(m&&m[1]!=='схема')gopts[m[1]]=m[2].trim();});
  if(gopts['ширина'])W=parseInt(gopts['ширина'])||W;
  {const cl=parseInt(gopts['класс']||'0');FS=!cl?13:cl<=6?14:cl<=9?13:12;LH=FS+3;} // кегль по классу (СанПиН: младшим крупнее)
  if(gopts['начать с'])NUM=parseInt(gopts['начать с'])||1;
  const zones=src.split(/^\s*-{3,}\s*$/m);let y=0,svg='',schemes=[],warns=[];
  zones.forEach((z,i)=>{const r=renderZone(z,W,gopts);if(!r)return;
    if(svg)svg+=L(M0,y+4,W-M0,y+4,C.sep,1.5,'6 4'),y+=12;
    svg+=G(0,y,r.svg);y+=r.h;schemes.push(r.scheme);warns.push(...r.warns);});
  if(zones.filter(z=>z.trim()&&z.split('\n').some(l=>l.trim()&&!/^\s*#/.test(l)&&!OPT.test(normKw(l.trim())))).length>5)warns.push(`Зон больше 5 — одна схема перегружена; разделите на две схемы.`);
  return{scheme:schemes.join(' + '),svg,h:y+4,warns:[...warns,...WARN]};
}
