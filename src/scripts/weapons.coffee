import { $ } from './html'
import { accuracy } from './accuracy.coffee'
import { FPS, byFps } from './framerate.coffee'
import { headers as damageHeaders } from './damage.coffee'

export weaponKey = (wpn, type = 'owned') =>
  scope = if locals.game.id is '41' then '' else ".#{locals.game.id[2..]}"
  "#{type}#{scope}.#{wpn.id}"

checkbox = (scope) =>
  (wpn) =>
    return null unless wpn.id
    key = weaponKey wpn, scope
    el = $ 'input'
    el.setAttribute 'type' ,'checkbox'
    el.setAttribute 'checked', '1' if localStorage[key] > 0
    el.setAttribute 'onchange', "toggleCheckWeapon('#{scope}', '#{wpn.id}')"
    el.setAttribute 'id', key
    el

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

export processWeapon = (weapon) =>
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

percent = (val, decimals) =>
  (100 * val).toFixed(decimals) + '%'

decimalProp = (decimals, propOverride) =>
  (wpn, prop) =>
    value = wpn[propOverride or prop]
    value.toFixed(decimals) if value

percentProp = (decimals, propOverride, offset = 0) =>
  (wpn, prop) =>
    value = wpn[propOverride or prop]
    percent (value + offset), decimals if value

invertPercentProp = (decimals, propOverride) =>
  (wpn, prop) =>
    value = wpn[propOverride or prop]
    percent 1 - value, decimals if value?

fpsProp = (decimals, propOverride) =>
  (wpn, prop) =>
    value = wpn[propOverride or prop]
    byFps value, decimals if value

suffixProp = (propOverride, mark = 'x') =>
  (wpn, prop) =>
    value = wpn[propOverride or prop]
    "#{value}#{mark}" if value

bool = (propOverride, mark = '✓') =>
  (wpn, prop) =>
    mark if wpn[propOverride or prop]

export localize = (prop, fallback) =>
  unless prop
    return fallback or null
  if typeof prop is 'string'
    return prop
  if prop[locals.lang.id]?
    return prop[locals.lang.id]
  if fallback?
    return fallback
  Object.values(prop)[0]

chargeRate = (wpn) =>
  { baseEnergy: nrg = wpn.baseEnergy
    chargeSpeed: spd = 1.0
    character: ch
  } = wpn
  nrg * spd * locals.gameValues[ch].charge

chargeEmergencyRate = (wpn) =>
  { energy: nrg
    emergencyChargeSpeed: spd = 1.0
    character: ch
  } = wpn
  nrg * spd * locals.gameValues[ch].chargeEmergency

energyUse = (wpn) =>
  { baseEnergy: nrg = wpn.energy
    flightConsumption: usg = 1.0
    character: ch
  } = wpn
  nrg * usg * locals.gameValues[ch].flightUse

boostUse = (wpn) =>
  { baseEnergy: nrg = wpn.energy
    boostConsumption: usg = 1.0
    character: ch
  } = wpn
  nrg * usg * locals.gameValues[ch].boostUse

boostProp = (propOverride) =>
  (wpn, prop) =>
    value = wpn[propOverride or prop]
    if value and value isnt 1
      percent value, 0

export weaponStats = {
  ...damageHeaders

  checkbox: checkbox 'owned'
  stars: checkbox 'starred'

  level: (wpn) =>
    { level } = wpn
    return null unless level?
    return level if isNaN(level)
    [offline, online] = locals.modes[1..]
    mode = [online, offline].find (m) => m?.difficulties?.length
    return level unless mode # ????

    el = $ 'div'

    difficulty = mode.difficulties[1..].find (d) =>
      limits = d.weaponLimits
      return unless Array.isArray limits
      upper = limits[limits.length - 1]
      upper > 0 and upper >= level

    display = Math.max 0, level
    return display unless difficulty

    el.classList.add difficulty.name
    el.textContent = display
    el

  rank: (wpn) =>
    { rank } = wpn
    return null unless rank?
    el = $ 'div'
    el.classList.add "rank-#{rank}"
    el.textContent = rank
    el

  remarks: (wpn) =>
    return null unless wpn.tags?.length

    tags = [wpn.effect, ...wpn.tags]
    remarks = []
    for tag in [wpn.effect, ...wpn.tags]
      if tag is 'reload_quick'
        # Ignore
      else if tag is 'reload_none'
        # Ignore
      else if tag is 'reload_auto'
        # Ignore
      else if tag is 'reload_charge'
        # Ignore
      else if tag is 'delay_burst'
        remarks.push "+#{wpn.damage2} Dmg <30m"
      else if tag is 'delay_blast'
        remarks.push "Timer"
      else if tag is 'delay'
        remarks.push 'Windup'
      else if tag is 'slow_aim'
        remarks.push 'Slows Aim'
      else if tag is 'no_move_aim'
        remarks.push 'Immobile'
      else if tag is 'energyconsume'
        remarks.push 'Uses Energy'
      else if tag is 'bouncing'
        remarks.push 'Bouncing'
      else if tag is 'growth_range'
        # remarks.push '→Range'
      else if tag is 'growth_damage'
        # remarks.push '→Damage'
      else if tag is 'pushback'
        remarks.push 'Pushback'
      else if tag is 'scope'
        remarks.push 'Scope'
      else if tag is 'roulette'
        remarks.push "1/#{wpn.critOver} of #{wpn.damage2}"
      else if tag is 'puncher'
        remarks.push "Explodes"
      else if tag is 'recoil'
        remarks.push 'Recoil'
      else if tag is 'recovertime'
        remarks.push 'Heals'
      else if tag is 'tracer'
        remarks.push 'Flare (Frightens)'
      else if tag is 'no_move'
        remarks.push 'Immobile'
      else if tag is 'sticky'
        remarks.push 'Sticky'
      else if tag is 'shock'
        # remarks.push 'Shock'
      else if tag is 'frozen'
        # remarks.push 'Freeze'
      else if tag is 'flame'
        # remarks.push 'Burn'
      else if tag
        remarks.push tag
    remarks.join ','

  name: (wpn) =>
    el = $ 'div'
    el.classList.add 'name'
    name = localize wpn.names, wpn.name
    el.textContent += name
    el

  dropWeight: (wpn) =>
    odds = wpn.odds ? 100

    unless +odds
      el = $ 'div'
      if wpn.level is 100 # Genocide weapons
        el.classList.add 'na'
        el.textContent = 'N/A'
      else if odds is 0
        return '-'
      else
        el.classList.add odds
        el.textContent = odds.toUpperCase()
      return el

    label = odds + '%'
    if odds isnt 100
      el = $('div')
      el.classList.add if odds < 100 then 'lowOdds' else 'highOdds'
      el.textContent = label
      return el

    return label

  unlock: (wpn) =>
    return '€' unless wpn.unlock
    el = $ 'div'
    if wpn.unlock is 'box'
      el.classList.add 'lowOdds'
      el.textContent = 'Box ☢'
    else
      el.classList.add 'highOdds'
      el.textContent = 'DLC ☢'
    el

  fuseType: (wpn) =>
    return null unless wpn.fuseType
    localize wpn.fuseType

  ammo: (wpn) =>
    if wpn.shieldDurability
      percent wpn.shieldDurability, 0
    else
      wpn.ammo

  defense: (wpn) =>
    if wpn.shieldDamageReduction?
      percent 1 - wpn.shieldDamageReduction, 0
    else if wpn.defense?
      wpn.defense + '%'
    else if wpn.supportType is 'guard'
      percent wpn.damage, 2

  boost: (wpn) => percent wpn.damage, 2 if wpn.damage
  chargeTime: fpsProp 1
  piercing: bool 'piercing', '[PT]'
  range: (wpn) =>
    if wpn.range and wpn.growth
      maxRange = wpn.growth[wpn.growth.length - 1].range
      return "#{wpn.range}→#{maxRange}" unless maxRange is wpn.range

    return wpn.searchRange if wpn.searchRange
    return "+#{wpn.shieldAngle}°" if wpn.shieldAngle
    return "#{wpn.range}°" if wpn.category is 'shield'
    return wpn.range if wpn.range
    return null if (wpn.speed or 0) <= 0 or (wpn.life or 0) <= 0
    (wpn.speed * wpn.life).toFixed(1)

  piercingRange: (wpn) =>
    return null unless wpn.piercing
    life = if wpn.piercingLife then wpn.piercingLife + 1 else wpn.life
    (wpn.speed * (life or 1)).toFixed(1)

  lockRange: (wpn) =>
    return wpn.lockRangeRank if wpn.lockRangeRank
    if wpn.category is 'missile'
      return null unless wpn.lockRange
      return (+wpn.lockRange).toFixed(0)

    return null if (wpn.speed or 0) <= 0 or (wpn.life or 0) <= 0
    (wpn.speed * wpn.life).toFixed(0)

  effect: (wpn) =>
    return null unless wpn.effect
    tag = $ 'span'
    tag.classList.add 'status-effect'
    tag.classList.add wpn.effect
    tag.textContent = switch wpn.effect
      when 'flame' then 'Fire'
      when 'frozen' then 'Freeze'
      when 'shock' then 'Shock'
      when 'poison' then 'Poison'
      when 'recover' then 'Heal'
      when 'recovertime' then 'Regen'
      else wpn.effect
    tag

  revive: suffixProp 'revive', '%'
  shots: (wpn) =>
    shots = wpn.shots or 1
    if wpn.units > 1 then "#{wpn.units} x #{shots}" else shots

  units: (wpn) => wpn.units or 1
  radius: decimalProp 2
  subRadius: decimalProp 2
  energy: decimalProp 1

  duration: (wpn) =>
    seconds = wpn.fuseSeconds or wpn.durationSeconds
    return seconds if seconds
    duration = wpn.fuse or wpn.duration
    +(duration / FPS).toFixed(1) if duration

  interval: (wpn) =>
    if wpn.burst > 1 and wpn.rof
      return "#{wpn.rof.toFixed(1)} x #{wpn.burst}"
    if wpn.rof
      return wpn.rof.toFixed(1)

    rof = +(FPS / (wpn.interval or 1)).toFixed(2)
    if wpn.category is 'grenade' and not wpn.reload
      return rof

    if (wpn.ammo or 1) < 2 and wpn.reload < FPS
      return (FPS / wpn.reload).toFixed(1)

    return null unless wpn.interval

    if wpn.shotInterval and wpn.category isnt 'gunship' # Turrets
      return +(FPS / wpn.shotInterval).toFixed(2)

    return null if wpn.ammo < 2

    if wpn.category is 'short' and wpn.burst > 1
      return "- x #{wpn.burst}"

    isLockTime = wpn.lockTime or wpn.lockTimeSeconds
    if wpn.category is 'missile' and isLockTime and wpn.burstRate
      return (FPS / wpn.burstRate).toFixed(1)

    if wpn.burst > 1 and wpn.interval > 1
      burstRof = FPS / wpn.burstRate
      rof = FPS / ((wpn.burst - 1) * wpn.burstRate + wpn.interval)
      return "#{+rof.toFixed(2)} x #{wpn.burst}"

    return rof unless rof is Infinity

  interval2: (wpn) =>
    if wpn.shotInterval and wpn.shots >= 5
      (FPS / wpn.shotInterval).toFixed(1)

  intervalOD: suffixProp 'intervalOverdrive'
  reloadOD: suffixProp 'reloadOverdrive'
  windup: fpsProp 2
  swing: suffixProp 'swing'

  lockTime: (wpn) =>
    return wpn.lockTimeSeconds if wpn.lockTimeSeconds
    byFps wpn.lockTime, 2 if wpn.lockTime

  credits: bool 'credits', '(CR)'

  reload: (wpn) =>
    return wpn.reloadSeconds if wpn.reloadSeconds
    return null if wpn.reload < 0 or not wpn.reload
    return wpn.reload if wpn.credits
    byFps wpn.reload, 2

  reloadQuick: (wpn) =>
    if wpn.tags?.includes 'reload_auto'
      'Auto'
    else if wpn.tags?.includes 'reload_charge'
      'Charge'
    else if wpn.reloadQuick and wpn.reloadSeconds
      start = (wpn.reloadSeconds * wpn.reloadQuick * 0.01)
      end = start + wpn.reloadQuickWindow
      "#{start.toFixed(1)} - #{end.toFixed(1)}"

  accuracy: (wpn) =>
    el = $ 'div'
    el.setAttribute 'title',
      if wpn.accuracy? wpn.accuracy
      else 'Accuracy only known by rank'
    el.textContent = accuracy wpn
    el

  altFire: (wpn) =>
    if wpn.zoom > 0 then "⌖ #{+wpn.zoom.toFixed(1)}x"
    else switch wpn.secondary
      when 4 then '⇑' # Boost
      when 5 then '⇒' # Dash
      when 6 then '🛡' # Reflect

  zoom: (wpn) =>
    if wpn.zoom is true then '✓'
    else if wpn.zoom > 0
      "#{+wpn.zoom.toFixed(1)}x"

  chargeRate: (wpn) => chargeRate(wpn).toFixed(1)
  chargeRatio: (wpn) => percent(chargeRate(wpn) / wpn.energy, 2)
  chargeEmergencyRate: (wpn) => chargeEmergencyRate(wpn).toFixed(1)
  chargeEmergencyRatio: (wpn) => percent(chargeEmergencyRate(wpn) / wpn.energy, 2)
  energyUse: (wpn) => energyUse(wpn).toFixed(1)
  energyUseRatio: (wpn) => percent(energyUse(wpn) / wpn.energy, 2)
  boostUse: (wpn) => boostUse(wpn).toFixed(1)
  boostUseRatio: (wpn) => percent(boostUse(wpn) / wpn.energy, 2)

  speed: (wpn) =>
    return percent wpn.walkSpeed, 0 if wpn.walkSpeed
    return percent wpn.flightSpeedHorizontal if wpn.flightSpeedHorizontal
    speed = wpn.speed * FPS
    return null if speed > 10000 or not speed
    speed.toFixed(1)

  speed2: percentProp 0, 'speed'
  flightBoost: percentProp 0, 'flightSpeedVertical'
  dashForwardBoost: boostProp 'boostForward'
  dashBackwardBoost: boostProp 'boostRear'
  dashSideBoost: boostProp 'boostSide'
  airControl: percentProp 0
  reloadBoost: boostProp 'weaponReload'
  hitSlowdown: percentProp 0
  sprintSpeedBoost: percentProp 0, 'sprintSpeed'
  sprintTurnBoost: percentProp 0, 'sprintSwirl'
  sprintAccelerationBoost: percentProp 0, 'sprintAcceleration'
  sprintHitSlowdown: percentProp 0
  sprintBreakObstacles: bool 'sprintDestruction'
  lockSpeedBoost: suffixProp 'lockTime'
  lockRangeBoost: suffixProp 'lockRange'
  lockMulti: bool 'isMultiLock'
  dashCooldown: percentProp 0, 'dashInterval'
  boostSpeed: percentProp 0
  healAllyBoost: percentProp 0, 'allyRecovery'
  probeRadius: percentProp 0, 'itemRange', -1
  knockdownImmunity: bool 'isKnockImmune'

  convertible: (wpn) =>
    if wpn.dashToBoost then "⇒ → ⇑"
    else if wpn.boostToDash then "⇑ → ⇒"

  shieldUse: percentProp 0, 'shieldConsumption'
  shieldReflectUse: percentProp 0, 'shieldDeflectConsumption'
  shieldKnockback: percentProp 0
  equipWalkReduction: invertPercentProp 0, 'equipWeightMoveReduction'
  equipTurnReduction: invertPercentProp 0, 'equipWeightTurnReduction'
  recoil: invertPercentProp 0, 'equipRecoil'
}
