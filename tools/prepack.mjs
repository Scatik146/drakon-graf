// Подготовка пакета npm (запускается сам при npm pack / npm publish): сборка dist/ и копия шрифтов в fonts/.
// Работает и на Windows: только Node, без python и оболочки.
import { cpSync, mkdirSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const api = readFileSync('src/api.js', 'utf8').match(/export const version = '([^']+)'/)[1];
if (api !== pkg.version) { console.error(`Версия в src/api.js (${api}) не совпадает с package.json (${pkg.version})`); process.exit(1); }
execFileSync(process.execPath, ['tools/bundle.mjs'], { stdio: 'inherit' });
rmSync('fonts', { recursive: true, force: true }); mkdirSync('fonts');
for (const f of readdirSync('graf/fonts')) if (/\.(ttf|otf|txt)$/.test(f)) cpSync('graf/fonts/' + f, 'fonts/' + f);
console.log('fonts/:', readdirSync('fonts').join(', '));
