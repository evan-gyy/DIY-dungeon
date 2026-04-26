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

  wudangMissionAccepted: z.boolean().default(false),
  wudangGateCleared:     z.boolean().default(false),
  wudangMidCleared:      z.boolean().default(false),
  wudangElderCleared:    z.boolean().default(false),

  chapter2Route: z.enum(['', 'hotblood', 'wisdom']).default(''),

  _slot:    z.number().default(1),
  _savedAt: z.string().optional(),
});

export type PlayerStateInput = z.input<typeof PlayerStateSchema>;
