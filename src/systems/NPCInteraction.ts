/**
 * src/systems/NPCInteraction.ts — NPC 互动系统（鬼谷八荒风格）
 *
 * 六种 NPC 性格 × 势力倾向匹配 = 复合交互倍率
 * 三种互动方式：交谈 / 送礼 / 切磋
 * NPC 之间的自主互动逻辑在 NpcBehavior.ts 中
 */

import { getPlayer, setPlayer } from '../state/GameState';
import { saveGame } from '../state/SaveSystem';
import { getNpcStats } from './NpcBehavior';
import { changeNpcAffection, getNpcAffection } from '../screens/camp/RelationPanel';
import { SECTS } from '../data/sects';
import type { FactionAlignment } from '../data/sandboxTypes';
import type { NpcStats, NpcPersonality, PersonalityConfig } from '../data/npcStats';
import { PERSONALITY } from '../data/npcStats';

// ═════════════════════════════════════════════════════════
//  NPC 性格系统
// ═════════════════════════════════════════════════════════

// NpcPersonality, PersonalityConfig, PERSONALITY 从 npcStats.ts 导入

// ═════════════════════════════════════════════════════════
//  势力倾向匹配倍率
// ═════════════════════════════════════════════════════════

/**
 * 玩家势力倾向 vs NPC 势力倾向的交互倍率
 * - 同道（same）：×1.2
 * - 相近（正+中 / 邪+中）：×0.9
 * - 相异（正+邪 / 正+混乱）：×0.5
 * - 中立+任意：×1.0
 */
const ALIGNMENT_CHART: Record<FactionAlignment, Record<FactionAlignment, number>> = {
  righteous:  { righteous: 1.2, neutral: 0.9, unorthodox: 0.5, chaotic: 0.5 },
  neutral:    { righteous: 1.0, neutral: 1.0, unorthodox: 1.0, chaotic: 1.0 },
  unorthodox: { righteous: 0.5, neutral: 0.9, unorthodox: 1.2, chaotic: 0.9 },
  chaotic:    { righteous: 0.5, neutral: 1.0, unorthodox: 0.9, chaotic: 1.2 },
};

// ═════════════════════════════════════════════════════════
//  交互系数计算
// ═════════════════════════════════════════════════════════

export interface InteractionInfo {
  /** NPC 性格 */
  personality: NpcPersonality;
  /** 势力倾向匹配倍率 */
  alignmentMult: number;
  /** 交谈总倍率 */
  talkTotalMult: number;
  /** 送礼总倍率 */
  giftTotalMult: number;
  /** 已拥有好感度 */
  affection: number;
}

/** 获取与指定 NPC 的交互信息 */
export function getInteractionInfo(npcId: string): InteractionInfo | null {
  const npc = getNpcStats(npcId);
  if (!npc) return null;

  const p = getPlayer();
  const personality = npc.personality as NpcPersonality | undefined ?? 'gentle';
  const persConfig = PERSONALITY[personality];

  // 计算势力倾向匹配
  const playerAlign = (SECTS[p.sect]?.alignment ?? 'neutral') as FactionAlignment;
  const npcAlign = (SECTS[npc.sect]?.alignment ?? 'neutral') as FactionAlignment;
  const alignmentMult = ALIGNMENT_CHART[playerAlign]?.[npcAlign] ?? 1.0;

  const affection = getNpcAffection(npcId);

  return {
    personality,
    alignmentMult,
    talkTotalMult: persConfig.talkMult * alignmentMult,
    giftTotalMult: persConfig.giftMult * alignmentMult,
    affection,
  };
}

// ═════════════════════════════════════════════════════════
//  交谈（+2 基础好感 × 性格 × 势力匹配）
// ═════════════════════════════════════════════════════════

export interface TalkResult {
  success: boolean;
  message: string;
  /** 真实获得的好感度 */
  gainedAffection: number;
}

/**
 * 与 NPC 交谈
 * - 基础 +2 好感度
 * - 不能连续交谈同一 NPC（需经过一次行动后刷新）
 * @param npcId NPC 的数据库 ID
 */
export function talkWithNpc(npcId: string): TalkResult {
  const info = getInteractionInfo(npcId);
  if (!info) return { success: false, message: '角色数据不存在。', gainedAffection: 0 };

  if (info.affection >= 100) {
    return { success: false, message: '好感度已达上限，无需再交谈。', gainedAffection: 0 };
  }

  const base = 2;
  const gained = Math.max(1, Math.round(base * info.talkTotalMult));

  changeNpcAffection(npcId, gained);

  const persCfg = PERSONALITY[info.personality];
  const alignStatus = info.alignmentMult >= 1.2 ? '同道相惜' : info.alignmentMult <= 0.5 ? '道不同不相为谋' : '';
  const msgParts = [
    `与${persCfg.icon}${persCfg.name}的 NPC 交谈`,
    `好感${alignStatus ? ' · ' + alignStatus : ''}`,
  ];

  return {
    success: true,
    message: `${msgParts.join('')}\n好感 +${gained}`,
    gainedAffection: gained,
  };
}

// ═════════════════════════════════════════════════════════
//  送礼
// ═════════════════════════════════════════════════════════

export interface GiftResult {
  success: boolean;
  message: string;
  gainedAffection: number;
  goldSpent: number;
  newGold: number;
}

/** 礼物档次 */
export const GIFT_TIERS = [
  { label: '薄礼', cost: 20, baseAffection: 3 },
  { label: '厚礼', cost: 50, baseAffection: 7 },
  { label: '重礼', cost: 120, baseAffection: 15 },
  { label: '稀世珍宝', cost: 300, baseAffection: 30 },
];

/**
 * 送礼
 * @param npcId NPC 数据库 ID
 * @param tierIndex 礼物档次索引 (0=薄礼, 1=厚礼, 2=重礼, 3=稀世珍宝)
 */
export function giveGiftToNpc(npcId: string, tierIndex: number): GiftResult {
  const info = getInteractionInfo(npcId);
  if (!info) return { success: false, message: '角色数据不存在。', gainedAffection: 0, goldSpent: 0, newGold: 0 };

  if (info.affection >= 100) {
    return { success: false, message: '好感度已达上限。', gainedAffection: 0, goldSpent: 0, newGold: 0 };
  }

  const tier = GIFT_TIERS[tierIndex];
  if (!tier) return { success: false, message: '礼物档次无效。', gainedAffection: 0, goldSpent: 0, newGold: 0 };

  const p = getPlayer();
  if (p.gold < tier.cost) {
    return {
      success: false,
      message: `铜钱不足！需要 ${tier.cost} 两，当前只有 ${p.gold} 两。`,
      gainedAffection: 0, goldSpent: 0, newGold: p.gold,
    };
  }

  // 扣钱 + 加好感
  const gained = Math.max(1, Math.round(tier.baseAffection * info.giftTotalMult));
  const newGold = p.gold - tier.cost;

  const updated = { ...p, gold: newGold };
  setPlayer(updated);
  saveGame(updated);

  changeNpcAffection(npcId, gained);

  const persCfg = PERSONALITY[info.personality];
  const react = persCfg.giftMult >= 1.2 ? '欣然收下' : persCfg.giftMult <= 0.5 ? '冷冷瞥了一眼' : '点头收下';

  return {
    success: true,
    message: `送出【${tier.label}】（-${tier.cost} 两）\n${persCfg.icon} ${react}… 好感 +${gained}`,
    gainedAffection: gained,
    goldSpent: tier.cost,
    newGold,
  };
}

// ═════════════════════════════════════════════════════════
//  切磋（模拟比试）
// ═════════════════════════════════════════════════════════

export interface SparResult {
  success: boolean;
  message: string;
  playerWon: boolean;
  affectionDelta: number;
  expGained: number;
}

/**
 * 与 NPC 切磋
 * 基于等级差计算胜率，胜败产生不同好感变化
 * @param npcId NPC 数据库 ID
 */
export function sparWithNpc(npcId: string): SparResult {
  const info = getInteractionInfo(npcId);
  if (!info) return { success: false, message: '角色数据不存在。', playerWon: false, affectionDelta: 0, expGained: 0 };

  const npc = getNpcStats(npcId);
  if (!npc) return { success: false, message: 'NPC 数据异常。', playerWon: false, affectionDelta: 0, expGained: 0 };

  const p = getPlayer();
  const persCfg = PERSONALITY[info.personality];
  const levelDiff = p.level - npc.level;

  // 胜率 = 50% + 等级差×2%（上限90%，下限10%）
  const winRate = Math.max(0.1, Math.min(0.9, 0.5 + levelDiff * 0.02));
  const playerWon = Math.random() < winRate;

  const affectionDelta = playerWon
    ? persCfg.sparWinAffection
    : persCfg.sparLoseAffection;

  const expGained = Math.floor((5 + Math.random() * 10) * (playerWon ? 1.2 : 0.6));

  // 更新玩家经验
  const updatedP = { ...p, exp: p.exp + expGained };
  setPlayer(updatedP);
  saveGame(updatedP);

  // 更新好感度
  changeNpcAffection(npcId, affectionDelta);

  const resultText = playerWon ? '胜' : '惜败';
  const reactText = playerWon
    ? (affectionDelta > 2 ? '拱手道"好功夫"' : '微微颔首')
    : (affectionDelta > 1 ? '伸手扶起你，眼中闪过一丝赞许' : '淡淡扫了你一眼');

  return {
    success: true,
    playerWon,
    affectionDelta,
    expGained,
    message: `与${persCfg.icon}${persCfg.name}的 NPC 切磋… ${resultText}！\n${reactText}\n好感 ${affectionDelta >= 0 ? '+' : ''}${affectionDelta} · 经验 +${expGained}`,
  };
}

// ═════════════════════════════════════════════════════════
//  注意：NPC 之间的自主互动逻辑已移至 NpcBehavior.ts
//  以解决循环依赖问题
// ═════════════════════════════════════════════════════════
