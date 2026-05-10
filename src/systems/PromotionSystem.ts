// ============================================================
//  src/systems/PromotionSystem.ts — 宗门晋升引擎（沙盒路径）
// ============================================================
//  提供与主线剧情平行的晋升路径：
//    外门 → 内门 → 真传 → 长老
//  晋升条件仅依赖贡献值 + 试炼，与修为等级完全解耦。
//  与剧情晋升写入同一个 discipleRank 字段，互不冲突。
// ============================================================

import type { PlayerState } from '../data/types';
import {
  type DiscipleRank,
  type PromotionRequirement,
  type PromotionTrial,
  DISCIPLE_RANK_ORDER,
  PROMOTION_REQUIREMENTS,
  PROMOTION_TRIALS,
} from '../data/sandboxTypes';
import { syncSlotsOnPromotion } from './NPCManager';

// ──── 晋升状态查询 ────

export interface PromotableResult {
  /** 是否可以晋升 */
  canPromote: boolean;
  /** 不能晋升的原因（canPromote=false 时有值） */
  reason?: string;
  /** 当前宗门身份 */
  currentRank: DiscipleRank;
  /** 目标宗门身份（已是最高级则为 null） */
  nextRank: DiscipleRank | null;
  /** 晋升条件 */
  requirement: PromotionRequirement | null;
  /** 晋升试炼配置 */
  trial: PromotionTrial | null;
  /** 贡献值是否达标 */
  contributionMet: boolean;
  /** 试炼是否已完成 */
  trialCompleted: boolean;
}

/**
 * 检查玩家是否可以晋升到下一宗门身份（沙盒路径）。
 *
 * 规则：
 * 1. 如果玩家已通过剧情晋升到更高等级，跳过检查 → 直接查询下一级
 * 2. 贡献值达标 + 试炼未完成 → "贡献已达，需完成试炼"
 * 3. 贡献值未达标 → "贡献不足"
 * 4. 贡献值达标 + 试炼已完成 → "可立即晋升！"
 * 5. 已是最高可达成等级 → "已达当前最高阶"
 */
export function canPromote(player: PlayerState): PromotableResult {
  const currentRank = player.discipleRank as DiscipleRank;
  const currentIdx = DISCIPLE_RANK_ORDER.indexOf(currentRank);
  const completedTrials = player.completedTrials || [];

  // 检查当前等级是否有效
  if (currentIdx < 0) {
    return {
      canPromote: false,
      reason: '身份异常。',
      currentRank,
      nextRank: null,
      requirement: null,
      trial: null,
      contributionMet: false,
      trialCompleted: false,
    };
  }

  // 查找下一个可晋升的等级
  // 跳过已被剧情设定的等级（玩家已通过剧情晋升到更高）
  let nextIdx = currentIdx + 1;
  while (nextIdx < DISCIPLE_RANK_ORDER.length) {
    const nextRank = DISCIPLE_RANK_ORDER[nextIdx];
    if (!nextRank) { nextIdx++; continue; }

    const requirement = PROMOTION_REQUIREMENTS[nextRank];

    // 如果没有沙盒晋升条件定义，说明该等级只能通过剧情解锁
    if (!requirement) {
      nextIdx++;
      continue;
    }

    return buildResult(currentRank, nextRank, requirement, player, completedTrials);
  }

  // 已达当前可达成最高等级
  return {
    canPromote: false,
    reason: '已达宗门身份巅峰。',
    currentRank,
    nextRank: null,
    requirement: null,
    trial: null,
    contributionMet: false,
    trialCompleted: false,
  };
}

function buildResult(
  currentRank: DiscipleRank,
  nextRank: DiscipleRank,
  requirement: PromotionRequirement,
  player: PlayerState,
  completedTrials: string[],
): PromotableResult {
  const contrib = player.sectContribution ?? 0;
  const contributionMet = contrib >= requirement.minContribution;
  const trialId = requirement.trialId;
  const trial = trialId ? (PROMOTION_TRIALS[trialId] ?? null) : null;
  const trialCompleted = trialId ? completedTrials.includes(trialId) : true; // 无试炼则视为已完成

  if (!contributionMet) {
    const needed = requirement.minContribution - contrib;
    return {
      canPromote: false,
      reason: `贡献不足，还需 ${needed} 点宗门贡献。`,
      currentRank,
      nextRank,
      requirement,
      trial,
      contributionMet: false,
      trialCompleted,
    };
  }

  if (!trialCompleted) {
    return {
      canPromote: false,
      reason: `贡献已达！需完成晋升试炼「${trial?.title ?? trialId}」。`,
      currentRank,
      nextRank,
      requirement,
      trial,
      contributionMet: true,
      trialCompleted: false,
    };
  }

  return {
    canPromote: true,
    reason: undefined,
    currentRank,
    nextRank,
    requirement,
    trial,
    contributionMet: true,
    trialCompleted: true,
  };
}

// ──── 晋升执行 ────

export interface PromotionResult {
  success: boolean;
  reason?: string;
  newRank?: DiscipleRank;
  updatedPlayer?: PlayerState;
}

/**
 * 执行晋升（沙盒路径）。
 * 将 PlayerState 中的 discipleRank 更新到下一级，
 * 同时从 completedTrials 中移除已使用的试炼标记。
 */
export function executePromotion(player: PlayerState): PromotionResult {
  const check = canPromote(player);
  if (!check.canPromote) {
    return { success: false, reason: check.reason || '无法晋升。' };
  }

  const { nextRank, requirement } = check;
  if (!nextRank || !requirement) {
    return { success: false, reason: '晋升目标无效。' };
  }

  const trialId = requirement.trialId;
  const completedTrials = [...(player.completedTrials || [])];

  // 移除已完成的试炼标记（消耗试炼）
  if (trialId) {
    const idx = completedTrials.indexOf(trialId);
    if (idx >= 0) completedTrials.splice(idx, 1);
  }

  const rankLabels: Record<string, string> = {
    outer: '外门弟子', inner: '内门弟子', true: '真传弟子', elder: '长老',
  };

  const contributionLog = player.contributionLog || [];

  // 🆕 晋升时同步更新 NPC 收纳槽位上限
  const newMaxSlots = syncSlotsOnPromotion(player, nextRank);
  const npcCollection = player.npcCollection
    ? { ...player.npcCollection, maxSlots: newMaxSlots }
    : { recruited: [], maxSlots: newMaxSlots, assignments: {}, assignmentTargets: {} };

  const updated: PlayerState = {
    ...player,
    discipleRank: nextRank,
    completedTrials,
    npcCollection,
    // 晋升不消耗贡献值（贡献值是累计成就，不扣除）
    contributionLog: [
      ...contributionLog,
      {
        amount: 0,
        source: 'promotion_trial',
        reason: `晋升至${rankLabels[nextRank] || nextRank}`,
        timestamp: Date.now(),
      },
    ],
  };

  return { success: true, newRank: nextRank, updatedPlayer: updated };
}

// ──── 工具函数 ────

/** 当前身份对应的中文显示名 */
export function getRankLabel(rank: string): string {
  const labels: Record<string, string> = {
    outer: '外门弟子',
    inner: '内门弟子',
    true: '真传弟子',
    elder: '长老',
    vice_leader: '副掌门',
    leader: '掌门',
  };
  return labels[rank] || '外门弟子';
}

/** 获取晋升试炼配置 */
export function getPromotionTrial(player: PlayerState): PromotionTrial | null {
  const check = canPromote(player);
  return check.trial;
}

/** 获取贡献值进度（0-1 之间） */
export function getContributionProgress(player: PlayerState): number {
  const check = canPromote(player);
  if (!check.requirement) return 1;
  const contrib = player.sectContribution ?? 0;
  return Math.min(1, contrib / check.requirement.minContribution);
}
