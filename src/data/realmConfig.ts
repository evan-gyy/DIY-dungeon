// ============================================================
//  src/data/realmConfig.ts — 境界基础数值配置与属性计算系统
// ============================================================

// ──── 天赋系统（从 npcStats.ts 移入，解决循环依赖）────

export type TalentId = 
  | 'sword_heart' | 'lazy' | 'diligent' | 'genius' | 'normal'
  | 'strong_as_ox' | 'iron_skin' | 'swift_shadow'  // 通用天赋
  | 'dragon_vein' | 'sword_heart_frost'  // 🆕 特殊天赋：主角和女主专属
  // 🆕 政务天赋（朝堂）
  | 'strategist' | 'eloquent_orator' | 'born_leader' | 'erudite_scholar'
  | 'political_veteran' | 'ambitious_official'
  // 🆕 复合天赋（江湖-朝廷跨界）
  | 'warlord' | 'benevolent_ruler' | 'martial_scholar' | 'hidden_potential';

export interface TalentData {
  name: string;
  desc: string;
  cultivationMul: number;   // 修行经验倍率
  skillLearnBonus: number;  // 技能学习成功率加成（0.0~1.0）
  // 属性加成（最终属性乘数）
  statBonus?: {
    hpMul?: number;
    mpMul?: number;
    atkMul?: number;
    defMul?: number;
    agiMul?: number;
  };
  // 🆕 朝廷天赋加成
  courtBonus?: {
    strategy?: number;          // 智谋加成（绝对值）
    eloquence?: number;         // 口才加成
    charisma?: number;          // 魅力加成
    scholarship?: number;       // 学识加成
    influenceGainMul?: number;  // 影响力获取倍率
    militaryPowerMul?: number;  // 朝廷武力乘数（修为→朝堂武力的转化倍率）
  };
  // 🆕 分类标签
  category?: 'martial' | 'court' | 'hybrid';
}

export const TALENTS: Record<TalentId, TalentData> = {
  // 通用天赋
  sword_heart: { name: '剑心',   desc: '修行速度×1.5，身法+10%',       cultivationMul: 1.5, skillLearnBonus: 0.0, statBonus: { agiMul: 1.10 }, category: 'martial' },
  lazy:        { name: '贪玩',   desc: '修行速度×0.7',       cultivationMul: 0.7, skillLearnBonus: 0.0, category: 'martial' },
  diligent:    { name: '勤勉',   desc: '修行速度×1.2',       cultivationMul: 1.2, skillLearnBonus: 0.0, category: 'martial' },
  genius:      { name: '天才',   desc: '技能学习成功率+20%，真气+15%', cultivationMul: 1.0, skillLearnBonus: 0.2, statBonus: { mpMul: 1.15 }, category: 'martial' },
  normal:      { name: '无特殊', desc: '无特殊天赋',         cultivationMul: 1.0, skillLearnBonus: 0.0, category: 'martial' },
  strong_as_ox: { name: '力大如牛', desc: '攻击+20%', cultivationMul: 1.0, skillLearnBonus: 0.0, statBonus: { atkMul: 1.20 }, category: 'martial' },
  iron_skin:    { name: '铜皮铁骨', desc: '防御+20%', cultivationMul: 1.0, skillLearnBonus: 0.0, statBonus: { defMul: 1.20 }, category: 'martial' },
  swift_shadow: { name: '疾如风',   desc: '身法+20%', cultivationMul: 1.0, skillLearnBonus: 0.0, statBonus: { agiMul: 1.20 }, category: 'martial' },
  
  // 🆕 专属天赋
  dragon_vein: { 
    name: '九霄龙脉', 
    desc: '前朝皇室血脉，修行速度×1.3，全属性+10%，暴击率+5%', 
    cultivationMul: 1.3, 
    skillLearnBonus: 0.1, 
    statBonus: { hpMul: 1.10, mpMul: 1.10, atkMul: 1.10, defMul: 1.10, agiMul: 1.10 },
    category: 'hybrid',
  },
  sword_heart_frost: { 
    name: '剑心·寒', 
    desc: '柳清寒专属天赋，修行速度×1.6，身法+15%，攻击+10%', 
    cultivationMul: 1.6, 
    skillLearnBonus: 0.0, 
    statBonus: { agiMul: 1.15, atkMul: 1.10 },
    category: 'martial',
  },

  // ═══════════════════════════════════════════════════════════
  // 🆕 政务天赋（朝堂四维 + 影响力加成）
  // ═══════════════════════════════════════════════════════════

  strategist: {
    name: '谋略家', desc: '智谋+20，军事任务成功率+15%',
    cultivationMul: 1.0, skillLearnBonus: 0.0,
    courtBonus: { strategy: 20, influenceGainMul: 1.15 },
    category: 'court',
  },
  eloquent_orator: {
    name: '雄辩之士', desc: '口才+20，外交任务成功率+15%',
    cultivationMul: 1.0, skillLearnBonus: 0.0,
    courtBonus: { eloquence: 20, influenceGainMul: 1.15 },
    category: 'court',
  },
  born_leader: {
    name: '天生领袖', desc: '魅力+20，招募/人事任务成功率+15%',
    cultivationMul: 1.0, skillLearnBonus: 0.0,
    courtBonus: { charisma: 20, influenceGainMul: 1.15 },
    category: 'court',
  },
  erudite_scholar: {
    name: '博学鸿儒', desc: '学识+20，治理任务成功率+15%',
    cultivationMul: 1.0, skillLearnBonus: 0.0,
    courtBonus: { scholarship: 20, influenceGainMul: 1.15 },
    category: 'court',
  },
  political_veteran: {
    name: '政坛宿将', desc: '四维各+10，影响力获取+25%',
    cultivationMul: 1.0, skillLearnBonus: 0.0,
    courtBonus: { strategy: 10, eloquence: 10, charisma: 10, scholarship: 10, influenceGainMul: 1.25 },
    category: 'court',
  },
  ambitious_official: {
    name: '野心勃勃', desc: '影响力获取+40%，魅力-5（树敌过多）',
    cultivationMul: 1.0, skillLearnBonus: 0.0,
    courtBonus: { charisma: -5, influenceGainMul: 1.40 },
    category: 'court',
  },

  // ═══════════════════════════════════════════════════════════
  // 🆕 复合天赋（江湖×朝廷跨界 — 掌门武艺通神≠统兵同样高）
  // ═══════════════════════════════════════════════════════════

  warlord: {
    name: '乱世枭雄', desc: '攻+10%，智谋+10，朝堂武力×1.5',
    cultivationMul: 1.0, skillLearnBonus: 0.0,
    statBonus: { atkMul: 1.10 },
    courtBonus: { strategy: 10, militaryPowerMul: 1.5 },
    category: 'hybrid',
  },
  benevolent_ruler: {
    name: '仁者之风', desc: '全属性+5%，四维各+8',
    cultivationMul: 1.0, skillLearnBonus: 0.0,
    statBonus: { hpMul: 1.05, mpMul: 1.05, atkMul: 1.05, defMul: 1.05, agiMul: 1.05 },
    courtBonus: { strategy: 8, eloquence: 8, charisma: 8, scholarship: 8 },
    category: 'hybrid',
  },
  martial_scholar: {
    name: '儒将', desc: '智谋+10，学识+10，攻+5%（文武双全）',
    cultivationMul: 1.0, skillLearnBonus: 0.0,
    statBonus: { atkMul: 1.05 },
    courtBonus: { strategy: 10, scholarship: 10 },
    category: 'hybrid',
  },
  hidden_potential: {
    name: '大器晚成', desc: '修行速度-20%，等级≥30后四维各+25',
    cultivationMul: 0.8, skillLearnBonus: 0.0,
    // courtBonus 需运行时按 level 动态计算，此处为基础值
    courtBonus: {},
    category: 'hybrid',
  },
};

// ──── 大境界定义 ────

export type MajorRealm = 'lianqi' | 'zhuji' | 'jiedan' | 'yuanying' | 'huashen' | 'dujie' | 'dacheng' | 'feisheng';

export interface RealmConfig {
  id: MajorRealm;
  name: string;
  minLevel: number;      // 起始等级（如炼气1层=1）
  maxLevel: number;      // 结束等级（如炼气10层=10）
  color: string;
  cssColor: string;
}

export const REALMS: Record<MajorRealm, RealmConfig> = {
  lianqi:   { id: 'lianqi',   name: '炼气', minLevel: 1,  maxLevel: 10,  color: '白色', cssColor: '#e8e8e8' },
  zhuji:    { id: 'zhuji',    name: '筑基', minLevel: 11, maxLevel: 20,  color: '绿色', cssColor: '#4caf50' },
  jiedan:   { id: 'jiedan',   name: '结丹', minLevel: 21, maxLevel: 30,  color: '蓝色', cssColor: '#42a5f5' },
  yuanying: { id: 'yuanying', name: '元婴', minLevel: 31, maxLevel: 40,  color: '紫色', cssColor: '#ab47bc' },
  huashen:  { id: 'huashen',  name: '化神', minLevel: 41, maxLevel: 50,  color: '金色', cssColor: '#ffd700' },
  dujie:    { id: 'dujie',    name: '渡劫', minLevel: 51, maxLevel: 60,  color: '红色', cssColor: '#ef5350' },
  dacheng:  { id: 'dacheng',  name: '大乘', minLevel: 61, maxLevel: 70,  color: '暗金', cssColor: '#daa520' },
  feisheng: { id: 'feisheng', name: '飞升', minLevel: 71, maxLevel: 80,  color: '霞光', cssColor: '#7b68ee' },
};

// ──── 基础属性配置 ────

export interface BaseStats {
  hp: number;      // 气血
  mp: number;      // 真气
  atk: number;     // 攻击
  def: number;     // 防御
  agi: number;     // 身法
}

/** 各境界基础属性（第1层时的基准值） */
export const REALM_BASE_STATS: Record<MajorRealm, BaseStats> = {
  // 炼气期：凡人入门
  lianqi:   { hp: 100, mp: 30,  atk: 15, def: 8,  agi: 10 },
  // 筑基期：大境界飞跃（约120%-150%增幅）
  zhuji:    { hp: 230, mp: 65,  atk: 35, def: 20, agi: 18 },
  // 结丹期
  jiedan:   { hp: 500, mp: 140, atk: 75, def: 45, agi: 28 },
  // 元婴期
  yuanying: { hp: 1100, mp: 300, atk: 160, def: 95, agi: 42 },
  // 化神期
  huashen:  { hp: 2400, mp: 650, atk: 350, def: 210, agi: 62 },
  // 渡劫期
  dujie:    { hp: 5200, mp: 1400, atk: 760, def: 460, agi: 90 },
  // 大乘期（约120%增幅）
  dacheng:  { hp: 11500, mp: 3100, atk: 1700, def: 1020, agi: 160 },
  // 飞升期（约120%增幅）
  feisheng: { hp: 25000, mp: 6800, atk: 3700, def: 2200, agi: 290 },
};

// ──── 增长系数 ────

/** 小层级（1-10层）之间的线性增长率 */
export const LEVEL_GROWTH_RATE = 0.10;  // 10%

/** 大境界跨越增幅（炼气10层→筑基1层） */
export const REALM_LEAP_MIN = 1.00;     // 最小100%增幅
export const REALM_LEAP_MAX = 1.50;     // 最大150%增幅

// ──── 天赋属性乘数 ────

export interface TalentStatMultiplier {
  hpMul: number;     // 气血乘数
  mpMul: number;     // 真气乘数
  atkMul: number;    // 攻击乘数
  defMul: number;    // 防御乘数
  agiMul: number;    // 身法乘数
}

/**
 * 从 TALENTS 配置中提取属性乘数
 * 这样天赋属性加成只需在 npcStats.ts 中配置一次
 */
/** 从天赋配置中提取朝廷属性加成（用于 CourtEngine） */
export function getTalentCourtBonus(talentId: TalentId): TalentData['courtBonus'] {
  return TALENTS[talentId]?.courtBonus;
}

/** 从天赋配置中获取分类标签 */
export function getTalentCategory(talentId: TalentId): TalentData['category'] {
  return TALENTS[talentId]?.category ?? 'martial';
}

function getTalentMultipliers(talentId: TalentId): Partial<TalentStatMultiplier> {
  const talent = TALENTS[talentId];
  if (!talent?.statBonus) return {};
  
  return {
    hpMul: talent.statBonus.hpMul,
    mpMul: talent.statBonus.mpMul,
    atkMul: talent.statBonus.atkMul,
    defMul: talent.statBonus.defMul,
    agiMul: talent.statBonus.agiMul,
  };
}

// ──── 核心计算函数 ────

/**
 * 根据等级获取所属大境界
 */
export function getMajorRealmByLevel(level: number): MajorRealm | null {
  if (level >= 1 && level <= 10) return 'lianqi';
  if (level >= 11 && level <= 20) return 'zhuji';
  if (level >= 21 && level <= 30) return 'jiedan';
  if (level >= 31 && level <= 40) return 'yuanying';
  if (level >= 41 && level <= 50) return 'huashen';
  if (level >= 51 && level <= 60) return 'dujie';
  if (level >= 61 && level <= 70) return 'dacheng';
  if (level >= 71 && level <= 80) return 'feisheng';
  return null;
}

/**
 * 获取等级在所属境界内的层数（1-10）
 */
export function getLevelInRealm(level: number): number {
  const realm = getMajorRealmByLevel(level);
  if (!realm) return 1;
  return level - REALMS[realm].minLevel + 1;
}

/**
 * 计算指定等级的基础属性（不含天赋加成）
 * 
 * 算法说明：
 * 1. 确定所属大境界
 * 2. 获取该境界第1层的基准值
 * 3. 根据层数应用线性增长（每层+10%）
 * 4. 大境界跨越时自动体现断层增幅
 */
export function calculateBaseStats(level: number): BaseStats {
  const realm = getMajorRealmByLevel(level);
  if (!realm) {
    // 凡人（level=0）
    return { hp: 80, mp: 20, atk: 8, def: 4, agi: 5 };
  }
  
  const base = REALM_BASE_STATS[realm];
  const levelInRealm = getLevelInRealm(level);
  
  // 线性增长：基准值 × (1 + 10% × (层数-1))
  const growthFactor = 1 + LEVEL_GROWTH_RATE * (levelInRealm - 1);
  
  return {
    hp: Math.floor(base.hp * growthFactor),
    mp: Math.floor(base.mp * growthFactor),
    atk: Math.floor(base.atk * growthFactor),
    def: Math.floor(base.def * growthFactor),
    agi: Math.floor(base.agi * growthFactor),
  };
}

/**
 * 计算最终属性（包含天赋加成）
 * 
 * @param level 等级（0-80）
 * @param talents NPC拥有的天赋列表
 * @returns 最终属性值
 */
export function calculateFinalStats(
  level: number,
  talents: TalentId[] = []
): BaseStats & { crit: number } {
  // 1. 计算基础属性
  const base = calculateBaseStats(level);
  
  // 2. 初始化乘数
  const multipliers: TalentStatMultiplier = {
    hpMul: 1.0,
    mpMul: 1.0,
    atkMul: 1.0,
    defMul: 1.0,
    agiMul: 1.0,
  };
  
  // 3. 应用天赋乘数（从 TALENTS 配置中动态获取）
  for (const talentId of talents) {
    const talentMul = getTalentMultipliers(talentId);
    if (talentMul.hpMul) multipliers.hpMul *= talentMul.hpMul;
    if (talentMul.mpMul) multipliers.mpMul *= talentMul.mpMul;
    if (talentMul.atkMul) multipliers.atkMul *= talentMul.atkMul;
    if (talentMul.defMul) multipliers.defMul *= talentMul.defMul;
    if (talentMul.agiMul) multipliers.agiMul *= talentMul.agiMul;
  }
  
  // 4. 计算最终属性
  const final: BaseStats & { crit: number } = {
    hp: Math.floor(base.hp * multipliers.hpMul),
    mp: Math.floor(base.mp * multipliers.mpMul),
    atk: Math.floor(base.atk * multipliers.atkMul),
    def: Math.floor(base.def * multipliers.defMul),
    agi: Math.floor(base.agi * multipliers.agiMul),
    crit: 5,  // 基础暴击率5%
  };
  
  return final;
}

/**
 * 生成随机NPC属性（用于AI生成随机NPC时自动调用）
 * 
 * @param level 等级
 * @param talents 天赋列表（可选，默认随机）
 * @returns 完整的NPC属性对象
 */
export function generateNpcStats(
  level: number,
  talents?: TalentId[]
): {
  level: number;
  hp: number; maxHp: number;
  mp: number; maxMp: number;
  atk: number; def: number; agi: number; crit: number;
  talents: TalentId[];
} {
  const finalTalents = talents ?? ['normal'];
  const stats = calculateFinalStats(level, finalTalents);
  
  return {
    level,
    hp: stats.hp,
    maxHp: stats.hp,
    mp: stats.mp,
    maxMp: stats.mp,
    atk: stats.atk,
    def: stats.def,
    agi: stats.agi,
    crit: stats.crit,
    talents: finalTalents,
  };
}

/**
 * 验证大境界断层增幅是否符合预期
 * 用于调试和平衡性检查
 */
export function validateRealmLeap(): { from: string; to: string; hpRatio: number; atkRatio: number }[] {
  const results: { from: string; to: string; hpRatio: number; atkRatio: number }[] = [];
  
  const realmList: MajorRealm[] = ['lianqi', 'zhuji', 'jiedan', 'yuanying', 'huashen', 'dujie', 'dacheng', 'feisheng'];
  
  for (let i = 0; i < realmList.length - 1; i++) {
    const currentRealm = realmList[i]!;
    const nextRealm = realmList[i + 1]!;
    
    // 炼气10层 vs 筑基1层
    const currentStats = calculateBaseStats(REALMS[currentRealm].maxLevel);
    const nextStats = calculateBaseStats(REALMS[nextRealm].minLevel);
    
    results.push({
      from: `${REALMS[currentRealm].name}十层`,
      to: `${REALMS[nextRealm].name}一层`,
      hpRatio: Number((nextStats.hp / currentStats.hp - 1).toFixed(2)),
      atkRatio: Number((nextStats.atk / currentStats.atk - 1).toFixed(2)),
    });
  }
  
  return results;
}

/**
 * 将等级数字转为可读的 "境界X层" 字符串
 * 例如：43 → "化神三层"，7 → "炼气七层"
 */
export function getLevelDisplay(level: number): string {
  const realm = getMajorRealmByLevel(level);
  if (!realm) return '凡人';
  const layer = getLevelInRealm(level);
  const chineseNum = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
  return `${REALMS[realm].name}${chineseNum[layer] || layer}层`;
}

// 导出调试信息（开发时可在控制台查看）
// console.log('大境界断层验证:', validateRealmLeap());
