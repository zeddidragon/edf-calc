const $ = document.createElement.bind(document)
let active = {}
let table
let modes
let characters
let charLabels
let charHeaders
let langs

function localize(prop, fallback) {
  if(typeof prop === 'string') {
    return prop
  }
  if(!prop) {
    return fallback
  }
  if(prop[active.lang]) {
    return prop[active.lang]
  }
  if(fallback) {
    return fallback
  }
  const [key] = Object.keys(prop)
  return prop[key]
}

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
  closeSaveLoad()
  isLoaded = false
  const data = await fetch(`src/weapons-${game}.json`).then(res => res.json())
  table = data.weapons
  modes = data.modes
  characters = data.classes
  charLabels = data.charLabels
  charHeaders = data.headers
  langs = data.langs
  populateLangs()
  populateCharacters()
  populateModes()
  pickLang(active.lang)
  pickGame(active.game)
  pickMode(active.mode || 'stats')
  pickChar(active.char || 'ranger', active.wpn)
  populateWeapons(active.mode, active.char, active.wpn)
  isLoaded = true
}

function writeState() {
  try {
    window.location.hash = stateKeys
      .filter(k => active[k] != null)
      .map(k => `${k}=${active[k]}`)
      .join('&')
  } catch(err) {
    console.warn(err)
  }
  populateWeapons(active.mode, active.char, active.wpn)
}

function pickLang(lang) {
  if(!langs.includes(lang)) {
    lang = langs[0]
  }
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
  if(!games.includes(game)) {
    game = '5'
  }
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
    prefix: gamePrefixes[game] || 0,
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
  if(!item) {
    return pickMode('stats')
  }

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
  prefix,
}) {
  button.innerHTML = ''
  if(!prefix) {
    for(const pfx of buttonPrefixes) {
      if(label.startsWith(pfx)) {
        prefix = pfx.length
        break
      }
    }
  }
  if(prefix) {
    button.textContent = label.slice(0, prefix)
    label = label.slice(prefix)
  }
  boldify(button, label, cutPoint)
  button.classList.add(cls)
  return button
}

function pickChar(ch, cat) {
  const chIdx = characters.indexOf(ch)
  if(chIdx < 0) {
    return pickChar(characters[0])
  }
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
  const categories = charHeaders[ch]
  if(!categories.find(c => c.category === cat)) {
    cat = null
  }
  const lang = active.lang || 'en'
  for(const cat of categories) {
    const label = localize(cat.names)
    const li = $('a')
    styleButton({
      button: li,
      label,
      cls: cat.category,
    })
    li.addEventListener('click', () => {
      pickCategory(ch, cat.category)
      writeState()
    })
    catTabs.appendChild(li)
  }

  pickCategory(ch, cat || categories[0].category)
}

function pickCategory(ch, cat) {
  const button = document
    .querySelector('#category-button')
  let item = document
    .querySelector(`#category-dropdown .${cat}`)
  cat = charHeaders[ch].find(c => c.category === cat)
  if(!item) {
    item = document
      .querySelector(`#category-dropdown a`)
    cat = charHeaders[ch][0]
  }
  button.classList.remove(...button.classList)
  button.classList.add('button')
  const cutPoint = ['spear', 'hammer'].includes(cat.category) ? 4 : 2
  styleButton({
    button,
    label: localize(cat.names),
    cls: cat.category,
  })

  button.classList.add(cat.category)

  active.catEl?.classList.remove('selected')
  item.classList.add('selected')
  Object.assign(active, {
    wpn: cat.category,
    catEl: item,
  })
}

function populateLangs() {
  const langMenu = document.getElementById('lang-dropdown')
  langMenu.innerHTML = ''
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
}

function populateCharacters() {
  const charMenu = document.getElementById('char-dropdown')
  charMenu.innerHTML = ''
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
    if(!mode.difficulties[0].dropsLow) {
      continue
    }
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
    .slice(0, 5)
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
      const contents = header.cb(weapon)
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

const scaledProps = [
  'ammo',
  'hp',
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
  'windup',
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
  const weaponTables = document.getElementById('weapon-tables')
  weaponTables.innerHTML = ''
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
  const category = charHeaders[ch].find(h => h.category === cat)
  const tables = category.tables || [category]
  for(const table of tables) {
    const thead = $('thead')
    const theadrow = $('tr')
    const weaponTable = $('table')
    const lang = active.lang || 'en'
    const wHeaders = table.headers
      .map(hd => {
        const header = headers.find(h => h.id === hd)
        if(!header) {
          throw new Error(`Header not found: ${hd}`)
        }
        return header
      })
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
  if(wpn.ammoDamageCurve || wpn.ammoCountCurve) {
    const perShot = shotDamage(wpn)
    const dmgCurve = wpn.ammoDamageCurve || 0
    const countCurve = wpn.ammoCountCurve || 0
    let sum = 0
    for(let i = 0; i < wpn.ammo; i++) {
      const x = (wpn.ammo - i) / wpn.ammo
      const count = Math.ceil(wpn.count * Math.pow(x, countCurve)) || 1
      const dmg = wpn.damage * Math.pow(x, dmgCurve)
      sum += dmg * count
    }
    return sum
  }
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
  let magTime = bursts * bTime + wpn.reload - interval + (wpn.windup || 0)
  if(wpn.lockType === 1) {
    let count = wpn.lockDist === 1 ? wpn.count : wpn.ammo
    magTime += (wpn.lockTime || 0) * count
  }
  return (mDmg * FPS / (magTime || interval))
}

const gameScopes = {
  4: '',
}

function weaponKey(wpn, type = 'owned') {
  const scope = gameScopes[active.game] || `.${active.game}`
  return `${type}${scope}.${wpn.id}`
}

const FPS = 60
const headers = [{
  id: 'checkbox',
  label: '✓',
  tooltip: 'Weapon Acquired',
  cb: wpn => {
    if(!wpn.id) {
      return ''
    }
    const { game } = active
    const el = $('input')
    const key = weaponKey(wpn)
    el.setAttribute('id', key)
    el.setAttribute('type', 'checkbox')
    if(localStorage[key] > 0) {
      el.setAttribute('checked', '1')
    }
    el.addEventListener('change', () => {
      closeSaveLoad()
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
  id: 'stars',
  label: '★',
  tooltip: 'Max Rank',
  cb: wpn => {
    if(!wpn.id) {
      return ''
    }
    const { game } = active
    const scope = gameScopes[game] || `.${game}`
    const el = $('input')
    const key = weaponKey(wpn, 'starred')
    const ownedKey = weaponKey(wpn)
    el.setAttribute('type', 'checkbox')
    if(localStorage[key] > 0) {
      el.setAttribute('checked', '1')
    }
    el.addEventListener('change', () => {
      closeSaveLoad()
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
  id: 'level',
  label: 'Lv',
  tooltip: 'Level',
  cb: wpn => {
    const { level } = wpn
    if(level == null) {
      return '-'
    }
    const el = $('div')
    const difficulty = (modes[1] || modes[0])
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
    el.textContent = Math.max(0, level)
    return el
  },
}, {
  id: 'name',
  label: 'Name',
  cb: wpn => {
    const el = $('div')
    el.classList.add('name')
    const name = localize(wpn.names, wpn.name)
    el.textContent += name
    return el
  },
}, {
  id: 'dropWeight',
  label: 'Weight',
  tooltip: 'Relative Drop Chance',
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
  id: 'unlock',
  label: '🔒',
  tooltip: 'Obtainment method',
  cb: wpn => {
    if(!wpn.unlock) {
      return '€'
    }
    if(wpn.unlock === 'box') {
      return 'Box ☢'
    }
    const el = $('div')
    el.classList.add('highOdds')
    el.textContent = 'DLC ☢'
    return el
  },
}, {
  id: 'fuseType',
  label: 'Fuse',
  cb: wpn => {
    if(!wpn.fuseType) {
      return '-'
    }
    return localize(wpn.fuseType)
  },
}, {
  id: 'hp',
  label: 'HP',
  tooltip: 'Durability',
  cb: wpn => {
    if(!wpn.hp) {
      return '-'
    }
    return wpn.hp
  },
}, {
  id: 'fuel',
  label: 'Fuel',
  tooltip: 'Fuel Capacity',
  cb: wpn => {
    if(!wpn.fuel) {
      return '-'
    }
    return wpn.fuel
  },
}, {
  id: 'fuelUse',
  label: 'Cns',
  tooltip: 'Fuel Consumption',
  cb: wpn => {
    if(wpn.fuelUsage) {
      return wpn.fuelUsage
    }
    return '-'
  },
}, {
  id: 'ammo',
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
  id: 'defense',
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
  id: 'chargeTime',
  label: 'Chg',
  tooltip: 'Charge Time',
  cb: wpn => {
    if(!wpn.charge) {
      return '-'
    }
    return +(wpn.charge / FPS).toFixed(1)
  },
}, {
  id: 'piercing',
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
  id: 'damage',
  label: 'Dmg',
  tooltip: 'Damage',
  headerClass: 'Dmg',
  starProp: 'damage',
  starProp2: 'count',
  cb: wpn => {
    if(wpn.damageRank) {
      return localize(wpn.damageRank)
    }
    if(wpn.recoveryAmount) {
      return wpn.recoveryAmount
    }
    if(!wpn.damage) {
      return '-'
    }
    if(['power', 'guard'].includes(wpn.supportType)) {
      return `${(+wpn.damage).toFixed(2)}`
    }
    if(wpn.damage < 1 && wpn.damage > -1) {
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
  id: 'damage2',
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
  id: 'shots',
  label: 'Shots',
  tooltip: 'Shots',
  cb: wpn => {
    if(wpn.units > 1) {
      return `${wpn.units} x ${wpn.shots || 1} `
    }
    return wpn.shots || 1
  },
}, {
  id: 'radius',
  label: 'Area',
  starProp: 'radius',
  cb: wpn => {
    if(!wpn.radius) return '-'
    return (+wpn.radius).toFixed(2)
  },
}, {
  id: 'subRadius',
  label: 'Area*',
  cb: wpn => {
    if(!wpn.subRadius) return '-'
    return (+wpn.subRadius).toFixed(2)
  },
}, {
  id: 'duration',
  label: 'Dur',
  tooltip: 'Duration',
  cb: wpn => {
    const seconds = wpn.fuseSeconds || wpn.durationSeconds
    if(seconds) {
      return seconds
    }
    const duration = wpn.fuse || wpn.duration
    if(!duration) return '-'
    return +(duration / FPS).toFixed(1)
  },
}, {
  id: 'interval',
  label: 'RoF',
  tooltip: 'Rate of Fire',
  starProp: 'interval',
  cb: wpn => {
    if(wpn.rof) {
      return wpn.rof
    }
    if(!wpn.interval) {
      return '-'
    }
    if(wpn.category === 'particle') {
      return +(FPS / wpn.reload).toFixed(2)
    }
    if(wpn.category == 'missile' && wpn.character === 'winger') {
      return +(FPS / wpn.reload).toFixed(2)
    }
    if(wpn.shotInterval) {
      return +(FPS / wpn.shotInterval).toFixed(2)
    }
    if(wpn.ammo < 2 && wpn.reload) {
      return '-'
    }
    if(wpn.category === 'short' && wpn.burst > 1) {
      return `- x ${wpn.burst}`
    }
    if(wpn.burst > 1 && wpn.interval > 1) {
      const burstRof = FPS / wpn.burstRate
      const rof = FPS / ((wpn.burst - 1) * wpn.burstRate + wpn.interval)
      return `${+rof.toFixed(2)} x ${wpn.burst}`
    }
    const rof = +(FPS / (wpn.interval || 1)).toFixed(2)
    if(rof === Infinity) {
      return '-'
    }
    return rof
  },
}, {
  id: 'windup',
  label: 'Delay',
  tooltip: 'Windup Time',
  starProp: 'windup',
  cb: wpn => {
    if(!wpn.windup) {
      return '-'
    }
    return +(wpn.windup / FPS).toFixed(2)
  },
}, {
  id: 'lockTime',
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
  id: 'credits',
  headerClass: 'CR',
  label: 'CR',
  tooltip: 'Credits',
  cb: wpn => {
    if(wpn.credits) {
      return '(CR)'
    }
    return ''
  },
}, {
  id: 'reload',
  headerClass: 'Rel',
  label: 'Rel',
  tooltip: 'Reload Time',
  starProp: 'reload',
  cb: wpn => {
    if(wpn.reloadSeconds) {
      return wpn.reloadSeconds
    }
    if(wpn.reload <= 0 || !wpn.reload) {
      return '-'
    }
    if(wpn.credits) {
      return wpn.reload
    }
    return +(wpn.reload / FPS).toFixed(2)
  },
}, {
  id: 'swing',
  label: 'Swing',
  tooltip: 'Swing Speed',
  cb: wpn => {
    if(!wpn.isSwing) {
      return '-'
    }
    return `${wpn.swing}x`
  },
}, {
  id: 'accuracy',
  label: 'Acc',
  tooltip: 'Accuracy',
  starProp: 'accuracy',
  cb: wpn => {
    if(wpn.accuracyRank) {
      return wpn.accuracyRank
    }
    if(!wpn.speed) return '-'
    if(wpn.accuracy == null) return '-'
    return [
      [0.0005, 'S++'],
      [0.0025, 'S+'],
      [0.01, 'A+'],
      [0.014999, 'A'],
      [0.02, 'A-'],
      [0.03, 'B+'],
      [0.05, 'B'],
      [0.10, 'B-'],
      [0.15, 'C+'],
      [0.20, 'C'],
      [0.24998, 'C-'],
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
  id: 'zoom',
  label: 'Zoom',
  cb: wpn => {
    if(!wpn.zoom) {
      return '-'
    }
    return `${+wpn.zoom.toFixed(1)}x`
  },
}, {
  id: 'energy',
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
  id: 'chargeRate',
  label: 'Chg',
  tooltip: 'Charge Rate',
  cb: wpn => {
    const {
      baseEnergy: nrg = wpn.energy,
      chargeSpeed: spd = 1.0
    } = wpn
    return (nrg * spd * FPS * 0.001).toFixed(1)
  },
}, {
  id: 'chargeEmergencyRate',
  label: 'Em.C',
  tooltip: 'Emergency Charge Rate',
  starProp: 'energy',
  cb: wpn => {
    const {
      energy: nrg,
      emergencyChargeSpeed: spd = 1.0
    } = wpn
    return (nrg * spd * FPS * 0.002).toFixed(1)
  },
}, {
  id: 'energyUse',
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
  id: 'boostUse',
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
  id: 'piercingRange',
  label: 'PtRng',
  tooltip: 'Piercing Range',
  starProp: 'speed',
  cb: wpn => {
    if(!wpn.piercing) {
      return '-'
    }
    const life = (wpn.piercingLife ? wpn.piercingLife + 1 : wpn.life) || 1
    return (wpn.speed * life).toFixed(1)
  },
}, {
  id: 'range',
  label: 'Rng',
  tooltip: 'Range',
  starProp: 'speed',
  cb: wpn => {
    if(wpn.range) {
      return wpn.range
    }
    if(wpn.searchRange) {
      return wpn.searchRange
    }
    if(wpn.shieldAngle) {
      return `+${wpn.shieldAngle}°`
    }
    if(wpn.category === 'shield') {
      return `${wpn.range}°`
    }
    if(!wpn.life || !wpn.speed) {
      return '-'
    }
    if((wpn.speed || 0) <= 0 || (wpn.life || 0) <= 0) {
      return '-'
    }
    return (wpn.speed * wpn.life).toFixed(1)
  },
}, {
  id: 'lockRange',
  label: 'Rng',
  tooltip: 'Lock-Range',
  starProp: 'lockRange',
  cb: wpn => {
    if(wpn.category === 'missile') {
      if(!wpn.lockRange) {
        return '-'
      }
      return (+wpn.lockRange).toFixed(0)
    }
    if((wpn.speed || 0) <= 0 || (wpn.life || 0) <= 0) {
      return '-'
    }
    return (wpn.speed * wpn.life).toFixed(0)
  },
}, {
  id: 'boost',
  label: 'Boost',
  tooltip: 'Boost',
  cb: wpn => {
    if(wpn.damage) {
      return `${Math.round(wpn.damage * 100) - 100}%`
    }
    return '-'
  },
}, {
  id: 'revive',
  label: 'Revive',
  tooltip: 'Revive Health %',
  cb: wpn => {
    if(wpn.revive) {
      return `${wpn.revive}%`
    }
    return '-'
  },
}, {
  id: 'healAllyBoost',
  label: 'H.NPC',
  tooltip: 'Healing Ally Boost',
  cb: wpn => {
    if(wpn.allyRecovery) {
      return `${Math.round(wpn.allyRecovery * 100)}%`
    }
    return '-'
  },
}, {
  id: 'probeRadius',
  label: 'Probe',
  tooltip: 'Pickup Radius',
  cb: wpn => {
    if(wpn.itemRange) {
      return `${Math.round(wpn.itemRange * 100 - 100)}%`
    }
    return '-'
  },
}, {
  id: 'knockdownImmunity',
  label: 'KD.Im',
  tooltip: 'Knockdown Immunity',
  cb: wpn => {
    if(wpn.isKnockImmune) {
      return '✓'
    }
    return '-'
  },
}, {
  id: 'speed',
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
    return spd.toFixed(1)
  },
}, {
  id: 'flightBoost',
  label: 'Fly',
  tooltip: 'Flight Speed',
  cb: wpn => {
    if(wpn.flightSpeedVertical) {
      return `${Math.round(wpn.flightSpeedVertical * 100)}%`
    }
    return '-'
  },
}, {
  id: 'dashForwardBoost',
  label: 'B.Fwd',
  tooltip: 'Boost Forward',
  cb: wpn => {
    if(wpn.boostForward && wpn.boostForward !== 1) {
      return `${Math.round(wpn.boostForward * 100)}%`
    }
    return '-'
  },
}, {
  id: 'dashBackwardBoost',
  label: 'B.Bwd',
  tooltip: 'Boost Backward',
  cb: wpn => {
    if(wpn.boostRear && wpn.boostRear !== 1) {
      return `${Math.round(wpn.boostRear * 100)}%`
    }
    return '-'
  },
}, {
  id: 'dashSideBoost',
  label: 'B.Side',
  tooltip: 'Boost Sideways',
  cb: wpn => {
    if(wpn.boostSide && wpn.boostSide !== 1) {
      return `${Math.round(wpn.boostSide * 100)}%`
    }
    return '-'
  },
}, {
  id: 'airControl',
  label: 'Acc',
  tooltip: 'Air Acceleration',
  cb: wpn => {
    if(wpn.airControl) {
      return `${Math.round(wpn.airControl * 100)}%`
    }
    return '-'
  },
}, {
  id: 'reloadBoost',
  label: 'Rel',
  tooltip: 'Reload Speed Boost',
  cb: wpn => {
    if(wpn.weaponReload) {
      return `${Math.round(wpn.weaponReload * 100)}%`
    }
    return '-'
  },
}, {
  id: 'hitSlowdown',
  label: 'Stun',
  tooltip: 'Hit Slowdown',
  cb: wpn => {
    if(wpn.hitSlowdown != null) {
      return `${Math.round(wpn.hitSlowdown * 100)}%`
    }
    return '-'
  },
}, {
  id: 'sprintSpeedBoost',
  label: 'Sprint',
  tooltip: 'Sprint Speed',
  cb: wpn => {
    if(wpn.sprintSpeed) {
      return `${Math.round(wpn.sprintSpeed * 100)}%`
    }
    return '-'
  },
}, {
  id: 'sprintTurnBoost',
  label: 'Swirl',
  tooltip: 'Sprint Turnspeed',
  cb: wpn => {
    if(wpn.sprintSwirl) {
      return `${Math.round(wpn.sprintSwirl * 100)}%`
    }
    return '-'
  },
}, {
  id: 'sprintAccelerationBoost',
  label: 'Acc',
  tooltip: 'Sprint Acceleration',
  cb: wpn => {
    if(wpn.sprintAcceleration) {
      return `${Math.round(wpn.sprintAcceleration * 100)}%`
    }
    return '-'
  },
}, {
  id: 'sprintHitSlowdown',
  label: 'Stun',
  tooltip: 'Sprint Hit Slowdown',
  cb: wpn => {
    if(wpn.sprintHitSlowdown != null) {
      return `${Math.round(wpn.sprintHitSlowdown * 100)}%`
    }
    return '-'
  },
}, {
  id: 'sprintBreakObstacles',
  label: 'Break',
  tooltip: 'Obstacle Destruction During Sprint',
  cb: wpn => {
    if(wpn.sprintDestruction) {
      return '✓'
    }
    return '-'
  },
}, {
  id: 'lockSpeedBoost',
  label: 'L.Spd',
  tooltip: 'Lock Speed',
  cb: wpn => {
    if(!wpn.lockTime) {
      return '-'
    }
    return `${wpn.lockTime}x`
  },
}, {
  id: 'lockRangeBoost',
  label: 'L.Rng',
  tooltip: 'Lock-Range',
  cb: wpn => {
    if(!wpn.lockRange) {
      return '-'
    }
    return `${wpn.lockRange}x`
  },
}, {
  id: 'lockMulti',
  label: 'Multi',
  tooltip: 'Multi Lock',
  cb: wpn => {
    if(wpn.isMultiLock) {
      return '✓'
    }
    return '-'
  },
}, {
  id: 'dashCount',
  label: 'Dash',
  tooltip: 'Dash Count',
  cb: wpn => {
    if(wpn.dashCount) {
      return wpn.dashCount
    }
    return '-'
  },
}, {
  id: 'boostCount',
  label: 'Boost',
  tooltip: 'Boost Count',
  cb: wpn => {
    if(wpn.boostCount) {
      return wpn.boostCount
    }
    return '-'
  },
}, {
  id: 'dashCooldown',
  label: 'D.CD',
  tooltip: 'Dash Cooldown',
  cb: wpn => {
    if(wpn.dashInterval) {
      return `${Math.round(wpn.dashInterval * 200)}%`
    }
    return '-'
  },
}, {
  id: 'boostSpeed',
  label: 'B.Spd',
  tooltip: 'Boost Speed',
  cb: wpn => {
    if(wpn.boostSpeed) {
      return `${Math.round(wpn.boostSpeed * 100)}%`
    }
    return '-'
  },
}, {
  id: 'shieldUse',
  label: 'Cns',
  tooltip: 'Shield Consumption',
  cb: wpn => {
    if(wpn.shieldConsumption) {
      return `${Math.round(wpn.shieldConsumption * 100)}%`
    }
    return '-'
  },
}, {
  id: 'shieldReflectUse',
  label: 'Rf.Cns',
  tooltip: 'Shield Reflect Consumption',
  cb: wpn => {
    if(wpn.shieldDeflectConsumption) {
      return `${Math.round(wpn.shieldDeflectConsumption * 100)}%`
    }
    return '-'
  },
}, {
  id: 'shieldKnockback',
  label: 'KB',
  tooltip: 'Shield Knockback',
  cb: wpn => {
    if(wpn.shieldKnockback) {
      return `${Math.round(wpn.shieldKnockback * 100)}%`
    }
    return '-'
  },
}, {
  id: 'equipWalkReduction',
  label: 'Eq.Walk',
  tooltip: 'Equip Weight Move Speed Reduction',
  cb: wpn => {
    if(wpn.equipWeightMoveReduction != null) {
      return `${Math.round((1 - wpn.equipWeightMoveReduction) * 100)}%`
    }
    return '-'
  },
}, {
  id: 'equipTurnReduction',
  label: 'Eq.Turn',
  tooltip: 'Equip Weight Turn Speed Reduction',
  cb: wpn => {
    if(wpn.equipWeightTurnReduction != null) {
      return `${Math.round((1 - wpn.equipWeightTurnReduction) * 100)}%`
    }
    return '-'
  },
}, {
  id: 'recoil',
  label: 'Stability',
  cb: wpn => {
    if(wpn.equipRecoil != null) {
      return `${Math.round((1 - wpn.equipRecoil) * 100)}%`
    }
    return '-'
  },
}, {
  id: 'dps',
  label: 'DPS',
  tooltip: 'Damage Per Second',
  cb: wpn => {
    if(wpn.recoveryAmount) {
      return (wpn.recoveryAmount * FPS).toFixed(1)
    }
    if(!wpn.damage) {
      return '-'
    }
    if(wpn.shotInterval) { // Turret
      return quickDps({
        ...wpn,
        shots: wpn.ammo,
        interval: wpn.shotInterval,
      })
    }
    if(wpn.ammo < 2 && !wpn.duration) {
      return '-'
    }
    if(wpn.rof) {
      return (wpn.damage * wpn.rof).toFixed()
    }
    if(wpn.burst > 100) {
      return (wpn.damage * FPS / (wpn.burstRate || 1)).toFixed(1)
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
  id: 'dps2',
  label: 'DPS*',
  tooltip: 'Damage Per Second*',
  cb: wpn => {
    if(wpn.recoveryAmount) {
      return (wpn.ammo * wpn.recoveryAmount * FPS).toFixed(1)
    }
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
  id: 'tdps',
  label: 'TDPS',
  tooltip: 'Total Damage Per Second (including reload)',
  cb: wpn => {
    if(wpn.credits) {
      return '-'
    }
    if(!wpn.damage) {
      return '-'
    }
    if(wpn.rof || wpn.reloadSeconds) {
      const ammo = wpn.ammo || 1
      const damage = wpn.damage * (wpn.count || 1)
      const duration = ((ammo / wpn.rof) || 0) + (wpn.reloadSeconds || 0)
      return ((damage * ammo) / duration).toFixed(1)
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
  id: 'tdps2',
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
  id: 'total',
  label: 'Total',
  tooltip: 'Total Damage',
  cb: wpn => {
    if(wpn.recoveryAmount) {
      return +(wpn.recoveryAmount * wpn.durationSeconds * FPS).toFixed()
    }
    if(wpn.total) {
      return wpn.total
    }
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
    if(wpn.category === 'support') {
      if(!['life', 'plasma'].includes(wpn.supportType)) {
        return '-'
      }
      return +(wpn.damage * wpn.life).toFixed(1)
    }
    if(wpn.ammoDamageCurve || wpn.ammoCountCurve) {
      return magDamage(wpn).toFixed(1)
    }
    const dump = Math.abs(wpn.damage
      * (wpn.count || 1)
      * (wpn.ammo || 1)
      * (wpn.shots || 1)
      * (wpn.units || 1))
    return +dump.toFixed(1)
  },
}, {
  id: 'total2',
  label: 'Total*',
  tooltip: 'Total Damage*',
  cb: wpn => {
    if(wpn.recoveryAmount) {
      return +(wpn.ammo * wpn.recoveryAmount * wpn.durationSeconds * FPS).toFixed()
    }
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
  '2pv2',
  '3',
  '3p',
  '41',
  '5',
  'ia',
]

const gameLabels = [
  'EDF2PV2',
  'EDF3',
  'EDF3P',
  'EDF4.1',
  'EDF5',
  'EDF:IA',
]

const gamePrefixes = {
  'ia': 4,
}

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
    prefix: gamePrefixes[g] || 0,
  })
  gameMenu.appendChild(item)
  item.addEventListener('click', () => {
    pickGame(g)
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
  console.log({ game, owned, starred })
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

loadWeapons(active.game || '5')
