import type { EnemyId, EnemyTemplate, EncounterTier, WudangTier } from './types';

export const ENEMIES: Record<EnemyId, EnemyTemplate> = {

  // ── Tier 1：江湖喽啰 ──
  rogue_thug: {
    id: 'rogue_thug', name: '山贼流氓', icon: '🗡️', tier: 1,
    hp: 80, maxHp: 80, atk: 20, def: 8, agi: 6,
    reward: { exp: 40, gold: 8 },
    loot: [{ id: 'hp_potion', chance: 0.4 }],
    actions: [
      { name: '乱刀', icon: '🗡️', powerMul: 0.9, defPen: 0.7, hit: 1, mpCost: 0, weight: 50, effect: null },
      { name: '猛冲', icon: '💨', powerMul: 1.2, defPen: 0.5, hit: 1, mpCost: 0, weight: 30, effect: null },
      { name: '防守', icon: '🛡️', powerMul: 0, defPen: 0, hit: 0, mpCost: 0, weight: 20, effect: { type: 'def_boost', value: 6, duration: 1 } },
    ],
    aiDesc: '普攻流，偶尔加防',
  },
  poison_woman: {
    id: 'poison_woman', name: '毒门女侠', icon: '🐍', tier: 1,
    hp: 65, maxHp: 65, atk: 18, def: 6, agi: 10,
    reward: { exp: 45, gold: 10 },
    loot: [{ id: 'mp_potion', chance: 0.4 }],
    actions: [
      { name: '飞针', icon: '🎯', powerMul: 0.7, defPen: 0.9, hit: 1, mpCost: 0, weight: 40, effect: null },
      { name: '毒针', icon: '☠️', powerMul: 0.3, defPen: 1.0, hit: 1, mpCost: 0, weight: 40, effect: { type: 'poison', value: 8, duration: 2 } },
      { name: '闪步', icon: '🌀', powerMul: 0, defPen: 0, hit: 0, mpCost: 0, weight: 20, effect: { type: 'evade', value: 0.4, duration: 1 } },
    ],
    aiDesc: '毒dot流，善用闪避',
  },
  beggar_disciple: {
    id: 'beggar_disciple', name: '丐帮弟子', icon: '🦯', tier: 1,
    hp: 90, maxHp: 90, atk: 22, def: 10, agi: 7,
    reward: { exp: 38, gold: 6 },
    loot: [],
    actions: [
      { name: '棒打',   icon: '🦯', powerMul: 1.0, defPen: 0.7, hit: 1, mpCost: 0, weight: 60, effect: null },
      { name: '扫堂腿', icon: '🦵', powerMul: 0.7, defPen: 0.8, hit: 1, mpCost: 0, weight: 40, effect: { type: 'stun', value: 1, duration: 1 } },
    ],
    aiDesc: '稳定输出，偶尔眩晕',
  },

  // ── Tier 2：武林好手 ──
  huashan_swordsman: {
    id: 'huashan_swordsman', name: '华山剑客', icon: '⚔️', tier: 2,
    hp: 180, maxHp: 180, atk: 34, def: 16, agi: 14,
    reward: { exp: 90, gold: 22 },
    loot: [{ id: 'exp_scroll', chance: 0.25 }],
    actions: [
      { name: '剑气斩',   icon: '⚡', powerMul: 1.1, defPen: 0.8, hit: 1, mpCost: 0, weight: 40, effect: null },
      { name: '连环剑',   icon: '🗡️', powerMul: 0.6, defPen: 0.9, hit: 2, mpCost: 0, weight: 35, effect: null },
      { name: '内力蓄势', icon: '🌀', powerMul: 0, defPen: 0, hit: 0, mpCost: 0, weight: 25, effect: { type: 'buff_atk', value: 12, duration: 2 } },
    ],
    aiDesc: '连击+蓄势爆发',
  },
  emei_nun: {
    id: 'emei_nun', name: '峨眉师姐', icon: '🌸', tier: 2,
    hp: 160, maxHp: 160, atk: 30, def: 18, agi: 16,
    reward: { exp: 85, gold: 20 },
    loot: [{ id: 'hp_potion', chance: 0.35 }],
    actions: [
      { name: '峨眉剑', icon: '🌸', powerMul: 0.75, defPen: 0.85, hit: 2, mpCost: 0, weight: 45, effect: null },
      { name: '银丝毒', icon: '🐍', powerMul: 0.4, defPen: 0.7, hit: 1, mpCost: 0, weight: 35, effect: { type: 'poison', value: 10, duration: 3 } },
      { name: '疗伤',   icon: '💚', powerMul: 0, defPen: 0, hit: 0, mpCost: 0, weight: 20, effect: { type: 'self_heal', value: 0.2, duration: 1 } },
    ],
    aiDesc: '连击+毒+自愈',
  },
  shaolin_monk: {
    id: 'shaolin_monk', name: '少林武僧', icon: '🏯', tier: 2,
    hp: 230, maxHp: 230, atk: 32, def: 22, agi: 8,
    reward: { exp: 95, gold: 24 },
    loot: [{ id: 'iron_guard', chance: 0.15 }],
    actions: [
      { name: '金刚拳', icon: '👊', powerMul: 1.3, defPen: 0.4, hit: 1, mpCost: 0, weight: 45, effect: null },
      { name: '铁布衫', icon: '🏯', powerMul: 0, defPen: 0, hit: 0, mpCost: 0, weight: 30, effect: { type: 'def_boost', value: 15, duration: 2 } },
      { name: '扫地腿', icon: '🦵', powerMul: 0.8, defPen: 0.6, hit: 1, mpCost: 0, weight: 25, effect: { type: 'stun', value: 1, duration: 1 } },
    ],
    aiDesc: '高防高HP，周期加防',
  },

  // ── Tier 3：一流高手 ──
  demon_vanguard: {
    id: 'demon_vanguard', name: '魔教锋卫', icon: '🌙', tier: 3,
    hp: 380, maxHp: 380, atk: 55, def: 28, agi: 18,
    reward: { exp: 220, gold: 55 },
    loot: [{ id: 'exp_scroll', chance: 0.5 }, { id: 'mp_potion', chance: 0.4 }],
    actions: [
      { name: '乾坤一击', icon: '🌙', powerMul: 1.8, defPen: 0.6, hit: 1, mpCost: 0, weight: 35, effect: null },
      { name: '日月神功', icon: '⚡', powerMul: 1.0, defPen: 0.8, hit: 2, mpCost: 0, weight: 35, effect: null },
      { name: '魔功护体', icon: '🌀', powerMul: 0, defPen: 0, hit: 0, mpCost: 0, weight: 20, effect: { type: 'def_boost', value: 18, duration: 2 } },
      { name: '摄魂术',   icon: '👁️', powerMul: 0.3, defPen: 1.0, hit: 1, mpCost: 0, weight: 10, effect: { type: 'weaken_def', value: 12, duration: 2 } },
    ],
    aiDesc: 'BOSS级·全能威胁',
  },
  demon_witch: {
    id: 'demon_witch', name: '魔教妖女', icon: '🔮', tier: 3,
    hp: 320, maxHp: 320, atk: 48, def: 20, agi: 24,
    reward: { exp: 200, gold: 50 },
    loot: [{ id: 'hp_potion', chance: 0.6 }, { id: 'exp_scroll', chance: 0.4 }],
    actions: [
      { name: '蛊毒幻术', icon: '🔮', powerMul: 0.5, defPen: 1.0, hit: 1, mpCost: 0, weight: 30, effect: { type: 'strong_poison', value: 18, duration: 3 } },
      { name: '媚功',     icon: '💜', powerMul: 0, defPen: 0, hit: 0, mpCost: 0, weight: 25, effect: { type: 'weaken_def', value: 15, duration: 3 } },
      { name: '血爪',     icon: '🩸', powerMul: 1.4, defPen: 0.7, hit: 1, mpCost: 0, weight: 30, effect: null },
      { name: '魅影闪',   icon: '✨', powerMul: 0, defPen: 0, hit: 0, mpCost: 0, weight: 15, effect: { type: 'evade', value: 0.6, duration: 1 } },
    ],
    aiDesc: '毒+减防+高速',
  },
  ancient_master: {
    id: 'ancient_master', name: '江湖隐士', icon: '🧙', tier: 3,
    hp: 450, maxHp: 450, atk: 62, def: 32, agi: 12,
    reward: { exp: 280, gold: 70 },
    loot: [{ id: 'exp_scroll', chance: 0.8 }, { id: 'iron_guard', chance: 0.3 }],
    actions: [
      { name: '九阳神掌', icon: '🌟', powerMul: 2.0, defPen: 0.5, hit: 1, mpCost: 0, weight: 30, effect: null },
      { name: '混元功',   icon: '🌀', powerMul: 0.8, defPen: 0.9, hit: 3, mpCost: 0, weight: 30, effect: null },
      { name: '调息',     icon: '💫', powerMul: 0, defPen: 0, hit: 0, mpCost: 0, weight: 20, effect: { type: 'self_heal', value: 0.15, duration: 1 } },
      { name: '封脉一指', icon: '☝️', powerMul: 0.5, defPen: 0.8, hit: 1, mpCost: 0, weight: 20, effect: { type: 'stun', value: 1, duration: 2 } },
    ],
    aiDesc: '终极BOSS·平衡型',
  },

  // ── 武当山关卡 ──
  wudang_gate_disciple: {
    id: 'wudang_gate_disciple', name: '武当山门弟子', icon: '☯️', tier: 10,
    hp: 90, maxHp: 90, atk: 22, def: 10, agi: 8,
    reward: { exp: 60, gold: 15 },
    loot: [],
    actions: [
      { name: '武当长拳', icon: '👊', powerMul: 0.85, defPen: 0.7, hit: 1, mpCost: 0, weight: 60, effect: null },
      { name: '养气式',   icon: '🧘', powerMul: 0, defPen: 0, hit: 0, mpCost: 0, weight: 40, effect: { type: 'self_heal', value: 0.1, duration: 1 } },
    ],
    aiDesc: '武当入门弟子·稳健型',
  },
  wudang_mid_disciple: {
    id: 'wudang_mid_disciple', name: '武当中庭弟子', icon: '⚔️', tier: 11,
    hp: 160, maxHp: 160, atk: 30, def: 14, agi: 10,
    reward: { exp: 100, gold: 25 },
    loot: [{ id: 'mp_potion', chance: 0.3 }],
    actions: [
      { name: '太极剑',   icon: '☯️', powerMul: 1.0, defPen: 0.6, hit: 1, mpCost: 0, weight: 50, effect: null },
      { name: '绵掌',     icon: '🌊', powerMul: 0.6, defPen: 0.8, hit: 2, mpCost: 0, weight: 30, effect: null },
      { name: '静心调息', icon: '💫', powerMul: 0, defPen: 0, hit: 0, mpCost: 0, weight: 20, effect: { type: 'self_heal', value: 0.12, duration: 1 } },
    ],
    aiDesc: '武当精锐·攻守兼备',
  },
  wudang_elder_battle: {
    id: 'wudang_elder_battle', name: '武当传功长老', icon: '🧓', tier: 12,
    hp: 350, maxHp: 350, atk: 45, def: 22, agi: 12,
    reward: { exp: 200, gold: 50 },
    loot: [],
    actions: [
      { name: '太极拳',   icon: '☯️', powerMul: 1.3, defPen: 0.4, hit: 1, mpCost: 0, weight: 40, effect: { type: 'stun', value: 1, duration: 1 } },
      { name: '太极剑',   icon: '⚔️', powerMul: 1.1, defPen: 0.5, hit: 1, mpCost: 0, weight: 35, effect: null },
      { name: '运劲吐纳', icon: '💫', powerMul: 0, defPen: 0, hit: 0, mpCost: 0, weight: 25, effect: { type: 'self_heal', value: 0.15, duration: 1 } },
    ],
    aiDesc: '武当传功长老·太极拳',
  },

  // ── 第一章教学战 ──
  training_dummy: {
    id: 'training_dummy', name: '木制机关人', icon: '🤖', tier: 0,
    hp: 20, maxHp: 20, atk: 4, def: 2, agi: 2,
    reward: { exp: 10, gold: 0 },
    loot: [],
    actions: [
      { name: '木拳', icon: '👊', powerMul: 0.5, defPen: 0.6, hit: 1, mpCost: 0, weight: 70, effect: null },
      { name: '卡顿', icon: '⚙️', powerMul: 0, defPen: 0, hit: 0, mpCost: 0, weight: 30, effect: { type: 'def_boost', value: 2, duration: 1 } },
    ],
    aiDesc: '教学机关·极弱·约3回合击败',
  },
  shadow_scout: {
    id: 'shadow_scout', name: '暗道蛛', icon: '🕷️', tier: 0,
    hp: 30, maxHp: 30, atk: 6, def: 2, agi: 5,
    reward: { exp: 15, gold: 3 },
    loot: [],
    actions: [
      { name: '蛛丝缠绕', icon: '🕸️', powerMul: 0.7, defPen: 0.6, hit: 1, mpCost: 0, weight: 50, effect: null },
      { name: '毒牙刺',   icon: '🦷', powerMul: 0.8, defPen: 0.7, hit: 1, mpCost: 0, weight: 30, effect: { type: 'poison', value: 2, duration: 2 } },
      { name: '退缩',     icon: '💨', powerMul: 0, defPen: 0, hit: 0, mpCost: 0, weight: 20, effect: { type: 'evade', value: 0.3, duration: 1 } },
    ],
    aiDesc: '暗道蜘蛛·凡人水平·约5回合击败',
  },
  shadow_agent: {
    id: 'shadow_agent', name: '密探高手', icon: '🥷', tier: 2,
    hp: 180, maxHp: 180, atk: 35, def: 15, agi: 12,
    reward: { exp: 0, gold: 0 },
    loot: [],
    actions: [
      { name: '锁喉刀',   icon: '🗡️', powerMul: 1.4, defPen: 0.6, hit: 1, mpCost: 0, weight: 40, effect: null },
      { name: '连环斩',   icon: '⚔️', powerMul: 0.7, defPen: 0.8, hit: 2, mpCost: 0, weight: 35, effect: null },
      { name: '密探杀招', icon: '💀', powerMul: 2.0, defPen: 0.4, hit: 1, mpCost: 0, weight: 25, effect: { type: 'stun', value: 1, duration: 1 } },
    ],
    aiDesc: '密探精锐·结丹水平·注定战败敌人',
    scriptedDefeat: true,
  },

  // ── 第二章：武当·清河镇 ──
  zhao_dashi: {
    id: 'zhao_dashi', name: '赵大石', icon: '💪', tier: 1,
    hp: 120, maxHp: 120, atk: 25, def: 12, agi: 5,
    reward: { exp: 55, gold: 0 },
    loot: [],
    actions: [
      { name: '猛力一击', icon: '💪', powerMul: 1.3, defPen: 0.4, hit: 1, mpCost: 0, weight: 50, effect: null },
      { name: '蛮力横扫', icon: '🌀', powerMul: 0.8, defPen: 0.5, hit: 2, mpCost: 0, weight: 30, effect: null },
      { name: '扎马步',   icon: '🧱', powerMul: 0, defPen: 0, hit: 0, mpCost: 0, weight: 20, effect: { type: 'def_boost', value: 8, duration: 1 } },
    ],
    aiDesc: '外门弟子·力量型·小比对手',
  },
  yamen_guard: {
    id: 'yamen_guard', name: '县衙衙役', icon: '⚔️', tier: 1,
    hp: 100, maxHp: 100, atk: 22, def: 10, agi: 7,
    reward: { exp: 40, gold: 5 },
    loot: [],
    actions: [
      { name: '刀劈', icon: '🗡️', powerMul: 1.0, defPen: 0.7, hit: 1, mpCost: 0, weight: 55, effect: null },
      { name: '追击', icon: '💨', powerMul: 0.7, defPen: 0.8, hit: 1, mpCost: 0, weight: 30, effect: null },
      { name: '鸣金', icon: '🔔', powerMul: 0, defPen: 0, hit: 0, mpCost: 0, weight: 15, effect: { type: 'buff_atk', value: 5, duration: 1 } },
    ],
    aiDesc: '县衙爪牙·炼气五层水平',
  },
  bandit_elite: {
    id: 'bandit_elite', name: '土匪精锐', icon: '🪓', tier: 2,
    hp: 140, maxHp: 140, atk: 28, def: 12, agi: 9,
    reward: { exp: 70, gold: 15 },
    loot: [{ id: 'hp_potion', chance: 0.3 }],
    actions: [
      { name: '斧劈',   icon: '🪓', powerMul: 1.2, defPen: 0.6, hit: 1, mpCost: 0, weight: 45, effect: null },
      { name: '连环刀', icon: '⚔️', powerMul: 0.65, defPen: 0.8, hit: 2, mpCost: 0, weight: 35, effect: null },
      { name: '狂暴',   icon: '😡', powerMul: 0, defPen: 0, hit: 0, mpCost: 0, weight: 20, effect: { type: 'buff_atk', value: 10, duration: 2 } },
    ],
    aiDesc: '苍岭山精锐土匪·炼气六七层水平',
  },
  one_eye_leopard: {
    id: 'one_eye_leopard', name: '独眼豹', icon: '🐆', tier: 2,
    hp: 220, maxHp: 220, atk: 35, def: 15, agi: 11,
    reward: { exp: 120, gold: 30 },
    loot: [{ id: 'exp_scroll', chance: 0.5 }],
    actions: [
      { name: '独眼凶光', icon: '👁️', powerMul: 1.4, defPen: 0.6, hit: 1, mpCost: 0, weight: 40, effect: null },
      { name: '豹爪连击', icon: '🐾', powerMul: 0.7, defPen: 0.7, hit: 2, mpCost: 0, weight: 35, effect: null },
      { name: '喝令小弟', icon: '📣', powerMul: 0, defPen: 0, hit: 0, mpCost: 0, weight: 25, effect: { type: 'def_boost', value: 10, duration: 1 } },
    ],
    aiDesc: '苍岭山匪首·炼气九层水平',
  },
  one_eye_leopard_drugged: {
    id: 'one_eye_leopard_drugged', name: '邪药独眼豹', icon: '💉', tier: 3,
    hp: 350, maxHp: 350, atk: 45, def: 18, agi: 13,
    reward: { exp: 250, gold: 50 },
    loot: [{ id: 'exp_scroll', chance: 1.0 }, { id: 'hp_potion', chance: 0.6 }],
    actions: [
      { name: '燃血掌击', icon: '🩸', powerMul: 1.8, defPen: 0.5, hit: 1, mpCost: 0, weight: 35, effect: { type: 'self_heal', value: 0.08, duration: 1 } },
      { name: '血怒连斩', icon: '⚡', powerMul: 0.9, defPen: 0.7, hit: 2, mpCost: 0, weight: 35, effect: null },
      { name: '燃血爆发', icon: '💥', powerMul: 2.2, defPen: 0.3, hit: 1, mpCost: 0, weight: 20, effect: null },
      { name: '药力反噬', icon: '☠️', powerMul: 0, defPen: 0, hit: 0, mpCost: 0, weight: 10, effect: { type: 'weaken_def', value: 8, duration: 2 } },
    ],
    aiDesc: '燃血丹强化·伪筑基·每回合自损5%HP',
  },
};

export function getRandomEnemy(tier: number): EnemyTemplate {
  const pool = Object.values(ENEMIES).filter(e => e.tier === tier);
  const template = pool[Math.floor(Math.random() * pool.length)];
  if (!template) throw new Error(`No enemy found for tier ${tier}`);
  return JSON.parse(JSON.stringify(template)) as EnemyTemplate;
}

export const ENCOUNTER_TIERS: EncounterTier[] = [
  { label: '街头混战（练习）', tier: 1, desc: '适合初出茅庐，积累武学经验。' },
  { label: '武林争斗（普通）', tier: 2, desc: '有一定危险，需合理运用技能。' },
  { label: '江湖强敌（困难）', tier: 3, desc: '顶尖高手，务必做好充分准备。' },
];

export const WUDANG_TIERS: WudangTier[] = [
  { label: '武当山 · 山门', tier: 10, desc: '武当山门弟子镇守，试探你的根基。' },
  { label: '武当山 · 前山', tier: 11, desc: '武当前山险道，精锐弟子严阵以待。' },
  { label: '武当山 · 大殿', tier: 12, desc: '武当真武大殿，传功长老亲自出手！' },
];
