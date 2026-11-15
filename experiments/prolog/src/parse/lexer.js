// ДРАКОН-ГРАФ — модуль перенесён из прототипа graf/engine.js (этап 1, без изменения поведения)


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

export { EN, ENPOS, KINDS, KW, OPT, REL, RELSYM, SCHEME_EN, hasSeg, lowerFirst, normKw, scanSegs, splitOutside };
