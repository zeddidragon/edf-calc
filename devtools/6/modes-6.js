import { loadJson } from '../load-sgott.js'

export async function extractModesData(config) {
  const table = await loadJson(config)
  const modeList = table.variables.find(v => v.name === 'ModeList').value
  return Promise.all([
    ...modeList.slice(0, 3),
    modeList[4],
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

async function processMode({ value: mode }) {
  const key = mode[0].value
  const lvBuffer = Buffer.alloc(4)
  const missionListPath = mode[6].value[0].value
    .replace('app:/', '')
    .replace('.sgo', '')
    .toUpperCase()
    .replace('MISSION/', 'Mission/')
  const missionList = (await loadJson(missionListPath))
    .variables[0]
    .value
  const missions = missionList.length
  const obj = {
    ...modes[key],
    missions,
    difficulties: mode[7].value.map(({ value: d }, i) => {
      const dropsLow = Array(missions)
      const dropsHigh = Array(missions)
      const [start, end] = d[2].value.slice(0, 2).map(v => v.value)
      const spread = d[2].value[2].value
      const range = end - start
      for(let i = 0; i < missions; i++) {
        const mission = missionList[i].value
        const pivot = start + range * mission[0].value / missions
        lvBuffer.writeFloatLE(pivot - spread)
        lvBuffer.writeFloatLE(lvBuffer.readFloatLE() * 25)
        dropsLow[i] = Math.floor(lvBuffer.readFloatLE())
        lvBuffer.writeFloatLE(pivot + Math.max(spread * 0.05, 0.05))
        lvBuffer.writeFloatLE(lvBuffer.readFloatLE() * 25)
        dropsHigh[i] = Math.floor(lvBuffer.readFloatLE())
      }

      return {
        name: difficulties[i],
        progressScaling: d[0].value.map(v => v.value),
        playerScaling: d[1].value.map(v => +v.value.toFixed(2)),
        drops: d[2].value.slice(0, 2).map(v => +(v.value * 25).toFixed(2)),
        dropSpread: +(d[2].value[2].value * 25).toFixed(2),
        dropsLow,
        dropsHigh,
        weaponLimits: d[6].value ? d[6].value.map(v => {
          if(v.value >= 0) {
            return +(v.value * 25).toFixed(2)
          } else {
            return null
          }
        }) : -1,
        armorLimits: d[7].value ? d[7].value.map(v => v.value) : null,
      }
    }),
  }
  return obj
}

