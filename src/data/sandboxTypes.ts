// ============================================================
//  src/data/sandboxTypes.ts — 沙盒模式核心类型定义
// ============================================================
//  本文件定义沙盒/自由模式所需的所有新类型，作为后续
//  各模块开发的基础。所有 ID 联合类型集中管理。
//
//  重要约束：
//  - 宗门身份（discipleRank）与修为等级（level）完全解耦
//  - 晋升条件仅依赖贡献值 + 试炼，不使用 minLevel
//  - 势力列表对齐现有 types.ts 的 SectId（6个），后续扩展再加
//  - 大地图在现有 worldMap.ts 的 LocationId 基础上渐进扩展
// ============================================================

import type { LocationId } from './worldMap';
import type { SkillId, SectId } from './types';

// ──── P0-1: 宗门贡献值系统 ────

export type Contribution = number;

export type ContributionSource =
  | 'daily_task'       | 'main_mission'
  | 'promotion_trial'  | 'donation'
  | 'teaching'         | 'sect_event'
  | 'penalty';

export interface ContributionLog {
  amount: number;
  source: ContributionSource;
  reason: string;
  timestamp: number;
}

// ──── P0-2: 宗门晋升系统 ────

/**
 * 宗门身份等级。
 * 注意：discipleRank 与修为等级（level）完全解耦。
 * 晋升条件仅依赖贡献值 + 试炼，不使用 minLevel。
 * 剧情晋升（ch2_xiasha→inner, ch3_zhenchuan→true）和沙盒晋升
 * 写入同一个字段，两种路径互不冲突。
 */
export type DiscipleRank =
  | 'outer'         // 外门弟子（入门默认）
  | 'inner'         // 内门弟子
  | 'true'          // 真传弟子
  | 'elder'         // 长老
  | 'vice_leader'   // 副掌门（预留，当前不可达）
  | 'leader';       // 掌门（预留，当前不可达）

/**
 * 晋升条件。
 * 注意：不使用 minLevel —— 修为与宗门身份解耦。
 * 一个炼气期天才也可以通过贡献值 + 试炼成为内门弟子
 * （虽然战斗试炼可能很难打过）。
 */
export interface PromotionRequirement {
  /** 所需贡献值 */
  minContribution: number;
  /** 晋升试炼 ID */
  trialId?: string;
  /** 所需声望（可选，后续扩展） */
  minReputation?: number;
}

export interface PromotionTrial {
  id: string;
  title: string;
  description: string;
  targetRank: DiscipleRank;
  type: 'combat' | 'explore' | 'collect' | 'social' | 'teach';
  enemyId?: string;
  targetLocation?: LocationId;
  collectItems?: Array<{ itemId: string; count: number }>;
  rewardContribution: number;
  rewardExp: number;
}

export const DISCIPLE_RANK_ORDER: DiscipleRank[] = [
  'outer', 'inner', 'true', 'elder', 'vice_leader', 'leader'
];

/**
 * 晋升条件表（沙盒路径）。
 * 仅依赖贡献值 + 试炼，不使用 minLevel。
 * 与剧情晋升（ch2_xiasha→inner, ch3_zhenchuan→true）并行。
 */
export const PROMOTION_REQUIREMENTS: Partial<Record<DiscipleRank, PromotionRequirement>> = {
  inner: { minContribution: 200,  trialId: 'trial_outer_to_inner' },
  true:  { minContribution: 500,  trialId: 'trial_inner_to_true' },
  elder: { minContribution: 1000, trialId: 'trial_true_to_elder' },
};

/** 晋升试炼配置（实际战斗/事件数据） */
export const PROMOTION_TRIALS: Record<string, PromotionTrial> = {
  trial_outer_to_inner: {
    id: 'trial_outer_to_inner',
    title: '下山剿匪',
    description: '外门弟子需独自下山，剿灭盘踞在清河谷的山贼头目，以武证道。',
    targetRank: 'inner',
    type: 'combat',
    enemyId: 'bandit_elite',
    targetLocation: 'jiangling_city' as LocationId,
    rewardContribution: 50,
    rewardExp: 80,
  },
  trial_inner_to_true: {
    id: 'trial_inner_to_true',
    title: '演武试剑',
    description: '在演武场上与内门高手陆沉舟对决，以证剑道。',
    targetRank: 'true',
    type: 'combat',
    enemyId: 'lu_chenzhou',
    rewardContribution: 100,
    rewardExp: 150,
  },
  trial_true_to_elder: {
    id: 'trial_true_to_elder',
    title: '传功授业',
    description: '真传弟子须成功指导三名外门弟子完成修炼，证其教学之能。',
    targetRank: 'elder',
    type: 'teach',
    rewardContribution: 200,
    rewardExp: 300,
  },
};

// ──── P1-1: 主命/任务系统 ────

export type MissionStatus = 'available' | 'accepted' | 'completed' | 'failed';

export type MissionType =
  | 'combat' | 'escort' | 'gather' | 'investigate' | 'teach' | 'diplomacy' | 'special';

export type MissionDifficulty = 'easy' | 'normal' | 'hard' | 'legendary';

export interface MissionDef {
  id: string;
  title: string;
  type: MissionType;
  difficulty: MissionDifficulty;
  description: string;
  issuer: SectId;
  minRank?: DiscipleRank;
  minLevel?: number;
  targetLocation?: LocationId;
  enemyId?: string;
  /** 任务目标进度上限 */
  progressMax: number;
  rewardContribution: number;
  rewardExp: number;
  rewardGold: number;
  /** 是否为晋升试炼任务 */
  isPromotionTrial?: boolean;
  /** 是否每日可重复接取 */
  dailyRepeatable?: boolean;
  // 🆕 朝廷系统
  /** 影响力奖励 */
  rewardInfluence?: number;
  /** 是否需要朝廷身份 */
  requireCourtRank?: CourtRank;
  /** 朝廷路线专属（null=武林, 'wen'=文官, 'wu'=武官） */
  courtPath?: CourtPath | null;
}

/** 同时可接取的最大任务数 */
export const MAX_ACTIVE_MISSIONS = 3;

/** 玩家已接取的任务实例 */
export interface ActiveMission {
  defId: string;           // 引用 MissionDef.id
  status: MissionStatus;
  acceptedAt: number;      // Date.now()
  progress: number;        // 当前进度（如已击败敌人数量）
  progressMax: number;     // 目标进度
}

// ──── P1-2: 势力倾向系统 ────

/**
 * 势力倾向（参考信长之野望的保守/中道/革新）。
 * 影响势力间外交关系和 NPC 行为模式。
 * 当前覆盖现有 6 个 SectId，后续扩展新势力时补充。
 */
export type FactionAlignment =
  | 'righteous'    // 正道：崇尚侠义，锄强扶弱（武当/少林/峨眉/丐帮）
  | 'neutral'      // 中立：明哲保身，不偏不倚（华山）
  | 'unorthodox'   // 邪道：行事诡异，不择手段（预留）
  | 'chaotic';     // 混乱：随心所欲，不可预测（魔教）

/** 势力间关系状态 */
export type FactionRelation = 'allied' | 'friendly' | 'neutral' | 'tense' | 'hostile' | 'at_war';

/** 势力外交数据（含势力ID） */
export interface FactionDiplomacy {
  factionId: SectId;
  relation: FactionRelation;
  trust: number;            // 信任度 0-100
  /** 最近一次关系变动的原因 */
  lastEvent?: string;
  lastEventTurn?: number;
}

/** 势力间关系数据（无 factionId，用于 Record<SectId, Record<SectId, ...>> 结构） */
export interface FactionRelationData {
  relation: FactionRelation;
  trust: number;
  lastEvent?: string;
  lastEventTurn?: number;
}

/**
 * 势力倾向匹配表（参考信长之野望）。
 * 正道+正道 → 容易友好；正道+邪道 → 容易冲突。
 */
export const ALIGNMENT_AFFINITY: Record<string, Record<string, { affinity: number; desc: string }>> = {
  righteous: {
    righteous:   { affinity: +30, desc: '志同道合，共行侠义' },
    neutral:     { affinity: +10, desc: '敬其正道，略有往来' },
    unorthodox:  { affinity: -30, desc: '正邪不两立' },
    chaotic:     { affinity: -20, desc: '行事诡异，难以信任' },
  },
  neutral: {
    righteous:   { affinity: +10, desc: '敬其正道' },
    neutral:     { affinity: +15, desc: '井水不犯河水' },
    unorthodox:  { affinity: -5,  desc: '略有提防' },
    chaotic:     { affinity: -10, desc: '保持距离' },
  },
  unorthodox: {
    righteous:   { affinity: -30, desc: '正邪不两立' },
    neutral:     { affinity: -5,  desc: '井水不犯河水' },
    unorthodox:  { affinity: +20, desc: '臭味相投' },
    chaotic:     { affinity: +10, desc: '各行其道' },
  },
  chaotic: {
    righteous:   { affinity: -20, desc: '难以理解' },
    neutral:     { affinity: -10, desc: '不可预测' },
    unorthodox:  { affinity: +10, desc: '各行其道' },
    chaotic:     { affinity: +5,  desc: '混乱中的默契' },
  },
};

/** 文化相似度影响（相同标签越多，越容易友好） */
export function calcCultureAffinity(cultureA: string[], cultureB: string[]): number {
  const common = cultureA.filter(c => cultureB.includes(c)).length;
  return common * 10; // 每个共同标签 +10 友好度
}

/**
 * 现有势力倾向定义（对齐 types.ts 的 SectId）。
 * 后续新增势力时在此补充。
 */
export const FACTION_DEFS: Record<SectId, { alignment: FactionAlignment; culture: string[] }> = {
  wudang:  { alignment: 'righteous', culture: ['taoist', 'sword', 'mountain', 'inner-peace'] },
  shaolin: { alignment: 'righteous', culture: ['buddhist', 'fist', 'temple', 'discipline'] },
  emei:    { alignment: 'righteous', culture: ['buddhist', 'sword', 'mountain', 'female'] },
  beggar:  { alignment: 'righteous', culture: ['beggar', 'palm', 'street', 'loyalty'] },
  huashan: { alignment: 'neutral',   culture: ['sword', 'mountain', 'rivalry'] },
  demon:   { alignment: 'chaotic',   culture: ['moon', 'shadow', 'forbidden', 'power'] },
  // 🆕 五大新宗门
  maoshan: { alignment: 'righteous', culture: ['taoist', 'talisman', 'ritual', 'exorcism'] },
  kunlun:  { alignment: 'neutral',   culture: ['sword', 'mountain', 'remote', 'ascetic'] },
  qingcheng:{ alignment: 'neutral',  culture: ['taoist', 'sword', 'fist', 'mountain'] },
  tangmen: { alignment: 'neutral',   culture: ['poison', 'hidden_weapons', 'clan', 'secrecy'] },
  xiaoyao: { alignment: 'neutral',   culture: ['carefree', 'unique', 'elite', 'hidden'] },
  // 🆕 三大新门派
  quanzhen: { alignment: 'righteous', culture: ['taoist', 'sword', 'formation', 'inner-alchemy'] },
  kongtong: { alignment: 'neutral',   culture: ['fist', 'mountain', 'diverse', 'seven-injury'] },
  diancang: { alignment: 'neutral',   culture: ['sword', 'mountain', 'remote', 'southern'] },
  // 无门派（散修/朝堂纯文官）
  none:     { alignment: 'neutral',   culture: [] },
  // 🆕 P9 五大新势力
  riyue:    { alignment: 'chaotic',     culture: ['moon', 'sun', 'forbidden', 'power', 'shadow'] },
  tiezhang: { alignment: 'unorthodox', culture: ['fist', 'clan', 'water', 'brute-force'] },
  wudu:     { alignment: 'chaotic',    culture: ['poison', 'snake', 'ritual', 'gu-magic'] },
  xuedao:   { alignment: 'chaotic',    culture: ['blood', 'blade', 'chaos', 'slaughter'] },
  haisha:   { alignment: 'unorthodox', culture: ['sea', 'pirate', 'southern', 'mercenary'] },
};

// ──── P1-3: 双身份系统（庙堂之上 + 武林之中）────

/**
 * 庙堂身份（朝廷/科举路径）。
 * 与 DiscipleRank（武林身份）完全解耦，一个 NPC 可以同时是
 * "举人"（庙堂）和 "内门弟子"（武林）。
 */
export type CourtRank =
  | 'commoner'    // 平民（默认）
  | 'xiucai'      // 秀才
  | 'juren'       // 举人
  | 'jinshi'      // 进士
  | 'hanlin'      // 翰林
  | 'shangshu'    // 尚书
  | 'zaixiang';   // 宰相

export const COURT_RANK_ORDER: CourtRank[] = [
  'commoner', 'xiucai', 'juren', 'jinshi', 'hanlin', 'shangshu', 'zaixiang'
];

export const COURT_RANK_LABEL: Record<CourtRank, string> = {
  commoner:  '平民',
  xiucai:    '秀才',
  juren:     '举人',
  jinshi:    '进士',
  hanlin:    '翰林',
  shangshu:  '尚书',
  zaixiang:  '宰相',
};

/**
 * 双身份数据（每个 NPC 同时拥有）。
 * 两个身份完全独立 —— 一个当朝尚书可能是武林菜鸟，
 * 一个魔教教主也可能是科举进士（隐藏身份）。
 */
export interface DualIdentity {
  /** 庙堂身份（默认平民） */
  courtRank: CourtRank;
  /** 武林身份（默认外门弟子） */
  discipleRank: DiscipleRank;
}

// ──── P1-4: NPC 招募与收纳系统 ────

/** NPC 指派任务类型 */
export type NpcAssignment =
  | 'idle'          // 闲置（跟随玩家）
  | 'training'      // 修炼（NPC 自主修炼获取经验）
  | 'gathering'     // 采集（收集药材/矿石等材料）
  | 'exploring'     // 探索（派遣到其他城市获取情报）
  | 'guarding'      // 守备（驻扎在某个地点提供防御加成）
  | 'teaching'      // 传功（教导更低级 NPC 或玩家）
  | 'diplomacy';    // 外交（改善与其他势力关系）

export const ASSIGNMENT_LABEL: Record<NpcAssignment, string> = {
  idle:      '闲置',
  training:  '修炼',
  gathering: '采集',
  exploring: '探索',
  guarding:  '守备',
  teaching:  '传功',
  diplomacy: '外交',
};

/** NPC 招募/收纳操作结果 */
export interface RecruitResult {
  success: boolean;
  message: string;
  /** 操作类型：'recommend'=推荐入宗，'recruit'=招募为随从 */
  type: 'recommend' | 'recruit';
}

/** NPC 收纳集合（玩家已招募的 NPC 随从） */
export interface NpcCollection {
  /** 已招募的 NPC ID 列表 */
  recruited: string[];
  /** 当前最大招募槽位（由 discipleRank 决定） */
  maxSlots: number;
  /** NPC ID → 当前指派任务 */
  assignments: Record<string, string>;
  /** NPC ID → 指派目标（如 exploring 时的目标城市 ID） */
  assignmentTargets: Record<string, string>;
}

/** 不同宗门职级的 NPC 招募槽位 */
export const RANK_RECRUIT_SLOTS: Record<DiscipleRank, number> = {
  outer:        0,   // 外门弟子：无权招募
  inner:        1,   // 内门弟子：可带1名外门随从
  true:         2,   // 真传弟子：可带2名 ≤ 内门的随从
  elder:        3,   // 长老：可带3名 ≤ 真传的随从
  vice_leader:  4,   // 副掌门：可带4名 ≤ 长老的随从
  leader:       5,   // 掌门：可带5名 ≤ 副掌门的随从
};

/**
 * 招募权限表：当前职级可以招募的 NPC 最高职级。
 * 规则：只能招募比自己等级低的 NPC（exclusive）。
 */
export const RECRUIT_RANK_CAP: Record<DiscipleRank, DiscipleRank | null> = {
  outer:        null,         // 外门弟子无法招募任何人
  inner:        'outer',      // 内门弟子只能招募外门
  true:         'inner',      // 真传弟子最多招募内门
  elder:        'true',       // 长老最多招募真传
  vice_leader:  'elder',      // 副掌门最多招募长老
  leader:       'vice_leader',// 掌门最多招募副掌门
};

/** 推荐入宗的最低好感度要求 */
export const RECOMMEND_MIN_AFFECTION = 30;

/** 招募为随从的最低好感度要求 */
export const RECRUIT_MIN_AFFECTION = 50;

// ──── P2-1: 大地图（已实装）────
//
// 大地图已在 src/data/worldMap.ts 中完成沙盒重构：
//   - 移除：龙隐村/汉水渡口/苍岭山/黑月教遗址（改为剧情专属场景）
//   - 新增：洛阳/长安/开封/扬州/苏州/杭州/成都/大理（8个城市）
//   - 现有 14 个地点：4门派 + 10城市
//   - LocationAction 已增加 contribution 字段，无需额外类型
//
// 后续扩展：华山派/全真教/唐门/昆仑派等门派节点

// ──── P2-2: 偷师系统 ────

/** 偷师结果 */
export interface StealSkillResult {
  success: boolean;
  /** 偷到的技能 ID */
  skillId?: SkillId;
  /** 失败原因/成功描述 */
  message: string;
  /** 是否被发现（被发现后门派敌意上升） */
  detected: boolean;
  /** 被发现后的惩罚 */
  penalty?: {
    hostilityIncrease: number;    // 门派敌意增加
    bountyAmount?: number;        // 悬赏金额
    expelledFromSect?: boolean;   // 是否被逐出当前门派
  };
}

/** 偷师难度配置 */
export interface StealSkillConfig {
  /** 目标门派 */
  targetSect: SectId;
  /** 基础成功率（0-1） */
  baseSuccessRate: number;
  /** 玩家等级对成功率的加成（每级+0.01） */
  levelBonus: number;
  /** 被发现的基础概率（0-1） */
  baseDetectionRate: number;
  /** 可偷学的技能池 */
  stealableSkills: SkillId[];
  /** 偷学技能的品质上限 */
  maxSkillQuality: 'basic' | 'advanced' | 'master';
}

// ──── PlayerState 扩展字段 ────

/** 需要新增到 PlayerState 的字段 */
export interface SandboxPlayerFields {
  /** 宗门贡献值 */
  sectContribution: number;
  /** 贡献值变动日志 */
  contributionLog: ContributionLog[];
  /** 扩展后的宗门身份（武林之中） */
  discipleRank: DiscipleRank;
  /** 庙堂身份（庙堂之上） */
  courtRank: CourtRank;
  /** NPC 收纳（已招募的随从 + 指派） */
  npcCollection: NpcCollection;
  /** 当前接取的主命任务列表 */
  activeMissions: ActiveMission[];
  /** 已完成的晋升试炼 ID 列表 */
  completedTrials: string[];
  /** 声望值（0-1000） */
  reputation: number;
  /** 秘密效忠的势力（内应/间谍） */
  secretAffiliation?: {
    factionId: SectId;
    role: 'spy' | 'informant' | 'double_agent';
    suspicion: number;  // 当前门派怀疑度 0-100
  };
  // ── 朝廷系统 ──
  /** 朝廷四维属性 */
  courtStats: CourtStats;
  /** 朝廷影响力（朝廷的"修为"） */
  influence: number;
  /** 朝廷路线（null=未选择） */
  courtPath: CourtPath | null;
  /** 上一行动领域（用于分心惩罚判定） */
  lastActionType: LastActionType;
}

// ═════════════════════════════════════════════════════════
//  P1-3B: 朝廷系统（庙堂属性+文武分途+分心惩罚）
// ═════════════════════════════════════════════════════════

/** 朝廷四维属性 */
export interface CourtStats {
  /** 智谋（0-100）：策略谋划、用兵之道 */
  strategy: number;
  /** 口才（0-100）：雄辩说服、军令威严 */
  eloquence: number;
  /** 魅力（0-100）：人望魅力、收服人心 */
  charisma: number;
  /** 学识（0-100）：经史学问、兵书研读 */
  scholarship: number;
}

/** 朝廷发展路径 */
export type CourtPath = 'wen' | 'wu';

/** 行动领域类型（用于分心惩罚） */
export type LastActionType = 'martial' | 'court' | 'idle';

/** 武官路径对应的品阶名称 */
export const COURT_RANK_LABEL_WU: Record<CourtRank, string> = {
  commoner:  '平民',
  xiucai:    '校尉',
  juren:     '都尉',
  jinshi:    '将军',
  hanlin:    '大将军',
  shangshu:  '太尉',
  zaixiang:  '大司马',
};

/** 获取朝廷品阶名称（根据路径） */
export function getCourtRankLabel(rank: CourtRank, path: CourtPath | null): string {
  if (path === 'wu') return COURT_RANK_LABEL_WU[rank];
  return COURT_RANK_LABEL[rank];
}

/** 朝廷晋升所需影响力门槛 */
export const COURT_PROMOTION_REQUIREMENTS: Partial<Record<CourtRank, { minInfluence: number }>> = {
  xiucai:   { minInfluence: 100 },    // 平民→秀才/校尉
  juren:    { minInfluence: 300 },    // 秀才→举人/都尉
  jinshi:   { minInfluence: 600 },    // 举人→进士/将军
  hanlin:   { minInfluence: 1000 },   // 进士→翰林/大将军
  shangshu: { minInfluence: 1600 },   // 翰林→尚书/太尉
  zaixiang: { minInfluence: 2500 },   // 尚书→宰相/大司马
};

/**
 * 分心惩罚配置
 *
 * 鱼与熊掌不可兼得：
 * - 上一行动是 武林 → 本次朝廷行动 → 影响力收益 -30%
 * - 上一行动是 朝廷 → 本次武林行动 → 修为收益   -30%
 * - 连续同领域行动 → 无惩罚
 * - 闲置/休息 → 重置惩罚标记
 */
export const SPLIT_FOCUS_PENALTY = 0.30;  // 30% 收益减少
export const SPLIT_FOCUS_PENALTY_INFLUENCE = 0.30;  // 影响力惩罚（可独立调整）

/** 朝廷四维初始范围（玩家初始值在此范围内随机） */
export const COURT_STATS_INITIAL_RANGE = { min: 5, max: 20 };