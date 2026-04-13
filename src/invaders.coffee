import template from "pug-loader!./invaders.pug"

games = [
  '1', '2', '2pv2',
  '3', '3p', '4', '41',
  '5', '6',
]
spinoffs = ['ia', 'ir', 'wdts']
gameLabels = {}
gameLabels[game] = "EDF#{game}" for game in games
gameLabels[game] = "EDF:#{game}" for game in spinoffs

locals =
  game: '6',
  mode: 'stats',
  star: 10,
  char: { id: '', name: '' }
  classes: []
  cat: { id: '', name: '' }
  categories: []
  games: [...games, ...spinoffs]
  spinoffs: spinoffs
window.locals = locals

window.selectGame = (game) ->
  loadData game

window.selectMode = (mode) ->
  locals.mode = mode
  render()

window.selectChar = (charId) ->
  locals.char = locals.classes.find (c) -> c.id is charId
  locals.categories = locals.headers[locals.char.id]
  selectCategory locals.categories[0].category

window.selectCategory = (categoryId) ->
  locals.cat = locals.categories.find (c) -> c.id is categoryId
  render()

window.selectStar = (star) ->
  locals.star = star
  render()

loadData = (game) ->
  locals.game = game
  locals.isLoading = true
  render()

  data = await fetch "./weapons-#{game}.json"
    .then (res) -> res.json()

  locals.isLoading = false

  Object.assign locals, data
  locals.classes = ({ id, name: data.charLabels[i] } for id, i in data.classes)
  selectChar locals.classes[0].id

render = ->
  document.body.innerHTML = template(locals)

loadData games[games.length - 1]
