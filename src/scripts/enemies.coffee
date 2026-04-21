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
