// Диагностика: каким шрифтом Chromium рисует знаки эталона и какой ширины они выходят.
const {chromium}=require('playwright');
const CH=['⇒','⊥','∠','∈','∪','⊂','ₙ','⁻','·','А'];
(async()=>{const b=await chromium.launch();const p=await b.newPage();
await p.setContent('<body>'+['normal','bold'].map(w=>CH.map((c,i)=>`<span id="s${w}${i}" style="font:${w} 14px Arial, Helvetica, sans-serif">${c}</span>`).join(' ')).join('<br>')+'<svg><text id="t" font-family="Arial, Helvetica, sans-serif" font-size="14">⇒</text></svg></body>');
const cdp=await p.context().newCDPSession(p);await cdp.send('DOM.enable');await cdp.send('CSS.enable');
const {root}=await cdp.send('DOM.getDocument');
for(const w of ['normal','bold'])for(let i=0;i<CH.length;i++){const {nodeId}=await cdp.send('DOM.querySelector',{nodeId:root.nodeId,selector:`#s${w}${i}`});
  const {fonts}=await cdp.send('CSS.getPlatformFontsForNode',{nodeId});
  const wd=await p.evaluate(id=>document.getElementById(id).getBoundingClientRect().width,`s${w}${i}`);
  console.log(w,CH[i],wd.toFixed(3),fonts.map(f=>f.familyName+(f.postScriptName?' ('+f.postScriptName+')':'')).join(', '));}
console.log('svg ⇒',await p.evaluate(()=>document.getElementById('t').getComputedTextLength().toFixed(3)));
console.log(await b.version());await b.close();})();
