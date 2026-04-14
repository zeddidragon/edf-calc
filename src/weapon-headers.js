const headers = [{
  id: 'piercingRange',
  label: 'PtRng',
  tooltip: 'Piercing Range',
  starProp: 'speed',
  cb: wpn => {
    if(!wpn.piercing) {
      return '-'
    }
    const life = (wpn.piercingLife ? wpn.piercingLife + 1 : wpn.life) || 1
    return (wpn.speed * life).toFixed(1)
  },
}, {
  id: 'range',
  label: 'Rng',
  tooltip: 'Range',
  starProp: 'speed',
  cb: wpn => {
    if(wpn.range && wpn.growth) {
      const maxRange = wpn.growth[wpn.growth.length - 1].range
      if(maxRange !== wpn.range) {
        return "#{wpn.range}→#{maxRange}"
      }
    }
    if(wpn.range) {
      return wpn.range
    }
    if(wpn.searchRange) {
      return wpn.searchRange
    }
    if(wpn.shieldAngle) {
      return "+#{wpn.shieldAngle}°"
    }
    if(wpn.category === 'shield') {
      return "#{wpn.range}°"
    }
    if(!wpn.life || !wpn.speed) {
      return '-'
    }
    if((wpn.speed || 0) <= 0 || (wpn.life || 0) <= 0) {
      return '-'
    }
    return (wpn.speed * wpn.life).toFixed(1)
  },
}, {
  id: 'lockRange',
  label: 'Rng',
  tooltip: 'Lock-Range',
  starProp: 'lockRange',
  cb: wpn => {
    if(wpn.lockRangeRank) {
      return wpn.lockRangeRank
    }
    if(wpn.category === 'missile') {
      if(!wpn.lockRange) {
        return '-'
      }
      return (+wpn.lockRange).toFixed(0)
    }
    if((wpn.speed || 0) <= 0 || (wpn.life || 0) <= 0) {
      return '-'
    }
    return (wpn.speed * wpn.life).toFixed(0)
  },
}, {
  id: 'boost',
  label: 'Boost',
  tooltip: 'Boost',
  cb: wpn => {
    if(wpn.damage) {
      return "#{Math.round(wpn.damage * 100) - 100}%"
    }
    return '-'
  },
}, {
  id: 'revive',
  label: 'Revive',
  tooltip: 'Revive Health %',
  cb: wpn => {
    if(wpn.revive) {
      return "#{wpn.revive}%"
    }
    return '-'
  },
}, {
  id: 'healAllyBoost',
  label: 'H.NPC',
  tooltip: 'Healing Ally Boost',
  cb: wpn => {
    if(wpn.allyRecovery) {
      return "#{Math.round(wpn.allyRecovery * 100)}%"
    }
    return '-'
  },
}, {
  id: 'probeRadius',
  label: 'Probe',
  tooltip: 'Pickup Radius',
  cb: wpn => {
    if(wpn.itemRange) {
      return "#{Math.round(wpn.itemRange * 100 - 100)}%"
    }
    return '-'
  },
}, {
  id: 'knockdownImmunity',
  label: 'KD.Im',
  tooltip: 'Knockdown Immunity',
  cb: wpn => {
    if(wpn.isKnockImmune) {
      return '✓'
    }
    return '-'
  },
}, {
  id: 'dps',
  label: 'DPS',
  tooltip: 'Damage Per Second',
  cb: wpn => {
    if(wpn.critOver) { // Iron Rain Ghost line
      let damage = critAvg(wpn)
      return (damage * wpn.rof).toFixed()
    }
    if(wpn.recoveryAmount) {
      return (wpn.recoveryAmount * FPS).toFixed()
    }
    if(!wpn.damage) {
      return '-'
    }
    if(wpn.shotInterval && wpn.category !== 'gunship') { // Turret
      return quickDps({
        ...wpn,
        shots: wpn.ammo,
        interval: wpn.shotInterval,
      }).toFixed()
    }
    if(wpn.ammo < 2 && !wpn.duration) {
      return '-'
    }
    if(wpn.rof) {
      return (wpn.damage * (wpn.count || 1) * wpn.rof).toFixed()
    }
    if(wpn.burst > 100) {
      return (wpn.damage * FPS / (wpn.burstRate || 1)).toFixed()
    }
    if(wpn.category === 'support') {
      if(!['life', 'plasma'].includes(wpn.supportType)) {
        return '-'
      }
      return +(wpn.damage * FPS).toFixed()
    }
    if(wpn.duration && !wpn.continous) {
      const bDmg = burstDamage(wpn)
      return +(bDmg * FPS / wpn.duration).toFixed()
    }
    if(!wpn.interval) {
      return '-'
    }
    return quickDps(wpn).toFixed()
  },
}, {
  id: 'dps2',
  label: 'DPS*',
  tooltip: 'Damage Per Second*',
  cb: wpn => {
    if(wpn.shotInterval && wpn.shots > 5) { // Turret or gunship
      return quickDps({
        ...wpn,
        shots: 1,
        interval: wpn.shotInterval,
      }).toFixed()
    }
    if(wpn.category === 'gunship') {
      return '-'
    }
    if(wpn.recoveryAmount) {
      return (wpn.ammo * wpn.recoveryAmount * FPS).toFixed()
    }
    if(wpn.category === 'support') {
      if(!['life', 'plasma'].includes(wpn.supportType)) {
        return '-'
      }
      if(wpn.ammo < 2) {
        return '-'
      }
      return +(wpn.damage * FPS * wpn.ammo).toFixed()
    }
    if(wpn.continous) {
      return +Math.abs((wpn.damage
        * wpn.duration
        * FPS
        / (wpn.interval || 1)
      )).toFixed()
    }
    return '-'
  },
}, {
  id: 'tdps',
  label: 'TDPS',
  tooltip: 'Total Damage Per Second (including reload)',
  cb: wpn => {
    if(wpn.credits) {
      return '-'
    }
    if(!wpn.damage) {
      return '-'
    }
    if(wpn.reloadSeconds <= 0) {
      return '-'
    }
    if(wpn.rof || wpn.reloadSeconds) {
      const ammo = wpn.ammo || 1
      const magTime = (ammo > 1 && ammo / wpn.rof) || 0
      const magDump = magDamage(wpn)
      const duration = magTime + (wpn.reloadSeconds || 0)
      return (magDump / duration).toFixed()
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
      }).toFixed()
    }
    const tdps = tacticalDps(wpn)
    return tdps.toFixed()
  },
}, {
  id: 'qrdps',
  label: 'Q.DPS',
  tooltip: 'Total Damage Per Second (including quick reload)',
  cb: wpn => {
    if(wpn.reloadQuick && (wpn.rof || wpn.reloadSeconds)) {
      const ammo = wpn.ammo || 1
      const magTime = (ammo > 1 && ammo / wpn.rof) || 0
      const magDump = magDamage(wpn)
      const reload = wpn.reloadSeconds * wpn.reloadQuick / 100
      const duration = magTime + (reload || 0)
      return (magDump / duration).toFixed()
    }
    return '-'
  },
}, {
  id: 'tdps2',
  label: 'TDPS*',
  tooltip: 'Total Damage Per Second (including reload)*',
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
  id: 'total',
  label: 'Total',
  tooltip: 'Total Damage',
  cb: wpn => {
    if(wpn.recoveryAmount) {
      return +(wpn.recoveryAmount * wpn.durationSeconds * FPS).toFixed()
    }
    if(wpn.total) {
      return wpn.total
    }
    if(wpn.attacks?.length && wpn.damage) {
      const attacks = wpn.attacks.map(a => a.damage * wpn.damage)
      const count = wpn.count || 1
      const dump = Array(Math.floor(wpn.ammo / count))
        .fill(0)
        .map((w, i) => attacks[i % attacks.length] * count)
        .reduce((dmg, sum) => dmg + sum, 0)
      return +dump.toFixed()
    }
    if(!wpn.ammo && wpn.isSubAttack) {
      return '-'
    }
    if(!wpn.damage) {
      return '-'
    }
    if(wpn.category === 'support') {
      if(!['life', 'plasma'].includes(wpn.supportType)) {
        return '-'
      }
      return +(wpn.damage * wpn.life).toFixed()
    }
    if(wpn.ammoDamageCurve || wpn.ammoCountCurve || wpn.growth?.length) {
      return magDamage(wpn).toFixed()
    }
    const dump = Math.abs(critAvg(wpn)
      * Math.ceil((wpn.ammo || 1) / (wpn.drain || 1))
      * (wpn.shots || 1)
      * (wpn.units || 1))
    return +dump.toFixed()
  },
}, {
  id: 'total2',
  label: 'Total*',
  tooltip: 'Total Damage*',
  cb: wpn => {
    if(wpn.recoveryAmount) {
      return +(wpn.ammo * wpn.recoveryAmount * wpn.durationSeconds * FPS).toFixed()
    }
    if(wpn.category === 'support') {
      if(!['life', 'plasma'].includes(wpn.supportType)) {
        return '-'
      }
      if(wpn.ammo < 2) {
        return '-'
      }
      return +(wpn.damage * wpn.life * wpn.ammo).toFixed(1)
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
}, {
  id: 'eps',
  label: 'EPS',
  tooltip: 'Energy Per Second',
  cb: wpn => {
    if((wpn.energy || 0) < 0.05) {
      return '-'
    }
    if(wpn.rof && !(wpn.ammo > 1 )) {
      return (wpn.energy * wpn.rof).toFixed(1)
    }
    if(wpn.reloadSeconds) {
      let time = wpn.reloadSeconds
      if(wpn.ammo > 1) {
        time += wpn.ammo / wpn.rof
      }
      return (wpn.energy / time).toFixed(1)
    }
    return (wpn.energy / cycleTime(wpn)).toFixed(1)
  },
}, {
  id: 'dpe',
  label: 'DPE',
  tooltip: 'Damage Per Energy',
  cb: wpn => {
    if((wpn.energy || 0) < 0.05) {
      return '-'
    }
    if(!wpn.damage) {
      return '-'
    }
    return ( wpn.damage
      * (wpn.count || 1)
      * (wpn.ammo || 1)
      / wpn.energy
    ).toFixed(1)
  },
}]
