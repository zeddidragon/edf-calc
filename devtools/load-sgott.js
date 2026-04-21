import fs from 'fs/promises'

let game
export function setGame(g) {
  game = g
}

export function listDir(path) {
  return fs.readdir(`../sgott/data/${game}/${path}`)
}

export async function loadJson(path) {
  const module = await import(`../../sgott/data/${game}/${path}.json`, { with: { type: 'json' } })
  return module.default
}

export function loadFile(path) {
  return fs.readFile(`../sgott/data/${game}/${path}`, 'utf8')
}
