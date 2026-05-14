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

  // ═══════════════════════════════════════════════════════════
  //  少林派 · 外门弟子（炼气期）
  //  定位：刚猛基础拳法 + 内功培元
  // ═══════════════════════════════════════════════════════════

  shaolin_chan_yi: {
    id: 'shaolin_chan_yi', name: '禅意功法', icon: '🕉️', type: 'passive', target: 'self',
    mp: 0, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 0, effect: { type: 'regen_mp', value: 3, duration: 99 },
    healPct: 0,
    desc: '【被动】少林基础内功，每回合自动恢复3点内力，以禅入武之基础。',
    cost: { exp: 0 }, sect: 'shaolin',
    battleTip: '被动·稳定内力回复',
  },
  shaolin_tie_sha: {
    id: 'shaolin_tie_sha', name: '铁砂掌', icon: '🖐️', type: 'attack', target: 'enemy',
    mp: 20, hit: 1, powerMul: 1.2, defPen: 0.7,
    cooldown: 1, effect: { type: 'weaken_def', value: 5, duration: 2 },
    healPct: 0,
    desc: '铁砂淬掌，刚硬无匹。造成120%攻击伤害，削弱敌方防御5点持续2回合。',
    cost: { exp: 0 }, sect: 'shaolin',
    battleTip: '爆发·附带减防',
  },

  // ═══════════════════════════════════════════════════════════
  //  少林派 · 内门弟子（筑基期）
  //  定位：进阶连击 + 龙爪控制 + 护体真气
  // ═══════════════════════════════════════════════════════════

  shaolin_luohan_18: {
    id: 'shaolin_luohan_18', name: '罗汉十八手', icon: '🥊', type: 'attack', target: 'enemy',
    mp: 22, hit: 2, powerMul: 0.65, defPen: 0.65,
    cooldown: 1, effect: null, healPct: 0,
    desc: '罗汉十八手精华，双掌连推，各造成65%攻击伤害。刚中有柔，柔中带刚。',
    cost: { exp: 200 }, sect: 'shaolin',
    battleTip: '连击·内力适中',
  },
  shaolin_long_zhua: {
    id: 'shaolin_long_zhua', name: '龙爪手', icon: '🐉', type: 'control', target: 'enemy',
    mp: 28, hit: 1, powerMul: 0.6, defPen: 0.6,
    cooldown: 2, effect: { type: 'stun', value: 1, duration: 1 },
    healPct: 0,
    desc: '模仿苍龙抓扑之势，造成60%攻击伤害，70%概率眩晕敌方跳过下1回合。',
    cost: { exp: 300 }, sect: 'shaolin',
    battleTip: '控制·中等概率眩晕',
  },
  shaolin_bei_ye: {
    id: 'shaolin_bei_ye', name: '贝叶掌', icon: '🌿', type: 'attack', target: 'enemy',
    mp: 30, hit: 1, powerMul: 1.8, defPen: 0.55,
    cooldown: 2, effect: null, healPct: 0,
    desc: '取贝叶之坚韧，汇掌力于一点，造成180%攻击伤害。',
    cost: { exp: 350 }, sect: 'shaolin',
    battleTip: '中等爆发·2回合冷却',
  },

  // ═══════════════════════════════════════════════════════════
  //  少林派 · 真传弟子（结丹期）
  //  定位：虎鹤双形连击 + 狮子吼控场 + 般若掌爆发
  // ═══════════════════════════════════════════════════════════

  shaolin_hu_he: {
    id: 'shaolin_hu_he', name: '虎鹤双形拳', icon: '🐯', type: 'attack', target: 'enemy',
    mp: 36, hit: 2, powerMul: 0.9, defPen: 0.7,
    cooldown: 2, effect: null, healPct: 0,
    desc: '虎形刚猛、鹤形灵动，二形合一。两击各造成90%攻击伤害，穿透适中。',
    cost: { exp: 500 }, sect: 'shaolin',
    battleTip: '双击·综合性强',
  },
  shaolin_shi_zi_hou: {
    id: 'shaolin_shi_zi_hou', name: '狮子吼', icon: '🦁', type: 'control', target: 'enemy',
    mp: 35, hit: 1, powerMul: 0.8, defPen: 0.5,
    cooldown: 3, effect: { type: 'stun', value: 1, duration: 1 },
    healPct: 0,
    desc: '狮吼功震动丹田，声如天雷。造成80%攻击伤害，必定眩晕敌方1回合。',
    cost: { exp: 550 }, sect: 'shaolin',
    battleTip: '强控·必晕1回合',
  },
  shaolin_prajna_zhang: {
    id: 'shaolin_prajna_zhang', name: '般若掌', icon: '🙏', type: 'attack', target: 'enemy',
    mp: 40, hit: 1, powerMul: 2.4, defPen: 0.8,
    cooldown: 2, effect: null, healPct: 0,
    desc: '般若波罗蜜掌法精华，高穿透一掌造成240%攻击伤害。',
    cost: { exp: 600 }, sect: 'shaolin',
    battleTip: '高爆发·高穿透',
  },
  shaolin_bodhi_xin: {
    id: 'shaolin_bodhi_xin', name: '菩提心经', icon: '📿', type: 'passive', target: 'self',
    mp: 0, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 0, effect: { type: 'regen_mp', value: 8, duration: 99 },
    healPct: 0,
    desc: '【被动】菩提本无树，明镜亦非台。修炼此经，每回合恢复8点内力，心性清明。',
    cost: { exp: 650 }, sect: 'shaolin',
    battleTip: '被动·强化内力引擎',
  },

  // ═══════════════════════════════════════════════════════════
  //  少林派 · 长老（元婴期）
  //  定位：七十二绝技 + 金刚神功 + 龙象双修 + 如来神掌
  // ═══════════════════════════════════════════════════════════

  shaolin_72_true: {
    id: 'shaolin_72_true', name: '七十二绝技', icon: '🔱', type: 'attack', target: 'enemy',
    mp: 55, hit: 1, powerMul: 3.0, defPen: 0.75,
    cooldown: 3, effect: null, healPct: 0,
    desc: '少林七十二绝技精华凝于一击，造成300%攻击伤害，威力冠绝江湖。',
    cost: { exp: 1200 }, sect: 'shaolin',
    battleTip: '终极爆发·高穿透',
  },
  shaolin_jinggang_shen: {
    id: 'shaolin_jinggang_shen', name: '金刚神功', icon: '⚡', type: 'passive', target: 'self',
    mp: 0, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 0, effect: { type: 'regen_mp_pct', value: 15, duration: 99 },
    healPct: 0,
    desc: '【被动】金刚神功大成，每回合恢复15%最大内力，且气血上限提升20%（效果在属性面板显示）。',
    cost: { exp: 1500 }, sect: 'shaolin',
    battleTip: '被动·终极内力循环',
  },
  shaolin_long_xiang: {
    id: 'shaolin_long_xiang', name: '龙象般若功', icon: '🐘', type: 'support', target: 'self',
    mp: 50, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 4, effect: { type: 'buff_atk', value: 30, duration: 3 },
    healPct: 0.35,
    desc: '龙之刚与象之勇，双重力量融合。攻击力提升30点持续3回合，恢复35%最大气血。',
    cost: { exp: 1800 }, sect: 'shaolin',
    battleTip: '终极增益·大量回血',
  },
  shaolin_rulai_zhang: {
    id: 'shaolin_rulai_zhang', name: '如来神掌', icon: '☀️', type: 'attack', target: 'enemy',
    mp: 65, hit: 1, powerMul: 3.5, defPen: 0.6,
    cooldown: 4, effect: { type: 'stun', value: 1, duration: 1 },
    healPct: 0,
    desc: '如来神掌降世，威能无与伦比。造成350%攻击伤害，必定眩晕敌方1回合。',
    cost: { exp: 2500 }, sect: 'shaolin',
    battleTip: '终极一击·必晕',
  },

  // ═══════════════════════════════════════════════════════════
  //  少林派 · 掌门级（化神期）
  //  定位：天人合一 + 无上菩提 + 般若波罗蜜 + 六脉神剑
  // ═══════════════════════════════════════════════════════════

  shaolin_tianren: {
    id: 'shaolin_tianren', name: '天人合一·禅', icon: '🌌', type: 'passive', target: 'self',
    mp: 0, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 0, effect: { type: 'regen_mp_pct', value: 20, duration: 99 },
    healPct: 0,
    desc: '【被动】禅武合一，天人交感。每回合恢复20%最大内力，心无旁骛，万法皆空。',
    cost: { exp: 3000 }, sect: 'shaolin',
    battleTip: '被动·化神内力循环',
  },
  shaolin_wushang_bodhi: {
    id: 'shaolin_wushang_bodhi', name: '无上菩提', icon: '🪷', type: 'support', target: 'self',
    mp: 55, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 4, effect: { type: 'buff_atk', value: 35, duration: 3 },
    healPct: 0.4,
    desc: '无上菩提心，慈悲化杀意。攻击力提升35点持续3回合，恢复40%最大气血，获得15%闪避1回合。',
    cost: { exp: 3500 }, sect: 'shaolin',
    battleTip: '终极增益·大量回血+闪避',
  },
  shaolin_prajna_great: {
    id: 'shaolin_prajna_great', name: '般若波罗蜜', icon: '🔱', type: 'attack', target: 'enemy',
    mp: 70, hit: 1, powerMul: 4.5, defPen: 0.75,
    cooldown: 4, effect: { type: 'weaken_def', value: 20, duration: 3 },
    healPct: 0,
    desc: '般若大法，到彼岸之力。造成450%攻击伤害，削弱敌方防御20点持续3回合。',
    cost: { exp: 4000 }, sect: 'shaolin',
    battleTip: '化神终极攻击·破甲',
  },
  shaolin_six_pulse: {
    id: 'shaolin_six_pulse', name: '六脉神剑', icon: '💫', type: 'attack', target: 'enemy',
    mp: 75, hit: 6, powerMul: 0.55, defPen: 0.8,
    cooldown: 3, effect: { type: 'weaken_def', value: 15, duration: 3 },
    healPct: 0,
    desc: '以气御剑，六脉剑气同出。六连击各造成55%攻击伤害，削弱敌方防御15点持续3回合。',
    cost: { exp: 4500 }, sect: 'shaolin',
    battleTip: '化神六连击·高破甲',
  },

  // ═══════════════════════════════════════════════════════════
  //  少林派 · 入圣（渡劫期）
  //  定位：涅槃重生 + 大威天龙 + 如来神掌·真 + 金刚般若波罗蜜
  // ═══════════════════════════════════════════════════════════

  shaolin_nirvana: {
    id: 'shaolin_nirvana', name: '涅槃心经', icon: '🌟', type: 'passive', target: 'self',
    mp: 0, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 0, effect: { type: 'regen_mp_pct', value: 25, duration: 99 },
    healPct: 0,
    desc: '【被动】涅槃之法，浴火重生。每回合恢复25%最大内力，气血恢复效果+30%，免疫中毒。',
    cost: { exp: 6000 }, sect: 'shaolin',
    battleTip: '被动·渡劫内力+免疫毒',
  },
  shaolin_datura: {
    id: 'shaolin_datura', name: '大威天龙', icon: '☁️', type: 'support', target: 'self',
    mp: 70, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 5, effect: { type: 'def_boost', value: 40, duration: 3 },
    healPct: 0.5,
    desc: '大威天龙法力加身，防御提升40点持续3回合，恢复50%最大气血，获得50%闪避1回合。',
    cost: { exp: 5500 }, sect: 'shaolin',
    battleTip: '渡劫防御·大量回血+高闪避',
  },
  shaolin_tathagata: {
    id: 'shaolin_tathagata', name: '如来神掌·真', icon: '🌞', type: 'attack', target: 'enemy',
    mp: 100, hit: 1, powerMul: 6.0, defPen: 0.7,
    cooldown: 6, effect: { type: 'stun', value: 1, duration: 2 },
    healPct: 0,
    desc: '如来神掌真谛降世。倾尽毕生佛力，造成600%攻击伤害，必定眩晕敌方2回合。',
    cost: { exp: 8000 }, sect: 'shaolin',
    battleTip: '渡劫终极·毁天灭地',
  },
  shaolin_vajra_true: {
    id: 'shaolin_vajra_true', name: '金刚般若波罗蜜', icon: '📜', type: 'passive', target: 'self',
    mp: 0, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 0, effect: { type: 'regen_mp_pct', value: 20, duration: 99 },
    healPct: 0,
    desc: '【被动】金刚般若波罗蜜经入心，每回合恢复20%最大内力，且免疫眩晕。',
    cost: { exp: 7000 }, sect: 'shaolin',
    battleTip: '被动·渡劫内力+免疫眩晕',
  },

  // ═══════════════════════════════════════════════════════════
  //  日月教（P6 Batch 1 · 顶尖大派）
  //  设计定位：日月神功 + 乾坤大挪移 + 阴阳双修
  // ═══════════════════════════════════════════════════════════

  // ── 日月教 · 外门（炼气期）
  riyue_moon_palm: {
    id: 'riyue_moon_palm', name: '月魄掌', icon: '🌙', type: 'attack', target: 'enemy',
    mp: 10, hit: 1, powerMul: 1.4, defPen: 0.7,
    cooldown: 0, effect: null, healPct: 0,
    desc: '以月华凝力，暗劲袭来。造成140%攻击伤害，内力消耗极省。',
    cost: { exp: 0 }, sect: 'riyue',
    battleTip: '基础攻击·低消耗',
  },
  riyue_sun_qi: {
    id: 'riyue_sun_qi', name: '日精内功', icon: '☀️', type: 'passive', target: 'self',
    mp: 0, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 0, effect: { type: 'regen_mp', value: 5, duration: 99 },
    healPct: 0,
    desc: '【被动】汲取日精，每回合自动恢复5点内力，日月神功基础心法。',
    cost: { exp: 0 }, sect: 'riyue',
    battleTip: '被动·稳定内力回复',
  },
  riyue_dark_fist: {
    id: 'riyue_dark_fist', name: '暗劲拳', icon: '👊', type: 'attack', target: 'enemy',
    mp: 14, hit: 2, powerMul: 0.55, defPen: 0.75,
    cooldown: 0, effect: null, healPct: 0,
    desc: '以阴暗内力连击，双拳各造成55%攻击伤害，穿透较高。',
    cost: { exp: 0 }, sect: 'riyue',
    battleTip: '连击·高穿透',
  },
  riyue_shadow_step: {
    id: 'riyue_shadow_step', name: '影步', icon: '👤', type: 'support', target: 'self',
    mp: 15, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 2, effect: { type: 'evade', value: 0.4, duration: 1 },
    healPct: 0,
    desc: '化身月影，提升40%闪避率1回合。',
    cost: { exp: 100 }, sect: 'riyue',
    battleTip: '闪避·规避伤害',
  },

  // ── 日月教 · 内门（筑基期）
  riyue_lunar_palm: {
    id: 'riyue_lunar_palm', name: '月华掌', icon: '🌙', type: 'attack', target: 'enemy',
    mp: 26, hit: 1, powerMul: 1.6, defPen: 0.65,
    cooldown: 1, effect: { type: 'weaken_def', value: 8, duration: 2 },
    healPct: 0,
    desc: '月华掌法，轻灵中藏杀意。造成160%攻击伤害，削弱敌方防御8点持续2回合。',
    cost: { exp: 200 }, sect: 'riyue',
    battleTip: '爆发·减防连招',
  },
  riyue_sun_cultivation: {
    id: 'riyue_sun_cultivation', name: '日轮内功', icon: '🌅', type: 'passive', target: 'self',
    mp: 0, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 0, effect: { type: 'regen_mp', value: 8, duration: 99 },
    healPct: 0,
    desc: '【被动】日轮运行，每回合自动恢复8点内力，日月双修内功核心。',
    cost: { exp: 400 }, sect: 'riyue',
    battleTip: '被动·内力引擎',
  },
  riyue_moon_storm: {
    id: 'riyue_moon_storm', name: '月风乱舞', icon: '🌀', type: 'attack', target: 'enemy',
    mp: 22, hit: 3, powerMul: 0.45, defPen: 0.7,
    cooldown: 1, effect: null, healPct: 0,
    desc: '月影凌乱，三连击各造成45%攻击伤害。如月光散落，令敌难以应对。',
    cost: { exp: 300 }, sect: 'riyue',
    battleTip: '三连击·压制型',
  },
  riyue_poison_fog: {
    id: 'riyue_poison_fog', name: '毒雾暗香', icon: '☠️', type: 'control', target: 'enemy',
    mp: 30, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 3, effect: { type: 'poison', value: 15, duration: 3 },
    healPct: 0,
    desc: '魔教秘制毒雾，不造成直接伤害，施毒3回合，每回合损失15HP。',
    cost: { exp: 350 }, sect: 'riyue',
    battleTip: '中毒·持续消耗',
  },
  riyue_shadow_guard: {
    id: 'riyue_shadow_guard', name: '魅影护体', icon: '🌑', type: 'support', target: 'self',
    mp: 28, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 3, effect: { type: 'def_boost', value: 18, duration: 3 },
    healPct: 0,
    desc: '月影化为护体暗甲，防御提升18点持续3回合。',
    cost: { exp: 320 }, sect: 'riyue',
    battleTip: '防御增益·硬扛期',
  },

  // ── 日月教 · 真传（结丹期）
  riyue_eclipse: {
    id: 'riyue_eclipse', name: '日月蚀', icon: '🌘', type: 'attack', target: 'enemy',
    mp: 38, hit: 1, powerMul: 2.0, defPen: 0.6,
    cooldown: 3, effect: { type: 'stun', value: 1, duration: 1 },
    healPct: 0,
    desc: '日月同辉，交蚀之力。造成200%攻击伤害，60%概率使敌方眩晕1回合。',
    cost: { exp: 500 }, sect: 'riyue',
    battleTip: '爆发+控制',
  },
  riyue_shadow_clone: {
    id: 'riyue_shadow_clone', name: '虚影替身', icon: '👥', type: 'support', target: 'self',
    mp: 35, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 3, effect: { type: 'evade', value: 0.6, duration: 1 },
    healPct: 0,
    desc: '以阴影分身迷惑敌人，闪避率提升60%1回合。',
    cost: { exp: 600 }, sect: 'riyue',
    battleTip: '高闪避·应对爆发',
  },
  riyue_dual_cultivate: {
    id: 'riyue_dual_cultivate', name: '日月双修', icon: '☯️', type: 'support', target: 'self',
    mp: 32, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 3, effect: { type: 'buff_atk', value: 20, duration: 3 },
    healPct: 0.15,
    desc: '日月双修法门，攻击力提升20点持续3回合，同时恢复15%最大气血。',
    cost: { exp: 550 }, sect: 'riyue',
    battleTip: '攻击增益·小量回血',
  },
  riyue_sun_moon_combo: {
    id: 'riyue_sun_moon_combo', name: '日月连环', icon: '⚡', type: 'attack', target: 'enemy',
    mp: 40, hit: 4, powerMul: 0.45, defPen: 0.7,
    cooldown: 2, effect: null, healPct: 0,
    desc: '日月交替连击，四式各造成45%攻击伤害。快如风驰电掣，令敌目不暇接。',
    cost: { exp: 700 }, sect: 'riyue',
    battleTip: '四连击·压制型',
  },

  // ── 日月教 · 长老（元婴期）
  riyue_qiankun_shift: {
    id: 'riyue_qiankun_shift', name: '乾坤大挪移·初', icon: '🔄', type: 'control', target: 'enemy',
    mp: 45, hit: 1, powerMul: 0.8, defPen: 0.5,
    cooldown: 3, effect: { type: 'knockback', value: 1, duration: 1 },
    healPct: 0,
    desc: '乾坤大挪移初境，借力打力。造成80%攻击伤害，必定击飞敌方跳过1回合。',
    cost: { exp: 1200 }, sect: 'riyue',
    battleTip: '强控·必击飞',
  },
  riyue_moon_goddess: {
    id: 'riyue_moon_goddess', name: '圣女经', icon: '🌸', type: 'passive', target: 'self',
    mp: 0, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 0, effect: { type: 'regen_mp_pct', value: 15, duration: 99 },
    healPct: 0,
    desc: '【被动】日月神功之女性专属修炼，每回合恢复15%最大内力，功力事半功倍。',
    cost: { exp: 1500 }, sect: 'riyue',
    battleTip: '被动·终极内力循环',
  },
  riyue_shadow_realm: {
    id: 'riyue_shadow_realm', name: '暗域', icon: '🌑', type: 'support', target: 'self',
    mp: 50, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 4, effect: { type: 'buff_atk', value: 30, duration: 3 },
    healPct: 0,
    desc: '进入暗域修炼状态，攻击力提升30点持续3回合，并获得30%闪避率。',
    cost: { exp: 1800 }, sect: 'riyue',
    battleTip: '终极攻击增益·附带闪避',
  },
  riyue_full_moon: {
    id: 'riyue_full_moon', name: '满月斩', icon: '🌕', type: 'attack', target: 'enemy',
    mp: 60, hit: 1, powerMul: 3.0, defPen: 0.65,
    cooldown: 3, effect: null, healPct: 0,
    desc: '满月之力凝于掌中，一掌造成300%攻击伤害，日月神功极致爆发。',
    cost: { exp: 2500 }, sect: 'riyue',
    battleTip: '终极一击·高爆发',
  },

  // ── 日月教 · 掌门级（化神期）
  riyue_qiankun_true: {
    id: 'riyue_qiankun_true', name: '乾坤大挪移·真', icon: '🔮', type: 'control', target: 'enemy',
    mp: 65, hit: 1, powerMul: 1.5, defPen: 0.7,
    cooldown: 4, effect: { type: 'stun', value: 1, duration: 2 },
    healPct: 0,
    desc: '乾坤大挪移第七境，万法皆可挪移。造成150%攻击伤害，必定眩晕敌方2回合。',
    cost: { exp: 3000 }, sect: 'riyue',
    battleTip: '化神强控·必晕2回合',
  },
  riyue_sacred_sun: {
    id: 'riyue_sacred_sun', name: '神圣日轮', icon: '🌞', type: 'attack', target: 'enemy',
    mp: 70, hit: 5, powerMul: 0.5, defPen: 0.8,
    cooldown: 3, effect: { type: 'weaken_def', value: 20, duration: 3 },
    healPct: 0,
    desc: '日轮神威，五连击各造成50%攻击伤害，削弱敌方防御20点持续3回合。',
    cost: { exp: 4000 }, sect: 'riyue',
    battleTip: '化神连击·大幅破甲',
  },
  riyue_tianren: {
    id: 'riyue_tianren', name: '日月归一', icon: '☀️', type: 'passive', target: 'self',
    mp: 0, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 0, effect: { type: 'regen_mp_pct', value: 20, duration: 99 },
    healPct: 0,
    desc: '【被动】日月归一，阴阳调和。每回合恢复20%最大内力，且所有技能威力提升10%。',
    cost: { exp: 3500 }, sect: 'riyue',
    battleTip: '被动·化神内力循环',
  },
  riyue_sun_moon_divine: {
    id: 'riyue_sun_moon_divine', name: '日月神功·大成', icon: '⭐', type: 'support', target: 'self',
    mp: 60, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 4, effect: { type: 'buff_atk', value: 40, duration: 3 },
    healPct: 0.4,
    desc: '日月神功大成，攻击力提升40点持续3回合，恢复40%最大气血，获得20%闪避1回合。',
    cost: { exp: 4500 }, sect: 'riyue',
    battleTip: '化神终极增益',
  },

  // ── 日月教 · 入圣（渡劫期）
  riyue_nirvana: {
    id: 'riyue_nirvana', name: '魔道涅槃', icon: '🌟', type: 'passive', target: 'self',
    mp: 0, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 0, effect: { type: 'regen_mp_pct', value: 25, duration: 99 },
    healPct: 0,
    desc: '【被动】以魔道证道，涅槃重生。每回合恢复25%最大内力，气血恢复效果+30%，免疫眩晕。',
    cost: { exp: 6000 }, sect: 'riyue',
    battleTip: '被动·渡劫内力+免疫眩晕',
  },
  riyue_void_moon: {
    id: 'riyue_void_moon', name: '虚空月魄', icon: '🌑', type: 'attack', target: 'enemy',
    mp: 85, hit: 1, powerMul: 5.0, defPen: 0.75,
    cooldown: 5, effect: { type: 'stun', value: 1, duration: 1 },
    healPct: 0,
    desc: '虚空月魄，阴极之力化为一击。造成500%攻击伤害，必定眩晕敌方1回合。',
    cost: { exp: 5500 }, sect: 'riyue',
    battleTip: '渡劫单击·必晕',
  },
  riyue_dark_sun: {
    id: 'riyue_dark_sun', name: '暗日灭法', icon: '💥', type: 'support', target: 'self',
    mp: 75, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 5, effect: { type: 'buff_atk', value: 50, duration: 3 },
    healPct: 0.5,
    desc: '暗日之力护体，攻击力提升50点持续3回合，恢复50%最大气血，获得50%闪避1回合。',
    cost: { exp: 5000 }, sect: 'riyue',
    battleTip: '渡劫全能·攻防双升+大回血',
  },
  riyue_ultimate: {
    id: 'riyue_ultimate', name: '日月乾坤剑', icon: '⚔️', type: 'attack', target: 'enemy',
    mp: 100, hit: 1, powerMul: 6.0, defPen: 0.8,
    cooldown: 6, effect: { type: 'stun', value: 1, duration: 2 },
    healPct: 0,
    desc: '乾坤大挪移至境，日月两仪化为剑意。造成600%攻击伤害，必定眩晕敌方2回合，无视50%防御。',
    cost: { exp: 8000 }, sect: 'riyue',
    battleTip: '渡劫终极·毁天灭地',
  },

  // ═══════════════════════════════════════════
  //  第三章 · 武当真传剑法（筑基期）
  // ═══════════════════════════════════════════

  wudang_yunkai: {
    id: 'wudang_yunkai', name: '武当剑法·云开', icon: '☁️', type: 'attack', target: 'enemy',
    mp: 18, hit: 1, powerMul: 1.5, defPen: 0.4,
    cooldown: 1, effect: null, healPct: 0,
    desc: '剑出如晨曦破雾，专破护体真气。造成150%攻击伤害，高穿透。',
    cost: { exp: 300 }, sect: 'wudang',
    battleTip: '破防技·无视部分防御',
  },

  wudang_songtao: {
    id: 'wudang_songtao', name: '武当剑法·松涛', icon: '🌲', type: 'attack', target: 'enemy',
    mp: 25, hit: 3, powerMul: 0.6, defPen: 0.3,
    cooldown: 2, effect: null, healPct: 0,
    desc: '剑势连绵如松涛起伏，攻中带守，守中藏攻。三连击，每击60%伤害。',
    cost: { exp: 500 }, sect: 'wudang',
    battleTip: '三连击·持续输出',
  },

  wudang_guiyuan: {
    id: 'wudang_guiyuan', name: '武当剑法·归元', icon: '✨', type: 'attack', target: 'enemy',
    mp: 40, hit: 1, powerMul: 2.5, defPen: 0.5,
    cooldown: 3, effect: null, healPct: 0,
    desc: '万剑归宗，将所有剑意凝于一剑。造成250%攻击伤害，必定暴击。',
    cost: { exp: 800 }, sect: 'wudang',
    battleTip: '蓄力一击·必暴击·高冷却',
  },

  // ═══════════════════════════════════════════════════════════
  //  峨眉派扩展（P6 Batch 2 · 一流门派）
  //  保留: emei_sword, liing_palm, emei_poison, hundred_birds
  // ═══════════════════════════════════════════════════════════

  // ── 峨眉 · 炼气期 ──
  emei_chan_yi: {
    id: 'emei_chan_yi', name: '禅意心经', icon: '🕉️', type: 'passive', target: 'self',
    mp: 0, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 0, effect: { type: 'regen_mp', value: 3, duration: 99 },
    healPct: 0,
    desc: '【被动】峨眉佛门心法，每回合自动恢复3点内力，以禅入武。',
    cost: { exp: 0 }, sect: 'emei',
    battleTip: '被动·稳定内力回复',
  },
  emei_flower_needle: {
    id: 'emei_flower_needle', name: '飞花针', icon: '🌸', type: 'attack', target: 'enemy',
    mp: 12, hit: 2, powerMul: 0.6, defPen: 0.8,
    cooldown: 0, effect: null, healPct: 0,
    desc: '针如飞花，轻盈连刺，两击各造成60%攻击伤害，穿透极高。',
    cost: { exp: 0 }, sect: 'emei',
    battleTip: '二段连击·高穿透',
  },
  emei_cloud_step: {
    id: 'emei_cloud_step', name: '云步', icon: '☁️', type: 'support', target: 'self',
    mp: 14, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 2, effect: { type: 'evade', value: 0.4, duration: 1 },
    healPct: 0,
    desc: '峨眉轻功身法，如踏云端，提升40%闪避率1回合。',
    cost: { exp: 100 }, sect: 'emei',
    battleTip: '闪避·规避伤害',
  },

  // ── 峨眉 · 筑基期 ──
  emei_sword_breeze: {
    id: 'emei_sword_breeze', name: '清风剑', icon: '🍃', type: 'attack', target: 'enemy',
    mp: 24, hit: 1, powerMul: 1.4, defPen: 0.7,
    cooldown: 1, effect: { type: 'weaken_def', value: 8, duration: 2 },
    healPct: 0,
    desc: '剑如清风拂面，柔中带锋。造成140%攻击伤害，削弱敌方防御8点持续2回合。',
    cost: { exp: 200 }, sect: 'emei',
    battleTip: '爆发·减防连招',
  },
  emei_jade_guard: {
    id: 'emei_jade_guard', name: '玉女守门', icon: '🛡️', type: 'passive', target: 'self',
    mp: 0, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 0, effect: { type: 'def_boost', value: 10, duration: 99 },
    healPct: 0,
    desc: '【被动】玉女守门心法，战斗中常驻防御提升10点，稳如磐石。',
    cost: { exp: 300 }, sect: 'emei',
    battleTip: '被动·常驻加防',
  },
  emei_iron_finger: {
    id: 'emei_iron_finger', name: '铁指诀', icon: '☝️', type: 'attack', target: 'enemy',
    mp: 20, hit: 1, powerMul: 1.2, defPen: 0.9,
    cooldown: 1, effect: null, healPct: 0,
    desc: '以指为剑，刚猛穿甲。造成120%攻击伤害，几乎无视防御。',
    cost: { exp: 250 }, sect: 'emei',
    battleTip: '高穿甲·克高防',
  },

  // ── 峨眉 · 结丹期 ──
  emei_lotus_palm: {
    id: 'emei_lotus_palm', name: '金莲掌', icon: '🪷', type: 'attack', target: 'enemy',
    mp: 36, hit: 1, powerMul: 2.0, defPen: 0.65,
    cooldown: 2, effect: null, healPct: 0,
    desc: '佛门掌法精华，金莲绽放间一掌制敌。造成200%攻击伤害。',
    cost: { exp: 500 }, sect: 'emei',
    battleTip: '中等爆发·2回合冷却',
  },
  emei_swallow_sword: {
    id: 'emei_swallow_sword', name: '燕归剑', icon: '🕊️', type: 'attack', target: 'enemy',
    mp: 32, hit: 2, powerMul: 0.75, defPen: 0.7,
    cooldown: 2, effect: null, healPct: 0.1,
    desc: '剑如归燕，双剑连斩各造成75%攻击伤害，并恢复10%最大气血。',
    cost: { exp: 450 }, sect: 'emei',
    battleTip: '二段连击·附带回血',
  },
  emei_bell_sound: {
    id: 'emei_bell_sound', name: '梵钟', icon: '🔔', type: 'control', target: 'enemy',
    mp: 35, hit: 1, powerMul: 0.6, defPen: 0.5,
    cooldown: 3, effect: { type: 'stun', value: 1, duration: 1 },
    healPct: 0,
    desc: '以梵钟之音震慑心神，造成60%攻击伤害，必定眩晕敌方1回合。',
    cost: { exp: 550 }, sect: 'emei',
    battleTip: '强控·必晕1回合',
  },

  // ── 峨眉 · 元婴期 ──
  emei_nirvana: {
    id: 'emei_nirvana', name: '涅槃心经', icon: '🌟', type: 'passive', target: 'self',
    mp: 0, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 0, effect: { type: 'regen_mp_pct', value: 15, duration: 99 },
    healPct: 0,
    desc: '【被动】涅槃之法，浴火重生。每回合恢复15%最大内力，气血恢复效果+20%。',
    cost: { exp: 1500 }, sect: 'emei',
    battleTip: '被动·终极内力循环',
  },
  emei_sword_phoenix: {
    id: 'emei_sword_phoenix', name: '凤凰剑', icon: '🦅', type: 'attack', target: 'enemy',
    mp: 55, hit: 1, powerMul: 3.0, defPen: 0.7,
    cooldown: 3, effect: null, healPct: 0,
    desc: '凤舞九天，剑化凤凰。造成300%攻击伤害，威力冠绝峨眉。',
    cost: { exp: 2000 }, sect: 'emei',
    battleTip: '终极爆发·高穿透',
  },
  emei_plum_heal: {
    id: 'emei_plum_heal', name: '寒梅吐蕊', icon: '🌸', type: 'support', target: 'self',
    mp: 45, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 4, effect: { type: 'self_heal', value: 0, duration: 0 },
    healPct: 0.4,
    desc: '寒梅吐蕊，暗香浮动。恢复自身40%最大气血，并清除所有中毒状态。',
    cost: { exp: 1800 }, sect: 'emei',
    battleTip: '大回血·解毒',
  },

  // ═══════════════════════════════════════════════════════════
  //  丐帮扩展（P6 Batch 2 · 一流门派）
  //  保留: beggar_fist, stick_art, mud_walk, dragon_palm
  // ═══════════════════════════════════════════════════════════

  // ── 丐帮 · 炼气期 ──
  beggar_wine: {
    id: 'beggar_wine', name: '醉饮功', icon: '🍶', type: 'passive', target: 'self',
    mp: 0, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 0, effect: { type: 'regen_mp', value: 3, duration: 99 },
    healPct: 0,
    desc: '【被动】丐帮酒豪内功，以酒入武，每回合自动恢复3点内力。',
    cost: { exp: 0 }, sect: 'beggar',
    battleTip: '被动·稳定内力回复',
  },
  beggar_slap: {
    id: 'beggar_slap', name: '叫花掌', icon: '🖐️', type: 'attack', target: 'enemy',
    mp: 10, hit: 2, powerMul: 0.6, defPen: 0.7,
    cooldown: 0, effect: null, healPct: 0,
    desc: '丐帮入门掌法，双掌连拍各造成60%攻击伤害，野路子但管用。',
    cost: { exp: 0 }, sect: 'beggar',
    battleTip: '二段连击·低消耗',
  },
  beggar_roll: {
    id: 'beggar_roll', name: '懒驴打滚', icon: '🌀', type: 'support', target: 'self',
    mp: 12, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 2, effect: { type: 'evade', value: 0.4, duration: 1 },
    healPct: 0,
    desc: '看似狼狈，实则高妙。提升40%闪避率1回合。',
    cost: { exp: 80 }, sect: 'beggar',
    battleTip: '闪避·规避伤害',
  },

  // ── 丐帮 · 筑基期 ──
  beggar_kick: {
    id: 'beggar_kick', name: '旋风腿', icon: '🦵', type: 'attack', target: 'enemy',
    mp: 20, hit: 1, powerMul: 1.4, defPen: 0.7,
    cooldown: 1, effect: { type: 'weaken_def', value: 8, duration: 2 },
    healPct: 0,
    desc: '一腿扫出，如旋风骤起。造成140%攻击伤害，削弱敌方防御8点持续2回合。',
    cost: { exp: 200 }, sect: 'beggar',
    battleTip: '爆发·减防连招',
  },
  beggar_iron_shirt: {
    id: 'beggar_iron_shirt', name: '铁布衫', icon: '🛡️', type: 'passive', target: 'self',
    mp: 0, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 0, effect: { type: 'def_boost', value: 10, duration: 99 },
    healPct: 0,
    desc: '【被动】丐帮外门护体功法，战斗中常驻防御提升10点。',
    cost: { exp: 300 }, sect: 'beggar',
    battleTip: '被动·常驻加防',
  },
  beggar_storm_fist: {
    id: 'beggar_storm_fist', name: '狂风拳', icon: '👊', type: 'attack', target: 'enemy',
    mp: 22, hit: 3, powerMul: 0.45, defPen: 0.7,
    cooldown: 1, effect: null, healPct: 0,
    desc: '拳如狂风骤雨，三连击各造成45%攻击伤害。快拳压制，令敌难以喘息。',
    cost: { exp: 280 }, sect: 'beggar',
    battleTip: '三连击·压制型',
  },

  // ── 丐帮 · 结丹期 ──
  beggar_18_subdue: {
    id: 'beggar_18_subdue', name: '降龙十八掌', icon: '🐉', type: 'attack', target: 'enemy',
    mp: 40, hit: 1, powerMul: 2.2, defPen: 0.6,
    cooldown: 2, effect: { type: 'stun', value: 1, duration: 1 },
    healPct: 0,
    desc: '亢龙有悔！降龙十八掌精华，造成220%攻击伤害，60%概率眩晕敌方1回合。',
    cost: { exp: 600 }, sect: 'beggar',
    battleTip: '中爆发·概率眩晕',
  },
  beggar_dog_storm: {
    id: 'beggar_dog_storm', name: '棒打双犬', icon: '🦯', type: 'attack', target: 'enemy',
    mp: 30, hit: 2, powerMul: 0.75, defPen: 0.75,
    cooldown: 1, effect: null, healPct: 0,
    desc: '打狗棒法秘传，棒影分袭，二段各造成75%攻击伤害，穿透较高。',
    cost: { exp: 500 }, sect: 'beggar',
    battleTip: '二段连击·高穿透',
  },
  beggar_roar: {
    id: 'beggar_roar', name: '醉吼功', icon: '📢', type: 'control', target: 'enemy',
    mp: 32, hit: 1, powerMul: 0.5, defPen: 0.5,
    cooldown: 3, effect: { type: 'weaken_def', value: 15, duration: 3 },
    healPct: 0,
    desc: '酒气化为咆哮，震慑敌胆。造成50%攻击伤害，大幅削弱敌方防御15点持续3回合。',
    cost: { exp: 550 }, sect: 'beggar',
    battleTip: '控制·大幅破甲',
  },

  // ── 丐帮 · 元婴期 ──
  beggar_overlord: {
    id: 'beggar_overlord', name: '霸王卸甲', icon: '💪', type: 'attack', target: 'enemy',
    mp: 55, hit: 1, powerMul: 3.0, defPen: 0.7,
    cooldown: 3, effect: null, healPct: 0,
    desc: '霸王之气，卸甲碎甲。造成300%攻击伤害，穿透极高。',
    cost: { exp: 2000 }, sect: 'beggar',
    battleTip: '终极爆发·高穿透',
  },
  beggar_dragon_roar: {
    id: 'beggar_dragon_roar', name: '龙吟', icon: '🐲', type: 'passive', target: 'self',
    mp: 0, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 0, effect: { type: 'regen_mp_pct', value: 15, duration: 99 },
    healPct: 0,
    desc: '【被动】龙吟九霄，内力不竭。每回合恢复15%最大内力，气血恢复效果+20%。',
    cost: { exp: 1500 }, sect: 'beggar',
    battleTip: '被动·终极内力循环',
  },
  beggar_chief_fist: {
    id: 'beggar_chief_fist', name: '帮主神拳', icon: '👑', type: 'attack', target: 'enemy',
    mp: 50, hit: 3, powerMul: 0.6, defPen: 0.8,
    cooldown: 2, effect: { type: 'weaken_def', value: 12, duration: 3 },
    healPct: 0,
    desc: '帮主独传神拳，三连击各造成60%攻击伤害，削弱敌方防御12点持续3回合。',
    cost: { exp: 1800 }, sect: 'beggar',
    battleTip: '多段+高破甲',
  },

  // ═══════════════════════════════════════════════════════════
  //  全真教（P6 Batch 2 · 一流门派 · 道门剑法+北斗阵法+内丹）
  // ═══════════════════════════════════════════════════════════

  // ── 全真 · 炼气期 ──
  quanzhen_sword: {
    id: 'quanzhen_sword', name: '全真剑法', icon: '⚔️', type: 'attack', target: 'enemy',
    mp: 8, hit: 1, powerMul: 1.6, defPen: 0.75,
    cooldown: 0, effect: null, healPct: 0,
    desc: '全真教入门剑法，剑出中正平和，造成160%攻击伤害。',
    cost: { exp: 0 }, sect: 'quanzhen',
    battleTip: '基础攻击·低消耗',
  },
  quanzhen_qi: {
    id: 'quanzhen_qi', name: '全真心法', icon: '🧘', type: 'passive', target: 'self',
    mp: 0, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 0, effect: { type: 'regen_mp', value: 3, duration: 99 },
    healPct: 0,
    desc: '【被动】全真教基础内功心法，每回合自动恢复3点内力。',
    cost: { exp: 0 }, sect: 'quanzhen',
    battleTip: '被动·稳定内力回复',
  },
  quanzhen_fist: {
    id: 'quanzhen_fist', name: '通玄拳', icon: '🥊', type: 'attack', target: 'enemy',
    mp: 12, hit: 2, powerMul: 0.6, defPen: 0.8,
    cooldown: 0, effect: null, healPct: 0,
    desc: '全真通玄拳法，双拳连击各造成60%攻击伤害，穿透极高。',
    cost: { exp: 0 }, sect: 'quanzhen',
    battleTip: '二段连击·高穿透',
  },
  quanzhen_step: {
    id: 'quanzhen_step', name: '七星步', icon: '⭐', type: 'support', target: 'self',
    mp: 14, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 2, effect: { type: 'evade', value: 0.4, duration: 1 },
    healPct: 0,
    desc: '全真教七星步法，踏北斗而行，提升40%闪避率1回合。',
    cost: { exp: 100 }, sect: 'quanzhen',
    battleTip: '闪避·规避伤害',
  },

  // ── 全真 · 筑基期 ──
  quanzhen_sword_qian: {
    id: 'quanzhen_sword_qian', name: '乾元剑', icon: '☀️', type: 'attack', target: 'enemy',
    mp: 24, hit: 1, powerMul: 1.4, defPen: 0.7,
    cooldown: 1, effect: { type: 'weaken_def', value: 8, duration: 2 },
    healPct: 0,
    desc: '乾元之剑，刚健有力。造成140%攻击伤害，削弱敌方防御8点持续2回合。',
    cost: { exp: 200 }, sect: 'quanzhen',
    battleTip: '爆发·减防连招',
  },
  quanzhen_neidan: {
    id: 'quanzhen_neidan', name: '金丹诀', icon: '💊', type: 'passive', target: 'self',
    mp: 0, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 0, effect: { type: 'regen_mp', value: 7, duration: 99 },
    healPct: 0,
    desc: '【被动】全真内丹术入门，每回合自动恢复7点内力。',
    cost: { exp: 350 }, sect: 'quanzhen',
    battleTip: '被动·内力引擎',
  },
  quanzhen_beidou: {
    id: 'quanzhen_beidou', name: '北斗剑阵', icon: '🔷', type: 'attack', target: 'enemy',
    mp: 26, hit: 3, powerMul: 0.5, defPen: 0.7,
    cooldown: 1, effect: null, healPct: 0,
    desc: '以北斗七星之阵运剑，三连击各造成50%攻击伤害，剑势连绵不绝。',
    cost: { exp: 300 }, sect: 'quanzhen',
    battleTip: '三连击·压制型',
  },
  quanzhen_fu: {
    id: 'quanzhen_fu', name: '镇邪符', icon: '📜', type: 'control', target: 'enemy',
    mp: 28, hit: 1, powerMul: 0.6, defPen: 0.5,
    cooldown: 3, effect: { type: 'stun', value: 1, duration: 1 },
    healPct: 0,
    desc: '符箓镇邪，法光灼心。造成60%攻击伤害，必定眩晕敌方1回合。',
    cost: { exp: 350 }, sect: 'quanzhen',
    battleTip: '强控·必晕1回合',
  },

  // ── 全真 · 结丹期 ──
  quanzhen_sword_kun: {
    id: 'quanzhen_sword_kun', name: '坤元剑', icon: '🌙', type: 'attack', target: 'enemy',
    mp: 36, hit: 1, powerMul: 2.0, defPen: 0.65,
    cooldown: 2, effect: null, healPct: 0,
    desc: '坤元之剑，柔韧绵长。造成200%攻击伤害，全真剑法中乘。',
    cost: { exp: 500 }, sect: 'quanzhen',
    battleTip: '中等爆发·2回合冷却',
  },
  quanzhen_thunder: {
    id: 'quanzhen_thunder', name: '五雷正法', icon: '⚡', type: 'attack', target: 'enemy',
    mp: 40, hit: 1, powerMul: 1.8, defPen: 0.85,
    cooldown: 2, effect: null, healPct: 0,
    desc: '道门五雷正法，雷击破甲。造成180%攻击伤害，几乎无视防御。',
    cost: { exp: 600 }, sect: 'quanzhen',
    battleTip: '高爆发·极高穿透',
  },
  quanzhen_7star_array: {
    id: 'quanzhen_7star_array', name: '天罡北斗阵', icon: '🌟', type: 'support', target: 'self',
    mp: 38, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 3, effect: { type: 'buff_atk', value: 25, duration: 3 },
    healPct: 0.15,
    desc: '天罡北斗阵法加身，攻击力提升25点持续3回合，恢复15%最大气血。',
    cost: { exp: 700 }, sect: 'quanzhen',
    battleTip: '攻击增益·小量回血',
  },
  quanzhen_sword_divide: {
    id: 'quanzhen_sword_divide', name: '一气化三清', icon: '✨', type: 'attack', target: 'enemy',
    mp: 38, hit: 3, powerMul: 0.55, defPen: 0.8,
    cooldown: 2, effect: null, healPct: 0,
    desc: '一剑化三清，三清归一剑。三连击各造成55%攻击伤害，穿透极高。',
    cost: { exp: 650 }, sect: 'quanzhen',
    battleTip: '三连击·高贯穿',
  },

  // ── 全真 · 元婴期 ──
  quanzhen_dao_jing: {
    id: 'quanzhen_dao_jing', name: '道德真经', icon: '📿', type: 'passive', target: 'self',
    mp: 0, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 0, effect: { type: 'regen_mp_pct', value: 15, duration: 99 },
    healPct: 0,
    desc: '【被动】道德真经入心，道法自然。每回合恢复15%最大内力，常驻防御+10。',
    cost: { exp: 1500 }, sect: 'quanzhen',
    battleTip: '被动·终极内力循环+加防',
  },
  quanzhen_sword_lord: {
    id: 'quanzhen_sword_lord', name: '纯阳剑', icon: '☀️', type: 'attack', target: 'enemy',
    mp: 55, hit: 1, powerMul: 3.0, defPen: 0.7,
    cooldown: 3, effect: null, healPct: 0,
    desc: '纯阳之气凝于剑尖，一剑造成300%攻击伤害。全真剑道巅峰。',
    cost: { exp: 2000 }, sect: 'quanzhen',
    battleTip: '终极爆发·高穿透',
  },
  quanzhen_shendan: {
    id: 'quanzhen_shendan', name: '九转金丹', icon: '💊', type: 'support', target: 'self',
    mp: 50, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 4, effect: { type: 'buff_atk', value: 15, duration: 3 },
    healPct: 0.4,
    desc: '九转金丹大成，恢复40%最大气血，攻击力提升15点持续3回合。',
    cost: { exp: 1800 }, sect: 'quanzhen',
    battleTip: '大回血·小加攻',
  },
  quanzhen_sword_star: {
    id: 'quanzhen_sword_star', name: '周天星斗剑', icon: '🌌', type: 'attack', target: 'enemy',
    mp: 50, hit: 4, powerMul: 0.5, defPen: 0.8,
    cooldown: 3, effect: { type: 'weaken_def', value: 15, duration: 3 },
    healPct: 0,
    desc: '周天星斗化为剑意，四连击各造成50%攻击伤害，削弱敌方防御15点持续3回合。',
    cost: { exp: 1800 }, sect: 'quanzhen',
    battleTip: '四连击·大幅破甲',
  },

  // ═══════════════════════════════════════════════════════════
  //  昆仑派（P6 Batch 2 · 一流门派 · 冰寒剑法+雪山内功+九霄身法）
  // ═══════════════════════════════════════════════════════════

  // ── 昆仑 · 炼气期 ──
  kunlun_sword: {
    id: 'kunlun_sword', name: '昆仑剑法', icon: '⚔️', type: 'attack', target: 'enemy',
    mp: 8, hit: 1, powerMul: 1.6, defPen: 0.75,
    cooldown: 0, effect: null, healPct: 0,
    desc: '昆仑派入门剑法，剑出如雪山之风，造成160%攻击伤害。',
    cost: { exp: 0 }, sect: 'kunlun',
    battleTip: '基础攻击·低消耗',
  },
  kunlun_ice_qi: {
    id: 'kunlun_ice_qi', name: '寒冰真气', icon: '❄️', type: 'passive', target: 'self',
    mp: 0, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 0, effect: { type: 'regen_mp', value: 3, duration: 99 },
    healPct: 0,
    desc: '【被动】昆仑寒冰真气，冰寒入体，每回合自动恢复3点内力。',
    cost: { exp: 0 }, sect: 'kunlun',
    battleTip: '被动·稳定内力回复',
  },
  kunlun_frost_palm: {
    id: 'kunlun_frost_palm', name: '冰魄掌', icon: '🧊', type: 'attack', target: 'enemy',
    mp: 14, hit: 2, powerMul: 0.6, defPen: 0.8,
    cooldown: 0, effect: null, healPct: 0,
    desc: '冰魄寒气凝于掌中，双掌连拍各造成60%攻击伤害，穿透极高。',
    cost: { exp: 0 }, sect: 'kunlun',
    battleTip: '二段连击·高穿透',
  },
  kunlun_snow_step: {
    id: 'kunlun_snow_step', name: '雪影步', icon: '🌨️', type: 'support', target: 'self',
    mp: 14, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 2, effect: { type: 'evade', value: 0.4, duration: 1 },
    healPct: 0,
    desc: '踏雪无痕，身如雪影。提升40%闪避率1回合。',
    cost: { exp: 100 }, sect: 'kunlun',
    battleTip: '闪避·规避伤害',
  },

  // ── 昆仑 · 筑基期 ──
  kunlun_sword_cold: {
    id: 'kunlun_sword_cold', name: '霜寒剑', icon: '❄️', type: 'attack', target: 'enemy',
    mp: 24, hit: 1, powerMul: 1.4, defPen: 0.7,
    cooldown: 1, effect: { type: 'weaken_def', value: 8, duration: 2 },
    healPct: 0,
    desc: '剑带霜寒之气，冻结敌方护甲。造成140%攻击伤害，削弱敌方防御8点持续2回合。',
    cost: { exp: 200 }, sect: 'kunlun',
    battleTip: '爆发·减防连招',
  },
  kunlun_ice_guard: {
    id: 'kunlun_ice_guard', name: '玄冰护体', icon: '🛡️', type: 'passive', target: 'self',
    mp: 0, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 0, effect: { type: 'def_boost', value: 10, duration: 99 },
    healPct: 0,
    desc: '【被动】玄冰化为护体真气，战斗中常驻防御提升10点。',
    cost: { exp: 300 }, sect: 'kunlun',
    battleTip: '被动·常驻加防',
  },
  kunlun_blizzard: {
    id: 'kunlun_blizzard', name: '风雪剑法', icon: '🌨️', type: 'attack', target: 'enemy',
    mp: 26, hit: 3, powerMul: 0.5, defPen: 0.7,
    cooldown: 1, effect: null, healPct: 0,
    desc: '剑如暴风雪，铺天盖地。三连击各造成50%攻击伤害，剑势凶猛。',
    cost: { exp: 300 }, sect: 'kunlun',
    battleTip: '三连击·压制型',
  },
  kunlun_freeze: {
    id: 'kunlun_freeze', name: '凝冰诀', icon: '🧊', type: 'control', target: 'enemy',
    mp: 28, hit: 1, powerMul: 0.6, defPen: 0.5,
    cooldown: 3, effect: { type: 'stun', value: 1, duration: 1 },
    healPct: 0,
    desc: '寒冰真气化为凝冰之力，冻结敌方经脉。造成60%攻击伤害，必定眩晕1回合。',
    cost: { exp: 350 }, sect: 'kunlun',
    battleTip: '强控·必晕1回合',
  },

  // ── 昆仑 · 结丹期 ──
  kunlun_sword_jiuxiao: {
    id: 'kunlun_sword_jiuxiao', name: '九霄剑', icon: '🌌', type: 'attack', target: 'enemy',
    mp: 36, hit: 1, powerMul: 2.0, defPen: 0.65,
    cooldown: 2, effect: null, healPct: 0,
    desc: '九霄云外，一剑穿云。造成200%攻击伤害，昆仑剑法中乘。',
    cost: { exp: 500 }, sect: 'kunlun',
    battleTip: '中等爆发·2回合冷却',
  },
  kunlun_glacier: {
    id: 'kunlun_glacier', name: '冰川掌', icon: '🏔️', type: 'attack', target: 'enemy',
    mp: 38, hit: 1, powerMul: 1.8, defPen: 0.85,
    cooldown: 2, effect: null, healPct: 0,
    desc: '千年冰川之力凝于一掌，造成180%攻击伤害，几乎无视防御。',
    cost: { exp: 550 }, sect: 'kunlun',
    battleTip: '高爆发·极高穿透',
  },
  kunlun_snow_veil: {
    id: 'kunlun_snow_veil', name: '雪幕', icon: '🌫️', type: 'support', target: 'self',
    mp: 34, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 3, effect: { type: 'evade', value: 0.5, duration: 1 },
    healPct: 0.15,
    desc: '雪幕笼罩全身，提升50%闪避率1回合，并恢复15%最大气血。',
    cost: { exp: 600 }, sect: 'kunlun',
    battleTip: '高闪避·小回血',
  },
  kunlun_sword_storm: {
    id: 'kunlun_sword_storm', name: '冰风暴剑', icon: '🌪️', type: 'attack', target: 'enemy',
    mp: 40, hit: 3, powerMul: 0.55, defPen: 0.8,
    cooldown: 2, effect: null, healPct: 0,
    desc: '剑化冰风暴，三连击各造成55%攻击伤害，穿透极高。',
    cost: { exp: 650 }, sect: 'kunlun',
    battleTip: '三连击·高贯穿',
  },

  // ── 昆仑 · 元婴期 ──
  kunlun_hanbing: {
    id: 'kunlun_hanbing', name: '万载寒冰诀', icon: '🧊', type: 'passive', target: 'self',
    mp: 0, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 0, effect: { type: 'regen_mp_pct', value: 15, duration: 99 },
    healPct: 0,
    desc: '【被动】万载寒冰化为内力之源，每回合恢复15%最大内力，常驻攻击+10。',
    cost: { exp: 1500 }, sect: 'kunlun',
    battleTip: '被动·终极内力循环+加攻',
  },
  kunlun_sword_peak: {
    id: 'kunlun_sword_peak', name: '昆仑绝顶剑', icon: '🏔️', type: 'attack', target: 'enemy',
    mp: 55, hit: 1, powerMul: 3.0, defPen: 0.7,
    cooldown: 3, effect: null, healPct: 0,
    desc: '昆仑之巅，绝顶一剑。造成300%攻击伤害，万剑俯首。',
    cost: { exp: 2000 }, sect: 'kunlun',
    battleTip: '终极爆发·高穿透',
  },
  kunlun_jade_purity: {
    id: 'kunlun_jade_purity', name: '玉清心法', icon: '💎', type: 'support', target: 'self',
    mp: 48, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 4, effect: { type: 'def_boost', value: 15, duration: 3 },
    healPct: 0.35,
    desc: '玉清妙法，冰清玉洁。恢复35%最大气血，防御提升15点持续3回合。',
    cost: { exp: 1800 }, sect: 'kunlun',
    battleTip: '大回血·加防',
  },
  kunlun_sword_frozen: {
    id: 'kunlun_sword_frozen', name: '冰封万里', icon: '❄️', type: 'attack', target: 'enemy',
    mp: 55, hit: 1, powerMul: 2.5, defPen: 0.7,
    cooldown: 3, effect: { type: 'stun', value: 1, duration: 1 },
    healPct: 0,
    desc: '冰封万里，天地同冻。造成250%攻击伤害，必定眩晕敌方1回合。',
    cost: { exp: 2000 }, sect: 'kunlun',
    battleTip: '大爆发+必晕',
  },

  // ═══════════════════════════════════════════════════════════
  //  唐门（P6 Batch 2 · 一流门派 · 淬毒暗器+暴雨梨花+毒经秘传）
  // ═══════════════════════════════════════════════════════════

  // ── 唐门 · 炼气期 ──
  tang_needle: {
    id: 'tang_needle', name: '牛毛针', icon: '📌', type: 'attack', target: 'enemy',
    mp: 10, hit: 2, powerMul: 0.6, defPen: 0.85,
    cooldown: 0, effect: null, healPct: 0,
    desc: '唐门入门暗器，牛毛细针二连发各造成60%攻击伤害，穿透极高。',
    cost: { exp: 0 }, sect: 'tangmen',
    battleTip: '二段连击·超高穿透',
  },
  tang_poison_qi: {
    id: 'tang_poison_qi', name: '唐门毒功', icon: '☠️', type: 'passive', target: 'self',
    mp: 0, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 0, effect: { type: 'regen_mp', value: 3, duration: 99 },
    healPct: 0,
    desc: '【被动】唐门基础毒功，以毒淬体，每回合自动恢复3点内力。',
    cost: { exp: 0 }, sect: 'tangmen',
    battleTip: '被动·稳定内力回复',
  },
  tang_blade_basic: {
    id: 'tang_blade_basic', name: '飞刀术', icon: '🔪', type: 'attack', target: 'enemy',
    mp: 12, hit: 1, powerMul: 1.2, defPen: 0.8,
    cooldown: 0, effect: null, healPct: 0,
    desc: '飞刀之术，快准狠。造成120%攻击伤害，穿透较高。',
    cost: { exp: 0 }, sect: 'tangmen',
    battleTip: '基础攻击·高穿透',
  },
  tang_smoke: {
    id: 'tang_smoke', name: '烟幕弹', icon: '💨', type: 'support', target: 'self',
    mp: 12, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 2, effect: { type: 'evade', value: 0.4, duration: 1 },
    healPct: 0,
    desc: '烟幕弥漫，遁形其中。提升40%闪避率1回合。',
    cost: { exp: 80 }, sect: 'tangmen',
    battleTip: '闪避·规避伤害',
  },

  // ── 唐门 · 筑基期 ──
  tang_dart: {
    id: 'tang_dart', name: '袖箭', icon: '🎯', type: 'attack', target: 'enemy',
    mp: 22, hit: 1, powerMul: 1.4, defPen: 0.75,
    cooldown: 1, effect: { type: 'weaken_def', value: 8, duration: 2 },
    healPct: 0,
    desc: '袖中暗箭，防不胜防。造成140%攻击伤害，削弱敌方防御8点持续2回合。',
    cost: { exp: 200 }, sect: 'tangmen',
    battleTip: '爆发·减防连招',
  },
  tang_shadow_step: {
    id: 'tang_shadow_step', name: '影遁', icon: '👤', type: 'support', target: 'self',
    mp: 20, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 2, effect: { type: 'evade', value: 0.5, duration: 1 },
    healPct: 0,
    desc: '唐门秘传身法，融入暗影之中，提升50%闪避率1回合。',
    cost: { exp: 250 }, sect: 'tangmen',
    battleTip: '高闪避·规避爆发',
  },
  tang_rain_needle: {
    id: 'tang_rain_needle', name: '暴雨针', icon: '🌧️', type: 'attack', target: 'enemy',
    mp: 24, hit: 4, powerMul: 0.35, defPen: 0.8,
    cooldown: 1, effect: null, healPct: 0,
    desc: '针如暴雨倾盆，四连击各造成35%攻击伤害。数量压制，密不透风。',
    cost: { exp: 300 }, sect: 'tangmen',
    battleTip: '四连击·数量压制',
  },
  tang_venom: {
    id: 'tang_venom', name: '五毒镖', icon: '🦂', type: 'attack', target: 'enemy',
    mp: 28, hit: 1, powerMul: 0.8, defPen: 0.7,
    cooldown: 2, effect: { type: 'poison', value: 12, duration: 3 },
    healPct: 0,
    desc: '五毒淬镖，中者即毒。造成80%攻击伤害，并施毒3回合每回合损失12HP。',
    cost: { exp: 320 }, sect: 'tangmen',
    battleTip: '攻击+中毒·持续消耗',
  },

  // ── 唐门 · 结丹期 ──
  tang_blade_adv: {
    id: 'tang_blade_adv', name: '夺魄刀', icon: '🗡️', type: 'attack', target: 'enemy',
    mp: 36, hit: 1, powerMul: 2.0, defPen: 0.65,
    cooldown: 2, effect: null, healPct: 0,
    desc: '一刃夺魄，刀不留痕。造成200%攻击伤害，唐门中乘暗器。',
    cost: { exp: 500 }, sect: 'tangmen',
    battleTip: '中等爆发·2回合冷却',
  },
  tang_poison_mist: {
    id: 'tang_poison_mist', name: '毒雾术', icon: '☠️', type: 'control', target: 'enemy',
    mp: 35, hit: 1, powerMul: 0.3, defPen: 0.5,
    cooldown: 3, effect: { type: 'weaken_def', value: 18, duration: 3 },
    healPct: 0,
    desc: '毒雾弥漫，腐蚀护甲。造成30%攻击伤害，大幅削弱敌方防御18点持续3回合。',
    cost: { exp: 600 }, sect: 'tangmen',
    battleTip: '控制·大幅破甲',
  },
  tang_dart_storm: {
    id: 'tang_dart_storm', name: '飞蝗石雨', icon: '🪨', type: 'attack', target: 'enemy',
    mp: 38, hit: 3, powerMul: 0.55, defPen: 0.8,
    cooldown: 2, effect: null, healPct: 0,
    desc: '飞蝗石如雨倾泻，三连击各造成55%攻击伤害，穿透极高。',
    cost: { exp: 550 }, sect: 'tangmen',
    battleTip: '三连击·高贯穿',
  },
  tang_toxic_art: {
    id: 'tang_toxic_art', name: '毒经要诀', icon: '📜', type: 'passive', target: 'self',
    mp: 0, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 0, effect: { type: 'regen_mp', value: 6, duration: 99 },
    healPct: 0,
    desc: '【被动】毒经秘传，中毒状态下敌人额外受到+5点/回合伤害，每回合恢复6点内力。',
    cost: { exp: 650 }, sect: 'tangmen',
    battleTip: '被动·中毒加深+内力回复',
  },

  // ── 唐门 · 元婴期 ──
  tang_blade_master: {
    id: 'tang_blade_master', name: '追魂刀', icon: '🔪', type: 'attack', target: 'enemy',
    mp: 52, hit: 1, powerMul: 3.0, defPen: 0.7,
    cooldown: 3, effect: null, healPct: 0,
    desc: '追魂夺命，一刀封喉。造成300%攻击伤害，唐门暗器巅峰。',
    cost: { exp: 2000 }, sect: 'tangmen',
    battleTip: '终极爆发·高穿透',
  },
  tang_pear_flower: {
    id: 'tang_pear_flower', name: '暴雨梨花针', icon: '🌸', type: 'attack', target: 'enemy',
    mp: 55, hit: 5, powerMul: 0.4, defPen: 0.85,
    cooldown: 3, effect: { type: 'poison', value: 10, duration: 2 },
    healPct: 0,
    desc: '唐门镇派暗器，五连击各造成40%攻击伤害，附带中毒2回合每回合损失10HP。',
    cost: { exp: 2000 }, sect: 'tangmen',
    battleTip: '五连击+中毒·毁灭暗器',
  },
  tang_poison_secret: {
    id: 'tang_poison_secret', name: '唐门毒典', icon: '☠️', type: 'passive', target: 'self',
    mp: 0, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 0, effect: { type: 'regen_mp_pct', value: 15, duration: 99 },
    healPct: 0,
    desc: '【被动】唐门至高毒典，每回合恢复15%最大内力，所有攻击附带微毒（+3HP/回合）。',
    cost: { exp: 1800 }, sect: 'tangmen',
    battleTip: '被动·终极内力循环+全技附毒',
  },
  tang_night_walker: {
    id: 'tang_night_walker', name: '月夜行', icon: '🌙', type: 'attack', target: 'enemy',
    mp: 55, hit: 1, powerMul: 2.5, defPen: 0.75,
    cooldown: 3, effect: { type: 'stun', value: 1, duration: 1 },
    healPct: 0,
    desc: '月黑风高，一击封命。造成250%攻击伤害，必定眩晕敌方1回合。',
    cost: { exp: 2000 }, sect: 'tangmen',
    battleTip: '大爆发+必晕',
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