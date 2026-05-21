// ============================================================
//  src/systems/NpcRelationshipSystem.ts — NPC 间高级关系
// ============================================================
//  NPC ↔ NPC 关系标签（道侣/师徒/结义/挚友/劲敌/仇敌）
//  每月自动演化：相近的 NPC 可能结成特定关系
//  关系影响 NPC 行为（道侣同行、师徒传功、结义互助等）
// ============================================================

import type { SectId, NpcAmbition } from '../data/types';
import type { NpcStats } from '../data/npcStats';
import { SECTS } from '../data/sects';
import { WORLD_MAP, type LocationId } from '../data/worldMap';
import { getPlayer, setPlayer } from '../state/GameState';
import { addChronicleEntry } from './WorldState';

// ──── 关系标签类型 ────

export type NpcRelationLabel = 'lover' | 'master_student' | 'sworn_brother' | 'close_friend' | 'rival' | 'vendetta';

interface RelationFormEvent {
  npcA: NpcStats;
  npcB: NpcStats;
  label: NpcRelationLabel;
  narrative: string;
}

const PAIR_KEY_SEP = '__';

function makePairKey(a: string, b: string): string {
  return [a, b].sort().join(PAIR_KEY_SEP);
}

function getLabels(key: string): string[] {
  const p = getPlayer();
  return (p.npcRelationshipLabels ?? {})[key] ?? [];
}

function hasLabel(key: string, label: NpcRelationLabel): boolean {
  return getLabels(key).includes(label);
}

function addLabel(key: string, label: NpcRelationLabel): void {
  const p = getPlayer();
  const labels = { ...(p.npcRelationshipLabels ?? {}) };
  const current = labels[key] ?? [];
  if (!current.includes(label)) {
    labels[key] = [...current, label];
    setPlayer({ ...p, npcRelationshipLabels: labels });
  }
}

// ──── 主入口 ────

export function tickNpcRelationships(): RelationFormEvent[] {
  const p = getPlayer();
  const npcs = Object.values(p.npcDatabase ?? {});
  if (npcs.length < 2) return [];

  const events: RelationFormEvent[] = [];
  const existing = p.npcRelationshipLabels ?? {};

  for (let i = 0; i < npcs.length; i++) {
    for (let j = i + 1; j < npcs.length; j++) {
      const a = npcs[i]!;
      const b = npcs[j]!;
      if (a.id === b.id) continue;

      const key = makePairKey(a.id, b.id);
      const currentLabels = existing[key] ?? [];
      if (currentLabels.length >= 2) continue; // 已有足够关系

      const event = tryFormRelation(a, b, key, currentLabels);
      if (event) events.push(event);
    }
  }

  if (events.length > 0) {
    for (const ev of events) {
      addChronicleEntry({
        category: 'npc_interaction',
        title: ev.label,
        description: ev.narrative,
        locationId: ev.npcA.currentLocationId ?? ev.npcB.currentLocationId,
      });
    }
  }

  return events;
}

// ──── 关系判定 ────

function tryFormRelation(
  a: NpcStats, b: NpcStats,
  key: string, currentLabels: string[],
): RelationFormEvent | null {
  // 每月基础触发率
  if (Math.random() > 0.15) return null;

  const affection = (a as any).affection !== undefined
    ? (getPlayer().npcAffection?.[key] ?? 50)
    : 50;
  const friendScore = getPlayer().npcRelationship?.[key] ?? 0;

  // ── 道侣 ──
  if (!currentLabels.includes('lover') && !currentLabels.includes('master_student')) {
    const loverEvent = tryLover(a, b, key, affection, friendScore);
    if (loverEvent) return loverEvent;
  }

  // ── 师徒 ──
  if (!currentLabels.includes('master_student') && !currentLabels.includes('lover')) {
    const masterEvent = tryMasterStudent(a, b, key, affection, friendScore);
    if (masterEvent) return masterEvent;
  }

  // ── 结义 ──
  if (!currentLabels.includes('sworn_brother')) {
    const brotherEvent = trySwornBrother(a, b, key, affection, friendScore);
    if (brotherEvent) return brotherEvent;
  }

  // ── 挚友 ──
  if (!currentLabels.includes('close_friend') && !currentLabels.includes('sworn_brother')) {
    const friendEvent = tryCloseFriend(a, b, key, affection, friendScore);
    if (friendEvent) return friendEvent;
  }

  // ── 劲敌/仇敌 ──
  if (!currentLabels.includes('rival') && !currentLabels.includes('vendetta')) {
    const enemyEvent = tryRivalry(a, b, key, friendScore);
    if (enemyEvent) return enemyEvent;
  }

  return null;
}

// ──── 道侣 ────

function tryLover(a: NpcStats, b: NpcStats, key: string, affection: number, friendScore: number): RelationFormEvent | null {
  // 性别不同、同门派或相邻地点、好感高
  const diffGender = (a.gender ?? 'male') !== (b.gender ?? 'male');
  if (!diffGender) return null;
  if (a.sect !== b.sect && !areNearby(a, b)) return null;
  if (affection < 55 || friendScore < 40) return null;

  const levelDiff = Math.abs(a.level - b.level);
  if (levelDiff > 20) return null;

  const baseChance = 0.03 * (affection / 100) * (friendScore / 100);
  if (Math.random() >= baseChance) return null;

  const sectName = SECTS[a.sect]?.name ?? '江湖';
  return {
    npcA: a, npcB: b,
    label: 'lover',
    narrative: `${a.name}与${b.name}情投意合，在${sectName}结为道侣。`,
  };
}

// ──── 师徒 ────

function tryMasterStudent(a: NpcStats, b: NpcStats, key: string, affection: number, friendScore: number): RelationFormEvent | null {
  // 同门派、等级差 ≥ 10、好感 ≥ 30
  if (a.sect !== b.sect || a.sect === 'none') return null;
  const levelDiff = Math.abs(a.level - b.level);
  if (levelDiff < 10 || levelDiff > 50) return null;
  if (affection < 30 || friendScore < 20) return null;

  if (Math.random() >= 0.04) return null;

  const master = a.level > b.level ? a : b;
  const student = a.level > b.level ? b : a;
  const sectName = SECTS[master.sect]?.name ?? master.sect;

  // 师傅传授弟子经验
  const db = { ...(getPlayer().npcDatabase ?? {}) };
  if (db[student.id]) {
    db[student.id] = { ...db[student.id]!, level: student.level + 1 };
  }
  const p = getPlayer();
  setPlayer({ ...p, npcDatabase: db });

  return {
    npcA: master, npcB: student,
    label: 'master_student',
    narrative: `${master.name}收${student.name}为徒，在${sectName}传授武学（${student.name}等级+1）。`,
  };
}

// ──── 结义 ────

function trySwornBrother(a: NpcStats, b: NpcStats, key: string, affection: number, friendScore: number): RelationFormEvent | null {
  // 等级相近、同阵营、好感 ≥ 40
  const levelDiff = Math.abs(a.level - b.level);
  if (levelDiff > 10) return null;
  if (affection < 40 || friendScore < 30) return null;

  const aAlign = SECTS[a.sect]?.alignment;
  const bAlign = SECTS[b.sect]?.alignment;
  if (aAlign && bAlign && aAlign !== bAlign && aAlign !== 'neutral' && bAlign !== 'neutral') return null;

  if (Math.random() >= 0.03) return null;

  return {
    npcA: a, npcB: b,
    label: 'sworn_brother',
    narrative: `${a.name}与${b.name}意气相投，义结金兰，从此生死与共。`,
  };
}

// ──── 挚友 ────

function tryCloseFriend(a: NpcStats, b: NpcStats, key: string, affection: number, friendScore: number): RelationFormEvent | null {
  if (affection < 25 || friendScore < 15) return null;
  if (a.sect !== b.sect && !areNearby(a, b)) return null;

  // 性格相近或互补
  const compatible = arePersonalitiesCompatible(a.personality, b.personality);
  if (!compatible) return null;

  if (Math.random() >= 0.05) return null;

  return {
    npcA: a, npcB: b,
    label: 'close_friend',
    narrative: `${a.name}与${b.name}志趣相投，结为挚友。`,
  };
}

// ──── 劲敌/仇敌 ────

function tryRivalry(a: NpcStats, b: NpcStats, key: string, friendScore: number): RelationFormEvent | null {
  // 好友度 < 0、不同门派、等级相近 → 劲敌
  if (friendScore >= 0) return null;
  if (a.sect === b.sect) return null;
  if (a.sect === 'none' || b.sect === 'none') return null;

  const levelDiff = Math.abs(a.level - b.level);
  if (levelDiff > 15) return null;

  if (Math.random() >= 0.04) return null;

  const aAlign = SECTS[a.sect]?.alignment;
  const bAlign = SECTS[b.sect]?.alignment;
  const isNemesis = aAlign && bAlign && (
    (aAlign === 'righteous' && bAlign === 'chaotic') ||
    (aAlign === 'chaotic' && bAlign === 'righteous')
  );

  if (isNemesis && Math.random() < 0.5) {
    return {
      npcA: a, npcB: b,
      label: 'vendetta',
      narrative: `${a.name}与${b.name}正邪不两立，结下深仇大恨。`,
    };
  }

  return {
    npcA: a, npcB: b,
    label: 'rival',
    narrative: `${a.name}与${b.name}互视为劲敌，以武论高下。`,
  };
}

// ──── 辅助 ────

function areNearby(a: NpcStats, b: NpcStats): boolean {
  const locA = a.currentLocationId;
  const locB = b.currentLocationId;
  if (!locA || !locB) return false;
  if (locA === locB) return true;
  const mapA = WORLD_MAP[locA];
  return mapA?.connections?.includes(locB as LocationId) ?? false;
}

const PERSONALITY_COMPAT: Record<string, string[]> = {
  aloof:  ['gentle', 'upright'],
  kind:   ['gentle', 'bold', 'upright'],
  cunning:['bold', 'cunning'],
  upright:['kind', 'upright', 'aloof'],
  gentle: ['kind', 'aloof', 'gentle'],
  bold:   ['bold', 'kind', 'cunning'],
};

function arePersonalitiesCompatible(a: string, b: string): boolean {
  const compat = PERSONALITY_COMPAT[a];
  return compat ? compat.includes(b) : true;
}
