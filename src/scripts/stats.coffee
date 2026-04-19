import { headers } from './headers'
import { weaponStats } from './weapons'
import { $ } from './html'

export populateWeaponStats = () =>
  weapons = locals.weapons
    .filter (wpn) => wpn.character is locals.char.id and wpn.category is locals.cat.id
    .flatMap processWeapon

  locals.tables =
    if locals.cat.tables
      locals.cat.tables.map (table) =>
        { ...locals.cat
          ...table
          weapons: weapons.filter (wpn) => wpn.subCategory is table.subCategory
        }
    else
      [{ ...locals.cat, weapons: weapons }]

SCALED_PROPS = [
  'ammo'
  'hp'
  'damage'
  'count'
  'radius'
  'interval'
  'reload'
  'accuracy'
  'speed'
  'burstRate'
  'lockRange'
  'lockTime'
  'energy'
  'windup'
]

processWeapon = (weapon) =>
  wpn = { ...weapon }

  if weapon.category is 'core' and weapon.energy
    wpn.baseEnergy = weapon.energy.base or weapon.energy

  for prop in SCALED_PROPS
    if weapon[prop]?.base?
      wpn[prop] = getValue weapon, prop, wpn

  if wpn.attacks?.length and wpn.character is 'bomber' # Balam / Barga
    [ wpn,
      ...(wpn.weapons or [])
      ...wpn.attacks.map composeAttack wpn
    ]
  else if wpn.attacks?.length
    [ { ...wpn, ...composeAttack(wpn, wpn.attacks[0]), name: wpn.name }
      ...wpn.attacks[1..].map composeAttack wpn
    ]
  else if wpn.weapons?.length
    [ wpn
      ...wpn.weapons
    ]
  else
    wpn

composeAttack = (weapon) => (attack) =>
  {
    ...attack,
    damage: (weapon.damage or 1) * attack.damage
    speed: weapon.speed * attack.speed
    piercing: weapon.piercing
    count: weapon.count
    life: weapon.life
    isSwing: weapon.attacks.length > 1
    isSubAttack: true
  }

getValue = (wpn, prop, obj) =>
  value = wpn[prop]
  return value if not value? or typeof value is 'number'

  if prop is 'energy' and wpn.category is 'core'
    obj.baseEnergy = if isNaN(value) then value.base else value

  if value?.base?
    [star, v] = starValue value, locals.star.star
    obj["#{prop}Star"] = star
    obj["#{prop}StarMax"] = value.lvMax
    v

starValue = ({ base, algo, lvMax, zero, exp, type }, star) =>
  sign = 1.0
  if base < 0
    base = -base
    sign = -1.0

  star = Math.min(Math.max(0, star), Math.max(5, lvMax))
  curveBase = base * zero
  curvePoint = curveBase * Math.pow star / 5.0, exp
  result = 0

  if (algo & 3) is 0
    result = base - curveBase + curvePoint
  else if (algo & 3) is 1
    result = base + curveBase - curvePoint
  else
    console.error "Invalid algorithm: #{algo}"

  result = sign * Math.max 0, result

  if type is 'int'
    result = Math.floor result + 0.5

  [star, result]

export processHeaders = () =>
  locals.headerDefinitions = { ...headers }
  { gameValues: { hasStars } = {} } = locals
  for header in Object.keys headers
    def = locals.headerDefinitions[header]
    unless hasStars
      delete def.starProp
      delete def.starProp2
    colspan = 1
    colspan += 1 if def.starProp
    colspan += 1 if def.starProp2
    colspan += 3 if header is 'damage'
    colspan += 1 if header is 'interval'
    if colspan > 1
      def.colspan = colspan

# Used for rendering a stat
window.weaponStat = (weapon, stat) =>
  value =
    if weaponStats[stat]?
      weaponStats[stat](weapon, stat)
    else if weapon[stat]?
      weapon[stat]

  header = locals.headerDefinitions[stat]
  cell = { class: stat, value: value ? '-' }

  if not value?
    cell

  else if stat is 'damage'
    [dmg, count, count2] = value
      .toString()
      .split 'x'
      .map (v) => v.trim()
    [full, min] = dmg.split '~'
    items = [cell]
    cell.value = full

    if min
      items.push { value: min, class: 'Falloff' }
    else
      items.push { value: '', class: 'Filler' }

    if count2
      items.push { value: count2, class: 'Count' }
      items.push { value: count, class: 'Count DmgEnd' }
    if count
      items.push { value: count, class: 'Count' + if count2 then ' DmgEnd' else '' }
    else
      items.push { value: '', class: 'Filler' }
    unless count2
      items.push { value: '', class: 'Filler DmgEnd' }

    items

  else if stat is 'interval'
    [rof, burst] = value
      .toString()
      .split 'x'
      .map (v) => v.trim()
    items = [cell]
    cell.value = rof

    if burst
      items.push [{ value: burst, class: 'Count DmgEnd' }]
    else
      items.push [{ value: '', class: 'Filler DmgEnd' }]

    items

  else
    cell
