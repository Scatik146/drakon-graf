// ДРАКОН-ГРАФ — плагин markdown-it (ТЗ библиотеки, раздел 4; этап 4).
//   import markdownit from 'markdown-it'; import drakonGraf from 'drakon-graf/markdown-it'; import { ready } from 'drakon-graf';
//   await ready();                              // формулы через MathJax (без этого — простым текстом)
//   const md = markdownit().use(drakonGraf, { width: 680, fonts: 'link' });
//   md.render('```конспект\nтема: …\n```');     // блок становится <figure class="drakon-graf"><svg…></figure>
import { render } from './api.js';

const LANG = /^(конспект|drakon-graf)(?=\s|$)/; // русское и английское имя блока
export default function drakonGrafPlugin(md, opts = {}) {
  const fence = md.renderer.rules.fence || ((t, i, o, e, self) => self.renderToken(t, i, o));
  md.renderer.rules.fence = (tokens, idx, options, env, self) => {
    const t = tokens[idx];
    if (!LANG.test((t.info || '').trim())) return fence(tokens, idx, options, env, self);
    const r = render(t.content, opts);
    if (env && Array.isArray(env.drakonGrafHints)) { const l0 = t.map ? t.map[0] + 2 : null; // первая строка текста блока в файле
      env.drakonGrafHints.push({ line: l0, hints: r.hints.map(h => ({ ...h, fileLine: l0 && h.line ? l0 + h.line - 1 : l0 })) }); }
    const cap = opts.hints && r.hints.length
      ? '<figcaption>' + r.hints.map(h => `<div class="dg-hint">${h.code ? h.code + ': ' : ''}${md.utils.escapeHtml(h.text)}</div>`).join('') + '</figcaption>' : '';
    return `<figure class="drakon-graf" data-scheme="${md.utils.escapeHtml(r.scheme)}">${r.svg}${cap}</figure>\n`;
  };
}
