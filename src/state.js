// ДРАКОН-ГРАФ — состояние одного вызова render().
// В прототипе это были общие переменные. Теперь render() в начале каждого вызова заполняет S заново (freshState),
// а все модули читают и меняют только поля S. render синхронный, поэтому вызовы не мешают друг другу.
export const PAL={color:{line:'#993300',fill:'#FFFF99',orange:'#FFCC66',mark:'#CC6600',tie:'#FF9933',ex:'#FFFFFF',exb:'#333333',code:'#F6F3EA',codeb:'#C9BFA6',sep:'#D8C8A8'},
  bw:{line:'#222222',fill:'#E6E6E6',orange:'#C8C8C8',mark:'#444444',tie:'#666666',ex:'#FFFFFF',exb:'#000000',code:'#F2F2F2',codeb:'#999999',sep:'#BBBBBB'}};
export const MONO='"PT Mono", monospace', SANS='"PT Serif", serif'; /* шрифты ПараТайп (OFL), см. fonts/; SANS — историческое имя: с v8.3 текст набирается PT Serif */
export function freshState(){return{
  FS:14, LH:17,        // кегль и интерлиньяж (Р25; render меняет по классу)
  WARN:[],             // подсказки, собранные при раскладке
  HYPH:true,           // переносы по слогам разрешены (в заголовках, указателях и шапках — нет)
  NUMNEAR:false,       // номер ГНОМа вплотную к блоку (Р9)
  STRICT:false,        // вариант Б: одна ширина в колонке, отбивки внутри фигуры (Р5, Р7)
  LSTYLE:'auto',       // стиль подписей разбора
  NUM:1,               // счётчик номеров ГНОМа
  MATHS:[], MKEY:new Map(), // формулы этого рисунка: знак-метка U+F000+i ↔ формула (этап 3)
  C:{...PAL.color}};}  // палитра текущей темы
export const S=freshState();
