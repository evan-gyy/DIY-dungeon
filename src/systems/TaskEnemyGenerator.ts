// ============================================================
//  src/systems/TaskEnemyGenerator.ts — 任务战斗敌人生成器
// ============================================================
//  根据任务难度 + 玩家等级，使用 realmConfig 的 calculateFinalStats
//  生成"有挑战但不难"的敌人，并启动自定义战斗。
// ============================================================

import { calculateFinalStats } from '../data/realmConfig';
import type { TalentId } from '../data/realmConfig';
import type { BattleEnemyUnit, BattleUnit, EnemyAction, ItemId, SkillId } from '../data/types';
import { getPlayer } from '../state/GameState';
import { bus } from '../ui/events';

// ──── 配置类型 ────

export type TaskDifficulty = 'easy' | 'normal' | 'hard';

export interface TaskBattleConfig {
  difficulty: TaskDifficulty;
  enemyType: 'bandit' | 'beast' | 'rival' | 'monster';
}

// ──── 敌人名字池 ────

const ENEMY_NAMES: Record<TaskBattleConfig['enemyType'], string[]> = {
  bandit: ['山贼头目', '流寇悍匪', '匪帮头领', '绿林大盗', '蒙面盗贼'],
  beast:  ['铁爪黑熊', '赤眼妖狼', '毒牙巨蟒', '金翅猛禽', '狂暴山猪'],
  rival:  ['华山剑客', '魔教高手', '丐帮长老', '唐门刺客', '逍遥散人'],
  monster: ['石魔傀儡', '血蝠王', '幽冥鬼将', '炎魔兽', '冰晶巨蝎'],
};

// ──── 行动模板 ────

interface ActionTemplate {
  name: string;
  powerMul: number;
  defPen: number;
  hit: number;
  weight: number;
  effect?: { type: string; value: number; duration: number };
}

const ACTION_TEMPLATES: Record<TaskBattleConfig['enemyType'], ActionTemplate[]> = {
  bandit: [
    { name: '乱刀斩', powerMul: 1.0, defPen: 0.7, hit: 1, weight: 50 },
    { name: '猛冲',   powerMul: 1.2, defPen: 0.5, hit: 1, weight: 30 },
    { name: '格挡',   powerMul: 0,   defPen: 0, hit: 0, weight: 20, effect: { type: 'def_boost', value: 6, duration: 1 } },
  ],
  beast: [
    { name: '利爪撕', powerMul: 1.1, defPen: 0.6, hit: 2, weight: 45 },
    { name: '猛撞',   powerMul: 1.4, defPen: 0.4, hit: 1, weight: 35 },
    { name: '咆哮',   powerMul: 0,   defPen: 0, hit: 0, weight: 20, effect: { type: 'buff_atk', value: 8, duration: 2 } },
  ],
  rival: [
    { name: '连环击', powerMul: 0.7, defPen: 0.8, hit: 2, weight: 40 },
    { name: '破空斩', powerMul: 1.2, defPen: 0.6, hit: 1, weight: 35 },
    { name: '凝神',   powerMul: 0,   defPen: 0, hit: 0, weight: 25, effect: { type: 'buff_atk', value: 10, duration: 2 } },
  ],
  monster: [
    { name: '吞噬',   powerMul: 1.3, defPen: 0.5, hit: 1, weight: 40 },
    { name: '毒息',   powerMul: 0.5, defPen: 0.7, hit: 1, weight: 35, effect: { type: 'poison', value: 8, duration: 3 } },
    { name: '硬化',   powerMul: 0,   defPen: 0, hit: 0, weight: 25, effect: { type: 'def_boost', value: 10, duration: 2 } },
  ],
};

// ──── 核心生成 ────

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function enemyLevel(playerLevel: number, difficulty: TaskDifficulty): number {
  switch (difficulty) {
    case 'easy':   return Math.max(1, playerLevel - 2);
    case 'normal': return Math.max(1, playerLevel - 1);
    case 'hard':   return Math.max(1, playerLevel);
  }
}

function randomEnemyTalent(): TalentId[] {
  const roll = Math.random();
  if (roll < 0.6) return [];
  const commonTalents: TalentId[] = ['normal', 'diligent', 'sword_heart', 'strong_as_ox', 'iron_skin', 'swift_shadow', 'genius'];
  return [pickRandom(commonTalents)];
}

export function generateTaskEnemy(config: TaskBattleConfig): BattleEnemyUnit {
  const player = getPlayer();
  const eLevel = enemyLevel(player.level, config.difficulty);
  const talents = randomEnemyTalent();
  const stats = calculateFinalStats(eLevel, talents);

  const scale = config.difficulty === 'hard' ? 0.95 : config.difficulty === 'normal' ? 0.80 : 0.65;

  const templates = ACTION_TEMPLATES[config.enemyType];
  const actions: EnemyAction[] = templates.map(t => ({
    name: t.name,
    icon: '⚔️',
    powerMul: t.powerMul,
    defPen: t.defPen,
    hit: t.hit as 0 | 1 | 2,
    mpCost: 0,
    weight: t.weight,
    effect: t.effect ? { type: t.effect.type as any, value: t.effect.value, duration: t.effect.duration } : null,
  }));

  const name = pickRandom(ENEMY_NAMES[config.enemyType]);
  const hp = Math.floor(stats.hp * scale);
  const atk = Math.floor(stats.atk * scale);
  const def = Math.floor(stats.def * scale);
  const agi = Math.floor(stats.agi * scale);

  const expReward = 20 + player.level * 3 + (config.difficulty === 'hard' ? 15 : config.difficulty === 'normal' ? 8 : 0);
  const goldReward = 5 + player.level * 2 + (config.difficulty === 'hard' ? 10 : 0);

  return {
    id: `task_enemy_${Date.now()}`,
    name,
    side: 'enemy',
    hp, maxHp: hp,
    mp: 0, maxMp: 0,
    atk, def, agi, crit: stats.crit,
    icon: config.enemyType === 'bandit' ? '🗡️' : config.enemyType === 'beast' ? '🐺' : config.enemyType === 'rival' ? '⚔️' : '👹',
    skills: [],
    isPlayer: false,
    alive: true,
    enemyId: 'rogue_thug' as any,
    tier: config.difficulty === 'hard' ? 2 : 1,
    actions,
    reward: { exp: expReward, gold: goldReward },
    loot: Math.random() < 0.3 ? [{ id: 'hp_potion' as ItemId, chance: 0.5 }] : [],
  };
}

/**
 * 启动任务战斗（1v1）。
 * 返回 Promise，战斗结束时 resolve('win' | 'lose')。
 */
export function launchTaskBattle(config: TaskBattleConfig): Promise<'win' | 'lose'> {
  return new Promise((resolve) => {
    const player = getPlayer();
    const enemy = generateTaskEnemy(config);

    const playerUnit: BattleUnit = {
      id: 'player_main',
      name: player.name,
      side: 'ally',
      hp: player.hp, maxHp: player.maxHp,
      mp: player.mp, maxMp: player.maxMp,
      atk: player.atk, def: player.def, agi: player.agi, crit: player.crit,
      charImg: player.charImg,
      skills: player.skills as SkillId[],
      isPlayer: true,
      alive: true,
    };

    const handleEnd = ({ result }: { result: string }) => {
      bus.off('battle:end', handleEnd as any);
      resolve(result === 'win' ? 'win' : 'lose');
    };

    bus.on('battle:end', handleEnd as any);

    import('./BattleEngine').then(m => {
      m.initCustomBattle([enemy], [playerUnit]);
    });
  });
}
