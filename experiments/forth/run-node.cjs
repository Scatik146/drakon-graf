// Запуск 20 тестов под Node: node run-node.cjs
const WAForth = require('./lib/index.js').default;
const { TESTS, runAll } = require('./tests.js');
(async () => {
  const t0 = performance.now();
  const res = await runAll(WAForth, TESTS);
  const total = performance.now() - t0;
  res.forEach(r => console.log((r.pass ? 'прошёл ' : 'НЕТ    ') + String(r.n).padStart(2) + ' [' + r.group + '] ' + r.name + (r.pass ? '' : '\n    ожидали: ' + JSON.stringify(r.expect) + '\n    вышло:   ' + JSON.stringify(r.out))));
  console.log(res.filter(r => r.pass).length + ' из ' + res.length + ', всего ' + total.toFixed(1) + ' мс');
})();
