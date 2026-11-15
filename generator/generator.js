/* Генератор конспектов ДРАКОН-ГРАФ.
   Текст слева → схема справа; печать, PNG, SVG, текст, ссылка-конспект, автосохранение.
   Код собран вокруг одного объекта Gen, чтобы потом встроить генератор в редактор «Живой конспект». */
(function () {
  'use strict';
  const DG = window.drakonGraf;
  const $ = (id) => document.getElementById(id);

  /* все надписи — в одном месте: так проще добавить английский интерфейс */
  const STR = {
    saved: 'Сохранено: ', copied: 'Картинка скопирована — вставьте её в документ или презентацию',
    copyFail: 'Браузер не дал скопировать картинку — скачайте PNG', link: 'Ссылка скопирована: по ней откроется этот конспект',
    linkLong: 'Конспект длинный, ссылка вышла большой — некоторые мессенджеры её обрежут. Надёжнее отправить файл «Текст».',
    noMd: 'В файле нет блока ```конспект — открыт весь текст', ok: 'Подсказок нет — схема собрана по правилам',
    line: 'строка ', important: 'Важно', advice: 'Совет', mathLoading: 'загружаю формулы…', mathFail: 'Формулы не загрузились — показаны текстом',
    empty: 'Напишите конспект слева — схема появится здесь.'
  };

  const BASE = new URL('../lib/', location.href).href;
  const FONTS = BASE + 'fonts/';
  const KEY = 'dg-generator-text';
  const KEY_OPT = 'dg-generator-opt';

  const DEFAULT = `тема: Как найти НОД? Алгоритм Евклида
класс: 7
опр: НОД -> Это наибольшее число, на которое делятся оба числа.
пример: НОД([12]{первое число}, [18]{второе число}) = [6]{НОД}
---
тема: Способ 1. Вычитание
1. Из большего числа вычти меньшее.
2. Повторяй, пока числа не станут равны.
3. Равные числа — это и есть НОД.
пример: НОД(48, 18)
  => 48 − 18 = 30        {вычли меньшее из большего}
  => 30 − 18 = 12        {вычли меньшее из большего}
  => 18 − 12 = 6         {вычли меньшее из большего}
  => 12 − 6 = 6          {числа равны — стоп}
стрелка: Значит, НОД(48, 18) = 6.
---
тема: Способ 2. Деление с остатком
правило → остаток: Остаток всегда меньше делителя.
пример: [48]{делимое} = [2]{частное} · [18]{делитель} + [12]{остаток}
---
тема: Сравним два способа
связка: Вычитание | Деление с остатком
Действие -> вычитаем | делим с остатком
Скорость -> медленно | быстро
Стоп-сигнал -> числа равны | остаток нуль`;

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  /* ---------- состояние ---------- */
  const src = $('src'), out = $('out');
  let last = null;           // последний результат render()
  let mathState = 'off';     // off | loading | on | fail

  function opts(extra) {
    const o = { width: 680, theme: $('bw').checked ? 'bw' : 'color', fonts: 'link', fontsUrl: FONTS };
    if ($('cls').value) o.class = +$('cls').value;
    return Object.assign(o, extra || {});
  }

  /* ---------- рисование ---------- */
  function draw() {
    const text = src.value;
    $('lines').textContent = text.split('\n').length + ' строк';
    if (!text.trim()) { out.innerHTML = `<p class="mut" style="text-align:center">${STR.empty}</p>`; $('hints').innerHTML = ''; $('scheme').textContent = ''; last = null; return; }
    if (/\$/.test(text) && mathState === 'off') loadMath();
    last = DG.render(text, opts());
    out.innerHTML = last.svg;
    $('scheme').textContent = (last.scheme ? 'схема: ' + last.scheme : '') + (mathState === 'loading' ? ' · ' + STR.mathLoading : '');
    showHints(last.hints);
  }
  function showHints(h) {
    const box = $('hints');
    if (!h.length) { box.innerHTML = `<div class="ok">✓ ${STR.ok}</div>`; return; }
    box.innerHTML = '';
    h.forEach((x) => {
      const b = document.createElement('button');
      b.className = 'hint' + (x.level === 'важно' ? ' imp' : '');
      b.innerHTML = `<b>${x.level === 'важно' ? STR.important : STR.advice}${x.line ? ', ' + STR.line + x.line : ''}:</b> ${esc(x.text)}`;
      if (x.line) b.onclick = () => goLine(x.line);
      box.appendChild(b);
    });
  }
  function goLine(n) {
    const lines = src.value.split('\n'); let a = 0;
    for (let i = 0; i < n - 1 && i < lines.length; i++) a += lines[i].length + 1;
    src.focus(); src.setSelectionRange(a, a + (lines[n - 1] || '').length);
    const lh = parseFloat(getComputedStyle(src).lineHeight) || 22; src.scrollTop = Math.max(0, (n - 4) * lh);
  }
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* формулы: MathJax с CDN, только если в тексте есть $ */
  function loadMath() {
    mathState = 'loading';
    window.MathJax = DG.mathjaxConfig();
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/@mathjax/mathjax-asana-font@4.1.3/tex-mml-svg-mathjax-asana.js';
    s.onload = () => DG.ready().then(() => { mathState = 'on'; draw(); }).catch(() => { mathState = 'fail'; toast(STR.mathFail); draw(); });
    s.onerror = () => { mathState = 'fail'; toast(STR.mathFail); draw(); };
    document.head.appendChild(s);
  }

  /* ---------- шрифты внутрь SVG (для PNG и скачивания) ---------- */
  const fontCache = {};
  async function fontData(url) {
    if (!fontCache[url]) fontCache[url] = fetch(url).then((r) => r.arrayBuffer()).then((buf) => {
      let bin = ''; const b = new Uint8Array(buf);
      for (let i = 0; i < b.length; i += 0x8000) bin += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000));
      return `data:font/${url.endsWith('otf') ? 'otf' : 'ttf'};base64,` + btoa(bin);
    });
    return fontCache[url];
  }
  async function svgStandalone() {
    const r = DG.render(src.value, opts());
    let svg = r.svg;
    const urls = [...new Set([...svg.matchAll(/url\(([^)]+\.(?:ttf|otf))\)/g)].map((m) => m[1]))];
    for (const u of urls) { try { svg = svg.split(`url(${u})`).join(`url(${await fontData(u)})`); } catch (e) {} }
    if (!/^<\?xml/.test(svg)) svg = '<?xml version="1.0" encoding="UTF-8"?>\n' + svg;
    return { svg, w: r.width, h: r.height };
  }
  async function pngBlob(scale) {
    const { svg, w, h } = await svgStandalone();
    const img = new Image();
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    await new Promise((ok, bad) => { img.onload = ok; img.onerror = bad; img.src = url; });
    await new Promise((r) => setTimeout(r, 60)); // шрифты из data: успевают примениться
    const c = document.createElement('canvas'); c.width = Math.ceil(w * scale); c.height = Math.ceil(h * scale);
    const g = c.getContext('2d'); g.fillStyle = '#ffffff'; g.fillRect(0, 0, c.width, c.height);
    g.drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
    return new Promise((r) => c.toBlob(r, 'image/png'));
  }

  /* ---------- файлы ---------- */
  function fileName(ext) {
    const m = src.value.match(/^\s*(?:тема|topic)\s*:\s*(.+)$/m);
    const base = (m ? m[1] : 'конспект').replace(/[\\/:*?"<>|$`]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60) || 'конспект';
    return base + '.' + ext;
  }
  function download(blob, name) {
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    toast(STR.saved + name);
  }
  function openText(text, name) {
    let t = text;
    if (/\.(md|markdown)$/i.test(name || '')) {
      const m = text.match(/```(?:конспект|drakon-graf)\s*\n([\s\S]*?)```/);
      if (m) t = m[1]; else toast(STR.noMd);
    }
    setText(t.replace(/\s+$/, ''));
  }

  /* ---------- ссылка-конспект: текст сжат и лежит в адресе после # ---------- */
  const b64u = (bytes) => { let s = ''; bytes.forEach((b) => (s += String.fromCharCode(b))); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
  const unb64u = (s) => { s = s.replace(/-/g, '+').replace(/_/g, '/'); const bin = atob(s); return Uint8Array.from(bin, (c) => c.charCodeAt(0)); };
  async function packText(t) {
    const raw = new TextEncoder().encode(t);
    if (typeof CompressionStream === 'function') {
      const z = new Uint8Array(await new Response(new Blob([raw]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer());
      return 'z=' + b64u(z);
    }
    return 't=' + b64u(raw);
  }
  async function unpackHash(h) {
    const m = h.match(/^#?(z|t)=([A-Za-z0-9_-]+)/); if (!m) return null;
    const bytes = unb64u(m[2]);
    if (m[1] === 't') return new TextDecoder().decode(bytes);
    return new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).text();
  }
  function packOpts() {
    const p = []; if ($('cls').value) p.push('k=' + $('cls').value); if ($('bw').checked) p.push('bw=1');
    return p.length ? '&' + p.join('&') : '';
  }

  /* ---------- кнопки ---------- */
  let tt = 0;
  function toast(msg) { const t = $('toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('on'), 3200); }
  function setText(t) { src.value = t; store.set(KEY, t); draw(); }

  $('open').onclick = () => $('file').click();
  $('file').onchange = async (e) => { const f = e.target.files[0]; if (!f) return; openText(await f.text(), f.name); e.target.value = ''; };
  $('saveTxt').onclick = () => download(new Blob([src.value + '\n'], { type: 'text/plain;charset=utf-8' }), fileName('txt'));
  $('saveSvg').onclick = async () => { const { svg } = await svgStandalone(); download(new Blob([svg], { type: 'image/svg+xml' }), fileName('svg')); };
  $('savePng').onclick = async () => download(await pngBlob(2), fileName('png'));
  $('copyImg').onclick = async () => {
    try {
      if (!navigator.clipboard || typeof ClipboardItem === 'undefined') throw new Error('нет буфера');
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': pngBlob(2) })]);
      toast(STR.copied);
    } catch (e) { toast(STR.copyFail); }
  };
  $('share').onclick = async () => {
    const url = location.href.split('#')[0] + '#' + (await packText(src.value)) + packOpts();
    history.replaceState(null, '', url);
    try { await navigator.clipboard.writeText(url); toast(url.length > 2000 ? STR.linkLong : STR.link); }
    catch (e) { prompt('Скопируйте ссылку:', url); }
  };
  $('print').onclick = () => window.print();

  /* образцы из графа примеров библиотеки, по предметам */
  const EX = (window.EXAMPLES || []).filter((e) => !/регресс/i.test(e.g));
  const exSel = $('ex'), groups = {};
  EX.forEach((e, i) => {
    if (!groups[e.g]) { groups[e.g] = document.createElement('optgroup'); groups[e.g].label = e.g; exSel.appendChild(groups[e.g]); }
    const o = document.createElement('option'); o.value = i; o.textContent = e.t; groups[e.g].appendChild(o);
  });
  exSel.onchange = () => {
    if (exSel.value === '') return;
    const t = EX[+exSel.value].s.split('\n').filter((l) => !/^#\s*проверяет:/.test(l)).join('\n');
    setText(t); exSel.value = '';
  };

  $('cls').onchange = $('bw').onchange = () => { store.set(KEY_OPT, JSON.stringify({ k: $('cls').value, bw: $('bw').checked })); draw(); };
  let t0 = 0;
  src.addEventListener('input', () => { clearTimeout(t0); t0 = setTimeout(() => { store.set(KEY, src.value); draw(); }, 180); });
  src.addEventListener('keydown', (e) => {   /* Tab — два пробела, как в языке */
    if (e.key === 'Tab' && !e.ctrlKey && !e.altKey) {
      e.preventDefault(); const a = src.selectionStart, b = src.selectionEnd;
      src.setRangeText('  ', a, b, 'end'); src.dispatchEvent(new Event('input'));
    }
  });

  /* ---------- старт: ссылка → сохранённое → образец по умолчанию ---------- */
  (async function start() {
    try { const o = JSON.parse(store.get(KEY_OPT) || '{}'); if (o.k) $('cls').value = o.k; if (o.bw) $('bw').checked = true; } catch (e) {}
    let t = null;
    try {
      t = await unpackHash(location.hash);
      const k = location.hash.match(/[&#]k=(\d+)/); if (k) $('cls').value = k[1];
      if (/[&#]bw=1/.test(location.hash)) $('bw').checked = true;
    } catch (e) { t = null; }
    src.value = t != null ? t : (store.get(KEY) || DEFAULT);
    if (t != null) store.set(KEY, t);
    $('ver').textContent = 'ДРАКОН-ГРАФ ' + DG.version;
    draw();
  })();

  window.Gen = { draw, svgStandalone, pngBlob, packText, unpackHash, setText };
})();
