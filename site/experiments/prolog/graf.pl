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
                  kind/2, kname/2, sample/1, roundtrip/2, know_text/2 ]).

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
line(query(T))            --> "запрос", colon, rest(T).
line(item(T))             --> dash, ws1, rest(T).
line(nitem(N, T))         --> num(N), ( "." ; ")" ), ws1, rest(T).
line(marker(T))           --> star, ws1, rest(T).
line(bar(T))              --> "|", ws1, rest(T).
line(pair(L, R))          --> before(L, "><"), rest(R).
line(memo(P, T))          --> before(P, "->"), rest(T).
line(text(T))             --> rest(T).

optkey(K) --> { member(K, ['схема', 'ширина', 'нумерация', 'класс', 'язык', 'режим']),
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
    gap_before(Sep, G),
    append([Cs, G, SC, [0'\s]], Out), append(Out, S, S0).

% пробел перед разделителем: «a -> b», «a >< b», но «b: текст»
gap_before(":", []) :- !.
gap_before(_, [0'\s]).
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
kname(query, 'запрос:').    kname(root, root).

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
    query("кто предок Анны"),
    opt('класс', "6")
  ]).

% roundtrip(+Терм, -Итог): терм → строка → терм; Итог = ok или differs(Получили).
roundtrip(T, R) :-
    line_term(L, T), classify(L, T2),
    ( T2 =@= T -> R = ok(L) ; R = differs(L, T2) ).

/* ===================== 6. Режим знаний: ГРАФ → Prolog ===================== */
/*  Решения 15.11 (учитель):
      А -> ?                        — переменная: запоминатель с пустым ответом;
      кто, что, кого …              — в запросе переменные сами по себе;
      связь Иван -> Пётр: родитель  — факт родитель(иван, петр);
      правило: А предок В, если А родитель Б и Б предок В;
      пример: / контрпример:        — тесты: выводится / не выводится;
      запрос: кто предок Анны       — ответ запоминателями «кто -> Пётр».
    Упрощения пробы: только отношения двух участников («кто отношение кого»),
    без «или» и «не»; падежи сводятся простым сравнением основ (Анны ~ Анна).
*/
:- dynamic kb_clause/2, kb_entity/2.

% знания: текст конспекта → строки отчёта (Prolog, проверки, ответы)
know_text(Text, Lines) :-
    text_terms(Text, Terms),
    clear_kb,
    var_names(Terms, Vars),
    load_facts(Terms),
    load_rules(Vars, Terms, RuleErrs),
    mode_warning(Terms, Warn),
    prolog_listing(PL),
    run_checks(Vars, Terms, Out),
    append([Warn, ["— Prolog —"], PL, RuleErrs, ["— Проверки и запросы —"], Out], Lines).

% строки: текст → термы строк
text_terms(Text, Terms) :-
    split_string(Text, "\n", "", Ls0), include(meaningful, Ls0, Ls),
    maplist(classify, Ls, Terms).

% очистить: пустая база знаний
clear_kb :- retractall(kb_clause(_, _)), retractall(kb_entity(_, _)).

% режим: напомнить, если нет строки «режим: знания»
mode_warning(Terms, []) :- memberchk(opt('режим', "знания"), Terms), !.
mode_warning(_, ["нет строки «режим: знания» — конспект прочитан как база знаний для пробы"]).

% переменные: указатели запоминателей с пустым ответом
var_names(Terms, Vars) :- findall(N, (member(memo(P, "?"), Terms), norm(P, N)), Vars).

% вопрос: слова, которые в запросе сами — переменные
question_word(W) :- memberchk(W, ["кто", "что", "кого", "чего", "какой", "какая", "какое", "где"]).

% норма: строчные буквы, ё → е, без крайних пробелов
norm(S, N) :-
    string_lower(S, L), split_string(L, "ё", "", Ps),
    atomic_list_concat(Ps, 'е', A), atom_string(A, N0), split_string(N0, "", " ", [N]).

% основа: без одной-двух гласных на конце (Анны, Анна → анн)
stem(S, T) :- drop_vowel(S, S1), drop_vowel(S1, T).
drop_vowel(S, T) :-
    string_length(S, L), L > 3, sub_string(S, _, 1, 0, C),
    sub_string("аяьйоеыиу", _, 1, _, C), !, sub_string(S, 0, _, 1, T).
drop_vowel(S, S).

% участник: имя → атом, запоминаем, как писать в ответе
entity(Name, Atom) :-
    norm(Name, N), atom_string(Atom, N),
    ( kb_entity(Atom, _) -> true ; assertz(kb_entity(Atom, Name)) ).

% найти участника по слову в любом падеже
entity_atom(N, A) :- atom_string(A0, N), kb_entity(A0, _), !, A = A0.
entity_atom(N, A) :- stem(N, SN), kb_entity(A, _), atom_string(A, AS), stem(AS, SN), !.
entity_atom(N, A) :- atom_string(A, N).

% факты: «связь А -> Б: отношение»
load_facts(Terms) :- forall(member(dep(A, B, R), Terms), add_fact(A, B, R)).
add_fact(A, B, R) :-
    entity(A, EA), entity(B, EB), norm(R, RN), atom_string(RA, RN),
    assertz(kb_clause(r(RA, EA, EB), true)).

% правила: «голова, если условие и условие»
load_rules(Vars, Terms, Errs) :-
    findall(E, ( member(rule(T), Terms), \+ add_rule(Vars, T),
                 format(string(E), "не понято правило: ~w", [T]) ), Errs).
add_rule(Vars, T) :-
    clean(T, C), split_if(C, HS, BS),
    phrase_goal(Vars, HS, [], M1, H), body_goals(Vars, BS, M1, _, B),
    assertz(kb_clause(H, B)).

% если: делит правило на голову и условия
split_if(T, H, B) :-
    once(sub_string(T, Bef, _, Aft, ", если ")),
    sub_string(T, 0, Bef, _, H), sub_string(T, _, Aft, 0, B).

body_goals(Vars, S, M0, M, Body) :-
    atomic_list_concat(Parts, ' и ', S),
    parts_goals(Vars, Parts, Gs, M0, M), conj(Gs, Body).

% условия: части «… и …» → цели, переменные общие на всё правило
parts_goals(_, [], [], M, M).
parts_goals(Vars, [P|Ps], [G|Gs], M0, M) :-
    atom_string(P, PS), phrase_goal(Vars, PS, M0, M1, G),
    parts_goals(Vars, Ps, Gs, M1, M).

% связать: список целей → «цель, цель, …»
conj([G], G) :- !.
conj([G|Gs], (G, R)) :- conj(Gs, R).

% фраза: «кто отношение кого» → r(отношение, Кто, Кого)
phrase_goal(Vars, S, M0, M, r(R, X, Y)) :-
    split_string(S, " ", " ", Ws0), exclude(==(""), Ws0, [W1, W2, W3]),
    word_term(Vars, W1, M0, M1, X), norm(W2, RN), atom_string(R, RN),
    word_term(Vars, W3, M1, M, Y).

% слово: переменная или участник
word_term(Vars, W, M0, M, T) :-
    norm(W, N),
    (   ( memberchk(N, Vars) ; question_word(N) )
    ->  ( memberchk(N-T, M0) -> M = M0 ; M = [N-T|M0] )
    ;   entity_atom(N, T), M = M0
    ).

% очистить: без крайних пробелов и знаков .?!
clean(T, C) :- split_string(T, "", " .?!", [C]).

% вывод: поиск по правилам с ограничением глубины
prove(_, 0) :- !, fail.
prove(true, _) :- !.
prove((A, B), D) :- !, prove(A, D), prove(B, D).
prove(G, D) :- D1 is D - 1, kb_clause(G, B), prove(B, D1).

% Prolog: база знаний как обычный текст Prolog
prolog_listing(PL) :-
    findall(S, ( kb_clause(H, B), readable(H, B, C),
                 with_output_to(string(S0), portray_clause(C)),
                 split_string(S0, "", "\n ", [S]) ), PL).
% читаемо: внутренний терм r(…) → обычное предложение Prolog
readable(H, true, RH) :- !, real(H, RH).
readable(H, B, (RH :- RB)) :- real(H, RH), real_body(B, RB).
real(r(R, X, Y), T) :- T =.. [R, X, Y].
real_body((A, B), (RA, RB)) :- !, real(A, RA), real_body(B, RB).
real_body(A, RA) :- real(A, RA).

% проверки: примеры, контрпримеры, запросы
run_checks(Vars, Terms, Out) :-
    findall(Ls, ( member(T, Terms), check_line(Vars, T, Ls) ), Lss), append(Lss, Out).
check_line(Vars, example(plain, T), [L])   :- test_line(Vars, T, true, "пример", L).
check_line(Vars, example(counter, T), [L]) :- test_line(Vars, T, false, "контрпример", L).
check_line(Vars, query(T), Ls)             :- query_lines(Vars, T, Ls).

% тест: пример должен выводиться, контрпример — нет
test_line(Vars, T, Want, Kind, L) :-
    (   clean(T, C), phrase_goal(Vars, C, [], _, G)
    ->  ( once(prove(G, 50)) -> Got = true ; Got = false ),
        ( Got == Want -> Mark = "✓" ; Mark = "✗" ),
        ( Got == true -> Res = "выводится" ; Res = "не выводится" ),
        format(string(L), "~w ~w: ~w — ~w", [Mark, Kind, T, Res])
    ;   format(string(L), "✗ ~w: ~w — не понято", [Kind, T])
    ).

% запрос: все ответы — запоминателями «кто -> Иван»
query_lines(Vars, T, Ls) :-
    (   clean(T, C), phrase_goal(Vars, C, [], Map, G)
    ->  findall(Ps, ( prove(G, 50), maplist(pair_disp, Map, Ps) ), As0),
        list_to_set(As0, As),
        answer_block(T, As, Ls)
    ;   format(string(L), "запрос: ~w — не понято", [T]), Ls = [L]
    ).
% ответ: заголовок запроса и строки-запоминатели
answer_block(T, [], [L]) :- !, format(string(L), "запрос: ~w — ответов нет", [T]).
answer_block(T, As, [H|AL]) :-
    format(string(H), "запрос: ~w", [T]),
    findall(L, ( member(Ps, As), member(N-D, Ps), format(string(L), "    ~w -> ~w", [N, D]) ), AL).
% показать: значение переменной так, как его написал учитель
pair_disp(N-V, N-D) :- ( atom(V), kb_entity(V, D0) -> D = D0 ; term_string(V, D) ).
