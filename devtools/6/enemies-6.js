import fs from 'fs/promises'
import enemyNames from './enemies-6-en.js'
import { listDir, loadJson, setGame } from '../load-sgott.js'
import { getNode, splatNode } from '../get-node.js'

export async function extractEnemyData() {
  setGame(6)
  let enemies = Object.entries(enemyNames)
    .map(([id, name]) => loadJson(`Object/${id}`).then(obj => processEnemy({ id, name }, obj)))
  enemies = await Promise.all(enemies)
  enemies = enemies.filter(Boolean)
  return enemies
}

const groups = {
  E660_HEAVY_DANGO_M: 'Dango',
  E660_HEAVY_DANGO_L: 'Dango',
  E604_RADON: 'Radon'
}

export function processEnemy(setup, json) {
  const obj = splatNode(json.variables)
  const group = groups[setup.id] || obj.game_object_kill_counter?.replace('KillCount', '')
  if (!group)
    console.error(`Group not found: "${setup.id}"`)
  const enemy = {
    ...setup,
    group: obj.game_object_kill_counter?.replace('KillCount', '') || 'Radon',
    hp: obj.game_object_durability,
    credits: obj.game_object_destroy_score_adjust,
    drops: obj.game_object_drop_item?.[2],
    aggro: obj.game_object_encount,
  }
  return enemy
}
