import { last } from './utils'


getBaseHp = (enemy, difficulty = locals.diff) =>
  i = Math.max difficulty.index - 1, 0 # Easy mode is ignored
  if Array.isArray enemy.hp
    enemy.hp[i - 1] or last enemy.hp or 0
  else
    enemy.hp or 0

window.getHp = (highLow) => (enemy, difficulty = locals.diff) =>
  hp = getBaseHp enemy, difficulty
  hpScaling = difficulty.enemyScaling?[0] or 1
  playerScaling = difficulty.playerScaling[locals.playerCount.index]
  progressScaling = difficulty.progressScaling[highLow]
  hp * hpScaling * playerScaling * progressScaling / 10

window.getMissionHp = (enemy, difficulty, mission) =>
  fraction = (mission - 1) / ((locals.mode.missions - 1) or 1)
  hp = getBaseHp enemy, difficulty
  low = hp * difficulty.progressScaling[0]
  high = hp * difficulty.progressScaling[1]
  hpScaling = difficulty.enemyScaling?[0] or 1
  playerScaling = difficulty.playerScaling[locals.playerCount.index]
  progressScaling = (low + (high - low) * fraction)
  progressScaling * hpScaling * playerScaling / 10

window.getHpLow = getHp 0
window.getHpHigh = getHp 1

window.calcMissionHps = () =>
  mission = +document
    .getElementById 'mission-input'
    .value
  return unless mission
  locals.mission = mission
  for e in locals.enemies
    row = document.querySelector "[data-enemy=#{e.id}]"
    continue unless row
    hp = getMissionHp e, locals.diff, mission
    stagger = (hp * e.stagger)
    row
      .querySelector '.mission-hp'
      .textContent = hp.toFixed()
    if stagger
      row
        .querySelector '.stagger'
        .textContent = stagger.toFixed()

export processEnemies = (data) =>
  locals.enemies = data.enemies.sort (a, b) =>
    groupSort = (a.group or '').localeCompare(b.group or '')
    return groupSort if groupSort
    aHp = if Array.isArray a.hp then a.hp[0] else a.hp
    bHp = if Array.isArray b.hp then b.hp[0] else b.hp
    hpSort = aHp - bHp
    return hpSort if hpSort
    nameSort = (a.name or '').localeCompare(b.name or '')
    return nameSort if nameSort
    return a.id.localeCompare(b.id)

  previousHash = ''
  for enemy in locals.enemies
    hashObj = { ...enemy }
    delete hashObj.id
    delete hashObj.name
    hash = JSON.stringify hashObj
    if hash is previousHash
      enemy.isDuplicate = true
    previousHash = hash

window.getCredits = (enemy) =>
  hp = getBaseHp enemy
  hp * (enemy.credits ? 1)

export enemyStatModes = (modes) =>
  return [] if not modes
  modes.map (m) =>
    playerCount = if m.name is 'OFF' then 2 else m.difficulties[0].playerScaling.length
    difficulties = m.difficulties.map (diff, i) =>
      players = diff.playerScaling.map (scale, j) =>
        count = j + 1
        {
          id: count
          index: j
          name: "<b>#{count}</b>P"
          count
          scale
        }
      {
        players
        id: diff.name.toLowerCase()
        index: i
        ...diff
      }
    {
      ...m
      id: "hp-#{m.name.toLowerCase()}"
      label: "<i>HP</i> <b>#{m.name}</b>"
      class: m.name.toLowerCase()
      hasEnemies: true
      difficulties
    }

