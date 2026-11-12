#!/usr/bin/env bash
# Сборка сайта и публикация в ветку gh-pages (GitHub Pages: Settings → Pages → Deploy from a branch → gh-pages / root).
set -euo pipefail
cd "$(dirname "$0")/.."
node tools/site.mjs
SHA=$(git rev-parse --short HEAD)
TMP=$(mktemp -d)
cp -r _site/. "$TMP"/
cd "$TMP"
git init -q -b gh-pages
git add -A
git -c user.name="${GIT_AUTHOR_NAME:-drakon-graf}" -c user.email="${GIT_AUTHOR_EMAIL:-noreply@github.com}" commit -q -m "Сайт ДРАКОН-ГРАФ из main@$SHA"
git push -q -f "$(git -C "$OLDPWD" remote get-url origin)" gh-pages
echo "опубликовано: https://scatik146.github.io/drakon-graf/"
