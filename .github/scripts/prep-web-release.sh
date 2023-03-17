#!/usr/bin/env bash

ng build --configuration web-production
echo "---
permalink: /404.html
---
" > "./dist/404.html"
cat "./dist/index.html" >> "./dist/404.html"
