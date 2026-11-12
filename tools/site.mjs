// Сборка сайта ДРАКОН-ГРАФ: site/ + библиотека + шрифты + образцы → _site/ (публикуется в ветку gh-pages).
//   node tools/site.mjs
import { cpSync, mkdirSync, rmSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const OUT = '_site';
execFileSync(process.execPath, ['tools/bundle.mjs'], { stdio: 'inherit' });
rmSync(OUT, { recursive: true, force: true });
cpSync('site', OUT, { recursive: true });
mkdirSync(`${OUT}/lib/fonts`, { recursive: true });
copyFileSync('dist/drakon-graf.min.js', `${OUT}/lib/drakon-graf.min.js`);
for (const f of ['PT_Serif-Web-Regular.ttf', 'PT_Serif-Web-Bold.ttf', 'PT_Serif-Web-Italic.ttf', 'PT_Serif-Web-BoldItalic.ttf',
  'PTM55FT.ttf', 'Asana-Math.otf', 'OFL_PT_Serif.txt', 'OFL_PT_Mono.txt', 'OFL_Asana_Math.txt']) copyFileSync(`graf/fonts/${f}`, `${OUT}/lib/fonts/${f}`);
writeFileSync(`${OUT}/lib/examples.js`, readFileSync('graf/examples.js', 'utf8') + '\nwindow.EXAMPLES = EXAMPLES;\n');
for (const f of ['LICENSE', 'NOTICE']) copyFileSync(f, `${OUT}/${f}.txt`);
writeFileSync(`${OUT}/.nojekyll`, '');
console.log('сайт собран в', OUT);
