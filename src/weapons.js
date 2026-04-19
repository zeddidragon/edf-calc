// Copied from stackoverflow: https://stackoverflow.com/a/66046176
// note: `buffer` arg can be an ArrayBuffer or a Uint8Array
async function bufferToBase64(buffer) {
  // use a FileReader to generate a base64 data URI:
  const base64url = await new Promise(r => {
    const reader = new FileReader()
    reader.onload = () => r(reader.result)
    reader.readAsDataURL(new Blob([buffer]))
  });
  // remove the `data:...;base64,` part from the start
  return base64url.slice(base64url.indexOf(',') + 1);
}

function encodeSave(type) {
  const size = Math.ceil(table.length / 8)
  const buffer = new Uint8Array(size)
  let pow = 0
  let i = 0
  for(const wpn of table) {
    const key = weaponKey(wpn, type)
    if(localStorage[key] > 0) {
      buffer[i] = buffer[i] | Math.pow(2, pow)
    }
    if(pow >= 7) {
      pow = 0
      i++
    } else {
      pow++
    }
  }
  return bufferToBase64(buffer)
}

function restoreSave(data) {
  const [game, owned, starred] = data.split(':')
  if(game !== active.game) {
    throw new Error(`Wrong game: ${game}\nExpected: ${active.game}`)
  }
  restoreSaveData(owned)
  if(starred) {
    restoreSaveData(starred, 'starred')
  }
  loadWeapons(game)
}

function restoreSaveData(payload, type) {
  const parsed = atob(payload)
  let pow = 0
  let i = 0
  let char = parsed.charCodeAt(0)
  for(const wpn of table) {
    const key = weaponKey(wpn, type)
    const isActive = (char >> pow) & 1
    if(isActive) {
      localStorage[key] = '1'
    } else if(localStorage[key] > 0) {
      localStorage[key] = '0'
    }
    if(pow >= 7) {
      pow = 0
      i++
      char = parsed.charCodeAt(i)
    } else {
      pow++
    }
  }
}

let saveLoadState = 0
let exportText
const saveLoadArea = document
  .getElementById('save-load-textarea')
const copyButton = document
  .getElementById('save-load-copy')
const importButton = document
  .getElementById('save-load-import')
copyButton
  .addEventListener('click', () => {
    saveLoadArea.select()
    saveLoadArea.setSelectionRange(0, 99999)
    navigator.clipboard.writeText(exportText)
    copyButton.textContent = 'Copied!'
    setTimeout(() => {
      copyButton.textContent = 'Copy'
    }, 1200)
  })
importButton
  .addEventListener('click', async () => {
    const importText = saveLoadArea.value
    try {
      await restoreSave(importText)
    } catch(err) {
      saveLoadArea.value = err.message
    }
  })

function closeSaveLoad() {
  if(!saveLoadState) {
    return
  }
  saveLoadState = 0
  document
    .getElementById('save-load-text')
    .setAttribute('data-state', 'inactive')
}

document
  .getElementById('save-load-toggle')
  .addEventListener('click', async () => {
    saveLoadState = 1 - saveLoadState
    const stateName = ['inactive', 'active'][saveLoadState]
    if(saveLoadState) {
      const parts = [
        active.game,
        await encodeSave()
      ]
      if(gameHasStars()) {
        parts.push(await encodeSave('starred'))
      }
      exportText = parts.join(':')
      saveLoadArea.value = exportText
    }
    document
      .getElementById('save-load-text')
      .setAttribute('data-state', stateName)
  })
