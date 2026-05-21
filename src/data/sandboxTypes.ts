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

export type MissionTrack = 'jianghu' | 'court_wen' | 'court_wu' | 'universal';

export type MissionDifficulty = 'easy' | 'normal' | 'hard' | 'legendary';

export interface MissionDef {
  id: string;
  title: string;
  type: MissionType;
  /** 所属轨道：决定属性经验分配和货币类型 */
  track: MissionTrack;
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
  | 'righteous'    // 正道：崇尚侠义，锄强扶弱
  | 'neutral'      // 中立：明哲保身，不偏不倚
  | 'chaotic';     // 邪道：行事不择手段，随心所欲

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
    chaotic:     { affinity: -25, desc: '正邪不两立' },
  },
  neutral: {
    righteous:   { affinity: +10, desc: '敬其正道' },
    neutral:     { affinity: +15, desc: '井水不犯河水' },
    chaotic:     { affinity: -10, desc: '保持距离' },
  },
  chaotic: {
    righteous:   { affinity: -25, desc: '正邪不两立' },
    neutral:     { affinity: -10, desc: '不可预测' },
    chaotic:     { affinity: +10, desc: '混乱中的默契' },
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
  // 🆕 P7 朝廷与叛军
  imperial_court: { alignment: 'neutral',   culture: ['imperial', 'order', 'power', 'bureaucracy'] },
  rebels:         { alignment: 'chaotic',  culture: ['rebel', 'restoration', 'loyalty', 'frontier'] },
  // 🆕 P9 五大新势力
  riyue:    { alignment: 'chaotic',     culture: ['moon', 'sun', 'forbidden', 'power', 'shadow'] },
  tiezhang: { alignment: 'neutral', culture: ['fist', 'clan', 'water', 'brute-force'] },
  wudu:     { alignment: 'chaotic',    culture: ['poison', 'snake', 'ritual', 'gu-magic'] },
  xuedao:   { alignment: 'chaotic',    culture: ['blood', 'blade', 'chaos', 'slaughter'] },
  haisha:   { alignment: 'chaotic', culture: ['sea', 'pirate', 'southern', 'mercenary'] },
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
  // ── P10: 门派政务 ──
  /** 各势力当前活跃指令池（key = factionId） */
  factionDirectives: Record<string, FactionDirective[]>;
  /** NPC 政务记录（key = npcId） */
  factionOfficials: Record<string, FactionOfficial>;
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

/** 朝廷晋升条件（三国志式：功绩门槛 + 属性门 + 功绩消耗） */
export interface CourtPromotionRequirement {
  minInfluence: number;
  /** 晋升时消耗的功绩（影响力），防止"挂机攒够就升" */
  influenceCost: number;
  /** 文官路径属性门（口才→魅力→学识，自然成长即可达标） */
  wenStatGates?: Partial<CourtStats>;
  /** 武官路径属性门（智谋→魅力→口才，领军者所需） */
  wuStatGates?: Partial<CourtStats>;
}

/**
 * 朝廷晋升需求表。
 *
 * 设计原则：
 * - 属性门极低 —— 你做任务自然积累的属性一定够
 * - 不存在"功绩够了还要刻意刷属性"的情况
 * - 文官重"辩+学"，武官重"策+魅"
 * - 晋升消耗功绩（参考三国志的"花钱买官"感），防止无脑堆数值
 */
export const COURT_PROMOTION_REQUIREMENTS: Partial<Record<CourtRank, CourtPromotionRequirement>> = {
  xiucai: {
    minInfluence: 100,
    influenceCost: 0,          // 初次入仕不消耗
    wenStatGates: { eloquence: 12 },  // 做 2-3 次任务自然就有
    wuStatGates:  { strategy: 12 },
  },
  juren: {
    minInfluence: 300,
    influenceCost: 50,
    wenStatGates: { eloquence: 22, charisma: 18 },
    wuStatGates:  { strategy: 22, charisma: 18 },
  },
  jinshi: {
    minInfluence: 600,
    influenceCost: 100,
    wenStatGates: { eloquence: 28, scholarship: 22 },
    wuStatGates:  { strategy: 28, charisma: 22 },
  },
  hanlin: {
    minInfluence: 1000,
    influenceCost: 200,
    wenStatGates: { eloquence: 35, charisma: 28, scholarship: 25 },
    wuStatGates:  { strategy: 35, charisma: 28 },
  },
  shangshu: {
    minInfluence: 1600,
    influenceCost: 350,
    wenStatGates: { eloquence: 45, charisma: 38, scholarship: 35 },
    wuStatGates:  { strategy: 45, charisma: 38 },
  },
  zaixiang: {
    minInfluence: 2500,
    influenceCost: 500,
    wenStatGates: { eloquence: 55, charisma: 48, scholarship: 45 },
    wuStatGates:  { strategy: 55, charisma: 48 },
  },
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

// ═════════════════════════════════════════════════════════
//  P10: 门派政务官阶 + 势力指令池
// ═════════════════════════════════════════════════════════

/**
 * 门派政务官阶（行政系统，独立于武林 discipleRank 和朝廷 courtRank）。
 *
 * NPC 通过贡献点数 + 在势力内的相对属性排名晋升。
 * 官阶决定：每月可执行的势力指令数量 + 议事投票权重。
 *
 * 设计原则：
 * - 所有属性门槛使用"势力内排名百分比"（相对值），不用绝对值
 * - 晋升需要：贡献达标 + 相关属性在势力内前 X%
 * - 玩家和 NPC 共享同一套官阶系统
 */
export type FactionOfficialRank =
  | 'retainer'      // 门客（默认，无固定职司）
  | 'steward'       // 管事（初阶政务官）
  | 'director'      // 执事（中阶专业官，分野：度支/武备/外务）
  | 'councilor'     // 参议（高阶决策官，可影响势力议事）
  | 'vice_leader'   // 副掌门（二把手）
  | 'leader';       // 掌门（最高决策者，唯一）

/** 官阶 → 中文标签 */
export const FACTION_RANK_LABEL: Record<FactionOfficialRank, string> = {
  retainer:    '门客',
  steward:     '管事',
  director:    '执事',
  councilor:   '参议',
  vice_leader: '副掌门',
  leader:      '掌门',
};

/** 官阶顺序（从低到高） */
export const FACTION_RANK_ORDER: FactionOfficialRank[] = [
  'retainer', 'steward', 'director', 'councilor', 'vice_leader', 'leader',
];

/**
 * 官阶晋升配置。
 *
 * statGate 使用势力内排名百分比（0~1 之间，越小越严格）：
 * - 例 `{ stat: 'atk', topFraction: 0.5 }` → 需在势力内 atk 排前 50%
 * - `{ stat: 'agi', topFraction: 0.3 }` → 需在势力内 agi 排前 30%
 * - 多个 statGate 为 AND 关系
 */
export interface FactionRankConfig {
  rank: FactionOfficialRank;
  label: string;
  tier: number;                   // 0-5
  maxDirectives: number;          // 每月可执行指令数
  councilVotes: number;           // 议事投票权重
  minContribution: number;        // 最低贡献点
  statGates: Array<{ stat: 'atk' | 'def' | 'agi' | 'crit'; topFraction: number }>;
  /** 每月的资源俸禄 */
  stipend: number;
}

export const FACTION_RANK_CONFIGS: Record<FactionOfficialRank, FactionRankConfig> = {
  retainer: {
    rank: 'retainer', label: '门客', tier: 0,
    maxDirectives: 1, councilVotes: 0, minContribution: 0,
    statGates: [], stipend: 0,
  },
  steward: {
    rank: 'steward', label: '管事', tier: 1,
    maxDirectives: 1, councilVotes: 1, minContribution: 80,
    statGates: [
      { stat: 'agi', topFraction: 0.7 },
      { stat: 'def', topFraction: 0.7 },
    ],
    stipend: 10,
  },
  director: {
    rank: 'director', label: '执事', tier: 2,
    maxDirectives: 2, councilVotes: 2, minContribution: 200,
    statGates: [
      { stat: 'agi', topFraction: 0.5 },
      { stat: 'atk', topFraction: 0.5 },
    ],
    stipend: 20,
  },
  councilor: {
    rank: 'councilor', label: '参议', tier: 3,
    maxDirectives: 3, councilVotes: 4, minContribution: 450,
    statGates: [
      { stat: 'agi', topFraction: 0.35 },
      { stat: 'atk', topFraction: 0.35 },
      { stat: 'def', topFraction: 0.35 },
    ],
    stipend: 40,
  },
  vice_leader: {
    rank: 'vice_leader', label: '副掌门', tier: 4,
    maxDirectives: 4, councilVotes: 7, minContribution: 800,
    statGates: [
      { stat: 'agi', topFraction: 0.2 },
      { stat: 'atk', topFraction: 0.2 },
      { stat: 'def', topFraction: 0.2 },
    ],
    stipend: 70,
  },
  leader: {
    rank: 'leader', label: '掌门', tier: 5,
    maxDirectives: 5, councilVotes: 10, minContribution: 1500,
    statGates: [
      { stat: 'agi', topFraction: 0.1 },
      { stat: 'atk', topFraction: 0.1 },
      { stat: 'crit', topFraction: 0.1 },
    ],
    stipend: 120,
  },
};

// ──── 属性中译（游戏术语规范）───

/** 战斗四维中译 */
export const COMBAT_STAT_LABEL: Record<string, string> = {
  atk: '武力',
  def: '防御',
  agi: '身法',
  crit: '会心',
};

/** 朝廷四维中译 */
export const COURT_STAT_LABEL: Record<string, string> = {
  strategy: '智谋',
  eloquence: '口才',
  charisma: '魅力',
  scholarship: '学识',
};

// ──── 势力指令池 ────

/**
 * 势力 AI 议事产出的指令类型。
 *
 * 三轨并行：
 *   军务轨（siege/trade/diplomacy/develop/patrol/scout）— 势力级战略指令
 *   政务轨（court_*）— 朝廷任务，使用 CourtStats 裁决
 *   江湖轨（challenge/escort/seek_doctor/hunt_treasure/meditate/arena）— 个人历练
 */
export type FactionDirectiveType =
  // 军务轨（势力战略）
  | 'siege'       // 攻城略地（发兵攻打目标地点）
  | 'trade'       // 经商牟利（跑商赚取资源）
  | 'diplomacy'   // 外交往来（改善/离间他势力关系）
  | 'develop'     // 发展内政（提升繁荣度/稳定度）
  | 'patrol'      // 巡逻守备（提升短期防御 + 镇压叛乱）
  | 'scout'       // 刺探情报（侦察目标势力/地点）
  // 江湖轨（个人历练）
  | 'challenge'   // 挑战高手（以武会友，切磋成名）
  | 'escort'      // 护送镖车（保镖走镖，赚取酬金）
  | 'seek_doctor' // 寻访名医（求医问药，疗伤续命）
  | 'hunt_treasure' // 寻宝探秘（探索秘境，搜寻宝物）
  | 'meditate'    // 闭关修炼（潜心悟道，提升修为）
  | 'arena'       // 擂台比武（守擂争雄，扬名立万）
  | 'recruit';    // 招募人才（劝说散修加入势力）

export const DIRECTIVE_LABEL: Record<FactionDirectiveType, string> = {
  siege:     '攻城',
  trade:     '经商',
  diplomacy: '外交',
  develop:   '发展',
  patrol:    '守备',
  scout:     '侦察',
  challenge: '挑战',
  escort:    '护镖',
  seek_doctor: '求医',
  hunt_treasure: '寻宝',
  meditate:  '闭关',
  arena:     '擂台',
  recruit:   '招募',
};

/** 指令所属轨道 */
export type DirectiveTrack = 'military' | 'court' | 'jianghu';

/** 获取指令类型的轨道归属 */
export function getDirectiveTrack(type: FactionDirectiveType): DirectiveTrack {
  switch (type) {
    case 'siege': case 'trade': case 'diplomacy':
    case 'develop': case 'patrol': case 'scout':
    case 'recruit':
      return 'military';
    case 'challenge': case 'escort': case 'seek_doctor':
    case 'hunt_treasure': case 'meditate': case 'arena':
      return 'jianghu';
  }
}

/**
 * 势力指令（一条可由 NPC 认领执行的任务）。
 *
 * 与旧的 executeAssign() "存字符串"不同，这里的指令：
 * - 由 FactionAI 议事产生
 * - 带statAffinity（用于 NPC 自动匹配：高 atk 认领 siege，高 agi 认领 trade）
 * - 有进度条 + 过期时间
 * - 完成后结算势力属性变化
 */
export interface FactionDirective {
  id: string;
  type: FactionDirectiveType;
  factionId: SectId;
  label: string;
  description: string;
  /** 目标地点（siege/scout/trade） */
  targetLocation?: LocationId;
  /** 目标势力（diplomacy/scout/siege） */
  targetSect?: SectId;
  /** 1-10，越高 NPC 越优先认领 */
  priority: number;
  /**
   * 属性亲密度（战斗四维），表示各类属性对完成此指令的贡献权重。
   * NPC 的 stat × affinity 之和决定 NPC 完成指令的效率。
   * 军务轨主要使用此字段。
   */
  statAffinity: { atk: number; def: number; agi: number; crit: number };
  /**
   * 朝廷属性亲密度（江湖轨任务使用）。
   * 例如 seek_doctor 绑定魅力(charisma)，meditate 绑定学识(scholarship)。
   * 两个 affinity 并行计算：总进度 = 战斗亲和 + 朝廷亲和。
   */
  courtAffinity?: { strategy: number; eloquence: number; charisma: number; scholarship: number };
  /** 完成所需的总工作量 */
  progressNeeded: number;
  currentProgress: number;
  /** 已认领此指令的 NPC ID */
  assignedNpcId?: string;
  /** 玩家是否认领此指令 */
  claimedByPlayer?: boolean;
  completed: boolean;
  /** 完成后的势力属性变化描述 */
  rewardDescription: string;
  /** 创建月份 */
  createdAtMonth: number;
  /** 过期月份（超时自动移除） */
  expiresAtMonth: number;
}

/**
 * NPC 在势力内的政务记录。
 * 存储于 PlayerState.factionOfficials。
 */
export interface FactionOfficial {
  npcId: string;
  factionId: SectId;
  rank: FactionOfficialRank;
  /** 势力贡献点（功勋），用于晋升判定 */
  contribution: number;
  /** 本月已执行指令数 */
  directivesDoneThisMonth: number;
}

/** 势力指令每月基数（每个 faction 每月生成的指令数量基础值） */
export const DIRECTIVE_BASE_COUNT = 1;

/** 每多控制一个城市/据点，额外 +1 指令上限 */
export const DIRECTIVE_PER_TERRITORY = 1;

/** 指令最大数量 */
export const DIRECTIVE_MAX = 6;

/** 指令默认过期月数 */
export const DIRECTIVE_EXPIRE_MONTHS = 3;

/** 执行一条指令需要的最低官阶 */
export const DIRECTIVE_MIN_RANK: Record<FactionDirectiveType, FactionOfficialRank> = {
  siege:     'director',
  diplomacy: 'steward',
  trade:     'steward',
  develop:   'steward',
  patrol:    'steward',
  scout:     'steward',
  // 江湖轨：门客即可执行（个人历练，无需势力职衔）
  challenge:     'retainer',
  escort:        'retainer',
  seek_doctor:   'retainer',
  hunt_treasure: 'retainer',
  meditate:      'retainer',
  arena:         'retainer',
  recruit:       'steward',
};

// ═════════════════════════════════════════════════════════
//  统一据点属性（三国志式：城市与门派共享同一套属性框架）
// ═════════════════════════════════════════════════════════

/**
 * 据点属性（城市和门派据点共用）。
 *
 * 城市 = 高商业/低武学的据点
 * 门派 = 高武学/低商业的据点
 * 差异体现在权重不同，而非字段不同。
 */
export interface SettlementAttributes {
  /** 人口 0-100（影响税收、征兵上限） */
  population: number;
  /** 繁荣度 0-100（综合经济指标） */
  prosperity: number;
  /** 商业值 0-100（跑商收益、税率潜力） */
  commerce: number;
  /** 农业值 0-100（粮食供给、人口增长基础） */
  agriculture: number;
  /** 驻军 0-100（防御敌军的能力） */
  garrison: number;
  /** 城防值 0-100（攻城难度） */
  fortification: number;
  /** 治安 0-100（低治安→盗贼/叛乱风险） */
  publicOrder: number;
  /** 开发值 0-100（影响增长速率） */
  development: number;
  /** 武学值 0-100（仅门派据点有，城市默认为0） */
  martialArts: number;
  /** 学术值 0-100（影响 NPC 培养速度） */
  academy: number;
  /** 城市等级（仅城市有意义） */
  cityRank?: 'capital' | 'major' | 'minor';
}

/** 城市默认属性（按等级分档） */
export const CITY_DEFAULTS: Record<string, SettlementAttributes> = {
  capital: {
    population: 80, prosperity: 65, commerce: 75, agriculture: 55,
    garrison: 60, fortification: 70, publicOrder: 70, development: 55,
    martialArts: 0, academy: 60, cityRank: 'capital',
  },
  major: {
    population: 55, prosperity: 45, commerce: 50, agriculture: 45,
    garrison: 40, fortification: 45, publicOrder: 60, development: 35,
    martialArts: 0, academy: 35, cityRank: 'major',
  },
  minor: {
    population: 30, prosperity: 25, commerce: 25, agriculture: 30,
    garrison: 20, fortification: 20, publicOrder: 50, development: 15,
    martialArts: 0, academy: 15, cityRank: 'minor',
  },
};

/** 门派据点默认属性（按势力层级分档） */
export const SECT_SETTLEMENT_DEFAULTS: Record<string, SettlementAttributes> = {
  supreme: {
    population: 40, prosperity: 50, commerce: 30, agriculture: 35,
    garrison: 50, fortification: 55, publicOrder: 65, development: 45,
    martialArts: 85, academy: 65,
  },
  first_rate: {
    population: 30, prosperity: 40, commerce: 20, agriculture: 25,
    garrison: 35, fortification: 40, publicOrder: 55, development: 30,
    martialArts: 65, academy: 45,
  },
  second_rate: {
    population: 20, prosperity: 30, commerce: 15, agriculture: 20,
    garrison: 25, fortification: 25, publicOrder: 50, development: 20,
    martialArts: 45, academy: 30,
  },
  fringe: {
    population: 12, prosperity: 15, commerce: 8, agriculture: 15,
    garrison: 15, fortification: 15, publicOrder: 40, development: 10,
    martialArts: 30, academy: 15,
  },
};

/**
 * 势力层级 → 据点默认属性键的映射。
 * 用于初始化门派据点。
 */
export const SECT_TIER_TO_SETTLEMENT: Record<string, string> = {
  supreme: 'supreme',
  first_rate: 'first_rate',
  second_rate: 'second_rate',
  fringe: 'fringe',
  special: 'first_rate', // 逍遥等特殊门派按一流处理
};

/**
 * 每月据点自然变化量（用于 monthly tick）。
 */
export const SETTLEMENT_MONTHLY_TICK: Partial<SettlementAttributes> = {
  prosperity: 2,    // 繁荣度自然增长 +2/月
  commerce: 1,      // 商业微增
  agriculture: 1,   // 农业微增
  publicOrder: 1,   // 治安自然恢复（无战事时）
  development: 1,   // 开发微增
};
