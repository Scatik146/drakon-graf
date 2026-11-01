// ДРАКОН-ГРАФ — ширина текста по таблицам метрик (этап 2).
// Не зависит от браузера: одна и та же строка имеет одну ширину в Chrome, Firefox, Node и Windows (ТЗ, Б3).
// Повторяет набор Chromium: ширины знаков PT Serif, кернинг GPOS, лигатуры fi/fl;
// знаки, которых нет в PT Serif, — по ширинам Asana Math (и DejaVu Sans для ᵏ ₙ ✗).
import { S } from '../state.js';
import { METRICS } from './metrics.js';

const KERN = {}; // развёрнутый кернинг: KERN.r['А']['В'] = -30
for (const k of ['r', 'b']) {
  const o = KERN[k] = {};
  for (const [a, row] of Object.entries(METRICS[k].kern)) {
    const m = o[a] = {};
    for (const [v, cs] of Object.entries(row)) for (const c of cs) m[c] = +v;
  }
}
const MARK = /[̀-ͯ]/; // комбинируемые знаки (x̄): своей ширины нет
// Письменность знака: Chromium делит строку на куски по письменности, и кернинг на стыке
// латиницы и кириллицы не действует («b-х»). Знаки препинания и цифры примыкают к куску слева.
const scr = ch => /[A-Za-zÀ-ɏ]/.test(ch) ? 1 : /[Ѐ-ӿ]/.test(ch) ? 2 : 0;

/** Ширина строки в тысячных долях кегля. */
function em(t, k) {
  const M = METRICS[k];
  if (k === 'm') { let s = 0; for (const ch of t) s += ch in M.fb ? M.fb[ch] : MARK.test(ch) ? 0 : (M.adv[ch] ?? M.mono); return s; }
  const A = M.adv, F = M.fb, K = KERN[k], L = M.liga;
  const cs = Array.from(t); let s = 0, prev = null, run = 0;
  for (let i = 0; i < cs.length; i++) {
    const ch = cs[i];
    if (ch in A) {
      const sc = scr(ch); if (sc) { if (run && run !== sc) prev = null; run = sc; }
      const nx = cs[i + 1];
      if ((ch === 'f') && (nx === 'i' || nx === 'l')) { s += L[ch + nx] + (prev && K[prev] ? K[prev]['f'] || 0 : 0); prev = nx; i++; continue; }
      s += A[ch]; if (prev && K[prev]) s += K[prev][ch] || 0; prev = ch;
    } else { s += MARK.test(ch) ? 0 : (F[ch] ?? 600); prev = null; }
  }
  return s;
}

/** Ширина текста в px: t — строка, bold — жирный, size — кегль (по умолчанию S.FS), mono — моноширинный. */
/** Журнал вызовов для сверки таблиц с браузером (tools/check_metrics.mjs). */
const twLog = { on: false, calls: [] };
function tw(t, bold, size, mono) { if (twLog.on) twLog.calls.push([String(t), !!bold, size || S.FS, !!mono]); return em(String(t), mono ? 'm' : bold ? 'b' : 'r') * (size || S.FS) / 1000; }

export { tw, twLog };
