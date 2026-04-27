/**
 * src/data/fabao.ts — 法宝系统数据
 *
 * 法宝分为三大类：
 *   weapon    — 武器（主攻击加成）
 *   armor     — 衣服（主防御+气血加成）
 *   accessory — 饰品（特殊增益效果）
 *
 * 六大境界颜色：
 *   炼气·白色 → 筑基·绿色 → 结丹·蓝色 → 元婴·紫色 → 化神·金色 → 渡劫·红色
 *
 * 每个境界各 3 类 × 3 件 = 9 件，共 54 件法宝。
 * 当前为草拟版本，后续可根据剧情需要调整获取方式和数值。
 */

import type { FabaoId, FabaoData, FabaoRealm, FabaoType } from './types';
import { REALM_COLORS } from './types';

// ═══════════════════════════════════════════════════════════════
//  辅助工厂函数
// ═══════════════════════════════════════════════════════════════

function fabao(
  id: FabaoId,
  name: string,
  icon: string,
  type: FabaoType,
  realm: FabaoRealm,
  desc: string,
  opts: {
    atkBonus?: number;
    defBonus?: number;
    hpBonus?: number;
    specialEffect?: FabaoData['specialEffect'];
    obtain: string;
  },
): FabaoData {
  const rc = REALM_COLORS[realm];
  return {
    id,
    name,
    icon,
    type,
    realm,
    color: rc.color,
    colorCss: rc.css,
    desc,
    atkBonus: opts.atkBonus ?? 0,
    defBonus: opts.defBonus ?? 0,
    hpBonus: opts.hpBonus ?? 0,
    specialEffect: opts.specialEffect,
    obtain: opts.obtain,
    requireLevel: rc.levelRange[0],
  };
}

// ═══════════════════════════════════════════════════════════════
//  炼气期 · 白色 ⚪
// ═══════════════════════════════════════════════════════════════

const LIANQI_WEAPONS: Record<string, FabaoData> = {
  iron_sword: fabao(
    'iron_sword', '铁剑', '🗡️', 'weapon', 'lianqi',
    '凡铁所铸，剑身朴实无华，是江湖中最常见的兵器。',
    { atkBonus: 5, obtain: '武当外门入门即赠' },
  ),
  bamboo_staff: fabao(
    'bamboo_staff', '青竹杖', '🦯', 'weapon', 'lianqi',
    '武当后山青竹所制，轻盈坚韧，适合初学剑法者使用。',
    { atkBonus: 4, obtain: '武当后山砍柴小概率获得' },
  ),
  hunting_bow: fabao(
    'hunting_bow', '猎弓', '🏹', 'weapon', 'lianqi',
    '清河镇猎户常用的硬木弓，射程虽近但力道十足。',
    { atkBonus: 6, obtain: '清河镇杂货铺购买（20铜钱）' },
  ),
};

const LIANQI_ARMORS: Record<string, FabaoData> = {
  cloth_robe: fabao(
    'cloth_robe', '布衣道袍', '👘', 'armor', 'lianqi',
    '武当外门弟子的标准道袍，粗布缝制，胜在轻便。',
    { defBonus: 3, hpBonus: 10, obtain: '武当外门入门即赠' },
  ),
  leather_vest: fabao(
    'leather_vest', '皮坎肩', '🦺', 'armor', 'lianqi',
    '兽皮缝制的护身短褂，比布衣结实不少。',
    { defBonus: 5, hpBonus: 5, obtain: '苍岭山土匪掉落' },
  ),
  hemp_armor: fabao(
    'hemp_armor', '麻布护甲', '🥋', 'armor', 'lianqi',
    '多层麻布叠缝而成，虽粗糙但能挡些拳脚。',
    { defBonus: 4, hpBonus: 15, obtain: '日常任务·挑水小概率获得' },
  ),
};

const LIANQI_ACCESSORIES: Record<string, FabaoData> = {
  wooden_ring: fabao(
    'wooden_ring', '桃木戒', '💍', 'accessory', 'lianqi',
    '桃木削成的戒指，据说能辟邪安神，略微提升内力恢复。',
    { specialEffect: { type: 'mp_regen', value: 2, desc: '每回合额外恢复2点内力' }, obtain: '武当外门抄写道经获得' },
  ),
  copper_pendant: fabao(
    'copper_pendant', '铜钱坠', '🪙', 'accessory', 'lianqi',
    '用五枚铜钱串成的吊坠，寓意五路财神通达。',
    { specialEffect: { type: 'gold_boost', value: 10, desc: '战斗获得铜钱+10%' }, obtain: '清河镇杂货铺购买（30铜钱）' },
  ),
  talisman_paper: fabao(
    'talisman_paper', '护身符纸', '📿', 'accessory', 'lianqi',
    '武当道士所画的护身符，叠成三角随身携带。',
    { specialEffect: { type: 'crit_resist', value: 10, desc: '被暴击概率降低10%' }, obtain: '日常任务·打扫大殿小概率获得' },
  ),
};

// ═══════════════════════════════════════════════════════════════
//  筑基期 · 绿色 🟢
// ═══════════════════════════════════════════════════════════════

const ZHUJI_WEAPONS: Record<string, FabaoData> = {
  refined_sword: fabao(
    'refined_sword', '精钢剑', '⚔️', 'weapon', 'zhuji',
    '百炼精钢锻造，剑身泛着冷光，削铁如泥。',
    { atkBonus: 12, obtain: '武当内门晋升即赠' },
  ),
  jade_staff: fabao(
    'jade_staff', '碧玉杖', '🦯', 'weapon', 'zhuji',
    '镶嵌碧玉的短杖，内蕴一丝灵气，杖法威力倍增。',
    { atkBonus: 10, obtain: '武当内门试炼奖励' },
  ),
  spirit_bow: fabao(
    'spirit_bow', '灵木弓', '🏹', 'weapon', 'zhuji',
    '百年灵木为胎，弓弦以妖兽筋制成，射出的箭矢带有破风声。',
    { atkBonus: 14, obtain: '清河镇铁匠铺购买（80铜钱）' },
  ),
};

const ZHUJI_ARMORS: Record<string, FabaoData> = {
  silk_robe: fabao(
    'silk_robe', '丝质道袍', '👘', 'armor', 'zhuji',
    '内门弟子专属道袍，蚕丝织就，内衬软甲。',
    { defBonus: 10, hpBonus: 30, obtain: '武当内门晋升即赠' },
  ),
  iron_mail: fabao(
    'iron_mail', '锁子甲', '🛡️', 'armor', 'zhuji',
    '细密铁环编织而成，刀剑难伤，但稍显笨重。',
    { defBonus: 14, hpBonus: 15, obtain: '苍岭山寨宝库中获得' },
  ),
  spirit_vest: fabao(
    'spirit_vest', '灵丝背心', '🥋', 'armor', 'zhuji',
    '以灵蚕丝织成的贴身背心，轻若无物却坚韧异常。',
    { defBonus: 12, hpBonus: 25, obtain: '内门日常任务小概率获得' },
  ),
};

const ZHUJI_ACCESSORIES: Record<string, FabaoData> = {
  jade_ring: fabao(
    'jade_ring', '翠玉戒', '💍', 'accessory', 'zhuji',
    '上等翡翠雕琢的戒指，佩戴后心神宁静，内力运转更加流畅。',
    { specialEffect: { type: 'mp_regen', value: 5, desc: '每回合额外恢复5点内力' }, obtain: '武当内门抄写道经获得' },
  ),
  silver_pendant: fabao(
    'silver_pendant', '银锁坠', '🔒', 'accessory', 'zhuji',
    '银质长命锁，刻有太极八卦图，有护身之效。',
    { specialEffect: { type: 'hp_regen', value: 3, desc: '每回合恢复3点气血' }, obtain: '清河镇银铺购买（60铜钱）' },
  ),
  spirit_talisman: fabao(
    'spirit_talisman', '灵符', '📿', 'accessory', 'zhuji',
    '以朱砂在黄纸上绘制的灵符，注入了一丝筑基修士的真元。',
    { specialEffect: { type: 'def_boost_start', value: 5, desc: '战斗开始时防御+5，持续3回合' }, obtain: '陈静虚指点后获得' },
  ),
};

// ═══════════════════════════════════════════════════════════════
//  结丹期 · 蓝色 🔵
// ═══════════════════════════════════════════════════════════════

const JIEDAN_WEAPONS: Record<string, FabaoData> = {
  azure_sword: fabao(
    'azure_sword', '青冥剑', '⚔️', 'weapon', 'jiedan',
    '剑身如碧空之色，舞动时剑光如水，是武当真传弟子的标志。',
    { atkBonus: 22, obtain: '武当真传晋升即赠' },
  ),
  crystal_staff: fabao(
    'crystal_staff', '水晶拂尘', '🦯', 'weapon', 'jiedan',
    '水晶为柄、天蚕丝为须的拂尘，挥洒间灵气四溢。',
    { atkBonus: 20, obtain: '真传弟子试炼奖励' },
  ),
  storm_bow: fabao(
    'storm_bow', '风雷弓', '🏹', 'weapon', 'jiedan',
    '弓身刻有风雷符文，拉动弓弦时有隐隐雷鸣之声。',
    { atkBonus: 25, obtain: '清河镇铁匠铺购买（200铜钱）' },
  ),
};

const JIEDAN_ARMORS: Record<string, FabaoData> = {
  azure_robe: fabao(
    'azure_robe', '青冥道袍', '👘', 'armor', 'jiedan',
    '真传弟子的深蓝道袍，绣有云纹暗花，内蕴护体阵法。',
    { defBonus: 20, hpBonus: 60, obtain: '武当真传晋升即赠' },
  ),
  golden_mail: fabao(
    'golden_mail', '金丝软甲', '🛡️', 'armor', 'jiedan',
    '以金丝混合天蚕丝织成的软甲，刀枪不入且轻便灵活。',
    { defBonus: 25, hpBonus: 35, obtain: '第三章内门试炼奖励' },
  ),
  frost_vest: fabao(
    'frost_vest', '寒冰背心', '🥋', 'armor', 'jiedan',
    '以千年寒蚕丝织成，穿戴后周身清凉，对火属性攻击有额外抗性。',
    { defBonus: 22, hpBonus: 50, obtain: '后山修炼小概率获得' },
  ),
};

const JIEDAN_ACCESSORIES: Record<string, FabaoData> = {
  sapphire_ring: fabao(
    'sapphire_ring', '蓝宝石戒', '💍', 'accessory', 'jiedan',
    '镶嵌深海蓝宝石的戒指，能大幅提升内力运转速度。',
    { specialEffect: { type: 'mp_regen', value: 10, desc: '每回合额外恢复10点内力' }, obtain: '真传弟子抄写道经获得' },
  ),
  golden_pendant: fabao(
    'golden_pendant', '金锁坠', '🔒', 'accessory', 'jiedan',
    '纯金打造的长命锁，刻有真武大帝法相，辟邪护身。',
    { specialEffect: { type: 'hp_regen', value: 8, desc: '每回合恢复8点气血' }, obtain: '清河镇金铺购买（150铜钱）' },
  ),
  thunder_talisman: fabao(
    'thunder_talisman', '五雷符', '📿', 'accessory', 'jiedan',
    '以雷击木为底、朱砂混合妖兽血绘制的雷符，蕴含天雷之力。',
    { specialEffect: { type: 'crit_boost', value: 8, desc: '暴击率+8%' }, obtain: '陈静虚传授符箓之道后获得' },
  ),
};

// ═══════════════════════════════════════════════════════════════
//  元婴期 · 紫色 🟣
// ═══════════════════════════════════════════════════════════════

const YUANYING_WEAPONS: Record<string, FabaoData> = {
  void_blade: fabao(
    'void_blade', '虚空刃', '⚔️', 'weapon', 'yuanying',
    '以虚空陨铁锻造，剑身漆黑如夜，边缘泛着紫色幽光。',
    { atkBonus: 35, obtain: '元婴突破后门派赐予' },
  ),
  soul_staff: fabao(
    'soul_staff', '摄魂杖', '🦯', 'weapon', 'yuanying',
    '杖头镶嵌紫色魂晶，挥动时能扰乱敌人心神。',
    { atkBonus: 32, obtain: '元婴试炼奖励' },
  ),
  starfall_bow: fabao(
    'starfall_bow', '落星弓', '🏹', 'weapon', 'yuanying',
    '弓身以陨星玄铁打造，射出的箭矢带有星辰之力。',
    { atkBonus: 38, obtain: '清河镇铁匠铺购买（500铜钱）' },
  ),
};

const YUANYING_ARMORS: Record<string, FabaoData> = {
  void_robe: fabao(
    'void_robe', '虚空道袍', '👘', 'armor', 'yuanying',
    '元婴长老的紫黑道袍，绣有周天星斗图，自带护体罡气。',
    { defBonus: 32, hpBonus: 100, obtain: '元婴突破后门派赐予' },
  ),
  dragon_mail: fabao(
    'dragon_mail', '龙鳞甲', '🛡️', 'armor', 'yuanying',
    '以蛟龙鳞片缝制的战甲，防御力惊人，且带有龙威震慑。',
    { defBonus: 38, hpBonus: 60, obtain: '第四章蛟龙之战掉落' },
  ),
  star_vest: fabao(
    'star_vest', '星辰背心', '🥋', 'armor', 'yuanying',
    '以星陨丝织成的背心，轻如鸿毛，坚如磐石。',
    { defBonus: 35, hpBonus: 80, obtain: '后山修炼小概率获得' },
  ),
};

const YUANYING_ACCESSORIES: Record<string, FabaoData> = {
  amethyst_ring: fabao(
    'amethyst_ring', '紫晶戒', '💍', 'accessory', 'yuanying',
    '紫色水晶中封有一缕元婴真火，佩戴者内力如江河奔涌。',
    { specialEffect: { type: 'mp_regen', value: 18, desc: '每回合额外恢复18点内力' }, obtain: '元婴长老抄写道经获得' },
  ),
  dragon_pendant: fabao(
    'dragon_pendant', '龙纹玉佩', '🔒', 'accessory', 'yuanying',
    '刻有龙纹的羊脂白玉佩，蕴含一丝真龙之气。',
    { specialEffect: { type: 'hp_regen', value: 15, desc: '每回合恢复15点气血' }, obtain: '第四章剧情奖励' },
  ),
  void_talisman: fabao(
    'void_talisman', '虚空符', '📿', 'accessory', 'yuanying',
    '以虚空之力绘制的符箓，能让持有者在危急时遁入虚空一瞬。',
    { specialEffect: { type: 'evade_start', value: 25, desc: '战斗开始时获得25%闪避，持续2回合' }, obtain: '陈静虚传授虚空符法后获得' },
  ),
};

// ═══════════════════════════════════════════════════════════════
//  化神期 · 金色 🟡
// ═══════════════════════════════════════════════════════════════

const HUASHEN_WEAPONS: Record<string, FabaoData> = {
  celestial_sword: fabao(
    'celestial_sword', '天罡剑', '⚔️', 'weapon', 'huashen',
    '以天外玄金锻造，剑身刻有三十六天罡星图，挥动时金光万丈。',
    { atkBonus: 55, obtain: '化神突破后门派赐予' },
  ),
  dao_staff: fabao(
    'dao_staff', '大道杖', '🦯', 'weapon', 'huashen',
    '以万年道木为杖身，杖头镶嵌舍利子，蕴含大道至理。',
    { atkBonus: 50, obtain: '化神试炼奖励' },
  ),
  sun_bow: fabao(
    'sun_bow', '金乌弓', '🏹', 'weapon', 'huashen',
    '传说以金乌落羽为弦的神弓，射出的箭矢如烈日灼空。',
    { atkBonus: 60, obtain: '清河镇铁匠铺购买（1500铜钱）' },
  ),
};

const HUASHEN_ARMORS: Record<string, FabaoData> = {
  celestial_robe: fabao(
    'celestial_robe', '天罡道袍', '👘', 'armor', 'huashen',
    '化神尊者的金色道袍，绣有日月星辰，万法不侵。',
    { defBonus: 50, hpBonus: 180, obtain: '化神突破后门派赐予' },
  ),
  divine_mail: fabao(
    'divine_mail', '神御甲', '🛡️', 'armor', 'huashen',
    '以天界神铁锻造的战甲，防御力超凡入圣。',
    { defBonus: 58, hpBonus: 100, obtain: '第五章剧情奖励' },
  ),
  sun_vest: fabao(
    'sun_vest', '日轮背心', '🥋', 'armor', 'huashen',
    '以太阳真火丝织成的背心，穿戴后周身暖意融融，气血自生。',
    { defBonus: 54, hpBonus: 140, obtain: '后山修炼小概率获得' },
  ),
};

const HUASHEN_ACCESSORIES: Record<string, FabaoData> = {
  divine_ring: fabao(
    'divine_ring', '神谕戒', '💍', 'accessory', 'huashen',
    '戒面刻有上古神文，佩戴者可聆听大道之音，内力生生不息。',
    { specialEffect: { type: 'mp_regen', value: 30, desc: '每回合额外恢复30点内力' }, obtain: '化神尊者抄写道经获得' },
  ),
  phoenix_pendant: fabao(
    'phoenix_pendant', '凤凰佩', '🔒', 'accessory', 'huashen',
    '以凤凰涅槃时掉落的尾羽炼制的玉佩，蕴含重生之力。',
    { specialEffect: { type: 'revive_once', value: 30, desc: '首次阵亡时以30%气血复活（每场战斗一次）' }, obtain: '第五章剧情奖励' },
  ),
  celestial_talisman: fabao(
    'celestial_talisman', '天符', '📿', 'accessory', 'huashen',
    '以天道法则书写的符箓，蕴含天地至理。',
    { specialEffect: { type: 'all_boost', value: 8, desc: '全属性+8' }, obtain: '陈静虚传授天符之道后获得' },
  ),
};

// ═══════════════════════════════════════════════════════════════
//  渡劫期 · 红色 🔴
// ═══════════════════════════════════════════════════════════════

const DUJIE_WEAPONS: Record<string, FabaoData> = {
  tribulation_blade: fabao(
    'tribulation_blade', '天劫刃', '⚔️', 'weapon', 'dujie',
    '以天劫雷霆淬炼而成的神兵，刀身缠绕血色雷光，触之即伤。',
    { atkBonus: 80, obtain: '渡劫成功后天地赐予' },
  ),
  immortal_staff: fabao(
    'immortal_staff', '仙灵杖', '🦯', 'weapon', 'dujie',
    '以仙界灵木为杖身，杖头镶嵌仙晶，挥动时有仙乐相伴。',
    { atkBonus: 72, obtain: '渡劫试炼奖励' },
  ),
  heaven_bow: fabao(
    'heaven_bow', '昊天弓', '🏹', 'weapon', 'dujie',
    '传说为昊天上帝曾用的神弓，一箭可落星辰。',
    { atkBonus: 88, obtain: '清河镇铁匠铺购买（5000铜钱）' },
  ),
};

const DUJIE_ARMORS: Record<string, FabaoData> = {
  tribulation_robe: fabao(
    'tribulation_robe', '天劫道袍', '👘', 'armor', 'dujie',
    '以天劫余烬织就的道袍，血色暗纹流转，万劫不坏。',
    { defBonus: 75, hpBonus: 300, obtain: '渡劫成功后天地赐予' },
  ),
  immortal_mail: fabao(
    'immortal_mail', '仙灵甲', '🛡️', 'armor', 'dujie',
    '以仙界神铁锻造的战甲，凡兵难伤分毫。',
    { defBonus: 85, hpBonus: 180, obtain: '第五章终极剧情奖励' },
  ),
  heaven_vest: fabao(
    'heaven_vest', '天道背心', '🥋', 'armor', 'dujie',
    '以天道法则编织的背心，穿上即与天地共鸣。',
    { defBonus: 80, hpBonus: 240, obtain: '后山修炼小概率获得' },
  ),
};

const DUJIE_ACCESSORIES: Record<string, FabaoData> = {
  blood_ring: fabao(
    'blood_ring', '血魂戒', '💍', 'accessory', 'dujie',
    '以渡劫者精血炼制的戒指，与主人心意相通，内力如血海翻涌。',
    { specialEffect: { type: 'mp_regen', value: 50, desc: '每回合额外恢复50点内力' }, obtain: '渡劫成功后自行炼化' },
  ),
  immortal_pendant: fabao(
    'immortal_pendant', '仙缘佩', '🔒', 'accessory', 'dujie',
    '仙界流传下来的玉佩，佩戴者可感知天道运转。',
    { specialEffect: { type: 'hp_regen', value: 30, desc: '每回合恢复30点气血' }, obtain: '第五章终极剧情奖励' },
  ),
  tribulation_talisman: fabao(
    'tribulation_talisman', '渡劫符', '📿', 'accessory', 'dujie',
    '以天劫余威书写的终极符箓，蕴含毁灭与新生之力。',
    { specialEffect: { type: 'double_attack', value: 15, desc: '15%概率触发连击（额外攻击一次）' }, obtain: '陈静虚传授渡劫符法后获得' },
  ),
};

// ═══════════════════════════════════════════════════════════════
//  汇总导出
// ═══════════════════════════════════════════════════════════════

export const FABAO: Record<FabaoId, FabaoData> = {
  ...LIANQI_WEAPONS,
  ...LIANQI_ARMORS,
  ...LIANQI_ACCESSORIES,
  ...ZHUJI_WEAPONS,
  ...ZHUJI_ARMORS,
  ...ZHUJI_ACCESSORIES,
  ...JIEDAN_WEAPONS,
  ...JIEDAN_ARMORS,
  ...JIEDAN_ACCESSORIES,
  ...YUANYING_WEAPONS,
  ...YUANYING_ARMORS,
  ...YUANYING_ACCESSORIES,
  ...HUASHEN_WEAPONS,
  ...HUASHEN_ARMORS,
  ...HUASHEN_ACCESSORIES,
  ...DUJIE_WEAPONS,
  ...DUJIE_ARMORS,
  ...DUJIE_ACCESSORIES,
};

/** 按境界获取所有法宝 */
export function getFabaoByRealm(realm: FabaoRealm): FabaoData[] {
  return Object.values(FABAO).filter(f => f.realm === realm);
}

/** 按类型获取所有法宝 */
export function getFabaoByType(type: FabaoType): FabaoData[] {
  return Object.values(FABAO).filter(f => f.type === type);
}

/** 按境界+类型获取法宝 */
export function getFabaoByRealmAndType(realm: FabaoRealm, type: FabaoType): FabaoData[] {
  return Object.values(FABAO).filter(f => f.realm === realm && f.type === type);
}

/** 获取法宝的总属性加成 */
export function getFabaoTotalBonus(fabaoIds: FabaoId[]): { atk: number; def: number; hp: number } {
  let atk = 0, def = 0, hp = 0;
  for (const id of fabaoIds) {
    const f = FABAO[id];
    if (f) {
      atk += f.atkBonus ?? 0;
      def += f.defBonus ?? 0;
      hp += f.hpBonus ?? 0;
    }
  }
  return { atk, def, hp };
}