#!/usr/bin/env bash
npm run build
cp -r public/* ../zeddidragon/
rm public/edf/main.js
rm public/edf/main.js.map
