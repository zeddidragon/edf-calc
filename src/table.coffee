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

campaignNo = 'offline'
campaign = factors.find (f) -> f.id is campaignNo
offline = campaign.missions.length - 1
online = if campaignNo then offline else factors[1].missions.length - 1

for mission, i in campaign.missions
  missionNumber =
    if mission.online then "-- {#{i + 1}}"
    else if i is offI then "#{i + 1}"
    else "#{offI + 1} {#{i + 1}}"
  output.push "[h1]#{missionNumber}. #{mission.name}[/h1]"
  output.push "[table]"
  output.push headers
  for difficulty, j in difficulties
    output.push "[b]#{difficulty}[/b]"
    {min, max} = campaign.difficulties[j]
    for eId in mission.enemies
      factor = 1
      difficultyMask = null
      if Array.isArray eId
        [eId, factor, difficultyMask] = eId
      if difficultyMask and not difficultyMask.includes difficulty
        continue
      output.push '[tr]'
      enemy = byId[eId] or id: eId, name: "Unknown (#{eId})", hp: 0
      output.push "[td]#{enemy.name}[/td]"

      if mission.online
        output.push '[td] - [/td]'
      else
        hp = enemy.hp *
          (min + (max - min) * offI / offline) *
          factor
        output.push "[td]#{Math.round hp}[/td]"

      hp = enemy.hp *
        (min + (max - min) * i / online) *
        (enemy.online or 1) *
        factor
      for multi in [2.2, 2.3, 2.4]
        output.push "[td]#{Math.round hp * multi}[/td]"
      if factor isnt 1
        output.push "[td]x#{factor}[/td]"
      output.push '[/tr]'
  output.push '[/table]'
  offI++ unless mission.online

console.log output.join '\r\n'
