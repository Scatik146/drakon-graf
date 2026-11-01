// Приёмочные тесты ГРАФ v8: каждый пример сверяется с эталонным рисунком; плюс геометрия и типографика.
// node tests/run.js           — проверить
// node tests/run.js --update  — переснять эталон (только по решению заказчика)
const {chromium}=require('playwright');const fs=require('fs'),path=require('path'),crypto=require('crypto');const {execSync}=require('child_process');
const ROOT=path.resolve(__dirname,'..'),ET=path.join(ROOT,'etalon');const upd=process.argv.includes('--update');
(async()=>{const b=await chromium.launch();const p=await b.newPage();await p.goto('file://'+path.join(ROOT,'konspekt_v8.html'));
const all=await p.evaluate(()=>EXAMPLES.map((e,i)=>{const r=render(e.s,680);return{i,g:e.g,t:e.t,scheme:r.scheme,warns:r.warns,
  svg:`<svg xmlns="http://www.w3.org/2000/svg" width="680" height="${Math.ceil(r.h)}" viewBox="0 0 680 ${Math.ceil(r.h)}" font-family="Arial, Helvetica, sans-serif">${r.svg}</svg>`};}));
await b.close();
const man=[];let diff=[],miss=[];
for(const e of all){const f=String(e.i).padStart(3,'0')+'.svg';const h=crypto.createHash('sha1').update(e.svg).digest('hex').slice(0,12);
  man.push({file:f,group:e.g,title:e.t,scheme:e.scheme,warns:e.warns,sha:h});
  if(upd){fs.writeFileSync(path.join(ET,f),e.svg);continue;}
  const fp=path.join(ET,f);if(!fs.existsSync(fp)){miss.push(f+' '+e.t);continue;}
  if(fs.readFileSync(fp,'utf8')!==e.svg)diff.push(f+' '+e.g+' / '+e.t);}
if(upd){fs.writeFileSync(path.join(ET,'manifest.json'),JSON.stringify({version:'v8',date:'2026-10-30',count:man.length,examples:man},null,1));console.log('Эталон переснят:',man.length,'примеров');return;}
const old=JSON.parse(fs.readFileSync(path.join(ET,'manifest.json'),'utf8'));
const wdiff=man.filter(m=>{const o=old.examples.find(q=>q.file===m.file);return o&&JSON.stringify(o.warns)!==JSON.stringify(m.warns);}).map(m=>m.file+' '+m.title);
console.log('Примеров:',man.length,'| эталон:',old.count);
console.log('Рисунок отличается от эталона:',diff.length);diff.forEach(x=>console.log('  ',x));
console.log('Подсказки отличаются от эталона:',wdiff.length);wdiff.forEach(x=>console.log('  ',x));
if(miss.length){console.log('Нет в эталоне:',miss.length);miss.forEach(x=>console.log('  ',x));}
console.log('\n— Геометрия —');console.log(execSync('node '+JSON.stringify(path.join(__dirname,'geo.js'))+' '+JSON.stringify(path.join(__dirname,'geo_last.json'))).toString().split('\n').slice(0,12).join('\n'));
console.log('— Типографика —');const ty=execSync('node '+JSON.stringify(path.join(__dirname,'typo.js'))).toString();
console.log(ty.split('\n').filter(l=>/^## (prepEnd|unitSplit|hyphenMinus|small|dashStart)/.test(l)).join('\n'));
process.exitCode=(diff.length||wdiff.length||miss.length)?1:0;})();
