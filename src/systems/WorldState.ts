// ============================================================
//  src/systems/WorldState.ts — 江湖态势引擎
// ============================================================
//  核心设计原则：宁缺毋滥，每个数值必须从实际游戏数据派生。
//
//  数据来源：
//  - npcCount:  从 npcDatabase 实时统计该势力 NPC 人数
//  - avgLevel:  从 npcDatabase 实时计算该势力 NPC 平均修为
//  - maxLevel:  从 npcDatabase 实时取该势力 NPC 最高修为
//
//  排名公式（宗门实力）：
//    score = avgLevel × 5 + npcCount × 2
//    即：质量（平均修为）权重 5，规模（人数）权重 2
//
//  世界事件：仅影响玩家本人（灵石/修为/物品），不再编造势力数值。
//  风/云榜：纯氛围彩蛋，无实际游戏机制。
// ============================================================

import { getPlayer, setPlayer } from '../state/GameState';
import { saveGame } from '../state/SaveSystem';
import { ALL_FACTIONS } from './FactionSystem';
import { SECTS } from '../data/sects';
import type { SectId } from '../data/types';
import type { LocationId } from '../data/worldMap';

// ──── 宗门层级体系 ────

export type SectTier = 'supreme' | 'first_rate' | 'second_rate' | 'fringe' | 'special';

const SECT_TIER: Record<SectId, SectTier> = {
  wudang: 'supreme', shaolin: 'supreme', riyue: 'supreme',
  emei: 'first_rate', beggar: 'first_rate', quanzhen: 'first_rate', kunlun: 'first_rate', tangmen: 'first_rate',
  huashan: 'second_rate', kongtong: 'second_rate', qingcheng: 'second_rate', diancang: 'second_rate', tiezhang: 'second_rate',
  maoshan: 'fringe', wudu: 'fringe', xuedao: 'fringe', haisha: 'fringe',
  xiaoyao: 'special', demon: 'special',
  none: 'special',
};

const TIER_LABEL: Record<SectTier, string> = { supreme: '顶尖大派', first_rate: '一流门派', second_rate: '二流门派', fringe: '旁门左道', special: '特殊' };
const TIER_SORT: Record<SectTier, number> = { supreme: 0, first_rate: 1, second_rate: 2, fringe: 3, special: 4 };

export function getSectTier(sectId: SectId): SectTier { return SECT_TIER[sectId] ?? 'special'; }

// ──── 势力总览（废除排名公式，改为按层级+实际实力排列）────

export interface FactionScore {
  factionId: SectId;
  name: string;
  tier: SectTier;
  tierLabel: string;
  npcCount: number;
  maxLevel: number;
  topNpcName: string;
  topNpcRank: string;
}

/** 获取所有势力概览（按层级→最高修为排列，废除 avgLevel×5+npcCount×2 的虚假排名） */
export function getFactionRankings(): FactionScore[] {
  const p = getPlayer();
  const npcs = Object.values(p.npcDatabase ?? {});

  const bySect = new Map<SectId, typeof npcs>();
  for (const id of ALL_FACTIONS) bySect.set(id, []);
  for (const npc of npcs) {
    const s = npc.sect;
    if (s === 'none' || !bySect.has(s as SectId)) continue;
    bySect.get(s as SectId)!.push(npc);
  }

  const rankLabel = (lv: number, tier: SectTier): string => {
    if (tier === 'supreme' || tier === 'special') {
      if (lv >= 41) return '掌门级';
      if (lv >= 31) return '长老';
      if (lv >= 21) return '真传';
      if (lv >= 11) return '内门';
      return '外门';
    }
    if (tier === 'first_rate') {
      if (lv >= 41) return '掌门级';
      if (lv >= 31) return '长老';
      if (lv >= 21) return '真传';
      if (lv >= 11) return '内门';
      return '外门';
    }
    if (lv >= 31) return '掌门级';
    if (lv >= 21) return '长老';
    if (lv >= 11) return '内门';
    return '外门';
  };

  const results: FactionScore[] = [];

  for (const factionId of ALL_FACTIONS) {
    const sectNpcs = bySect.get(factionId) ?? [];
    const npcCount = sectNpcs.length;
    const maxLevel = npcCount > 0 ? Math.max(...sectNpcs.map(n => n.level)) : 1;
    const topNpc = npcCount > 0 ? sectNpcs.reduce((a, b) => a.level > b.level ? a : b) : null;
    const tier = getSectTier(factionId);

    results.push({
      factionId,
      name: (SECTS[factionId] as { name?: string })?.name ?? factionId,
      tier,
      tierLabel: TIER_LABEL[tier],
      npcCount,
      maxLevel,
      topNpcName: topNpc?.name ?? '—',
      topNpcRank: topNpc ? rankLabel(topNpc.level, tier) : '—',
    });
  }

  // 按层级 → 最高修为 排序
  results.sort((a, b) => {
    const tierDiff = TIER_SORT[a.tier] - TIER_SORT[b.tier];
    if (tierDiff !== 0) return tierDiff;
    return b.maxLevel - a.maxLevel;
  });

  return results;
}

/** 获取世界事件历史 */
export function getWorldEventHistory(): Array<{ eventId: string; title: string; description: string; turn: number; timestamp: number; category: string }> {
  const p = getPlayer();
  const ws = p.worldState;
  if (!ws?.worldEvents || ws.worldEvents.length === 0) return [];

  const eventMap = new Map<string, WorldEvent>();
  for (const ev of WORLD_EVENT_POOL) eventMap.set(ev.id, ev);

  return ws.worldEvents
    .map(e => {
      const def = eventMap.get(e.eventId);
      return {
        eventId: e.eventId,
        title: def?.title ?? e.eventId,
        description: def?.description ?? '',
        turn: e.turn,
        timestamp: e.timestamp,
        category: def?.category ?? 'discovery',
      };
    })
    .reverse();
}

// ──── 世界事件 ────

/** 事件对玩家的真实影响 */
export interface PlayerEffect {
  gold?: number;
  exp?: number;
  items?: string[];
  skills?: string[];
  flavorText?: string;
}

export interface WorldEvent {
  id: string;
  title: string;
  description: string;
  playerEffect?: PlayerEffect;
  category: 'conflict' | 'diplomacy' | 'discovery' | 'disaster' | 'opportunity';
  showToPlayer: boolean;
}

/** 事件池（仅影响玩家，不编造势力数值） */
const WORLD_EVENT_POOL: WorldEvent[] = [
  {
    id: 'sect_tournament',
    title: '⚔️ 武林大会',
    description: '各派高手齐聚华山之巅切磋武艺。你观战三日，悟得几招精妙变化。',
    playerEffect: { exp: 50, flavorText: '观摩群雄切磋，获得 50 点修为。' },
    category: 'conflict',
    showToPlayer: true,
  },
  {
    id: 'bandit_raid',
    title: '🏴 匪患侵扰',
    description: '流寇洗劫了丐帮属地的一座村镇。你路见不平拔刀相助，丐帮分舵主赠你灵石。',
    playerEffect: { gold: 100, exp: 30, flavorText: '剿匪获得 100 两灵石 + 30 修为。' },
    category: 'disaster',
    showToPlayer: true,
  },
  {
    id: 'trade_boom',
    title: '💰 商路通畅',
    description: '往来商队增多，物价回落。你趁低价购入一批修行丹药。',
    playerEffect: { gold: 80, flavorText: '商路红利，获得 80 两灵石。' },
    category: 'opportunity',
    showToPlayer: true,
  },
  {
    id: 'plague_outbreak',
    title: '🦠 疫病蔓延',
    description: '一场瘟疫席卷多地，峨眉派公开征集药方。你献上一份古方，获得重酬。',
    playerEffect: { gold: 150, exp: 40, flavorText: '献药方获得 150 两灵石 + 40 修为。' },
    category: 'disaster',
    showToPlayer: true,
  },
  {
    id: 'new_technique',
    title: '📖 武学突破',
    description: '少林寺一位老僧从残卷中悟出失传绝学。消息传出后你前往请教，获益匪浅。',
    playerEffect: { exp: 80, flavorText: '聆听高僧论道，获得 80 点修为。' },
    category: 'discovery',
    showToPlayer: true,
  },
  {
    id: 'demon_attack',
    title: '🌑 魔教渗透',
    description: '魔教暗中向正道门派派遣探子。你协助揪出一名潜伏者，获得宗门嘉奖。',
    playerEffect: { gold: 200, exp: 30, flavorText: '揭发魔教探子，获得 200 两灵石 + 30 修为。' },
    category: 'conflict',
    showToPlayer: true,
  },
  {
    id: 'alliance_formed',
    title: '🤝 同盟缔结',
    description: '华山派与丐帮缔结攻守同盟。你作为见证者出席，两派各自赠你谢礼。',
    playerEffect: { gold: 120, flavorText: '两派谢礼：获得 120 两灵石。' },
    category: 'diplomacy',
    showToPlayer: true,
  },
  {
    id: 'treasure_found',
    title: '💎 古墓出土',
    description: '前朝古墓重见天日，各路高手蜂拥而至。你在偏室捡到一枚储物戒指。',
    playerEffect: { gold: 300, exp: 100, flavorText: '古墓机缘：获得 300 两灵石 + 100 修为！' },
    category: 'discovery',
    showToPlayer: true,
  },
  {
    id: 'drought_season',
    title: '☀️ 旱季困扰',
    description: '天旱少雨，粮价飞涨。你拿出余粮救济丐帮灾民，虽破费了些但心有所悟。',
    playerEffect: { gold: -50, exp: 20, flavorText: '赈济灾民花费 50 两灵石，获得 20 修为。' },
    category: 'disaster',
    showToPlayer: true,
  },
  {
    id: 'elder_retires',
    title: '👴 长老退隐',
    description: '武当派一位长老归隐山林，临行前将手抄剑谱赠予有缘人——恰巧你路过山门。',
    playerEffect: { exp: 120, gold: 50, flavorText: '武当长老赠予剑谱心得：获得 120 点修为！' },
    category: 'diplomacy',
    showToPlayer: true,
  },
  {
    id: 'secret_auction',
    title: '🔮 地下拍卖会',
    description: '江湖中流传一处地下拍卖会的消息。你混入其中，低价淘到一本残卷。',
    playerEffect: { gold: -100, exp: 60, flavorText: '残卷参悟：花费 100 两灵石换得 60 修为。' },
    category: 'opportunity',
    showToPlayer: true,
  },
  {
    id: 'hero_saves_beauty',
    title: '🌸 名侠救美',
    description: '峨眉派女弟子遭山贼围攻，华山剑客挺身相救。此事传为佳话。你帮忙报了官，得了赏钱。',
    playerEffect: { gold: 60, flavorText: '帮忙报官，获得峨眉谢礼 60 两灵石。' },
    category: 'diplomacy',
    showToPlayer: true,
  },
];

// ──── 个人日志 ────

export type ChronicleCategory =
  | 'world_event' | 'sect_join' | 'rank_promotion'
  | 'mission_complete' | 'npc_interaction' | 'travel'
  | 'battle' | 'discovery' | 'court_affair';

export interface ChronicleEntry {
  id: string;
  turn: number;
  timestamp: number;
  category: ChronicleCategory;
  title: string;
  description: string;
  locationId?: LocationId;
  relatedSect?: SectId;
}

// ──── 系统状态 ────

export interface WorldStateData {
  /** 世界事件记录 */
  worldEvents: Array<{ eventId: string; turn: number; timestamp: number }>;
  /** 当前回合计数 */
  turn: number;
  /** 上次资源演化的回合 */
  lastEvolveTurn: number;
}

export interface ChronicleData {
  entries: ChronicleEntry[];
  entryCounter: number;
}

// ──── 初始化 ────

export function initWorldState(): WorldStateData {
  return {
    worldEvents: [],
    turn: 0,
    lastEvolveTurn: 0,
  };
}

export function initChronicle(): ChronicleData {
  return {
    entries: [],
    entryCounter: 0,
  };
}

// ──── 核心：世界演化回合 ────

export function tickWorldState(): {
  worldEvent?: WorldEvent;
} {
  let p = getPlayer();
  let ws = p.worldState ?? initWorldState();

  // 增加回合
  ws = { ...ws, turn: ws.turn + 1 };

  // 每隔 3 回合标记一次演化
  if (ws.turn - ws.lastEvolveTurn >= 3) {
    ws = { ...ws, lastEvolveTurn: ws.turn };
  }

  // 10% 概率触发世界事件
  let worldEvent: WorldEvent | undefined;
  if (Math.random() < 0.10) {
    const eventIdx = Math.floor(Math.random() * WORLD_EVENT_POOL.length);
    worldEvent = WORLD_EVENT_POOL[eventIdx];
    if (!worldEvent) return { worldEvent: undefined };

    // 应用事件对玩家的影响
    if (worldEvent.playerEffect) {
      const pe = worldEvent.playerEffect;
      if (pe.gold) {
        p = { ...p, gold: (p.gold ?? 0) + pe.gold };
      }
      if (pe.exp) {
        p = { ...p, exp: (p.exp ?? 0) + pe.exp };
      }
      if (pe.items && pe.items.length > 0) {
        const inv = [...(p.inventory ?? [])];
        for (const itemId of pe.items) {
          const existing = inv.find(i => i.id === itemId);
          if (existing) {
            existing.count += 1;
          } else {
            inv.push({ id: itemId as import('../data/types').ItemId, name: itemId, icon: '', desc: '', effect: {}, count: 1 });
          }
        }
        p = { ...p, inventory: inv };
      }
    }

    // 记录事件
    ws = {
      ...ws,
      worldEvents: [
        ...ws.worldEvents,
        { eventId: worldEvent.id, turn: ws.turn, timestamp: Date.now() },
      ],
    };
  }

  const updated = { ...p, worldState: ws };
  setPlayer(updated);
  saveGame(updated);

  return { worldEvent };
}

/**
 * 玩家贡献给宗门（仅记录到 sectContribution，不再维护编造的势力资源）
 * 保留此函数签名以兼容现有调用方。
 */
export function contributeToFaction(_sectId: SectId, _contribution: number): void {
  // sectContribution 已由调用方（StoryPanel）自行维护
}

// ──── 玩家加入宗门 ────

export function joinSect(sectId: SectId): void {
  const p = getPlayer();
  const ws = p.worldState ?? initWorldState();

  const updated = {
    ...p,
    sect: sectId,
    discipleRank: 'outer',
    sectContribution: 20,
    currentLocationId: getSectLocation(sectId),
    worldState: ws,
  };
  setPlayer(updated);
  saveGame(updated);

  addChronicleEntry({
    category: 'sect_join',
    title: `拜入${(SECTS[sectId] as { name?: string })?.name ?? sectId}`,
    description: `你正式成为${(SECTS[sectId] as { name?: string })?.name ?? sectId}的一名外门弟子，从此踏上修行之路。`,
    relatedSect: sectId,
  });
}

// ──── 个人日志系统 ────

export function addChronicleEntry(entry: Omit<ChronicleEntry, 'id' | 'turn' | 'timestamp'>): void {
  const p = getPlayer();
  const chronicle = p.chronicle ?? initChronicle();

  const newEntry: ChronicleEntry = {
    ...entry,
    id: `chr_${chronicle.entryCounter + 1}`,
    turn: p.worldState?.turn ?? 0,
    timestamp: Date.now(),
    locationId: entry.locationId ?? p.currentLocationId,
  };

  const updated = {
    ...p,
    chronicle: {
      entries: [...chronicle.entries, newEntry],
      entryCounter: chronicle.entryCounter + 1,
    },
  };
  setPlayer(updated);
  saveGame(updated);
}

export function getChronicle(): ChronicleEntry[] {
  const p = getPlayer();
  return (p.chronicle?.entries ?? []).slice(-50).reverse();
}

// ──── 辅助 ────

function getSectLocation(sectId: SectId): LocationId {
  const map: Partial<Record<SectId, LocationId>> = {
    wudang: 'wudang_mountain',
    shaolin: 'shaolin_temple',
    emei: 'emei_mountain',
    beggar: 'beggar_hq',
    huashan: 'changan_city',
    demon: 'yangzhou_city',
    maoshan: 'maoshan_daoyuan',
    kunlun: 'kunlun_mountain',
    qingcheng: 'qingcheng_mountain',
    tangmen: 'tangmen_estate',
    xiaoyao: 'xiaoyao_valley',
  };
  return (map[sectId] as LocationId) ?? 'kaifeng_city';
}

// ──── 宗门加入条件 ────

export interface JoinSectCondition {
  sectId: SectId;
  sectName: string;
  requireReferral: boolean;
  alwaysOpen: boolean;
}

export function getJoinSectConditions(): JoinSectCondition[] {
  return ALL_FACTIONS.map(sectId => ({
    sectId,
    sectName: (SECTS[sectId] as { name?: string })?.name ?? sectId,
    requireReferral: sectId === 'shaolin' || sectId === 'emei' || sectId === 'maoshan',
    alwaysOpen: sectId === 'beggar' || sectId === 'demon' || sectId === 'tangmen',
  }));
}

export function canJoinSect(sectId: SectId): {
  canJoin: boolean;
  reason?: string;
  suggestedNpcId?: string;
} {
  if (sectId === 'none') return { canJoin: false, reason: '无效宗门' };

  const p = getPlayer();
  if (p.sect === sectId) return { canJoin: false, reason: '你已在该宗门' };

  if (sectId === 'beggar' || sectId === 'demon' || sectId === 'tangmen') {
    return { canJoin: true };
  }

  const locId = getSectLocation(sectId);
  if (p.currentLocationId !== locId) {
    const name = (SECTS[sectId] as { name?: string })?.name ?? sectId;
    return { canJoin: false, reason: `需要前往${name}所在地` };
  }

  return { canJoin: true };
}

export function getSectLeaderNpcId(sectId: SectId): string | undefined {
  const map: Partial<Record<SectId, string>> = {
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
    riyue: 'demon_master',
  };
  return map[sectId];
}
