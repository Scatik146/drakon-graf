// Свободные (не объявленные внутри) идентификаторы каждого файла: node free_vars.cjs a.js b.js …
const NM='/opt/npm-tools/node_modules/';
const acorn=require(NM+'acorn'),scope=require('/opt/node-tools/node_modules/eslint-scope');const fs=require('fs');
const out={};
for(const f of process.argv.slice(2)){
  const ast=acorn.parse(fs.readFileSync(f,'utf8'),{ecmaVersion:2022,sourceType:'module',ranges:true});
  const sm=scope.analyze(ast,{ecmaVersion:2022,sourceType:'module'});
  const glob=sm.globalScope;const names=new Set();
  for(const r of glob.through)names.add(r.identifier.name);
  // объявленные на верхнем уровне модуля
  const own=sm.scopes.find(s=>s.type==='module').variables.map(v=>v.name);
  out[f]={free:[...names].sort(),own};
}
console.log(JSON.stringify(out));
