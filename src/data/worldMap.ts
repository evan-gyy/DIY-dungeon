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
  // 🆕 新城市
  | 'jiangzhou_city'     // 江州（江西·九江 / 浔阳）
  | 'tanzhou_city'       // 潭州（湖南·长沙 / 楚地重镇）
  | 'guangzhou_city';    // 广州（广东·南海市舶司）

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
  requireCourtRank?: string;
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
      { id: 'chop_wood',      icon: '🪓', name: '砍柴',       desc: '山门外劈柴，练臂力也练心性', exp: 20, gold: 5,  contribution: 2, unlockChapter: 2, unlockLevel: 0, maxLevel: 10 },
      { id: 'carry_water',    icon: '💧', name: '挑水',       desc: '去最远的山泉挑水，腿能废三天', exp: 15, gold: 3,  contribution: 2, unlockChapter: 2, unlockLevel: 0, maxLevel: 10 },
      { id: 'clean_hall',     icon: '🧹', name: '打扫大殿',   desc: '真武大殿除尘，心静则尘净',     exp: 18, gold: 4,  contribution: 3, unlockChapter: 2, unlockLevel: 0 },
      { id: 'copy_scripture', icon: '📜', name: '抄写道经',   desc: '静心抄写道藏，字字入心',       exp: 35, gold: 8,  contribution: 5, unlockChapter: 2, unlockLevel: 0 },
      { id: 'pine_train',     icon: '🌙', name: '后山修炼',   desc: '老松树下打坐，月华入体',       exp: 45, gold: 0,  contribution: 3, unlockChapter: 2, unlockLevel: 2 },
      { id: 'arena_spar',     icon: '⚔️', name: '演武切磋',   desc: '演武场与同门过招，实战精进',   exp: 55, gold: 0,  contribution: 4, unlockChapter: 2, unlockLevel: 6 },
      { id: 'sect_fabao_shop', icon: '🏪', name: '法器兑换',   desc: '以宗门贡献兑换法宝，道藏阁内琳琅满目', exp: 0, gold: 0, contribution: 0, unlockChapter: 2, unlockLevel: 0 },
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
      { id: 'shaolin_meditate', icon: '🧘', name: '参禅打坐', desc: '在少林禅堂静心打坐，佛光入体', exp: 35, gold: 0, contribution: 0, unlockChapter: 2, unlockLevel: 0 },
      { id: 'sect_fabao_shop', icon: '🏪', name: '法器兑换',   desc: '以宗门贡献兑换法宝，藏经阁内佛宝无数', exp: 0, gold: 0, contribution: 0, unlockChapter: 2, unlockLevel: 0 },
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
      { id: 'emei_meditate', icon: '🧘', name: '金顶观日', desc: '在金顶打坐，感悟天地造化', exp: 35, gold: 0, contribution: 0, unlockChapter: 2, unlockLevel: 0 },
      { id: 'sect_fabao_shop', icon: '🏪', name: '法器兑换',   desc: '以宗门贡献兑换法宝，金顶阁中奇珍荟萃', exp: 0, gold: 0, contribution: 0, unlockChapter: 2, unlockLevel: 0 },
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
      { id: 'beggar_spar', icon: '⚔️', name: '街头切磋', desc: '与丐帮弟子切磋武艺，增长见识', exp: 40, gold: 0, contribution: 0, unlockChapter: 2, unlockLevel: 0 },
      { id: 'sect_fabao_shop', icon: '🏪', name: '法器兑换',   desc: '以宗门贡献兑换法宝，帮中密库暗藏珍宝', exp: 0, gold: 0, contribution: 0, unlockChapter: 2, unlockLevel: 0 },
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
      { id: 'maoshan_talisman', icon: '🔮', name: '画符修炼', desc: '于道院中研磨朱砂画符，心神合一', exp: 35, gold: 0, contribution: 0, unlockChapter: 2, unlockLevel: 0 },
      { id: 'sect_fabao_shop', icon: '🏪', name: '法器兑换', desc: '以宗门贡献兑换法宝，符箓阁中灵符法器琳琅满目', exp: 0, gold: 0, contribution: 0, unlockChapter: 2, unlockLevel: 0 },
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
    connections: ['changan_city'],
    actions: [
      { id: 'join_sect', icon: '🏯', name: '拜入师门', desc: '在雪山之巅叩拜入派，成为昆仑弟子', exp: 0, gold: 0, sectTarget: 'kunlun', requireNoSect: true, unlockChapter: 2 },
      { id: 'kunlun_meditate', icon: '🧘', name: '雪山静修', desc: '在昆仑绝顶打坐，寒冰淬体', exp: 40, gold: 0, contribution: 0, unlockChapter: 2, unlockLevel: 0 },
      { id: 'sect_fabao_shop', icon: '🏪', name: '法器兑换', desc: '以宗门贡献兑换法宝，冰窟中藏有寒玉奇珍', exp: 0, gold: 0, contribution: 0, unlockChapter: 2, unlockLevel: 0 },
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
      { id: 'qingcheng_spar', icon: '⚔️', name: '青城试剑', desc: '与青城弟子切磋拳剑，精进武艺', exp: 38, gold: 0, contribution: 0, unlockChapter: 2, unlockLevel: 0 },
      { id: 'sect_fabao_shop', icon: '🏪', name: '法器兑换', desc: '以宗门贡献兑换法宝，幽洞中藏有蜀中奇珍', exp: 0, gold: 0, contribution: 0, unlockChapter: 2, unlockLevel: 0 },
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
      { id: 'tangmen_poison', icon: '🧪', name: '炼制毒药', desc: '在暗室中调配唐门秘毒，暗器淬毒', exp: 35, gold: 10, contribution: 0, unlockChapter: 2, unlockLevel: 0 },
      { id: 'sect_fabao_shop', icon: '🏪', name: '法器兑换', desc: '以宗门贡献兑换法宝，暗库中机关暗器琳琅', exp: 0, gold: 0, contribution: 0, unlockChapter: 2, unlockLevel: 0 },
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
      { id: 'xiaoyao_meditate', icon: '🦅', name: '御气逍遥', desc: '在逍遥谷中感悟天地，凌虚御风', exp: 50, gold: 0, contribution: 0, unlockChapter: 4, unlockLevel: 0 },
      { id: 'sect_fabao_shop', icon: '🏪', name: '法器兑换', desc: '以宗门贡献兑换法宝，藏书洞中奇功异宝无数', exp: 0, gold: 0, contribution: 0, unlockChapter: 4, unlockLevel: 0 },
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
    connections: ['wudang_mountain', 'beggar_hq', 'luoyang_city', 'jiangling_city'],
    actions: [
      { id: 'city_meditate', icon: '🧘', name: '城中静修', desc: '在客栈中静心打坐，感悟天地', exp: 30, gold: 0, contribution: 0, unlockChapter: 2, unlockLevel: 0 },
      { id: 'city_fabao_shop', icon: '🏬', name: '灵宝阁',   desc: '随机出售法宝，淘到就是赚到',     exp: 0, gold: 0, contribution: 0, unlockChapter: 2, unlockLevel: 0 },
      { id: 'military_train', icon: '🛡️', name: '校场操练', desc: '襄阳为军事重镇，校场之上练武如赴战场', exp: 40, gold: 10, contribution: 3, unlockChapter: 2, unlockLevel: 0 },
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
    connections: ['wudang_mountain', 'xiangyang_city', 'chengdu_city', 'tanzhou_city'],
    actions: [
      { id: 'city_meditate', icon: '🧘', name: '城中静修', desc: '在客栈中静心打坐，感悟天地', exp: 30, gold: 0, contribution: 0, unlockChapter: 2, unlockLevel: 0 },
      { id: 'city_fabao_shop', icon: '🏬', name: '灵宝阁',   desc: '随机出售法宝，淘到就是赚到',     exp: 0, gold: 0, contribution: 0, unlockChapter: 2, unlockLevel: 0 },
      { id: 'academy_read', icon: '📖', name: '藏书阁读书', desc: '荆州藏书阁卷帙浩繁，静心研读', exp: 38, gold: 0, contribution: 0, unlockChapter: 2, unlockLevel: 0 },
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
    connections: ['xiangyang_city', 'shaolin_temple', 'kaifeng_city', 'changan_city'],
    actions: [
      { id: 'city_meditate', icon: '🧘', name: '城中静修', desc: '在客栈中静心打坐，感悟天地', exp: 30, gold: 0, contribution: 0, unlockChapter: 2, unlockLevel: 0 },
      { id: 'city_fabao_shop', icon: '🏬', name: '灵宝阁',   desc: '随机出售法宝，淘到就是赚到',     exp: 0, gold: 0, contribution: 0, unlockChapter: 2, unlockLevel: 0 },
      { id: 'peony_poetry', icon: '🌸', name: '牡丹诗会', desc: '洛阳牡丹甲天下，吟诗作对结交文人雅士', exp: 32, gold: 5, contribution: 0, unlockChapter: 2, unlockLevel: 0 },
      { id: 'court_inspect', icon: '📋', name: '巡查政务', desc: '代天子巡查河南府，体察民情', exp: 20, gold: 12, influence: 8, requireCourtRank: 'xiucai', unlockChapter: 2, unlockLevel: 0 },
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
    connections: ['luoyang_city', 'kunlun_mountain', 'zhongnan_mountain', 'kongtong_mountain'],
    actions: [
      { id: 'join_sect', icon: '🏯', name: '拜入师门', desc: '递上拜帖投入华山派，修习华山武学', exp: 0, gold: 0, sectTarget: 'huashan', requireNoSect: true, unlockChapter: 2 },
      { id: 'city_meditate', icon: '🧘', name: '城中静修', desc: '在客栈中静心打坐，感悟天地', exp: 30, gold: 0, contribution: 0, unlockChapter: 2, unlockLevel: 0 },
      { id: 'city_fabao_shop', icon: '🏬', name: '灵宝阁',   desc: '随机出售法宝，淘到就是赚到',     exp: 0, gold: 0, contribution: 0, unlockChapter: 2, unlockLevel: 0 },
      { id: 'silk_road_trade', icon: '🐫', name: '丝路交易', desc: '在西市与胡商交易，可淘到西域奇珍', exp: 28, gold: 25, contribution: 0, unlockChapter: 2, unlockLevel: 0 },
      { id: 'court_receive_guests', icon: '🤝', name: '接待使节', desc: '在驿馆接待西域来使，拓展人脉', exp: 25, gold: 15, influence: 10, requireCourtRank: 'juren', unlockChapter: 2, unlockLevel: 0 },
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
    connections: ['luoyang_city', 'yangzhou_city'],
    actions: [
      { id: 'join_court', icon: '🏛️', name: '出仕求官', desc: '前往吏部报备，从此踏上庙堂之路', exp: 0, gold: 0, requireNoCourt: true, unlockChapter: 2 },
      { id: 'city_meditate', icon: '🧘', name: '城中静修', desc: '在客栈中静心打坐，感悟天地', exp: 30, gold: 0, contribution: 0, unlockChapter: 2, unlockLevel: 0 },
      { id: 'city_fabao_shop', icon: '🏬', name: '灵宝阁',   desc: '随机出售法宝，淘到就是赚到',     exp: 0, gold: 0, contribution: 0, unlockChapter: 2, unlockLevel: 0 },
      // 🆕 朝廷政务（需要秀才以上品阶）
      { id: 'court_handle_affairs', icon: '📜', name: '处理政务', desc: '在开封府衙批阅公文，积累朝堂影响力', exp: 25, gold: 15, influence: 10, requireCourtRank: 'xiucai', unlockChapter: 2, unlockLevel: 0 },
      { id: 'court_attend_meeting', icon: '🏛️', name: '参加朝会', desc: '早朝议事，在六部中露脸', exp: 20, gold: 10, influence: 15, requireCourtRank: 'juren', unlockChapter: 2, unlockLevel: 0 },
      { id: 'court_judge_case', icon: '⚖️', name: '审理案件', desc: '审理民间纠纷，树立官声', exp: 30, gold: 20, influence: 12, requireCourtRank: 'xiucai', unlockChapter: 2, unlockLevel: 0 },
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
    connections: ['kaifeng_city', 'suzhou_city', 'jiangzhou_city'],
    actions: [
      { id: 'join_sect', icon: '🌑', name: '投身魔教', desc: '献上投名状，拜入黑月教门下。魔道之路，虽万千人吾往矣', exp: 0, gold: 0, sectTarget: 'demon', requireNoSect: true, unlockChapter: 2 },
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
    connections: ['yangzhou_city', 'hangzhou_city', 'maoshan_daoyuan'],
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
    connections: ['suzhou_city', 'maoshan_daoyuan'],
    actions: [
      { id: 'city_meditate', icon: '🧘', name: '城中静修', desc: '在客栈中静心打坐，感悟天地', exp: 30, gold: 0, contribution: 0, unlockChapter: 2, unlockLevel: 0 },
      { id: 'city_fabao_shop', icon: '🏬', name: '灵宝阁',   desc: '随机出售法宝，淘到就是赚到',     exp: 0, gold: 0, contribution: 0, unlockChapter: 2, unlockLevel: 0 },
      { id: 'lake_boat', icon: '⛵', name: '西湖泛舟', desc: '泛舟西湖上，烟雨朦胧间心旷神怡', exp: 33, gold: 0, contribution: 0, unlockChapter: 2, unlockLevel: 0 },
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
    connections: ['jiangling_city', 'emei_mountain', 'qingcheng_mountain', 'tangmen_estate', 'dali_city'],
    actions: [
      { id: 'city_meditate', icon: '🧘', name: '城中静修', desc: '在客栈中静心打坐，感悟天地', exp: 30, gold: 0, contribution: 0, unlockChapter: 2, unlockLevel: 0 },
      { id: 'city_fabao_shop', icon: '🏬', name: '灵宝阁',   desc: '随机出售法宝，淘到就是赚到',     exp: 0, gold: 0, contribution: 0, unlockChapter: 2, unlockLevel: 0 },
      { id: 'tea_house', icon: '🍵', name: '茶馆听书', desc: '蜀中茶馆品茗听书，江湖逸闻尽收耳底', exp: 25, gold: 5, contribution: 0, unlockChapter: 2, unlockLevel: 0 },
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
    ],
  },
};

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
      { id: 'quanzhen_meditate', icon: '🧘', name: '坐圜守静', desc: '于重阳宫静室打坐，抱元守一', exp: 38, gold: 0, contribution: 0, unlockChapter: 2, unlockLevel: 0 },
      { id: 'quanzhen_sword', icon: '⚔️', name: '北斗演剑', desc: '踏天罡步，演北斗七星剑阵', exp: 45, gold: 0, contribution: 4, unlockChapter: 2, unlockLevel: 4 },
      { id: 'sect_fabao_shop', icon: '🏪', name: '法器兑换', desc: '以宗门贡献兑换法宝，藏经阁道藏浩瀚', exp: 0, gold: 0, contribution: 0, unlockChapter: 2, unlockLevel: 0 },
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
    connections: ['changan_city'],
    actions: [
      { id: 'join_sect', icon: '🏯', name: '拜入师门', desc: '在崆峒山洞前叩拜入派，修习裂石拳奥义', exp: 0, gold: 0, sectTarget: 'kongtong', requireNoSect: true, unlockChapter: 2 },
      { id: 'kongtong_spar', icon: '👊', name: '裂石练拳', desc: '以裂石拳谱磨砺拳劲，碎石如泥方得精进', exp: 42, gold: 0, contribution: 4, unlockChapter: 2, unlockLevel: 0 },
      { id: 'kongtong_meditate', icon: '🧘', name: '洞中养伤', desc: '裂石拳刚猛霸道，需于洞中静养调理筋骨', exp: 25, gold: 0, contribution: 2, unlockChapter: 2, unlockLevel: 0 },
      { id: 'sect_fabao_shop', icon: '🏪', name: '法器兑换', desc: '以宗门贡献兑换法宝，山洞秘库藏有疗伤奇珍', exp: 0, gold: 0, contribution: 0, unlockChapter: 2, unlockLevel: 0 },
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
      { id: 'diancang_sword', icon: '🗡️', name: '点苍试剑', desc: '在苍山绝壁练剑，云雾缭绕间剑意自生', exp: 48, gold: 0, contribution: 5, unlockChapter: 5, unlockLevel: 0 },
      { id: 'diancang_cloud', icon: '☁️', name: '观云悟剑', desc: '静观苍山云海变幻，剑法意境随之提升', exp: 42, gold: 0, contribution: 3, unlockChapter: 5, unlockLevel: 0 },
      { id: 'sect_fabao_shop', icon: '🏪', name: '法器兑换', desc: '以宗门贡献兑换法宝，苍山石室中藏有南疆奇珍', exp: 0, gold: 0, contribution: 0, unlockChapter: 5, unlockLevel: 0 },
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
    connections: ['yangzhou_city', 'tanzhou_city'],
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
    connections: ['tanzhou_city'],
    unlockChapter: 5,
    actions: [
      { id: 'city_meditate', icon: '🧘', name: '城中静修', desc: '在客栈中静心打坐，感悟天地', exp: 30, gold: 0, contribution: 0, unlockChapter: 5, unlockLevel: 0 },
      { id: 'city_fabao_shop', icon: '🏬', name: '灵宝阁',   desc: '随机出售法宝，淘到就是赚到',     exp: 0, gold: 0, contribution: 0, unlockChapter: 5, unlockLevel: 0 },
      { id: 'overseas_trade', icon: '🏴‍☠️', name: '海商贸易', desc: '与海外商贾交易，稀有宝物概率更高', exp: 30, gold: 35, contribution: 0, unlockChapter: 5, unlockLevel: 0 },
    ],
  },

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

export function isLocationUnlocked(id: LocationId, currentChapter: number): boolean {
  const loc = WORLD_MAP[id];
  if (!loc) return false;
  if (!loc.unlockChapter) return true;
  return currentChapter >= loc.unlockChapter;
}

export function getAvailableDestinations(
  currentLocationId: LocationId,
  currentChapter: number
): MapLocation[] {
  const current = WORLD_MAP[currentLocationId];
  if (!current) return [];

  return current.connections
    .map(id => WORLD_MAP[id])
    .filter(loc => isLocationUnlocked(loc.id, currentChapter));
}

export function getLocationBackground(locationId: LocationId): string {
  return WORLD_MAP[locationId]?.backgroundImg ?? 'picture/scene/default.png';
}