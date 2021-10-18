const data = {}
const isWeb = typeof process === 'undefined'
const precision = (1000 * 60 * 60 * 24 * 3)
const dailySeed = Math.floor(Date.now() / precision) * precision

var dataMissing = 0

const {
  load,
  addChallenge,
  finalize,
} = isWeb ? {
  load: (prop, source) => {
    dataMissing++
    const xobj = new XMLHttpRequest()
    xobj.overrideMimeType("application/json")
    xobj.open('GET', source, true)
    xobj.onreadystatechange = function () {
      if(xobj.readyState === 4 && +xobj.status === 200) {
        data[prop] = JSON.parse(xobj.responseText)
        dataMissing--
        if(!dataMissing) run()
      }
    }
    xobj.send(null);
  },

  addChallenge: (challenge) => {
    challenges.appendChild(challengeToDom(challenge))
  },

  finalize: () => {
    time.textContent = `Challenges for ${new Date(dailySeed).toLocaleDateString()}`

    const roll = dailySeed + precision

    function refreshCounter() {
      const seconds = Math.floor((roll - Date.now()) / 1000)
      const minutes = Math.floor(seconds / 60)
      const hours = Math.floor(minutes / 60)
      const days = Math.floor(hours / 24)

      var str = ''
      str += `${hours}:${twoDigits(minutes % 60)}:${twoDigits(seconds % 60)}`
      counter.textContent = str

      if(seconds <= 0 && interval) {
        clearInterval(interval)
        challenges.innerHTML = ''
        run()
      }
    }

    refreshCounter()
    var interval = setInterval(refreshCounter, 1000)
  },
} : {
  load: (prop, source) => {
    data[prop] = JSON.parse(require('fs').readFileSync(source, 'utf8'))
  },

  addChallenge: print,

  finalize: () => {
  },
}

load('enemies', './src/data/5/hp.json')
load('weapons', './src/data/5/weapons.json')
load('missions', './src/data/5/missions.json')
load('dlc', './src/data/5/dlc.json')

function random() {
  return Math.abs((Math.sin(random.seed++) * 10000) % 1)
}

random.pick = function(arr) {
  return arr[Math.floor(random() * arr.length)]
}

random.seed = Date.now()
random.setSeed = function(s) {
  random.seed = s
}

var missions, weapons, enemies, wpnCounts, difficulties

function isAvailable(weapon) {
  return weapon.odds !== 'dlc'
}

const vehicles = [
  'tank',
  'bike',
  'ground',
  'heli',
  'robo',
  'mech',
]

const equipment = [
  'equipment',
  'core',
  'booster',
  'exo',
  'muzzle',
  'protector',
]

const onlyOne = [
  'shield',
  'support',
  'special',
]

const secondaries = {
  NONE: 0,
  ZOOM: 1,
  ACTIVATE: 2,
  DETONATE: 3,
  BOOST: 4,
  DASH: 5,
  REFLECT: 6,
}

function isWeapon(weapon) {
  if(weapon.name.includes('Beacon Gun')) return false
  if(weapon.name.includes('Laser Guide')) return false
  if(vehicles.includes(weapon.category)) return false // Vehicles
  if(equipment.includes(weapon.category)) return false // Equipment
  if(weapon.category === 'support') return !/plasma/i.test(weapon.name)
  return !/speed star|torch|leviathan|haytal|phoenix|laser guide|guide beacon/i.test(weapon.name)
}

function isRanged(weapon, range) {
  if(weapon.weapon === 'Weapon_Throw') return false
  if(weapon.category === 'hammer') return false
  if(weapon.damage <= 0) return false
  if(weapon.character === 'bomber') return weapon.category === 'limpet'
  if(weapon.accuracy < 0.76) return false
  if(/dispersal/i.test(weapon.name)) return false
  const weaponRange = weapon.life * (weapon.speed?.base || weapon.speed)
  return weaponRange >= range
}

function isUnderground(weapon, range) {
  if(weapon.category === 'missile') return false
  return weapon.underground
}

function isMissileVehicle(weapon) {
  if(!weapon) return false
  if(weapon.raw < 36) return false
  if(/Naegling/i.test(weapon.name)) return true
  if(/Proteus/i.test(weapon.name)) return true
  return false
}

function isVehicleRanged(weapon, range) {
  if(/Melt Buster|Caravan|Nereid|Flame|Fire|Balam/i.test(weapon.name)) return false
  if(weapon.id === 'eWeapon256') return true // L-Range Custom
  if(/Depth Crawler/i.test(weapon.name)) return false
  if(weapon.category = 'mech' && /Revolver|Missile/i.test(weapon.name)) {
    return range <= 300
  }

  return true
}

const avatars = [
  'ranger',
  'winger',
  'fencer',
  'bomber',
]
function getWeapon(avatar, weps, challenge, sniper) {
  const { levelRange, sniperRequired, mission } = challenge
  var minRange = (sniper && sniperRequired) || 0
  // Wing Diver can fly, can get away with less range on weapons
  if(avatar === 'winger') minRange = Math.max(0, minRange - 150)

  const minLevel = levelRange[0]
  var maxLevel = levelRange[1]
  if(challenge.mission.online) maxLevel += 10
  if(challenge.mission.online && challenge.playerCount === 1) maxLevel += 15
  const choices =  weapons
    .filter(isAvailable)
    .filter(w => w.character === avatar)
    .filter(isWeapon)
    .filter(w => w.level >= minLevel && w.level <= maxLevel)
    .filter(w => !minRange || isRanged(w, minRange))
    .filter(w => !mission.underground || isUnderground(w))
    .filter(w => !weps.includes(w))
    .filter(w => !onlyOne.includes(w.category) || !weps.find(w2 => w2.category === w.category))
  return random.pick(choices)
}

function getSpecificWeapon(avatar, weps, challenge, cb) {
  const { levelRange } = challenge
  const minLevel = levelRange[0]
  var maxLevel = levelRange[1]
  if(challenge.mission.online) maxLevel += 10
  if(challenge.mission.online && challenge.playerCount === 1) maxLevel += 15
  let choices =  weapons
    .filter(isAvailable)
    .filter(w => w.character === avatar)
    .filter(isWeapon)
    .filter(cb)
    .filter(w => w.level <= maxLevel)
    .filter(w => !weps.includes(w))
    .filter(w => !onlyOne.includes(w.category) || !weps.find(w2 => w2.category === w.category))
  if(choices.find(w => w.level >= minLevel)) {
    choices = choices.filter(w => w.level >= minLevel)
  } else {
    return choices.sort((a, b) => a.level - b.level).pop()
  }
  return random.pick(choices)
}

function getSupport(avatar, weps, challenge) {
  const { levelRange, mission } = challenge
  const choices =  weapons
    .filter(w => w.character === avatar)
    .filter(w => equipment.includes(w.category))
    .filter(w => w.level >= levelRange[0] && w.level <= levelRange[1])
    .filter(w => !weps.includes(w))
  return random.pick(choices)
}

function getVehicle(avatar, weps, challenge, sniper) {
  const { levelRange, sniperRequired, mission } = challenge
  const minRange = (
    sniper &&
    !challenge.mission.underground &&
    sniperRequired
  ) || 0
  const choices =  weapons
    .filter(w => w.character === avatar)
    .filter(w => vehicles.includes(w.category))
    .filter(w => w.level >= levelRange[0] && w.level <= levelRange[1])
    .filter(w => !mission.underground || isUnderground(w))
    .filter(w => !weps.includes(w))
  return random.pick(choices)
}

function fencerSupportCategory(w) {
  if(w.name.startsWith('Dash Cell')) return 'dash'
  if(w.name.startsWith('Add Booster')) return 'boost'
  if(w.name.startsWith('Multi-Charger')) return 'multi'
  if(w.name.startsWith('Deflect Cell')) return 'deflect'
  if(w.name.startsWith('Shield Protection')) return 'protect'
  if(w.name.startsWith('Barricade')) return 'barricade'
  if(w.name.endsWith('Leg Exoskeleton')) return 'legs'
  if(w.name.endsWith('Arm Exoskeleton')) return 'arms'
  return w.category
}

function fencerWeaponSupportCompatibility(w) {
  if(w.secondary === secondaries.DASH) return ['dash']
  if(w.category === 'light') return ['boost', 'legs', 'arms', 'exo', 'muzzle']
  if(w.secondary === secondaries.BOOST) return ['boost', 'legs', 'exo']
  if(w.secondary === secondaries.ZOOM) return ['arms', 'legs', 'exo', 'muzzle']
  if(w.category === 'shield') return ['deflect', 'protect', 'barricade']
  return []
}

function getFencerSupport(avatar, supports, challenge, weps) {
  const { levelRange, mission } = challenge
  const compatible = new Set(weps.flatMap(fencerWeaponSupportCompatibility))
  if(compatible.has('boost') && compatible.has('dash')) {
    compatible.add('multi')
  }
  const equipped = new Set(supports.map(fencerSupportCategory))
  const choices =  weapons
    .filter(w => w.character === avatar)
    .filter(w => {
      const cat = fencerSupportCategory(w)
      return compatible.has(cat) && !equipped.has(cat)
    })
    .filter(w => w.level >= levelRange[0] && w.level <= levelRange[1])
  return random.pick(choices)
}

const getSupports = {
  ranger: [getSupport, getVehicle],
  bomber: [getVehicle, getVehicle, getVehicle],
  winger: [getSupport, getSupport],
  fencer: [getFencerSupport, getFencerSupport, getFencerSupport],
}

function tween(min, max, pivot) {
  return min + (max - min) * pivot
}

const hpModifier = {
  ranger: 1,
  winger: 0.5,
  fencer: 1.25,
  bomber: 1,
}

function getMission(players) {
  const difficulty = random.pick(['hard', 'hardest', 'inferno'])
  const mission = random.pick(missions.filter(m => players > 1 || !m.online))
  const pivot = missions.indexOf(mission) / missions.length
  const diffCfg = difficulties[difficulty]
  const minWpn = tween(...diffCfg.weaponMin, pivot)
  const maxWpn = tween(...diffCfg.weaponMax, pivot)
  const levelRange = [minWpn, maxWpn]
  const sniperRequired = mission.enemies.reduce((range, enemy) => {
    if(Array.isArray(enemy)) enemy = enemy[0]
    if(!enemies[enemy]) return 0
    const enemyRange = enemies[enemy].sniper || 0
    return Math.max(enemyRange, range)
  }, 0)

  const challenge = {
    difficulty,
    mission,
    pivot,
    sniperRequired,
    levelRange: [ minWpn, maxWpn ],
    hp: tween(...diffCfg.hp, pivot),
  }

  if(mission.online) challenge.hp *= 2
  if(mission.online && players === 1) challenge.hp *= 2
  
  return challenge
}

const wpnOrder = (a, b) => (a.raw - b.raw) || (a.level - b.level)

function getAvatar(challenge) {
  const avatar = random.pick(avatars.filter(a => {
    return !challenge.players.find(p => p["class"] === a)
  }))
  const { mission, hp } = challenge
  const online = !!mission.online

  const weaponCount = wpnCounts[avatar] + +online

  const weps = []
  if(challenge.sniperRequired >= 400 && avatar == 'bomber') {
    weps.push(getSpecificWeapon(avatar, weps, challenge,
      w => w.name.startsWith('Limpet Sniper')))
  }
  if(avatar === 'bomber' && !challenge.mission.underground) {
    weps.push(getSpecificWeapon(avatar, weps, challenge,
      w => w.category === 'gunship' || w.name.startsWith('Bulge Laser')))
  } else {
    weps.push(getWeapon(avatar, weps, challenge, true))
  }
  for(var i = 1; i < weaponCount; i++) {
    const wep = getWeapon(avatar, weps, challenge, false)
    if(wep) weps.push(wep)
  }

  const supports = []
  for(const auxFunc of getSupports[avatar]) {
    const found = auxFunc(avatar, supports, challenge, weps)
    if(!found) continue
    supports.push(found)
  }

  weps.sort(wpnOrder)
  supports.sort(wpnOrder)

  const player = {
    "class": avatar,
    weapons: weps,
    supports: supports,
    hp: Math.max(Math.round(hp * hpModifier[avatar] / 50) * 50, 150)
  }

  return player
}

function generateChallenge(players=1) {
  const challenge = getMission(players)
  challenge.playerCount = players
  challenge.players = []
  for(var i = 0; i < players; i++) {
    challenge.players.push(getAvatar(challenge))
  }
  challenge
    .players
    .sort((a, b) => avatars.indexOf(a.class) - avatars.indexOf(b.class))

  return challenge
}

const difficultyPrint = {
  easy: 'Easy',
  normal: 'Normal',
  hard: 'Hard',
  hardest: 'Hardest',
  inferno: 'Inferno',
}
const avatarPrint = {
  ranger: 'Ranger',
  winger: 'Wing Diver',
  fencer: 'Fencer',
  bomber: 'Air Raider',
}

function print(challenge) {
  var message = `Complete mission "${challenge.mission.name}" (${challenge.mission.id}) on ${challenge.difficulty} mode\n`
  for(const player of challenge.players) {
    message += `\nPlay as ${avatarPrint[player.class]} with ${player.hp} AP\n`

    message += `\nYou can choose between the following weapons:\n`
    for(var i = 0; i < player.weapons.length; i++) {
      const weapon = player.weapons[i]
      message += `- ${weapon.name} (${weapon.category} lv${weapon.level})\n`
    }

    message += `\nYou can choose between the following equipment:\n`
    for(var i = 0; i < player.supports.length; i++) {
      const weapon = player.supports[i]
      message += `- ${weapon.name} (${weapon.category} lv${weapon.level})\n`
    }
  }

  if(challenge.sniperRequired) {
    message += `\nYou'll likely need a ranged weapon with at least ${challenge.sniperRequired}m range\n`
  }

  if(challenge.mission.underground) {
    message += `\nThis mission takes place underground.\n`
  }

  if(challenge.mission.online) {
    message += `\n====WARNING====\n`
    message += `\nThis mission is online only.\n`
    message += `There is no guarantee that this challenge is beatable.\n`
  }

  console.log(message)
}


function challengeToDom(challenge) {
  const node = document.createElement('section')
  node.classList.add('challenge')
  node.classList.add(challenge.type)
  node.innerHTML = `
    <header class="title">${challenge.title}</header>
    <header class="mission">
      <span class="mission-name">${challenge.mission.name}</span>
      <span class="num">(${challenge.mission.id})</span>
      ${challenge.mission.online ? '<span class="warning">DANGER</span>' : ''}
      <span class="difficulty">${difficultyPrint[challenge.difficulty]}</span>
    </header>
    ${
      challenge.players.map(player => {
        return `
          <div class="player">
            <header class="player-header">
            <span class="name ${player.class}">${avatarPrint[player.class]}</span>
            <span class="hp">${player.hp}AP</span>
            </header>
            <ul class="weapons">
              ${
                player.weapons.map(weapon => {
                  return `
                    <li>
                      <div class="weapon">
                        <span class="wpn-name">${weapon.name}</span>
                        <span class="sub">(${weapon.category} lv${weapon.level})</span>
                      </div>
                  `
                }).join('\n')
              }
            </ul>
          </div>
          <div class="supports">
            <ul class="weapons">
              ${
                player.supports.map(weapon => {
                  return `
                    <li>
                      <div class="weapon">
                        <span class="wpn-name">${weapon.name}</span>
                        <span class="sub">(${weapon.category} lv${weapon.level})</span>
                      </div>
                  `
                }).join('\n')
              }
            </ul>
          </div>
        `
      }).join('\n')
    }
  `
  return node
}

function run() {
  enemies = data.enemies.reduce((obj, m) => {
    obj[m.id] = m
    return obj
  }, {})
  missions = data.missions.campaign
  weapons = data.weapons
  wpnCounts = {
    ranger: 4,
    winger: 4,
    bomber: 5,
    fencer: 4,
  }
  difficulties = {
    hard: {
      weaponMin: [0, 25],
      weaponMax: [10, 40],
      hp: [300, 1000],
    },
    hardest: {
      weaponMin: [25, 40],
      weaponMax: [40, 70],
      hp: [800, 2000],
    },
    inferno: {
      weaponMin: [40, 50],
      weaponMax: [60, 100],
      hp: [1200, 4000],
    },
  }


  random.setSeed(dailySeed)
  const prismatic = generateChallenge(2)
  prismatic.title = 'Prismatic Challenge'
  prismatic.type = 'prismatic'

  wpnCounts = {
    ranger: 3,
    winger: 3,
    bomber: 4,
    fencer: 3,
  }

  random.setSeed(dailySeed + 100)
  const coop = generateChallenge(4)
  coop.title = 'Co-Op Challenge'
  coop.type = 'coop'

  random.setSeed(dailySeed + 200)
  const dlcPack = random.pick(['dlc1', 'dlc2'])
  difficulties = {
    dlc1: {
      hard: {
        weaponMin: [0, 10],
        weaponMax: [26, 40],
        hp: [400, 1600],
      },
      hardest: {
        weaponMin: [30, 50],
        weaponMax: [60, 75],
        hp: [800, 3200],
      },
      inferno: {
        weaponMin: [40, 50],
        weaponMax: [100, 105],
        hp: [1600, 4800],
      },
    },
    dlc2: {
      hard: {
        weaponMin: [0, 30],
        weaponMax: [30, 60],
        hp: [500, 2000],
      },
      hardest: {
        weaponMin: [30, 50],
        weaponMax: [75, 89],
        hp: [1000, 4000],
      },
      inferno: {
        weaponMin: [40, 50],
        weaponMax: [100, 120],
        hp: [2000, 6000],
      },
    },
  }[dlcPack]
  wpnCounts = {
    ranger: 5,
    winger: 5,
    bomber: 6,
    fencer: 5,
  }

  missions = data.dlc[dlcPack]
  const dlc = generateChallenge(2)
  dlc.title = 'DLC Challenge'
  dlc.type = 'dlc'

  addChallenge(prismatic)
  addChallenge(dlc)
  addChallenge(coop)
  finalize()
}

function twoDigits(n) {
  if(n < 10) return `0${n}`

  return `${n}`
}

if(!isWeb) run()
