import template from "pug-loader!./invaders.pug"

const games = [
  '1', '2', '2pv2',
  '3', '3p', '4', '41',
  '5', '6',
]
const spinoffs = ['ia', 'ir', 'wdts']
const gameLabels = {}
for(const game of games) {
  gameLabels[game] = `EDF:${game}`
}
for(const game of spinoffs) {
  gameLabels[game] = `EDF:${game}`
}

const locals = {
  game: '6',
  mode: 'stats',
  star: 10,
  games: [...games, ...spinoffs],
  spinoffs,
}

window.selectGame = (game) => {
  locals.game = game
  render()
}

window.selectMode = (mode) => {
  locals.mode = mode
  render()
}

window.selectStar = (star) => {
  locals.star = star
  render()
}

async function loadData(game) {
  locals.game = game
  const data = await fetch(`./weapons-${game}.json`).then(res => res.json())
  Object.assign(locals, data)
  window.data = data
  render()
}

function render() {
  document.body.innerHTML = template(locals)
}

loadData(games[games.length - 1]);
