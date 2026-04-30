import type { SkillId, FabaoId, SectId } from './types';
import type { LocationId } from './worldMap';
import { calculateFinalStats } from './realmConfig';

// ──── 天赋系统 ────

export type TalentId = 
  | 'sword_heart' | 'lazy' | 'diligent' | 'genius' | 'normal'
  | 'strong_as_ox' | 'iron_skin' | 'swift_shadow'  // 通用天赋
  | 'dragon_vein' | 'sword_heart_frost';  // 🆕 特殊天赋：主角和女主专属

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
}

export const TALENTS: Record<TalentId, TalentData> = {
  // 通用天赋
  sword_heart: { name: '剑心',   desc: '修行速度×1.5，身法+10%',       cultivationMul: 1.5, skillLearnBonus: 0.0, statBonus: { agiMul: 1.10 } },
  lazy:        { name: '贪玩',   desc: '修行速度×0.7',       cultivationMul: 0.7, skillLearnBonus: 0.0 },
  diligent:    { name: '勤勉',   desc: '修行速度×1.2',       cultivationMul: 1.2, skillLearnBonus: 0.0 },
  genius:      { name: '天才',   desc: '技能学习成功率+20%，真气+15%', cultivationMul: 1.0, skillLearnBonus: 0.2, statBonus: { mpMul: 1.15 } },
  normal:      { name: '无特殊', desc: '无特殊天赋',         cultivationMul: 1.0, skillLearnBonus: 0.0 },
  strong_as_ox: { name: '力大如牛', desc: '攻击+20%', cultivationMul: 1.0, skillLearnBonus: 0.0, statBonus: { atkMul: 1.20 } },
  iron_skin:    { name: '铜皮铁骨', desc: '防御+20%', cultivationMul: 1.0, skillLearnBonus: 0.0, statBonus: { defMul: 1.20 } },
  swift_shadow: { name: '疾如风',   desc: '身法+20%', cultivationMul: 1.0, skillLearnBonus: 0.0, statBonus: { agiMul: 1.20 } },
  
  // 🆕 专属天赋
  dragon_vein: { 
    name: '九霄龙脉', 
    desc: '前朝皇室血脉，修行速度×1.3，全属性+10%，暴击率+5%', 
    cultivationMul: 1.3, 
    skillLearnBonus: 0.1, 
    statBonus: { hpMul: 1.10, mpMul: 1.10, atkMul: 1.10, defMul: 1.10, agiMul: 1.10 } 
  },
  sword_heart_frost: { 
    name: '剑心·寒', 
    desc: '柳清寒专属天赋，修行速度×1.6，身法+15%，攻击+10%', 
    cultivationMul: 1.6, 
    skillLearnBonus: 0.0, 
    statBonus: { agiMul: 1.15, atkMul: 1.10 } 
  },
};

// ──── NPC 数值卡 ────

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
  // 🆕 新增：NPC当前所在地点
  currentLocationId?: LocationId;
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
  // 🌸 女主角 - 柳清寒（结丹八层，剑心·寒专属天赋）
  liu_qinghan: {
    id: 'liu_qinghan', name: '柳清寒', talent: 'sword_heart_frost', sect: 'wudang', level: 28,
    ...makeNpcStats(28, 'sword_heart_frost', 5),  // 额外5%暴击
    skills: ['wudang_sword', 'zixiao', 'taiji_jian', 'liangyi_sword', 'chunyang_gong'],
    equippedFabao: { weapon: 'azure_sword', armor: 'azure_robe', accessory: 'sapphire_ring' },
    ownedFabao: ['azure_sword', 'azure_robe', 'sapphire_ring'],
  },
  
  // 🌸 女主角 - 沈霓裳（筑基三层，天才天赋）
  shen_nishang: {
    id: 'shen_nishang', name: '沈霓裳', talent: 'normal', sect: 'wudang', level: 13,
    ...makeNpcStats(13, 'normal'),
    skills: ['wudang_changquan', 'wudang_jianfa_basic', 'wudang_qinggong', 'mianzhang'],
    equippedFabao: { weapon: 'refined_sword', armor: 'silk_robe', accessory: 'jade_ring' },
    ownedFabao: ['refined_sword', 'silk_robe', 'jade_ring'],
  },
  
  // 🌸 女主角 - 墨绐青（渡劫期，勤勉天赋）
  mo_jiangqing: {
    id: 'mo_jiangqing', name: '墨绐青', talent: 'normal', sect: 'wudang', level: 55,
    ...makeNpcStats(55, 'normal', 10),  // 额外10%暴击
    skills: ['wudang_dao_jing', 'wudang_xuankong', 'wudang_taiyi', 'wudang_wuji_dao_jian'],
    equippedFabao: { weapon: 'tribulation_blade', armor: 'tribulation_robe', accessory: 'blood_ring' },
    ownedFabao: ['tribulation_blade', 'tribulation_robe', 'blood_ring'],
  },
  
  // ☯️ 武当派 - 张玄素（化神六层，勤勉天赋）
  zhang_xuansu: {
    id: 'zhang_xuansu', name: '张玄素', talent: 'normal', sect: 'wudang', level: 46,
    ...makeNpcStats(46, 'normal', 5),
    skills: ['taiji_shengong', 'wudang_jianzhen', 'chunyang_wuji', 'sanfeng_yijian', 'wudang_tianren'],
    equippedFabao: { weapon: 'celestial_sword', armor: 'celestial_robe', accessory: 'divine_ring' },
    ownedFabao: ['celestial_sword', 'celestial_robe', 'divine_ring'],
  },
  
  // ☯️ 武当派 - 陈静虚（元婴五层，勤勉天赋）
  chen_jingxu: {
    id: 'chen_jingxu', name: '陈静虚', talent: 'normal', sect: 'wudang', level: 35,
    ...makeNpcStats(35, 'normal'),
    skills: ['taiji', 'taiji_jian', 'liangyi_sword', 'chunyang_gong', 'taiji_shengong'],
    equippedFabao: { weapon: 'void_blade', armor: 'void_robe', accessory: 'amethyst_ring' },
    ownedFabao: ['void_blade', 'void_robe', 'amethyst_ring'],
  },
  
  // ☯️ 武当派 - 陆沉舟（筑基八层，无特殊天赋）
  lu_chengzhou: {
    id: 'lu_chengzhou', name: '陆沉舟', talent: 'normal', sect: 'wudang', level: 18,
    ...makeNpcStats(18, 'normal'),
    skills: ['wudang_sword', 'mianzhang', 'wudang_lianjian', 'zixiao'],
    equippedFabao: { weapon: 'refined_sword', armor: 'silk_robe', accessory: 'jade_ring' },
    ownedFabao: ['refined_sword', 'silk_robe', 'jade_ring'],
  },
  
  // ☯️ 武当派 - 顾小桑（筑基三层，天才天赋）
  gu_xiaosang: {
    id: 'gu_xiaosang', name: '顾小桑', talent: 'normal', sect: 'wudang', level: 13,
    ...makeNpcStats(13, 'normal'),
    skills: ['wudang_changquan', 'wudang_jianfa_basic', 'wudang_qinggong', 'mianzhang'],
    equippedFabao: { weapon: 'refined_sword', armor: 'silk_robe', accessory: 'silver_pendant' },
    ownedFabao: ['refined_sword', 'silk_robe', 'silver_pendant'],
  },
  
  // ☯️ 武当派 - 宋知远（炼气三层，贪玩天赋）
  song_zhiyuan: {
    id: 'song_zhiyuan', name: '宋知远', talent: 'normal', sect: 'wudang', level: 3,
    ...makeNpcStats(3, 'normal'),
    skills: ['wudang_changquan', 'yangqi_jue'],
    equippedFabao: { weapon: 'iron_sword', armor: 'cloth_robe', accessory: null },
    ownedFabao: ['iron_sword', 'cloth_robe'],
  },
  
  // ☯️ 武当派 - 纪无双（筑基七层，剑心天赋）
  ji_wushuang_npc: {
    id: 'ji_wushuang_npc', name: '纪无双', talent: 'normal', sect: 'wudang', level: 17,
    ...makeNpcStats(17, 'normal'),
    skills: ['wudang_sword', 'wudang_lianjian', 'zixiao', 'mianzhang'],
    equippedFabao: { weapon: 'refined_sword', armor: 'silk_robe', accessory: 'jade_ring' },
    ownedFabao: ['refined_sword', 'silk_robe', 'jade_ring'],
  },
  
  // ☯️ 武当派 - 苏云绣（筑基六层，天才天赋）
  su_yunxiu_npc: {
    id: 'su_yunxiu_npc', name: '苏云绣', talent: 'normal', sect: 'wudang', level: 16,
    ...makeNpcStats(16, 'normal'),
    skills: ['wudang_changquan', 'wudang_sword', 'mianzhang', 'wudang_qinggong'],
    equippedFabao: { weapon: 'refined_sword', armor: 'silk_robe', accessory: 'silver_pendant' },
    ownedFabao: ['refined_sword', 'silk_robe', 'silver_pendant'],
  },
  
  // ☯️ 武当派 - 方仲和（筑基五层，勤勉天赋）
  fang_zhonghe_npc: {
    id: 'fang_zhonghe_npc', name: '方仲和', talent: 'normal', sect: 'wudang', level: 15,
    ...makeNpcStats(15, 'normal'),
    skills: ['wudang_changquan', 'mianzhang', 'wudang_huti', 'wudang_sword'],
    equippedFabao: { weapon: 'refined_sword', armor: 'iron_mail', accessory: 'wooden_ring' },
    ownedFabao: ['refined_sword', 'iron_mail', 'wooden_ring'],
  },
  
  // ☯️ 武当派 - 孟文渊（筑基九层，剑心天赋）
  meng_wenyuan: {
    id: 'meng_wenyuan', name: '孟文渊', talent: 'normal', sect: 'wudang', level: 19,
    ...makeNpcStats(19, 'normal', 3),
    skills: ['wudang_sword', 'taiji_jian', 'wudang_lianjian', 'zixiao'],
    equippedFabao: { weapon: 'refined_sword', armor: 'silk_robe', accessory: 'jade_ring' },
    ownedFabao: ['refined_sword', 'silk_robe', 'jade_ring'],
  },
  
  // ☯️ 武当派 - 叶紫衣（筑基四层，天才天赋）
  ye_ziyi: {
    id: 'ye_ziyi', name: '叶紫衣', talent: 'normal', sect: 'wudang', level: 14,
    ...makeNpcStats(14, 'normal'),
    skills: ['wudang_jianfa_basic', 'wudang_sword', 'yangqi_jue', 'wudang_qinggong'],
    equippedFabao: { weapon: 'refined_sword', armor: 'cloth_robe', accessory: 'wooden_ring' },
    ownedFabao: ['refined_sword', 'cloth_robe', 'wooden_ring'],
  },
};
