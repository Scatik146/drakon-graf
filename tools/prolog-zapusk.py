#!/usr/bin/env python3
# Запуск чистого Prolog без рук: SWI-Prolog стенда (swipl-wasm в Chrome без окна) читает .pl
# и отвечает на запросы. Нужны google-chrome и Python playwright. Слова сервера и страницы — из prolog-stend.py.
#
#   python3 tools/prolog-zapusk.py программа.pl --zapros "предок(X, анна)" --zapros "родитель(анна, иван)"
#   python3 tools/prolog-zapusk.py программа.pl --zaprosy запросы.txt      (по запросу в строке, «#» — пояснение)
#   добавить --json — вывод для скриптов: {"zamechaniya": [...], "otvety": [{"zapros", "status", "otvety": [...]}]}
#
# status: "ok" — запрос выполнен (otvety: строки «X = а, Y = б» или «true»; пусто — ответов нет),
#         "zacikleno" — запрос не закончился за 5 млн шагов, "oshibka" — Prolog сообщил об ошибке (текст в otvety).
import importlib.util
import json
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

KOREN = Path(__file__).resolve().parent.parent
LIMIT = 5000000

# слова стенда: сервер, порт, путь к Chrome
spec = importlib.util.spec_from_file_location('stend', Path(__file__).resolve().parent / 'prolog-stend.py')
stend = importlib.util.module_from_spec(spec)
spec.loader.exec_module(stend)

# Знания. Помощник на Prolog: ловит замечания загрузки и отвечает на запрос списком строк.
POMOSHNIK = r'''
:- dynamic user:zamechanie/1.
user:message_hook(T, K, _) :- memberchk(K, [error, warning]), term_string(T, S), assertz(user:zamechanie(S)).
vstroka(Vs, S) :- \+ (member(_=V, Vs), nonvar(V)), !, S = "true".
vstroka(Vs, S) :- findall(X, (member(N=V, Vs), nonvar(V), format(string(X), "~w = ~q", [N, V])), Xs), atomic_list_concat(Xs, ", ", S).
zapusk_zapros(Tekst, Status, Otvet) :-
    catch(( term_string(G, Tekst, [variable_names(Vs)]),
            call_with_inference_limit(findall(Vs, G, L), %d, R),
            ( R == inference_limit_exceeded -> Status = zacikleno, Otvet = ""
            ; findall(S, (member(V, L), vstroka(V, S)), Ss), atomic_list_concat(Ss, "\n", Otvet), Status = ok ) ),
          E, ( Status = oshibka, term_string(E, Otvet) )).
'''


# otkryt: страница запуска с поднятым Prolog (сервер раздаёт корень репозитория)
def otkryt(brauzer, oshibki):
    stranica = brauzer.new_page()
    stranica.on('pageerror', lambda e: oshibki.append(str(e)))
    stranica.goto(f'http://localhost:{stend.PORT}/tools/prolog-zapusk.html')
    stranica.wait_for_function("document.getElementById('status').textContent.includes('готов')", timeout=90000)
    return stranica


# zagruzit: кладёт помощника и программу в файловую систему Prolog и читает их; возвращает замечания загрузки
def zagruzit(stranica, programma):
    stranica.evaluate('([a, b]) => { swipl.FS.writeFile("/pomoshnik.pl", a); swipl.FS.writeFile("/prog.pl", b); }', [POMOSHNIK % LIMIT, programma])
    stranica.evaluate('() => { ask("consult(\'/pomoshnik.pl\')"); ask("consult(\'/prog.pl\')"); }')
    return stranica.evaluate('() => { const a = ask("findall(S, user:zamechanie(S), L), atomic_list_concat(L, \'\\\\n\', T)"); return a ? str(a.T) : ""; }')


# otvetit: один запрос к программе — {zapros, status, otvety}
def otvetit(stranica, zapros):
    a = stranica.evaluate('(q) => { const r = ask("zapusk_zapros(T, S, O)", { T: q }); return r ? { s: str(r.S), o: str(r.O) } : null; }', zapros)
    return {'zapros': zapros, 'status': a['s'] if a else 'oshibka', 'otvety': a['o'].split('\n') if a and a['o'] else []}


# zaprosy: запросы из аргументов --zapros и файла --zaprosy
def zaprosy(argumenty):
    spisok = [argumenty[i + 1] for i, a in enumerate(argumenty) if a == '--zapros']
    if '--zaprosy' in argumenty:
        tekst = Path(argumenty[argumenty.index('--zaprosy') + 1]).read_text(encoding='utf-8')
        spisok += [s.strip().rstrip('.') for s in tekst.splitlines() if s.strip() and not s.strip().startswith('#')]
    return spisok


# prognat: программа и запросы — итог словарём
def prognat(programma, spisok):
    oshibki = []
    proc = stend.server(str(KOREN))
    try:
        with sync_playwright() as p:
            brauzer = p.chromium.launch(executable_path=stend.CHROME, args=['--no-sandbox'])
            stranica = otkryt(brauzer, oshibki)
            zam = zagruzit(stranica, programma)
            itog = {'zamechaniya': [z for z in zam.split('\n') if z], 'otvety': [otvetit(stranica, z) for z in spisok]}
            brauzer.close()
    finally:
        proc.kill()
    return itog


# pokazat: итог для человека
def pokazat(itog):
    print('замечания загрузки:', '; '.join(itog['zamechaniya']) or 'нет')
    for o in itog['otvety']:
        print('?', o['zapros'], '—', o['status'])
        for s in o['otvety']:
            print('   ', s)


if __name__ == '__main__':
    a = sys.argv[1:]
    itog = prognat(Path(a[0]).read_text(encoding='utf-8'), zaprosy(a))
    print(json.dumps(itog, ensure_ascii=False)) if '--json' in a else pokazat(itog)
