import { accuracy } from 'coffee-loader!./accuracy.coffee'

$ = document.createElement.bind document
FPS = 60

weaponKey = (wpn ,type = 'owned') =>
  scope = if locals.game.id is '41' then '' else ".#{locals.game.id[3..]}"
  "#{type}#{scope}.#{wpn.id}"

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

SCALED_PROPS = [
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

export processWeapon = (wpn) =>
  obj = { wpn... }

  if wpn.category is 'core' and wpn.energy
    obj.baseEnergy = wpn.energy.base or wpn.energy

  for prop in SCALED_PROPS
    if wpn[prop]?.base?
      obj[prop] = getValue wpn, prop, obj
  obj

percent = (val, decimals) =>
  (100 * val).toFixed(decimals) + '%'

byFps = (val, decimals) =>
  (val / FPS).toFixed(decimals)

decimalProp = (decimals, propOverride) =>
  (wpn, prop) =>
    value = wpn[propOverride or prop]
    value.toFixed(decimals) if value

percentProp = (decimals, propOverride) =>
  (wpn, prop) =>
    value = wpn[propOverride or prop]
    percent value, decimals if value

invertPercentProp = (decimals, propOverride) =>
  (wpn, prop) =>
    value = wpn[propOverride or prop]
    percent 1 - value, decimals if value?

fpsProp = (decimals, propOverride) =>
  (wpn, prop) =>
    value = wpn[propOverride or prop]
    byFps value, decimals if value

suffixProp = (mark = "x", propOverride) =>
  (wpn, prop) =>
    value = wpn[propOverride or prop]
    "#{value}x" if value

bool = (mark, propOverride) =>
  (wpn, prop) =>
    mark if wpn[propOverride or prop]

falloff = (wpn, dmg) =>
  [ (+dmg).toFixed(1),
    (dmg * wpn.falloff[0]).toFixed(1)
  ].join('~')

export localize = (prop, fallback) =>
  unless prop
    return fallback or null
  if typeof prop is 'string'
    return prop
  if prop[locals.lang]?
    return prop[locals.lang]
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

export weaponStats =
  checkbox: (wpn) =>
    return '' unless wpn.id
    key = weaponKey wpn
    el = $ 'input'
    el.setAttribute 'type' ,'checkbox'
    el.setAttribute 'checked', '1' if localStorage[key] > 0
    el.setAttribute 'onchange', "toggleCheckWeapon('owned', '#{wpn.id}')"
    el.outerHTML

  stars: (wpn) =>
    return '' unless wpn.id
    key = weaponKey wpn, 'starred'
    el = $ 'input'
    el.setAttribute 'type' ,'checkbox'
    el.setAttribute 'checked', '1' if localStorage[key] > 0
    el.setAttribute 'onchange', "toggleCheckWeapon('owned', '#{wpn.id}')"
    el.outerHTML

  level: (wpn) =>
    { level } = wpn
    return null unless level?
    return level if isNaN(level)
    [offline, online] = locals.modes[1..]
    mode = [online, offline].find (m) => m?.difficulties?.length
    return null unless mode

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
    el.outerHTML

  rank: (wpn) =>
    { rank } = wpn
    return null unless rank?
    el = $ 'div'
    el.classList.add "rank-#{rank}"
    el.textContent = rank
    el.outerHTML

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
    el.outerHTML

  dropWeight: (wpn) =>
    odds = wpn.odds ? 100

    unless !+odds
      el = $ 'div'
      if wpn.level is 100 # Genocide weapons
        el.classList.add 'na'
        el.textContent = 'N/A'
      else
        el.classList.add odds
        el.textContent = odds.toUpperwhen()
      return el.outerHTML

    label = percent odds, 0
    if odds isnt 100
      el = $('div')
      el.classList.add if odds < 100 then 'lowOdds' else 'highOdds'
      el.textContent = label
      return el.outerHTML

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
    el.outerHTML

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

  boost: percentProp 2
  chargeTime: fpsProp 1
  piercing: bool '[PT]'

  damage: (wpn) =>
    return localize wpn.damageRank if wpn.damageRank?
    return wpn.recoveryAmount if wpn.recoveryAmount?
    return null unless wpn.damage

    if wpn.damage2 and wpn.tags?.includes 'puncher'
      return "#{wpn.damage} | #{wpn.damage2} x #{wpn.count}"

    if ['power', 'guard'].includes wpn.supportType
      return "#{(+wpn.damage).toFixed(2)}"

    if wpn.damage < 1 and wpn.damage > -1
      return +Math.abs(wpn.damage).toFixed(2)

    dmg = +Math.abs(wpn.damage).toFixed(1)
    if wpn.falloff
      dmg = falloff wpn, dmg

    if wpn.growth
      maxDmg = wpn.growth[wpn.growth.length - 1].damage
      if maxDmg > dmg
        dmg = "#{dmg}→#{maxDmg}"

    if wpn.count > 1
      dmg = "#{dmg} x #{wpn.count}"

    return dmg if wpn.type is 'SentryGunBullet01'

    ignoreShots = [
      'raid',
      'artillery',
      'gunship',
      'planes',
      'missile',
      'satellite',
    ].includes(wpn.category) or (
      wpn.character is 'winger' and [
        'special',
      ].includes(wpn.category))

    if wpn.shots > 1 and not ignoreShots
      dmg = "#{dmg} x #{wpn.shots}"

    dmg

  damage2: (wpn) =>
    return null unless wpn.continous
    dmg = Math.abs wpn.damage
    return +Math.abs(dmg * wpn.duration).toFixed(1)

  damageType: (wpn) =>
    type = switch wpn.damageType
      when 'physical' then 'P'
      when 'optics' then 'O'
      when 'flame' then 'F'
    return null unless type
    tag = $ 'span'
    tag.classList.add 'damage-type'
    tag.classList.add wpn.damageType
    tag.textContent = type
    tag.outerHTML

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
    tag.outerHTML

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

  intervalOD: suffixProp 'x', 'intervalOverdrive'
  reloadOD: suffixProp 'x', 'reloadOverdrive'
  windup: fpsProp 2
  swing: suffixProp 'x', 'swing'

  lockTime: (wpn) =>
    return wpn.lockTimeSeconds if wpn.lockTimeSeconds
    byFps wpn.lockTime, 2 if wpn.lockTime

  credits: bool '(CR)'

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
    el.outerHTML

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
    speed = wpn.speed / FPS
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
  sprintHitSlowDown: percentProp 0
  sprintBreakObstacles: bool '✓', 'sprintDestruction'
  lockSpeedBoost: suffixProp 'x', 'lockTime'
  lockRangeBoost: suffixProp 'x', 'lockRange'
  lockMulti: bool '✓', 'isMultiLock'
  dashCooldown: percentProp 0, 'dashInterval'
  boostSpeed: percentProp 0

  convertible: (wpn) =>
    if wpn.dashToBoost then "⇒ → ⇑"
    else if wpn.boostToDash then "⇑ → ⇒"

  shieldUse: percentProp 0, 'shieldConsumption'
  shieldReflectUse: percentProp 0, 'shieldDeflectConsumption'
  shieldKnockback: percentProp 0
  equipWalkReduction: invertPercentProp 0, 'equipWeightMoveReduction'
  equipTurnReduction: invertPercentProp 0, 'equipWeightTurnReduction'
  recoil: invertPercentProp 0, 'equipRecoil'
