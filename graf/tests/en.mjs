// Русские и английские команды равноправны (формальное описание, таблица 2.1).
// Все 249 примеров эталона переводятся на английские ключевые слова — рисунок и подсказки должны совпасть до байта.
// Плюс имена блока в Markdown: ```конспект и ```drakon-graf (```konspekt больше не поддерживается).
import { readFileSync } from 'node:fs'; import vm from 'node:vm'; import path from 'node:path';
import { fileURLToPath } from 'node:url'; import { createRequire } from 'node:module';
import { _render, render, ready } from '../../src/index.js';
const require = createRequire(import.meta.url);
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const ctx = {}; vm.runInNewContext(['examples.js', 'examples_hs.js', 'examples_v4.js', 'examples_v5a.js', 'examples_v5b.js'].map(f => readFileSync(path.join(R, 'graf', f), 'utf8')).join('\n') + ';this.EXAMPLES=EXAMPLES;', ctx);
// русское ключевое слово → английское (таблица 2.1)
const KW = [['тема', 'topic'], ['связка', 'link'], ['стрелка', 'arrow'], ['правило', 'rule'], ['контрпример', 'counterexample'], ['пример', 'example'],
  ['связь', 'relation'], ['выноска', 'callout'], ['уточнение', 'note'], ['пояснение', 'note'], ['рисунок', 'picture'], ['код', 'code'],
  ['определение', 'def'], ['опр', 'def'], ['теорема', 'theorem'], ['свойство', 'property'], ['признак', 'criterion'], ['следствие', 'corollary'],
  ['формула', 'formula'], ['аксиома', 'axiom'], ['алгоритм', 'algorithm'], ['закон', 'law'], ['метод', 'method'], ['команда', 'command'],
  ['единица', 'unit'], ['схема', 'scheme'], ['класс', 'grade'], ['ширина', 'width'], ['нумерация', 'numbering'], ['язык', 'lang'], ['начать с', 'start']];
const SCH = { 'гном': 'gnome', 'батарея': 'battery', 'лестница': 'ladder', 'линейка': 'ruler', 'шахматы': 'chess', 'гребенка': 'comb', 'гребёнка': 'comb',
  'эполеты': 'epaulets', 'очная ставка': 'faceoff', 'дерево': 'tree', 'шеренга': 'rank', 'сцена': 'scene', 'двуглавый змей': 'snake' };
let changed = 0;
function toEn(src) {
  return src.split('\n').map(l => {
    const m = l.match(/^(\s*)(.*)$/); let [, ind, t] = m; const t0 = t;
    for (const [ru, en] of KW) {
      const re = new RegExp('^' + ru.replace(/е/g, '[её]') + '(?=\\s*:|\\s+(снизу|справа)\\s*:|\\s*(→|->)|\\s+\\S.*:)');
      if (re.test(t) && !(ru === 'связь' && !/^связь\s+\S.*:/.test(t))) {
        t = en + t.slice(t.match(re)[0].length);
        if (en === 'callout' || en === 'note') t = t.replace(/^(callout|note)\s+снизу/, '$1 below').replace(/^(callout|note)\s+справа/, '$1 right');
        if (en === 'scheme') { const v = t.replace(/^scheme\s*:\s*/, '').trim(); if (SCH[v]) t = 'scheme: ' + SCH[v]; }
        break;
      }
    }
    if (t !== t0) changed++;
    return ind + t;
  }).join('\n');
}
await ready();
let diff = [];
ctx.EXAMPLES.forEach((e, i) => {
  const a = _render(e.s, 680), b = _render(toEn(e.s), 680);
  if (a.svg !== b.svg || JSON.stringify(a.warns) !== JSON.stringify(b.warns) || a.scheme !== b.scheme) diff.push(i);
});
let fail = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fail++; };
ok(diff.length === 0, `английские команды: ${changed} строк переведено, рисунки и подсказки 249 примеров совпадают` + (diff.length ? ` — расходятся: ${diff.slice(0, 10).join(' ')}` : ''));
// Markdown: три имени блока
let md; try { md = require('markdown-it')(); } catch { md = require('/opt/npm-tools/node_modules/markdown-it')(); }
md.use((await import('../../src/markdown-it.js')).default);
for (const name of ['конспект', 'drakon-graf']) {
  const html = md.render('```' + name + '\ntopic: Fractions\nДробь -> Это часть целого.\n```\n');
  ok(/<figure class="drakon-graf"[^>]*><svg/.test(html), `markdown-it: блок \`\`\`${name}`);
}
ok(!/<figure/.test(md.render('```konspekt\nтема: X\n```\n')), 'markdown-it: ```konspekt — обычный блок кода (имя убрано)');
const enOnly = render('topic: Квадратное уравнение\ngrade: 8\nrule: Корни $x_{1,2}=\\frac{-b\\pm\\sqrt{D}}{2a}$.\nexample: [$x^2-5x+6=0$]{уравнение}');
const ruOnly = render('тема: Квадратное уравнение\nкласс: 8\nправило: Корни $x_{1,2}=\\frac{-b\\pm\\sqrt{D}}{2a}$.\nпример: [$x^2-5x+6=0$]{уравнение}');
ok(enOnly.svg.replace(/dg\d+/g, '') === ruOnly.svg.replace(/dg\d+/g, ''), 'render: конспект на английских командах = на русских, вместе с <title> и <desc>');
console.log(fail ? `Русские и английские команды: ошибок ${fail}` : 'Русские и английские команды: всё совпадает');
process.exitCode = fail ? 1 : 0;
