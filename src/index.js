// ДРАКОН-ГРАФ: текст конспекта → SVG. Точка входа библиотеки (ТЗ библиотеки, раздел 4).
export { render, parse, version } from './api.js';
export { ready, mathjaxConfig } from './mathjax.js';
export { run } from './run.js';
// Внутренний рисунок без обёртки — для галереи и тестов эталона.
export { render as _render } from './render.js';
