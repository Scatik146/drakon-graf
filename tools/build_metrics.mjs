// Сборка таблиц метрик → src/text/metrics.js (этап 2).
// PT Serif / PT Mono — из файлов шрифтов (tools/metrics_pt.py, fontTools).
// Запасные знаки (греческие, стрелки, ∈ ⊥ ∠, степени и индексы, ✓ ✗) — замер в Chromium с теми же
// шрифтами, что у эталона (graf/tests/fonts/fonts.conf: Asana Math, затем DejaVu Sans).
// Знаки только из DejaVu (ᵏ ₙ ✗) уйдут на этапе 3: степени и индексы станут формулами.
// Запуск: FONTCONFIG_FILE=graf/tests/fonts/fonts.conf node tools/build_metrics.mjs
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require('/opt/npm-tools/node_modules/playwright'); }

const pt = JSON.parse(execFileSync('python3', ['tools/metrics_pt.py'], { maxBuffer: 1 << 26, stdio: ['ignore', 'pipe', 'ignore'] }).toString());
const R = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => String.fromCodePoint(a + i));
// Запасные знаки: греческие, степени и индексы, буквенные символы (ℕ ℝ), стрелки, математика, фигуры (△ □),
// ✓ ✗, угловые скобки ⟨⟩, знаки препинания общего блока.
const CAND = [...R(0x370, 0x3ff), ...R(0x2b0, 0x2ff), ...R(0x1d2c, 0x1d6a), ...R(0x1d9b, 0x1dbf), ...R(0x2070, 0x209c),
  ...R(0x2100, 0x214f), ...R(0x2190, 0x21ff), ...R(0x2200, 0x22ff), ...R(0x25a0, 0x25ff), ...R(0x2713, 0x2718),
  '\u27e8', '\u27e9', ...R(0x2010, 0x206f),
  '\uE001']; // \uE001 — метка табуляции в движке; прототип мерил её как «пустой» знак (так снят эталон)
const need = k => CAND.filter(c => !(c in pt[k].adv) && (c === '\uE001' || pt.fbset[k === 'm' ? 'mono' : 'sans'].includes(c)));
const b = await pw.chromium.launch(); const p = await b.newPage();
await p.setContent('<p style="font-family:\'PT Serif\'">а<b>а</b></p><p style="font-family:\'PT Mono\'">а</p>');
const fb = await p.evaluate(([r, bb, m]) => {
  const c = document.createElement('canvas').getContext('2d'); const run = (font, cs) => {
    c.font = font; const o = {}; for (const ch of cs) { const w = c.measureText(ch).width; if (w > 0) o[ch] = Math.round(w * 10); } return o; };
  return { r: run('100px "PT Serif", serif', r), b: run('bold 100px "PT Serif", serif', bb), m: run('100px "PT Mono", monospace', m) };
}, [need('r'), need('b'), need('m')]);
await b.close();
const out = { r: { ...pt.r, fb: fb.r }, b: { ...pt.b, fb: fb.b }, m: { upm: 1000, mono: 600, adv: Object.fromEntries(Object.entries(pt.m.adv).filter(([, v]) => v !== 600)), fb: fb.m } };
// adv в единицах шрифта (upm 1000); fb — ширина запасного знака в тысячных долях кегля
writeFileSync('src/text/metrics.js', '// ДРАКОН-ГРАФ — таблицы метрик шрифтов. Создано tools/build_metrics.mjs, не править руками.\n' +
  '// PT Serif, PT Mono © ПараТайп, SIL OFL 1.1. Знаки и математика: Asana Math (OFL); недостающие — DejaVu Sans (Bitstream Vera).\n' +
  'export const METRICS=' + JSON.stringify(out) + ';\n');
console.log('метрики:', Object.fromEntries(Object.entries(out).map(([k, v]) => [k, Object.keys(v.adv).length + ' знаков, запасных ' + Object.keys(v.fb).length])));
