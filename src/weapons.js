const $ = document.createElement.bind(document)
let active = {}
let table
let modes

const stateKeys = [
  'game',
  'mode',
  'char',
  'wpn',
  'star',
  'lang',
]
function readState() {
  const params = window.location.hash.slice(1).split('&')
  for(const p of params) {
    const [k, v] = p.split('=')
    if(!stateKeys.includes(k)) continue
    active[k] = v
  }
  // Migration of this mode's name
  if(active.mode === 'offline') {
    active.mode = 'off'
  } else if(active.mode === 'online') {
    active.mode = 'on'
  }
}
readState()

const cached = {}

let isLoaded = false
async function loadWeapons(game) {
  isLoaded = false
  const data = await fetch(`src/weapons-${game}.json`).then(res => res.json())
  table = data.weapons
  modes = data.modes
  populateModes()
  pickLang(active.lang || 'en')
  pickGame(active.game || '5')
  pickMode(active.mode || 'stats')
  pickChar(active.char || 'ranger', active.wpn)
  populateWeapons(active.mode, active.char, active.wpn)
  isLoaded = true
}

function writeState() {
  window.location.hash = stateKeys
    .filter(k => active[k] != null)
    .map(k => `${k}=${active[k]}`)
    .join('&')
  populateWeapons(active.mode, active.char, active.wpn)
}

function pickLang(lang) {
  const langChanged = active.lang != lang
  const button = document
    .getElementById('lang-button')
  button.classList.remove(...button.classList)
  button.classList.add('button')
  styleButton({
    button,
    label: lang,
    cls: lang,
  })

  const item = document
    .querySelector(`#lang-dropdown .${lang}`)

  active.langEl?.classList.remove('selected')
  item.classList.add('selected')
  Object.assign(active, {
    lang,
    langEl: item,
  })

  if(langChanged && isLoaded) {
    populateWeapons(active.mode, active.char, active.wpn)
  }
}

function pickGame(game) {
  const gameChanged = active.game != game
  const button = document
    .getElementById('game-button')
  button.classList.remove(...button.classList)
  button.classList.add('button')
  styleButton({
    button,
    label: gameLabels[games.indexOf(game)],
    cls: `edf${game}`,
    cutPoint: 4,
  })

  const item = document
    .querySelector(`#game-dropdown .edf${game}`)

  active.gameEl?.classList.remove('selected')
  item.classList.add('selected')
  Object.assign(active, {
    game: game,
    gameEl: item,
  })

  const starButton = document
    .getElementById('star-button')
  starButton.innerHTML = ''
  const dropdown = document
    .getElementById('star-dropdown')
  dropdown.innerHTML = ''
  if([5, 6].includes(+active.game)) {
    for(let i = 0; i <= 10; i++) {
      const el = $('a')
      if(i === 10) {
        el.textContent = `★${i}`
      } else {
        el.textContent = `☆${i}`
      }
      el.classList.add(`star-${i}`)
      el.addEventListener('click', () => {
        pickStar(i)
        writeState()
      })
      dropdown.appendChild(el)
    }
    pickStar(active.star == null ? 10 : active.star)
  } else {
    delete active.star
    delete active.starEl
  }

  if(gameChanged && isLoaded) {
    loadWeapons(game)
  }
}

function pickStar(star) {
  const button = document
    .getElementById('star-button')
  button.classList.remove(...button.classList)
  button.classList.add('button')
  const item = document
    .querySelector(`#star-dropdown .star-${star}`)
  styleButton({
    button,
    label: item.textContent,
    cls: `star-${star}`,
    cutPoint: 3,
  })

  active.starEl?.classList.remove('selected')
  item.classList.add('selected')
  Object.assign(active, {
    star: star,
    starEl: item,
  })
}

function pickMode(mode) {
  const button = document
    .querySelector('#mode-button')
  button.classList.remove(...button.classList)
  button.classList.add('button')
  const m = modes.find(m => m.name.toLowerCase() === mode)
  styleButton({
    button,
    label: m ? `Drops ${m.name}` : 'Stats',
    cls: mode,
    cutPoint: 4,
  })

  const item = document
    .querySelector(`#mode-dropdown .${mode}`)

  active.modeEl?.classList.remove('selected')
  item.classList.add('selected')
  Object.assign(active, {
    mode: mode,
    modeEl: item,
  })
}

const buttonPrefixes = [
  'Drops ',
  'CC ',
  'Enhanced ',
  'Request ',
  'Mid-Rg ',
]
function styleButton({
  button,
  label,
  cls,
  cutPoint,
}) {
  button.innerHTML = ''
  for(const pfx of buttonPrefixes) {
    if(label.startsWith(pfx)) {
      button.textContent = pfx
      label = label.slice(pfx.length)
      break
    }
  }
  boldify(button, label, cutPoint)
  button.classList.add(cls)
  return button
}

function pickChar(ch, cat) {
  const chIdx = characters.indexOf(ch)
  const button = document
    .querySelector(`#char-button`)
  button.classList.remove(...button.classList)
  button.classList.add('button')
  styleButton({
    button,
    label: charLabels[characters.indexOf(ch)],
    cls: ch,
    cutPoint: 3,
  })
  const item = document
    .querySelector(`#char-dropdown .${ch}`)

  active.charEl?.classList.remove('selected')
  item.classList.add('selected')
  Object.assign(active, {
    char: ch,
    charEl: item,
  })


  const catTabs = document.getElementById('category-dropdown')
  catTabs.innerHTML = ''
  const existing = new Set(table
    .filter(t => t.character === ch)
    .map(t => t.category))
  const categories = Object.keys(catLabels[ch])
    .filter(cat => existing.has(cat))
  for(const cat of categories) {
    const label = catLabels[ch][cat] || cat
    const li = $('a')
    styleButton({
      button: li,
      label,
      cls: cat,
    })
    li.addEventListener('click', () => {
      pickCategory(ch, cat)
      writeState()
    })
    catTabs.appendChild(li)
  }

  pickCategory(ch, cat || categories[0])
}

function pickCategory(ch, cat) {
  const button = document
    .querySelector('#category-button')
  let item = document
    .querySelector(`#category-dropdown .${cat}`)
  if(!item) {
    item = document
      .querySelector(`#category-dropdown a`)
    cat = item.classList[0]
  }
  button.classList.remove(...button.classList)
  button.classList.add('button')
  const cutPoint = ['spear', 'hammer'].includes(cat) ? 4 : 2
  styleButton({
    button,
    label: catLabels[ch][cat] || '',
    cls: cat,
  })

  button.classList.add(cat)

  active.catEl?.classList.remove('selected')
  item.classList.add('selected')
  Object.assign(active, {
    wpn: cat,
    catEl: item,
  })
}

function populateModes() {
  const modeMenu = document.getElementById('mode-dropdown')
  modeMenu.innerHTML = ''
  const label = 'Stats'
  const item = $('a')
  item.classList.add('stats')
  boldify(item, label, 4)
  modeMenu.appendChild(item)
  item.addEventListener('click', () => {
    pickMode('stats')
    writeState()
  })
  for(const mode of modes) {
    const mLabel = `Drops ${mode.name}`
    const id = mode.name.toLowerCase()
    const item = $('a')
    styleButton({
      button: item,
      label: mLabel,
      cls: id,
      cutPoint: 4,
    })
    modeMenu.appendChild(item)
    item.addEventListener('click', () => {
      pickMode(id)
      writeState()
    })
  }
}

function populateWeapons(m, ch, cat) {
  const mode = modes.find(mode => mode.name.toLowerCase() === m)
  if(mode) {
    populateWeaponDrops(mode, ch, cat)
  } else {
    populateWeaponStats(ch, cat)
  }
}

function missionFor(missions, min, max, v) {
  const ratio = (v - min) / (max - min)
  return Math.min(Math.max((missions - 1) * ratio, 0) + 1, missions)
}

function populateWeaponDrops(mode, ch, cat) {
  const extra = document.getElementById('extra')
  extra.textContent = ''

  const weaponTable = document.getElementById('weapons-table')
  weaponTable.innerHTML = ''
  const weapons = table
    .filter(t => t.character === ch && t.category === cat)
  const thead = $('thead')
  const theadrow = $('tr')
  const dropHeaders = headers
    .slice(0, 5)
    .filter(h => !h.iff || h.iff(ch, cat))
  for(const header of dropHeaders) {
    const cell = $('th')
    cell.textContent = header.label
    theadrow.appendChild(cell)
  }
  const { difficulties, missions } = mode

  for(const difficulty of difficulties) {
    const cell = $('th')
    cell.textContent = difficulty.name
    cell.classList.add(difficulty.name)
    cell.setAttribute('colspan', 2)
    theadrow.appendChild(cell)
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
      const contents = header.cb(weapon)
      if(contents instanceof HTMLElement) {
        cell.appendChild(contents)
      } else {
        cell.textContent = contents
      }
      cell.classList.add(header.label)
      row.appendChild(cell)
    }
    for(const difficulty of difficulties) {
      const { drops: [start, end], dropSpread: spread } = difficulty
      const isDropped = (!weaponDlc || weaponDlc === dlc)
        && +(odds || 100)
        && level >= start - spread
        && level <= end
      if(!isDropped) {
        const cell = $('td')
        cell.textContent = '-'
        cell.setAttribute('colspan', 2)
        row.appendChild(cell)
        continue
      }
      const minCell = $('td')
      const maxCell = $('td')
      minCell.textContent = Math.ceil(missionFor(
        missions,
        start,
        end,
        level))
      maxCell.textContent = Math.floor(missionFor(
        missions,
        start,
        end,
        level + spread))
      row.appendChild(minCell)
      row.appendChild(maxCell)
    }
    tbody.appendChild(row)
  }
  weaponTable.appendChild(tbody)
}

const scaledProps = [
  'ammo',
  'damage',
  'count',
  'radius',
  'interval',
  'reload',
  'accuracy',
  'speed',
  'burstRate',
  'lockRange',
  'lockTime',
  'energy',
]

function composeAttack(weapon, attack) {
  return {
    ...attack,
    damage: weapon.damage * attack.damage,
    speed: weapon.speed * attack.speed,
    piercing: weapon.piercing,
    count: weapon.count,
    life: weapon.life,
    isSwing: weapon.attacks.length > 1,
  }
}

function populateWeaponStats(ch, cat) {
  const gameHasStars = [5, 6].includes(+active.game)
  const extra = document.getElementById('extra')
  const weaponTable = document.getElementById('weapons-table')
  weaponTable.innerHTML = ''
  const weapons = table
    .filter(t => t.character === ch && t.category === cat)
    .map(w => {
      const obj = { ...w }
      for(const prop of scaledProps) {
        obj[prop] = getProp(w, prop, obj)
      }
      return obj
    })
    .flatMap(w => {
      if(w.attacks?.length) {
        return [
          { ...w, ...composeAttack(w, w.attacks[0]), name: w.name },
          ...w.attacks.slice(1).map(atk => composeAttack(w, atk)),
        ]
      }
      if(w.weapons) {
        return [w, ...w.weapons]
      }
      return [w]
    })
  const thead = $('thead')
  const theadrow = $('tr')
  const wHeaders = headers.filter(h => !h.iff || h.iff(ch, cat))
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
    const row = $('tr')
    for(const header of wHeaders) {
      const cell = $('td')
      let contents = header.cb(weapon)
      cell.classList.add(header.label)
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
  weaponTable.appendChild(tbody)
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

function shotDamage(wpn) {
  return Math.abs(wpn.damage
    * (wpn.count || 1)
    * (wpn.shots || 1)
  )
}

function burstDamage(wpn) {
  return shotDamage(wpn) * (wpn.burst || 1)
}

function burstTime(wpn) {
  return (wpn.burst || 1) * (wpn.burstRate || 0) + (wpn.interval || 1)
}

function magDamage(wpn) {
  return shotDamage(wpn) * wpn.ammo
}

function falloff(wpn, dmg) {
  return [
    (+dmg).toFixed(1),
    (dmg * wpn.falloff[0]).toFixed(1),
  ].join('~')
}

function quickDps(wpn) {
  const bDmg = burstDamage(wpn)
  const bTime = burstTime(wpn)
  const dps = (bDmg * FPS / bTime)
  return dps.toFixed(1)
}

function tacticalDps(wpn) {
  const mDmg = magDamage(wpn)
  const interval = wpn.interval || 1
  const bursts = wpn.ammo / (wpn.burst || 1)
  const bTime = burstTime(wpn)
  let magTime = bursts * bTime + wpn.reload - interval
  if(wpn.lockType === 1) {
    let count = wpn.lockDist === 1 ? wpn.count : wpn.ammo
    magTime += (wpn.lockTime || 0) * count
  }
  return (mDmg * FPS / (magTime || interval))
}

const gameScopes = {
  4: '',
}

const FPS = 60
const headers = [{
  label: '✓',
  tooltip: 'Weapon Acquired',
  cb: wpn => {
    if(!wpn.id) {
      return ''
    }
    const { game } = active
    const scope = gameScopes[game] || `.${game}`
    const el = $('input')
    const key = `owned${scope}.${wpn.id}`
    el.setAttribute('id', key)
    el.setAttribute('type', 'checkbox')
    if(localStorage[key]) {
      el.setAttribute('checked', '1')
    }
    el.addEventListener('change', () => {
      const v = 1 - (localStorage[key] || 0)
      localStorage[key] = v
      if(v) {
        el.setAttribute('checked', '1')
      } else {
        el.removeAttribute('checked')
      }
    })
    return el
  },
}, {
  iff: () => [5, 6].includes(+active.game),
  label: '★',
  tooltip: 'Max Rank',
  cb: wpn => {
    if(!wpn.id) {
      return ''
    }
    const { game } = active
    const scope = gameScopes[game] || `.${game}`
    const el = $('input')
    const key = `starred${scope}.${wpn.id}`
    const ownedKey = `owned${scope}.${wpn.id}`
    el.setAttribute('type', 'checkbox')
    if(localStorage[key]) {
      el.setAttribute('checked', '1')
    }
    el.addEventListener('change', () => {
      const owned = document.getElementById(ownedKey)
      const v = 1 - (localStorage[key] || 0)
      localStorage[key] = v
      if(v) {
        localStorage[ownedKey] = v
        owned.setAttribute('checked', '1')
        el.setAttribute('checked', '1')
      } else {
        el.removeAttribute('checked')
      }
    })
    return el
  },
}, {
  label: 'Lv',
  tooltip: 'Level',
  cb: wpn => {
    const { level } = wpn
    if(level == null) {
      return '-'
    }
    const el = $('div')
    const difficulty = modes[1]
      .difficulties
      .slice(1)
      .find(d => {
        const limits = d.weaponLimits
        if(!Array.isArray(limits)) return
        const upper = limits[limits.length - 1]
        return upper > 0 && upper >= level
      })
    if(!difficulty) {
      return level
    }
    el.classList.add(difficulty.name)
    el.textContent = level
    return el
  },
}, {
  label: 'Name',
  cb: wpn => {
    const el = $('div')
    el.classList.add('name')
    const name = wpn.names ? wpn.names[active.lang || 'en'] : wpn.name
    el.textContent += name
    return el
  },
}, {
  label: 'Weight',
  tooltip: 'Relative Drop Chance',
  iff: (ch, cat, wpn) => {
    return active.mode && active.mode !== 'stats'
  },
  cb: wpn => {
    const odds = wpn.odds || 100
    if(!+odds) {
      const el = $('div')
      if(wpn.level === 100) { // Genocide weapons
        el.classList.add('na')
        el.textContent = 'N/A'
      } else {
        el.classList.add(odds)
        el.textContent = odds.toUpperCase()
      }
      return el
    }
    const label = `${odds}%`
    if(odds !== 100) {
      const el = $('div')
      el.classList.add(odds < 100 ? 'lowOdds' : 'highOdds')
      el.textContent = label
      return el
    }
    return label
  },
}, {
  iff: (ch, cat, wpn) => {
    if([
      'bike',
      'tank',
      'ground',
      'heli',
      'mech',
      'super',
    ].includes(cat)) {
      return true
    }
    return false
  },
  label: 'HP',
  tooltip: 'Durability',
  cb: wpn => {
    if(!wpn.hp) {
      return '-'
    }
    return wpn.hp
  },
}, {
  iff: (ch, cat, wpn) => {
    if([
      'bike',
      'heli',
    ].includes(cat)) {
      return true
    }
    return false
  },
  label: 'Fuel',
  tooltip: 'Fuel Capacity',
  cb: wpn => {
    if(!wpn.fuel) {
      return '-'
    }
    return wpn.fuel
  },
}, {
  iff: (ch, cat, wpn) => {
    if([
      'bike',
      'heli',
    ].includes(cat)) {
      return true
    }
    return false
  },
  label: 'Cns',
  tooltip: 'Fuel Consumption',
  cb: wpn => {
    if(wpn.fuelUsage) {
      return wpn.fuelUsage
    }
    return '-'
  },
}, {
  iff: (ch, cat, wpn) => {
    if([
      'artillery',
      'planes',
      'raid',
      'particle',
      'equipment',
      'core',
      'booster',
      'muzzle',
      'exo',
    ].includes(cat)) {
      return false
    }
    if(ch === 'winger' && [
      'missile',
      'special',
    ].includes(cat)) {
      return false
    }
    if(active.game === '41' && ch === 'winger' && [
      'plasma',
      'sniper',
    ].includes(cat)) {
      return false
    }
    return true
  },
  label: 'Cap',
  tooltip: 'Ammo Capacity',
  starProp: 'ammo',
  cb: wpn => {
    if(wpn.shieldDurability) {
      return `${Math.round(wpn.shieldDurability * 100)}%`
    }
    if(wpn.ammo) {
      return wpn.ammo
    }
    return '-'
  },
}, {
  iff: (ch, cat, wpn) => {
    if([
      'hammer',
      'shield',
      'protector',
    ].includes(cat)) {
      return true
    }
    return false
  },
  label: 'Def',
  tooltip: 'Defense',
  cb: wpn => {
    if(wpn.shieldDamageReduction) {
      return `${Math.round((1 - wpn.shieldDamageReduction) * 100)}%`
    }
    if(wpn.defense) {
      return `${wpn.defense}%`
    }
    return '-'
  },
}, {
  iff: (ch, cat, wpn) => {
    if([
      'hammer',
    ].includes(cat)) {
      return true
    }
    return false
  },
  label: 'Chg',
  tooltip: 'Charge Time',
  cb: wpn => {
    if(!wpn.charge) {
      return '-'
    }
    return +(wpn.charge / FPS).toFixed(1)
  },
}, {
  iff: (ch, cat, wpn) => {
    if([
      'assault',
      'shotgun',
      'sniper',
      'spear',
      'heavy',
      'tank',
      'ground',
      'heli',
      'mech',
    ].includes(cat)) {
      return true
    }
    if([
      'winger',
      'bomber',
    ].includes(ch)) {
      return false
    }
    if(ch === 'ranger' && [
      'special',
    ].includes(cat)) {
      return true
    }
    return false
  },
  headerClass: 'P',
  label: 'P',
  tooltip: 'Piercing',
  cb: wpn => {
    if(wpn.piercing) {
      return '[PT]'
    }
    return ''
  },
}, {
  iff: (ch, cat, wpn) => {
    if([
      'guide',
      'shield',
      'equipment',
      'core',
      'booster',
      'protector',
      'muzzle',
      'exo',
    ].includes(cat)) {
      return false
    }
    return true
  },
  label: 'Dmg',
  tooltip: 'Damage',
  headerClass: 'Dmg',
  starProp: 'damage',
  starProp2: 'count',
  cb: wpn => {
    if(!wpn.damage) {
      return '-'
    }
    if(['power', 'guard'].includes(wpn.supportType)) {
      return `${(+wpn.damage).toFixed(2)}`
    }
    if(wpn.damage < 1) {
      return +Math.abs(wpn.damage).toFixed(2)
    }
    let dmg = +Math.abs(wpn.damage).toFixed(1)
    if(wpn.falloff) {
      dmg = falloff(wpn, dmg)
    }
    if(wpn.count > 1) {
      dmg = `${dmg} x ${wpn.count}`
    }
    if(wpn.type === 'SentryGunBullet01') {
      return dmg
    }

    const ignoreShots = [
      'raid',
      'artillery',
      'gunship',
      'planes',
      'missile',
      'satellite',
    ].includes(wpn.category) || (
      wpn.character === 'winger' && [
        'special',
      ].includes(wpn.category))
    if(wpn.shots > 1 && !ignoreShots) {
      dmg = `${dmg} x ${wpn.shots}`
    }
    return dmg
  },
}, {
  iff: (ch, cat, wpn) => {
    if(ch === 'ranger' && [
      'special',
    ].includes(cat)) {
      return true
    }
    return false
  },
  label: 'Dmg*',
  tooltip: 'Damage*',
  cb: wpn => {
    if(!wpn.continous) {
      return '-'
    }
    let dmg = Math.abs(wpn.damage)
    return +Math.abs(dmg * wpn.duration).toFixed(1)
  },
}, {
  iff: (ch, cat, wpn) => {
    if(cat === 'special' && [
      'winger',
      'bomber',
    ].includes(ch)) {
      return false
    }
    if([
      'rocket',
      'grenade',
      'missile',
      'special',
      'plasma',
      'hammer',
      'heavy',
      'raid',
      'support',
      'limpet',
      'deploy',
      'tank',
      'ground',
      'heli',
      'mech',
    ].includes(cat)) {
      return true
    }
    return false
  },
  label: 'Area',
  starProp: 'radius',
  cb: wpn => {
    if(!wpn.radius) return '-'
    return (+wpn.radius).toFixed(2)
  },
}, {
  iff: (ch, cat, wpn) => {
    if([
      'support',
      'grenade',
    ].includes(cat)) {
      return true
    }
    if(ch === 'winger' && [
      'special',
    ].includes(cat)) {
      return true
    }
    return false
  },
  label: 'Dur',
  tooltip: 'Duration',
  cb: wpn => {
    const duration = wpn.fuse || wpn.duration
    if(!duration) return '-'
    return +(duration / FPS).toFixed(1)
  },
}, {
  iff: (ch, cat, wpn) => {
    if([
      'artillery',
      'planes',
      'raid',
      'support',
      'hammer',
      'shield',
      'equipment',
      'core',
      'booster',
      'protector',
      'muzzle',
      'exo',
    ].includes(cat)) {
      return false
    }
    if(ch === 'winger' && [
      'special',
    ].includes(cat)) {
      return false
    }
    if(ch === 'bomber' && [
      'missile',
    ].includes(cat)) {
      return false
    }
    return true
  },
  label: 'RoF',
  tooltip: 'Rate of Fire',
  starProp: 'interval',
  cb: wpn => {
    if(!wpn.interval) {
      return '-'
    }
    if(wpn.category === 'particle') {
      return +(FPS / wpn.reload).toFixed(2)
    }
    if(wpn.category == 'missile' && wpn.character === 'winger') {
      return +(FPS / wpn.reload).toFixed(2)
    }
    if(wpn.ammo < 2 && wpn.reload) {
      return '-'
    }
    if(wpn.burst > 1 && wpn.interval > 1) {
      const burstRof = FPS / wpn.burstRate
      const rof = FPS / ((wpn.burst - 1) * wpn.burstRate + wpn.interval)
      return `${+rof.toFixed(2)} x ${wpn.burst}`
    }
    if(wpn.shotInterval) {
      return +(FPS / wpn.shotInterval).toFixed(2)
    }
    const rof = +(FPS / (wpn.interval || 1)).toFixed(2)
    if(rof === Infinity) {
      return '-'
    }
    return rof
  },
}, {
  iff: (ch, cat, wpn) => {
    if(ch === 'bomber' && [
      'missile',
    ].includes(cat)) {
      return false
    }
    if([
      'missile',
      'homing',
      'bike',
      'ground',
      'heli',
      'mech',
    ].includes(cat)) {
      return true
    }
    return false
  },
  label: 'Lock',
  tooltip: 'Lock Time',
  starProp: 'lockTime',
  cb: wpn => {
    if(!wpn.lockTime) {
      return '-'
    }
    return +(wpn.lockTime / FPS).toFixed(2)
  },
}, {
  iff: (ch, cat, wpn) => {
    if([
      'equipment',
      'booster',
      'protector',
      'muzzle',
      'core',
      'exo',
    ].includes(cat)) {
      return false
    }
    return true
  },
  label: 'Rel',
  tooltip: 'Reload Time',
  starProp: 'reload',
  cb: wpn => {
    if(wpn.reload <= 0 || !wpn.reload) {
      return '-'
    }
    if(wpn.credits) {
      return wpn.reload
    }
    return +(wpn.reload / FPS).toFixed(2)
  },
}, {
  iff: (ch, cat, wpn) => {
    return false
    if([
      'spear',
    ].includes(cat)) {
      return true
    }
    return false
  },
  label: 'Swing',
  tooltip: 'Swing Speed',
  cb: wpn => {
    if(!wpn.isSwing) {
      return '-'
    }
    return `${wpn.swing}x`
  },
}, {
  iff: (ch, cat, wpn) => {
    if([
      'missile',
      'special',
      'artillery',
      'planes',
      'raid',
      'deploy',
      'hammer',
      'spear',
      'shield',
      'equipment',
      'core',
      'booster',
      'protector',
      'muzzle',
      'exo',
    ].includes(cat)) {
      return false
    }
    return true
  },
  label: 'Acc',
  tooltip: 'Accuracy',
  starProp: 'accuracy',
  cb: wpn => {
    if(!wpn.speed) return '-'
    if(wpn.accuracy == null) return '-'
    return [
      [0.0005, 'S++'],
      [0.0025, 'S+'],
      [0.01, 'A+'],
      [0.015, 'A'],
      [0.02, 'A-'],
      [0.03, 'B+'],
      [0.05, 'B'],
      [0.10, 'B-'],
      [0.15, 'C+'],
      [0.20, 'C'],
      [0.25, 'C-'],
      [0.3, 'D'],
      [0.4, 'E'],
      [0.5, 'F'],
      [0.6, 'G'],
      [0.8, 'I'],
      [1.0, 'J'],
      [1.2, 'K'],
      [1.6, 'L'],
      [Infinity, 'Z'],
    ].find(([a]) => a >= wpn.accuracy)[1]
  },
}, {
  iff: (ch, cat, wpn) => {
    if(cat === 'shield') {
      return true
    }
    if(ch === 'winger') {
      return true
    }
    return false
  },
  label: 'Enr',
  tooltip: 'Energy',
  starProp: 'energy',
  cb: wpn => {
    if(!wpn.energy) {
      return '-'
    }
    return +wpn.energy.toFixed(1)
  },
}, {
  iff: (ch, cat, wpn) => {
    if([
      'core',
    ].includes(cat)) {
      return true
    }
    return false
  },
  label: 'Chg',
  tooltip: 'Charge Speed',
  cb: wpn => {
    const {
      baseEnergy: nrg = wpn.energy,
      chargeSpeed: spd = 1.0
    } = wpn
    return (nrg * spd * FPS * 0.001).toFixed(1)
  },
}, {
  iff: (ch, cat, wpn) => {
    if([
      'core',
    ].includes(cat)) {
      return true
    }
    return false
  },
  label: 'Em.C',
  tooltip: 'Emergency Charge Speed',
  starProp: 'energy',
  cb: wpn => {
    const {
      energy: nrg,
      emergencyChargeSpeed: spd = 1.0
    } = wpn
    return (nrg * spd * FPS * 0.002).toFixed(1)
  },
}, {
  iff: (ch, cat, wpn) => {
    if([
      'core',
    ].includes(cat)) {
      return true
    }
    return false
  },
  label: 'Cns',
  tooltip: 'Flight Consumption',
  cb: wpn => {
    const {
      baseEnergy: nrg = wpn.energy,
      flightConsumption: usg = 1.0
    } = wpn
    return (nrg * usg * FPS * 0.0025).toFixed(1)
  },
}, {
  iff: (ch, cat, wpn) => {
    if([
      'core',
    ].includes(cat)) {
      return true
    }
    return false
  },
  label: 'B.Cns',
  tooltip: 'Boost Consumption',
  cb: wpn => {
    const {
      baseEnergy: nrg = wpn.energy,
      boostConsumption: usg = 1.0
    } = wpn
    return (nrg * usg * 0.03).toFixed(1)
  },
}, {
  iff: (ch, cat, wpn) => {
    if([
      'artillery',
      'planes',
      'support',
      'equipment',
      'core',
      'booster',
      'muzzle',
      'exo',
      'rocket',
      'missile',
    ].includes(cat)) {
      return false
    }
    if(ch === 'winger' && [
      'special',
    ].includes(cat)) {
      return false
    }
    return true
  },
  label: 'Rng',
  tooltip: 'Range',
  starProp: 'speed',
  cb: wpn => {
    if(wpn.shieldAngle) {
      return `+${wpn.shieldAngle}°`
    }
    if(wpn.category === 'shield') {
      return `${wpn.range}°`
    }
    if(!wpn.life || !wpn.speed) {
      return '-'
    }
    return (wpn.speed * wpn.life).toFixed(0)
  },
}, {
  iff: (ch, cat, wpn) => {
    if([
      'missile',
    ].includes(cat)) {
      return true
    }
    return false
  },
  label: 'Rng',
  tooltip: 'Lock-Range',
  starProp: 'lockRange',
  cb: wpn => {
    if(wpn.category === 'missile') {
      return (+wpn.lockRange).toFixed(0)
    }
    return (wpn.speed * wpn.life).toFixed(0)
  },
}, {
  iff: (ch, cat, wpn) => {
    if([
      'equipment',
    ].includes(cat)) {
      return true
    }
    return false
  },
  label: 'H.NPC',
  tooltip: 'Healing Ally Boost',
  cb: wpn => {
    if(wpn.allyRecovery) {
      return `${Math.round(wpn.allyRecovery * 100)}%`
    }
    return '-'
  },
}, {
  iff: (ch, cat, wpn) => {
    if([
      'equipment',
    ].includes(cat)) {
      return true
    }
    return false
  },
  label: 'Probe',
  tooltip: 'Pickup Radius',
  cb: wpn => {
    if(wpn.itemRange) {
      return `${Math.round(wpn.itemRange * 100 - 100)}%`
    }
    return '-'
  },
}, {
  iff: (ch, cat, wpn) => {
    if([
      'equipment',
    ].includes(cat)) {
      return true
    }
    return false
  },
  label: 'KD.Im',
  tooltip: 'Knockdown Immunity',
  cb: wpn => {
    if(wpn.isKnockImmune) {
      return '✓'
    }
    return '-'
  },
}, {
  iff: (ch, cat, wpn) => {
    if([
      'hammer',
      'spear',
      'artillery',
      'planes',
      'raid',
      'missile',
      'shield',
      'booster',
      'protector',
      'muzzle',
    ].includes(cat)) {
      return false
    }
    if(ch === 'winger' && [
      'special',
    ].includes(cat)) {
      return false
    }
    return true
  },
  label: 'Spd',
  tooltip: 'Move Speed',
  starProp: 'speed',
  cb: wpn => {
    if(wpn.walkSpeed) {
      return `${Math.round(wpn.walkSpeed * 100)}%`
    }
    if(wpn.flightSpeedHorizontal) {
      return `${Math.round(wpn.flightSpeedHorizontal * 100)}%`
    }
    const spd = (wpn.speed * FPS)
    if(spd > 10000) return '-'
    if(!spd) return '-'
    return spd.toFixed(0)
  },
}, {
  iff: (ch, cat, wpn) => {
    if([
      'core',
    ].includes(cat)) {
      return true
    }
    return false
  },
  label: 'Fly',
  tooltip: 'Flight Speed',
  cb: wpn => {
    if(wpn.flightSpeedVertical) {
      return `${Math.round(wpn.flightSpeedVertical * 100)}%`
    }
    return '-'
  },
}, {
  iff: (ch, cat, wpn) => {
    if([
      'core',
    ].includes(cat)) {
      return true
    }
    return false
  },
  label: 'B.Fwd',
  tooltip: 'Boost Forward',
  cb: wpn => {
    if(wpn.boostForward && wpn.boostForward !== 1) {
      return `${Math.round(wpn.boostForward * 100)}%`
    }
    return '-'
  },
}, {
  iff: (ch, cat, wpn) => {
    if([
      'core',
    ].includes(cat)) {
      return true
    }
    return false
  },
  label: 'B.Bwd',
  tooltip: 'Boost Backward',
  cb: wpn => {
    if(wpn.boostRear && wpn.boostRear !== 1) {
      return `${Math.round(wpn.boostRear * 100)}%`
    }
    return '-'
  },
}, {
  iff: (ch, cat, wpn) => {
    if([
      'core',
    ].includes(cat)) {
      return true
    }
    return false
  },
  label: 'B.Side',
  tooltip: 'Boost Sideways',
  cb: wpn => {
    if(wpn.boostSide && wpn.boostSide !== 1) {
      return `${Math.round(wpn.boostSide * 100)}%`
    }
    return '-'
  },
}, {
  iff: (ch, cat, wpn) => {
    if([
      'core',
    ].includes(cat)) {
      return true
    }
    return false
  },
  label: 'Acc',
  tooltip: 'Air Acceleration',
  cb: wpn => {
    if(wpn.airControl) {
      return `${Math.round(wpn.airControl * 100)}%`
    }
    return '-'
  },
}, {
  iff: (ch, cat, wpn) => {
    if([
      'core',
    ].includes(cat)) {
      return true
    }
    return false
  },
  label: 'Rel',
  tooltip: 'Reload Speed Boost',
  cb: wpn => {
    if(wpn.weaponReload) {
      return `${Math.round(wpn.weaponReload * 100)}%`
    }
    return '-'
  },
}, {
  iff: (ch, cat, wpn) => {
    if([
      'equipment',
    ].includes(cat)) {
      return true
    }
    return false
  },
  label: 'Stun',
  tooltip: 'Hit Slowdown',
  cb: wpn => {
    if(wpn.hitSlowdown != null) {
      return `${Math.round(wpn.hitSlowdown * 100)}%`
    }
    return '-'
  },
}, {
  iff: (ch, cat, wpn) => {
    if([
      'equipment',
    ].includes(cat)) {
      return true
    }
    return false
  },
  label: 'Sprint',
  tooltip: 'Sprint Speed',
  cb: wpn => {
    if(wpn.sprintSpeed) {
      return `${Math.round(wpn.sprintSpeed * 100)}%`
    }
    return '-'
  },
}, {
  iff: (ch, cat, wpn) => {
    if([
      'equipment',
    ].includes(cat)) {
      return true
    }
    return false
  },
  label: 'Swirl',
  tooltip: 'Sprint Turnspeed',
  cb: wpn => {
    if(wpn.sprintSwirl) {
      return `${Math.round(wpn.sprintSwirl * 100)}%`
    }
    return '-'
  },
}, {
  iff: (ch, cat, wpn) => {
    if([
      'equipment',
    ].includes(cat)) {
      return true
    }
    return false
  },
  label: 'Acc',
  tooltip: 'Sprint Acceleration',
  cb: wpn => {
    if(wpn.sprintAcceleration) {
      return `${Math.round(wpn.sprintAcceleration * 100)}%`
    }
    return '-'
  },
}, {
  iff: (ch, cat, wpn) => {
    if([
      'equipment',
    ].includes(cat)) {
      return true
    }
    return false
  },
  label: 'Stun',
  tooltip: 'Sprint Hit Slowdown',
  cb: wpn => {
    if(wpn.sprintHitSlowdown != null) {
      return `${Math.round(wpn.sprintHitSlowdown * 100)}%`
    }
    return '-'
  },
}, {
  iff: (ch, cat, wpn) => {
    if([
      'equipment',
    ].includes(cat)) {
      return true
    }
    return false
  },
  label: 'Break',
  tooltip: 'Obstacle Destruction During Sprint',
  cb: wpn => {
    if(wpn.sprintDestruction) {
      return '✓'
    }
    return '-'
  },
}, {
  iff: (ch, cat, wpn) => {
    if([
      'guide',
      'equipment',
    ].includes(cat)) {
      return true
    }
    return false
  },
  label: 'L.Spd',
  tooltip: 'Lock Speed',
  cb: wpn => {
    if(!wpn.lockTime) {
      return '-'
    }
    return `${wpn.lockTime}x`
  },
}, {
  iff: (ch, cat, wpn) => {
    if([
      'guide',
      'equipment',
    ].includes(cat)) {
      return true
    }
    return false
  },
  label: 'L.Rng',
  tooltip: 'Lock Range',
  cb: wpn => {
    if(!wpn.lockRange) {
      return '-'
    }
    return `${wpn.lockRange}x`
  },
}, {
  iff: (ch, cat, wpn) => {
    if([
      'equipment',
    ].includes(cat)) {
      return true
    }
    return false
  },
  label: 'Multi',
  tooltip: 'Multi Lock',
  cb: wpn => {
    if(wpn.isMultiLock) {
      return '✓'
    }
    return '-'
  },
}, {
  iff: (ch, cat, wpn) => {
    if([
      'booster',
      'exo',
    ].includes(cat)) {
      return true
    }
    return false
  },
  label: 'Dash',
  tooltip: 'Dash Count',
  cb: wpn => {
    if(wpn.dashCount) {
      return wpn.dashCount
    }
    return '-'
  },
}, {
  iff: (ch, cat, wpn) => {
    if([
      'booster',
    ].includes(cat)) {
      return true
    }
    return false
  },
  label: 'Boost',
  tooltip: 'Boost Count',
  cb: wpn => {
    if(wpn.boostCount) {
      return wpn.boostCount
    }
    return '-'
  },
}, {
  iff: (ch, cat, wpn) => {
    if([
      'booster',
    ].includes(cat)) {
      return true
    }
    return false
  },
  label: 'D.CD',
  tooltip: 'Dash Cooldown',
  cb: wpn => {
    if(wpn.dashInterval) {
      return `${Math.round(wpn.dashInterval * 200)}%`
    }
    return '-'
  },
}, {
  iff: (ch, cat, wpn) => {
    if([
      'booster',
    ].includes(cat)) {
      return true
    }
    return false
  },
  label: 'B.Spd',
  tooltip: 'Boost Speed',
  cb: wpn => {
    if(wpn.boostSpeed) {
      return `${Math.round(wpn.boostSpeed * 100)}%`
    }
    return '-'
  },
}, {
  iff: (ch, cat, wpn) => {
    if([
      'protector',
    ].includes(cat)) {
      return true
    }
    return false
  },
  label: 'Cns',
  tooltip: 'Shield Consumption',
  cb: wpn => {
    if(wpn.shieldConsumption) {
      return `${Math.round(wpn.shieldConsumption * 100)}%`
    }
    return '-'
  },
}, {
  iff: (ch, cat, wpn) => {
    if([
      'protector',
    ].includes(cat)) {
      return true
    }
    return false
  },
  label: 'Rf.Cns',
  tooltip: 'Shield Reflect Consumption',
  cb: wpn => {
    if(wpn.shieldDeflectConsumption) {
      return `${Math.round(wpn.shieldDeflectConsumption * 100)}%`
    }
    return '-'
  },
}, {
  iff: (ch, cat, wpn) => {
    if([
      'protector',
    ].includes(cat)) {
      return true
    }
    return false
  },
  label: 'KB',
  tooltip: 'Shield Knockback',
  cb: wpn => {
    if(wpn.shieldKnockback) {
      return `${Math.round(wpn.shieldKnockback * 100)}%`
    }
    return '-'
  },
}, {
  iff: (ch, cat, wpn) => {
    if([
      'exo',
    ].includes(cat)) {
      return true
    }
    return false
  },
  label: 'Eq.Walk',
  tooltip: 'Equip Weight Move Speed Reduction',
  cb: wpn => {
    if(wpn.equipWeightMoveReduction != null) {
      return `${Math.round((1 - wpn.equipWeightMoveReduction) * 100)}%`
    }
    return '-'
  },
}, {
  iff: (ch, cat, wpn) => {
    if([
      'exo',
    ].includes(cat)) {
      return true
    }
    return false
  },
  label: 'Eq.Turn',
  tooltip: 'Equip Weight Turn Speed Reduction',
  cb: wpn => {
    if(wpn.equipWeightTurnReduction != null) {
      return `${Math.round((1 - wpn.equipWeightTurnReduction) * 100)}%`
    }
    return '-'
  },
}, {
  iff: (ch, cat, wpn) => {
    if([
      'muzzle',
      'exo',
    ].includes(cat)) {
      return true
    }
    return false
  },
  label: 'Stability',
  cb: wpn => {
    if(wpn.equipRecoil != null) {
      return `${Math.round((1 - wpn.equipRecoil) * 100)}%`
    }
    return '-'
  },
}, {
  iff: (ch, cat, wpn) => {
    if([
      'particle',
      'plasma',
      'guide',
      'artillery',
      'planes',
      'raid',
      'limpet',
      'shield',
      'missile',
      'hammer',
      'equipment',
      'core',
      'booster',
      'protector',
      'muzzle',
      'exo',
    ].includes(cat)) {
      return false
    }
    if(ch === 'winger' && [
      'sniper',
    ].includes(cat)) {
      return false
    }
    if(ch === 'bomber' && [
      'special',
    ].includes(cat)) {
      return false
    }
    return true
  },
  label: 'DPS',
  tooltip: 'Damage Per Second',
  cb: wpn => {
    if(!wpn.damage) {
      return '-'
    }
    if(wpn.ammo < 2 && !wpn.duration) {
      return '-'
    }
    if(wpn.shotInterval) { // Turret
      return quickDps({
        ...wpn,
        shots: 1,
        interval: wpn.shotInterval,
      })
    }
    if(wpn.burst > 100) {
      return wpn.damage * FPS / wpn.burstRate
    }
    if(wpn.category === 'support') {
      if(!['life', 'plasma'].includes(wpn.supportType)) {
        return '-'
      }
      return +(wpn.damage * FPS).toFixed(1)
    }
    if(wpn.duration && !wpn.continous) {
      const bDmg = burstDamage(wpn)
      return +(bDmg * FPS / wpn.duration).toFixed(1)
    }
    if(!wpn.interval) {
      return '-'
    }
    return quickDps(wpn)
  },
}, {
  iff: (ch, cat, wpn) => {
    if([
      'support',
      'deploy',
    ].includes(cat)) {
      return true
    }
    if(ch === 'ranger' && [
      'special',
    ].includes(cat)) {
      return true
    }
    return false
  },
  label: 'DPS*',
  tooltip: 'Damage Per Second*',
  cb: wpn => {
    if(wpn.category === 'support') {
      if(!['life', 'plasma'].includes(wpn.supportType)) {
        return '-'
      }
      if(wpn.ammo < 2) {
        return '-'
      }
      return +(wpn.damage * FPS * wpn.ammo).toFixed(1)
    }
    if(wpn.shotInterval) { // Turret
      return quickDps({
        ...wpn,
        shots: wpn.ammo,
        interval: wpn.shotInterval,
      })
    }
    if(wpn.continous) {
      return +Math.abs((wpn.damage
        * wpn.duration
        * FPS
        / (wpn.interval || 1)
      )).toFixed(1)
    }
    return '-'
  },
}, {
  iff: (ch, cat, wpn) => {
    if([
      'bike',
      'guide',
      'artillery',
      'planes',
      'raid',
      'support',
      'hammer',
      'shield',
      'limpet',
      'tank',
      'ground',
      'heli',
      'mech',
      'equipment',
      'core',
      'booster',
      'protector',
      'muzzle',
      'exo',
    ].includes(cat)) {
      return false
    }
    if(ch === 'bomber' && [
      'special',
    ].includes(cat)) {
      return false
    }
    return true
  },
  label: 'TDPS',
  tooltip: 'Total Damage Per Second (including reload)',
  cb: wpn => {
    if(!wpn.damage) {
      return '-'
    }
    if(!wpn.ammo) {
      return '-'
    }
    if(wpn.attacks?.length) {
      return '-'
    }
    if(wpn.reload < 0) {
      return '-'
    }
    if(wpn.shotInterval) { // Turret
      return +tacticalDps({
        ...wpn,
        shots: wpn.ammo,
        interval: wpn.shotInterval,
        ammo: wpn.shots,
      }).toFixed(1)
    }
    const tdps = tacticalDps(wpn)
    return tdps.toFixed(1)
  },
}, {
  iff: (ch, cat, wpn) => {
    if(ch === 'ranger' && [
      'special',
      'booster',
    ].includes(cat)) {
      return true
    }
    if(cat === 'missile' && ![
      'winger',
      'bomber',
    ].includes(ch)) {
      return true
    }
    return false
  },
  label: 'TDPS*',
  tooltip: 'Total Damage Per Second (including reload)*',
  cb: wpn => {
    if(wpn.continous) { // Flamethrower
      return +(tacticalDps(wpn) * wpn.duration).toFixed(1)
    }
    if(wpn.lockType === 1) {
      return +tacticalDps({
        ...wpn,
        lockType: 0,
      }).toFixed(1)
    }
    return '-'
  },
}, {
  iff: (ch, cat, wpn) => {
    if([
      'guide',
      'hammer',
      'shield',
      'equipment',
      'core',
      'booster',
      'protector',
      'muzzle',
      'exo',
    ].includes(cat)) {
      return false
    }
    if(ch === 'bomber' && [
      'special',
    ].includes(cat)) {
      return false
    }
    return true
  },
  label: 'Total',
  tooltip: 'Total Damage',
  cb: wpn => {
    if(wpn.attacks?.length) {
      const attacks = wpn.attacks.map(a => a.damage * wpn.damage)
      const dump = Array(wpn.ammo)
        .fill(0)
        .map((w, i) => attacks[i % attacks.length])
        .reduce((dmg, sum) => dmg + sum, 0)
      return +(dump * (wpn.count || 1)).toFixed(1)
    }
    if(!wpn.damage) {
      return '-'
    }
    if(!wpn.ammo) {
      return '-'
    }
    if(wpn.category === 'support') {
      if(!['life', 'plasma'].includes(wpn.supportType)) {
        return '-'
      }
      return +(wpn.damage * wpn.life).toFixed(1)
    }
    const dump = Math.abs(wpn.damage
      * (wpn.count || 1)
      * (wpn.ammo || 1)
      * (wpn.shots || 1)
      * (wpn.units || 1))
    return +dump.toFixed(1)
  },
}, {
  iff: (ch, cat, wpn) => {
    if([
      'support',
    ].includes(cat)) {
      return true
    }
    if(ch === 'ranger' && [
      'special',
    ].includes(cat)) {
      return true
    }
    return false
  },
  label: 'Total*',
  tooltip: 'Total Damage*',
  cb: wpn => {
    if(wpn.category === 'support') {
      if(!['life', 'plasma'].includes(wpn.supportType)) {
        return '-'
      }
      if(wpn.ammo < 2) {
        return '-'
      }
      return +(wpn.damage * wpn.life * wpn.ammo).toFixed(1)
    }
    if(wpn.continous) {
      const dump = Math.abs(wpn.damage
        * (wpn.count || 1)
        * wpn.ammo
        * (wpn.shots || 1)
        * (wpn.units || 1))
      return +(dump * wpn.duration).toFixed(1)
    }
    return '-'
  },
}]

const games = [
  '41',
  '5',
]

const gameLabels = [
  'EDF4.1',
  'EDF5',
]

const gameMenu = document.getElementById('game-dropdown')
for(let i = 0; i < games.length; i++) {
  const g = games[i]
  const gLabel = gameLabels[i]
  const item = $('a')
  styleButton({
    button: item,
    label: gLabel,
    cls: `edf${g}`,
    cutPoint: 4,
  })
  gameMenu.appendChild(item)
  item.addEventListener('click', () => {
    pickGame(g)
    writeState()
  })
}

const characters = [
  'ranger',
  'winger',
  'fencer',
  'bomber',
]

const charLabels = [
  'Ranger',
  'Wing Diver',
  'Fencer',
  'Air Raider',
]

const charMenu = document.getElementById('char-dropdown')
for(let i = 0; i < characters.length; i++) {
  const c = characters[i]
  const cLabel = charLabels[i]
  const item = $('a')
  styleButton({
    button: item,
    label: cLabel,
    cls: c,
    cutPoint: 3,
  })
  charMenu.appendChild(item)
  item.addEventListener('click', () => {
    pickChar(c)
    writeState()
  })
}

const langs = [
  'en',
  'ja',
]

const langMenu = document.getElementById('lang-dropdown')
for(const lang of langs) {
  const item = $('a')
  styleButton({
    button: item,
    label: lang,
    cls: lang,
  })
  langMenu.appendChild(item)
  item.addEventListener('click', () => {
    pickLang(lang)
    writeState()
  })
}

function boldify(el, str, cutPoint=2) {
  const bolded = str.slice(0, cutPoint)
  const rem = str.slice(cutPoint)
  const bold = $('b')
  bold.textContent = bolded
  el.appendChild(bold)
  el.innerHTML += rem
  return el
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

loadWeapons(active.game || '5')
