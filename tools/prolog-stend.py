#!/usr/bin/env python3
# Стенд Prolog без рук: поднимает сервер, открывает стенд в Chrome без окна,
# нажимает кнопки 1–4 и печатает итоги. Нужны google-chrome и Python playwright.
#
#   python3 tools/prolog-stend.py                       стенд из site/experiments/prolog
#   python3 tools/prolog-stend.py папка-со-стендом      копия стенда (проверка чужой правки graf.pl)
#   python3 tools/prolog-stend.py папка --znaniya файл  ещё и текст конспекта в режиме знаний
#
# Ожидаем: «Совпало N из N», «N из N вернулись тем же термом», «Ошибки вложенности совпали».
import subprocess
import sys
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

PORT = 8765
KNOPKI = ['btnKinds', 'btnRound', 'btnCheck']   # кнопки 1–3: итог пишется в строку состояния
CHROME = '/usr/bin/google-chrome'


# сервер: раздаёт папку стенда по http (с file:// стенд не работает)
def server(papka):
    proc = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '--directory', papka],
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(1)
    return proc


# открыть: страница стенда с поднятым SWI-Prolog
def otkryt(brauzer, oshibki):
    stranica = brauzer.new_page()
    stranica.on('pageerror', lambda e: oshibki.append(str(e)))
    stranica.goto(f'http://localhost:{PORT}/index.html')
    stranica.wait_for_function("!document.getElementById('status').textContent.includes('Загружаю')", timeout=90000)
    return stranica


# нажать: нажимает кнопку и возвращает строку состояния
def nazhat(stranica, knopka):
    stranica.click('#' + knopka)
    time.sleep(1.5)
    return stranica.inner_text('#status')


# знания: кладёт текст в поле (пусто — пример «Родословная») и возвращает отчёт кнопки 4
def znaniya(stranica, tekst):
    if tekst:
        stranica.fill('#src', tekst)
    else:
        stranica.click('#btnRodo')
    stranica.click('#btnKnow')
    time.sleep(1.5)
    return stranica.inner_text('#out')


# прогнать: все кнопки стенда по порядку, печатает итоги
def prognat(stranica, tekst):
    print('запуск:', stranica.inner_text('#status'))
    for knopka in KNOPKI:
        print(knopka + ':', nazhat(stranica, knopka))
    print('— знания —')
    print(znaniya(stranica, tekst))


# стенд: верхнее слово — сервер, браузер, прогон, уборка
def stend(papka, tekst):
    oshibki = []
    proc = server(papka)
    try:
        with sync_playwright() as p:
            brauzer = p.chromium.launch(executable_path=CHROME, args=['--no-sandbox'])
            prognat(otkryt(brauzer, oshibki), tekst)
            brauzer.close()
    finally:
        proc.kill()
    print('ошибки страницы:', oshibki or 'нет')


if __name__ == '__main__':
    a = sys.argv[1:]
    papka = a[0] if a and not a[0].startswith('-') else str(Path(__file__).resolve().parent.parent / 'site/experiments/prolog')
    tekst = Path(a[a.index('--znaniya') + 1]).read_text(encoding='utf-8') if '--znaniya' in a else ''
    stend(papka, tekst)
