import template from "pug-loader!./invaders.pug"
import headers from "coffee-loader!./headers.coffee"
import { localize, weaponStats, processWeapon } from "coffee-loader!./weapons.coffee"

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
  stars: [0..10].map (star) =>
    id: "star-#{star}"
    star: star
    name: if star >= 10 then "★  #{star}" else "☆  #{star}"
  games: [
    games.map (g) =>
      id: "edf#{g}"
      num: g.toString()
      name: "EDF#{g.toUpperCase()}"
    spinoffs.map (g) =>
      id: "edf#{g}"
      num: g.toString()
      name: "EDF:#{g.toUpperCase()}"
  ].flat()
  localize: localize
  spinoffs: spinoffs
  headerDefinitions: headers

window.locals = locals
locals.star = last locals.stars

window.selectItem = (scope, id) =>
  switch scope
    when 'game' then loadData id
    when 'mode' then selectMode id
    when 'class' then selectChar id
    when 'category' then selectCategory id
    when 'star' then selectStar id

window.selectMode = (modeId) =>
  locals.mode = locals.modes.find (m) => m.id is modeId
  locals.mode or= locals.modes[0]
  render()

window.selectChar = (charId) =>
  locals.char = locals.classes.find (c) => c.id is charId
  locals.char or= locals.classes[0]

  locals.categories =
    for cat in locals.headers[locals.char.id]
      { cat...
        id: cat.category
        name: cat.name or cat.names[locals.lang] or 'ERROR'
      }
  selectCategory params.wpn

window.slice3 = (str) => "<b>#{str[0..2]}</b>#{str[3..]}"

window.selectCategory = (categoryId) =>
  locals.cat = locals.categories.find (c) => c.id is categoryId
  locals.cat or= locals.categories[0]

  weapons = locals.weapons
    .filter (wpn) => wpn.character is locals.char.id and wpn.category is locals.cat.id
    .map processWeapon

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
  locals.star or= last locals.stars
  render()

window.weaponStat = (weapon, stat) =>
  stat =
    if weaponStats[stat]?
      weaponStats[stat](weapon, stat)
    else if weapon[stat]?
      weapon[stat]
  stat ? '-'

loadData = (gameId) =>
  locals.game = locals.games.find (g) => g.num is gameId
  locals.game or= locals.games.find (g) => g.id is gameId
  locals.game or= locals.games.find (g) => g.id is 'edf6'
  locals.game or= locals.games[0]
  locals.isLoading = true
  render()

  data = await fetch "./weapons-#{locals.game.num}.json"
    .then (res) => res.json()

  locals.isLoading = false

  Object.assign locals, data
  locals.modes = [
    { id: 'stats', name: 'Stats' }
    ...(data.modes
      .filter (m) => m.difficulties?[0].dropsLow
      .map (m) => { id: m.name.toLowerCase(), ...m })
  ]
  locals.mode = locals.modes[0]
  locals.classes = data.classes.map (id, i) => { id, name: data.charLabels[i] }
  selectChar params.char

render = =>
  document.body.innerHTML = template(locals)

pairs = window.location.hash
  .slice 1
  .split '&'
  .map (item) => item.split '='
params = Object.fromEntries pairs
await loadData params.game
selectMode params.mode if params.mode
selectStar params.star if params.star isnt 10
