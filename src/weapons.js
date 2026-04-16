// TODO: Pick lang

// TODO: Determine if game has stars

// TODO: Gray these words
const buttonPrefixes = [
  'Drops ',
  'CC ',
  'Enhanced ',
  'Request ',
  'Mid-Rg ',
]


function pickCategory(ch, cat) {
  // TODO
  const cutPoint = ['spear', 'hammer'].includes(cat.category) ? 4 : 2
}

function populateWeapons(m, ch, cat) {
  const mode = modes.find(mode => mode.name.toLowerCase() === m)
  if(mode) {
    populateWeaponDrops(mode, ch, cat)
  } else {
    populateWeaponStats(ch, cat)
  }
}

function gameHasStars() {
  return [5, 6].includes(+active.game)
}

function populateWeaponDrops(mode, ch, cat) {
  const extra = document.getElementById('extra')
  if(extra) {
    extra.textContent = ''
  }

  const weaponTables = document.getElementById('weapon-tables')
  const weaponTable = $('table')
  weaponTables.innerHTML = ''
  const weapons = table
    .filter(t => t.character === ch && t.category === cat)
  const thead = $('thead')
  const theadrow = $('tr')
  const dropHeaders = headers
    .slice(0, 7)
    .filter(h => !h.iff || h.iff(ch, cat))
  for(const header of dropHeaders) {
    const cell = $('th')
    cell.textContent = header.label
    theadrow.appendChild(cell)
  }
  const { difficulties, missions } = mode

  const diffSpreads = {}
  for(const difficulty of difficulties) {
    const cell = $('th')
    cell.textContent = difficulty.name
    cell.classList.add(difficulty.name)
    cell.setAttribute('colspan', 2)
    theadrow.appendChild(cell)

    const { dropsLow, dropsHigh } = difficulty
    const firstDrops = Array(150).fill(-1)
    const lastDrops = Array(150).fill(-1)
    for(let i = 0; i < missions; i++) {
      const downTo = dropsLow[i]
      const upTo = dropsHigh[i]
      for(let v = downTo; v < upTo; v++) {
        lastDrops[v] = i
      }
      for(let v = upTo; v >= downTo && firstDrops[v] < 0; v--) {
        firstDrops[v] = i
      }
    }
    diffSpreads[difficulty.name] = { firstDrops, lastDrops }
  }

  thead.appendChild(theadrow)
  weaponTable.appendChild(thead)

  const dlc = ['DLC1', 'DLC2'].indexOf(mode.name) + 1
  const tbody = $('tbody')

  for(const weapon of weapons) {
    const row = $('tr')
    const { level, odds, dlc: weaponDlc } = weapon
    for(const header of dropHeaders) {
      const cell = $('td')
      const contents = header.cb(weapon, ch)
      if(contents instanceof HTMLElement) {
        cell.appendChild(contents)
      } else {
        cell.textContent = contents
      }
      cell.classList.add(header.label)
      row.appendChild(cell)
    }
    let i = 0
    for(const difficulty of difficulties) {
      const { firstDrops, lastDrops } = diffSpreads[difficulty.name]
      const from = firstDrops[level]
      const to = lastDrops[level]
      const max = difficulty.drops[1]
      const isDropped = (to > -1 || from > -1)
        && (!weaponDlc || weaponDlc === dlc)
      if(!isDropped) {
        const cell = $('td')
        cell.textContent = '-'
        cell.setAttribute('colspan', 2)
        row.appendChild(cell)
        continue
      }
      const minCell = $('td')
      const maxCell = $('td')
      minCell.textContent = Math.max(from, 0) + 1
      maxCell.textContent = to < from ? missions : to + 1
      row.appendChild(minCell)
      row.appendChild(maxCell)
    }
    tbody.appendChild(row)
  }
  weaponTable.appendChild(tbody)
  weaponTables.appendChild(weaponTable)
}

function populateWeaponStats(ch, cat) {
    // TODO: Column span for some columns
    for(const header of wHeaders) {
      const cell = $('th')
      cell.setAttribute('title', header.tooltip || header.label)
      cell.textContent = header.label
      let cols = 1
      if(gameHasStars && header.starProp) {
        cols++
      }
      if(header.label === 'Dmg') {
        cols += 3
      }
      if(header.label === 'RoF') {
        cols += 1
      }
      if(cols > 1) {
        cell.setAttribute('colspan', cols)
      }
      if(header.headerClass) {
        cell.classList.add(header.headerClass)
      }
      theadrow.appendChild(cell)
    }
    thead.appendChild(theadrow)
    weaponTable.appendChild(thead)

    const tbody = $('tbody')
    for(const weapon of weapons) {
      if(table.subCategory && weapon.subCategory !== table.subCategory) {
        continue
      }
      const row = $('tr')
      for(const header of wHeaders) {
        const cell = $('td')
        let contents = header.cb(weapon, ch)
        cell.classList.add(header.label)
        if(header.headerClass) {
          cell.classList.add(header.headerClass)
        }
        row.appendChild(cell)

        if(header.label === 'Dmg') {
          const [dmg, count, count2] = contents.toString().split('x').map(v => v.trim())
          const [full, min] = dmg.split('~')

          if(min) {
            const cell = $('td')
            cell.textContent = min
            cell.classList.add('Falloff')
            row.appendChild(cell)
          } else {
            const cell = $('td')
            cell.classList.add('Filler')
            row.appendChild(cell)
          }

          if(count2) {
            const cell = $('td')
            cell.textContent = count2
            cell.classList.add('Count')
            row.appendChild(cell)
          }

          if(count) {
            const cell = $('td')
            cell.textContent = count
            cell.classList.add('Count')
            if(count2) {
              cell.classList.add('DmgEnd')
            }
            row.appendChild(cell)
          } else {
            const cell = $('td')
            cell.textContent = ''
            cell.classList.add('Filler')
            row.appendChild(cell)
          }

          if(!count2) {
            const cell = $('td')
            cell.textContent = ''
            cell.classList.add('Filler', 'DmgEnd')
            row.appendChild(cell)
          }

          cell.textContent = full

        } else if(header.label === 'RoF') {
          const [rof, burst] = contents.toString().split('x').map(v => v.trim())
          cell.textContent = rof
          if(burst) {
            const cell = $('td')
            cell.textContent = burst
            cell.classList.add('Count', 'DmgEnd')
            row.appendChild(cell)
          } else {
            const cell = $('td')
            cell.textContent = ''
            cell.classList.add('Filler', 'DmgEnd')
            row.appendChild(cell)
          }
        } else if(contents instanceof HTMLElement) {
          cell.appendChild(contents)
        } else {
          cell.textContent = contents
        }

        const prop = header.starProp
        const prop2 = header.starProp2
        if(gameHasStars && prop) {
          let colspan = 1
          cell.classList.add('hasStar')
          const starCell = $('td')
          for(let i = 0; i < 2; i++) {
            const p = [prop, prop2][i]
            const star = weapon[`${p}Star`]
            const max = weapon[`${p}StarMax`]
            if(star == null && i === 0) {
              colspan = 2
            } else if(star == null) {
            } else if(star < max) {
              starCell.textContent += `☆${star}`
            } else {
              starCell.textContent += `★${star}`
            }
          }

          starCell.classList.add('isStar')
          row.appendChild(starCell)
        }
      }
      tbody.appendChild(row)
    }
    /*
    if(ch === 'ranger' && cat === 'special') {
      extra.innerHTML = '*Assuming flame hits every frame of duration.'
    } else if(cat === 'support') {
      extra.innerHTML = '*All ammo combined'
    } else if(cat === 'deploy') {
      extra.innerHTML = '*All sentries combined'
    } else if(ch !== 'winger' && cat === 'missile') {
      extra.innerHTML = '*With 0 lock time'
    } else {
      extra.innerHTML = ''
    }
    */
    if(tables.length > 1) {
      const name = localize(table.names)
      const h = $('h3')
      h.textContent = name
      weaponTables.appendChild(h)
    }

    weaponTable.appendChild(tbody)
    weaponTables.appendChild(weaponTable)
    if(table.appendix) {
      const extra = $('p')
      extra.textContent = table.appendix
      weaponTables.appendChild(extra)
    }
  }
}

function starValue({
  base,
  algo,
  lvMax,
  zero,
  exp,
  type,
}, star) {
  let sign = 1.0
  if(base < 0) {
    base = -base
    sign = -1.0
  }
  star = Math.min(Math.max(0, star), Math.max(5, lvMax))

  const curveBase = base * zero
  const curvePoint = Math.pow(star / 5.0, exp) * curveBase
  let result = 0
  if((algo & 3) === 0) {
    result = base - curveBase + curvePoint
  } else if((algo & 3) === 1) {
    result = base + curveBase - curvePoint
  } else {
    console.error(`Invalid algorithm: ${algo}`)
  }
  result = sign * Math.max(0, result)

  if(type === 'int') {
    result = Math.floor(result + 0.5)
  }

  return [star, result]
}

function getProp(wpn, prop, obj) {
  const value = wpn[prop]
  if(value == null) return value
  if(typeof value === 'number') {
    return value
  }
  if(prop === 'energy' && wpn.category === 'core') {
    wpn.baseEnergy = value.base
  }
  if(value?.base != null) {
    const [star, v] = starValue(value, active.star)
    obj[`${prop}Star`] = star
    obj[`${prop}StarMax`] = value.lvMax
    return v
  }
}

const gameScopes = {
  4: '',
}

function weaponKey(wpn, type = 'owned') {
  const scope = gameScopes[active.game] || `.${active.game}`
  return `${type}${scope}.${wpn.id}`
}

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

const catLabels = {
  ranger: {
    assault: 'Assault Rifles',
    shotgun: 'Shotguns',
    sniper: 'Sniper Rifles',
    rocket: 'Rocket Launchers',
    missile: 'Missile Launchers',
    grenade: 'Grenades',
    special: 'Special Weapons',
    equipment: 'Support Equipment',
    tank: 'Tanks',
    bike: 'Bikes',
    heli: 'Helicopters',
  },
  winger: {
    short: 'Short-Range',
    laser: 'Mid-Rg Lasers',
    electro: 'Mid-Rg Electroshock',
    particle: 'Particle Cannons',
    sniper: 'Sniper Weapons',
    plasma: 'Ranged Attacks',
    missile: 'Homing Weapons',
    special: 'Special Weapons',
    core: 'Core',
  },
  fencer: {
    hammer: 'CC Strikers',
    spear: 'CC Piercers',
    shield: 'Shields',
    light: 'Automatic Artillery',
    heavy: 'Artillery',
    missile: 'Missile Launchers',
    booster: 'Enhanced Boosters',
    protector: 'Enhanced Shields',
    muzzle: 'Enhanced Cannons',
    exo: 'Enhanced Exoskeleton',
  },
  bomber: {
    artillery: 'Request Artillery Units',
    gunship: 'Request Gunships',
    planes: 'Request Bombers',
    missile: 'Request Missiles',
    satellite: 'Request Satellites',
    guide: 'Guidance Equipment',
    raid: 'Calling for Support',
    support: 'Support Equipment',
    limpet: 'Limpet Guns',
    deploy: 'Stationary Weapons',
    special: 'Special Weapons',
    tank: 'Tanks',
    ground: 'Ground Vehicles',
    heli: 'Helicopters',
    mech: 'Powered Exoskeletons',
    super: 'Special Vehicles',
  },
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

loadWeapons(active.game || DEFAULT_GAME)
