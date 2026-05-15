// ============================================================
//  src/systems/NPCGenerator.ts — NPC 随机生成器
// ============================================================
//  生成随机 NPC：姓名、天赋、性格、等级、技能、朝廷属性、
//  法器装备、门派身份。为地图批量填充 NPC 提供核心引擎。
//
//  关键约束：
//  - 生成的 NPC ID 以 gen_ 开头，不与手写 NPC 冲突
//  - 宗门根据地 20-30 人、城市 ~10 人、京城 15-20 人
//  - 文武分途：京城 NPC 更倾向拥有朝廷身份
// ============================================================

import type { NpcStats, NpcPersonality } from '../data/npcStats';
import { NPC_STATS_INIT } from '../data/npcStats';
import type { SectId, SkillId, FabaoId, NpcAmbition } from '../data/types';
import { SECT_SKILL_TABLES } from '../data/sectSkillTables';
import { SECTS } from '../data/sects';
import type { TalentId } from '../data/realmConfig';
import type { CourtStats, CourtPath, DiscipleRank, CourtRank } from '../data/sandboxTypes';
import type { LocationId } from '../data/worldMap';
import { calculateFinalStats, NPC_TALENT_POOL, getTalentWeight, TALENT_TIER, type TalentTier } from '../data/realmConfig';
import { assignRandomPortraitIndex } from '../utils/npcPortrait';
import type { SectTier } from './WorldState';
import { getSectTier } from './WorldState';

// ═════════════════════════════════════════════════════════════
//  中文姓名池
// ═════════════════════════════════════════════════════════════

/** 百家姓（100 个常见姓氏） */
const SURNAMES = [
  '李','王','张','刘','陈','杨','赵','黄','周','吴',
  '徐','孙','胡','朱','高','林','何','郭','马','罗',
  '梁','宋','郑','谢','韩','唐','冯','于','董','萧',
  '程','曹','袁','邓','许','傅','沈','曾','彭','吕',
  '苏','卢','蒋','蔡','贾','丁','魏','薛','叶','阎',
  '余','潘','杜','戴','夏','钟','汪','田','任','姜',
  '范','方','石','姚','谭','廖','邹','熊','金','陆',
  '郝','孔','白','崔','康','毛','邱','秦','江','史',
  '顾','侯','邵','孟','龙','万','段','雷','钱','汤',
  '尹','易','常','武','乔','贺','赖','龚','文','温',
];

/** 男性名（武侠诗意象） */
const MALE_NAMES = [
  '云飞','天逸','子轩','浩然','若愚','怀瑾','思远','逸尘',
  '君昊','明哲','承志','修文','知白','守拙','清风','寒江',
  '鹤鸣','松涛','孤云','长空','剑心','问天','无涯','归海',
  '铁衣','龙渊','虎啸','鹏举','鸿飞','鹤翔','雁行','燕归',
  '云骅','景琰','墨离','洛川','萧然','庭坚','安石','文山',
  '镇岳','定邦','开济','辅仁','仲德','伯约','叔达','季通',
];

/** 女性名（古典诗意） */
const FEMALE_NAMES = [
  '若兰','静怡','婉儿','紫烟','清漪','素心','念慈','芷若',
  '灵犀','语嫣','疏影','暗香','拈花','听雪','月瑶','碧落',
  '青鸾','玄霜','灵均','浣纱','采薇','佩兰','含烟','凝香',
  '玉笙','画影','流萤','素问','兰舟','菱歌','冰卿','芸娘',
  '姣儿','璎珞','漱玉','锦瑟','华筝','瑶琴','知画','映月',
  '云裳','翠翘','珠帘','瑞锦','绮罗','琼英','蕙质','兰心',
];

// ═════════════════════════════════════════════════════════════
//  天赋 / 天骄 / 性格 / 职级随机池
// ═════════════════════════════════════════════════════════════

/**
 * 从天赋池中无放回抽取天赋。
 * 权重按 TALENT_TIER_CONFIG 层级比例分配 -> 层内均分。
 * 天骄模式：强制 2 绝世 + 1 上等。
 * 标准 NPC：~50% 1个天赋，~30% 2个天赋，~20% 3个天赋。
 */
function pickTalents(rng: () => number, isTianjiao: boolean): TalentId[] {
  if (isTianjiao) {
    // 天骄：2 绝世 + 1 上等（从对应层随机）
    const legendary = NPC_TALENT_POOL.filter(t => TALENT_TIER[t] === 'legendary');
    const superior = NPC_TALENT_POOL.filter(t => TALENT_TIER[t] === 'superior');
    const pick = (pool: TalentId[], count: number, r: () => number): TalentId[] => {
      const remaining = [...pool];
      const result: TalentId[] = [];
      for (let i = 0; i < count; i++) {
        if (remaining.length === 0) break;
        const idx = Math.floor(r() * remaining.length);
        result.push(remaining.splice(idx, 1)[0]!);
      }
      return result;
    };
    return [...pick(legendary, 2, rng), ...pick(superior, 1, rng)];
  }

  // 标准 NPC：确定天赋数量（~50% 1个，~30% 2个，~20% 3个）
  const countRoll = rng();
  const talentCount = countRoll < 0.50 ? 1 : countRoll < 0.80 ? 2 : 3;

  // 加权无放回抽取
  const result: TalentId[] = [];
  const remaining = [...NPC_TALENT_POOL];

  for (let draw = 0; draw < talentCount; draw++) {
    if (remaining.length === 0) break;
    const weights = remaining.map(t => getTalentWeight(t));
    const totalW = weights.reduce((s, w) => s + w, 0);
    let roll = rng() * totalW;
    let pickedIdx = 0;
    for (let i = 0; i < remaining.length; i++) {
      roll -= weights[i]!;
      if (roll <= 0) { pickedIdx = i; break; }
      pickedIdx = i;
    }
    result.push(remaining.splice(pickedIdx, 1)[0]!);
  }

  return result;
}

/** 天骄概率：0.5%（约每 200 个 NPC 出 1 个） */
const TIANJIAO_CHANCE = 0.005;

/** 天骄额外加成：修行×1.5，全属性+20% */
export const TIANJIAO_CULTIVATION_MUL = 1.5;
export const TIANJIAO_STAT_MUL = 1.20;

/** 性格列表 */
const PERSONALITY_POOL: NpcPersonality[] = [
  'aloof', 'kind', 'cunning', 'upright', 'gentle', 'bold',
];

/** 性格权重 */
const PERSONALITY_WEIGHTS: Record<NpcPersonality, number> = {
  aloof: 12, kind: 18, cunning: 10, upright: 15, gentle: 25, bold: 20,
};

/** P8: NPC志向列表及权重 */
const AMBITION_POOL: NpcAmbition[] = ['content', 'master', 'power', 'rebel', 'avenger'];
const AMBITION_WEIGHTS: Record<NpcAmbition, number> = {
  content: 40, master: 30, power: 18, rebel: 10, avenger: 2,
};

/** 金字塔职级比例（掌门由手写 NPC 独占，随机生成器不产出 leader/vice_leader） */
const PYRAMID_RATIOS = {
  elder: 0.08,   // 长老：总人数 × 8%
  true:  0.17,   // 真传：总人数 × 17%
  inner: 0.30,   // 内门：总人数 × 30%
  // 外门：剩余（约 45%）
};

/** 门派据点随机 NPC 职级权重（outer/inner/true/elder，不含 leader/vice_leader） */
const SECT_RANK_DIST: Record<DiscipleRank, number> = {
  outer: 50, inner: 30, true: 13, elder: 7, vice_leader: 0, leader: 0,
};

/** 城市散修的 DiscipleRank 分布（大多外门/内门，极少真传/长老） */
const CITY_RANK_DIST: Record<DiscipleRank, number> = {
  outer: 55, inner: 30, true: 10, elder: 5, vice_leader: 0, leader: 0,
};

// ═════════════════════════════════════════════════════════════
//  朝廷属性随机配置
// ═════════════════════════════════════════════════════════════

/** 朝廷品阶分布权重 */
const COURT_RANK_DIST: Record<CourtRank, number> = {
  commoner: 70, xiucai: 12, juren: 8, jinshi: 5, hanlin: 3, shangshu: 1, zaixiang: 1,
};

/** 京城（长安）朝廷品阶分布权重 — 高阶官员更多 */
const CAPITAL_COURT_RANK_DIST: Record<CourtRank, number> = {
  commoner: 35, xiucai: 18, juren: 15, jinshi: 12, hanlin: 10, shangshu: 6, zaixiang: 4,
};

// ═════════════════════════════════════════════════════════════
//  各门派技能表（level → SkillId）
// ═════════════════════════════════════════════════════════════

/** 武当派技能学习表 */
const WUDANG_SKILL_TABLE: Array<[number, SkillId]> = [
  [1, 'wudang_changquan'], [3, 'yangqi_jue'],
  [5, 'wudang_jianfa_basic'], [7, 'wudang_qinggong'],
  [11, 'mianzhang'], [13, 'wudang_sword'], [15, 'zixiao'],
  [17, 'wudang_huti'], [19, 'wudang_lianjian'],
  [21, 'taiji'], [23, 'taiji_jian'], [25, 'liangyi_sword'],
  [27, 'chunyang_gong'], [29, 'wudang_zhenfa'],
  [31, 'taiji_shengong'], [33, 'wudang_jianzhen'],
  [35, 'chunyang_wuji'], [37, 'sanfeng_yijian'],
  [41, 'wudang_tianren'], [43, 'wudang_hunypic'],
  [45, 'wudang_taiqing'], [47, 'wudang_zhenwu_jianyi'],
  [51, 'wudang_dao_jing'], [53, 'wudang_xuankong'],
  [55, 'wudang_taiyi'], [57, 'wudang_wuji_dao_jian'],
  [24, 'wudang_yunkai'], [26, 'wudang_songtao'], [28, 'wudang_guiyuan'],
];

/** 少林派技能学习表 */
const SHAOLIN_SKILL_TABLE: Array<[number, SkillId]> = [
  [1, 'luohan_fist'], [12, 'vajra_palm'],
  [22, 'yijin_jing'], [32, '72_arts'],
];

/** 峨眉派技能学习表 */
const EMEI_SKILL_TABLE: Array<[number, SkillId]> = [
  [1, 'emei_sword'], [12, 'liing_palm'],
  [22, 'emei_poison'], [32, 'hundred_birds'],
];

/** 丐帮技能学习表 */
const BEGGAR_SKILL_TABLE: Array<[number, SkillId]> = [
  [1, 'beggar_fist'], [10, 'stick_art'],
  [18, 'mud_walk'], [28, 'dragon_palm'],
];

/** 各门派技能表索引（全局表覆盖17宗门，本地详细表优先） */
const SECT_SKILL_TABLE: Partial<Record<SectId, Array<[number, SkillId]>>> = {
  ...SECT_SKILL_TABLES,
  // 本地 detailed table 覆盖，保证高等级 NPC 有更细致技能
  wudang: WUDANG_SKILL_TABLE,
  shaolin: SHAOLIN_SKILL_TABLE,
  emei: EMEI_SKILL_TABLE,
  beggar: BEGGAR_SKILL_TABLE,
};

// ═════════════════════════════════════════════════════════════
//  法器分配表（最低等级 → [武器, 衣服, 饰品]）
// ═════════════════════════════════════════════════════════════

const FABAO_BY_LV: Array<[number, { weapon: FabaoId | null; armor: FabaoId | null; accessory: FabaoId | null }]> = [
  [1,  { weapon: 'iron_sword',    armor: 'cloth_robe',    accessory: 'wooden_ring' }],
  [6,  { weapon: 'bamboo_staff',  armor: 'leather_vest',  accessory: 'copper_pendant' }],
  [11, { weapon: 'refined_sword', armor: 'silk_robe',     accessory: 'jade_ring' }],
  [16, { weapon: 'jade_staff',    armor: 'iron_mail',     accessory: 'silver_pendant' }],
  [21, { weapon: 'azure_sword',   armor: 'azure_robe',    accessory: 'sapphire_ring' }],
  [26, { weapon: 'crystal_staff', armor: 'golden_mail',   accessory: 'golden_pendant' }],
  [31, { weapon: 'void_blade',    armor: 'void_robe',     accessory: 'amethyst_ring' }],
  [36, { weapon: 'soul_staff',    armor: 'dragon_mail',   accessory: 'dragon_pendant' }],
  [41, { weapon: 'celestial_sword', armor: 'celestial_robe', accessory: 'divine_ring' }],
  [46, { weapon: 'dao_staff',     armor: 'divine_mail',   accessory: 'phoenix_pendant' }],
  [51, { weapon: 'tribulation_blade', armor: 'tribulation_robe', accessory: 'blood_ring' }],
  [56, { weapon: 'immortal_staff', armor: 'immortal_mail', accessory: 'immortal_pendant' }],
  [61, { weapon: 'saint_blade',   armor: 'saint_robe',    accessory: 'saint_ring' }],
  [66, { weapon: 'mahayana_staff', armor: 'mahayana_mail', accessory: 'mahayana_pendant' }],
  [71, { weapon: 'ascension_blade', armor: 'ascension_robe', accessory: 'ascension_ring' }],
  [76, { weapon: 'immortal_sword', armor: 'immortal_armor', accessory: 'immortal_jade' }],
];

// ═════════════════════════════════════════════════════════════
//  辅助函数
// ═════════════════════════════════════════════════════════════

/** 种子随机（基于位置+索引的确定性随机，保证同一 NPC 每次生成的属性一致） */
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** 加权随机选择 */
function weightedPick<T extends string>(
  items: T[],
  weights: Partial<Record<T, number>>,
  rng: () => number,
  defaultWeight: number = 1,
): T {
  const total = items.reduce((sum, item) => sum + (weights[item] ?? defaultWeight), 0);
  let roll = rng() * total;
  for (const item of items) {
    roll -= (weights[item] ?? defaultWeight);
    if (roll <= 0) return item;
  }
  return items[items.length - 1]!;
}

/** 根据门派获取弟子职级分布 */
function getRankDist(isSectHub: boolean): Record<DiscipleRank, number> {
  return isSectHub ? SECT_RANK_DIST : CITY_RANK_DIST;
}

/** 获取指定门派的当前等级可学技能（无专属技能表时走武当基础池） */
function getSkillsForLevel(sect: SectId, level: number): SkillId[] {
  const table = SECT_SKILL_TABLE[sect] ?? WUDANG_SKILL_TABLE;
  return table
    .filter(([lv]) => level >= lv)
    .map(([, sid]) => sid);
}

/** 获取等级对应的法器装配 */
function getFabaoForLevel(level: number): {
  weapon: FabaoId | null; armor: FabaoId | null; accessory: FabaoId | null;
} {
  let best = FABAO_BY_LV[0]![1];
  for (const [minLv, fabao] of FABAO_BY_LV) {
    if (minLv > level) break;
    best = fabao;
  }
  return { ...best };
}

// ═════════════════════════════════════════════════════════════
//  三角金字塔等级分布（按宗门层级差异化）
// ═════════════════════════════════════════════════════════════

/**
 * 三角金字塔：宗门层级越高，顶尖高手越多。
 *
 *   supreme（顶尖大派）:
 *     炼气40% / 筑基22% / 结丹16% / 元婴10% / 化神6% / 渡劫4% / 大乘2%
 *     掌门可达渡劫-大乘
 *
 *   first_rate（一流门派）:
 *     炼气42% / 筑基24% / 结丹16% / 元婴10% / 化神5% / 渡劫3%
 *     掌门可达化神-渡劫
 *
 *   second_rate（二流门派）:
 *     炼气44% / 筑基26% / 结丹16% / 元婴9% / 化神5%
 *     掌门可达元婴-化神
 *
 *   fringe（旁门左道）:
 *     炼气46% / 筑基28% / 结丹16% / 元婴7% / 化神3%
 *     掌门可达结丹-元婴
 *
 *   special（特殊）:
 *     与 first_rate 相同（逍遥派精英多，魔教人才济济）
 */
const TIER_PYRAMID: Record<SectTier, number[]> = {
  supreme:     [0.40, 0.22, 0.16, 0.10, 0.06, 0.04, 0.02],
  first_rate:  [0.42, 0.24, 0.16, 0.10, 0.05, 0.03, 0.00],
  second_rate: [0.44, 0.26, 0.16, 0.09, 0.05, 0.00, 0.00],
  fringe:      [0.46, 0.28, 0.16, 0.07, 0.03, 0.00, 0.00],
  special:     [0.40, 0.22, 0.16, 0.10, 0.06, 0.04, 0.02],
};

/** 大境界区间：[levelMin, levelMax] */
const REALM_BANDS: Array<[number, number]> = [
  [1, 10], [11, 20], [21, 30], [31, 40], [41, 50], [51, 60], [61, 70],
];

function pyramidLevel(sect: SectId, levelRange: [number, number], rng: () => number): number {
  const tier = getSectTier(sect);
  const dist = TIER_PYRAMID[tier] ?? TIER_PYRAMID['second_rate'];
  const roll = rng();

  let cumulative = 0;
  let bandIdx = 0;
  for (let i = 0; i < dist.length; i++) {
    cumulative += dist[i]!;
    if (roll < cumulative) { bandIdx = i; break; }
    bandIdx = i;
  }

  let [realmMin, realmMax] = REALM_BANDS[bandIdx]!;

  // 钳制到宗门允许的等级区间
  realmMin = Math.max(realmMin, levelRange[0]);
  realmMax = Math.min(realmMax, levelRange[1]);
  if (realmMin > realmMax) realmMin = realmMax;

  return realmMin + Math.floor(rng() * (realmMax - realmMin + 1));
}

// ═════════════════════════════════════════════════════════════
//  核心生成函数
// ═════════════════════════════════════════════════════════════

export interface NpcGenConfig {
  /** 所属门派 */
  sect: SectId;
  /** 所在地点 ID */
  locationId: LocationId;
  /** 在此地点的序号（决定种子） */
  index: number;
  /** 是否为宗门根据地 NPC */
  isSectHub: boolean;
  /** 是否为京城 NPC */
  isCapital: boolean;
  /** 等级范围（含） */
  levelRange: [number, number];
  /** 性别分布概率 (男,女) */
  genderChance: [number, number];
}

const DEFAULT_CONFIG: Omit<NpcGenConfig, 'sect' | 'locationId' | 'index'> = {
  isSectHub: true, isCapital: false,
  levelRange: [1, 30], genderChance: [0.55, 0.45],
};

/** 根据门派获取性别概率：少林仅男、峨眉仅女 */
function getSectGenderChance(sect: SectId): [number, number] {
  if (sect === 'shaolin') return [1, 0];
  if (sect === 'emei') return [0, 1];
  return [0.55, 0.45];
}

/**
 * 生成一个随机 NPC 的完整 NpcStats。
 * 使用种子随机保证同一 config 每次产出相同结果。
 */
export function generateNpc(config: NpcGenConfig): NpcStats {
  return _generateNpc(config);
}

/** 带预设职级生成（用于金字塔配额控制） */
function generateNpcWithRank(config: NpcGenConfig, rank: DiscipleRank): NpcStats {
  return _generateNpc(config, rank);
}

function _generateNpc(config: NpcGenConfig, presetRank?: DiscipleRank): NpcStats {
  const { sect, locationId, index, isSectHub, isCapital, levelRange, genderChance } = config;
  const seed = hashCode(`${sect}_${locationId}_${index}`);
  const rng = seededRandom(seed);

  // 性别
  const gender = rng() < genderChance[0] ? 'male' : 'female';

  // 姓名
  const surname = SURNAMES[Math.floor(rng() * SURNAMES.length)]!;
  const givenPool = gender === 'male' ? MALE_NAMES : FEMALE_NAMES;
  const given = givenPool[Math.floor(rng() * givenPool.length)]!;
  const name = surname + given;

  // ID（gen_门派_序号）
  const id = `gen_${sect}_${String(index).padStart(3, '0')}`;

  // 立绘池索引（确定性：同一 NPC 每次生成同一张图）
  const portraitIndex = assignRandomPortraitIndex(id);

  // 天骄判定（0.5%，优先于其他判定）
  const isTianjiao = rng() < TIANJIAO_CHANCE;

  // 等级（三角金字塔分布：宗门层级越高，顶尖高手越多）
  let level = pyramidLevel(sect, levelRange, rng);

  // 武林身份（预设职级优先，否则按概率随机）
  let discipleRank: DiscipleRank;
  if (presetRank) {
    discipleRank = presetRank;
  } else {
    const rankDist = getRankDist(isSectHub);
    const rankKeys = Object.keys(rankDist) as DiscipleRank[];
    discipleRank = weightedPick(rankKeys, rankDist as any, rng, 10);
  }

  // 朝廷身份
  const courtRankDist = isCapital ? CAPITAL_COURT_RANK_DIST : COURT_RANK_DIST;
  const courtRankKeys = Object.keys(courtRankDist) as CourtRank[];
  const courtRank = weightedPick(courtRankKeys, courtRankDist as any, rng, 5);

  // 朝廷路径（京城 NPC 更倾向拥有官员身份）
  const courtPathChance = isCapital ? 0.45 : 0.08;
  let courtPath: CourtPath | null = null;
  if (rng() < courtPathChance) {
    courtPath = rng() < 0.35 ? 'wen' : 'wu';
  }

  // 朝廷路线影响修为起点：文官修为低（炼气期 1-10），武官修为较高（筑基以上 ≥11）
  if (courtPath === 'wen') {
    level = Math.min(level, 10);
  } else if (courtPath === 'wu') {
    const maxLv = levelRange[1];
    level = Math.max(level, Math.min(11, maxLv));
  }

  // 🆕 P8: 天赋（~50% 1个，~30% 2个，~20% 3个；天骄强制2绝世+1上等）
  const talents = pickTalents(rng, isTianjiao);

  // 性格
  const personality = weightedPick(PERSONALITY_POOL, PERSONALITY_WEIGHTS, rng, 10);

  // 🆕 P8: NPC志向（加权随机，邪道/叛军势力提高 rebel 概率）
  let ambitionWeights = { ...AMBITION_WEIGHTS };
  const sectAlign = SECTS[sect]?.alignment;
  if (sectAlign === 'chaotic' || sect === 'rebels') {
    ambitionWeights = { ...ambitionWeights, rebel: ambitionWeights.rebel + 15, content: ambitionWeights.content - 10, master: ambitionWeights.master - 5 };
  }
  const ambition = weightedPick(AMBITION_POOL, ambitionWeights, rng, 5);

  // 朝廷四维（根据路径偏重）
  const courtStats: CourtStats = generateCourtStats(rng, courtPath, level);

  // 影响力（根据品阶）
  const influence = courtRank === 'commoner' ? 0
    : courtRank === 'xiucai' ? floorRand(50, 100, rng)
    : courtRank === 'juren' ? floorRand(150, 300, rng)
    : courtRank === 'jinshi' ? floorRand(400, 600, rng)
    : courtRank === 'hanlin' ? floorRand(700, 1000, rng)
    : courtRank === 'shangshu' ? floorRand(1200, 1600, rng)
    : floorRand(1800, 2500, rng);

  // 基础属性（含天赋加成 + 天骄加成）
  let stats = calculateFinalStats(level, talents);
  if (isTianjiao) {
    stats = {
      hp: Math.floor(stats.hp * TIANJIAO_STAT_MUL),
      mp: Math.floor(stats.mp * TIANJIAO_STAT_MUL),
      atk: Math.floor(stats.atk * TIANJIAO_STAT_MUL),
      def: Math.floor(stats.def * TIANJIAO_STAT_MUL),
      agi: Math.floor(stats.agi * TIANJIAO_STAT_MUL),
      crit: stats.crit + 5, // 天骄额外 +5% 暴击
    };
  }

  // 技能
  const skills = getSkillsForLevel(sect, level);

  // 法器
  const fabao = getFabaoForLevel(level);
  const ownedFabao: FabaoId[] = [];
  if (fabao.weapon) ownedFabao.push(fabao.weapon);
  if (fabao.armor) ownedFabao.push(fabao.armor);
  if (fabao.accessory) ownedFabao.push(fabao.accessory);

  return {
    id, name, talents, isTianjiao, sect, level,
    exp: 0,
    hp: stats.hp, maxHp: stats.hp,
    mp: stats.mp, maxMp: stats.mp,
    atk: stats.atk, def: stats.def, agi: stats.agi, crit: stats.crit,
    skills,
    equippedFabao: fabao,
    ownedFabao,
    currentLocationId: locationId,
    discipleRank,
    courtRank,
    personality,
    courtStats,
    influence,
    courtPath,
    gender,
    portraitIndex,
    ambition,
  };
}

/** 生成朝廷四维（根据等级和路径偏重） */
function generateCourtStats(rng: () => number, path: CourtPath | null, level: number): CourtStats {
  // 基础值随等级上升
  const base = Math.min(50, Math.floor(level * 2.5));

  let strategy = base + floorRand(0, 15, rng);
  let eloquence = base + floorRand(0, 15, rng);
  let charisma = base + floorRand(0, 15, rng);
  let scholarship = base + floorRand(0, 15, rng);

  // 路径偏重
  if (path === 'wen') {
    scholarship += floorRand(10, 25, rng);
    eloquence += floorRand(5, 15, rng);
    strategy = Math.max(0, strategy - 5);
  } else if (path === 'wu') {
    strategy += floorRand(10, 25, rng);
    charisma += floorRand(5, 15, rng);
    scholarship = Math.max(0, scholarship - 5);
  }

  // 钳制到 0-100
  return {
    strategy: Math.min(100, Math.max(0, strategy)),
    eloquence: Math.min(100, Math.max(0, eloquence)),
    charisma: Math.min(100, Math.max(0, charisma)),
    scholarship: Math.min(100, Math.max(0, scholarship)),
  };
}

function floorRand(min: number, max: number, rng: () => number): number {
  return Math.floor(min + rng() * (max - min + 1));
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0; // 转为 32 位整数
  }
  return Math.abs(hash);
}

// ═════════════════════════════════════════════════════════════
//  批量生成配置
// ═════════════════════════════════════════════════════════════

/** 门派根据地配置（P8: 按宗门层级分配人数与等级上限） */
interface SectHubConfig {
  locationId: LocationId;
  sect: SectId;
  countRange: [number, number];
  levelRange: [number, number];
}

const SECT_HUBS: SectHubConfig[] = [
  // ── 顶尖大派 (supreme): 人数多，顶尖高手可达大乘 ──
  { locationId: 'wudang_mountain',    sect: 'wudang',     countRange: [10, 14], levelRange: [1, 70] },
  { locationId: 'shaolin_temple',     sect: 'shaolin',    countRange: [16, 24], levelRange: [1, 65] },
  // ── 一流门派 (first_rate): 人数中上，顶尖高手可达渡劫 ──
  { locationId: 'emei_mountain',      sect: 'emei',       countRange: [14, 20], levelRange: [1, 55] },
  { locationId: 'beggar_hq',          sect: 'beggar',     countRange: [18, 24], levelRange: [1, 55] },
  { locationId: 'heimu_cliff',        sect: 'riyue',      countRange: [12, 18], levelRange: [1, 55] },
  { locationId: 'zhongnan_mountain',  sect: 'quanzhen',   countRange: [12, 18], levelRange: [1, 55] },
  { locationId: 'kunlun_mountain',    sect: 'kunlun',     countRange: [10, 16], levelRange: [1, 55] },
  { locationId: 'tangmen_estate',     sect: 'tangmen',    countRange: [10, 16], levelRange: [1, 55] },
  // ── 二流门派 (second_rate): 人数中等，顶尖可达化神 ──
  { locationId: 'huashan_base',       sect: 'huashan',    countRange: [12, 18], levelRange: [1, 45] },
  { locationId: 'qingcheng_mountain', sect: 'qingcheng',  countRange: [12, 18], levelRange: [1, 45] },
  { locationId: 'kongtong_mountain',  sect: 'kongtong',   countRange: [10, 16], levelRange: [1, 45] },
  { locationId: 'diancang_mountain',  sect: 'diancang',   countRange: [8, 14],  levelRange: [1, 45] },
  { locationId: 'chongqing_city',     sect: 'tiezhang',   countRange: [10, 16], levelRange: [1, 40] },
  // ── 旁门左道 (fringe): 人数较少，顶尖可达元婴 ──
  { locationId: 'maoshan_daoyuan',    sect: 'maoshan',    countRange: [12, 18], levelRange: [1, 35] },
  { locationId: 'dali_city',         sect: 'wudu',       countRange: [10, 16], levelRange: [1, 35] },
  { locationId: 'liangzhou_city',    sect: 'xuedao',     countRange: [8, 14],  levelRange: [1, 35] },
  { locationId: 'mingzhou_city',     sect: 'haisha',     countRange: [8, 14],  levelRange: [1, 35] },
  // ── 特殊: 逍遥派精锐少但层次高 ──
  { locationId: 'xiaoyao_valley',     sect: 'xiaoyao',    countRange: [5, 10],  levelRange: [15, 55] },
  // ── P7 朝廷与叛军 ──
  { locationId: 'kaifeng_city',      sect: 'imperial_court', countRange: [12, 18], levelRange: [1, 55] },
  { locationId: 'yanjing_city',      sect: 'rebels',         countRange: [5, 9],   levelRange: [15, 55] },
  // ── 黑月教暗桩（秘密据点，扬州的隐蔽联络点）──
  { locationId: 'yangzhou_city',     sect: 'demon',          countRange: [4, 8],   levelRange: [15, 45] },
];

/** 城市配置 */
interface CityConfig {
  locationId: LocationId;
  availableSects: SectId[];
  countRange: [number, number];
  levelRange: [number, number];
  isCapital: boolean;
}

const CITIES: CityConfig[] = [
  { locationId: 'xiangyang_city',  availableSects: ['wudang', 'beggar', 'huashan', 'demon', 'maoshan'],           countRange: [9, 12],  levelRange: [3, 25],  isCapital: false },
  { locationId: 'jiangling_city',  availableSects: ['wudang', 'emei', 'huashan', 'demon', 'qingcheng'],           countRange: [8, 11],  levelRange: [3, 25],  isCapital: false },
  { locationId: 'luoyang_city',    availableSects: ['shaolin', 'wudang', 'huashan', 'demon', 'kunlun', 'quanzhen'],countRange: [9, 12],  levelRange: [5, 28],  isCapital: false },
  { locationId: 'kaifeng_city',    availableSects: ['huashan', 'shaolin', 'wudang', 'demon', 'maoshan', 'quanzhen'],countRange: [9, 12],  levelRange: [5, 28],  isCapital: false },
  { locationId: 'yangzhou_city',   availableSects: ['beggar', 'huashan', 'emei', 'demon', 'maoshan', 'tangmen'],  countRange: [8, 11],  levelRange: [3, 25],  isCapital: false },
  { locationId: 'suzhou_city',     availableSects: ['huashan', 'emei', 'wudang', 'demon', 'maoshan'],             countRange: [8, 11],  levelRange: [3, 22],  isCapital: false },
  { locationId: 'hangzhou_city',   availableSects: ['emei', 'huashan', 'beggar', 'demon', 'maoshan'],             countRange: [8, 11],  levelRange: [3, 22],  isCapital: false },
  { locationId: 'chengdu_city',    availableSects: ['emei', 'beggar', 'huashan', 'demon', 'qingcheng', 'tangmen'],countRange: [8, 11],  levelRange: [3, 25],  isCapital: false },
  { locationId: 'dali_city',       availableSects: ['demon', 'huashan', 'beggar', 'emei', 'xiaoyao', 'kunlun', 'diancang'],countRange: [7, 10],levelRange: [5, 28], isCapital: false },
  // 🆕 三大新城市
  { locationId: 'jiangzhou_city',  availableSects: ['huashan', 'demon', 'maoshan', 'beggar', 'quanzhen'],         countRange: [7, 10],  levelRange: [3, 22],  isCapital: false },
  { locationId: 'tanzhou_city',    availableSects: ['huashan', 'demon', 'wudang', 'beggar', 'quanzhen', 'kunlun'],countRange: [8, 11],  levelRange: [3, 25],  isCapital: false },
  { locationId: 'guangzhou_city',  availableSects: ['demon', 'huashan', 'beggar', 'diancang', 'tangmen'],         countRange: [7, 10],  levelRange: [5, 28],  isCapital: false },
];

/** 京城配置 */
const CAPITAL: CityConfig = {
  locationId: 'changan_city',
  availableSects: ['huashan', 'shaolin', 'wudang', 'demon', 'emei', 'beggar', 'maoshan', 'kunlun', 'qingcheng', 'tangmen', 'xiaoyao', 'quanzhen', 'kongtong', 'diancang'],
  countRange: [15, 20],
  levelRange: [8, 35],
  isCapital: true,
};

/** 散修（城市中的无门派 NPC）占比 */
const CITY_WANDERER_CHANCE = 0.20;

/** 各门派可用 SectId 列表（城市散修随机选一个门派归属） */
const ALL_SECTS: SectId[] = [
  'wudang', 'shaolin', 'emei', 'beggar', 'huashan', 'demon',
  'maoshan', 'kunlun', 'qingcheng', 'tangmen', 'xiaoyao',
  'quanzhen', 'kongtong', 'diancang',
  'riyue', 'tiezhang', 'wudu', 'xuedao', 'haisha',
  'imperial_court', 'rebels',
];

// ═════════════════════════════════════════════════════════════
//  批量生成入口
// ═════════════════════════════════════════════════════════════

/**
 * 调用前传的主随机种子（全局唯一）。
 * 在游戏初始化时传入一个固定种子或随机种子。
 */
let GLOBAL_SEED = 42;

export function setNpcGenSeed(seed: number): void {
  GLOBAL_SEED = seed;
}

/**
 * 生成全部随机 NPC。
 * 返回 Record<string, NpcStats>，可直接合并到 npcDatabase。
 */
export function generateAllNpcs(): Record<string, NpcStats> {
  const all: Record<string, NpcStats> = {};
  const globalRng = seededRandom(GLOBAL_SEED);

  // 预统计手写 NPC 的职级占用（掌门/长老/真传/内门/外门，按宗门）
  const handcraftedQuota: Record<string, Record<string, number>> = {};
  for (const [, init] of Object.entries(NPC_STATS_INIT)) {
    const s = init.sect;
    const r = init.discipleRank;
    if (s === 'none') continue;
    if (!handcraftedQuota[s]) handcraftedQuota[s] = {};
    handcraftedQuota[s]![r] = (handcraftedQuota[s]![r] ?? 0) + 1;
  }

  // 1. 宗门根据地 NPC（含金字塔配额控制）
  for (const hub of SECT_HUBS) {
    const [min, max] = hub.countRange;
    const totalN = min + Math.floor(globalRng() * (max - min + 1));
    const hc = handcraftedQuota[hub.sect] ?? {};

    // 计算金字塔配额
    const quotaElder  = Math.max(1, Math.floor(totalN * PYRAMID_RATIOS.elder)) - (hc['elder'] ?? 0);
    const quotaTrue   = Math.max(2, Math.floor(totalN * PYRAMID_RATIOS.true))  - (hc['true'] ?? 0) - (hc['vice_leader'] ?? 0);
    const quotaInner  = Math.max(3, Math.floor(totalN * PYRAMID_RATIOS.inner)) - (hc['inner'] ?? 0);
    const quotaOuter  = totalN - 1; // 掌门占1（手写），剩余全部外门兜底

    let genElder = 0, genTrue = 0, genInner = 0;

    for (let i = 0; i < totalN; i++) {
      // 根据剩余配额选择职级
      let rank: DiscipleRank;
      const roll = globalRng();
      if (genElder < quotaElder && roll < 0.10) {
        rank = 'elder'; genElder++;
      } else if (genTrue < quotaTrue && roll < 0.30) {
        rank = 'true'; genTrue++;
      } else if (genInner < quotaInner && roll < 0.60) {
        rank = 'inner'; genInner++;
      } else {
        rank = 'outer';
      }

      const npc = generateNpcWithRank({
        sect: hub.sect,
        locationId: hub.locationId,
        index: i,
        isSectHub: true,
        isCapital: false,
        levelRange: hub.levelRange,
        genderChance: getSectGenderChance(hub.sect),
      }, rank);
      all[npc.id] = npc;
    }
  }

  // 2. 城市 NPC（含散修）
  for (const city of CITIES) {
    const [min, max] = city.countRange;
    const count = min + Math.floor(globalRng() * (max - min + 1));

    for (let i = 0; i < count; i++) {
      const localRng = seededRandom(hashCode(`${city.locationId}_city_${i}`));
      // 有一定概率是散修（无明确门派归属但仍需要一个 sect 归属）
      const isWanderer = localRng() < CITY_WANDERER_CHANCE;
      const sect = isWanderer
        ? ALL_SECTS[Math.floor(localRng() * ALL_SECTS.length)]!
        : city.availableSects[Math.floor(localRng() * city.availableSects.length)]!;

      const npc = generateNpc({
        sect,
        locationId: city.locationId,
        index: i,
        isSectHub: false,
        isCapital: false,
        levelRange: city.levelRange,
        genderChance: getSectGenderChance(sect),
      });
      all[npc.id] = npc;
    }
  }

  // 3. 京城（长安）NPC — 更多官员、更高等级
  const [capMin, capMax] = CAPITAL.countRange;
  const capCount = capMin + Math.floor(globalRng() * (capMax - capMin + 1));

  for (let i = 0; i < capCount; i++) {
    const localRng = seededRandom(hashCode(`changan_city_cap_${i}`));
    const isWanderer = localRng() < 0.10; // 京城散修较少
    const sect = isWanderer
      ? ALL_SECTS[Math.floor(localRng() * ALL_SECTS.length)]!
      : CAPITAL.availableSects[Math.floor(localRng() * CAPITAL.availableSects.length)]!;

    const npc = generateNpc({
      sect,
      locationId: 'changan_city',
      index: i,
      isSectHub: false,
      isCapital: true,
      levelRange: CAPITAL.levelRange,
      genderChance: getSectGenderChance(sect),
    });
    all[npc.id] = npc;
  }

  return all;
}

/**
 * 获取生成的 NPC 数量统计
 */
export function getNpcGenStats(): {
  sectHubs: number;
  cities: number;
  capital: number;
  total: number;
} {
  const globalRng = seededRandom(GLOBAL_SEED);

  let sectHubs = 0;
  for (const hub of SECT_HUBS) {
    const [min, max] = hub.countRange;
    sectHubs += min + Math.floor(globalRng() * (max - min + 1));
  }

  let cities = 0;
  for (const city of CITIES) {
    const [min, max] = city.countRange;
    cities += min + Math.floor(globalRng() * (max - min + 1));
  }

  const [capMin, capMax] = CAPITAL.countRange;
  const capital = capMin + Math.floor(globalRng() * (capMax - capMin + 1));

  return { sectHubs, cities, capital, total: sectHubs + cities + capital };
}
