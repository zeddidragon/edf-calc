import fs from 'fs/promises'

let game
export function setGame(g) {
  game = g
}

export async function loadJson(path) {
  const module = await import(`../../sgott/data/${game}/${path}.json`, { with: { type: 'json' } })
  return module.default
}

export async function loadFile(path) {
  return fs.readFile(`../sgott/data/${game}/${path}`, 'utf8')
}
