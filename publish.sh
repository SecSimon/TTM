#!/usr/bin/env bash

ng build --configuration web-production --baseHref="https://www.simon-liebl.de/TTM/"
echo "---
permalink: /404.html
---
" > "./dist/404.html"
cat "./dist/index.html" >> "./dist/404.html"
npx angular-cli-ghpages --dir=dist

