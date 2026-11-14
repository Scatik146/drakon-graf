// ДРАКОН-ГРАФ — программный интерфейс библиотеки (ТЗ библиотеки, раздел 4; этап 4).
//   render(text, { width, theme, class, fonts, fontsUrl }) → { svg, width, height, scheme, hints, model }
//   parse(text) → { model, hints }
// Внутренний движок — render.js (рисунок без обёртки, его сверяют тесты с эталоном).
import { render as draw } from './render.js';
import { parse as parseZone } from './parse/parser.js';
import { lint } from './lint.js';
import { chooseScheme } from './schemes.js';
import { S, freshState } from './state.js';
import { plain } from './text/math.js';
import { METRICS } from './text/metrics.js';
import { normKw } from './parse/lexer.js';

export const version = '0.9.2';

// ── Подсказки: код и уровень по каталогу (формальное описание, таблица 9.1) ─────────────────
// Уровень «важно» — синтаксис, ссылки, обязательные части; «совет» — мягкие пределы и стиль.
const HINTS = [
  ['Н1', /не может стоять внутри/], ['Н2', /начинается с маркера/], ['Н3', /понято как сравнение/],
  ['Н4', /устарело|больше не нужен/], ['Н5', /не найдена часть/], ['Н6', /Связь: не найдены части/],
  ['Н7', /не нашло пример под собой/], ['Н8', /Нет строки «тема:»/], ['Н9', /нет второй половины/],
  ['Н10', /ячеек \d+, а столбцов/], ['Н11', /не показывается/], ['Н12', /внутри сцены не рисуется/],
  ['Н13', /столбцов — больше 5/], ['Н14', /больше 7 трудно запомнить/], ['Н15', /Дерево: на уровне/],
  ['Н16', /В линейке больше 7/], ['Н17', /больше 7 подписей/], ['Н18', /Зон больше 5/],
  ['Н19', /Вложенность/], ['Н20', /столбцы слишком узкие/], ['Н21', /Дерево не помещается/],
  ['Н22', /Длинное предложение/], ['Н23', /мысл|разбейте на зоны маркерами/], ['Н24', /«Это…»/],
  ['Н25', /в заголовке точку не ставят/], ['Н26', /в ячейках таблицы точку не ставят/],
  ['Н27', /в подписях точку не ставят/], ['Н28', /Предложение заканчивается точкой/],
  ['Н29', /Формула не разобрана/],
];
const IMPORTANT = new Set(['Н1', 'Н2', 'Н3', 'Н4', 'Н5', 'Н6', 'Н7', 'Н8', 'Н9', 'Н10', 'Н11', 'Н12', 'Н29']);
function hintOf(text, lines) {
  const h = HINTS.find(([, re]) => re.test(text)); const code = h ? h[0] : '';
  const r = { code, level: IMPORTANT.has(code) ? 'важно' : 'совет', text };
  const line = lines ? locate(code, text, lines) : 0; if (line) r.line = line;
  return r;
}
// Строка, к которой относится подсказка (1 — первая строка текста). 0 — подсказка о конспекте целиком
// (число зон, вложенность, нет «тема:») или строку определить нельзя.
const KWLINE = { Н4: /^(вопрос|почему|понятие|профиль)\s*:/, Н7: /^правило\s*(→|->)/, Н9: /^><|><$/, Н12: /></, Н13: /^связка\s*:/, Н27: /\.\s*\}/ };
function locate(code, text, lines) {
  const L = lines.map(l => normKw(l.trim()));
  const find = f => { const i = L.findIndex(f); return i < 0 ? 0 : i + 1; };
  if (KWLINE[code]) return find(l => KWLINE[code].test(l));
  if (code === 'Н29') { const t = text.replace(/^Формула не разобрана:\s*\$+|\$+$/g, ''); return find(l => l.includes(t)); }
  if (code === 'Н1') { // строка, вложенная не туда: первая строка с отступом больше, чем у родителя
    const par = (text.match(/внутри «([^»]+)»/) || [])[1] || ''; const kw = par.replace(/:$/, '');
    const p = L.findIndex(l => kw && l.startsWith(kw)); if (p >= 0) { const ind = s => s.match(/^\s*/)[0].length;
      for (let i = p + 1; i < lines.length; i++) if (lines[i].trim() && ind(lines[i]) > ind(lines[p])) return i + 1; }
    return 0;
  }
  if (code === 'Н17') return find(l => (l.match(/\]\{/g) || []).length > 7); // пример, где больше 7 подписей
  if (code === 'Н11') { const k = (text.match(/^Шеренга: (.+?) не показывается/) || [])[1]; if (k && /:$/.test(k)) return find(l => l.startsWith(k)); }
  const quotes = [...text.matchAll(/«([^»]+)»/g)].map(m => m[1].replace(/…$/, '').trim())
    .filter(q => q.length > 1 && !/^(->|><|тема:|пример:|Шахматы|Гребенка|Это)/.test(q) && !/^«?->»?\/?«?></.test(q));
  for (let q of quotes) {
    q = q.replace(/^Что такое\s+/i, ''); // указатель «Что такое дробь» построен из «опр: Дробь ->»
    const lq = q.toLowerCase();
    const n = find(l => new RegExp('^(-|опр:|определение:)?\\s*' + lq.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*(->|→|\\||:|$)', 'i').test(l)) // указатель в начале строки
      || find(l => l.toLowerCase().includes(lq));
    if (n) return n;
  }
  return 0;
}

// ── Шрифты ─────────────────────────────────────────────────────────────────────────────────
const FONT_FILES = {
  r: ['PT Serif', 'normal', 'normal', 'PT_Serif-Web-Regular.ttf'], b: ['PT Serif', 'bold', 'normal', 'PT_Serif-Web-Bold.ttf'],
  i: ['PT Serif', 'normal', 'italic', 'PT_Serif-Web-Italic.ttf'], bi: ['PT Serif', 'bold', 'italic', 'PT_Serif-Web-BoldItalic.ttf'],
  m: ['PT Mono', 'normal', 'normal', 'PTM55FT.ttf'], a: ['Asana Math', 'normal', 'normal', 'Asana-Math.otf'],
};
const CDN = `https://cdn.jsdelivr.net/npm/drakon-graf@${version}/fonts/`;
/** Какие начертания нужны этому рисунку. */
function facesUsed(body) {
  const f = new Set(['r']);
  for (const m of body.matchAll(/<text\b([^>]*)>([^<]*)</g)) {
    const a = m[1], b = /font-weight="bold"/.test(a), it = /font-style="italic"/.test(a);
    if (/PT Mono/.test(a)) f.add('m'); else f.add(b && it ? 'bi' : b ? 'b' : it ? 'i' : 'r');
    if ([...m[2]].some(ch => ch.charCodeAt(0) > 0x7f && !(ch in METRICS.r.adv) && ch !== '\u00a0')) f.add('a'); // знаки Asana Math
  }
  return [...f];
}
let readFont = null; // Node: чтение файла шрифта для fonts:'embed' (ставит cli/node-обвязка)
export function setFontReader(fn) { readFont = fn; }
function fontStyle(body, mode, url) {
  if (mode === 'none') return '';
  const faces = facesUsed(body).map(k => {
    const [fam, w, st, file] = FONT_FILES[k];
    let src = (url || CDN) + file;
    if (mode === 'embed' && readFont) src = `data:font/${file.endsWith('otf') ? 'otf' : 'ttf'};base64,` + readFont(file);
    return `@font-face{font-family:"${fam}";font-weight:${w};font-style:${st};src:url(${src})}`;
  });
  return `<style>${faces.join('')}</style>`;
}

// ── Описание для экранных дикторов ─────────────────────────────────────────────────────────
const SERVICE = /^\s*(#|(класс|схема|ширина|начать с|нумерация|язык|подписи)\s*:)/i; // строки уже приведены к русским ключевым словам (normKw)
function readable(line) {
  const t = plain(line).replace(/\[([^\]]*)\]\{([^}]*)\}/g, '$1 ($2)').replace(/[-]/g, '')
    .replace(/^\s*(=>|⇒)\s*/, 'следовательно, ').replace(/\s*(=>|⇒)\s*/g, ', следовательно, ')
    .replace(/\s*><\s*/g, ' — в сравнении с — ').replace(/\s*(->|→)\s*/g, ' — ').replace(/\s*\|\s*/g, '; ')
    .replace(/\{([^}]*)\}/g, '($1)').replace(/^([а-яёa-z ]+):\s*/i, (m, k) => k[0].toUpperCase() + k.slice(1) + ': ').trim();
  return t.replace(/[.;:,]+$/, '');
}
const xml = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

let uid = 0;
/** Конспект → SVG. Без await ready() формулы рисуются простым текстом. */
export function render(text, opts = {}) {
  if (typeof opts === 'number') opts = { width: opts };
  const W = opts.width || 680;
  let src = String(text ?? '').replace(/\r\n?/g, '\n');
  const ru = src.split('\n').map(l => normKw(l.trim())); // английские команды → русские (таблица 2.1)
  if (opts.class && !ru.some(l => /^класс\s*:/.test(l))) src = `класс: ${opts.class}\n` + src;
  let r;
  try { r = draw(src, W, { bw: opts.theme === 'bw' }); }
  catch (e) { r = { svg: '', h: 40, scheme: '', warns: ['Внутренняя ошибка рисования: ' + e.message + ' — сообщите авторам библиотеки.'] }; } // ТЗ Б4
  const wl = ru.find(l => /^ширина\s*:\s*\d+/.test(l)); const w = wl ? +wl.match(/\d+/)[0] : W; // строка «ширина:» сильнее настройки
  const h = Math.ceil(r.h);
  const lines = src.split('\n').map(l => normKw(l.trim())).filter(l => l && !SERVICE.test(l) && !/^-{3,}$/.test(l));
  const head = lines.find(l => /^тема\s*:/.test(l));
  const title = head ? readable(head.replace(/^тема\s*:\s*/, '')) : 'Графический конспект';
  const desc = lines.map(readable).filter(Boolean).join('. '); // текст конспекта по порядку чтения
  const id = 'dg' + (++uid);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" font-family="PT Serif, serif" role="img" aria-labelledby="${id}t ${id}d">` +
    `<title id="${id}t">${xml(title)}</title><desc id="${id}d">${xml(desc)}</desc>` +
    fontStyle(r.svg, opts.fonts || 'link', opts.fontsUrl) + r.svg + '</svg>';
  const own = String(text ?? '').replace(/\r\n?/g, '\n').split('\n'); // номера строк — по тексту автора
  return { svg, width: w, height: h, scheme: r.scheme, hints: r.warns.map(t => hintOf(t, own)), model: parse(src).model };
}

/** Только разбор: дерево конспекта по зонам и подсказки разбора и стиля (без раскладки). */
export function parse(text) {
  const src = String(text ?? '').replace(/\r\n?/g, '\n');
  const save = { ...S }; Object.assign(S, freshState());
  try {
    const zones = src.split(/^\s*-{3,}\s*$/m).map(z => {
      const { root, opts } = parseZone(z); if (!root.children.length) return null;
      const scheme = chooseScheme(root, opts);
      return { scheme, root, hints: lint(root, scheme.replace(/ё/g, 'е'), opts) };
    }).filter(Boolean);
    const hints = [...zones.flatMap(z => z.hints), ...S.WARN].map(t => hintOf(t, src.split('\n')));
    return { model: { zones: zones.map(z => ({ scheme: z.scheme, root: z.root })) }, hints };
  } finally { Object.assign(S, save); }
}
