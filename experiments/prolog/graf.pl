/*  ДРАКОН-ГРАФ на Prolog — эксперимент 1.
    Одно описание языка работает в две стороны:
      classify(+Строка, -Терм)   — разбор строки конспекта;
      line_term(-Строка, +Терм)  — порождение строки из терма;
      check_text(+Текст, -Ошибки) — разбор целого конспекта и проверка вложенности.
    Источник правил: src/parse/parser.js (classify, ALLOW, validate).
    Диалект: SWI-Prolog 9 (строки "…" — тип string; в теле DCG — список кодов).

    Упрощения эксперимента (в JS они есть, здесь пока нет):
      - нет $…$ и `…` внутри строк (разделители внутри формул и кода);
      - нет «правило -> цели:», «теорема: …» (KINDS), «опр:», английских синонимов;
      - нет формул $$…$$, скобки }, выкладок (=, =>, ≤ …).
*/
:- module(graf, [ classify/2, line_term/2, check_text/2, allow/2,
                  kind/2, kname/2, sample/1, roundtrip/2 ]).

/* ===================== 1. Разбор и порождение строки ===================== */

classify(Line, Term) :-
    string_codes(Line, Cs0),
    trim(Cs0, Cs),
    phrase(line(Term), Cs), !.

line_term(Line, Term) :-
    phrase(line(Term), Cs), !,
    string_codes(Line, Cs).

% Порядок правил важен: первое подошедшее побеждает (как в parser.js).
line(opt(K, V))           --> optkey(K), ws0, ( ":" ; "=" ), sp, rest(V).
line(header(T))           --> "тема", colon, rest(T).
line(link(Parts))         --> "связка", colon, parts(Parts).
line(arrow(double, T))    --> "двойная", ws1, "стрелка", colon, rest(T).
line(arrow(single, T))    --> "стрелка", colon, rest(T).
line(rule(T))             --> "правило", colon, rest(T).
line(example(counter, T)) --> "контрпример", colon, rest(T).
line(example(plain, T))   --> "пример", colon, rest(T).
line(dep(A, B, T))        --> "связь", ws1, before(A, "->"), before(B, ":"), rest(T).
line(callout(K, P, T))    --> callout_kw(K), pos(P), colon, rest(T).
line(image(T))            --> "рисунок", colon, rest(T).
line(code(T))             --> "код", colon, rest(T).
line(item(T))             --> dash, ws1, rest(T).
line(nitem(N, T))         --> num(N), ( "." ; ")" ), ws1, rest(T).
line(marker(T))           --> star, ws1, rest(T).
line(bar(T))              --> "|", ws1, rest(T).
line(pair(L, R))          --> before(L, "><"), rest(R).
line(memo(P, T))          --> before(P, "->"), rest(T).
line(text(T))             --> rest(T).

optkey(K) --> { member(K, ['схема', 'ширина', 'нумерация', 'класс', 'язык']),
                atom_codes(K, Cs) }, lit(Cs).

callout_kw(выноска)   --> "выноска".
callout_kw(уточнение) --> "уточнение".
callout_kw(пояснение) --> "пояснение".

pos(none)   --> [].
pos(снизу)  --> ws1, "снизу".
pos(справа) --> ws1, "справа".

dash --> "-".
dash --> "–".
star --> "*".
star --> "•".

colon --> ws0, ":", sp.
sp    --> " ", ws0.            % при порождении — один пробел после двоеточия
sp    --> [].
ws0   --> [].
ws0   --> " ", ws0.
ws1   --> " ", ws0.

lit([])     --> [].
lit([C|Cs]) --> [C], lit(Cs).

/* --- двусторонние «листья»: при разборе читают, при порождении пишут --- */

% rest(T): остаток строки без крайних пробелов.
rest(T, S0, S) :- nonvar(T), !,
    string_codes(T, Cs), append(Cs, S, S0).
rest(T, S0, []) :-
    trim(S0, Cs), string_codes(T, Cs).

% before(T, Sep): текст до первого разделителя Sep (сам Sep съедается).
before(T, Sep, S0, S) :- nonvar(T), !,
    string_codes(T, Cs), string_codes(Sep, SC),
    append(Cs, [0'\s|T1], S0), append(SC, [0'\s|S], T1).
before(T, Sep, S0, S) :-
    string_codes(Sep, SC),
    append(L, Rest, S0), append(SC, S, Rest), !,
    trim(L, Lt), string_codes(T, Lt).

% parts(Ps): «a | b | c» ↔ ["a","b","c"].
parts(Ps, S0, S) :- is_list(Ps), !,
    atomic_list_concat(Ps, ' | ', A), atom_codes(A, Cs), append(Cs, S, S0).
parts(Ps, S0, []) :-
    split_string(S0, "|", " ", Ps).

% num(N): номер пункта «1.», «12)».
num(N, S0, S) :- integer(N), !,
    number_codes(N, Cs), append(Cs, S, S0).
num(N, S0, S) :-
    digits(Ds, S0, S), Ds \== [], number_codes(N, Ds).
digits([D|T]) --> [D], { D >= 0'0, D =< 0'9 }, digits(T).
digits([])    --> [].

trim(Cs0, Cs) :-
    string_codes(S0, Cs0), split_string(S0, "", " \t", [S]), string_codes(S, Cs).

/* ===================== 2. Вид узла (как kind в JS) ===================== */

kind(T, K) :- functor(T, F, _), kind_(F, K).
kind_(nitem, item) :- !.
kind_(F, F).

kname(header, 'тема:').      kname(link, 'связка:').     kname(memo, 'запоминатель').
kname(pair, 'сравнение ><').  kname(item, 'пункт').       kname(group, 'группа').
kname(rule, 'правило:').      kname(example, 'пример:').  kname(arrow, 'стрелка:').
kname(image, 'рисунок:').     kname(code, 'код').         kname(callout, 'выноска:').
kname(marker, 'маркер *').    kname(bar, 'черта |').      kname(brace, 'скобка }').
kname(formula, 'формула $$'). kname(dep, 'связь').        kname(text, 'текст').
kname(root, root).

/* ===================== 3. Что может стоять внутри чего ===================== */
% Таблица ALLOW из parser.js, записанная фактами: allow(Родитель, Ребёнок).

inner([marker, bar, brace, formula, code, image, text, blank]).
hang([callout, example, rule]).

allowed(root,    [header, link, memo, pair, item, group, rule, example, arrow,
                  image, code, callout, marker, text, dep, formula, blank]).
allowed(header,  [callout, rule, blank]).
allowed(memo,    L) :- inner(I), hang(H), append([I, H, [item]], L).
allowed(item,    L) :- inner(I), hang(H), append([I, H, [item, group]], L).
allowed(group,   [item, group, text, marker, callout, example, blank]).
allowed(pair,    [marker, blank]).
allowed(example, [dep, text, code, formula, blank, marker]).
allowed(rule,    L) :- inner(L).
allowed(callout, [marker, text, formula, code, blank, bar]).
allowed(marker,  [marker, text]).
allowed(text,    L) :- inner(I), hang(H), append([I, H, [item, group]], L).
allowed(K, [])   :- memberchk(K, [link, arrow, image, code, dep, bar, brace, formula]).

allow(P, C) :- allowed(P, L), memberchk(C, L).

/* ===================== 4. Целый конспект: дерево и проверка ===================== */

check_text(Text, Errors) :-
    split_string(Text, "\n", "", Lines0),
    include(meaningful, Lines0, Lines),
    maplist(indent_term, Lines, Pairs),
    exclude(is_opt, Pairs, Nodes),
    kids(-1, Nodes, Forest, []),
    maplist(fix(root), Forest, Fixed),
    phrase(validate(root, Fixed), Errors).

meaningful(L) :- split_string(L, "", " \t", [T]), T \== "",
                 \+ sub_string(T, 0, 1, _, "#").
indent_term(L, I-T) :-
    string_codes(L, Cs), leading_spaces(Cs, I), classify(L, T).
leading_spaces([0'\s|Cs], N) :- !, leading_spaces(Cs, N0), N is N0 + 1.
leading_spaces(_, 0).
is_opt(_-opt(_, _)).

% kids(+ОтступРодителя, +Строки, -Дети, -Остаток)
kids(P, [I-T|R0], [n(T, K)|Ks], R) :- I > P, !,
    kids(I, R0, K, R1), kids(P, R1, Ks, R).
kids(_, R, [], R).

% fix: «текст» с вложенными пунктами — группа; «текст» в корне — пункт (как fix() в JS).
fix(Parent, n(T, K0), n(T, K, Kind)) :-
    maplist(fix(T), K0, K),
    kind(T, Kind0),
    (   memberchk(Kind0, [text, item]),
        member(n(_, _, CK), K), memberchk(CK, [item, group, text])
    ->  Kind = group
    ;   Kind0 == text, Parent == root
    ->  Kind = item
    ;   Kind = Kind0
    ).

validate(_, []) --> [].
validate(P, [n(_, Kids, K)|Ns]) -->
    (   { allow(P, K) } -> []
    ;   { kname(K, KN), kname(P, PN),
          format(string(E), "«~w» не может стоять внутри «~w» — проверьте отступ.", [KN, PN]) },
        [E]
    ),
    validate(K, Kids),
    validate(P, Ns).

/* ===================== 5. Порождение и самопроверка ===================== */

sample(T) :- member(T, [
    header("Дроби"),
    link(["Что", "Где", "Когда"]),
    arrow(single, "потому что"),
    arrow(double, "равносильно"),
    rule("Знаменатель не равен нулю."),
    example(plain, "1/2 + 1/3 = 5/6"),
    example(counter, "1/0"),
    dep("числитель", "дробь", "делится на знаменатель"),
    callout(выноска, none, "Это важно"),
    callout(уточнение, снизу, "Только для целых"),
    image("дробь.png"),
    code("print(1/2)"),
    item("первый пункт"),
    nitem(2, "второй пункт"),
    marker("примета"),
    bar("черта"),
    pair("числитель", "знаменатель"),
    memo("Что такое дробь", "Это часть целого."),
    text("Просто текст"),
    opt('класс', "6")
  ]).

% roundtrip(+Терм, -Итог): терм → строка → терм; Итог = ok или differs(Получили).
roundtrip(T, R) :-
    line_term(L, T), classify(L, T2),
    ( T2 =@= T -> R = ok(L) ; R = differs(L, T2) ).
