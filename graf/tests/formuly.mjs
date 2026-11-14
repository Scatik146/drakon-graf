// Задание 008: формулы в пометках примера и в строке «Формула ->» читаемы, рамки подстраиваются под формулу.
// Проверка на 25 блоках docs/graf/primery/formuly-test.md:  node graf/tests/formuly.mjs
import { readFileSync } from 'node:fs';
import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { render, ready } from '../../src/index.js';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
let fail = 0; const ok = (c, msg) => { console.log((c ? '  ✓ ' : '  ✗ ') + msg); if (!c) fail++; };
await ready();
const md = readFileSync(path.join(R, 'docs/graf/primery/formuly-test.md'), 'utf8');
const blocks = [...md.matchAll(/```конспект\n([\s\S]*?)```/g)].map(m => m[1]);
ok(blocks.length === 25, `formuly-test.md: 25 блоков (${blocks.length})`);
const num = s => s.match(/-?[\d.]+/g).map(Number);
// формулы (вложенные <svg>) и белые пометки (<rect … fill="#fff">) рисунка
const maths = svg => [...svg.matchAll(/<svg x="([\d.-]+)" y="([\d.-]+)" width="([\d.]+)" height="([\d.]+)"/g)].map(m => num(m.slice(1).join(' ')));
const pills = svg => [...svg.matchAll(/<rect x="([\d.-]+)" y="([\d.-]+)" width="([\d.]+)" height="([\d.]+)" rx="11.5" fill="#fff"/g)].map(m => num(m.slice(1).join(' ')));
const outside = [], small = [];
blocks.forEach((b, i) => {
  const r = render(b); const P = pills(r.svg);
  for (const [x, y, w, h] of maths(r.svg)) {
    const box = P.find(([px, py, pw, ph]) => x >= px - 0.5 && x + w <= px + pw + 0.5 && y < py + ph && y + h > py);
    if (box && (y < box[1] + 1.5 || y + h > box[1] + box[3] - 1.5)) outside.push(`блок ${i + 1}`);
  }
  if (/\\frac/.test(b) && /\[\$[^\]]*\\frac/.test(b)) {
    const tall = maths(r.svg).some(([, , , h]) => h >= 14 * 1.8); // дробь выключная: выше 1,8 кегля
    if (!tall) small.push(`блок ${i + 1}`);
  }
});
ok(!outside.length, 'формула целиком внутри своей пометки (с запасом 1,5 px)' + (outside.length ? ': ' + outside.join(', ') : ''));
ok(!small.length, 'дроби в пометках — выключные, не мельче кегля' + (small.length ? ': ' + small.join(', ') : ''));
const b9 = render(blocks[8]).svg;
ok(maths(b9).length === 2, 'блок 9: выключная формула $$…$$ рисуется отдельной рамкой');
ok(!/>функции<\/text>/.test(b9), 'блок 9: длинная подпись — две строки, не узкий столбец');
const b19 = render(blocks[18]).svg; const f19 = maths(b19).map(q => q[3]);
ok(f19.filter(h => h >= 14 * 1.8).length >= 3, 'блок 19: дроби и в пометке, и в строке «Формула ->» выключные');
// рисунок без формул не меняется: тот же текст без $…$ даёт ту же высоту, что и раньше (пометки высотой 23 px)
const plain = render('тема: Т\nпример: [17]{делимое} = [5]{делитель} · [3]{частное}').svg;
ok(pills(plain).every(p => p[3] === 23), 'без формул пометки прежней высоты (23 px)');
console.log(fail ? `Формулы: ошибок ${fail}` : 'Формулы: всё работает');
process.exitCode = fail ? 1 : 0;
