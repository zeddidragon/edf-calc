/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./src/scripts/accuracy.coffee"
/*!*************************************!*\
  !*** ./src/scripts/accuracy.coffee ***!
  \*************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   accuracy: () => (/* binding */ accuracy)
/* harmony export */ });
var accuracyTable;

accuracyTable = [[0.0005, 'S++'], [0.0025, 'S+'], [0.01, 'A+'], [0.014999, 'A'], [0.02, 'A-'], [0.03, 'B+'], [0.05, 'B'], [0.10, 'B-'], [0.15, 'C+'], [0.20, 'C'], [0.24998, 'C-'], [0.3, 'D'], [0.4, 'E'], [0.5, 'F'], [0.6, 'G'], [0.8, 'I'], [1.0, 'J'], [1.2, 'K'], [1.6, 'L'], [2e308, 'Z']];

var accuracy = (wpn) => {
  var rank;
  if (wpn.accuracyRank) {
    switch ((rank = wpn.accuracyRank)) {
      case 'horizontal':
        return '↔';
      case 'vertical':
        return '↕';
      case 'circle':
        return '○';
      case 'spherical':
        return 'Sphere';
      case 'downward':
        return 'Down';
      default:
        return rank;
    }
  } else if (wpn.speed) {
    return accuracyTable.find(([a]) => {
      return a >= (wpn.accuracy || 0);
    })[1];
  }
};


/***/ },

/***/ "./src/scripts/damage.coffee"
/*!***********************************!*\
  !*** ./src/scripts/damage.coffee ***!
  \***********************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   headers: () => (/* binding */ headers)
/* harmony export */ });
/* harmony import */ var _framerate__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./framerate */ "./src/scripts/framerate.coffee");
/* harmony import */ var _lang__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./lang */ "./src/scripts/lang.coffee");
var $, burstDamage, critAvg, curvedMagDamage, falloff, growingMagDamage, magDamage, shotDamage;





$ = document.createElement.bind(document);

critAvg = (wpn) => {
  var damage;
  ({damage} = wpn);
  if (wpn.critOver) {
    damage += (wpn.damage2 - damage) / wpn.critOver;
  }
  return damage * (wpn.count || 1);
};

falloff = (wpn, dmg) => {
  return [(+dmg).toFixed(1), (dmg * wpn.falloff[0]).toFixed(1)].join('~');
};

burstDamage = (wpn) => {
  return shotDamage(wpn) * (wpn.burst || 1);
};

shotDamage = (wpn) => {
  return Math.abs(wpn.damage * (wpn.count || 1) * (wpn.shots || 1));
};

curvedMagDamage = (wpn) => {
  var count, countCurve, dmg, dmgCurve, i, perShot, sum, x;
  perShot = shotDamage(wpn);
  dmgCurve = wpn.ammoDamageCurve || 0;
  countCurve = wpn.ammoCountCurve || 0;
  sum = 0;
  i = 0;
  while (i < wpn.ammo) {
    x = (wpn.ammo - i) / wpn.ammo;
    count = Math.ceil(wpn.count * Math.pow(x, countCurve)) || 1;
    dmg = wpn.damage * Math.pow(x, dmgCurve);
    sum += dmg * count;
    i += wpn.drain || 1;
  }
  return sum;
};

growingMagDamage = (wpn) => {
  var dmg, i, j, len, ref, step, sum;
  dmg = critAvg(wpn);
  sum = 0;
  i = 0;
  ref = wpn.growth;
  for (j = 0, len = ref.length; j < len; j++) {
    step = ref[j];
    sum += (step.n - i) * dmg;
    dmg = step.damage * (wpn.count || 1);
    i = step.n;
  }
  return sum + dmg * (wpn.ammo - i);
};

magDamage = (wpn) => {
  var ref;
  if (wpn.ammoDamageCurve || wpn.ammoCountCurve) {
    return curvedMagDamage(wpn);
  } else if ((ref = wpn.growth) != null ? ref.length : void 0) {
    return growingMagDamage(wpn);
  } else {
    return shotDamage(wpn) * Math.ceil(wpn.ammo / (wpn.drain || 1));
  }
};

window.burstTime = (wpn) => {
  return (wpn.burst || 1) * (wpn.burstRate || 1) + (wpn.interval || 1);
};

window.quickDps = (wpn) => {
  return _framerate__WEBPACK_IMPORTED_MODULE_0__.FPS * burstDamage(wpn) / burstTime(wpn);
};

window.tacticalDps = (wpn) => {
  return magDamage(wpn) / cycleTime(wpn);
};

window.cycleTime = (wpn) => {
  var bTime, bursts, count, interval, magTime;
  interval = wpn.interval || 1;
  bursts = wpn.ammo / (wpn.burst || 1);
  bTime = burstTime(wpn);
  magTime = bursts * bTime + (wpn.reload || 0) - interval + (wpn.windup || 0);
  if (wpn.lockType === 1) {
    count = wpn.lockDist === 1 ? wpn.count : wpn.ammo;
    magTime += (wpn.lockTime || 0) * count;
  }
  return (magTime || interval) / _framerate__WEBPACK_IMPORTED_MODULE_0__.FPS;
};

var headers = {
  damage: (wpn) => {
    var dmg, ignoreShots, maxDmg, ref;
    if (wpn.damageRank != null) {
      return (0,_lang__WEBPACK_IMPORTED_MODULE_1__.localize)(wpn.damageRank);
    }
    if (wpn.recoveryAmount != null) {
      return wpn.recoveryAmount;
    }
    if (!wpn.damage) {
      return null;
    }
    if (wpn.damage2 && ((ref = wpn.tags) != null ? ref.includes('puncher') : void 0)) {
      return `${wpn.damage} | ${wpn.damage2} x ${wpn.count}`;
    }
    if (['power', 'guard'].includes(wpn.supportType)) {
      return `${(+wpn.damage).toFixed(2)}`;
    }
    if (wpn.damage < 1 && wpn.damage > -1) {
      return +Math.abs(wpn.damage).toFixed(2);
    }
    dmg = +Math.abs(wpn.damage).toFixed(1);
    if (wpn.falloff) {
      dmg = falloff(wpn, dmg);
    }
    if (wpn.growth) {
      maxDmg = wpn.growth[wpn.growth.length - 1].damage;
      if (maxDmg > dmg) {
        dmg = `${dmg}→${maxDmg}`;
      }
    }
    if (wpn.count > 1) {
      dmg = `${dmg} x ${wpn.count}`;
    }
    if (wpn.type === 'SentryGunBullet01') {
      return dmg;
    }
    ignoreShots = ['raid', 'artillery', 'gunship', 'planes', 'missile', 'satellite'].includes(wpn.category) || (wpn.character === 'winger' && ['special'].includes(wpn.category));
    if (wpn.shots > 1 && !ignoreShots) {
      dmg = `${dmg} x ${wpn.shots}`;
    }
    return dmg;
  },
  damage2: (wpn) => {
    var dmg;
    if (!wpn.continous) {
      return null;
    }
    dmg = Math.abs(wpn.damage);
    return +Math.abs(dmg * wpn.duration).toFixed(1);
  },
  damageType: (wpn) => {
    var tag, type;
    type = (function() {
      switch (wpn.damageType) {
        case 'physical':
          return 'P';
        case 'optics':
          return 'O';
        case 'flame':
          return 'F';
      }
    })();
    if (!type) {
      return null;
    }
    tag = $('span');
    tag.classList.add('damage-type');
    tag.classList.add(wpn.damageType);
    tag.textContent = type;
    return tag.outerHTML;
  },
  dps: (wpn) => {
    var burstDmg, damage;
    if (wpn.critOver) { // Iron Rain Ghost line
      damage = critAvg(wpn);
      return (damage * wpn.rof).toFixed();
    }
    if (wpn.recoveryAmount) {
      return (wpn.recoveryAmount * _framerate__WEBPACK_IMPORTED_MODULE_0__.FPS).toFixed();
    }
    if (!wpn.damage) {
      return null;
    }
    if (wpn.shotInterval && wpn.category !== 'gunship') { // Turret
      return quickDps({
        ...wpn,
        shots: wpn.ammo,
        interval: wpn.shotInterval
      }).toFixed();
    }
    if (wpn.ammo < 2 && !wpn.duration) {
      return null;
    }
    if (wpn.rof) {
      return (wpn.damage * (wpn.count || 1) * wpn.rof).toFixed();
    }
    if (wpn.burst > 100) {
      return (wpn.damage * _framerate__WEBPACK_IMPORTED_MODULE_0__.FPS / (wpn.burstRate || 1)).toFixed();
    }
    if (wpn.category === 'support') {
      if (!['life', 'plasma'].includes(wpn.supportType)) {
        return null;
      }
      return +(wpn.damage * _framerate__WEBPACK_IMPORTED_MODULE_0__.FPS).toFixed();
    }
    if (wpn.duration && !wpn.continous) {
      burstDmg = burstDamage(wpn);
      return +(burstDmg * _framerate__WEBPACK_IMPORTED_MODULE_0__.FPS / wpn.duration).toFixed();
    }
    if (wpn.interval) {
      return quickDps(wpn).toFixed();
    }
  },
  dps2: (wpn) => {
    if (wpn.shotInterval && wpn.shots > 5) { // Turret or gunship
      return quickDps({
        ...wpn,
        shots: 1,
        interval: wpn.shotInterval
      }).toFixed();
    }
    if (wpn.category === 'gunship') {
      return null;
    }
    if (wpn.recoveryAmount) {
      return (wpn.ammo * wpn.recoveryAmount * _framerate__WEBPACK_IMPORTED_MODULE_0__.FPS).toFixed();
    }
    if (wpn.category === 'support') {
      if (!['life', 'plasma'].includes(wpn.supportType)) {
        return null;
      }
      if (wpn.ammo < 2) {
        return null;
      }
      return +(wpn.damage * _framerate__WEBPACK_IMPORTED_MODULE_0__.FPS * wpn.ammo).toFixed();
    }
    if (wpn.continous) {
      return +Math.abs(wpn.damage * wpn.duration * _framerate__WEBPACK_IMPORTED_MODULE_0__.FPS / (wpn.interval || 1)).toFixed();
    }
  },
  tdps: (wpn) => {
    var ammo, duration, magDump, magTime, ref;
    if (wpn.credits) {
      return null;
    }
    if (!wpn.damage) {
      return null;
    }
    if (wpn.reloadSeconds <= 0) {
      return null;
    }
    if (wpn.rof || wpn.reloadSeconds) {
      ammo = wpn.ammo || 1;
      magTime = (ammo / wpn.rof) || 0;
      magDump = magDamage(wpn);
      duration = magTime + (wpn.reloadSeconds || 0);
      return (magDump / duration).toFixed();
    }
    if (!wpn.ammo) {
      return null;
    }
    if ((ref = wpn.attacks) != null ? ref.length : void 0) {
      return null;
    }
    if (!(wpn.reload > 0)) {
      return null;
    }
    if (wpn.shotInterval) { // Turret
      return +tacticalDps({
        ...wpn,
        shots: wpn.ammo,
        interval: wpn.shotInterval,
        ammo: wpn.shots
      }).toFixed();
    }
    return tacticalDps(wpn).toFixed();
  },
  tdps2: (wpn) => {
    if (wpn.continous) { // Flamethrower
      return +(tacticalDps(wpn) * wpn.duration).toFixed(1);
    } else if (wpn.lockType === 1) {
      return +tacticalDps({
        ...wpn,
        lockType: 0
      }).toFixed(1);
    }
  },
  qrdps: (wpn) => {
    var ammo, duration, magDump, magTime, reload;
    if (!wpn.reloadQuick) {
      return null;
    }
    if (!(wpn.rof || wpn.reloadSeconds)) {
      return null;
    }
    ammo = wpn.ammo || 1;
    magTime = (ammo > 1 && ammo / wpn.rof) || 0;
    magDump = magDamage(wpn);
    reload = wpn.reloadSeconds * wpn.reloadQuick / 100;
    duration = magTime + (reload || 0);
    return (magDump / duration).toFixed();
  },
  total: (wpn) => {
    var attacks, count, dump, ref, ref1;
    if (wpn.recoveryAmount) {
      return +(wpn.recoveryAmount * wpn.durationSeconds * _framerate__WEBPACK_IMPORTED_MODULE_0__.FPS).toFixed();
    }
    if (wpn.total) {
      return wpn.total;
    }
    if (((ref = wpn.attacks) != null ? ref.length : void 0) && wpn.damage) {
      attacks = wpn.attacks.map(a(() => {
        return a.damage * wpn.damage;
      }));
      count = wpn.count || 1;
      dump = Array(Math.floor(wpn.ammo / count)).fill(0).map((w, i) => {
        return attacks[i % attacks.length] * count;
      }).reduce((dmg, sum = 0) => {
        return dmg + sum;
      });
      return +dump.toFixed();
    }
    if (!wpn.ammo && wpn.isSubAttack) {
      return null;
    }
    if (!wpn.damage) {
      return null;
    }
    if (wpn.category === 'support') {
      if (!['life', 'plasma'].includes(wpn.supportType)) {
        return null;
      }
      return +(wpn.damage * wpn.life).toFixed();
    }
    if (wpn.ammoDamageCurve || wpn.ammoCountCurve || ((ref1 = wpn.growth) != null ? ref1.length : void 0)) {
      return magDamage(wpn).toFixed();
    }
    return Math.abs(critAvg(wpn) * Math.ceil((wpn.ammo || 1) / (wpn.drain || 1)) * (wpn.shots || 1) * (wpn.units || 1)).toFixed();
  },
  total2: (wpn) => {
    var dump;
    if (wpn.recoveryAmount) {
      return +(wpn.ammo * wpn.recoveryAmount * wpn.durationSeconds * _framerate__WEBPACK_IMPORTED_MODULE_0__.FPS).toFixed();
    }
    if (wpn.category === 'support') {
      if (!['life', 'plasma'].includes(wpn.supportType)) {
        return null;
      }
      if (wpn.ammo < 2) {
        return null;
      }
      return +(wpn.damage * wpn.life * wpn.ammo).toFixed(1);
    }
    if (wpn.continous) {
      dump = wpn.damage * (wpn.count || 1) * (wpn.ammo || 1) * (wpn.shots || 1) * (wpn.units || 1);
      return +(Math.abs(dump) * wpn.duration).toFixed(1);
    }
  },
  dpe: (wpn) => {
    if (!wpn.damage) {
      return null;
    }
    if ((wpn.energy || 0) < 0.05) {
      return null;
    }
    return (magDamage(wpn) / wpn.energy).toFixed(1);
  },
  eps: (wpn) => {
    var time;
    if ((wpn.energy || 0) < 0.05) {
      return null;
    }
    if (wpn.rof && !(wpn.ammo > 1)) {
      return (wpn.energy * wpn.rof).toFixed(1);
    }
    if (wpn.reloadSeconds) {
      time = wpn.reloadSeconds;
      if (wpn.ammo > 1) {
        time += wpn.ammo / wpn.rof;
      }
      return (wpn.energy / time).toFixed(1);
    }
    return (wpn.energy / cycleTime(wpn)).toFixed(1);
  }
};


/***/ },

/***/ "./src/scripts/drops.coffee"
/*!**********************************!*\
  !*** ./src/scripts/drops.coffee ***!
  \**********************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   populateWeaponDrops: () => (/* binding */ populateWeaponDrops)
/* harmony export */ });
/* harmony import */ var _headers__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./headers */ "./src/scripts/headers.coffee");
var dropHeaders, pull;



dropHeaders = ['checkbox', 'stars', 'level', 'name', 'dropWeight'];

pull = (arr, item) => {
  var index;
  index = arr.indexOf(item);
  arr.splice(index, 1);
  return arr;
};

var populateWeaponDrops = () => {
  var cat, char, diffSpreads, difficulties, difficulty, dlc, downTo, dropsHigh, dropsLow, firstDrops, gameValues, i, j, k, l, lastDrops, len, m, missions, modeName, ref, ref1, ref2, ref3, ref4, table, upTo, v, weapons;
  ({
    weapons,
    char,
    cat,
    mode: {
      difficulties,
      missions,
      name: modeName
    },
    gameValues
  } = locals);
  table = {
    weapons: weapons.filter((wpn) => {
      return wpn.character === char.id;
    }).filter((wpn) => {
      return wpn.category === cat.id;
    }).map((wpn) => {
      return {...wpn};
    }),
    headers: [...dropHeaders]
  };
  if (!(gameValues != null ? gameValues.hasStars : void 0)) {
    pull(table.headers, 'stars');
  }
  if (!(gameValues != null ? gameValues.hasDropWeights : void 0)) {
    pull(table.headers, 'dropWeight');
  }
  locals.tables = [table];
  diffSpreads = {};
  for (j = 0, len = difficulties.length; j < len; j++) {
    difficulty = difficulties[j];
    ({dropsLow, dropsHigh} = difficulty);
    firstDrops = Array(150).fill(-1);
    lastDrops = Array(150).fill(-1);
    for (i = k = 0, ref = missions - 1; (0 <= ref ? k <= ref : k >= ref); i = 0 <= ref ? ++k : --k) {
      downTo = dropsLow[i];
      upTo = dropsHigh[i] - 1;
      for (v = l = ref1 = downTo, ref2 = upTo; (ref1 <= ref2 ? l <= ref2 : l >= ref2); v = ref1 <= ref2 ? ++l : --l) {
        lastDrops[v] = i;
      }
      for (v = m = ref3 = upTo, ref4 = downTo; (ref3 <= ref4 ? m <= ref4 : m >= ref4); v = ref3 <= ref4 ? ++m : --m) {
        if (firstDrops[v] >= 0) {
          break;
        }
        firstDrops[v] = i;
      }
    }
    diffSpreads[difficulty.name] = {firstDrops, lastDrops};
  }
  dlc = ['DLC1', 'DLC2'].indexOf(modeName) + 1;
  return table.weapons = table.weapons.map((wpn) => {
    var level, odds, weaponDlc;
    ({
      level,
      odds,
      dlc: weaponDlc
    } = wpn);
    wpn.drops = difficulties.map((diff) => {
      var from, isDropped, to;
      ({firstDrops, lastDrops} = diffSpreads[diff.name]);
      from = diff.dropsHigh.findIndex((v) => {
        return v >= level;
      });
      to = diff.dropsLow.findLastIndex((v) => {
        return v <= level;
      });
      isDropped = (typeof odds !== 'string' && odds !== 0) && (from > -1 && to > -1) && (!weaponDlc || weaponDlc === dlc);
      if (isDropped) {
        return {
          from: 1 + Math.max(from, 0),
          to: to < from ? missions : 1 + to
        };
      } else {
        return null;
      }
    });
    return wpn;
  });
};


/***/ },

/***/ "./src/scripts/enemies.coffee"
/*!************************************!*\
  !*** ./src/scripts/enemies.coffee ***!
  \************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   enemyStatModes: () => (/* binding */ enemyStatModes),
/* harmony export */   processEnemies: () => (/* binding */ processEnemies)
/* harmony export */ });
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./utils */ "./src/scripts/utils.coffee");
var getBaseHp;



getBaseHp = (enemy, difficulty = locals.diff) => {
  var i;
  i = Math.max(difficulty.index - 1, 0); // Easy mode is ignored
  if (Array.isArray(enemy.hp)) {
    return enemy.hp[i - 1] || (0,_utils__WEBPACK_IMPORTED_MODULE_0__.last)(enemy.hp || 0);
  } else {
    return enemy.hp || 0;
  }
};

window.getHp = (highLow) => {
  return (enemy, difficulty = locals.diff) => {
    var hp, hpScaling, playerScaling, progressScaling, ref;
    hp = getBaseHp(enemy, difficulty);
    hpScaling = ((ref = difficulty.enemyScaling) != null ? ref[0] : void 0) || 1;
    playerScaling = difficulty.playerScaling[locals.playerCount.index];
    progressScaling = difficulty.progressScaling[highLow];
    return hp * hpScaling * playerScaling * progressScaling / 10;
  };
};

window.getMissionHp = (enemy, difficulty, mission) => {
  var fraction, high, hp, hpScaling, low, playerScaling, progressScaling, ref;
  fraction = (mission - 1) / ((locals.mode.missions - 1) || 1);
  hp = getBaseHp(enemy, difficulty);
  low = hp * difficulty.progressScaling[0];
  high = hp * difficulty.progressScaling[1];
  hpScaling = ((ref = difficulty.enemyScaling) != null ? ref[0] : void 0) || 1;
  playerScaling = difficulty.playerScaling[locals.playerCount.index];
  progressScaling = low + (high - low) * fraction;
  return progressScaling * hpScaling * playerScaling / 10;
};

window.getHpLow = getHp(0);

window.getHpHigh = getHp(1);

window.calcMissionHps = () => {
  var e, hp, k, len, mission, ref, results, row, stagger;
  mission = +document.getElementById('mission-input').value;
  if (!mission) {
    return;
  }
  locals.mission = mission;
  ref = locals.enemies;
  results = [];
  for (k = 0, len = ref.length; k < len; k++) {
    e = ref[k];
    row = document.querySelector(`[data-enemy=${e.id}]`);
    if (!row) {
      continue;
    }
    hp = getMissionHp(e, locals.diff, mission);
    stagger = hp * e.stagger;
    row.querySelector('.mission-hp').textContent = hp.toFixed();
    if (stagger) {
      results.push(row.querySelector('.stagger').textContent = stagger.toFixed());
    } else {
      results.push(void 0);
    }
  }
  return results;
};

var processEnemies = (data) => {
  var enemy, hash, hashObj, k, len, previousHash, ref, results;
  locals.enemies = data.enemies.sort((a, b) => {
    var aHp, bHp, groupSort, hpSort, nameSort;
    groupSort = (a.group || '').localeCompare(b.group || '');
    if (groupSort) {
      return groupSort;
    }
    aHp = Array.isArray(a.hp) ? a.hp[0] : a.hp;
    bHp = Array.isArray(b.hp) ? b.hp[0] : b.hp;
    hpSort = aHp - bHp;
    if (hpSort) {
      return hpSort;
    }
    nameSort = (a.name || '').localeCompare(b.name || '');
    if (nameSort) {
      return nameSort;
    }
    return a.id.localeCompare(b.id);
  });
  previousHash = '';
  ref = locals.enemies;
  results = [];
  for (k = 0, len = ref.length; k < len; k++) {
    enemy = ref[k];
    hashObj = {...enemy};
    delete hashObj.id;
    delete hashObj.name;
    hash = JSON.stringify(hashObj);
    if (hash === previousHash) {
      enemy.isDuplicate = true;
    }
    results.push(previousHash = hash);
  }
  return results;
};

window.getCredits = (enemy) => {
  var hp, ref;
  hp = getBaseHp(enemy);
  return hp * ((ref = enemy.credits) != null ? ref : 1);
};

var enemyStatModes = (modes) => {
  if (!modes) {
    return [];
  }
  return modes.map((m) => {
    var difficulties, playerCount;
    playerCount = m.name === 'OFF' ? 2 : m.difficulties[0].playerScaling.length;
    difficulties = m.difficulties.map((diff, i) => {
      var players;
      players = diff.playerScaling.map((scale, j) => {
        var count;
        count = j + 1;
        return {
          id: count,
          index: j,
          name: `<b>${count}</b>P`,
          count,
          scale
        };
      });
      return {
        players,
        id: diff.name.toLowerCase(),
        index: i,
        ...diff
      };
    });
    return {
      ...m,
      id: `hp-${m.name.toLowerCase()}`,
      label: `<i>HP</i> <b>${m.name}</b>`,
      class: m.name.toLowerCase(),
      hasEnemies: true,
      difficulties
    };
  });
};


/***/ },

/***/ "./src/scripts/framerate.coffee"
/*!**************************************!*\
  !*** ./src/scripts/framerate.coffee ***!
  \**************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   FPS: () => (/* binding */ FPS),
/* harmony export */   byFps: () => (/* binding */ byFps)
/* harmony export */ });
var FPS = 60;

var byFps = (val, decimals) => {
  return (val / FPS).toFixed(decimals);
};


/***/ },

/***/ "./src/scripts/headers.coffee"
/*!************************************!*\
  !*** ./src/scripts/headers.coffee ***!
  \************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   headers: () => (/* binding */ headers)
/* harmony export */ });
var headers = {
  checkbox: {
    label: '✓',
    tooltip: 'Weapon Acquired'
  },
  stars: {
    label: '★',
    tooltip: 'Max Rank'
  },
  level: {
    label: 'Lv',
    tooltip: 'Level'
  },
  rank: {
    label: 'Rank',
    tooltip: 'Rank'
  },
  remarks: {
    label: 'Remarks',
    tooltip: 'Special Attributes'
  },
  name: {
    label: 'Name',
    tooltip: 'Name'
  },
  dropWeight: {
    label: 'Weight',
    tooltip: 'Relative Drop Chance'
  },
  unlock: {
    label: '🔒',
    tooltip: 'Obtainment method'
  },
  fuseType: {
    label: 'Fuse',
    tooltip: 'Fuse'
  },
  hp: {
    label: 'HP',
    tooltip: 'Durability'
  },
  fuel: {
    label: 'Fuel',
    tooltip: 'Fuel Capacity'
  },
  fuelUse: {
    label: 'Cns',
    tooltip: 'Fuel Consumption'
  },
  ammo: {
    label: 'Cap',
    tooltip: 'Ammo Capacity',
    starProp: 'ammo'
  },
  drain: {
    label: 'Drain',
    tooltip: 'Ammo Consumed Per Attack'
  },
  boost: {
    label: 'Boost',
    tooltip: 'Boost',
    starProp: 'damage'
  },
  defense: {
    label: 'Def',
    tooltip: 'Defense',
    starProp: 'damage'
  },
  chargeTime: {
    label: 'Chg',
    tooltip: 'Charge Time'
  },
  piercing: {
    label: 'P',
    tooltip: 'Piercing'
  },
  damage: {
    label: 'Dmg',
    tooltip: 'Damage',
    starProp: 'damage',
    starProp2: 'count'
  },
  damage2: {
    label: 'Dmg*',
    tooltip: 'Damage*'
  },
  damageType: {
    label: 'T',
    tooltip: 'Damage Type'
  },
  effect: {
    label: 'FX',
    tooltip: 'Status Effect'
  },
  shots: {
    label: 'Shots',
    tooltip: 'Shots'
  },
  units: {
    label: 'Units',
    tooltip: 'Number of Units'
  },
  radius: {
    label: 'Area',
    tooltip: 'Area',
    starProp: 'radius'
  },
  subRadius: {
    label: 'Area*',
    tooltip: 'Area*'
  },
  duration: {
    label: 'Dur',
    tooltip: 'Duration'
  },
  interval: {
    label: 'RoF',
    tooltip: 'Rate of Fire',
    starProp: 'interval'
  },
  interval2: {
    label: 'RoF*',
    tooltip: 'Rate of Fire (Barrage)'
  },
  intervalOD: {
    label: 'OD',
    tooltip: 'Rate of Fire Multiplier (OverDrive)'
  },
  windup: {
    label: 'Delay',
    tooltip: 'Windup Time',
    starProp: 'windup'
  },
  lockTime: {
    label: 'Lock',
    tooltip: 'Lock Time',
    starProp: 'lockTime'
  },
  delay: {
    label: 'Delay',
    tooltip: 'Waiting Time'
  },
  credits: {
    label: 'CR',
    tooltip: 'Credits'
  },
  reload: {
    label: 'Rel',
    tooltip: 'Reload Time',
    starProp: 'reload'
  },
  reloadQuick: {
    label: 'Q.Rl',
    tooltip: 'Quick Reload'
  },
  reloadOD: {
    label: 'OD',
    tooltip: 'Reload Time Multiplier (OverDrive)'
  },
  swing: {
    label: 'Swing',
    tooltip: 'Swing Speed'
  },
  accuracy: {
    label: 'Acc',
    tooltip: 'Accuracy',
    starProp: 'accuracy'
  },
  altFire: {
    label: 'f()',
    tooltip: 'Function'
  },
  zoom: {
    label: 'Zm',
    tooltip: 'Zoom'
  },
  energy: {
    label: 'Enr',
    tooltip: 'Energy',
    starProp: 'energy'
  },
  chargeRate: {
    label: 'Chg',
    tooltip: 'Charge Rate'
  },
  chargeRatio: {
    label: '%',
    tooltip: 'Charge Rate'
  },
  chargeEmergencyRate: {
    label: 'Em.C',
    tooltip: 'Emergency Charge Rate',
    starProp: 'energy'
  },
  chargeEmergencyRatio: {
    label: '%',
    tooltip: 'Emergency Charge Rate %'
  },
  energyUse: {
    label: 'Cns',
    tooltip: 'Flight Consumption'
  },
  energyUseRatio: {
    label: '%',
    tooltip: 'Flight Consumption %'
  },
  boostUse: {
    label: 'B.Cns',
    tooltip: 'Boost Consumption'
  },
  boostUseRatio: {
    label: '%',
    tooltip: 'Boost Consumption %'
  },
  piercingRange: {
    label: 'PtRng',
    tooltip: 'Piercing Range',
    starProp: 'speed'
  },
  range: {
    label: 'Rng',
    tooltip: 'Range',
    starProp: 'speed'
  },
  lockRange: {
    label: 'Rng',
    tooltip: 'Lock-Range',
    starProp: 'lockRange'
  },
  boost: {
    label: 'Boost',
    tooltip: 'Boost'
  },
  revive: {
    label: 'Revive',
    tooltip: 'Revive Health %'
  },
  healAllyBoost: {
    label: 'H.NPC',
    tooltip: 'Healing Ally Boost'
  },
  probeRadius: {
    label: 'Probe',
    tooltip: 'Pickup Radius'
  },
  knockdownImmunity: {
    label: 'KD.Im',
    tooltip: 'Knockdown Immunity'
  },
  speed: {
    label: 'Spd',
    tooltip: 'Move Speed',
    starProp: 'speed'
  },
  speed2: {
    label: 'Spd',
    tooltip: 'Shot Speed'
  },
  flightBoost: {
    label: 'Fly',
    tooltip: 'Flight Speed'
  },
  dashForwardBoost: {
    label: 'B.Fwd',
    tooltip: 'Boost Forward'
  },
  dashBackwardBoost: {
    label: 'B.Bwd',
    tooltip: 'Boost Backward'
  },
  dashSideBoost: {
    label: 'B.Side',
    tooltip: 'Boost Sideways'
  },
  airControl: {
    label: 'Acc',
    tooltip: 'Air Acceleration'
  },
  reloadBoost: {
    label: 'Rel',
    tooltip: 'Reload Speed Boost'
  },
  hitSlowdown: {
    label: 'Stun',
    tooltip: 'Hit Slowdown'
  },
  sprintSpeedBoost: {
    label: 'Sprint',
    tooltip: 'Sprint Speed'
  },
  sprintTurnBoost: {
    label: 'Swirl',
    tooltip: 'Sprint Turnspeed'
  },
  sprintAccelerationBoost: {
    label: 'Acc',
    tooltip: 'Sprint Acceleration'
  },
  sprintHitSlowdown: {
    label: 'Stun',
    tooltip: 'Sprint Hit Slowdown'
  },
  sprintBreakObstacles: {
    label: 'Break',
    tooltip: 'Obstacle Destruction During Sprint'
  },
  lockSpeedBoost: {
    label: 'L.Spd',
    tooltip: 'Lock Speed'
  },
  lockRangeBoost: {
    label: 'L.Rng',
    tooltip: 'Lock-Range'
  },
  lockMulti: {
    label: 'Multi',
    tooltip: 'Multi Lock'
  },
  dashCount: {
    label: 'Dash',
    tooltip: 'Dash Count'
  },
  boostCount: {
    label: 'Boost',
    tooltip: 'Boost Count'
  },
  dashCooldown: {
    label: 'D.CD',
    tooltip: 'Dash Cooldown'
  },
  boostSpeed: {
    label: 'B.Spd',
    tooltip: 'Boost Speed'
  },
  convertible: {
    label: 'Conv',
    tooltip: 'Conversion'
  },
  shieldUse: {
    label: 'Cns',
    tooltip: 'Shield Consumption'
  },
  shieldReflectUse: {
    label: 'Rf.Cns',
    tooltip: 'Shield Reflect Consumption'
  },
  shieldKnockback: {
    label: 'KB',
    tooltip: 'Shield Knockback'
  },
  equipWalkReduction: {
    label: 'Eq.Walk',
    tooltip: 'Equip Weight Move Speed Reduction'
  },
  equipTurnReduction: {
    label: 'Eq.Turn',
    tooltip: 'Equip Weight Turn Speed Reduction'
  },
  recoil: {
    label: 'Stability',
    tooltip: 'Stability'
  },
  dps: {
    label: 'DPS',
    tooltip: 'Damage Per Second'
  },
  dps2: {
    label: 'DPS*',
    tooltip: 'Damage Per Second*'
  },
  tdps: {
    label: 'TDPS',
    tooltip: 'Total Damage Per Second (including reload)'
  },
  qrdps: {
    label: 'Q.DPS',
    tooltip: 'Total Damage Per Second (including quick reload)'
  },
  tdps2: {
    label: 'TDPS*',
    tooltip: 'Total Damage Per Second (including reload)*'
  },
  total: {
    label: 'Total',
    tooltip: 'Total Damage'
  },
  total2: {
    label: 'Total*',
    tooltip: 'Total Damage*'
  },
  eps: {
    label: 'EPS',
    tooltip: 'Energy Per Second'
  },
  dpe: {
    label: 'DPE',
    tooltip: 'Damage Per Energy'
  }
};


/***/ },

/***/ "./src/scripts/html.coffee"
/*!*********************************!*\
  !*** ./src/scripts/html.coffee ***!
  \*********************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   $: () => (/* binding */ $)
/* harmony export */ });
var $ = document.createElement.bind(document);

window.isHtml = (el) => {
  return el instanceof HTMLElement || ((el != null ? el.nodeType : void 0) === 1 && typeof el.nodeName === 'string');
};


/***/ },

/***/ "./src/scripts/invaders.coffee"
/*!*************************************!*\
  !*** ./src/scripts/invaders.coffee ***!
  \*************************************/
(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _templates_main_pug__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../templates/main.pug */ "./src/templates/main.pug");
/* harmony import */ var _templates_main_pug__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_templates_main_pug__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./utils */ "./src/scripts/utils.coffee");
/* harmony import */ var _lang__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./lang */ "./src/scripts/lang.coffee");
/* harmony import */ var _saving__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./saving */ "./src/scripts/saving.coffee");
/* harmony import */ var _stats__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./stats */ "./src/scripts/stats.coffee");
/* harmony import */ var _drops__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./drops */ "./src/scripts/drops.coffee");
/* harmony import */ var _enemies__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./enemies */ "./src/scripts/enemies.coffee");
var buttonPrefixes, game, gameLabels, games, j, k, len, len1, loadData, locals, params, spinoffs;















params = (0,_saving__WEBPACK_IMPORTED_MODULE_3__.readState)();

games = ['1', '2', '2pv2', '3', '3p', '4', '41', '5', '6'];

spinoffs = ['ia', 'ir', 'wdts'];

gameLabels = {};

for (j = 0, len = games.length; j < len; j++) {
  game = games[j];
  gameLabels[game] = `EDF${game}`;
}

for (k = 0, len1 = spinoffs.length; k < len1; k++) {
  game = spinoffs[k];
  gameLabels[game] = `EDF:${game}`;
}

locals = {
  stars: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => {
    return {
      id: `star-${star}`,
      star: star,
      name: star >= 10 ? `★  ${star}` : `☆  ${star}`
    };
  }),
  games: [
    games.map((g) => {
      return {
        id: `edf${g}`,
        num: g.toString(),
        name: `EDF${g.toUpperCase()}`,
        label: `<b>EDF${g[0]}</b>${g.slice(1).toUpperCase()}`
      };
    }),
    spinoffs.map((g) => {
      return {
        id: `edf${g}`,
        num: g.toString(),
        name: `EDF:${g.toUpperCase()}`,
        label: `EDF:<b>${g.toUpperCase()}</b>`
      };
    })
  ].flat(),
  localize: _lang__WEBPACK_IMPORTED_MODULE_2__.localize,
  spinoffs: spinoffs,
  saveLoadState: false
};

window.slice3 = (str) => {
  return `<b>${str.slice(0, 3)}</b>${str.slice(3)}`;
};

// Put the dot in 4.1
locals.games.find((g) => {
  return g.id === 'edf41';
}).label = '<b>EDF4</b>.1';

window.locals = locals;

locals.star = (0,_utils__WEBPACK_IMPORTED_MODULE_1__.last)(locals.stars);

window.selectItem = (scope, id) => {
  switch (scope) {
    case 'game':
      return loadData(id);
    case 'mode':
      return selectMode(id);
    case 'class':
      return selectChar(id);
    case 'category':
      return selectCategory(id);
    case 'star':
      return selectStar(id);
    case 'lang':
      return selectLang(id);
    case 'difficulty':
      return selectDiff(id);
    case 'players':
      return selectPlayerCount(id);
  }
};

window.selectMode = (modeId) => {
  locals.mode = locals.modes.find((m) => {
    return m.id === modeId;
  });
  locals.mode || (locals.mode = locals.modes[0]);
  params.mode = locals.mode.id;
  if (locals.mode.hasEnemies) {
    locals.mission = Math.ceil(locals.mode.missions / 2);
    delete params.char;
    delete params.star;
    delete locals.char;
    delete locals.star;
    return selectDiff(params.diff);
  } else {
    delete params.diff;
    delete params.m;
    delete locals.diff;
    delete locals.mission;
    return selectChar(params.char);
  }
};

buttonPrefixes = ['Drops '];

window.selectDiff = (diffId) => {
  var ref;
  locals.diff = locals.mode.difficulties.find((d) => {
    return d.id === diffId;
  });
  locals.diff || (locals.diff = locals.mode.difficulties[0]);
  locals.mission = 1;
  params.m = 1;
  params.diff = (ref = locals.diff) != null ? ref.id : void 0;
  return selectPlayerCount(params.p);
};

window.selectPlayerCount = (count) => {
  var ref, ref1, ref2, ref3;
  locals.playerCount = (ref = locals.diff) != null ? ref.players.find((p) => {
    return +p.id === +count;
  }) : void 0;
  locals.playerCount || (locals.playerCount = (ref1 = locals.diff) != null ? (ref2 = ref1.players) != null ? ref2[0] : void 0 : void 0);
  params.p = (ref3 = locals.playerCount) != null ? ref3.id : void 0;
  return render();
};

window.selectChar = (charId) => {
  var cat, label, name;
  locals.char = locals.classes.find((c) => {
    return c.id === charId;
  });
  locals.char || (locals.char = locals.classes[0]);
  locals.categories = (function() {
    var len2, n, ref, ref1, results;
    ref = locals.headers[locals.char.id];
    results = [];
    for (n = 0, len2 = ref.length; n < len2; n++) {
      cat = ref[n];
      name = cat.name || cat.names[locals.lang.id] || 'ERROR';
      label = cat.label || ((ref1 = cat.labels) != null ? ref1[locals.lang.id] : void 0);
      label || (label = `<b>${name.slice(0, 2)}</b>${name.slice(2)}`);
      results.push({
        ...cat,
        id: cat.category,
        name,
        label
      });
    }
    return results;
  })();
  params.char = locals.char.id;
  return selectCategory(params.wpn);
};

window.selectCategory = (categoryId) => {
  locals.cat = locals.categories.find((c) => {
    return c.id === categoryId;
  });
  locals.cat || (locals.cat = locals.categories[0]);
  if (locals.mode.hasDrops) {
    (0,_drops__WEBPACK_IMPORTED_MODULE_5__.populateWeaponDrops)();
  } else if (locals.mode.id === 'stats') {
    (0,_stats__WEBPACK_IMPORTED_MODULE_4__.populateWeaponStats)();
  }
  params.wpn = locals.cat.id;
  return render();
};

window.selectStar = (starId) => {
  var ref;
  locals.star = locals.stars.find((s) => {
    return s.id === starId;
  });
  locals.star || (locals.star = locals.stars.find((s) => {
    return s.star === starId;
  }));
  locals.star || (locals.star = (0,_utils__WEBPACK_IMPORTED_MODULE_1__.last)(locals.stars));
  params.star = (ref = locals.star) != null ? ref.star : void 0;
  return render();
};

window.selectLang = (langId) => {
  locals.lang = locals.langs.find((l) => {
    return l.id === langId;
  });
  locals.lang || (locals.lang = locals.langs[0]);
  params.lang = locals.lang.id;
  return render();
};

loadData = async(gameId) => {
  var data, ref;
  locals.game = locals.games.find((g) => {
    return g.num === gameId;
  });
  locals.game || (locals.game = locals.games.find((g) => {
    return g.id === gameId;
  }));
  locals.game || (locals.game = locals.games.find((g) => {
    return g.id === 'edf6';
  }));
  locals.game || (locals.game = locals.games[0]);
  locals.isLoading = true;
  render();
  data = (await fetch(`./weapons-${locals.game.num}.json`).then((res) => {
    return res.json();
  }));
  locals.isLoading = false;
  Object.assign(locals, {
    gameValues: {}
  }, data);
  locals.modes = [
    {
      id: 'stats',
      name: 'Stats'
    },
    ...data.modes.filter((m) => {
      var ref;
      return (ref = m.difficulties) != null ? ref[0].dropsLow : void 0;
    }).map((m) => {
      return {
        id: m.name.toLowerCase(),
        label: `Drops <b>${m.name}</b>`,
        class: m.name.toLowerCase(),
        hasDrops: true,
        ...m
      };
    })
  ];
  // ...(enemyStatModes data.modes if locals.enemies?.length)
  if (data.enemies) {
    (0,_enemies__WEBPACK_IMPORTED_MODULE_6__.processEnemies)(data);
  }
  locals.mode = locals.modes[0];
  locals.classes = data.classes.map((id, i) => {
    return {
      id,
      name: data.charLabels[i]
    };
  });
  locals.langs = data.langs.map((lang) => {
    if (data.langs) {
      return {
        id: lang,
        name: lang
      };
    }
  });
  locals.lang = (ref = locals.langs) != null ? ref.find((l) => {
    var ref1;
    return l.id === ((ref1 = locals.langs) != null ? ref1[0] : void 0) || {
      id: 'lang-en',
      name: 'en'
    };
  }) : void 0;
  (0,_stats__WEBPACK_IMPORTED_MODULE_4__.processHeaders)();
  return selectChar(params.char);
};

window.render = () => {
  (0,_saving__WEBPACK_IMPORTED_MODULE_3__.writeState)();
  return document.body.innerHTML = _templates_main_pug__WEBPACK_IMPORTED_MODULE_0___default()(locals);
};

await loadData(params.game);

if (params.mode) {
  selectMode(params.mode);
}

if (params.star !== 10) {
  selectStar(params.star);
}

__webpack_async_result__();
} catch(e) { __webpack_async_result__(e); } }, 1);

/***/ },

/***/ "./src/scripts/lang.coffee"
/*!*********************************!*\
  !*** ./src/scripts/lang.coffee ***!
  \*********************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   localize: () => (/* binding */ localize)
/* harmony export */ });
var localize = (prop, fallback) => {
  if (!prop) {
    return fallback || null;
  }
  if (typeof prop === 'string') {
    return prop;
  }
  if (prop[locals.lang.id] != null) {
    return prop[locals.lang.id];
  }
  if (fallback != null) {
    return fallback;
  }
  return Object.values(prop)[0];
};


/***/ },

/***/ "./src/scripts/saving.coffee"
/*!***********************************!*\
  !*** ./src/scripts/saving.coffee ***!
  \***********************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   readState: () => (/* binding */ readState),
/* harmony export */   writeState: () => (/* binding */ writeState)
/* harmony export */ });
/* harmony import */ var _weapons__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./weapons */ "./src/scripts/weapons.coffee");
var bufferToBase64, encodeSave, flashButton, restoreSave, restoreSaveData;



var readState = () => {
  var pairs;
  pairs = window.location.hash.slice(1).split('&').map((item) => {
    return item.split('=');
  });
  return Object.fromEntries(pairs);
};

var writeState = () => {
  var err, state;
  state = {};
  if (locals.game) {
    state.game = locals.game.num;
  }
  if (locals.mode) {
    state.mode = locals.mode.id;
  }
  if (locals.char) {
    state.char = locals.char.id;
  }
  if (locals.cat && state.mode === 'stats') {
    state.wpn = locals.cat.id;
  }
  if (locals.star) {
    state.star = locals.star.star;
  }
  if (locals.lang) {
    state.lang = locals.lang.id;
  }
  if (locals.diff) {
    state.diff = locals.diff.id;
  }
  if (locals.playerCount) {
    state.p = locals.playerCount.count;
  }
  try {
    return window.location.hash = Object.entries(state).map((pair) => {
      return pair.join('=');
    }).join('&');
  } catch (error) {
    err = error;
    return console.error(err);
  }
};

restoreSave = (data) => {
  var game, owned, starred;
  [game, owned, starred] = data.split(':');
  if (game !== locals.game.num) {
    throw new Error(`Wrong game: ${game}\nExpected: ${locals.game.num}`);
  }
  restoreSaveData(owned);
  if (starred) {
    restoreSaveData(starred, 'starred');
  }
  return render();
};

restoreSaveData = (payload, scope) => {
  var char, i, isActive, j, key, len, parsed, pow, results, weapons, wpn;
  ({weapons} = locals);
  parsed = atob(payload);
  pow = 0;
  i = 0;
  char = parsed.charCodeAt(0);
  results = [];
  for (j = 0, len = weapons.length; j < len; j++) {
    wpn = weapons[j];
    key = (0,_weapons__WEBPACK_IMPORTED_MODULE_0__.weaponKey)(wpn, scope);
    isActive = (char >> pow) & 1;
    if (isActive) {
      localStorage[key] = '1';
    } else if (localStorage[key] > 0) {
      localStorage[key] = '0';
    }
    if (pow >= 7) {
      pow = 0;
      i++;
      results.push(char = parsed.charCodeAt(i));
    } else {
      results.push(pow++);
    }
  }
  return results;
};

flashButton = (id, text, revertTo) => {
  var button, revertText;
  button = document.getElementById(id);
  button.textContent = text;
  revertText = () => {
    return button.textContent = revertTo;
  };
  return setTimeout(revertText, 1200);
};

window.closeSaveLoad = () => {
  if (!locals.saveLoadState) {
    return;
  }
  locals.saveLoadState = false;
  return render();
};

window.toggleSave = async() => {
  var parts, ref;
  locals.saveLoadState = !locals.saveLoadState;
  if (locals.saveLoadState) {
    parts = [locals.game.num];
    parts.push((await encodeSave()));
    if ((ref = locals.gameValues) != null ? ref.hasStars : void 0) {
      parts.push((await encodeSave('starred')));
    }
    locals.saveLoadText = parts.join(':');
  }
  return render();
};

window.copySaveData = () => {
  var saveLoadArea;
  saveLoadArea = document.getElementById('save-load-textarea');
  saveLoadArea.select();
  saveLoadArea.setSelectionRange(0, 99999);
  navigator.clipboard.writeText(locals.saveLoadText);
  return flashButton('save-load-copy', 'Copied!', 'Copy');
};

window.toggleCheckWeapon = (scope, id) => {
  var checked, key, wpn;
  closeSaveLoad();
  wpn = locals.weapons.find((w) => {
    return w.id === id;
  });
  if (!wpn) {
    throw new Error(`Weapon not found: ${id}`);
  }
  key = (0,_weapons__WEBPACK_IMPORTED_MODULE_0__.weaponKey)(wpn, scope);
  checked = 1 - (localStorage[key] || 0);
  localStorage[key] = checked;
  // If a weapon is starred, it must be owned. Enforce this.
  if (scope === 'starred' && checked) {
    key = (0,_weapons__WEBPACK_IMPORTED_MODULE_0__.weaponKey)(wpn, 'owned');
    localStorage[key] = checked;
    return document.getElementById(key).checked = checked;
  }
};

window.importSaveData = () => {
  var err, importButton, saveLoadArea;
  saveLoadArea = document.getElementById('save-load-textarea');
  importButton = document.getElementById('save-load-import');
  try {
    restoreSave(saveLoadArea.value);
    return flashButton('save-load-import', 'Imported!', 'Import');
  } catch (error) {
    err = error;
    console.error(err);
    return saveLoadArea.value = err.message;
  }
};

// Copied from stackoverflow: https://stackoverflow.com/a/66046176
// note: `buffer` arg can be an ArrayBuffer or a Uint8Array
bufferToBase64 = async(buffer) => {
  var base64url;
  // use a FileReader to generate a base64 data URI:
  base64url = (await new Promise((r) => {
    var reader;
    reader = new FileReader();
    reader.onload = () => {
      return r(reader.result);
    };
    return reader.readAsDataURL(new Blob([buffer]));
  }));
  // remove the `data:...;base64,` part from the start
  return base64url.slice(base64url.indexOf(',') + 1);
};

encodeSave = (scope) => {
  var buffer, i, j, key, len, pow, size, weapons, wpn;
  ({weapons = []} = locals);
  size = Math.ceil(weapons.length / 8);
  buffer = new Uint8Array(size);
  pow = 0;
  i = 0;
  for (j = 0, len = weapons.length; j < len; j++) {
    wpn = weapons[j];
    key = (0,_weapons__WEBPACK_IMPORTED_MODULE_0__.weaponKey)(wpn, scope);
    if (localStorage[key] > 0) {
      buffer[i] = buffer[i] | Math.pow(2, pow);
    }
    if (pow >= 7) {
      pow = 0;
      i++;
    } else {
      pow++;
    }
  }
  return bufferToBase64(buffer);
};


/***/ },

/***/ "./src/scripts/stats.coffee"
/*!**********************************!*\
  !*** ./src/scripts/stats.coffee ***!
  \**********************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   populateWeaponStats: () => (/* binding */ populateWeaponStats),
/* harmony export */   processHeaders: () => (/* binding */ processHeaders)
/* harmony export */ });
/* harmony import */ var _headers__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./headers */ "./src/scripts/headers.coffee");
/* harmony import */ var _weapons__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./weapons */ "./src/scripts/weapons.coffee");
/* harmony import */ var _html__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./html */ "./src/scripts/html.coffee");
var SCALED_PROPS, composeAttack, getValue, processWeapon, starValue;







var populateWeaponStats = () => {
  var weapons;
  weapons = locals.weapons.filter((wpn) => {
    return wpn.character === locals.char.id && wpn.category === locals.cat.id;
  }).flatMap(processWeapon);
  return locals.tables = locals.cat.tables ? locals.cat.tables.map((table) => {
    return {
      ...locals.cat,
      ...table,
      weapons: weapons.filter((wpn) => {
        return wpn.subCategory === table.subCategory;
      })
    };
  }) : [
    {
      ...locals.cat,
      weapons: weapons
    }
  ];
};

SCALED_PROPS = ['ammo', 'hp', 'damage', 'count', 'radius', 'interval', 'reload', 'accuracy', 'speed', 'burstRate', 'lockRange', 'lockTime', 'energy', 'windup'];

processWeapon = (weapon) => {
  var i, len, prop, ref, ref1, ref2, ref3, wpn;
  wpn = {...weapon};
  if (weapon.category === 'core' && weapon.energy) {
    wpn.baseEnergy = weapon.energy.base || weapon.energy;
  }
  for (i = 0, len = SCALED_PROPS.length; i < len; i++) {
    prop = SCALED_PROPS[i];
    if (((ref = weapon[prop]) != null ? ref.base : void 0) != null) {
      wpn[prop] = getValue(weapon, prop, wpn);
    }
  }
  if (((ref1 = wpn.attacks) != null ? ref1.length : void 0) && wpn.character === 'bomber') { // Balam / Barga
    return [wpn, ...(wpn.weapons || []), ...wpn.attacks.map(composeAttack(wpn))];
  } else if ((ref2 = wpn.attacks) != null ? ref2.length : void 0) {
    return [
      {
        ...wpn,
        ...composeAttack(wpn,
      wpn.attacks[0]),
        name: wpn.name
      },
      ...wpn.attacks.slice(1).map(composeAttack(wpn))
    ];
  } else if ((ref3 = wpn.weapons) != null ? ref3.length : void 0) {
    return [wpn, ...wpn.weapons];
  } else {
    return wpn;
  }
};

composeAttack = (weapon) => {
  return (attack) => {
    return {
      ...attack,
      damage: (weapon.damage || 1) * attack.damage,
      speed: weapon.speed * attack.speed,
      piercing: weapon.piercing,
      count: weapon.count,
      life: weapon.life,
      isSwing: weapon.attacks.length > 1,
      isSubAttack: true
    };
  };
};

getValue = (wpn, prop, obj) => {
  var star, v, value;
  value = wpn[prop];
  if ((value == null) || typeof value === 'number') {
    return value;
  }
  if (prop === 'energy' && wpn.category === 'core') {
    obj.baseEnergy = isNaN(value) ? value.base : value;
  }
  if ((value != null ? value.base : void 0) != null) {
    [star, v] = starValue(value, locals.star.star);
    obj[`${prop}Star`] = star;
    obj[`${prop}StarMax`] = value.lvMax;
    return v;
  }
};

starValue = ({base, algo, lvMax, zero, exp, type}, star) => {
  var curveBase, curvePoint, result, sign;
  sign = 1.0;
  if (base < 0) {
    base = -base;
    sign = -1.0;
  }
  star = Math.min(Math.max(0, star), Math.max(5, lvMax));
  curveBase = base * zero;
  curvePoint = curveBase * Math.pow(star / 5.0, exp);
  result = 0;
  if ((algo & 3) === 0) {
    result = base - curveBase + curvePoint;
  } else if ((algo & 3) === 1) {
    result = base + curveBase - curvePoint;
  } else {
    console.error(`Invalid algorithm: ${algo}`);
  }
  result = sign * Math.max(0, result);
  if (type === 'int') {
    result = Math.floor(result + 0.5);
  }
  return [star, result];
};

var processHeaders = () => {
  var colspan, def, hasStars, header, i, len, ref, results;
  locals.headerDefinitions = {..._headers__WEBPACK_IMPORTED_MODULE_0__.headers};
  ({
    gameValues: {hasStars} = {}
  } = locals);
  ref = Object.keys(_headers__WEBPACK_IMPORTED_MODULE_0__.headers);
  results = [];
  for (i = 0, len = ref.length; i < len; i++) {
    header = ref[i];
    def = locals.headerDefinitions[header];
    if (!hasStars) {
      delete def.starProp;
      delete def.starProp2;
    }
    colspan = 1;
    if (def.starProp) {
      colspan += 1;
    }
    if (def.starProp2) {
      colspan += 1;
    }
    if (header === 'damage') {
      colspan += 3;
    }
    if (header === 'interval') {
      colspan += 1;
    }
    if (colspan > 1) {
      results.push(def.colspan = colspan);
    } else {
      results.push(void 0);
    }
  }
  return results;
};

// Used for rendering a stat
window.weaponStat = (weapon, stat) => {
  var burst, cell, count, count2, dmg, full, header, items, min, rof, value;
  value = _weapons__WEBPACK_IMPORTED_MODULE_1__.weaponStats[stat] != null ? _weapons__WEBPACK_IMPORTED_MODULE_1__.weaponStats[stat](weapon, stat) : weapon[stat] != null ? weapon[stat] : void 0;
  header = locals.headerDefinitions[stat];
  cell = {
    class: stat,
    value: value != null ? value : '-'
  };
  if (stat === 'damage') {
    [dmg, count, count2] = (value != null ? value : '').toString().split('x').map((v) => {
      return v.trim();
    });
    [full, min] = dmg.split('~');
    items = [cell];
    cell.value = full;
    if (min) {
      items.push({
        value: min,
        class: 'Falloff'
      });
    } else {
      items.push({
        value: '',
        class: 'Filler'
      });
    }
    if (count2) {
      items.push({
        value: count2,
        class: 'Count'
      });
    }
    if (count) {
      items.push({
        value: count,
        class: 'Count' + (count2 ? ' DmgEnd' : '')
      });
    } else {
      items.push({
        value: '',
        class: 'Filler'
      });
    }
    if (!count2) {
      items.push({
        value: '',
        class: 'Filler DmgEnd'
      });
    }
    return items;
  } else if (stat === 'interval') {
    [rof, burst] = (value != null ? value : '').toString().split('x').map((v) => {
      return v.trim();
    });
    items = [cell];
    cell.value = rof;
    if (burst) {
      items.push([
        {
          value: burst,
          class: 'Count DmgEnd'
        }
      ]);
    } else {
      items.push([
        {
          value: '',
          class: 'Filler DmgEnd'
        }
      ]);
    }
    return items;
  } else {
    return cell;
  }
};


/***/ },

/***/ "./src/scripts/utils.coffee"
/*!**********************************!*\
  !*** ./src/scripts/utils.coffee ***!
  \**********************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   last: () => (/* binding */ last)
/* harmony export */ });
var last = (list) => {
  return list[list.length - 1];
};


/***/ },

/***/ "./src/scripts/weapons.coffee"
/*!************************************!*\
  !*** ./src/scripts/weapons.coffee ***!
  \************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   localize: () => (/* binding */ localize),
/* harmony export */   processWeapon: () => (/* binding */ processWeapon),
/* harmony export */   weaponKey: () => (/* binding */ weaponKey),
/* harmony export */   weaponStats: () => (/* binding */ weaponStats)
/* harmony export */ });
/* harmony import */ var _html__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./html */ "./src/scripts/html.coffee");
/* harmony import */ var _accuracy_coffee__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./accuracy.coffee */ "./src/scripts/accuracy.coffee");
/* harmony import */ var _framerate_coffee__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./framerate.coffee */ "./src/scripts/framerate.coffee");
/* harmony import */ var _damage_coffee__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./damage.coffee */ "./src/scripts/damage.coffee");
var SCALED_PROPS, bool, boostProp, boostUse, chargeEmergencyRate, chargeRate, checkbox, composeAttack, decimalProp, energyUse, fpsProp, invertPercentProp, percent, percentProp, suffixProp;









var weaponKey = (wpn, type = 'owned') => {
  var scope;
  scope = locals.game.id === '41' ? '' : `.${locals.game.id.slice(2)}`;
  return `${type}${scope}.${wpn.id}`;
};

checkbox = (scope) => {
  return (wpn) => {
    var el, key;
    if (!wpn.id) {
      return null;
    }
    key = weaponKey(wpn, scope);
    el = (0,_html__WEBPACK_IMPORTED_MODULE_0__.$)('input');
    el.setAttribute('type', 'checkbox');
    if (localStorage[key] > 0) {
      el.setAttribute('checked', '1');
    }
    el.setAttribute('onchange', `toggleCheckWeapon('${scope}', '${wpn.id}')`);
    el.setAttribute('id', key);
    return el;
  };
};

SCALED_PROPS = ['ammo', 'hp', 'damage', 'count', 'radius', 'interval', 'reload', 'accuracy', 'speed', 'burstRate', 'lockRange', 'lockTime', 'energy', 'windup'];

var processWeapon = (weapon) => {
  var i, len, prop, ref, ref1, ref2, ref3, wpn;
  wpn = {...weapon};
  if (weapon.category === 'core' && weapon.energy) {
    wpn.baseEnergy = weapon.energy.base || weapon.energy;
  }
  for (i = 0, len = SCALED_PROPS.length; i < len; i++) {
    prop = SCALED_PROPS[i];
    if (((ref = weapon[prop]) != null ? ref.base : void 0) != null) {
      wpn[prop] = getValue(weapon, prop, wpn);
    }
  }
  if (((ref1 = wpn.attacks) != null ? ref1.length : void 0) && wpn.character === 'bomber') { // Balam / Barga
    return [wpn, ...(wpn.weapons || []), ...wpn.attacks.map(composeAttack(wpn))];
  } else if ((ref2 = wpn.attacks) != null ? ref2.length : void 0) {
    return [
      {
        ...wpn,
        ...composeAttack(wpn,
      wpn.attacks[0]),
        name: wpn.name
      },
      ...wpn.attacks.slice(1).map(composeAttack(wpn))
    ];
  } else if ((ref3 = wpn.weapons) != null ? ref3.length : void 0) {
    return [wpn, ...wpn.weapons];
  } else {
    return wpn;
  }
};

composeAttack = (weapon) => {
  return (attack) => {
    return {
      ...attack,
      damage: (weapon.damage || 1) * attack.damage,
      speed: weapon.speed * attack.speed,
      piercing: weapon.piercing,
      count: weapon.count,
      life: weapon.life,
      isSwing: weapon.attacks.length > 1,
      isSubAttack: true
    };
  };
};

percent = (val, decimals) => {
  return (100 * val).toFixed(decimals) + '%';
};

decimalProp = (decimals, propOverride) => {
  return (wpn, prop) => {
    var value;
    value = wpn[propOverride || prop];
    if (value) {
      return value.toFixed(decimals);
    }
  };
};

percentProp = (decimals, propOverride, offset = 0) => {
  return (wpn, prop) => {
    var value;
    value = wpn[propOverride || prop];
    if (value) {
      return percent(value + offset, decimals);
    }
  };
};

invertPercentProp = (decimals, propOverride) => {
  return (wpn, prop) => {
    var value;
    value = wpn[propOverride || prop];
    if (value != null) {
      return percent(1 - value, decimals);
    }
  };
};

fpsProp = (decimals, propOverride) => {
  return (wpn, prop) => {
    var value;
    value = wpn[propOverride || prop];
    if (value) {
      return (0,_framerate_coffee__WEBPACK_IMPORTED_MODULE_2__.byFps)(value, decimals);
    }
  };
};

suffixProp = (propOverride, mark = 'x') => {
  return (wpn, prop) => {
    var value;
    value = wpn[propOverride || prop];
    if (value) {
      return `${value}${mark}`;
    }
  };
};

bool = (propOverride, mark = '✓') => {
  return (wpn, prop) => {
    if (wpn[propOverride || prop]) {
      return mark;
    }
  };
};

var localize = (prop, fallback) => {
  if (!prop) {
    return fallback || null;
  }
  if (typeof prop === 'string') {
    return prop;
  }
  if (prop[locals.lang.id] != null) {
    return prop[locals.lang.id];
  }
  if (fallback != null) {
    return fallback;
  }
  return Object.values(prop)[0];
};

chargeRate = (wpn) => {
  var ch, nrg, spd;
  ({
    baseEnergy: nrg = wpn.baseEnergy,
    chargeSpeed: spd = 1.0,
    character: ch
  } = wpn);
  return nrg * spd * locals.gameValues[ch].charge;
};

chargeEmergencyRate = (wpn) => {
  var ch, nrg, spd;
  ({
    energy: nrg,
    emergencyChargeSpeed: spd = 1.0,
    character: ch
  } = wpn);
  return nrg * spd * locals.gameValues[ch].chargeEmergency;
};

energyUse = (wpn) => {
  var ch, nrg, usg;
  ({
    baseEnergy: nrg = wpn.energy,
    flightConsumption: usg = 1.0,
    character: ch
  } = wpn);
  return nrg * usg * locals.gameValues[ch].flightUse;
};

boostUse = (wpn) => {
  var ch, nrg, usg;
  ({
    baseEnergy: nrg = wpn.energy,
    boostConsumption: usg = 1.0,
    character: ch
  } = wpn);
  return nrg * usg * locals.gameValues[ch].boostUse;
};

boostProp = (propOverride) => {
  return (wpn, prop) => {
    var value;
    value = wpn[propOverride || prop];
    if (value && value !== 1) {
      return percent(value, 0);
    }
  };
};

var weaponStats = {
  ..._damage_coffee__WEBPACK_IMPORTED_MODULE_3__.headers,
  checkbox: checkbox('owned'),
  stars: checkbox('starred'),
  level: (wpn) => {
    var difficulty, display, el, level, mode, offline, online;
    ({level} = wpn);
    if (level == null) {
      return null;
    }
    if (isNaN(level)) {
      return level;
    }
    [offline, online] = locals.modes.slice(1);
    mode = [online, offline].find((m) => {
      var ref;
      return m != null ? (ref = m.difficulties) != null ? ref.length : void 0 : void 0;
    });
    if (!mode) { // ????
      return level;
    }
    el = (0,_html__WEBPACK_IMPORTED_MODULE_0__.$)('div');
    difficulty = mode.difficulties.slice(1).find((d) => {
      var limits, upper;
      limits = d.weaponLimits;
      if (!Array.isArray(limits)) {
        return;
      }
      upper = limits[limits.length - 1];
      return upper > 0 && upper >= level;
    });
    display = Math.max(0, level);
    if (!difficulty) {
      return display;
    }
    el.classList.add(difficulty.name);
    el.textContent = display;
    return el;
  },
  rank: (wpn) => {
    var el, rank;
    ({rank} = wpn);
    if (rank == null) {
      return null;
    }
    el = (0,_html__WEBPACK_IMPORTED_MODULE_0__.$)('div');
    el.classList.add(`rank-${rank}`);
    el.textContent = rank;
    return el;
  },
  remarks: (wpn) => {
    var i, len, ref, ref1, remarks, tag, tags;
    if (!((ref = wpn.tags) != null ? ref.length : void 0)) {
      return null;
    }
    tags = [wpn.effect, ...wpn.tags];
    remarks = [];
    ref1 = [wpn.effect, ...wpn.tags];
    for (i = 0, len = ref1.length; i < len; i++) {
      tag = ref1[i];
      if (tag === 'reload_quick') {

      // Ignore
      } else if (tag === 'reload_none') {

      // Ignore
      } else if (tag === 'reload_auto') {

      // Ignore
      } else if (tag === 'reload_charge') {

      // Ignore
      } else if (tag === 'delay_burst') {
        remarks.push(`+${wpn.damage2} Dmg <30m`);
      } else if (tag === 'delay_blast') {
        remarks.push("Timer");
      } else if (tag === 'delay') {
        remarks.push('Windup');
      } else if (tag === 'slow_aim') {
        remarks.push('Slows Aim');
      } else if (tag === 'no_move_aim') {
        remarks.push('Immobile');
      } else if (tag === 'energyconsume') {
        remarks.push('Uses Energy');
      } else if (tag === 'bouncing') {
        remarks.push('Bouncing');
      } else if (tag === 'growth_range') {

      // remarks.push '→Range'
      } else if (tag === 'growth_damage') {

      // remarks.push '→Damage'
      } else if (tag === 'pushback') {
        remarks.push('Pushback');
      } else if (tag === 'scope') {
        remarks.push('Scope');
      } else if (tag === 'roulette') {
        remarks.push(`1/${wpn.critOver} of ${wpn.damage2}`);
      } else if (tag === 'puncher') {
        remarks.push("Explodes");
      } else if (tag === 'recoil') {
        remarks.push('Recoil');
      } else if (tag === 'recovertime') {
        remarks.push('Heals');
      } else if (tag === 'tracer') {
        remarks.push('Flare (Frightens)');
      } else if (tag === 'no_move') {
        remarks.push('Immobile');
      } else if (tag === 'sticky') {
        remarks.push('Sticky');
      } else if (tag === 'shock') {

      // remarks.push 'Shock'
      } else if (tag === 'frozen') {

      // remarks.push 'Freeze'
      } else if (tag === 'flame') {

      // remarks.push 'Burn'
      } else if (tag) {
        remarks.push(tag);
      }
    }
    return remarks.join(',');
  },
  name: (wpn) => {
    var el, name;
    el = (0,_html__WEBPACK_IMPORTED_MODULE_0__.$)('div');
    el.classList.add('name');
    name = localize(wpn.names, wpn.name);
    el.textContent += name;
    return el;
  },
  dropWeight: (wpn) => {
    var el, label, odds, ref;
    odds = (ref = wpn.odds) != null ? ref : 100;
    if (!+odds) {
      el = (0,_html__WEBPACK_IMPORTED_MODULE_0__.$)('div');
      if (wpn.level === 100) { // Genocide weapons
        el.classList.add('na');
        el.textContent = 'N/A';
      } else if (odds === 0) {
        return '-';
      } else {
        el.classList.add(odds);
        el.textContent = odds.toUpperCase();
      }
      return el;
    }
    label = odds + '%';
    if (odds !== 100) {
      el = (0,_html__WEBPACK_IMPORTED_MODULE_0__.$)('div');
      el.classList.add(odds < 100 ? 'lowOdds' : 'highOdds');
      el.textContent = label;
      return el;
    }
    return label;
  },
  unlock: (wpn) => {
    var el;
    if (!wpn.unlock) {
      return '€';
    }
    el = (0,_html__WEBPACK_IMPORTED_MODULE_0__.$)('div');
    if (wpn.unlock === 'box') {
      el.classList.add('lowOdds');
      el.textContent = 'Box ☢';
    } else {
      el.classList.add('highOdds');
      el.textContent = 'DLC ☢';
    }
    return el;
  },
  fuseType: (wpn) => {
    if (!wpn.fuseType) {
      return null;
    }
    return localize(wpn.fuseType);
  },
  ammo: (wpn) => {
    if (wpn.shieldDurability) {
      return percent(wpn.shieldDurability, 0);
    } else {
      return wpn.ammo;
    }
  },
  defense: (wpn) => {
    if (wpn.shieldDamageReduction != null) {
      return percent(1 - wpn.shieldDamageReduction, 0);
    } else if (wpn.defense != null) {
      return wpn.defense + '%';
    } else if (wpn.supportType === 'guard') {
      return percent(wpn.damage, 2);
    }
  },
  boost: (wpn) => {
    if (wpn.damage) {
      return percent(wpn.damage, 2);
    }
  },
  chargeTime: fpsProp(1),
  piercing: bool('piercing', '[PT]'),
  range: (wpn) => {
    var maxRange;
    if (wpn.range && wpn.growth) {
      maxRange = wpn.growth[wpn.growth.length - 1].range;
      if (maxRange !== wpn.range) {
        return `${wpn.range}→${maxRange}`;
      }
    }
    if (wpn.searchRange) {
      return wpn.searchRange;
    }
    if (wpn.shieldAngle) {
      return `+${wpn.shieldAngle}°`;
    }
    if (wpn.category === 'shield') {
      return `${wpn.range}°`;
    }
    if (wpn.range) {
      return wpn.range;
    }
    if ((wpn.speed || 0) <= 0 || (wpn.life || 0) <= 0) {
      return null;
    }
    return (wpn.speed * wpn.life).toFixed(1);
  },
  piercingRange: (wpn) => {
    var life;
    if (!wpn.piercing) {
      return null;
    }
    life = wpn.piercingLife ? wpn.piercingLife + 1 : wpn.life;
    return (wpn.speed * (life || 1)).toFixed(1);
  },
  lockRange: (wpn) => {
    if (wpn.lockRangeRank) {
      return wpn.lockRangeRank;
    }
    if (wpn.category === 'missile') {
      if (!wpn.lockRange) {
        return null;
      }
      return (+wpn.lockRange).toFixed(0);
    }
    if ((wpn.speed || 0) <= 0 || (wpn.life || 0) <= 0) {
      return null;
    }
    return (wpn.speed * wpn.life).toFixed(0);
  },
  effect: (wpn) => {
    var tag;
    if (!wpn.effect) {
      return null;
    }
    tag = (0,_html__WEBPACK_IMPORTED_MODULE_0__.$)('span');
    tag.classList.add('status-effect');
    tag.classList.add(wpn.effect);
    tag.textContent = (function() {
      switch (wpn.effect) {
        case 'flame':
          return 'Fire';
        case 'frozen':
          return 'Freeze';
        case 'shock':
          return 'Shock';
        case 'poison':
          return 'Poison';
        case 'recover':
          return 'Heal';
        case 'recovertime':
          return 'Regen';
        default:
          return wpn.effect;
      }
    })();
    return tag;
  },
  revive: suffixProp('revive', '%'),
  shots: (wpn) => {
    var shots;
    shots = wpn.shots || 1;
    if (wpn.units > 1) {
      return `${wpn.units} x ${shots}`;
    } else {
      return shots;
    }
  },
  units: (wpn) => {
    return wpn.units || 1;
  },
  radius: decimalProp(2),
  subRadius: decimalProp(2),
  energy: decimalProp(1),
  duration: (wpn) => {
    var duration, seconds;
    seconds = wpn.fuseSeconds || wpn.durationSeconds;
    if (seconds) {
      return seconds;
    }
    duration = wpn.fuse || wpn.duration;
    if (duration) {
      return +(duration / _framerate_coffee__WEBPACK_IMPORTED_MODULE_2__.FPS).toFixed(1);
    }
  },
  interval: (wpn) => {
    var burstRof, isLockTime, rof;
    if (wpn.burst > 1 && wpn.rof) {
      return `${wpn.rof.toFixed(1)} x ${wpn.burst}`;
    }
    if (wpn.rof) {
      return wpn.rof.toFixed(1);
    }
    rof = +(_framerate_coffee__WEBPACK_IMPORTED_MODULE_2__.FPS / (wpn.interval || 1)).toFixed(2);
    if (wpn.category === 'grenade' && !wpn.reload) {
      return rof;
    }
    if ((wpn.ammo || 1) < 2 && wpn.reload < _framerate_coffee__WEBPACK_IMPORTED_MODULE_2__.FPS) {
      return (_framerate_coffee__WEBPACK_IMPORTED_MODULE_2__.FPS / wpn.reload).toFixed(1);
    }
    if (!wpn.interval) {
      return null;
    }
    if (wpn.shotInterval && wpn.category !== 'gunship') { // Turrets
      return +(_framerate_coffee__WEBPACK_IMPORTED_MODULE_2__.FPS / wpn.shotInterval).toFixed(2);
    }
    if (wpn.ammo < 2) {
      return null;
    }
    if (wpn.category === 'short' && wpn.burst > 1) {
      return `- x ${wpn.burst}`;
    }
    isLockTime = wpn.lockTime || wpn.lockTimeSeconds;
    if (wpn.category === 'missile' && isLockTime && wpn.burstRate) {
      return (_framerate_coffee__WEBPACK_IMPORTED_MODULE_2__.FPS / wpn.burstRate).toFixed(1);
    }
    if (wpn.burst > 1 && wpn.interval > 1) {
      burstRof = _framerate_coffee__WEBPACK_IMPORTED_MODULE_2__.FPS / wpn.burstRate;
      rof = _framerate_coffee__WEBPACK_IMPORTED_MODULE_2__.FPS / ((wpn.burst - 1) * wpn.burstRate + wpn.interval);
      return `${+rof.toFixed(2)} x ${wpn.burst}`;
    }
    if (rof !== 2e308) {
      return rof;
    }
  },
  interval2: (wpn) => {
    if (wpn.shotInterval && wpn.shots >= 5) {
      return (_framerate_coffee__WEBPACK_IMPORTED_MODULE_2__.FPS / wpn.shotInterval).toFixed(1);
    }
  },
  intervalOD: suffixProp('intervalOverdrive'),
  reloadOD: suffixProp('reloadOverdrive'),
  windup: fpsProp(2),
  swing: suffixProp('swing'),
  lockTime: (wpn) => {
    if (wpn.lockTimeSeconds) {
      return wpn.lockTimeSeconds;
    }
    if (wpn.lockTime) {
      return (0,_framerate_coffee__WEBPACK_IMPORTED_MODULE_2__.byFps)(wpn.lockTime, 2);
    }
  },
  credits: bool('credits', '(CR)'),
  reload: (wpn) => {
    if (wpn.reloadSeconds) {
      return wpn.reloadSeconds;
    }
    if (wpn.reload < 0 || !wpn.reload) {
      return null;
    }
    if (wpn.credits) {
      return wpn.reload;
    }
    return (0,_framerate_coffee__WEBPACK_IMPORTED_MODULE_2__.byFps)(wpn.reload, 2);
  },
  reloadQuick: (wpn) => {
    var end, ref, ref1, start;
    if ((ref = wpn.tags) != null ? ref.includes('reload_auto') : void 0) {
      return 'Auto';
    } else if ((ref1 = wpn.tags) != null ? ref1.includes('reload_charge') : void 0) {
      return 'Charge';
    } else if (wpn.reloadQuick && wpn.reloadSeconds) {
      start = wpn.reloadSeconds * wpn.reloadQuick * 0.01;
      end = start + wpn.reloadQuickWindow;
      return `${start.toFixed(1)} - ${end.toFixed(1)}`;
    }
  },
  accuracy: (wpn) => {
    var el;
    el = (0,_html__WEBPACK_IMPORTED_MODULE_0__.$)('div');
    el.setAttribute('title', (typeof wpn.accuracy === "function" ? wpn.accuracy(wpn.accuracy) : void 0) ? void 0 : 'Accuracy only known by rank');
    el.textContent = (0,_accuracy_coffee__WEBPACK_IMPORTED_MODULE_1__.accuracy)(wpn);
    return el;
  },
  altFire: (wpn) => {
    if (wpn.zoom > 0) {
      return `⌖ ${+wpn.zoom.toFixed(1)}x`;
    } else {
      switch (wpn.secondary) {
        case 4:
          return '⇑'; // Boost
        case 5:
          return '⇒'; // Dash
        case 6:
          return '🛡'; // Reflect
      }
    }
  },
  zoom: (wpn) => {
    if (wpn.zoom === true) {
      return '✓';
    } else if (wpn.zoom > 0) {
      return `${+wpn.zoom.toFixed(1)}x`;
    }
  },
  chargeRate: (wpn) => {
    return chargeRate(wpn).toFixed(1);
  },
  chargeRatio: (wpn) => {
    return percent(chargeRate(wpn) / wpn.energy, 2);
  },
  chargeEmergencyRate: (wpn) => {
    return chargeEmergencyRate(wpn).toFixed(1);
  },
  chargeEmergencyRatio: (wpn) => {
    return percent(chargeEmergencyRate(wpn) / wpn.energy, 2);
  },
  energyUse: (wpn) => {
    return energyUse(wpn).toFixed(1);
  },
  energyUseRatio: (wpn) => {
    return percent(energyUse(wpn) / wpn.energy, 2);
  },
  boostUse: (wpn) => {
    return boostUse(wpn).toFixed(1);
  },
  boostUseRatio: (wpn) => {
    return percent(boostUse(wpn) / wpn.energy, 2);
  },
  speed: (wpn) => {
    var speed;
    if (wpn.walkSpeed) {
      return percent(wpn.walkSpeed, 0);
    }
    if (wpn.flightSpeedHorizontal) {
      return percent(wpn.flightSpeedHorizontal);
    }
    speed = wpn.speed * _framerate_coffee__WEBPACK_IMPORTED_MODULE_2__.FPS;
    if (speed > 10000 || !speed) {
      return null;
    }
    return speed.toFixed(1);
  },
  speed2: percentProp(0, 'speed'),
  flightBoost: percentProp(0, 'flightSpeedVertical'),
  dashForwardBoost: boostProp('boostForward'),
  dashBackwardBoost: boostProp('boostRear'),
  dashSideBoost: boostProp('boostSide'),
  airControl: percentProp(0),
  reloadBoost: boostProp('weaponReload'),
  hitSlowdown: percentProp(0),
  sprintSpeedBoost: percentProp(0, 'sprintSpeed'),
  sprintTurnBoost: percentProp(0, 'sprintSwirl'),
  sprintAccelerationBoost: percentProp(0, 'sprintAcceleration'),
  sprintHitSlowdown: percentProp(0),
  sprintBreakObstacles: bool('sprintDestruction'),
  lockSpeedBoost: suffixProp('lockTime'),
  lockRangeBoost: suffixProp('lockRange'),
  lockMulti: bool('isMultiLock'),
  dashCooldown: percentProp(0, 'dashInterval'),
  boostSpeed: percentProp(0),
  healAllyBoost: percentProp(0, 'allyRecovery'),
  probeRadius: percentProp(0, 'itemRange', -1),
  knockdownImmunity: bool('isKnockImmune'),
  convertible: (wpn) => {
    if (wpn.dashToBoost) {
      return "⇒ → ⇑";
    } else if (wpn.boostToDash) {
      return "⇑ → ⇒";
    }
  },
  shieldUse: percentProp(0, 'shieldConsumption'),
  shieldReflectUse: percentProp(0, 'shieldDeflectConsumption'),
  shieldKnockback: percentProp(0),
  equipWalkReduction: invertPercentProp(0, 'equipWeightMoveReduction'),
  equipTurnReduction: invertPercentProp(0, 'equipWeightTurnReduction'),
  recoil: invertPercentProp(0, 'equipRecoil')
};


/***/ },

/***/ "./src/templates/main.pug"
/*!********************************!*\
  !*** ./src/templates/main.pug ***!
  \********************************/
(module, __unused_webpack_exports, __webpack_require__) {

var pug = __webpack_require__(/*! !../../node_modules/pug-runtime/index.js */ "./node_modules/pug-runtime/index.js");

function template(locals) {var pug_html = "", pug_mixins = {}, pug_interp;;var locals_for_with = (locals || {});(function (Array, cat, categories, char, classes, diff, enemies, game, gameValues, games, getCredits, getMissionHp, headerDefinitions, isHtml, isLoading, lang, langs, localize, mission, mode, modes, playerCount, saveLoadState, slice3, star, stars, table, tables, weaponStat) {pug_html = pug_html + "\u003Cnav id=\"links\"\u003E\u003Cul\u003E\u003Cli class=\"nav-selected\"\u003E\u003Ca href=\"\u002F\"\u003EEarth Defense Force\u003C\u002Fa\u003E\u003C\u002Fli\u003E\u003Cli\u003E|\u003C\u002Fli\u003E\u003Cli\u003E\u003Ca href=\"https:\u002F\u002Fatwiki.jp\u002Fedf6\"\u003EJapanese EDF Wiki\u003C\u002Fa\u003E\u003C\u002Fli\u003E\u003Cli class=\"spacer\"\u003E\u003C\u002Fli\u003E";
if (!isLoading) {
pug_html = pug_html + "\u003Cli id=\"save-load-toggle\"\u003E\u003Cdiv class=\"button\" onclick=\"toggleSave()\"\u003ESave \u003Cb\u003EData\u003C\u002Fb\u003E\u003C\u002Fdiv\u003E\u003C\u002Fli\u003E";
}
pug_html = pug_html + "\u003C\u002Ful\u003E\u003C\u002Fnav\u003E";
if (saveLoadState && !isLoading) {
pug_html = pug_html + (null == (pug_interp = (__webpack_require__(/*! ./saving.pug */ "./src/templates/saving.pug").call)(this, locals)) ? "" : pug_interp);
}
if (isLoading) {
pug_html = pug_html + "\u003Cdiv class=\"loading\"\u003ELoading...\u003C\u002Fdiv\u003E";
}
else {
pug_mixins["dropdownItem"] = pug_interp = function(item){
var block = (this && this.block), attributes = (this && this.attributes) || {};
if (item.label) {
pug_html = pug_html + (null == (pug_interp = item.label) ? "" : pug_interp);
}
else {
pug_html = pug_html + (null == (pug_interp = slice3(item.name)) ? "" : pug_interp);
}
};
pug_mixins["dropdown"] = pug_interp = function(scope, list, selection){
var block = (this && this.block), attributes = (this && this.attributes) || {};
pug_html = pug_html + "\u003Cdiv" + (pug.attr("class", pug.classes(["dropdown",{ widechar: gameValues && gameValues.widechar }], [false,true]), false, true)) + "\u003E\u003Cdiv" + (pug.attr("class", pug.classes(["button",{ [selection.class || selection.id]: true }], [false,true]), false, true)) + "\u003E";
pug_mixins["dropdownItem"](selection);
pug_html = pug_html + "\u003C\u002Fdiv\u003E\u003Cmenu\u003E";
// iterate list
;(function(){
  var $$obj = list;
  if ('number' == typeof $$obj.length) {
      for (var pug_index0 = 0, $$l = $$obj.length; pug_index0 < $$l; pug_index0++) {
        var item = $$obj[pug_index0];
pug_html = pug_html + "\u003Ca" + (pug.attr("class", pug.classes([{ [item.class || item.id]: true, selected: selection.id === item.id }], [true]), false, true)+pug.attr("onclick", `selectItem('${scope}', '${item.id}')`, true, true)) + "\u003E";
pug_mixins["dropdownItem"](item);
pug_html = pug_html + "\u003C\u002Fa\u003E";
      }
  } else {
    var $$l = 0;
    for (var pug_index0 in $$obj) {
      $$l++;
      var item = $$obj[pug_index0];
pug_html = pug_html + "\u003Ca" + (pug.attr("class", pug.classes([{ [item.class || item.id]: true, selected: selection.id === item.id }], [true]), false, true)+pug.attr("onclick", `selectItem('${scope}', '${item.id}')`, true, true)) + "\u003E";
pug_mixins["dropdownItem"](item);
pug_html = pug_html + "\u003C\u002Fa\u003E";
    }
  }
}).call(this);

pug_html = pug_html + "\u003C\u002Fmenu\u003E\u003C\u002Fdiv\u003E";
};
pug_html = pug_html + "\u003Cheader id=\"top-menus\"\u003E";
pug_mixins["dropdown"]('game', games, game);
if (modes) {
pug_mixins["dropdown"]('mode', modes, mode);
}
pug_html = pug_html + "\u003Cdiv class=\"spacer\"\u003E\u003C\u002Fdiv\u003E";
if (langs) {
pug_mixins["dropdown"]('lang', langs, lang);
}
pug_html = pug_html + "\u003C\u002Fheader\u003E";
if (mode.id === 'stats' && cat && tables) {
pug_mixins["statCells"] = pug_interp = function(weapon, header, value){
var block = (this && this.block), attributes = (this && this.attributes) || {};
if (Array.isArray(value)) {
// iterate value
;(function(){
  var $$obj = value;
  if ('number' == typeof $$obj.length) {
      for (var pug_index1 = 0, $$l = $$obj.length; pug_index1 < $$l; pug_index1++) {
        var v = $$obj[pug_index1];
pug_mixins["statCells"](weapon, header, v);
      }
  } else {
    var $$l = 0;
    for (var pug_index1 in $$obj) {
      $$l++;
      var v = $$obj[pug_index1];
pug_mixins["statCells"](weapon, header, v);
    }
  }
}).call(this);

}
else
if (typeof value === 'object') {
pug_html = pug_html + "\u003Ctd" + (pug.attr("class", pug.classes([value.class], [true]), false, true)+pug.attr("colspan", value.colspan, true, true)) + "\u003E";
pug_mixins["statSubCell"](weapon, header, value.value);
pug_html = pug_html + "\u003C\u002Ftd\u003E";
}
else
if (value == null) {
pug_html = pug_html + "\u003Ctd" + (pug.attr("class", pug.classes([header], [true]), false, true)) + "\u003E";
pug_mixins["statSubCell"](weapon, header, value);
pug_html = pug_html + "\u003C\u002Ftd\u003E";
}
};
pug_mixins["statSubCell"] = pug_interp = function(weapon, header, value){
var block = (this && this.block), attributes = (this && this.attributes) || {};
if (value == null) {
pug_html = pug_html + "-";
}
else
if (isHtml(value)) {
pug_html = pug_html + (null == (pug_interp = value.outerHTML) ? "" : pug_interp);
}
else {
pug_html = pug_html + (null == (pug_interp = value) ? "" : pug_interp);
}
};
pug_mixins["starCell"] = pug_interp = function(weapon, prop){
var block = (this && this.block), attributes = (this && this.attributes) || {};
let star = weapon[`${prop}Star`]
let max = weapon[`${prop}StarMax`]
pug_html = pug_html + "\u003Ctd" + (pug.attr("class", pug.classes([{
    starfiller: star == null,
    star: star != null,
    max: star != null && star === max
  }], [true]), false, true)) + "\u003E" + (pug.escape(null == (pug_interp = star) ? "" : pug_interp)) + "\u003C\u002Ftd\u003E";
};
pug_html = pug_html + "\u003Cheader id=\"menus\"\u003E";
if (classes) {
pug_mixins["dropdown"]('class', classes, char);
}
if (categories) {
pug_mixins["dropdown"]('category', categories, cat);
}
if (gameValues && gameValues.hasStars) {
pug_mixins["dropdown"]('star', stars, star);
}
pug_html = pug_html + "\u003C\u002Fheader\u003E";
// iterate tables
;(function(){
  var $$obj = tables;
  if ('number' == typeof $$obj.length) {
      for (var pug_index2 = 0, $$l = $$obj.length; pug_index2 < $$l; pug_index2++) {
        var table = $$obj[pug_index2];
if (tables.length > 1 && table.name) {
pug_html = pug_html + "\u003Ch3\u003E" + (pug.escape(null == (pug_interp = localize(table.names, table.name)) ? "" : pug_interp)) + "\u003C\u002Fh3\u003E";
}
pug_html = pug_html + "\u003Ctable class=\"weapon-table\"\u003E\u003Cthead\u003E\u003Ctr\u003E";
// iterate table.headers
;(function(){
  var $$obj = table.headers;
  if ('number' == typeof $$obj.length) {
      for (var pug_index3 = 0, $$l = $$obj.length; pug_index3 < $$l; pug_index3++) {
        var header = $$obj[pug_index3];
let h = headerDefinitions[header] || { label: '???' }
pug_html = pug_html + "\u003Cth" + (pug.attr("title", h.tooltip, true, true)+pug.attr("colspan", h.colspan, true, true)) + "\u003E" + (pug.escape(null == (pug_interp = h.label) ? "" : pug_interp)) + "\u003C\u002Fth\u003E";
      }
  } else {
    var $$l = 0;
    for (var pug_index3 in $$obj) {
      $$l++;
      var header = $$obj[pug_index3];
let h = headerDefinitions[header] || { label: '???' }
pug_html = pug_html + "\u003Cth" + (pug.attr("title", h.tooltip, true, true)+pug.attr("colspan", h.colspan, true, true)) + "\u003E" + (pug.escape(null == (pug_interp = h.label) ? "" : pug_interp)) + "\u003C\u002Fth\u003E";
    }
  }
}).call(this);

pug_html = pug_html + "\u003C\u002Ftr\u003E\u003C\u002Fthead\u003E\u003Ctbody\u003E";
// iterate table.weapons
;(function(){
  var $$obj = table.weapons;
  if ('number' == typeof $$obj.length) {
      for (var pug_index4 = 0, $$l = $$obj.length; pug_index4 < $$l; pug_index4++) {
        var weapon = $$obj[pug_index4];
pug_html = pug_html + "\u003Ctr\u003E";
// iterate table.headers
;(function(){
  var $$obj = table.headers;
  if ('number' == typeof $$obj.length) {
      for (var pug_index5 = 0, $$l = $$obj.length; pug_index5 < $$l; pug_index5++) {
        var header = $$obj[pug_index5];
pug_mixins["statCells"](weapon, header, weaponStat(weapon, header));
let h = headerDefinitions[header]
if (h && h.starProp) {
pug_mixins["starCell"](weapon, h.starProp);
}
if (h && h.starProp2) {
pug_mixins["starCell"](weapon, h.starProp2);
}
      }
  } else {
    var $$l = 0;
    for (var pug_index5 in $$obj) {
      $$l++;
      var header = $$obj[pug_index5];
pug_mixins["statCells"](weapon, header, weaponStat(weapon, header));
let h = headerDefinitions[header]
if (h && h.starProp) {
pug_mixins["starCell"](weapon, h.starProp);
}
if (h && h.starProp2) {
pug_mixins["starCell"](weapon, h.starProp2);
}
    }
  }
}).call(this);

pug_html = pug_html + "\u003C\u002Ftr\u003E";
      }
  } else {
    var $$l = 0;
    for (var pug_index4 in $$obj) {
      $$l++;
      var weapon = $$obj[pug_index4];
pug_html = pug_html + "\u003Ctr\u003E";
// iterate table.headers
;(function(){
  var $$obj = table.headers;
  if ('number' == typeof $$obj.length) {
      for (var pug_index6 = 0, $$l = $$obj.length; pug_index6 < $$l; pug_index6++) {
        var header = $$obj[pug_index6];
pug_mixins["statCells"](weapon, header, weaponStat(weapon, header));
let h = headerDefinitions[header]
if (h && h.starProp) {
pug_mixins["starCell"](weapon, h.starProp);
}
if (h && h.starProp2) {
pug_mixins["starCell"](weapon, h.starProp2);
}
      }
  } else {
    var $$l = 0;
    for (var pug_index6 in $$obj) {
      $$l++;
      var header = $$obj[pug_index6];
pug_mixins["statCells"](weapon, header, weaponStat(weapon, header));
let h = headerDefinitions[header]
if (h && h.starProp) {
pug_mixins["starCell"](weapon, h.starProp);
}
if (h && h.starProp2) {
pug_mixins["starCell"](weapon, h.starProp2);
}
    }
  }
}).call(this);

pug_html = pug_html + "\u003C\u002Ftr\u003E";
    }
  }
}).call(this);

pug_html = pug_html + "\u003C\u002Ftbody\u003E\u003C\u002Ftable\u003E";
if (table.appendix) {
pug_html = pug_html + "\u003Cp\u003E" + (null == (pug_interp = table.appendix) ? "" : pug_interp) + "\u003C\u002Fp\u003E";
}
      }
  } else {
    var $$l = 0;
    for (var pug_index2 in $$obj) {
      $$l++;
      var table = $$obj[pug_index2];
if (tables.length > 1 && table.name) {
pug_html = pug_html + "\u003Ch3\u003E" + (pug.escape(null == (pug_interp = localize(table.names, table.name)) ? "" : pug_interp)) + "\u003C\u002Fh3\u003E";
}
pug_html = pug_html + "\u003Ctable class=\"weapon-table\"\u003E\u003Cthead\u003E\u003Ctr\u003E";
// iterate table.headers
;(function(){
  var $$obj = table.headers;
  if ('number' == typeof $$obj.length) {
      for (var pug_index7 = 0, $$l = $$obj.length; pug_index7 < $$l; pug_index7++) {
        var header = $$obj[pug_index7];
let h = headerDefinitions[header] || { label: '???' }
pug_html = pug_html + "\u003Cth" + (pug.attr("title", h.tooltip, true, true)+pug.attr("colspan", h.colspan, true, true)) + "\u003E" + (pug.escape(null == (pug_interp = h.label) ? "" : pug_interp)) + "\u003C\u002Fth\u003E";
      }
  } else {
    var $$l = 0;
    for (var pug_index7 in $$obj) {
      $$l++;
      var header = $$obj[pug_index7];
let h = headerDefinitions[header] || { label: '???' }
pug_html = pug_html + "\u003Cth" + (pug.attr("title", h.tooltip, true, true)+pug.attr("colspan", h.colspan, true, true)) + "\u003E" + (pug.escape(null == (pug_interp = h.label) ? "" : pug_interp)) + "\u003C\u002Fth\u003E";
    }
  }
}).call(this);

pug_html = pug_html + "\u003C\u002Ftr\u003E\u003C\u002Fthead\u003E\u003Ctbody\u003E";
// iterate table.weapons
;(function(){
  var $$obj = table.weapons;
  if ('number' == typeof $$obj.length) {
      for (var pug_index8 = 0, $$l = $$obj.length; pug_index8 < $$l; pug_index8++) {
        var weapon = $$obj[pug_index8];
pug_html = pug_html + "\u003Ctr\u003E";
// iterate table.headers
;(function(){
  var $$obj = table.headers;
  if ('number' == typeof $$obj.length) {
      for (var pug_index9 = 0, $$l = $$obj.length; pug_index9 < $$l; pug_index9++) {
        var header = $$obj[pug_index9];
pug_mixins["statCells"](weapon, header, weaponStat(weapon, header));
let h = headerDefinitions[header]
if (h && h.starProp) {
pug_mixins["starCell"](weapon, h.starProp);
}
if (h && h.starProp2) {
pug_mixins["starCell"](weapon, h.starProp2);
}
      }
  } else {
    var $$l = 0;
    for (var pug_index9 in $$obj) {
      $$l++;
      var header = $$obj[pug_index9];
pug_mixins["statCells"](weapon, header, weaponStat(weapon, header));
let h = headerDefinitions[header]
if (h && h.starProp) {
pug_mixins["starCell"](weapon, h.starProp);
}
if (h && h.starProp2) {
pug_mixins["starCell"](weapon, h.starProp2);
}
    }
  }
}).call(this);

pug_html = pug_html + "\u003C\u002Ftr\u003E";
      }
  } else {
    var $$l = 0;
    for (var pug_index8 in $$obj) {
      $$l++;
      var weapon = $$obj[pug_index8];
pug_html = pug_html + "\u003Ctr\u003E";
// iterate table.headers
;(function(){
  var $$obj = table.headers;
  if ('number' == typeof $$obj.length) {
      for (var pug_index10 = 0, $$l = $$obj.length; pug_index10 < $$l; pug_index10++) {
        var header = $$obj[pug_index10];
pug_mixins["statCells"](weapon, header, weaponStat(weapon, header));
let h = headerDefinitions[header]
if (h && h.starProp) {
pug_mixins["starCell"](weapon, h.starProp);
}
if (h && h.starProp2) {
pug_mixins["starCell"](weapon, h.starProp2);
}
      }
  } else {
    var $$l = 0;
    for (var pug_index10 in $$obj) {
      $$l++;
      var header = $$obj[pug_index10];
pug_mixins["statCells"](weapon, header, weaponStat(weapon, header));
let h = headerDefinitions[header]
if (h && h.starProp) {
pug_mixins["starCell"](weapon, h.starProp);
}
if (h && h.starProp2) {
pug_mixins["starCell"](weapon, h.starProp2);
}
    }
  }
}).call(this);

pug_html = pug_html + "\u003C\u002Ftr\u003E";
    }
  }
}).call(this);

pug_html = pug_html + "\u003C\u002Ftbody\u003E\u003C\u002Ftable\u003E";
if (table.appendix) {
pug_html = pug_html + "\u003Cp\u003E" + (null == (pug_interp = table.appendix) ? "" : pug_interp) + "\u003C\u002Fp\u003E";
}
    }
  }
}).call(this);

}
else
if (mode.hasDrops) {
pug_mixins["statCells"] = pug_interp = function(weapon, header, value){
var block = (this && this.block), attributes = (this && this.attributes) || {};
if (Array.isArray(value)) {
// iterate value
;(function(){
  var $$obj = value;
  if ('number' == typeof $$obj.length) {
      for (var pug_index11 = 0, $$l = $$obj.length; pug_index11 < $$l; pug_index11++) {
        var v = $$obj[pug_index11];
pug_mixins["statCells"](weapon, header, v);
      }
  } else {
    var $$l = 0;
    for (var pug_index11 in $$obj) {
      $$l++;
      var v = $$obj[pug_index11];
pug_mixins["statCells"](weapon, header, v);
    }
  }
}).call(this);

}
else
if (typeof value === 'object') {
pug_html = pug_html + "\u003Ctd" + (pug.attr("class", pug.classes([value.class], [true]), false, true)+pug.attr("colspan", value.colspan, true, true)) + "\u003E";
pug_mixins["statSubCell"](weapon, header, value.value);
pug_html = pug_html + "\u003C\u002Ftd\u003E";
}
else
if (value == null) {
pug_html = pug_html + "\u003Ctd" + (pug.attr("class", pug.classes([header], [true]), false, true)) + "\u003E";
pug_mixins["statSubCell"](weapon, header, value);
pug_html = pug_html + "\u003C\u002Ftd\u003E";
}
};
pug_mixins["statSubCell"] = pug_interp = function(weapon, header, value){
var block = (this && this.block), attributes = (this && this.attributes) || {};
if (value == null) {
pug_html = pug_html + "-";
}
else
if (isHtml(value)) {
pug_html = pug_html + (null == (pug_interp = value.outerHTML) ? "" : pug_interp);
}
else {
pug_html = pug_html + (null == (pug_interp = value) ? "" : pug_interp);
}
};
pug_mixins["starCell"] = pug_interp = function(weapon, prop){
var block = (this && this.block), attributes = (this && this.attributes) || {};
let star = weapon[`${prop}Star`]
let max = weapon[`${prop}StarMax`]
pug_html = pug_html + "\u003Ctd" + (pug.attr("class", pug.classes([{
    starfiller: star == null,
    star: star != null,
    max: star != null && star === max
  }], [true]), false, true)) + "\u003E" + (pug.escape(null == (pug_interp = star) ? "" : pug_interp)) + "\u003C\u002Ftd\u003E";
};
pug_html = pug_html + "\u003Cheader id=\"menus\"\u003E";
if (classes) {
pug_mixins["dropdown"]('class', classes, char);
}
if (categories) {
pug_mixins["dropdown"]('category', categories, cat);
}
pug_html = pug_html + "\u003C\u002Fheader\u003E";
table = tables[0]
pug_html = pug_html + "\u003Ctable class=\"drops-table\"\u003E\u003Cthead\u003E\u003Ctr\u003E";
// iterate table.headers
;(function(){
  var $$obj = table.headers;
  if ('number' == typeof $$obj.length) {
      for (var pug_index12 = 0, $$l = $$obj.length; pug_index12 < $$l; pug_index12++) {
        var header = $$obj[pug_index12];
let h = headerDefinitions[header] || { label: '???' }
pug_html = pug_html + "\u003Cth" + (pug.attr("title", h.tooltip, true, true)) + "\u003E" + (pug.escape(null == (pug_interp = h.label) ? "" : pug_interp)) + "\u003C\u002Fth\u003E";
      }
  } else {
    var $$l = 0;
    for (var pug_index12 in $$obj) {
      $$l++;
      var header = $$obj[pug_index12];
let h = headerDefinitions[header] || { label: '???' }
pug_html = pug_html + "\u003Cth" + (pug.attr("title", h.tooltip, true, true)) + "\u003E" + (pug.escape(null == (pug_interp = h.label) ? "" : pug_interp)) + "\u003C\u002Fth\u003E";
    }
  }
}).call(this);

// iterate mode.difficulties
;(function(){
  var $$obj = mode.difficulties;
  if ('number' == typeof $$obj.length) {
      for (var pug_index13 = 0, $$l = $$obj.length; pug_index13 < $$l; pug_index13++) {
        var diff = $$obj[pug_index13];
pug_html = pug_html + "\u003Cth" + (pug.attr("class", pug.classes([{[diff.name]: true
        }], [true]), false, true)+" colspan=\"2\""+pug.attr("title", diff.name, true, true)) + "\u003E" + (pug.escape(null == (pug_interp = diff.name) ? "" : pug_interp)) + "\u003C\u002Fth\u003E";
      }
  } else {
    var $$l = 0;
    for (var pug_index13 in $$obj) {
      $$l++;
      var diff = $$obj[pug_index13];
pug_html = pug_html + "\u003Cth" + (pug.attr("class", pug.classes([{[diff.name]: true
        }], [true]), false, true)+" colspan=\"2\""+pug.attr("title", diff.name, true, true)) + "\u003E" + (pug.escape(null == (pug_interp = diff.name) ? "" : pug_interp)) + "\u003C\u002Fth\u003E";
    }
  }
}).call(this);

pug_html = pug_html + "\u003C\u002Ftr\u003E\u003C\u002Fthead\u003E\u003Ctbody\u003E";
// iterate table.weapons
;(function(){
  var $$obj = table.weapons;
  if ('number' == typeof $$obj.length) {
      for (var pug_index14 = 0, $$l = $$obj.length; pug_index14 < $$l; pug_index14++) {
        var weapon = $$obj[pug_index14];
pug_html = pug_html + "\u003Ctr\u003E";
// iterate table.headers
;(function(){
  var $$obj = table.headers;
  if ('number' == typeof $$obj.length) {
      for (var pug_index15 = 0, $$l = $$obj.length; pug_index15 < $$l; pug_index15++) {
        var header = $$obj[pug_index15];
pug_mixins["statCells"](weapon, header, weaponStat(weapon, header));
      }
  } else {
    var $$l = 0;
    for (var pug_index15 in $$obj) {
      $$l++;
      var header = $$obj[pug_index15];
pug_mixins["statCells"](weapon, header, weaponStat(weapon, header));
    }
  }
}).call(this);

// iterate weapon.drops
;(function(){
  var $$obj = weapon.drops;
  if ('number' == typeof $$obj.length) {
      for (var pug_index16 = 0, $$l = $$obj.length; pug_index16 < $$l; pug_index16++) {
        var drop = $$obj[pug_index16];
if (drop && drop.from) {
pug_html = pug_html + "\u003Ctd class=\"from\"\u003E" + (pug.escape(null == (pug_interp = drop.from) ? "" : pug_interp)) + "\u003C\u002Ftd\u003E\u003Ctd class=\"to\"\u003E" + (pug.escape(null == (pug_interp = drop.to) ? "" : pug_interp)) + "\u003C\u002Ftd\u003E";
}
else {
pug_html = pug_html + "\u003Ctd colspan=\"2\"\u003E-\u003C\u002Ftd\u003E";
}
      }
  } else {
    var $$l = 0;
    for (var pug_index16 in $$obj) {
      $$l++;
      var drop = $$obj[pug_index16];
if (drop && drop.from) {
pug_html = pug_html + "\u003Ctd class=\"from\"\u003E" + (pug.escape(null == (pug_interp = drop.from) ? "" : pug_interp)) + "\u003C\u002Ftd\u003E\u003Ctd class=\"to\"\u003E" + (pug.escape(null == (pug_interp = drop.to) ? "" : pug_interp)) + "\u003C\u002Ftd\u003E";
}
else {
pug_html = pug_html + "\u003Ctd colspan=\"2\"\u003E-\u003C\u002Ftd\u003E";
}
    }
  }
}).call(this);

pug_html = pug_html + "\u003C\u002Ftr\u003E";
      }
  } else {
    var $$l = 0;
    for (var pug_index14 in $$obj) {
      $$l++;
      var weapon = $$obj[pug_index14];
pug_html = pug_html + "\u003Ctr\u003E";
// iterate table.headers
;(function(){
  var $$obj = table.headers;
  if ('number' == typeof $$obj.length) {
      for (var pug_index17 = 0, $$l = $$obj.length; pug_index17 < $$l; pug_index17++) {
        var header = $$obj[pug_index17];
pug_mixins["statCells"](weapon, header, weaponStat(weapon, header));
      }
  } else {
    var $$l = 0;
    for (var pug_index17 in $$obj) {
      $$l++;
      var header = $$obj[pug_index17];
pug_mixins["statCells"](weapon, header, weaponStat(weapon, header));
    }
  }
}).call(this);

// iterate weapon.drops
;(function(){
  var $$obj = weapon.drops;
  if ('number' == typeof $$obj.length) {
      for (var pug_index18 = 0, $$l = $$obj.length; pug_index18 < $$l; pug_index18++) {
        var drop = $$obj[pug_index18];
if (drop && drop.from) {
pug_html = pug_html + "\u003Ctd class=\"from\"\u003E" + (pug.escape(null == (pug_interp = drop.from) ? "" : pug_interp)) + "\u003C\u002Ftd\u003E\u003Ctd class=\"to\"\u003E" + (pug.escape(null == (pug_interp = drop.to) ? "" : pug_interp)) + "\u003C\u002Ftd\u003E";
}
else {
pug_html = pug_html + "\u003Ctd colspan=\"2\"\u003E-\u003C\u002Ftd\u003E";
}
      }
  } else {
    var $$l = 0;
    for (var pug_index18 in $$obj) {
      $$l++;
      var drop = $$obj[pug_index18];
if (drop && drop.from) {
pug_html = pug_html + "\u003Ctd class=\"from\"\u003E" + (pug.escape(null == (pug_interp = drop.from) ? "" : pug_interp)) + "\u003C\u002Ftd\u003E\u003Ctd class=\"to\"\u003E" + (pug.escape(null == (pug_interp = drop.to) ? "" : pug_interp)) + "\u003C\u002Ftd\u003E";
}
else {
pug_html = pug_html + "\u003Ctd colspan=\"2\"\u003E-\u003C\u002Ftd\u003E";
}
    }
  }
}).call(this);

pug_html = pug_html + "\u003C\u002Ftr\u003E";
    }
  }
}).call(this);

pug_html = pug_html + "\u003C\u002Ftbody\u003E\u003C\u002Ftable\u003E";
}
else
if (mode.hasEnemies) {
pug_mixins["statCells"] = pug_interp = function(weapon, header, value){
var block = (this && this.block), attributes = (this && this.attributes) || {};
if (Array.isArray(value)) {
// iterate value
;(function(){
  var $$obj = value;
  if ('number' == typeof $$obj.length) {
      for (var pug_index19 = 0, $$l = $$obj.length; pug_index19 < $$l; pug_index19++) {
        var v = $$obj[pug_index19];
pug_mixins["statCells"](weapon, header, v);
      }
  } else {
    var $$l = 0;
    for (var pug_index19 in $$obj) {
      $$l++;
      var v = $$obj[pug_index19];
pug_mixins["statCells"](weapon, header, v);
    }
  }
}).call(this);

}
else
if (typeof value === 'object') {
pug_html = pug_html + "\u003Ctd" + (pug.attr("class", pug.classes([value.class], [true]), false, true)+pug.attr("colspan", value.colspan, true, true)) + "\u003E";
pug_mixins["statSubCell"](weapon, header, value.value);
pug_html = pug_html + "\u003C\u002Ftd\u003E";
}
else
if (value == null) {
pug_html = pug_html + "\u003Ctd" + (pug.attr("class", pug.classes([header], [true]), false, true)) + "\u003E";
pug_mixins["statSubCell"](weapon, header, value);
pug_html = pug_html + "\u003C\u002Ftd\u003E";
}
};
pug_mixins["statSubCell"] = pug_interp = function(weapon, header, value){
var block = (this && this.block), attributes = (this && this.attributes) || {};
if (value == null) {
pug_html = pug_html + "-";
}
else
if (isHtml(value)) {
pug_html = pug_html + (null == (pug_interp = value.outerHTML) ? "" : pug_interp);
}
else {
pug_html = pug_html + (null == (pug_interp = value) ? "" : pug_interp);
}
};
pug_mixins["starCell"] = pug_interp = function(weapon, prop){
var block = (this && this.block), attributes = (this && this.attributes) || {};
let star = weapon[`${prop}Star`]
let max = weapon[`${prop}StarMax`]
pug_html = pug_html + "\u003Ctd" + (pug.attr("class", pug.classes([{
    starfiller: star == null,
    star: star != null,
    max: star != null && star === max
  }], [true]), false, true)) + "\u003E" + (pug.escape(null == (pug_interp = star) ? "" : pug_interp)) + "\u003C\u002Ftd\u003E";
};
pug_html = pug_html + "\u003Cheader id=\"menus\"\u003E";
if (mode.difficulties) {
pug_mixins["dropdown"]('difficulty', mode.difficulties, diff);
}
if (diff && diff.players) {
pug_mixins["dropdown"]('players', diff.players, playerCount);
}
pug_html = pug_html + "\u003Cdiv\u003EM\u003Cinput" + (" id=\"mission-input\" type=\"number\" min=\"1\""+pug.attr("max", mode.missions, true, true)+pug.attr("value", mission, true, true)+" onchange=\"calcMissionHps()\"") + "\u003E\u003C\u002Fdiv\u003E\u003C\u002Fheader\u003E\u003Ctable class=\"drops-table\"\u003E\u003Cthead\u003E\u003Ctr\u003E\u003Cth\u003EEnemy\u003C\u002Fth\u003E\u003Cth\u003EHP\u003C\u002Fth\u003E\u003Cth\u003EStun\u003C\u002Fth\u003E\u003Cth\u003EDrops\u003C\u002Fth\u003E\u003Cth\u003ECredits\u003C\u002Fth\u003E\u003Cth\u003EAggro\u003C\u002Fth\u003E\u003Cth\u003EAlert\u003C\u002Fth\u003E\u003C\u002Ftr\u003E\u003C\u002Fthead\u003E\u003Ctbody\u003E";
let group = ''
// iterate enemies
;(function(){
  var $$obj = enemies;
  if ('number' == typeof $$obj.length) {
      for (var pug_index20 = 0, $$l = $$obj.length; pug_index20 < $$l; pug_index20++) {
        var enemy = $$obj[pug_index20];
pug_html = pug_html + "\u003Ctr" + (pug.attr("class", pug.classes([{ duplicate: enemy.isDuplicate }], [true]), false, true)+pug.attr("data-enem", enemy.id, true, true)) + "\u003E";
var hp = getMissionHp(enemy, diff, mission)
pug_html = pug_html + "\u003Ctd class=\"name\"\u003E" + (pug.escape(null == (pug_interp = enemy.name || enemy.id) ? "" : pug_interp)) + "\u003C\u002Ftd\u003E\u003Ctd class=\"mission-hp\"\u003E" + (pug.escape(null == (pug_interp = hp.toFixed()) ? "" : pug_interp)) + "\u003C\u002Ftd\u003E\u003Ctd class=\"stagger\"\u003E" + (pug.escape(null == (pug_interp = enemy.stagger ? (hp * enemy.stagger).toFixed() : '-') ? "" : pug_interp)) + "\u003C\u002Ftd\u003E\u003Ctd\u003E" + (pug.escape(null == (pug_interp = ((enemy.drops || 0) / 0.947).toFixed(2)) ? "" : pug_interp)) + "\u003C\u002Ftd\u003E\u003Ctd\u003E" + (pug.escape(null == (pug_interp = getCredits(enemy).toFixed()) ? "" : pug_interp)) + "\u003C\u002Ftd\u003E\u003Ctd\u003E" + (pug.escape(null == (pug_interp = enemy.aggro[0] || '-') ? "" : pug_interp)) + "\u003C\u002Ftd\u003E\u003Ctd\u003E" + (pug.escape(null == (pug_interp = enemy.aggro[1] || '-') ? "" : pug_interp)) + "\u003C\u002Ftd\u003E\u003C\u002Ftr\u003E";
      }
  } else {
    var $$l = 0;
    for (var pug_index20 in $$obj) {
      $$l++;
      var enemy = $$obj[pug_index20];
pug_html = pug_html + "\u003Ctr" + (pug.attr("class", pug.classes([{ duplicate: enemy.isDuplicate }], [true]), false, true)+pug.attr("data-enem", enemy.id, true, true)) + "\u003E";
var hp = getMissionHp(enemy, diff, mission)
pug_html = pug_html + "\u003Ctd class=\"name\"\u003E" + (pug.escape(null == (pug_interp = enemy.name || enemy.id) ? "" : pug_interp)) + "\u003C\u002Ftd\u003E\u003Ctd class=\"mission-hp\"\u003E" + (pug.escape(null == (pug_interp = hp.toFixed()) ? "" : pug_interp)) + "\u003C\u002Ftd\u003E\u003Ctd class=\"stagger\"\u003E" + (pug.escape(null == (pug_interp = enemy.stagger ? (hp * enemy.stagger).toFixed() : '-') ? "" : pug_interp)) + "\u003C\u002Ftd\u003E\u003Ctd\u003E" + (pug.escape(null == (pug_interp = ((enemy.drops || 0) / 0.947).toFixed(2)) ? "" : pug_interp)) + "\u003C\u002Ftd\u003E\u003Ctd\u003E" + (pug.escape(null == (pug_interp = getCredits(enemy).toFixed()) ? "" : pug_interp)) + "\u003C\u002Ftd\u003E\u003Ctd\u003E" + (pug.escape(null == (pug_interp = enemy.aggro[0] || '-') ? "" : pug_interp)) + "\u003C\u002Ftd\u003E\u003Ctd\u003E" + (pug.escape(null == (pug_interp = enemy.aggro[1] || '-') ? "" : pug_interp)) + "\u003C\u002Ftd\u003E\u003C\u002Ftr\u003E";
    }
  }
}).call(this);

pug_html = pug_html + "\u003C\u002Ftbody\u003E\u003C\u002Ftable\u003E";
}
else {
pug_html = pug_html + "\u003Cp\u003EWhatever this mode is, it's not implemented\u003C\u002Fp\u003E";
}
}}.call(this,"Array" in locals_for_with?locals_for_with.Array:typeof Array!=="undefined"?Array:undefined,"cat" in locals_for_with?locals_for_with.cat:typeof cat!=="undefined"?cat:undefined,"categories" in locals_for_with?locals_for_with.categories:typeof categories!=="undefined"?categories:undefined,"char" in locals_for_with?locals_for_with.char:typeof char!=="undefined"?char:undefined,"classes" in locals_for_with?locals_for_with.classes:typeof classes!=="undefined"?classes:undefined,"diff" in locals_for_with?locals_for_with.diff:typeof diff!=="undefined"?diff:undefined,"enemies" in locals_for_with?locals_for_with.enemies:typeof enemies!=="undefined"?enemies:undefined,"game" in locals_for_with?locals_for_with.game:typeof game!=="undefined"?game:undefined,"gameValues" in locals_for_with?locals_for_with.gameValues:typeof gameValues!=="undefined"?gameValues:undefined,"games" in locals_for_with?locals_for_with.games:typeof games!=="undefined"?games:undefined,"getCredits" in locals_for_with?locals_for_with.getCredits:typeof getCredits!=="undefined"?getCredits:undefined,"getMissionHp" in locals_for_with?locals_for_with.getMissionHp:typeof getMissionHp!=="undefined"?getMissionHp:undefined,"headerDefinitions" in locals_for_with?locals_for_with.headerDefinitions:typeof headerDefinitions!=="undefined"?headerDefinitions:undefined,"isHtml" in locals_for_with?locals_for_with.isHtml:typeof isHtml!=="undefined"?isHtml:undefined,"isLoading" in locals_for_with?locals_for_with.isLoading:typeof isLoading!=="undefined"?isLoading:undefined,"lang" in locals_for_with?locals_for_with.lang:typeof lang!=="undefined"?lang:undefined,"langs" in locals_for_with?locals_for_with.langs:typeof langs!=="undefined"?langs:undefined,"localize" in locals_for_with?locals_for_with.localize:typeof localize!=="undefined"?localize:undefined,"mission" in locals_for_with?locals_for_with.mission:typeof mission!=="undefined"?mission:undefined,"mode" in locals_for_with?locals_for_with.mode:typeof mode!=="undefined"?mode:undefined,"modes" in locals_for_with?locals_for_with.modes:typeof modes!=="undefined"?modes:undefined,"playerCount" in locals_for_with?locals_for_with.playerCount:typeof playerCount!=="undefined"?playerCount:undefined,"saveLoadState" in locals_for_with?locals_for_with.saveLoadState:typeof saveLoadState!=="undefined"?saveLoadState:undefined,"slice3" in locals_for_with?locals_for_with.slice3:typeof slice3!=="undefined"?slice3:undefined,"star" in locals_for_with?locals_for_with.star:typeof star!=="undefined"?star:undefined,"stars" in locals_for_with?locals_for_with.stars:typeof stars!=="undefined"?stars:undefined,"table" in locals_for_with?locals_for_with.table:typeof table!=="undefined"?table:undefined,"tables" in locals_for_with?locals_for_with.tables:typeof tables!=="undefined"?tables:undefined,"weaponStat" in locals_for_with?locals_for_with.weaponStat:typeof weaponStat!=="undefined"?weaponStat:undefined));;return pug_html;};
module.exports = template;

/***/ },

/***/ "./src/templates/saving.pug"
/*!**********************************!*\
  !*** ./src/templates/saving.pug ***!
  \**********************************/
(module, __unused_webpack_exports, __webpack_require__) {

var pug = __webpack_require__(/*! !../../node_modules/pug-runtime/index.js */ "./node_modules/pug-runtime/index.js");

function template(locals) {var pug_html = "", pug_mixins = {}, pug_interp;;var locals_for_with = (locals || {});(function (saveLoadText) {pug_html = pug_html + "\u003Cdiv id=\"save-load-text\"\u003E\u003Cp\u003ECopy this text to another instance or paste it from one\u003C\u002Fp\u003E\u003Ctextarea id=\"save-load-textarea\"\u003E" + (pug.escape(null == (pug_interp = saveLoadText) ? "" : pug_interp)) + "\u003C\u002Ftextarea\u003E\u003Cdiv class=\"save-load-buttons\"\u003E\u003Cdiv class=\"button\" id=\"save-load-copy\" onclick=\"copySaveData()\"\u003E\u003Cb\u003ECopy\u003C\u002Fb\u003E\u003C\u002Fdiv\u003E\u003Cdiv class=\"button\" id=\"save-load-import\" onclick=\"importSaveData()\"\u003E\u003Cb\u003EImport\u003C\u002Fb\u003E\u003C\u002Fdiv\u003E\u003C\u002Fdiv\u003E\u003C\u002Fdiv\u003E";}.call(this,"saveLoadText" in locals_for_with?locals_for_with.saveLoadText:typeof saveLoadText!=="undefined"?saveLoadText:undefined));;return pug_html;};
module.exports = template;

/***/ },

/***/ "./node_modules/pug-runtime/index.js"
/*!*******************************************!*\
  !*** ./node_modules/pug-runtime/index.js ***!
  \*******************************************/
(__unused_webpack_module, exports, __webpack_require__) {

"use strict";


var pug_has_own_property = Object.prototype.hasOwnProperty;

/**
 * Merge two attribute objects giving precedence
 * to values in object `b`. Classes are special-cased
 * allowing for arrays and merging/joining appropriately
 * resulting in a string.
 *
 * @param {Object} a
 * @param {Object} b
 * @return {Object} a
 * @api private
 */

exports.merge = pug_merge;
function pug_merge(a, b) {
  if (arguments.length === 1) {
    var attrs = a[0];
    for (var i = 1; i < a.length; i++) {
      attrs = pug_merge(attrs, a[i]);
    }
    return attrs;
  }

  for (var key in b) {
    if (key === 'class') {
      var valA = a[key] || [];
      a[key] = (Array.isArray(valA) ? valA : [valA]).concat(b[key] || []);
    } else if (key === 'style') {
      var valA = pug_style(a[key]);
      valA = valA && valA[valA.length - 1] !== ';' ? valA + ';' : valA;
      var valB = pug_style(b[key]);
      valB = valB && valB[valB.length - 1] !== ';' ? valB + ';' : valB;
      a[key] = valA + valB;
    } else {
      a[key] = b[key];
    }
  }

  return a;
};

/**
 * Process array, object, or string as a string of classes delimited by a space.
 *
 * If `val` is an array, all members of it and its subarrays are counted as
 * classes. If `escaping` is an array, then whether or not the item in `val` is
 * escaped depends on the corresponding item in `escaping`. If `escaping` is
 * not an array, no escaping is done.
 *
 * If `val` is an object, all the keys whose value is truthy are counted as
 * classes. No escaping is done.
 *
 * If `val` is a string, it is counted as a class. No escaping is done.
 *
 * @param {(Array.<string>|Object.<string, boolean>|string)} val
 * @param {?Array.<string>} escaping
 * @return {String}
 */
exports.classes = pug_classes;
function pug_classes_array(val, escaping) {
  var classString = '', className, padding = '', escapeEnabled = Array.isArray(escaping);
  for (var i = 0; i < val.length; i++) {
    className = pug_classes(val[i]);
    if (!className) continue;
    escapeEnabled && escaping[i] && (className = pug_escape(className));
    classString = classString + padding + className;
    padding = ' ';
  }
  return classString;
}
function pug_classes_object(val) {
  var classString = '', padding = '';
  for (var key in val) {
    if (key && val[key] && pug_has_own_property.call(val, key)) {
      classString = classString + padding + key;
      padding = ' ';
    }
  }
  return classString;
}
function pug_classes(val, escaping) {
  if (Array.isArray(val)) {
    return pug_classes_array(val, escaping);
  } else if (val && typeof val === 'object') {
    return pug_classes_object(val);
  } else {
    return val || '';
  }
}

/**
 * Convert object or string to a string of CSS styles delimited by a semicolon.
 *
 * @param {(Object.<string, string>|string)} val
 * @return {String}
 */

exports.style = pug_style;
function pug_style(val) {
  if (!val) return '';
  if (typeof val === 'object') {
    var out = '';
    for (var style in val) {
      /* istanbul ignore else */
      if (pug_has_own_property.call(val, style)) {
        out = out + style + ':' + val[style] + ';';
      }
    }
    return out;
  } else {
    return val + '';
  }
};

/**
 * Render the given attribute.
 *
 * @param {String} key
 * @param {String} val
 * @param {Boolean} escaped
 * @param {Boolean} terse
 * @return {String}
 */
exports.attr = pug_attr;
function pug_attr(key, val, escaped, terse) {
  if (val === false || val == null || !val && (key === 'class' || key === 'style')) {
    return '';
  }
  if (val === true) {
    return ' ' + (terse ? key : key + '="' + key + '"');
  }
  var type = typeof val;
  if ((type === 'object' || type === 'function') && typeof val.toJSON === 'function') {
    val = val.toJSON();
  }
  if (typeof val !== 'string') {
    val = JSON.stringify(val);
    if (!escaped && val.indexOf('"') !== -1) {
      return ' ' + key + '=\'' + val.replace(/'/g, '&#39;') + '\'';
    }
  }
  if (escaped) val = pug_escape(val);
  return ' ' + key + '="' + val + '"';
};

/**
 * Render the given attributes object.
 *
 * @param {Object} obj
 * @param {Object} terse whether to use HTML5 terse boolean attributes
 * @return {String}
 */
exports.attrs = pug_attrs;
function pug_attrs(obj, terse){
  var attrs = '';

  for (var key in obj) {
    if (pug_has_own_property.call(obj, key)) {
      var val = obj[key];

      if ('class' === key) {
        val = pug_classes(val);
        attrs = pug_attr(key, val, false, terse) + attrs;
        continue;
      }
      if ('style' === key) {
        val = pug_style(val);
      }
      attrs += pug_attr(key, val, false, terse);
    }
  }

  return attrs;
};

/**
 * Escape the given string of `html`.
 *
 * @param {String} html
 * @return {String}
 * @api private
 */

var pug_match_html = /["&<>]/;
exports.escape = pug_escape;
function pug_escape(_html){
  var html = '' + _html;
  var regexResult = pug_match_html.exec(html);
  if (!regexResult) return _html;

  var result = '';
  var i, lastIndex, escape;
  for (i = regexResult.index, lastIndex = 0; i < html.length; i++) {
    switch (html.charCodeAt(i)) {
      case 34: escape = '&quot;'; break;
      case 38: escape = '&amp;'; break;
      case 60: escape = '&lt;'; break;
      case 62: escape = '&gt;'; break;
      default: continue;
    }
    if (lastIndex !== i) result += html.substring(lastIndex, i);
    lastIndex = i + 1;
    result += escape;
  }
  if (lastIndex !== i) return result + html.substring(lastIndex, i);
  else return result;
};

/**
 * Re-throw the given `err` in context to the
 * the pug in `filename` at the given `lineno`.
 *
 * @param {Error} err
 * @param {String} filename
 * @param {String} lineno
 * @param {String} str original source
 * @api private
 */

exports.rethrow = pug_rethrow;
function pug_rethrow(err, filename, lineno, str){
  if (!(err instanceof Error)) throw err;
  if ((typeof window != 'undefined' || !filename) && !str) {
    err.message += ' on line ' + lineno;
    throw err;
  }
  try {
    str = str || (__webpack_require__(/*! fs */ "?8f63").readFileSync)(filename, 'utf8')
  } catch (ex) {
    pug_rethrow(err, null, lineno)
  }
  var context = 3
    , lines = str.split('\n')
    , start = Math.max(lineno - context, 0)
    , end = Math.min(lines.length, lineno + context);

  // Error context
  var context = lines.slice(start, end).map(function(line, i){
    var curr = i + start + 1;
    return (curr == lineno ? '  > ' : '    ')
      + curr
      + '| '
      + line;
  }).join('\n');

  // Alter exception message
  err.path = filename;
  err.message = (filename || 'Pug') + ':' + lineno
    + '\n' + context + '\n\n' + err.message;
  throw err;
};


/***/ },

/***/ "?8f63"
/*!********************!*\
  !*** fs (ignored) ***!
  \********************/
() {

/* (ignored) */

/***/ }

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		if (!(moduleId in __webpack_modules__)) {
/******/ 			delete __webpack_module_cache__[moduleId];
/******/ 			var e = new Error("Cannot find module '" + moduleId + "'");
/******/ 			e.code = 'MODULE_NOT_FOUND';
/******/ 			throw e;
/******/ 		}
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/async module */
/******/ 	(() => {
/******/ 		var hasSymbol = typeof Symbol === "function";
/******/ 		var webpackQueues = hasSymbol ? Symbol("webpack queues") : "__webpack_queues__";
/******/ 		var webpackExports = hasSymbol ? Symbol("webpack exports") : "__webpack_exports__";
/******/ 		var webpackError = hasSymbol ? Symbol("webpack error") : "__webpack_error__";
/******/ 		
/******/ 		var resolveQueue = (queue) => {
/******/ 			if(queue && queue.d < 1) {
/******/ 				queue.d = 1;
/******/ 				queue.forEach((fn) => (fn.r--));
/******/ 				queue.forEach((fn) => (fn.r-- ? fn.r++ : fn()));
/******/ 			}
/******/ 		}
/******/ 		var wrapDeps = (deps) => (deps.map((dep) => {
/******/ 			if(dep !== null && typeof dep === "object") {
/******/ 		
/******/ 				if(dep[webpackQueues]) return dep;
/******/ 				if(dep.then) {
/******/ 					var queue = [];
/******/ 					queue.d = 0;
/******/ 					dep.then((r) => {
/******/ 						obj[webpackExports] = r;
/******/ 						resolveQueue(queue);
/******/ 					}, (e) => {
/******/ 						obj[webpackError] = e;
/******/ 						resolveQueue(queue);
/******/ 					});
/******/ 					var obj = {};
/******/ 		
/******/ 					obj[webpackQueues] = (fn) => (fn(queue));
/******/ 					return obj;
/******/ 				}
/******/ 			}
/******/ 			var ret = {};
/******/ 			ret[webpackQueues] = x => {};
/******/ 			ret[webpackExports] = dep;
/******/ 			return ret;
/******/ 		}));
/******/ 		__webpack_require__.a = (module, body, hasAwait) => {
/******/ 			var queue;
/******/ 			hasAwait && ((queue = []).d = -1);
/******/ 			var depQueues = new Set();
/******/ 			var exports = module.exports;
/******/ 			var currentDeps;
/******/ 			var outerResolve;
/******/ 			var reject;
/******/ 			var promise = new Promise((resolve, rej) => {
/******/ 				reject = rej;
/******/ 				outerResolve = resolve;
/******/ 			});
/******/ 			promise[webpackExports] = exports;
/******/ 			promise[webpackQueues] = (fn) => (queue && fn(queue), depQueues.forEach(fn), promise["catch"](x => {}));
/******/ 			module.exports = promise;
/******/ 			var handle = (deps) => {
/******/ 				currentDeps = wrapDeps(deps);
/******/ 				var fn;
/******/ 				var getResult = () => (currentDeps.map((d) => {
/******/ 		
/******/ 					if(d[webpackError]) throw d[webpackError];
/******/ 					return d[webpackExports];
/******/ 				}))
/******/ 				var promise = new Promise((resolve) => {
/******/ 					fn = () => (resolve(getResult));
/******/ 					fn.r = 0;
/******/ 					var fnQueue = (q) => (q !== queue && !depQueues.has(q) && (depQueues.add(q), q && !q.d && (fn.r++, q.push(fn))));
/******/ 					currentDeps.map((dep) => (dep[webpackQueues](fnQueue)));
/******/ 				});
/******/ 				return fn.r ? promise : getResult();
/******/ 			}
/******/ 			var done = (err) => ((err ? reject(promise[webpackError] = err) : outerResolve(exports)), resolveQueue(queue))
/******/ 			body(handle, done);
/******/ 			queue && queue.d < 0 && (queue.d = 0);
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module used 'module' so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__("./src/scripts/invaders.coffee");
/******/ 	
/******/ })()
;
//# sourceMappingURL=main.js.map