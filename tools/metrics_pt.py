"""Таблицы метрик PT Serif / PT Mono для движка ДРАКОН-ГРАФ (этап 2).
Ширина знака и кернинг (GPOS kern, как у HarfBuzz) — из файлов шрифтов graf/fonts.
Выход: JSON на stdout (собирает tools/build_metrics.mjs)."""
import json,sys
from fontTools.ttLib import TTFont
F={'r':'graf/fonts/PT_Serif-Web-Regular.ttf','b':'graf/fonts/PT_Serif-Web-Bold.ttf','m':'graf/fonts/PTM55FT.ttf'}
# знаки, для которых строится таблица кернинга: латиница, кириллица, цифры, пунктуация.
# Обычный пробел исключён: Chromium набирает текст по словам, и кернинг через пробел не действует.
KSET=[chr(c) for c in range(0x21,0x7f)]+[chr(c) for c in range(0xa0,0x100)]+[chr(c) for c in range(0x410,0x450)]+['Ё','ё']+list('–—‘’‚“”„…«»№‹›−×÷±·°')
def pairpos(font):
    """(g1,g2) -> XAdvance первого знака, первый подходящий подтаблицы по порядку (как HarfBuzz)."""
    g=font['GPOS'].table;subs=[]
    for fr in g.FeatureList.FeatureRecord:
        if fr.FeatureTag!='kern':continue
        for li in fr.Feature.LookupListIndex:
            for st in g.LookupList.Lookup[li].SubTable:
                st=getattr(st,'ExtSubTable',st)
                if st not in subs:subs.append(st)
    def val(v):return getattr(v,'XAdvance',0) or 0 if v is not None else 0
    def get(a,b):
        for st in subs:
            cov=st.Coverage.glyphs
            if a not in cov:continue
            if st.Format==1:
                ps=st.PairSet[cov.index(a)]
                for r in ps.PairValueRecord:
                    if r.SecondGlyph==b:return val(r.Value1)
                continue   # пары нет — к следующей подтаблице
            c1=st.ClassDef1.classDefs.get(a,0);c2=st.ClassDef2.classDefs.get(b,0)
            return val(st.Class1Record[c1].Class2Record[c2].Value1)
        return 0
    return get
out={}
for k,f in F.items():
    t=TTFont(f);cm=t.getBestCmap();hm=t['hmtx'];upm=t['head'].unitsPerEm
    adv={chr(c):hm[g][0] for c,g in cm.items() if c>=0x20}
    d={'upm':upm,'adv':adv}
    if k!='m':
        get=pairpos(t);kern={}
        ks=[c for c in KSET if ord(c) in cm]
        for a in ks:
            row={}
            for b in ks:
                v=get(cm[ord(a)],cm[ord(b)])
                if v:row.setdefault(str(v),[]).append(b)
            if row:kern[a]={v:''.join(cs) for v,cs in row.items()}
        d['kern']=kern
        # лигатуры fi, fl (liga): ширина = ширина знака лигатуры
        lig={}
        for s,name in (('fi','fi'),('fl','fl')):
            if name in hm.metrics:lig[s]=hm[name][0]
        d['liga']=lig
    out[k]=d
# знаки запасных шрифтов эталона: только их ширины и попадают в таблицу
import glob
def cmapset(paths):
    st=set()
    for f in paths:
        for f2 in glob.glob(f):st|=set(TTFont(f2).getBestCmap())
    return ''.join(chr(c) for c in sorted(st) if c>=0x20)
out['fbset']={'sans':cmapset(['graf/fonts/Asana-Math.otf','/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf']),
              'mono':cmapset(['/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'])}
json.dump(out,sys.stdout,ensure_ascii=False)
