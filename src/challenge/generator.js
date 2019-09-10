const data = {}
var dataMissing = 0

function load(prop, source) {
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
}

load('enemies', './src/data/hp.json')
load('weapons', './src/data/weapons.json')
load('missions', './src/data/missions.json')
load('dlc', './src/data/dlc.json')

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

function isWeapon(weapon) {
  if(weapon.category === 'guide') return /Beacon/i.test(weapon.name)
  if(weapon.raw > 35) return false // Vehicles
  if(weapon.category === 'support') return !/plasma/i.test(weapon.name)
  return !/speed star|torch|leviathan|haytal|phoenix/i.test(weapon.name)
}

function isRanged(weapon, range) {
  if(weapon.weapon === 'Weapon_Throw') return false
  if(weapon.category === 'hammer') return false
  if(weapon.damage <= 0) return false
  if(weapon.raw >= 30) return weapon.category === 'limpet'
  if(weapon.accuracy < 0.76) return false
  if(/dispersal/i.test(weapon.name)) return false
  return weapon.range >= range
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
  if(weapon.id === 'Weapon745') return true // L-Range Custom
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
function getWeapon(avatar, weps, challenge, sniper, vehicle) {
  const { levelRange, sniperRequired, mission } = challenge
  var minRange = (sniper && sniperRequired) || 0
  const missileVehicle = weps.find(isMissileVehicle)
  // Wing Diver can fly, can get away with less range on weapons
  if(avatar === 'winger') minRange = Math.max(0, minRange - 150)
  // Ensure one limpet gun for lone air raider
  if(sniper && avatar === 'bomber' && challenge.playerCount < 2) {
    minRange = Math.max(150, minRange)
  } else if(avatar === 'bomber') {
    minRange = 0
  }
  const choices =  weapons
    .filter(isAvailable)
    .filter(w => w.character === avatar)
    .filter(isWeapon)
    .filter(w => w.level >= levelRange[0] && w.level <= levelRange[1])
    .filter(w => !minRange || isRanged(w, minRange))
    .filter(w => !mission.underground || isUnderground(w))
    .filter(w => missileVehicle || w.category !== 'guide')
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
    .filter(w => w.raw > 35)
    .filter(w => w.level >= levelRange[0] && w.level <= levelRange[1])
    .filter(w => !minRange || isRangedVehicle(w, minRange))
    .filter(w => !mission.underground || isUnderground(w))
    .filter(w => !weps.includes(w))
  return random.pick(choices)
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

var missions

function getMission() {
  const difficulty = random.pick(['hard', 'hardest', 'inferno'])
  const mission = random.pick(missions)
  const pivot = missions.indexOf(mission) / missions.length
  const diffCfg = difficulties[difficulty]
  const minWpn = tween(...diffCfg.weaponMin, pivot)
  const maxWpn = tween(...diffCfg.weaponMax, pivot)
  const levelRange = [minWpn, maxWpn]
  const sniperRequired = mission.enemies.reduce((range, enemy) => {
    if(Array.isArray(enemy)) enemy = enemy[0]
    return Math.max(0, enemies[enemy].sniper || 0)
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
  
  return challenge
}

function getAvatar(challenge) {
  const avatar = random.pick(avatars.filter(a => {
    return !challenge.players.find(p => p["class"] === a)
  }))

  const weps = []
  if(avatar === 'bomber') {
    const veh1 = getVehicle(avatar, weps, challenge)
    weps.push(veh1)
    const veh2 = getVehicle(avatar, weps, challenge)
    if(veh2 && wpnCounts[avatar] > 4) weps.push(veh2)
  }
  weps.push(getWeapon(avatar, weps, challenge, true))
  const wpnCount = wpnCounts[avatar]
  for(var i = 1; i < wpnCount; i++) {
    const wep = getWeapon(avatar, weps, challenge, false)
    if(wep) weps.push(wep)
  }

  weps.sort((a, b) => (a.raw - b.raw) || (a.level - b.level))

  const player = {
    "class": avatar,
    weapons: weps,
    hp: Math.max(Math.floor(challenge.hp * hpModifier[avatar] / 50) * 50, 150)
  }

  return player
}

function generateChallenge(players=1) {
  const challenge = getMission()
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

    message += `\nYou can choose between the following equipment:\n`
    for(var i = 0; i < player.weapons.length; i++) {
      const weapon = player.weapons[i]
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


const precision = (1000 * 60 * 60 * 24 * 3)

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
        `
      }).join('\n')
    }
  `
  return node
}

function run() {
  const dailySeed = Math.floor(Date.now() / precision) * precision
  enemies = data.enemies.reduce((obj, m) => {
    obj[m.id] = m
    return obj
  }, {})
  missions = data.missions.campaign
  weapons = data.weapons
  wpnCounts = {
    ranger: 3,
    winger: 3,
    bomber: 4,
    fencer: 4,
  }
  difficulties = {
    hard: {
      weaponMin: [0, 25],
      weaponMax: [10, 40],
      hp: [200, 500],
    },
    hardest: {
      weaponMin: [25, 40],
      weaponMax: [40, 70],
      hp: [300, 1250],
    },
    inferno: {
      weaponMin: [40, 40],
      weaponMax: [60, 100],
      hp: [400, 2500],
    },
  }


  random.setSeed(dailySeed)
  const prismatic = generateChallenge()
  prismatic.title = 'Prismatic Challenge'
  prismatic.type = 'prismatic'

  wpnCounts = {
    ranger: 2,
    winger: 2,
    bomber: 2,
    fencer: 3,
  }

  random.setSeed(dailySeed + 100)
  const coop = generateChallenge(3)
  coop.title = 'Co-Op Challenge'
  coop.type = 'coop'

  difficulties = {
    hard: {
      weaponMin: [20, 40],
      weaponMax: [30, 60],
      hp: [600, 1200],
    },
    hardest: {
      weaponMin: [40, 70],
      weaponMax: [50, 85],
      hp: [1000, 2000],
    },
    inferno: {
      weaponMin: [50, 50],
      weaponMax: [70, 120],
      hp: [3000, 6000],
    },
  }
  wpnCounts = {
    ranger: 4,
    winger: 4,
    bomber: 5,
    fencer: 4,
  }

  random.setSeed(dailySeed + 200)
  missions = random.pick(Object.values(data.dlc))
  const dlc = generateChallenge()
  dlc.title = 'DLC Challenge'
  dlc.type = 'dlc'

  challenges.appendChild(challengeToDom(prismatic))
  challenges.appendChild(challengeToDom(coop))
  challenges.appendChild(challengeToDom(dlc))

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
}

function twoDigits(n) {
  if(n < 10) return `0${n}`

  return `${n}`
}
