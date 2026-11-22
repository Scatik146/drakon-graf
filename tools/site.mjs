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

// --- Находимость: документы для ИИ-агентов и поисковиков ---
const САЙТ = 'https://scatik146.github.io/drakon-graf/';
const ИСХОДНИК = 'https://github.com/Scatik146/drakon-graf/blob/main/';

// документ: откуда берём, куда кладём на сайте, как называется
const ДОКУМЕНТЫ = [
  { из: 'navyk/drakon-graf-konspekt.md', в: 'navyk/drakon-graf-konspekt.md', имя: 'Навык для ИИ: графический конспект ДРАКОН-ГРАФ' },
  { из: 'docs/graf/формальное_описание.md', в: 'docs/opisanie-yazyka.md', имя: 'Формальное описание языка' },
  { из: 'docs/graf/справочник_учителя.md', в: 'docs/spravochnik-uchitelya.md', имя: 'Справочник учителя' },
  { из: 'docs/graf/шпаргалка_ученика.md', в: 'docs/shpargalka-uchenika.md', имя: 'Шпаргалка ученика' },
  { из: 'docs/drakon/текстовая_запись.md', в: 'docs/drakon-tekstovaya-zapis.md', имя: 'Текстовая запись ДРАКОН-схем' },
];
// страницы для карты сайта
const СТРАНИЦЫ = ['', 'generator/', 'llms.txt', 'llms-full.txt'];

// строка-пометка: где лежит подлинник документа
function пометкаИсточника(док) {
  return `<!-- Копия для сайта. Подлинник: ${ИСХОДНИК}${док.из} -->\n\n`;
}

// копия документа на сайт с пометкой об источнике
function положитьДокумент(док) {
  mkdirSync(`${OUT}/${док.в.split('/').slice(0, -1).join('/')}`, { recursive: true });
  writeFileSync(`${OUT}/${док.в}`, пометкаИсточника(док) + readFileSync(док.из, 'utf8'));
}

// один раздел полного файла для нейросетей
function разделПолногоФайла(док) {
  return `\n\n---\n\n# ${док.имя}\n\nИсточник: ${САЙТ}${док.в}\n\n${readFileSync(док.из, 'utf8')}`;
}

// llms-full.txt: оглавление llms.txt и все документы целиком
function собратьПолныйФайл() {
  const шапка = readFileSync('site/llms.txt', 'utf8');
  writeFileSync(`${OUT}/llms-full.txt`, шапка + ДОКУМЕНТЫ.map(разделПолногоФайла).join(''));
}

// карта сайта для поисковиков; дата — день сборки
function собратьКартуСайта() {
  const день = new Date().toISOString().slice(0, 10);
  const адреса = СТРАНИЦЫ.map(п => `  <url><loc>${САЙТ}${п}</loc><lastmod>${день}</lastmod></url>`);
  const карта = ['<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">', ...адреса, '</urlset>', ''];
  writeFileSync(`${OUT}/sitemap.xml`, карта.join('\n'));
}

ДОКУМЕНТЫ.forEach(положитьДокумент);
copyFileSync('navyk/drakon-graf-konspekt.zip', `${OUT}/navyk/drakon-graf-konspekt.zip`);
собратьПолныйФайл();
собратьКартуСайта();
console.log('сайт собран в', OUT);
