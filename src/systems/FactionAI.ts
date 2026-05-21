// ============================================================
//  src/systems/FactionAI.ts — AI 势力议事引擎 v2
// ============================================================
//  每月初所有 AI 势力召开"议事"，产出多条 FactionDirective：
//  1. 评估自身状态（resources/stability/prosperity/领土）
//  2. 按需生成指令（攻城/经商/外交/发展/守备/侦察）
//  3. 指令存入 factionDirectives 池，等待 NPC 认领
//  4. NPC 按 属性匹配度 + 官阶 + 志向 选择指令执行
//  5. 晋升机制：贡献达标 + 势力内属性排前 X% → 升阶
// ============================================================

import type { SectId } from '../data/types';
import type { LocationId } from '../data/worldMap';
import { WORLD_MAP } from '../data/worldMap';
import type {
  FactionDirective,
  FactionDirectiveType,
  FactionOfficial,
  FactionOfficialRank,
} from '../data/sandboxTypes';
import {
  FACTION_RANK_ORDER,
  FACTION_RANK_CONFIGS,
  DIRECTIVE_LABEL,
  DIRECTIVE_BASE_COUNT,
  DIRECTIVE_PER_TERRITORY,
  DIRECTIVE_MAX,
  DIRECTIVE_EXPIRE_MONTHS,
  DIRECTIVE_MIN_RANK,
  COMBAT_STAT_LABEL,
  COURT_STAT_LABEL,
} from '../data/sandboxTypes';
import { SECTS } from '../data/sects';
import { FACTION_DEFS } from '../data/sandboxTypes';
import { getPlayer, setPlayer } from '../state/GameState';
import { getSectState, updateSectState, computeSectPower, isSectBase } from './SectManagement';
import { getFactionTrust, getFactionRelation, modifyFactionTrust } from './FactionSystem';
import { getLocationController } from './FactionWarfare';
import { grantNpcStatExp } from './ActionSystem';

// ──── 指令模板 ────

interface DirectiveTemplate {
  type: FactionDirectiveType;
  /** 权重驱动条件（任一满足即可生成） */
  drivers: Array<{
    condition: (factionId: SectId) => boolean;
    weight: number; // 1=低优 3=高优
  }>;
  statAffinity: { atk: number; def: number; agi: number; crit: number };
  /** 朝廷属性亲密度（江湖轨任务使用） */
  courtAffinity?: { strategy: number; eloquence: number; charisma: number; scholarship: number };
  baseProgress: number;
  rewardDesc: string;
  /** 目标选择器 */
  pickTarget: (factionId: SectId) => { locationId?: LocationId; targetSect?: SectId } | null;
  /** 轨道：military=军务轨, jianghu=江湖轨 */
  track: 'military' | 'jianghu';
}

// ──── 报告 ────

export interface AITickReport {
  sectId: SectId;
  sectName: string;
  directivesCreated: number;
  directivesCompleted: number;
  promotions: string[];
}

// ═══════════════════════════════════════════════════════
//  主入口：势力议事
// ═══════════════════════════════════════════════════════

export function factionAITick(): AITickReport[] {
  const p = getPlayer();
  const reports: AITickReport[] = [];
  const currentMonth = p.gameMonth ?? 1;

  const allDirectives: Record<string, FactionDirective[]> = {};
  for (const [k, v] of Object.entries(p.factionDirectives ?? {})) {
    allDirectives[k] = (v as Array<Record<string, unknown>>).map(d => ({ ...d, type: d.type as FactionDirectiveType })) as FactionDirective[];
  }
  const allOfficials: Record<string, FactionOfficial> = {};
  for (const [k, v] of Object.entries(p.factionOfficials ?? {})) {
    allOfficials[k] = { ...(v as Record<string, unknown>), rank: (v as Record<string, unknown>).rank as FactionOfficialRank } as FactionOfficial;
  }

  // 初始化所有 NPC 的政务记录（新 NPC 默认为 retainer）
  if (p.npcDatabase) {
    for (const [npcId, npc] of Object.entries(p.npcDatabase)) {
      if (npc.sect === 'none') continue;
      if (allOfficials[npcId]) continue;
      allOfficials[npcId] = {
        npcId,
        factionId: npc.sect,
        rank: 'retainer',
        contribution: 0,
        directivesDoneThisMonth: 0,
      };
    }
  }

  // ── Phase 1: 清理过期指令 ──
  for (const factionId of Object.keys(allDirectives)) {
    allDirectives[factionId] = allDirectives[factionId]!.filter(
      d => d.createdAtMonth + d.expiresAtMonth > currentMonth && !d.completed
    );
  }

  // ── Phase 2: NPC 执行已认领的指令（推进度） ──
  const completedThisMonth = executeDirectiveProgress(allDirectives, allOfficials, currentMonth);

  // ── Phase 3: 晋升检查 ──
  const promotions: string[] = [];
  for (const [npcId, official] of Object.entries(allOfficials)) {
    const result = tryPromoteOfficial(npcId, official, allOfficials);
    if (result) {
      allOfficials[npcId] = result;
      promotions.push(result.npcId);
    }
  }

  // ── Phase 4: 每个势力议事 → 生成新指令 ──
  for (const sectId of Object.keys(SECTS) as SectId[]) {
    if (sectId === 'none') continue;
    const state = getSectState(sectId);
    if (!state || state.resources <= 0) continue;

    const existing = allDirectives[sectId] ?? [];
    const budget = Math.min(DIRECTIVE_MAX, DIRECTIVE_BASE_COUNT + countTerritories(sectId) * DIRECTIVE_PER_TERRITORY);
    const remaining = Math.max(0, budget - existing.length);

    let created = 0;
    if (remaining > 0) {
      const newDirectives = factionCouncil(sectId, remaining, currentMonth);
      for (const d of newDirectives) {
        existing.push(d);
        created++;
      }
    }

    allDirectives[sectId] = existing;

    reports.push({
      sectId,
      sectName: SECTS[sectId]?.name ?? sectId,
      directivesCreated: created,
      directivesCompleted: completedThisMonth.filter(d => d.factionId === sectId).length,
      promotions: promotions.filter(pid => allOfficials[pid]?.factionId === sectId).map(pid => allOfficials[pid]!.rank),
    });
  }

  // ── Phase 5: 重置每月计数器 ──
  for (const o of Object.values(allOfficials)) {
    o.directivesDoneThisMonth = 0;
  }

  setPlayer({
    ...getPlayer(),
    factionDirectives: allDirectives,
    factionOfficials: allOfficials,
  });

  return reports;
}

// ═══════════════════════════════════════════════════════
//  NPC 执行指令进度
// ═══════════════════════════════════════════════════════

function executeDirectiveProgress(
  allDirectives: Record<string, FactionDirective[]>,
  allOfficials: Record<string, FactionOfficial>,
  currentMonth: number,
): FactionDirective[] {
  const p = getPlayer();
  const db = p.npcDatabase ?? {};
  const completed: FactionDirective[] = [];

  for (const directives of Object.values(allDirectives)) {
    for (const d of directives) {
      if (d.completed || !d.assignedNpcId) continue;

      const npc = db[d.assignedNpcId];
      const official = allOfficials[d.assignedNpcId];
      if (!npc || !official) {
        d.assignedNpcId = undefined;
        continue;
      }

      // 检查官阶是否足够
      const minRank = DIRECTIVE_MIN_RANK[d.type] ?? 'steward';
      const currentTier = FACTION_RANK_CONFIGS[official.rank]?.tier ?? 0;
      const minTier = FACTION_RANK_CONFIGS[minRank]?.tier ?? 1;
      if (currentTier < minTier) {
        d.assignedNpcId = undefined;
        continue;
      }

      // 检查每月指令配额
      const maxDirectives = FACTION_RANK_CONFIGS[official.rank]?.maxDirectives ?? 0;
      if (official.directivesDoneThisMonth >= maxDirectives && maxDirectives > 0) {
        continue;
      }

      // 进度计算：NPC 属性 × 指令属性亲密度（含朝廷属性）
      let progress = computeNpcDirectiveProgress(npc, d);

      // 中途随机事件（25% 概率/月）
      if (Math.random() < 0.25) {
        const event = rollDirectiveEvent(npc, d);
        if (event) {
          progress = Math.floor(progress * event.progressMult);
          // 事件记录到 NPC 近期经历
          if (npc.recentLog && event.description) {
            npc.recentLog = [...(npc.recentLog.slice(-19) ?? []), event.description];
          }
        }
      }

      d.currentProgress = Math.min(d.progressNeeded, d.currentProgress + progress);
      official.directivesDoneThisMonth++;

      // 如果完成 → 结算
      if (d.currentProgress >= d.progressNeeded) {
        d.completed = true;
        settleDirective(d, npc.id);
        completed.push(d);
      }
    }
  }

  return completed;
}

/** NPC 属性 × 指令属性亲密度 = 单月进度 */
function computeNpcDirectiveProgress(
  npc: { atk: number; def: number; agi: number; crit: number; courtStats?: { strategy: number; eloquence: number; charisma: number; scholarship: number } },
  d: FactionDirective,
): number {
  // 战斗四维亲和
  let total = npc.atk * d.statAffinity.atk
    + npc.def * d.statAffinity.def
    + npc.agi * d.statAffinity.agi
    + npc.crit * d.statAffinity.crit;

  // 朝廷属性亲和（江湖轨任务使用）
  if (d.courtAffinity && npc.courtStats) {
    total += (npc.courtStats.strategy ?? 10) * (d.courtAffinity.strategy ?? 0)
      + (npc.courtStats.eloquence ?? 10) * (d.courtAffinity.eloquence ?? 0)
      + (npc.courtStats.charisma ?? 10) * (d.courtAffinity.charisma ?? 0)
      + (npc.courtStats.scholarship ?? 10) * (d.courtAffinity.scholarship ?? 0);
  }

  return Math.max(1, Math.floor(total / 10));
}

// ──── 任务中途随机事件 ────

interface DirectiveEvent {
  /** 事件描述文本 */
  description: string;
  /** 进度倍率（1.0=不变, 1.2=加速20%, 0.8=减速20%） */
  progressMult: number;
}

function rollDirectiveEvent(
  npc: { name: string; atk: number; def: number; agi: number; crit: number; courtStats?: { strategy: number; eloquence: number; charisma: number; scholarship: number } },
  d: FactionDirective,
): DirectiveEvent | null {
  const roll = Math.random();

  // 主角 stat (找到最高亲和属性)
  let primaryStat = d.statAffinity.atk >= Math.max(d.statAffinity.def, d.statAffinity.agi, d.statAffinity.crit) ? npc.atk
    : d.statAffinity.def >= Math.max(d.statAffinity.atk, d.statAffinity.agi, d.statAffinity.crit) ? npc.def
    : d.statAffinity.agi >= Math.max(d.statAffinity.atk, d.statAffinity.def, d.statAffinity.crit) ? npc.agi
    : npc.crit;
  const statCheck = primaryStat >= 30;

  if (roll < 0.33) {
    // 发现捷径：运气好，事半功倍
    return {
      description: `${npc.name}在执行「${d.label}」时发现捷径，进度大进。`,
      progressMult: 1.2 + Math.random() * 0.3, // 1.2~1.5
    };
  } else if (roll < 0.66) {
    // 遭遇阻碍：需要属性检定
    if (statCheck) {
      return {
        description: `${npc.name}在执行「${d.label}」时遭遇阻碍，但凭实力化解。`,
        progressMult: 1.0, // 无损失（属性够高）
      };
    } else {
      return {
        description: `${npc.name}在执行「${d.label}」时遇到麻烦，进度受阻。`,
        progressMult: 0.6 + Math.random() * 0.2, // 0.6~0.8（属性不足）
      };
    }
  } else {
    // 获得盟友：路人相助
    const helper = getRandomFactionNpc(d.factionId, d.assignedNpcId);
    if (helper) {
      return {
        description: `${npc.name}在执行「${d.label}」时得${helper}相助，效率大增。`,
        progressMult: 1.3 + Math.random() * 0.3, // 1.3~1.6
      };
    }
    return {
      description: `${npc.name}在执行「${d.label}」时略有波折，但无大碍。`,
      progressMult: 0.9,
    };
  }
}

/** 在势力中随机找一个 NPC（排除自己），用于"获得盟友"事件 */
function getRandomFactionNpc(factionId: string, excludeId?: string): string | null {
  const p = getPlayer();
  if (!p.npcDatabase) return null;
  const candidates = Object.values(p.npcDatabase).filter(
    n => n.sect === factionId && n.id !== excludeId,
  );
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)]!.name;
}

/** 指令完成后的势力结算 */
function settleDirective(d: FactionDirective, npcId: string): void {
  const p = getPlayer();
  const allOfficials = { ...(p.factionOfficials ?? {}) };
  const npc = p.npcDatabase?.[npcId];

  switch (d.type) {
    case 'siege': {
      // 攻城：调用完整攻城模拟（含三波战斗+新闻+日志+领土变更）
      if (d.targetSect && d.targetLocation) {
        import('./FactionWarfare').then(m => {
          m.tryTriggerSiegeForCouncil(
            d.factionId as SectId,
            d.targetSect as SectId,
            d.targetLocation as import('../data/worldMap').LocationId,
          );
        });
      }
      break;
    }
    case 'trade': {
      const gain = 30 + Math.floor(Math.random() * 41);
      updateSectState(d.factionId, { resources: gain, prosperity: 3 });
      break;
    }
    case 'diplomacy': {
      if (d.targetSect) {
        modifyFactionTrust(d.factionId, d.targetSect, 8, 'NPC外交');
      }
      break;
    }
    case 'develop': {
      updateSectState(d.factionId, { resources: 15, stability: 5, prosperity: 8 });
      break;
    }
    case 'patrol': {
      updateSectState(d.factionId, { stability: 12 });
      break;
    }
    case 'scout': {
      if (d.targetSect) {
        modifyFactionTrust(d.factionId, d.targetSect, 3, '侦察情报');
      }
      break;
    }
  }

  // NPC 贡献度增加
  if (npc && allOfficials[npcId]) {
    const contribGain = 10 + Math.floor(Math.random() * 16); // 10-25
    allOfficials[npcId] = {
      ...allOfficials[npcId]!,
      contribution: (allOfficials[npcId]!.contribution ?? 0) + contribGain,
    };
    setPlayer({ ...getPlayer(), factionOfficials: allOfficials });
  }

  // ── 数值闭环：statExp 增长（学习-成长循环）──
  if (npc) {
    const difficulty = d.progressNeeded / 5;
    const result = grantNpcStatExp(
      npcId, d.statAffinity, d.courtAffinity, difficulty,
    );
    if (result && (result.combat.length > 0 || result.court.length > 0)) {
      const parts: string[] = [];
      for (const s of result.combat) {
        parts.push(`${COMBAT_STAT_LABEL[s]}+1`);
      }
      for (const s of result.court) {
        parts.push(`${COURT_STAT_LABEL[s]}+1`);
      }
      if (npc.recentLog) {
        npc.recentLog = [...(npc.recentLog.slice(-19) ?? []), `📈 ${parts.join('，')}`];
      }
    }
  }

  // ── 江湖轨结算：个人奖励 ──
  switch (d.type) {
    case 'challenge': {
      addNpcExp(npcId, 30 + Math.floor(Math.random() * 41));
      addNpcReputation(npcId, 3 + Math.floor(Math.random() * 5));
      break;
    }
    case 'escort': {
      addNpcGold(npcId, 50 + Math.floor(Math.random() * 101));
      addNpcExp(npcId, 15 + Math.floor(Math.random() * 21));
      break;
    }
    case 'seek_doctor': {
      healNpc(npcId, 30 + Math.floor(Math.random() * 41));
      break;
    }
    case 'hunt_treasure': {
      addNpcExp(npcId, 40 + Math.floor(Math.random() * 61));
      addNpcReputation(npcId, 2 + Math.floor(Math.random() * 4));
      break;
    }
    case 'meditate': {
      addNpcExp(npcId, 50 + Math.floor(Math.random() * 71));
      break;
    }
    case 'arena': {
      addNpcReputation(npcId, 5 + Math.floor(Math.random() * 8));
      addNpcExp(npcId, 20 + Math.floor(Math.random() * 31));
      break;
    }
  }
}

// ═══════════════════════════════════════════════════════
//  议事：生成指令
// ═══════════════════════════════════════════════════════

const DIRECTIVE_TEMPLATES: DirectiveTemplate[] = [
  // ═══════════════════════════════════════════════════════
  //  军务轨（势力级战略指令）
  // ═══════════════════════════════════════════════════════
  {
    type: 'siege',
    track: 'military',
    drivers: [
      { condition: (f) => (getSectState(f)?.resources ?? 0) > 250, weight: 2 },
      { condition: (f) => hasHostileNeighbor(f), weight: 3 },
    ],
    statAffinity: { atk: 3, def: 2, agi: 0, crit: 1 },
    baseProgress: 100,
    rewardDesc: '使目标地点易主',
    pickTarget: (f) => {
      const target = findSiegeTarget(f);
      return target ? { locationId: target.locationId, targetSect: target.defenderSect } : null;
    },
  },
  {
    type: 'trade',
    track: 'military',
    drivers: [
      { condition: (f) => (getSectState(f)?.resources ?? 0) < 200, weight: 2 },
      { condition: (f) => (getSectState(f)?.prosperity ?? 30) < 40, weight: 1 },
    ],
    statAffinity: { atk: 0, def: 0, agi: 3, crit: 1 },
    baseProgress: 40,
    rewardDesc: '增加势力资源，提升繁荣度',
    pickTarget: (f) => {
      const cities = getTradeTargets(f);
      return cities.length > 0 ? { locationId: cities[Math.floor(Math.random() * cities.length)] } : null;
    },
  },
  {
    type: 'diplomacy',
    track: 'military',
    drivers: [
      { condition: (f) => hasNeutralNeighbor(f), weight: 1 },
      { condition: (f) => (getSectState(f)?.stability ?? 50) > 50, weight: 1 },
    ],
    statAffinity: { atk: 0, def: 0, agi: 2, crit: 2 },
    baseProgress: 50,
    rewardDesc: '改善目标势力信任',
    pickTarget: (f) => {
      const neutral = getNeutralNeighbors(f);
      return neutral.length > 0 ? { targetSect: neutral[Math.floor(Math.random() * neutral.length)] } : null;
    },
  },
  {
    type: 'develop',
    track: 'military',
    drivers: [
      { condition: () => true, weight: 1 },
    ],
    statAffinity: { atk: 0, def: 2, agi: 2, crit: 0 },
    baseProgress: 30,
    rewardDesc: '全面提升势力内政',
    pickTarget: () => null,
  },
  {
    type: 'patrol',
    track: 'military',
    drivers: [
      { condition: (f) => (getSectState(f)?.stability ?? 50) < 45, weight: 2 },
      { condition: (f) => (getSectState(f)?.prosperity ?? 30) > 40, weight: 1 },
    ],
    statAffinity: { atk: 2, def: 3, agi: 0, crit: 0 },
    baseProgress: 35,
    rewardDesc: '恢复势力稳定度',
    pickTarget: () => null,
  },
  {
    type: 'scout',
    track: 'military',
    drivers: [
      { condition: (f) => hasHostileNeighbor(f), weight: 2 },
    ],
    statAffinity: { atk: 0, def: 0, agi: 2, crit: 3 },
    baseProgress: 45,
    rewardDesc: '获取目标势力情报，微幅改善信任',
    pickTarget: (f) => {
      const hostile = getHostileNeighbors(f);
      return hostile.length > 0 ? { targetSect: hostile[Math.floor(Math.random() * hostile.length)] } : null;
    },
  },
  {
    type: 'recruit',
    track: 'military',
    drivers: [
      { condition: (f) => (getSectState(f)?.stability ?? 50) > 40, weight: 1 },
      { condition: (f) => (getSectState(f)?.resources ?? 0) > 100, weight: 1 },
    ],
    statAffinity: { atk: 0, def: 0, agi: 2, crit: 2 },
    courtAffinity: { strategy: 1, eloquence: 2, charisma: 3, scholarship: 1 },
    baseProgress: 50,
    rewardDesc: '说服散修加入势力或招募新弟子',
    pickTarget: (f) => {
      const p = getPlayer();
      const npcDb = p.npcDatabase ?? {};
      const rogueLocIds = new Set<string>();
      for (const npc of Object.values(npcDb)) {
        if (npc.isAlive !== false && npc.sect === 'none' && npc.currentLocationId) {
          rogueLocIds.add(npc.currentLocationId);
        }
      }
      const candidates = Array.from(rogueLocIds) as LocationId[];
      return candidates.length > 0
        ? { locationId: candidates[Math.floor(Math.random() * candidates.length)] }
        : { locationId: 'changan_city' };
    },
  },

  // ═══════════════════════════════════════════════════════
  //  江湖轨（个人历练任务）
  //  驱动力恒为 1（总是可选），NPC 按属性匹配度自选
  // ═══════════════════════════════════════════════════════
  {
    type: 'challenge',
    track: 'jianghu',
    drivers: [{ condition: () => true, weight: 1 }],
    statAffinity: { atk: 3, def: 0, agi: 1, crit: 1 },
    courtAffinity: { strategy: 0, eloquence: 0, charisma: 1, scholarship: 0 },
    baseProgress: 30,
    rewardDesc: '以武会友，提升声望与战斗经验',
    pickTarget: (f) => findChallengeTarget(f),
  },
  {
    type: 'escort',
    track: 'jianghu',
    drivers: [{ condition: () => true, weight: 1 }],
    statAffinity: { atk: 2, def: 2, agi: 1, crit: 0 },
    courtAffinity: { strategy: 0, eloquence: 0, charisma: 0, scholarship: 0 },
    baseProgress: 40,
    rewardDesc: '护送镖车安全抵达，赚取酬金',
    pickTarget: (f) => findCityTarget(f),
  },
  {
    type: 'seek_doctor',
    track: 'jianghu',
    drivers: [{ condition: () => true, weight: 1 }],
    statAffinity: { atk: 0, def: 0, agi: 1, crit: 1 },
    courtAffinity: { strategy: 0, eloquence: 0, charisma: 3, scholarship: 1 },
    baseProgress: 35,
    rewardDesc: '寻访名医，获得疗伤灵药或医道心得',
    pickTarget: (f) => findCityTarget(f),
  },
  {
    type: 'hunt_treasure',
    track: 'jianghu',
    drivers: [{ condition: () => true, weight: 1 }],
    statAffinity: { atk: 1, def: 0, agi: 3, crit: 1 },
    courtAffinity: { strategy: 1, eloquence: 0, charisma: 1, scholarship: 1 },
    baseProgress: 50,
    rewardDesc: '探索秘境，搜寻宝物功法',
    pickTarget: (f) => findDangerTarget(f),
  },
  {
    type: 'meditate',
    track: 'jianghu',
    drivers: [{ condition: () => true, weight: 1 }],
    statAffinity: { atk: 0, def: 2, agi: 0, crit: 1 },
    courtAffinity: { strategy: 1, eloquence: 0, charisma: 0, scholarship: 3 },
    baseProgress: 45,
    rewardDesc: '潜心悟道，提升修为与学识',
    pickTarget: () => null,
  },
  {
    type: 'arena',
    track: 'jianghu',
    drivers: [{ condition: () => true, weight: 1 }],
    statAffinity: { atk: 3, def: 1, agi: 0, crit: 2 },
    courtAffinity: { strategy: 0, eloquence: 1, charisma: 1, scholarship: 0 },
    baseProgress: 25,
    rewardDesc: '擂台守擂，扬名立万',
    pickTarget: (f) => findCityTarget(f),
  },
];

function factionCouncil(factionId: SectId, budget: number, currentMonth: number): FactionDirective[] {
  const directives: FactionDirective[] = [];
  let idCounter = 0;

  // 分离军务轨和江湖轨模板
  const militaryTemplates = DIRECTIVE_TEMPLATES.filter(t => t.track === 'military');
  const jianghuTemplates = DIRECTIVE_TEMPLATES.filter(t => t.track === 'jianghu');

  // ── 军务轨：按势力需求权重生成 ──
  const weighted: Array<{ template: DirectiveTemplate; weight: number }> = [];
  for (const t of militaryTemplates) {
    let totalWeight = 0;
    for (const driver of t.drivers) {
      if (driver.condition(factionId)) {
        totalWeight += driver.weight;
      }
    }
    if (totalWeight > 0) {
      weighted.push({ template: t, weight: totalWeight });
    }
  }

  // 军务预算：至少 1 条，最多 budget 条
  const militaryBudget = Math.max(1, budget);
  if (weighted.length > 0) {
    const totalWeight = weighted.reduce((s, w) => s + w.weight, 0);
    for (let i = 0; i < militaryBudget; i++) {
      let roll = Math.random() * totalWeight;
      let chosen: DirectiveTemplate | null = null;
      for (const w of weighted) {
        roll -= w.weight;
        if (roll <= 0) { chosen = w.template; break; }
      }
      if (!chosen) chosen = weighted[weighted.length - 1]!.template;

      directives.push(makeDirective(chosen, factionId, currentMonth, idCounter++));
    }
  }

  // ── 江湖轨：每个势力生成 1~3 条个人历练任务 ──
  const jianghuCount = 1 + Math.floor(Math.random() * 3); // 1-3
  if (jianghuTemplates.length > 0) {
    for (let i = 0; i < jianghuCount; i++) {
      const chosen = jianghuTemplates[Math.floor(Math.random() * jianghuTemplates.length)]!;
      directives.push(makeDirective(chosen, factionId, currentMonth, idCounter++));
    }
  }

  return directives;
}

/** 从模板生成一条 FactionDirective */
function makeDirective(
  chosen: DirectiveTemplate,
  factionId: SectId,
  currentMonth: number,
  counter: number,
): FactionDirective {
  const target = chosen.pickTarget(factionId);
  return {
    id: `${factionId}_directive_${currentMonth}_${counter}`,
    type: chosen.type,
    factionId,
    label: target
      ? `${DIRECTIVE_LABEL[chosen.type]}${target.locationId ? ' ' + (WORLD_MAP[target.locationId]?.name ?? '') : ''}`
      : DIRECTIVE_LABEL[chosen.type] ?? chosen.type,
    description: '',
    targetLocation: target?.locationId,
    targetSect: target?.targetSect,
    priority: Math.round(chosen.drivers.reduce((s, d) => s + (d.condition(factionId) ? d.weight : 0), 0)),
    statAffinity: { ...chosen.statAffinity },
    courtAffinity: chosen.courtAffinity ? { ...chosen.courtAffinity } : undefined,
    progressNeeded: chosen.baseProgress + Math.floor(Math.random() * 20),
    currentProgress: 0,
    completed: false,
    rewardDescription: chosen.rewardDesc,
    createdAtMonth: currentMonth,
    expiresAtMonth: DIRECTIVE_EXPIRE_MONTHS,
  };
}

// ═══════════════════════════════════════════════════════
//  晋升系统
// ═══════════════════════════════════════════════════════

/**
 * 尝试将 NPC 晋升到下一官阶。
 * 检查：贡献达标 + 属性在势力内排前 X%。
 * @returns 晋升后的 FactionOfficial，或 null（条件不满足）
 */
function tryPromoteOfficial(
  npcId: string,
  official: FactionOfficial,
  allOfficials: Record<string, FactionOfficial>,
): FactionOfficial | null {
  const p = getPlayer();
  const npc = p.npcDatabase?.[npcId];
  if (!npc) return null;

  const currentIdx = FACTION_RANK_ORDER.indexOf(official.rank);
  if (currentIdx >= FACTION_RANK_ORDER.length - 1) return null; // 已是最高阶

  const nextRank = FACTION_RANK_ORDER[currentIdx + 1]!;
  const config = FACTION_RANK_CONFIGS[nextRank];
  if (!config) return null;

  // Check 1: 贡献达标
  if (official.contribution < config.minContribution) return null;

  // Check 2: 属性在势力内排前 X%（相对排名，不用绝对值）
  for (const gate of config.statGates) {
    const percentile = computeStatPercentile(npcId, gate.stat, official.factionId);
    if (percentile > gate.topFraction) return null; // 不够格
  }

  // 晋升！
  return {
    ...official,
    rank: nextRank,
    contribution: official.contribution - config.minContribution, // 消耗贡献
  };
}

/**
 * 计算 NPC 某属性在势力内的排名百分比（0~1）。
 * 0 = 最高，1 = 最低。
 */
function computeStatPercentile(npcId: string, stat: 'atk' | 'def' | 'agi' | 'crit', factionId: SectId): number {
  const p = getPlayer();
  if (!p.npcDatabase) return 1;

  const npc = p.npcDatabase[npcId];
  if (!npc) return 1;

  const factionMembers = Object.values(p.npcDatabase).filter(n => n.sect === factionId);
  if (factionMembers.length <= 1) return 0; // 只有一个人，自动第一

  const npcStat = npc[stat];
  const betterCount = factionMembers.filter(n => n[stat] > npcStat).length;

  return betterCount / (factionMembers.length - 1); // 排除自己
}

// ═══════════════════════════════════════════════════════
//  指令认领（由 NPC 系统调用）
// ═══════════════════════════════════════════════════════

/**
 * 为指定 NPC 自动选择最佳的待领指令。
 * 匹配原则：NPC 属性 × 指令 statAffinity 的点积最高。
 * @returns 被认领的指令 ID，或 null（无可认领指令）
 */
export function claimBestDirective(npcId: string): string | null {
  const p = getPlayer();
  const npc = p.npcDatabase?.[npcId];
  const official = p.factionOfficials?.[npcId];
  if (!npc || !official || npc.sect === 'none') return null;

  const maxSlots = FACTION_RANK_CONFIGS[official.rank as FactionOfficialRank]?.maxDirectives ?? 0;
  if (maxSlots <= 0) return null;

  // 检查是否已满
  const currentClaimed = countClaimedDirectives(npcId, official.factionId);
  if (currentClaimed >= maxSlots) return null;

  const npcTier = FACTION_RANK_CONFIGS[official.rank as FactionOfficialRank]?.tier ?? 0;
  const pool = (p.factionDirectives?.[official.factionId] ?? [])
    .map(d => ({ ...d, type: d.type as FactionDirectiveType } as FactionDirective))
    .filter(d => {
      if (d.completed || d.assignedNpcId) return false;
      const minRank = DIRECTIVE_MIN_RANK[d.type] ?? 'steward';
      const minTier = FACTION_RANK_CONFIGS[minRank]?.tier ?? 1;
      return npcTier >= minTier;
    });
  if (pool.length === 0) return null;

  // 计算每条指令的匹配度（含朝廷属性亲和）
  let best: FactionDirective | null = null;
  let bestScore = -1;
  for (const d of pool) {
    let score =
      npc.atk * d.statAffinity.atk +
      npc.def * d.statAffinity.def +
      npc.agi * d.statAffinity.agi +
      npc.crit * d.statAffinity.crit;
    // 朝廷属性亲和（江湖轨任务）
    if (d.courtAffinity && npc.courtStats) {
      score += (npc.courtStats.strategy ?? 10) * (d.courtAffinity.strategy ?? 0)
        + (npc.courtStats.eloquence ?? 10) * (d.courtAffinity.eloquence ?? 0)
        + (npc.courtStats.charisma ?? 10) * (d.courtAffinity.charisma ?? 0)
        + (npc.courtStats.scholarship ?? 10) * (d.courtAffinity.scholarship ?? 0);
    }
    if (score > bestScore) {
      bestScore = score;
      best = d;
    }
  }

  if (best) {
    best.assignedNpcId = npcId;
    // 持久化
    const allDirectives = { ...(p.factionDirectives ?? {}) };
    const factionList = [...(allDirectives[official.factionId] ?? [])];
    const idx = factionList.findIndex(d => d.id === best!.id);
    if (idx >= 0) {
      factionList[idx] = best;
      allDirectives[official.factionId] = factionList;
      setPlayer({ ...p, factionDirectives: allDirectives });
    }
    return best.id;
  }

  return null;
}

function countClaimedDirectives(npcId: string, factionId: SectId): number {
  const p = getPlayer();
  return (p.factionDirectives?.[factionId] ?? [])
    .filter((d: Record<string, unknown>) => d.assignedNpcId === npcId && !d.completed)
    .length;
}

// ═══════════════════════════════════════════════════════
//  工具函数
// ═══════════════════════════════════════════════════════

function countTerritories(factionId: SectId): number {
  let count = 0;
  for (const locId of Object.keys(WORLD_MAP) as LocationId[]) {
    const owner = isSectBase(locId);
    if (owner === factionId) count++;
  }
  const p = getPlayer();
  const tc = (p.territoryControl ?? {}) as Record<string, string>;
  for (const controller of Object.values(tc)) {
    if (controller === factionId) count++;
  }
  return count;
}

function hasHostileNeighbor(factionId: SectId): boolean {
  return getHostileNeighbors(factionId).length > 0;
}

function getHostileNeighbors(factionId: SectId): SectId[] {
  const seen = new Set<SectId>();
  for (const base of getSectBases(factionId)) {
    for (const adj of WORLD_MAP[base]?.connections ?? []) {
      const controller = getAdjacentController(adj, factionId);
      if (controller && controller !== factionId && controller !== 'none') {
        const trust = getFactionTrust(factionId, controller);
        if (trust < 15) seen.add(controller);
      }
    }
  }
  return [...seen];
}

function hasNeutralNeighbor(factionId: SectId): boolean {
  return getNeutralNeighbors(factionId).length > 0;
}

function getNeutralNeighbors(factionId: SectId): SectId[] {
  const seen = new Set<SectId>();
  for (const base of getSectBases(factionId)) {
    for (const adj of WORLD_MAP[base]?.connections ?? []) {
      const controller = getAdjacentController(adj, factionId);
      if (controller && controller !== factionId && controller !== 'none') {
        const trust = getFactionTrust(factionId, controller);
        if (trust >= 15 && trust < 60) seen.add(controller);
      }
    }
  }
  return [...seen];
}

function getTradeTargets(factionId: SectId): LocationId[] {
  const p = getPlayer();
  const tc = (p.territoryControl ?? {}) as Record<string, string>;
  const cities: LocationId[] = [];
  for (const locId of Object.keys(WORLD_MAP) as LocationId[]) {
    // 排除门派据点，只选城市/贸易点
    const isBase = isSectBase(locId) !== undefined;
    if (!isBase) {
      const controller = (tc[locId] ?? getLocationController(locId)) as string;
      if (controller === factionId || controller === 'none') {
        cities.push(locId);
      }
    }
  }
  return cities;
}

function getAdjacentController(locId: string, excludeSect: SectId): SectId | null {
  const p = getPlayer();
  const tc = (p.territoryControl ?? {}) as Record<string, string>;
  const controller = (tc[locId] ?? getLocationController(locId as LocationId)) as SectId;
  if (controller === excludeSect || controller === 'none') return null;
  return controller;
}

// ──── 攻城目标选择（复用原有逻辑） ────

function findSiegeTarget(factionId: SectId): { locationId: LocationId; defenderSect: SectId; locationName: string } | null {
  const p = getPlayer();
  const tc = (p.territoryControl ?? {}) as Record<string, string>;
  const bases = getSectBases(factionId);

  const candidates: Array<{ locationId: LocationId; defenderSect: SectId; locationName: string; score: number }> = [];

  for (const base of bases) {
    const baseData = WORLD_MAP[base];
    if (!baseData) continue;
    for (const connId of baseData.connections) {
      const controller = (tc[connId] ?? getLocationController(connId)) as SectId;
      // Allow attacking unowned cities (easy claim) and enemy-held cities
      if (controller === factionId) continue;
      const locData = WORLD_MAP[connId];
      if (!locData) continue;

      const cooldownKey = `${factionId}|${connId}`;
      if ((p.siegeCooldown?.[cooldownKey] ?? 0) > 0) continue;

      const score = computeSiegeScore(factionId, connId, controller);
      if (score > 0) {
        candidates.push({ locationId: connId, defenderSect: controller, locationName: locData.name, score });
      }
    }
  }

  if (candidates.length === 0) return null;

  const total = candidates.reduce((s, c) => s + c.score, 0);
  let roll = Math.random() * total;
  for (const c of candidates) {
    roll -= c.score;
    if (roll <= 0) return c;
  }
  return candidates[0]!;
}

function computeSiegeScore(attacker: SectId, targetLoc: LocationId, defender: SectId): number {
  if (defender === attacker) return -1;
  // Unowned territory: easy targets with high base score (prime expansion)
  if (defender === 'none') {
    return 50;
  }
  const attDef = FACTION_DEFS[attacker];
  const defDef = FACTION_DEFS[defender];
  if (!attDef || !defDef) return 10;

  const hostileAlign = (attDef.alignment === 'righteous' && defDef.alignment === 'chaotic') ||
    (attDef.alignment === 'chaotic' && defDef.alignment === 'righteous')
    ? 30 : 10;

  const attPower = computeSectPower(attacker);
  const defPower = computeSectPower(defender);
  const powerRatio = defPower > 0 ? Math.min(1, attPower / (defPower * 2)) : 1;
  const powerScore = (1 - powerRatio) * 50;

  const trust = getFactionTrust(attacker, defender);
  const trustScore = trust < 15 ? 20 : trust < 30 ? 10 : 0;

  const defState = getSectState(defender);
  const prosperity = defState.prosperity ?? 30;
  const prosperityScore = prosperity * 0.5;

  return hostileAlign + powerScore + trustScore + prosperityScore;
}

function getSectBases(factionId: SectId): LocationId[] {
  const bases: LocationId[] = [];
  for (const locId of Object.keys(WORLD_MAP) as LocationId[]) {
    const owner = isSectBase(locId);
    if (owner === factionId) bases.push(locId);
  }
  return bases;
}

// ──── 江湖轨目标选择器 ────

/** 挑战高手：找一个有敌对势力的相邻地点 */
function findChallengeTarget(factionId: SectId): { locationId?: LocationId; targetSect?: SectId } | null {
  const hostile = getHostileNeighbors(factionId);
  if (hostile.length > 0) {
    const target = hostile[Math.floor(Math.random() * hostile.length)]!;
    return { targetSect: target };
  }
  // 没有敌对势力，随机选一个中立邻居
  const neutral = getNeutralNeighbors(factionId);
  if (neutral.length > 0) {
    return { targetSect: neutral[Math.floor(Math.random() * neutral.length)] };
  }
  return null;
}

/** 城市目标：选势力控制下的一个城市 */
function findCityTarget(factionId: SectId): { locationId?: LocationId; targetSect?: SectId } | null {
  const p = getPlayer();
  const tc = (p.territoryControl ?? {}) as Record<string, string>;
  const cities: LocationId[] = [];
  for (const locId of Object.keys(WORLD_MAP) as LocationId[]) {
    const controller = (tc[locId] ?? getLocationController(locId)) as string;
    if (controller === factionId || controller === 'none') {
      cities.push(locId as LocationId);
    }
  }
  if (cities.length === 0) return null;
  return { locationId: cities[Math.floor(Math.random() * cities.length)] };
}

/** 险境目标：选一个危险度较高的地点 */
function findDangerTarget(factionId: SectId): { locationId?: LocationId; targetSect?: SectId } | null {
  const p = getPlayer();
  const tc = (p.territoryControl ?? {}) as Record<string, string>;
  const candidates: LocationId[] = [];
  for (const locId of Object.keys(WORLD_MAP) as LocationId[]) {
    const loc = WORLD_MAP[locId as LocationId];
    if (loc && (loc.dangerLevel ?? 0) >= 2) {
      const controller = (tc[locId] ?? getLocationController(locId as LocationId)) as string;
      // 险境不一定要被控制，无人区也可以探索
      if (controller === factionId || controller === 'none' || isSectBase(locId as LocationId) !== undefined) {
        candidates.push(locId as LocationId);
      }
    }
  }
  if (candidates.length === 0) return null;
  return { locationId: candidates[Math.floor(Math.random() * candidates.length)] };
}

/** 擂台目标：选势力控制的繁华城市 */
function findArenaTarget(factionId: SectId): { locationId?: LocationId; targetSect?: SectId } | null {
  // 复用城市目标选择器（擂台设在城市中）
  return findCityTarget(factionId);
}

// ──── NPC 个人属性变更辅助（江湖轨结算用）────

function addNpcExp(npcId: string, amount: number): void {
  const p = getPlayer();
  const db = { ...p.npcDatabase };
  const npc = db[npcId];
  if (!npc) return;
  db[npcId] = { ...npc, exp: npc.exp + amount };
  setPlayer({ ...p, npcDatabase: db });
}

function addNpcReputation(npcId: string, amount: number): void {
  const p = getPlayer();
  const npc = p.npcDatabase?.[npcId];
  if (!npc) return;
  import('./WorldState').then(m => {
    m.addChronicleEntry({
      category: 'world_event',
      title: `${npc.name} 声望提升`,
      description: `${npc.name} 在江湖中声名鹊起，声望 +${amount}`,
    });
  });
}

function addNpcGold(npcId: string, amount: number): void {
  const p = getPlayer();
  const npc = p.npcDatabase?.[npcId];
  if (!npc) return;
  import('./WorldState').then(m => {
    m.addChronicleEntry({
      category: 'world_event',
      title: `${npc.name} 获得酬金`,
      description: `${npc.name} 完成任务获得 ${amount} 金`,
    });
  });
}

function healNpc(npcId: string, amount: number): void {
  const p = getPlayer();
  const db = { ...p.npcDatabase };
  const npc = db[npcId];
  if (!npc) return;
  db[npcId] = { ...npc, hp: Math.min(npc.maxHp, npc.hp + amount) };
  setPlayer({ ...p, npcDatabase: db });
}

function growNpcCourtStat(npcId: string, stat: 'strategy' | 'eloquence' | 'charisma' | 'scholarship', amount: number): void {
  const p = getPlayer();
  const db = { ...p.npcDatabase };
  const npc = db[npcId];
  if (!npc || !npc.courtStats) return;
  const newVal = Math.min(100, (npc.courtStats[stat] ?? 10) + amount);
  db[npcId] = {
    ...npc,
    courtStats: { ...npc.courtStats, [stat]: newVal },
  };
  setPlayer({ ...p, npcDatabase: db });
}

function growNpcCombatStat(npcId: string, stat: 'atk' | 'def' | 'agi' | 'crit', amount: number): void {
  const p = getPlayer();
  const db = { ...p.npcDatabase };
  const npc = db[npcId];
  if (!npc) return;
  db[npcId] = { ...npc, [stat]: npc[stat] + amount };
  setPlayer({ ...p, npcDatabase: db });
}

// ═══════════════════════════════════════════════════════
//  随从加成系统（玩家专属）
// ═══════════════════════════════════════════════════════

/**
 * 获取玩家随从的战斗四维加成（每个随从提供 0.5× 的属性）。
 * 用于玩家执行指令/战斗时临时增强。
 */
export function getFollowerCombatBonus(): { atk: number; def: number; agi: number; crit: number } {
  const p = getPlayer();
  const bonus = { atk: 0, def: 0, agi: 0, crit: 0 };
  const recruited = p.npcCollection?.recruited ?? [];
  for (const npcId of recruited) {
    const npc = p.npcDatabase?.[npcId];
    if (!npc) continue;
    bonus.atk += Math.floor(npc.atk * 0.5);
    bonus.def += Math.floor(npc.def * 0.5);
    bonus.agi += Math.floor(npc.agi * 0.5);
    bonus.crit += Math.floor(npc.crit * 0.5);
  }
  return bonus;
}

/**
 * 获取玩家随从的朝廷属性加成（每个随从提供 0.5× 的属性）。
 */
export function getFollowerCourtBonus(): { strategy: number; eloquence: number; charisma: number; scholarship: number } {
  const p = getPlayer();
  const bonus = { strategy: 0, eloquence: 0, charisma: 0, scholarship: 0 };
  const recruited = p.npcCollection?.recruited ?? [];
  for (const npcId of recruited) {
    const npc = p.npcDatabase?.[npcId];
    if (!npc?.courtStats) continue;
    bonus.strategy += Math.floor((npc.courtStats.strategy ?? 10) * 0.5);
    bonus.eloquence += Math.floor((npc.courtStats.eloquence ?? 10) * 0.5);
    bonus.charisma += Math.floor((npc.courtStats.charisma ?? 10) * 0.5);
    bonus.scholarship += Math.floor((npc.courtStats.scholarship ?? 10) * 0.5);
  }
  return bonus;
}

/**
 * 将经验值同步分享给所有随从（随从获得 60% 的经验）。
 * 在玩家获得经验后调用。
 */
export function shareExpWithFollowers(playerExpGain: number): void {
  if (playerExpGain <= 0) return;
  const p = getPlayer();
  const recruited = p.npcCollection?.recruited ?? [];
  if (recruited.length === 0) return;
  const db = { ...p.npcDatabase };
  const shareAmount = Math.floor(playerExpGain * 0.6);
  for (const npcId of recruited) {
    const npc = db[npcId];
    if (!npc) continue;
    db[npcId] = { ...npc, exp: npc.exp + shareAmount };
  }
  setPlayer({ ...p, npcDatabase: db });
}

/**
 * 将战斗属性成长同步分享给所有随从（随从获得 50% 的成长）。
 * 在玩家属性提升后调用。
 */
export function shareCombatGrowthWithFollowers(stat: 'atk' | 'def' | 'agi' | 'crit', playerGain: number): void {
  if (playerGain <= 0) return;
  const p = getPlayer();
  const recruited = p.npcCollection?.recruited ?? [];
  if (recruited.length === 0) return;
  const db = { ...p.npcDatabase };
  const shareAmount = Math.max(1, Math.floor(playerGain * 0.5));
  for (const npcId of recruited) {
    const npc = db[npcId];
    if (!npc) continue;
    db[npcId] = { ...npc, [stat]: npc[stat] + shareAmount };
  }
  setPlayer({ ...p, npcDatabase: db });
}

/**
 * 获取随从的战斗参与列表（用于任务战斗中随从加入）。
 * 返回最多 2 名最适合战斗的随从。
 */
export function getFollowerBattleParticipants(): Array<{ id: string; name: string; atk: number; def: number; agi: number; crit: number; hp: number; maxHp: number }> {
  const p = getPlayer();
  const recruited = p.npcCollection?.recruited ?? [];
  if (recruited.length === 0) return [];

  // 按战斗力（atk + def）排序，取前 2 名
  const combatants = recruited
    .map(id => p.npcDatabase?.[id])
    .filter((n): n is NonNullable<typeof n> => n != null)
    .sort((a, b) => (b.atk + b.def) - (a.atk + a.def))
    .slice(0, 2);

  return combatants.map(n => ({
    id: n.id,
    name: n.name,
    atk: n.atk,
    def: n.def,
    agi: n.agi,
    crit: n.crit,
    hp: n.hp,
    maxHp: n.maxHp,
  }));
}

// ═══════════════════════════════════════════════════════
//  随从月度自动认领
// ═══════════════════════════════════════════════════════

/**
 * 每月初，玩家的随从自动认领江湖轨任务。
 * 优先认领匹配度最高的任务（每次最多认领 1 条，由 maxSlots 控制）。
 * 随从执行任务时享受 0.5× 玩家属性加成。
 */
export function tickFollowerDirectiveClaim(): void {
  const p = getPlayer();
  const recruited = p.npcCollection?.recruited ?? [];
  if (recruited.length === 0) return;

  for (const npcId of recruited) {
    // 每个随从尝试认领 1 条可用指令
    claimBestDirective(npcId);
  }
}

// ═══════════════════════════════════════════════════════
//  公开查询 API
// ═══════════════════════════════════════════════════════

/** 获取势力的所有活跃指令 */
export function getFactionDirectives(factionId: SectId): FactionDirective[] {
  return (getPlayer().factionDirectives?.[factionId] ?? [])
    .map(d => ({ ...d, type: d.type as FactionDirectiveType } as FactionDirective));
}

/** 获取 NPC 的政务信息 */
export function getNpcOfficial(npcId: string): FactionOfficial | undefined {
  const raw = getPlayer().factionOfficials?.[npcId];
  if (!raw) return undefined;
  return { ...raw, rank: raw.rank as FactionOfficialRank } as FactionOfficial;
}

/** 活跃指令视图（用于 UI 渲染） */
export interface ActiveDirectiveView {
  directiveId: string;
  type: FactionDirectiveType;
  label: string;
  npcName: string;
  npcId: string;
  progress: number;      // 0-1
  progressNeeded: number;
  currentProgress: number;
  targetLocation?: string;
  factionId: string;
}

/**
 * 获取玩家势力中所有正在执行的指令（含 NPC 信息）。
 * 用于在据点 UI 中展示"此地正在进行的任务"。
 */
export function getActiveDirectivesForPlayer(): ActiveDirectiveView[] {
  const p = getPlayer();
  const factionId = p.sect;
  if (!factionId || factionId === 'none') return [];

  const directives = (p.factionDirectives?.[factionId] ?? [])
    .map(d => ({ ...d, type: d.type as FactionDirectiveType } as FactionDirective));

  const results: ActiveDirectiveView[] = [];
  for (const d of directives) {
    if (d.completed || !d.assignedNpcId) continue;
    const npc = p.npcDatabase?.[d.assignedNpcId];
    if (!npc) continue;
    results.push({
      directiveId: d.id,
      type: d.type,
      label: d.label,
      npcName: npc.name,
      npcId: d.assignedNpcId,
      progress: d.progressNeeded > 0 ? d.currentProgress / d.progressNeeded : 0,
      progressNeeded: d.progressNeeded,
      currentProgress: d.currentProgress,
      targetLocation: d.targetLocation ? WORLD_MAP[d.targetLocation as LocationId]?.name : undefined,
      factionId: d.factionId,
    });
  }
  // 按进度降序（快完成的排前面）
  results.sort((a, b) => b.progress - a.progress);
  return results;
}

// ═══════════════════════════════════════════════════════
//  玩家认领指令系统
// ═══════════════════════════════════════════════════════

/** 玩家可认领的指令视图（用于任务面板） */
export interface PlayerDirectiveView {
  directiveId: string;
  type: FactionDirectiveType;
  label: string;
  description: string;
  targetLocation?: string;
  targetSect?: string;
  progressNeeded: number;
  currentProgress: number;
  factionId: string;
  /** 玩家认领后每回合自动推进的进度 */
  progressPerTurn: number;
  /** 完成后的奖励描述 */
  rewardDescription: string;
}

/** 获取玩家当前势力的可认领指令（未认领、未完成、未过期） */
export function getAvailablePlayerDirectives(): PlayerDirectiveView[] {
  const p = getPlayer();
  const factionId = p.sect;
  if (!factionId || factionId === 'none') return [];

  const directives = (p.factionDirectives?.[factionId] ?? [])
    .map(d => ({ ...d, type: d.type as FactionDirectiveType } as FactionDirective));

  return directives
    .filter(d => !d.completed && !d.assignedNpcId && !d.claimedByPlayer)
    .map(d => ({
      directiveId: d.id,
      type: d.type,
      label: d.label,
      description: d.description || d.rewardDescription,
      targetLocation: d.targetLocation ? WORLD_MAP[d.targetLocation as LocationId]?.name : undefined,
      targetSect: d.targetSect,
      progressNeeded: d.progressNeeded,
      currentProgress: 0,
      factionId: d.factionId,
      progressPerTurn: computePlayerDirectiveProgress(d),
      rewardDescription: d.rewardDescription,
    }));
}

/** 玩家认领一条势力指令 */
export function claimPlayerDirective(directiveId: string): { success: boolean; message: string } {
  const p = getPlayer();
  const factionId = p.sect;
  if (!factionId || factionId === 'none') return { success: false, message: '你尚未加入任何势力。' };

  const allDirectives = { ...(p.factionDirectives ?? {}) };
  const factionList = [...(allDirectives[factionId] ?? [])].map(
    d => ({ ...d, type: d.type as FactionDirectiveType } as FactionDirective)
  );

  // 检查是否已认领过多
  const alreadyClaimed = factionList.filter(d => d.claimedByPlayer && !d.completed).length;
  if (alreadyClaimed >= 2) return { success: false, message: '你已有 2 个进行中的势力任务，先完成一些再接新的吧。' };

  const idx = factionList.findIndex(d => d.id === directiveId);
  if (idx < 0) return { success: false, message: '指令不存在或已被他人认领。' };

  const directive = factionList[idx]!;
  if (directive.assignedNpcId || directive.claimedByPlayer) {
    return { success: false, message: '该指令已被认领。' };
  }

  factionList[idx] = { ...directive, claimedByPlayer: true };
  allDirectives[factionId] = factionList;

  const label = (directive as any).label ?? directive.type;
  setPlayer({ ...p, factionDirectives: allDirectives });
  return { success: true, message: `已认领势力任务「${label}」——前往目标地点推进进度。` };
}

/** 获取玩家已认领的指令（进行中） */
export function getPlayerClaimedDirectives(): PlayerDirectiveView[] {
  const p = getPlayer();
  const factionId = p.sect;
  if (!factionId || factionId === 'none') return [];

  const directives = (p.factionDirectives?.[factionId] ?? [])
    .map(d => ({ ...d, type: d.type as FactionDirectiveType } as FactionDirective));

  return directives
    .filter(d => d.claimedByPlayer && !d.completed)
    .map(d => ({
      directiveId: d.id,
      type: d.type,
      label: d.label,
      description: d.description || d.rewardDescription,
      targetLocation: d.targetLocation ? WORLD_MAP[d.targetLocation as LocationId]?.name : undefined,
      targetSect: d.targetSect,
      progressNeeded: d.progressNeeded,
      currentProgress: d.currentProgress,
      factionId: d.factionId,
      progressPerTurn: computePlayerDirectiveProgress(d),
      rewardDescription: d.rewardDescription,
    }));
}

/** 计算玩家每回合自动推进的指令进度 */
function computePlayerDirectiveProgress(d: FactionDirective): number {
  const p = getPlayer();
  // 基于玩家战斗属性 × 指令亲和度
  let progress = p.atk * d.statAffinity.atk
    + p.def * d.statAffinity.def
    + p.agi * d.statAffinity.agi
    + p.crit * d.statAffinity.crit;
  // 玩家朝廷属性
  if (d.courtAffinity && p.courtStats) {
    progress += (p.courtStats.strategy ?? 10) * (d.courtAffinity.strategy ?? 0)
      + (p.courtStats.eloquence ?? 10) * (d.courtAffinity.eloquence ?? 0)
      + (p.courtStats.charisma ?? 10) * (d.courtAffinity.charisma ?? 0)
      + (p.courtStats.scholarship ?? 10) * (d.courtAffinity.scholarship ?? 0);
  }
  return Math.max(3, Math.floor(progress / 8));
}

/** 每月初推进玩家已认领指令的进度，完成时结算奖励 */
export function tickPlayerDirectiveProgress(): string[] {
  const p = getPlayer();
  const factionId = p.sect;
  if (!factionId || factionId === 'none') return [];

  const allDirectives = { ...(p.factionDirectives ?? {}) };
  const factionList = [...(allDirectives[factionId] ?? [])].map(
    d => ({ ...d, type: d.type as FactionDirectiveType } as FactionDirective)
  );

  const completedMessages: string[] = [];
  let changed = false;

  for (let i = 0; i < factionList.length; i++) {
    const d = factionList[i]!;
    if (!d.claimedByPlayer || d.completed) continue;

    const progress = computePlayerDirectiveProgress(d);
    d.currentProgress = (d.currentProgress ?? 0) + progress;

    if (d.currentProgress >= d.progressNeeded) {
      d.currentProgress = d.progressNeeded;
      d.completed = true;
      changed = true;

      // 结算玩家奖励
      const rewards = settlePlayerDirective(d);
      completedMessages.push(`✅ 势力任务「${d.label}」完成！${rewards}`);
    } else {
      changed = true;
    }
  }

  if (changed) {
    allDirectives[factionId] = factionList;
    setPlayer({ ...getPlayer(), factionDirectives: allDirectives });
  }

  return completedMessages;
}

/** 玩家指令完成时的奖励结算 */
function settlePlayerDirective(d: FactionDirective): string {
  const p = getPlayer();
  const contribGain = 15 + Math.floor(Math.random() * 26); // 15-40
  const expGain = 30 + Math.floor(Math.random() * 51);     // 30-80
  const goldGain = 50 + Math.floor(Math.random() * 151);   // 50-200
  const influenceGain = d.courtAffinity ? 5 + Math.floor(Math.random() * 11) : 0; // 5-15

  const updated = {
    ...p,
    exp: p.exp + expGain,
    gold: p.gold + goldGain,
    sectContribution: (p.sectContribution ?? 0) + contribGain,
    influence: (p.influence ?? 0) + influenceGain,
  };

  // statExp 成长
  const diff = d.progressNeeded / 5;
  import('./ActionSystem').then(m => {
    m.grantPlayerStatExp({
      combat: {
        atk: Math.round(diff * d.statAffinity.atk),
        def: Math.round(diff * d.statAffinity.def),
        agi: Math.round(diff * d.statAffinity.agi),
        crit: Math.round(diff * d.statAffinity.crit),
      },
      court: d.courtAffinity ? {
        strategy: Math.round(diff * (d.courtAffinity.strategy ?? 0)),
        eloquence: Math.round(diff * (d.courtAffinity.eloquence ?? 0)),
        charisma: Math.round(diff * (d.courtAffinity.charisma ?? 0)),
        scholarship: Math.round(diff * (d.courtAffinity.scholarship ?? 0)),
      } : {},
    });
  });

  setPlayer(updated);

  // 同时触发势力结算
  switch (d.type) {
    case 'siege':
      if (d.targetSect && d.targetLocation) {
        import('./FactionWarfare').then(m => {
          m.tryTriggerSiegeForCouncil(d.factionId as SectId, d.targetSect as SectId, d.targetLocation as LocationId);
        });
      }
      break;
    case 'develop':
    case 'patrol':
      import('./SectManagement').then(m => {
        m.updateSectState(d.factionId as SectId, {
          resources: 10,
          stability: 8,
          prosperity: 5,
        });
      });
      break;
    case 'trade':
      import('./SectManagement').then(m => {
        m.updateSectState(d.factionId as SectId, {
          resources: 30 + Math.floor(Math.random() * 41),
          prosperity: 3,
        });
      });
      break;
    case 'diplomacy':
      if (d.targetSect) {
        import('./FactionSystem').then(m => {
          m.modifyFactionTrust(d.factionId as SectId, d.targetSect as SectId, 10, '玩家外交任务');
        });
      }
      break;
  }

  const parts: string[] = [];
  parts.push(`贡献+${contribGain}`);
  parts.push(`EXP+${expGain}`);
  if (goldGain > 0) parts.push(`💰+${goldGain}`);
  if (influenceGain > 0) parts.push(`影响力+${influenceGain}`);
  return parts.join('，');
}
