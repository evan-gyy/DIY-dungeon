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
  talent: TalentId;
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
}

// 🆕 使用 realmConfig 系统计算NPC属性（替代旧的makeStats）
function makeNpcStats(level: number, talent: TalentId, critBonus: number = 0) {
  const stats = calculateFinalStats(level, [talent]);
  return {
    hp: stats.hp,
    maxHp: stats.hp,
    mp: stats.mp,
    maxMp: stats.mp,
    atk: stats.atk,
    def: stats.def,
    agi: stats.agi,
    crit: stats.crit + critBonus,  // 基础暴击5% + 额外加成
  };
}

// ──── NPC 初始数值卡数据库 ────
// 包含所有有好感度/关系的重要角色
// 🆕 使用 realmConfig 系统自动计算属性，确保数值平衡

export const NPC_STATS_INIT: Record<string, Omit<NpcStats, 'exp'>> = {
  // 🌸 女主角 - 柳清寒（结丹八层，剑心·寒专属天赋 / 武当大师姐·真传弟子）
  liu_qinghan: {
    id: 'liu_qinghan', name: '柳清寒', talent: 'sword_heart_frost', sect: 'wudang', level: 28,
    discipleRank: 'true', courtRank: 'commoner', personality: 'aloof',
    courtStats: { strategy: 40, eloquence: 25, charisma: 60, scholarship: 35 }, influence: 20, courtPath: null,
    ...makeNpcStats(28, 'sword_heart_frost', 5),  // 额外5%暴击
    skills: ['wudang_sword', 'zixiao', 'taiji_jian', 'liangyi_sword', 'chunyang_gong'],
    equippedFabao: { weapon: 'azure_sword', armor: 'azure_robe', accessory: 'sapphire_ring' },
    ownedFabao: ['azure_sword', 'azure_robe', 'sapphire_ring'],
  },
  
  // 🌸 女主角 - 沈霓裳（筑基三层 / 茅山派·雷法传人）
  shen_nishang: {
    id: 'shen_nishang', name: '沈霓裳', talent: 'normal', sect: 'maoshan', level: 13,
    discipleRank: 'outer', courtRank: 'commoner', personality: 'bold',
    courtStats: { strategy: 20, eloquence: 30, charisma: 50, scholarship: 15 }, influence: 10, courtPath: null,
    ...makeNpcStats(13, 'normal'),
    skills: ['wudang_changquan', 'wudang_jianfa_basic', 'wudang_qinggong', 'mianzhang'],
    equippedFabao: { weapon: 'refined_sword', armor: 'silk_robe', accessory: 'jade_ring' },
    ownedFabao: ['refined_sword', 'silk_robe', 'jade_ring'],
  },
  
  // 🌸 女主角 - 墨绐青（渡劫五层，散修 / 隐居村妇·前朝国师）
  mo_jiangqing: {
    id: 'mo_jiangqing', name: '墨绐青', talent: 'normal', sect: 'none', level: 55,
    discipleRank: 'outer', courtRank: 'hanlin', personality: 'upright',  // 前朝国师 → 翰林级别
    courtStats: { strategy: 75, eloquence: 60, charisma: 55, scholarship: 85 }, influence: 900, courtPath: 'wen',
    ...makeNpcStats(55, 'normal', 10),  // 额外10%暴击
    skills: ['wudang_dao_jing', 'wudang_xuankong', 'wudang_taiyi', 'wudang_wuji_dao_jian'],
    equippedFabao: { weapon: 'tribulation_blade', armor: 'tribulation_robe', accessory: 'blood_ring' },
    ownedFabao: ['tribulation_blade', 'tribulation_robe', 'blood_ring'],
  },
  
  // ☯️ 武当派 - 张玄素（化神六层 · 武当掌门）
  zhang_xuansu: {
    id: 'zhang_xuansu', name: '张玄素', talent: 'normal', sect: 'wudang', level: 46,
    discipleRank: 'leader', courtRank: 'xiucai', personality: 'gentle',  // 掌门·秀才出身
    courtStats: { strategy: 45, eloquence: 40, charisma: 50, scholarship: 55 }, influence: 50, courtPath: 'wen',
    ...makeNpcStats(46, 'normal', 5),
    skills: ['taiji_shengong', 'wudang_jianzhen', 'chunyang_wuji', 'sanfeng_yijian', 'wudang_tianren'],
    equippedFabao: { weapon: 'celestial_sword', armor: 'celestial_robe', accessory: 'divine_ring' },
    ownedFabao: ['celestial_sword', 'celestial_robe', 'divine_ring'],
  },
  
  // ☯️ 武当派 - 陈静虚（元婴五层 · 传功长老）
  chen_jingxu: {
    id: 'chen_jingxu', name: '陈静虚', talent: 'normal', sect: 'wudang', level: 35,
    discipleRank: 'elder', courtRank: 'commoner', personality: 'gentle',
    courtStats: { strategy: 40, eloquence: 30, charisma: 35, scholarship: 65 }, influence: 30, courtPath: 'wen',
    ...makeNpcStats(35, 'normal'),
    skills: ['taiji', 'taiji_jian', 'liangyi_sword', 'chunyang_gong', 'taiji_shengong'],
    equippedFabao: { weapon: 'void_blade', armor: 'void_robe', accessory: 'amethyst_ring' },
    ownedFabao: ['void_blade', 'void_robe', 'amethyst_ring'],
  },
  
  // ☯️ 武当派 - 陆沉舟（筑基八层 · 内门师兄）
  lu_chengzhou: {
    id: 'lu_chengzhou', name: '陆沉舟', talent: 'normal', sect: 'wudang', level: 18,
    discipleRank: 'inner', courtRank: 'commoner', personality: 'bold',
    courtStats: { strategy: 25, eloquence: 40, charisma: 45, scholarship: 20 }, influence: 10, courtPath: null,
    ...makeNpcStats(18, 'normal'),
    skills: ['wudang_sword', 'mianzhang', 'wudang_lianjian', 'zixiao'],
    equippedFabao: { weapon: 'refined_sword', armor: 'silk_robe', accessory: 'jade_ring' },
    ownedFabao: ['refined_sword', 'silk_robe', 'jade_ring'],
  },
  
  // ☯️ 武当派 - 顾小桑（筑基三层 · 外门师姐）
  gu_xiaosang: {
    id: 'gu_xiaosang', name: '顾小桑', talent: 'normal', sect: 'wudang', level: 13,
    discipleRank: 'outer', courtRank: 'commoner', personality: 'kind',
    courtStats: { strategy: 10, eloquence: 35, charisma: 50, scholarship: 15 }, influence: 5, courtPath: null,
    ...makeNpcStats(13, 'normal'),
    skills: ['wudang_changquan', 'wudang_jianfa_basic', 'wudang_qinggong', 'mianzhang'],
    equippedFabao: { weapon: 'refined_sword', armor: 'silk_robe', accessory: 'silver_pendant' },
    ownedFabao: ['refined_sword', 'silk_robe', 'silver_pendant'],
  },
  
  // ☯️ 武当派 - 宋知远（炼气三层 · 外门师兄 / 最菜NPC）
  song_zhiyuan: {
    id: 'song_zhiyuan', name: '宋知远', talent: 'normal', sect: 'wudang', level: 3,
    discipleRank: 'outer', courtRank: 'commoner', personality: 'cunning',
    courtStats: { strategy: 25, eloquence: 35, charisma: 15, scholarship: 5 }, influence: 0, courtPath: null,
    ...makeNpcStats(3, 'normal'),
    skills: ['wudang_changquan', 'yangqi_jue'],
    equippedFabao: { weapon: 'iron_sword', armor: 'cloth_robe', accessory: null },
    ownedFabao: ['iron_sword', 'cloth_robe'],
  },
  
  // ☯️ 武当派 - 纪无双（筑基七层 · 武当双璧 / 内门弟子）
  ji_wushuang_npc: {
    id: 'ji_wushuang_npc', name: '纪无双', talent: 'normal', sect: 'wudang', level: 17,
    discipleRank: 'inner', courtRank: 'commoner', personality: 'bold',
    courtStats: { strategy: 35, eloquence: 25, charisma: 55, scholarship: 30 }, influence: 15, courtPath: null,
    ...makeNpcStats(17, 'normal'),
    skills: ['wudang_sword', 'wudang_lianjian', 'zixiao', 'mianzhang'],
    equippedFabao: { weapon: 'refined_sword', armor: 'silk_robe', accessory: 'jade_ring' },
    ownedFabao: ['refined_sword', 'silk_robe', 'jade_ring'],
  },
  
  // ☯️ 武当派 - 苏云绣（筑基六层 · 内门弟子）
  su_yunxiu_npc: {
    id: 'su_yunxiu_npc', name: '苏云绣', talent: 'normal', sect: 'wudang', level: 16,
    discipleRank: 'inner', courtRank: 'commoner', personality: 'kind',
    courtStats: { strategy: 15, eloquence: 25, charisma: 55, scholarship: 20 }, influence: 5, courtPath: null,
    ...makeNpcStats(16, 'normal'),
    skills: ['wudang_changquan', 'wudang_sword', 'mianzhang', 'wudang_qinggong'],
    equippedFabao: { weapon: 'refined_sword', armor: 'silk_robe', accessory: 'silver_pendant' },
    ownedFabao: ['refined_sword', 'silk_robe', 'silver_pendant'],
  },
  
  // ☯️ 武当派 - 方仲和（筑基五层 · 内门弟子）
  fang_zhonghe_npc: {
    id: 'fang_zhonghe_npc', name: '方仲和', talent: 'normal', sect: 'wudang', level: 15,
    discipleRank: 'inner', courtRank: 'commoner', personality: 'gentle',
    courtStats: { strategy: 20, eloquence: 20, charisma: 30, scholarship: 35 }, influence: 5, courtPath: null,
    ...makeNpcStats(15, 'normal'),
    skills: ['wudang_changquan', 'mianzhang', 'wudang_huti', 'wudang_sword'],
    equippedFabao: { weapon: 'refined_sword', armor: 'iron_mail', accessory: 'wooden_ring' },
    ownedFabao: ['refined_sword', 'iron_mail', 'wooden_ring'],
  },
  
  // ☯️ 武当派 - 孟文渊（筑基九层 · 陈静虚门下 / 内门弟子）
  meng_wenyuan: {
    id: 'meng_wenyuan', name: '孟文渊', talent: 'normal', sect: 'wudang', level: 19,
    discipleRank: 'inner', courtRank: 'commoner', personality: 'upright',
    courtStats: { strategy: 30, eloquence: 20, charisma: 30, scholarship: 50 }, influence: 10, courtPath: null,
    ...makeNpcStats(19, 'normal', 3),
    skills: ['wudang_sword', 'taiji_jian', 'wudang_lianjian', 'zixiao'],
    equippedFabao: { weapon: 'refined_sword', armor: 'silk_robe', accessory: 'jade_ring' },
    ownedFabao: ['refined_sword', 'silk_robe', 'jade_ring'],
  },
  
  // ☯️ 武当派 - 叶紫衣（筑基四层 · 陈静虚门下 / 内门弟子）
  ye_ziyi: {
    id: 'ye_ziyi', name: '叶紫衣', talent: 'normal', sect: 'wudang', level: 14,
    discipleRank: 'inner', courtRank: 'commoner', personality: 'kind',
    courtStats: { strategy: 15, eloquence: 40, charisma: 45, scholarship: 25 }, influence: 5, courtPath: null,
    ...makeNpcStats(14, 'normal'),
    skills: ['wudang_jianfa_basic', 'wudang_sword', 'yangqi_jue', 'wudang_qinggong'],
    equippedFabao: { weapon: 'refined_sword', armor: 'cloth_robe', accessory: 'wooden_ring' },
    ownedFabao: ['refined_sword', 'cloth_robe', 'wooden_ring'],
  },

  // ═══════════════════════════════════════════════
  // 🆕 沙盒：少林派
  // ═══════════════════════════════════════════════

  // 🏯 少林派 - 空闻方丈（化神八层 · 少林掌门 / 武林泰斗）
  shaolin_kongwen: {
    id: 'shaolin_kongwen', name: '空闻方丈', talent: 'normal', sect: 'shaolin', level: 48,
    discipleRank: 'leader', courtRank: 'commoner', personality: 'upright',
    courtStats: { strategy: 55, eloquence: 50, charisma: 40, scholarship: 70 }, influence: 80, courtPath: null,
    ...makeNpcStats(48, 'normal', 5),
    skills: ['luohan_fist', 'vajra_palm', 'yijin_jing', '72_arts'],
    equippedFabao: { weapon: 'celestial_sword', armor: 'celestial_robe', accessory: 'divine_ring' },
    ownedFabao: ['celestial_sword', 'celestial_robe', 'divine_ring'],
    currentLocationId: 'shaolin_temple',
  },

  // 🏯 少林派 - 空见首座（元婴八层 · 罗汉堂首座 / 传功长老）
  shaolin_kongjian: {
    id: 'shaolin_kongjian', name: '空见首座', talent: 'normal', sect: 'shaolin', level: 38,
    discipleRank: 'elder', courtRank: 'commoner', personality: 'gentle',
    courtStats: { strategy: 40, eloquence: 35, charisma: 30, scholarship: 55 }, influence: 40, courtPath: null,
    ...makeNpcStats(38, 'normal', 3),
    skills: ['luohan_fist', 'vajra_palm', 'yijin_jing', '72_arts'],
    equippedFabao: { weapon: 'void_blade', armor: 'void_robe', accessory: 'amethyst_ring' },
    ownedFabao: ['void_blade', 'void_robe', 'amethyst_ring'],
    currentLocationId: 'shaolin_temple',
  },

  // ═══════════════════════════════════════════════
  // 🆕 沙盒：峨眉派
  // ═══════════════════════════════════════════════

  // 🌸 峨眉派 - 灭绝师太（化神二层 · 峨眉掌门）
  emei_miejue: {
    id: 'emei_miejue', name: '灭绝师太', talent: 'normal', sect: 'emei', level: 42,
    discipleRank: 'leader', courtRank: 'commoner', personality: 'upright',
    courtStats: { strategy: 50, eloquence: 30, charisma: 35, scholarship: 45 }, influence: 60, courtPath: null,
    ...makeNpcStats(42, 'normal', 5),
    skills: ['emei_sword', 'liing_palm', 'hundred_birds', 'emei_poison'],
    equippedFabao: { weapon: 'celestial_sword', armor: 'celestial_robe', accessory: 'divine_ring' },
    ownedFabao: ['celestial_sword', 'celestial_robe', 'divine_ring'],
    currentLocationId: 'emei_mountain',
  },

  // 🌸 峨眉派 - 静玄师太（元婴二层 · 传功长老）
  emei_jingxuan: {
    id: 'emei_jingxuan', name: '静玄师太', talent: 'normal', sect: 'emei', level: 32,
    discipleRank: 'elder', courtRank: 'commoner', personality: 'kind',
    courtStats: { strategy: 30, eloquence: 35, charisma: 45, scholarship: 40 }, influence: 30, courtPath: null,
    ...makeNpcStats(32, 'normal'),
    skills: ['emei_sword', 'liing_palm', 'hundred_birds', 'emei_poison'],
    equippedFabao: { weapon: 'void_blade', armor: 'void_robe', accessory: 'amethyst_ring' },
    ownedFabao: ['void_blade', 'void_robe', 'amethyst_ring'],
    currentLocationId: 'emei_mountain',
  },

  // ═══════════════════════════════════════════════
  // 🆕 沙盒：丐帮
  // ═══════════════════════════════════════════════

  // 🐉 丐帮 - 洪帮主（元婴八层 · 丐帮帮主 / 天下第一大帮）
  beggar_hong: {
    id: 'beggar_hong', name: '洪帮主', talent: 'normal', sect: 'beggar', level: 38,
    discipleRank: 'leader', courtRank: 'commoner', personality: 'bold',
    courtStats: { strategy: 45, eloquence: 25, charisma: 60, scholarship: 20 }, influence: 70, courtPath: null,
    ...makeNpcStats(38, 'normal', 5),
    skills: ['beggar_fist', 'dragon_palm', 'stick_art', 'mud_walk'],
    equippedFabao: { weapon: 'void_blade', armor: 'void_robe', accessory: 'divine_ring' },
    ownedFabao: ['void_blade', 'void_robe', 'divine_ring'],
    currentLocationId: 'beggar_hq',
  },

  // 🐉 丐帮 - 鲁有脚（结丹八层 · 传功长老）
  beggar_lu: {
    id: 'beggar_lu', name: '鲁有脚', talent: 'normal', sect: 'beggar', level: 28,
    discipleRank: 'elder', courtRank: 'commoner', personality: 'upright',
    courtStats: { strategy: 30, eloquence: 20, charisma: 40, scholarship: 15 }, influence: 25, courtPath: null,
    ...makeNpcStats(28, 'normal'),
    skills: ['beggar_fist', 'stick_art', 'mud_walk', 'dragon_palm'],
    equippedFabao: { weapon: 'azure_sword', armor: 'azure_robe', accessory: 'sapphire_ring' },
    ownedFabao: ['azure_sword', 'azure_robe', 'sapphire_ring'],
    currentLocationId: 'beggar_hq',
  },

  // ═══════════════════════════════════════════════
  // 🆕 沙盒：华山派
  // ═══════════════════════════════════════════════

  // ⚔️ 华山派 - 岳掌门（元婴期 · 华山掌门 / 剑宗气宗之争）
  huashan_master: {
    id: 'huashan_master', name: '岳掌门', talent: 'normal', sect: 'huashan', level: 40,
    discipleRank: 'leader', courtRank: 'commoner', personality: 'cunning',
    courtStats: { strategy: 40, eloquence: 45, charisma: 50, scholarship: 35 }, influence: 50, courtPath: null,
    ...makeNpcStats(40, 'normal', 5),
    skills: ['wudang_sword', 'zixiao', 'taiji_jian', 'liangyi_sword'], // 华山以剑法闻名
    equippedFabao: { weapon: 'celestial_sword', armor: 'celestial_robe', accessory: 'divine_ring' },
    ownedFabao: ['celestial_sword', 'celestial_robe', 'divine_ring'],
    currentLocationId: 'changan_city', // 华山在陕西，靠近长安
  },

  // ⚔️ 华山派 - 封不平（元婴一层 · 传功长老 / 剑宗高手）
  huashan_feng: {
    id: 'huashan_feng', name: '封不平', talent: 'normal', sect: 'huashan', level: 30,
    discipleRank: 'elder', courtRank: 'commoner', personality: 'bold',
    courtStats: { strategy: 25, eloquence: 20, charisma: 35, scholarship: 30 }, influence: 20, courtPath: null,
    ...makeNpcStats(30, 'normal', 3),
    skills: ['wudang_sword', 'wudang_lianjian', 'zixiao', 'taiji_jian'],
    equippedFabao: { weapon: 'azure_sword', armor: 'azure_robe', accessory: 'sapphire_ring' },
    ownedFabao: ['azure_sword', 'azure_robe', 'sapphire_ring'],
    currentLocationId: 'changan_city',
  },

  // ═══════════════════════════════════════════════
  // 🆕 沙盒：魔教
  // ═══════════════════════════════════════════════

  // 🌙 魔教 - 教主（化神五层 · 魔教教主 / 日月神教至尊）
  demon_master: {
    id: 'demon_master', name: '教主', talent: 'normal', sect: 'demon', level: 45,
    discipleRank: 'leader', courtRank: 'commoner', personality: 'aloof',
    courtStats: { strategy: 60, eloquence: 55, charisma: 65, scholarship: 30 }, influence: 100, courtPath: null,
    ...makeNpcStats(45, 'normal', 10), // 魔教功法暴击率更高
    skills: ['wudang_tianren', 'wudang_jianzhen', 'chunyang_wuji', 'sanfeng_yijian'], // 借用顶级武学
    equippedFabao: { weapon: 'celestial_sword', armor: 'celestial_robe', accessory: 'divine_ring' },
    ownedFabao: ['celestial_sword', 'celestial_robe', 'divine_ring'],
    currentLocationId: 'yangzhou_city', // 魔教隐匿于繁华市井
  },

  // 🌙 魔教 - 杨左使（元婴三层 · 传功长老 / 光明左使）
  demon_yang: {
    id: 'demon_yang', name: '杨左使', talent: 'normal', sect: 'demon', level: 33,
    discipleRank: 'elder', courtRank: 'commoner', personality: 'cunning',
    courtStats: { strategy: 45, eloquence: 50, charisma: 40, scholarship: 25 }, influence: 50, courtPath: null,
    ...makeNpcStats(33, 'normal', 5),
    skills: ['taiji_shengong', 'wudang_jianzhen', 'liangyi_sword', 'chunyang_gong'],
    equippedFabao: { weapon: 'void_blade', armor: 'void_robe', accessory: 'amethyst_ring' },
    ownedFabao: ['void_blade', 'void_robe', 'amethyst_ring'],
    currentLocationId: 'yangzhou_city',
  },

  // ═══════════════════════════════════════════════
  // 🆕 沙盒：城市官员（宋代官制）
  // ═══════════════════════════════════════════════

  // 🏛️ 开封府尹（东京汴梁 · 朝廷核心）
  kaifeng_fuyin: {
    id: 'kaifeng_fuyin', name: '包拯', talent: 'normal', sect: 'none', level: 7,
    discipleRank: 'outer', courtRank: 'shangshu', personality: 'upright',
    courtStats: { strategy: 60, eloquence: 70, charisma: 50, scholarship: 85 }, influence: 200, courtPath: 'wen',
    ...makeNpcStats(7, 'normal'),
    skills: ['wudang_changquan', 'yangqi_jue'],
    equippedFabao: { weapon: 'refined_sword', armor: 'silk_robe', accessory: 'jade_ring' },
    ownedFabao: ['refined_sword', 'silk_robe', 'jade_ring'],
    currentLocationId: 'kaifeng_city',
  },

  // 🏛️ 河南知府（西京洛阳 · 进士出身）
  luoyang_zhifu: {
    id: 'luoyang_zhifu', name: '赵汝成', talent: 'normal', sect: 'none', level: 6,
    discipleRank: 'outer', courtRank: 'jinshi', personality: 'gentle',
    courtStats: { strategy: 40, eloquence: 50, charisma: 45, scholarship: 60 }, influence: 100, courtPath: 'wen',
    ...makeNpcStats(6, 'normal'),
    skills: ['wudang_changquan', 'yangqi_jue'],
    equippedFabao: { weapon: 'refined_sword', armor: 'silk_robe', accessory: 'jade_ring' },
    ownedFabao: ['refined_sword', 'silk_robe', 'jade_ring'],
    currentLocationId: 'luoyang_city',
  },

  // 🏛️ 京兆知府（长安 · 进士出身）
  changan_zhifu: {
    id: 'changan_zhifu', name: '韩维庸', talent: 'normal', sect: 'none', level: 6,
    discipleRank: 'outer', courtRank: 'jinshi', personality: 'upright',
    courtStats: { strategy: 50, eloquence: 40, charisma: 35, scholarship: 55 }, influence: 90, courtPath: 'wen',
    ...makeNpcStats(6, 'normal'),
    skills: ['wudang_changquan', 'yangqi_jue'],
    equippedFabao: { weapon: 'refined_sword', armor: 'silk_robe', accessory: 'jade_ring' },
    ownedFabao: ['refined_sword', 'silk_robe', 'jade_ring'],
    currentLocationId: 'changan_city',
  },

  // 🏛️ 襄阳知府（军事重镇 · 武官举人）
  xiangyang_zhifu: {
    id: 'xiangyang_zhifu', name: '郭铁山', talent: 'normal', sect: 'none', level: 5,
    discipleRank: 'outer', courtRank: 'juren', personality: 'upright',
    courtStats: { strategy: 55, eloquence: 30, charisma: 40, scholarship: 35 }, influence: 70, courtPath: 'wu',
    ...makeNpcStats(5, 'normal'),
    skills: ['wudang_changquan'],
    equippedFabao: { weapon: 'iron_sword', armor: 'iron_mail', accessory: 'wooden_ring' },
    ownedFabao: ['iron_sword', 'iron_mail', 'wooden_ring'],
    currentLocationId: 'xiangyang_city',
  },

  // 🏛️ 江陵知府（荆湖北路 · 举人出身）
  jiangling_zhifu: {
    id: 'jiangling_zhifu', name: '刘守安', talent: 'normal', sect: 'none', level: 5,
    discipleRank: 'outer', courtRank: 'juren', personality: 'kind',
    courtStats: { strategy: 40, eloquence: 45, charisma: 40, scholarship: 45 }, influence: 60, courtPath: 'wen',
    ...makeNpcStats(5, 'normal'),
    skills: ['wudang_changquan'],
    equippedFabao: { weapon: 'iron_sword', armor: 'silk_robe', accessory: 'wooden_ring' },
    ownedFabao: ['iron_sword', 'silk_robe', 'wooden_ring'],
    currentLocationId: 'jiangling_city',
  },

  // 🏛️ 成都知府（蜀中重镇 · 举人出身）
  chengdu_zhifu: {
    id: 'chengdu_zhifu', name: '王仲良', talent: 'normal', sect: 'none', level: 5,
    discipleRank: 'outer', courtRank: 'juren', personality: 'gentle',
    courtStats: { strategy: 35, eloquence: 40, charisma: 45, scholarship: 50 }, influence: 60, courtPath: 'wen',
    ...makeNpcStats(5, 'normal'),
    skills: ['wudang_changquan'],
    equippedFabao: { weapon: 'iron_sword', armor: 'silk_robe', accessory: 'wooden_ring' },
    ownedFabao: ['iron_sword', 'silk_robe', 'wooden_ring'],
    currentLocationId: 'chengdu_city',
  },

  // 🏛️ 扬州知州（江南繁华地 · 举人出身）
  yangzhou_zhizhou: {
    id: 'yangzhou_zhizhou', name: '杜文清', talent: 'normal', sect: 'none', level: 4,
    discipleRank: 'outer', courtRank: 'juren', personality: 'cunning',
    courtStats: { strategy: 30, eloquence: 55, charisma: 50, scholarship: 40 }, influence: 55, courtPath: 'wen',
    ...makeNpcStats(4, 'normal'),
    skills: ['wudang_changquan'],
    equippedFabao: { weapon: 'iron_sword', armor: 'silk_robe', accessory: 'silver_pendant' },
    ownedFabao: ['iron_sword', 'silk_robe', 'silver_pendant'],
    currentLocationId: 'yangzhou_city',
  },

  // 🏛️ 苏州知州（园林之城 · 举人出身）
  suzhou_zhizhou: {
    id: 'suzhou_zhizhou', name: '白修文', talent: 'normal', sect: 'none', level: 4,
    discipleRank: 'outer', courtRank: 'juren', personality: 'kind',
    courtStats: { strategy: 25, eloquence: 50, charisma: 55, scholarship: 45 }, influence: 50, courtPath: 'wen',
    ...makeNpcStats(4, 'normal'),
    skills: ['wudang_changquan'],
    equippedFabao: { weapon: 'iron_sword', armor: 'silk_robe', accessory: 'silver_pendant' },
    ownedFabao: ['iron_sword', 'silk_robe', 'silver_pendant'],
    currentLocationId: 'suzhou_city',
  },

  // 🏛️ 临安知府（杭州 · 南宋行在 · 举人出身）
  hangzhou_zhifu: {
    id: 'hangzhou_zhifu', name: '林观潮', talent: 'normal', sect: 'none', level: 5,
    discipleRank: 'outer', courtRank: 'juren', personality: 'gentle',
    courtStats: { strategy: 35, eloquence: 45, charisma: 50, scholarship: 50 }, influence: 65, courtPath: 'wen',
    ...makeNpcStats(5, 'normal'),
    skills: ['wudang_changquan'],
    equippedFabao: { weapon: 'refined_sword', armor: 'silk_robe', accessory: 'jade_ring' },
    ownedFabao: ['refined_sword', 'silk_robe', 'jade_ring'],
    currentLocationId: 'hangzhou_city',
  },

  // 🏛️ 大理国相（异域邦国 · 进士品阶）
  dali_guoxiang: {
    id: 'dali_guoxiang', name: '高檀让', talent: 'normal', sect: 'none', level: 5,
    discipleRank: 'outer', courtRank: 'jinshi', personality: 'cunning',
    courtStats: { strategy: 45, eloquence: 40, charisma: 35, scholarship: 50 }, influence: 80, courtPath: 'wen',
    ...makeNpcStats(5, 'normal'),
    skills: ['wudang_changquan'],
    equippedFabao: { weapon: 'refined_sword', armor: 'silk_robe', accessory: 'jade_ring' },
    ownedFabao: ['refined_sword', 'silk_robe', 'jade_ring'],
    currentLocationId: 'dali_city',
  },

  // ═══════════════════════════════════════════════
  // 🆕 沙盒：茅山派
  // ═══════════════════════════════════════════════

  // 🔮 茅山派 - 掌教真人（化神二层 · 符箓宗师）
  maoshan_zhangmen: {
    id: 'maoshan_zhangmen', name: '陶天师', talent: 'normal', sect: 'maoshan', level: 42,
    discipleRank: 'leader', courtRank: 'commoner', personality: 'gentle',
    courtStats: { strategy: 45, eloquence: 35, charisma: 40, scholarship: 70 }, influence: 60, courtPath: 'wen',
    ...makeNpcStats(42, 'normal', 5),
    skills: ['taiji', 'taiji_jian', 'chunyang_gong', 'zixiao', 'wudang_zhenfa'],
    equippedFabao: { weapon: 'celestial_sword', armor: 'celestial_robe', accessory: 'divine_ring' },
    ownedFabao: ['celestial_sword', 'celestial_robe', 'divine_ring'],
    currentLocationId: 'maoshan_daoyuan',
  },

  // 🔮 茅山派 - 符箓长老（元婴二层 · 捉鬼天师）
  maoshan_elder: {
    id: 'maoshan_elder', name: '葛玄清', talent: 'normal', sect: 'maoshan', level: 32,
    discipleRank: 'elder', courtRank: 'commoner', personality: 'upright',
    courtStats: { strategy: 35, eloquence: 25, charisma: 30, scholarship: 55 }, influence: 30, courtPath: null,
    ...makeNpcStats(32, 'normal'),
    skills: ['taiji_jian', 'liangyi_sword', 'chunyang_gong', 'wudang_zhenfa'],
    equippedFabao: { weapon: 'void_blade', armor: 'void_robe', accessory: 'amethyst_ring' },
    ownedFabao: ['void_blade', 'void_robe', 'amethyst_ring'],
    currentLocationId: 'maoshan_daoyuan',
  },

  // ═══════════════════════════════════════════════
  // 🆕 沙盒：昆仑派
  // ═══════════════════════════════════════════════

  // 🏔️ 昆仑派 - 掌门（化神三层 · 雪山剑圣）
  kunlun_zhangmen: {
    id: 'kunlun_zhangmen', name: '何太虚', talent: 'normal', sect: 'kunlun', level: 43,
    discipleRank: 'leader', courtRank: 'commoner', personality: 'aloof',
    courtStats: { strategy: 50, eloquence: 25, charisma: 35, scholarship: 40 }, influence: 55, courtPath: null,
    ...makeNpcStats(43, 'normal', 5),
    skills: ['taiji_shengong', 'wudang_jianzhen', 'chunyang_wuji', 'sanfeng_yijian'],
    equippedFabao: { weapon: 'celestial_sword', armor: 'celestial_robe', accessory: 'divine_ring' },
    ownedFabao: ['celestial_sword', 'celestial_robe', 'divine_ring'],
    currentLocationId: 'kunlun_mountain',
  },

  // 🏔️ 昆仑派 - 传功长老（元婴三层 · 寒冰剑客）
  kunlun_elder: {
    id: 'kunlun_elder', name: '寒松子', talent: 'normal', sect: 'kunlun', level: 33,
    discipleRank: 'elder', courtRank: 'commoner', personality: 'gentle',
    courtStats: { strategy: 30, eloquence: 20, charisma: 30, scholarship: 40 }, influence: 25, courtPath: null,
    ...makeNpcStats(33, 'normal'),
    skills: ['taiji_jian', 'liangyi_sword', 'chunyang_wuji', 'wudang_jianzhen'],
    equippedFabao: { weapon: 'void_blade', armor: 'void_robe', accessory: 'amethyst_ring' },
    ownedFabao: ['void_blade', 'void_robe', 'amethyst_ring'],
    currentLocationId: 'kunlun_mountain',
  },

  // ═══════════════════════════════════════════════
  // 🆕 沙盒：青城派
  // ═══════════════════════════════════════════════

  // 🌿 青城派 - 掌门（元婴十层 · 幽谷剑客）
  qingcheng_zhangmen: {
    id: 'qingcheng_zhangmen', name: '余掌门', talent: 'normal', sect: 'qingcheng', level: 40,
    discipleRank: 'leader', courtRank: 'commoner', personality: 'kind',
    courtStats: { strategy: 40, eloquence: 30, charisma: 45, scholarship: 35 }, influence: 45, courtPath: null,
    ...makeNpcStats(40, 'normal', 5),
    skills: ['taiji_shengong', 'wudang_jianzhen', 'liangyi_sword', 'chunyang_gong'],
    equippedFabao: { weapon: 'celestial_sword', armor: 'celestial_robe', accessory: 'divine_ring' },
    ownedFabao: ['celestial_sword', 'celestial_robe', 'divine_ring'],
    currentLocationId: 'qingcheng_mountain',
  },

  // 🌿 青城派 - 传功长老（结丹十层 · 拳剑双修）
  qingcheng_elder: {
    id: 'qingcheng_elder', name: '常鹤鸣', talent: 'normal', sect: 'qingcheng', level: 30,
    discipleRank: 'elder', courtRank: 'commoner', personality: 'bold',
    courtStats: { strategy: 25, eloquence: 25, charisma: 40, scholarship: 25 }, influence: 20, courtPath: null,
    ...makeNpcStats(30, 'normal'),
    skills: ['taiji_jian', 'wudang_lianjian', 'zixiao', 'liangyi_sword'],
    equippedFabao: { weapon: 'azure_sword', armor: 'azure_robe', accessory: 'sapphire_ring' },
    ownedFabao: ['azure_sword', 'azure_robe', 'sapphire_ring'],
    currentLocationId: 'qingcheng_mountain',
  },

  // ═══════════════════════════════════════════════
  // 🆕 沙盒：唐门
  // ═══════════════════════════════════════════════

  // 🕷️ 唐门 - 门主（化神一层 · 暗器宗师）
  tangmen_zhangmen: {
    id: 'tangmen_zhangmen', name: '唐老太太', talent: 'normal', sect: 'tangmen', level: 41,
    discipleRank: 'leader', courtRank: 'commoner', personality: 'cunning',
    courtStats: { strategy: 50, eloquence: 40, charisma: 35, scholarship: 30 }, influence: 50, courtPath: null,
    ...makeNpcStats(41, 'normal', 8),
    skills: ['taiji_shengong', 'wudang_jianzhen', 'chunyang_wuji', 'sanfeng_yijian'],
    equippedFabao: { weapon: 'celestial_sword', armor: 'celestial_robe', accessory: 'divine_ring' },
    ownedFabao: ['celestial_sword', 'celestial_robe', 'divine_ring'],
    currentLocationId: 'tangmen_estate',
  },

  // 🕷️ 唐门 - 暗器长老（元婴一层 · 千手修罗）
  tangmen_elder: {
    id: 'tangmen_elder', name: '唐无影', talent: 'normal', sect: 'tangmen', level: 31,
    discipleRank: 'elder', courtRank: 'commoner', personality: 'aloof',
    courtStats: { strategy: 35, eloquence: 20, charisma: 25, scholarship: 25 }, influence: 20, courtPath: null,
    ...makeNpcStats(31, 'normal', 5),
    skills: ['taiji_jian', 'liangyi_sword', 'chunyang_wuji', 'wudang_zhenfa'],
    equippedFabao: { weapon: 'void_blade', armor: 'void_robe', accessory: 'amethyst_ring' },
    ownedFabao: ['void_blade', 'void_robe', 'amethyst_ring'],
    currentLocationId: 'tangmen_estate',
  },

  // ═══════════════════════════════════════════════
  // 🆕 沙盒：逍遥派
  // ═══════════════════════════════════════════════

  // 🦅 逍遥派 - 掌门（化神十层 · 逍遥子 / 最强散仙）
  xiaoyao_zhangmen: {
    id: 'xiaoyao_zhangmen', name: '逍遥子', talent: 'genius', sect: 'xiaoyao', level: 50,
    discipleRank: 'leader', courtRank: 'commoner', personality: 'aloof',
    courtStats: { strategy: 60, eloquence: 55, charisma: 50, scholarship: 80 }, influence: 100, courtPath: null,
    ...makeNpcStats(50, 'genius', 10),
    skills: ['wudang_tianren', 'wudang_hunypic', 'wudang_taiqing', 'wudang_zhenwu_jianyi', 'wudang_dao_jing'],
    equippedFabao: { weapon: 'celestial_sword', armor: 'celestial_robe', accessory: 'phoenix_pendant' },
    ownedFabao: ['celestial_sword', 'celestial_robe', 'phoenix_pendant'],
    currentLocationId: 'xiaoyao_valley',
  },

  // 🦅 逍遥派 - 传功长老（元婴六层 · 琴剑书生）
  xiaoyao_elder: {
    id: 'xiaoyao_elder', name: '苏星河', talent: 'normal', sect: 'xiaoyao', level: 36,
    discipleRank: 'elder', courtRank: 'commoner', personality: 'gentle',
    courtStats: { strategy: 45, eloquence: 40, charisma: 50, scholarship: 60 }, influence: 40, courtPath: 'wen',
    ...makeNpcStats(36, 'normal', 3),
    skills: ['taiji_shengong', 'wudang_jianzhen', 'chunyang_wuji', 'sanfeng_yijian'],
    equippedFabao: { weapon: 'void_blade', armor: 'dragon_mail', accessory: 'dragon_pendant' },
    ownedFabao: ['void_blade', 'dragon_mail', 'dragon_pendant'],
    currentLocationId: 'xiaoyao_valley',
  },

  // ═══════════════════════════════════════════════
  // 🆕 沙盒：全真教（终南山 · 道武双修）
  // ═══════════════════════════════════════════════

  // ⛰️ 全真教 - 掌教真人（化神三层 · 道武宗师 / 天罡北斗阵）
  quanzhen_zhangmen: {
    id: 'quanzhen_zhangmen', name: '陈道玄', talent: 'genius', sect: 'quanzhen', level: 43,
    discipleRank: 'leader', courtRank: 'commoner', personality: 'gentle',
    courtStats: { strategy: 50, eloquence: 45, charisma: 55, scholarship: 75 }, influence: 70, courtPath: 'wen',
    ...makeNpcStats(43, 'genius', 5),
    skills: ['taiji_shengong', 'wudang_jianzhen', 'chunyang_wuji', 'sanfeng_yijian'],
    equippedFabao: { weapon: 'celestial_sword', armor: 'celestial_robe', accessory: 'divine_ring' },
    ownedFabao: ['celestial_sword', 'celestial_robe', 'divine_ring'],
    currentLocationId: 'zhongnan_mountain',
  },

  // ⛰️ 全真教 - 传功长老（元婴二层 · 李清元 / 坤道宗师）
  quanzhen_elder: {
    id: 'quanzhen_elder', name: '李清元', talent: 'normal', sect: 'quanzhen', level: 35,
    discipleRank: 'elder', courtRank: 'commoner', personality: 'kind',
    courtStats: { strategy: 40, eloquence: 35, charisma: 45, scholarship: 65 }, influence: 35, courtPath: 'wen',
    ...makeNpcStats(35, 'normal'),
    skills: ['taiji_jian', 'liangyi_sword', 'chunyang_gong', 'wudang_zhenfa'],
    equippedFabao: { weapon: 'void_blade', armor: 'void_robe', accessory: 'amethyst_ring' },
    ownedFabao: ['void_blade', 'void_robe', 'amethyst_ring'],
    currentLocationId: 'zhongnan_mountain',
  },

  // ⛰️ 全真教 - 执法长老（元婴六层 · 周抱朴 / 铁面无私）
  quanzhen_qiuchuji: {
    id: 'quanzhen_qiuchuji', name: '周抱朴', talent: 'normal', sect: 'quanzhen', level: 36,
    discipleRank: 'elder', courtRank: 'xiucai', personality: 'upright',
    courtStats: { strategy: 55, eloquence: 40, charisma: 45, scholarship: 60 }, influence: 40, courtPath: 'wu',
    ...makeNpcStats(36, 'normal', 3),
    skills: ['taiji_jian', 'liangyi_sword', 'chunyang_wuji', 'wudang_jianzhen'],
    equippedFabao: { weapon: 'void_blade', armor: 'dragon_mail', accessory: 'dragon_pendant' },
    ownedFabao: ['void_blade', 'dragon_mail', 'dragon_pendant'],
    currentLocationId: 'zhongnan_mountain',
  },

  // ═══════════════════════════════════════════════
  // 🆕 沙盒：崆峒派（陇西 · 裂石拳绝学）
  // ═══════════════════════════════════════════════

  // 👊 崆峒派 - 掌门（元婴八层 · 裂石拳宗师 / 拳出如雷）
  kongtong_zhangmen: {
    id: 'kongtong_zhangmen', name: '铁昆仑', talent: 'normal', sect: 'kongtong', level: 38,
    discipleRank: 'leader', courtRank: 'commoner', personality: 'bold',
    courtStats: { strategy: 40, eloquence: 30, charisma: 40, scholarship: 30 }, influence: 45, courtPath: null,
    ...makeNpcStats(38, 'normal', 5),
    skills: ['luohan_fist', 'vajra_palm', 'yijin_jing', '72_arts'],
    equippedFabao: { weapon: 'void_blade', armor: 'void_robe', accessory: 'divine_ring' },
    ownedFabao: ['void_blade', 'void_robe', 'divine_ring'],
    currentLocationId: 'kongtong_mountain',
  },

  // 👊 崆峒派 - 传功长老（结丹八层 · 霍震岳 / 裂石拳传人）
  kongtong_elder: {
    id: 'kongtong_elder', name: '霍震岳', talent: 'normal', sect: 'kongtong', level: 28,
    discipleRank: 'elder', courtRank: 'commoner', personality: 'upright',
    courtStats: { strategy: 25, eloquence: 20, charisma: 30, scholarship: 20 }, influence: 20, courtPath: null,
    ...makeNpcStats(28, 'normal', 3),
    skills: ['luohan_fist', 'vajra_palm', 'yijin_jing', '72_arts'],
    equippedFabao: { weapon: 'azure_sword', armor: 'azure_robe', accessory: 'sapphire_ring' },
    ownedFabao: ['azure_sword', 'azure_robe', 'sapphire_ring'],
    currentLocationId: 'kongtong_mountain',
  },

  // ═══════════════════════════════════════════════
  // 🆕 沙盒：点苍派（南疆 · 洱海剑术）
  // ═══════════════════════════════════════════════

  // 🗡️ 点苍派 - 掌门（元婴七层 · 南疆剑圣 / 苍山云雪剑）
  diancang_zhangmen: {
    id: 'diancang_zhangmen', name: '柳沧溟', talent: 'normal', sect: 'diancang', level: 37,
    discipleRank: 'leader', courtRank: 'commoner', personality: 'aloof',
    courtStats: { strategy: 45, eloquence: 25, charisma: 35, scholarship: 35 }, influence: 40, courtPath: null,
    ...makeNpcStats(37, 'normal', 5),
    skills: ['wudang_sword', 'zixiao', 'taiji_jian', 'liangyi_sword'],
    equippedFabao: { weapon: 'void_blade', armor: 'void_robe', accessory: 'amethyst_ring' },
    ownedFabao: ['void_blade', 'void_robe', 'amethyst_ring'],
    currentLocationId: 'diancang_mountain',
  },

  // 🗡️ 点苍派 - 传功长老（结丹七层 · 谢云帆 / 苍洱剑客）
  diancang_elder: {
    id: 'diancang_elder', name: '谢云帆', talent: 'normal', sect: 'diancang', level: 27,
    discipleRank: 'elder', courtRank: 'commoner', personality: 'gentle',
    courtStats: { strategy: 25, eloquence: 30, charisma: 40, scholarship: 30 }, influence: 15, courtPath: null,
    ...makeNpcStats(27, 'normal', 3),
    skills: ['wudang_sword', 'wudang_lianjian', 'zixiao', 'taiji_jian'],
    equippedFabao: { weapon: 'azure_sword', armor: 'azure_robe', accessory: 'sapphire_ring' },
    ownedFabao: ['azure_sword', 'azure_robe', 'sapphire_ring'],
    currentLocationId: 'diancang_mountain',
  },

  // ═══════════════════════════════════════════════
  // 🆕 沙盒：新城市官员
  // ═══════════════════════════════════════════════

  // 🏛️ 江州知州（浔阳 · 水陆码头 · 举人出身）
  jiangzhou_zhizhou: {
    id: 'jiangzhou_zhizhou', name: '司马秋客', talent: 'normal', sect: 'none', level: 4,
    discipleRank: 'outer', courtRank: 'juren', personality: 'gentle',
    courtStats: { strategy: 30, eloquence: 45, charisma: 45, scholarship: 50 }, influence: 50, courtPath: 'wen',
    ...makeNpcStats(4, 'normal'),
    skills: ['wudang_changquan'],
    equippedFabao: { weapon: 'iron_sword', armor: 'silk_robe', accessory: 'silver_pendant' },
    ownedFabao: ['iron_sword', 'silk_robe', 'silver_pendant'],
    currentLocationId: 'jiangzhou_city',
  },

  // 🏛️ 潭州知府（长沙 · 岳麓书院 · 举人出身）
  tanzhou_zhifu: {
    id: 'tanzhou_zhifu', name: '周必正', talent: 'normal', sect: 'none', level: 5,
    discipleRank: 'outer', courtRank: 'juren', personality: 'gentle',
    courtStats: { strategy: 35, eloquence: 40, charisma: 40, scholarship: 70 }, influence: 55, courtPath: 'wen',
    ...makeNpcStats(5, 'normal'),
    skills: ['wudang_changquan'],
    equippedFabao: { weapon: 'refined_sword', armor: 'silk_robe', accessory: 'jade_ring' },
    ownedFabao: ['refined_sword', 'silk_robe', 'jade_ring'],
    currentLocationId: 'tanzhou_city',
  },

  // 🏛️ 广州市舶司使（南海 · 海上贸易 · 进士出身）
  guangzhou_shibosi: {
    id: 'guangzhou_shibosi', name: '陈望海', talent: 'normal', sect: 'none', level: 6,
    discipleRank: 'outer', courtRank: 'jinshi', personality: 'cunning',
    courtStats: { strategy: 45, eloquence: 55, charisma: 50, scholarship: 55 }, influence: 70, courtPath: 'wen',
    ...makeNpcStats(6, 'normal'),
    skills: ['wudang_changquan'],
    equippedFabao: { weapon: 'refined_sword', armor: 'silk_robe', accessory: 'jade_ring' },
    ownedFabao: ['refined_sword', 'silk_robe', 'jade_ring'],
    currentLocationId: 'guangzhou_city',
  },
};
