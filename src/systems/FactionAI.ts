// ============================================================
//  src/systems/FactionAI.ts — AI 势力自主引擎
// ============================================================
//  每月初所有 AI 势力执行自己的"议事"：
//  1. 评估自身状态（resources/stability/prosperity）
//  2. 提案生成（攻城/整肃/征收/发展）
//  3. 目标选择（攻城：评分最高的相邻敌对城市）
//  4. 执行决议 → 更新世界状态 + 生成江湖传闻
// ============================================================

import type { SectId } from '../data/types';
import type { LocationId } from '../data/worldMap';
import { WORLD_MAP } from '../data/worldMap';
import type { WorldNewsItem } from '../data/types';
import { SECTS } from '../data/sects';
import { FACTION_DEFS } from '../data/sandboxTypes';
import { getPlayer, setPlayer } from '../state/GameState';
import { getSectState, updateSectState, computeSectPower, isSectBase } from './SectManagement';
import { getFactionTrust, getFactionRelation } from './FactionSystem';
import { getLocationController, tryTriggerSiege } from './FactionWarfare';

// ──── AI 议案类型 ────

type AIProposalType = 'siege' | 'stabilize' | 'gather' | 'develop';

interface AIProposal {
  type: AIProposalType;
  label: string;
  target?: { locationId: LocationId; defenderSect: SectId; locationName: string };
}

interface AITickReport {
  sectId: SectId;
  sectName: string;
  proposal: AIProposal;
  result: string;
  /** 生成的江湖新闻 */
  news?: string;
}

// ──── 主入口 ────

/**
 * 每月初调用：所有 AI 势力执行一次自主行动。
 * @returns 所有势力的行动报告
 */
export function factionAITick(): AITickReport[] {
  const p = getPlayer();
  const reports: AITickReport[] = [];

  const allSects = Object.keys(SECTS) as SectId[];
  const processed = new Set<SectId>();

  for (const sectId of allSects) {
    if (sectId === 'none' || processed.has(sectId)) continue;
    processed.add(sectId);

    const state = getSectState(sectId);
    if (!state || state.resources <= 0) continue;

    const proposal = generateAIProposal(sectId);
    const result = executeAIProposal(sectId, proposal);
    reports.push(result);
  }

  // 更新力量值
  import('./SectManagement').then(m => m.refreshAllSectPower());

  return reports;
}

// ──── 议案生成 ────

function generateAIProposal(sectId: SectId): AIProposal {
  const state = getSectState(sectId);
  const target = findSiegeTarget(sectId);

  // 攻城优先：资源 > 300 且有可攻击目标
  if (state.resources > 300 && target && Math.random() < 0.40) {
    return {
      type: 'siege',
      label: `发兵攻打${target.locationName}`,
      target,
    };
  }

  // 整肃：稳定度 < 40
  if (state.stability < 40) {
    return { type: 'stabilize', label: '整肃内务' };
  }

  // 征收：资源 < 150
  if (state.resources < 150) {
    return { type: 'gather', label: '征收资源' };
  }

  // 发展：默认
  return { type: 'develop', label: '休养生息' };
}

// ──── 议案执行 ────

function executeAIProposal(sectId: SectId, proposal: AIProposal): AITickReport {
  const sectName = SECTS[sectId]?.name ?? sectId;
  let result: string;
  let news: string | undefined;

  switch (proposal.type) {
    case 'siege': {
      if (!proposal.target) {
        // 降级为发展
        return executeAIProposal(sectId, { type: 'develop', label: '发展门派' });
      }
      // 触发攻城（FactionWarfare 处理）
      const siegeResult = tryTriggerSiege();
      if (siegeResult.happened) {
        result = `出兵攻打${proposal.target.locationName}，${siegeResult.newsText ?? '战事已了'}`;
        news = siegeResult.newsText ?? undefined;
      } else {
        // 未能触发攻城（冷却等原因），降级
        updateSectState(sectId, { resources: -30 });
        result = `厉兵秣马，准备攻打${proposal.target.locationName}`;
      }
      break;
    }
    case 'stabilize': {
      const gain = 10 + Math.floor(Math.random() * 16); // 10-25
      updateSectState(sectId, { stability: gain });
      result = `整肃内务，稳定度 +${gain}`;
      break;
    }
    case 'gather': {
      const gain = 30 + Math.floor(Math.random() * 41); // 30-70
      updateSectState(sectId, { resources: gain });
      result = `广征资源，资源 +${gain}`;
      break;
    }
    case 'develop': {
      const rGain = 10 + Math.floor(Math.random() * 16); // 10-25
      const sGain = 3 + Math.floor(Math.random() * 5);   // 3-7
      updateSectState(sectId, { resources: rGain, stability: sGain });
      result = `休养生息，资源 +${rGain}，稳定度 +${sGain}`;
      break;
    }
    default:
      result = '按兵不动';
  }

  return { sectId, sectName, proposal, result, news };
}

// ──── 攻城目标选择 ────

/**
 * 根据评分选择最佳攻城目标。
 */
function findSiegeTarget(sectId: SectId): AIProposal['target'] | null {
  const p = getPlayer();
  const tc = (p.territoryControl ?? {}) as Record<string, string>;
  const bases = getSectBases(sectId);

  const candidates: Array<{
    locationId: LocationId;
    defenderSect: SectId;
    locationName: string;
    score: number;
  }> = [];

  // 检查所有与门派据点相邻的地点
  for (const base of bases) {
    const baseData = WORLD_MAP[base];
    if (!baseData) continue;

    for (const connId of baseData.connections) {
      const controller = (tc[connId] ?? getLocationController(connId)) as SectId;
      if (controller === 'none' || controller === sectId) continue;

      const locData = WORLD_MAP[connId];
      if (!locData) continue;

      // 排除已冷却的地点
      const cooldownKey = `${sectId}|${connId}`;
      if ((p.siegeCooldown?.[cooldownKey] ?? 0) > 0) continue;

      const score = computeTargetScore(sectId, connId, controller);
      if (score > 0) {
        candidates.push({
          locationId: connId,
          defenderSect: controller,
          locationName: locData.name,
          score,
        });
      }
    }
  }

  if (candidates.length === 0) return null;

  // 加权随机（高分优先但有随机性）
  const totalScore = candidates.reduce((s, c) => s + c.score, 0);
  let roll = Math.random() * totalScore;
  for (const c of candidates) {
    roll -= c.score;
    if (roll <= 0) {
      return {
        locationId: c.locationId,
        defenderSect: c.defenderSect,
        locationName: c.locationName,
      };
    }
  }

  return candidates[0]!;
}

/**
 * 评分攻城目标。
 * score = alignmentHostility*20 + powerRatio*50 + trustHostility*10 + prosperity*0.5
 */
function computeTargetScore(attacker: SectId, targetLoc: LocationId, defender: SectId): number {
  if (defender === 'none' || defender === attacker) return -1;

  const attDef = FACTION_DEFS[attacker];
  const defDef = FACTION_DEFS[defender];
  if (!attDef || !defDef) return 10;

  // 倾向敌对（正邪不两立）
  const hostileAlign = attDef.alignment === 'righteous' && defDef.alignment === 'chaotic'
    ? 30 : attDef.alignment === 'chaotic' && defDef.alignment === 'righteous'
    ? 30 : 10;

  // 力量比（优先以强打弱）
  const attPower = computeSectPower(attacker);
  const defPower = computeSectPower(defender);
  const powerRatio = defPower > 0 ? Math.min(1, attPower / (defPower * 2)) : 1; // 0~1
  const powerScore = (1 - powerRatio) * 50; // 对方越弱越高

  // 信任敌对
  const trust = getFactionTrust(attacker, defender);
  const trustScore = trust < 15 ? 20 : trust < 30 ? 10 : 0;

  // 目标繁荣度（肥羊）
  const defState = getSectState(defender);
  const prosperity = defState.prosperity ?? 30;
  const prosperityScore = prosperity * 0.5;

  return hostileAlign + powerScore + trustScore + prosperityScore;
}

// ──── 工具函数 ────

function getSectBases(sectId: SectId): LocationId[] {
  const bases: LocationId[] = [];
  for (const locId of Object.keys(WORLD_MAP) as LocationId[]) {
    const owner = isSectBase(locId);
    if (owner === sectId) bases.push(locId);
  }
  return bases;
}
