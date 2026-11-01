#!/bin/bash
UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'
for u in "https://edsoo.ru/wp-content/uploads/2023/08/16_%D0%A4%D0%A0%D0%9F_%D0%98%D0%BD%D1%84%D0%BE%D1%80%D0%BC%D0%B0%D1%82%D0%B8%D0%BA%D0%B0_7-9-%D0%BA%D0%BB%D0%B0%D1%81%D1%81%D1%8B_%D1%83%D0%B3%D0%BB.pdf" \
 "https://edsoo.ru/wp-content/uploads/2023/08/14_%D0%A4%D0%A0%D0%9F_%D0%9C%D0%B0%D1%82%D0%B5%D0%BC%D0%B0%D1%82%D0%B8%D0%BA%D0%B0-7-9-%D0%BA%D0%BB%D0%B0%D1%81%D1%81%D1%8B_%D1%83%D0%B3%D0%BB.pdf" \
 https://edsoo.ru/rabochie-programmy/ https://www.dmkpress.com/catalog/computer/programming/algorithms/978-5-97060-422-9/ \
 "https://znanium.ru/catalog/document?pid=1028086" https://www.labirint.ru/books/548153/ https://drakon.su/_media/pochemu_vrachi_ubivajut_i_kalechat_pacientov_.pdf \
 https://forum.drakon.su/; do
 f=$(mktemp); r=$(curl -sSL -A "$UA" --max-time 40 -o "$f" -w '%{http_code} %{content_type} %{size_download}' "$u" 2>&1|tail -1); echo "$r | $u"; head -c 5 "$f" | grep -q '%PDF' && echo "   это PDF"; rm -f "$f"; done
