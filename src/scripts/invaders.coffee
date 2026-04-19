import template from '../templates/main.pug'
import { headers } from './headers'
import { readState, writeState } from './saving'
import { localize, weaponStats, processWeapon } from './weapons'
import { populateWeaponDrops } from './drops'

params = readState()

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
  stars: [0..10].map (star) =>
    id: "star-#{star}"
    star: star
    name: if star >= 10 then "★  #{star}" else "☆  #{star}"
  games: [
    games.map (g) =>
      id: "edf#{g}"
      num: g.toString()
      name: "EDF#{g.toUpperCase()}"
      label: "<b>EDF#{g[0]}</b>#{g[1..].toUpperCase()}"
    spinoffs.map (g) =>
      id: "edf#{g}"
      num: g.toString()
      name: "EDF:#{g.toUpperCase()}"
      label: "EDF:<b>#{g.toUpperCase()}</b>"
  ].flat()
  localize: localize
  spinoffs: spinoffs
  headerDefinitions: headers
  saveLoadState: false

window.slice3 = (str) => "<b>#{str[0..2]}</b>#{str[3..]}"

# Put the dot in 4.1
locals
  .games
  .find (g) => g.id is 'edf41'
  .label = '<b>EDF4</b>.1'

window.locals = locals
locals.star = last locals.stars

window.selectItem = (scope, id) =>
  switch scope
    when 'game' then loadData id
    when 'mode' then selectMode id
    when 'class' then selectChar id
    when 'category' then selectCategory id
    when 'star' then selectStar id
    when 'lang' then selectLang id

window.selectMode = (modeId) =>
  locals.mode = locals.modes.find (m) => m.id is modeId
  locals.mode or= locals.modes[0]

  params.mode = locals.mode.id
  if locals.mode.hasDrops
    populateWeaponDrops()
  render()

buttonPrefixes = [
  'Drops '
]

window.selectChar = (charId) =>
  locals.char = locals.classes.find (c) => c.id is charId
  locals.char or= locals.classes[0]

  locals.categories =
    for cat in locals.headers[locals.char.id]
      name = cat.name or cat.names[locals.lang.id] or 'ERROR'
      label = cat.label or cat.labels?[locals.lang.id]
      label or= "<b>#{name[0..1]}</b>#{name[2..]}"

      { ...cat
        id: cat.category
        name
        label
      }

  params.char = locals.char.id
  selectCategory params.wpn

window.selectCategory = (categoryId) =>
  locals.cat = locals.categories.find (c) => c.id is categoryId
  locals.cat or= locals.categories[0]

  weapons = locals.weapons
    .filter (wpn) => wpn.character is locals.char.id and wpn.category is locals.cat.id
    .flatMap processWeapon

  locals.tables =
    if locals.cat.tables
      locals.cat.tables.map (table) =>
        { ...locals.cat
          ...table
          weapons: weapons.filter (wpn) => wpn.subCategory is table.subCategory
        }
    else
      [{ ...locals.cat, weapons: weapons }]

  params.wpn = locals.cat.id
  render()

window.selectStar = (starId) =>
  locals.star = locals.stars.find (s) => s.id is starId
  locals.star or= locals.stars.find (s) => s.star is starId
  locals.star or= last locals.stars

  params.star = locals.star?.star
  render()

window.selectLang = (langId) =>
  locals.lang = locals.langs.find (l) => l.id is langId
  locals.lang or= locals.langs[0]

  params.lang = locals.lang.id
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
      .map (m) => {
        id: m.name.toLowerCase()
        label: "Drops <b>#{m.name}</b>"
        hasDrops: true
          ...m
      }
    )
  ]
  locals.mode = locals.modes[0]
  locals.classes = data.classes.map (id, i) => { id, name: data.charLabels[i] }
  locals.langs = data.langs.map (lang) => { id: lang, name: lang } if data.langs
  locals.lang = locals.langs?.find (l) => l.id is  locals.langs?[0] or { id: 'lang-en', name: 'en' }
  selectChar params.char

window.render = () =>
  writeState()
  document.body.innerHTML = template locals

await loadData params.game
selectMode params.mode if params.mode
selectStar params.star if params.star isnt 10
