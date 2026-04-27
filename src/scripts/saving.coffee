import { weaponKey } from './weapons'

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
    state.lang = locals.lang.id
  if locals.diff
    state.diff = locals.diff.id
  if locals.playerCount
    state.p = locals.playerCount.count

  window.location.hash = Object.entries state
    .map (pair) => pair.join '='
    .join '&'

restoreSave = (data) =>
  [game, owned, starred] = data.split(':')
  if game isnt locals.game.num
    throw new Error "Wrong game: #{game}\nExpected: #{locals.game.num}"

  restoreSaveData(owned)
  if starred
    restoreSaveData starred, 'starred'
  render()

restoreSaveData = (payload, scope) =>
  { weapons } = locals
  parsed = atob payload
  pow = 0
  i = 0
  char = parsed.charCodeAt 0
  for wpn in weapons
    key = weaponKey wpn, scope
    isActive = (char >> pow) & 1
    if isActive
      localStorage[key] = '1'
    else if localStorage[key] > 0
      localStorage[key] = '0'

    if pow >= 7
      pow = 0
      i++
      char = parsed.charCodeAt i
    else
      pow++

flashButton = (id, text, revertTo) =>
  button = document.getElementById id
  button.textContent = text
  revertText = () => button.textContent = revertTo
  setTimeout revertText, 1200

window.closeSaveLoad = () =>
  return unless locals.saveLoadState
  locals.saveLoadState = false
  render()

window.toggleSave = () =>
  locals.saveLoadState = not locals.saveLoadState
  
  if locals.saveLoadState
    parts = [locals.game.num]
    parts.push await encodeSave()
    if locals.gameValues?.hasStars
      parts.push await encodeSave 'starred'
    locals.saveLoadText = parts.join(':')
  render()

window.copySaveData = () =>
  saveLoadArea = document.getElementById 'save-load-textarea'
  saveLoadArea.select()
  saveLoadArea.setSelectionRange 0, 99999
  navigator.clipboard.writeText locals.saveLoadText

  flashButton 'save-load-copy', 'Copied!', 'Copy'

window.toggleCheckWeapon = (scope, id) =>
  closeSaveLoad()
  wpn = locals.weapons.find (w) => w.id is id
  unless wpn
    throw new Error "Weapon not found: #{id}"

  key = weaponKey wpn, scope
  checked = 1 - (localStorage[key] or 0)
  localStorage[key] = checked

  # If a weapon is starred, it must be owned. Enforce this.
  if scope is 'starred' and checked
    key = weaponKey wpn, 'owned'
    localStorage[key] = checked
    document
      .getElementById key
      .checked = checked

window.importSaveData = () =>
  saveLoadArea = document.getElementById 'save-load-textarea'
  importButton = document.getElementById 'save-load-import'
  try
    restoreSave saveLoadArea.value
    flashButton 'save-load-import', 'Imported!', 'Import'
  catch err
    console.error err
    saveLoadArea.value = err.message

# Copied from stackoverflow: https://stackoverflow.com/a/66046176
# note: `buffer` arg can be an ArrayBuffer or a Uint8Array
bufferToBase64 = (buffer) =>
  # use a FileReader to generate a base64 data URI:
  base64url = await new Promise (r) =>
    reader = new FileReader()
    reader.onload = () => r reader.result
    reader.readAsDataURL new Blob [buffer]

  # remove the `data:...;base64,` part from the start
  base64url.slice(base64url.indexOf(',') + 1)

encodeSave = (scope) =>
  { weapons = [] } = locals
  size = Math.ceil(weapons.length / 8)
  buffer = new Uint8Array size
  pow = 0
  i = 0
  for wpn in weapons
    key = weaponKey wpn, scope
    if localStorage[key] > 0
      buffer[i] = buffer[i] | Math.pow(2, pow)
    if pow >= 7
      pow = 0
      i++
    else
      pow++
  bufferToBase64(buffer)
