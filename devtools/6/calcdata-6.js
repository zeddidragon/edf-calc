import fs from 'fs/promises'
import { setGame } from '../load-sgott.js'
import bullets from '../bullets.js'
import { extractWeaponData, headers } from './weapons-6.js'
import { extractEnemyData } from './enemies-6.js'
import { extractModesData } from './modes-6.js'

export default async function extractCalcdata() {
  bullets.assignGame(6)

  const [
    weapons,
    modes,
    enemies,
  ] = await Promise.all([
    extractWeaponData(),
    extractModesData('DefaultPackage/config'),
    extractEnemyData(),
  ])

  return {
    langs: ['en', 'ja'],
    classes: [
      'ranger',
      'winger',
      'bomber',
      'fencer',
    ],
    charLabels: [
      'Ranger',
      'Wing Diver',
      'Air Raider',
      'Fencer',
    ],
    gameValues: {
      hasStars: true,
      hasDropWeight: true,
      winger: {
        charge: 0.06,
        chargeEmergency: 0.15,
        flightUse: 0.15,
        boostUse: 0.045,
      },
    },
    headers,
    weapons,
    enemies,
    modes,
  }
}
