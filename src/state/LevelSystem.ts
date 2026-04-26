import type { PlayerState, AttrKey } from '../data/types';

// 境界名称：第0层=凡人，第1层=炼气，……
export const REALM_NAMES: readonly string[] = [
  '凡人', '炼气', '筑基', '结丹', '元婴',
  '化神', '渡劫', '大乘', '飞升', '天人', '不灭',
];

export function getExpForLevel(lv: number): number {
  return Math.floor(50 * Math.pow(lv, 1.5));
}

export function getRealmName(lv: number): string {
  return REALM_NAMES[lv] ?? `第${lv}层`;
}

export interface LevelUpResult {
  leveled: boolean;
  oldLevel: number;
  newLevel: number;
  gainedPoints: number;
  updatedPlayer: PlayerState;
}

// 检查并处理升级（纯函数，返回更新后的 player，不 mutate 入参）
export function checkLevelUp(player: PlayerState): LevelUpResult {
  let lv = player.level || 1;
  let exp = player.exp || 0;
  let gainedPoints = 0;
  const oldLv = lv;

  while (exp >= getExpForLevel(lv)) {
    exp -= getExpForLevel(lv);
    lv++;
    gainedPoints++;
  }

  const updatedPlayer: PlayerState = gainedPoints > 0
    ? {
        ...player,
        level: lv,
        exp,
        cultivationPoints: (player.cultivationPoints || 0) + gainedPoints,
      }
    : player;

  return { leveled: gainedPoints > 0, oldLevel: oldLv, newLevel: lv, gainedPoints, updatedPlayer };
}

// 修为点加成的增量定义
export const ATTR_BOOST_DEFS: Record<AttrKey, { amount: number; label: string; field: keyof PlayerState }> = {
  hp:  { amount: 30, label: '气血上限', field: 'maxHp' },
  atk: { amount: 5,  label: '攻击力',   field: 'atk' },
  def: { amount: 4,  label: '防御力',   field: 'def' },
  agi: { amount: 3,  label: '速度',     field: 'agi' },
  mp:  { amount: 20, label: '内力上限', field: 'maxMp' },
};

// 花费一点修为点提升属性（纯函数，返回新 player）
export function spendCultivationPoint(player: PlayerState, attr: AttrKey): PlayerState | null {
  if ((player.cultivationPoints || 0) <= 0) return null;

  const def = ATTR_BOOST_DEFS[attr];
  const boosts = player.attrBoosts ?? { hp: 0, atk: 0, def: 0, agi: 0, mp: 0 };

  const updated: PlayerState = {
    ...player,
    cultivationPoints: player.cultivationPoints - 1,
    attrBoosts: { ...boosts, [attr]: (boosts[attr] || 0) + def.amount },
    [def.field]: (player[def.field] as number) + def.amount,
  };

  // 如果增加的是上限，同步 current 不超 max
  if (attr === 'hp') updated.hp = Math.min(updated.hp, updated.maxHp);
  if (attr === 'mp') updated.mp = Math.min(updated.mp, updated.maxMp);

  return updated;
}
