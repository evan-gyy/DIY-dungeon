// ============================================================
//  src/systems/SectManagement.ts — 门派经营系统
// ============================================================
//  1. 门派资源与稳定度管理
//  2. 月度自然增长/衰退
//  3. NPC 门派任务逻辑（patrol/gather/train）
//  4. 议事决策逻辑（议案选择）
// ============================================================

import type { SectId, SectStateData } from '../data/types';
import { FACTION_DEFS, type FactionAlignment } from '../data/sandboxTypes';
import { SECTS } from '../data/sects';
import { getPlayer, setPlayer } from '../state/GameState';
import { getLocationController } from './FactionWarfare';
import { WORLD_MAP, type LocationId } from '../data/worldMap';

// ──── 门派等级分类 ────

type SectTier = 'supreme' | 'first_rate' | 'second_rate' | 'fringe' | 'special';

const SECT_TIERS: Record<SectId, SectTier> = {
  wudang: 'supreme', shaolin: 'supreme', riyue: 'supreme',
  emei: 'first_rate', beggar: 'first_rate', quanzhen: 'first_rate',
  kunlun: 'first_rate', tangmen: 'first_rate',
  huashan: 'second_rate', kongtong: 'second_rate', qingcheng: 'second_rate',
  diancang: 'second_rate', tiezhang: 'second_rate',
  maoshan: 'fringe', wudu: 'fringe', xuedao: 'fringe', haisha: 'fringe',
  xiaoyao: 'special', demon: 'special',
  none: 'second_rate',
};

// ──── 初始值 ────

const INITIAL_SECT_STATE: Record<SectTier, SectStateData> = {
  supreme:     { resources: 500, stability: 70 },
  first_rate:  { resources: 350, stability: 60 },
  second_rate: { resources: 200, stability: 50 },
  fringe:      { resources: 100, stability: 40 },
  special:     { resources: 300, stability: 45 },
};

// ──── 每门派的掌门 NPC ID ────

const SECT_LEADER_ID: Partial<Record<SectId, string>> = {
  wudang: 'zhang_xuansu',
  shaolin: 'shaolin_kongwen',
  emei: 'emei_miejue',
  beggar: 'beggar_hong',
  huashan: 'huashan_master',
  demon: 'demon_master',
  maoshan: 'maoshan_zhangmen',
  kunlun: 'kunlun_zhangmen',
  qingcheng: 'qingcheng_zhangmen',
  tangmen: 'tangmen_zhangmen',
  xiaoyao: 'xiaoyao_zhangmen',
  quanzhen: 'quanzhen_zhangmen',
  kongtong: 'kongtong_zhangmen',
  diancang: 'diancang_zhangmen',
  riyue: 'riyue_leader',
  tiezhang: 'tiezhang_leader',
  wudu: 'wudu_leader',
  xuedao: 'xuedao_leader',
  haisha: 'haisha_leader',
};

// ──── 门派状态管理 ────

/** 初始化所有门派的状态 */
export function initSectState(): Record<string, SectStateData> {
  const p = getPlayer();
  if (p.sectState && Object.keys(p.sectState).length > 0) {
    return p.sectState;
  }

  const state: Record<string, SectStateData> = {};
  for (const sectId of Object.keys(SECTS) as SectId[]) {
    if (sectId === 'none') continue;
    const tier = SECT_TIERS[sectId] ?? 'second_rate';
    state[sectId] = { ...INITIAL_SECT_STATE[tier] };
  }
  return state;
}

/** 获取某门派的状态 */
export function getSectState(sectId: SectId): SectStateData {
  const p = getPlayer();
  return p.sectState?.[sectId] ?? { resources: 200, stability: 50 };
}

/** 更新某门派的状态 */
export function updateSectState(sectId: SectId, delta: Partial<SectStateData>): void {
  const p = getPlayer();
  const current = getSectState(sectId);
  const updated = {
    resources: Math.max(0, Math.min(1000, current.resources + (delta.resources ?? 0))),
    stability: Math.max(0, Math.min(100, current.stability + (delta.stability ?? 0))),
  };
  setPlayer({ ...p, sectState: { ...p.sectState, [sectId]: updated } });
}

// ──── 月度自然变化（每回合调用） ────

/** 每回合对门派状态执行自然增长/衰退 */
export function tickSectNaturalChange(): void {
  const p = getPlayer();
  if (!p.sectState) return;

  const updated = { ...p.sectState };
  for (const sectId of Object.keys(updated) as SectId[]) {
    if (sectId === 'none') continue;
    const current = updated[sectId]!;
    const tier = SECT_TIERS[sectId] ?? 'second_rate';

    // 自然增长（按门派等级）
    const growthRanges: Record<SectTier, [number, number]> = {
      supreme: [8, 15], first_rate: [6, 12], second_rate: [4, 10],
      fringe: [2, 6], special: [5, 10],
    };
    const [minR, maxR] = growthRanges[tier];
    const rGain = minR + Math.floor(Math.random() * (maxR - minR + 1));

    // 自然衰退
    const sDecay = Math.random() < 0.3 ? 1 : 0; // 30% 概率 -1

    updated[sectId] = {
      resources: Math.max(0, Math.min(1000, current.resources + rGain)),
      stability: Math.max(0, Math.min(100, current.stability - sDecay)),
    };
  }

  setPlayer({ ...p, sectState: updated });
}

// ──── NPC 门派任务 ────

export type SectTaskType = 'patrol' | 'gather' | 'train';

export interface SectTaskResult {
  task: SectTaskType;
  label: string;
  detail: string;
  /** 任务影响的门派状态变更 */
  delta: Partial<SectStateData>;
  /** 执行者经验收益（0=无收益） */
  expGain: number;
}

/**
 * 为 NPC 选择一个门派任务。
 * stability < 50 优先 patrol，resources < 200 优先 gather，否则均匀随机。
 */
export function pickSectTask(sectId: SectId): SectTaskType {
  const state = getSectState(sectId);
  const rand = Math.random();

  if (state.stability < 50 && rand < 0.5) return 'patrol';
  if (state.resources < 200 && rand < 0.5) return 'gather';

  // 均匀随机
  const r = Math.random();
  if (r < 0.4) return 'patrol';
  if (r < 0.75) return 'gather';
  return 'train';
}

/**
 * 执行门派任务并返回结果文本。
 */
export function executeSectTask(
  sectId: SectId, npcName: string, npcId: string, locationName: string,
): SectTaskResult {
  const task = pickSectTask(sectId);

  switch (task) {
    case 'patrol': {
      const sGain = 3 + Math.floor(Math.random() * 6); // 3-8
      updateSectState(sectId, { stability: sGain });
      return {
        task, label: '巡逻', expGain: 3,
        detail: `${npcName}在${locationName}巡逻，维护门派秩序。`,
        delta: { stability: sGain },
      };
    }
    case 'gather': {
      const rGain = 10 + Math.floor(Math.random() * 16); // 10-25
      updateSectState(sectId, { resources: rGain });
      return {
        task, label: '采集', expGain: 2,
        detail: `${npcName}外出采药寻矿，为门派增加资源。`,
        delta: { resources: rGain },
      };
    }
    case 'train': {
      const sGain = 1 + Math.floor(Math.random() * 3); // 1-3
      updateSectState(sectId, { stability: sGain });
      return {
        task, label: '练兵', expGain: 5,
        detail: `${npcName}在后山苦练，精进武艺。`,
        delta: { stability: sGain },
      };
    }
  }
}

// ──── 门派修炼效率加成 ────

/**
 * 获取某门派的修炼效率加成。
 * resources ≥ 500 → +20%
 * resources < 100 → -20%
 */
export function getSectCultivateBonus(sectId: SectId): number {
  const state = getSectState(sectId);
  if (state.resources >= 500) return 0.20;
  if (state.resources < 100) return -0.20;
  return 0;
}

// ──── 门派防御加成 ────

/**
 * 获取某门派的防守战力倍率。
 * stability ≥ 70 → ×1.15
 */
export function getSectDefenseMultiplier(sectId: SectId): number {
  const state = getSectState(sectId);
  return state.stability >= 70 ? 1.15 : 1.0;
}

// ──── NPC 离派概率 ────

/**
 * 检查 NPC 是否因门派稳定度过低而离开。
 * stability < 30 → 10% 概率
 * @returns true 表示 NPC 应离开
 */
export function shouldNpcLeaveSect(sectId: SectId): boolean {
  const state = getSectState(sectId);
  if (state.stability < 30) {
    return Math.random() < 0.10;
  }
  return false;
}

// ──── 攻击方相邻逻辑 ────

/** 门派据点 → SectId 映射 */
const SECT_BASES: Partial<Record<LocationId, SectId>> = {
  wudang_mountain: 'wudang', shaolin_temple: 'shaolin', emei_mountain: 'emei',
  beggar_hq: 'beggar', maoshan_daoyuan: 'maoshan', kunlun_mountain: 'kunlun',
  qingcheng_mountain: 'qingcheng', tangmen_estate: 'tangmen', xiaoyao_valley: 'xiaoyao',
  zhongnan_mountain: 'quanzhen', kongtong_mountain: 'kongtong', diancang_mountain: 'diancang',
  huashan_base: 'huashan', heimu_cliff: 'riyue',
};

// ──── 议事决策 ────

export type CouncilProposal =
  | { type: 'siege'; label: string }
  | { type: 'stabilize'; label: string }
  | { type: 'gather'; label: string }
  | { type: 'develop'; label: string };

export interface CouncilContext {
  proposal: CouncilProposal;
  sectId: SectId;
  sectName: string;
  leaderName: string;
  leaderPortrait: string;
  /** 长老 NPC 列表（3-4人） */
  elderNpcs: Array<{ id: string; name: string; portrait: string }>;
  /** 攻城目标（仅 siege 议案） */
  siegeTarget?: { locationId: LocationId; locationName: string; defenderSect: SectId; defenderName: string };
}

/**
 * 根据门派状态生成议事议案。
 */
export function generateCouncilProposal(sectId: SectId): CouncilProposal {
  const state = getSectState(sectId);

  // 检查是否有可攻击的目标
  const siegeTarget = findSiegeTarget(sectId);

  if (state.resources > 300 && siegeTarget) {
    return { type: 'siege', label: `发兵攻打${siegeTarget.locationName}` };
  }
  if (state.stability < 50) {
    return { type: 'stabilize', label: '整肃内务，稳定门派人心' };
  }
  if (state.resources < 150) {
    return { type: 'gather', label: '广征资源，充实门派库房' };
  }
  return { type: 'develop', label: '休养生息，培养弟子' };
}

/** 寻找可攻击的相邻敌对目标 */
function findSiegeTarget(sectId: SectId): { locationId: LocationId; locationName: string; defenderSect: SectId; defenderName: string } | null {
  const p = getPlayer();
  const tc = p.territoryControl ?? {};

  // 找到该门派的据点
  const bases = Object.entries(SECT_BASES)
    .filter(([, s]) => s === sectId)
    .map(([loc]) => loc as LocationId);

  for (const base of bases) {
    const baseData = WORLD_MAP[base];
    if (!baseData) continue;

    for (const connId of baseData.connections) {
      const controller = getLocationController(connId);
      if (controller === 'none' || controller === sectId) continue;

      const locData = WORLD_MAP[connId];
      if (!locData) continue;

      return {
        locationId: connId,
        locationName: locData.name,
        defenderSect: controller,
        defenderName: SECTS[controller]?.name ?? controller,
      };
    }
  }
  return null;
}

/**
 * 获取议事上下文（掌门 + 长老列表）。
 */
export function getCouncilContext(sectId: SectId): CouncilContext {
  const p = getPlayer();
  const db = p.npcDatabase ?? {};

  const leaderId = SECT_LEADER_ID[sectId] ?? '';
  const leaderNpc = db[leaderId];
  const sectBaseName = SECTS[sectId]?.name ?? sectId;
  const leaderName = leaderNpc?.name ?? (sectBaseName + '掌门');
  const leaderPortrait = leaderNpc
    ? `picture/NPC/${sectId}/${leaderId}.png`
    : '';

  // 选3-4名长老（同门派、高等级，排除掌门）
  const sectNpcs = Object.values(db)
    .filter(n => n.sect === sectId && n.id !== leaderId)
    .sort((a, b) => b.level - a.level)
    .slice(0, 4);

  const elderNpcs = sectNpcs.map(n => ({
    id: n.id,
    name: n.name,
    portrait: `picture/NPC/${sectId}/${n.id}.png`,
  }));

  const proposal = generateCouncilProposal(sectId);
  const ctx: CouncilContext = {
    proposal,
    sectId,
    sectName: SECTS[sectId]?.name ?? sectId,
    leaderName,
    leaderPortrait,
    elderNpcs,
  };

  if (proposal.type === 'siege') {
    const target = findSiegeTarget(sectId);
    if (target) ctx.siegeTarget = target;
  }

  return ctx;
}

/** 获取某门派的掌门 NPC ID */
export function getSectLeaderId(sectId: SectId): string {
  return SECT_LEADER_ID[sectId] ?? '';
}

/** 获取所有门派据点 */
export function getSectBases(): Partial<Record<LocationId, SectId>> {
  return SECT_BASES;
}

/** 检查某地点是否为门派据点 */
export function isSectBase(locationId: LocationId): SectId | undefined {
  return SECT_BASES[locationId];
}

// ──── 攻城消耗 ────

/** 攻城资源消耗：attacker -100 */
export function spendSiegeCost(sectId: SectId): void {
  updateSectState(sectId, { resources: -100 });
}

/** 攻城结果影响门派状态 */
export function applySiegeResult(
  attacker: SectId, defender: SectId, attackerWin: boolean,
): void {
  if (attackerWin) {
    updateSectState(attacker, { stability: 10 });
    updateSectState(defender, { stability: -15 });
  } else {
    updateSectState(attacker, { stability: -10 });
    updateSectState(defender, { stability: 5 });
  }
}

// ──── 议事结果执行 ────

export interface CouncilResult {
  type: CouncilProposal['type'];
  effectText: string;
  /** 是否需要进入战斗（仅 siege） */
  enterBattle?: boolean;
  battleContext?: {
    attackerSect: SectId;
    defenderSect: SectId;
    targetLocation: LocationId;
  };
}

/**
 * 执行议事议案（掌门决策）。
 * @param proposal 议案
 * @param playerChoice 玩家选择：'follow' | 'support' | 'object' | 'volunteer'
 * @returns 执行结果
 */
export function executeCouncilDecision(
  proposal: CouncilProposal, sectId: SectId,
  playerChoice: 'follow' | 'support' | 'object' | 'volunteer',
): CouncilResult {
  const state = getSectState(sectId);
  const isVolunteer = playerChoice === 'volunteer';
  const multiplier = isVolunteer ? 1.5 : 1.0;

  switch (proposal.type) {
    case 'siege': {
      const target = findSiegeTarget(sectId);
      if (!target) {
        // 找不到目标，降级为发展
        return executeCouncilDecision({ type: 'develop', label: '发展门派' }, sectId, playerChoice);
      }
      // 攻城行为由 CouncilScreen 触发 playerJoinSiege
      return {
        type: 'siege',
        effectText: isVolunteer
          ? `你主动请缨，率队攻打${target.locationName}！`
          : `掌门决定攻打${target.locationName}，已选出4名弟子。`,
        enterBattle: true,
        battleContext: {
          attackerSect: sectId,
          defenderSect: target.defenderSect,
          targetLocation: target.locationId,
        },
      };
    }
    case 'stabilize': {
      const baseGain = 15 + Math.floor(Math.random() * 11); // 15-25
      const gain = Math.floor(baseGain * multiplier);
      updateSectState(sectId, { stability: gain });
      return {
        type: 'stabilize',
        effectText: isVolunteer
          ? `你亲自带队整肃内务，门派稳定度 +${gain}！`
          : `掌门下令整肃内务，门派稳定度 +${gain}。`,
      };
    }
    case 'gather': {
      const baseGain = 50 + Math.floor(Math.random() * 51); // 50-100
      const gain = Math.floor(baseGain * multiplier);
      updateSectState(sectId, { resources: gain });
      return {
        type: 'gather',
        effectText: isVolunteer
          ? `你亲自带队征收资源，门派资源 +${gain}！`
          : `掌门下令广征资源，门派资源 +${gain}。`,
      };
    }
    case 'develop': {
      const rGain = Math.floor(20 * multiplier);
      const sGain = Math.floor(5 * multiplier);
      updateSectState(sectId, { resources: rGain, stability: sGain });
      return {
        type: 'develop',
        effectText: isVolunteer
          ? `你亲自督促弟子修炼，资源 +${rGain}，稳定度 +${sGain}！`
          : `门派休养生息，资源 +${rGain}，稳定度 +${sGain}。`,
      };
    }
  }
}
