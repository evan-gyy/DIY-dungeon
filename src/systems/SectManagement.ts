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
  wudang: 'supreme', shaolin: 'supreme',
  emei: 'first_rate', beggar: 'first_rate', quanzhen: 'first_rate',
  kunlun: 'first_rate', tangmen: 'first_rate', riyue: 'first_rate',
  huashan: 'second_rate', kongtong: 'second_rate', qingcheng: 'second_rate',
  diancang: 'second_rate', tiezhang: 'second_rate',
  maoshan: 'fringe', wudu: 'fringe', xuedao: 'fringe', haisha: 'fringe',
  xiaoyao: 'special', demon: 'special',
  imperial_court: 'supreme', rebels: 'first_rate',
  none: 'second_rate',
};

// ──── 初始值 ────

const INITIAL_SECT_STATE: Record<SectTier, SectStateData> = {
  supreme:     { resources: 500, stability: 70, prosperity: 50 },
  first_rate:  { resources: 350, stability: 60, prosperity: 40 },
  second_rate: { resources: 200, stability: 50, prosperity: 30 },
  fringe:      { resources: 100, stability: 40, prosperity: 15 },
  special:     { resources: 300, stability: 45, prosperity: 25 },
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
  imperial_court: 'prime_minister',
  rebels: 'zhao_qinwei',
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
  return p.sectState?.[sectId] ?? { resources: 200, stability: 50, prosperity: 30 };
}

/** 更新某门派的状态 */
export function updateSectState(sectId: SectId, delta: Partial<SectStateData>): void {
  const p = getPlayer();
  const current = getSectState(sectId);
  const updated = {
    resources: Math.max(0, Math.min(1000, current.resources + (delta.resources ?? 0))),
    stability: Math.max(0, Math.min(100, current.stability + (delta.stability ?? 0))),
    prosperity: Math.max(0, Math.min(100, (current.prosperity ?? 30) + (delta.prosperity ?? 0))),
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

    // 🆕 P7 繁荣度自然增长
    const pGain = 2 + Math.floor(Math.random() * 4); // +2~5/月
    const currentProsperity = (current as any).prosperity ?? 30;

    updated[sectId] = {
      resources: Math.max(0, Math.min(1000, current.resources + rGain)),
      stability: Math.max(0, Math.min(100, current.stability - sDecay)),
      prosperity: Math.max(0, Math.min(100, currentProsperity + pGain)),
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
export const SECT_BASES: Partial<Record<LocationId, SectId>> = {
  wudang_mountain: 'wudang', shaolin_temple: 'shaolin', emei_mountain: 'emei',
  beggar_hq: 'beggar', maoshan_daoyuan: 'maoshan', kunlun_mountain: 'kunlun',
  qingcheng_mountain: 'qingcheng', tangmen_estate: 'tangmen', xiaoyao_valley: 'xiaoyao',
  zhongnan_mountain: 'quanzhen', kongtong_mountain: 'kongtong', diancang_mountain: 'diancang',
  huashan_base: 'huashan', heimu_cliff: 'riyue',
  kaifeng_city: 'imperial_court', yanjing_city: 'rebels',
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

// ──── P7 势力力量值 ────

/** 城市力量加成 */
const CITY_POWER_BONUS: Partial<Record<LocationId, number>> = {
  kaifeng_city: 200, changan_city: 200, luoyang_city: 200,
  xiangyang_city: 100, chengdu_city: 100, yangzhou_city: 100,
  jiangling_city: 50, suzhou_city: 50, hangzhou_city: 50,
  dali_city: 50, jiangzhou_city: 50, tanzhou_city: 50,
  guangzhou_city: 50, wuchang_city: 50, chongqing_city: 50,
  mingzhou_city: 50, liangzhou_city: 50, fuzhou_city: 50,
  yanjing_city: 50, taiyuan_city: 50, jinling_city: 50,
};

/** 宗门据点力量加成 */
const SECT_BASE_BONUS: Record<SectTier, number> = {
  supreme: 150, first_rate: 100, second_rate: 50, fringe: 25, special: 75,
};

/**
 * 计算某个势力的综合力量值。
 * sectPower = territories * 100 + resources * 0.5 + stability * 2
 *           + prosperity * 3 + totalDiscipleLevels * 0.1 + cityBonuses
 */
export function computeSectPower(sectId: SectId): number {
  const p = getPlayer();
  if (sectId === 'none') return 0;

  const state = getSectState(sectId);
  const tier = SECT_TIERS[sectId] ?? 'second_rate';
  const tc = (p.territoryControl ?? {}) as Record<string, string>;

  // 领土数量
  let territoryCount = 0;
  let cityBonus = 0;
  for (const [locId, controller] of Object.entries(tc)) {
    if (controller === sectId) {
      territoryCount++;
      cityBonus += CITY_POWER_BONUS[locId as LocationId] ?? 0;
    }
  }

  // 门派据点加成
  for (const [locId, ownerSect] of Object.entries(SECT_BASES)) {
    if (ownerSect === sectId) {
      cityBonus += SECT_BASE_BONUS[tier] ?? 50;
    }
  }

  // NPC 总等级加成
  const npcDb = p.npcDatabase ?? {};
  let totalLevels = 0;
  for (const npc of Object.values(npcDb)) {
    if (npc.sect === sectId) totalLevels += npc.level;
  }

  const power =
    territoryCount * 100 +
    state.resources * 0.5 +
    state.stability * 2 +
    (state.prosperity ?? 30) * 3 +
    totalLevels * 0.1 +
    cityBonus;

  return Math.floor(power);
}

/** 计算所有势力的力量值并缓存 */
export function refreshAllSectPower(): Record<string, number> {
  const powers: Record<string, number> = {};
  for (const sectId of Object.keys(SECTS) as SectId[]) {
    if (sectId === 'none') continue;
    powers[sectId] = computeSectPower(sectId);
  }
  const p = getPlayer();
  setPlayer({ ...p, sectPower: powers } as any);
  return powers;
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
  playerChoice: 'follow' | 'support' | 'object' | 'volunteer' | 'delegate',
): CouncilResult {
  const state = getSectState(sectId);
  const isVolunteer = playerChoice === 'volunteer';
  const isDelegate = playerChoice === 'delegate';
  const multiplier = isVolunteer ? 1.5 : isDelegate ? 1.2 : 1.0;

  switch (proposal.type) {
    case 'siege': {
      const target = findSiegeTarget(sectId);
      if (!target) {
        return executeCouncilDecision({ type: 'develop', label: '发展门派' }, sectId, playerChoice);
      }
      return {
        type: 'siege',
        effectText: isVolunteer
          ? `你主动请缨，率队攻打${target.locationName}！`
          : isDelegate
            ? `你令随从带队攻打${target.locationName}，自己在后方督战。`
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

// ═════════════════════════════════════════════════════════
//  统一据点系统（三国志式：城市 + 门派 = 同一属性框架）
// ═════════════════════════════════════════════════════════

import type { SettlementAttributes } from '../data/sandboxTypes';
import { CITY_DEFAULTS, SECT_SETTLEMENT_DEFAULTS, SECT_TIER_TO_SETTLEMENT, SETTLEMENT_MONTHLY_TICK } from '../data/sandboxTypes';

/** 已知城市的地点 ID 及等级 */
const CITY_CONFIGS: Record<string, 'capital' | 'major' | 'minor'> = {
  kaifeng_city: 'capital',
  changan_city: 'capital',
  luoyang_city: 'capital',
  xiangyang_city: 'major',
  chengdu_city: 'major',
  yangzhou_city: 'major',
  jiangling_city: 'major',
  suzhou_city: 'major',
  hangzhou_city: 'major',
  dali_city: 'major',
  yanjing_city: 'major',
  fuzhou_city: 'major',
  quanzhou_city: 'major',
  guangzhou_city: 'major',
  // fallback: minor
};

/**
 * 初始化所有据点的属性（城市 + 门派基地）。
 * 在新游戏或加载旧档缺少 settlementState 时调用。
 */
export function initSettlements(): void {
  const p = getPlayer();
  const settlements: Record<string, SettlementAttributes> = { ...(p.settlementState ?? {}) };

  // ── 城市 ──
  for (const locId of Object.keys(WORLD_MAP) as LocationId[]) {
    if (isSectBase(locId) !== undefined) continue; // 跳过门派据点
    const tier = CITY_CONFIGS[locId] ?? 'minor';
    const def = CITY_DEFAULTS[tier];
    if (!def) continue;
    // 仅在不存在时初始化
    if (!settlements[locId]) {
      settlements[locId] = {
        ...def,
        // 微 randomization（±10%）
        population: clamp(def.population + randPct(), 0, 100),
        prosperity: clamp(def.prosperity + randPct(), 0, 100),
        commerce: clamp(def.commerce + randPct(), 0, 100),
        agriculture: clamp(def.agriculture + randPct(), 0, 100),
        garrison: clamp(def.garrison + randPct(), 0, 100),
        fortification: clamp(def.fortification + randPct(), 0, 100),
        publicOrder: clamp(def.publicOrder + randPct(), 0, 100),
        development: clamp(def.development + randPct(), 0, 100),
        martialArts: 0,
        academy: clamp(def.academy + randPct(), 0, 100),
        cityRank: tier,
      };
    }
  }

  // ── 门派据点 ──
  for (const locId of Object.keys(WORLD_MAP) as LocationId[]) {
    const sectId = isSectBase(locId);
    if (sectId === undefined) continue;
    const tier = SECT_TIERS[sectId] ?? 'second_rate';
    const tierKey = SECT_TIER_TO_SETTLEMENT[tier] ?? 'second_rate';
    const def = SECT_SETTLEMENT_DEFAULTS[tierKey];
    if (!def) continue;
    if (!settlements[locId]) {
      settlements[locId] = {
        ...def,
        population: clamp(def.population + randPct(), 0, 100),
        prosperity: clamp(def.prosperity + randPct(), 0, 100),
        commerce: clamp(def.commerce + randPct(), 0, 100),
        agriculture: clamp(def.agriculture + randPct(), 0, 100),
        garrison: clamp(def.garrison + randPct(), 0, 100),
        fortification: clamp(def.fortification + randPct(), 0, 100),
        publicOrder: clamp(def.publicOrder + randPct(), 0, 100),
        development: clamp(def.development + randPct(), 0, 100),
        martialArts: clamp(def.martialArts + randPct(), 0, 100),
        academy: clamp(def.academy + randPct(), 0, 100),
      };
    }
  }

  setPlayer({ ...p, settlementState: settlements });
}

/** 每月据点自然增长 */
export function tickSettlements(): void {
  const p = getPlayer();
  const settlements = { ...(p.settlementState ?? {}) };
  if (Object.keys(settlements).length === 0) return;

  for (const [locId, s] of Object.entries(settlements)) {
    const updated = { ...s };
    // 治安低于 30 → 繁荣度下降
    if (s.publicOrder < 30) {
      updated.prosperity = Math.max(0, s.prosperity - 3);
      updated.publicOrder = Math.min(100, s.publicOrder + 2); // 自然回升
    } else {
      // 正常增长
      updated.prosperity = Math.min(100, s.prosperity + (SETTLEMENT_MONTHLY_TICK.prosperity ?? 2));
      updated.commerce = Math.min(100, s.commerce + (SETTLEMENT_MONTHLY_TICK.commerce ?? 1));
      updated.agriculture = Math.min(100, s.agriculture + (SETTLEMENT_MONTHLY_TICK.agriculture ?? 1));
      updated.publicOrder = Math.min(100, s.publicOrder + (SETTLEMENT_MONTHLY_TICK.publicOrder ?? 1));
    }
    // 发展值受人口上限约束
    updated.development = Math.min(100, s.development + (SETTLEMENT_MONTHLY_TICK.development ?? 1));
    // 商业和农业受人口基础约束
    updated.population = Math.min(100, s.population + Math.floor(s.agriculture / 20));

    settlements[locId] = updated;
  }

  setPlayer({ ...p, settlementState: settlements });
}

/** 获取某个地点的据点属性 */
export function getSettlement(locationId: LocationId): SettlementAttributes | undefined {
  const p = getPlayer();
  if (!p.settlementState) return undefined;
  return p.settlementState[locationId];
}

/** 获取某个门派的据点属性（自动找门派基地位置） */
export function getSectSettlement(sectId: SectId): SettlementAttributes | undefined {
  for (const locId of Object.keys(WORLD_MAP) as LocationId[]) {
    if (isSectBase(locId) === sectId) {
      return getSettlement(locId);
    }
  }
  return undefined;
}

/** 更新据点属性 */
export function updateSettlement(
  locationId: LocationId,
  delta: Partial<SettlementAttributes>,
): void {
  const p = getPlayer();
  const settlements = { ...(p.settlementState ?? {}) };
  const current = settlements[locationId];
  if (!current) return;
  settlements[locationId] = {
    ...current,
    population: clamp((current.population ?? 30) + (delta.population ?? 0), 0, 100),
    prosperity: clamp((current.prosperity ?? 30) + (delta.prosperity ?? 0), 0, 100),
    commerce: clamp((current.commerce ?? 25) + (delta.commerce ?? 0), 0, 100),
    agriculture: clamp((current.agriculture ?? 30) + (delta.agriculture ?? 0), 0, 100),
    garrison: clamp((current.garrison ?? 20) + (delta.garrison ?? 0), 0, 100),
    fortification: clamp((current.fortification ?? 20) + (delta.fortification ?? 0), 0, 100),
    publicOrder: clamp((current.publicOrder ?? 50) + (delta.publicOrder ?? 0), 0, 100),
    development: clamp((current.development ?? 15) + (delta.development ?? 0), 0, 100),
    martialArts: clamp((current.martialArts ?? 0) + (delta.martialArts ?? 0), 0, 100),
    academy: clamp((current.academy ?? 15) + (delta.academy ?? 0), 0, 100),
  };
  setPlayer({ ...p, settlementState: settlements });
}

/** 辅助：±5 随机浮动 */
function randPct(): number { return Math.floor(Math.random() * 11) - 5; }
/** 辅助：钳制值到 [min, max] */
function clamp(v: number, min: number, max: number): number { return Math.max(min, Math.min(max, v)); }
