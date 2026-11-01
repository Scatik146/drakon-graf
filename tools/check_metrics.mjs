// Сверка таблиц метрик с Chromium: каждая строка, которую движок меряет на 249 примерах эталона,
// меряется и браузером (те же шрифты, graf/tests/fonts/fonts.conf). Печатает наибольшие расхождения.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { _render as render } from '../src/index.js';
import { twLog } from '../src/text/measure.js';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require('/opt/npm-tools/node_modules/playwright'); }
const files = ['examples.js', 'examples_hs.js', 'examples_v4.js', 'examples_v5a.js', 'examples_v5b.js'];
const ctx = {}; vm.runInNewContext(files.map(f => readFileSync('graf/' + f, 'utf8')).join('\n') + ';this.EXAMPLES=EXAMPLES;', ctx);
twLog.on = true; for (const e of ctx.EXAMPLES) render(e.s, 680); twLog.on = false;
const seen = new Map(); for (const c of twLog.calls) seen.set(JSON.stringify(c), c);
const calls = [...seen.values()];
const { tw } = await import('../src/text/measure.js');
const b = await pw.chromium.launch(); const p = await b.newPage();
await p.setContent('<p style="font-family:\'PT Serif\'">а<b>а</b></p><p style="font-family:\'PT Mono\'">а</p>');
const bw = await p.evaluate(cs => { const c = document.createElement('canvas').getContext('2d');
  return cs.map(([t, bold, size, mono]) => { c.font = (bold ? 'bold ' : '') + size + 'px ' + (mono ? '"PT Mono", monospace' : '"PT Serif", serif'); return c.measureText(t).width; }); }, calls);
await b.close();
const d = calls.map((c, i) => ({ c, br: bw[i], tb: tw(...c), e: Math.abs(bw[i] - tw(...c)) })).sort((x, y) => y.e - x.e);
console.log('строк:', calls.length, '| расхождение > 0,01 px:', d.filter(x => x.e > 0.01).length, '| > 0,1 px:', d.filter(x => x.e > 0.1).length, '| наибольшее:', d[0].e.toFixed(4));
for (const x of d.slice(0, +(process.argv[2] || 15))) if (x.e > 0.001) console.log(x.e.toFixed(3), x.br.toFixed(3), x.tb.toFixed(3), JSON.stringify(x.c), [...x.c[0]].filter(ch => ch.codePointAt(0) > 0x7e && !/[а-яё]/i.test(ch)).map(ch => ch.codePointAt(0).toString(16)).join(" "));
