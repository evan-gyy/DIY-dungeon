import type { PlayerState, AttrKey } from '../data/types';

// 境界名称（10层制：每个大境界分为1~10小层）
// level 0=凡人, 1~10=炼气一层~十层, 11~20=筑基一层~十层, ...
export const REALM_NAMES: readonly string[] = [
  '凡人',
  '炼气一层','炼气二层','炼气三层','炼气四层','炼气五层',
  '炼气六层','炼气七层','炼气八层','炼气九层','炼气十层',
  '筑基一层','筑基二层','筑基三层','筑基四层','筑基五层',
  '筑基六层','筑基七层','筑基八层','筑基九层','筑基十层',
  '结丹一层','结丹二层','结丹三层','结丹四层','结丹五层',
  '结丹六层','结丹七层','结丹八层','结丹九层','结丹十层',
  '元婴一层','元婴二层','元婴三层','元婴四层','元婴五层',
  '元婴六层','元婴七层','元婴八层','元婴九层','元婴十层',
  '化神一层','化神二层','化神三层','化神四层','化神五层',
  '化神六层','化神七层','化神八层','化神九层','化神十层',
  '渡劫一层','渡劫二层','渡劫三层','渡劫四层','渡劫五层',
  '渡劫六层','渡劫七层','渡劫八层','渡劫九层','渡劫十层',
  '大乘一层','大乘二层','大乘三层','大乘四层','大乘五层',
  '大乘六层','大乘七层','大乘八层','大乘九层','大乘十层',
  '飞升一层','飞升二层','飞升三层','飞升四层','飞升五层',
  '飞升六层','飞升七层','飞升八层','飞升九层','飞升十层',
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

export function checkLevelUp(player: PlayerState): LevelUpResult {
  let lv = player.level || 0;
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

export const ATTR_BOOST_DEFS: Record<AttrKey, { amount: number; label: string; field: keyof PlayerState }> = {
  hp:  { amount: 30, label: '气血上限', field: 'maxHp' },
  atk: { amount: 5,  label: '攻击力',   field: 'atk' },
  def: { amount: 4,  label: '防御力',   field: 'def' },
  agi: { amount: 3,  label: '速度',     field: 'agi' },
  mp:  { amount: 20, label: '内力上限', field: 'maxMp' },
};

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

  if (attr === 'hp') updated.hp = Math.min(updated.hp, updated.maxHp);
  if (attr === 'mp') updated.mp = Math.min(updated.mp, updated.maxMp);

  return updated;
}