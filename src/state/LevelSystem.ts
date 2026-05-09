import type { PlayerState, AttrKey } from '../data/types';
import { calculateFinalStats } from '../data/realmConfig';

// 境界名称（10层制：每个大境界分为1~10小层）
// level 0=凡人, 1~10=炼气一层~十层, 11~20=筑基, 21~30=结丹, 31~40=元婴
// 41~50=化神, 51~60=渡劫, 61~70=大乘, 71~80=飞升
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

/** 大境界 ID 列表（按顺序） */
export const MAJOR_REALMS = ['lianqi', 'zhuji', 'jiedan', 'yuanying', 'huashen', 'dujie', 'dacheng', 'feisheng'] as const;
export type MajorRealmId = typeof MAJOR_REALMS[number];

/** 大境界名称 */
export const MAJOR_REALM_NAMES: Record<string, string> = {
  lianqi: '炼气', zhuji: '筑基', jiedan: '结丹',
  yuanying: '元婴', huashen: '化神', dujie: '渡劫',
  dacheng: '大乘', feisheng: '飞升',
};

/** 大境界 → 突破后起始 level */
export const REALM_START_LEVEL: Record<string, number> = {
  lianqi: 1, zhuji: 11, jiedan: 21, yuanying: 31, huashen: 41, dujie: 51,
  dacheng: 61, feisheng: 71,
};

/** 根据 level 获取大境界 ID */
export function getMajorRealmId(lv: number): string | null {
  if (lv >= 1 && lv <= 10) return 'lianqi';
  if (lv >= 11 && lv <= 20) return 'zhuji';
  if (lv >= 21 && lv <= 30) return 'jiedan';
  if (lv >= 31 && lv <= 40) return 'yuanying';
  if (lv >= 41 && lv <= 50) return 'huashen';
  if (lv >= 51 && lv <= 60) return 'dujie';
  if (lv >= 61 && lv <= 70) return 'dacheng';
  if (lv >= 71 && lv <= 80) return 'feisheng';
  return null;
}

export function getExpForLevel(lv: number): number {
  // 统一公式 42 × lv^1.1，配合提升后的日常任务奖励
  // 确保演武切磋（+55）升任意一级最多约 20 次点击
  return Math.floor(42 * Math.pow(lv, 1.1));
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

/**
 * 判断当前等级是否为大境界的第十层（满层）
 * 炼气10层=10, 筑基10层=20, 结丹10层=30, 元婴10层=40, 化神10层=50, 渡劫10层=60, 大乘10层=70, 飞升10层=80
 */
export function isRealmMaxLevel(lv: number): boolean {
  return lv > 0 && lv % 10 === 0;
}

export function checkLevelUp(player: PlayerState): LevelUpResult {
  let lv = player.level || 0;
  let exp = player.exp || 0;
  let gainedPoints = 0;
  const oldLv = lv;

  while (exp >= getExpForLevel(lv)) {
    // 大境界第十层满后，经验条不再增加，也不会晋级
    // 需要完成对应试炼/剧情才能突破大境界
    if (isRealmMaxLevel(lv)) {
      exp = getExpForLevel(lv); // 经验条卡满，不再增长
      break;
    }
    exp -= getExpForLevel(lv);
    lv++;
    gainedPoints++;
  }

  if (gainedPoints > 0) {
    // 升级后重算基础属性：该等级普通人属性 × 主角天赋（dragon_vein）
    const newStats = calculateFinalStats(lv, [player.playerTalent]);
    const updatedPlayer: PlayerState = {
      ...player,
      level: lv,
      exp,
      cultivationPoints: (player.cultivationPoints || 0) + gainedPoints,
      maxHp: newStats.hp + (player.attrBoosts?.hp || 0),
      hp: Math.min(player.hp, newStats.hp + (player.attrBoosts?.hp || 0)),
      maxMp: newStats.mp + (player.attrBoosts?.mp || 0),
      mp: Math.min(player.mp, newStats.mp + (player.attrBoosts?.mp || 0)),
      atk: newStats.atk + (player.attrBoosts?.atk || 0),
      def: newStats.def + (player.attrBoosts?.def || 0),
      agi: newStats.agi + (player.attrBoosts?.agi || 0),
      crit: newStats.crit,
    };
    return { leveled: true, oldLevel: oldLv, newLevel: lv, gainedPoints, updatedPlayer };
  }

  return { leveled: false, oldLevel: oldLv, newLevel: lv, gainedPoints: 0, updatedPlayer: player };
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

// ──── 🆕 突破大境界系统 ────

/** 突破结果 */
export interface BreakThroughResult {
  success: boolean;
  reason?: string;
  newLevel?: number;
  updatedPlayer?: PlayerState;
}

/**
 * 检查玩家是否可以突破当前大境界
 * 条件：
 * 1. 当前等级是大境界第十层（满层）
 * 2. 经验条已满
 * 3. 该大境界的突破已被剧情解锁（realmBreakUnlocked 中包含）
 */
export function canBreakThrough(player: PlayerState): BreakThroughResult {
  const lv = player.level || 0;
  
  // 必须是满层
  if (!isRealmMaxLevel(lv)) {
    return { success: false, reason: '尚未达到当前境界巅峰。' };
  }
  
  // 经验条必须满
  if ((player.exp || 0) < getExpForLevel(lv)) {
    return { success: false, reason: '修为积累不足，尚无法突破。' };
  }
  
  // 凡人→炼气：不需要解锁（入武当自动突破）
  if (lv === 0) {
    return { success: true, newLevel: 1 };
  }
  
  // 获取下一境界 ID
  const currentRealm = getMajorRealmId(lv);
  if (!currentRealm) {
    return { success: false, reason: '已达修为之巅。' };
  }
  
  const currentIdx = MAJOR_REALMS.indexOf(currentRealm as MajorRealmId);
  const nextRealm = MAJOR_REALMS[currentIdx + 1];
  if (!nextRealm) {
    return { success: false, reason: '已达修为之巅。' };
  }
  
  // 检查是否已解锁
  const unlocked = player.realmBreakUnlocked || [];
  if (!unlocked.includes(nextRealm)) {
    const realmName = MAJOR_REALM_NAMES[nextRealm] || nextRealm;
    return { success: false, reason: `突破${realmName}的契机尚未到来，需完成对应剧情。` };
  }
  
  const newLevel = REALM_START_LEVEL[nextRealm];
  if (!newLevel) {
    return { success: false, reason: '突破失败，境界数据异常。' };
  }
  
  return { success: true, newLevel };
}

/**
 * 执行突破大境界
 * 消耗满经验条，提升到下一境界第一层，重算属性
 */
export function breakThroughRealm(player: PlayerState): BreakThroughResult {
  const check = canBreakThrough(player);
  if (!check.success || !check.newLevel) return check;
  
  const newLevel = check.newLevel;
  const newStats = calculateFinalStats(newLevel, [player.playerTalent]);
  
  const updated: PlayerState = {
    ...player,
    level: newLevel,
    exp: 0,
    maxHp: newStats.hp + (player.attrBoosts?.hp || 0),
    hp: newStats.hp + (player.attrBoosts?.hp || 0),
    maxMp: newStats.mp + (player.attrBoosts?.mp || 0),
    mp: newStats.mp + (player.attrBoosts?.mp || 0),
    atk: newStats.atk + (player.attrBoosts?.atk || 0),
    def: newStats.def + (player.attrBoosts?.def || 0),
    agi: newStats.agi + (player.attrBoosts?.agi || 0),
    crit: newStats.crit,
  };
  
  return { success: true, newLevel, updatedPlayer: updated };
}