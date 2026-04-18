import fs from 'fs/promises'
import json from 'json-stringify-pretty-compact'
const isDebug = process.argv[3] === 'dbg'

const game = process.argv[2]
async function extractCalcdata() {
  await fs.access('../sgott/data')
  const module = await import(`./calcdata-${game}.js`)
  return module.default()
}

extractCalcdata()
  .then(async data => {
    if(isDebug) {
      console.log(data)
    } else {
      const path = `public/weapons-${game}.json`
      console.log(path)
      await fs.writeFile(path, json(data))
    }
  })
  .catch(console.error)
  .then(() => {
    process.exit(0)
  })
