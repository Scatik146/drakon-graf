// Этап 4: программный интерфейс, run() в браузере, плагин markdown-it, командная строка.
import { readFileSync, mkdtempSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import os from 'node:os'; import path from 'node:path'; import vm from 'node:vm';
import { fileURLToPath } from 'node:url'; import { createRequire } from 'node:module';
import { render, parse, ready } from '../../src/index.js';
const require = createRequire(import.meta.url);
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const req = n => { try { return require(n); } catch { return require('/opt/npm-tools/node_modules/' + n); } };
let fail = 0; const ok = (c, msg) => { console.log((c ? '  ✓ ' : '  ✗ ') + msg); if (!c) fail++; };
await ready();
// 1. render: SVG с title/desc, подсказки с кодами для всех примеров эталона
const ctx = {}; vm.runInNewContext(['examples.js', 'examples_hs.js', 'examples_v4.js', 'examples_v5a.js', 'examples_v5b.js'].map(f => readFileSync(path.join(R, 'graf', f), 'utf8')).join('\n') + ';this.EXAMPLES=EXAMPLES;', ctx);
let noCode = [], noTitle = 0, total = 0, noLine = [];
const WHOLE = new Set(['Н8', 'Н14', 'Н15', 'Н16', 'Н18', 'Н19', 'Н20', 'Н21']); // подсказки о конспекте целиком — без строки
for (const e of ctx.EXAMPLES) { const r = render(e.s); total += r.hints.length;
  r.hints.filter(h => !h.code).forEach(h => noCode.push(h.text));
  r.hints.filter(h => !WHOLE.has(h.code) && !h.line).forEach(h => noLine.push(h.code + ' ' + h.text)); if (!/<title id="dg\d+t">[^<]+<\/title><desc id="dg\d+d">/.test(r.svg)) noTitle++; }
ok(noTitle === 0, `render: у всех 249 рисунков есть <title> и <desc>`);
ok(noCode.length === 0, `подсказки: у всех ${total} есть код Н1–Н29` + (noCode.length ? ' — без кода: ' + noCode.slice(0, 3).join(' | ') : ''));
ok(noLine.length === 0, 'подсказки о конкретной строке указывают её номер' + (noLine.length ? ' — без строки: ' + noLine.slice(0, 3).join(' | ') : ''));
const p = parse('тема: Проверка\nДробь ><'); ok(p.hints.some(h => h.code === 'Н9' && h.level === 'важно'), 'parse: подсказка Н9 «важно» без раскладки');
ok(render('тема: X', { theme: 'bw', width: 500 }).width === 500, 'render: настройки width и theme');
// 2. markdown-it
const md = req('markdown-it')().use((await import('../../src/markdown-it.js')).default);
const html = md.render('# Урок\n\n```конспект\nтема: Дроби\nДробь -> Это часть целого.\n```\n\n```js\nlet a=1\n```\n');
ok(/<figure class="drakon-graf"[^>]*><svg/.test(html) && /<code class="language-js">/.test(html), 'markdown-it: блок «конспект» → SVG, остальные блоки как были');
// 3. командная строка
const dir = mkdtempSync(path.join(os.tmpdir(), 'dg-'));
const mdFile = path.join(dir, 'урок.md'); require('fs').writeFileSync(mdFile, '```конспект\nтема: А\nА -> Это а.\n```\n\n```конспект\nтема: Б.\nБ ><\n```\n');
execFileSync('node', [path.join(R, 'bin/drakon-graf.mjs'), mdFile, '-o', path.join(dir, 'out')], { stdio: 'pipe' });
ok(readdirSync(path.join(dir, 'out')).length === 2, 'командная строка: 2 блока → 2 файла SVG');
let code = 0, err = ''; try { execFileSync('node', [path.join(R, 'bin/drakon-graf.mjs'), '--check', mdFile], { stdio: 'pipe' }); } catch (e) { code = e.status; err = e.stderr.toString(); }
ok(code === 1 && /урок\.md:8: Н9 важно/.test(err), '--check: подсказка с файлом, точной строкой и кодом; выход 1 при «важно»');
// 4. run() в браузере: страница примеров
const { chromium } = req('playwright'); const b = await chromium.launch(); const pg = await b.newPage();
const errs = []; pg.on('pageerror', e => errs.push(e.message));
await pg.goto('file://' + path.join(R, 'demo/index.html')); const n = await pg.evaluate(() => window.__done);
const info = await pg.evaluate(() => ({ figs: document.querySelectorAll('figure.drakon-graf > svg').length, math: document.querySelectorAll('figure.drakon-graf > svg svg').length, hints: document.querySelectorAll('.dg-hint').length }));
await b.close();
ok(n === 5 && info.figs === 5 && !errs.length, `run(): страница примеров — 5 конспектов нарисованы (${n}, ${info.figs})${errs.length ? ', ошибки: ' + errs[0] : ''}`);
ok(info.math > 5 && info.hints >= 1, `run(): формулы через MathJax (${info.math}), подсказки под рисунком (${info.hints})`);
console.log(fail ? `Интерфейс: ошибок ${fail}` : 'Интерфейс: всё работает');
process.exitCode = fail ? 1 : 0;
