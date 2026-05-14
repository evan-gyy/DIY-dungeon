// ============================================================
//  src/systems/FactionSystem.ts — 势力外交引擎
// ============================================================
//  参考信长之野望的势力倾向模型：
//  - 势力间关系由倾向匹配 + 文化相似度驱动
//  - 每 N 回合执行一次外交 tick，生成友好/冲突事件
//  - NPC 行为受所属势力倾向影响
// ============================================================

import type { SectId } from '../data/types';
import type {
  FactionAlignment,
  FactionRelation,
  FactionRelationData,
} from '../data/sandboxTypes';
import {
  FACTION_DEFS,
  ALIGNMENT_AFFINITY,
  calcCultureAffinity,
} from '../data/sandboxTypes';
import { getPlayer, setPlayer } from '../state/GameState';
import { saveGame } from '../state/SaveSystem';

// ──── 外交事件类型 ────

export type DiplomacyEventType =
  | 'joint_training'   // 联合论道/训练
  | 'disciple_exchange'// 弟子交流
  | 'trade_goods'      // 互通有无
  | 'united_defense'   // 共御外敌
  | 'border_clash'     // 边境冲突
  | 'disciple_hurt'    // 弟子被伤
  | 'resource_grab'    // 抢夺资源
  | 'sect_rift';       // 门派裂痕

export interface DiplomacyEvent {
  type: DiplomacyEventType;
  factionA: SectId;
  factionB: SectId;
  title: string;
  description: string;
  trustDelta: number;
  /** 是否友善（true=友好, false=冲突） */
  isFriendly: boolean;
}

// ──── 外交事件池 ────

const FRIENDLY_EVENTS: Array<Omit<DiplomacyEvent, 'factionA' | 'factionB'>> = [
  {
    type: 'joint_training',
    title: '联合论道',
    description: '双方弟子齐聚一堂，切磋武艺、交流心得，增进门派友谊。',
    trustDelta: 15,
    isFriendly: true,
  },
  {
    type: 'disciple_exchange',
    title: '弟子交流',
    description: '互派弟子短期访学，彼此学习对方武学精华。',
    trustDelta: 10,
    isFriendly: true,
  },
  {
    type: 'trade_goods',
    title: '互通有无',
    description: '交换药材与矿石资源，两派均受益匪浅。',
    trustDelta: 8,
    isFriendly: true,
  },
  {
    type: 'united_defense',
    title: '共御外敌',
    description: '联手击退来犯之敌，战火中结下深厚情谊。',
    trustDelta: 20,
    isFriendly: true,
  },
];

const CONFLICT_EVENTS: Array<Omit<DiplomacyEvent, 'factionA' | 'factionB'>> = [
  {
    type: 'border_clash',
    title: '边境冲突',
    description: '双方弟子在势力交界处发生摩擦，互有损伤。',
    trustDelta: -15,
    isFriendly: false,
  },
  {
    type: 'disciple_hurt',
    title: '弟子被伤',
    description: '一方弟子被对方门人打伤，门派上下义愤填膺。',
    trustDelta: -10,
    isFriendly: false,
  },
  {
    type: 'resource_grab',
    title: '抢夺资源',
    description: '为争夺一处灵矿的开采权，双方剑拔弩张。',
    trustDelta: -12,
    isFriendly: false,
  },
  {
    type: 'sect_rift',
    title: '门派裂痕',
    description: '一场误会引发两派高层激烈争执，关系急转直下。',
    trustDelta: -20,
    isFriendly: false,
  },
];

// ──── 配置 ────

/** 每隔 N 次行动触发一次外交 tick */
const DIPLOMACY_TICK_INTERVAL = 5;

/** 基础信任值（势力间的初始信任度） */
const BASE_TRUST: Record<string, Record<string, number>> = {
  // 武当对其他势力
  wudang: { shaolin: 65, emei: 60, beggar: 55, huashan: 40, demon: 15, maoshan: 70, kunlun: 45, qingcheng: 40, tangmen: 30, xiaoyao: 50 },
  shaolin: { wudang: 65, emei: 55, beggar: 50, huashan: 45, demon: 10, maoshan: 55, kunlun: 40, qingcheng: 35, tangmen: 25, xiaoyao: 45 },
  emei:    { wudang: 60, shaolin: 55, beggar: 50, huashan: 35, demon: 20, maoshan: 50, kunlun: 35, qingcheng: 55, tangmen: 40, xiaoyao: 40 },
  beggar:  { wudang: 55, shaolin: 50, emei: 50, huashan: 40, demon: 15, maoshan: 45, kunlun: 35, qingcheng: 40, tangmen: 30, xiaoyao: 35 },
  huashan: { wudang: 40, shaolin: 45, emei: 35, beggar: 40, demon: 30, maoshan: 35, kunlun: 50, qingcheng: 45, tangmen: 35, xiaoyao: 30 },
  demon:   { wudang: 15, shaolin: 10, emei: 20, beggar: 15, huashan: 30, maoshan: 10, kunlun: 20, qingcheng: 25, tangmen: 40, xiaoyao: 15 },
  // 🆕 新宗门信任度
  maoshan: { wudang: 70, shaolin: 55, emei: 50, beggar: 45, huashan: 35, demon: 10, kunlun: 40, qingcheng: 45, tangmen: 30, xiaoyao: 45 },
  kunlun:  { wudang: 45, shaolin: 40, emei: 35, beggar: 35, huashan: 50, demon: 20, maoshan: 40, qingcheng: 40, tangmen: 30, xiaoyao: 40 },
  qingcheng:{ wudang: 40, shaolin: 35, emei: 55, beggar: 40, huashan: 45, demon: 25, maoshan: 45, kunlun: 40, tangmen: 35, xiaoyao: 35 },
  tangmen: { wudang: 30, shaolin: 25, emei: 40, beggar: 30, huashan: 35, demon: 40, maoshan: 30, kunlun: 30, qingcheng: 35, xiaoyao: 25 },
  xiaoyao: { wudang: 50, shaolin: 45, emei: 40, beggar: 35, huashan: 30, demon: 15, maoshan: 45, kunlun: 40, qingcheng: 35, tangmen: 25 },
};

/** 所有势力 ID 列表（排除 'none'） */
export const ALL_FACTIONS: SectId[] = [
  'wudang', 'shaolin', 'emei', 'beggar', 'huashan', 'demon',
  'maoshan', 'kunlun', 'qingcheng', 'tangmen', 'xiaoyao',
  'quanzhen', 'kongtong', 'diancang',
  'riyue', 'tiezhang', 'wudu', 'xuedao', 'haisha',
];

// ──── 内部工具函数 ────

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function factionName(id: SectId): string {
  const names: Record<SectId, string> = {
    wudang: '武当派', shaolin: '少林寺', emei: '峨眉派', beggar: '丐帮',
    huashan: '华山派', demon: '魔教',
    maoshan: '茅山派', kunlun: '昆仑派', qingcheng: '青城派',
    tangmen: '唐门', xiaoyao: '逍遥派',
    quanzhen: '全真教', kongtong: '崆峒派', diancang: '点苍派',
    riyue: '日月教', tiezhang: '铁掌帮', wudu: '五毒教', xuedao: '血刀门', haisha: '海沙派',
    none: '散修',
  };
  return names[id] ?? id;
}

function trustToRelation(trust: number): FactionRelation {
  if (trust >= 80) return 'allied';
  if (trust >= 60) return 'friendly';
  if (trust >= 30) return 'neutral';
  if (trust >= 15) return 'tense';
  if (trust >= 5) return 'hostile';
  return 'at_war';
}

function relationLabel(rel: FactionRelation): string {
  const map: Record<FactionRelation, string> = {
    allied: '同盟', friendly: '友好', neutral: '中立',
    tense: '紧张', hostile: '敌对', at_war: '交战',
  };
  return map[rel] ?? rel;
}

// ──── 初始化 ────

/**
 * 初始化势力外交关系。
 * 基于倾向和文化的初始信任度。
 */
export function initFactionRelations(): Record<string, Record<string, FactionRelationData>> {
  const relations: Record<string, Record<string, FactionRelationData>> = {};

  for (const a of ALL_FACTIONS) {
    relations[a] = {};
    const defA = FACTION_DEFS[a];
    for (const b of ALL_FACTIONS) {
      if (a === b) continue;
      const defB = FACTION_DEFS[b];

      // 基础信任度 + 倾向修正 + 文化修正
      let trust = BASE_TRUST[a]?.[b] ?? 40;
      const alignAff = ALIGNMENT_AFFINITY[defA.alignment]?.[defB.alignment];
      if (alignAff) trust += alignAff.affinity;
      trust += calcCultureAffinity(defA.culture, defB.culture);

      trust = clamp(trust, 1, 100);
      relations[a][b] = {
        relation: trustToRelation(trust),
        trust,
      };
    }
  }
  return relations;
}

// ──── 外交 Tick ────

/**
 * 执行一次势力外交回合。
 * 在玩家每次行动（日常任务/旅行/休息）时调用，内部计数判断是否触发。
 * @returns 本回合生成的外交事件列表（可能为空）
 */
export function tickFactionDiplomacy(): DiplomacyEvent[] {
  const p = getPlayer();
  let ticks = (p as any).diplomacyTickCounter ?? 0;
  ticks++;

  // 检查是否需要执行外交 tick
  if (ticks < DIPLOMACY_TICK_INTERVAL) {
    setPlayer({ ...p, diplomacyTickCounter: ticks } as any);
    return [];
  }

  // 重置计数器
  ticks = 0;

  // 获取当前外交关系
  let relations = p.factionRelations ?? initFactionRelations();

  // 复制深层对象
  relations = JSON.parse(JSON.stringify(relations)) as typeof relations;

  const events: DiplomacyEvent[] = [];
  const processedPairs = new Set<string>();

  // 每对势力最多生成一个事件
  for (const a of ALL_FACTIONS) {
    for (const b of ALL_FACTIONS) {
      if (a === b) continue;
      const pairKey = [a, b].sort().join('|');
      if (processedPairs.has(pairKey)) continue;
      processedPairs.add(pairKey);

      const data = relations[a]?.[b];
      if (!data) continue;

      const trust = data.trust;
      const event = rollDiplomacyEvent(a, b, trust);
      if (!event) continue;

      events.push(event);

      // 更新两个方向的信任度
      const newTrustAB = clamp(trust + event.trustDelta, 1, 100);
      const newTrustBA = clamp((relations[b]?.[a]?.trust ?? trust) + event.trustDelta, 1, 100);

      relations[a] ??= {};
      relations[a][b] = {
        relation: trustToRelation(newTrustAB),
        trust: newTrustAB,
        lastEvent: event.title,
        lastEventTurn: ticks,
      };
      relations[b] ??= {};
      relations[b][a] = {
        relation: trustToRelation(newTrustBA),
        trust: newTrustBA,
        lastEvent: event.title,
        lastEventTurn: ticks,
      };
    }
  }

  const updated = {
    ...p,
    factionRelations: relations,
    diplomacyTickCounter: ticks,
  } as any;
  setPlayer(updated);
  saveGame(updated);

  return events;
}

/**
 * 根据当前信任度随机生成事件（或无事发生）。
 */
function rollDiplomacyEvent(
  a: SectId,
  b: SectId,
  trust: number,
): DiplomacyEvent | null {
  const rand = Math.random();

  // 根据信任度决定事件概率分布
  let pFriendly: number;
  let pNothing: number;
  let pConflict: number;

  if (trust > 60) {
    pFriendly = 0.35; pNothing = 0.55; pConflict = 0.10;
  } else if (trust >= 30) {
    pFriendly = 0.20; pNothing = 0.50; pConflict = 0.30;
  } else {
    pFriendly = 0.08; pNothing = 0.42; pConflict = 0.50;
  }

  if (rand < pFriendly) {
    // 友好事件
    const event = FRIENDLY_EVENTS[Math.floor(Math.random() * FRIENDLY_EVENTS.length)]!;
    return {
      ...event,
      factionA: a,
      factionB: b,
      description: `${factionName(a)}与${factionName(b)}：${event.description}`,
    };
  } else if (rand < pFriendly + pConflict) {
    // 冲突事件
    const event = CONFLICT_EVENTS[Math.floor(Math.random() * CONFLICT_EVENTS.length)]!;
    return {
      ...event,
      factionA: a,
      factionB: b,
      description: `${factionName(a)}与${factionName(b)}：${event.description}`,
    };
  }

  // 无事发生
  return null;
}

// ──── 查询接口 ────

/**
 * 获取两个势力之间的外交关系数据。
 */
export function getFactionRelation(
  factionA: SectId,
  factionB: SectId,
): FactionRelationData | null {
  const p = getPlayer();
  return (p.factionRelations?.[factionA]?.[factionB] ?? null) as FactionRelationData | null;
}

/**
 * 获取两个势力之间的关系标签。
 */
export function getFactionRelationLabel(
  factionA: SectId,
  factionB: SectId,
): string {
  const data = getFactionRelation(factionA, factionB);
  return data ? relationLabel(data.relation) : '未知';
}

/**
 * 获取两个势力之间的信任度（0-100）。
 */
export function getFactionTrust(
  factionA: SectId,
  factionB: SectId,
): number {
  const data = getFactionRelation(factionA, factionB);
  return data?.trust ?? 0;
}

/**
 * 获取势力对外交关系（按信任度排序）。
 */
export function getFactionDiplomacyList(factionId: SectId): Array<{
  targetId: SectId;
  name: string;
  relation: FactionRelation;
  trust: number;
  lastEvent?: string;
}> {
  const p = getPlayer();
  const relations = p.factionRelations?.[factionId] ?? {};
  return ALL_FACTIONS
    .filter(id => id !== factionId && relations[id])
    .map(id => ({
      targetId: id,
      name: factionName(id),
      relation: relations[id]!.relation as FactionRelation,
      trust: relations[id]!.trust,
      lastEvent: relations[id]!.lastEvent,
    }))
    .sort((a, b) => b.trust - a.trust);
}

/**
 * 获取势力的倾向标签。
 */
export function getFactionAlignment(id: SectId): FactionAlignment {
  return FACTION_DEFS[id]?.alignment ?? 'neutral';
}

/**
 * 获取势力倾向中文标签。
 */
export function getAlignmentLabel(alignment: FactionAlignment): string {
  const labels: Record<FactionAlignment, string> = {
    righteous: '正道', neutral: '中立', chaotic: '邪道',
  };
  return labels[alignment] ?? alignment;
}

/**
 * 获取势力文化标签列表。
 */
export function getFactionCulture(id: SectId): string[] {
  return FACTION_DEFS[id]?.culture ?? [];
}

// ──── 玩家干预 ────

/**
 * 玩家主动影响两个势力间的关系。
 * 例如：玩家完成外交任务后调用。
 */
export function modifyFactionTrust(
  factionA: SectId,
  factionB: SectId,
  delta: number,
  reason?: string,
): void {
  const p = getPlayer();
  let relations = p.factionRelations ?? initFactionRelations();
  relations = JSON.parse(JSON.stringify(relations)) as typeof relations;

  // 双向更新
  const dataAB = relations[factionA]?.[factionB];
  const dataBA = relations[factionB]?.[factionA];
  if (!dataAB || !dataBA) return;

  dataAB.trust = clamp(dataAB.trust + delta, 1, 100);
  dataAB.relation = trustToRelation(dataAB.trust);
  if (reason) dataAB.lastEvent = reason;

  dataBA.trust = clamp(dataBA.trust + delta, 1, 100);
  dataBA.relation = trustToRelation(dataBA.trust);
  if (reason) dataBA.lastEvent = reason;

  setPlayer({ ...p, factionRelations: relations } as any);
}

/**
 * 获取信任度进度条字符串。
 */
export function formatTrustBar(trust: number): string {
  const barLen = 10;
  const filled = Math.round((trust / 100) * barLen);
  const empty = barLen - filled;
  const color = trust >= 60 ? '█' : trust >= 30 ? '▒' : '░';
  if (trust >= 60) return `[${'█'.repeat(filled)}${'░'.repeat(empty)}]`;
  return `[${'▒'.repeat(filled)}${'░'.repeat(empty)}]`;
}

/**
 * 获取信任度对应的颜色类名。
 */
export function getTrustColor(trust: number): string {
  if (trust >= 80) return 'trust-allied';
  if (trust >= 60) return 'trust-friendly';
  if (trust >= 30) return 'trust-neutral';
  if (trust >= 15) return 'trust-tense';
  return 'trust-hostile';
}
