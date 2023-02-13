const $ = document.createElement.bind(document)
let active = {}
let table
let modes

const stateKeys = [
  'g',
  'm',
  'c',
  'w',
]
function readState() {
  const params = window.location.hash.slice(1).split('&')
  for(const p of params) {
    const [k, v] = p.split('=')
    if(!stateKeys.includes(k)) continue
    active[k] = v
  }
}
readState()

const cached = {}

async function loadWeapons(game) {
  const data = await fetch(`src/weapons-${game}.json`).then(res => res.json())
  table = data.weapons
  modes = data.modes
  populateModes()
  pickGame(active.g || '5')
  pickMode(active.m || 'stats')
  pickChar(active.c || 'ranger', active.w)
  populateWeapons(active.m, active.c, active.w)
}

function writeState() {
  window.location.hash = stateKeys
    .filter(k => active[k])
    .map(k => `${k}=${active[k]}`)
    .join('&')
  populateWeapons(active.m, active.c, active.w)
}

function pickGame(game) {
  const gameChanged = active.g != game
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

  if(active.gameEl) {
    active.gameEl.classList.remove('selected')
  }
  item.classList.add('selected')
  Object.assign(active, {
    g: game,
    gameEl: item,
  })

  if(gameChanged) {
    loadWeapons(game)
  }
}

function pickMode(mode) {
  const button = document
    .querySelector('#mode-button')
  button.classList.remove(...button.classList)
  button.classList.add('button')
  const m = modes.find(m => m.name.toLowerCase() === mode)
  styleButton({
    button,
    label: m ? m.name : 'Stats',
    cls: mode,
    cutPoint: 4,
  })

  const item = document
    .querySelector(`#mode-dropdown .${mode}`)

  if(active.modeEl) {
    active.modeEl.classList.remove('selected')
  }
  item.classList.add('selected')
  Object.assign(active, {
    m: mode,
    modeEl: item,
  })
}

function styleButton({
  button,
  label,
  cls,
  cutPoint,
}) {
  button.innerHTML = ''
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

  if(active.charEl) {
    active.charEl.classList.remove('selected')
  }
  item.classList.add('selected')
  Object.assign(active, {
    c: ch,
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
    li.classList.add(cat)
    if(label.startsWith('CC ')) {
      boldify(li, label, 4)
    } else {
      boldify(li, label, 2)
    }
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
    cutPoint,
  })

  active.catEl?.classList.remove('selected')
  item.classList.add('selected')
  Object.assign(active, {
    w: cat,
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
    const mLabel = mode.name
    const id = mode.name.toLowerCase()
    const item = $('a')
    item.classList.add(id)
    boldify(item, mLabel, 4)
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
  const dropHeaders = headers.slice(0, 4)
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

  const tbody = $('tbody')
  for(const weapon of weapons) {
    const row = $('tr')
    const { level, odds } = weapon
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
      const isDropped = +(odds || 100)
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
        start - spread,
        end - spread,
        level))
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
    life: weapon.life,
  }
}

function populateWeaponStats(ch, cat) {
  const extra = document.getElementById('extra')
  const weaponTable = document.getElementById('weapons-table')
  weaponTable.innerHTML = ''
  const weapons = table
    .filter(t => t.character === ch && t.category === cat)
    .map(w => {
      const obj = { ...w }
      for(const prop of scaledProps) {
        obj[prop] = getProp(w, prop)
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
  for(const header of headers) {
    if(header.iff && !header.iff(ch, cat)) {
      continue
    }
    const cell = $('th')
    cell.textContent = header.label
    theadrow.appendChild(cell)
  }
  thead.appendChild(theadrow)
  weaponTable.appendChild(thead)

  const tbody = $('tbody')
  for(const weapon of weapons) {
    const row = $('tr')
    for(const header of headers) {
      if(header.iff && !header.iff(ch, cat)) {
        continue
      }
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

function getProp(wpn, prop) {
  const value = wpn[prop]
  if(value == null) return value
  if(typeof value === 'number') {
    return value
  }
  if(value?.base != null) {
    return value.base
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

function quickDps(wpn) {
  const bDmg = burstDamage(wpn)
  const bTime = burstTime(wpn)
  return (bDmg * FPS / bTime)
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

const FPS = 60
const headers = [{
  label: '✓',
  cb: wpn => {
    if(!wpn.id) {
      return ''
    }
    const el = $('input')
    const key = `owned.${wpn.id}`
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
  label: 'Lv',
  cb: wpn => {
    const { level } = wpn
    if(level == null) {
      return '-'
    }
    const el = $('div')
    const difficulty = modes[0]
      .difficulties
      .slice(1)
      .find(d => d.drops[1] >= level)
    if(!difficulty) {
      return level
    }
    el.classList.add(difficulty.name)
    el.textContent = level
    return el
  }
}, {
  label: 'Name',
  cb: wpn => {
    const el = $('div')
    el.classList.add('name')
    el.textContent += wpn.name
    return el
  },
}, {
  label: 'Weight',
  iff: (ch, cat, wpn) => {
    return active.mode && activemode !== 'state'
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
  }
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
  cb: wpn => {
    if(!wpn.hp) {
      return '-'
    }
    return wpn.hp
  }
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
  cb: wpn => {
    if(!wpn.fuel) {
      return '-'
    }
    return wpn.fuel
  }
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
  cb: wpn => {
    if(!wpn.fuelUsage) {
      return '-'
    }
    return wpn.fuelUsage
  }
}, {
  iff: (ch, cat, wpn) => {
    if([
      'artillery',
      'planes',
      'raid',
      'particle',
      'plasma',
    ].includes(cat)) {
      return false
    }
    if(ch === 'winger' && [
      'sniper',
      'missile'
    ].includes(cat)) {
      return false
    }
    return true
  },
  label: 'Cap',
  cb: wpn => {
    if(!wpn.ammo) {
      return '-'
    }
    return wpn.ammo
  }
}, {
  iff: (ch, cat, wpn) => {
    if([
      'hammer',
      'shield',
    ].includes(cat)) {
      return true
    }
    return false
  },
  label: 'Def',
  cb: wpn => {
    if(!wpn.defense) {
      return '-'
    }
    return `${wpn.defense}%`
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
  cb: wpn => {
    if(!wpn.charge) {
      return '-'
    }
    return +(wpn.charge / FPS).toFixed(1)
  },
}, {
  iff: (ch, cat, wpn) => {
    if([
      'guide',
      'shield',
    ].includes(cat)) {
      return false
    }
    return true
  },
  label: 'Dmg',
  cb: wpn => {
    if(!wpn.damage) {
      return '-'
    }
    if(['power', 'guard'].includes(wpn.supportType)) {
      return `${wpn.damage}x`
    }
    if(wpn.damage < 1) {
      return +Math.abs(wpn.damage).toFixed(2)
    }
    let dmg = +Math.abs(wpn.damage).toFixed(1)
    if(wpn.count > 1) {
      dmg = `${dmg} x ${wpn.count}`
    }
    if(wpn.type === 'SentryGunBullet01') {
      return dmg
    }
    if(wpn.category === 'raid') {
      return dmg
    }
    if(wpn.shots > 1) {
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
  cb: wpn => {
    if(!wpn.continous) {
      return '-'
    }
    let dmg = +Math.abs(wpn.damage).toFixed(1)
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
  cb: wpn => {
    if(!wpn.radius) return '-'
    return wpn.radius
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
      'gunship',
      'satellite',
      'raid',
      'deploy',
    ].includes(cat)) {
      return true
    }
    if(ch === 'winger' && [
      'special',
    ].includes(cat)) {
      return true
    }
    if(ch === 'bomber' && [
      'missile',
    ].includes(cat)) {
      return true
    }
    return false
  },
  label: 'Shots',
  cb: wpn => {
    if(!wpn.shots) {
      return '-'
    }
    if(wpn.type === 'BombBullet01') {
      return '-'
    }
    switch(wpn.strikeType) {
      case 'bomber': {
        return `${wpn.shots} x ${wpn.units}`
      }
      default: { // Shelling
        return wpn.shots
      }
    }
  },
}, {
  iff: (ch, cat, wpn) => {
    if([
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
  label: 'P',
  cb: wpn => {
    if(wpn.piercing) {
      return '✓'
    }
    return ''
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
  label: 'RoF',
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
  }
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
  cb: wpn => {
    if(!wpn.lockTime) {
      return '-'
    }
    return +(wpn.lockTime / FPS).toFixed(2)
  }
}, {
  label: 'Rel',
  cb: wpn => {
    if(wpn.reload <= 0 || !wpn.reload) {
      return '-'
    }
    if(wpn.credits) {
      return wpn.reload
    }
    return +(wpn.reload / FPS).toFixed(2)
  }
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
    ].includes(cat)) {
      return false
    }
    return true
  },
  label: 'Acc',
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
  }
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
  cb: wpn => {
    if(!wpn.energy) {
      return '-'
    }
    return +wpn.energy.toFixed(1)
  }
}, {
  iff: (ch, cat, wpn) => {
    if([
      'artillery',
      'planes',
      'support',
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
  cb: wpn => {
    if(wpn.category === 'shield') {
      return `${wpn.range}°`
    }
    if(wpn.category === 'missile') {
      return wpn.lockRange
    }
    if(!wpn.life || !wpn.speed) {
      return '-'
    }
    return (wpn.speed * wpn.life).toFixed(0)
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
  cb: wpn => {
    const spd = (wpn.speed * FPS)
    if(spd > 10000) return '-'
    if(!spd) return '-'
    return spd.toFixed(0)
  },
}, {
  iff: (ch, cat, wpn) => {
    if([
      'guide',
    ].includes(cat)) {
      return true
    }
    return false
  },
  label: 'L.Spd',
  cb: wpn => {
    return `${wpn.guideSpeed}x`
  },
}, {
  iff: (ch, cat, wpn) => {
    if([
      'guide',
    ].includes(cat)) {
      return true
    }
    return false
  },
  label: 'L.Rng',
  cb: wpn => {
    return `${wpn.guideRange}x`
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
      'shield',
      'missile',
      'hammer',
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
      if(['guard', 'power'].includes(wpn.supportType)) {
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
    return +quickDps(wpn).toFixed(1)
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
  cb: wpn => {
    if(wpn.category === 'support') {
      if(['guard', 'power'].includes(wpn.supportType)) {
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
      'tank',
      'ground',
      'heli',
      'mech',
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
    return +tacticalDps(wpn).toFixed(1)
  },
}, {
  iff: (ch, cat, wpn) => {
    if(ch === 'ranger' && [
      'special',
    ].includes(cat)) {
      return true
    }
    if(ch !== 'winger' && cat === 'missile') {
      return true
    }
    return false
  },
  label: 'TDPS*',
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
      if(['guard', 'power'].includes(wpn.supportType)) {
        return '-'
      }
      return +(wpn.damage * wpn.duration).toFixed(1)
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
  cb: wpn => {
    if(wpn.category === 'support') {
      if(['guard', 'power'].includes(wpn.supportType)) {
        return '-'
      }
      if(wpn.ammo < 2) {
        return '-'
      }
      return +(wpn.damage * wpn.duration * wpn.ammo).toFixed(1)
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

loadWeapons(active.g || '5')
