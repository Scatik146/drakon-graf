#!/usr/bin/env node
// ДРАКОН-ГРАФ — командная строка (ТЗ библиотеки, раздел 4; этап 4).
//   drakon-graf урок.md -o рисунки/     все блоки «конспект» из Markdown → SVG (урок-1.svg, урок-2.svg, …)
//   drakon-graf схема.txt > схема.svg   один конспект → SVG в стандартный вывод
//   drakon-graf --check урок.md         только подсказки: файл:строка: код уровень: текст
// Настройки: --width 680  --theme bw  --class 7  --fonts link|embed|none
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { render, ready, version } from '../src/index.js';
import { setFontReader } from '../src/api.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FONTS = [path.resolve(HERE, '..', 'fonts'), path.resolve(HERE, '..', 'graf', 'fonts')].find(d => { try { readFileSync(path.join(d, 'PT_Serif-Web-Regular.ttf')); return true; } catch { return false; } });
setFontReader(file => readFileSync(path.join(FONTS, file)).toString('base64'));

// --fonts embed встраивает шрифты целиком (~0,5–1 МБ на рисунок); урезание до нужных знаков — следующая версия
const args = process.argv.slice(2); const o = { fonts: 'link' }; const files = []; let out = null, check = false;
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '-o' || a === '--out') out = args[++i];
  else if (a === '--check') check = true;
  else if (a === '--width') o.width = +args[++i];
  else if (a === '--theme') o.theme = args[++i];
  else if (a === '--class') o.class = +args[++i];
  else if (a === '--fonts') o.fonts = args[++i];
  else if (a === '-v' || a === '--version') { console.log(version); process.exit(0); }
  else if (a === '-h' || a === '--help') { console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 7).map(l => l.replace(/^\/\/ ?/, '')).join('\n')); process.exit(0); }
  else files.push(a);
}
if (!files.length) { console.error('drakon-graf: укажите файл (.md или .txt). Справка: drakon-graf --help'); process.exit(2); }
await ready();

/** Блоки ```конспект из Markdown: текст и номер первой строки текста блока. */
function blocks(md) {
  const out = []; const L = md.split(/\r?\n/); let cur = null, fence = '';
  L.forEach((l, i) => {
    if (!cur) { const m = l.match(/^(\s*)(`{3,}|~{3,})\s*(конспект|drakon-graf)(?=\s|$)/); if (m) { cur = { line: i + 2, text: [] }; fence = m[2]; } }
    else if (l.trim().startsWith(fence[0].repeat(fence.length)) && !l.trim().replace(fence[0], '').match(/[^`~]/)) { out.push({ line: cur.line, text: cur.text.join('\n') }); cur = null; }
    else cur.text.push(l);
  });
  return out;
}
let total = 0, bad = 0;
for (const f of files) {
  const src = readFileSync(f, 'utf8'); const isMd = /\.(md|markdown)$/i.test(f);
  const list = isMd ? blocks(src) : [{ line: 1, text: src }];
  if (isMd && !list.length) console.error(`${f}: блоков «конспект» нет`);
  list.forEach((b, k) => {
    const r = render(b.text, o); total++;
    for (const h of r.hints) { if (h.level === 'важно') bad++; console.error(`${f}:${b.line}: ${h.code || '—'} ${h.level}: ${h.text}`); }
    if (check) return;
    if (out || isMd) {
      const dir = out || path.dirname(f); mkdirSync(dir, { recursive: true });
      const name = path.join(dir, path.basename(f).replace(/\.[^.]+$/, '') + (isMd ? '-' + (k + 1) : '') + '.svg');
      writeFileSync(name, r.svg); console.error(`→ ${name} (${r.scheme})`);
    } else process.stdout.write(r.svg + '\n');
  });
}
if (check) console.error(`Конспектов: ${total}; подсказок «важно»: ${bad}`);
process.exitCode = check && bad ? 1 : 0;
