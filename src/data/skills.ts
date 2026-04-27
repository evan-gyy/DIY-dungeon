import type { SkillId, SkillData } from './types';

export const SKILLS: Record<SkillId, SkillData> = {

  // ═══════════════════════════════════════════════════════════
  //  主角专属
  // ═══════════════════════════════════════════════════════════

  yi_li_xin_jing: {
    id: 'yi_li_xin_jing', name: '弈理心经', icon: '♟️', type: 'passive', target: 'self',
    mp: 0, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 0, effect: { type: 'regen_mp_pct', value: 10, duration: 99 },
    healPct: 0,
    desc: '【被动】棋道入心，每回合自动恢复10%最大内力。战斗中可预判敌人下一招，在技能栏右侧显示。',
    cost: { exp: 0 }, sect: '',
    battleTip: '被动·预判敌招+百分比回内',
  },

  // ═══════════════════════════════════════════════════════════
  //  武当派 · 外门弟子（炼气期）
  //  定位：基础攻击 + 内力续航 + 入门轻功
  // ═══════════════════════════════════════════════════════════

  wudang_changquan: {
    id: 'wudang_changquan', name: '武当长拳', icon: '👊', type: 'attack', target: 'enemy',
    mp: 8, hit: 1, powerMul: 1.6, defPen: 0.75,
    cooldown: 0, effect: null, healPct: 0,
    desc: '武当基础拳法，出拳沉稳，造成160%攻击伤害。根基所在，简而不凡。',
    cost: { exp: 0 }, sect: 'wudang',
    battleTip: '基础攻击·低内力消耗',
  },

  yangqi_jue: {
    id: 'yangqi_jue', name: '养气诀', icon: '🧘', type: 'passive', target: 'self',
    mp: 0, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 0, effect: { type: 'regen_mp', value: 4, duration: 99 },
    healPct: 0,
    desc: '【被动】调息养气之法，每回合自动恢复4点内力，并使气血恢复效果+10%。',
    cost: { exp: 0 }, sect: 'wudang',
    battleTip: '被动·稳定内力回复',
  },

  wudang_jianfa_basic: {
    id: 'wudang_jianfa_basic', name: '武当剑法·基础', icon: '⚔️', type: 'attack', target: 'enemy',
    mp: 18, hit: 1, powerMul: 1.2, defPen: 0.65,
    cooldown: 1, effect: null, healPct: 0,
    desc: '武当剑法入门式：刺、挑、抹、带四式。一剑出，知落处。造成120%攻击伤害。',
    cost: { exp: 0 }, sect: 'wudang',
    battleTip: '爆发单击·1回合冷却',
  },

  wudang_qinggong: {
    id: 'wudang_qinggong', name: '梯云纵', icon: '☁️', type: 'support', target: 'self',
    mp: 15, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 2, effect: { type: 'evade', value: 0.45, duration: 1 },
    healPct: 0,
    desc: '武当入门轻功，身如云鹤，提升45%闪避率1回合。',
    cost: { exp: 100 }, sect: 'wudang',
    battleTip: '闪避·规避关键伤害',
  },

  // ═══════════════════════════════════════════════════════════
  //  武当派 · 内门弟子（筑基期）
  //  定位：进阶输出 + 内力引擎 + 护体功法 + 连击剑法
  // ═══════════════════════════════════════════════════════════

  mianzhang: {
    id: 'mianzhang', name: '绵掌', icon: '🌊', type: 'attack', target: 'enemy',
    mp: 16, hit: 2, powerMul: 0.6, defPen: 0.8,
    cooldown: 0, effect: null, healPct: 0,
    desc: '双掌连推，借力打力，命中两次各造成60%攻击伤害，穿透防御较高。',
    cost: { exp: 200 }, sect: 'wudang',
    battleTip: '连击流·高穿透',
  },

  wudang_sword: {
    id: 'wudang_sword', name: '武当剑法', icon: '🗡️', type: 'attack', target: 'enemy',
    mp: 28, hit: 1, powerMul: 1.6, defPen: 0.6,
    cooldown: 1, effect: { type: 'weaken_def', value: 8, duration: 2 },
    healPct: 0,
    desc: '一剑三式凝而为一，造成160%攻击伤害，并降低敌方防御8点持续2回合。',
    cost: { exp: 300 }, sect: 'wudang',
    battleTip: '爆发·减防连招',
  },

  zixiao: {
    id: 'zixiao', name: '紫霄神功', icon: '⚡', type: 'passive', target: 'self',
    mp: 0, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 0, effect: { type: 'regen_mp', value: 8, duration: 99 },
    healPct: 0,
    desc: '【被动】每回合自动恢复8点内力，不占行动。武当内门核心心法。',
    cost: { exp: 400 }, sect: 'wudang',
    battleTip: '被动·内力引擎',
  },

  wudang_huti: {
    id: 'wudang_huti', name: '太极护体', icon: '☯️', type: 'support', target: 'self',
    mp: 22, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 3, effect: { type: 'def_boost', value: 18, duration: 3 },
    healPct: 0,
    desc: '太极圆转，护体罡气。防御提升18点持续3回合。',
    cost: { exp: 350 }, sect: 'wudang',
    battleTip: '防御增益·硬扛期',
  },

  wudang_lianjian: {
    id: 'wudang_lianjian', name: '连环剑', icon: '⚔️', type: 'attack', target: 'enemy',
    mp: 24, hit: 3, powerMul: 0.45, defPen: 0.7,
    cooldown: 1, effect: null, healPct: 0,
    desc: '剑光连环，三连击各造成45%攻击伤害。快剑压制，令敌难以喘息。',
    cost: { exp: 320 }, sect: 'wudang',
    battleTip: '三连击·压制型',
  },

  // ═══════════════════════════════════════════════════════════
  //  武当派 · 真传弟子（结丹期）
  //  定位：控制核心 + 高阶剑法 + 顶级内功 + 阵法辅助
  // ═══════════════════════════════════════════════════════════

  taiji: {
    id: 'taiji', name: '太极拳', icon: '☯️', type: 'control', target: 'enemy',
    mp: 28, hit: 1, powerMul: 0.5, defPen: 0.5,
    cooldown: 2, effect: { type: 'stun', value: 1, duration: 1 },
    healPct: 0,
    desc: '以柔克刚，四两拨千斤。造成50%攻击伤害，70%概率使敌方眩晕跳过下1回合。',
    cost: { exp: 500 }, sect: 'wudang',
    battleTip: '控制核心·高价值',
  },

  taiji_jian: {
    id: 'taiji_jian', name: '太极剑', icon: '⚔️', type: 'attack', target: 'enemy',
    mp: 35, hit: 1, powerMul: 2.0, defPen: 0.55,
    cooldown: 2, effect: { type: 'knockback', value: 1, duration: 1 },
    healPct: 0,
    desc: '太极剑意，圆转不断。造成200%攻击伤害，60%概率击飞敌方跳过1回合。',
    cost: { exp: 600 }, sect: 'wudang',
    battleTip: '高爆发·击飞控制',
  },

  liangyi_sword: {
    id: 'liangyi_sword', name: '两仪剑法', icon: '⚔️', type: 'attack', target: 'enemy',
    mp: 40, hit: 2, powerMul: 1.1, defPen: 0.7,
    cooldown: 2, effect: { type: 'weaken_def', value: 12, duration: 3 },
    healPct: 0,
    desc: '阴阳双剑，一刚一柔。两击各造成110%攻击伤害，并削弱敌方防御12点持续3回合。',
    cost: { exp: 700 }, sect: 'wudang',
    battleTip: '双剑·高破防',
  },

  chunyang_gong: {
    id: 'chunyang_gong', name: '纯阳功', icon: '☀️', type: 'support', target: 'self',
    mp: 30, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 3, effect: { type: 'buff_atk', value: 20, duration: 3 },
    healPct: 0.15,
    desc: '纯阳真气运转全身，攻击力提升20点持续3回合，并恢复15%最大气血。',
    cost: { exp: 550 }, sect: 'wudang',
    battleTip: '攻击增益·中量回血',
  },

  wudang_zhenfa: {
    id: 'wudang_zhenfa', name: '真武七截阵', icon: '⭐', type: 'support', target: 'self',
    mp: 35, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 4, effect: { type: 'def_boost', value: 25, duration: 3 },
    healPct: 0,
    desc: '武当镇山阵法之精髓，防御提升25点持续3回合，同时获得15%闪避。',
    cost: { exp: 650 }, sect: 'wudang',
    battleTip: '防御增益·附带闪避',
  },

  // ═══════════════════════════════════════════════════════════
  //  武当派 · 长老/掌门（元婴期+）
  //  定位：终极技能 · 毁天灭地
  // ═══════════════════════════════════════════════════════════

  taiji_shengong: {
    id: 'taiji_shengong', name: '太极神功', icon: '☯️', type: 'passive', target: 'self',
    mp: 0, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 0, effect: { type: 'regen_mp_pct', value: 15, duration: 99 },
    healPct: 0,
    desc: '【被动】太极圆融，生生不息。每回合恢复15%最大内力，且气血恢复效果+20%。',
    cost: { exp: 1200 }, sect: 'wudang',
    battleTip: '被动·终极内力循环',
  },

  wudang_jianzhen: {
    id: 'wudang_jianzhen', name: '武当剑阵', icon: '✨', type: 'attack', target: 'enemy',
    mp: 55, hit: 4, powerMul: 0.55, defPen: 0.75,
    cooldown: 3, effect: { type: 'weaken_def', value: 15, duration: 3 },
    healPct: 0,
    desc: '剑气化阵，万剑归宗。四连击各造成55%攻击伤害，并大幅削弱敌方防御15点持续3回合。',
    cost: { exp: 1500 }, sect: 'wudang',
    battleTip: '终极连击·破甲',
  },

  chunyang_wuji: {
    id: 'chunyang_wuji', name: '纯阳无极功', icon: '☀️', type: 'support', target: 'self',
    mp: 50, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 4, effect: { type: 'buff_atk', value: 30, duration: 3 },
    healPct: 0.35,
    desc: '纯阳无极，生生不息。攻击力提升30点持续3回合，恢复35%最大气血。',
    cost: { exp: 1800 }, sect: 'wudang',
    battleTip: '终极增益·大量回血',
  },

  sanfeng_yijian: {
    id: 'sanfeng_yijian', name: '三丰一剑', icon: '⚡', type: 'attack', target: 'enemy',
    mp: 65, hit: 1, powerMul: 3.5, defPen: 0.5,
    cooldown: 4, effect: { type: 'stun', value: 1, duration: 1 },
    healPct: 0,
    desc: '张三丰祖师所创终极剑式。倾尽内力的一剑，造成350%攻击伤害，必定眩晕敌方1回合。',
    cost: { exp: 2500 }, sect: 'wudang',
    battleTip: '终极一击·必晕',
  },

  // ═══════════════════════════════════════════════════════════
  //  武当派 · 掌门级（化神期）🟡金色
  //  定位：天人合一 · 道法自然
  // ═══════════════════════════════════════════════════════════

  wudang_tianren: {
    id: 'wudang_tianren', name: '天人合一', icon: '🌌', type: 'passive', target: 'self',
    mp: 0, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 0, effect: { type: 'regen_mp_pct', value: 20, duration: 99 },
    healPct: 0,
    desc: '【被动】天人交感，道法自然。每回合恢复20%最大内力，且所有技能冷却时间-1（最低为1）。',
    cost: { exp: 3000 }, sect: 'wudang',
    battleTip: '被动·终极内力循环+冷却缩减',
  },

  wudang_hunypic: {
    id: 'wudang_hunypic', name: '混元一气', icon: '🌀', type: 'support', target: 'self',
    mp: 55, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 4, effect: { type: 'buff_atk', value: 40, duration: 3 },
    healPct: 0.4,
    desc: '混元一气，贯通天地。攻击力提升40点持续3回合，恢复40%最大气血，并获得20%闪避1回合。',
    cost: { exp: 3500 }, sect: 'wudang',
    battleTip: '终极增益·大量回血+闪避',
  },

  wudang_taiqing: {
    id: 'wudang_taiqing', name: '太清剑气', icon: '🌠', type: 'attack', target: 'enemy',
    mp: 70, hit: 5, powerMul: 0.5, defPen: 0.8,
    cooldown: 3, effect: { type: 'weaken_def', value: 20, duration: 3 },
    healPct: 0,
    desc: '太清剑气纵横天地，五连击各造成50%攻击伤害，削弱敌方防御20点持续3回合。',
    cost: { exp: 4000 }, sect: 'wudang',
    battleTip: '化神连击·大幅破甲',
  },

  wudang_zhenwu_jianyi: {
    id: 'wudang_zhenwu_jianyi', name: '真武剑意', icon: '⚔️', type: 'attack', target: 'enemy',
    mp: 80, hit: 1, powerMul: 4.5, defPen: 0.6,
    cooldown: 5, effect: { type: 'stun', value: 1, duration: 2 },
    healPct: 0,
    desc: '真武大帝剑意降世。倾尽毕生修为的一剑，造成450%攻击伤害，必定眩晕敌方2回合。',
    cost: { exp: 5000 }, sect: 'wudang',
    battleTip: '化神终极·必晕2回合',
  },

  // ═══════════════════════════════════════════════════════════
  //  武当派 · 入圣（渡劫期）🔴红色
  //  定位：超凡入圣 · 天道法则
  // ═══════════════════════════════════════════════════════════

  wudang_dao_jing: {
    id: 'wudang_dao_jing', name: '道经·天地根', icon: '📜', type: 'passive', target: 'self',
    mp: 0, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 0, effect: { type: 'regen_mp_pct', value: 25, duration: 99 },
    healPct: 0,
    desc: '【被动】道经入心，天地为根。每回合恢复25%最大内力，气血恢复效果+30%，免疫眩晕。',
    cost: { exp: 6000 }, sect: 'wudang',
    battleTip: '被动·渡劫内力+免疫眩晕',
  },

  wudang_xuankong: {
    id: 'wudang_xuankong', name: '玄空大法', icon: '🌑', type: 'support', target: 'self',
    mp: 60, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 4, effect: { type: 'def_boost', value: 40, duration: 3 },
    healPct: 0.3,
    desc: '玄空妙法，万法不侵。防御提升40点持续3回合，恢复30%最大气血，并获得50%闪避1回合。',
    cost: { exp: 4500 }, sect: 'wudang',
    battleTip: '终极防御·高闪避',
  },

  wudang_taiyi: {
    id: 'wudang_taiyi', name: '太乙真罡', icon: '☀️', type: 'support', target: 'self',
    mp: 75, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 5, effect: { type: 'buff_atk', value: 50, duration: 3 },
    healPct: 0.5,
    desc: '太乙真罡护体，金光万丈。攻击力提升50点、防御提升25点持续3回合，恢复50%最大气血。',
    cost: { exp: 5500 }, sect: 'wudang',
    battleTip: '渡劫全能·攻防双升+大回血',
  },

  wudang_wuji_dao_jian: {
    id: 'wudang_wuji_dao_jian', name: '无极道剑', icon: '⚡', type: 'attack', target: 'enemy',
    mp: 100, hit: 1, powerMul: 6.0, defPen: 0.7,
    cooldown: 6, effect: { type: 'stun', value: 1, duration: 2 },
    healPct: 0,
    desc: '无极生太极，道剑破万法。倾尽天劫之力的一剑，造成600%攻击伤害，必定眩晕敌方2回合，无视50%防御。',
    cost: { exp: 8000 }, sect: 'wudang',
    battleTip: '渡劫终极·毁天灭地',
  },

  // ═══════════════════════════════════════════════════════════
  //  峨眉派
  // ═══════════════════════════════════════════════════════════

  emei_sword: {
    id: 'emei_sword', name: '峨眉剑法', icon: '🌸', type: 'attack', target: 'enemy',
    mp: 18, hit: 2, powerMul: 0.65, defPen: 0.9,
    cooldown: 0, effect: null, healPct: 0,
    desc: '轻灵双剑各击一次，各造成65%攻击伤害，穿透防御较高。',
    cost: { exp: 120 }, sect: 'emei',
    battleTip: '高穿透连击',
  },
  liing_palm: {
    id: 'liing_palm', name: '灵蛇掌', icon: '🐍', type: 'attack', target: 'enemy',
    mp: 25, hit: 1, powerMul: 0.9, defPen: 0.7,
    cooldown: 2, effect: { type: 'poison', value: 12, duration: 3 },
    healPct: 0,
    desc: '造成90%攻击伤害，并施毒3回合，每回合损失12点HP（不计防御）。',
    cost: { exp: 130 }, sect: 'emei',
    battleTip: '中毒·持续消耗',
  },
  emei_poison: {
    id: 'emei_poison', name: '七步断肠散', icon: '☠️', type: 'control', target: 'enemy',
    mp: 35, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 3, effect: { type: 'strong_poison', value: 20, duration: 4 },
    healPct: 0,
    desc: '不造成直接伤害，施加强毒4回合，每回合损失20HP，并降低攻击力10%。',
    cost: { exp: 200 }, sect: 'emei',
    battleTip: '纯控·高毒叠加',
  },
  hundred_birds: {
    id: 'hundred_birds', name: '百鸟朝凤', icon: '🦅', type: 'support', target: 'self',
    mp: 32, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 3, effect: { type: 'buff_atk', value: 15, duration: 2 },
    healPct: 0,
    desc: '聚气运功，自身攻击力提升15点持续2回合。',
    cost: { exp: 180 }, sect: 'emei',
    battleTip: '攻击增益·爆发前摇',
  },

  // ═══════════════════════════════════════════════════════════
  //  少林派
  // ═══════════════════════════════════════════════════════════

  luohan_fist: {
    id: 'luohan_fist', name: '罗汉拳', icon: '🥊', type: 'attack', target: 'enemy',
    mp: 8, hit: 3, powerMul: 0.38, defPen: 0.6,
    cooldown: 0, effect: null, healPct: 0,
    desc: '连出三拳，每拳造成38%攻击伤害，内力消耗极省。',
    cost: { exp: 60 }, sect: 'shaolin',
    battleTip: '低消耗·三连击',
  },
  vajra_palm: {
    id: 'vajra_palm', name: '金刚掌', icon: '👊', type: 'attack', target: 'enemy',
    mp: 22, hit: 1, powerMul: 1.6, defPen: 0.3,
    cooldown: 1, effect: null, healPct: 0,
    desc: '全力一掌，造成160%攻击伤害，但防御穿透低（对高防敌人效果差）。',
    cost: { exp: 100 }, sect: 'shaolin',
    battleTip: '高爆发·打低防敌人',
  },
  yijin_jing: {
    id: 'yijin_jing', name: '易筋经', icon: '📿', type: 'support', target: 'self',
    mp: 28, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 2, effect: null, healPct: 0.28,
    desc: '内功运转全身经脉，恢复自身28%最大HP。',
    cost: { exp: 180 }, sect: 'shaolin',
    battleTip: '中量回血·维持续航',
  },
  '72_arts': {
    id: '72_arts', name: '金刚护体', icon: '🏯', type: 'support', target: 'self',
    mp: 20, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 3, effect: { type: 'def_boost', value: 20, duration: 3 },
    healPct: 0,
    desc: '运转少林金刚功，防御提升20点持续3回合。',
    cost: { exp: 300 }, sect: 'shaolin',
    battleTip: '防御增益·硬扛期',
  },

  // ═══════════════════════════════════════════════════════════
  //  丐帮
  // ═══════════════════════════════════════════════════════════

  beggar_fist: {
    id: 'beggar_fist', name: '丐帮拳法', icon: '✊', type: 'attack', target: 'enemy',
    mp: 6, hit: 1, powerMul: 0.85, defPen: 0.7,
    cooldown: 0, effect: null, healPct: 0,
    desc: '野路子重拳，造成85%攻击伤害，内力消耗极低，适合持久消耗。',
    cost: { exp: 50 }, sect: 'beggar',
    battleTip: '性价比最高的普攻升级',
  },
  stick_art: {
    id: 'stick_art', name: '打狗棒法', icon: '🦯', type: 'attack', target: 'enemy',
    mp: 22, hit: 1, powerMul: 1.2, defPen: 0.8,
    cooldown: 1, effect: { type: 'knockback', value: 1, duration: 1 },
    healPct: 0,
    desc: '造成120%攻击伤害，60%概率使敌方跳过下1回合行动（击飞）。',
    cost: { exp: 200 }, sect: 'beggar',
    battleTip: '强控概率·高性能',
  },
  mud_walk: {
    id: 'mud_walk', name: '泥鳅步法', icon: '🌀', type: 'support', target: 'self',
    mp: 14, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 2, effect: { type: 'evade', value: 0.5, duration: 1 },
    healPct: 0,
    desc: '身法奇诡，本回合后闪避率提升50%，可规避一次伤害。',
    cost: { exp: 100 }, sect: 'beggar',
    battleTip: '规避关键一击',
  },
  dragon_palm: {
    id: 'dragon_palm', name: '降龙十八掌', icon: '🐉', type: 'attack', target: 'enemy',
    mp: 45, hit: 1, powerMul: 2.2, defPen: 0.5,
    cooldown: 2, effect: null, healPct: 0,
    desc: '亢龙有悔！倾尽内力，造成220%攻击伤害，威力冠绝群雄。',
    cost: { exp: 350 }, sect: 'beggar',
    battleTip: '终极爆发·高冷却',
  },
};

// 保留 ELDERS 导出（向后兼容，虽然 LearnScreen 已移除）
export const ELDERS = [
  {
    id: 'wudang_elder' as const,
    sect: 'wudang' as const,
    name: '武当传功长老',
    img: 'picture/NPC/武当派-传功长老.png',
    intro: '老夫修炼武当内功四十载，愿将毕生所学倾囊相授，只求武当之名传遍江湖。',
    skills: ['taiji', 'mianzhang', 'zixiao', 'wudang_sword'] as SkillId[],
  },
  {
    id: 'emei_elder' as const,
    sect: 'emei' as const,
    name: '峨眉传功长老',
    img: 'picture/NPC/峨眉派-传功长老.png',
    intro: '峨眉剑法与掌法相辅相成，女弟子习之可发挥百分百威力，男子亦有八成之功。',
    skills: ['emei_sword', 'liing_palm', 'emei_poison', 'hundred_birds'] as SkillId[],
  },
  {
    id: 'shaolin_elder' as const,
    sect: 'shaolin' as const,
    name: '少林传功长老',
    img: 'picture/NPC/少林派-传功长老.png',
    intro: '阿弥陀佛，少林七十二绝技非一日之功，习武先修心，心正则功成。',
    skills: ['vajra_palm', 'luohan_fist', '72_arts', 'yijin_jing'] as SkillId[],
  },
  {
    id: 'beggar_elder' as const,
    sect: 'beggar' as const,
    name: '丐帮传功长老',
    img: 'picture/NPC/丐帮-传功长老.png',
    intro: '打狗棒法乃帮主秘传，降龙十八掌更是震古烁今，老夫只传有缘人。',
    skills: ['stick_art', 'dragon_palm', 'beggar_fist', 'mud_walk'] as SkillId[],
  },
] as const;

export type Elder = (typeof ELDERS)[number];