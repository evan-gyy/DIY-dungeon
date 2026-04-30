import { z } from 'zod';

export const PlayerStateSchema = z.object({
  name:     z.string().default('无名'),
  charId:   z.enum(['male_good', 'male_evil', 'female_good', 'female_evil']).default('male_good'),
  charImg:  z.string().default('picture/maincharacter/male_good.png'),
  sect:     z.enum(['wudang', 'emei', 'shaolin', 'beggar', 'huashan', 'demon']).default('wudang'),

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
    talent: z.string().default('normal'),
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
  })).default({}),

  // 世界地图系统
  currentLocationId: z.string().default('wudang_mountain'),  // 玩家当前所在地点（默认武当山）

  // 主角天赋系统
  playerTalent: z.string().default('dragon_vein'),  // 主角天赋（默认九霄龙脉）

  _slot:    z.number().default(1),
  _savedAt: z.string().optional(),
});

export type PlayerStateInput = z.input<typeof PlayerStateSchema>;
