# graf/ — эталон ДРАКОН-ГРАФ и проверки

| Файл | Что это |
|---|---|
| `../src/` | движок — модули библиотеки (с этапа 1); собирается в `../dist/drakon-graf.js` командой `npm run bundle` |
| `examples*.js` | 249 эталонных примеров (каждый начинается строкой `# проверяет: …`) |
| `shell.html`, `build.py` | галерея; `python3 build.py` собирает `konspekt_v8.html` |
| `etalon/NNN.svg`, `etalon/manifest.json` | эталонные рисунки и подсказки |
| `tests/run.js` | приёмочные тесты: сверка с эталоном, совпадение Node и браузера, геометрия, типографика |
| `tests/node.mjs` | те же примеры, нарисованные в Node без браузера |
| `tests/geo.js`, `tests/typo.js` | геометрическая и типографская проверки |

```bash
npm install && npx playwright install chromium
npm test                 # 0 расхождений с эталоном, 0 геометрических замечаний
npm run etalon:update    # переснять эталон — только по решению автора
```

Эталон — закон поведения библиотеки (ТЗ библиотеки, принцип Б2). Прототип, с которого он снят, сохранён в `docs/history/prototypes/v8_engine.js`.

Шрифты — **PT Sans** и **PT Mono** (ПараТайп, лицензия SIL OFL 1.1), лежат в `fonts/`. С этапа 2 ширина текста считается по таблицам метрик (`src/text/metrics.js`), поэтому рисунок не зависит от машины. Таблицы собирает `npm run metrics`: ширины и кернинг PT — из файлов шрифтов, запасные знаки (Inter, DejaVu Sans) — замером в Chromium с набором шрифтов эталона `tests/fonts/fonts.conf`. Сверить таблицы с браузером: `FONTCONFIG_FILE=graf/tests/fonts/fonts.conf node tools/check_metrics.mjs`.
