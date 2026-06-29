import fs from 'fs/promises'
import json from 'json-stringify-pretty-compact'
const isDebug = process.argv[3] === 'dbg'

const game = process.argv[2]
async function extractCalcdata(game) {
  await fs.access('../sgott/data')
  const module = await import(`./calcdata-${game}.js`)
  return module.default()
}

async function processGame(game) {
  const data = await extractCalcdata(game)
  if(isDebug)
    return console.log(data)
  const path = `public/edf/weapons-${game}.json`
  console.log(path)
  await fs.writeFile(path, json(data))
}

async function processGames() {
  for(const file of await fs.readdir('public/edf/')) {
    const match = /weapons-(\S+).json/.exec(file)
    if(!match)
      continue
    await processGame(match[1])
  }
}

function run(cb) {
  cb()
    .catch(console.error)
    .then(() => process.exit(0))
}

if (game)
  run(() => processGame(game))
else
  run(() => processGames())
