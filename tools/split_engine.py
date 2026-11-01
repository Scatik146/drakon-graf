"""Этап 1 (выполнен 01.11.2026): механическое разделение прототипа (docs/history/prototypes/v8_engine.js) на модули src/*.js.
Строки переносятся без изменений, кроме: общие изменяемые переменные → поля объекта состояния S
(создаётся заново при каждом вызове render), холст для измерения текста создаётся лениво."""
import re,os,sys
SRC='docs/history/prototypes/v8_engine.js'; OUT='src'
L=open(SRC,encoding='utf8').read().split('\n')
# (модуль, первая строка, последняя строка) — номера строк engine.js, включительно
MAP=[('text/measure',12,13),('text/math',14,39),('text/wrap',40,91),('svg/primitives',92,112),
 ('parse/lexer',114,152),('parse/parser',153,264),('layout/razbor',265,385),('layout/elements',386,497),
 ('schemes',498,521),('layout/gnom',522,540),('layout/spine',541,570),('layout/ruler',571,603),
 ('layout/epaulets',604,623),('layout/faceoff',624,667),('layout/tree',668,699),('layout/rank',700,727),
 ('layout/scene',728,761),('lint',762,799),('render',800,len(L))]
STATE=['FS','LH','WARN','HYPH','NUMNEAR','STRICT','LSTYLE','NUM','C']
DROP={10,11,54,271,272,273,523,9,7,8}   # объявления, переехавшие в state.js
NOREPL={57}                               # строка с «°C» — не трогать
def repl(n,s):
    if n in NOREPL: return s
    s=re.sub(r'(?<![\w.$\'"])\b('+'|'.join(STATE)+r')\b(?!\s*:)',r'S.\1',s)
    return re.sub(r'\.\.\.('+'|'.join(STATE)+r')\b',r'...S.\1',s)
mods={}
for name,a,b in MAP:
    body=[]
    for n in range(a,b+1):
        if n in DROP: continue
        s=L[n-1]
        if n==12: s="let cx2d=null; // холст для измерения текста создаётся при первом вызове (в Node — подменяется, этап 2)"
        if n==13: s=s.replace("{cx2d.font","{if(!cx2d)cx2d=document.createElement('canvas').getContext('2d');cx2d.font")
        s=repl(n,s)
        if s.lstrip().startswith('S.WARN=[];S.NUM=1;'): s=s.replace('S.WARN=[];S.NUM=1;','Object.assign(S,freshState()); /* новое состояние на каждый вызов */ S.WARN=[];S.NUM=1;',1)
        body.append(s)
    mods[name]=body
# ---------- импорты по настоящему разбору областей видимости (acorn + eslint-scope) ----------
import json,subprocess,shutil
tmp='/tmp/body';shutil.rmtree(tmp,ignore_errors=True);os.makedirs(tmp)
files={}
for name,body in mods.items():
    q=tmp+'/'+name.replace('/','__')+'.js';open(q,'w',encoding='utf8').write('\n'.join(body));files[q]=name
an=json.loads(subprocess.check_output(['node','tools/free_vars.cjs',*files]))
decl={w:'state' for w in ['S','PAL','MONO','SANS','freshState']}
for q,name in files.items():
    for w in an[q]['own']: decl[w]=name
shutil.rmtree(OUT,ignore_errors=True);os.makedirs(OUT)
def rel(frm,to):
    r=os.path.relpath(to,os.path.dirname(frm) or '.')
    return (r if r.startswith('.') else './'+r)+'.js'
for q,name in files.items():
    deps={}
    for w in an[q]['free']:
        if w in decl: deps.setdefault(decl[w],[]).append(w)
    imp=[f"import {{ {', '.join(sorted(ws))} }} from '{rel(name,m)}';" for m,ws in sorted(deps.items())]
    own=an[q]['own']
    path=f'{OUT}/{name}.js';os.makedirs(os.path.dirname(path),exist_ok=True)
    open(path,'w',encoding='utf8').write('// ДРАКОН-ГРАФ — модуль перенесён из прототипа graf/engine.js (этап 1, без изменения поведения)\n'+'\n'.join(imp)+'\n\n'+'\n'.join(mods[name]).strip('\n')+f"\n\nexport {{ {', '.join(sorted(own))} }};\n")
open(f'{OUT}/state.js','w',encoding='utf8').write("""// ДРАКОН-ГРАФ — состояние одного вызова render().
// В прототипе это были общие переменные. Теперь render() в начале каждого вызова заполняет S заново (freshState),
// а все модули читают и меняют только поля S. render синхронный, поэтому вызовы не мешают друг другу.
export const PAL={color:{line:'#993300',fill:'#FFFF99',orange:'#FFCC66',mark:'#CC6600',tie:'#FF9933',ex:'#FFFFFF',exb:'#333333',code:'#F6F3EA',codeb:'#C9BFA6',sep:'#D8C8A8'},
  bw:{line:'#222222',fill:'#E6E6E6',orange:'#C8C8C8',mark:'#444444',tie:'#666666',ex:'#FFFFFF',exb:'#000000',code:'#F2F2F2',codeb:'#999999',sep:'#BBBBBB'}};
export const MONO='"PT Mono", monospace', SANS='"PT Sans", sans-serif'; /* шрифты ПараТайп (OFL), см. fonts/ */
export function freshState(){return{
  FS:14, LH:17,        // кегль и интерлиньяж (Р25; render меняет по классу)
  WARN:[],             // подсказки, собранные при раскладке
  HYPH:true,           // переносы по слогам разрешены (в заголовках, указателях и шапках — нет)
  NUMNEAR:false,       // номер ГНОМа вплотную к блоку (Р9)
  STRICT:false,        // вариант Б: одна ширина в колонке, отбивки внутри фигуры (Р5, Р7)
  LSTYLE:'auto',       // стиль подписей разбора
  NUM:1,               // счётчик номеров ГНОМа
  C:{...PAL.color}};}  // палитра текущей темы
export const S=freshState();
""")
open(f'{OUT}/index.js','w',encoding='utf8').write("""// ДРАКОН-ГРАФ: текст конспекта → SVG. Точка входа библиотеки.
export { render } from './render.js';
export const version='0.9.0-dev';
""")
print('модулей:',len(files)+2)
