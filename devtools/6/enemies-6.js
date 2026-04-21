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

export function processEnemy(setup, json) {
  const killCounter = getNode(json, 'game_object_kill_counter')
  if(!killCounter)
    return
  const obj = splatNode(json.variables)
  const enemy = {
    ...setup,
    group: obj.game_object_kill_counter.replace('KillCount', ''),
    hp: obj.game_object_durability,
    credits: obj.game_object_destroy_score_adjust,
    drops: obj.game_object_drop_item?.[2],
    aggro: obj.game_object_encount,
  }
  return enemy
}
