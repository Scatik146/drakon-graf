#!/bin/bash
# Проверка ссылок: код ответа, конечный адрес, и (если задано) слово на странице; DOI — название из метаданных doi.org
UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'
check(){ u="$1"; want="$2"; f=$(mktemp)
  r=$(curl -sSL -A "$UA" -H 'Accept-Language: ru,en' --max-time 40 -o "$f" -w '%{http_code} %{url_effective}' "$u" 2>&1 | tail -1)
  code=${r%% *}; m=""
  if [ -n "$want" ]; then if iconv -f cp1251 -t utf-8 "$f" 2>/dev/null | grep -qi -- "$want" || grep -qi -- "$want" "$f"; then m="слово+"; else m="СЛОВА НЕТ($want)"; fi; fi
  echo "$code | $m | $u | ${r#* }"; rm -f "$f"; }
echo "=== ссылки из документов ==="; while read -r u; do check "$u" ""; done < all_urls.txt
echo "=== найденные ==="; while IFS='|' read -r u w; do check "$u" "$w"; done < cand.txt
echo "=== DOI ==="; while read -r d; do
  t=$(curl -sSL --max-time 40 -H 'Accept: application/vnd.citationstyles.csl+json' "https://doi.org/$d" | python3 -c 'import sys,json;j=json.load(sys.stdin);print(j.get("title"),"|",j.get("container-title"),"|",(j.get("issued",{}).get("date-parts") or [[""]])[0][0])' 2>&1 | tail -1)
  echo "DOI $d | $t"; done < doi.txt
