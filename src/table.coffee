factors = require './data/factors'
hps = require './data/hp'

keyById = (obj, subject) ->
  obj[subject.id] = subject
  obj

byId = hps.reduce keyById, {}

output = []

difficulties = [
  'Easy',
  'Normal',
  'Hard',
  'Hardest',
  'Inferno',
]

offI = 0
headers = [
  '[tr]',
  '[th]Type[/th]',
  '[th]Offline[/th]',
  '[th]2 Players[/th]',
  '[th]3 players[/th]',
  '[th]1/4 players[/th]',
  '[/tr]',
].join ''

campaignName = process.argv[2] or 'main'
onlyMission = +process.argv[3]
campaign = factors.find (f) -> f.id is campaignName
offline =
  campaign
    .missions
    .filter (m) -> not m.online
    .length - 1
online = campaign.missions.length - 1

multipliers = [
  [1.44, 1.8, 2.16],
  [1.664, 2.08, 2.496],
  [1.8, 2.1, 2.4],
  [2.0, 2.2, 2.4],
  [2.2, 2.3, 2.4],
]

currentMission = null
currentDifficulty = null
currentEnemy = null
addMission = (number, name, rawNum) ->
  currentMission =
    number: number
    name: name
    rawNum: rawNum
    difficulties: []

addDifficulty = (diff) ->
  currentDifficulty =
    mode: diff
    enemies: []
  currentMission.difficulties.push currentDifficulty

addEnemy = (name, factor) ->
  currentEnemy =
    name: name
    factor: factor
    hps: []
  currentDifficulty.enemies.push currentEnemy

addHp = (hp) ->
  currentEnemy.hps.push hp

write = ->
  return if onlyMission and onlyMission isnt currentMission.rawNum
  output.push "[h1]#{currentMission.number}. #{currentMission.name}[/h1]"
  output.push "[table]"
  output.push headers
  for difficulty in currentMission.difficulties
    output.push "[b]#{difficulty.mode}[/b]"
    for enemy in difficulty.enemies
      output.push '[tr]'
      output.push "[td]#{enemy.name}[/td]"
      for hp in enemy.hps
        output.push "[td]#{hp}[/td]"
      if enemy.factor isnt 1
        output.push "[td]x#{enemy.factor}[/td]"
      output.push '[/tr]'
  output.push '[/table]'

for mission, i in campaign.missions
  missionNumber =
    if mission.online then "-- {#{i + 1}}"
    else "#{offI + 1} {#{i + 1}}"

  addMission missionNumber, mission.name, i + 1
  for difficulty, j in difficulties
    addDifficulty difficulty
    {min, max} = campaign.difficulties[j]
    for eId in mission.enemies
      factor = 1
      difficultyMask = null
      if Array.isArray eId
        [eId, factor, difficultyMask] = eId
      if difficultyMask and not difficultyMask.includes difficulty
        continue
      enemy = byId[eId] or id: eId, name: "Unknown (#{eId})", hp: 0
      addEnemy enemy.name, factor

      if mission.online
        addHp '-'
      else
        hp = enemy.hp *
          (min + (max - min) * offI / offline) *
          factor
        addHp Math.ceil hp

      hp = enemy.hp *
        (min + (max - min) * i / online) *
        (enemy.online or 1) *
        factor
      for multi in multipliers[j]
        addHp Math.ceil hp * multi
  offI++ unless mission.online
  write()

console.log output.join '\r\n'
