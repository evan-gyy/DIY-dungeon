// ============================================================
//  src/systems/NPCManager.ts — NPC 招募与收纳管理引擎
// ============================================================
//  实现沙盒模式中 NPC 的推荐入宗、招募为随从、解除、指派
//  等核心操作。与升阶系统联动 —— 职级越高可招募越多/越高
//  等级的 NPC 随从。
//
//  核心规则：
//  - 推荐入宗：任何人（含外门）都可以推荐 NPC 加入宗门
//  - 招募为随从：只可招募比自己职级低的 NPC
//  - 职级越高 → 槽位越多 → 可指派任务越多
// ============================================================

import type { PlayerState } from '../data/types';
import type { NpcStats } from '../data/npcStats';
import type {
  DiscipleRank,
  NpcAssignment,
  RecruitResult,
} from '../data/sandboxTypes';

import {
  DISCIPLE_RANK_ORDER,
  RANK_RECRUIT_SLOTS,
  RECRUIT_RANK_CAP,
  RECOMMEND_MIN_AFFECTION,
  RECRUIT_MIN_AFFECTION,
  FACTION_DEFS,
} from '../data/sandboxTypes';

// ──── 辅助函数 ────

/** 获取职级在排序中的索引（用于比较高低） */
export function getDiscipleRankIndex(rank: DiscipleRank): number {
  return DISCIPLE_RANK_ORDER.indexOf(rank);
}

/**
 * 判断 rankA 是否严格低于 rankB。
 * 例：outer < inner → true，inner < inner → false
 */
export function isRankLowerThan(a: DiscipleRank, b: DiscipleRank): boolean {
  return getDiscipleRankIndex(a) < getDiscipleRankIndex(b);
}

/**
 * 获取玩家当前可招募的 NPC 最高职级。
 * 规则：只能招募严格低于自己的 NPC。
 */
export function getRecruitRankCap(
  playerRank: DiscipleRank,
): DiscipleRank | null {
  return RECRUIT_RANK_CAP[playerRank] ?? null;
}

/** 获取玩家当前职级对应的招募槽位上限 */
export function getMaxRecruitSlots(playerRank: DiscipleRank): number {
  return RANK_RECRUIT_SLOTS[playerRank] ?? 0;
}

// ──── 推荐入宗 ────

/**
 * 检查是否可以推荐 NPC 加入自己的宗门。
 * 任何人都可以做（包括外门弟子），只要 NPC 还不在你的宗门。
 */
export function canRecommend(
  player: PlayerState,
  npc: NpcStats,
  affection: number,
): RecruitResult {
  // 已经在同宗门
  if (npc.sect === player.sect) {
    return {
      success: false,
      type: 'recommend',
      message: `${npc.name}已经在${getSectName(player.sect)}了。`,
    };
  }

  // 好感度不足
  if (affection < RECOMMEND_MIN_AFFECTION) {
    return {
      success: false,
      type: 'recommend',
      message: `${npc.name}对你的信任还不够。（需要好感度 ≥ ${RECOMMEND_MIN_AFFECTION}）`,
    };
  }

  return {
    success: true,
    type: 'recommend',
    message: `可以向${npc.name}推荐加入${getSectName(player.sect)}。`,
  };
}

/**
 * 执行推荐入宗：将 NPC 的宗门改为玩家宗门，设为外门弟子。
 * 返回操作后的 NPC 数据副本（不修改原对象）。
 */
export function executeRecommend(
  player: PlayerState,
  npc: NpcStats,
): { npc: NpcStats; contributionGain: number } {
  const updatedNpc: NpcStats = {
    ...npc,
    sect: player.sect,
    discipleRank: 'outer',
    currentLocationId: player.currentLocationId,
  };

  // 推荐入宗奖励贡献值
  const contributionGain = 30;

  return { npc: updatedNpc, contributionGain };
}

// ──── 招募为随从 ────

/**
 * 检查是否可以招募 NPC 为随从。
 * 规则：
 * 1. 玩家职级必须 ≥ inner（外门弟子无权招募）
 * 2. NPC 职级必须严格低于玩家
 * 3. 有可用槽位
 * 4. NPC 未被招募
 * 5. 好感度足够
 * 6. NPC 与玩家同宗门
 */
export function canRecruit(
  player: PlayerState,
  npc: NpcStats,
  affection: number,
): RecruitResult {
  const playerRank = player.discipleRank as DiscipleRank;

  // 外门弟子无法招募
  if (playerRank === 'outer') {
    return {
      success: false,
      type: 'recruit',
      message: '外门弟子无权招募随从。请先晋升到内门。',
    };
  }

  // NPC 不在同宗门
  if (npc.sect !== player.sect) {
    return {
      success: false,
      type: 'recruit',
      message: `${npc.name}不是${getSectName(player.sect)}的弟子。请先推荐入宗。`,
    };
  }

  // 职级不够高
  const npcRank = npc.discipleRank;
  if (!isRankLowerThan(npcRank, playerRank)) {
    return {
      success: false,
      type: 'recruit',
      message: `你的职级（${getRankLabel(playerRank)}）不足以招募${getRankLabel(npcRank)}。只能招募比自己职级低的同门。`,
    };
  }

  // 槽位已满
  const currentSlots = player.npcCollection.recruited.length;
  const maxSlots = getMaxRecruitSlots(playerRank);
  if (currentSlots >= maxSlots) {
    return {
      success: false,
      type: 'recruit',
      message: `随从已满（${currentSlots}/${maxSlots}）。请提升职级或解除现有随从。`,
    };
  }

  // 已经招募过了
  if (player.npcCollection.recruited.includes(npc.id)) {
    return {
      success: false,
      type: 'recruit',
      message: `${npc.name}已经是你的随从了。`,
    };
  }

  // 好感度不足
  if (affection < RECRUIT_MIN_AFFECTION) {
    return {
      success: false,
      type: 'recruit',
      message: `${npc.name}对你的信任还不够。（需要好感度 ≥ ${RECRUIT_MIN_AFFECTION}）`,
    };
  }

  return {
    success: true,
    type: 'recruit',
    message: `可以招募${npc.name}为随从。`,
  };
}

/**
 * 执行招募：将 NPC 加入玩家的随从列表。
 * 返回更新后的 npcCollection（不修改原对象）。
 */
export function executeRecruit(
  player: PlayerState,
  npcId: string,
): {
  recruited: string[];
  maxSlots: number;
  assignments: Record<string, string>;
  assignmentTargets: Record<string, string>;
} {
  const recruited = [...player.npcCollection.recruited, npcId];
  const maxSlots = getMaxRecruitSlots(player.discipleRank as DiscipleRank);
  const assignments = { ...player.npcCollection.assignments, [npcId]: 'idle' };
  const assignmentTargets = { ...player.npcCollection.assignmentTargets };

  return { recruited, maxSlots, assignments, assignmentTargets };
}

// ──── 解除随从 ────

export function canDismiss(
  player: PlayerState,
  npcId: string,
): { success: boolean; message: string } {
  if (!player.npcCollection.recruited.includes(npcId)) {
    return { success: false, message: '该 NPC 不是你的随从。' };
  }
  return { success: true, message: '' };
}

export function executeDismiss(
  player: PlayerState,
  npcId: string,
): {
  recruited: string[];
  maxSlots: number;
  assignments: Record<string, string>;
  assignmentTargets: Record<string, string>;
} {
  const recruited = player.npcCollection.recruited.filter(id => id !== npcId);
  const assignments = { ...player.npcCollection.assignments };
  delete assignments[npcId];
  const assignmentTargets = { ...player.npcCollection.assignmentTargets };
  delete assignmentTargets[npcId];

  return {
    recruited,
    maxSlots: getMaxRecruitSlots(player.discipleRank as DiscipleRank),
    assignments,
    assignmentTargets,
  };
}

// ──── 指派 NPC ────

/** 每种指派任务的最低职级要求 */
const ASSIGNMENT_RANK_REQUIREMENT: Partial<Record<NpcAssignment, DiscipleRank>> = {
  idle:      'outer',
  training:  'outer',
  gathering: 'inner',
  exploring: 'inner',
  guarding:  'true',
  teaching:  'elder',
  diplomacy: 'elder',
};

export function canAssign(
  player: PlayerState,
  npcId: string,
  assignment: NpcAssignment,
): { success: boolean; message: string } {
  const playerRank = player.discipleRank as DiscipleRank;

  if (!player.npcCollection.recruited.includes(npcId)) {
    return { success: false, message: '该 NPC 不是你的随从。' };
  }

  const requiredRank = ASSIGNMENT_RANK_REQUIREMENT[assignment];
  if (requiredRank && isRankLowerThan(playerRank, requiredRank)) {
    return {
      success: false,
      message: `你的职级（${getRankLabel(playerRank)}）不足以指派「${getAssignmentLabel(assignment)}」任务。（需要 ≥ ${getRankLabel(requiredRank)}）`,
    };
  }

  return { success: true, message: '' };
}

export function executeAssign(
  player: PlayerState,
  npcId: string,
  assignment: NpcAssignment,
  target?: string,
): {
  assignments: Record<string, string>;
  assignmentTargets: Record<string, string>;
} {
  const assignments = { ...player.npcCollection.assignments, [npcId]: assignment };
  const assignmentTargets = { ...player.npcCollection.assignmentTargets };
  if (target) {
    assignmentTargets[npcId] = target;
  } else {
    delete assignmentTargets[npcId];
  }
  return { assignments, assignmentTargets };
}

// ──── 升阶时更新槽位 ────

/**
 * 升阶后调用，同步更新 NPC 收纳的最大槽位。
 * 如果现有随从数超过新职级的槽位上限，不会自动移除随从，
 * 但会禁止继续招募直到解除多余的随从。
 */
export function syncSlotsOnPromotion(
  player: PlayerState,
  newRank: DiscipleRank,
): number {
  return getMaxRecruitSlots(newRank);
}

// ──── 登用无隶属NPC ────

/**
 * 检查是否可以登用无宗门隶属的 NPC 为随从。
 * 用于城市中的散修 NPC（sect='none'）。
 * 登用条件：魅力 + 声望 + 影响力 ≥ NPC 等级×3
 */
export function canRecruitUnaffiliated(
  player: PlayerState,
  npc: NpcStats,
  affection: number,
): RecruitResult {
  if (npc.sect !== 'none') {
    return { success: false, type: 'recruit', message: `${npc.name}已有宗门归属。` };
  }

  if (!player.sect || player.sect === 'none') {
    return { success: false, type: 'recruit', message: '散修无法登用他人。' };
  }

  if (affection < 30) {
    return { success: false, type: 'recruit', message: `好感度不足（需要 ≥ 30，当前 ${affection}）。` };
  }

  if (player.npcCollection.recruited.includes(npc.id)) {
    return { success: false, type: 'recruit', message: `${npc.name}已经是你的随从了。` };
  }

  const playerRank = player.discipleRank as DiscipleRank;
  const currentSlots = player.npcCollection.recruited.length;
  const maxSlots = getMaxRecruitSlots(playerRank);
  if (currentSlots >= maxSlots) {
    return { success: false, type: 'recruit', message: `随从已满（${currentSlots}/${maxSlots}）。请提升职级或解除现有随从。` };
  }

  const charisma = player.courtStats?.charisma ?? 10;
  const reputation = player.reputation ?? 0;
  const influence = player.influence ?? 0;
  const recruitmentPower = charisma + reputation / 10 + influence / 5;
  const npcResistance = npc.level * 3;

  if (recruitmentPower < npcResistance) {
    return {
      success: false,
      type: 'recruit',
      message: `登用能力不足（魅力${charisma}+声望${reputation}/10+影响力${influence}/5=${Math.floor(recruitmentPower)}，需≥${npcResistance}）。`,
    };
  }

  return { success: true, type: 'recruit', message: `可以登用${npc.name}为随从，并将其引入${getSectName(player.sect)}。` };
}

/**
 * 执行登用：无隶属 NPC 加入玩家宗门，并成为随从。
 */
export function executeRecruitUnaffiliated(
  player: PlayerState,
  npc: NpcStats,
): { npc: NpcStats; recruited: string[]; maxSlots: number; assignments: Record<string, string>; assignmentTargets: Record<string, string> } {
  const updatedNpc: NpcStats = {
    ...npc,
    sect: player.sect,
    discipleRank: 'outer',
    currentLocationId: player.currentLocationId,
  };

  const recruited = [...player.npcCollection.recruited, npc.id];
  const maxSlots = getMaxRecruitSlots(player.discipleRank as DiscipleRank);
  const assignments = { ...player.npcCollection.assignments, [npc.id]: 'idle' };
  const assignmentTargets = { ...player.npcCollection.assignmentTargets };

  return { npc: updatedNpc, recruited, maxSlots, assignments, assignmentTargets };
}

// ──── 游说登庸（增强版 NPC 招募） ────

/**
 * 游说登庸——从其他势力挖角 NPC。
 * 多因素说服系统：势力实力差异 + 志向契合 + 性格相性 + 好感度。
 */
export interface PersuasionResult {
  success: boolean;
  factors: PersuasionFactors;
  message: string;
}

export interface PersuasionFactors {
  factionPowerBonus: number;
  ambitionAlignment: number;
  personalityCompat: number;
  affectionBonus: number;
  totalScore: number;
  threshold: number;
  detail: string;
}

/** 志向对势力文化的偏好映射 */
const AMBITION_CULTURE_PREF: Record<string, string[]> = {
  content:  ['taoist', 'buddhist', 'inner-peace', 'peaceful', 'carefree', 'ascetic'],
  master:   ['sword', 'fist', 'blade', 'palm', 'inner-alchemy', 'talisman'],
  power:    ['power', 'elite', 'imperial', 'forbidden', 'clan', 'moon', 'shadow'],
  rebel:    ['rebel', 'restoration', 'loyalty', 'frontier'],
  avenger:  ['shadow', 'forbidden', 'blood', 'poison', 'chaos', 'slaughter', 'gu-magic'],
};

/** 性格对游说诉求的偏好 */
const PERSONALITY_PERSUASION_WEIGHT: Record<string, { powerWeight: number; affinityWeight: number; alignmentWeight: number }> = {
  upright:  { powerWeight: 0.2, affinityWeight: 0.3, alignmentWeight: 0.5 },
  cunning:  { powerWeight: 0.5, affinityWeight: 0.1, alignmentWeight: 0.4 },
  bold:     { powerWeight: 0.4, affinityWeight: 0.2, alignmentWeight: 0.4 },
  kind:     { powerWeight: 0.1, affinityWeight: 0.6, alignmentWeight: 0.3 },
  gentle:   { powerWeight: 0.15, affinityWeight: 0.5, alignmentWeight: 0.35 },
  aloof:    { powerWeight: 0.3, affinityWeight: 0.0, alignmentWeight: 0.7 },
};

/**
 * 计算游说登庸的成功概率。
 * 考虑四个维度：势力实力、志向契合、性格相性、好感度。
 */
export function canPersuadeNpc(
  player: PlayerState,
  npc: NpcStats,
  affection: number,
): PersuasionResult {
  // ── 1. 势力实力差异 ──
  const playerSectPower = player.sectPower?.[player.sect] ?? 50;
  const npcSectPower = player.sectPower?.[npc.sect] ?? 50;
  const powerRatio = npcSectPower > 0 ? playerSectPower / npcSectPower : 2.0;
  const factionPowerBonus = Math.min(30, Math.max(-20, Math.floor((powerRatio - 1.0) * 25)));

  // ── 2. 志向-势力文化契合 ──
  const ambition = npc.ambition ?? 'content';
  const preferredCultures = AMBITION_CULTURE_PREF[ambition] ?? [];
  const playerSectCultures = FACTION_DEFS[player.sect]?.culture ?? [];
  const npcSectCultures = FACTION_DEFS[npc.sect]?.culture ?? [];
  // 玩家势力与 NPC 志向的契合度
  const playerCultureMatch = preferredCultures.filter(c => playerSectCultures.includes(c)).length;
  const npcCultureMatch = preferredCultures.filter(c => npcSectCultures.includes(c)).length;
  const ambitionAlignment = Math.min(25, Math.max(-25, (playerCultureMatch - npcCultureMatch) * 8));

  // ── 3. 性格相性 ──
  const personality = npc.personality ?? 'gentle';
  const _pw = PERSONALITY_PERSUASION_WEIGHT;
  const weights = _pw[personality] ?? { powerWeight: 0.15, affinityWeight: 0.5, alignmentWeight: 0.35 };
  const playerAlignment = FACTION_DEFS[player.sect]?.alignment ?? 'neutral';
  const npcAlignment = FACTION_DEFS[npc.sect]?.alignment ?? 'neutral';
  // 正邪匹配：upright 性格重视 alignment
  let alignmentMatch = 0;
  if (playerAlignment === npcAlignment) alignmentMatch = 0;
  else if (playerAlignment === 'righteous' && npcAlignment === 'chaotic') alignmentMatch = -15;
  else if (playerAlignment === 'chaotic' && npcAlignment === 'righteous') alignmentMatch = -15;
  else alignmentMatch = 0; // neutral with anything is neutral
  const alignmentScore = alignmentMatch * weights.alignmentWeight;
  const powerScore = factionPowerBonus * weights.powerWeight;
  const affinityScore = Math.floor(affection / 100 * 25) * weights.affinityWeight;
  const personalityCompat = Math.floor(powerScore + alignmentScore + affinityScore);

  // ── 4. 好感度加成 ──
  const affectionBonus = Math.floor(Math.min(20, (affection - 30) / 3.5));

  // ── 5. 综合判定 ──
  const totalScore = factionPowerBonus + ambitionAlignment + personalityCompat + affectionBonus;
  const threshold = 10; // 基础阈值

  const success = totalScore >= threshold;

  const detailParts: string[] = [];
  if (factionPowerBonus > 0) detailParts.push(`我方势力更强 (+${factionPowerBonus})`);
  else if (factionPowerBonus < 0) detailParts.push(`对方势力更强 (${factionPowerBonus})`);
  if (ambitionAlignment > 0) detailParts.push(`志向契合 (+${ambitionAlignment})`);
  else if (ambitionAlignment < 0) detailParts.push(`志向不合 (${ambitionAlignment})`);
  if (personalityCompat > 0) detailParts.push(`性格相投 (+${personalityCompat})`);
  else if (personalityCompat < 0) detailParts.push(`性格不合 (${personalityCompat})`);
  if (affectionBonus > 0) detailParts.push(`好感加成 (+${affectionBonus})`);

  let message: string;
  if (success) {
    message = `游说成功！${npc.name}同意加入${getSectName(player.sect)}。`;
  } else {
    message = `游说失败。${npc.name}婉拒了你的邀请。（总分 ${totalScore}，需 ≥ ${threshold}）`;
  }

  return {
    success,
    message,
    factors: {
      factionPowerBonus,
      ambitionAlignment,
      personalityCompat,
      affectionBonus,
      totalScore,
      threshold,
      detail: detailParts.join(' | ') || '势均力敌，无明显优劣',
    },
  };
}

/**
 * 执行游说登庸：NPC 加入玩家宗门，可选是否成为随从。
 */
export function executePersuadeNpc(
  player: PlayerState,
  npc: NpcStats,
  asFollower: boolean,
): { npc: NpcStats; recruited: string[]; maxSlots: number; assignments: Record<string, string>; assignmentTargets: Record<string, string> } {
  const updatedNpc: NpcStats = {
    ...npc,
    sect: player.sect,
    discipleRank: 'outer',
    currentLocationId: player.currentLocationId,
  };

  const newAff = Math.min(100, Math.max(-100, npc.sect !== player.sect ? -10 : 0));
  // Note: affection adjustment handled by caller via changeNpcAffection

  let recruited: string[];
  let maxSlots: number;
  let assignments: Record<string, string>;
  let assignmentTargets: Record<string, string>;

  if (asFollower) {
    recruited = [...player.npcCollection.recruited, npc.id];
    maxSlots = getMaxRecruitSlots(player.discipleRank as DiscipleRank);
    assignments = { ...player.npcCollection.assignments, [npc.id]: 'idle' };
    assignmentTargets = { ...player.npcCollection.assignmentTargets };
  } else {
    recruited = player.npcCollection.recruited;
    maxSlots = getMaxRecruitSlots(player.discipleRank as DiscipleRank);
    assignments = { ...player.npcCollection.assignments };
    assignmentTargets = { ...player.npcCollection.assignmentTargets };
  }

  return { npc: updatedNpc, recruited, maxSlots, assignments, assignmentTargets };
}

// ──── 标签辅助 ────

function getSectName(sect: string): string {
  const names: Record<string, string> = {
    wudang: '武当派', emei: '峨眉派', shaolin: '少林寺',
    beggar: '丐帮', huashan: '华山派', demon: '魔教',
  };
  return names[sect] ?? sect;
}

export function getRankLabel(rank: DiscipleRank): string {
  const labels: Record<DiscipleRank, string> = {
    outer: '外门弟子', inner: '内门弟子', true: '真传弟子',
    elder: '长老', vice_leader: '副掌门', leader: '掌门',
  };
  return labels[rank] ?? rank;
}

export function getAssignmentLabel(assignment: NpcAssignment): string {
  const labels: Record<NpcAssignment, string> = {
    idle: '闲置', training: '修炼', gathering: '采集',
    exploring: '探索', guarding: '守备', teaching: '传功',
    diplomacy: '外交',
  };
  return labels[assignment] ?? assignment;
}
