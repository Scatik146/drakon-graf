# graf/ — эталон ДРАКОН-ГРАФ и проверки

| Файл | Что это |
|---|---|
| `../src/` | движок — модули библиотеки (с этапа 1); собирается в `../dist/drakon-graf.js` командой `npm run bundle` |
| `examples*.js` | 249 эталонных примеров (каждый начинается строкой `# проверяет: …`) |
| `shell.html`, `build.py` | галерея; `python3 build.py` собирает `konspekt_v8.html` |
| `etalon/NNN.svg`, `etalon/manifest.json` | эталонные рисунки и подсказки |
| `tests/run.js` | приёмочные тесты: сверка с эталоном + геометрия + типографика |
| `tests/geo.js`, `tests/typo.js` | геометрическая и типографская проверки |

```bash
npm install && npx playwright install chromium
npm test                 # 0 расхождений с эталоном, 0 геометрических замечаний
npm run etalon:update    # переснять эталон — только по решению автора
```

Эталон — закон поведения библиотеки (ТЗ библиотеки, принцип Б2). Прототип, с которого он снят, сохранён в `docs/history/prototypes/v8_engine.js`.

Рисунки зависят от метрик шрифта. Шрифты — **PT Sans** и **PT Mono** (ПараТайп, лицензия SIL OFL 1.1), лежат в `fonts/`. Эталон снят в Chromium на Linux; запасные шрифты для знаков, которых нет в PT Sans, — Inter и DejaVu Sans. Набор закреплён в `tests/fonts/fonts.conf`.
