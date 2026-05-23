// ============================================================
//  src/systems/ActionSystem.ts — 数值闭环引擎
// ============================================================
//  核心公式：
//    successRate = 50 + (stat - difficulty) * 5  (clamped 10-90)
//    statExpNeeded = (currentStat + 1) * 100
//  世界闭环：成功 → 加 statExp → 属性达标 → 属性+1 → 下次任务更容易成功
// ============================================================

import type { PlayerState } from '../data/types';
import type { NpcStats } from '../data/npcStats';
import { getPlayer, setPlayer } from '../state/GameState';

// ──── StatExp阈值 ────

function expNeededForStat(statValue: number): number {
  return (statValue + 1) * 100;
}

// ──── Combat stat exp ────

type CombatStat = 'atk' | 'def' | 'agi' | 'crit';
type CourtStat = 'strategy' | 'eloquence' | 'charisma' | 'scholarship';
type CombatStatExp = Record<CombatStat, number>;
type CourtStatExp = Record<CourtStat, number>;

interface StatExpGrants {
  combat: Partial<CombatStatExp>;
  court: Partial<CourtStatExp>;
}

interface StatLevelUps {
  combat: CombatStat[];
  court: CourtStat[];
}

// ──── 经验累计 & 属性升级 ────

function applyStatExp(
  currentCombat: { atk: number; def: number; agi: number; crit: number },
  currentCourt: { strategy: number; eloquence: number; charisma: number; scholarship: number },
  combatExp: CombatStatExp,
  courtExp: CourtStatExp,
  grants: StatExpGrants,
): {
  newCombatStats: { atk: number; def: number; agi: number; crit: number };
  newCourtStats: { strategy: number; eloquence: number; charisma: number; scholarship: number };
  newCombatExp: CombatStatExp;
  newCourtExp: CourtStatExp;
  levelUps: StatLevelUps;
} {
  const newCombatStats = { ...currentCombat };
  const newCourtStats = { ...currentCourt };
  const newCombatExp = { ...combatExp };
  const newCourtExp = { ...courtExp };
  const levelUps: StatLevelUps = { combat: [], court: [] };

  for (const stat of ['atk', 'def', 'agi', 'crit'] as CombatStat[]) {
    const granted = grants.combat[stat] ?? 0;
    if (granted <= 0) continue;
    newCombatExp[stat] += granted;
    const needed = expNeededForStat(newCombatStats[stat]);
    while (newCombatExp[stat] >= needed) {
      newCombatExp[stat] -= needed;
      newCombatStats[stat] += 1;
      levelUps.combat.push(stat);
    }
  }

  for (const stat of ['strategy', 'eloquence', 'charisma', 'scholarship'] as CourtStat[]) {
    const granted = grants.court[stat] ?? 0;
    if (granted <= 0) continue;
    newCourtExp[stat] += granted;
    const needed = expNeededForStat(newCourtStats[stat]);
    while (newCourtExp[stat] >= needed) {
      newCourtExp[stat] -= needed;
      newCourtStats[stat] += 1;
      levelUps.court.push(stat);
    }
  }

  return { newCombatStats, newCourtStats, newCombatExp, newCourtExp, levelUps };
}

// ──── 任务难度 & 成功率 ────

/**
 * D100 check: successRate = 50 + (stat - difficulty) * 5
 * clamped to 10% ~ 90%
 */
export function taskSuccessRate(statValue: number, difficulty: number): number {
  return Math.max(10, Math.min(90, 50 + (statValue - difficulty) * 5));
}

export function rollTaskSuccess(statValue: number, difficulty: number): boolean {
  const rate = taskSuccessRate(statValue, difficulty);
  return Math.random() * 100 < rate;
}

/**
 * 根据指令属性亲密度计算应授予的经验值分配。
 * statAffinity: 每个属性的贡献权重，总值越高 = 经验越多
 * baseExp: 基础经验值 (默认按任务难度scale)
 */
function grantsFromAffinity(
  statAffinity: { atk: number; def: number; agi: number; crit: number },
  courtAffinity?: { strategy: number; eloquence: number; charisma: number; scholarship: number },
  difficulty: number = 10,
): StatExpGrants {
  const baseExp = difficulty * 5;
  const combatTotal = statAffinity.atk + statAffinity.def + statAffinity.agi + statAffinity.crit;
  const courtTotal = courtAffinity
    ? courtAffinity.strategy + courtAffinity.eloquence + courtAffinity.charisma + courtAffinity.scholarship
    : 0;
  const grandTotal = combatTotal + courtTotal || 1;

  return {
    combat: {
      atk: Math.round(baseExp * statAffinity.atk / grandTotal),
      def: Math.round(baseExp * statAffinity.def / grandTotal),
      agi: Math.round(baseExp * statAffinity.agi / grandTotal),
      crit: Math.round(baseExp * statAffinity.crit / grandTotal),
    },
    court: courtAffinity ? {
      strategy: Math.round(baseExp * (courtAffinity.strategy ?? 0) / grandTotal),
      eloquence: Math.round(baseExp * (courtAffinity.eloquence ?? 0) / grandTotal),
      charisma: Math.round(baseExp * (courtAffinity.charisma ?? 0) / grandTotal),
      scholarship: Math.round(baseExp * (courtAffinity.scholarship ?? 0) / grandTotal),
    } : {},
  };
}

// ──── 公开API ────

/** 给玩家授予 statExp，返回升级列表 */
export function grantPlayerStatExp(grants: StatExpGrants): StatLevelUps {
  const p = getPlayer();
  const combatExp = { ...(p.combatStatExp ?? { atk: 0, def: 0, agi: 0, crit: 0 }) };
  const courtExp = { ...(p.courtStatExp ?? { strategy: 0, eloquence: 0, charisma: 0, scholarship: 0 }) };
  const combatStats = { atk: p.atk, def: p.def, agi: p.agi, crit: p.crit };
  const courtStats = { ...p.courtStats };

  const result = applyStatExp(combatStats, courtStats, combatExp, courtExp, grants);

  const updated: PlayerState = {
    ...p,
    atk: result.newCombatStats.atk,
    def: result.newCombatStats.def,
    agi: result.newCombatStats.agi,
    crit: result.newCombatStats.crit,
    courtStats: result.newCourtStats,
    combatStatExp: result.newCombatExp,
    courtStatExp: result.newCourtExp,
  };
  setPlayer(updated);

  return result.levelUps;
}

/** 给 NPC 授予 statExp，返回升级列表。修改 player.npcDatabase */
export function grantNpcStatExp(
  npcId: string,
  statAffinity: { atk: number; def: number; agi: number; crit: number },
  courtAffinity: { strategy: number; eloquence: number; charisma: number; scholarship: number } | undefined,
  difficulty: number,
): StatLevelUps | null {
  const p = getPlayer();
  const db = p.npcDatabase;
  if (!db) return null;
  const npc = db[npcId];
  if (!npc) return null;

  const grants = grantsFromAffinity(statAffinity, courtAffinity, difficulty);

  const combatExp = { ...(npc.combatStatExp ?? { atk: 0, def: 0, agi: 0, crit: 0 }) };
  const courtExp = { ...(npc.courtStatExp ?? { strategy: 0, eloquence: 0, charisma: 0, scholarship: 0 }) };
  const combatStats = { atk: npc.atk, def: npc.def, agi: npc.agi, crit: npc.crit };
  const courtStats = { ...(npc.courtStats ?? { strategy: 5, eloquence: 5, charisma: 5, scholarship: 5 }) };

  const result = applyStatExp(combatStats, courtStats, combatExp, courtExp, grants);

  const updatedNpc: NpcStats = {
    ...npc,
    ...result.newCombatStats,
    maxHp: Math.max(npc.maxHp, result.newCombatStats.def * 8), // re-scale maxHP to match new def
    courtStats: result.newCourtStats,
    combatStatExp: result.newCombatExp,
    courtStatExp: result.newCourtExp,
  };

  const updatedDb = { ...db, [npcId]: updatedNpc };
  setPlayer({ ...p, npcDatabase: updatedDb });

  return result.levelUps;
}

/** 获取 statExp 的进度百分比（0-1），用于 UI 展示 */
export function getStatExpProgress(statValue: number, expValue: number): number {
  const needed = expNeededForStat(statValue);
  return Math.min(1, expValue / needed);
}
