import type { BattleEnemyUnit, EnemyAction } from '../data/types';

// 加权随机选择敌人行动
export function selectEnemyAction(enemy: BattleEnemyUnit): EnemyAction {
  const actions = enemy.actions;
  const totalWeight = actions.reduce((sum, a) => sum + a.weight, 0);
  let rand = Math.random() * totalWeight;

  for (const action of actions) {
    rand -= action.weight;
    if (rand <= 0) return action;
  }

  return actions[actions.length - 1] ?? actions[0]!;
}

// 预测敌人下一个最可能的行动（用于弈理心经预判）
export function predictNextAction(enemy: BattleEnemyUnit): EnemyAction {
  let maxWeight = -1;
  let best = enemy.actions[0]!;
  for (const a of enemy.actions) {
    if (a.weight > maxWeight) {
      maxWeight = a.weight;
      best = a;
    }
  }
  return best;
}