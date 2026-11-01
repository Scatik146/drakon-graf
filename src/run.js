// ДРАКОН-ГРАФ — отрисовка всех конспектов на странице (ТЗ библиотеки, раздел 4; этап 4).
//   <pre><code class="language-конспект">…</code></pre>  или  class="language-konspekt"
//   <script>drakonGraf.run();</script>
// Каждый блок заменяется на <figure class="drakon-graf"> с SVG; подсказки — в <figcaption> (hints: true)
// или только в консоли (по умолчанию).
import { render } from './api.js';
import { ready, mathjaxConfig } from './mathjax.js';

const SEL = 'code.language-конспект, code.language-konspekt, pre.language-конспект, pre.language-konspekt';

/** Ждёт MathJax (если подключён) и рисует все блоки. Возвращает число нарисованных конспектов. */
export async function run(opts = {}) {
  if (typeof document === 'undefined') throw new Error('drakon-graf: run() работает только в браузере');
  if (document.readyState === 'loading') await new Promise(r => document.addEventListener('DOMContentLoaded', r, { once: true }));
  const root = opts.root || document;
  if (window.MathJax && window.MathJax.startup) { try { await ready(); } catch (e) { console.warn(e.message); } }
  else if (opts.mathjax !== false && root.querySelector(SEL) && /\$/.test(root.body ? root.body.textContent : root.textContent)) {
    console.info('drakon-graf: формулы нарисованы простым текстом — подключите MathJax 4 (см. README, «Формулы»)');
  }
  let n = 0;
  for (const el of root.querySelectorAll(SEL)) {
    const box = el.tagName === 'CODE' && el.parentElement && el.parentElement.tagName === 'PRE' ? el.parentElement : el;
    const text = el.textContent;
    const r = render(text, { width: opts.width, theme: opts.theme, class: opts.class, fonts: opts.fonts || 'link', fontsUrl: opts.fontsUrl });
    const fig = document.createElement('figure'); fig.className = 'drakon-graf'; fig.dataset.scheme = r.scheme;
    fig.innerHTML = r.svg;
    const svg = fig.firstElementChild; svg.style.maxWidth = '100%'; svg.style.height = 'auto';
    if (r.hints.length) {
      if (opts.hints) {
        const cap = document.createElement('figcaption');
        cap.innerHTML = r.hints.map(h => `<div class="dg-hint dg-${h.level === 'важно' ? 'important' : 'advice'}">${h.code ? h.code + ': ' : ''}${h.text.replace(/</g, '&lt;')}</div>`).join('');
        fig.appendChild(cap);
      } else console.info('drakon-graf:', r.hints.map(h => (h.code ? h.code + ' ' : '') + h.text).join(' | '));
    }
    box.replaceWith(fig); n++;
  }
  return n;
}
export { mathjaxConfig };
