// Рисует все примеры эталона в Node, без браузера (этап 2), и печатает SVG в формате tests/run.js.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { render, ready } from '../../src/index.js';
await ready(); // MathJax 4 + Asana Math (этап 3)
const G = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = ['examples.js', 'examples_hs.js', 'examples_v4.js', 'examples_v5a.js', 'examples_v5b.js'];
const ctx = {}; vm.runInNewContext(files.map(f => readFileSync(path.join(G, f), 'utf8')).join('\n') + ';this.EXAMPLES=EXAMPLES;', ctx);
const out = ctx.EXAMPLES.map(e => { const r = render(e.s, 680);
  return { warns: r.warns, svg: `<svg xmlns="http://www.w3.org/2000/svg" width="680" height="${Math.ceil(r.h)}" viewBox="0 0 680 ${Math.ceil(r.h)}" font-family="PT Serif, serif">${r.svg}</svg>` }; });
process.stdout.write(JSON.stringify(out));
