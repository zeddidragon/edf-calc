import { transformJson } from '../load-sgott.js'

export async function extractModesData(config) {
  const { ModeList } = await transformJson(config)
  return Promise.all([
    ModeList[0],
    ...ModeList.filter(m => m[0].startsWith('GameMode_Online')),
  ].map(processMode))
}

const modes = {
  GameMode_Scenario: {
    name: 'OFF',
  },
  GameMode_OnlineScenario: {
    name: 'ON',
  },
  GameMode_Offline_MissionPack01: {
    name: 'DLC1',
  },
  GameMode_Online_MissionPack01: {
    name: 'DLC1',
  },
  GameMode_Offline_MissionPack02: {
    name: 'DLC2',
  },
  GameMode_Online_MissionPack02: {
    name: 'DLC2',
  },
}

const difficulties = [
  'Easy',
  'Normal',
  'Hard',
  'Hardest',
  'Inferno',
]

async function processMode(mode) {
  const key = mode[0]
  const lvBuffer = Buffer.alloc(4)
  const missionListPath = mode[6][0]
    .replace('app:/', '')
    .replace('.sgo', '')
    .toUpperCase()
    .replace('MISSION/', 'Mission/')
  const { table: missionList } = (await transformJson(missionListPath))
  const missions = missionList.length
  const obj = {
    ...modes[key],
    missions,
    difficulties: mode[7].map((d, i) => {
      const dropsLow = Array(missions)
      const dropsHigh = Array(missions)
      const [start, end] = d[2].slice(0, 2)
      const spread = d[2][2]
      const range = end - start
      for(let i = 0; i < missions; i++) {
        const mission = missionList[i]
        const pivot = start + range * mission[0] / missions
        lvBuffer.writeFloatLE(pivot - spread)
        lvBuffer.writeFloatLE(lvBuffer.readFloatLE() * 25)
        dropsLow[i] = Math.floor(lvBuffer.readFloatLE())
        lvBuffer.writeFloatLE(pivot + Math.max(spread * 0.05, 0.05))
        lvBuffer.writeFloatLE(lvBuffer.readFloatLE() * 25)
        dropsHigh[i] = Math.floor(lvBuffer.readFloatLE())
      }

      return {
        name: difficulties[i],
        progressScaling: d[0],
        playerScaling: d[1].map(v => +v.toFixed(2)),
        enemyScaling: d[3].map(v => +v.toFixed(2)),
        drops: d[2].slice(0, 2).map(v => +(v * 25).toFixed(2)),
        dropSpread: +(d[2][2] * 25).toFixed(2),
        dropsLow,
        dropsHigh,
        weaponLimits: d[6] ? d[6].map(v => {
          if(v >= 0) {
            return +(v * 25).toFixed(2)
          } else {
            return null
          }
        }) : -1,
        armorLimits: d[7] ? d[7] : null,
      }
    }),
  }
  return obj
}

