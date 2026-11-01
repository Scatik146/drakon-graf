// Приёмочные тесты ГРАФ v8: каждый пример сверяется с эталонным рисунком; плюс геометрия и типографика.
// node tests/run.js           — проверить
// node tests/run.js --update  — переснять эталон (только по решению заказчика)
const {chromium}=require('playwright');const fs=require('fs'),path=require('path'),crypto=require('crypto');const {execSync}=require('child_process');
const ROOT=path.resolve(__dirname,'..'),ET=path.join(ROOT,'etalon');const upd=process.argv.includes('--update');
(async()=>{const b=await chromium.launch();const p=await b.newPage();await p.goto('file://'+path.join(ROOT,'konspekt_v8.html'));
const all=await p.evaluate(()=>EXAMPLES.map((e,i)=>{const r=render(e.s,680);return{i,g:e.g,t:e.t,scheme:r.scheme,warns:r.warns,
  svg:`<svg xmlns="http://www.w3.org/2000/svg" width="680" height="${Math.ceil(r.h)}" viewBox="0 0 680 ${Math.ceil(r.h)}" font-family="PT Serif, serif">${r.svg}</svg>`};}));
await b.close();
// Эталон v8.2 снят библиотекой с таблицами метрик: рисунок не зависит от машины, поэтому сверка точная.
// Механизм допуска оставлен на случай будущих осознанных изменений; сейчас TOL = 0.
const TOL=0;const NUM=/-?\d+(?:\.\d+)?/g;
const close=(a,b)=>{if(a.replace(NUM,'#')!==b.replace(NUM,'#'))return false;const x=a.match(NUM)||[],y=b.match(NUM)||[];
  return x.length===y.length&&x.every((v,i)=>Math.abs(v-y[i])<=TOL);};
const man=[];let diff=[],miss=[],diffAt=[],near=[];
for(const e of all){const f=String(e.i).padStart(3,'0')+'.svg';const h=crypto.createHash('sha1').update(e.svg).digest('hex').slice(0,12);
  man.push({file:f,group:e.g,title:e.t,scheme:e.scheme,warns:e.warns,sha:h});
  if(upd){fs.writeFileSync(path.join(ET,f),e.svg);continue;}
  const fp=path.join(ET,f);if(!fs.existsSync(fp)){miss.push(f+' '+e.t);continue;}
  const old=fs.readFileSync(fp,'utf8');if(old!==e.svg&&close(old,e.svg)){near.push(f);}else if(old!==e.svg){diff.push(f+' '+e.g+' / '+e.t);
    // расхождение: сохранить рисунок и показать первое отличие
    const DD=path.join(__dirname,'diff');fs.mkdirSync(DD,{recursive:true});fs.writeFileSync(path.join(DD,f),e.svg);
    let why;if(old.replace(NUM,'#')===e.svg.replace(NUM,'#')){const x=old.match(NUM),y=e.svg.match(NUM);why='структура та же, наибольший сдвиг '+Math.max(...x.map((v,i)=>Math.abs(v-y[i]))).toFixed(1)+' px';}
    else{const ta=old.match(/>[^<]+</g)||[],tb=e.svg.match(/>[^<]+</g)||[];const i=ta.findIndex((t,j)=>t!==tb[j]);why='структура другая (текстов '+ta.length+' → '+tb.length+')'+(i>=0?': «'+ta[i]+'» → «'+tb[i]+'»':'');}
    diffAt.push(f+': '+why);}}
if(upd){fs.writeFileSync(path.join(ET,'manifest.json'),JSON.stringify({version:'v8.3',date:'2026-11-01',fonts:'PT Serif, Asana Math, PT Mono; ширины по таблицам метрик',count:man.length,examples:man},null,1));console.log('Эталон переснят:',man.length,'примеров');return;}
const old=JSON.parse(fs.readFileSync(path.join(ET,'manifest.json'),'utf8'));
const wdiff=man.filter(m=>{const o=old.examples.find(q=>q.file===m.file);return o&&JSON.stringify(o.warns)!==JSON.stringify(m.warns);}).map(m=>m.file+' '+m.title);
console.log('Примеров:',man.length,'| эталон:',old.count);
console.log('Рисунок отличается от эталона:',diff.length);diff.forEach(x=>console.log('  ',x));diffAt.slice(0,5).forEach(x=>console.log('   ≠',x));
if(near.length)console.log('Сдвиг меньше '+TOL+' px (таблицы метрик против замера прототипа, допустимо):',near.length,near.join(' '));
console.log('Подсказки отличаются от эталона:',wdiff.length);wdiff.forEach(x=>console.log('  ',x));
if(miss.length){console.log('Нет в эталоне:',miss.length);miss.forEach(x=>console.log('  ',x));}
// Этап 2: те же рисунки в Node, без браузера, должны совпасть с браузерными до байта (ТЗ 8.3)
const nd=JSON.parse(execSync('node '+JSON.stringify(path.join(__dirname,'node.mjs')),{maxBuffer:1<<28}).toString());
const ndiff=all.filter((e,i)=>nd[i].svg!==e.svg||JSON.stringify(nd[i].warns)!==JSON.stringify(e.warns)).map(e=>String(e.i).padStart(3,'0'));
console.log('Node (без браузера) отличается от браузера:',ndiff.length,ndiff.slice(0,10).join(' '));
console.log('\n— Геометрия —');console.log(execSync('node '+JSON.stringify(path.join(__dirname,'geo.js'))+' '+JSON.stringify(path.join(__dirname,'geo_last.json'))).toString().split('\n').slice(0,12).join('\n'));
console.log('— Типографика —');const ty=execSync('node '+JSON.stringify(path.join(__dirname,'typo.js'))).toString();
console.log(ty.split('\n').filter(l=>/^## (prepEnd|unitSplit|hyphenMinus|small|dashStart)/.test(l)).join('\n'));
process.exitCode=(diff.length||wdiff.length||miss.length||ndiff.length)?1:0;})();
