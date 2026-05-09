// ============================================================
//  src/systems/CourtSystem.ts — 朝廷系统引擎
// ============================================================
//  庙堂线核心逻辑：
//    1. 文武分途 — 玩家选择文官/武官路线
//    2. 影响力 — 朝廷的"修为"，驱动晋升
//    3. 分心惩罚 — 同时涉足武林+朝堂导致收益 -30%
//    4. 晋升判断 — 影响力达标即可晋升
// ============================================================

import type { PlayerState } from '../data/types';
import type { CourtRank, CourtStats, CourtPath, LastActionType } from '../data/sandboxTypes';
import {
  COURT_RANK_ORDER,
  COURT_RANK_LABEL,
  COURT_RANK_LABEL_WU,
  COURT_PROMOTION_REQUIREMENTS,
  SPLIT_FOCUS_PENALTY,
} from '../data/sandboxTypes';

// ──── 官职名称 ────

/** 获取朝廷品阶中文名称（根据文武路径） */
export function getCourtRankLabel(rank: CourtRank, path: CourtPath | null): string {
  if (path === 'wu') return COURT_RANK_LABEL_WU[rank];
  return COURT_RANK_LABEL[rank];
}

// ──── 晋升查询 ────

export interface CourtPromotionCheck {
  canPromote: boolean;
  reason?: string;
  currentRank: CourtRank;
  nextRank: CourtRank | null;
  minInfluence: number;
  currentInfluence: number;
  /** 晋升进度 0-1 */
  progress: number;
}

/**
 * 检查玩家是否可以晋升朝廷品阶。
 * 晋升条件：影响力达标。
 */
export function canPromoteCourt(player: PlayerState): CourtPromotionCheck {
  const currentRank = (player.courtRank ?? 'commoner') as CourtRank;
  const influence = player.influence ?? 0;
  const currentIdx = COURT_RANK_ORDER.indexOf(currentRank);

  if (currentIdx < 0) {
    return {
      canPromote: false,
      reason: '身份异常。',
      currentRank,
      nextRank: null,
      minInfluence: 0,
      currentInfluence: influence,
      progress: 0,
    };
  }

  // 已是最高
  if (currentIdx >= COURT_RANK_ORDER.length - 1) {
    return {
      canPromote: false,
      reason: '已是庙堂之巅。',
      currentRank,
      nextRank: null,
      minInfluence: 0,
      currentInfluence: influence,
      progress: 1,
    };
  }

  const nextRank = COURT_RANK_ORDER[currentIdx + 1];
  const requirement = COURT_PROMOTION_REQUIREMENTS[nextRank];

  // 没有晋升条件定义 = 不可晋升（最高）
  if (!requirement) {
    return {
      canPromote: false,
      reason: '已达品阶巅峰。',
      currentRank,
      nextRank: null,
      minInfluence: 0,
      currentInfluence: influence,
      progress: 1,
    };
  }

  const minInf = requirement.minInfluence;
  const progress = Math.min(1, influence / minInf);
  const canPromote = influence >= minInf;

  return {
    canPromote,
    reason: canPromote ? undefined : `影响力不足（${influence}/${minInf}）`,
    currentRank,
    nextRank,
    minInfluence: minInf,
    currentInfluence: influence,
    progress,
  };
}

// ──── 晋升执行 ────

export interface CourtPromotionResult {
  success: boolean;
  reason?: string;
  newRank?: CourtRank;
  updatedPlayer?: PlayerState;
}

/**
 * 执行朝廷晋升。
 * 晋升后不消耗影响力（影响力是累计成就，类似贡献值）。
 */
export function executeCourtPromotion(player: PlayerState): CourtPromotionResult {
  const check = canPromoteCourt(player);
  if (!check.canPromote) {
    return { success: false, reason: check.reason || '无法晋升。' };
  }
  if (!check.nextRank) {
    return { success: false, reason: '已达最高品阶。' };
  }

  const newRank = check.nextRank;
  const label = getCourtRankLabel(newRank, player.courtPath as CourtPath | null);

  const updated: PlayerState = {
    ...player,
    courtRank: newRank,
  };

  return { success: true, newRank, updatedPlayer: updated };
}

// ──── 分心惩罚 ────

/**
 * 计算分心惩罚系数。
 *
 * 规则：
 * - 上一行动是 武林 → 本次朝廷行动 → 影响力收益 -30%
 * - 上一行动是 朝廷 → 本次武林行动 → 修为收益   -30%
 * - 连续同领域行动 → 无惩罚
 * - 闲置/休息 → 重置标记，无惩罚
 *
 * @returns 收益倍数（1.0 = 无惩罚，0.7 = -30%）
 */
export function getSplitFocusMultiplier(
  lastAction: LastActionType,
  currentAction: 'martial' | 'court',
): number {
  if (currentAction === 'court' && lastAction === 'martial') {
    return 1 - SPLIT_FOCUS_PENALTY; // 0.70
  }
  if (currentAction === 'martial' && lastAction === 'court') {
    return 1 - SPLIT_FOCUS_PENALTY; // 0.70
  }
  return 1.0; // 同领域、或闲置后 → 无惩罚
}

/**
 * 获取分心惩罚的提示文字。
 */
export function getSplitFocusMessage(
  lastAction: LastActionType,
  currentAction: 'martial' | 'court',
): string | null {
  if (currentAction === 'court' && lastAction === 'martial') {
    return '⚠️ 分心惩罚：刚从武林归来，朝堂影响力收益 -30%';
  }
  if (currentAction === 'martial' && lastAction === 'court') {
    return '⚠️ 分心惩罚：刚从庙堂归来，武道修为收益 -30%';
  }
  return null;
}

// ──── 影响力增长 ────

export interface InfluenceGainResult {
  /** 实际获得的影响力 */
  gained: number;
  /** 新影响力总值 */
  newInfluence: number;
  /** 新 lastActionType */
  newLastAction: LastActionType;
  /** 惩罚提示 */
  penaltyMessage: string | null;
  /** 更新后的 PlayerState */
  updatedPlayer: PlayerState;
}

/**
 * 为玩家增加影响力。
 *
 * @param player 当前玩家状态
 * @param baseAmount 基础影响力增量
 * @param reason 变动原因（用于日志）
 * @returns 影响力收益结果 + 更新后玩家
 */
export function gainInfluence(
  player: PlayerState,
  baseAmount: number,
  reason: string,
): InfluenceGainResult {
  const lastAction = (player.lastActionType ?? 'idle') as LastActionType;
  const multiplier = getSplitFocusMultiplier(lastAction, 'court');
  const actualGain = Math.round(baseAmount * multiplier);
  const newInfluence = (player.influence ?? 0) + actualGain;

  const penaltyMessage = multiplier < 1
    ? getSplitFocusMessage(lastAction, 'court')
    : null;

  const updated: PlayerState = {
    ...player,
    influence: newInfluence,
    lastActionType: 'court',
  };

  return {
    gained: actualGain,
    newInfluence,
    newLastAction: 'court',
    penaltyMessage,
    updatedPlayer: updated,
  };
}

// ──── 朝廷四维成长 ────

export interface CourtStatGainResult {
  /** 更新的四维 */
  newCourtStats: CourtStats;
  /** 总获得点数 */
  totalGain: number;
  /** 更新后的 PlayerState */
  updatedPlayer: PlayerState;
}

/**
 * 提升朝廷四维属性。
 *
 * @param player 当前玩家状态
 * @param statKey 要提升的维度键
 * @param amount 提升量
 */
export function improveCourtStat(
  player: PlayerState,
  statKey: keyof CourtStats,
  amount: number,
): CourtStatGainResult {
  const current = player.courtStats ?? { strategy: 10, eloquence: 10, charisma: 10, scholarship: 10 };
  const newVal = Math.min(100, (current[statKey] ?? 10) + amount);
  const newStats: CourtStats = { ...current, [statKey]: newVal };

  const updated: PlayerState = {
    ...player,
    courtStats: newStats,
  };

  return {
    newCourtStats: newStats,
    totalGain: amount,
    updatedPlayer: updated,
  };
}

// ──── 武行动标记（分心惩罚用） ────

/**
 * 标记玩家执行了武林行动。
 * 供武林系统在行动结束后调用，设置 lastActionType。
 */
export function markMartialAction(player: PlayerState): PlayerState {
  const lastAction = (player.lastActionType ?? 'idle') as LastActionType;
  const penaltyMsg = getSplitFocusMessage(lastAction, 'martial');

  return {
    ...player,
    lastActionType: 'martial',
  };
}

/**
 * 标记玩家休息/闲置（重置分心惩罚标记）。
 */
export function markIdleAction(player: PlayerState): PlayerState {
  return {
    ...player,
    lastActionType: 'idle',
  };
}

// ──── 朝廷四维标签 ────

export const COURT_STAT_LABELS: Record<keyof CourtStats, { name: string; icon: string; desc: string }> = {
  strategy:    { name: '智谋', icon: '🧠', desc: '策略谋划、用兵之道' },
  eloquence:   { name: '口才', icon: '🗣️', desc: '雄辩说服、军令威严' },
  charisma:    { name: '魅力', icon: '✨', desc: '人望魅力、收服人心' },
  scholarship: { name: '学识', icon: '📚', desc: '经史学问、兵书研读' },
};

/** 文官路径侧重：口才 + 学识 */
export const COURT_PATH_WEN_STATS: (keyof CourtStats)[] = ['eloquence', 'scholarship'];
/** 武官路径侧重：智谋 + 魅力 */
export const COURT_PATH_WU_STATS: (keyof CourtStats)[] = ['strategy', 'charisma'];

// ═══════════════════════════════════════════════════════════
// 🆕 CourtEngine 集成：三国志/太阁立志传风格任务裁决
// ═══════════════════════════════════════════════════════════

import type { TalentId } from '../data/realmConfig';
import {
  resolveCourtMission,
  getCourtMilitaryPower,
  getMilitaryPowerRank,
  getMissionStatRequirements,
  formatResolutionReport,
  type CourtMissionCategory,
  type CourtDifficulty,
  type CourtResolution,
} from './CourtEngine';

export type { CourtMissionCategory, CourtDifficulty, CourtResolution };

/** 整合后的朝廷任务执行结果（含玩家状态更新） */
export interface CourtTaskResult {
  /** 裁决详情 */
  resolution: CourtResolution;
  /** 更新后的玩家状态 */
  updatedPlayer: PlayerState;
  /** 分心惩罚提示（如果有） */
  penaltyMessage: string | null;
  /** 晋升提示（如果影响力达标可晋升） */
  promotionAvailable: boolean;
  /** 晋升信息 */
  promotionInfo: string | null;
}

/**
 * 执行一次完整的朝廷任务（引擎裁决 + 状态更新）。
 *
 * 这是 CourtSystem 与 CourtEngine 的桥梁函数，
 * 在一个调用中完成：掷骰裁决 → 影响力增减 → 四维成长 → 分心标记。
 *
 * @param player 当前玩家状态
 * @param category 任务类别（军事/外交/治理等）
 * @param difficulty 任务难度
 * @param baseInfluence 基础影响力奖励
 */
export function executeCourtTask(
  player: PlayerState,
  category: CourtMissionCategory,
  difficulty: CourtDifficulty,
  baseInfluence: number,
): CourtTaskResult {
  // 提取玩家属性
  const courtStats: CourtStats = player.courtStats ?? { strategy: 10, eloquence: 10, charisma: 10, scholarship: 10 };
  const level = player.level ?? 1;
  const atk = player.atk ?? 10;
  const talents: TalentId[] = (player as any).talents ?? ['normal'];
  const lastAction = (player.lastActionType ?? 'idle') as LastActionType;

  // 1. 分心惩罚判定
  const splitMul = getSplitFocusMultiplier(lastAction, 'court');
  const adjustedInfluence = Math.round(baseInfluence * splitMul);
  const penaltyMessage = splitMul < 1
    ? getSplitFocusMessage(lastAction, 'court')
    : null;

  // 2. CourtEngine 裁决
  const resolution = resolveCourtMission({
    category,
    difficulty,
    courtStats,
    level,
    atk,
    talents,
    baseInfluenceReward: adjustedInfluence,
  });

  // 3. 更新玩家状态
  let updated = { ...player };

  // 影响力变更
  updated.influence = Math.max(0, (player.influence ?? 0) + resolution.actualInfluence);

  // 四维成长
  if (resolution.statGrowth) {
    const currentStats = { ...courtStats };
    for (const [stat, gain] of Object.entries(resolution.statGrowth) as [keyof CourtStats, number][]) {
      if (gain !== undefined && gain !== 0) {
        currentStats[stat] = Math.min(100, (currentStats[stat] ?? 10) + gain);
      }
    }
    updated.courtStats = currentStats;
  }

  // 更新分心标记
  updated.lastActionType = 'court';

  // 4. 晋升检查
  const promoCheck = canPromoteCourt(updated);
  const promotionAvailable = promoCheck.canPromote;
  const promotionInfo = promotionAvailable
    ? `影响力达标！可晋升至「${getCourtRankLabel(promoCheck.nextRank!, player.courtPath as CourtPath | null)}」`
    : null;

  return {
    resolution,
    updatedPlayer: updated,
    penaltyMessage,
    promotionAvailable,
    promotionInfo,
  };
}

/**
 * 获取玩家当前朝廷武力的完整摘要（用于 UI 展示）。
 */
export function getCourtPowerSummary(player: PlayerState): {
  militaryPower: number;
  rank: string;
  breakdown: string;
} {
  const level = player.level ?? 1;
  const atk = player.atk ?? 10;
  const militaryPower = getCourtMilitaryPower(level, atk);
  const rank = getMilitaryPowerRank(militaryPower);
  const breakdown = `等级 ${level}（${level * 2.5}）${atk ? ` + ATK ${atk}（+${Math.round(atk * 0.02)}）` : ''}`;

  return { militaryPower, rank, breakdown };
}

export { getCourtMilitaryPower, getMilitaryPowerRank, getMissionStatRequirements, formatResolutionReport };
