// ============================================================
//  src/systems/CourtEngine.ts — 朝廷任务裁决引擎
// ============================================================
//  灵感来源：三国志 / 太阁立志传
//
//  核心逻辑：
//    1. 修为（武力）直接绑定朝廷军事能力
//       → 门派掌门的武艺通神 = 在朝堂中极强的军事威慑力
//       → 但智谋/学识/魅力独立于修为，一个强者未必懂兵法
//    2. D100 裁决：属性加权 → 掷骰 → 与难度对比 → 四档结果
//    3. 天赋系统：政务天赋提高特定领域成功率，复合天赋跨界加成
//    4. 文武分途：文官任务侧重口才+学识，武官任务侧重智谋+武力
// ============================================================

import type { CourtStats, CourtPath } from '../data/sandboxTypes';
import type { TalentId } from '../data/realmConfig';
import { TALENTS, getTalentCourtBonus } from '../data/realmConfig';

// ──── 任务裁决结果 ────

export type CourtOutcome =
  | 'critical_success'  // 大成功
  | 'success'           // 成功
  | 'marginal'          // 勉强
  | 'failure';          // 失败

/** 单次朝廷任务裁决的完整结果 */
export interface CourtResolution {
  /** 裁决结果 */
  outcome: CourtOutcome;
  /** D100 掷骰值 */
  diceRoll: number;
  /** 有效能力值（属性加权 × 天赋加成后） */
  effectiveAbility: number;
  /** 目标难度 */
  difficulty: number;
  /** 最终检定值（diceRoll + ability - difficulty） */
  finalCheck: number;
  /** 影响力基础收益 */
  baseInfluence: number;
  /** 影响力实际收益（含天赋乘数） */
  actualInfluence: number;
  /** 朝廷四维成长 */
  statGrowth: Partial<CourtStats>;
  /** 触发的天赋加成列表 */
  talentsApplied: string[];
  /** 结果描述文本 */
  flavorText: string;
}

// ──── 任务类别与属性权重 ────

export type CourtMissionCategory =
  | 'military'       // 军事行动（征讨、巡逻、平叛）
  | 'diplomacy'      // 外交交涉（出使、斡旋、结盟）
  | 'governance'     // 民政治理（赈灾、编户、修典）
  | 'investigation'  // 密探查访（稽查、审计、情报）
  | 'recruitment'    // 招贤纳士（征辟、举荐、科举）
  | 'court_debate';  // 朝堂辩论（弹劾、策论、廷议）

/** 各任务类别对应的四维权重（总和 = 1.0） */
const CATEGORY_WEIGHTS: Record<CourtMissionCategory, Partial<Record<keyof CourtStats, number>>> = {
  military:      { strategy: 0.50 },                         // 军事→智谋50% + 武力50%
  diplomacy:     { eloquence: 0.55, charisma: 0.45 },        // 外交→口才+魅力
  governance:    { scholarship: 0.55, charisma: 0.45 },      // 治理→学识+魅力
  investigation: { strategy: 0.40, eloquence: 0.30, scholarship: 0.30 }, // 密探→智谋+口才+学识
  recruitment:   { charisma: 0.55, eloquence: 0.45 },        // 招募→魅力+口才
  court_debate:  { eloquence: 0.50, scholarship: 0.50 },     // 辩论→口才+学识
};

/** 是否为核心军事类别（受武力绑定影响） */
function isMilitaryCategory(cat: CourtMissionCategory): boolean {
  return cat === 'military';
}

// ──── 难度配置 ────

export type CourtDifficulty = 'easy' | 'normal' | 'hard' | 'legendary';

export const DIFFICULTY_CONFIG: Record<CourtDifficulty, { threshold: number; label: string }> = {
  easy:     { threshold: 20, label: '简单' },
  normal:   { threshold: 45, label: '普通' },
  hard:     { threshold: 70, label: '困难' },
  legendary:{ threshold: 95, label: '传说' },
};

// ──── 核心函数 ────

/**
 * 计算朝廷武力（修为绑定）。
 *
 * 设计理念（三国志灵感）：
 *   一个渡劫期（level 50+）的武林高手进入朝堂，
 *   其个人武力直接转化为军事威慑力。
 *   — 带兵冲锋陷阵：武力碾压
 *   — 威慑敌方将领：修为压制
 *   — 但排兵布阵、运筹帷幄还需智谋（strategy）
 *
 *   掌门 → 武力顶天，但统帅/政务未必同等
 *   文官 → 智谋/学识高，武力可忽略
 *
 * @param level 修为等级（1-80）
 * @param atk   攻击力（可选，用于微调）
 * @returns 朝廷武力值（0-200）
 */
export function getCourtMilitaryPower(level: number, atk?: number): number {
  // 基础：每级 ≈ 2.5 点武力
  // 炼气   (1-10):   2.5~25
  // 筑基   (11-20):  27.5~50
  // 结丹   (21-30):  52.5~75
  // 元婴   (31-40):  77.5~100
  // 化神   (41-50):  102.5~125
  // 渡劫   (51-60):  127.5~150
  // 大乘   (61-70):  152.5~175
  // 飞升   (71-80):  177.5~200
  let power = level * 2.5;

  // 攻击力微调（每 50 点 atk ≈ +1 武力）
  if (atk !== undefined) {
    power += atk * 0.02;
  }

  return Math.round(power);
}

/**
 * 获取朝廷武力对任务类别的贡献。
 * 仅对军事类别生效，权重 50%。
 */
function getMilitaryPowerContribution(
  category: CourtMissionCategory,
  militaryPower: number,
): number {
  if (!isMilitaryCategory(category)) return 0;
  // 武力上限 150，映射到 0-75 的贡献值
  return Math.min(militaryPower, 150) * 0.5;
}

/**
 * 计算任务的"有效能力值"（属性加权 + 武力绑定 + 天赋修正）。
 *
 * 像三国志一样：不同任务吃不同属性，武力只影响军事。
 * D100 掷骰基于此值做对抗检定。
 */
export function getEffectiveAbility(
  category: CourtMissionCategory,
  courtStats: CourtStats,
  level: number,
  atk: number,
  talents: TalentId[],
): { ability: number; breakdown: string[]; talentsApplied: string[] } {
  const weights = CATEGORY_WEIGHTS[category];
  const militaryPower = getCourtMilitaryPower(level, atk);
  const breakdown: string[] = [];
  const talentsApplied: string[] = [];

  // 1. 四维加权求和
  let ability = 0;
  for (const [stat, weight] of Object.entries(weights) as [keyof CourtStats, number][]) {
    let statVal = courtStats[stat] ?? 10;

    // 应用天赋加成
    for (const tid of talents) {
      const cb = getTalentCourtBonus(tid);
      if (cb?.[stat]) {
        statVal += cb[stat]!;
        if (!talentsApplied.includes(tid)) talentsApplied.push(tid);
      }
      // hidden_potential 大器晚成
      if (tid === 'hidden_potential' && level >= 30) {
        statVal += 25;
        if (!talentsApplied.includes(tid)) talentsApplied.push(tid);
      }
    }

    // benevolent_ruler 仁者之风对所有 stat 加 8（已在上面 loop 中处理）
    const contribution = statVal * weight;
    ability += contribution;
    breakdown.push(`${stat}=${Math.round(statVal)}×${weight}=${Math.round(contribution)}`);
  }

  // 钳制到 0-100
  ability = Math.min(100, Math.max(0, ability));

  // 2. 军事任务：武力绑定
  if (isMilitaryCategory(category)) {
    const mpContribution = getMilitaryPowerContribution(category, militaryPower);

    // warlord 天赋：军事武力 ×1.5
    let mpMultiplier = 1.0;
    for (const tid of talents) {
      const cb = getTalentCourtBonus(tid);
      if (cb?.militaryPowerMul) {
        mpMultiplier = Math.max(mpMultiplier, cb.militaryPowerMul);
        if (!talentsApplied.includes(tid)) talentsApplied.push(tid);
      }
    }

    const finalMP = mpContribution * mpMultiplier;
    ability = Math.min(100, ability + finalMP);
    breakdown.push(`武力=${Math.round(militaryPower)}→贡献${Math.round(finalMP)}`);
  }

  return {
    ability: Math.round(ability),
    breakdown,
    talentsApplied,
  };
}

/**
 * D100 掷骰 → 裁决结果。
 *
 * 三国志风格：
 *   finalCheck = D100 + effectiveAbility - difficulty
 *   ≥ 80 → 大成功（天佑！）
 *   ≥ 40 → 成功
 *   ≥ 0  → 勉强（涉险过关）
 *   < 0  → 失败
 */
function rollOutcome(finalCheck: number): CourtOutcome {
  if (finalCheck >= 80) return 'critical_success';
  if (finalCheck >= 40) return 'success';
  if (finalCheck >= 0) return 'marginal';
  return 'failure';
}

/** 各结果档位的奖励倍率 */
const OUTCOME_MULTIPLIERS: Record<CourtOutcome, { influence: number; statGain: number }> = {
  critical_success: { influence: 2.0, statGain: 2.0 },
  success:          { influence: 1.0, statGain: 1.0 },
  marginal:         { influence: 0.4, statGain: 0.3 },
  failure:          { influence: -0.2, statGain: 0.0 },
};

// ──── 公开 API ────

export interface ResolveCourtMissionParams {
  /** 任务类别 */
  category: CourtMissionCategory;
  /** 任务难度 */
  difficulty: CourtDifficulty;
  /** 玩家朝廷四维 */
  courtStats: CourtStats;
  /** 玩家修为等级 */
  level: number;
  /** 玩家攻击力 */
  atk: number;
  /** 玩家天赋列表 */
  talents: TalentId[];
  /** 任务基础影响力奖励 */
  baseInfluenceReward: number;
}

/**
 * 执行一次朝廷任务裁决。
 *
 * 这是 CourtEngine 的主入口，模拟三国志/太阁立志传中
 * "属性决定任务成败"的核心体验。
 */
export function resolveCourtMission(params: ResolveCourtMissionParams): CourtResolution {
  const { category, difficulty, courtStats, level, atk, talents, baseInfluenceReward } = params;
  const diffConfig = DIFFICULTY_CONFIG[difficulty];

  // 1. 计算有效能力
  const { ability, breakdown, talentsApplied } = getEffectiveAbility(
    category, courtStats, level, atk, talents,
  );

  // 2. D100 掷骰
  const diceRoll = Math.floor(Math.random() * 100) + 1;

  // 3. 检定
  const finalCheck = diceRoll + ability - diffConfig.threshold;
  const outcome = rollOutcome(finalCheck);

  // 4. 奖励计算
  const multipliers = OUTCOME_MULTIPLIERS[outcome];

  // 影响力收益（含天赋加成）
  let influenceMultiplier = multipliers.influence;
  for (const tid of talents) {
    const cb = getTalentCourtBonus(tid);
    if (cb?.influenceGainMul) {
      influenceMultiplier *= cb.influenceGainMul;
    }
  }
  const actualInfluence = Math.round(baseInfluenceReward * influenceMultiplier);

  // 5. 四维成长（关联类别权重）
  const weights = CATEGORY_WEIGHTS[category];
  const statGrowth: Partial<CourtStats> = {};
  for (const stat of Object.keys(weights) as (keyof CourtStats)[]) {
    const baseGain = Math.max(1, Math.round(diffConfig.threshold / 15));
    statGrowth[stat] = Math.round(baseGain * multipliers.statGain);
  }

  // 6. 结果文本
  const flavorText = generateFlavorText(outcome, category, finalCheck, breakdown, talentsApplied);

  return {
    outcome,
    diceRoll,
    effectiveAbility: ability,
    difficulty: diffConfig.threshold,
    finalCheck,
    baseInfluence: baseInfluenceReward,
    actualInfluence,
    statGrowth,
    talentsApplied,
    flavorText,
  };
}

/**
 * 获取朝廷四维中与任务类别关联的统计维度列表。
 * 用于在 UI 中展示"本次任务需要哪些能力"。
 */
export function getMissionStatRequirements(
  category: CourtMissionCategory,
): { stat: keyof CourtStats; weight: number }[] {
  const weights = CATEGORY_WEIGHTS[category];
  return Object.entries(weights).map(([stat, weight]) => ({
    stat: stat as keyof CourtStats,
    weight,
  }));
}

/**
 * 获取当前朝廷武力等级的文本描述。
 */
export function getMilitaryPowerRank(power: number): string {
  if (power >= 120) return '万夫莫敌';
  if (power >= 90) return '勇冠三军';
  if (power >= 60) return '骁勇善战';
  if (power >= 35) return '能征惯战';
  if (power >= 15) return '初通武艺';
  return '手无缚鸡之力';
}

// ──── 结果文本生成 ────

const OUTCOME_FLAVOR: Record<CourtOutcome, Record<CourtMissionCategory, string[]>> = {
  critical_success: {
    military:      ['万军之中取上将首级！战场一片哗然。', '铁骑踏破敌阵，如入无人之境！', '令旗一挥，三军齐发，敌军溃不成军！'],
    diplomacy:     ['三寸不烂之舌说动四方来朝，使臣心悦诚服。', '纵横捭阖，一语定乾坤，诸侯皆服。', '巧舌如簧，化干戈为玉帛，朝野震动。'],
    governance:    ['天下称颂青天在世，百姓感戴，万民上书。', '政通人和，百废俱兴，治绩冠绝天下。', '赈灾有方，万民得救，圣上龙颜大悦。'],
    investigation: ['顺藤摸瓜，一网打尽贪腐集团，朝纲为之一振。', '神目如电，蛛丝马迹间竟揪出惊天大案！', '不动声色间查抄权奸府邸，证据确凿。'],
    recruitment:   ['慧眼识珠，所荐之才皆为栋梁，满朝称赞。', '一纸征辟引来卧龙凤雏，圣上大喜过望。', '桃李满天下，门下尽是治国安邦之才。'],
    court_debate:  ['引经据典，滔滔不绝，满朝文武无一人敢驳。', '一语道破天机，圣上抚掌称善，群臣叹服。', '理据充足，言辞犀利，当场弹劾权臣成功！'],
  },
  success: {
    military:      ['旗开得胜，大败贼寇，边境恢复安宁。', '率军出击，斩获颇丰，此战可入军报。'],
    diplomacy:     ['出使顺利，双方握手言和，缔结盟约。', '言辞得体，宾主尽欢，事成而归。'],
    governance:    ['政务处理妥当，百姓安居乐业。', '有条不紊，诸事顺遂，上官赞许。'],
    investigation: ['明察暗访，查获重要线索，真相渐白。', '抽丝剥茧，案情取得关键突破。'],
    recruitment:   ['举荐之才可堪一用，不负所望。', '寻访各地，终得贤才，欣然纳入麾下。'],
    court_debate:  ['据理力争，言辞恳切，多数朝臣表示赞同。', '条理清晰，引据详实，圣上微微颔首。'],
  },
  marginal: {
    military:      ['勉强击退敌军，己方亦有伤亡，未竟全功。', '鏖战多时方才突围，虽退敌但元气大伤。'],
    diplomacy:     ['谈判磕绊，勉强达成协议，对方心有不甘。', '虽已缔约，但诸多细节悬而未决。'],
    governance:    ['捉襟见肘，勉强应付，百姓略有怨言。', '仓促处理，疏漏不少，好在未酿大祸。'],
    investigation: ['线索断断续续，勉强查到些许眉目。', '几番周折，仅得皮毛，关键证据仍无下落。'],
    recruitment:   ['所荐之人才具平庸，勉强可用。', '奔波数日，仅得一庸碌之辈。'],
    court_debate:  ['论据不足，勉强自圆其说，朝臣将信将疑。', '言辞闪烁，漏洞百出，还好未当场被驳倒。'],
  },
  failure: {
    military:      ['兵败如山倒！损兵折将，朝野震动。', '中了埋伏，全军溃散，仅以身免。'],
    diplomacy:     ['出言不逊，激怒对方，邦交恶化。', '谈判破裂，险些引发战端。'],
    governance:    ['政令不行，民怨沸腾，被弹劾失职。', '处置失当，酿成民变，圣上震怒。'],
    investigation: ['打草惊蛇，证据被销毁，查无实据。', '反被诬陷，自身难保，无功而返。'],
    recruitment:   ['所荐非人，此子竟是个奸佞之徒。', '求贤若渴未果，反而得罪了一方豪强。'],
    court_debate:  ['被驳得体无完肤，当朝出丑，威信扫地。', '引据有误，被对方反将一军，颜面尽失。'],
  },
};

function generateFlavorText(
  outcome: CourtOutcome,
  category: CourtMissionCategory,
  _finalCheck: number,
  _breakdown: string[],
  _talentsApplied: string[],
): string {
  const pool = OUTCOME_FLAVOR[outcome][category];
  if (!pool || pool.length === 0) return '任务结算完毕。';
  // 使用 finalCheck 作为伪随机种子选择文本（确保同一结果稳定）
  const idx = Math.abs(_finalCheck) % pool.length;
  let text = pool[idx] ?? pool[0]!;

  // 天赋触发的额外描述
  if (outcome !== 'failure' && _talentsApplied.length > 0) {
    const talentNames = _talentsApplied
      .map(tid => TALENTS[tid]?.name)
      .filter(Boolean);
    if (talentNames.length > 0) {
      text += `（天赋：${talentNames.join('、')}）`;
    }
  }

  return text;
}

/**
 * 战报生成：将裁决详情格式化为可展示给玩家的完整报告。
 */
export function formatResolutionReport(resolution: CourtResolution): string {
  const outcomeLabel: Record<CourtOutcome, string> = {
    critical_success: '🌟 大成功',
    success: '✅ 成功',
    marginal: '⚠️ 勉强',
    failure: '❌ 失败',
  };

  const lines = [
    `══════ 朝廷任务裁决 ══════`,
    `${outcomeLabel[resolution.outcome]}`,
    ``,
    `🎲 掷骰 D100: ${resolution.diceRoll}`,
    `📊 有效能力: ${resolution.effectiveAbility}`,
    `🎯 目标难度: ${resolution.difficulty}`,
    `📐 检定值: ${resolution.diceRoll} + ${resolution.effectiveAbility} - ${resolution.difficulty} = ${resolution.finalCheck}`,
    ``,
    `💰 影响力: ${resolution.actualInfluence > 0 ? '+' : ''}${resolution.actualInfluence}`,
  ];

  // 四维成长
  const statEntries = Object.entries(resolution.statGrowth)
    .filter(([, v]) => v !== undefined && v !== 0) as [string, number][];
  if (statEntries.length > 0) {
    const labelMap: Record<string, string> = {
      strategy: '智谋', eloquence: '口才', charisma: '魅力', scholarship: '学识',
    };
    const statText = statEntries.map(([k, v]) => `${labelMap[k] ?? k}+${v}`).join('、');
    lines.push(`📈 属性成长: ${statText}`);
  }

  lines.push(``);
  lines.push(resolution.flavorText);

  return lines.join('\n');
}
