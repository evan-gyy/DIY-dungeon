import { z } from 'zod';

export const PlayerStateSchema = z.object({
  name:     z.string().default('无名'),
  charId:   z.enum(['male_good', 'male_evil', 'female_good', 'female_evil']).default('male_good'),
  charImg:  z.string().default('picture/maincharacter/male_good.png'),
  sect:     z.string().default('wudang'),

  hp:    z.number().default(80),
  maxHp: z.number().default(80),
  mp:    z.number().default(20),
  maxMp: z.number().default(20),
  atk:   z.number().default(8),
  def:   z.number().default(4),
  agi:   z.number().default(5),
  crit:  z.number().default(3),

  exp:   z.number().default(0),
  gold:  z.number().default(10),
  level: z.number().default(1),
  cultivationPoints: z.number().default(0),

  gameMode: z.enum(['story', 'sandbox']).default('story'),
  chapter: z.number().default(1),
  act:     z.number().default(0),
  tutorialDone: z.boolean().default(false),

  skills: z.array(z.string()).default([]),
  equippedSkills: z.tuple([
    z.string().nullable(),
    z.string().nullable(),
    z.string().nullable(),
    z.string().nullable(),
  ]).default([null, null, null, null]),

  inventory: z.array(z.object({
    id:    z.string(),
    name:  z.string().default(''),
    icon:  z.string().default(''),
    desc:  z.string().default(''),
    effect: z.record(z.string(), z.number()).default({}),
    count: z.number().default(1),
  })).default([]),

  attrBoosts: z.object({
    hp:  z.number().default(0),
    atk: z.number().default(0),
    def: z.number().default(0),
    agi: z.number().default(0),
    mp:  z.number().default(0),
  }).default({}),

  equippedFabao: z.object({
    weapon:    z.string().nullable().default(null),
    armor:     z.string().nullable().default(null),
    accessory: z.string().nullable().default(null),
  }).default({ weapon: null, armor: null, accessory: null }),

  ownedFabao: z.array(z.string()).default([]),

  wudangMissionAccepted: z.boolean().default(false),
  wudangGateCleared:     z.boolean().default(false),
  wudangMidCleared:      z.boolean().default(false),
  wudangElderCleared:    z.boolean().default(false),

  chapter2Route: z.enum(['', 'hotblood', 'wisdom']).default(''),

  // 第三章剧情标记
  chapter3Breakthrough: z.boolean().default(false),
  master: z.string().default(''),
  blackmoonToken: z.boolean().default(false),
  luChenzhouRespect: z.number().default(0),
  songZhiyuanGrowth: z.boolean().default(false),
  liuQinghanEngaged: z.boolean().default(false),
  trialChampion: z.boolean().default(false),
  trueDisciple: z.boolean().default(false),
  blackmoonMissionStarted: z.boolean().default(false),

  // NPC 数值卡数据库（旧存档兼容：默认为空对象，首次进入游戏时初始化）
  npcDatabase: z.record(z.string(), z.object({
    id:     z.string(),
    name:   z.string(),
    talent: z.string().optional(),  // 旧字段兼容
    talents: z.array(z.string()).default([]),  // P8: 天赋列表
    isTianjiao: z.boolean().default(false),    // P8: 天骄标记
    sect:   z.string().default('wudang'),
    level:  z.number().default(1),
    exp:    z.number().default(0),
    hp: z.number(), maxHp: z.number(),
    mp: z.number(), maxMp: z.number(),
    atk: z.number(), def: z.number(), agi: z.number(), crit: z.number(),
    skills:      z.array(z.string()).default([]),
    equippedFabao: z.object({
      weapon:    z.string().nullable().default(null),
      armor:     z.string().nullable().default(null),
      accessory: z.string().nullable().default(null),
    }).default({ weapon: null, armor: null, accessory: null }),
    ownedFabao: z.array(z.string()).default([]),
    // NPC当前所在地点
    currentLocationId: z.string().default('wudang_mountain'),
    // 🆕 双身份系统
    discipleRank: z.string().default('outer'),
    courtRank:    z.string().default('commoner'),
    // 🆕 NPC性格（影响互动倍率）
    personality: z.enum(['aloof','kind','cunning','upright','gentle','bold']).default('gentle'),
    // 🆕 朝廷属性
    courtStats: z.object({
      strategy: z.number().default(5),
      eloquence: z.number().default(5),
      charisma: z.number().default(5),
      scholarship: z.number().default(5),
    }).default({ strategy: 5, eloquence: 5, charisma: 5, scholarship: 5 }),
    influence: z.number().default(0),
    courtPath: z.enum(['wen', 'wu']).nullable().default(null),
    // 🆕 立绘系统
    gender: z.enum(['male','female']).default('male'),
    portraitIndex: z.number().optional(),
    // 🆕 近期经历日志
    recentLog: z.array(z.string()).default([]),
    // 🆕 P8: NPC志向（驱动自主行为）
    ambition: z.enum(['content','master','power','rebel','avenger']).default('content'),
  })).default({}),

  // 🆕 NPC 好感度字典
  npcAffection: z.record(z.string(), z.number()).default({}),
  // 🆕 P8: NPC 间友好度字典
  npcRelationship: z.record(z.string(), z.number()).default({}),

  // 🆕 突破解锁状态（旧存档兼容：默认为空数组）
  realmBreakUnlocked: z.array(z.string()).default([]),
  // 🆕 宗门身份（武林之中 / 旧存档兼容：默认外门）
  discipleRank: z.string().default('outer'),
  // 🆕 庙堂身份（庙堂之上 / 旧存档兼容：默认平民）
  courtRank: z.string().default('commoner'),

  // 🆕 沙盒：宗门贡献值系统
  sectContribution: z.number().default(0),
  contributionLog: z.array(z.object({
    amount: z.number(),
    source: z.string(),
    reason: z.string(),
    timestamp: z.number(),
  })).default([]),
  // 🆕 沙盒：晋升系统
  completedTrials: z.array(z.string()).default([]),
  reputation: z.number().default(0),

  // 🆕 NPC 收纳系统（已招募的随从 + 指派）
  npcCollection: z.object({
    recruited: z.array(z.string()).default([]),
    maxSlots: z.number().default(0),
    assignments: z.record(z.string(), z.string()).default({}),
    assignmentTargets: z.record(z.string(), z.string()).default({}),
  }).default({ recruited: [], maxSlots: 0, assignments: {}, assignmentTargets: {} }),

  // 🆕 沙盒：当前接取的主命任务列表
  activeMissions: z.array(z.object({
    defId: z.string(),
    status: z.string().default('accepted'),
    acceptedAt: z.number().default(0),
    progress: z.number().default(0),
    progressMax: z.number().default(1),
  })).default([]),

  // 🆕 沙盒：势力外交关系（旧存档兼容）
  factionRelations: z.record(z.string(), z.record(z.string(), z.object({
    relation: z.string().default('neutral'),
    trust: z.number().default(50),
    lastEvent: z.string().optional(),
    lastEventTurn: z.number().optional(),
  }))).default({}),
  diplomacyTickCounter: z.number().default(0),

  // 🆕 朝廷系统
  courtStats: z.object({
    strategy: z.number().default(10),
    eloquence: z.number().default(10),
    charisma: z.number().default(10),
    scholarship: z.number().default(10),
  }).default({ strategy: 10, eloquence: 10, charisma: 10, scholarship: 10 }),
  influence: z.number().default(0),
  courtPath: z.enum(['wen', 'wu']).nullable().default(null),
  lastActionType: z.enum(['martial', 'court', 'idle']).default('idle'),

  // 🆕 沙盒：世界态势系统（江湖演化引擎）
  worldState: z.object({
    worldEvents: z.array(z.object({
      eventId: z.string(), turn: z.number(), timestamp: z.number(),
    })).default([]),
    turn: z.number().default(0),
    lastEvolveTurn: z.number().default(0),
  }).optional(),

  // 🆕 沙盒：个人日志系统
  chronicle: z.object({
    entries: z.array(z.object({
      id: z.string(), turn: z.number(), timestamp: z.number(),
      category: z.string(), title: z.string(), description: z.string(),
      locationId: z.string().optional(), relatedSect: z.string().optional(),
    })).default([]),
    entryCounter: z.number().default(0),
  }).optional(),

  // 世界地图系统
  currentLocationId: z.string().default('wudang_mountain'),  // 玩家当前所在地点（默认武当山）

  // 主角天赋系统
  playerTalent: z.string().default('dragon_vein'),  // 主角天赋（默认九霄龙脉）

  // 🆕 主角与 NPC 的关系标签
  npcRelations: z.record(z.string(), z.array(z.enum(['lover','sworn_brother','master','student','friend','enemy']))).default({}),

  // 🆕 势力领土控制
  territoryControl: z.record(z.string(), z.string()).default({}),

  // 🆕 江湖传闻
  worldNews: z.array(z.object({
    text: z.string(),
    turn: z.number(),
    leftTime: z.number(),
  })).default([]),

  // 🆕 攻城冷却
  siegeCooldown: z.record(z.string(), z.number()).default({}),

  // 🆕 时间系统
  gameMonth: z.number().default(1),
  turnInMonth: z.number().default(0),
  councilCooldown: z.number().default(0),

  // 🆕 门派经营
  sectState: z.record(z.string(), z.object({
    resources: z.number().default(200),
    stability: z.number().default(50),
    prosperity: z.number().default(30),
  })).default({}),

  // 🆕 P7 城池繁荣度
  cityProsperity: z.record(z.string(), z.number()).default({}),
  // 🆕 P7 势力力量分
  sectPower: z.record(z.string(), z.number()).default({}),
  // 🆕 P7 江湖大事件冷却
  grandEventCooldown: z.number().default(0),
  // 🆕 P7 玩家大事件选择历史
  grandEventHistory: z.array(z.object({
    eventId: z.string(),
    choice: z.string(),
    month: z.number(),
  })).default([]),
  // 🆕 P7 势力联盟
  coalitions: z.array(z.object({
    name: z.string(),
    targetSect: z.string(),
    members: z.array(z.string()),
    formedMonth: z.number(),
    expireMonth: z.number(),
  })).default([]),

  _slot:    z.number().default(1),
  _savedAt: z.string().optional(),
});

export type PlayerStateInput = z.input<typeof PlayerStateSchema>;
