// ============================================================
//  src/systems/FactionWarfare.ts — 势力领土争夺系统
// ============================================================
//  每回合有一定概率触发攻城事件：
//  1. 选攻击方势力
//  2. 选目标城市（相邻 + 被其他势力控制）
//  3. 双方各选 4 名 NPC → 战力值加权骰子判定胜负
//  4. 更新领土控制 + 生成江湖传闻 + 写入 NPC 日志
// ============================================================

import type { SectId, WorldNewsItem, SkillId } from '../data/types';
import type { LocationId } from '../data/worldMap';
import type { NpcStats } from '../data/npcStats';
import { WORLD_MAP } from '../data/worldMap';
import { FACTION_DEFS, type FactionAlignment } from '../data/sandboxTypes';
import { SECTS } from '../data/sects';
import { getPlayer, setPlayer } from '../state/GameState';
import { appendNpcLog } from './NpcBehavior';
import { getNpcAffection, changeNpcAffection } from './NpcRelationship';
import { spendSiegeCost, applySiegeResult, getSectDefenseMultiplier, computeSectPower } from './SectManagement';

// ──── 配置 ────

/** 基础攻城触发概率（每回合） */
const BASE_SIEGE_CHANCE = 0.15;

/** 势力关系 hostile 时额外概率 */
const HOSTILE_BONUS = 0.20;

/** 势力关系 at_war 时额外概率 */
const AT_WAR_BONUS = 0.30;

/** 同一地点攻城冷却（回合数） */
const SIEGE_COOLDOWN = 10;

/** 战斗结果文本模板 */
const SIEGE_RESULT_TEXT: Record<string, { win: string; lose: string }> = {
  righteous:  { win: '大获全胜', lose: '铩羽而归' },
  neutral:    { win: '成功攻占', lose: '无功而返' },
  chaotic:    { win: '血洗城池', lose: '溃不成军' },
};

/** 波次标签 */
type WaveId = 'gate' | 'street' | 'final';

const WAVE_NAMES: Record<WaveId, string> = {
  gate:   '第一波 · 城门鏖战',
  street: '第二波 · 街巷厮杀',
  final:  '第三波 · 大殿决战',
};

// ──── 多波次攻城状态 ────

interface MultiWaveSiegeState {
  attackerSect: SectId;
  defenderSect: SectId;
  targetLocation: LocationId;
  /** 当前波次 */
  currentWave: WaveId;
  /** 已完成的波次结果 */
  waveResults: Array<{ wave: WaveId; attackerWin: boolean }>;
  /** 攻击方士气加成（胜波 +20%，即攻+10%） */
  attackerMorale: number;
  /** 防守方士气加成 */
  defenderMorale: number;
  /** 攻击方参战 NPC IDs */
  attackerNpcIds: string[];
  /** 防守方参战 NPC IDs */
  defenderNpcIds: string[];
  /** 攻击方精英队（用于第三波，含 leader） */
  attackerElites: string[];
  /** 防守方精英队（用于第三波） */
  defenderElites: string[];
}

// ──── 领土初始化 ────

/** 门派据点 → 对应 SectId 映射 */
const SECT_BASE: Partial<Record<LocationId, SectId>> = {
  wudang_mountain: 'wudang',
  shaolin_temple: 'shaolin',
  emei_mountain: 'emei',
  beggar_hq: 'beggar',
  maoshan_daoyuan: 'maoshan',
  kunlun_mountain: 'kunlun',
  qingcheng_mountain: 'qingcheng',
  tangmen_estate: 'tangmen',
  xiaoyao_valley: 'xiaoyao',
  zhongnan_mountain: 'quanzhen',
  kongtong_mountain: 'kongtong',
  diancang_mountain: 'diancang',
  huashan_base: 'huashan',
  heimu_cliff: 'riyue',
};

/**
 * 初始化领土控制状态。
 * 宗门据点默认由自己控制，城市默认无主（'none'）。
 */
export function initTerritoryControl(): Record<LocationId, SectId> {
  const p = getPlayer();
  if (p.territoryControl && Object.keys(p.territoryControl).length > 0) {
    return p.territoryControl as Record<LocationId, SectId>;
  }

  const tc: Record<string, string> = {};
  for (const locId of Object.keys(WORLD_MAP)) {
    tc[locId] = SECT_BASE[locId as LocationId] ?? 'none';
  }
  return tc as Record<LocationId, SectId>;
}

// ──── 辅助 ────

/** 获取控制某地的势力 */
export function getLocationController(locationId: LocationId): SectId {
  const p = getPlayer();
  return (p.territoryControl?.[locationId] ?? SECT_BASE[locationId] ?? 'none') as SectId;
}

/** 获取某势力的所有 NPC（在 npcDatabase 中） */
function getNpcsOfSect(sectId: SectId): NpcStats[] {
  const p = getPlayer();
  const db = p.npcDatabase;
  if (!db) return [];
  return Object.values(db).filter(n => n.sect === sectId);
}

/** 获取某势力在特定地点的 NPC */
function getNpcsAtLocation(locationId: LocationId): NpcStats[] {
  const p = getPlayer();
  const db = p.npcDatabase;
  if (!db) return [];
  return Object.values(db).filter(n => n.currentLocationId === locationId);
}

/** 获取某势力的 alignment */
function getAlignment(sectId: SectId): FactionAlignment {
  return FACTION_DEFS[sectId]?.alignment ?? 'neutral';
}

/**
 * 计算队伍战力值
 * 战力 = Σ(HP×0.3 + ATK×0.4 + DEF×0.2 + AGI×0.1)
 * 大势力加成：势力控制城市数越多、资源越丰、越稳定，战力越强
 */
function calcTeamPower(npcs: NpcStats[], factionId?: SectId): number {
  let power = npcs.reduce((sum, n) => {
    return sum + n.hp * 0.3 + n.atk * 0.4 + n.def * 0.2 + n.agi * 0.1;
  }, 0);

  if (factionId && npcs.length > 0) {
    const p = getPlayer();
    const tc = p.territoryControl ?? {};
    const controlledCities = Object.values(tc).filter(s => s === factionId).length;
    const state = p.sectState?.[factionId];
    const resources = state?.resources ?? 0;
    const stability = state?.stability ?? 0;

    let bonus = 1.0;
    if (controlledCities >= 6) bonus *= 1.2;
    else if (controlledCities >= 3) bonus *= 1.1;
    if (resources >= 300) bonus *= 1.05;
    if (stability >= 70) bonus *= 1.05;

    power = Math.floor(power * bonus);
  }

  return power;
}

/** 获取两个势力间的关系（从 factionRelations） */
function getFactionRelation(sectA: SectId, sectB: SectId): string {
  const p = getPlayer();
  return p.factionRelations?.[sectA]?.[sectB]?.relation ?? 'neutral';
}

/** 恶化势力间关系 */
function worsenFactionRelation(sectA: SectId, sectB: SectId, amount: number): void {
  const p = getPlayer();
  const fr = { ...p.factionRelations };
  if (!fr[sectA]) fr[sectA] = {};
  if (!fr[sectB]) fr[sectB] = {};

  const ab = fr[sectA]?.[sectB];
  const ba = fr[sectB]?.[sectA];

  fr[sectA] = { ...fr[sectA], [sectB]: {
    relation: (ab?.trust ?? 50) - amount < 20 ? 'hostile' : ab?.relation ?? 'neutral',
    trust: Math.max(0, (ab?.trust ?? 50) - amount),
    lastEvent: '攻城战',
    lastEventTurn: p.worldState?.turn ?? 0,
  }};
  fr[sectB] = { ...fr[sectB], [sectA]: {
    relation: (ba?.trust ?? 50) - amount < 20 ? 'hostile' : ba?.relation ?? 'neutral',
    trust: Math.max(0, (ba?.trust ?? 50) - amount),
    lastEvent: '攻城战',
    lastEventTurn: p.worldState?.turn ?? 0,
  }};

  setPlayer({ ...p, factionRelations: fr });
}

// ──── 攻城主逻辑 ────

export interface SiegeResult {
  happened: boolean;
  attackerSect?: SectId;
  defenderSect?: SectId;
  targetLocation?: LocationId;
  attackerWin?: boolean;
  newsText?: string;
}

/**
 * 尝试触发一次攻城事件。
 * 由 Camp.ts 在回合结束后调用。
 */
export function tryTriggerSiege(): SiegeResult {
  const p = getPlayer();
  const currentTurn = (p.worldState?.turn ?? 0) + 1;

  // 1. 概率判定
  const allSects = Object.keys(FACTION_DEFS).filter(s => s !== 'none') as SectId[];
  const attackerSect = allSects[Math.floor(Math.random() * allSects.length)]!;
  const attackerAlign = getAlignment(attackerSect);

  // 2. 选目标：找一个相邻的、被其他势力控制的位置
  const tc = p.territoryControl ?? initTerritoryControl();
  const candidates: Array<{ locId: LocationId; controller: SectId }> = [];

  for (const [locId, controller] of Object.entries(tc)) {
    if (controller === attackerSect) continue;

    // 检查是否相邻（通过 WORLD_MAP 的连接关系）
    const locData = WORLD_MAP[locId as LocationId];
    if (!locData) continue;

    // 攻击方必须在某处有据点，且该据点与目标相邻
    const attackerBases = Object.entries(SECT_BASE)
      .filter(([, s]) => s === attackerSect)
      .map(([loc]) => loc as LocationId);

    const isAdjacent = attackerBases.some(base =>
      locData.connections.includes(base) ||
      (WORLD_MAP[base]?.connections.includes(locId as LocationId))
    );

    if (isAdjacent || Math.random() < 0.3) { // 30% 概率攻击非相邻地点
      candidates.push({ locId: locId as LocationId, controller: controller as SectId });
    }
  }

  if (candidates.length === 0) return { happened: false };

  const target = candidates[Math.floor(Math.random() * candidates.length)]!;
  const defenderSect = target.controller;

  // 3. 冷却检查
  const cooldowns = p.siegeCooldown ?? {};
  if ((cooldowns[target.locId] ?? 0) > currentTurn) return { happened: false };

  // 4. 资源检查
  const attackerState = p.sectState?.[attackerSect];
  if (!attackerState || attackerState.resources < 100) return { happened: false };

  // 5. 概率判定（整合势力力量分）
  const attackerPower = computeSectPower(attackerSect);
  let chance = BASE_SIEGE_CHANCE;

  if (defenderSect === 'none') {
    // 无主之地：势力分达标即可占领，概率大幅提升
    if (attackerPower < 50) return { happened: false };
    chance += 0.35;
  } else {
    const defenderPower = computeSectPower(defenderSect);
    const powerRatio = defenderPower > 0 ? attackerPower / defenderPower : 2.0;
    if (powerRatio > 1.5) chance += 0.20;
    else if (powerRatio > 1.0) chance += 0.08;
    else if (powerRatio < 0.5) chance -= 0.12;

    const relation = getFactionRelation(attackerSect, defenderSect);
    if (relation === 'hostile') chance += HOSTILE_BONUS;
    if (relation === 'at_war') chance += AT_WAR_BONUS;

    // 🆕 正邪交战倾向：阵营对立时攻城概率翻倍
    const defAlign = getAlignment(defenderSect);
    const attAlign = getAlignment(attackerSect);
    const righteousSide: FactionAlignment[] = ['righteous', 'neutral'];
    const chaoticSide: FactionAlignment[] = ['chaotic'];
    if ((righteousSide.includes(attAlign) && chaoticSide.includes(defAlign)) ||
        (chaoticSide.includes(attAlign) && righteousSide.includes(defAlign))) {
      chance *= 2.0;
      // 若守方是混乱阵营且攻方力量远超，趁虚而入
      if (chaoticSide.includes(defAlign) && attackerPower > defenderPower * 1.2) {
        chance *= 1.5;
      }
    }
  }

  chance = Math.max(0.05, Math.min(0.95, chance));
  if (Math.random() > chance) return { happened: false };

  // 6. 无主之地直接占领（无需战斗）
  const locName = WORLD_MAP[target.locId]?.name ?? target.locId;

  if (defenderSect === 'none') {
    spendSiegeCost(attackerSect);

    const newTc = { ...tc };
    newTc[target.locId] = attackerSect;
    setPlayer({ ...getPlayer(), territoryControl: newTc });

    const newCooldowns = { ...cooldowns, [target.locId]: currentTurn + SIEGE_COOLDOWN };
    setPlayer({ ...getPlayer(), siegeCooldown: newCooldowns });

    const attackerNpcs = pickTeam(attackerSect, 4);
    for (const npc of attackerNpcs) {
      appendNpcLog(npc.id, `随军进驻无主之地${locName}，未遇抵抗。`);
    }

    const newsText = `听闻${getSectName(attackerSect)}出兵占据了无主之地${locName}，势力进一步扩张。`;
    const newsItem: WorldNewsItem = { text: newsText, turn: currentTurn, leftTime: 5 };
    const currentNews = p.worldNews ?? [];
    const updatedNews = [newsItem, ...currentNews].slice(0, 10);
    setPlayer({ ...getPlayer(), worldNews: updatedNews });

    return {
      happened: true,
      attackerSect,
      defenderSect: 'none' as SectId,
      targetLocation: target.locId,
      attackerWin: true,
      newsText,
    };
  }

  // 7. 有主之地 — 选兵将，三波车轮战
  const attackerNpcs = pickTeam(attackerSect, 8);
  const defenderNpcs = pickTeam(defenderSect, 8);
  const attackerElites = pickLeaderTeam(attackerSect, 4);
  const defenderElites = pickLeaderTeam(defenderSect, 4);

  if (attackerNpcs.length < 2 || defenderNpcs.length < 2) return { happened: false };

  spendSiegeCost(attackerSect);

  // 8. 三波车轮战判定
  const defenderMult = getSectDefenseMultiplier(defenderSect);
  let attWins = 0;
  let defWins = 0;
  let attMorale = 0;
  let defMorale = 0;

  // 第一波：城门战（各出 4 人）
  const wave1AttPower = calcTeamPower(attackerNpcs.slice(0, 4), attackerSect);
  const wave1DefPower = calcTeamPower(defenderNpcs.slice(0, 4), defenderSect) * defenderMult;
  if (resolveWave(wave1AttPower, wave1DefPower)) {
    attWins++; attMorale = 20;
  } else {
    defWins++; defMorale = 20;
  }

  // 第二波：街道战（各出 4 人，含士气加成）
  const wave2AttPower = calcTeamPower(attackerNpcs.slice(4, 8), attackerSect) * (1 + attMorale / 200);
  const wave2DefPower = calcTeamPower(defenderNpcs.slice(4, 8), defenderSect) * defenderMult * (1 + defMorale / 200);
  if (resolveWave(wave2AttPower, wave2DefPower)) {
    attWins++;
  } else {
    defWins++;
  }

  // 第三波：决战（精英队，含士气加成）
  const wave3AttPower = calcTeamPower(attackerElites, attackerSect) * (1 + attMorale / 200);
  const wave3DefPower = calcTeamPower(defenderElites, defenderSect) * defenderMult * (1 + defMorale / 200);
  if (resolveWave(wave3AttPower, wave3DefPower)) {
    attWins++;
  } else {
    defWins++;
  }

  const attackerWin = attWins >= 2;

  // 9. 更新领土
  const newTc = { ...tc };
  if (attackerWin) {
    newTc[target.locId] = attackerSect;
  }

  // 10. 门派状态影响
  applySiegeResult(attackerSect, defenderSect, attackerWin);

  setPlayer({ ...getPlayer(), territoryControl: newTc });

  // 🆕 领土易主时，招降当地NPC
  if (attackerWin) {
    tryRecruitLocalNpcs(target.locId, attackerSect, defenderSect);
  }

  // 11. 冷却
  const newCooldowns = { ...cooldowns, [target.locId]: currentTurn + SIEGE_COOLDOWN };
  setPlayer({ ...getPlayer(), siegeCooldown: newCooldowns });

  // 12. 势力关系恶化
  worsenFactionRelation(attackerSect, defenderSect, 15);

  // 13. 日志
  const alignmentText = SIEGE_RESULT_TEXT[attackerAlign] ?? { win: '攻占成功', lose: '战败撤退' };
  const resultText = attackerWin ? alignmentText.win : alignmentText.lose;
  const newsText = `听闻${getSectName(attackerSect)}攻击了${getSectName(defenderSect)}掌控下的${locName}，最终${resultText}。`;

  for (const npc of [...attackerNpcs, ...defenderNpcs]) {
    appendNpcLog(npc.id, `参与了对${locName}的攻城战（${attackerWin ? '攻击方胜' : '防御方胜'}）`);
  }

  // 🆕 攻城阵亡判定：参战NPC各有2%概率阵亡
  const allCombatants = [...attackerNpcs, ...defenderNpcs, ...attackerElites, ...defenderElites];
  const currentNpcDb = { ...(p.npcDatabase ?? {}) };
  for (const npc of allCombatants) {
    if (Math.random() < 0.02) {
      npc.isAlive = false;
      currentNpcDb[npc.id] = npc;
      appendNpcLog(npc.id, `在${locName}攻城战中力战身亡。`);
    }
  }
  setPlayer({ ...getPlayer(), npcDatabase: currentNpcDb });

  // 14. 生成新闻
  const newsItem: WorldNewsItem = {
    text: newsText + (attackerWin ? `\n${getSectName(attackerSect)}趁机占领了${locName}。` : ''),
    turn: currentTurn,
    leftTime: 5,
  };
  const currentNews = p.worldNews ?? [];
  const updatedNews = [newsItem, ...currentNews].slice(0, 10);
  setPlayer({ ...getPlayer(), worldNews: updatedNews });

  return {
    happened: true,
    attackerSect,
    defenderSect,
    targetLocation: target.locId,
    attackerWin,
    newsText,
  };
}

// ──── 招降被占城市NPC ────

/** 领土易主后，根据性格/志向招降当地NPC */
function tryRecruitLocalNpcs(locId: LocationId, newOwner: SectId, oldOwner: SectId): void {
  const p = getPlayer();
  const npcDb = { ...(p.npcDatabase ?? {}) };
  const npcsAtLoc = Object.values(npcDb).filter(n =>
    n.isAlive !== false && n.currentLocationId === locId && n.sect === oldOwner
  );

  const newAlign = getAlignment(newOwner);
  let recruitedCount = 0;

  for (const npc of npcsAtLoc) {
    // 掌门/长老不当降将（守节）
    if (npc.discipleRank === 'leader' || npc.discipleRank === 'vice_leader') continue;

    let acceptChance = 0.3; // 基础30%

    // 性格修正
    if (npc.personality === 'upright' && (newAlign === 'righteous' || newAlign === 'neutral')) {
      acceptChance += 0.2;
    } else if (npc.personality === 'upright' && newAlign === 'chaotic') {
      acceptChance -= 0.5; // 刚正者不降邪道
    } else if (npc.personality === 'cunning') {
      acceptChance += 0.3;
    } else if (npc.personality === 'bold') {
      acceptChance += 0.1;
    } else if (npc.personality === 'kind') {
      acceptChance -= 0.1;
    }

    // 志向修正
    const ambition = npc.ambition ?? 'content';
    if (ambition === 'power') acceptChance += 0.4;
    else if (ambition === 'rebel') acceptChance -= 0.2;
    else if (ambition === 'content') acceptChance += 0.1;

    // 检查是否有挚友/道侣在新势力
    const relations = p.npcRelationshipLabels?.[npc.id] ?? [];
    const newOwnerNpcIds = Object.values(npcDb)
      .filter(n => n.sect === newOwner && n.isAlive !== false)
      .map(n => n.id);
    const hasCloseRelationInNewSect = relations.some(r => {
      if (r === 'lover' || r === 'friend' || r === 'sworn_brother') {
        // Check if the relationship target is in new owner
        // Simplified: check if any related NPC is in the new sect
        return newOwnerNpcIds.some(id => p.npcRelationshipLabels?.[id]?.includes(npc.id));
      }
      return false;
    });
    if (hasCloseRelationInNewSect) acceptChance = 1.0; // 有亲近之人在新势力则必定加入

    acceptChance = Math.max(0, Math.min(1, acceptChance));

    if (Math.random() < acceptChance) {
      // 接受招募
      npc.sect = newOwner;
      npc.discipleRank = npc.discipleRank === 'elder' ? 'true' : npc.discipleRank; // 降一级
      npcDb[npc.id] = npc;
      recruitedCount++;
      appendNpcLog(npc.id, `归顺了${getSectName(newOwner)}`);
    } else {
      // 拒绝招募 → 成为散修
      npc.sect = 'none';
      npcDb[npc.id] = npc;
      appendNpcLog(npc.id, `拒绝归顺${getSectName(newOwner)}，成为散修`);
    }
  }

  if (recruitedCount > 0) {
    setPlayer({ ...getPlayer(), npcDatabase: npcDb });
  }
}

// ──── 选将逻辑 ────

/** 从某势力中选 N 个 NPC（优先高等级） */
function pickTeam(sectId: SectId, count: number): NpcStats[] {
  const npcs = getNpcsOfSect(sectId);
  const sorted = [...npcs].sort((a, b) => b.level - a.level);
  return sorted.slice(0, count);
}

/** 从某势力中选精英队（含掌门 + 前3高等级 NPC） */
function pickLeaderTeam(sectId: SectId, count: number): NpcStats[] {
  const npcs = getNpcsOfSect(sectId);
  const sorted = [...npcs].sort((a, b) => {
    // 掌门/长老优先
    const rankOrder: Record<string, number> = { leader: 100, vice_leader: 80, elder: 60, true: 40, inner: 20, outer: 0 };
    const aRank = rankOrder[a.discipleRank ?? 'outer'] ?? 0;
    const bRank = rankOrder[b.discipleRank ?? 'outer'] ?? 0;
    if (bRank !== aRank) return bRank - aRank;
    return b.level - a.level;
  });
  return sorted.slice(0, count);
}

/**
 * 单波次战力判定。
 * @returns true = 攻击方胜
 */
function resolveWave(attPower: number, defPower: number): boolean {
  if (attPower > defPower * 1.1) return Math.random() < 0.80;
  if (defPower > attPower * 1.1) return Math.random() < 0.20;
  return Math.random() < 0.50;
}

// ──── 显示名称 ────

function getSectName(sectId: SectId): string {
  const names: Record<string, string> = {
    wudang: '武当派', shaolin: '少林寺', emei: '峨眉派', beggar: '丐帮',
    huashan: '华山派', quanzhen: '全真教', kunlun: '昆仑派', tangmen: '唐门',
    qingcheng: '青城派', kongtong: '崆峒派', diancang: '点苍派', maoshan: '茅山派',
    tiezhang: '铁掌帮', demon: '魔教', riyue: '日月教', wudu: '五毒教',
    xuedao: '血刀门', haisha: '海沙帮', xiaoyao: '逍遥派', none: '无',
  };
  return names[sectId] ?? sectId;
}

// ──── 领土控制效果 ────

/**
 * 获取玩家在某个地点的购物价格倍率。
 * 玩家所属门派控制 → 0.9（-10%）
 * 敌对门派控制 → 1.2（+20%）
 * 其他 → 1.0
 */
export function getLocationPriceMultiplier(locationId: LocationId): number {
  const p = getPlayer();
  const controller = getLocationController(locationId);
  if (controller === 'none') return 1.0;

  const playerSect = p.sect;
  if (controller === playerSect) return 0.9;

  const relation = getFactionRelation(playerSect as SectId, controller);
  if (relation === 'hostile' || relation === 'at_war') return 1.2;

  return 1.0;
}

/**
 * 获取玩家在某个地点与 NPC 互动的好感加成倍率。
 * 敌对门派控制 → 0.5
 */
export function getLocationAffectionMultiplier(locationId: LocationId): number {
  const p = getPlayer();
  const controller = getLocationController(locationId);
  if (controller === 'none') return 1.0;

  const playerSect = p.sect;
  if (controller === playerSect) return 1.1;

  const relation = getFactionRelation(playerSect as SectId, controller);
  if (relation === 'hostile' || relation === 'at_war') return 0.5;

  return 1.0;
}

// ──── 玩家参与攻城战（三波车轮战）────

/** NPC 等级 → EnemyId 映射 */
function mapNpcLevelToEnemyId(level: number): string {
  if (level >= 51) return 'ancient_master';
  if (level >= 41) return 'ancient_master';
  if (level >= 31) return 'wudang_elder_battle';
  if (level >= 21) return 'wudang_mid_disciple';
  if (level >= 11) return 'huashan_swordsman';
  return 'rogue_thug';
}

/**
 * 玩家加入攻城队，进入三波车轮战。
 * 第一波（城门）：玩家 + 3 NPC vs 4 敌方 NPC
 * 第二波（街道）：玩家 + 3 NPC vs 4 敌方 NPC（新部队）
 * 第三波（决战）：玩家 + 3 精英 vs 敌方 leader + 3 精英
 */
export function playerJoinSiege(
  attackerSect: SectId,
  defenderSect: SectId,
  targetLocation: LocationId,
): void {
  const p = getPlayer();

  // 消耗资源
  spendSiegeCost(attackerSect);

  // 选攻击方 NPC（取前 6 用于前两波轮换 + 精英 3 用于决战）
  const attackerPool = getNpcsOfSect(attackerSect)
    .sort((a, b) => b.level - a.level);
  const attackerWave1 = attackerPool.slice(0, 3);
  const attackerWave2 = attackerPool.slice(3, 6);
  const attackerElites = pickLeaderTeam(attackerSect, 3);

  // 选防守方 NPC
  const defenderPool = getNpcsOfSect(defenderSect)
    .sort((a, b) => b.level - a.level);
  const defenderWave1 = defenderPool.slice(0, 4);
  const defenderWave2 = defenderPool.slice(4, 8);
  const defenderElites = pickLeaderTeam(defenderSect, 3);

  // 保存多波次状态
  const siegeState: MultiWaveSiegeState = {
    attackerSect,
    defenderSect,
    targetLocation,
    currentWave: 'gate',
    waveResults: [],
    attackerMorale: 0,
    defenderMorale: 0,
    attackerNpcIds: attackerPool.slice(0, 8).map(n => n.id),
    defenderNpcIds: defenderPool.slice(0, 8).map(n => n.id),
    attackerElites: attackerElites.map(n => n.id),
    defenderElites: defenderElites.map(n => n.id),
  };
  (window as any).__siegeState = siegeState;

  // 启动第一波
  startPlayerWave(siegeState, 'gate', attackerWave1, defenderWave1);
}

/** 启动单波玩家参与战斗 */
function startPlayerWave(
  state: MultiWaveSiegeState,
  wave: WaveId,
  attackerNpcs: NpcStats[],
  defenderNpcs: NpcStats[],
): void {
  const p = getPlayer();
  state.currentWave = wave;

  // 构建友方单位（士气加成：攻+10% per morale）
  const attBonus = 1 + state.attackerMorale / 200;
  const allyDefs = [
    {
      name: p.name,
      hp: Math.round(p.hp * attBonus), maxHp: p.maxHp,
      mp: p.mp, maxMp: p.maxMp,
      atk: Math.round(p.atk * attBonus), def: p.def, agi: p.agi, crit: p.crit,
      charImg: p.charImg,
      skills: p.skills as SkillId[],
      isPlayer: true,
    },
    ...attackerNpcs.map(n => ({
      name: n.name,
      hp: Math.round(n.hp * attBonus), maxHp: n.maxHp,
      mp: n.mp, maxMp: n.maxMp,
      atk: Math.round(n.atk * attBonus), def: n.def, agi: n.agi, crit: n.crit,
      icon: undefined,
      skills: n.skills,
      isPlayer: false,
    })),
  ];

  const enemyIds = defenderNpcs.map(n => mapNpcLevelToEnemyId(n.level));

  // 显示波次提示
  import('../ui/toast').then(m => {
    m.showToast(`⚔️ ${WAVE_NAMES[wave]} — ${wave === 'final' ? '决胜时刻！' : '准备迎战！'}`);
  });

  import('./BattleEngine').then(m => {
    m.initTeamBattle(allyDefs, enemyIds as any);

    import('../ui/events').then(ev => {
      const handler = (data: { result: string; expGain: number; goldGain: number }) => {
        ev.bus.off('battle:end', handler);
        const playerWin = data.result === 'win';
        onPlayerWaveEnd(state, playerWin);
      };
      ev.bus.on('battle:end', handler);
    });
  });
}

/** 单波结束处理：判定是否进入下一波或结束战斗 */
function onPlayerWaveEnd(state: MultiWaveSiegeState, playerWin: boolean): void {
  state.waveResults.push({ wave: state.currentWave, attackerWin: playerWin });

  if (playerWin) {
    state.attackerMorale = Math.min(40, state.attackerMorale + 20);
  } else {
    state.defenderMorale = Math.min(40, state.defenderMorale + 20);
  }

  const currentWave = state.currentWave;
  const playerWins = state.waveResults.filter(r => r.attackerWin).length;
  const playerLosses = state.waveResults.filter(r => !r.attackerWin).length;

  // 判断是否需要继续
  if (currentWave === 'gate') {
    // 进入第二波
    const p = getPlayer();
    const attackerPool = getNpcsOfSect(state.attackerSect)
      .sort((a, b) => b.level - a.level);
    const defenderPool = getNpcsOfSect(state.defenderSect)
      .sort((a, b) => b.level - a.level);
    startPlayerWave(state, 'street', attackerPool.slice(3, 6), defenderPool.slice(4, 8));
  } else if (currentWave === 'street') {
    // 进入第三波（精英决战）
    const attElites = getNpcsByIds(state.attackerElites);
    const defElites = getNpcsByIds(state.defenderElites);
    startPlayerWave(state, 'final', attElites, defElites);
  } else {
    // 第三波结束，判定最终胜负
    const finalWin = playerWins >= 2;
    onMultiWaveSiegeEnd(state, finalWin);
  }
}

/** 通过 ID 列表获取 NPC */
function getNpcsByIds(ids: string[]): NpcStats[] {
  const p = getPlayer();
  const db = p.npcDatabase;
  if (!db) return [];
  return ids.map(id => db[id]).filter(Boolean) as NpcStats[];
}

/** 多波次攻城结束 */
function onMultiWaveSiegeEnd(state: MultiWaveSiegeState, playerWin: boolean): void {
  const p = getPlayer();
  const meta = state;
  delete (window as any).__siegeState;

  const playerWins = state.waveResults.filter(r => r.attackerWin).length;
  const playerLosses = state.waveResults.filter(r => !r.attackerWin).length;

  if (playerWin) {
    // 领土变更
    const tc = { ...(p.territoryControl ?? {}) } as Record<LocationId, SectId>;
    tc[meta.targetLocation] = meta.attackerSect;
    setPlayer({ ...p, territoryControl: tc });

    applySiegeResult(meta.attackerSect, meta.defenderSect, true);
    worsenFactionRelation(meta.attackerSect, meta.defenderSect, 15);

    const currentTurn = (p.worldState?.turn ?? 0) + 1;
    const cooldowns = { ...(p.siegeCooldown ?? {}), [meta.targetLocation]: currentTurn + SIEGE_COOLDOWN };
    setPlayer({ ...getPlayer(), siegeCooldown: cooldowns });

    const rewardMult = playerWins === 3 ? 1.5 : 1.0; // 三连胜额外奖励
    const updated = {
      ...getPlayer(),
      exp: p.exp + Math.round(120 * rewardMult),
      gold: p.gold + Math.round(300 * rewardMult),
      sectContribution: (p.sectContribution ?? 0) + Math.round(80 * rewardMult),
    };
    setPlayer(updated);

    for (const npcId of [...meta.attackerNpcIds, ...meta.defenderNpcIds]) {
      appendNpcLog(npcId, `参与了${WORLD_MAP[meta.targetLocation]?.name ?? meta.targetLocation}的三波攻城战（玩家参战，${playerWins}:${playerLosses} 胜）`);
    }

    const locName = WORLD_MAP[meta.targetLocation]?.name ?? meta.targetLocation;
    const newsItem: WorldNewsItem = {
      text: playerWins === 3
        ? `听闻${getSectName(meta.attackerSect)}在玩家率领下横扫${getSectName(meta.defenderSect)}，三战全胜攻占${locName}！`
        : `听闻${getSectName(meta.attackerSect)}在玩家协助下苦战三局，以${playerWins}:${playerLosses}攻占${locName}！`,
      turn: currentTurn,
      leftTime: 5,
    };
    const currentNews = p.worldNews ?? [];
    const updatedNews = [newsItem, ...currentNews].slice(0, 10);
    setPlayer({ ...getPlayer(), worldNews: updatedNews });

    import('../ui/toast').then(m => {
      m.showToast(`🎉 攻城大捷！${playerWins}:${playerLosses} 攻占${locName}！${playerWins === 3 ? '完美三连胜！' : ''}`);
    });
  } else {
    applySiegeResult(meta.attackerSect, meta.defenderSect, false);
    worsenFactionRelation(meta.attackerSect, meta.defenderSect, 10);
    setPlayer({ ...getPlayer(), hp: 1 });

    const updated = { ...getPlayer(), exp: p.exp + 30, sectContribution: (p.sectContribution ?? 0) + 15 };
    setPlayer(updated);

    import('../ui/toast').then(m => {
      m.showToast(`💔 攻城失利……${playerWins}:${playerLosses} 未能夺下城池。获得 30 修为。`);
    });
  }

  import('../state/SaveSystem').then(m => m.saveGame(getPlayer()));
}

/**
 * 议事触发的攻城（auto-resolve）。
 * 不由随机触发，而是由议事决策直接调用。
 */
export function tryTriggerSiegeForCouncil(
  attackerSect: SectId,
  defenderSect: SectId,
  targetLocation: LocationId,
): { happened: boolean; attackerWin?: boolean; newsText?: string } {
  const p = getPlayer();
  const currentTurn = (p.worldState?.turn ?? 0) + 1;

  const locName = WORLD_MAP[targetLocation]?.name ?? targetLocation;

  // 无主之地直接占领
  if (defenderSect === 'none') {
    spendSiegeCost(attackerSect);

    const tc = { ...(p.territoryControl ?? {}) } as Record<LocationId, SectId>;
    tc[targetLocation] = attackerSect;
    setPlayer({ ...p, territoryControl: tc } as any);

    const cooldowns = { ...(p.siegeCooldown ?? {}), [targetLocation]: currentTurn + SIEGE_COOLDOWN };
    setPlayer({ ...getPlayer(), siegeCooldown: cooldowns });

    const attackerNpcs = pickTeam(attackerSect, 4);
    for (const npc of attackerNpcs) {
      appendNpcLog(npc.id, `随议事决议进军${locName}，未遇抵抗即占领。`);
    }

    const newsText = `听闻${getSectName(attackerSect)}依议事决议出兵占据${locName}，势力版图扩张。`;
    const newsItem: WorldNewsItem = { text: newsText, turn: currentTurn, leftTime: 5 };
    const currentNews = p.worldNews ?? [];
    const updatedNews = [newsItem, ...currentNews].slice(0, 10);
    setPlayer({ ...getPlayer(), worldNews: updatedNews });

    return { happened: true, attackerWin: true, newsText };
  }

  // 选兵将
  const attackerNpcs = pickTeam(attackerSect, 4);
  const defenderNpcs = pickTeam(defenderSect, 4);

  if (attackerNpcs.length < 2 || defenderNpcs.length < 2) {
    return { happened: false };
  }

  // 消耗资源
  spendSiegeCost(attackerSect);

  // 战力判定
  const defenderMult = getSectDefenseMultiplier(defenderSect);
  const attackerPower = calcTeamPower(attackerNpcs);
  const defenderPower = calcTeamPower(defenderNpcs) * defenderMult;

  let attackerWin: boolean;
  if (attackerPower > defenderPower * 1.1) {
    attackerWin = Math.random() < 0.80;
  } else if (defenderPower > attackerPower * 1.1) {
    attackerWin = Math.random() < 0.20;
  } else {
    attackerWin = Math.random() < 0.50;
  }

  // 更新领土
  const tc = { ...(p.territoryControl ?? {}) } as Record<LocationId, SectId>;
  if (attackerWin) {
    tc[targetLocation] = attackerSect;
  }
  setPlayer({ ...p, territoryControl: tc } as any);

  // 门派状态
  applySiegeResult(attackerSect, defenderSect, attackerWin);

  // 冷却
  const cooldowns = { ...(p.siegeCooldown ?? {}), [targetLocation]: currentTurn + SIEGE_COOLDOWN };
  setPlayer({ ...getPlayer(), siegeCooldown: cooldowns });

  // 势力关系
  worsenFactionRelation(attackerSect, defenderSect, 15);

  // 日志
  for (const npc of [...attackerNpcs, ...defenderNpcs]) {
    appendNpcLog(npc.id, `参与了对${locName}的攻城战（议事决议，${attackerWin ? '攻击方胜' : '防御方胜'}）`);
  }

  // 新闻
  const newsText = attackerWin
    ? `听闻${getSectName(attackerSect)}攻占了${getSectName(defenderSect)}掌控的${locName}，大获全胜！`
    : `听闻${getSectName(attackerSect)}攻打${getSectName(defenderSect)}掌控的${locName}，铩羽而归。`;

  const newsItem: WorldNewsItem = {
    text: newsText,
    turn: currentTurn,
    leftTime: 5,
  };
  const currentNews = p.worldNews ?? [];
  const updatedNews = [newsItem, ...currentNews].slice(0, 10);
  setPlayer({ ...getPlayer(), worldNews: updatedNews });

  return { happened: true, attackerWin, newsText };
}

/**
 * 派随从代战：auto-resolve 三波攻城，随从等级提供加成。
 * 成功率 = 基础战力比 + 随从加成（每人 +5%）。
 */
export function resolveDelegatedSiege(
  attackerSect: SectId,
  defenderSect: SectId,
  targetLocation: LocationId,
  followerIds: string[],
): { happened: boolean; attackerWin?: boolean; newsText?: string } {
  const p = getPlayer();
  const currentTurn = (p.worldState?.turn ?? 0) + 1;
  const locName = WORLD_MAP[targetLocation]?.name ?? targetLocation;

  if (defenderSect === 'none') {
    // 无主之地直接占领
    spendSiegeCost(attackerSect);
    const tc = { ...(p.territoryControl ?? {}) } as Record<LocationId, SectId>;
    tc[targetLocation] = attackerSect;
    setPlayer({ ...p, territoryControl: tc } as any);
    const cooldowns = { ...(p.siegeCooldown ?? {}), [targetLocation]: currentTurn + SIEGE_COOLDOWN };
    setPlayer({ ...getPlayer(), siegeCooldown: cooldowns });
    const newsText = `你派遣随从出兵占据${locName}，未遇抵抗。`;
    return { happened: true, attackerWin: true, newsText };
  }

  // 选兵将
  const attackerNpcs = pickTeam(attackerSect, 8);
  const defenderNpcs = pickTeam(defenderSect, 8);
  if (attackerNpcs.length < 2 || defenderNpcs.length < 2) return { happened: false };

  // 随从加成：从 npcDatabase 获取随从等级总和
  const db = p.npcDatabase ?? {};
  let followerBonus = 0;
  for (const fid of followerIds) {
    const npc = db[fid];
    if (npc) followerBonus += npc.level * 0.5;
  }

  spendSiegeCost(attackerSect);

  // 三波车轮战（含随从加成）
  const defenderMult = getSectDefenseMultiplier(defenderSect);
  const followerPowerBonus = 1 + followerBonus / 200; // 每级 0.5%，上限约 +25%
  let attWins = 0;
  let defWins = 0;
  let attMorale = 0;
  let defMorale = 0;

  // 第一波：城门战
  const w1Att = calcTeamPower(attackerNpcs.slice(0, 4), attackerSect) * followerPowerBonus;
  const w1Def = calcTeamPower(defenderNpcs.slice(0, 4), defenderSect) * defenderMult;
  if (resolveWave(w1Att, w1Def)) { attWins++; attMorale = 20; }
  else { defWins++; defMorale = 20; }

  // 第二波：街道战
  const w2Att = calcTeamPower(attackerNpcs.slice(4, 8), attackerSect) * followerPowerBonus * (1 + attMorale / 200);
  const w2Def = calcTeamPower(defenderNpcs.slice(4, 8), defenderSect) * defenderMult * (1 + defMorale / 200);
  if (resolveWave(w2Att, w2Def)) { attWins++; }
  else { defWins++; }

  // 第三波：决战
  const attElites = pickLeaderTeam(attackerSect, 4);
  const defElites = pickLeaderTeam(defenderSect, 4);
  const w3Att = calcTeamPower(attElites) * followerPowerBonus * (1 + attMorale / 200);
  const w3Def = calcTeamPower(defElites) * defenderMult * (1 + defMorale / 200);
  if (resolveWave(w3Att, w3Def)) { attWins++; }
  else { defWins++; }

  const attackerWin = attWins >= 2;

  // 更新领土
  const tc = { ...(p.territoryControl ?? {}) } as Record<LocationId, SectId>;
  if (attackerWin) tc[targetLocation] = attackerSect;
  setPlayer({ ...p, territoryControl: tc } as any);

  applySiegeResult(attackerSect, defenderSect, attackerWin);
  worsenFactionRelation(attackerSect, defenderSect, 15);

  const cooldowns = { ...(p.siegeCooldown ?? {}), [targetLocation]: currentTurn + SIEGE_COOLDOWN };
  setPlayer({ ...getPlayer(), siegeCooldown: cooldowns });

  for (const npc of [...attackerNpcs, ...defenderNpcs]) {
    appendNpcLog(npc.id, `参与了对${locName}的攻城战（随从代战，${attackerWin ? '攻方胜' : '守方胜'}）`);
  }

  // 随从参战记录
  for (const fid of followerIds) {
    const npc = db[fid];
    if (npc) appendNpcLog(fid, `代玩家出征${locName}（${attackerWin ? '获胜' : '战败'}）`);
  }

  const newsText = attackerWin
    ? `你的随从率队攻占${getSectName(defenderSect)}掌控的${locName}，大获全胜！`
    : `你的随从率队攻打${locName}失利，铩羽而归。`;

  const newsItem: WorldNewsItem = { text: newsText, turn: currentTurn, leftTime: 5 };
  const currentNews = p.worldNews ?? [];
  const updatedNews = [newsItem, ...currentNews].slice(0, 10);
  setPlayer({ ...getPlayer(), worldNews: updatedNews });

  // 玩家获得经验（少于亲自参战）
  const updated = {
    ...getPlayer(),
    exp: p.exp + (attackerWin ? 60 : 15),
    sectContribution: (p.sectContribution ?? 0) + (attackerWin ? 40 : 10),
  };
  setPlayer(updated);

  return { happened: true, attackerWin, newsText };
}
