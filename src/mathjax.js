// ДРАКОН-ГРАФ — подключение MathJax 4 со шрифтом Asana Math (этап 3).
// render() синхронный, поэтому MathJax готовится заранее: await drakonGraf.ready().
// Node: ready() сам загружает пакет mathjax. Браузер: на странице должен быть MathJax
// (tex-mml-svg-mathjax-asana.js из @mathjax/mathjax-asana-font) с настройкой mathjaxConfig().
// Ширину текста внутри формул (\text{…}) и в браузере, и в Node меряют таблицы PT Serif,
// поэтому формулы одинаковы везде (проверяет graf/tests/run.js: Node = браузер).
import { useMathJax, mathOn } from './text/math.js';
import { tw } from './text/measure.js';

/** Настройка MathJax для ДРАКОН-ГРАФ. В браузере: window.MathJax = mathjaxConfig('<путь к mathjax>', '<путь к @mathjax/mathjax-asana-font>').
 *  Без путей MathJax берёт файлы с CDN jsDelivr. */
export function mathjaxConfig(path, fontPath) {
  const c = {
    startup: { typeset: false },
    output: { font: 'mathjax-asana', linebreaks: { inline: false } }, // формула в строке — неделимое слово, переносит движок
    svg: { fontCache: 'none', mtextInheritFont: false, mtextFont: 'PT Serif' },
    // в браузере MathJax добавляет разметку для экранных дикторов; у ДРАКОН-ГРАФ своё описание (<title>/<desc>, этап 4)
    options: { enableEnrichment: false, enableComplexity: false, enableExplorer: false, enableSpeech: false, enableBraille: false, enableMenu: false },
  };
  if (path || fontPath) c.loader = { paths: { ...(path ? { mathjax: path } : {}), ...(fontPath ? { 'mathjax-asana': fontPath } : {}) } };
  return c;
}

let pending = null;
/** Подготовить MathJax. Без вызова ready() формулы рисуются простым текстом (запасной путь). */
export function ready(opt = {}) {
  if (mathOn()) return Promise.resolve();
  return pending || (pending = (async () => {
    let MJ = opt.mathjax || (typeof window !== 'undefined' ? window.MathJax : null);
    if (MJ && MJ.startup && MJ.startup.promise) await MJ.startup.promise;
    else if (typeof window === 'undefined') {
      const spec = 'mathjax'; MJ = (await import(spec)).default;
      const { options, ...cfg } = mathjaxConfig(); // в Node модулей доступности нет — их настройки не нужны
      await MJ.init({ ...cfg, loader: { load: ['input/tex', 'output/svg'] } });
    } else throw new Error('drakon-graf: на странице нет MathJax 4 (см. README, раздел «Формулы»)');
    // браузерный MathJax включает обогащение для экранных дикторов из своих настроек меню — выключаем прямо в документе
    const D = MJ.startup.document.options;
    for (const k of ['enableEnrichment', 'enableSpeech', 'enableBraille', 'enableExplorer', 'enableComplexity']) if (k in D) D[k] = false;
    const A = MJ.startup.adaptor;
    A.nodeSize = (node) => [tw(A.textContent(node), false, 1), 0.8]; // ширина в долях кегля по таблицам PT Serif
    const font = MJ.startup.document.outputJax.font;
    if (font.loadDynamicFiles) await font.loadDynamicFiles(); // все знаки шрифта заранее: дальше набор синхронный
    useMathJax(MJ);
  })());
}
