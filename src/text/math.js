// ДРАКОН-ГРАФ — модуль перенесён из прототипа graf/engine.js (этап 1, без изменения поведения)


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

export { SUB, SUP, grp, mathText, pretty, subify, supify, texArgs };
