const $ = document.createElement.bind(document)
let active = {}
let table

fetch('src/weapons-41.json')
  .then(res => res.json())
  .then(data => {
    table = data
    pickChar('ranger')
  })

function pickChar(ch, cat) {
  const chIdx = characters.indexOf(ch)
  const item = document
    .querySelector(`#char-tabs .${ch}`)

  if(active.charEl) {
    active.charEl.classList.remove('selected')
  }
  item.classList.add('selected')
  Object.assign(active, {
    ch,
    charEl: item,
  })

  const catTabs = document.getElementById('category-tabs')
  catTabs.innerHTML = ''
  const supTabs = document.getElementById('support-tabs')
  supTabs.innerHTML = ''
  const from = chIdx * 10
  const to = from + 10
  for(let i = from; i < to; i++) {
    const cat = categories[i]
    if(!cat) continue
    const label = catLabels[i]
    const li = $('a')
    li.classList.add(cat)
    if(label === 'CC Strikers' || label === 'CC Piercers') {
      boldify(li, label, 4)
    } else {
      boldify(li, label, 2)
    }
    li.addEventListener('click', () => pickCategory(ch, cat))
    if(supports.includes(cat)) {
      supTabs.appendChild(li)
    } else {
      catTabs.appendChild(li)
    }
  }

  pickCategory(ch, cat || categories[from])
}

function pickCategory(ch, cat) {
  const item = document
    .querySelector(`#category-tabs .${cat}, #support-tabs .${cat}`)

  if(active.catEl) {
    active.catEl.classList.remove('selected')
  }
  item.classList.add('selected')
  Object.assign(active, {
    cat,
    catEl: item,
  })
  populateWeapons(ch, cat)
}

function populateWeapons(ch, cat) {
  const extra = document.getElementById('extra')
  const weaponTable = document.getElementById('weapons-table')
  weaponTable.innerHTML = ''
  const weapons = table
    .filter(t => t.character === ch && t.category === cat)
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
  } else {
    extra.innerHTML = ''
  }
}

const FPS = 60
const headers = [{
  label: '✓',
  cb: wpn => {
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
    if(wpn.level === 100) {
      return '-'
    }
    return wpn.level
  }
}, {
  label: 'Name',
  cb: wpn => {
    const el = $('div')
    el.classList.add('name')
    el.textContent = wpn.name
    return el
  },
}, {
  iff: (ch, cat, wpn) => {
    if([
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
  cb: wpn => wpn.ammo,
}, {
  iff: (ch, cat, wpn) => {
    if([
      'guide',
      'shield',
      'tank',
      'ground',
      'heli',
      'mech',
    ].includes(cat)) {
      return false
    }
    return true
  },
  label: 'Dmg',
  cb: wpn => {
    if(wpn.damage < 1) {
      return +(wpn.damage).toFixed(2)
    }
    let dmg = +Math.abs(wpn.damage).toFixed(1)
    if(!dmg) {
      return '-'
    }
    if(wpn.count > 1) {
      dmg = `${+dmg.toFixed(1)} x ${wpn.count}`
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
    return +(dmg * wpn.duration).toFixed(1)
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
      'heavy',
      'raid',
      'support',
      'limpet',
      'deploy',
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
    return false
  },
  label: 'Shots',
  cb: wpn => {
    switch(wpn.strikeType) {
      case 'rog': {
        return '-'
      }
      case 'bomber': {
        return `${wpn.shots} x ${wpn.bombers}`
      }
      default: { // Shelling
        return wpn.shots
      }
    }
  },
}, {
  iff: (ch, cat, wpn) => {
    if([
      'winger',
      'bomber',
    ].includes(ch)) {
      return false
    }
    if([
      'shotgun',
      'sniper',
      'spear',
      'heavy',
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
      'raid',
      'support',
      'tank',
      'ground',
      'heli',
      'mech',
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
    if(wpn.category === 'particle') {
      return +(FPS / wpn.reload).toFixed(1)
    }
    if(wpn.category == 'missile' && wpn.character === 'winger') {
      return +(FPS / wpn.reload).toFixed(1)
    }
    if(wpn.ammo < 2 && !wpn.reload) {
      return 60
    }
    if(wpn.ammo < 2) {
      return '-'
    }
    if(wpn.burst > 1 && wpn.interval > 1) {
      const burstRof = FPS / wpn.burstRate
      const rof = FPS / (wpn.burst * wpn.burstRate + wpn.interval)
      return `${wpn.burst} / ${rof.toFixed(1)}`
    }
    const rof = +(FPS / (wpn.interval || 1)).toFixed(1)
    if(rof === Infinity) {
      return '-'
    }
    return rof
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
    return (wpn.reload / FPS).toFixed(1)
  }
}, {
  iff: (ch, cat, wpn) => {
    if([
      'missile',
      'special',
      'raid',
      'deploy',
      'hammer',
      'spear',
      'shield',
      'tank',
      'ground',
      'heli',
      'mech',
    ].includes(cat)) {
      return false
    }
    return true
  },
  label: 'Acc',
  cb: wpn => {
    if(!wpn.speed) return '-'
    return [
      [0.9995, 'S++'],
      [0.9975, 'S+'],
      [0.99, 'A+'],
      [0.985, 'A'],
      [0.98, 'A-'],
      [0.97, 'B+'],
      [0.95, 'B'],
      [0.9, 'B-'],
      [0.85, 'C+'],
      [0.8, 'C'],
      [0.75, 'C-'],
      [0.7, 'D'],
      [0.6, 'E'],
      [0.5, 'F'],
      [0.4, 'G'],
      [0.2, 'I'],
      [0.0, 'J'],
      [-0.2, 'K'],
      [-0.4, 'L'],
      [-Infinity, 'Z'],
    ].find(([a]) => a <= wpn.accuracy)[1]
  }
}, {
  iff: (ch, cat, wpn) => {
    return ch === 'winger'
  },
  label: 'Enr',
  cb: wpn => {
    return +wpn.energy.toFixed(1)
  }
}, {
  iff: (ch, cat, wpn) => {
    if([
      'support',
      'shield',
      'tank',
      'ground',
      'heli',
      'mech',
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
    if(wpn.category === 'missile') {
      return wpn.lockRange
    }
    return (wpn.range || 0).toFixed(0)
  },
}, {
  iff: (ch, cat, wpn) => {
    if([
      'raid',
      'tank',
      'ground',
      'heli',
      'mech',
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
      'particle',
      'plasma',
      'guide',
      'raid',
      'shield',
      'tank',
      'ground',
      'heli',
      'mech',
    ].includes(cat)) {
      return false
    }
    if(ch === 'winger' && [
      'sniper',
      'missile',
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
    if(wpn.type === 'DecoyBullet01') {
      return '-'
    }
    if(wpn.ammo < 2 && !wpn.duration) {
      return '-'
    }
    if(wpn.burst > 100) {
      return wpn.damage * FPS / wpn.burstRate
    }
    let burstTime = (wpn.burst || 1) * (wpn.burstRate || 0) + (wpn.interval || 1)
    const burstDamage = Math.abs(wpn.damage * (wpn.count || 1) * (wpn.burst || 1))
    if(wpn.category === 'support') {
      if(['guard', 'power'].includes(wpn.supportType)) {
        return '-'
      }
      return +(wpn.damage * FPS).toFixed(1)
    }
    if(wpn.duration && !wpn.continous) {
      return +(burstDamage * (wpn.shots || 1) * FPS / wpn.duration).toFixed(1)
    }
    const dps = (burstDamage * FPS / burstTime)
    return +dps.toFixed(1)
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
    if(wpn.continous) {
      return +(wpn.damage * wpn.duration * FPS / (wpn.interval || 1)).toFixed(1)
    }
    return '-'
  },
}, {
  iff: (ch, cat, wpn) => {
    if([
      'guide',
      'raid',
      'support',
      'shield',
      'tank',
      'ground',
      'heli',
      'mech',
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
    if(wpn.reload < 0) {
      return '-'
    }
    if(wpn.type === 'DecoyBullet01') {
      return '-'
    }
    const magDamage = wpn.damage * (wpn.count || 1) * wpn.ammo
    const interval = wpn.interval || 1
    const bursts = wpn.ammo / (wpn.burst || 1)
    const burstTime = ((wpn.burst || 1) * (wpn.burstRate || 0)) + interval
    const magTime = bursts * burstTime + wpn.reload - interval
    const tdps = (magDamage * (wpn.shots || 1) * FPS / (magTime || interval))
    return +tdps.toFixed(1)
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
  label: 'TDPS*',
  cb: wpn => {
    if(!wpn.continous) {
      return '-'
    }
    const magDamage = wpn.damage * (wpn.count || 1) * wpn.ammo
    const interval = wpn.interval || 1
    const bursts = wpn.ammo / (wpn.burst || 1)
    const burstTime = ((wpn.burst || 1) * (wpn.burstRate || 0)) + interval
    const magTime = bursts * burstTime + wpn.reload - interval
    const tdps = (magDamage * (wpn.shots || 1) * FPS / (magTime || interval))
    return +(tdps * wpn.duration).toFixed(1)
  },
}, {
  iff: (ch, cat, wpn) => {
    if([
      'guide',
      'raid',
      'shield',
      'tank',
      'ground',
      'heli',
      'mech',
    ].includes(cat)) {
      return false
    }
    return true
  },
  label: 'Total',
  cb: wpn => {
    if(!wpn.damage) {
      return '-'
    }
    if(wpn.category === 'support') {
      if(['guard', 'power'].includes(wpn.supportType)) {
        return '-'
      }
      return +(wpn.damage * wpn.duration).toFixed(1)
    }
    if(wpn.type === 'DecoyBullet01') {
      return '-'
    }
    const dump = Math.abs(wpn.damage * (wpn.count || 1) * wpn.ammo * (wpn.shots || 1))
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
      const dump = Math.abs( wpn.damage
        * (wpn.count || 1)
        * wpn.ammo
        * (wpn.shots || 1))
      return +(dump * wpn.duration).toFixed(1)
    }
    return '-'
  },
}]

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

const charMenu = document.querySelector('#char-tabs')
for(let i = 0; i < characters.length; i++) {
  const c = characters[i]
  const cLabel = charLabels[i]
  const item = $('a')
  item.classList.add(c)
  boldify(item, cLabel, 3)
  charMenu.appendChild(item)
  item.addEventListener('click', () => pickChar(c))
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

const categories = [
  'assault',
  'shotgun',
  'sniper',
  'rocket',
  'missile',
  'grenade',
  'special',
  null,
  null,
  null,
  'short',
  'laser',
  'electro',
  'particle',
  'sniper',
  'plasma',
  'missile',
  'special',
  null,
  null,
  'hammer',
  'spear',
  'shield',
  'light',
  'heavy',
  'missile',
  null,
  null,
  null,
  null,
  'guide',
  'raid',
  'support',
  'limpet',
  'deploy',
  'special',
  'tank',
  'ground',
  'heli',
  'mech',
]

const supports = [
  'tank',
  'ground',
  'heli',
  'mech',
]

const catLabels = [
  'Assault Rifles',
  'Shotguns',
  'Sniper Rifles',
  'Rocket Launchers',
  'Missile Launchers',
  'Grenades',
  'Special Weapons',
  null,
  null,
  null,
  'Short-Range',
  'Mid-Rg Lasers',
  'Mid-Rg Electroshock',
  'Particle Cannons',
  'Sniper Weapons',
  'Ranged Attacks',
  'Homing Weapons',
  'Special Weapons',
  null,
  null,
  'CC Strikers',
  'CC Piercers',
  'Shields',
  'Automatic Artillery',
  'Artillery',
  'Missile Launchers',
  null,
  null,
  null,
  null,
  'Guidance Equipment',
  'Calling for Support',
  'Support Equipment',
  'Limpet Guns',
  'Stationary Weapons',
  'Special Weapons',
  'Tanks',
  'Ground Vehicles',
  'Helicopters',
  'Power Suits',
]
