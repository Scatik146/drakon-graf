const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('requestfailed', r => errs.push('не загрузилось: ' + r.url()));
  await p.goto('file://' + process.cwd() + '/page.html'); const n = await p.evaluate(() => window.__done);
  await p.evaluate(() => document.fonts.ready);
  const r = await p.evaluate(() => ({ figs: document.querySelectorAll('figure.drakon-graf > svg').length, math: document.querySelectorAll('figure.drakon-graf > svg svg').length,
    font: [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family + ' ' + f.weight).join(', ') }));
  await p.screenshot({ path: 'page.png', fullPage: true }); await b.close();
  console.log('конспектов:', n, '| SVG:', r.figs, '| формул MathJax:', r.math, '| шрифты загружены:', r.font, '| ошибки:', errs.length ? errs.join('; ') : 'нет');
  process.exitCode = (n === 2 && r.figs === 2 && r.math >= 2 && !errs.length) ? 0 : 1; })();
