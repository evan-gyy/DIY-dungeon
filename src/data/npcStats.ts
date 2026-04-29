import type { SkillId, FabaoId, SectId } from './types';

// ──── 天赋系统 ────

export type TalentId = 'sword_heart' | 'lazy' | 'diligent' | 'genius' | 'normal';

export interface TalentData {
  name: string;
  desc: string;
  cultivationMul: number;   // 修行经验倍率
  skillLearnBonus: number;  // 技能学习成功率加成（0.0~1.0）
}

export const TALENTS: Record<TalentId, TalentData> = {
  sword_heart: { name: '剑心',   desc: '修行速度×1.5',       cultivationMul: 1.5, skillLearnBonus: 0.0 },
  lazy:        { name: '贪玩',   desc: '修行速度×0.7',       cultivationMul: 0.7, skillLearnBonus: 0.0 },
  diligent:    { name: '勤勉',   desc: '修行速度×1.2',       cultivationMul: 1.2, skillLearnBonus: 0.0 },
  genius:      { name: '天才',   desc: '技能学习成功率+20%', cultivationMul: 1.0, skillLearnBonus: 0.2 },
  normal:      { name: '无特殊', desc: '无特殊天赋',         cultivationMul: 1.0, skillLearnBonus: 0.0 },
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
}

// 根据等级生成基础属性
function makeStats(lv: number, hpBase: number, atkBase: number, defBase: number, agiBase: number) {
  const hp  = hpBase + lv * 20;
  const mp  = 20 + lv * 8;
  const atk = atkBase + lv * 3;
  const def = defBase + lv * 2;
  const agi = agiBase + lv;
  return { hp, maxHp: hp, mp, maxMp: mp, atk, def, agi, crit: 5 };
}

// ──── NPC 初始数值卡数据库 ────
// 包含所有有好感度/关系的重要角色

export const NPC_STATS_INIT: Record<string, Omit<NpcStats, 'exp'>> = {
  liu_qinghan: {
    id: 'liu_qinghan', name: '柳清寒', talent: 'sword_heart', sect: 'wudang', level: 20,
    ...makeStats(20, 100, 20, 12, 15),
    skills: ['wudang_sword', 'zixiao', 'taiji_jian', 'liangyi_sword'],
    equippedFabao: { weapon: 'refined_sword', armor: 'silk_robe', accessory: 'jade_ring' },
    ownedFabao: ['refined_sword', 'silk_robe', 'jade_ring'],
  },
  shen_nishang: {
    id: 'shen_nishang', name: '沈霓裳', talent: 'genius', sect: 'wudang', level: 15,
    ...makeStats(15, 90, 18, 10, 16),
    skills: ['wudang_changquan', 'wudang_jianfa_basic', 'wudang_qinggong'],
    equippedFabao: { weapon: 'iron_sword', armor: 'cloth_robe', accessory: null },
    ownedFabao: ['iron_sword', 'cloth_robe'],
  },
  mo_jiangqing: {
    id: 'mo_jiangqing', name: '墨绐青', talent: 'diligent', sect: 'wudang', level: 10,
    ...makeStats(10, 80, 14, 8, 12),
    skills: ['wudang_changquan', 'yangqi_jue'],
    equippedFabao: { weapon: null, armor: null, accessory: 'wooden_ring' },
    ownedFabao: ['wooden_ring'],
  },
  zhang_xuansu: {
    id: 'zhang_xuansu', name: '张玄素', talent: 'diligent', sect: 'wudang', level: 30,
    ...makeStats(30, 120, 28, 20, 18),
    skills: ['taiji', 'taiji_jian', 'liangyi_sword', 'chunyang_gong', 'wudang_zhenfa'],
    equippedFabao: { weapon: 'azure_sword', armor: 'azure_robe', accessory: 'sapphire_ring' },
    ownedFabao: ['azure_sword', 'azure_robe', 'sapphire_ring'],
  },
  chen_jingxu: {
    id: 'chen_jingxu', name: '陈静虚', talent: 'diligent', sect: 'wudang', level: 25,
    ...makeStats(25, 110, 24, 18, 15),
    skills: ['taiji', 'chunyang_gong', 'wudang_huti'],
    equippedFabao: { weapon: 'refined_sword', armor: 'azure_robe', accessory: 'jade_ring' },
    ownedFabao: ['refined_sword', 'azure_robe', 'jade_ring'],
  },
  lu_chengzhou: {
    id: 'lu_chengzhou', name: '陆沉舟', talent: 'normal', sect: 'wudang', level: 18,
    ...makeStats(18, 95, 22, 14, 14),
    skills: ['wudang_sword', 'mianzhang', 'wudang_lianjian'],
    equippedFabao: { weapon: 'refined_sword', armor: 'silk_robe', accessory: null },
    ownedFabao: ['refined_sword', 'silk_robe'],
  },
  gu_xiaosang: {
    id: 'gu_xiaosang', name: '顾小桑', talent: 'genius', sect: 'wudang', level: 12,
    ...makeStats(12, 85, 15, 10, 14),
    skills: ['wudang_changquan', 'wudang_jianfa_basic', 'wudang_qinggong'],
    equippedFabao: { weapon: 'iron_sword', armor: 'cloth_robe', accessory: 'wooden_ring' },
    ownedFabao: ['iron_sword', 'cloth_robe', 'wooden_ring'],
  },
  song_zhiyuan: {
    id: 'song_zhiyuan', name: '宋知远', talent: 'lazy', sect: 'wudang', level: 8,
    ...makeStats(8, 75, 12, 7, 11),
    skills: ['wudang_changquan', 'yangqi_jue'],
    equippedFabao: { weapon: 'iron_sword', armor: null, accessory: null },
    ownedFabao: ['iron_sword'],
  },
  ji_wushuang_npc: {
    id: 'ji_wushuang_npc', name: '纪无双', talent: 'sword_heart', sect: 'wudang', level: 16,
    ...makeStats(16, 90, 20, 12, 15),
    skills: ['wudang_sword', 'wudang_lianjian', 'wudang_yunkai'],
    equippedFabao: { weapon: 'refined_sword', armor: 'silk_robe', accessory: 'jade_ring' },
    ownedFabao: ['refined_sword', 'silk_robe', 'jade_ring'],
  },
  su_yunxiu_npc: {
    id: 'su_yunxiu_npc', name: '苏云绣', talent: 'genius', sect: 'wudang', level: 14,
    ...makeStats(14, 88, 17, 11, 15),
    skills: ['wudang_changquan', 'wudang_sword', 'mianzhang'],
    equippedFabao: { weapon: 'refined_sword', armor: 'cloth_robe', accessory: null },
    ownedFabao: ['refined_sword', 'cloth_robe'],
  },
  fang_zhonghe_npc: {
    id: 'fang_zhonghe_npc', name: '方仲和', talent: 'diligent', sect: 'wudang', level: 15,
    ...makeStats(15, 100, 18, 14, 10),
    skills: ['wudang_changquan', 'mianzhang', 'wudang_huti'],
    equippedFabao: { weapon: 'iron_sword', armor: 'silk_robe', accessory: 'wooden_ring' },
    ownedFabao: ['iron_sword', 'silk_robe', 'wooden_ring'],
  },
  meng_wenyuan: {
    id: 'meng_wenyuan', name: '孟文渊', talent: 'sword_heart', sect: 'wudang', level: 17,
    ...makeStats(17, 92, 21, 13, 14),
    skills: ['wudang_sword', 'taiji_jian', 'wudang_lianjian'],
    equippedFabao: { weapon: 'refined_sword', armor: 'silk_robe', accessory: null },
    ownedFabao: ['refined_sword', 'silk_robe'],
  },
  ye_ziyi: {
    id: 'ye_ziyi', name: '叶紫衣', talent: 'genius', sect: 'wudang', level: 13,
    ...makeStats(13, 85, 16, 11, 14),
    skills: ['wudang_jianfa_basic', 'wudang_sword', 'yangqi_jue'],
    equippedFabao: { weapon: 'iron_sword', armor: 'cloth_robe', accessory: 'wooden_ring' },
    ownedFabao: ['iron_sword', 'cloth_robe', 'wooden_ring'],
  },
};
