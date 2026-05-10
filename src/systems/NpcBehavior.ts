import type { SkillId, FabaoId, SectId } from '../data/types';
import { SKILLS } from '../data/skills';
import { FABAO } from '../data/fabao';
import { getRealmByLevel } from '../data/types';
import type { NpcStats, NpcPersonality } from '../data/npcStats';
import { NPC_STATS_INIT, PERSONALITY } from '../data/npcStats';
import { TALENTS } from '../data/realmConfig';
import { getPlayer, setPlayer } from '../state/GameState';
import { calculateFinalStats } from '../data/realmConfig';
import { WORLD_MAP, type LocationId } from '../data/worldMap';
import { FACTION_DEFS, type FactionAlignment } from '../data/sandboxTypes';
import { SECTS } from '../data/sects';
import { changeNpcAffection, getNpcAffection } from '../screens/camp/RelationPanel';
import { generateAllNpcs } from './NPCGenerator';

// ── 武当派技能学习表（等级 → SkillId） ──
const WUDANG_SKILL_TABLE: Array<[number, SkillId]> = [
  [1,  'wudang_changquan'], [2, 'yangqi_jue'], [3, 'wudang_jianfa_basic'], [4, 'wudang_qinggong'],
  [11, 'mianzhang'], [12, 'wudang_sword'], [13, 'zixiao'], [14, 'wudang_huti'], [15, 'wudang_lianjian'],
  [21, 'taiji'], [22, 'taiji_jian'], [23, 'liangyi_sword'], [24, 'chunyang_gong'], [25, 'wudang_zhenfa'],
];

// ── NPC 初始位置映射 ──
const NPC_INITIAL_LOCATION: Record<string, LocationId> = {
  // 武当派
  'liu_qinghan':       'wudang_mountain',
  'shen_nishang':      'wudang_mountain',
  'mo_jiangqing':      'wudang_mountain',
  'zhang_xuansu':      'wudang_mountain',
  'chen_jingxu':       'wudang_mountain',
  'lu_chengzhou':      'wudang_mountain',
  'gu_xiaosang':       'wudang_mountain',
  'song_zhiyuan':      'wudang_mountain',
  'ji_wushuang_npc':   'wudang_mountain',
  'su_yunxiu_npc':     'wudang_mountain',
  'fang_zhonghe_npc':  'wudang_mountain',
  'meng_wenyuan':      'wudang_mountain',
  'ye_ziyi':           'wudang_mountain',
  // 🆕 沙盒：少林派
  'shaolin_kongwen':   'shaolin_temple',
  'shaolin_kongjian':  'shaolin_temple',
  // 🆕 沙盒：峨眉派
  'emei_miejue':       'emei_mountain',
  'emei_jingxuan':     'emei_mountain',
  // 🆕 沙盒：丐帮
  'beggar_hong':       'beggar_hq',
  'beggar_lu':         'beggar_hq',
  // 🆕 沙盒：华山派
  'huashan_master':    'changan_city',
  'huashan_feng':      'changan_city',
  // 🆕 沙盒：魔教
  'demon_master':      'yangzhou_city',
  'demon_yang':        'yangzhou_city',
  // 🆕 沙盒：城市官员
  'kaifeng_fuyin':     'kaifeng_city',
  'luoyang_zhifu':     'luoyang_city',
  'changan_zhifu':     'changan_city',
  'xiangyang_zhifu':   'xiangyang_city',
  'jiangling_zhifu':   'jiangling_city',
  'chengdu_zhifu':     'chengdu_city',
  'yangzhou_zhizhou':  'yangzhou_city',
  'suzhou_zhizhou':    'suzhou_city',
  'hangzhou_zhifu':    'hangzhou_city',
  'dali_guoxiang':     'dali_city',
};

// ── 移动概率配置 ──
const BASE_MOVE_CHANCE = 0.35;  // 35% 基础移动概率

const TALENT_MOVE_MODIFIER: Partial<Record<string, number>> = {
  lazy: -0.10,      // 贪玩的NPC更不爱动
  diligent: 0.10,   // 勤勉的NPC更喜欢走动
};

// ── 势力倾向行为修正常量 ──

/** 势力倾向对行为概率的修正 */
const ALIGNMENT_BEHAVIOR_MOD: Record<string, { buyFabao: number; learnSkill: number }> = {
  righteous:  { buyFabao: -0.10, learnSkill: +0.10 }, // 正道：更倾向修炼和学习
  neutral:    { buyFabao:  0.00, learnSkill:  0.00 }, // 中立：行为均衡
  unorthodox: { buyFabao: +0.10, learnSkill: -0.05 }, // 邪道：更倾向追逐法器
  chaotic:    { buyFabao: +0.10, learnSkill: -0.10 }, // 混乱：追逐物质力量
};

/** 门派 LocationId → SectId 映射（用于移动偏好判断） */
const LOCATION_TO_SECT: Partial<Record<LocationId, SectId>> = {
  wudang_mountain: 'wudang',
  shaolin_temple: 'shaolin',
  emei_mountain: 'emei',
  beggar_hq: 'beggar',
};

/** 正道 NPC 移动至友好/同盟势力地点的权重倍数 */
const RIGHTEOUS_FRIENDLY_MOVE_WEIGHT = 3.0;

/** 混乱 NPC 移动偏好：每点危险等级增加的权重系数 */
const CHAOTIC_DANGER_WEIGHT_MULT = 0.8;

function getLearnableSkills(npc: NpcStats): SkillId[] {
  if (npc.sect !== 'wudang') return [];
  return WUDANG_SKILL_TABLE
    .filter(([lv, sid]) => lv <= npc.level && !npc.skills.includes(sid))
    .map(([, sid]) => sid);
}

function getMissingSlots(npc: NpcStats): Array<'weapon' | 'armor' | 'accessory'> {
  const slots: Array<'weapon' | 'armor' | 'accessory'> = [];
  if (!npc.equippedFabao.weapon)    slots.push('weapon');
  if (!npc.equippedFabao.armor)     slots.push('armor');
  if (!npc.equippedFabao.accessory) slots.push('accessory');
  return slots;
}

function pickFabao(slot: 'weapon' | 'armor' | 'accessory', npcLevel: number, higherRealm: boolean): FabaoId | null {
  const typeMap = { weapon: 'weapon', armor: 'armor', accessory: 'accessory' } as const;
  const realmOrder: Array<ReturnType<typeof getRealmByLevel>> = [
    'lianqi', 'zhuji', 'jiedan', 'yuanying', 'huashen', 'dujie', 'dacheng', 'feisheng',
  ];
  const baseRealm = getRealmByLevel(npcLevel) ?? 'lianqi';
  const baseIdx = realmOrder.indexOf(baseRealm);
  const targetIdx = higherRealm ? Math.min(baseIdx + 1, realmOrder.length - 1) : baseIdx;
  const targetRealm = realmOrder[targetIdx];

  const candidates = Object.values(FABAO).filter(
    f => f.type === typeMap[slot] && f.realm === targetRealm,
  );
  return candidates.length > 0 ? candidates[0]!.id : null;
}

function expNeeded(level: number): number {
  return Math.floor(42 * Math.pow(level, 1.1));
}

// ── Public API ──

export function initNpcDatabase(): Record<string, NpcStats> {
  const db: Record<string, NpcStats> = {};

  // 1. 手写 NPC（核心角色）
  for (const [id, init] of Object.entries(NPC_STATS_INIT)) {
    // 优先使用 NPC 数据中指定的位置，否则从位置映射表取，最后回退到武当山
    const initialLoc = init.currentLocationId ?? NPC_INITIAL_LOCATION[id] ?? 'wudang_mountain';
    db[id] = { ...init, exp: 0, currentLocationId: initialLoc };
  }

  // 2. 随机生成 NPC（填充地图）
  const generated = generateAllNpcs();
  for (const [id, npc] of Object.entries(generated)) {
    if (db[id]) {
      console.warn(`[NPCGenerator] ID conflict: ${id} already exists, skipping`);
      continue;
    }
    db[id] = npc;
  }

  return db;
}

export function getNpcStats(id: string): NpcStats | null {
  return getPlayer().npcDatabase?.[id] ?? null;
}

export interface NpcTickResult {
  npcId: string;
  npcName: string;
  action: 'buy_fabao' | 'learn_skill' | 'cultivate' | 'move';
  outcome: string;
  detail: string;
}

/**
 * NPC 回合行为引擎
 * 
 * 每回合每个 NPC 从以下 4 种行为中随机选择一项：
 * 1. 购买法器（40%概率，需有空槽位）
 * 2. 学习技能（30%概率，需有可学技能）
 * 3. 修炼（剩余概率补齐）
 * 4. 移动（在以上 3 项判定后，额外独立判定）
 * 
 * 移动是独立于前 3 项的额外判定：每个 NPC 有基础 35% 概率移动（受天赋影响），
 * 随机走到相邻地点。
 * 
 * @returns 所有 NPC 本回合的行为结果
 */
export function tickNpcBehaviors(): NpcTickResult[] {
  const p = getPlayer();
  if (!p.npcDatabase) return [];

  const results: NpcTickResult[] = [];
  const updatedDb = { ...p.npcDatabase };

  for (const [id, npc] of Object.entries(updatedDb)) {
    const n: NpcStats = {
      ...npc,
      equippedFabao: { ...npc.equippedFabao },
      skills: [...npc.skills],
      ownedFabao: [...npc.ownedFabao],
    };

    const talent = TALENTS[n.talent];
    const missingSlots    = getMissingSlots(n);
    const learnableSkills = getLearnableSkills(n);

    // ── 行为 1-3：购买法器 / 学习技能 / 修炼 ──
    // 基础概率 + 势力倾向修正（正道更爱学习，混乱更爱追逐法器）
    const alignment = (SECTS[n.sect]?.alignment ?? 'neutral') as string;
    const alignMod = ALIGNMENT_BEHAVIOR_MOD[alignment] ?? ALIGNMENT_BEHAVIOR_MOD.neutral;
    let pBuyFabao   = missingSlots.length    > 0 ? Math.max(0, 0.40 + alignMod.buyFabao)   : 0;
    let pLearnSkill = learnableSkills.length  > 0 ? Math.max(0, 0.30 + alignMod.learnSkill) : 0;
    // 归一化：确保总和不超过 1.0
    const totalP = pBuyFabao + pLearnSkill;
    if (totalP > 1.0) {
      pBuyFabao   /= totalP;
      pLearnSkill /= totalP;
    }
    const pCultivate = 1.0 - pBuyFabao - pLearnSkill;

    const rand = Math.random();
    let result: NpcTickResult;

    if (rand < pBuyFabao) {
      // 购买法器
      const slot = missingSlots[Math.floor(Math.random() * missingSlots.length)]!;
      const slotLabel = slot === 'weapon' ? '武器' : slot === 'armor' ? '防具' : '饰品';
      const sub = Math.random();

      if (sub < 0.20) {
        const id2 = pickFabao(slot, n.level, true);
        if (id2 && !n.ownedFabao.includes(id2)) {
          n.ownedFabao.push(id2); n.equippedFabao[slot] = id2;
          result = { npcId: id, npcName: n.name, action: 'buy_fabao', outcome: '淘到宝了',   detail: `${n.name}购得高阶${slotLabel}！` };
        } else {
          result = { npcId: id, npcName: n.name, action: 'buy_fabao', outcome: '来晚了',     detail: `${n.name}没能买到法器。` };
        }
      } else if (sub < 0.50) {
        const id2 = pickFabao(slot, n.level, false);
        if (id2 && !n.ownedFabao.includes(id2)) {
          n.ownedFabao.push(id2); n.equippedFabao[slot] = id2;
          result = { npcId: id, npcName: n.name, action: 'buy_fabao', outcome: '一分钱一分货', detail: `${n.name}买到了同阶${slotLabel}。` };
        } else {
          result = { npcId: id, npcName: n.name, action: 'buy_fabao', outcome: '来晚了',     detail: `${n.name}没能买到法器。` };
        }
      } else {
        result = { npcId: id, npcName: n.name, action: 'buy_fabao', outcome: '来晚了',       detail: `${n.name}没能买到法器。` };
      }

    } else if (rand < pBuyFabao + pLearnSkill) {
      // 学习技能
      const successRate = 0.50 + talent.skillLearnBonus;
      if (Math.random() < successRate) {
        const skill = learnableSkills[Math.floor(Math.random() * learnableSkills.length)]!;
        n.skills.push(skill);
        const skillName = SKILLS[skill]?.name ?? skill;
        result = { npcId: id, npcName: n.name, action: 'learn_skill', outcome: '成功领悟', detail: `${n.name}领悟了「${skillName}」！` };
      } else {
        result = { npcId: id, npcName: n.name, action: 'learn_skill', outcome: '领悟失败', detail: `${n.name}未能领悟技能。` };
      }

    } else {
      // 修炼
      const sub = Math.random();
      let expGain: number;
      let outcome: string;
      if (sub < 0.10) {
        expGain = Math.floor(30 * talent.cultivationMul); outcome = '天人合一';
      } else if (sub < 0.90) {
        expGain = Math.floor(15 * talent.cultivationMul); outcome = '修行';
      } else {
        expGain = Math.floor(5  * talent.cultivationMul); outcome = '走火入魔';
      }

      n.exp += expGain;
      if (n.exp >= expNeeded(n.level)) {
        n.exp -= expNeeded(n.level);
        n.level += 1;
        const newStats = calculateFinalStats(n.level, [n.talent]);
        n.maxHp = newStats.hp; n.hp = n.maxHp;
        n.maxMp = newStats.mp; n.mp = n.maxMp;
        n.atk   = newStats.atk;
        n.def   = newStats.def;
        n.agi   = newStats.agi;
        n.crit  = newStats.crit;
      }

      result = { npcId: id, npcName: n.name, action: 'cultivate', outcome, detail: `${n.name}${outcome}，获得 ${expGain} 点修为。` };
    }

    updatedDb[id] = n;
    results.push(result);

    // ── 行为 4：移动（独立判定，在前 3 项之后） ──
    const currentLocId = n.currentLocationId ?? 'wudang_mountain';
    const currentLoc = WORLD_MAP[currentLocId];
    if (currentLoc && currentLoc.connections.length > 0) {
      // 计算移动概率（基础概率 + 天赋修正）
      let moveChance = BASE_MOVE_CHANCE;
      const talentModifier = TALENT_MOVE_MODIFIER[n.talent];
      if (talentModifier) {
        moveChance += talentModifier;
      }
      moveChance = Math.max(0.1, Math.min(0.7, moveChance));

      if (Math.random() < moveChance) {
        // ── 势力倾向影响移动目的地选择 ──
        let destId: LocationId;

        if (alignment === 'righteous') {
          // 正道 NPC：偏向前往友好/同盟势力所在的附近地点
          const relations = p.factionRelations?.[n.sect] ?? {};
          const weights = currentLoc.connections.map(cid => {
            let w = 1.0;
            const targetSect = LOCATION_TO_SECT[cid];
            if (targetSect) {
              const rel = relations[targetSect];
              if (rel && (rel.relation === 'allied' || rel.relation === 'friendly')) {
                w = RIGHTEOUS_FRIENDLY_MOVE_WEIGHT;
              }
            }
            return { id: cid, weight: w };
          });
          const totalW = weights.reduce((sum, w) => sum + w.weight, 0);
          let randW = Math.random() * totalW;
          let chosen = weights[0]!;
          for (const w of weights) {
            randW -= w.weight;
            if (randW <= 0) { chosen = w; break; }
          }
          destId = chosen.id;
        } else if (alignment === 'chaotic') {
          // 混乱 NPC：偏向前往危险等级更高的地点
          const weights = currentLoc.connections.map(cid => {
            const loc = WORLD_MAP[cid];
            const dangerBonus = loc ? loc.dangerLevel * CHAOTIC_DANGER_WEIGHT_MULT : 0;
            return { id: cid, weight: 1.0 + dangerBonus };
          });
          const totalW = weights.reduce((sum, w) => sum + w.weight, 0);
          let randW = Math.random() * totalW;
          let chosen = weights[0]!;
          for (const w of weights) {
            randW -= w.weight;
            if (randW <= 0) { chosen = w; break; }
          }
          destId = chosen.id;
        } else {
          // 中立/邪道NPC：均匀随机移动
          destId = currentLoc.connections[Math.floor(Math.random() * currentLoc.connections.length)]!;
        }

        const destLoc = WORLD_MAP[destId];
        if (destLoc) {
          n.currentLocationId = destId;
          updatedDb[id] = n;
          results.push({
            npcId: id,
            npcName: n.name,
            action: 'move',
            outcome: '移动',
            detail: `${n.name}离开了${currentLoc.name}，前往${destLoc.name}。`,
          });
        }
      }
    }
  }

  setPlayer({ ...p, npcDatabase: updatedDb });

  // ── NPC 之间的自主互动 ──
  const npcInteractions = tickNpcToNpcInteractions();
  for (const ni of npcInteractions) {
    results.push({
      npcId: ni.npcA,
      npcName: ni.npcAName,
      action: 'move', // 复用 action 类型，通过 outcome 区分
      outcome: `互动·${ni.type === 'conversation' ? '交谈' : ni.type === 'spar' ? '切磋' : '送礼'}`,
      detail: ni.detail,
    });
  }

  return results;
}

/**
 * 获取指定地点的所有 NPC
 */
export function getNpcsAtLocation(locationId: LocationId): NpcStats[] {
  const p = getPlayer();
  if (!p.npcDatabase) return [];
  return Object.values(p.npcDatabase).filter(
    npc => (npc.currentLocationId ?? 'wudang_mountain') === locationId
  );
}

// ═════════════════════════════════════════════════════════
//  NPC 之间的自主互动
// ═════════════════════════════════════════════════════════

export interface NpcInteractionResult {
  npcA: string;
  npcAName: string;
  npcB: string;
  npcBName: string;
  type: 'conversation' | 'spar' | 'gift';
  detail: string;
  affectionDelta: number;
}

/**
 * 在同一地点的 NPC 之间触发随机互动
 * 在 tickNpcBehaviors 中调用
 */
export function tickNpcToNpcInteractions(): NpcInteractionResult[] {
  const p = getPlayer();
  if (!p.npcDatabase) return [];

  const results: NpcInteractionResult[] = [];
  const npcs = Object.values(p.npcDatabase);

  // 按地点分组
  const byLocation = new Map<string, NpcStats[]>();
  for (const npc of npcs) {
    const locId = npc.currentLocationId ?? 'wudang_mountain';
    if (!byLocation.has(locId)) byLocation.set(locId, []);
    byLocation.get(locId)!.push(npc);
  }

  // 每对 NPC 有 15% 概率发生一次互动
  for (const [, group] of byLocation) {
    if (group.length < 2) continue;
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        if (Math.random() > 0.15) continue;

        const npcA = group[i]!;
        const npcB = group[j]!;
        const result = simulateNpcPairInteraction(npcA, npcB);
        if (result) results.push(result);
      }
    }
  }

  return results;
}

function simulateNpcPairInteraction(a: NpcStats, b: NpcStats): NpcInteractionResult | null {
  const aPers = a.personality ?? 'gentle';
  const bPers = b.personality ?? 'gentle';

  const roll = Math.random();
  let type: 'conversation' | 'spar' | 'gift';
  let detail: string;
  let affectionDelta = 0;

  const aName = a.name;
  const bName = b.name;

  if (roll < 0.5) {
    // 交谈
    type = 'conversation';
    const talkTopics = [
      '谈论江湖轶事', '交流修炼心得', '抱怨师门琐事',
      '闲聊天气变化', '讨论丹药配方', '说起最近的奇遇',
    ];
    const topic = talkTopics[Math.floor(Math.random() * talkTopics.length)]!;
    affectionDelta = 1;
    detail = `${aName}与${bName}${topic}。`;
  } else if (roll < 0.8) {
    // 切磋
    type = 'spar';
    const aWin = Math.random() < 0.5;
    if (aWin) {
      affectionDelta = PERSONALITY[aPers].sparWinAffection;
      detail = `${aName}在切磋中胜了${bName}。`;
    } else {
      affectionDelta = PERSONALITY[aPers].sparLoseAffection;
      detail = `${bName}在切磋中胜了${aName}。`;
    }
  } else {
    // 送礼（一方送另一方）
    type = 'gift';
    // 性格影响是否送礼：狡猾更喜欢送礼
    const aGiftChance = aPers === 'cunning' ? 0.4 : aPers === 'bold' ? 0.3 : 0.15;
    if (Math.random() < aGiftChance) {
      affectionDelta = 2;
      detail = `${aName}送了${bName}一份小礼物。`;
    } else if (Math.random() < (bPers === 'cunning' ? 0.4 : 0.15)) {
      affectionDelta = 2;
      detail = `${bName}送了${aName}一份小礼物。`;
    } else {
      return null;
    }
  }

  return {
    npcA: a.id, npcAName: aName,
    npcB: b.id, npcBName: bName,
    type, detail, affectionDelta,
  };
}