#!/bin/bash
UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'
echo "=== Архив Интернета (ближайшая копия) ==="
for u in https://www.nhlbi.nih.gov/files/docs/ghchs_readability_toolkit.pdf \
  https://barnaul126.gosuslugi.ru/netcat_files/30/69/RP_veoyatnost_7_kl_e.pdf \
  https://gimnaziya1xantymansijsk-r86.gosweb.gosuslugi.ru/netcat_files/199/2900/informatika_SOO_Polyakov_uglublennyy_uroven_11B_klass_ep.pdf \
  http://ito.su/2000/II/4/4104.html http://www.ito.su/2000/II/4/4104.html \
  https://dmkpress.com/catalog/computer/programming/algorithms/978-5-94074-800-7/ \
  http://iph.ras.ru/elib/0111.html https://science-education.ru/article/view?id=19682 \
  https://drakon.su/_media/parondzhanov_.pdf https://drakon.su/_media/01._parondzhanov_uchis_pisat_chitat_i_ponimat_algoritmy.pdf; do
  a=$(curl -sS --max-time 60 "https://archive.org/wayback/available?url=$u" | python3 -c 'import sys,json;s=json.load(sys.stdin)["archived_snapshots"].get("closest");print((s["status"]+" "+s["url"]) if s else "нет копии")' 2>&1 | tail -1)
  echo "$u => $a"; done
echo "=== ДМК без косой черты и поиск по ISBN ==="
for u in https://dmkpress.com/catalog/computer/programming/algorithms/978-5-94074-800-7 "https://dmkpress.com/search/?q=978-5-94074-800-7"; do
  echo "$(curl -sSL -A "$UA" --max-time 40 -o /dev/null -w '%{http_code} %{url_effective}' "$u") <= $u"; done
echo "=== Авторы статьи s10339-020-01002-5 ==="
curl -sSL -H 'Accept: application/vnd.citationstyles.csl+json' https://doi.org/10.1007/s10339-020-01002-5 | python3 -c 'import sys,json;j=json.load(sys.stdin);print(", ".join(a.get("family","")+" "+a.get("given","") for a in j["author"]),"|",j["title"],"|",j["container-title"],j.get("volume"),j.get("issue"),j.get("page"),"|",j["issued"]["date-parts"][0])'
