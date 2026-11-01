const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage();
await p.goto('file://'+require('path').resolve(__dirname,'../konspekt_v8.html')+'');
await p.evaluate(()=>window.__ready); // MathJax готов (этап 3)
const res=await p.evaluate(()=>{const out={dashStart:[],prepEnd:[],unitSplit:[],hyphenMinus:[],dotShort:[],sizes:{},lines:0,small:[]};
  const PRE=/(^|\s)(в|во|на|с|со|к|ко|и|а|но|не|по|о|об|от|до|из|за|у|для|при|без|что|как|или|ли)$/i;
  const UNIT=/^(кг|г|м|см|мм|км|с|ч|мин|Н|Дж|Вт|В|А|Ом|Па|К|°C|Вб|Гц|л|бит|байт|%|кДж|МДж|Тл)\b/;
  EXAMPLES.forEach((e,i)=>{const r=render(e.s,680,{strict:true});const d=new DOMParser().parseFromString('<svg xmlns="http://www.w3.org/2000/svg">'+r.svg+'</svg>','image/svg+xml');
    const ts=[...d.querySelectorAll('text')];const tag=e.g+' / '+e.t;
    ts.forEach((t,k)=>{if(t.closest('svg svg'))return; // текст внутри формулы — не строка
      const midLine=t.previousElementSibling&&t.previousElementSibling.tagName==='svg'; // кусок строки после формулы (этап 3)
      const s=t.textContent;out.lines++;const fs=+t.getAttribute('font-size');out.sizes[fs]=(out.sizes[fs]||0)+1;
      if(fs<12&&out.small.length<8)out.small.push(fs+'px «'+s.slice(0,40)+'» — '+tag);
      if(!midLine&&/^[—–]\s/.test(s))out.dashStart.push('«'+s.slice(0,40)+'» — '+tag);
      const nx=ts[k+1];const sameBlock=nx&&nx.getAttribute('x')===t.getAttribute('x')&&Math.abs(+nx.getAttribute('y')-(+t.getAttribute('y'))-(fs+3))<2;
      if(sameBlock&&PRE.test(s.trim()))out.prepEnd.push('«…'+s.trim().slice(-25)+'» — '+tag);
      if(sameBlock&&/\d$/.test(s.trim())&&UNIT.test(nx.textContent.trim()))out.unitSplit.push('«…'+s.trim().slice(-15)+' / '+nx.textContent.trim().slice(0,10)+'…» — '+tag);
      if(/(\d|\s)-\s?\d|\s-\s[a-zа-я(]/i.test(s)&&!t.getAttribute('font-family'))out.hyphenMinus.push('«'+s.slice(0,40)+'» — '+tag);});
  });
  return out;});
for(const [k,v] of Object.entries(res)){if(Array.isArray(v)){console.log('\n##',k,v.length);v.slice(0,12).forEach(x=>console.log('  ',x));}else console.log('\n##',k,JSON.stringify(v));}
await b.close();})();
