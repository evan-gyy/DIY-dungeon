import type { SkillId, FabaoId, SectId } from './types';
import type { LocationId } from './worldMap';
import type { DiscipleRank, CourtRank, CourtStats, CourtPath } from './sandboxTypes';
import { calculateFinalStats, getLevelDisplay, type TalentId } from './realmConfig';

/**
 * 修为等级映射（十进制制）：
 *   level  1-10  = 炼气 一～十层
 *   level 11-20  = 筑基 一～十层
 *   level 21-30  = 结丹 一～十层
 *   level 31-40  = 元婴 一～十层
 *   level 41-50  = 化神 一～十层
 *   level 51-60  = 渡劫 一～十层
 *   level 61-70  = 大乘 一～十层
 *   level 71-80  = 飞升 一～十层
 *
 * 可使用 getLevelDisplay(level) 获取可读字符串，如 "元婴三层"。
 */

// ──── NPC 数值卡 ────

/** NPC 性格类型 */
export type NpcPersonality = 'aloof' | 'kind' | 'cunning' | 'upright' | 'gentle' | 'bold';

/** 性格配置 */
export interface PersonalityConfig {
  name: string;
  icon: string;
  desc: string;
  /** 交谈好感倍率 */
  talkMult: number;
  /** 送礼好感倍率 */
  giftMult: number;
  /** 切磋胜利好感变化 */
  sparWinAffection: number;
  /** 切磋战败好感变化 */
  sparLoseAffection: number;
}

/** 六种性格配置表 */
export const PERSONALITY: Record<NpcPersonality, PersonalityConfig> = {
  aloof: {
    name: '孤傲', icon: '🦅', desc: '冷峻寡言，不轻易与人交心',
    talkMult: 0.5, giftMult: 0.3, sparWinAffection: 5, sparLoseAffection: 1,
  },
  kind: {
    name: '和善', icon: '🌸', desc: '待人宽厚，温润如玉',
    talkMult: 1.5, giftMult: 1.2, sparWinAffection: 2, sparLoseAffection: 2,
  },
  cunning: {
    name: '狡猾', icon: '🦊', desc: '机敏圆滑，心思难以捉摸',
    talkMult: 0.8, giftMult: 1.5, sparWinAffection: -2, sparLoseAffection: 1,
  },
  upright: {
    name: '刚正', icon: '⚖️', desc: '嫉恶如仇，刚直不阿',
    talkMult: 1.0, giftMult: 0.7, sparWinAffection: 3, sparLoseAffection: 1,
  },
  gentle: {
    name: '温和', icon: '🍃', desc: '性子柔和，与世无争',
    talkMult: 1.2, giftMult: 1.0, sparWinAffection: 2, sparLoseAffection: 1,
  },
  bold: {
    name: '豪爽', icon: '🍺', desc: '快意恩仇，不拘小节',
    talkMult: 1.0, giftMult: 1.0, sparWinAffection: 3, sparLoseAffection: 3,
  },
};

export interface NpcStats {
  id: string;
  name: string;
  /** @deprecated 使用 talents 数组代替，旧存档兼容 */
  talent?: TalentId;
  /** NPC 天赋列表（P8: 每人随机天赋，迁移填充） */
  talents?: TalentId[];
  /** 是否为天骄（P8: 0.5%概率，强制2绝世+1上等，迁移填充） */
  isTianjiao?: boolean;
  sect: SectId;
  level: number;
  exp: number;
  hp: number; maxHp: number;
  mp: number; maxMp: number;
  atk: number; def: number; agi: number; crit: number;
  skills: SkillId[];
  equippedFabao: { weapon: FabaoId | null; armor: FabaoId | null; accessory: FabaoId | null };
  ownedFabao: FabaoId[];
  // 🆕 NPC当前所在地点
  currentLocationId?: LocationId;
  // 🆕 双身份系统
  /** 武林身份（武林之中） */
  discipleRank: DiscipleRank;
  /** 庙堂身份（庙堂之上） */
  courtRank: CourtRank;
  // 🆕 NPC性格（影响互动倍率）
  personality: NpcPersonality;
  // 🆕 朝廷属性
  courtStats: CourtStats;
  influence: number;
  courtPath: CourtPath | null;
  // 🆕 立绘系统
  /** 性别（用于随机立绘池选取） */
  gender?: 'male' | 'female';
  /** 立绘池索引（随机 NPC 预计算，保证同一 NPC 每次渲染同一张图） */
  portraitIndex?: number;
  /** 🆕 近期经历日志（最多 20 条，最新在末尾） */
  recentLog?: string[];
  /** 🆕 P8: NPC志向（驱动自主行为） */
  ambition?: import('../data/types').NpcAmbition;
  /** 🆕 战斗属性经验值 */
  combatStatExp?: { atk: number; def: number; agi: number; crit: number };
  /** 🆕 朝廷属性经验值 */
  courtStatExp?: { strategy: number; eloquence: number; charisma: number; scholarship: number };
  /** 🆕 NPC寿命：当前年龄（岁） */
  age: number;
  /** 🆕 NPC寿命：最大寿命（岁，由境界决定） */
  maxAge: number;
  /** 🆕 NPC寿命：是否存活 */
  isAlive: boolean;
}

/** 根据境界等级计算寿命上限（岁） */
export function getMaxAgeForLevel(level: number): number {
  if (level <= 10) return 60 + Math.floor(Math.random() * 20);           // 凡人~炼气: 60-80
  if (level <= 20) return 120 + Math.floor(Math.random() * 60);          // 筑基: 120-180
  if (level <= 30) return 250 + Math.floor(Math.random() * 150);         // 结丹: 250-400
  if (level <= 40) return 500 + Math.floor(Math.random() * 300);         // 元婴: 500-800
  if (level <= 50) return 1000 + Math.floor(Math.random() * 500);        // 化神: 1000-1500
  if (level <= 60) return 2000 + Math.floor(Math.random() * 1000);       // 渡劫: 2000-3000
  if (level <= 70) return 5000 + Math.floor(Math.random() * 3000);       // 大乘: 5000-8000
  return 10000 + Math.floor(Math.random() * 5000);                       // 飞升: 10000-15000
}

/** 根据境界等级计算随机初始年龄（岁），高境界NPC更年长 */
export function getRandomInitialAge(level: number): number {
  if (level <= 10) return 18 + Math.floor(Math.random() * 25);           // 18-43
  if (level <= 20) return 25 + Math.floor(Math.random() * 40);           // 25-65
  if (level <= 30) return 30 + Math.floor(Math.random() * 80);           // 30-110
  if (level <= 40) return 40 + Math.floor(Math.random() * 150);          // 40-190
  if (level <= 50) return 60 + Math.floor(Math.random() * 300);          // 60-360
  if (level <= 60) return 100 + Math.floor(Math.random() * 500);         // 100-600
  if (level <= 70) return 200 + Math.floor(Math.random() * 1000);        // 200-1200
  return 500 + Math.floor(Math.random() * 2000);                         // 500-2500
}

// 🆕 使用 realmConfig 系统计算NPC属性（接受天赋数组）
function makeNpcStats(level: number, talents: TalentId[], critBonus: number = 0) {
  const stats = calculateFinalStats(level, talents);
  return {
    hp: stats.hp,
    maxHp: stats.hp,
    mp: stats.mp,
    maxMp: stats.mp,
    atk: stats.atk,
    def: stats.def,
    agi: stats.agi,
    crit: stats.crit + critBonus,
  };
}

// ──── NPC 初始数值卡数据库 ────
// 包含所有有好感度/关系的重要角色
// 🆕 使用 realmConfig 系统自动计算属性，确保数值平衡
// 🆕 P8: 所有NPC使用 talents 数组替代旧 talent 字段；天赋分配按势力强弱差异化

export const NPC_STATS_INIT: Record<string, Omit<NpcStats, 'exp' | 'age' | 'maxAge' | 'isAlive'>> = {
  // ═══════════════════════════════════════════════
  // 🌸 三位女主角
  // ═══════════════════════════════════════════════

  // 🌸 女主角 - 柳清寒（结丹八层，剑心·寒专属天赋 / 武当大师姐·真传弟子）
  liu_qinghan: {
    id: 'liu_qinghan', name: '柳清寒', sect: 'wudang', level: 28,
    talents: ['sword_heart_frost', 'wind_chaser'],
    discipleRank: 'true', courtRank: 'commoner', personality: 'aloof', ambition: 'master',
    gender: 'female',
    courtStats: { strategy: 40, eloquence: 25, charisma: 60, scholarship: 35 }, influence: 20, courtPath: null,
    ...makeNpcStats(28, ['sword_heart_frost', 'wind_chaser'], 5),
    skills: ['wudang_sword', 'zixiao', 'taiji_jian', 'liangyi_sword', 'chunyang_gong'],
    equippedFabao: { weapon: 'azure_sword', armor: 'azure_robe', accessory: 'sapphire_ring' },
    ownedFabao: ['azure_sword', 'azure_robe', 'sapphire_ring'],
  },

  // 🌸 女主角 - 沈霓裳（筑基三层 / 峨眉派·剑法传人）
  shen_nishang: {
    id: 'shen_nishang', name: '沈霓裳', sect: 'emei', level: 13,
    talents: ['sword_heart'],
    discipleRank: 'outer', courtRank: 'commoner', personality: 'bold', ambition: 'content',
    gender: 'female',
    courtStats: { strategy: 20, eloquence: 30, charisma: 50, scholarship: 15 }, influence: 10, courtPath: null,
    ...makeNpcStats(13, ['sword_heart']),
    skills: ['emei_sword', 'emei_chan_yi', 'emei_cloud_step', 'emei_flower_needle'],
    equippedFabao: { weapon: 'refined_sword', armor: 'silk_robe', accessory: 'jade_ring' },
    ownedFabao: ['refined_sword', 'silk_robe', 'jade_ring'],
  },

  // 🌸 女主角 - 墨绐青（渡劫五层 / 叛军·前朝国师）
  mo_jiangqing: {
    id: 'mo_jiangqing', name: '墨绐青', sect: 'rebels', level: 55,
    talents: ['mastermind', 'governance', 'erudite_scholar'],
    discipleRank: 'elder', courtRank: 'hanlin', personality: 'upright', ambition: 'avenger',
    gender: 'female',
    courtStats: { strategy: 80, eloquence: 65, charisma: 60, scholarship: 90 }, influence: 900, courtPath: 'wen',
    ...makeNpcStats(55, ['mastermind', 'governance', 'erudite_scholar'], 10),
    skills: ['rebel_blood_war', 'rebel_flanking', 'rebel_rearguard', 'rebel_war_sweep'],
    equippedFabao: { weapon: 'tribulation_blade', armor: 'tribulation_robe', accessory: 'blood_ring' },
    ownedFabao: ['tribulation_blade', 'tribulation_robe', 'blood_ring'],
  },

  // ═══════════════════════════════════════════════
  // ☯️ 武当派（顶尖大派 - supreme）
  // ═══════════════════════════════════════════════

  // ☯️ 武当派 - 张玄素（化神六层 · 武当掌门）
  zhang_xuansu: {
    id: 'zhang_xuansu', name: '张玄素', sect: 'wudang', level: 46,
    talents: ['meditation_master', 'calm_mind', 'benevolent_ruler'],
    discipleRank: 'leader', courtRank: 'xiucai', personality: 'gentle', ambition: 'power',
    gender: 'male',
    courtStats: { strategy: 45, eloquence: 40, charisma: 50, scholarship: 55 }, influence: 50, courtPath: 'wen',
    ...makeNpcStats(46, ['meditation_master', 'calm_mind', 'benevolent_ruler'], 5),
    skills: ['taiji_shengong', 'wudang_jianzhen', 'chunyang_wuji', 'sanfeng_yijian', 'wudang_tianren'],
    equippedFabao: { weapon: 'celestial_sword', armor: 'celestial_robe', accessory: 'divine_ring' },
    ownedFabao: ['celestial_sword', 'celestial_robe', 'divine_ring'],
  },

  // ☯️ 武当派 - 陈静虚（元婴五层 · 传功长老）
  chen_jingxu: {
    id: 'chen_jingxu', name: '陈静虚', sect: 'wudang', level: 35,
    talents: ['erudite_scholar', 'calm_mind'],
    discipleRank: 'elder', courtRank: 'commoner', personality: 'gentle', ambition: 'master',
    gender: 'male',
    courtStats: { strategy: 40, eloquence: 30, charisma: 35, scholarship: 65 }, influence: 30, courtPath: 'wen',
    ...makeNpcStats(35, ['erudite_scholar', 'calm_mind']),
    skills: ['taiji', 'taiji_jian', 'liangyi_sword', 'chunyang_gong', 'taiji_shengong'],
    equippedFabao: { weapon: 'void_blade', armor: 'void_robe', accessory: 'amethyst_ring' },
    ownedFabao: ['void_blade', 'void_robe', 'amethyst_ring'],
  },

  // ☯️ 武当派 - 陆沉舟（筑基八层 · 内门师兄）
  lu_chengzhou: {
    id: 'lu_chengzhou', name: '陆沉舟', sect: 'wudang', level: 18,
    talents: ['sword_heart'],
    discipleRank: 'inner', courtRank: 'commoner', personality: 'bold', ambition: 'master',
    gender: 'male',
    courtStats: { strategy: 25, eloquence: 40, charisma: 45, scholarship: 20 }, influence: 10, courtPath: null,
    ...makeNpcStats(18, ['sword_heart']),
    skills: ['wudang_sword', 'mianzhang', 'wudang_lianjian', 'zixiao'],
    equippedFabao: { weapon: 'refined_sword', armor: 'silk_robe', accessory: 'jade_ring' },
    ownedFabao: ['refined_sword', 'silk_robe', 'jade_ring'],
  },

  // ☯️ 武当派 - 顾小桑（筑基三层 · 内门弟子）
  gu_xiaosang: {
    id: 'gu_xiaosang', name: '顾小桑', sect: 'wudang', level: 13,
    talents: ['normal'],
    discipleRank: 'inner', courtRank: 'commoner', personality: 'kind', ambition: 'content',
    gender: 'female',
    courtStats: { strategy: 10, eloquence: 35, charisma: 50, scholarship: 15 }, influence: 5, courtPath: null,
    ...makeNpcStats(13, ['normal']),
    skills: ['wudang_changquan', 'wudang_jianfa_basic', 'wudang_qinggong', 'mianzhang'],
    equippedFabao: { weapon: 'refined_sword', armor: 'silk_robe', accessory: 'silver_pendant' },
    ownedFabao: ['refined_sword', 'silk_robe', 'silver_pendant'],
  },

  // ☯️ 武当派 - 宋知远（炼气三层 · 外门师兄 / 最菜NPC）
  song_zhiyuan: {
    id: 'song_zhiyuan', name: '宋知远', sect: 'wudang', level: 3,
    talents: ['lazy'],
    discipleRank: 'outer', courtRank: 'commoner', personality: 'cunning', ambition: 'power',
    gender: 'male',
    courtStats: { strategy: 25, eloquence: 35, charisma: 15, scholarship: 5 }, influence: 0, courtPath: null,
    ...makeNpcStats(3, ['lazy']),
    skills: ['wudang_changquan', 'yangqi_jue'],
    equippedFabao: { weapon: 'iron_sword', armor: 'cloth_robe', accessory: null },
    ownedFabao: ['iron_sword', 'cloth_robe'],
  },

  // ☯️ 武当派 - 纪无双（筑基七层 · 武当双璧 / 内门弟子）
  ji_wushuang_npc: {
    id: 'ji_wushuang_npc', name: '纪无双', sect: 'wudang', level: 17,
    talents: ['swift_shadow'],
    discipleRank: 'inner', courtRank: 'commoner', personality: 'bold', ambition: 'master',
    gender: 'female',
    courtStats: { strategy: 35, eloquence: 25, charisma: 55, scholarship: 30 }, influence: 15, courtPath: null,
    ...makeNpcStats(17, ['swift_shadow']),
    skills: ['wudang_sword', 'wudang_lianjian', 'zixiao', 'mianzhang'],
    equippedFabao: { weapon: 'refined_sword', armor: 'silk_robe', accessory: 'jade_ring' },
    ownedFabao: ['refined_sword', 'silk_robe', 'jade_ring'],
  },

  // ☯️ 武当派 - 苏云绣（筑基六层 · 内门弟子）
  su_yunxiu_npc: {
    id: 'su_yunxiu_npc', name: '苏云绣', sect: 'wudang', level: 16,
    talents: ['normal'],
    discipleRank: 'inner', courtRank: 'commoner', personality: 'kind', ambition: 'content',
    gender: 'female',
    courtStats: { strategy: 15, eloquence: 25, charisma: 55, scholarship: 20 }, influence: 5, courtPath: null,
    ...makeNpcStats(16, ['normal']),
    skills: ['wudang_changquan', 'wudang_sword', 'mianzhang', 'wudang_qinggong'],
    equippedFabao: { weapon: 'refined_sword', armor: 'silk_robe', accessory: 'silver_pendant' },
    ownedFabao: ['refined_sword', 'silk_robe', 'silver_pendant'],
  },

  // ☯️ 武当派 - 方仲和（筑基五层 · 内门弟子）
  fang_zhonghe_npc: {
    id: 'fang_zhonghe_npc', name: '方仲和', sect: 'wudang', level: 15,
    talents: ['tough'],
    discipleRank: 'inner', courtRank: 'commoner', personality: 'gentle', ambition: 'content',
    gender: 'male',
    courtStats: { strategy: 20, eloquence: 20, charisma: 30, scholarship: 35 }, influence: 5, courtPath: null,
    ...makeNpcStats(15, ['tough']),
    skills: ['wudang_changquan', 'mianzhang', 'wudang_huti', 'wudang_sword'],
    equippedFabao: { weapon: 'refined_sword', armor: 'iron_mail', accessory: 'wooden_ring' },
    ownedFabao: ['refined_sword', 'iron_mail', 'wooden_ring'],
  },

  // ☯️ 武当派 - 孟文渊（筑基九层 · 陈静虚门下 / 内门弟子）
  meng_wenyuan: {
    id: 'meng_wenyuan', name: '孟文渊', sect: 'wudang', level: 19,
    talents: ['diligent', 'calm_mind'],
    discipleRank: 'inner', courtRank: 'commoner', personality: 'upright', ambition: 'power',
    gender: 'male',
    courtStats: { strategy: 30, eloquence: 20, charisma: 30, scholarship: 50 }, influence: 10, courtPath: null,
    ...makeNpcStats(19, ['diligent', 'calm_mind'], 3),
    skills: ['wudang_sword', 'taiji_jian', 'wudang_lianjian', 'zixiao'],
    equippedFabao: { weapon: 'refined_sword', armor: 'silk_robe', accessory: 'jade_ring' },
    ownedFabao: ['refined_sword', 'silk_robe', 'jade_ring'],
  },

  // ☯️ 武当派 - 叶紫衣（筑基四层 · 陈静虚门下 / 内门弟子）
  ye_ziyi: {
    id: 'ye_ziyi', name: '叶紫衣', sect: 'wudang', level: 14,
    talents: ['normal'],
    discipleRank: 'inner', courtRank: 'commoner', personality: 'kind', ambition: 'content',
    gender: 'female',
    courtStats: { strategy: 15, eloquence: 40, charisma: 45, scholarship: 25 }, influence: 5, courtPath: null,
    ...makeNpcStats(14, ['normal']),
    skills: ['wudang_jianfa_basic', 'wudang_sword', 'yangqi_jue', 'wudang_qinggong'],
    equippedFabao: { weapon: 'refined_sword', armor: 'cloth_robe', accessory: 'wooden_ring' },
    ownedFabao: ['refined_sword', 'cloth_robe', 'wooden_ring'],
  },

  // ═══════════════════════════════════════════════
  // 🏯 少林派（顶尖大派 - supreme）
  // ═══════════════════════════════════════════════

  // 🏯 少林派 - 空闻方丈（化神八层 · 少林掌门 / 武林泰斗）
  shaolin_kongwen: {
    id: 'shaolin_kongwen', name: '空闻方丈', sect: 'shaolin', level: 48,
    talents: ['iron_fortress', 'meditation_master', 'born_leader'],
    discipleRank: 'leader', courtRank: 'commoner', personality: 'upright', ambition: 'power',
    gender: 'male',
    courtStats: { strategy: 55, eloquence: 50, charisma: 40, scholarship: 70 }, influence: 80, courtPath: null,
    ...makeNpcStats(48, ['iron_fortress', 'meditation_master', 'born_leader'], 5),
    skills: ['luohan_fist', 'vajra_palm', 'yijin_jing', '72_arts'],
    equippedFabao: { weapon: 'celestial_sword', armor: 'celestial_robe', accessory: 'divine_ring' },
    ownedFabao: ['celestial_sword', 'celestial_robe', 'divine_ring'],
    currentLocationId: 'shaolin_temple',
  },

  // 🏯 少林派 - 空见首座（元婴八层 · 罗汉堂首座 / 传功长老）
  shaolin_kongjian: {
    id: 'shaolin_kongjian', name: '空见首座', sect: 'shaolin', level: 38,
    talents: ['strong_as_ox', 'calm_mind'],
    discipleRank: 'elder', courtRank: 'commoner', personality: 'gentle', ambition: 'master',
    gender: 'male',
    courtStats: { strategy: 40, eloquence: 35, charisma: 30, scholarship: 55 }, influence: 40, courtPath: null,
    ...makeNpcStats(38, ['strong_as_ox', 'calm_mind'], 3),
    skills: ['luohan_fist', 'vajra_palm', 'yijin_jing', '72_arts'],
    equippedFabao: { weapon: 'void_blade', armor: 'void_robe', accessory: 'amethyst_ring' },
    ownedFabao: ['void_blade', 'void_robe', 'amethyst_ring'],
    currentLocationId: 'shaolin_temple',
  },

  // ═══════════════════════════════════════════════
  // 🌸 峨眉派（一流门派 - first_rate）
  // ═══════════════════════════════════════════════

  // 🌸 峨眉派 - 灭绝师太（化神二层 · 峨眉掌门）
  emei_miejue: {
    id: 'emei_miejue', name: '灭绝师太', sect: 'emei', level: 42,
    talents: ['battle_genius', 'sword_heart'],
    discipleRank: 'leader', courtRank: 'commoner', personality: 'upright', ambition: 'power',
    gender: 'female',
    courtStats: { strategy: 50, eloquence: 30, charisma: 35, scholarship: 45 }, influence: 60, courtPath: null,
    ...makeNpcStats(42, ['battle_genius', 'sword_heart'], 5),
    skills: ['emei_sword', 'liing_palm', 'hundred_birds', 'emei_poison'],
    equippedFabao: { weapon: 'celestial_sword', armor: 'celestial_robe', accessory: 'divine_ring' },
    ownedFabao: ['celestial_sword', 'celestial_robe', 'divine_ring'],
    currentLocationId: 'emei_mountain',
  },

  // 🌸 峨眉派 - 静玄师太（元婴二层 · 传功长老）
  emei_jingxuan: {
    id: 'emei_jingxuan', name: '静玄师太', sect: 'emei', level: 32,
    talents: ['calm_mind', 'focused'],
    discipleRank: 'elder', courtRank: 'commoner', personality: 'kind', ambition: 'master',
    gender: 'female',
    courtStats: { strategy: 30, eloquence: 35, charisma: 45, scholarship: 40 }, influence: 30, courtPath: null,
    ...makeNpcStats(32, ['calm_mind', 'focused']),
    skills: ['emei_sword', 'liing_palm', 'hundred_birds', 'emei_poison'],
    equippedFabao: { weapon: 'void_blade', armor: 'void_robe', accessory: 'amethyst_ring' },
    ownedFabao: ['void_blade', 'void_robe', 'amethyst_ring'],
    currentLocationId: 'emei_mountain',
  },

  // ═══════════════════════════════════════════════
  // 🐉 丐帮（一流门派 - first_rate）
  // ═══════════════════════════════════════════════

  // 🐉 丐帮 - 洪帮主（元婴八层 · 丐帮帮主 / 天下第一大帮）
  beggar_hong: {
    id: 'beggar_hong', name: '洪帮主', sect: 'beggar', level: 38,
    talents: ['battle_genius', 'born_leader'],
    discipleRank: 'leader', courtRank: 'commoner', personality: 'bold', ambition: 'power',
    gender: 'male',
    courtStats: { strategy: 45, eloquence: 25, charisma: 60, scholarship: 20 }, influence: 70, courtPath: null,
    ...makeNpcStats(38, ['battle_genius', 'born_leader'], 5),
    skills: ['beggar_fist', 'dragon_palm', 'stick_art', 'mud_walk'],
    equippedFabao: { weapon: 'void_blade', armor: 'void_robe', accessory: 'divine_ring' },
    ownedFabao: ['void_blade', 'void_robe', 'divine_ring'],
    currentLocationId: 'beggar_hq',
  },

  // 🐉 丐帮 - 鲁有脚（结丹八层 · 传功长老）
  beggar_lu: {
    id: 'beggar_lu', name: '鲁有脚', sect: 'beggar', level: 28,
    talents: ['tough'],
    discipleRank: 'elder', courtRank: 'commoner', personality: 'upright', ambition: 'master',
    gender: 'male',
    courtStats: { strategy: 30, eloquence: 20, charisma: 40, scholarship: 15 }, influence: 25, courtPath: null,
    ...makeNpcStats(28, ['tough']),
    skills: ['beggar_fist', 'stick_art', 'mud_walk', 'dragon_palm'],
    equippedFabao: { weapon: 'azure_sword', armor: 'azure_robe', accessory: 'sapphire_ring' },
    ownedFabao: ['azure_sword', 'azure_robe', 'sapphire_ring'],
    currentLocationId: 'beggar_hq',
  },

  // ═══════════════════════════════════════════════
  // ⚔️ 华山派（二流门派 - second_rate）
  // ═══════════════════════════════════════════════

  // ⚔️ 华山派 - 岳掌门（元婴期 · 华山掌门 / 剑宗气宗之争）
  huashan_master: {
    id: 'huashan_master', name: '岳掌门', sect: 'huashan', level: 40,
    talents: ['sword_heart'],
    discipleRank: 'leader', courtRank: 'commoner', personality: 'cunning', ambition: 'power',
    gender: 'male',
    courtStats: { strategy: 40, eloquence: 45, charisma: 50, scholarship: 35 }, influence: 50, courtPath: null,
    ...makeNpcStats(40, ['sword_heart'], 5),
    skills: ['wudang_sword', 'zixiao', 'taiji_jian', 'liangyi_sword'],
    equippedFabao: { weapon: 'celestial_sword', armor: 'celestial_robe', accessory: 'divine_ring' },
    ownedFabao: ['celestial_sword', 'celestial_robe', 'divine_ring'],
    currentLocationId: 'changan_city',
  },

  // ⚔️ 华山派 - 封不平（元婴一层 · 传功长老 / 剑宗高手）
  huashan_feng: {
    id: 'huashan_feng', name: '封不平', sect: 'huashan', level: 30,
    talents: ['sharp_eye'],
    discipleRank: 'elder', courtRank: 'commoner', personality: 'bold', ambition: 'master',
    gender: 'male',
    courtStats: { strategy: 25, eloquence: 20, charisma: 35, scholarship: 30 }, influence: 20, courtPath: null,
    ...makeNpcStats(30, ['sharp_eye'], 3),
    skills: ['wudang_sword', 'wudang_lianjian', 'zixiao', 'taiji_jian'],
    equippedFabao: { weapon: 'azure_sword', armor: 'azure_robe', accessory: 'sapphire_ring' },
    ownedFabao: ['azure_sword', 'azure_robe', 'sapphire_ring'],
    currentLocationId: 'changan_city',
  },

  // ═══════════════════════════════════════════════
  // 🌙 魔教（一流门派 - special）
  // ═══════════════════════════════════════════════

  // 🌙 魔教 - 教主（化神五层 · 魔教教主 / 日月神教至尊）
  demon_master: {
    id: 'demon_master', name: '教主', sect: 'demon', level: 45,
    talents: ['poison_master', 'warlord', 'ambitious_official'],
    discipleRank: 'leader', courtRank: 'commoner', personality: 'aloof', ambition: 'power',
    gender: 'male',
    courtStats: { strategy: 60, eloquence: 55, charisma: 65, scholarship: 30 }, influence: 100, courtPath: null,
    ...makeNpcStats(45, ['poison_master', 'warlord', 'ambitious_official'], 10),
    skills: ['demon_devour', 'demon_realm', 'demon_soul_enhance', 'demon_purgatory'],
    equippedFabao: { weapon: 'celestial_sword', armor: 'celestial_robe', accessory: 'divine_ring' },
    ownedFabao: ['celestial_sword', 'celestial_robe', 'divine_ring'],
    currentLocationId: 'yangzhou_city',
  },

  // 🌙 魔教 - 杨左使（元婴三层 · 传功长老 / 光明左使）
  demon_yang: {
    id: 'demon_yang', name: '杨左使', sect: 'demon', level: 33,
    talents: ['silver_tongue'],
    discipleRank: 'elder', courtRank: 'commoner', personality: 'cunning', ambition: 'power',
    gender: 'male',
    courtStats: { strategy: 45, eloquence: 50, charisma: 40, scholarship: 25 }, influence: 50, courtPath: null,
    ...makeNpcStats(33, ['silver_tongue'], 5),
    skills: ['demon_devour', 'demon_realm', 'demon_soul_enhance'],
    equippedFabao: { weapon: 'void_blade', armor: 'void_robe', accessory: 'amethyst_ring' },
    ownedFabao: ['void_blade', 'void_robe', 'amethyst_ring'],
    currentLocationId: 'yangzhou_city',
  },

  // ═══════════════════════════════════════════════
  // 🏛️ 城市官员（朝廷地方官）
  // ═══════════════════════════════════════════════

  // 🏛️ 开封府尹（东京汴梁 · 朝廷地方首宪）
  kaifeng_fuyin: {
    id: 'kaifeng_fuyin', name: '严守正', sect: 'none', level: 7,
    talents: ['righteous_judge'],
    discipleRank: 'outer', courtRank: 'shangshu', personality: 'upright', ambition: 'power',
    gender: 'male',
    courtStats: { strategy: 60, eloquence: 70, charisma: 50, scholarship: 85 }, influence: 200, courtPath: 'wen',
    ...makeNpcStats(7, ['righteous_judge']),
    skills: ['wudang_changquan', 'yangqi_jue'],
    equippedFabao: { weapon: 'refined_sword', armor: 'silk_robe', accessory: 'jade_ring' },
    ownedFabao: ['refined_sword', 'silk_robe', 'jade_ring'],
    currentLocationId: 'kaifeng_city',
  },

  // 🏛️ 河南知府（西京洛阳 · 进士出身）
  luoyang_zhifu: {
    id: 'luoyang_zhifu', name: '赵汝成', sect: 'none', level: 6,
    talents: ['erudite_scholar'],
    discipleRank: 'outer', courtRank: 'jinshi', personality: 'gentle', ambition: 'power',
    gender: 'male',
    courtStats: { strategy: 40, eloquence: 50, charisma: 45, scholarship: 60 }, influence: 100, courtPath: 'wen',
    ...makeNpcStats(6, ['erudite_scholar']),
    skills: ['wudang_changquan', 'yangqi_jue'],
    equippedFabao: { weapon: 'refined_sword', armor: 'silk_robe', accessory: 'jade_ring' },
    ownedFabao: ['refined_sword', 'silk_robe', 'jade_ring'],
    currentLocationId: 'luoyang_city',
  },

  // 🏛️ 京兆知府（长安 · 进士出身）
  changan_zhifu: {
    id: 'changan_zhifu', name: '韩维庸', sect: 'none', level: 6,
    talents: ['reformist'],
    discipleRank: 'outer', courtRank: 'jinshi', personality: 'upright', ambition: 'power',
    gender: 'male',
    courtStats: { strategy: 50, eloquence: 40, charisma: 35, scholarship: 55 }, influence: 90, courtPath: 'wen',
    ...makeNpcStats(6, ['reformist']),
    skills: ['wudang_changquan', 'yangqi_jue'],
    equippedFabao: { weapon: 'refined_sword', armor: 'silk_robe', accessory: 'jade_ring' },
    ownedFabao: ['refined_sword', 'silk_robe', 'jade_ring'],
    currentLocationId: 'changan_city',
  },

  // 🏛️ 襄阳知府（军事重镇 · 武官举人）
  xiangyang_zhifu: {
    id: 'xiangyang_zhifu', name: '郭铁山', sect: 'none', level: 5,
    talents: ['warlord'],
    discipleRank: 'outer', courtRank: 'juren', personality: 'upright', ambition: 'power',
    gender: 'male',
    courtStats: { strategy: 55, eloquence: 30, charisma: 40, scholarship: 35 }, influence: 70, courtPath: 'wu',
    ...makeNpcStats(5, ['warlord']),
    skills: ['wudang_changquan'],
    equippedFabao: { weapon: 'iron_sword', armor: 'iron_mail', accessory: 'wooden_ring' },
    ownedFabao: ['iron_sword', 'iron_mail', 'wooden_ring'],
    currentLocationId: 'xiangyang_city',
  },

  // 🏛️ 江陵知府（荆湖北路 · 举人出身）
  jiangling_zhifu: {
    id: 'jiangling_zhifu', name: '刘守安', sect: 'none', level: 5,
    talents: ['normal'],
    discipleRank: 'outer', courtRank: 'juren', personality: 'kind', ambition: 'power',
    gender: 'male',
    courtStats: { strategy: 40, eloquence: 45, charisma: 40, scholarship: 45 }, influence: 60, courtPath: 'wen',
    ...makeNpcStats(5, ['normal']),
    skills: ['wudang_changquan'],
    equippedFabao: { weapon: 'iron_sword', armor: 'silk_robe', accessory: 'wooden_ring' },
    ownedFabao: ['iron_sword', 'silk_robe', 'wooden_ring'],
    currentLocationId: 'jiangling_city',
  },

  // 🏛️ 成都知府（蜀中重镇 · 举人出身）
  chengdu_zhifu: {
    id: 'chengdu_zhifu', name: '王仲良', sect: 'none', level: 5,
    talents: ['normal'],
    discipleRank: 'outer', courtRank: 'juren', personality: 'gentle', ambition: 'power',
    gender: 'male',
    courtStats: { strategy: 35, eloquence: 40, charisma: 45, scholarship: 50 }, influence: 60, courtPath: 'wen',
    ...makeNpcStats(5, ['normal']),
    skills: ['wudang_changquan'],
    equippedFabao: { weapon: 'iron_sword', armor: 'silk_robe', accessory: 'wooden_ring' },
    ownedFabao: ['iron_sword', 'silk_robe', 'wooden_ring'],
    currentLocationId: 'chengdu_city',
  },

  // 🏛️ 扬州知州（江南繁华地 · 举人出身）
  yangzhou_zhizhou: {
    id: 'yangzhou_zhizhou', name: '杜文清', sect: 'none', level: 4,
    talents: ['silver_tongue'],
    discipleRank: 'outer', courtRank: 'juren', personality: 'cunning', ambition: 'power',
    gender: 'male',
    courtStats: { strategy: 30, eloquence: 55, charisma: 50, scholarship: 40 }, influence: 55, courtPath: 'wen',
    ...makeNpcStats(4, ['silver_tongue']),
    skills: ['wudang_changquan'],
    equippedFabao: { weapon: 'iron_sword', armor: 'silk_robe', accessory: 'silver_pendant' },
    ownedFabao: ['iron_sword', 'silk_robe', 'silver_pendant'],
    currentLocationId: 'yangzhou_city',
  },

  // 🏛️ 苏州知州（园林之城 · 举人出身）
  suzhou_zhizhou: {
    id: 'suzhou_zhizhou', name: '白修文', sect: 'none', level: 4,
    talents: ['normal'],
    discipleRank: 'outer', courtRank: 'juren', personality: 'kind', ambition: 'power',
    gender: 'male',
    courtStats: { strategy: 25, eloquence: 50, charisma: 55, scholarship: 45 }, influence: 50, courtPath: 'wen',
    ...makeNpcStats(4, ['normal']),
    skills: ['wudang_changquan'],
    equippedFabao: { weapon: 'iron_sword', armor: 'silk_robe', accessory: 'silver_pendant' },
    ownedFabao: ['iron_sword', 'silk_robe', 'silver_pendant'],
    currentLocationId: 'suzhou_city',
  },

  // 🏛️ 临安知府（杭州 · 南宋行在 · 举人出身）
  hangzhou_zhifu: {
    id: 'hangzhou_zhifu', name: '林观潮', sect: 'none', level: 5,
    talents: ['normal'],
    discipleRank: 'outer', courtRank: 'juren', personality: 'gentle', ambition: 'power',
    gender: 'male',
    courtStats: { strategy: 35, eloquence: 45, charisma: 50, scholarship: 50 }, influence: 65, courtPath: 'wen',
    ...makeNpcStats(5, ['normal']),
    skills: ['wudang_changquan'],
    equippedFabao: { weapon: 'refined_sword', armor: 'silk_robe', accessory: 'jade_ring' },
    ownedFabao: ['refined_sword', 'silk_robe', 'jade_ring'],
    currentLocationId: 'hangzhou_city',
  },

  // 🏛️ 大理国相（异域邦国 · 进士品阶）
  dali_guoxiang: {
    id: 'dali_guoxiang', name: '段思明', sect: 'none', level: 5,
    talents: ['strategist'],
    discipleRank: 'outer', courtRank: 'jinshi', personality: 'cunning', ambition: 'power',
    gender: 'male',
    courtStats: { strategy: 45, eloquence: 40, charisma: 35, scholarship: 50 }, influence: 80, courtPath: 'wen',
    ...makeNpcStats(5, ['strategist']),
    skills: ['wudang_changquan'],
    equippedFabao: { weapon: 'refined_sword', armor: 'silk_robe', accessory: 'jade_ring' },
    ownedFabao: ['refined_sword', 'silk_robe', 'jade_ring'],
    currentLocationId: 'dali_city',
  },

  // ═══════════════════════════════════════════════
  // 🔮 茅山派（旁门左道 - fringe）
  // ═══════════════════════════════════════════════

  // 🔮 茅山派 - 掌教真人（化神二层 · 符箓宗师）
  maoshan_zhangmen: {
    id: 'maoshan_zhangmen', name: '陶天师', sect: 'maoshan', level: 42,
    talents: ['formation_expert', 'calm_mind'],
    discipleRank: 'leader', courtRank: 'commoner', personality: 'gentle', ambition: 'power',
    gender: 'male',
    courtStats: { strategy: 45, eloquence: 35, charisma: 40, scholarship: 70 }, influence: 60, courtPath: 'wen',
    ...makeNpcStats(42, ['formation_expert', 'calm_mind'], 5),
    skills: ['taiji', 'taiji_jian', 'chunyang_gong', 'zixiao', 'wudang_zhenfa'],
    equippedFabao: { weapon: 'celestial_sword', armor: 'celestial_robe', accessory: 'divine_ring' },
    ownedFabao: ['celestial_sword', 'celestial_robe', 'divine_ring'],
    currentLocationId: 'maoshan_daoyuan',
  },

  // 🔮 茅山派 - 符箓长老（元婴二层 · 捉鬼天师）
  maoshan_elder: {
    id: 'maoshan_elder', name: '葛玄清', sect: 'maoshan', level: 32,
    talents: ['normal'],
    discipleRank: 'elder', courtRank: 'commoner', personality: 'upright', ambition: 'master',
    gender: 'male',
    courtStats: { strategy: 35, eloquence: 25, charisma: 30, scholarship: 55 }, influence: 30, courtPath: null,
    ...makeNpcStats(32, ['normal']),
    skills: ['taiji_jian', 'liangyi_sword', 'chunyang_gong', 'wudang_zhenfa'],
    equippedFabao: { weapon: 'void_blade', armor: 'void_robe', accessory: 'amethyst_ring' },
    ownedFabao: ['void_blade', 'void_robe', 'amethyst_ring'],
    currentLocationId: 'maoshan_daoyuan',
  },

  // ═══════════════════════════════════════════════
  // 🏔️ 昆仑派（一流门派 - first_rate）
  // ═══════════════════════════════════════════════

  // 🏔️ 昆仑派 - 掌门（化神三层 · 雪山剑圣）
  kunlun_zhangmen: {
    id: 'kunlun_zhangmen', name: '何太虚', sect: 'kunlun', level: 43,
    talents: ['sword_heart', 'meditation_master'],
    discipleRank: 'leader', courtRank: 'commoner', personality: 'aloof', ambition: 'master',
    gender: 'male',
    courtStats: { strategy: 50, eloquence: 25, charisma: 35, scholarship: 40 }, influence: 55, courtPath: null,
    ...makeNpcStats(43, ['sword_heart', 'meditation_master'], 5),
    skills: ['taiji_shengong', 'wudang_jianzhen', 'chunyang_wuji', 'sanfeng_yijian'],
    equippedFabao: { weapon: 'celestial_sword', armor: 'celestial_robe', accessory: 'divine_ring' },
    ownedFabao: ['celestial_sword', 'celestial_robe', 'divine_ring'],
    currentLocationId: 'kunlun_mountain',
  },

  // 🏔️ 昆仑派 - 传功长老（元婴三层 · 寒冰剑客）
  kunlun_elder: {
    id: 'kunlun_elder', name: '寒松子', sect: 'kunlun', level: 33,
    talents: ['calm_mind'],
    discipleRank: 'elder', courtRank: 'commoner', personality: 'gentle', ambition: 'master',
    gender: 'male',
    courtStats: { strategy: 30, eloquence: 20, charisma: 30, scholarship: 40 }, influence: 25, courtPath: null,
    ...makeNpcStats(33, ['calm_mind']),
    skills: ['taiji_jian', 'liangyi_sword', 'chunyang_wuji', 'wudang_jianzhen'],
    equippedFabao: { weapon: 'void_blade', armor: 'void_robe', accessory: 'amethyst_ring' },
    ownedFabao: ['void_blade', 'void_robe', 'amethyst_ring'],
    currentLocationId: 'kunlun_mountain',
  },

  // ═══════════════════════════════════════════════
  // 🌿 青城派（二流门派 - second_rate）
  // ═══════════════════════════════════════════════

  // 🌿 青城派 - 掌门（元婴十层 · 幽谷剑客）
  qingcheng_zhangmen: {
    id: 'qingcheng_zhangmen', name: '余掌门', sect: 'qingcheng', level: 40,
    talents: ['sword_heart', 'nimble'],
    discipleRank: 'leader', courtRank: 'commoner', personality: 'kind', ambition: 'content',
    gender: 'male',
    courtStats: { strategy: 40, eloquence: 30, charisma: 45, scholarship: 35 }, influence: 45, courtPath: null,
    ...makeNpcStats(40, ['sword_heart', 'nimble'], 5),
    skills: ['taiji_shengong', 'wudang_jianzhen', 'liangyi_sword', 'chunyang_gong'],
    equippedFabao: { weapon: 'celestial_sword', armor: 'celestial_robe', accessory: 'divine_ring' },
    ownedFabao: ['celestial_sword', 'celestial_robe', 'divine_ring'],
    currentLocationId: 'qingcheng_mountain',
  },

  // 🌿 青城派 - 传功长老（结丹十层 · 拳剑双修）
  qingcheng_elder: {
    id: 'qingcheng_elder', name: '常鹤鸣', sect: 'qingcheng', level: 30,
    talents: ['normal'],
    discipleRank: 'elder', courtRank: 'commoner', personality: 'bold', ambition: 'master',
    gender: 'male',
    courtStats: { strategy: 25, eloquence: 25, charisma: 40, scholarship: 25 }, influence: 20, courtPath: null,
    ...makeNpcStats(30, ['normal']),
    skills: ['taiji_jian', 'wudang_lianjian', 'zixiao', 'liangyi_sword'],
    equippedFabao: { weapon: 'azure_sword', armor: 'azure_robe', accessory: 'sapphire_ring' },
    ownedFabao: ['azure_sword', 'azure_robe', 'sapphire_ring'],
    currentLocationId: 'qingcheng_mountain',
  },

  // ═══════════════════════════════════════════════
  // 🕷️ 唐门（一流门派 - first_rate）
  // ═══════════════════════════════════════════════

  // 🕷️ 唐门 - 门主（化神一层 · 暗器宗师）
  tangmen_zhangmen: {
    id: 'tangmen_zhangmen', name: '唐老太太', sect: 'tangmen', level: 41,
    talents: ['poison_master'],
    discipleRank: 'leader', courtRank: 'commoner', personality: 'cunning', ambition: 'power',
    gender: 'female',
    courtStats: { strategy: 50, eloquence: 40, charisma: 35, scholarship: 30 }, influence: 50, courtPath: null,
    ...makeNpcStats(41, ['poison_master'], 8),
    skills: ['taiji_shengong', 'wudang_jianzhen', 'chunyang_wuji', 'sanfeng_yijian'],
    equippedFabao: { weapon: 'celestial_sword', armor: 'celestial_robe', accessory: 'divine_ring' },
    ownedFabao: ['celestial_sword', 'celestial_robe', 'divine_ring'],
    currentLocationId: 'tangmen_estate',
  },

  // 🕷️ 唐门 - 暗器长老（元婴一层 · 千手修罗）
  tangmen_elder: {
    id: 'tangmen_elder', name: '唐无影', sect: 'tangmen', level: 31,
    talents: ['precise'],
    discipleRank: 'elder', courtRank: 'commoner', personality: 'aloof', ambition: 'master',
    gender: 'male',
    courtStats: { strategy: 35, eloquence: 20, charisma: 25, scholarship: 25 }, influence: 20, courtPath: null,
    ...makeNpcStats(31, ['precise'], 5),
    skills: ['taiji_jian', 'liangyi_sword', 'chunyang_wuji', 'wudang_zhenfa'],
    equippedFabao: { weapon: 'void_blade', armor: 'void_robe', accessory: 'amethyst_ring' },
    ownedFabao: ['void_blade', 'void_robe', 'amethyst_ring'],
    currentLocationId: 'tangmen_estate',
  },

  // ═══════════════════════════════════════════════
  // 🦅 逍遥派（特殊门派 - special / 最强散仙）
  // ═══════════════════════════════════════════════

  // 🦅 逍遥派 - 掌门（化神十层 · 逍遥子 / 天骄级）
  xiaoyao_zhangmen: {
    id: 'xiaoyao_zhangmen', name: '逍遥子', sect: 'xiaoyao', level: 50,
    talents: ['innate_dao_body', 'sword_saint', 'meditation_master'],
    isTianjiao: true,
    discipleRank: 'leader', courtRank: 'commoner', personality: 'aloof', ambition: 'master',
    gender: 'male',
    courtStats: { strategy: 60, eloquence: 55, charisma: 50, scholarship: 80 }, influence: 100, courtPath: null,
    ...makeNpcStats(50, ['innate_dao_body', 'sword_saint', 'meditation_master'], 10),
    skills: ['xiaoyao_silk_step', 'xiaoyao_sun_palm', 'xiaoyao_fate_seal', 'xiaoyao_unity', 'xiaoyao_snow_palm'],
    equippedFabao: { weapon: 'celestial_sword', armor: 'celestial_robe', accessory: 'phoenix_pendant' },
    ownedFabao: ['celestial_sword', 'celestial_robe', 'phoenix_pendant'],
    currentLocationId: 'xiaoyao_valley',
  },

  // 🦅 逍遥派 - 传功长老（元婴六层 · 琴剑书生）
  xiaoyao_elder: {
    id: 'xiaoyao_elder', name: '苏星河', sect: 'xiaoyao', level: 36,
    talents: ['martial_scholar', 'calm_mind'],
    discipleRank: 'elder', courtRank: 'commoner', personality: 'gentle', ambition: 'content',
    gender: 'male',
    courtStats: { strategy: 45, eloquence: 40, charisma: 50, scholarship: 60 }, influence: 40, courtPath: 'wen',
    ...makeNpcStats(36, ['martial_scholar', 'calm_mind'], 3),
    skills: ['xiaoyao_silk_step', 'xiaoyao_sun_palm', 'xiaoyao_fate_seal', 'xiaoyao_unity'],
    equippedFabao: { weapon: 'void_blade', armor: 'dragon_mail', accessory: 'dragon_pendant' },
    ownedFabao: ['void_blade', 'dragon_mail', 'dragon_pendant'],
    currentLocationId: 'xiaoyao_valley',
  },

  // ═══════════════════════════════════════════════
  // ⛰️ 全真教（一流门派 - first_rate / 道武双修）
  // ═══════════════════════════════════════════════

  // ⛰️ 全真教 - 掌教真人（化神三层 · 道武宗师 / 天罡北斗阵）
  quanzhen_zhangmen: {
    id: 'quanzhen_zhangmen', name: '陈道玄', sect: 'quanzhen', level: 43,
    talents: ['meditation_master', 'formation_expert', 'born_leader'],
    discipleRank: 'leader', courtRank: 'commoner', personality: 'gentle', ambition: 'power',
    gender: 'male',
    courtStats: { strategy: 50, eloquence: 45, charisma: 55, scholarship: 75 }, influence: 70, courtPath: 'wen',
    ...makeNpcStats(43, ['meditation_master', 'formation_expert', 'born_leader'], 5),
    skills: ['taiji_shengong', 'wudang_jianzhen', 'chunyang_wuji', 'sanfeng_yijian'],
    equippedFabao: { weapon: 'celestial_sword', armor: 'celestial_robe', accessory: 'divine_ring' },
    ownedFabao: ['celestial_sword', 'celestial_robe', 'divine_ring'],
    currentLocationId: 'zhongnan_mountain',
  },

  // ⛰️ 全真教 - 传功长老（元婴二层 · 李清元 / 坤道宗师）
  quanzhen_elder: {
    id: 'quanzhen_elder', name: '李清元', sect: 'quanzhen', level: 35,
    talents: ['erudite_scholar', 'focused'],
    discipleRank: 'elder', courtRank: 'commoner', personality: 'kind', ambition: 'content',
    gender: 'female',
    courtStats: { strategy: 40, eloquence: 35, charisma: 45, scholarship: 65 }, influence: 35, courtPath: 'wen',
    ...makeNpcStats(35, ['erudite_scholar', 'focused']),
    skills: ['taiji_jian', 'liangyi_sword', 'chunyang_gong', 'wudang_zhenfa'],
    equippedFabao: { weapon: 'void_blade', armor: 'void_robe', accessory: 'amethyst_ring' },
    ownedFabao: ['void_blade', 'void_robe', 'amethyst_ring'],
    currentLocationId: 'zhongnan_mountain',
  },

  // ⛰️ 全真教 - 执法长老（元婴六层 · 周抱朴 / 铁面无私）
  quanzhen_qiuchuji: {
    id: 'quanzhen_qiuchuji', name: '周抱朴', sect: 'quanzhen', level: 36,
    talents: ['iron_face', 'iron_skin'],
    discipleRank: 'elder', courtRank: 'xiucai', personality: 'upright', ambition: 'power',
    gender: 'male',
    courtStats: { strategy: 55, eloquence: 40, charisma: 45, scholarship: 60 }, influence: 40, courtPath: 'wu',
    ...makeNpcStats(36, ['iron_face', 'iron_skin'], 3),
    skills: ['taiji_jian', 'liangyi_sword', 'chunyang_wuji', 'wudang_jianzhen'],
    equippedFabao: { weapon: 'void_blade', armor: 'dragon_mail', accessory: 'dragon_pendant' },
    ownedFabao: ['void_blade', 'dragon_mail', 'dragon_pendant'],
    currentLocationId: 'zhongnan_mountain',
  },

  // ═══════════════════════════════════════════════
  // 👊 崆峒派（二流门派 - second_rate / 裂石拳绝学）
  // ═══════════════════════════════════════════════

  // 👊 崆峒派 - 掌门（元婴八层 · 裂石拳宗师 / 拳出如雷）
  kongtong_zhangmen: {
    id: 'kongtong_zhangmen', name: '铁昆仑', sect: 'kongtong', level: 38,
    talents: ['strong_as_ox', 'tough'],
    discipleRank: 'leader', courtRank: 'commoner', personality: 'bold', ambition: 'power',
    gender: 'male',
    courtStats: { strategy: 40, eloquence: 30, charisma: 40, scholarship: 30 }, influence: 45, courtPath: null,
    ...makeNpcStats(38, ['strong_as_ox', 'tough'], 5),
    skills: ['luohan_fist', 'vajra_palm', 'yijin_jing', '72_arts'],
    equippedFabao: { weapon: 'void_blade', armor: 'void_robe', accessory: 'divine_ring' },
    ownedFabao: ['void_blade', 'void_robe', 'divine_ring'],
    currentLocationId: 'kongtong_mountain',
  },

  // 👊 崆峒派 - 传功长老（结丹八层 · 霍震岳 / 裂石拳传人）
  kongtong_elder: {
    id: 'kongtong_elder', name: '霍震岳', sect: 'kongtong', level: 28,
    talents: ['strong_as_ox'],
    discipleRank: 'elder', courtRank: 'commoner', personality: 'upright', ambition: 'master',
    gender: 'male',
    courtStats: { strategy: 25, eloquence: 20, charisma: 30, scholarship: 20 }, influence: 20, courtPath: null,
    ...makeNpcStats(28, ['strong_as_ox'], 3),
    skills: ['luohan_fist', 'vajra_palm', 'yijin_jing', '72_arts'],
    equippedFabao: { weapon: 'azure_sword', armor: 'azure_robe', accessory: 'sapphire_ring' },
    ownedFabao: ['azure_sword', 'azure_robe', 'sapphire_ring'],
    currentLocationId: 'kongtong_mountain',
  },

  // ═══════════════════════════════════════════════
  // 🗡️ 点苍派（二流门派 - second_rate / 南疆剑术）
  // ═══════════════════════════════════════════════

  // 🗡️ 点苍派 - 掌门（元婴七层 · 南疆剑圣 / 苍山云雪剑）
  diancang_zhangmen: {
    id: 'diancang_zhangmen', name: '柳沧溟', sect: 'diancang', level: 37,
    talents: ['sword_heart', 'sharp_eye'],
    discipleRank: 'leader', courtRank: 'commoner', personality: 'aloof', ambition: 'master',
    gender: 'male',
    courtStats: { strategy: 45, eloquence: 25, charisma: 35, scholarship: 35 }, influence: 40, courtPath: null,
    ...makeNpcStats(37, ['sword_heart', 'sharp_eye'], 5),
    skills: ['wudang_sword', 'zixiao', 'taiji_jian', 'liangyi_sword'],
    equippedFabao: { weapon: 'void_blade', armor: 'void_robe', accessory: 'amethyst_ring' },
    ownedFabao: ['void_blade', 'void_robe', 'amethyst_ring'],
    currentLocationId: 'diancang_mountain',
  },

  // 🗡️ 点苍派 - 传功长老（结丹七层 · 谢云帆 / 苍洱剑客）
  diancang_elder: {
    id: 'diancang_elder', name: '谢云帆', sect: 'diancang', level: 27,
    talents: ['normal'],
    discipleRank: 'elder', courtRank: 'commoner', personality: 'gentle', ambition: 'content',
    gender: 'male',
    courtStats: { strategy: 25, eloquence: 30, charisma: 40, scholarship: 30 }, influence: 15, courtPath: null,
    ...makeNpcStats(27, ['normal'], 3),
    skills: ['wudang_sword', 'wudang_lianjian', 'zixiao', 'taiji_jian'],
    equippedFabao: { weapon: 'azure_sword', armor: 'azure_robe', accessory: 'sapphire_ring' },
    ownedFabao: ['azure_sword', 'azure_robe', 'sapphire_ring'],
    currentLocationId: 'diancang_mountain',
  },

  // ═══════════════════════════════════════════════
  // 🏛️ 新城市官员（v2.1）
  // ═══════════════════════════════════════════════

  // 🏛️ 江州知州（浔阳 · 水陆码头 · 举人出身）
  jiangzhou_zhizhou: {
    id: 'jiangzhou_zhizhou', name: '司马秋客', sect: 'none', level: 4,
    talents: ['normal'],
    discipleRank: 'outer', courtRank: 'juren', personality: 'gentle', ambition: 'power',
    gender: 'male',
    courtStats: { strategy: 30, eloquence: 45, charisma: 45, scholarship: 50 }, influence: 50, courtPath: 'wen',
    ...makeNpcStats(4, ['normal']),
    skills: ['wudang_changquan'],
    equippedFabao: { weapon: 'iron_sword', armor: 'silk_robe', accessory: 'silver_pendant' },
    ownedFabao: ['iron_sword', 'silk_robe', 'silver_pendant'],
    currentLocationId: 'jiangzhou_city',
  },

  // 🏛️ 潭州知府（长沙 · 岳麓书院 · 举人出身）
  tanzhou_zhifu: {
    id: 'tanzhou_zhifu', name: '周必正', sect: 'none', level: 5,
    talents: ['erudite_scholar'],
    discipleRank: 'outer', courtRank: 'juren', personality: 'gentle', ambition: 'power',
    gender: 'male',
    courtStats: { strategy: 35, eloquence: 40, charisma: 40, scholarship: 70 }, influence: 55, courtPath: 'wen',
    ...makeNpcStats(5, ['erudite_scholar']),
    skills: ['wudang_changquan'],
    equippedFabao: { weapon: 'refined_sword', armor: 'silk_robe', accessory: 'jade_ring' },
    ownedFabao: ['refined_sword', 'silk_robe', 'jade_ring'],
    currentLocationId: 'tanzhou_city',
  },

  // 🏛️ 广州市舶司使（南海 · 海上贸易 · 进士出身）
  guangzhou_shibosi: {
    id: 'guangzhou_shibosi', name: '陈望海', sect: 'none', level: 6,
    talents: ['silver_tongue'],
    discipleRank: 'outer', courtRank: 'jinshi', personality: 'cunning', ambition: 'power',
    gender: 'male',
    courtStats: { strategy: 45, eloquence: 55, charisma: 50, scholarship: 55 }, influence: 70, courtPath: 'wen',
    ...makeNpcStats(6, ['silver_tongue']),
    skills: ['wudang_changquan'],
    equippedFabao: { weapon: 'refined_sword', armor: 'silk_robe', accessory: 'jade_ring' },
    ownedFabao: ['refined_sword', 'silk_robe', 'jade_ring'],
    currentLocationId: 'guangzhou_city',
  },

  // ═══════════════════════════════════════════════
  // v2.1 五大宗门掌门
  // ═══════════════════════════════════════════════

  // 🌙 日月教 - 东方教主（化神八层 / 一流门派）
  riyue_leader: {
    id: 'riyue_leader', name: '东方教主', sect: 'riyue', level: 48,
    talents: ['battle_genius', 'wind_chaser', 'ambitious_official'],
    discipleRank: 'leader', courtRank: 'commoner', personality: 'aloof', ambition: 'power',
    gender: 'male',
    courtStats: { strategy: 55, eloquence: 50, charisma: 60, scholarship: 35 }, influence: 100, courtPath: null,
    ...makeNpcStats(48, ['battle_genius', 'wind_chaser']),
    skills: ['riyue_moon_palm', 'riyue_sun_qi', 'riyue_dark_fist', 'riyue_shadow_step'],
    equippedFabao: { weapon: 'refined_sword', armor: 'silk_robe', accessory: 'jade_ring' },
    ownedFabao: ['refined_sword', 'silk_robe', 'jade_ring'],
    currentLocationId: 'heimu_cliff',
  },

  // 👊 铁掌帮 - 铁掌水上飘（元婴八层 / 二流门派 · 弱掌门）
  tiezhang_leader: {
    id: 'tiezhang_leader', name: '铁掌水上飘', sect: 'tiezhang', level: 38,
    talents: ['strong_as_ox', 'reckless'],
    discipleRank: 'leader', courtRank: 'commoner', personality: 'bold', ambition: 'master',
    gender: 'male',
    courtStats: { strategy: 35, eloquence: 25, charisma: 40, scholarship: 20 }, influence: 45, courtPath: null,
    ...makeNpcStats(38, ['strong_as_ox', 'reckless']),
    skills: ['wudang_changquan', 'shaolin_luohan_18'],
    equippedFabao: { weapon: 'refined_sword', armor: 'silk_robe', accessory: 'jade_ring' },
    ownedFabao: ['refined_sword', 'silk_robe', 'jade_ring'],
    currentLocationId: 'chongqing_city',
  },

  // 🐍 五毒教 - 五毒教主（元婴五层 / 旁门左道 · 弱掌门）
  wudu_leader: {
    id: 'wudu_leader', name: '五毒教主', sect: 'wudu', level: 35,
    talents: ['poison_master', 'greedy'],
    discipleRank: 'leader', courtRank: 'commoner', personality: 'cunning', ambition: 'rebel',
    gender: 'female',
    courtStats: { strategy: 30, eloquence: 20, charisma: 35, scholarship: 25 }, influence: 40, courtPath: null,
    ...makeNpcStats(35, ['poison_master', 'greedy']),
    skills: ['wudang_changquan'],
    equippedFabao: { weapon: 'iron_sword', armor: 'silk_robe', accessory: 'silver_pendant' },
    ownedFabao: ['iron_sword', 'silk_robe', 'silver_pendant'],
    currentLocationId: 'dali_city',
  },

  // 🩸 血刀门 - 血刀老祖（元婴十层 / 旁门左道 · 尚可）
  xuedao_leader: {
    id: 'xuedao_leader', name: '血刀老祖', sect: 'xuedao', level: 40,
    talents: ['battle_genius', 'reckless'],
    discipleRank: 'leader', courtRank: 'commoner', personality: 'bold', ambition: 'rebel',
    gender: 'male',
    courtStats: { strategy: 40, eloquence: 15, charisma: 30, scholarship: 15 }, influence: 60, courtPath: null,
    ...makeNpcStats(40, ['battle_genius', 'reckless']),
    skills: ['wudang_changquan', 'shaolin_luohan_18'],
    equippedFabao: { weapon: 'refined_sword', armor: 'silk_robe', accessory: 'silver_pendant' },
    ownedFabao: ['refined_sword', 'silk_robe', 'silver_pendant'],
    currentLocationId: 'liangzhou_city',
  },

  // 🌊 海沙派 - 海沙掌门（结丹三层 / 旁门左道 · 最弱掌门）
  haisha_leader: {
    id: 'haisha_leader', name: '海沙掌门', sect: 'haisha', level: 33,
    talents: ['greedy'],
    discipleRank: 'leader', courtRank: 'commoner', personality: 'cunning', ambition: 'power',
    gender: 'male',
    courtStats: { strategy: 30, eloquence: 30, charisma: 35, scholarship: 15 }, influence: 35, courtPath: null,
    ...makeNpcStats(33, ['greedy']),
    skills: ['wudang_changquan'],
    equippedFabao: { weapon: 'iron_sword', armor: 'silk_robe', accessory: 'silver_pendant' },
    ownedFabao: ['iron_sword', 'silk_robe', 'silver_pendant'],
    currentLocationId: 'mingzhou_city',
  },

  // ═══════════════════════════════════════════════
  // 🏛️ P7 朝廷（imperial_court - 最强势力）
  // ═══════════════════════════════════════════════

  // 🏛️ 朝廷 - 丞相（文官之首 · 修为低下但有庙堂大才）
  prime_minister: {
    id: 'prime_minister', name: '钟元辅', sect: 'imperial_court', level: 15,
    talents: ['governance', 'erudite_scholar', 'political_veteran'],
    discipleRank: 'leader', courtRank: 'zaixiang', personality: 'upright', ambition: 'power',
    gender: 'male',
    courtStats: { strategy: 75, eloquence: 70, charisma: 65, scholarship: 90 }, influence: 250, courtPath: 'wen',
    ...makeNpcStats(15, ['governance', 'erudite_scholar', 'political_veteran']),
    skills: ['court_authority_qi', 'court_cane'],
    equippedFabao: { weapon: 'refined_sword', armor: 'silk_robe', accessory: 'jade_ring' },
    ownedFabao: ['refined_sword', 'silk_robe', 'jade_ring'],
    currentLocationId: 'kaifeng_city',
  },

  // 🏛️ 朝廷 - 太尉（武职之首 · 统兵大将）
  taiwei: {
    id: 'taiwei', name: '武镇岳', sect: 'imperial_court', level: 33,
    talents: ['warlord', 'strong_as_ox', 'mastermind'],
    discipleRank: 'elder', courtRank: 'shangshu', personality: 'bold', ambition: 'power',
    gender: 'male',
    courtStats: { strategy: 80, eloquence: 50, charisma: 60, scholarship: 45 }, influence: 150, courtPath: 'wu',
    ...makeNpcStats(33, ['warlord', 'strong_as_ox', 'mastermind'], 3),
    skills: ['court_gold_seal', 'court_envoy', 'court_iron_shield'],
    equippedFabao: { weapon: 'void_blade', armor: 'dragon_mail', accessory: 'dragon_pendant' },
    ownedFabao: ['void_blade', 'dragon_mail', 'dragon_pendant'],
    currentLocationId: 'kaifeng_city',
  },

  // 🏛️ 朝廷 - 刑部尚书（铁面判官 · 文官，修为低下）
  xingbu_shangshu: {
    id: 'xingbu_shangshu', name: '铁正卿', sect: 'imperial_court', level: 20,
    talents: ['iron_face', 'righteous_judge'],
    discipleRank: 'elder', courtRank: 'shangshu', personality: 'upright', ambition: 'power',
    gender: 'male',
    courtStats: { strategy: 65, eloquence: 60, charisma: 75, scholarship: 80 }, influence: 120, courtPath: 'wen',
    ...makeNpcStats(20, ['iron_face', 'righteous_judge']),
    skills: ['court_censor', 'court_silk_guard', 'court_arrest'],
    equippedFabao: { weapon: 'refined_sword', armor: 'silk_robe', accessory: 'jade_ring' },
    ownedFabao: ['refined_sword', 'silk_robe', 'jade_ring'],
    currentLocationId: 'kaifeng_city',
  },

  // ═══════════════════════════════════════════════
  // ⚔️ P7 叛军（rebels - 前朝残余）
  // ═══════════════════════════════════════════════

  // ⚔️ 叛军 - 首领（前朝公主 · 化神一层 / 天骄级血脉）
  zhao_qinwei: {
    id: 'zhao_qinwei', name: '赵沁微', sect: 'rebels', level: 41,
    talents: ['dragon_vein', 'born_leader', 'benevolent_ruler'],
    isTianjiao: true,
    discipleRank: 'leader', courtRank: 'commoner', personality: 'gentle', ambition: 'rebel',
    gender: 'female',
    courtStats: { strategy: 60, eloquence: 55, charisma: 80, scholarship: 65 }, influence: 90, courtPath: null,
    ...makeNpcStats(41, ['dragon_vein', 'born_leader', 'benevolent_ruler'], 5),
    skills: ['rebel_blood_war', 'rebel_flanking', 'rebel_rearguard', 'rebel_war_sweep'],
    equippedFabao: { weapon: 'celestial_sword', armor: 'celestial_robe', accessory: 'divine_ring' },
    ownedFabao: ['celestial_sword', 'celestial_robe', 'divine_ring'],
    currentLocationId: 'yanjing_city',
  },

  // ⚔️ 叛军 - 大将（前朝猛将 · 元婴八层 / 中年男将）
  rebel_general: {
    id: 'rebel_general', name: '铁定邦', sect: 'rebels', level: 42,
    talents: ['warlord', 'battle_genius', 'strong_as_ox'],
    discipleRank: 'elder', courtRank: 'commoner', personality: 'bold', ambition: 'rebel',
    gender: 'male',
    courtStats: { strategy: 70, eloquence: 30, charisma: 55, scholarship: 25 }, influence: 60, courtPath: 'wu',
    ...makeNpcStats(42, ['warlord', 'battle_genius', 'strong_as_ox'], 5),
    skills: ['rebel_blood_war', 'rebel_flanking', 'rebel_rearguard', 'rebel_war_sweep'],
    equippedFabao: { weapon: 'void_blade', armor: 'dragon_mail', accessory: 'dragon_pendant' },
    ownedFabao: ['void_blade', 'dragon_mail', 'dragon_pendant'],
    currentLocationId: 'yanjing_city',
  },

  // ⚔️ 叛军 - 军师（结丹九层 · 前朝遗臣）
  rebels_strategist: {
    id: 'rebels_strategist', name: '纪玄策', sect: 'rebels', level: 29,
    talents: ['strategist', 'calm_mind'],
    discipleRank: 'true', courtRank: 'jinshi', personality: 'cunning', ambition: 'power',
    gender: 'male',
    courtStats: { strategy: 65, eloquence: 60, charisma: 45, scholarship: 70 }, influence: 45, courtPath: 'wen',
    ...makeNpcStats(29, ['strategist', 'calm_mind']),
    skills: ['rebel_blood_war', 'rebel_flanking', 'rebel_rearguard'],
    equippedFabao: { weapon: 'refined_sword', armor: 'silk_robe', accessory: 'jade_ring' },
    ownedFabao: ['refined_sword', 'silk_robe', 'jade_ring'],
    currentLocationId: 'yanjing_city',
  },
};
