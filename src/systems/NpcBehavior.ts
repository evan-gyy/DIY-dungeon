import type { SkillId, FabaoId } from '../data/types';
import { SKILLS } from '../data/skills';
import { FABAO } from '../data/fabao';
import { getRealmByLevel } from '../data/types';
import type { NpcStats } from '../data/npcStats';
import { NPC_STATS_INIT, TALENTS } from '../data/npcStats';
import { getPlayer, setPlayer } from '../state/GameState';
import { calculateFinalStats } from '../data/realmConfig';
import { WORLD_MAP, type LocationId } from '../data/worldMap';

// ── 武当派技能学习表（等级 → SkillId） ──
const WUDANG_SKILL_TABLE: Array<[number, SkillId]> = [
  [1,  'wudang_changquan'], [2, 'yangqi_jue'], [3, 'wudang_jianfa_basic'], [4, 'wudang_qinggong'],
  [11, 'mianzhang'], [12, 'wudang_sword'], [13, 'zixiao'], [14, 'wudang_huti'], [15, 'wudang_lianjian'],
  [21, 'taiji'], [22, 'taiji_jian'], [23, 'liangyi_sword'], [24, 'chunyang_gong'], [25, 'wudang_zhenfa'],
];

// ── NPC 初始位置映射 ──
const NPC_INITIAL_LOCATION: Record<string, LocationId> = {
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
};

// ── 移动概率配置 ──
const BASE_MOVE_CHANCE = 0.35;  // 35% 基础移动概率

const TALENT_MOVE_MODIFIER: Partial<Record<string, number>> = {
  lazy: -0.10,      // 贪玩的NPC更不爱动
  diligent: 0.10,   // 勤勉的NPC更喜欢走动
};

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
    'lianqi', 'zhuji', 'jiedan', 'yuanying', 'huashen', 'dujie',
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
  for (const [id, init] of Object.entries(NPC_STATS_INIT)) {
    // 设置初始位置
    const initialLoc = NPC_INITIAL_LOCATION[id] ?? 'wudang_mountain';
    db[id] = { ...init, exp: 0, currentLocationId: initialLoc };
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
    const pBuyFabao   = missingSlots.length    > 0 ? 0.40 : 0;
    const pLearnSkill = learnableSkills.length  > 0 ? 0.30 : 0;
    const pCultivate  = 1.0 - pBuyFabao - pLearnSkill;

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
        const destId = currentLoc.connections[Math.floor(Math.random() * currentLoc.connections.length)]!;
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