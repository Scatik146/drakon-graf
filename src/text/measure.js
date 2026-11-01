// ДРАКОН-ГРАФ — модуль перенесён из прототипа graf/engine.js (этап 1, без изменения поведения)
import { MONO, S, SANS } from '../state.js';

let cx2d=null; // холст для измерения текста создаётся при первом вызове (в Node — подменяется, этап 2)
function tw(t,bold,size,mono){if(!cx2d)cx2d=document.createElement('canvas').getContext('2d');cx2d.font=(bold?'bold ':'')+(size||S.FS)+'px '+(mono?MONO:SANS);return cx2d.measureText(t).width;}

export { cx2d, tw };
