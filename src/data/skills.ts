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

  // ══════════════════════════════════════
  //  华山派 (huashan) — P6 Batch 3
  // ══════════════════════════════════════
  huashan_sword_basic: {
    id: 'huashan_sword_basic', name: '华山基础剑', icon: '⚔️', type: 'attack', target: 'enemy',
    mp: 5, hit: 1, powerMul: 1.0, defPen: 0.3,
    cooldown: 0, effect: null, healPct: 0,
    desc: '华山弟子入门剑法，中正平和，破防能力不俗。',
    cost: { exp: 0 }, sect: 'huashan',
    battleTip: '基础攻击·破防',
  },
  huashan_mountain_qi: {
    id: 'huashan_mountain_qi', name: '华山心法', icon: '🏔️', type: 'passive', target: 'self',
    mp: 0, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 0, effect: { type: 'regen_mp', value: 3, duration: 99 },
    healPct: 0,
    desc: '【被动】华山内功心法，每回合恢复3点内力。',
    cost: { exp: 0 }, sect: 'huashan',
    battleTip: '被动·内力回复',
  },
  huashan_wind_step: {
    id: 'huashan_wind_step', name: '清风步', icon: '🍃', type: 'support', target: 'self',
    mp: 10, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 3, effect: { type: 'evade', value: 20, duration: 3 },
    healPct: 0,
    desc: '华山轻功绝学，3回合内身法+20%。',
    cost: { exp: 0 }, sect: 'huashan',
    battleTip: '身法↑20%·3回合',
  },
  huashan_sword_flash: {
    id: 'huashan_sword_flash', name: '剑光一闪', icon: '✨', type: 'attack', target: 'enemy',
    mp: 15, hit: 1, powerMul: 1.35, defPen: 0.45,
    cooldown: 0, effect: null, healPct: 0,
    desc: '华山快剑第一式，剑光如电一闪而至。',
    cost: { exp: 100 }, sect: 'huashan',
    battleTip: '快速一击·高破防',
  },
  huashan_wind_sword: {
    id: 'huashan_wind_sword', name: '清风十三式', icon: '🌀', type: 'attack', target: 'enemy',
    mp: 18, hit: 2, powerMul: 0.7, defPen: 0.35,
    cooldown: 1, effect: null, healPct: 0,
    desc: '华山核心剑法，二连击各造成70%攻击伤害。',
    cost: { exp: 200 }, sect: 'huashan',
    battleTip: '二连击·稳定输出',
  },
  huashan_sword_shield: {
    id: 'huashan_sword_shield', name: '剑盾护体', icon: '🛡️', type: 'support', target: 'self',
    mp: 15, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 4, effect: { type: 'def_boost', value: 30, duration: 3 },
    healPct: 0,
    desc: '以剑化盾，3回合内防御+30%。',
    cost: { exp: 200 }, sect: 'huashan',
    battleTip: '防御↑30%·3回合',
  },
  huashan_storm_sword: {
    id: 'huashan_storm_sword', name: '狂风快剑', icon: '💨', type: 'attack', target: 'enemy',
    mp: 22, hit: 3, powerMul: 0.45, defPen: 0.3,
    cooldown: 2, effect: null, healPct: 0,
    desc: '剑如狂风，三连击各造成45%攻击伤害。',
    cost: { exp: 300 }, sect: 'huashan',
    battleTip: '三连击·压制',
  },
  huashan_sword_heart: {
    id: 'huashan_sword_heart', name: '剑心通明', icon: '💎', type: 'passive', target: 'self',
    mp: 0, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 0, effect: { type: 'buff_atk', value: 10, duration: 99 },
    healPct: 0,
    desc: '【被动】剑心澄澈，攻击+10%。',
    cost: { exp: 300 }, sect: 'huashan',
    battleTip: '被动·攻击↑10%',
  },
  huashan_lonely_sword: {
    id: 'huashan_lonely_sword', name: '独孤九剑·破', icon: '🗡️', type: 'attack', target: 'enemy',
    mp: 25, hit: 1, powerMul: 2.0, defPen: 0.8,
    cooldown: 3, effect: null, healPct: 0,
    desc: '独孤九剑破剑式，无视八成防御。造成200%攻击伤害。',
    cost: { exp: 500 }, sect: 'huashan',
    battleTip: '大伤害·超高破防',
  },
  huashan_sword_soul: {
    id: 'huashan_sword_soul', name: '剑气化形', icon: '🌊', type: 'attack', target: 'enemy',
    mp: 30, hit: 2, powerMul: 1.15, defPen: 0.4,
    cooldown: 2, effect: null, healPct: 0,
    desc: '剑气凝聚成形，二连各造成115%攻击伤害。',
    cost: { exp: 600 }, sect: 'huashan',
    battleTip: '双重重击',
  },
  huashan_mountain_guard: {
    id: 'huashan_mountain_guard', name: '华山剑阵', icon: '⛩️', type: 'support', target: 'self',
    mp: 30, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 5, effect: { type: 'def_boost', value: 40, duration: 3 },
    healPct: 15,
    desc: '华山护山大阵简化版，防御+40%并恢复15%气血。',
    cost: { exp: 600 }, sect: 'huashan',
    battleTip: '防御↑40%+回血15%',
  },
  huashan_sword_9: {
    id: 'huashan_sword_9', name: '九剑归一', icon: '⚡', type: 'attack', target: 'enemy',
    mp: 40, hit: 1, powerMul: 2.6, defPen: 0.6,
    cooldown: 4, effect: { type: 'stun', value: 1, duration: 1 },
    healPct: 0,
    desc: '独孤九剑终极奥义，造成260%攻击伤害并眩晕1回合。',
    cost: { exp: 800 }, sect: 'huashan',
    battleTip: '大爆发+眩晕',
  },

  // ══════════════════════════════════════
  //  崆峒派 (kongtong) — P6 Batch 3
  // ══════════════════════════════════════
  kongtong_fist_basic: {
    id: 'kongtong_fist_basic', name: '崆峒基础拳', icon: '👊', type: 'attack', target: 'enemy',
    mp: 5, hit: 1, powerMul: 1.0, defPen: 0.3,
    cooldown: 0, effect: null, healPct: 0,
    desc: '崆峒弟子入门拳法，朴实刚健。',
    cost: { exp: 0 }, sect: 'kongtong',
    battleTip: '基础攻击',
  },
  kongtong_inner_qi: {
    id: 'kongtong_inner_qi', name: '崆峒内功', icon: '🔥', type: 'passive', target: 'self',
    mp: 0, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 0, effect: { type: 'regen_mp', value: 3, duration: 99 },
    healPct: 0,
    desc: '【被动】崆峒玄门内功，每回合恢复3点气血。',
    cost: { exp: 0 }, sect: 'kongtong',
    battleTip: '被动·气血回复',
  },
  kongtong_iron_arm: {
    id: 'kongtong_iron_arm', name: '铁臂功', icon: '💪', type: 'support', target: 'self',
    mp: 10, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 3, effect: { type: 'def_boost', value: 20, duration: 3 },
    healPct: 0,
    desc: '双臂灌注真气坚如铁石，3回合内防御+20%。',
    cost: { exp: 0 }, sect: 'kongtong',
    battleTip: '防御↑20%·3回合',
  },
  kongtong_rock_fist: {
    id: 'kongtong_rock_fist', name: '碎石拳', icon: '🪨', type: 'attack', target: 'enemy',
    mp: 12, hit: 1, powerMul: 1.4, defPen: 0.35,
    cooldown: 0, effect: null, healPct: 0,
    desc: '一拳碎石裂碑，造成140%攻击伤害。',
    cost: { exp: 100 }, sect: 'kongtong',
    battleTip: '中伤害',
  },
  kongtong_storm_fist: {
    id: 'kongtong_storm_fist', name: '狂风拳', icon: '💨', type: 'attack', target: 'enemy',
    mp: 18, hit: 2, powerMul: 0.75, defPen: 0.3,
    cooldown: 1, effect: null, healPct: 0,
    desc: '拳出如风，二连击各造成75%攻击伤害。',
    cost: { exp: 200 }, sect: 'kongtong',
    battleTip: '二连击',
  },
  kongtong_body_guard: {
    id: 'kongtong_body_guard', name: '玄武功', icon: '🐢', type: 'passive', target: 'self',
    mp: 0, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 0, effect: { type: 'def_boost', value: 10, duration: 99 },
    healPct: 0,
    desc: '【被动】玄武功护体，防御+10%。',
    cost: { exp: 200 }, sect: 'kongtong',
    battleTip: '被动·防御↑10%',
  },
  kongtong_crush_palm: {
    id: 'kongtong_crush_palm', name: '碎骨掌', icon: '🦴', type: 'attack', target: 'enemy',
    mp: 20, hit: 1, powerMul: 1.6, defPen: 0.5,
    cooldown: 1, effect: null, healPct: 0,
    desc: '一掌击出骨骼碎裂，造成160%攻击伤害并高破防。',
    cost: { exp: 300 }, sect: 'kongtong',
    battleTip: '高伤·高破防',
  },
  kongtong_mountain_roar: {
    id: 'kongtong_mountain_roar', name: '山啸', icon: '🏔️', type: 'support', target: 'self',
    mp: 18, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 4, effect: { type: 'buff_atk', value: 25, duration: 3 },
    healPct: 0,
    desc: '仰天长啸震彻山谷，3回合内攻击+25%。',
    cost: { exp: 300 }, sect: 'kongtong',
    battleTip: '攻击↑25%·3回合',
  },
  kongtong_7_hurt: {
    id: 'kongtong_7_hurt', name: '七伤拳', icon: '💥', type: 'attack', target: 'enemy',
    mp: 25, hit: 1, powerMul: 2.3, defPen: 0.55,
    cooldown: 3, effect: null, healPct: -5,
    desc: '伤人先伤己，造成230%攻击伤害但自损5%气血。',
    cost: { exp: 500 }, sect: 'kongtong',
    battleTip: '大伤害·自损5%',
  },
  kongtong_qi_shield: {
    id: 'kongtong_qi_shield', name: '气盾', icon: '🛡️', type: 'support', target: 'self',
    mp: 28, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 5, effect: { type: 'def_boost', value: 45, duration: 3 },
    healPct: 0,
    desc: '真气凝聚成盾，3回合内防御+45%。',
    cost: { exp: 500 }, sect: 'kongtong',
    battleTip: '防御↑45%·3回合',
  },
  kongtong_thunder_fist: {
    id: 'kongtong_thunder_fist', name: '霹雳拳', icon: '⚡', type: 'attack', target: 'enemy',
    mp: 30, hit: 1, powerMul: 1.8, defPen: 0.4,
    cooldown: 2, effect: { type: 'stun', value: 1, duration: 1 },
    healPct: 0,
    desc: '拳如霹雳震人心魄，造成180%伤害并眩晕1回合。',
    cost: { exp: 600 }, sect: 'kongtong',
    battleTip: '中伤害+眩晕',
  },
  kongtong_titan_palm: {
    id: 'kongtong_titan_palm', name: '巨灵神掌', icon: '✋', type: 'attack', target: 'enemy',
    mp: 40, hit: 1, powerMul: 2.8, defPen: 0.5,
    cooldown: 4, effect: null, healPct: 0,
    desc: '崆峒镇派绝技，一掌之威如巨灵降世，造成280%攻击伤害。',
    cost: { exp: 800 }, sect: 'kongtong',
    battleTip: '超大伤害',
  },

  // ══════════════════════════════════════
  //  青城派 (qingcheng) — P6 Batch 3
  // ══════════════════════════════════════
  qingcheng_sword_basic: {
    id: 'qingcheng_sword_basic', name: '青城基础剑', icon: '⚔️', type: 'attack', target: 'enemy',
    mp: 5, hit: 1, powerMul: 1.0, defPen: 0.3,
    cooldown: 0, effect: null, healPct: 0,
    desc: '青城弟子入门剑法，轻灵飘逸。',
    cost: { exp: 0 }, sect: 'qingcheng',
    battleTip: '基础攻击',
  },
  qingcheng_dao_qi: {
    id: 'qingcheng_dao_qi', name: '青城道气', icon: '☯️', type: 'passive', target: 'self',
    mp: 0, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 0, effect: { type: 'regen_mp', value: 4, duration: 99 },
    healPct: 0,
    desc: '【被动】青城道门内功，每回合恢复4点内力。',
    cost: { exp: 0 }, sect: 'qingcheng',
    battleTip: '被动·内力回复',
  },
  qingcheng_crane_step: {
    id: 'qingcheng_crane_step', name: '仙鹤步', icon: '🦩', type: 'support', target: 'self',
    mp: 10, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 3, effect: { type: 'evade', value: 20, duration: 3 },
    healPct: 0,
    desc: '身如仙鹤展翅，3回合内身法+20%。',
    cost: { exp: 0 }, sect: 'qingcheng',
    battleTip: '身法↑20%·3回合',
  },
  qingcheng_wind_sword: {
    id: 'qingcheng_wind_sword', name: '松风剑', icon: '🌲', type: 'attack', target: 'enemy',
    mp: 14, hit: 2, powerMul: 0.6, defPen: 0.3,
    cooldown: 0, effect: null, healPct: 0,
    desc: '剑如松涛，二连击各造成60%攻击伤害。',
    cost: { exp: 100 }, sect: 'qingcheng',
    battleTip: '二连击',
  },
  qingcheng_cloud_sword: {
    id: 'qingcheng_cloud_sword', name: '云雾剑', icon: '🌫️', type: 'attack', target: 'enemy',
    mp: 18, hit: 3, powerMul: 0.42, defPen: 0.3,
    cooldown: 2, effect: { type: 'stun', value: 1, duration: 2 },
    healPct: 0,
    desc: '剑法飘忽如云雾遮目，三连击并有概率致盲2回合。',
    cost: { exp: 200 }, sect: 'qingcheng',
    battleTip: '三连击·致盲',
  },
  qingcheng_mist_body: {
    id: 'qingcheng_mist_body', name: '雾隐身', icon: '🌫️', type: 'support', target: 'self',
    mp: 15, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 4, effect: { type: 'evade', value: 35, duration: 2 },
    healPct: 0,
    desc: '身化雾影，2回合内身法+35%。',
    cost: { exp: 200 }, sect: 'qingcheng',
    battleTip: '身法↑35%·2回合',
  },
  qingcheng_sword_qi: {
    id: 'qingcheng_sword_qi', name: '剑气纵横', icon: '✨', type: 'attack', target: 'enemy',
    mp: 20, hit: 1, powerMul: 1.55, defPen: 0.45,
    cooldown: 1, effect: null, healPct: 0,
    desc: '剑气挥洒自如，造成155%攻击伤害。',
    cost: { exp: 300 }, sect: 'qingcheng',
    battleTip: '中伤害·破防',
  },
  qingcheng_dao_heart: {
    id: 'qingcheng_dao_heart', name: '道心诀', icon: '💎', type: 'passive', target: 'self',
    mp: 0, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 0, effect: { type: 'buff_atk', value: 10, duration: 99 },
    healPct: 0,
    desc: '【被动】道心坚定，攻击+10%。',
    cost: { exp: 300 }, sect: 'qingcheng',
    battleTip: '被动·攻击↑10%',
  },
  qingcheng_luofu_sword: {
    id: 'qingcheng_luofu_sword', name: '罗浮剑', icon: '🌄', type: 'attack', target: 'enemy',
    mp: 25, hit: 2, powerMul: 1.05, defPen: 0.4,
    cooldown: 2, effect: null, healPct: 0,
    desc: '罗浮山巅悟出的剑法，二连各造成105%攻击伤害。',
    cost: { exp: 500 }, sect: 'qingcheng',
    battleTip: '双重重击',
  },
  qingcheng_immortal_guard: {
    id: 'qingcheng_immortal_guard', name: '仙道护体', icon: '✨', type: 'support', target: 'self',
    mp: 30, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 5, effect: { type: 'def_boost', value: 30, duration: 3 },
    healPct: 20,
    desc: '仙道真气护体，恢复20%气血并3回合内防御+30%。',
    cost: { exp: 500 }, sect: 'qingcheng',
    battleTip: '回血20%+防御↑30%',
  },
  qingcheng_sword_storm: {
    id: 'qingcheng_sword_storm', name: '青城剑雨', icon: '🌧️', type: 'attack', target: 'enemy',
    mp: 32, hit: 4, powerMul: 0.38, defPen: 0.3,
    cooldown: 3, effect: null, healPct: 0,
    desc: '剑化万千如雨而下，四连击各造成38%攻击伤害。',
    cost: { exp: 600 }, sect: 'qingcheng',
    battleTip: '四连击·压制',
  },
  qingcheng_taiji_sword: {
    id: 'qingcheng_taiji_sword', name: '青城太极剑', icon: '☯️', type: 'attack', target: 'enemy',
    mp: 38, hit: 1, powerMul: 2.4, defPen: 0.65,
    cooldown: 4, effect: null, healPct: 0,
    desc: '青城道门绝学，太极剑意破万法，造成240%攻击伤害。',
    cost: { exp: 800 }, sect: 'qingcheng',
    battleTip: '大伤害·高破防',
  },

  // ══════════════════════════════════════
  //  点苍派 (diancang) — P6 Batch 3
  // ══════════════════════════════════════
  diancang_sword_basic: {
    id: 'diancang_sword_basic', name: '点苍基础剑', icon: '⚔️', type: 'attack', target: 'enemy',
    mp: 5, hit: 1, powerMul: 1.0, defPen: 0.3,
    cooldown: 0, effect: null, healPct: 0,
    desc: '点苍弟子入门剑法，诡异多变。',
    cost: { exp: 0 }, sect: 'diancang',
    battleTip: '基础攻击',
  },
  diancang_snake_qi: {
    id: 'diancang_snake_qi', name: '灵蛇内功', icon: '🐍', type: 'passive', target: 'self',
    mp: 0, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 0, effect: { type: 'buff_atk', value: 10, duration: 99 },
    healPct: 0,
    desc: '【被动】灵蛇吐信，暴击率+10%。',
    cost: { exp: 0 }, sect: 'diancang',
    battleTip: '被动·暴击↑10%',
  },
  diancang_mist_step: {
    id: 'diancang_mist_step', name: '雾行步', icon: '🌫️', type: 'support', target: 'self',
    mp: 10, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 3, effect: { type: 'evade', value: 20, duration: 3 },
    healPct: 0,
    desc: '南疆雾中步法，3回合内身法+20%。',
    cost: { exp: 0 }, sect: 'diancang',
    battleTip: '身法↑20%·3回合',
  },
  diancang_viper_sword: {
    id: 'diancang_viper_sword', name: '毒蛇剑', icon: '🐍', type: 'attack', target: 'enemy',
    mp: 14, hit: 1, powerMul: 1.3, defPen: 0.35,
    cooldown: 0, effect: { type: 'poison', value: 4, duration: 3 },
    healPct: 0,
    desc: '剑身淬毒如毒蛇吐信，造成130%伤害并中毒3回合。',
    cost: { exp: 100 }, sect: 'diancang',
    battleTip: '中毒·3回合',
  },
  diancang_double_sword: {
    id: 'diancang_double_sword', name: '双蛇剑', icon: '⚔️', type: 'attack', target: 'enemy',
    mp: 18, hit: 2, powerMul: 0.68, defPen: 0.35,
    cooldown: 1, effect: null, healPct: 0,
    desc: '双剑如双蛇齐出，二连击各造成68%攻击伤害。',
    cost: { exp: 200 }, sect: 'diancang',
    battleTip: '二连击',
  },
  diancang_snake_skin: {
    id: 'diancang_snake_skin', name: '蛇蜕功', icon: '🐍', type: 'support', target: 'self',
    mp: 15, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 4, effect: { type: 'def_boost', value: 25, duration: 3 },
    healPct: 0,
    desc: '如蛇蜕皮焕然一新，3回合内防御+25%。',
    cost: { exp: 200 }, sect: 'diancang',
    battleTip: '防御↑25%·3回合',
  },
  diancang_circling_sword: {
    id: 'diancang_circling_sword', name: '盘蛇剑', icon: '🌀', type: 'attack', target: 'enemy',
    mp: 20, hit: 1, powerMul: 1.6, defPen: 0.5,
    cooldown: 1, effect: null, healPct: 0,
    desc: '剑势盘绕如蛇缠身，造成160%攻击伤害并高破防。',
    cost: { exp: 300 }, sect: 'diancang',
    battleTip: '高伤·高破防',
  },
  diancang_southern_qi: {
    id: 'diancang_southern_qi', name: '南疆心法', icon: '🌿', type: 'passive', target: 'self',
    mp: 0, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 0, effect: { type: 'buff_atk', value: 8, duration: 99 },
    healPct: 0,
    desc: '【被动】南疆秘传心法，攻击+8%并暴击+5%。',
    cost: { exp: 300 }, sect: 'diancang',
    battleTip: '被动·攻击↑8%',
  },
  diancang_sword_storm: {
    id: 'diancang_sword_storm', name: '点苍剑雨', icon: '🌧️', type: 'attack', target: 'enemy',
    mp: 25, hit: 3, powerMul: 0.55, defPen: 0.35,
    cooldown: 2, effect: null, healPct: 0,
    desc: '剑如暴雨倾盆，三连击各造成55%攻击伤害。',
    cost: { exp: 500 }, sect: 'diancang',
    battleTip: '三连击',
  },
  diancang_poison_soul: {
    id: 'diancang_poison_soul', name: '毒魂', icon: '☠️', type: 'attack', target: 'enemy',
    mp: 30, hit: 1, powerMul: 1.5, defPen: 0.4,
    cooldown: 2, effect: { type: 'poison', value: 8, duration: 4 },
    healPct: 0,
    desc: '毒魂附剑，造成150%伤害并强中毒4回合。',
    cost: { exp: 600 }, sect: 'diancang',
    battleTip: '强中毒·4回合',
  },
  diancang_shadow_sword: {
    id: 'diancang_shadow_sword', name: '幻影剑', icon: '👥', type: 'attack', target: 'enemy',
    mp: 32, hit: 1, powerMul: 2.0, defPen: 0.5,
    cooldown: 3, effect: { type: 'stun', value: 1, duration: 2 },
    healPct: 0,
    desc: '剑化幻影虚实难辨，造成200%伤害并致盲2回合。',
    cost: { exp: 700 }, sect: 'diancang',
    battleTip: '大伤害+致盲',
  },
  diancang_king_cobra: {
    id: 'diancang_king_cobra', name: '眼镜王蛇', icon: '🐍', type: 'attack', target: 'enemy',
    mp: 40, hit: 1, powerMul: 2.6, defPen: 0.55,
    cooldown: 4, effect: { type: 'poison', value: 10, duration: 3 },
    healPct: 0,
    desc: '点苍镇派绝技，如眼镜王蛇一击致命，造成260%伤害并剧毒3回合。',
    cost: { exp: 800 }, sect: 'diancang',
    battleTip: '大爆发+剧毒',
  },

  // ══════════════════════════════════════
  //  铁掌帮 (tiezhang) — P6 Batch 3
  // ══════════════════════════════════════
  tiezhang_palm_basic: {
    id: 'tiezhang_palm_basic', name: '铁掌基础掌', icon: '✋', type: 'attack', target: 'enemy',
    mp: 5, hit: 1, powerMul: 1.0, defPen: 0.3,
    cooldown: 0, effect: null, healPct: 0,
    desc: '铁掌帮入门掌法，势大力沉。',
    cost: { exp: 0 }, sect: 'tiezhang',
    battleTip: '基础攻击',
  },
  tiezhang_iron_qi: {
    id: 'tiezhang_iron_qi', name: '铁掌内功', icon: '🔥', type: 'passive', target: 'self',
    mp: 0, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 0, effect: { type: 'def_boost', value: 10, duration: 99 },
    healPct: 0,
    desc: '【被动】铁掌内功刚猛无匹，防御+10%。',
    cost: { exp: 0 }, sect: 'tiezhang',
    battleTip: '被动·防御↑10%',
  },
  tiezhang_sand_palm: {
    id: 'tiezhang_sand_palm', name: '铁砂掌', icon: '🖐️', type: 'attack', target: 'enemy',
    mp: 12, hit: 1, powerMul: 1.25, defPen: 0.5,
    cooldown: 0, effect: null, healPct: 0,
    desc: '以铁砂淬炼的双掌，造成125%伤害并高破防。',
    cost: { exp: 100 }, sect: 'tiezhang',
    battleTip: '高破防',
  },
  tiezhang_hard_body: {
    id: 'tiezhang_hard_body', name: '铁布衫', icon: '🛡️', type: 'support', target: 'self',
    mp: 10, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 3, effect: { type: 'def_boost', value: 25, duration: 3 },
    healPct: 0,
    desc: '铁布衫硬气功，3回合内防御+25%。',
    cost: { exp: 100 }, sect: 'tiezhang',
    battleTip: '防御↑25%·3回合',
  },
  tiezhang_iron_palm: {
    id: 'tiezhang_iron_palm', name: '铁掌开碑', icon: '✋', type: 'attack', target: 'enemy',
    mp: 18, hit: 1, powerMul: 1.55, defPen: 0.45,
    cooldown: 1, effect: null, healPct: 0,
    desc: '一掌开碑裂石，造成155%攻击伤害。',
    cost: { exp: 200 }, sect: 'tiezhang',
    battleTip: '中伤害',
  },
  tiezhang_water_step: {
    id: 'tiezhang_water_step', name: '水上飘', icon: '🌊', type: 'support', target: 'self',
    mp: 14, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 3, effect: { type: 'evade', value: 25, duration: 3 },
    healPct: 0,
    desc: '铁掌水上飘绝技，3回合内身法+25%。',
    cost: { exp: 200 }, sect: 'tiezhang',
    battleTip: '身法↑25%·3回合',
  },
  tiezhang_fire_palm: {
    id: 'tiezhang_fire_palm', name: '火焰掌', icon: '🔥', type: 'attack', target: 'enemy',
    mp: 20, hit: 1, powerMul: 1.45, defPen: 0.35,
    cooldown: 1, effect: { type: 'poison', value: 5, duration: 3 },
    healPct: 0,
    desc: '掌劲化为烈焰，造成145%伤害并灼烧3回合。',
    cost: { exp: 300 }, sect: 'tiezhang',
    battleTip: '灼烧·3回合',
  },
  tiezhang_steel_skin: {
    id: 'tiezhang_steel_skin', name: '铜皮铁骨', icon: '🦾', type: 'passive', target: 'self',
    mp: 0, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 0, effect: { type: 'def_boost', value: 10, duration: 99 },
    healPct: 0,
    desc: '【被动】铜皮铁骨淬炼周身，防御+10%（与铁掌内功叠加）。',
    cost: { exp: 300 }, sect: 'tiezhang',
    battleTip: '被动·防御↑10%',
  },
  tiezhang_crushing_palm: {
    id: 'tiezhang_crushing_palm', name: '碎铁掌', icon: '💥', type: 'attack', target: 'enemy',
    mp: 25, hit: 1, powerMul: 2.0, defPen: 0.7,
    cooldown: 3, effect: null, healPct: 0,
    desc: '碎铁如泥，无视七成防御，造成200%攻击伤害。',
    cost: { exp: 500 }, sect: 'tiezhang',
    battleTip: '大伤害·超高破防',
  },
  tiezhang_mountain_body: {
    id: 'tiezhang_mountain_body', name: '金刚不坏', icon: '⛰️', type: 'support', target: 'self',
    mp: 28, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 5, effect: { type: 'def_boost', value: 40, duration: 3 },
    healPct: 20,
    desc: '金刚不坏神功，恢复20%气血并3回合内防御+40%。',
    cost: { exp: 600 }, sect: 'tiezhang',
    battleTip: '回血20%+防御↑40%',
  },
  tiezhang_thunder_palm: {
    id: 'tiezhang_thunder_palm', name: '霹雳铁掌', icon: '⚡', type: 'attack', target: 'enemy',
    mp: 30, hit: 1, powerMul: 1.8, defPen: 0.4,
    cooldown: 2, effect: { type: 'stun', value: 1, duration: 1 },
    healPct: 0,
    desc: '掌含霹雳之威，造成180%伤害并眩晕1回合。',
    cost: { exp: 700 }, sect: 'tiezhang',
    battleTip: '中伤害+眩晕',
  },
  tiezhang_supreme_palm: {
    id: 'tiezhang_supreme_palm', name: '铁掌无极', icon: '☀️', type: 'attack', target: 'enemy',
    mp: 40, hit: 1, powerMul: 2.8, defPen: 0.55,
    cooldown: 4, effect: null, healPct: 0,
    desc: '铁掌帮镇派绝学，无极掌力摧枯拉朽，造成280%攻击伤害。',
    cost: { exp: 800 }, sect: 'tiezhang',
    battleTip: '超大伤害',
  },

  // ══════════════════════════════════════
  //  茅山派 (maoshan) — P6 Batch 4
  // ══════════════════════════════════════
  maoshan_talisman: {
    id: 'maoshan_talisman', name: '茅山符法', icon: '📜', type: 'attack', target: 'enemy',
    mp: 5, hit: 1, powerMul: 1.0, defPen: 0.3,
    cooldown: 0, effect: null, healPct: 0,
    desc: '茅山弟子入门符法，以符纸引灵击敌。',
    cost: { exp: 0 }, sect: 'maoshan',
    battleTip: '基础攻击',
  },
  maoshan_ghost_qi: {
    id: 'maoshan_ghost_qi', name: '阴魂内功', icon: '👻', type: 'passive', target: 'self',
    mp: 0, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 0, effect: { type: 'regen_mp', value: 3, duration: 99 },
    healPct: 0,
    desc: '【被动】以阴魂之力滋养经脉，每回合恢复3点内力。',
    cost: { exp: 0 }, sect: 'maoshan',
    battleTip: '被动·内力回复',
  },
  maoshan_bind_ghost: {
    id: 'maoshan_bind_ghost', name: '缚鬼术', icon: '⛓️', type: 'control', target: 'enemy',
    mp: 14, hit: 1, powerMul: 0.5, defPen: 0.3,
    cooldown: 3, effect: { type: 'stun', value: 1, duration: 1 },
    healPct: 0,
    desc: '符纸化锁链束缚敌人，造成50%伤害并眩晕1回合。',
    cost: { exp: 100 }, sect: 'maoshan',
    battleTip: '控制·眩晕',
  },
  maoshan_tao_step: {
    id: 'maoshan_tao_step', name: '道步', icon: '👣', type: 'support', target: 'self',
    mp: 10, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 3, effect: { type: 'evade', value: 20, duration: 3 },
    healPct: 0,
    desc: '玄门步法踏斗步罡，3回合内闪避+20%。',
    cost: { exp: 0 }, sect: 'maoshan',
    battleTip: '闪避↑20%·3回合',
  },
  maoshan_5_thunder: {
    id: 'maoshan_5_thunder', name: '五雷符', icon: '⚡', type: 'attack', target: 'enemy',
    mp: 22, hit: 1, powerMul: 2.1, defPen: 0.5,
    cooldown: 3, effect: { type: 'stun', value: 1, duration: 1 },
    healPct: 0,
    desc: '茅山高级雷符，召五雷轰顶，造成210%伤害并眩晕。',
    cost: { exp: 500 }, sect: 'maoshan',
    battleTip: '大伤害+眩晕',
  },
  maoshan_exorcism: {
    id: 'maoshan_exorcism', name: '驱邪术', icon: '✨', type: 'support', target: 'self',
    mp: 18, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 4, effect: { type: 'def_boost', value: 25, duration: 3 },
    healPct: 15,
    desc: '以道法驱邪护身，恢复15%气血并防御+25%。',
    cost: { exp: 500 }, sect: 'maoshan',
    battleTip: '回血15%+防御↑25%',
  },
  maoshan_spirit_cage: {
    id: 'maoshan_spirit_cage', name: '灵笼', icon: '🔮', type: 'control', target: 'enemy',
    mp: 25, hit: 1, powerMul: 1.2, defPen: 0.4,
    cooldown: 3, effect: { type: 'stun', value: 2, duration: 1 },
    healPct: 0,
    desc: '以灵力编织牢笼困锁敌人，造成120%伤害并眩晕2回合。',
    cost: { exp: 600 }, sect: 'maoshan',
    battleTip: '长时间眩晕',
  },
  maoshan_taoist_heart: {
    id: 'maoshan_taoist_heart', name: '道心护体', icon: '💎', type: 'passive', target: 'self',
    mp: 0, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 0, effect: { type: 'def_boost', value: 10, duration: 99 },
    healPct: 0,
    desc: '【被动】道心稳固鬼邪不侵，防御+10%。',
    cost: { exp: 600 }, sect: 'maoshan',
    battleTip: '被动·防御↑10%',
  },

  // ══════════════════════════════════════
  //  五毒教 (wudu) — P6 Batch 4
  // ══════════════════════════════════════
  wudu_poison_palm: {
    id: 'wudu_poison_palm', name: '五毒掌', icon: '☠️', type: 'attack', target: 'enemy',
    mp: 5, hit: 1, powerMul: 1.0, defPen: 0.3,
    cooldown: 0, effect: null, healPct: 0,
    desc: '五毒教入门掌法，掌中带毒。',
    cost: { exp: 0 }, sect: 'wudu',
    battleTip: '基础攻击',
  },
  wudu_insect_qi: {
    id: 'wudu_insect_qi', name: '蛊虫功', icon: '🦂', type: 'passive', target: 'self',
    mp: 0, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 0, effect: { type: 'regen_mp', value: 3, duration: 99 },
    healPct: 0,
    desc: '【被动】体内蛊虫吐纳灵气，每回合恢复3点内力。',
    cost: { exp: 0 }, sect: 'wudu',
    battleTip: '被动·内力回复',
  },
  wudu_scorpion_tail: {
    id: 'wudu_scorpion_tail', name: '蝎尾针', icon: '🦂', type: 'attack', target: 'enemy',
    mp: 14, hit: 1, powerMul: 1.25, defPen: 0.5,
    cooldown: 0, effect: { type: 'strong_poison', value: 5, duration: 3 },
    healPct: 0,
    desc: '如蝎尾一蛰，造成125%伤害并中剧毒3回合。',
    cost: { exp: 100 }, sect: 'wudu',
    battleTip: '剧毒·3回合',
  },
  wudu_poison_skin: {
    id: 'wudu_poison_skin', name: '毒皮功', icon: '🛡️', type: 'support', target: 'self',
    mp: 10, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 3, effect: { type: 'def_boost', value: 20, duration: 3 },
    healPct: 0,
    desc: '毒淬皮肤坚如皮革，3回合内防御+20%。',
    cost: { exp: 100 }, sect: 'wudu',
    battleTip: '防御↑20%·3回合',
  },
  wudu_centipede_bite: {
    id: 'wudu_centipede_bite', name: '蜈蚣噬', icon: '🐛', type: 'attack', target: 'enemy',
    mp: 18, hit: 3, powerMul: 0.42, defPen: 0.3,
    cooldown: 1, effect: null, healPct: 0,
    desc: '如蜈蚣百足齐噬，三连击各造成42%攻击伤害。',
    cost: { exp: 200 }, sect: 'wudu',
    battleTip: '三连击',
  },
  wudu_toad_breath: {
    id: 'wudu_toad_breath', name: '蟾蜍息', icon: '🐸', type: 'attack', target: 'enemy',
    mp: 20, hit: 1, powerMul: 1.5, defPen: 0.35,
    cooldown: 2, effect: { type: 'weaken_def', value: 15, duration: 3 },
    healPct: 0,
    desc: '口吐蟾毒伤人，造成150%伤害并削弱防御3回合。',
    cost: { exp: 300 }, sect: 'wudu',
    battleTip: '削弱防御',
  },
  wudu_spider_web: {
    id: 'wudu_spider_web', name: '蛛网缚', icon: '🕸️', type: 'control', target: 'enemy',
    mp: 22, hit: 1, powerMul: 0.6, defPen: 0.25,
    cooldown: 3, effect: { type: 'stun', value: 2, duration: 1 },
    healPct: 0,
    desc: '蛛丝缚敌手足，造成60%伤害并眩晕2回合。',
    cost: { exp: 500 }, sect: 'wudu',
    battleTip: '长时间眩晕',
  },
  wudu_5_poison_array: {
    id: 'wudu_5_poison_array', name: '五毒阵', icon: '☠️', type: 'attack', target: 'enemy',
    mp: 30, hit: 1, powerMul: 2.2, defPen: 0.45,
    cooldown: 4, effect: { type: 'strong_poison', value: 8, duration: 4 },
    healPct: 0,
    desc: '五毒齐出布阵绞杀，造成220%伤害并剧毒4回合。',
    cost: { exp: 600 }, sect: 'wudu',
    battleTip: '大伤害+剧毒',
  },

  // ══════════════════════════════════════
  //  血刀门 (xuedao) — P6 Batch 4
  // ══════════════════════════════════════
  xuedao_blade_basic: {
    id: 'xuedao_blade_basic', name: '血刀基础', icon: '🗡️', type: 'attack', target: 'enemy',
    mp: 5, hit: 1, powerMul: 1.0, defPen: 0.3,
    cooldown: 0, effect: null, healPct: 0,
    desc: '血刀门入门刀法，凶悍凌厉。',
    cost: { exp: 0 }, sect: 'xuedao',
    battleTip: '基础攻击',
  },
  xuedao_blood_qi: {
    id: 'xuedao_blood_qi', name: '血煞功', icon: '🩸', type: 'passive', target: 'self',
    mp: 0, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 0, effect: { type: 'buff_atk', value: 12, duration: 99 },
    healPct: 0,
    desc: '【被动】血煞入体激发凶性，攻击+12%。',
    cost: { exp: 0 }, sect: 'xuedao',
    battleTip: '被动·攻击↑12%',
  },
  xuedao_blood_slash: {
    id: 'xuedao_blood_slash', name: '血斩', icon: '🩸', type: 'attack', target: 'enemy',
    mp: 14, hit: 1, powerMul: 1.3, defPen: 0.35,
    cooldown: 0, effect: null, healPct: 5,
    desc: '以敌之血补己之气，造成130%伤害并恢复5%气血。',
    cost: { exp: 100 }, sect: 'xuedao',
    battleTip: '吸血·5%',
  },
  xuedao_blood_thirst: {
    id: 'xuedao_blood_thirst', name: '嗜血步', icon: '👣', type: 'support', target: 'self',
    mp: 10, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 3, effect: { type: 'evade', value: 20, duration: 3 },
    healPct: 0,
    desc: '嗜血欲望激发潜能，3回合内闪避+20%。',
    cost: { exp: 100 }, sect: 'xuedao',
    battleTip: '闪避↑20%·3回合',
  },
  xuedao_blood_rain: {
    id: 'xuedao_blood_rain', name: '血雨刀', icon: '🌧️', type: 'attack', target: 'enemy',
    mp: 20, hit: 2, powerMul: 0.8, defPen: 0.35,
    cooldown: 1, effect: null, healPct: 0,
    desc: '刀光如血雨倾盆，二连击各造成80%攻击伤害。',
    cost: { exp: 200 }, sect: 'xuedao',
    battleTip: '二连击',
  },
  xuedao_blood_armor: {
    id: 'xuedao_blood_armor', name: '血铠功', icon: '🛡️', type: 'support', target: 'self',
    mp: 15, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 4, effect: { type: 'def_boost', value: 25, duration: 3 },
    healPct: 0,
    desc: '以血化铠覆盖周身，3回合内防御+25%。',
    cost: { exp: 200 }, sect: 'xuedao',
    battleTip: '防御↑25%',
  },
  xuedao_blood_craze: {
    id: 'xuedao_blood_craze', name: '血狂刀', icon: '💥', type: 'attack', target: 'enemy',
    mp: 28, hit: 1, powerMul: 2.5, defPen: 0.5,
    cooldown: 3, effect: null, healPct: -10,
    desc: '燃烧气血挥出癫狂一刀，造成250%伤害但自损10%气血。',
    cost: { exp: 500 }, sect: 'xuedao',
    battleTip: '超大伤害·自损10%',
  },
  xuedao_blood_sea: {
    id: 'xuedao_blood_sea', name: '血海刀', icon: '🌊', type: 'attack', target: 'enemy',
    mp: 35, hit: 1, powerMul: 2.0, defPen: 0.45,
    cooldown: 3, effect: { type: 'stun', value: 1, duration: 1 },
    healPct: 0,
    desc: '刀意如血海滔天，造成200%伤害并眩晕1回合。',
    cost: { exp: 600 }, sect: 'xuedao',
    battleTip: '大伤害+眩晕',
  },

  // ══════════════════════════════════════
  //  海沙派 (haisha) — P6 Batch 4
  // ══════════════════════════════════════
  haisha_palm_basic: {
    id: 'haisha_palm_basic', name: '海沙基础掌', icon: '✋', type: 'attack', target: 'enemy',
    mp: 5, hit: 1, powerMul: 1.0, defPen: 0.3,
    cooldown: 0, effect: null, healPct: 0,
    desc: '海沙派入门掌法，掌风含沙。',
    cost: { exp: 0 }, sect: 'haisha',
    battleTip: '基础攻击',
  },
  haisha_tide_qi: {
    id: 'haisha_tide_qi', name: '海潮功', icon: '🌊', type: 'passive', target: 'self',
    mp: 0, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 0, effect: { type: 'regen_mp', value: 3, duration: 99 },
    healPct: 0,
    desc: '【被动】海潮之力生生不息，每回合恢复3点内力。',
    cost: { exp: 0 }, sect: 'haisha',
    battleTip: '被动·内力回复',
  },
  haisha_sand_palm: {
    id: 'haisha_sand_palm', name: '飞沙掌', icon: '💨', type: 'attack', target: 'enemy',
    mp: 12, hit: 1, powerMul: 1.2, defPen: 0.35,
    cooldown: 0, effect: { type: 'stun', value: 1, duration: 1 },
    healPct: 0,
    desc: '掌风卷起飞沙迷眼，造成120%伤害并有概率眩晕。',
    cost: { exp: 100 }, sect: 'haisha',
    battleTip: '中伤害·短眩晕',
  },
  haisha_water_step: {
    id: 'haisha_water_step', name: '踏浪步', icon: '🌊', type: 'support', target: 'self',
    mp: 10, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 3, effect: { type: 'evade', value: 20, duration: 3 },
    healPct: 0,
    desc: '如踏海浪而行，3回合内闪避+20%。',
    cost: { exp: 100 }, sect: 'haisha',
    battleTip: '闪避↑20%·3回合',
  },
  haisha_wave_palm: {
    id: 'haisha_wave_palm', name: '浪潮掌', icon: '🌊', type: 'attack', target: 'enemy',
    mp: 18, hit: 2, powerMul: 0.75, defPen: 0.3,
    cooldown: 1, effect: null, healPct: 0,
    desc: '掌势如海浪层层叠叠，二连击各造成75%攻击伤害。',
    cost: { exp: 200 }, sect: 'haisha',
    battleTip: '二连击',
  },
  haisha_sea_guard: {
    id: 'haisha_sea_guard', name: '海神护体', icon: '🔱', type: 'support', target: 'self',
    mp: 15, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 4, effect: { type: 'def_boost', value: 25, duration: 3 },
    healPct: 0,
    desc: '请海神之力护身，3回合内防御+25%。',
    cost: { exp: 200 }, sect: 'haisha',
    battleTip: '防御↑25%·3回合',
  },
  haisha_tsunami: {
    id: 'haisha_tsunami', name: '海啸掌', icon: '🌊', type: 'attack', target: 'enemy',
    mp: 28, hit: 1, powerMul: 2.2, defPen: 0.45,
    cooldown: 3, effect: null, healPct: 0,
    desc: '掌力如海啸席卷，造成220%攻击伤害。',
    cost: { exp: 500 }, sect: 'haisha',
    battleTip: '大伤害',
  },
  haisha_whirlpool: {
    id: 'haisha_whirlpool', name: '漩涡掌', icon: '🌀', type: 'attack', target: 'enemy',
    mp: 32, hit: 1, powerMul: 1.8, defPen: 0.4,
    cooldown: 3, effect: { type: 'stun', value: 2, duration: 1 },
    healPct: 0,
    desc: '掌劲化为漩涡困锁敌人，造成180%伤害并眩晕2回合。',
    cost: { exp: 600 }, sect: 'haisha',
    battleTip: '中伤害+长眩晕',
  },

  // ═══════════════════════════════════════════════════════════
  //  叛军（rebels）—— 军阵实战武学
  //  定位：强攻 · 防守 · 游击
  // ═══════════════════════════════════════════════════════════

  // ── 叛军 · 炼气期 ──
  rebel_fist: {
    id: 'rebel_fist', name: '军体拳', icon: '👊', type: 'attack', target: 'enemy',
    mp: 8, hit: 1, powerMul: 1.7, defPen: 0.7,
    cooldown: 0, effect: null, healPct: 0,
    desc: '军中基础拳法，简洁凌厉，造成170%攻击伤害。千锤百炼，不花哨但致命。',
    cost: { exp: 0 }, sect: 'rebels',
    battleTip: '基础攻击·低消耗',
  },
  rebel_war_qi: {
    id: 'rebel_war_qi', name: '战气诀', icon: '⚔️', type: 'passive', target: 'self',
    mp: 0, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 0, effect: { type: 'regen_mp', value: 4, duration: 99 },
    healPct: 0,
    desc: '【被动】沙场杀意凝聚成气，每回合恢复4点内力。越战越勇，死战不退。',
    cost: { exp: 0 }, sect: 'rebels',
    battleTip: '被动·内力续航',
  },
  rebel_scout_step: {
    id: 'rebel_scout_step', name: '斥候步', icon: '👣', type: 'support', target: 'self',
    mp: 14, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 2, effect: { type: 'evade', value: 0.40, duration: 1 },
    healPct: 0,
    desc: '斥候潜行之术，身法轻灵，提升40%闪避率1回合。游击战之根基。',
    cost: { exp: 80 }, sect: 'rebels',
    battleTip: '闪避·游击核心',
  },
  rebel_spear: {
    id: 'rebel_spear', name: '破阵枪', icon: '🔱', type: 'attack', target: 'enemy',
    mp: 18, hit: 1, powerMul: 1.5, defPen: 0.85,
    cooldown: 1, effect: null, healPct: 0,
    desc: '长枪破阵，专克重甲。造成150%攻击伤害，极高破防。',
    cost: { exp: 120 }, sect: 'rebels',
    battleTip: '破甲·克制重防',
  },

  // ── 叛军 · 筑基期 ──
  rebel_iron_bone: {
    id: 'rebel_iron_bone', name: '铁骨功', icon: '🦴', type: 'passive', target: 'self',
    mp: 0, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 0, effect: { type: 'def_boost', value: 12, duration: 99 },
    healPct: 0,
    desc: '【被动】经年征战铸就钢筋铁骨，永久提升12点防御。',
    cost: { exp: 250 }, sect: 'rebels',
    battleTip: '被动·铁壁',
  },
  rebel_siege: {
    id: 'rebel_siege', name: '攻城术', icon: '🏰', type: 'support', target: 'self',
    mp: 20, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 3, effect: { type: 'buff_atk', value: 18, duration: 3 },
    healPct: 0,
    desc: '攻城略地之势，攻击力提升18点持续3回合。',
    cost: { exp: 300 }, sect: 'rebels',
    battleTip: '攻击增益',
  },
  rebel_counter: {
    id: 'rebel_counter', name: '反击拳', icon: '💢', type: 'attack', target: 'enemy',
    mp: 22, hit: 1, powerMul: 1.4, defPen: 0.65,
    cooldown: 1, effect: { type: 'def_boost', value: 8, duration: 2 },
    healPct: 0,
    desc: '防守反击，造成140%伤害并获得8点防御2回合。',
    cost: { exp: 280 }, sect: 'rebels',
    battleTip: '反击·攻守兼备',
  },
  rebel_beacon: {
    id: 'rebel_beacon', name: '烽火令', icon: '🔥', type: 'support', target: 'self',
    mp: 24, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 3, effect: { type: 'buff_atk', value: 25, duration: 2 },
    healPct: 0,
    desc: '烽火为号，众志一心。攻击力提升25点持续2回合。',
    cost: { exp: 350 }, sect: 'rebels',
    battleTip: '强力攻击增益',
  },

  // ── 叛军 · 结丹期 ──
  rebel_blood_war: {
    id: 'rebel_blood_war', name: '血战诀', icon: '🩸', type: 'passive', target: 'self',
    mp: 0, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 0, effect: { type: 'regen_mp', value: 10, duration: 99 },
    healPct: 0,
    desc: '【被动】浴血奋战，愈战愈强。每回合恢复10点内力，气血恢复+15%。',
    cost: { exp: 500 }, sect: 'rebels',
    battleTip: '被动·高阶内力引擎',
  },
  rebel_flanking: {
    id: 'rebel_flanking', name: '合围掌', icon: '🤝', type: 'attack', target: 'enemy',
    mp: 28, hit: 3, powerMul: 0.55, defPen: 0.6,
    cooldown: 1, effect: null, healPct: 0,
    desc: '左右夹击，三连击各55%攻击伤害。围点打援，逐一击破。',
    cost: { exp: 550 }, sect: 'rebels',
    battleTip: '三连击·压制',
  },
  rebel_rearguard: {
    id: 'rebel_rearguard', name: '断后诀', icon: '🛡️', type: 'support', target: 'self',
    mp: 30, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 3, effect: { type: 'def_boost', value: 25, duration: 3 },
    healPct: 0,
    desc: '断后死守之志，防御提升25点持续3回合。一夫当关，万夫莫开。',
    cost: { exp: 600 }, sect: 'rebels',
    battleTip: '强力防御增益',
  },
  rebel_war_sweep: {
    id: 'rebel_war_sweep', name: '横扫千军', icon: '⚔️', type: 'attack', target: 'enemy',
    mp: 40, hit: 1, powerMul: 2.4, defPen: 0.55,
    cooldown: 3, effect: { type: 'weaken_def', value: 12, duration: 2 },
    healPct: 0,
    desc: '横扫之势不可挡，造成240%攻击伤害并降低敌方防御12点2回合。',
    cost: { exp: 800 }, sect: 'rebels',
    battleTip: '爆发·破防连招',
  },

  // ═══════════════════════════════════════════════════════════
  //  朝廷（imperial_court）—— 官威正法
  //  定位：正统 · 控制 · 刚猛
  // ═══════════════════════════════════════════════════════════

  // ── 朝廷 · 炼气期 ──
  court_fist: {
    id: 'court_fist', name: '正步拳', icon: '👊', type: 'attack', target: 'enemy',
    mp: 8, hit: 1, powerMul: 1.6, defPen: 0.7,
    cooldown: 0, effect: null, healPct: 0,
    desc: '正步出拳，堂堂正正。造成160%攻击伤害。官家武学之入门根基。',
    cost: { exp: 0 }, sect: 'imperial_court',
    battleTip: '基础攻击',
  },
  court_authority_qi: {
    id: 'court_authority_qi', name: '官气诀', icon: '📜', type: 'passive', target: 'self',
    mp: 0, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 0, effect: { type: 'regen_mp', value: 5, duration: 99 },
    healPct: 0,
    desc: '【被动】官威化气，每回合恢复5点内力。身在庙堂，气运加身。',
    cost: { exp: 0 }, sect: 'imperial_court',
    battleTip: '被动·内力回复',
  },
  court_cane: {
    id: 'court_cane', name: '廷杖术', icon: '🦯', type: 'attack', target: 'enemy',
    mp: 16, hit: 1, powerMul: 1.4, defPen: 0.5,
    cooldown: 1, effect: { type: 'stun', value: 1, duration: 1 },
    healPct: 0,
    desc: '廷杖问责，杖下伏法。造成140%伤害，50%概率眩晕1回合。',
    cost: { exp: 100 }, sect: 'imperial_court',
    battleTip: '控制·眩晕概率',
  },
  court_ritual_step: {
    id: 'court_ritual_step', name: '朝礼步', icon: '🚶', type: 'support', target: 'self',
    mp: 14, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 2, effect: { type: 'evade', value: 0.42, duration: 1 },
    healPct: 0,
    desc: '朝堂进退有度，化为步法。提升42%闪避率1回合。',
    cost: { exp: 80 }, sect: 'imperial_court',
    battleTip: '闪避',
  },

  // ── 朝廷 · 筑基期 ──
  court_censor: {
    id: 'court_censor', name: '御史令', icon: '📋', type: 'control', target: 'enemy',
    mp: 20, hit: 1, powerMul: 0.6, defPen: 0.5,
    cooldown: 2, effect: { type: 'weaken_def', value: 15, duration: 3 },
    healPct: 0,
    desc: '御史弹劾，威严难当。造成60%伤害并降低敌方防御15点3回合。',
    cost: { exp: 250 }, sect: 'imperial_court',
    battleTip: '控制·大幅减防',
  },
  court_silk_guard: {
    id: 'court_silk_guard', name: '锦袍功', icon: '👘', type: 'passive', target: 'self',
    mp: 0, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 0, effect: { type: 'def_boost', value: 14, duration: 99 },
    healPct: 0,
    desc: '【被动】锦袍护体，内劲暗藏。永久提升14点防御。',
    cost: { exp: 280 }, sect: 'imperial_court',
    battleTip: '被动·防御',
  },
  court_arrest: {
    id: 'court_arrest', name: '锁拿术', icon: '🔗', type: 'control', target: 'enemy',
    mp: 24, hit: 1, powerMul: 0.8, defPen: 0.5,
    cooldown: 2, effect: { type: 'stun', value: 2, duration: 1 },
    healPct: 0,
    desc: '刑部锁拿之法，造成80%伤害并60%概率眩晕2回合。',
    cost: { exp: 320 }, sect: 'imperial_court',
    battleTip: '强控制·长眩晕',
  },
  court_spear: {
    id: 'court_spear', name: '禁军枪', icon: '🔱', type: 'attack', target: 'enemy',
    mp: 26, hit: 1, powerMul: 1.9, defPen: 0.7,
    cooldown: 1, effect: null, healPct: 0,
    desc: '禁军制式枪法，大开大合。造成190%攻击伤害。',
    cost: { exp: 350 }, sect: 'imperial_court',
    battleTip: '高伤害·低冷却',
  },

  // ── 朝廷 · 结丹期 ──
  court_gold_seal: {
    id: 'court_gold_seal', name: '金印掌', icon: '🔱', type: 'attack', target: 'enemy',
    mp: 32, hit: 1, powerMul: 2.2, defPen: 0.6,
    cooldown: 2, effect: { type: 'weaken_def', value: 10, duration: 2 },
    healPct: 0,
    desc: '金印落掌，如圣旨降临。造成220%伤害并降低防御10点2回合。',
    cost: { exp: 550 }, sect: 'imperial_court',
    battleTip: '高爆发·减防',
  },
  court_envoy: {
    id: 'court_envoy', name: '钦差令', icon: '🎖️', type: 'support', target: 'self',
    mp: 30, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 3, effect: { type: 'buff_atk', value: 22, duration: 3 },
    healPct: 0.1,
    desc: '钦差代天巡狩之威，攻击力提升22点3回合并恢复10%气血。',
    cost: { exp: 600 }, sect: 'imperial_court',
    battleTip: '增益+恢复',
  },
  court_iron_shield: {
    id: 'court_iron_shield', name: '铁券功', icon: '🛡️', type: 'support', target: 'self',
    mp: 28, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 3, effect: { type: 'def_boost', value: 30, duration: 3 },
    healPct: 0,
    desc: '丹书铁券，免死之誓。防御提升30点持续3回合。',
    cost: { exp: 580 }, sect: 'imperial_court',
    battleTip: '大防御增益',
  },
  court_grace: {
    id: 'court_grace', name: '皇恩术', icon: '✨', type: 'support', target: 'self',
    mp: 30, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 3, effect: null,
    healPct: 0.25,
    desc: '皇恩浩荡，天赐生机。恢复25%最大气血。',
    cost: { exp: 600 }, sect: 'imperial_court',
    battleTip: '大回复',
  },

  // ── 朝廷 · 元婴期 ──
  court_dragon_roar: {
    id: 'court_dragon_roar', name: '金殿龙吟', icon: '🐉', type: 'attack', target: 'enemy',
    mp: 38, hit: 1, powerMul: 2.5, defPen: 0.5,
    cooldown: 3, effect: { type: 'stun', value: 1, duration: 1 },
    healPct: 0,
    desc: '龙吟金殿，天子震怒。造成250%伤害并55%概率眩晕1回合。',
    cost: { exp: 800 }, sect: 'imperial_court',
    battleTip: '爆发·控制',
  },
  court_six_strike: {
    id: 'court_six_strike', name: '六部连击', icon: '⚔️', type: 'attack', target: 'enemy',
    mp: 42, hit: 3, powerMul: 0.75, defPen: 0.55,
    cooldown: 2, effect: null, healPct: 0,
    desc: '六部协同，三连击各75%攻击伤害。吏户礼兵刑工，环环相扣。',
    cost: { exp: 900 }, sect: 'imperial_court',
    battleTip: '三连击·高总伤',
  },
  court_royal_blade: {
    id: 'court_royal_blade', name: '尚方斩', icon: '🗡️', type: 'attack', target: 'enemy',
    mp: 45, hit: 1, powerMul: 2.8, defPen: 0.65,
    cooldown: 3, effect: { type: 'weaken_def', value: 18, duration: 2 },
    healPct: 0,
    desc: '尚方宝剑，先斩后奏。造成280%攻击伤害并削弱防御18点2回合。',
    cost: { exp: 1000 }, sect: 'imperial_court',
    battleTip: '终极爆发·大破防',
  },
  court_heaven_sword: {
    id: 'court_heaven_sword', name: '天子剑', icon: '⚔️', type: 'attack', target: 'enemy',
    mp: 55, hit: 1, powerMul: 3.2, defPen: 0.7,
    cooldown: 4, effect: null, healPct: 0,
    desc: '天子一怒，伏尸百万。造成320%攻击伤害的超绝一击。',
    cost: { exp: 1200 }, sect: 'imperial_court',
    battleTip: '最强单体·长冷却',
  },

  // ═══════════════════════════════════════════════════════════
  //  魔教/黑月教（demon）—— 黑暗诡秘
  //  定位：吸血 · 削弱 · 暗杀
  // ═══════════════════════════════════════════════════════════

  // ── 魔教 · 炼气期 ──
  demon_claw: {
    id: 'demon_claw', name: '暗月爪', icon: '🌑', type: 'attack', target: 'enemy',
    mp: 9, hit: 1, powerMul: 1.65, defPen: 0.7,
    cooldown: 0, effect: null, healPct: 0,
    desc: '五指如钩，如暗月划空。造成165%攻击伤害。魔教入门杀招。',
    cost: { exp: 0 }, sect: 'demon',
    battleTip: '基础攻击',
  },
  demon_heart: {
    id: 'demon_heart', name: '魔心诀', icon: '🖤', type: 'passive', target: 'self',
    mp: 0, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 0, effect: { type: 'regen_mp', value: 5, duration: 99 },
    healPct: 0,
    desc: '【被动】魔心暗种，每回合恢复5点内力。魔道根基，以心入武。',
    cost: { exp: 0 }, sect: 'demon',
    battleTip: '被动·内力回复',
  },
  demon_soul_gaze: {
    id: 'demon_soul_gaze', name: '摄魂眼', icon: '👁️', type: 'control', target: 'enemy',
    mp: 16, hit: 1, powerMul: 0.4, defPen: 0.5,
    cooldown: 2, effect: { type: 'weaken_def', value: 12, duration: 3 },
    healPct: 0,
    desc: '双目如电，摄人心魄。造成40%伤害并降低敌方防御12点3回合。',
    cost: { exp: 100 }, sect: 'demon',
    battleTip: '控制·大幅减防',
  },
  demon_shadow_dodge: {
    id: 'demon_shadow_dodge', name: '影遁步', icon: '🌑', type: 'support', target: 'self',
    mp: 15, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 2, effect: { type: 'evade', value: 0.45, duration: 1 },
    healPct: 0,
    desc: '化影而行，诡异难测。提升45%闪避率1回合。',
    cost: { exp: 80 }, sect: 'demon',
    battleTip: '高闪避',
  },

  // ── 魔教 · 筑基期 ──
  demon_drain: {
    id: 'demon_drain', name: '噬血掌', icon: '🩸', type: 'attack', target: 'enemy',
    mp: 22, hit: 1, powerMul: 1.5, defPen: 0.6,
    cooldown: 1, effect: null, healPct: 0.15,
    desc: '掌力透体，噬血夺元。造成150%伤害并恢复自身15%气血。',
    cost: { exp: 280 }, sect: 'demon',
    battleTip: '吸血攻击',
  },
  demon_body: {
    id: 'demon_body', name: '魔体功', icon: '💪', type: 'passive', target: 'self',
    mp: 0, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 0, effect: { type: 'def_boost', value: 12, duration: 99 },
    healPct: 0,
    desc: '【被动】魔气淬体，筋骨变异。永久提升12点防御。',
    cost: { exp: 300 }, sect: 'demon',
    battleTip: '被动·防御',
  },
  demon_slash: {
    id: 'demon_slash', name: '黑月斩', icon: '🌙', type: 'attack', target: 'enemy',
    mp: 28, hit: 1, powerMul: 2.0, defPen: 0.55,
    cooldown: 2, effect: null, healPct: 0,
    desc: '月光漆黑如墨，斩破长空。造成200%攻击伤害。简洁而致命。',
    cost: { exp: 350 }, sect: 'demon',
    battleTip: '高爆发',
  },
  demon_confuse: {
    id: 'demon_confuse', name: '惑心术', icon: '🌀', type: 'control', target: 'enemy',
    mp: 24, hit: 1, powerMul: 0.6, defPen: 0.4,
    cooldown: 2, effect: { type: 'stun', value: 2, duration: 1 },
    healPct: 0,
    desc: '惑乱心神，令敌自乱阵脚。造成60%伤害并65%概率眩晕2回合。',
    cost: { exp: 320 }, sect: 'demon',
    battleTip: '强控制·长眩晕',
  },

  // ── 魔教 · 结丹期 ──
  demon_devour: {
    id: 'demon_devour', name: '万魔噬', icon: '👹', type: 'attack', target: 'enemy',
    mp: 34, hit: 3, powerMul: 0.5, defPen: 0.5,
    cooldown: 1, effect: null, healPct: 0.08,
    desc: '魔影万千，三连击各50%攻击伤害，每击恢复8%气血。',
    cost: { exp: 550 }, sect: 'demon',
    battleTip: '三连吸血',
  },
  demon_realm: {
    id: 'demon_realm', name: '黑月领域', icon: '🖤', type: 'control', target: 'enemy',
    mp: 32, hit: 1, powerMul: 0.7, defPen: 0.45,
    cooldown: 3, effect: { type: 'weaken_def', value: 20, duration: 3 },
    healPct: 0,
    desc: '黑月降世，领域笼罩。造成70%伤害并大幅降低敌方防御20点3回合。',
    cost: { exp: 600 }, sect: 'demon',
    battleTip: '极大减防',
  },
  demon_soul_enhance: {
    id: 'demon_soul_enhance', name: '魔魂附', icon: '💀', type: 'support', target: 'self',
    mp: 30, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 3, effect: { type: 'buff_atk', value: 28, duration: 3 },
    healPct: 0,
    desc: '魔魂附体，战力飙升。攻击力提升28点持续3回合。',
    cost: { exp: 580 }, sect: 'demon',
    battleTip: '强力攻击增益',
  },
  demon_purgatory: {
    id: 'demon_purgatory', name: '魔狱斩', icon: '🔥', type: 'attack', target: 'enemy',
    mp: 48, hit: 1, powerMul: 2.6, defPen: 0.5,
    cooldown: 3, effect: { type: 'stun', value: 1, duration: 1 },
    healPct: 0,
    desc: '魔狱降临，焚尽万物。造成260%伤害并50%概率眩晕1回合。',
    cost: { exp: 800 }, sect: 'demon',
    battleTip: '终极爆发+控制',
  },

  // ═══════════════════════════════════════════════════════════
  //  逍遥派（xiaoyao）—— 飘逸灵动
  //  定位：闪避 · 吸内 · 莫测
  // ═══════════════════════════════════════════════════════════

  // ── 逍遥派 · 炼气期 ──
  xiaoyao_fist: {
    id: 'xiaoyao_fist', name: '凌波拳', icon: '🌊', type: 'attack', target: 'enemy',
    mp: 9, hit: 1, powerMul: 1.6, defPen: 0.65,
    cooldown: 0, effect: null, healPct: 0,
    desc: '拳如波浪起伏，飘逸无常。造成160%攻击伤害。',
    cost: { exp: 0 }, sect: 'xiaoyao',
    battleTip: '基础攻击',
  },
  xiaoyao_free_qi: {
    id: 'xiaoyao_free_qi', name: '逍遥气', icon: '🍃', type: 'passive', target: 'self',
    mp: 0, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 0, effect: { type: 'regen_mp', value: 5, duration: 99 },
    healPct: 0,
    desc: '【被动】逍遥天地，真气自生。每回合恢复5点内力。',
    cost: { exp: 0 }, sect: 'xiaoyao',
    battleTip: '被动·内力回复',
  },
  xiaoyao_wind_walk: {
    id: 'xiaoyao_wind_walk', name: '御风步', icon: '💨', type: 'support', target: 'self',
    mp: 14, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 2, effect: { type: 'evade', value: 0.45, duration: 1 },
    healPct: 0,
    desc: '御风而行，飘忽无定。提升45%闪避率1回合。',
    cost: { exp: 80 }, sect: 'xiaoyao',
    battleTip: '高闪避',
  },
  xiaoyao_flower_hand: {
    id: 'xiaoyao_flower_hand', name: '折梅手', icon: '🌸', type: 'attack', target: 'enemy',
    mp: 16, hit: 2, powerMul: 0.65, defPen: 0.6,
    cooldown: 0, effect: null, healPct: 0,
    desc: '轻巧如折梅，两连击各65%攻击伤害。出手看似轻柔实则暗藏劲力。',
    cost: { exp: 100 }, sect: 'xiaoyao',
    battleTip: '二连击',
  },

  // ── 逍遥派 · 筑基期 ──
  xiaoyao_absorb: {
    id: 'xiaoyao_absorb', name: '吞海功', icon: '🌊', type: 'attack', target: 'enemy',
    mp: 18, hit: 1, powerMul: 1.4, defPen: 0.5,
    cooldown: 1, effect: { type: 'regen_mp', value: 12, duration: 1 },
    healPct: 0,
    desc: '海纳百川，吸敌内力。造成140%伤害并回复12点内力。',
    cost: { exp: 280 }, sect: 'xiaoyao',
    battleTip: '吸内攻击',
  },
  xiaoyao_snow_palm: {
    id: 'xiaoyao_snow_palm', name: '天山掌', icon: '❄️', type: 'attack', target: 'enemy',
    mp: 26, hit: 1, powerMul: 2.0, defPen: 0.55,
    cooldown: 2, effect: { type: 'weaken_def', value: 10, duration: 2 },
    healPct: 0,
    desc: '天山寒气凝于掌，造成200%伤害并降低防御10点2回合。',
    cost: { exp: 350 }, sect: 'xiaoyao',
    battleTip: '高伤害·减防',
  },
  xiaoyao_wander: {
    id: 'xiaoyao_wander', name: '逍遥游', icon: '🦅', type: 'support', target: 'self',
    mp: 22, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 3, effect: { type: 'evade', value: 0.55, duration: 2 },
    healPct: 0,
    desc: '天地任逍遥，提升55%闪避率2回合。敌招落空，自在从容。',
    cost: { exp: 320 }, sect: 'xiaoyao',
    battleTip: '极限闪避',
  },
  xiaoyao_void_heart: {
    id: 'xiaoyao_void_heart', name: '虚谷心', icon: '🏔️', type: 'passive', target: 'self',
    mp: 0, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 0, effect: { type: 'def_boost', value: 10, duration: 99 },
    healPct: 0,
    desc: '【被动】虚怀若谷，心空如镜。永久提升10点防御，受击时内力额外恢复2点。',
    cost: { exp: 300 }, sect: 'xiaoyao',
    battleTip: '被动·防御',
  },

  // ── 逍遥派 · 结丹期 ──
  xiaoyao_silk_step: {
    id: 'xiaoyao_silk_step', name: '凌波微步', icon: '🦋', type: 'support', target: 'self',
    mp: 28, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 3, effect: { type: 'evade', value: 0.65, duration: 2 },
    healPct: 0,
    desc: '步法精妙绝伦，身如飘絮，提升65%闪避率2回合。',
    cost: { exp: 600 }, sect: 'xiaoyao',
    battleTip: '极限闪避',
  },
  xiaoyao_sun_palm: {
    id: 'xiaoyao_sun_palm', name: '六阳掌', icon: '☀️', type: 'attack', target: 'enemy',
    mp: 36, hit: 1, powerMul: 2.4, defPen: 0.6,
    cooldown: 2, effect: null, healPct: 0,
    desc: '六阳真气凝聚一掌，造成240%攻击伤害。阳刚之势，无可阻挡。',
    cost: { exp: 700 }, sect: 'xiaoyao',
    battleTip: '高爆发',
  },
  xiaoyao_fate_seal: {
    id: 'xiaoyao_fate_seal', name: '生死符', icon: '🔮', type: 'control', target: 'enemy',
    mp: 34, hit: 1, powerMul: 1.0, defPen: 0.5,
    cooldown: 3, effect: { type: 'stun', value: 2, duration: 1 },
    healPct: 0,
    desc: '阴阳生死尽在符中，造成100%伤害并60%概率眩晕2回合。',
    cost: { exp: 650 }, sect: 'xiaoyao',
    battleTip: '控制·长眩晕',
  },
  xiaoyao_unity: {
    id: 'xiaoyao_unity', name: '八荒功', icon: '☯️', type: 'support', target: 'self',
    mp: 38, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 4, effect: { type: 'buff_atk', value: 30, duration: 3 },
    healPct: 0.15,
    desc: '八荒六合唯我独尊，攻击力提升30点3回合，恢复15%气血。',
    cost: { exp: 800 }, sect: 'xiaoyao',
    battleTip: '终极增益+恢复',
  },
};

/**
 * 运行时校验技能平衡性。仅在开发环境 console.warn 输出异常。
 */
export function validateSkills(): { warnings: string[]; summary: string } {
  const warnings: string[] = [];
  const allSkills = Object.values(SKILLS);

  // 技能总数
  warnings.push(`[INFO] 技能总数：${allSkills.length}`);

  // 1. MP 消耗校验
  for (const s of allSkills) {
    if (s.mp < 0) warnings.push(`[MP] ${s.id}: MP 消耗为负值 ${s.mp}`);
    if (s.mp > 80) warnings.push(`[MP] ${s.id}: MP 消耗过高 ${s.mp}`);
    if (s.mp === 0 && s.type === 'attack' && s.powerMul > 1.5)
      warnings.push(`[MP] ${s.id}: 高伤害攻击技 MP 为 0`);
  }

  // 2. powerMul 校验
  for (const s of allSkills) {
    if (s.type === 'attack' && s.powerMul <= 0)
      warnings.push(`[DMG] ${s.id}: 攻击技 powerMul 为 ${s.powerMul}`);
    if (s.powerMul > 4.0)
      warnings.push(`[DMG] ${s.id}: powerMul 异常高 ${s.powerMul}`);
    if (s.type !== 'attack' && s.powerMul > 2.0)
      warnings.push(`[DMG] ${s.id}: 非攻击技 powerMul=${s.powerMul} 偏高`);
  }

  // 3. 命中率校验
  for (const s of allSkills) {
    if (s.hit < 60) warnings.push(`[HIT] ${s.id}: 命中率过低 ${s.hit}`);
    if (s.hit > 100) warnings.push(`[HIT] ${s.id}: 命中率超过 100`);
  }

  // 4. 冷却校验
  for (const s of allSkills) {
    if (s.cooldown < 0) warnings.push(`[CD] ${s.id}: 冷却为负值`);
    if (s.cooldown > 8) warnings.push(`[CD] ${s.id}: 冷却过长 ${s.cooldown}`);
  }

  // 5. 破防校验
  for (const s of allSkills) {
    if (s.defPen < 0) warnings.push(`[PEN] ${s.id}: 破防为负值`);
    if (s.defPen > 60) warnings.push(`[PEN] ${s.id}: 破防过高 ${s.defPen}`);
  }

  // 6. 宗门技能分布
  const sectStats: Record<string, { total: number; atk: number; sup: number; ctrl: number; pas: number }> = {};
  for (const s of allSkills) {
    const sect = s.sect || 'none';
    if (!sectStats[sect]) sectStats[sect] = { total: 0, atk: 0, sup: 0, ctrl: 0, pas: 0 };
    sectStats[sect]!.total++;
    if (s.type === 'attack') sectStats[sect]!.atk++;
    else if (s.type === 'support') sectStats[sect]!.sup++;
    else if (s.type === 'control') sectStats[sect]!.ctrl++;
    else sectStats[sect]!.pas++;
  }
  for (const [sect, stat] of Object.entries(sectStats)) {
    if (stat.total < 8 && sect !== 'none')
      warnings.push(`[SECT] ${sect}: 技能数不足 ${stat.total}（建议≥8）`);
    if (stat.atk < stat.total * 0.25)
      warnings.push(`[SECT] ${sect}: 攻击技占比低 ${stat.atk}/${stat.total}`);
    if (stat.total > 0 && stat.atk > stat.total * 0.7)
      warnings.push(`[SECT] ${sect}: 攻击技占比过高 ${stat.atk}/${stat.total}`);
  }

  // 7. 治疗技校验
  const healSkills = allSkills.filter(s => s.healPct > 0);
  for (const s of healSkills) {
    if (s.healPct > 60) warnings.push(`[HEAL] ${s.id}: 治疗比例过高 ${s.healPct}%`);
    if (s.mp === 0 && s.healPct > 30) warnings.push(`[HEAL] ${s.id}: 高治疗技能 MP 为 0`);
  }

  const summary = warnings.join('\n');
  if (typeof console !== 'undefined' && warnings.length > 1) {
    console.log('%c[技能校验] %c' + warnings.length + ' 条',
      'color:#e87d72;font-weight:bold', 'color:inherit');
    warnings.forEach(w => {
      if (w.startsWith('[INFO]')) console.log('  ' + w);
      else console.warn('  ' + w);
    });
  }
  return { warnings, summary };
}

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