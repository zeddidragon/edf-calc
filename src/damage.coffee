import { FPS, byFps } from './framerate.coffee'
$ = document.createElement.bind document

critAvg = (wpn) =>
  { damage } = wpn
  if wpn.critOver
    damage += (wpn.damage2 - damage) / wpn.critOver
  damage * (wpn.count || 1)

falloff = (wpn, dmg) =>
  return [
    (+dmg).toFixed(1)
    (dmg * wpn.falloff[0]).toFixed(1)
  ].join('~')

burstDamage = (wpn) => shotDamage(wpn) * (wpn.burst or 1)

shotDamage = (wpn) =>
  Math.abs wpn.damage * (wpn.count or 1) * (wpn.shots or 1)

curvedMagDamage = (wpn) =>
  perShot = shotDamage wpn
  dmgCurve = wpn.ammoDamageCurve or 0
  countCurve = wpn.ammoCountCurve or 0
  sum = 0
  i = 0
  while i < wpn.ammo
    x = (wpn.ammo - i) / wpn.ammo
    count = Math.ceil(wpn.count * Math.pow(x, countCurve)) || 1
    dmg = wpn.damage * Math.pow(x, dmgCurve)
    sum += dmg * count
    i += (wpn.drain or 1)
  sum

growingMagDamage = (wpn) =>
  dmg = critAvg wpn
  sum  = 0
  i = 0
  for step in wpn.growth
    sum += (step.n - i) * dmg
    dmg = step.damage * (wpn.count || 1)
    i = step.n
  sum + dmg * (wpn.ammo - i)

magDamage = (wpn) =>
  if wpn.ammoDamageCurve or wpn.ammoCountCurve
    curvedMagDamage wpn
  else if wpn.growth?.length
    growingMagDamage wpn
  else
    shotDamage(wpn) * Math.ceil(wpn.ammo / (wpn.drain or 1))

window.burstTime = (wpn) =>
  (wpn.burst or 1) * (wpn.burstRate or 1) + (wpn.interval or 1)

window.quickDps = (wpn) =>
  FPS * burstDamage(wpn) / burstTime(wpn)

window.tacticalDps = (wpn) =>
  magDamage(wpn) / cycleTime(wpn)

window.cycleTime = (wpn) =>
  interval = wpn.interval or 1
  bursts = wpn.ammo / (wpn.burst or 1)
  bTime = burstTime(wpn)
  magTime = bursts * bTime + (wpn.reload or 0) - interval + (wpn.windup || 0)
  if wpn.lockType is 1
    count = if wpn.lockDist is 1 then wpn.count else wpn.ammo
    magTime += (wpn.lockTime or 0) * count
  (magTime || interval) / FPS

export headers =
  damage: (wpn) =>
    if wpn.damageRank?
      return localize wpn.damageRank

    if wpn.recoveryAmount?
      return wpn.recoveryAmount

    unless wpn.damage
      return null

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
      'raid'
      'artillery'
      'gunship'
      'planes'
      'missile'
      'satellite'
    ].includes(wpn.category) or (
      wpn.character is 'winger' and [
        'special'
      ].includes(wpn.category))

    if wpn.shots > 1 and not ignoreShots
      dmg = "#{dmg} x #{wpn.shots}"

    dmg

  damage2: (wpn) =>
    unless wpn.continous
      return null

    dmg = Math.abs wpn.damage
    return +Math.abs(dmg * wpn.duration).toFixed(1)

  damageType: (wpn) =>
    type = switch wpn.damageType
      when 'physical' then 'P'
      when 'optics' then 'O'
      when 'flame' then 'F'

    unless type
      return null

    tag = $ 'span'
    tag.classList.add 'damage-type'
    tag.classList.add wpn.damageType
    tag.textContent = type
    tag.outerHTML

  dps: (wpn) =>
    if wpn.critOver # Iron Rain Ghost line
      damage = critAvg wpn
      return (damage * wpn.rof).toFixed()

    if wpn.recoveryAmount
      return (wpn.recoveryAmount * FPS).toFixed()

    unless wpn.damage
      return null

    if wpn.shotInterval and wpn.category isnt 'gunship' # Turret
      return quickDps({
        ...wpn
        shots: wpn.ammo
        interval: wpn.shotInterval
      }).toFixed()

    if wpn.ammo < 2 and not wpn.duration
      return null

    if wpn.rof
      return (wpn.damage * (wpn.count or 1) * wpn.rof).toFixed()

    if wpn.burst > 100
      return (wpn.damage * FPS / (wpn.burstRate || 1)).toFixed()

    if wpn.category is 'support'
      unless ['life', 'plasma'].includes wpn.supportType
        return null

      return +(wpn.damage * FPS).toFixed()

    if wpn.duration and not wpn.continous
      burstDmg = burstDamage wpn
      return +(burstDmg * FPS / wpn.duration).toFixed()

    if wpn.interval
      quickDps(wpn).toFixed()

  dps2: (wpn) =>
    if wpn.shotInterval && wpn.shots > 5 # Turret or gunship
      return quickDps({
        ...wpn
        shots: 1
        interval: wpn.shotInterval
      }).toFixed()

    if wpn.category is 'gunship'
      return null

    if wpn.recoveryAmount
      return (wpn.ammo * wpn.recoveryAmount * FPS).toFixed()

    if wpn.category is 'support'
      unless ['life', 'plasma'].includes wpn.supportType
        return null
      if wpn.ammo < 2
        return null

      return +(wpn.damage * FPS * wpn.ammo).toFixed()

    if wpn.continous
      return +Math.abs((wpn.damage *
        wpn.duration *
        FPS /
        (wpn.interval or 1)
      )).toFixed()

  tdps: (wpn) =>
    return null if wpn.credits
    return null unless wpn.damage
    return null if wpn.reloadSeconds <= 0

    if wpn.rof or wpn.reloadSeconds
      ammo = wpn.ammo || 1
      magTime = (ammo / wpn.rof) or 0
      magDump = magDamage wpn
      duration = magTime + (wpn.reloadSeconds || 0)
      return (magDump / duration).toFixed()

    return null unless wpn.ammo
    return null if wpn.attacks?.length
    return null unless wpn.reload > 0

    if wpn.shotInterval # Turret
      return +tacticalDps({
        ...wpn
        shots: wpn.ammo
        interval: wpn.shotInterval
        ammo: wpn.shots
      }).toFixed()

    tacticalDps(wpn).toFixed()

  tdps2: (wpn) =>
    if wpn.continous # Flamethrower
      +(tacticalDps(wpn) * wpn.duration).toFixed(1)

    else if wpn.lockType is 1
      +tacticalDps({
        ...wpn
        lockType: 0
      }).toFixed(1)

  qrdps: (wpn) =>
    return null unless wpn.reloadQuick
    return null unless wpn.rof or wpn.reloadSeconds

    ammo = wpn.ammo or 1
    magTime = (ammo > 1 and ammo / wpn.rof) or 0
    magDump = magDamage wpn
    reload = wpn.reloadSeconds * wpn.reloadQuick / 100
    duration = magTime + (reload or 0)
    (magDump / duration).toFixed()

  total: (wpn) =>
    if wpn.recoveryAmount
      return +(wpn.recoveryAmount * wpn.durationSeconds * FPS).toFixed()

    if wpn.total
      return wpn.total

    if wpn.attacks?.length and wpn.damage
      attacks = wpn.attacks.map(a => a.damage * wpn.damage)
      count = wpn.count or 1
      dump = Array(Math.floor(wpn.ammo / count))
        .fill 0
        .map (w, i) => attacks[i % attacks.length] * count
        .reduce (dmg, sum = 0) => dmg + sum
      return +dump.toFixed()

    if not wpn.ammo and wpn.isSubAttack
      return null

    unless wpn.damage
      return null

    if wpn.category is 'support'
      unless ['life', 'plasma'].includes wpn.supportType
        return null
      return +(wpn.damage * wpn.life).toFixed()

    if wpn.ammoDamageCurve or wpn.ammoCountCurve or wpn.growth?.length
      return magDamage(wpn).toFixed()

    Math.abs(critAvg(wpn) *
      Math.ceil((wpn.ammo or 1) / (wpn.drain or 1)) *
      (wpn.shots || 1) *
      (wpn.units || 1)
    ).toFixed()

  total2: (wpn) =>
    if wpn.recoveryAmount
      return +(wpn.ammo * wpn.recoveryAmount * wpn.durationSeconds * FPS).toFixed()

    if wpn.category is 'support'
      unless ['life', 'plasma'].includes wpn.supportType
        return null

      if wpn.ammo < 2
        return null

      return +(wpn.damage * wpn.life * wpn.ammo).toFixed(1)

    if wpn.continous
      dump = wpn.damage *
        (wpn.count or 1) *
        (wpn.ammo or 1) *
        (wpn.shots or 1) *
        (wpn.units or 1)
      return +(Math.abs(dump) * wpn.duration).toFixed(1)

  dpe: (wpn) =>
    return null unless wpn.damage
    return null if (wpn.energy or 0) < 0.05

    (magDamage(wpn) / wpn.energy).toFixed(1)

  eps: (wpn) =>
    if (wpn.energy or 0) < 0.05
      return null

    if wpn.rof and not (wpn.ammo > 1)
      return (wpn.energy * wpn.rof).toFixed(1)

    if wpn.reloadSeconds
      time = wpn.reloadSeconds
      if wpn.ammo > 1
        time += wpn.ammo / wpn.rof

      return (wpn.energy / time).toFixed(1)

    return (wpn.energy / cycleTime(wpn)).toFixed(1)
