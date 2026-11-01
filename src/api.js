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

export const version = '0.9.0-dev';

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
function hintOf(text) {
  const h = HINTS.find(([, re]) => re.test(text)); const code = h ? h[0] : '';
  return { code, level: IMPORTANT.has(code) ? 'важно' : 'совет', text };
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
const SERVICE = /^\s*(#|(класс|class|схема|scheme|ширина|width|начать с|подписи|labels)\s*:)/i;
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
  if (opts.class && !/^\s*(класс|class)\s*:/im.test(src)) src = `класс: ${opts.class}\n` + src;
  let r;
  try { r = draw(src, W, { bw: opts.theme === 'bw' }); }
  catch (e) { r = { svg: '', h: 40, scheme: '', warns: ['Внутренняя ошибка рисования: ' + e.message + ' — сообщите авторам библиотеки.'] }; } // ТЗ Б4
  const wm = src.match(/^\s*(ширина|width)\s*:\s*(\d+)/im); const w = wm ? +wm[2] : W; // строка «ширина:» сильнее настройки
  const h = Math.ceil(r.h);
  const lines = src.split('\n').filter(l => l.trim() && !SERVICE.test(l) && !/^\s*-{3,}\s*$/.test(l));
  const head = lines.find(l => /^\s*(тема|topic)\s*:/i.test(l));
  const title = head ? readable(head.replace(/^\s*(тема|topic)\s*:\s*/i, '')) : 'Графический конспект';
  const desc = lines.map(readable).filter(Boolean).join('. '); // текст конспекта по порядку чтения
  const id = 'dg' + (++uid);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" font-family="PT Serif, serif" role="img" aria-labelledby="${id}t ${id}d">` +
    `<title id="${id}t">${xml(title)}</title><desc id="${id}d">${xml(desc)}</desc>` +
    fontStyle(r.svg, opts.fonts || 'link', opts.fontsUrl) + r.svg + '</svg>';
  return { svg, width: w, height: h, scheme: r.scheme, hints: r.warns.map(hintOf), model: parse(src).model };
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
    const hints = [...zones.flatMap(z => z.hints), ...S.WARN].map(hintOf);
    return { model: { zones: zones.map(z => ({ scheme: z.scheme, root: z.root })) }, hints };
  } finally { Object.assign(S, save); }
}
