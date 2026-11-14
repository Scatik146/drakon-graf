// ДРАКОН-ГРАФ — модуль перенесён из прототипа graf/engine.js (этап 1, без изменения поведения)
import { KINDS, OPT, REL, RELSYM, hasSeg, lowerFirst, normKw, splitOutside } from './lexer.js';
import { S } from '../state.js';

function classify(t){
  let m;t=t.replace(/\\\$/g,'').replace(/\\\|/g,'').replace(/\\\{/g,'').replace(/\\\}/g,'');t=normKw(t); // экранирование: \$ \| \{ \}
  if(m=t.match(/^профиль\s*:\s*(.+)$/)){S.WARN.push('«профиль:» больше не нужен — ГНОМ выбирается сам; для явного выбора: «схема: гном»');return{kind:'opt',key:'схема',val:m[1].trim()};}
  if(m=t.match(OPT))return{kind:'opt',key:m[1],val:m[2].trim()};
  // 1) ключевые слова (только строчные, только в начале строки)
  if(m=t.match(/^тема\s*:\s*(.*)$/))return{kind:'header',text:m[1]};
  if(m=t.match(/^вопрос\s*:\s*(.+)$/)){S.WARN.push('«вопрос:» устарело — пишите «тема:»');return{kind:'header',text:m[1]};}
  if(m=t.match(/^почему\s*:\s*(.+)$/)){S.WARN.push('«почему:» устарело — пишите «стрелка:»');return{kind:'arrow',text:m[1]};}
  if(m=t.match(/^понятие\s*:\s*(.+->.*)$/)){S.WARN.push('«понятие:» устарело — пишите просто «термин -> ответ»');t=m[1];}
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
  const mk=(kind,text,extra)=>{if(opInside(text))S.WARN.push(`Строка «${t.slice(0,40)}»: начинается с маркера, поэтому «->»/«><» внутри показаны как текст. Для запоминателя или сравнения уберите маркер.`);return{kind,text,...extra};};
  if(m=t.match(/^[-–]\s+(.*)$/))return mk('item',m[1]);
  if(m=t.match(/^(\d+[.)])\s+(.*)$/))return mk('item',m[1]+' '+m[2],{num:true});
  if(m=t.match(/^[*•]\s+(.*)$/))return mk('marker',m[1]);
  if(m=t.match(/^\|\s+(.*)$/))return{kind:'bar',text:m[1]};
  if(m=t.match(/^\}\s*(.*)$/))return{kind:'brace',text:m[1]};
  if(m=t.match(/^\$\$(.*)\$\$$/))return{kind:'formula',text:m[1]};
  if(REL.test(t))return{kind:'text',text:t,rel:true};   // строка выкладки
  // 3) операторы: «><» сильнее «->»
  {const pp=splitOutside(t,'><');if(pp.length>=2){if(splitOutside(t,'->').length>1)S.WARN.push(`Строка «${t.slice(0,40)}»: и «><», и «->» — понято как сравнение.`);
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
    if(c.kind!=='blank'&&!al.includes(c.kind))S.WARN.push(`«${KNAME[c.kind]||c.kind}» не может стоять внутри «${KNAME[node.kind]||node.kind}» — проверьте отступ.`);
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

export { ALLOW, HANG, INNER, KNAME, classify, content, parse, splitReason, validate };
