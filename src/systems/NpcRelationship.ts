// ============================================================
//  src/systems/NpcRelationship.ts — NPC 间友好度系统（地基）
// ============================================================
//  P8 地基：性格兼容 + 同门加成 → 初始友好度。
//  友好度较高更容易发生善意互动，较低更容易发生恶意互动。
//  具体互动逻辑（切磋/交易/结仇/结义）留待 P5-2 实现。
//
//  存储结构：Record<`${idA}_${idB}`, affection>
//  其中 idA < idB（字典序），保证同一对 NPC 只有一条记录。
// ============================================================

import type { NpcPersonality } from '../data/npcStats';
import type { SectId, PlayerNpcRelation } from '../data/types';
import { getPlayer, setPlayer } from '../state/GameState';

// ──── 性格兼容矩阵 ────

/**
 * 性格兼容度：-10 ~ +15。
 * 和善+温和=高兼容 / 孤傲+狡猾=低兼容 / 刚正+狡猾=冲突
 */
const PERSONALITY_COMPAT: Record<NpcPersonality, Partial<Record<NpcPersonality, number>>> = {
  aloof:   { aloof: 5, kind: 2, cunning: -5, upright: 0, gentle: 3, bold: -2 },
  kind:    { aloof: 2, kind: 15, cunning: -3, upright: 5, gentle: 12, bold: 5 },
  cunning: { aloof: -5, kind: -3, cunning: 8, upright: -10, gentle: 0, bold: 3 },
  upright: { aloof: 0, kind: 5, cunning: -10, upright: 10, gentle: 5, bold: 5 },
  gentle:  { aloof: 3, kind: 12, cunning: 0, upright: 5, gentle: 12, bold: 3 },
  bold:    { aloof: -2, kind: 5, cunning: 3, upright: 5, gentle: 3, bold: 8 },
};

/** 同门加成 */
const SAME_SECT_BONUS = 15;

/** 同性格加成（志趣相投） */
const SAME_PERSONALITY_BONUS = 5;

// ──── 标签映射 ────

export type AffectionTier = 'sworn' | 'close' | 'friendly' | 'neutral' | 'cold' | 'hostile' | 'mortal_enemy';

const AFFECTION_TIERS: Array<{ min: number; tier: AffectionTier; label: string }> = [
  { min: 80,  tier: 'sworn',        label: '生死之交' },
  { min: 60,  tier: 'close',        label: '莫逆之交' },
  { min: 30,  tier: 'friendly',     label: '友好' },
  { min: -10, tier: 'neutral',      label: '素不相识' },
  { min: -30, tier: 'cold',         label: '冷淡' },
  { min: -60, tier: 'hostile',      label: '敌对' },
  { min: -101,tier: 'mortal_enemy', label: '不共戴天' },
];

// ──── 核心 API ────

/** 确保 idA < idB（字典序） */
function makeKey(idA: string, idB: string): string {
  return idA < idB ? `${idA}_${idB}` : `${idB}_${idA}`;
}

/** 获取两个 NPC 之间的友好度（-100 ~ 100） */
export function getNpcAffection(idA: string, idB: string): number {
  const p = getPlayer();
  const key = makeKey(idA, idB);
  return p.npcRelationship?.[key] ?? 0;
}

/** 修改两个 NPC 之间的友好度（正数为增加好感，负数为恶化） */
export function changeNpcAffection(idA: string, idB: string, delta: number): void {
  const p = getPlayer();
  const key = makeKey(idA, idB);
  const current = p.npcRelationship?.[key] ?? 0;
  const next = Math.max(-100, Math.min(100, current + delta));
  setPlayer({
    ...p,
    npcRelationship: { ...p.npcRelationship, [key]: next },
  });
}

/** 获取友好度标签（用于 UI 显示） */
export function getAffectionLabel(value: number): string {
  for (const tier of AFFECTION_TIERS) {
    if (value >= tier.min) return tier.label;
  }
  return '不共戴天';
}

/** 获取友好度层级 */
export function getAffectionTier(value: number): AffectionTier {
  for (const tier of AFFECTION_TIERS) {
    if (value >= tier.min) return tier.tier;
  }
  return 'mortal_enemy';
}

/** 友好度是否足够触发善意互动 */
export function canBenevolentInteraction(value: number): boolean {
  return value >= 30; // 友好及以上
}

/** 友好度是否足够触发恶意互动 */
export function canHostileInteraction(value: number): boolean {
  return value <= -30; // 冷淡及以下
}

// ──── 初始化 ────

/**
 * 计算两个 NPC 之间的初始友好度。
 *
 * 因素：
 * - 性格兼容度（-10 ~ +15）
 * - 同门 +15
 * - 同性格 +5
 * - 轻微随机波动（±5）
 */
export function calcInitialAffection(
  persA: NpcPersonality,
  persB: NpcPersonality,
  sectA: SectId,
  sectB: SectId,
  seed: number,
): number {
  // 性格兼容
  const compat = PERSONALITY_COMPAT[persA]?.[persB] ?? 0;

  // 同门
  const sameSect = sectA === sectB ? SAME_SECT_BONUS : 0;

  // 同性格
  const samePers = persA === persB ? SAME_PERSONALITY_BONUS : 0;

  // 随机波动（基于种子确定）
  const jitter = ((seed * 16807 + 0) % 11) - 5; // -5 ~ +5

  return Math.max(-100, Math.min(100, compat + sameSect + samePers + jitter));
}

/**
 * 批量初始化全 NPC 间的友好度。
 * 由世界初始化时调用一次，后续通过 changeNpcAffection 动态维护。
 * 只初始化尚未建立的 NPC 对（idempotent）。
 */
export function initAllNpcRelationships(): void {
  const p = getPlayer();
  const db = p.npcDatabase;
  if (!db) return;

  const ids = Object.keys(db);
  const existing = p.npcRelationship ?? {};
  let changed = false;

  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const idA = ids[i]!, idB = ids[j]!;
      const key = makeKey(idA, idB);
      if (key in existing) continue; // 已初始化，跳过

      const a = db[idA]!, b = db[idB]!;
      // 用 hash 作为种子以保持确定性
      const seed = hashCode(key);
      const aff = calcInitialAffection(
        a.personality, b.personality,
        a.sect, b.sect,
        seed,
      );
      existing[key] = aff;
      changed = true;
    }
  }

  if (changed) {
    setPlayer({ ...p, npcRelationship: existing });
  }
}

/** 获取某 NPC 与其他所有 NPC 的友好度列表（用于调试/UI） */
export function getNpcRelationshipList(
  npcId: string,
): Array<{ otherId: string; otherName: string; affection: number; label: string }> {
  const p = getPlayer();
  const db = p.npcDatabase;
  const rel = p.npcRelationship ?? {};
  if (!db) return [];

  const results: Array<{ otherId: string; otherName: string; affection: number; label: string }> = [];
  for (const otherId of Object.keys(db)) {
    if (otherId === npcId) continue;
    const key = makeKey(npcId, otherId);
    const aff = rel[key] ?? 0;
    results.push({
      otherId,
      otherName: db[otherId]?.name ?? otherId,
      affection: aff,
      label: getAffectionLabel(aff),
    });
  }
  return results.sort((a, b) => b.affection - a.affection);
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// ──── 主角-NPC 关系标签系统 ────

/** 获取主角与某 NPC 的好感度（player→npc） */
function getPlayerToNpcAffection(npcId: string): number {
  const p = getPlayer();
  return p.npcAffection?.[npcId] ?? 0;
}

/** 获取主角与某 NPC 的所有关系标签 */
export function getPlayerNpcRelations(npcId: string): PlayerNpcRelation[] {
  const p = getPlayer();
  return p.npcRelations?.[npcId] ?? [];
}

/** 检查主角与某 NPC 是否有某关系 */
export function hasPlayerNpcRelation(npcId: string, relation: PlayerNpcRelation): boolean {
  return getPlayerNpcRelations(npcId).includes(relation);
}

/** 添加主角与 NPC 的关系标签 */
export function addPlayerNpcRelation(npcId: string, relation: PlayerNpcRelation): void {
  const p = getPlayer();
  const current = getPlayerNpcRelations(npcId);
  if (current.includes(relation)) return;
  const npcRelations = { ...p.npcRelations, [npcId]: [...current, relation] };
  setPlayer({ ...p, npcRelations });
}

/** 移除主角与 NPC 的关系标签 */
export function removePlayerNpcRelation(npcId: string, relation: PlayerNpcRelation): void {
  const p = getPlayer();
  const current = getPlayerNpcRelations(npcId);
  if (!current.includes(relation)) return;
  const npcRelations = { ...p.npcRelations, [npcId]: current.filter(r => r !== relation) };
  setPlayer({ ...p, npcRelations });
}

/** 检查是否可结为道侣 */
export function canBecomeLover(npcId: string): { allowed: boolean; reason?: string } {
  const p = getPlayer();
  const db = p.npcDatabase;
  const npc = db?.[npcId];
  if (!npc) return { allowed: false, reason: 'NPC不存在' };

  const affection = getPlayerToNpcAffection(npcId);
  if (affection < 85) return { allowed: false, reason: '好感度不足（需≥85）' };

  // 性别检查：必须异性
  const playerGender = p.charId?.startsWith('male') ? 'male' : 'female';
  const npcGender = npc.gender ?? 'male';
  if (playerGender === npcGender) return { allowed: false, reason: '道侣需为异性' };

  const existing = getPlayerNpcRelations(npcId);
  if (existing.includes('lover')) return { allowed: false, reason: '已经是道侣' };

  return { allowed: true };
}

/** 检查是否可结义 */
export function canSwornBrother(npcId: string): { allowed: boolean; reason?: string } {
  const p = getPlayer();
  const db = p.npcDatabase;
  if (!db?.[npcId]) return { allowed: false, reason: 'NPC不存在' };

  const affection = getPlayerToNpcAffection(npcId);
  if (affection < 75) return { allowed: false, reason: '好感度不足（需≥75）' };

  const existing = getPlayerNpcRelations(npcId);
  if (existing.includes('sworn_brother')) return { allowed: false, reason: '已经是结义兄弟' };

  return { allowed: true };
}

/** 检查是否可拜师（NPC 为师父） */
export function canBecomeMaster(npcId: string): { allowed: boolean; reason?: string } {
  const p = getPlayer();
  const db = p.npcDatabase;
  const npc = db?.[npcId];
  if (!npc) return { allowed: false, reason: 'NPC不存在' };

  const affection = getPlayerToNpcAffection(npcId);
  if (affection < 60) return { allowed: false, reason: '好感度不足（需≥60）' };

  if (npc.level < p.level + 10) return { allowed: false, reason: '对方修为不足以担任师父（需高出10级以上）' };

  const existing = getPlayerNpcRelations(npcId);
  if (existing.includes('master')) return { allowed: false, reason: '已经是师父' };

  // 检查是否已有师父
  const allRelations = p.npcRelations ?? {};
  for (const [, rels] of Object.entries(allRelations)) {
    if (rels.includes('master')) return { allowed: false, reason: '已有师父（一人不事二师）' };
  }

  return { allowed: true };
}

/** 检查是否可收徒 */
export function canBecomeStudent(npcId: string): { allowed: boolean; reason?: string } {
  const p = getPlayer();
  const db = p.npcDatabase;
  const npc = db?.[npcId];
  if (!npc) return { allowed: false, reason: 'NPC不存在' };

  const affection = getPlayerToNpcAffection(npcId);
  if (affection < 60) return { allowed: false, reason: '好感度不足（需≥60）' };

  if (p.level < npc.level + 10) return { allowed: false, reason: '自身修为不足以收徒（需高出对方10级以上）' };

  const existing = getPlayerNpcRelations(npcId);
  if (existing.includes('student')) return { allowed: false, reason: '已经是徒弟' };

  return { allowed: true };
}

/** 自动检测 NPC 间友好/仇敌关系标签（基于好感度阈值） */
export function getNpcNpcRelationTag(affection: number): 'friend' | 'enemy' | null {
  if (affection >= 60) return 'friend';
  if (affection <= -60) return 'enemy';
  return null;
}

/** 判断两个 NPC 之间是否应该显示关系标签 */
export function getNpcPairRelation(idA: string, idB: string): { tag: 'friend' | 'enemy' | null; affection: number } {
  const aff = getNpcAffection(idA, idB);
  const tag = getNpcNpcRelationTag(aff);
  return { tag, affection: aff };
}
