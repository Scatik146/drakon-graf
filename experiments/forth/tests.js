/* 20 тестов эксперимента 1: Forth (WAForth) на материале ДРАКОН-ГРАФ.
   Один файл для Node и для браузера. Каждый тест — в чистом экземпляре Forth.
   code — строки Forth, по одной за раз; expect — вывод без служебных «ok». */
(function (root) {
  'use strict';

  // общие слова «библиотеки» для тестов (маленькие слова, данные отдельно)
  var ПРЕДУПРЕЖДЕНИЕ = [
    ': ИМЕЕТСЯ? BL WORD FIND NIP ;',                       // есть ли следующее слово в словаре
    ': ВНИМАНИЕ ИМЕЕТСЯ? IF ." переопределено" THEN ;'     // предупредить, если есть
  ];
  var ПОИСК = [
    'VARIABLE УРОК VARIABLE КУРС VARIABLE ОБЩИЙ',          // три уровня; 0 — слова нет
    ': НАЙТИ УРОК @ ?DUP IF EXIT THEN КУРС @ ?DUP IF EXIT THEN ОБЩИЙ @ ;'
  ];
  var ШАМПУР = [
    'CREATE ШАМПУР 10 , 20 , 30 ,',                        // шаги главного маршрута — данные
    ': ШАГ CELLS ШАМПУР + @ ;'
  ];

  var TESTS = [
    // --- стек ---
    { group: 'стек', name: 'OVER копирует второй элемент', code: ['1 2 OVER .S'], expect: '1 2 1' },
    { group: 'стек', name: 'ROT вращает три элемента', code: ['1 2 3 ROT .S'], expect: '2 3 1' },
    { group: 'стек', name: 'DEPTH считает глубину', code: ['5 6 7 DEPTH . DROP DROP DROP DEPTH .'], expect: '3 0' },
    { group: 'стек', name: 'после ошибки стек пуст', code: ['1 2 3 ШАМПУР9', 'DEPTH .'], expect: 'undefined word: ШАМПУР9\n0' },

    // --- словарь ---
    { group: 'словарь', name: 'слово определяется и вызывается', code: [': КВАДРАТ DUP * ;', '7 КВАДРАТ .'], expect: '49' },
    { group: 'словарь', name: 'константы с русскими именами', code: ['1 CONSTANT ТЕМА 2 CONSTANT СВЯЗЬ', 'СВЯЗЬ ТЕМА + .'], expect: '3' },
    { group: 'словарь', name: 'слово из слов', code: [': А 2 ; : Б А А + ;', 'Б .'], expect: '4' },
    { group: 'словарь', name: 'неизвестное слово — ошибка с именем', code: ['ВЫНОСКА'], expect: 'undefined word: ВЫНОСКА' },

    // --- MARKER / откат ---
    { group: 'откат', name: 'MARKER убирает слова, определённые после метки',
      code: ['MARKER ТОЧКА', ': ВРЕМЕННОЕ 5 ;', 'ВРЕМЕННОЕ .', 'ТОЧКА', 'ВРЕМЕННОЕ'],
      expect: '5\nundefined word: ВРЕМЕННОЕ' },
    { group: 'откат', name: 'MARKER не трогает слова до метки',
      code: [': СТАРОЕ 1 ;', 'MARKER М', ': НОВОЕ 2 ;', 'М', 'СТАРОЕ .'], expect: '1' },
    { group: 'откат', name: 'MARKER убирает и переменные', code: ['MARKER М', 'VARIABLE Х', 'М', 'Х'], expect: 'undefined word: Х' },

    // --- переопределение ---
    { group: 'переопределение', name: 'WAForth молча принимает второе определение',
      code: [': А 1 ;', ': А 2 ;', 'А .'], expect: '2' },
    { group: 'переопределение', name: 'старый вызов хранит прежнее определение',
      code: [': А 1 ; : Б А ;', ': А 2 ;', 'Б .'], expect: '1' },
    { group: 'переопределение', name: 'ВНИМАНИЕ предупреждает об имеющемся слове',
      code: ПРЕДУПРЕЖДЕНИЕ.concat([': ТЕМА 1 ;', 'ВНИМАНИЕ ТЕМА']), expect: 'переопределено' },
    { group: 'переопределение', name: 'ВНИМАНИЕ молчит про новое слово',
      code: ПРЕДУПРЕЖДЕНИЕ.concat(['ВНИМАНИЕ СВЯЗЬ']), expect: '' },

    // --- порядок поиска ---
    { group: 'порядок поиска', name: 'урок → курс → общий (три уровня как данные)',
      code: ПОИСК.concat(['3 ОБЩИЙ ! НАЙТИ .', '2 КУРС ! НАЙТИ .', '1 УРОК ! НАЙТИ .']), expect: '3\n2\n1' },
    /* проходит именно потому, что слова нет; если порядок словарей понадобится по-настоящему — минус WAForth */
    { group: 'порядок поиска', name: 'настоящих словарей (WORDLIST) в WAForth нет',
      code: ['WORDLIST'], expect: 'undefined word: WORDLIST' },

    // --- слова библиотеки как данные ---
    { group: 'библиотека', name: 'шампур: шаги главного маршрута',
      code: ШАМПУР.concat(['0 ШАГ . 1 ШАГ . 2 ШАГ .']), expect: '10 20 30' },
    { group: 'библиотека', name: 'развилка: «Да» вниз, «Нет» вправо',
      code: [': РАЗВИЛКА ROT IF DROP ELSE NIP THEN ;', '-1 100 200 РАЗВИЛКА . 0 100 200 РАЗВИЛКА .'], expect: '100 200' },
    { group: 'библиотека', name: 'цикл ПОКА: сумма 4+3+2+1',
      code: [': СУММА 0 SWAP BEGIN DUP WHILE DUP ROT + SWAP 1- REPEAT DROP ;', '4 СУММА .'], expect: '10' }
  ];

  // убрать служебные «ok» интерпретатора и лишние пробелы
  function clean(text) { return text.replace(/ ?ok\n/g, '\n').replace(/\n+$/, '').replace(/^\n+/, '').replace(/ +$/gm, '').replace(/\n\n+/g, '\n'); }

  // выполнить один тест в чистом экземпляре Forth
  async function runOne(WAForth, test) {
    var f = new WAForth(), bytes = [];
    f.onEmit = function (c) { bytes.push(c); };
    await f.load();
    test.code.forEach(function (line) { f.interpret(line); });
    var out = clean(new TextDecoder('utf-8').decode(new Uint8Array(bytes)));
    return { out: out, pass: out === test.expect };
  }

  // выполнить все тесты; вернуть список результатов
  async function runAll(WAForth, tests) {
    var res = [];
    for (var i = 0; i < (tests || TESTS).length; i++) {
      var t = (tests || TESTS)[i], t0 = performance.now(), r = await runOne(WAForth, t);
      res.push({ n: i + 1, group: t.group, name: t.name, expect: t.expect, out: r.out, pass: r.pass, ms: performance.now() - t0 });
    }
    return res;
  }

  var api = { TESTS: TESTS, runAll: runAll, runOne: runOne };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.FORTH_TESTS = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
