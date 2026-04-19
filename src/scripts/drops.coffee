import { headers } from './headers'

dropHeaders = [
  'checkbox'
  'stars'
  'level'
  'name'
  'dropWeight'
]

pull = (arr, item) =>
  index = arr.indexOf item
  arr.splice index, 1
  arr

export populateWeaponDrops = () =>
  {
    weapons
    char
    cat
    mode: { difficulties, missions, name: modeName }
    gameValues
  } = locals
  table = {
    weapons: weapons
      .filter (wpn) => wpn.character is char.id
      .filter (wpn) => wpn.category is cat.id
      .map (wpn) => { ...wpn }
    headers: [...dropHeaders]
  }

  unless gameValues?.hasStars
    pull table.headers, 'stars'
  unless gameValues?.hasDropWeights
    pull table.headers ,'dropWeight'
  
  locals.tables = [table]

  diffSpreads = {}
  for difficulty in difficulties
    { dropsLow, dropsHigh } = difficulty
    firstDrops = Array(150).fill(-1)
    lastDrops = Array(150).fill(-1)
    for i in [0..(missions - 1)]
      downTo = dropsLow[i]
      upTo = dropsHigh[i] - 1
      for v in [downTo..upTo]
        lastDrops[v] = i

      for v in [upTo..downTo]
        break if firstDrops[v] >= 0
        firstDrops[v] = i

    diffSpreads[difficulty.name] = { firstDrops, lastDrops }

  dlc = ['DLC1', 'DLC2'].indexOf(modeName) + 1

  table.weapons = table.weapons.map (wpn) =>
    { level, odds, dlc: weaponDlc } = wpn
    wpn.drops = difficulties.map (diff) =>
      { firstDrops, lastDrops } = diffSpreads[diff.name]
      from = firstDrops[level]
      to = lastDrops[level]
      max = diff.drops[1]
      isDropped = (
        to > -1 or from > -1
      ) and (
        not weaponDlc or weaponDlc is dlc
      )

      if isDropped
        from: 1 + Math.max from, 0
        to: if to < from then missions else 1 + to
      else
        null
    wpn
