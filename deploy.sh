#!/usr/bin/env bash
npm run build
rm public/edf/main.js.map
cp -r public/* ../zeddidragon/
rm public/edf/main.js
