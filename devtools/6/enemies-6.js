import fs from 'fs/promises'
import enemyNames from './enemies-6-en.js'
import { listDir, loadJson, setGame } from '../load-sgott.js'
import { getNode, splatNode } from '../get-node.js'

export async function extractEnemyData() {
  setGame(6)

  // let enemies = Object.entries(enemyNames)
  //  .map(([id, name]) => loadJson(`Object/${id}`).then(obj => processEnemy({ id, name }, obj)))
  const fileNames = await listDir('Object')
  let enemies = fileNames
    .filter(fName => fName.endsWith('.json'))
    .map(fName => fName.replace(/\.json$/, ''))
    .map((id) => loadJson(`Object/${id}`).then(obj => processEnemy({ id }, obj)))

  enemies = await Promise.all(enemies)
  enemies = enemies.filter(Boolean)
  return enemies
}

const groups = {
  E660_HEAVY_DANGO_M: 'Dango',
  E660_HEAVY_DANGO_L: 'Dango',
  E604_RADON: 'Radon'
}

function rename(obj, from, to) {
  if (obj[from] == null)
    return obj

  obj[to] = obj[from]
  delete obj[from]
  return obj
}

export function processEnemy(setup, json) {
  const enemy = splatNode(json.variables)
  rename(enemy, 'game_object_encount', 'aggro')

  const group = groups[setup.id] || enemy.game_object_kill_counter?.replace('KillCount', '')
  if(!group && (!enemy.game_object_drop_item || !enemy.aggro))
    return;
  if(!group)
    console.error(`Group not found: "${setup.id}"`)

  enemy.drops = enemy.game_object_drop_item?.[2]
  rename(enemy, 'xgs_scene_object_class', 'type')
  rename(enemy, 'game_object_durability', 'hp')
  rename(enemy, 'game_object_destroy_score_adjust', 'credits')
  rename(enemy, 'insectbase_DamageReaction', 'stagger')
  delete enemy.game_object_drop_item
  delete enemy.game_object_kill_counter
  delete enemy.game_object_camera_setting
  delete enemy.game_sound
  delete enemy.game_object_talk_setting
  delete enemy.resource
  delete enemy.spawn_effect_setting
  delete enemy.se_list
  delete enemy.game_object_formation
  delete enemy.ai_script
  // delete enemy.weapon // TODO: Relevant later to find out damage
  delete enemy.weapon_node
  delete enemy.reaction_encount
  delete enemy.reaction_encount_leader
  delete enemy.reaction_find_enemy
  delete enemy.reaction_lost
  delete enemy.reaction_roar
  delete enemy.reaction_delight
  delete enemy.body_reaction_tl
  delete enemy.body_reaction_tr
  delete enemy.body_reaction_bl
  delete enemy.body_reaction_br
  delete enemy.body_model
  delete enemy.body_ragdoll
  delete enemy.ragdoll_contact
  delete enemy.humanoid_base_is_leader
  delete enemy.base_parts_config
  delete enemy.wakeup_node
  delete enemy.ragdoll
  delete enemy.insectbase_CollisionSetting
  delete enemy.dragon_RagdollReactionScale
  delete enemy.DeadBloodScale
  delete enemy.DeadBloodColor
  delete enemy.BloodScale
  delete enemy.BloodColor
  delete enemy.dragon_AiSetting
  delete enemy.animation_model
  delete enemy.RandomReactionTable
  delete enemy.se_table

  return {
    ...setup,
    ...enemy,
    group: group || (void 0),
  }
}
