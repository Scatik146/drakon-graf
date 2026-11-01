// ДРАКОН-ГРАФ — формулы. С этапа 3 формулы $…$ и $$…$$ набирает MathJax 4 со шрифтом Asana Math (вывод — SVG).
// Пока MathJax не подключён (ready() не вызван), действует «невидимая математика» прототипа: формула → текст.
import { S } from '../state.js';


const SUP={'0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹','+':'⁺','-':'⁻','−':'⁻','(':'⁽',')':'⁾','=':'⁼',...Object.fromEntries([...'abcdefghijklmnoprstuvwxyz'].map((c,i)=>[c,'ᵃᵇᶜᵈᵉᶠᵍʰⁱʲᵏˡᵐⁿᵒᵖʳˢᵗᵘᵛʷˣʸᶻ'[i]]))};
const SUB={'0':'₀','1':'₁','2':'₂','3':'₃','4':'₄','5':'₅','6':'₆','7':'₇','8':'₈','9':'₉','a':'ₐ','e':'ₑ','x':'ₓ','n':'ₙ','m':'ₘ','k':'ₖ','т':'т','ж':'ж'};
const supify=s=>[...s].map(ch=>SUP[ch]||ch).join(''), subify=s=>[...s].map(ch=>SUB[ch]||ch).join('');
// «Невидимая математика» прототипа: запасной путь без MathJax
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
// ✗ → ×: знака «✗» нет ни в PT Serif, ни в Asana Math; пара «✓ / ×» читается так же (этап 3)
function pretty(s){return String(s).replace(/(^|[^\\])->/g,'$1→').replace(/\\->/g,'->').replace(/\$([^$]+)\$/g,(m,f)=>MJ?mark(f):mathText(f)).replace(/`([^`]*)`/g,'$1').replace(/\u2717/g,'×').replace(/\uE000/g,'$').replace(//g,'|').replace(//g,'{').replace(//g,'}');}


// ── MathJax ──────────────────────────────────────────────────────────────────────────────
let MJ=null;const CACHE=new Map();
const MARK0=0xF000; // формула в строке — один знак из области частного использования: неделима при переносе
/** Подключить готовый MathJax 4 (после MathJax.init, шрифт mathjax-asana, liteAdaptor). */
function useMathJax(mj){MJ=mj;CACHE.clear();}
const mathOn=()=>!!MJ;
/** Набор формулы: размеры в долях кегля (em) и содержимое SVG. */
function fx(tex,display){const key=(display?'D':'T')+tex;if(CACHE.has(key))return CACHE.get(key);
  const A=MJ.startup.adaptor;let out=A.outerHTML(MJ.tex2svg(tex,{display:!!display}));
  const i=out.indexOf('<svg'),j=out.lastIndexOf('</svg>');const svg=out.slice(i,j);
  const vb=svg.match(/viewBox="([^"]+)"/)[1].split(' ').map(Number);
  const inner=flatG(svg.slice(svg.indexOf('>')+1).replace(/ data-[a-z-]+="[^"]*"/g,'').replace(/&nbsp;/g,'\u00A0')); // служебные пометки MathJax не нужны
  const err=/data-mjx-error|data-mml-node="merror"/.test(svg);
  const r={vb,inner,w:vb[2]/1000,h:vb[3]/1000,asc:-vb[1]/1000,err};CACHE.set(key,r);return r;}
/** Убрать пустые обёртки <g> без атрибутов: браузерный MathJax добавляет лишние mrow, на рисунок они не влияют. */
function flatG(s){const st=[];return s.replace(/<g>|<g\s[^>]*>|<\/g>/g,t=>{if(t==='</g>')return st.pop()?'':t;st.push(t==='<g>');return t==='<g>'?'':t;});}
/** Текстовый вид (формулы — простым текстом): для поиска и сравнения, не для рисунка. */
function plain(s){const m=MJ;MJ=null;try{return pretty(s);}finally{MJ=m;}}
/** Метка формулы для строки текста. */
function mark(tex){let c=S.MKEY.get(tex);if(c)return c;
  const f=fx(tex,false);const i=S.MATHS.length;S.MATHS.push({tex,...f});
  if(f.err)S.WARN.push('Формула не разобрана: $'+tex+'$');
  c=String.fromCharCode(MARK0+i);S.MKEY.set(tex,c);return c;}
const isMark=ch=>{const k=ch.charCodeAt(0);return k>=MARK0&&k<MARK0+0x800;};
const markOf=ch=>S.MATHS[ch.charCodeAt(0)-MARK0];
/** SVG формулы: x — левый край, base — линия шрифта, size — кегль, bold — псевдожирный (у Asana нет жирного). */
function mathSvg(f,x,base,size,fill,bold){const n=v=>(+v).toFixed(2);
  return `<svg x="${n(x)}" y="${n(base-f.asc*size)}" width="${n(f.w*size)}" height="${n(f.h*size)}" viewBox="${f.vb.join(' ')}" overflow="visible" color="${fill||'#111'}">`+
    (bold?f.inner.replace('stroke-width="0"','stroke-width="30"'):f.inner)+'</svg>';}

export { SUB, SUP, grp, mathText, pretty, subify, supify, texArgs, useMathJax, mathOn, plain, fx, mark, isMark, markOf, mathSvg, MARK0 };
