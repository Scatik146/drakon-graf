#!/bin/bash
npm view drakon-graf versions dist-tags --json
mkdir -p /tmp/user && cd /tmp/user && npm init -y >/dev/null && npm install drakon-graf@0.9.1 >/dev/null 2>&1 && npm audit --omit=dev | tail -1
cd - >/dev/null && node smoke.mjs /tmp/user
cd /tmp/user && printf '```konspekt\nтема: А\n```\n```drakon-graf\ntopic: B\nB ><\n```\n' > u.md && npx drakon-graf --check u.md; echo "выход $?"
for u in https://cdn.jsdelivr.net/npm/drakon-graf@0.9.1/dist/drakon-graf.min.js https://cdn.jsdelivr.net/npm/drakon-graf@0.9.1/fonts/PT_Serif-Web-Regular.ttf https://cdn.jsdelivr.net/npm/drakon-graf@0.9/dist/drakon-graf.min.js; do echo "$(curl -sSL -o /tmp/f -w '%{http_code}' $u) $u $(grep -c '0\.9\.1' /tmp/f 2>/dev/null)"; done
