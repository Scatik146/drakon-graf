// Проверка установленного пакета: node tools/smoke.mjs <папка, где сделано npm install drakon-graf>
// Рисует конспект с формулой через сам пакет (как пользователь) и запускает командную строку.
import { execFileSync } from 'node:child_process';
import { writeFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path'; import { pathToFileURL } from 'node:url';
const dir = path.resolve(process.argv[2] || '.');
const main = path.join(dir, 'node_modules/drakon-graf/src/index.js');
const { render, ready, version } = await import(pathToFileURL(main));
await ready();
const r = render('тема: Проверка пакета\nправило: Корни $x_{1,2}=\\frac{-b\\pm\\sqrt{D}}{2a}$.\nпример: [17]{делимое} = [5]{делитель} · [3]{частное} + [2]{остаток}');
const checks = [
  ['версия ' + version, !!version],
  ['SVG с <title>', /<title id="dg\d+t">Проверка пакета<\/title>/.test(r.svg)],
  ['формула набрана MathJax', /<svg x="[\d.]+" y="[\d.]+" width=/.test(r.svg)],
  ['подсказок нет', r.hints.length === 0],
  ['шрифты в пакете', ['PT_Serif-Web-Regular.ttf', 'Asana-Math.otf', 'PTM55FT.ttf'].every(f => existsSync(path.join(dir, 'node_modules/drakon-graf/fonts', f)))],
  ['dist/drakon-graf.js в пакете', existsSync(path.join(dir, 'node_modules/drakon-graf/dist/drakon-graf.js'))],
];
writeFileSync(path.join(dir, 'урок.md'), '```конспект\nтема: А\nА -> Это а.\n```\n');
execFileSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['drakon-graf', 'урок.md', '-o', 'out'], { cwd: dir, stdio: 'pipe', shell: process.platform === 'win32' });
checks.push(['npx drakon-graf урок.md → out/урок-1.svg', existsSync(path.join(dir, 'out', 'урок-1.svg'))]);
let bad = 0; for (const [m, ok] of checks) { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; }
console.log(bad ? 'Пакет: ошибок ' + bad : 'Пакет работает'); process.exitCode = bad ? 1 : 0;
