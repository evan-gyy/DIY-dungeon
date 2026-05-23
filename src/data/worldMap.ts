// ============================================================
//  src/data/worldMap.ts — 世界地图节点配置
// ============================================================
//
// 基于宋朝真实地理的简化地图，只保留门派/大城市级别地点。
// 内部区域（武当内门、传功崖等）通过对话和剧情触发，不在地图上展示。
//
// 🆕 沙盒重构：移除龙隐村/汉水渡口/苍岭山/黑月教遗址
//   → 龙隐村：第一章剧情专属场景（VN 中通过 CG 展示）
//   → 汉水渡口：武当→襄阳的旅途在移动时自动处理
//   → 苍岭山/黑月教遗址：改为剧情触发时的临时战斗场景
//
// 新地图结构：
//   武当山 ─ 襄阳城 ─ 少林寺
//     │         │
//     │      丐帮总舵
//     │
//   江陵城 ─ 峨眉山
//     │
//   成都 ─ 唐门（预留）
//
//   襄阳 ─ 洛阳 ─ 长安 ─ 华山派（预留）
//              │
//           全真教（预留）
//
//   洛阳 ─ 开封 ─ 扬州 ─ 苏州 ─ 杭州
//

import type { CourtRank } from './sandboxTypes';

// ──── 地点节点定义 ────

export type LocationId =
  // ── 门派 ──
  | 'wudang_mountain'    // 武当山（湖北·十堰）
  | 'shaolin_temple'     // 少林寺（河南·登封）
  | 'emei_mountain'      // 峨眉山（四川·乐山）
  | 'beggar_hq'          // 丐帮总舵（襄阳城外）
  // 🆕 五大新宗门
  | 'maoshan_daoyuan'    // 茅山道院（江苏·茅山）
  | 'kunlun_mountain'    // 昆仑山（西域·昆仑）
  | 'qingcheng_mountain' // 青城山（四川·青城）
  | 'tangmen_estate'     // 唐家堡（四川·唐门）
  | 'xiaoyao_valley'     // 逍遥谷（秘境）
  // 🆕 三大新门派
  | 'zhongnan_mountain'  // 终南山（陕西·全真教）
  | 'kongtong_mountain'  // 崆峒山（甘肃·崆峒派）
  | 'diancang_mountain'  // 点苍山（云南·点苍派）
  // ── 主要城市 ──
  | 'xiangyang_city'     // 襄阳城（湖北·军事重镇）
  | 'jiangling_city'     // 江陵城（湖北·荆州府）
  | 'luoyang_city'       // 洛阳（河南·西京）
  | 'changan_city'       // 长安（陕西·京兆府）
  | 'kaifeng_city'       // 开封（河南·东京汴梁）
  | 'yangzhou_city'      // 扬州（江苏·淮南东路）
  | 'suzhou_city'        // 苏州（江苏·两浙西路）
  | 'hangzhou_city'      // 杭州（浙江·临安府）
  | 'chengdu_city'       // 成都（四川·成都府路）
  | 'dali_city'          // 大理（云南·大理国）
  // 🆕 P2-1 新增城市
  | 'jiangzhou_city'     // 江州（江西·九江 / 浔阳）
  | 'tanzhou_city'       // 潭州（湖南·长沙）
  | 'guangzhou_city'     // 广州（广东·南海市舶司）
  // 🆕 新城市（P7）
  | 'yanjing_city'     // 燕京（北境重镇）
  | 'taiyuan_city'     // 太原（晋商聚集地）
  | 'jinling_city'     // 金陵（南朝旧都）
  | 'wuchang_city'     // 武昌（长江要塞）
  | 'chongqing_city'   // 重庆（山城雾都）
  | 'mingzhou_city'    // 明州（海上丝路）
  | 'liangzhou_city'   // 凉州（西域门户）
  | 'fuzhou_city'      // 福州（闽越茶道）
  // 🆕 新宗门据点（P7）
  | 'heimu_cliff'      // 黑木崖（日月教总坛）
  | 'huashan_base';    // 华山（华山派所在）

/** 战斗任务难度 */
export type TaskBattleDifficulty = 'easy' | 'normal' | 'hard';
/** 战斗任务敌人类型 */
export type TaskBattleEnemyType = 'bandit' | 'beast' | 'rival' | 'monster';

/** 战斗型日常任务配置 */
export interface TaskBattleConfig {
  difficulty: TaskBattleDifficulty;
  enemyType: TaskBattleEnemyType;
}

/** 政务型日常任务配置 */
export interface TaskCourtConfig {
  /** 场景叙事文本 */
  narrative: string;
  /** 检定选项 */
  choices: TaskCourtChoice[];
}

export interface TaskCourtChoice {
  id: string;
  label: string;
  /** 检定的属性名（eloquence/charisma/scholarship/strategy） */
  stat: 'eloquence' | 'charisma' | 'scholarship' | 'strategy';
  /** 属性检定 DC（数值门槛） */
  dc: number;
  /** 成功奖励倍率 */
  rewardMul: number;
  /** 选项描述 */
  desc: string;
}

/** 地点可执行的行动定义 */
export interface LocationAction {
  id: string;
  icon: string;
  name: string;
  desc: string;
  exp: number;
  gold: number;
  /** 宗门贡献值奖励（沙盒新增） */
  contribution?: number;
  /** 朝廷影响力奖励（沙盒新增） */
  influence?: number;
  /** 朝廷品阶要求（需要达到此品阶才能执行） */
  requireCourtRank?: CourtRank;
  unlockChapter?: number;
  unlockLevel?: number;
  /** 最高等级限制（超过此等级后不再可用，如砍柴/挑水在成为内门弟子后不可用） */
  maxLevel?: number;
  /** 拜师目标宗门（仅 join_sect 行动使用） */
  sectTarget?: string;
  /** 沙盒专属：仅 sect === 'none' 时可见（用于拜师等） */
  requireNoSect?: boolean;
  /** 沙盒专属：仅 courtRank === 'commoner' 时可见（用于出仕） */
  requireNoCourt?: boolean;
  /** 🆕 战斗任务配置（存在时触发战斗而非即时结算） */
  battleConfig?: TaskBattleConfig;
  /** 🆕 政务任务配置（存在时触发检定而非即时结算） */
  courtConfig?: TaskCourtConfig;
}

export interface MapLocation {
  id: LocationId;
  name: string;
  description: string;
  backgroundImg: string;
  region: 'wudang' | 'jinghu' | 'jingxi' | 'zhongyuan' | 'guanzhong' | 'jiangnan' | 'shuzhong' | 'dali' | 'lingnan' | 'jiangxi' | 'other';
  dangerLevel: number;
  connections: LocationId[];
  unlockChapter?: number;
  /** 该地点可执行的日常行动 */
  actions?: LocationAction[];
}

// ──── 世界地图数据 ────

export const WORLD_MAP: Record<LocationId, MapLocation> = {
  // ═══════════════════════════════════════════
  // 门派
  // ═══════════════════════════════════════════

  // ── 武当山（核心·京西南路均州）──
  wudang_mountain: {
    id: 'wudang_mountain',
    name: '武当山',
    description: '道教圣地，七十二峰朝大顶。武当派山门所在，云雾缭绕，仙气飘渺。',
    backgroundImg: 'picture/scene/C1-wudang_mountain.png',
    region: 'wudang',
    dangerLevel: 2,
    connections: ['xiangyang_city', 'jiangling_city'],
    actions: [
      { id: 'join_sect', icon: '🏯', name: '拜入师门', desc: '叩拜真武大帝，正式成为武当弟子', exp: 0, gold: 0, sectTarget: 'wudang', requireNoSect: true, unlockChapter: 2 },
      { id: 'sect_learn_skill', icon: '📖', name: '习武学功', desc: '在武当宗门修习技能，消耗贡献值', exp: 0, gold: 0, contribution: 0, sectTarget: 'wudang', unlockChapter: 2 },
      { id: 'chop_wood',      icon: '🪓', name: '砍柴',       desc: '山门外劈柴，练臂力也练心性', exp: 20, gold: 5,  contribution: 2, unlockChapter: 2, unlockLevel: 0, maxLevel: 10 },
      { id: 'carry_water',    icon: '💧', name: '挑水',       desc: '去最远的山泉挑水，腿能废三天', exp: 15, gold: 3,  contribution: 2, unlockChapter: 2, unlockLevel: 0, maxLevel: 10 },
      { id: 'clean_hall',     icon: '🧹', name: '打扫大殿',   desc: '真武大殿除尘，心静则尘净',     exp: 18, gold: 4,  contribution: 3, unlockChapter: 2, unlockLevel: 0 },
      { id: 'copy_scripture', icon: '📜', name: '抄写道经',   desc: '静心抄写道藏，字字入心',       exp: 35, gold: 8,  contribution: 5, unlockChapter: 2, unlockLevel: 0 },
      { id: 'pine_train',     icon: '🌙', name: '后山修炼',   desc: '老松树下打坐，月华入体',       exp: 45, gold: 0,  contribution: 3, unlockChapter: 2, unlockLevel: 2 },
      { id: 'arena_spar',     icon: '⚔️', name: '演武切磋',   desc: '演武场与同门过招，实战精进',   exp: 55, gold: 0,  contribution: 4, unlockChapter: 2, unlockLevel: 6 },
      { id: 'sect_fabao_shop', icon: '🏪', name: '法器兑换',   desc: '以宗门贡献兑换法宝，道藏阁内琳琅满目', exp: 0, gold: 0, contribution: 0, unlockChapter: 2, unlockLevel: 0 },
      { id: 'wudang_sword_array', icon: '⚔️', name: '剑阵试练', desc: '踏罡步斗，以真武七截阵迎战同门高手', exp: 50, gold: 0, contribution: 6, unlockChapter: 2, unlockLevel: 6, battleConfig: { difficulty: 'normal', enemyType: 'rival' } },
      { id: 'wudang_taiji_ask', icon: '☯️', name: '太极问道', desc: '与掌门真人论道，探讨太极阴阳至理', exp: 40, gold: 0, contribution: 5, unlockChapter: 2, unlockLevel: 4, courtConfig: { narrative: '掌教真人端坐太和殿，你跪坐于蒲团之上。他缓缓开口：「太极者，无极而生。你且说说，何为阴阳动静之机？」', choices: [{ id: 'yin_yang', label: '论述阴阳消长', stat: 'scholarship', dc: 15, rewardMul: 1.2, desc: '引经据典，论阴阳变化之道' }, { id: 'practice', label: '以剑演道', stat: 'strategy', dc: 14, rewardMul: 1.0, desc: '以武当剑法演示太极之理' }, { id: 'humility', label: '虚心请教', stat: 'charisma', dc: 11, rewardMul: 0.8, desc: '坦言自己道行尚浅，请真人赐教' }] } },
    ],
  },

  // ── 少林寺（河南·登封）──
  shaolin_temple: {
    id: 'shaolin_temple',
    name: '少林寺',
    description: '禅宗祖庭，武学圣地。位于河南府登封，七十二绝技威震江湖。',
    backgroundImg: 'picture/scene/shaolin_temple.png',
    region: 'zhongyuan',
    dangerLevel: 3,
    connections: ['luoyang_city'],
    actions: [
      { id: 'join_sect', icon: '🏯', name: '拜入师门', desc: '在少林寺剃度受戒，成为少林俗家弟子', exp: 0, gold: 0, sectTarget: 'shaolin', requireNoSect: true, unlockChapter: 2 },
      { id: 'sect_learn_skill', icon: '📖', name: '习武学功', desc: '在少林寺修习七十二绝技，消耗贡献值', exp: 0, gold: 0, contribution: 0, sectTarget: 'shaolin', unlockChapter: 2 },
      { id: 'shaolin_meditate', icon: '🧘', name: '参禅打坐', desc: '在少林禅堂静心打坐，佛光入体', exp: 35, gold: 0, contribution: 0, unlockChapter: 2, unlockLevel: 0 },
      { id: 'sect_fabao_shop', icon: '🏪', name: '法器兑换',   desc: '以宗门贡献兑换法宝，藏经阁内佛宝无数', exp: 0, gold: 0, contribution: 0, unlockChapter: 2, unlockLevel: 0 },
      { id: 'shaolin_defend', icon: '👊', name: '山门护法', desc: '十八铜人阵前守护山门，击退来犯宵小', exp: 48, gold: 0, contribution: 6, unlockChapter: 2, unlockLevel: 5, battleConfig: { difficulty: 'normal', enemyType: 'rival' } },
      { id: 'shaolin_debate', icon: '📿', name: '禅辩大会', desc: '与来访高僧论禅辩经，辩才无碍方为真修行', exp: 42, gold: 0, contribution: 5, unlockChapter: 2, unlockLevel: 3, courtConfig: { narrative: '大雄宝殿中，一位远方高僧来访。他合十问道：「万法皆空，因果不空。施主以为，习武伤人是造业，还是修行？」', choices: [{ id: 'protect', label: '护法降魔不为业', stat: 'eloquence', dc: 15, rewardMul: 1.2, desc: '以金刚怒目之姿，论证伏魔即护法' }, { id: 'middle', label: '武禅一如', stat: 'scholarship', dc: 14, rewardMul: 1.0, desc: '以禅宗公案回应，修行在于心不在形' }, { id: 'compassion', label: '慈悲为怀', stat: 'charisma', dc: 12, rewardMul: 0.8, desc: '习武旨在止戈，以慈悲心行菩萨道' }] } },
    ],
  },

  // ── 峨眉山（四川·乐山）──
  emei_mountain: {
    id: 'emei_mountain',
    name: '峨眉山',
    description: '秀丽险峻，峨眉派所在。位于成都府路嘉州，金顶日出为天下奇观。',
    backgroundImg: 'picture/scene/emei_mountain.png',
    region: 'shuzhong',
    dangerLevel: 3,
    connections: ['chengdu_city'],
    actions: [
      { id: 'join_sect', icon: '🏯', name: '拜入师门', desc: '金顶之上叩拜入派，成为峨眉女修弟子', exp: 0, gold: 0, sectTarget: 'emei', requireNoSect: true, unlockChapter: 2 },
      { id: 'sect_learn_skill', icon: '📖', name: '习武学功', desc: '在峨眉金顶修习峨眉秘学，消耗贡献值', exp: 0, gold: 0, contribution: 0, sectTarget: 'emei', unlockChapter: 2 },
      { id: 'emei_meditate', icon: '🧘', name: '金顶观日', desc: '在金顶打坐，感悟天地造化', exp: 35, gold: 0, contribution: 0, unlockChapter: 2, unlockLevel: 0 },
      { id: 'sect_fabao_shop', icon: '🏪', name: '法器兑换',   desc: '以宗门贡献兑换法宝，金顶阁中奇珍荟萃', exp: 0, gold: 0, contribution: 0, unlockChapter: 2, unlockLevel: 0 },
      { id: 'emei_guard', icon: '⚔️', name: '金顶退敌', desc: '有宵小觊觎峨眉剑谱，在金顶之上以剑护派', exp: 45, gold: 0, contribution: 6, unlockChapter: 2, unlockLevel: 5, battleConfig: { difficulty: 'normal', enemyType: 'rival' } },
      { id: 'emei_teach', icon: '💬', name: '传授剑法', desc: '为峨眉新弟子讲授峨眉剑法精要', exp: 38, gold: 5, contribution: 5, unlockChapter: 2, unlockLevel: 3, courtConfig: { narrative: '金顶之上，一群新入门的师妹围坐四周，眼巴巴等着你传授峨眉剑法精要。你拔剑出鞘：「峨眉剑法，以柔克刚，你们且看好——」', choices: [{ id: 'demo', label: '亲身示范', stat: 'strategy', dc: 14, rewardMul: 1.2, desc: '以实战演练峨眉剑法，让师妹们亲眼目睹' }, { id: 'lecture', label: '详讲口诀', stat: 'scholarship', dc: 15, rewardMul: 1.0, desc: '逐一讲解剑诀心法，从理论入手' }, { id: 'spar', label: '随缘切磋', stat: 'charisma', dc: 12, rewardMul: 0.8, desc: '与师妹们一对一喂招，温和指导' }] } },
    ],
  },

  // ── 丐帮总舵（襄阳城外）──
  beggar_hq: {
    id: 'beggar_hq',
    name: '丐帮总舵',
    description: '襄阳城外看似杂乱无章的棚户区，实则暗藏玄机。天下第一大帮。',
    backgroundImg: 'picture/scene/beggar_hq.png',
    region: 'jingxi',
    dangerLevel: 3,
    connections: ['xiangyang_city'],
    actions: [
      { id: 'join_sect', icon: '🏯', name: '拜入师门', desc: '在丐帮总舵行拜师之礼，成为天下第一大帮弟子', exp: 0, gold: 0, sectTarget: 'beggar', requireNoSect: true, unlockChapter: 2 },
      { id: 'sect_learn_skill', icon: '📖', name: '习武学功', desc: '在丐帮修习降龙十八掌、打狗棒法，消耗贡献值', exp: 0, gold: 0, contribution: 0, sectTarget: 'beggar', unlockChapter: 2 },
      { id: 'beggar_spar', icon: '⚔️', name: '街头切磋', desc: '与丐帮弟子切磋武艺，增长见识', exp: 40, gold: 0, contribution: 0, unlockChapter: 2, unlockLevel: 0 },
      { id: 'sect_fabao_shop', icon: '🏪', name: '法器兑换',   desc: '以宗门贡献兑换法宝，帮中密库暗藏珍宝', exp: 0, gold: 0, contribution: 0, unlockChapter: 2, unlockLevel: 0 },
      { id: 'beggar_brawl', icon: '👊', name: '街头火并', desc: '与抢地盘的帮派当街火并，棍棒齐飞', exp: 42, gold: 12, contribution: 5, unlockChapter: 2, unlockLevel: 4, battleConfig: { difficulty: 'normal', enemyType: 'bandit' } },
      { id: 'beggar_intel', icon: '👂', name: '打探消息', desc: '帮中弟子带回各路情报，由你甄别真伪', exp: 30, gold: 5, contribution: 4, unlockChapter: 2, unlockLevel: 3, courtConfig: { narrative: '几个乞丐七嘴八舌地汇报：有人说襄阳守军粮草不足，有人说黑风寨最近抢了官银，还有人声称见到了失踪已久的武林前辈。时间有限，你只能深查一条。', choices: [{ id: 'military', label: '追查军情', stat: 'strategy', dc: 15, rewardMul: 1.5, desc: '襄阳军情关系到天下大势（高价值情报）' }, { id: 'bandit', label: '探查黑风寨', stat: 'strategy', dc: 13, rewardMul: 1.0, desc: '官银去向牵涉不少人命官司' }, { id: 'master', label: '寻找前辈', stat: 'charisma', dc: 14, rewardMul: 1.1, desc: '或许能获高人指点武功' }] } },
    ],
  },

  // ── 茅山道院（江苏·茅山 / 符箓道术圣地）──
  maoshan_daoyuan: {
    id: 'maoshan_daoyuan',
    name: '茅山道院',
    description: '江南道教名山，符箓派祖庭。朱砂黄纸，驱邪降妖，茅山道术三绝冠绝天下。',
    backgroundImg: 'picture/scene/maoshan_daoyuan.png',
    region: 'jiangnan',
    dangerLevel: 3,
    connections: ['suzhou_city', 'hangzhou_city'],
    actions: [
      { id: 'join_sect', icon: '🏯', name: '拜入师门', desc: '叩拜三茅真君，成为茅山弟子，修习符箓道法', exp: 0, gold: 0, sectTarget: 'maoshan', requireNoSect: true, unlockChapter: 2 },
      { id: 'sect_learn_skill', icon: '📖', name: '习武学功', desc: '在茅山道院修习符箓秘术，消耗贡献值', exp: 0, gold: 0, contribution: 0, sectTarget: 'maoshan', unlockChapter: 2 },
      { id: 'maoshan_talisman', icon: '🔮', name: '画符修炼', desc: '于道院中研磨朱砂画符，心神合一', exp: 35, gold: 0, contribution: 0, unlockChapter: 2, unlockLevel: 0 },
      { id: 'sect_fabao_shop', icon: '🏪', name: '法器兑换', desc: '以宗门贡献兑换法宝，符箓阁中灵符法器琳琅满目', exp: 0, gold: 0, contribution: 0, unlockChapter: 2, unlockLevel: 0 },
      { id: 'maoshan_exorcise', icon: '🔮', name: '驱邪降妖', desc: '山下村庄妖祟作乱，以符箓道术降伏妖魔', exp: 48, gold: 15, contribution: 6, unlockChapter: 2, unlockLevel: 5, battleConfig: { difficulty: 'normal', enemyType: 'monster' } },
      { id: 'maoshan_ritual', icon: '🔥', name: '祭天祈福', desc: '主持道家祭天科仪，为苍生祈福禳灾', exp: 35, gold: 0, contribution: 5, unlockChapter: 2, unlockLevel: 4, courtConfig: { narrative: '道院广场上，朱砂黄纸铺开，三牲祭品已备。群弟子肃然而立，师父唤你上前主持今日的祭天科仪：「心正法自灵，你且开始吧。」', choices: [{ id: 'solemn', label: '依古制严行', stat: 'scholarship', dc: 15, rewardMul: 1.2, desc: '严格按古礼诵经踏罡，一丝不苟' }, { id: 'adapt', label: '因地制宜', stat: 'strategy', dc: 14, rewardMul: 1.0, desc: '结合当地民情简化科仪，效果不减' }, { id: 'crowd', label: '请百姓同祭', stat: 'charisma', dc: 12, rewardMul: 0.9, desc: '让附近村民参与祭祀，凝聚民望' }] } },
    ],
  },

  // ── 昆仑山（西域·昆仑 / 雪山剑派）──
  kunlun_mountain: {
    id: 'kunlun_mountain',
    name: '昆仑山',
    description: '万山之祖，昆仑派隐于此。雪山绝巅，剑气如龙，门下弟子踏雪无痕。',
    backgroundImg: 'picture/scene/kunlun_mountain.png',
    region: 'guanzhong',
    dangerLevel: 4,
    connections: ['liangzhou_city'],
    actions: [
      { id: 'kunlun_meditate', icon: '🧘', name: '雪山静修', desc: '在昆仑绝顶打坐，寒冰淬体', exp: 40, gold: 0, contribution: 0, unlockChapter: 2, unlockLevel: 0 },
      { id: 'join_sect', icon: '🏔️', name: '拜入师门', desc: '在昆仑雪峰叩拜入派，修习昆仑剑法', exp: 0, gold: 0, sectTarget: 'kunlun', requireNoSect: true, unlockChapter: 2 },
      { id: 'sect_learn_skill', icon: '📖', name: '习武学功', desc: '在昆仑冰窟修习剑术，消耗贡献值', exp: 0, gold: 0, contribution: 0, sectTarget: 'kunlun', unlockChapter: 2 },
      { id: 'sect_fabao_shop', icon: '🏪', name: '法器兑换', desc: '以宗门贡献兑换法宝，冰窟中藏有寒玉奇珍', exp: 0, gold: 0, contribution: 0, unlockChapter: 2, unlockLevel: 0 },
      { id: 'kunlun_beast', icon: '🐺', name: '冰窟斗兽', desc: '昆仑冰窟中有雪狼成群出没，磨砺剑法的好对手', exp: 48, gold: 10, contribution: 5, unlockChapter: 2, unlockLevel: 6, battleConfig: { difficulty: 'normal', enemyType: 'beast' } },
      { id: 'kunlun_sword_talk', icon: '🗡️', name: '雪峰论剑', desc: '在万仞雪峰之上与掌门论剑，剑意如雪', exp: 42, gold: 0, contribution: 5, unlockChapter: 2, unlockLevel: 5, courtConfig: { narrative: '寒风呼啸，你与掌门并肩立于雪峰之巅。掌门拔出长剑指向远方：「昆仑剑法，以寒淬骨。你且说说，你从这漫天飞雪中看到了什么剑意？」', choices: [{ id: 'swift', label: '雪落无声是为快', stat: 'strategy', dc: 15, rewardMul: 1.2, desc: '剑如飞雪漫天，落而无痕，快不可挡' }, { id: 'cold', label: '寒意为剑骨', stat: 'scholarship', dc: 14, rewardMul: 1.0, desc: '以昆仑寒冰淬炼剑骨，一剑出则冰封千里' }, { id: 'empty', label: '大雪无相', stat: 'charisma', dc: 13, rewardMul: 0.9, desc: '漫天飞雪看似有形实则无相，此乃至高剑意' }] } },
    ],
  },

  // ── 青城山（四川·青城 / 拳剑双绝）──
  qingcheng_mountain: {
    id: 'qingcheng_mountain',
    name: '青城山',
    description: '青城天下幽，道教第五洞天。青城派拳剑双绝，与峨眉并称蜀中双璧。',
    backgroundImg: 'picture/scene/qingcheng_mountain.png',
    region: 'shuzhong',
    dangerLevel: 3,
    connections: ['chengdu_city'],
    actions: [
      { id: 'join_sect', icon: '🏯', name: '拜入师门', desc: '在青城山上叩拜入派，成为青城弟子', exp: 0, gold: 0, sectTarget: 'qingcheng', requireNoSect: true, unlockChapter: 2 },
      { id: 'sect_learn_skill', icon: '📖', name: '习武学功', desc: '在青城幽洞修习拳剑功法，消耗贡献值', exp: 0, gold: 0, contribution: 0, sectTarget: 'qingcheng', unlockChapter: 2 },
      { id: 'qingcheng_spar', icon: '⚔️', name: '青城试剑', desc: '与青城弟子切磋拳剑，精进武艺', exp: 38, gold: 0, contribution: 0, unlockChapter: 2, unlockLevel: 0 },
      { id: 'sect_fabao_shop', icon: '🏪', name: '法器兑换', desc: '以宗门贡献兑换法宝，幽洞中藏有蜀中奇珍', exp: 0, gold: 0, contribution: 0, unlockChapter: 2, unlockLevel: 0 },
      { id: 'qingcheng_hunt', icon: '🐍', name: '幽谷猎妖', desc: '青城深谷中蛇妖出没，青城弟子以拳剑降妖', exp: 45, gold: 10, contribution: 5, unlockChapter: 2, unlockLevel: 5, battleConfig: { difficulty: 'normal', enemyType: 'monster' } },
      { id: 'qingcheng_alchemy', icon: '🧪', name: '道门丹会', desc: '与青城道友切磋丹道，各展炼药所长', exp: 38, gold: 0, contribution: 5, unlockChapter: 2, unlockLevel: 4, courtConfig: { narrative: '青城丹房里药香四溢，几位师兄弟各执一方互不相让。大师兄说要以猛药强身，二师兄主张温养为上。你被推举为评判：「诸位，丹药之道，且容我一言。」', choices: [{ id: 'balance', label: '刚柔并济', stat: 'scholarship', dc: 15, rewardMul: 1.2, desc: '调和双方见解，取长补短' }, { id: 'test', label: '以身试药', stat: 'strategy', dc: 14, rewardMul: 1.0, desc: '提议各自炼丹后比武较量，以实效说话' }, { id: 'classic', label: '引经据典', stat: 'scholarship', dc: 12, rewardMul: 0.8, desc: '引《青城丹经》仲裁药方优劣' }] } },
    ],
  },

  // ── 唐家堡（四川·唐门 / 暗器毒术圣地）──
  tangmen_estate: {
    id: 'tangmen_estate',
    name: '唐家堡',
    description: '唐门所在，暗器无双。机关密布，飞镖如雨，世人闻风丧胆的蜀中唐家堡。',
    backgroundImg: 'picture/scene/tangmen_estate.png',
    region: 'shuzhong',
    dangerLevel: 4,
    connections: ['chengdu_city'],
    actions: [
      { id: 'join_sect', icon: '🏯', name: '拜入师门', desc: '递上投名状，入唐家堡修习暗器毒术', exp: 0, gold: 0, sectTarget: 'tangmen', requireNoSect: true, unlockChapter: 2 },
      { id: 'sect_learn_skill', icon: '📖', name: '习武学功', desc: '在唐家堡暗室修习暗器毒术，消耗贡献值', exp: 0, gold: 0, contribution: 0, sectTarget: 'tangmen', unlockChapter: 2 },
      { id: 'tangmen_poison', icon: '🧪', name: '炼制毒药', desc: '在暗室中调配唐门秘毒，暗器淬毒', exp: 35, gold: 10, contribution: 0, unlockChapter: 2, unlockLevel: 0 },
      { id: 'sect_fabao_shop', icon: '🏪', name: '法器兑换', desc: '以宗门贡献兑换法宝，暗库中机关暗器琳琅', exp: 0, gold: 0, contribution: 0, unlockChapter: 2, unlockLevel: 0 },
      { id: 'tangmen_ambush', icon: '🎯', name: '暗器试炼', desc: '唐家堡机关林中，以暗器击退擅闯的不速之客', exp: 45, gold: 10, contribution: 6, unlockChapter: 2, unlockLevel: 6, battleConfig: { difficulty: 'normal', enemyType: 'rival' } },
      { id: 'tangmen_design', icon: '⚙️', name: '机关密议', desc: '与唐门长老共同设计新式机关暗器', exp: 35, gold: 0, contribution: 5, unlockChapter: 2, unlockLevel: 5, courtConfig: { narrative: '唐门暗室里，机关图纸铺满长桌。大长老指着图纸上的一个缺口：「飞蝗石的连射机构卡在这里了，簧片力道总是不够。你有什么主意？」', choices: [{ id: 'double_spring', label: '双簧并置', stat: 'strategy', dc: 15, rewardMul: 1.5, desc: '放弃单簧，改双簧并置以求平衡（创新思路）' }, { id: 'thin', label: '薄片替换', stat: 'scholarship', dc: 14, rewardMul: 1.0, desc: '将铜簧改为更薄更利的铁片' }, { id: 'hand', label: '手动扳机', stat: 'strategy', dc: 11, rewardMul: 0.7, desc: '干脆去掉连射，用双扳机手动切换（稳妥但保守）' }] } },
    ],
  },

  // ── 逍遥谷（秘境·逍遥派）──
  xiaoyao_valley: {
    id: 'xiaoyao_valley',
    name: '逍遥谷',
    description: '隐于群山深处的秘境，逍遥派所在。乘天地之正，御六气之辩，非有缘人不得入。',
    backgroundImg: 'picture/scene/xiaoyao_valley.png',
    region: 'dali',
    dangerLevel: 5,
    connections: ['dali_city'],
    unlockChapter: 4,
    actions: [
      { id: 'join_sect', icon: '🏯', name: '拜入师门', desc: '闯入逍遥谷，叩问逍遥真意，拜入逍遥派', exp: 0, gold: 0, sectTarget: 'xiaoyao', requireNoSect: true, unlockChapter: 4 },
      { id: 'sect_learn_skill', icon: '📖', name: '习武学功', desc: '在逍遥谷藏书洞修习逍遥奇功，消耗贡献值', exp: 0, gold: 0, contribution: 0, sectTarget: 'xiaoyao', unlockChapter: 4 },
      { id: 'xiaoyao_meditate', icon: '🦅', name: '御气逍遥', desc: '在逍遥谷中感悟天地，凌虚御风', exp: 50, gold: 0, contribution: 0, unlockChapter: 4, unlockLevel: 0 },
      { id: 'sect_fabao_shop', icon: '🏪', name: '法器兑换', desc: '以宗门贡献兑换法宝，藏书洞中奇功异宝无数', exp: 0, gold: 0, contribution: 0, unlockChapter: 4, unlockLevel: 0 },
      { id: 'xiaoyao_formation', icon: '🌀', name: '奇门遁甲', desc: '逍遥谷中迷阵变幻，以奇门之术驯服守护灵兽', exp: 55, gold: 15, contribution: 8, unlockChapter: 4, unlockLevel: 8, battleConfig: { difficulty: 'hard', enemyType: 'beast' } },
      { id: 'xiaoyao_chess', icon: '♟️', name: '弈棋悟道', desc: '与掌门一局珍珑，胜负之间窥见天机', exp: 48, gold: 0, contribution: 6, unlockChapter: 4, unlockLevel: 6, courtConfig: { narrative: '逍遥掌门在棋盘前拈子不语。黑白子交错间满是玄机，这一局已下了三天三夜。掌门抬头看你：「此局名为"珍珑"，你能看出其中生路吗？」', choices: [{ id: 'sacrifice', label: '置之死地', stat: 'strategy', dc: 18, rewardMul: 2.0, desc: '自填一气，死中求活（逍遥派最高心法）' }, { id: 'encircle', label: '围魏救赵', stat: 'strategy', dc: 15, rewardMul: 1.2, desc: '不去破角，反攻腹地' }, { id: 'wait', label: '静观其变', stat: 'scholarship', dc: 13, rewardMul: 0.9, desc: '按兵不动，等对方先犯错' }] } },
    ],
  },

  // ═══════════════════════════════════════════
  // 主要城市
  // ═══════════════════════════════════════════

  // ── 襄阳城（湖北·京西南路）──
  xiangyang_city: {
    id: 'xiangyang_city',
    name: '襄阳城',
    description: '京西南路治所，汉水之畔的军事重镇。城墙雄伟，商贸繁荣，江湖人士往来频繁。',
    backgroundImg: 'picture/scene/xiangyang_city.png',
    region: 'jingxi',
    dangerLevel: 3,
    connections: ['wudang_mountain', 'beggar_hq', 'luoyang_city', 'jiangling_city', 'wuchang_city'],
    actions: [
      { id: 'city_meditate', icon: '🧘', name: '城中静修', desc: '在客栈中静心打坐，感悟天地', exp: 30, gold: 0, contribution: 0, unlockChapter: 2, unlockLevel: 0 },
      { id: 'city_fabao_shop', icon: '🏬', name: '灵宝阁',   desc: '随机出售法宝，淘到就是赚到',     exp: 0, gold: 0, contribution: 0, unlockChapter: 2, unlockLevel: 0 },
      { id: 'military_train', icon: '🛡️', name: '校场操练', desc: '襄阳为军事重镇，校场之上练武如赴战场', exp: 40, gold: 10, contribution: 3, unlockChapter: 2, unlockLevel: 0, battleConfig: { difficulty: 'easy', enemyType: 'rival' } },
    ],
  },

  // ── 江陵城
  jiangling_city: {
    id: 'jiangling_city',
    name: '江陵城',
    description: '荆湖北路治所，古荆州。长江重镇，商贾云集，文人墨客汇聚之地。',
    backgroundImg: 'picture/scene/jiangling_city.png',
    region: 'jinghu',
    dangerLevel: 3,
    connections: ['wudang_mountain', 'xiangyang_city', 'chengdu_city', 'tanzhou_city', 'wuchang_city'],
    actions: [
      { id: 'city_meditate', icon: '🧘', name: '城中静修', desc: '在客栈中静心打坐，感悟天地', exp: 30, gold: 0, contribution: 0, unlockChapter: 2, unlockLevel: 0 },
      { id: 'city_fabao_shop', icon: '🏬', name: '灵宝阁',   desc: '随机出售法宝，淘到就是赚到',     exp: 0, gold: 0, contribution: 0, unlockChapter: 2, unlockLevel: 0 },
      { id: 'academy_read', icon: '📖', name: '藏书阁读书', desc: '荆州藏书阁卷帙浩繁，静心研读', exp: 38, gold: 0, contribution: 0, unlockChapter: 2, unlockLevel: 0 },
      { id: 'bounty_hunt', icon: '⚔️', name: '缉拿盗匪', desc: '江陵城外有盗匪出没，官府悬赏缉拿', exp: 35, gold: 18, contribution: 5, unlockChapter: 2, unlockLevel: 0, battleConfig: { difficulty: 'normal', enemyType: 'bandit' } },
    ],
  },

  // ── 洛阳（西京 · 陪都）
  luoyang_city: {
    id: 'luoyang_city',
    name: '洛阳城',
    description: '西京河南府，天下之中。牡丹花城，人文荟萃，四方商旅云集。',
    backgroundImg: 'picture/scene/luoyang_city.png',
    region: 'zhongyuan',
    dangerLevel: 3,
    connections: ['xiangyang_city', 'shaolin_temple', 'kaifeng_city', 'changan_city', 'taiyuan_city'],
    actions: [
      { id: 'city_meditate', icon: '🧘', name: '城中静修', desc: '在客栈中静心打坐，感悟天地', exp: 30, gold: 0, contribution: 0, unlockChapter: 2, unlockLevel: 0 },
      { id: 'city_fabao_shop', icon: '🏬', name: '灵宝阁',   desc: '随机出售法宝，淘到就是赚到',     exp: 0, gold: 0, contribution: 0, unlockChapter: 2, unlockLevel: 0 },
      { id: 'peony_poetry', icon: '🌸', name: '牡丹诗会', desc: '洛阳牡丹甲天下，吟诗作对结交文人雅士', exp: 32, gold: 5, contribution: 0, unlockChapter: 2, unlockLevel: 0 },
      { id: 'court_inspect', icon: '📋', name: '巡查政务', desc: '代天子巡查河南府，体察民情', exp: 20, gold: 12, influence: 8, requireCourtRank: 'xiucai', unlockChapter: 2, unlockLevel: 0, courtConfig: { narrative: '你在河南府巡查时，发现有官员虚报粮仓账目。知府暗示此事"水太深"，劝你睁一只眼闭一只眼。', choices: [{ id: 'expose', label: '据实呈报', stat: 'eloquence', dc: 16, rewardMul: 1.5, desc: '据理力争，揭发贪腐' }, { id: 'negotiate', label: '私下交涉', stat: 'charisma', dc: 12, rewardMul: 1.0, desc: '与知府私下谈判，各退一步' }, { id: 'ignore', label: '随波逐流', stat: 'scholarship', dc: 1, rewardMul: 0.5, desc: '睁一只眼闭一只眼（必定成功但减半）' }] } },
    ],
  },

  // ── 长安（京兆府 · 旧都）
  changan_city: {
    id: 'changan_city',
    name: '长安城',
    description: '京兆府治，千年古都。丝绸之路起点，西域与中原交汇之地。',
    backgroundImg: 'picture/scene/changan_city.png',
    region: 'guanzhong',
    dangerLevel: 4,
    connections: ['luoyang_city', 'zhongnan_mountain', 'kongtong_mountain', 'liangzhou_city', 'huashan_base'],
    actions: [
      { id: 'city_meditate', icon: '🧘', name: '城中静修', desc: '在客栈中静心打坐，感悟天地', exp: 30, gold: 0, contribution: 0, unlockChapter: 2, unlockLevel: 0 },
      { id: 'city_fabao_shop', icon: '🏬', name: '灵宝阁',   desc: '随机出售法宝，淘到就是赚到',     exp: 0, gold: 0, contribution: 0, unlockChapter: 2, unlockLevel: 0 },
      { id: 'silk_road_trade', icon: '🐫', name: '丝路交易', desc: '在西市与胡商交易，可淘到西域奇珍', exp: 28, gold: 25, contribution: 0, unlockChapter: 2, unlockLevel: 0 },
      { id: 'court_receive_guests', icon: '🤝', name: '接待使节', desc: '在驿馆接待西域来使，拓展人脉', exp: 25, gold: 15, influence: 10, requireCourtRank: 'juren', unlockChapter: 2, unlockLevel: 0, courtConfig: { narrative: '西域于阗国使节求见，欲重开丝路商道。但西夏最近蠢蠢欲动，开放商路可能引来西夏觊觎。', choices: [{ id: 'open_trade', label: '开放商路', stat: 'charisma', dc: 14, rewardMul: 1.2, desc: '以礼相待，促成通商' }, { id: 'delay', label: '暂缓商议', stat: 'strategy', dc: 13, rewardMul: 1.0, desc: '先探西夏虚实，从长计议' }, { id: 'escort', label: '武装护送', stat: 'strategy', dc: 16, rewardMul: 1.5, desc: '派兵护送商队，威慑西夏（高风险高回报）' }] } },
    ],
  },

  // ── 开封（东京汴梁 · 朝廷起点）
  kaifeng_city: {
    id: 'kaifeng_city',
    name: '开封府',
    description: '东京汴梁，大宋都城。繁华似锦，酒楼茶肆林立，天下奇珍汇聚于此。',
    backgroundImg: 'picture/scene/kaifeng_city.png',
    region: 'zhongyuan',
    dangerLevel: 2,
    connections: ['luoyang_city', 'yangzhou_city', 'yanjing_city'],
    actions: [
      { id: 'join_court', icon: '🏛️', name: '出仕求官', desc: '前往吏部报备，从此踏上庙堂之路', exp: 0, gold: 0, requireNoCourt: true, unlockChapter: 2 },
      { id: 'city_meditate', icon: '🧘', name: '城中静修', desc: '在客栈中静心打坐，感悟天地', exp: 30, gold: 0, contribution: 0, unlockChapter: 2, unlockLevel: 0 },
      { id: 'city_fabao_shop', icon: '🏬', name: '灵宝阁',   desc: '随机出售法宝，淘到就是赚到',     exp: 0, gold: 0, contribution: 0, unlockChapter: 2, unlockLevel: 0 },
      // 🆕 朝廷政务（需要秀才以上品阶）
      { id: 'court_handle_affairs', icon: '📜', name: '处理政务', desc: '在开封府衙批阅公文，积累朝堂影响力', exp: 25, gold: 15, influence: 10, requireCourtRank: 'xiucai', unlockChapter: 2, unlockLevel: 0, courtConfig: { narrative: '案头堆积如山的公文等你批阅。一份是请求减免税赋的折子，另一份是兵部要求增加军饷的奏章。钱粮有限，只能先批一份。', choices: [{ id: 'tax_relief', label: '减免税赋', stat: 'charisma', dc: 14, rewardMul: 1.0, desc: '为民请命，减税惠民' }, { id: 'military', label: '增拨军饷', stat: 'strategy', dc: 13, rewardMul: 1.0, desc: '充实军备，稳固边防' }, { id: 'draft', label: '另拟折衷方案', stat: 'scholarship', dc: 16, rewardMul: 1.5, desc: '起草一份两全其美的方案（难度高但回报大）' }] } },
      { id: 'court_attend_meeting', icon: '🏛️', name: '参加朝会', desc: '早朝议事，在六部中露脸', exp: 20, gold: 10, influence: 15, requireCourtRank: 'juren', unlockChapter: 2, unlockLevel: 0 },
      { id: 'court_judge_case', icon: '⚖️', name: '审理案件', desc: '审理民间纠纷，树立官声', exp: 30, gold: 20, influence: 12, requireCourtRank: 'xiucai', unlockChapter: 2, unlockLevel: 0, courtConfig: { narrative: '一桩田产纠纷案：张家声称三代祖传的田地，李家却说十五年前张家抵债时已画押转让。证人年迈话不清，契书字迹模糊。', choices: [{ id: 'evidence', label: '详查契书', stat: 'scholarship', dc: 15, rewardMul: 1.2, desc: '仔细鉴定契书真伪与年代' }, { id: 'witness', label: '传唤证人', stat: 'eloquence', dc: 14, rewardMul: 1.0, desc: '逐一传唤乡邻证人，推敲证词' }, { id: 'compromise', label: '各打五十大板', stat: 'charisma', dc: 10, rewardMul: 0.6, desc: '田产平分（和稀泥但不得罪人）' }] } },
      { id: 'sect_learn_skill', icon: '📖', name: '习武学功', desc: '在开封禁军武库修习朝廷武学，消耗贡献值', exp: 0, gold: 0, contribution: 0, sectTarget: 'imperial_court', unlockChapter: 2 },
      { id: 'arena_fight', icon: '🏟️', name: '擂台比武', desc: '开封擂台上高手云集，以武会友扬名立万', exp: 40, gold: 15, contribution: 0, unlockChapter: 2, unlockLevel: 0, battleConfig: { difficulty: 'normal', enemyType: 'rival' } },
    ],
  },

  // ── 扬州
  yangzhou_city: {
    id: 'yangzhou_city',
    name: '扬州城',
    description: '淮南东路治所，运河重镇。烟花三月，十里春风，江南繁华第一。',
    backgroundImg: 'picture/scene/yangzhou_city.png',
    region: 'jiangnan',
    dangerLevel: 3,
    connections: ['kaifeng_city', 'suzhou_city', 'jiangzhou_city', 'jinling_city'],
    actions: [
      { id: 'join_sect', icon: '🌑', name: '投身魔教', desc: '献上投名状，拜入黑月教门下。魔道之路，虽万千人吾往矣', exp: 0, gold: 0, sectTarget: 'demon', requireNoSect: true, unlockChapter: 2 },
      { id: 'sect_learn_skill', icon: '📖', name: '习武学功', desc: '在扬州密室修习魔教功法，消耗贡献值', exp: 0, gold: 0, contribution: 0, sectTarget: 'demon', unlockChapter: 2 },
      { id: 'city_meditate', icon: '🧘', name: '城中静修', desc: '在客栈中静心打坐，感悟天地', exp: 30, gold: 0, contribution: 0, unlockChapter: 2, unlockLevel: 0 },
      { id: 'city_fabao_shop', icon: '🏬', name: '灵宝阁',   desc: '随机出售法宝，淘到就是赚到',     exp: 0, gold: 0, contribution: 0, unlockChapter: 2, unlockLevel: 0 },
      { id: 'merchant_invest', icon: '💰', name: '商行投资', desc: '扬州商行林立，投一笔买卖或有厚报', exp: 20, gold: 30, contribution: 0, unlockChapter: 2, unlockLevel: 0 },
    ],
  },

  // ── 苏州
  suzhou_city: {
    id: 'suzhou_city',
    name: '苏州城',
    description: '两浙西路名城，园林甲天下。小桥流水，丝竹声声，文人雅士汇聚。',
    backgroundImg: 'picture/scene/suzhou_city.png',
    region: 'jiangnan',
    dangerLevel: 2,
    connections: ['yangzhou_city', 'hangzhou_city', 'maoshan_daoyuan', 'jinling_city'],
    actions: [
      { id: 'city_meditate', icon: '🧘', name: '城中静修', desc: '在客栈中静心打坐，感悟天地', exp: 30, gold: 0, contribution: 0, unlockChapter: 2, unlockLevel: 0 },
      { id: 'city_fabao_shop', icon: '🏬', name: '灵宝阁',   desc: '随机出售法宝，淘到就是赚到',     exp: 0, gold: 0, contribution: 0, unlockChapter: 2, unlockLevel: 0 },
      { id: 'garden_zen', icon: '🏯', name: '园林悟道', desc: '苏州园林曲径通幽，在亭台水榭间感悟天地', exp: 35, gold: 0, contribution: 0, unlockChapter: 2, unlockLevel: 0 },
    ],
  },

  // ── 杭州
  hangzhou_city: {
    id: 'hangzhou_city',
    name: '杭州城',
    description: '临安府治，东南形胜。西湖烟雨，钱塘繁华，三吴都会。',
    backgroundImg: 'picture/scene/hangzhou_city.png',
    region: 'jiangnan',
    dangerLevel: 2,
    connections: ['suzhou_city', 'maoshan_daoyuan', 'mingzhou_city'],
    actions: [
      { id: 'city_meditate', icon: '🧘', name: '城中静修', desc: '在客栈中静心打坐，感悟天地', exp: 30, gold: 0, contribution: 0, unlockChapter: 2, unlockLevel: 0 },
      { id: 'city_fabao_shop', icon: '🏬', name: '灵宝阁',   desc: '随机出售法宝，淘到就是赚到',     exp: 0, gold: 0, contribution: 0, unlockChapter: 2, unlockLevel: 0 },
      { id: 'lake_boat', icon: '⛵', name: '西湖泛舟', desc: '泛舟西湖上，烟雨朦胧间心旷神怡', exp: 33, gold: 0, contribution: 0, unlockChapter: 2, unlockLevel: 0 },
      { id: 'water_bandit', icon: '🏴‍☠️', name: '剿灭水匪', desc: '钱塘江水匪猖獗，官府招募江湖义士清剿', exp: 38, gold: 22, contribution: 5, unlockChapter: 2, unlockLevel: 0, battleConfig: { difficulty: 'normal', enemyType: 'bandit' } },
    ],
  },

  // ── 成都
  chengdu_city: {
    id: 'chengdu_city',
    name: '成都府',
    description: '成都府路治所，天府之国。锦官城外，蜀道虽难，物阜民丰。',
    backgroundImg: 'picture/scene/chengdu_city.png',
    region: 'shuzhong',
    dangerLevel: 3,
    connections: ['jiangling_city', 'emei_mountain', 'qingcheng_mountain', 'tangmen_estate', 'dali_city', 'chongqing_city'],
    actions: [
      { id: 'city_meditate', icon: '🧘', name: '城中静修', desc: '在客栈中静心打坐，感悟天地', exp: 30, gold: 0, contribution: 0, unlockChapter: 2, unlockLevel: 0 },
      { id: 'city_fabao_shop', icon: '🏬', name: '灵宝阁',   desc: '随机出售法宝，淘到就是赚到',     exp: 0, gold: 0, contribution: 0, unlockChapter: 2, unlockLevel: 0 },
      { id: 'tea_house', icon: '🍵', name: '茶馆听书', desc: '蜀中茶馆品茗听书，江湖逸闻尽收耳底', exp: 25, gold: 5, contribution: 0, unlockChapter: 2, unlockLevel: 0 },
      { id: 'beast_hunt', icon: '🐺', name: '猎杀妖兽', desc: '蜀道崎岖，深山老林中时有妖兽出没伤人', exp: 42, gold: 25, contribution: 5, unlockChapter: 2, unlockLevel: 0, battleConfig: { difficulty: 'normal', enemyType: 'beast' } },
    ],
  },

  // ── 大理
  dali_city: {
    id: 'dali_city',
    name: '大理城',
    description: '大理国都，苍山洱海。南诏故地，佛国净土，异域风情。',
    backgroundImg: 'picture/scene/dali_city.png',
    region: 'dali',
    dangerLevel: 4,
    connections: ['chengdu_city', 'xiaoyao_valley', 'diancang_mountain'],
    unlockChapter: 4,
    actions: [
      { id: 'city_meditate', icon: '🧘', name: '城中静修', desc: '在客栈中静心打坐，感悟天地', exp: 30, gold: 0, contribution: 0, unlockChapter: 4, unlockLevel: 0 },
      { id: 'city_fabao_shop', icon: '🏬', name: '灵宝阁',   desc: '随机出售法宝，淘到就是赚到',     exp: 0, gold: 0, contribution: 0, unlockChapter: 4, unlockLevel: 0 },
      { id: 'buddha_pilgrimage', icon: '🛕', name: '佛国朝拜', desc: '大理崇圣寺三塔之下，虔诚礼佛静心', exp: 38, gold: 0, contribution: 0, unlockChapter: 4, unlockLevel: 0 },
      { id: 'monster_hunt', icon: '👹', name: '剿灭魔兽', desc: '苍山深处有上古魔兽苏醒，大理国悬重赏剿灭', exp: 55, gold: 35, contribution: 8, unlockChapter: 4, unlockLevel: 0, battleConfig: { difficulty: 'hard', enemyType: 'monster' } },
      { id: 'join_sect', icon: '🐍', name: '投身五毒教', desc: '在五毒密林献上血祭，修习蛊毒之术', exp: 0, gold: 0, sectTarget: 'wudu', requireNoSect: true, unlockChapter: 3 },
      { id: 'sect_learn_skill', icon: '📖', name: '习武学功', desc: '在五毒密坛修习蛊毒秘术，消耗贡献值', exp: 0, gold: 0, contribution: 0, sectTarget: 'wudu', unlockChapter: 3 },
    ],
  },

  // ═══════════════════════════════════════════
  // 🆕 三大新门派
  // ═══════════════════════════════════════════

  // ── 终南山（陕西·全真教 / 道武双修）──
  zhongnan_mountain: {
    id: 'zhongnan_mountain',
    name: '终南山',
    description: '天下第一福地，全真祖庭。古墓派遗址便在左近，重阳宫钟声悠远，天罡北斗阵藏于云雾之中。',
    backgroundImg: 'picture/scene/zhongnan_mountain.png',
    region: 'guanzhong',
    dangerLevel: 4,
    connections: ['changan_city'],
    actions: [
      { id: 'join_sect', icon: '🏯', name: '拜入师门', desc: '叩拜重阳真人画像，入全真教修习道武', exp: 0, gold: 0, sectTarget: 'quanzhen', requireNoSect: true, unlockChapter: 2 },
      { id: 'sect_learn_skill', icon: '📖', name: '习武学功', desc: '在重阳宫修习全真功法，消耗贡献值', exp: 0, gold: 0, contribution: 0, sectTarget: 'quanzhen', unlockChapter: 2 },
      { id: 'quanzhen_meditate', icon: '🧘', name: '坐圜守静', desc: '于重阳宫静室打坐，抱元守一', exp: 38, gold: 0, contribution: 0, unlockChapter: 2, unlockLevel: 0 },
      { id: 'quanzhen_sword', icon: '⚔️', name: '北斗演剑', desc: '踏天罡步，演北斗七星剑阵', exp: 45, gold: 0, contribution: 4, unlockChapter: 2, unlockLevel: 4 },
      { id: 'sect_fabao_shop', icon: '🏪', name: '法器兑换', desc: '以宗门贡献兑换法宝，藏经阁道藏浩瀚', exp: 0, gold: 0, contribution: 0, unlockChapter: 2, unlockLevel: 0 },
      { id: 'quanzhen_array', icon: '⭐', name: '北斗降魔', desc: '布天罡北斗七星阵，迎战来犯的魔道高手', exp: 50, gold: 0, contribution: 6, unlockChapter: 2, unlockLevel: 6, battleConfig: { difficulty: 'normal', enemyType: 'rival' } },
      { id: 'quanzhen_lecture', icon: '📜', name: '重阳论道', desc: '在重阳宫大讲堂与师兄弟辩论道法武学', exp: 40, gold: 0, contribution: 5, unlockChapter: 2, unlockLevel: 4, courtConfig: { narrative: '重阳宫大堂中，丘真人召集门下弟子论道。他环视全场：「修道之人，先性后命乎？先命后性乎？你且说你的看法。」这正是全真教最根本的教义之争。', choices: [{ id: 'nature_first', label: '先性后命', stat: 'scholarship', dc: 15, rewardMul: 1.2, desc: '以修心养性为本，性命双修性为先' }, { id: 'both', label: '性命一体', stat: 'eloquence', dc: 14, rewardMul: 1.0, desc: '主张性与命一体两面，不可偏废' }, { id: 'life_first', label: '先命后性', stat: 'strategy', dc: 13, rewardMul: 0.9, desc: '身体为修道之本，先强身再论道' }] } },
    ],
  },

  // ── 崆峒山（甘肃·崆峒派 / 裂石拳）──
  kongtong_mountain: {
    id: 'kongtong_mountain',
    name: '崆峒山',
    description: '西来第一山，崆峒派所在。裂石拳谱藏于洞中，拳出如雷碎石如泥。',
    backgroundImg: 'picture/scene/kongtong_mountain.png',
    region: 'guanzhong',
    dangerLevel: 4,
    connections: ['liangzhou_city'],
    actions: [
      { id: 'join_sect', icon: '🏯', name: '拜入师门', desc: '在崆峒山洞前叩拜入派，修习裂石拳奥义', exp: 0, gold: 0, sectTarget: 'kongtong', requireNoSect: true, unlockChapter: 2 },
      { id: 'sect_learn_skill', icon: '📖', name: '习武学功', desc: '在崆峒山洞修习裂石拳术，消耗贡献值', exp: 0, gold: 0, contribution: 0, sectTarget: 'kongtong', unlockChapter: 2 },
      { id: 'kongtong_spar', icon: '👊', name: '裂石练拳', desc: '以裂石拳谱磨砺拳劲，碎石如泥方得精进', exp: 42, gold: 0, contribution: 4, unlockChapter: 2, unlockLevel: 0 },
      { id: 'kongtong_meditate', icon: '🧘', name: '洞中养伤', desc: '裂石拳刚猛霸道，需于洞中静养调理筋骨', exp: 25, gold: 0, contribution: 2, unlockChapter: 2, unlockLevel: 0 },
      { id: 'sect_fabao_shop', icon: '🏪', name: '法器兑换', desc: '以宗门贡献兑换法宝，山洞秘库藏有疗伤奇珍', exp: 0, gold: 0, contribution: 0, unlockChapter: 2, unlockLevel: 0 },
      { id: 'kongtong_tiger', icon: '🐅', name: '降伏猛虎', desc: '崆峒山中有吊睛白额猛虎为患，以裂石拳降服之', exp: 46, gold: 8, contribution: 5, unlockChapter: 2, unlockLevel: 5, battleConfig: { difficulty: 'normal', enemyType: 'beast' } },
      { id: 'kongtong_fist_manual', icon: '📖', name: '拳谱参悟', desc: '与掌门一同参悟古拳谱残卷，见解各有不同', exp: 38, gold: 0, contribution: 5, unlockChapter: 2, unlockLevel: 4, courtConfig: { narrative: '一卷古旧的裂石拳谱残卷摊在石桌上，几处关键的运气法门已被虫蛀得残缺不全。掌门捋须沉吟：「你我各说一个补法，看谁的更合祖师之意？」', choices: [{ id: 'direct', label: '以刚补缺', stat: 'strategy', dc: 15, rewardMul: 1.5, desc: '以更刚猛的路径直冲，缺处自破（激进）' }, { id: 'detour', label: '以柔绕行', stat: 'scholarship', dc: 14, rewardMul: 1.0, desc: '绕开缺失的经络节点走旁路' }, { id: 'reverse', label: '逆练补残', stat: 'strategy', dc: 16, rewardMul: 1.3, desc: '以逆行经脉的方式绕过残缺处（高风险）' }] } },
    ],
  },

  // ── 点苍山（云南·点苍派 / 南疆第一剑）──
  diancang_mountain: {
    id: 'diancang_mountain',
    name: '点苍山',
    description: '苍山十九峰，洱海万顷波。点苍派隐于此间，剑法如苍山云雪般轻灵飘逸，南疆无人能敌。',
    backgroundImg: 'picture/scene/diancang_mountain.png',
    region: 'dali',
    dangerLevel: 5,
    connections: ['dali_city'],
    unlockChapter: 5,
    actions: [
      { id: 'join_sect', icon: '🏯', name: '拜入师门', desc: '在点苍山巅叩拜入派，修习南疆第一剑', exp: 0, gold: 0, sectTarget: 'diancang', requireNoSect: true, unlockChapter: 5 },
      { id: 'sect_learn_skill', icon: '📖', name: '习武学功', desc: '在点苍石室修习苍山剑法，消耗贡献值', exp: 0, gold: 0, contribution: 0, sectTarget: 'diancang', unlockChapter: 5 },
      { id: 'diancang_sword', icon: '🗡️', name: '点苍试剑', desc: '在苍山绝壁练剑，云雾缭绕间剑意自生', exp: 48, gold: 0, contribution: 5, unlockChapter: 5, unlockLevel: 0 },
      { id: 'diancang_cloud', icon: '☁️', name: '观云悟剑', desc: '静观苍山云海变幻，剑法意境随之提升', exp: 42, gold: 0, contribution: 3, unlockChapter: 5, unlockLevel: 0 },
      { id: 'sect_fabao_shop', icon: '🏪', name: '法器兑换', desc: '以宗门贡献兑换法宝，苍山石室中藏有南疆奇珍', exp: 0, gold: 0, contribution: 0, unlockChapter: 5, unlockLevel: 0 },
      { id: 'diancang_hunt', icon: '🐉', name: '苍山猎蛟', desc: '苍山深处有恶蛟苏醒，下山祸害村庄。南疆第一剑岂能坐视？', exp: 52, gold: 20, contribution: 8, unlockChapter: 5, unlockLevel: 8, battleConfig: { difficulty: 'hard', enemyType: 'monster' } },
      { id: 'diancang_sword_talk', icon: '🌊', name: '洱海论剑', desc: '洱海之畔与掌门对坐论剑，苍山云雪映剑气', exp: 42, gold: 0, contribution: 5, unlockChapter: 5, unlockLevel: 6, courtConfig: { narrative: '洱海月下，掌门捻须望着湖面：「点苍剑法的最高境界是什么？有人说是一剑破万法，有人说是不战而屈人之兵。你的见解呢？」', choices: [{ id: 'one_sword', label: '一剑破万法', stat: 'strategy', dc: 16, rewardMul: 1.5, desc: '任何招式在绝对剑速面前都不存在' }, { id: 'no_form', label: '无招胜有招', stat: 'scholarship', dc: 15, rewardMul: 1.2, desc: '真正的高境界是没有固定剑招' }, { id: 'heart', label: '剑即本心', stat: 'charisma', dc: 13, rewardMul: 0.9, desc: '剑法最终是修心，剑术不过是心的延伸' }] } },
    ],
  },

  // ═══════════════════════════════════════════
  // 🆕 三大新城市
  // ═══════════════════════════════════════════

  // ── 江州（江西·九江 / 浔阳）──
  jiangzhou_city: {
    id: 'jiangzhou_city',
    name: '江州城',
    description: '浔阳江头夜送客，枫叶荻花秋瑟瑟。江州为长江水路枢纽，商船往来，琵琶声声。',
    backgroundImg: 'picture/scene/jiangzhou_city.png',
    region: 'jiangxi',
    dangerLevel: 3,
    connections: ['yangzhou_city', 'tanzhou_city', 'jinling_city'],
    actions: [
      { id: 'city_meditate', icon: '🧘', name: '城中静修', desc: '在客栈中静心打坐，感悟天地', exp: 30, gold: 0, contribution: 0, unlockChapter: 2, unlockLevel: 0 },
      { id: 'city_fabao_shop', icon: '🏬', name: '灵宝阁',   desc: '随机出售法宝，淘到就是赚到',     exp: 0, gold: 0, contribution: 0, unlockChapter: 2, unlockLevel: 0 },
      { id: 'river_trade', icon: '🚢', name: '码头交易', desc: '与江州商贾交易，低价购物资高价出手', exp: 25, gold: 20, contribution: 0, unlockChapter: 2, unlockLevel: 0 },
    ],
  },

  // ── 潭州（湖南·长沙 / 楚地重镇）──
  tanzhou_city: {
    id: 'tanzhou_city',
    name: '潭州城',
    description: '湘水之畔，岳麓山下。楚地重镇，文风昌盛，岳麓书院书声琅琅。',
    backgroundImg: 'picture/scene/tanzhou_city.png',
    region: 'jinghu',
    dangerLevel: 3,
    connections: ['jiangling_city', 'jiangzhou_city', 'guangzhou_city'],
    actions: [
      { id: 'city_meditate', icon: '🧘', name: '城中静修', desc: '在客栈中静心打坐，感悟天地', exp: 30, gold: 0, contribution: 0, unlockChapter: 2, unlockLevel: 0 },
      { id: 'city_fabao_shop', icon: '🏬', name: '灵宝阁',   desc: '随机出售法宝，淘到就是赚到',     exp: 0, gold: 0, contribution: 0, unlockChapter: 2, unlockLevel: 0 },
      { id: 'academy_lecture', icon: '📚', name: '书院听讲', desc: '岳麓书院听大儒讲学，增长见识', exp: 35, gold: 0, contribution: 0, unlockChapter: 2, unlockLevel: 0 },
    ],
  },

  // ── 广州（广东·南海市舶司）──
  guangzhou_city: {
    id: 'guangzhou_city',
    name: '广州城',
    description: '南海之滨，市舶司所在。万国商船云集，蕃坊胡商络绎不绝，异域珍奇荟萃于此。',
    backgroundImg: 'picture/scene/guangzhou_city.png',
    region: 'lingnan',
    dangerLevel: 4,
    connections: ['tanzhou_city', 'fuzhou_city'],
    unlockChapter: 5,
    actions: [
      { id: 'city_meditate', icon: '🧘', name: '城中静修', desc: '在客栈中静心打坐，感悟天地', exp: 30, gold: 0, contribution: 0, unlockChapter: 5 },
      { id: 'city_fabao_shop', icon: '🏬', name: '灵宝阁', desc: '随机出售法宝，淘到就是赚到', exp: 0, gold: 0, contribution: 0, unlockChapter: 5 },
      { id: 'overseas_trade', icon: '🏴‍☠️', name: '海商贸易', desc: '与海外商贾交易，稀有宝物概率更高', exp: 30, gold: 35, contribution: 0, unlockChapter: 5 },
    ],
  },

  // ═══════════════════════════════════════════
  // 🆕 P7 扩展城市
  // ═══════════════════════════════════════════

  // ── 燕京（北境重镇）──
  yanjing_city: {
    id: 'yanjing_city',
    name: '燕京城',
    description: '北境重镇，辽金旧都。大漠风沙，燕赵豪侠，边境武林别有一番气象。',
    backgroundImg: 'picture/scene/yanjing_city.png',
    region: 'other',
    dangerLevel: 4,
    connections: ['kaifeng_city', 'taiyuan_city'],
    unlockChapter: 3,
    actions: [
      { id: 'city_meditate', icon: '🧘', name: '城中静修', desc: '在客栈中静心打坐，感悟天地', exp: 30, gold: 0, contribution: 0, unlockChapter: 3 },
      { id: 'city_fabao_shop', icon: '🏬', name: '灵宝阁', desc: '随机出售法宝，淘到就是赚到', exp: 0, gold: 0, contribution: 0, unlockChapter: 3 },
      { id: 'border_patrol', icon: '🛡️', name: '边境巡逻', desc: '随北境守军巡逻，练就铁血武功', exp: 45, gold: 15, contribution: 3, unlockChapter: 3, battleConfig: { difficulty: 'normal', enemyType: 'bandit' } },
      { id: 'join_sect', icon: '⚔️', name: '投身叛军', desc: '在燕京誓师，加入前朝残余，一腔热血光复旧国', exp: 0, gold: 0, sectTarget: 'rebels', requireNoSect: true, unlockChapter: 3 },
      { id: 'sect_learn_skill', icon: '📖', name: '习武学功', desc: '在燕京叛军营修习实战武学，消耗贡献值', exp: 0, gold: 0, contribution: 0, sectTarget: 'rebels', unlockChapter: 3 },
      // 叛军专属行动（courtConfig 驱动，不要求朝廷品阶）
      { id: 'rebel_scout', icon: '🥷', name: '刺探军情', desc: '潜入官府大营，刺探朝廷兵力部署', exp: 30, gold: 12, contribution: 4, unlockChapter: 3, courtConfig: { narrative: '你换上夜行衣潜入大营，帐中灯火通明。一份地图摊在案上，标注了各州兵马调动。是抄录全文还是只记关键？', choices: [{ id: 'copy_all', label: '抄录全文', stat: 'strategy', dc: 16, rewardMul: 1.5, desc: '冒险抄下完整部署图，信息最全但更易被发现' }, { id: 'key_points', label: '只记要点', stat: 'strategy', dc: 11, rewardMul: 1.0, desc: '速记关键调动，安全为主' }, { id: 'mislead', label: '伪造假情报', stat: 'scholarship', dc: 14, rewardMul: 1.2, desc: '涂改地图上的兵力数字误导敌军（额外影响力）' }] } },
      { id: 'rebel_recruit', icon: '🤝', name: '联络义士', desc: '在城中联络不满朝廷的豪杰，扩充叛军力量', exp: 25, gold: 8, contribution: 3, unlockChapter: 3, courtConfig: { narrative: '你来到城中的秘密据点，几位地方豪杰正在犹豫是否投靠叛军。你需要打消他们的顾虑——这些人一旦加入，便是推翻暴政的火种。', choices: [{ id: 'inspire', label: '慷慨陈词', stat: 'charisma', dc: 15, rewardMul: 1.5, desc: '以满腔热血打动人，号召共赴大义' }, { id: 'pragmatic', label: '晓以利害', stat: 'eloquence', dc: 13, rewardMul: 1.0, desc: '分析天下大势，让他们明白只有在叛军这边才有出路' }, { id: 'gold', label: '散财结交', stat: 'charisma', dc: 10, rewardMul: 0.7, desc: '每人奉上一份见面礼（成本高但稳妥）' }] } },
      { id: 'rebel_smuggle', icon: '📦', name: '转运军械', desc: '通过商路暗中运送兵器甲胄回营', exp: 28, gold: 20, contribution: 4, unlockChapter: 3, courtConfig: { narrative: '一批从太原运来的军械要过城门。守城校尉盘查甚严。你可以选择用什么方式过关——硬闯太过冒险，智取方为上策。', choices: [{ id: 'bribe', label: '贿赂校尉', stat: 'charisma', dc: 14, rewardMul: 1.2, desc: '封银开路，和气生财' }, { id: 'disguise', label: '伪装商队', stat: 'eloquence', dc: 15, rewardMul: 1.0, desc: '巧舌如簧，以假乱真' }, { id: 'night_run', label: '深夜走小路', stat: 'strategy', dc: 13, rewardMul: 1.0, desc: '绕开城门，走城外山路' }] } },
    ],
  },

  // ── 太原（晋商聚集地）──
  taiyuan_city: {
    id: 'taiyuan_city',
    name: '太原府',
    description: '河东路治所，晋商发源地。煤铁丰饶，铁血男儿之乡，商道与武道并重。',
    backgroundImg: 'picture/scene/taiyuan_city.png',
    region: 'other',
    dangerLevel: 4,
    connections: ['luoyang_city', 'yanjing_city', 'heimu_cliff'],
    unlockChapter: 3,
    actions: [
      { id: 'city_meditate', icon: '🧘', name: '城中静修', desc: '在客栈中静心打坐，感悟天地', exp: 30, gold: 0, contribution: 0, unlockChapter: 3 },
      { id: 'city_fabao_shop', icon: '🏬', name: '灵宝阁', desc: '随机出售法宝，淘到就是赚到', exp: 0, gold: 0, contribution: 0, unlockChapter: 3 },
      { id: 'merchant_guild', icon: '💰', name: '晋商会馆', desc: '与晋商巨贾周旋，积累财富与人脉', exp: 20, gold: 35, contribution: 0, unlockChapter: 3 },
    ],
  },

  // ── 金陵（南朝旧都）──
  jinling_city: {
    id: 'jinling_city',
    name: '金陵城',
    description: '六朝故都，秦淮烟雨。钟山龙盘，石城虎踞，文气与剑气共飘。',
    backgroundImg: 'picture/scene/jinling_city.png',
    region: 'jiangnan',
    dangerLevel: 3,
    connections: ['yangzhou_city', 'suzhou_city', 'jiangzhou_city'],
    unlockChapter: 2,
    actions: [
      { id: 'city_meditate', icon: '🧘', name: '城中静修', desc: '在客栈中静心打坐，感悟天地', exp: 30, gold: 0, contribution: 0, unlockChapter: 2 },
      { id: 'city_fabao_shop', icon: '🏬', name: '灵宝阁', desc: '随机出售法宝，淘到就是赚到', exp: 0, gold: 0, contribution: 0, unlockChapter: 2 },
      { id: 'qinhuai_night', icon: '🏮', name: '秦淮夜游', desc: '泛舟秦淮，听曲赏景，结交才子佳人', exp: 28, gold: 10, contribution: 0, unlockChapter: 2 },
    ],
  },

  // ── 武昌（长江要塞）──
  wuchang_city: {
    id: 'wuchang_city',
    name: '武昌城',
    description: '荆湖南路治所，长江要冲。黄鹤楼巍峨，江上烟波浩渺，水师重地。',
    backgroundImg: 'picture/scene/wuchang_city.png',
    region: 'jinghu',
    dangerLevel: 3,
    connections: ['jiangling_city', 'xiangyang_city', 'tanzhou_city'],
    unlockChapter: 2,
    actions: [
      { id: 'city_meditate', icon: '🧘', name: '城中静修', desc: '在客栈中静心打坐，感悟天地', exp: 30, gold: 0, contribution: 0, unlockChapter: 2 },
      { id: 'city_fabao_shop', icon: '🏬', name: '灵宝阁', desc: '随机出售法宝，淘到就是赚到', exp: 0, gold: 0, contribution: 0, unlockChapter: 2 },
      { id: 'huanghelu_climb', icon: '🏯', name: '黄鹤楼登高', desc: '登黄鹤楼极目远眺，胸怀为之开阔', exp: 35, gold: 5, contribution: 0, unlockChapter: 2 },
    ],
  },

  // ── 重庆（山城雾都）──
  chongqing_city: {
    id: 'chongqing_city',
    name: '重庆城',
    description: '山城雾都，巴国故地。两江环抱，地势险要，巴蜀武林的南大门。',
    backgroundImg: 'picture/scene/chongqing_city.png',
    region: 'shuzhong',
    dangerLevel: 4,
    connections: ['chengdu_city'],
    unlockChapter: 3,
    actions: [
      { id: 'city_meditate', icon: '🧘', name: '城中静修', desc: '在客栈中静心打坐，感悟天地', exp: 30, gold: 0, contribution: 0, unlockChapter: 3 },
      { id: 'city_fabao_shop', icon: '🏬', name: '灵宝阁', desc: '随机出售法宝，淘到就是赚到', exp: 0, gold: 0, contribution: 0, unlockChapter: 3 },
      { id: 'gorge_explore', icon: '⛰️', name: '峡谷探险', desc: '在三峡峭壁之间修行，险地磨砺武功', exp: 45, gold: 10, contribution: 0, unlockChapter: 3 },
      { id: 'join_sect', icon: '✊', name: '投身铁掌帮', desc: '在铁掌峰下叩拜入帮，修习裂石铁掌功', exp: 0, gold: 0, sectTarget: 'tiezhang', requireNoSect: true, unlockChapter: 3 },
      { id: 'sect_learn_skill', icon: '📖', name: '习武学功', desc: '在铁掌帮修习裂石功铁掌绝学，消耗贡献值', exp: 0, gold: 0, contribution: 0, sectTarget: 'tiezhang', unlockChapter: 3 },
    ],
  },

  // ── 明州（海上丝路起点）──
  mingzhou_city: {
    id: 'mingzhou_city',
    name: '明州城',
    description: '两浙路明州，海上丝绸之路起点。市舶贸易，海外奇珍，东瀛、高丽商船往来。',
    backgroundImg: 'picture/scene/mingzhou_city.png',
    region: 'jiangnan',
    dangerLevel: 3,
    connections: ['hangzhou_city', 'fuzhou_city'],
    unlockChapter: 3,
    actions: [
      { id: 'city_meditate', icon: '🧘', name: '城中静修', desc: '在客栈中静心打坐，感悟天地', exp: 30, gold: 0, contribution: 0, unlockChapter: 3 },
      { id: 'city_fabao_shop', icon: '🏬', name: '灵宝阁', desc: '随机出售法宝，淘到就是赚到', exp: 0, gold: 0, contribution: 0, unlockChapter: 3 },
      { id: 'overseas_goods', icon: '⛵', name: '海外珍品', desc: '与海外商人交易，获取东瀛和高丽奇珍', exp: 25, gold: 30, contribution: 0, unlockChapter: 3 },
      { id: 'join_sect', icon: '🏴‍☠️', name: '投身海沙派', desc: '在明州码头叩拜入派，修习海沙功', exp: 0, gold: 0, sectTarget: 'haisha', requireNoSect: true, unlockChapter: 3 },
      { id: 'sect_learn_skill', icon: '📖', name: '习武学功', desc: '在海沙派修习潮汐功法，消耗贡献值', exp: 0, gold: 0, contribution: 0, sectTarget: 'haisha', unlockChapter: 3 },
    ],
  },

  // ── 凉州（西域门户）──
  liangzhou_city: {
    id: 'liangzhou_city',
    name: '凉州城',
    description: '秦陇要地，西域咽喉。丝路商贾汇聚，西域武功在此传入中原，风沙之中别有奇遇。',
    backgroundImg: 'picture/scene/liangzhou_city.png',
    region: 'guanzhong',
    dangerLevel: 4,
    connections: ['changan_city', 'kunlun_mountain', 'kongtong_mountain'],
    unlockChapter: 3,
    actions: [
      { id: 'city_meditate', icon: '🧘', name: '城中静修', desc: '在客栈中静心打坐，感悟天地', exp: 30, gold: 0, contribution: 0, unlockChapter: 3 },
      { id: 'city_fabao_shop', icon: '🏬', name: '灵宝阁', desc: '随机出售法宝，淘到就是赚到', exp: 0, gold: 0, contribution: 0, unlockChapter: 3 },
      { id: 'silk_road_west', icon: '🐪', name: '西域商道', desc: '踏上丝绸之路，向西域商人购置奇珍', exp: 30, gold: 40, contribution: 0, unlockChapter: 3 },
      { id: 'join_sect', icon: '🩸', name: '投身血刀门', desc: '在凉州血刀门叩拜入派，修习血刀大法', exp: 0, gold: 0, sectTarget: 'xuedao', requireNoSect: true, unlockChapter: 3 },
      { id: 'sect_learn_skill', icon: '📖', name: '习武学功', desc: '在血刀门修习血刀秘法，消耗贡献值', exp: 0, gold: 0, contribution: 0, sectTarget: 'xuedao', unlockChapter: 3 },
    ],
  },

  // ── 福州（闽越茶道）──
  fuzhou_city: {
    id: 'fuzhou_city',
    name: '福州城',
    description: '福建路治所，闽越茶道。三坊七巷，文风昌盛，武功兼采中原与南洋之长。',
    backgroundImg: 'picture/scene/fuzhou_city.png',
    region: 'lingnan',
    dangerLevel: 3,
    connections: ['mingzhou_city', 'guangzhou_city'],
    unlockChapter: 4,
    actions: [
      { id: 'city_meditate', icon: '🧘', name: '城中静修', desc: '在客栈中静心打坐，感悟天地', exp: 30, gold: 0, contribution: 0, unlockChapter: 4 },
      { id: 'city_fabao_shop', icon: '🏬', name: '灵宝阁', desc: '随机出售法宝，淘到就是赚到', exp: 0, gold: 0, contribution: 0, unlockChapter: 4 },
      { id: 'tea_ceremony', icon: '🍵', name: '闽茶论道', desc: '品闽北岩茶，与茶道高人论武谈道', exp: 32, gold: 8, contribution: 0, unlockChapter: 4 },
    ],
  },

  // ═══════════════════════════════════════════
  // 🆕 P7 新宗门据点
  // ═══════════════════════════════════════════

  // ── 黑木崖（日月教总坛）──
  heimu_cliff: {
    id: 'heimu_cliff',
    name: '黑木崖',
    description: '黑木崖上教主府，日月教总坛所在。悬崖峭壁，机关密布，令正道闻风丧胆。',
    backgroundImg: 'picture/scene/heimu_cliff.png',
    region: 'other',
    dangerLevel: 6,
    connections: ['taiyuan_city'],
    unlockChapter: 3,
    actions: [
      { id: 'join_sect', icon: '🌑', name: '投身日月教', desc: '叩拜日月旗，成为日月教门下，修习乾坤大挪移', exp: 0, gold: 0, sectTarget: 'riyue', requireNoSect: true, unlockChapter: 3 },
      { id: 'sect_learn_skill', icon: '📖', name: '习武学功', desc: '在黑木崖密室修习日月神功，消耗贡献值', exp: 0, gold: 0, contribution: 0, sectTarget: 'riyue', unlockChapter: 3 },
      { id: 'riyue_meditate', icon: '☯️', name: '日月双修', desc: '在黑木崖上修炼日月神功，吸收天地日月精华', exp: 50, gold: 0, contribution: 5, unlockChapter: 3, unlockLevel: 0 },
      { id: 'riyue_spar', icon: '⚔️', name: '崖上切磋', desc: '与教中高手切磋，以实战磨砺剑意', exp: 60, gold: 0, contribution: 6, unlockChapter: 3, unlockLevel: 10 },
      { id: 'sect_fabao_shop', icon: '🏪', name: '法器兑换', desc: '以宗门贡献兑换法宝，悬崖密室中珍藏法器无数', exp: 0, gold: 0, contribution: 0, unlockChapter: 3 },
      { id: 'riyue_raid', icon: '🏴‍☠️', name: '夺旗血战', desc: '正道联盟攻上黑木崖，率教众迎头痛击', exp: 65, gold: 25, contribution: 8, unlockChapter: 3, unlockLevel: 12, battleConfig: { difficulty: 'hard', enemyType: 'rival' } },
      { id: 'riyue_council', icon: '🌑', name: '教众议事', desc: '主持教内议事，决断教务。坛主们各怀心思，须谨慎应对', exp: 42, gold: 0, contribution: 6, unlockChapter: 3, unlockLevel: 8, courtConfig: { narrative: '黑木崖大殿中烛火摇曳，五大坛主分坐两侧。左使呈上一封密报：西坛坛主私吞了本该上缴的供奉。坛中众人目光齐刷刷看向你，等你的决断。', choices: [{ id: 'execute', label: '依教规处置', stat: 'strategy', dc: 16, rewardMul: 1.5, desc: '教规如山，斩立决以儆效尤' }, { id: 'fine', label: '罚俸削权', stat: 'charisma', dc: 14, rewardMul: 1.0, desc: '留他性命但削去坛主之职' }, { id: 'mercy', label: '令其将功赎罪', stat: 'eloquence', dc: 13, rewardMul: 0.8, desc: '人情留一线，让他戴罪立功' }] } },
    ],
  },

  // ── 华山（华山派所在）──
  huashan_base: {
    id: 'huashan_base',
    name: '华山',
    description: '奇险天下第一，华山派所在。险峰绝壁，剑气宗与气宗两脉在此争鸣，天下剑客向往之地。',
    backgroundImg: 'picture/scene/huashan_base.png',
    region: 'guanzhong',
    dangerLevel: 4,
    connections: ['changan_city'],
    unlockChapter: 2,
    actions: [
      { id: 'join_sect', icon: '⚔️', name: '拜入华山', desc: '递上拜帖，入华山派修习华山剑法', exp: 0, gold: 0, sectTarget: 'huashan', requireNoSect: true, unlockChapter: 2 },
      { id: 'sect_learn_skill', icon: '📖', name: '习武学功', desc: '在华山剑冢修习华山剑法，消耗贡献值', exp: 0, gold: 0, contribution: 0, sectTarget: 'huashan', unlockChapter: 2 },
      { id: 'huashan_spar', icon: '⚔️', name: '论剑切磋', desc: '参与华山论剑，剑宗气宗各显其长', exp: 45, gold: 0, contribution: 4, unlockChapter: 2, unlockLevel: 5 },
      { id: 'huashan_climb', icon: '🏔️', name: '绝顶独修', desc: '攀上华山绝顶，在云海之上修炼剑意', exp: 40, gold: 0, contribution: 3, unlockChapter: 2, unlockLevel: 0 },
      { id: 'sect_fabao_shop', icon: '🏪', name: '法器兑换', desc: '以宗门贡献兑换法宝，华山剑冢藏有历代高手遗物', exp: 0, gold: 0, contribution: 0, unlockChapter: 2 },
      { id: 'huashan_duel', icon: '⚔️', name: '剑宗试练', desc: '剑气二宗论剑较技，以真功夫一分高下', exp: 50, gold: 0, contribution: 6, unlockChapter: 2, unlockLevel: 7, battleConfig: { difficulty: 'normal', enemyType: 'rival' } },
      { id: 'huashan_debate', icon: '🗡️', name: '剑气之辩', desc: '华山剑气二宗争论不休，由你来调解这场百年之争', exp: 40, gold: 0, contribution: 5, unlockChapter: 2, unlockLevel: 5, courtConfig: { narrative: '华山正气堂中，剑宗与气宗两脉长老针锋相对。剑宗说天下武功唯快不破，气宗说以内功为根基才能无敌。你身为弟子却要在两派间调解——这可不是简单的差事。', choices: [{ id: 'both', label: '剑气合一', stat: 'eloquence', dc: 16, rewardMul: 1.5, desc: '论剑气本为一体，相辅相成（高明难做但两派都认）' }, { id: 'sword', label: '剑宗有理', stat: 'strategy', dc: 14, rewardMul: 1.0, desc: '赞同剑宗观点，招式为上（剑宗长老点头）' }, { id: 'qi', label: '气宗有理', stat: 'scholarship', dc: 14, rewardMul: 1.0, desc: '赞同气宗观点，内功为根（气宗长老欣慰）' }] } },
    ],
  },
};

// ──── 辅助函数 ────

export function getAllLocations(): MapLocation[] {
  return Object.values(WORLD_MAP);
}

export function getLocation(id: LocationId): MapLocation | undefined {
  return WORLD_MAP[id];
}

export function getLocationDisplayName(id: LocationId): string {
  const loc = WORLD_MAP[id];
  if (!loc) return id;
  const regionPrefix: Record<string, string> = {
    wudang: '【武当】',
    jinghu: '【荆湖】',
    jingxi: '【京西】',
    zhongyuan: '【中原】',
    guanzhong: '【关中】',
    jiangnan: '【江南】',
    shuzhong: '【蜀中】',
    dali: '【大理】',
    lingnan: '【岭南】',
    jiangxi: '【江西】',
    other: '【江湖】',
  };
  return `${regionPrefix[loc.region] ?? ''}${loc.name}`;
}

export function isLocationUnlocked(id: LocationId, currentChapter: number, isSandbox = false): boolean {
  const loc = WORLD_MAP[id];
  if (!loc) return false;
  if (isSandbox) return true;
  if (!loc.unlockChapter) return true;
  return currentChapter >= loc.unlockChapter;
}

export function getAvailableDestinations(
  currentLocationId: LocationId,
  currentChapter: number,
  isSandbox = false
): MapLocation[] {
  const current = WORLD_MAP[currentLocationId];
  if (!current) return [];

  return current.connections
    .map(id => WORLD_MAP[id])
    .filter(loc => isLocationUnlocked(loc.id, currentChapter, isSandbox));
}

export function getLocationBackground(locationId: LocationId): string {
  return WORLD_MAP[locationId]?.backgroundImg ?? 'picture/scene/default.png';
}