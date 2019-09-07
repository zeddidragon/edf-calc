const weapons = require('./src/data/weapons')
const missions = require('./src/data/missions').campaign
const enemies = require('./src/data/hp')
  .reduce((obj, m) => {
    obj[m.id] = m
    return obj
  }, {})

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

function isAvailable(weapon) {
  return (
    weapon.level < 100
  )
}

function isWeapon(weapon) {
  if(weapon.category === 'guide') return /Beacon/i.test(weapon.name)
  if(weapon.raw > 35) return false // Vehicles
  if(weapon.category === 'support') return !/plasma/i.test(weapon.name)
  return !/speed star|torch|leviathan|haytal|phoenix/i.test(weapon.name)
}

function isRanged(weapon, range) {
  if(weapon.weapon === 'Weapon_Throw') return false
  if(weapon.damage <= 0) return false
  if(/decoy/i.test(weapon.name)) return false
  if(weapon.accuracy < 76) return false
  if(/dispersal/i.test(weapon.name)) return false
  return weapon.range >= range
}

function isUnderground(weapon, range) {
  if(weapon.category === 'raid') return false
  if(weapon.category === 'missile') return false
  if(weapon.category === 'tank') return false
  if(weapon.category === 'heli') return false
  if(weapon.category === 'ground') return /SDL1/i.test(weapon.name)
  if(weapon.category === 'mech') return /Depth/i.test(weapon.name)
  return true
}

function isMissileVehicle(weapon) {
  if(!weapon) return false
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
  const missileVehicle = isMissileVehicle(vehicle)
  if(avatar === 'winger') minRange = Math.max(0, minRange - 150)
  const choices =  weapons
    .filter(isAvailable)
    .filter(w => w.character === avatar)
    .filter(isWeapon)
    .filter(w => w.level >= levelRange[0] && w.level <= levelRange[1])
    .filter(w => avatar === 'fencer' || !weps.includes(w))
    .filter(w => !minRange || isRanged(w, minRange))
    .filter(w => !mission.underground || isUnderground(w))
    .filter(w => missileVehicle || w.category !== 'guide')
  return random.pick(choices)
}

function getVehicle(avatar, challenge, sniper) {
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
  return random.pick(choices)
}

const difficulties = {
  hard: {
    weaponMin: [0, 25],
    weaponMax: [10, 40],
    hp: [200, 500],
  },
  hardest: {
    weaponMin: [25, 40],
    weaponMax: [40, 70],
    hp: [500, 2000],
  },
  inferno: {
    weaponMin: [40, 40],
    weaponMax: [60, 100],
    hp: [1000, 4000],
  },
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

function getMission() {
  const difficulty = ['hard', 'hardest', 'inferno'][Math.floor(random() * 3)]
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
  const avatar = avatars[Math.floor(random() * 4)]

  const weps = []
  const sniper = avatar !== 'bomber' || random() * 2 > 1
  const vehicle = avatar === 'bomber' && getVehicle(avatar, challenge, !sniper)
  weps.push(getWeapon(avatar, weps, challenge, sniper, vehicle))
  weps.push(getWeapon(avatar, weps, challenge, false, vehicle))
  if(avatar === 'bomber') {
    weps.push(vehicle)
  } else if(avatar === 'fencer') {
    weps.push(getWeapon(avatar, weps, challenge))
    weps.push(getWeapon(avatar, weps, challenge))
  }

  const player = {
    "class": avatar,
    weapons: weps,
    hp: Math.max(Math.floor(challenge.hp * hpModifier[avatar] / 50) * 50, 150)
  }

  return player
}

function generateChallenge(players=1) {
  const challenge = getMission()
  challenge.players = []
  for(var i = 0; i < players; i++) {
    challenge.players.push(getAvatar(challenge))
  }

  return challenge
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
    for(var i = 0; i < player.weapons.length; i++) {
      const weapon = player.weapons[i]
      const label =
        i == 2 && player.class === 'bomber' ? 'Vehicle' : `Weapon ${i + 1}`
      message += `${label}: ${weapon.name} (Lv${weapon.level})\n`
    }
    if(player.class === 'fencer') {
      message += '\nYou can equip in any order you want\n'
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

for(var i = 0; i < 20; i++) {
  const seed = (Math.floor(Date.now() / precision) + i) * precision
  random.setSeed(seed)
  console.log(new Date(seed))
  print(generateChallenge(1))
}
