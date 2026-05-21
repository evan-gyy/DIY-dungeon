// ============================================================
//  src/systems/PlayerUsurpation.ts — 玩家夺权系统
// ============================================================
//  长老及以上可发动门派夺权，击败掌门后执掌宗门。
//  成功后继任掌门，解锁掌门管理模式。
// ============================================================

import type { SectId } from '../data/types';
import { SECTS } from '../data/sects';
import { getPlayer, setPlayer } from '../state/GameState';
import { getSectLeaderId, getSectState, updateSectState } from './SectManagement';

// ──── 配置 ────

const CFG = {
  minRank: 'elder' as const,          // 最低需要长老
  minContribution: 300,               // 最低贡献
  minReputation: 50,                  // 最低声望
  minLevel: 20,                       // 最低等级
  maxStabilityForCoup: 70,            // 门派稳定度低于此值才可夺权
  baseSuccessChance: 0.25,            // 基础成功率
  levelDiffWeight: 0.03,              // 每级等级差加成
  contributionWeight: 0.0003,         // 每点贡献加成
  reputationWeight: 0.002,            // 每点声望加成
  stabilityPenalty: 0.003,            // 稳定度惩罚
  trustWeight: 0.001,                 // 每点势力信任加成
  influenceBonus: 0.0005,             // 每点影响力加成
  contributionLossOnFail: 200,        // 失败扣除贡献
  reputationLossOnFail: 30,           // 失败扣除声望
  relationLossOnFail: -40,            // 失败降低友好度
};

// ──── 类型 ────

export interface CoupCheckResult {
  possible: boolean;
  reason?: string;
  leaderName?: string;
  leaderLevel?: number;
  successChance?: number;
}

export interface CoupResult {
  success: boolean;
  message: string;
  /** 是否需要进入战斗（成功率接近临界时触发） */
  enterBattle?: boolean;
  battleEnemyId?: string;
  battleEnemyName?: string;
  battleEnemyLevel?: number;
}

// ──── 检查是否可夺权 ────

export function checkCoupEligibility(): CoupCheckResult {
  const p = getPlayer();
  const sect = p.sect as SectId;
  if (sect === 'none' || sect === 'imperial_court') {
    return { possible: false, reason: '散修和朝廷官员无法发动夺权。' };
  }

  const rank = p.discipleRank ?? 'outer';
  const rankOrder = ['outer', 'inner', 'true', 'elder', 'vice_leader', 'leader'];
  const rankIdx = rankOrder.indexOf(rank);
  const minIdx = rankOrder.indexOf(CFG.minRank);

  if (rankIdx < minIdx) {
    return { possible: false, reason: '只有长老及以上身份才能发动夺权。' };
  }
  if (rank === 'leader') {
    return { possible: false, reason: '你已是本门掌门。' };
  }

  const contribution = p.sectContribution ?? 0;
  if (contribution < CFG.minContribution) {
    return { possible: false, reason: `宗门贡献不足（需要${CFG.minContribution}，当前${contribution}）。` };
  }

  const reputation = p.reputation ?? 0;
  if (reputation < CFG.minReputation) {
    return { possible: false, reason: `江湖声望不足（需要${CFG.minReputation}，当前${reputation}）。` };
  }

  if (p.level < CFG.minLevel) {
    return { possible: false, reason: `境界不足，至少需要${CFG.minLevel}级。` };
  }

  const state = getSectState(sect);
  if (state.stability >= CFG.maxStabilityForCoup) {
    return { possible: false, reason: '门派稳定度过高，人心归附，不便夺权。' };
  }

  // 找掌门 NPC
  const leaderId = getSectLeaderId(sect);
  const db = p.npcDatabase ?? {};
  const leader = db[leaderId];
  if (!leader) {
    return { possible: false, reason: '未找到掌门信息。' };
  }

  // 计算成功率
  const chance = computeCoupChance(p.level, leader.level, contribution, reputation, state.stability, sect);

  return {
    possible: true,
    leaderName: leader.name,
    leaderLevel: leader.level,
    successChance: Math.min(0.85, chance),
  };
}

// ──── 发动夺权 ────

export function executeCoup(): CoupResult {
  const p = getPlayer();
  const sect = p.sect as SectId;
  const eligibility = checkCoupEligibility();
  if (!eligibility.possible) {
    return { success: false, message: eligibility.reason ?? '无法发动夺权。' };
  }

  const chance = eligibility.successChance!;
  const roll = Math.random();

  // 如果成功率在 25%~55% 之间，触发战斗
  if (chance >= 0.25 && chance <= 0.55 && roll >= chance - 0.15 && roll < chance + 0.15) {
    const leaderId = getSectLeaderId(sect);
    const db = p.npcDatabase ?? {};
    const leader = db[leaderId];
    return {
      success: false,
      message: `夺权进入白热化！必须正面击败掌门${leader?.name ?? '掌门'}！`,
      enterBattle: true,
      battleEnemyId: `coup_${leaderId}`,
      battleEnemyName: leader?.name ?? '掌门',
      battleEnemyLevel: leader?.level ?? 20,
    };
  }

  if (roll < chance) {
    // 成功
    const sectName = SECTS[sect]?.name ?? sect;
    const leaderId = getSectLeaderId(sect);
    const db = { ...p.npcDatabase };
    const leader = db[leaderId];

    // 旧掌门降级为长老
    if (leader) {
      db[leaderId] = { ...leader, discipleRank: 'elder' };
    }

    // 玩家成为掌门
    const stabilityDrop = 20 + Math.floor(Math.random() * 16); // -20~-35
    updateSectState(sect, { stability: -stabilityDrop });

    setPlayer({
      ...p,
      discipleRank: 'leader',
      npcDatabase: db,
    });

    return {
      success: true,
      message: `夺权成功！击败${leader?.name ?? '掌门'}，你成为${sectName}新掌门！门派稳定度 -${stabilityDrop}。`,
    };
  } else {
    // 失败
    const contributionLoss = CFG.contributionLossOnFail;
    const reputationLoss = CFG.reputationLossOnFail;
    const newContribution = Math.max(0, (p.sectContribution ?? 0) - contributionLoss);
    const newReputation = Math.max(0, (p.reputation ?? 0) - reputationLoss);

    // 30% 概率降级为内门
    const demotion = Math.random() < 0.3;
    const updates: Partial<typeof p> = {
      sectContribution: newContribution,
      reputation: newReputation,
    };
    if (demotion) {
      (updates as any).discipleRank = 'inner';
    }

    // 降低与 NPC 的友好度
    const npcAffection = { ...(p.npcAffection ?? {}) };
    const leaderId = getSectLeaderId(sect);
    if (leaderId && npcAffection[leaderId] !== undefined) {
      npcAffection[leaderId] = Math.max(-100, (npcAffection[leaderId] ?? 0) + CFG.relationLossOnFail);
    }

    setPlayer({
      ...p,
      ...updates,
      npcAffection,
    });

    const demotionMsg = demotion ? ' 你被贬为内门弟子。' : '';
    return {
      success: false,
      message: `夺权失败！被掌门镇压，贡献-${contributionLoss}，声望-${reputationLoss}。${demotionMsg}`,
    };
  }
}

/** 夺权战斗胜利后调用 */
export function completeCoupBattle(): CoupResult {
  const p = getPlayer();
  const sect = p.sect as SectId;
  const sectName = SECTS[sect]?.name ?? sect;
  const leaderId = getSectLeaderId(sect);
  const db = { ...p.npcDatabase };
  const leader = db[leaderId];

  if (leader) {
    db[leaderId] = { ...leader, discipleRank: 'elder' };
  }

  const stabilityDrop = 15 + Math.floor(Math.random() * 11); // -15~-25
  updateSectState(sect, { stability: -stabilityDrop });

  setPlayer({
    ...p,
    discipleRank: 'leader',
    npcDatabase: db,
  });

  return {
    success: true,
    message: `力克掌门${leader?.name ?? '掌门'}！你成为${sectName}新掌门！门派稳定度 -${stabilityDrop}。`,
  };
}

// ──── 成功率计算 ────

function computeCoupChance(
  playerLevel: number,
  leaderLevel: number,
  contribution: number,
  reputation: number,
  stability: number,
  sect: SectId,
): number {
  let chance = CFG.baseSuccessChance
    + (playerLevel - leaderLevel) * CFG.levelDiffWeight
    + contribution * CFG.contributionWeight
    + reputation * CFG.reputationWeight
    - stability * CFG.stabilityPenalty;

  // 势力信任加成
  const p = getPlayer();
  const relations = p.factionRelations ?? {};
  const playerSectKey = sect as string;
  const sectRelations = relations[playerSectKey];
  if (sectRelations) {
    let maxTrust = 0;
    for (const [, rel] of Object.entries(sectRelations)) {
      if ((rel as any).trust > maxTrust) maxTrust = (rel as any).trust;
    }
    chance += maxTrust * CFG.trustWeight;
  }

  // 朝廷影响力加成
  chance += (p.influence ?? 0) * CFG.influenceBonus;

  return Math.max(0.05, Math.min(0.85, chance));
}
