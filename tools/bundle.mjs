// Сборка библиотеки: src/index.js → dist/drakon-graf.js (для <script>, глобальное имя drakonGraf)
//                                  → dist/drakon-graf.mjs (ESM для сборщиков и Node)
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
let esbuild;
try { esbuild = require('esbuild'); } catch { esbuild = require('/opt/npm-tools/node_modules/esbuild'); } // локально без npm
const common = { entryPoints: ['src/index.js'], bundle: true, charset: 'utf8', legalComments: 'none', logLevel: 'warning', target: 'es2020' };
await esbuild.build({ ...common, format: 'iife', globalName: 'drakonGraf', outfile: 'dist/drakon-graf.js' });
await esbuild.build({ ...common, format: 'esm', outfile: 'dist/drakon-graf.mjs' });
console.log('dist/drakon-graf.js, dist/drakon-graf.mjs');
