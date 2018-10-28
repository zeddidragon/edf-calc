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
offline = factors[0].missions.length
online = factors[1].missions.length

headers = [
  '[tr]',
  '[th]Type[/th]',
  '[th]Offline[/th]',
  '[th]2 Players[/th]',
  '[th]3 players[/th]',
  '[th]1/4 players[/th]',
  '[/tr]',
].join ''

for mission, i in factors[1].missions
  missionNumber =
    if mission.online then "-- {#{i + 1}}"
    else if i is offI then "#{i + 1}"
    else "#{offI + 1} {#{i + 1}}"
  output.push "[h1]#{missionNumber}. #{mission.name}[/h1]"
  for difficulty, j in difficulties
    output.push "[b]#{difficulty}[/b]"
    output.push "[table]"
    output.push headers
    {min, max} = factors[0].difficulties[j]
    for eId in mission.enemies
      output.push '[tr]'
      if Array.isArray eId
        [eId, factor] = eId
      else
        factor = 1
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


console.log output.join '\n'
