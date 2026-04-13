import template from "pug-loader!./invaders.pug"
import headers from "coffee-loader!./headers.coffee"
import { localize, weaponStats } from "coffee-loader!./weapons.coffee"

games = [
  '1', '2', '2pv2',
  '3', '3p', '4', '41',
  '5', '6',
]
spinoffs = ['ia', 'ir', 'wdts']
gameLabels = {}
gameLabels[game] = "EDF#{game}" for game in games
gameLabels[game] = "EDF:#{game}" for game in spinoffs

last = (list) => list[list.length - 1]

locals =
  lang: 'en'
  stars: { id: "star-#{star}", name: if star >= 10 then "★  #{star}" else "☆  #{star}" } for star in [0..10]
  games: [
    games.map (g) => { id: "edf#{g}", name: "EDF#{g.toUpperCase()}" }
    spinoffs.map (g) => { id: "edf#{g}", name: "EDF:#{g.toUpperCase()}" }
  ].flat()
  localize: localize
  spinoffs: spinoffs
  headerDefinitions: headers

window.locals = locals
locals.star = last locals.stars
locals.game = locals.games.find (g) => g.id is 'edf6'

window.selectItem = (scope, id) =>
  switch scope
    when 'game' then loadData id
    when 'mode' then selectMode id
    when 'class' then selectChar id
    when 'category' then selectCategory id
    when 'star' then selectStar id

window.selectMode = (modeId) =>
  locals.modeId = locals.modes.find (m) => m.id is modeId
  render()

window.selectChar = (charId) =>
  locals.char = locals.classes.find (c) => c.id is charId
  locals.categories =
    for cat in locals.headers[locals.char.id]
      { cat...
        id: cat.category
        name: cat.name or cat.names[locals.lang] or 'ERROR'
      }
  selectCategory locals.categories[0].category

window.slice3 = (str) => "<b>#{str[0..2]}</b>#{str[3..]}"

window.selectCategory = (categoryId) =>
  locals.cat = locals.categories.find (c) => c.id is categoryId

  weapons = locals.weapons.filter (wpn) =>
    wpn.character is locals.char.id and wpn.category is locals.cat.id

  locals.tables =
    if locals.cat.tables
      locals.cat.tables.map (table) =>
        { locals.cat...
          table...
          weapons: weapons.filter (wpn) => wpn.subCategory is table.subCategory
        }
    else
      [{ locals.cat..., weapons: weapons }]

  render()

window.selectStar = (starId) =>
  locals.star = locals.stars.find (s) => s.id is starId
  render()

window.weaponStat = (weapon, stat) =>
  if weaponStats[stat]?
    weaponStats[stat](weapon, stat)
  else if weapon[stat]?
    weapon[stat]
  else
    '-'

loadData = (gameId) =>
  locals.game = locals.games.find (g) => g.id is gameId
  locals.isLoading = true
  render()

  data = await fetch "./weapons-#{gameId[3...]}.json"
    .then (res) => res.json()

  locals.isLoading = false

  Object.assign locals, data
  locals.modes = [
    { id: 'stats', name: 'Stats' }
    ...(data.modes
      .filter (m) -> m.difficulties?[0].dropsLow
      .map (m) -> { id: m.name.toLowerCase(), ...m })
  ]
  locals.mode = locals.modes[0]
  locals.classes = data.classes.map (id, i) -> { id, name: data.charLabels[i] }
  selectChar locals.classes[0].id

render = =>
  document.body.innerHTML = template(locals)

loadData locals.game.id
