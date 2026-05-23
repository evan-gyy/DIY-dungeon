// ============================================================
//  src/systems/AmbitionSystem.ts — P8 NPC志向驱动的大事件
// ============================================================
//  每月初触发：叛离、篡位、约战、自立门户、复仇等高层事件。
//  让 NPC 的志向真正驱动世界演化。
// ============================================================

import type { NpcAmbition, SectId } from '../data/types';
import type { NpcStats } from '../data/npcStats';
import { SECTS } from '../data/sects';
import { getPlayer, setPlayer } from '../state/GameState';
import { addChronicleEntry } from './WorldState';

// ──── 事件结果类型 ────

export type AmbitionEventType =
  | 'defection'      // 叛离门派
  | 'coup_attempt'   // 篡位
  | 'duel_challenge' // 约战
  | 'found_sect'     // 自立门户
  | 'power_scheme'   // 权斗
  | 'vendetta';      // 复仇

export interface AmbitionEvent {
  type: AmbitionEventType;
  npcId: string;
  npcName: string;
  ambition: NpcAmbition;
  detail: string;       // 叙事文本
  result: 'success' | 'failure';
  targetNpcId?: string;
  targetName?: string;
  sectId?: SectId;
}

// ──── 主入口 ────

export function tickAmbitionEvents(): AmbitionEvent[] {
  const p = getPlayer();
  if (!p.npcDatabase) return [];

  const events: AmbitionEvent[] = [];
  const npcs = Object.values(p.npcDatabase);
  const updatedDb = { ...p.npcDatabase };

  for (const npc of npcs) {
    const ambition = (npc.ambition ?? 'content') as NpcAmbition;
    if (ambition === 'content') continue;

    // 各志向基础触发率（每月）
    const triggerChance: Record<NpcAmbition, number> = {
      content: 0, master: 0.05, power: 0.08, rebel: 0.12, avenger: 0.06,
    };
    if (Math.random() >= (triggerChance[ambition] ?? 0)) continue;

    let event: AmbitionEvent | null = null;

    switch (ambition) {
      case 'rebel':
        event = tryDefection(npc, npcs);
        break;
      case 'power':
        event = Math.random() < 0.5
          ? tryCoup(npc, npcs)
          : tryPowerScheme(npc, npcs);
        break;
      case 'master':
        event = tryDuelChallenge(npc, npcs);
        break;
      case 'avenger':
        event = tryVendetta(npc, npcs);
        break;
    }

    if (event) {
      events.push(event);
      // 更新 NPC 状态
      if (event.type === 'defection' && event.result === 'success') {
        const updated = { ...npc, sect: event.sectId ?? 'none' as SectId, discipleRank: 'outer' as const };
        updatedDb[npc.id] = updated;
      }
      // 添加个人日志
      addChronicleEntry({ category: 'npc_interaction', title: event.type, description: event.detail, locationId: npc.currentLocationId });
    }
  }

  if (events.length > 0) {
    setPlayer({ ...p, npcDatabase: updatedDb });
  }

  return events;
}

// ──── 叛离 ────

function tryDefection(npc: NpcStats, allNpcs: NpcStats[]): AmbitionEvent | null {
  if (npc.sect === 'none') return null;

  const sectName = SECTS[npc.sect]?.name ?? npc.sect;

  // 找目标：优先叛军 > 邪道 > 无门派
  const targetSects: SectId[] = ['rebels', 'demon', 'riyue', 'wudu', 'xuedao', 'none'];
  const validTargets = targetSects.filter(s => s !== npc.sect && s !== 'none');
  const chosenSect = validTargets[Math.floor(Math.random() * validTargets.length)] ?? 'none';

  // 叛离成功率：等级越高越容易
  const successChance = 0.4 + (npc.level / 80) * 0.4;
  const success = Math.random() < successChance;

  const targetName = chosenSect === 'none' ? '散修之列' : (SECTS[chosenSect]?.name ?? chosenSect);

  if (success) {
    return {
      type: 'defection', npcId: npc.id, npcName: npc.name,
      ambition: 'rebel', result: 'success', sectId: chosenSect,
      detail: `${npc.name}（${sectName}）叛离旧门，投奔${targetName}！`,
    };
  } else {
    return {
      type: 'defection', npcId: npc.id, npcName: npc.name,
      ambition: 'rebel', result: 'failure', sectId: npc.sect,
      detail: `${npc.name}试图叛离${sectName}，但行迹败露，被门规惩处。`,
    };
  }
}

// ──── 篡位 ────

function tryCoup(npc: NpcStats, allNpcs: NpcStats[]): AmbitionEvent | null {
  if (npc.discipleRank !== 'elder' && npc.discipleRank !== 'true') return null;
  if (npc.sect === 'none' || npc.sect === 'imperial_court') return null;

  const sectName = SECTS[npc.sect]?.name ?? npc.sect;

  // 找本门 leader
  const leader = allNpcs.find(n => n.sect === npc.sect && n.discipleRank === 'leader');
  if (!leader || leader.id === npc.id) return null;

  // 成功率：篡位者等级 vs 掌门等级 + 稳定度
  const p = getPlayer();
  const stability = p.sectState?.[npc.sect]?.stability ?? 50;
  const levelDiff = npc.level - leader.level;
  const successChance = Math.max(0.05, Math.min(0.6, 0.2 + levelDiff * 0.02 + (100 - stability) * 0.003));

  if (Math.random() < successChance) {
    // 成功：篡位者成为新掌门
    const p2 = getPlayer();
    const updatedDb = { ...p2.npcDatabase };
    if (updatedDb[npc.id]) updatedDb[npc.id] = { ...updatedDb[npc.id]!, discipleRank: 'leader' };
    if (updatedDb[leader.id]) updatedDb[leader.id] = { ...updatedDb[leader.id]!, discipleRank: 'elder' };
    // 降低稳定度
    const oldState = p2.sectState?.[npc.sect] ?? { resources: 200, stability: 50, prosperity: 30 };
    const newStability = Math.max(0, (oldState.stability ?? stability) - 30);
    const newSectState = { ...p2.sectState, [npc.sect]: { resources: oldState.resources ?? 200, stability: newStability, prosperity: oldState.prosperity ?? 30 } };
    setPlayer({ ...p2, npcDatabase: updatedDb, sectState: newSectState });

    return {
      type: 'coup_attempt', npcId: npc.id, npcName: npc.name,
      ambition: 'power', result: 'success', targetNpcId: leader.id, targetName: leader.name, sectId: npc.sect,
      detail: `${npc.name}发动篡位，击败${leader.name}，夺取${sectName}掌门之位！门派动荡，稳定度大降。`,
    };
  } else {
    return {
      type: 'coup_attempt', npcId: npc.id, npcName: npc.name,
      ambition: 'power', result: 'failure', targetNpcId: leader.id, targetName: leader.name, sectId: npc.sect,
      detail: `${npc.name}密谋篡夺${sectName}掌门之位，被${leader.name}识破并镇压。`,
    };
  }
}

// ──── 约战 ────

function tryDuelChallenge(npc: NpcStats, allNpcs: NpcStats[]): AmbitionEvent | null {
  // 找比自己等级高的 NPC（同门或同区域）
  const candidates = allNpcs.filter(n =>
    n.id !== npc.id && n.level > npc.level && n.level <= npc.level + 15
  );
  if (candidates.length === 0) return null;

  const target = candidates[Math.floor(Math.random() * candidates.length)]!;

  // 约战胜率：等级差影响
  const levelDiff = npc.level - target.level;
  const successChance = Math.max(0.1, Math.min(0.7, 0.35 + levelDiff * 0.03));
  const success = Math.random() < successChance;

  if (success) {
    return {
      type: 'duel_challenge', npcId: npc.id, npcName: npc.name,
      ambition: 'master', result: 'success', targetNpcId: target.id, targetName: target.name,
      detail: `${npc.name}向${target.name}发起约战，以精妙武学胜之，名望大增！`,
    };
  } else {
    return {
      type: 'duel_challenge', npcId: npc.id, npcName: npc.name,
      ambition: 'master', result: 'failure', targetNpcId: target.id, targetName: target.name,
      detail: `${npc.name}挑战${target.name}，虽败犹荣，从中领悟了武道真谛。`,
    };
  }
}

// ──── 权斗 ────

function tryPowerScheme(npc: NpcStats, allNpcs: NpcStats[]): AmbitionEvent | null {
  if (npc.sect === 'none') return null;

  // 找同门同级别或更高的 NPC 作为竞争对手
  const rivals = allNpcs.filter(n =>
    n.id !== npc.id && n.sect === npc.sect &&
    (n.discipleRank === npc.discipleRank || n.discipleRank === 'elder' || n.discipleRank === 'leader')
  );
  if (rivals.length === 0) return null;

  const target = rivals[Math.floor(Math.random() * rivals.length)]!;
  const sectName = SECTS[npc.sect]?.name ?? npc.sect;

  // 权斗成功率
  const success = Math.random() < 0.45;

  if (success) {
    return {
      type: 'power_scheme', npcId: npc.id, npcName: npc.name,
      ambition: 'power', result: 'success', targetNpcId: target.id, targetName: target.name, sectId: npc.sect,
      detail: `${npc.name}在${sectName}内部排挤${target.name}，巩固了自身地位。`,
    };
  } else {
    return {
      type: 'power_scheme', npcId: npc.id, npcName: npc.name,
      ambition: 'power', result: 'failure', targetNpcId: target.id, targetName: target.name, sectId: npc.sect,
      detail: `${npc.name}在${sectName}内部暗斗${target.name}失败，声望受损。`,
    };
  }
}

// ──── 复仇 ────

function tryVendetta(npc: NpcStats, allNpcs: NpcStats[]): AmbitionEvent | null {
  // 找不同门派的 NPC 作为复仇目标（优先对立阵营）
  const npcAlign = SECTS[npc.sect]?.alignment;
  const candidates = allNpcs.filter(n => {
    if (n.id === npc.id || n.sect === npc.sect) return false;
    if (npcAlign) {
      const nAlign = SECTS[n.sect]?.alignment;
      // 正邪对立优先
      if (npcAlign === 'righteous' && nAlign === 'chaotic') return true;
      if (npcAlign === 'chaotic' && nAlign === 'righteous') return true;
    }
    return n.level > npc.level - 10;
  });
  if (candidates.length === 0) return null;

  const target = candidates[Math.floor(Math.random() * candidates.length)]!;
  const targetSectName = SECTS[target.sect]?.name ?? target.sect;

  // 复仇成功率与等级正相关
  const successChance = Math.max(0.15, Math.min(0.55, 0.3 + (npc.level - target.level) * 0.02));
  const success = Math.random() < successChance;

  if (success) {
    return {
      type: 'vendetta', npcId: npc.id, npcName: npc.name,
      ambition: 'avenger', result: 'success', targetNpcId: target.id, targetName: target.name,
      detail: `${npc.name}暗中对${targetSectName}的${target.name}出手，一击得手，恩怨暂了。`,
    };
  } else {
    return {
      type: 'vendetta', npcId: npc.id, npcName: npc.name,
      ambition: 'avenger', result: 'failure', targetNpcId: target.id, targetName: target.name,
      detail: `${npc.name}试图向${targetSectName}的${target.name}寻仇，但力有不逮，含恨而退。`,
    };
  }
}
