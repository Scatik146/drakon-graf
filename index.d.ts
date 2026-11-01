// Типы для TypeScript: ДРАКОН-ГРАФ (drakon-graf) 0.9
export interface RenderOptions {
  /** Ширина схемы, px (по умолчанию 680; строка «ширина:» в тексте сильнее). */
  width?: number;
  /** Тема: цветная (по умолчанию) или чёрно-белая. */
  theme?: 'color' | 'bw';
  /** Класс 1–11: кегль 15/14/13 px (строка «класс:» в тексте сильнее). */
  class?: number;
  /** Шрифты в SVG: ссылка (по умолчанию), встроить целиком или не указывать. */
  fonts?: 'link' | 'embed' | 'none';
  /** Где лежат шрифты для fonts: 'link' (по умолчанию — CDN jsDelivr). */
  fontsUrl?: string;
}
export interface Hint {
  /** Код по каталогу подсказок Н1–Н29 (пусто, если подсказка новая). */
  code: string;
  level: 'важно' | 'совет';
  text: string;
}
export interface RenderResult {
  svg: string; width: number; height: number;
  /** Выбранная схема: «батарея», «шеренга + сцена» и т. п. */
  scheme: string;
  hints: Hint[];
  model: { zones: { scheme: string; root: unknown }[] };
}
/** Конспект → SVG. Для формул сначала дождитесь ready(). */
export function render(text: string, options?: RenderOptions | number): RenderResult;
/** Только разбор: дерево и подсказки, без рисования. */
export function parse(text: string): { model: RenderResult['model']; hints: Hint[] };
/** Подготовить MathJax 4 (формулы). Node — сам; браузер — по mathjaxConfig на странице. */
export function ready(options?: { mathjax?: unknown }): Promise<void>;
/** Настройка window.MathJax для браузера. */
export function mathjaxConfig(mathjaxPath?: string, fontPath?: string): object;
/** Нарисовать все блоки language-конспект на странице. Возвращает число конспектов. */
export function run(options?: RenderOptions & { hints?: boolean; root?: ParentNode; mathjax?: boolean }): Promise<number>;
export const version: string;
