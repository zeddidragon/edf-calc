import { last } from './utils'

getBaseHp = (enemy, difficulty, i) =>
  i = Math.max i - 1, 0 # Easy mode is ignored
  if Array.isArray enemy.hp
    enemy.hp[i - 1] or last enemy.hp or 0
  else
    enemy.hp or 0

window.getHp = (highLow) => (enemy, difficulty, i) =>
  hp = getBaseHp enemy, difficulty, i
  hp * difficulty.progressScaling[highLow] / 10

window.getHpLow = getHp 0
window.getHpHigh = getHp 1

export processEnemies = (data) =>
  locals.enemies = data.enemies.sort (a, b) =>
    groupSort = a.group.localeCompare(b.group)
    return groupSort if groupSort
    aHp = if Array.isArray a.hp then a.hp[0] else a.hp
    bHp = if Array.isArray b.hp then b.hp[0] else b.hp
    hpSort = aHp - bHp
    return hpSort if hpSort
    return a.name.localeCompare(b.name)

  previousHash = ''
  for enemy in locals.enemies
    hashObj = { ...enemy }
    delete hashObj.id
    delete hashObj.name
    hash = JSON.stringify hashObj
    if hash is previousHash
      enemy.isDuplicate = true
    previousHash = hash
