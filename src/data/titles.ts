// ============================================================
//  src/data/titles.ts — 称号系统定义
// ============================================================
//  称号按类型分组，满足条件自动获得，部分可叠加显示。
//  激活称号提供属性加成（同一时间只能激活一个）。
// ============================================================

import type { SectId } from './types';

export type TitleCategory = 'combat' | 'cultivation' | 'reputation' | 'wealth' | 'special' | 'faction';

export interface TitleDef {
  id: string;
  name: string;
  category: TitleCategory;
  desc: string;
  /** 是否可叠加显示（cosmetic titles 可以同时显示多个） */
  cosmetic: boolean;
  /** 激活后的属性加成（百分比/固定值） */
  bonus: {
    atkMul?: number;
    defMul?: number;
    agiMul?: number;
    hpMul?: number;
    mpMul?: number;
    critBonus?: number;
    cultivationMul?: number;
  };
  /** 获取条件（由 TitleSystem 检查） */
  condition: TitleCondition;
}

export interface TitleCondition {
  type:
    | 'kill_count'      // 杀敌数
    | 'level'           // 达到境界等级
    | 'reputation'      // 声望值
    | 'gold'            // 持有黄金
    | 'sect_rank'       // 宗门身份
    | 'court_rank'      // 朝廷官阶
    | 'skill_count'     // 掌握技能数
    | 'steal_count'     // 偷师成功次数
    | 'recruit_count'   // 招募随从数
    | 'fabao_count'     // 法宝拥有数
    | 'affection_80_count'; // 好感≥80 的NPC数
  threshold: number;
  /** 额外的 sect 过滤（仅 sect_rank 使用） */
  sectFilter?: SectId;
}

export interface PlayerTitle {
  titleId: string;
  acquiredAt: number; // gameMonth
}

// ──── 称号列表 ────

export const ALL_TITLES: TitleDef[] = [

  // ══════ 战斗称号 ══════
  {
    id: 'battle_hundred',
    name: '百人斩',
    category: 'combat',
    desc: '累计击败 100 名敌人',
    cosmetic: false,
    bonus: { atkMul: 0.05 },
    condition: { type: 'kill_count', threshold: 100 },
  },
  {
    id: 'battle_thousand',
    name: '万人敌',
    category: 'combat',
    desc: '累计击败 1000 名敌人',
    cosmetic: false,
    bonus: { atkMul: 0.10, critBonus: 0.05 },
    condition: { type: 'kill_count', threshold: 1000 },
  },
  {
    id: 'undefeated_50',
    name: '不败战将',
    category: 'combat',
    desc: '连续 50 场战斗不败',
    cosmetic: false,
    bonus: { defMul: 0.08, hpMul: 0.05 },
    condition: { type: 'kill_count', threshold: 50 },
  },

  // ══════ 修炼称号 ══════
  {
    id: 'realm_jindan',
    name: '金丹真人',
    category: 'cultivation',
    desc: '修为达到金丹期（≥30级）',
    cosmetic: false,
    bonus: { mpMul: 0.10, cultivationMul: 0.05 },
    condition: { type: 'level', threshold: 30 },
  },
  {
    id: 'realm_yuanying',
    name: '元婴真君',
    category: 'cultivation',
    desc: '修为达到元婴期（≥50级）',
    cosmetic: false,
    bonus: { mpMul: 0.15, cultivationMul: 0.08 },
    condition: { type: 'level', threshold: 50 },
  },
  {
    id: 'realm_huashen',
    name: '化神天尊',
    category: 'cultivation',
    desc: '修为达到化神期（≥70级）',
    cosmetic: false,
    bonus: { mpMul: 0.20, cultivationMul: 0.12 },
    condition: { type: 'level', threshold: 70 },
  },

  // ══════ 声望称号 ══════
  {
    id: 'rep_hero',
    name: '大侠',
    category: 'reputation',
    desc: '声望达到 500',
    cosmetic: false,
    bonus: { defMul: 0.05 },
    condition: { type: 'reputation', threshold: 500 },
  },
  {
    id: 'rep_legend',
    name: '武林泰斗',
    category: 'reputation',
    desc: '声望达到 900',
    cosmetic: false,
    bonus: { atkMul: 0.05, defMul: 0.05 },
    condition: { type: 'reputation', threshold: 900 },
  },
  {
    id: 'rep_villain',
    name: '大魔头',
    category: 'reputation',
    desc: '声望降至 -300 以下',
    cosmetic: false,
    bonus: { atkMul: 0.08, defMul: -0.03 },
    condition: { type: 'reputation', threshold: -300 },
  },

  // ══════ 财富称号 ══════
  {
    id: 'wealth_rich',
    name: '富甲一方',
    category: 'wealth',
    desc: '拥有 10000 两黄金',
    cosmetic: true,
    bonus: {},
    condition: { type: 'gold', threshold: 10000 },
  },
  {
    id: 'wealth_mogul',
    name: '富可敌国',
    category: 'wealth',
    desc: '拥有 50000 两黄金',
    cosmetic: true,
    bonus: { cultivationMul: 0.03 },
    condition: { type: 'gold', threshold: 50000 },
  },

  // ══════ 势力称号 ══════
  {
    id: 'sect_elder',
    name: '宗门长老',
    category: 'faction',
    desc: '在任何宗门达到长老身份',
    cosmetic: false,
    bonus: { hpMul: 0.08 },
    condition: { type: 'sect_rank', threshold: 3 }, // elder index in DISCIPLE_RANK_ORDER
  },
  {
    id: 'sect_leader',
    name: '一教之主',
    category: 'faction',
    desc: '成为掌门',
    cosmetic: false,
    bonus: { atkMul: 0.08, hpMul: 0.08 },
    condition: { type: 'sect_rank', threshold: 5 }, // leader index
  },
  {
    id: 'court_noble',
    name: '朝堂重臣',
    category: 'faction',
    desc: '朝廷官阶达到五品以上',
    cosmetic: true,
    bonus: { cultivationMul: 0.03 },
    condition: { type: 'court_rank', threshold: 4 },
  },

  // ══════ 特殊称号 ══════
  {
    id: 'scholar_30',
    name: '博采众长',
    category: 'special',
    desc: '掌握 30 种以上技能',
    cosmetic: false,
    bonus: { mpMul: 0.10 },
    condition: { type: 'skill_count', threshold: 30 },
  },
  {
    id: 'steal_master',
    name: '偷师圣手',
    category: 'special',
    desc: '成功偷师 5 次',
    cosmetic: false,
    bonus: { agiMul: 0.10 },
    condition: { type: 'steal_count', threshold: 5 },
  },
  {
    id: 'recruit_5',
    name: '门客满堂',
    category: 'special',
    desc: '招募 5 名随从',
    cosmetic: true,
    bonus: {},
    condition: { type: 'recruit_count', threshold: 5 },
  },
  {
    id: 'fabao_10',
    name: '法宝收藏家',
    category: 'special',
    desc: '拥有 10 件以上法宝',
    cosmetic: true,
    bonus: { cultivationMul: 0.03 },
    condition: { type: 'fabao_count', threshold: 10 },
  },
  {
    id: 'charm_king',
    name: '人脉通达',
    category: 'special',
    desc: '与 5 位 NPC 好感达到 80 以上',
    cosmetic: true,
    bonus: {},
    condition: { type: 'affection_80_count', threshold: 5 },
  },
];

/** 按 id 快速查找 */
export const TITLE_MAP: Record<string, TitleDef> = {};
for (const t of ALL_TITLES) TITLE_MAP[t.id] = t;
