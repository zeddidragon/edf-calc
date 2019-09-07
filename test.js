const weapons = require('./src/data/weapons')
const missions = require('./src/data/missions').campaign

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
  if(weapon.category === 'guide') return false
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

function print(weapon) {
  console.log(weapon.name)
  return weapon.name
}

const avatars = [
  'ranger',
  'winger',
  'fencer',
  'bomber',
]

function pickWeapon(avatar, weps, range) {
  const choices =  weapons
    .filter(isAvailable)
    .filter(w => w.character === avatar)
    .filter(isWeapon)
    .filter(w => w.level >= range[0] && w.level <= range[1])
    .filter(w => avatar === 'fencer' || !weps.includes(w))
  return random.pick(choices)
}

function pickVehicle(avatar, weps, range) {
  const choices =  weapons
    .filter(w => w.raw > 35)
    .filter(w => w.level >= range[0] && w.level <= range[1])
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

function generateChallenge() {
  const avatar = avatars[Math.floor(random() * 4)]
  const difficulty = ['hard', 'hardest', 'inferno'][Math.floor(random() * 3)]
  const mission = random.pick(missions)
  const pivot = missions.indexOf(mission) / missions.length
  const diffCfg = difficulties[difficulty]
  const minWpn = tween(...diffCfg.weaponMin, pivot)
  const maxWpn = tween(...diffCfg.weaponMax, pivot)
  const levelRange = [minWpn, maxWpn]

  const weps = []
  weps.push(pickWeapon(avatar, weps, levelRange))
  weps.push(pickWeapon(avatar, weps, levelRange))
  if(avatar === 'bomber') {
    weps.push(pickVehicle(avatar, weps, levelRange))
  } else if(avatar === 'fencer') {
    weps.push(pickWeapon(avatar, weps, levelRange))
    weps.push(pickWeapon(avatar, weps, levelRange))
  }

  const challenge = {
    avatar,
    mission: mission,
    hp: Math.floor(tween(...diffCfg.hp, pivot) * hpModifier[avatar]),
    difficulty,
    weapons: weps,
  }

  if(mission.online) {
    challenge.hp *= 2
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
  var message = `
Complete mission "${challenge.mission.name}" (${challenge.mission.id}) on ${challenge.difficulty} mode

Play as ${avatarPrint[challenge.avatar]} with ${challenge.hp} AP

`
  for(var i = 0; i < challenge.weapons.length; i++) {
    const weapon = challenge.weapons[i]
    const label =
      i == 2 && challenge.avatar === 'bomber' ? 'Vehicle' : `Weapon ${i + 1}`
    message += `${label}: ${weapon.name} (Lv${weapon.level})\n`
  }
  if(challenge.avatar === 'fencer') {
    message += '\nYou can equip in any order you want\n'
  }
  if(challenge.mission.online) {
    message += `\n====WARNING====\n`
    message += `\nThis mission is online only.\n`
    message += `There is no guarantee that this challenge is beatable.\n`
  }
  console.log(message)
}

const precision = (1000 * 60 * 60 * 24 * 3)
const seed = (Math.floor(Date.now() / precision) + 5) * precision
console.log(new Date(seed))
random.setSeed(seed)
print(generateChallenge())
