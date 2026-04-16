export readState = () =>
  pairs = window.location.hash[1..]
    .split '&'
    .map (item) => item.split '='
  Object.fromEntries pairs

export writeState = () =>
  state = {}

  if locals.game
    state.game = locals.game.num
  if locals.mode
    state.mode = locals.mode.id
  if locals.char
    state.char = locals.char.id
  if locals.cat and state.mode is 'stats'
    state.wpn = locals.cat.id
  if locals.star
    state.star = locals.star.star
  if locals.lang
    state.lang = locals.lang

  window.location.hash = Object.entries state
    .map (pair) => pair.join '='
    .join '&'

stateKeys = [
  'game',
  'mode',
  'char',
  'wpn',
  'star',
  'lang',
]

window.closeSaveLoad = () =>
  # TODO
