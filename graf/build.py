import pathlib
d=pathlib.Path(__file__).parent
s=(d/'shell.html').read_text(encoding='utf-8').replace('Конспект · ГРАФ v5','Конспект · ГРАФ v8').replace('Конспект ГРАФ v5','Конспект ГРАФ v8')
files=['examples.js','examples_hs.js','examples_v4.js','examples_v5a.js','examples_v5b.js']
s=s.replace('/*ENGINE*/',(d.parent/'dist'/'drakon-graf.js').read_text(encoding='utf-8')).replace('/*EXAMPLES*/','\n'.join((d/f).read_text(encoding='utf-8') for f in files))
(d/'konspekt_v8.html').write_text(s,encoding='utf-8')
