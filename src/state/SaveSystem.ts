import type { PlayerState } from '../data/types';
import { PlayerStateSchema } from './schemas';
import type { NpcStats } from '../data/npcStats';

const SAVE_KEY = 'diy_dungeon_saves';
const MAX_SLOTS = 3;

export { MAX_SLOTS };

type RawSaves = Record<string, unknown>;

function loadRaw(): RawSaves {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as RawSaves;
  } catch {
    return {};
  }
}

// 保存一个存档槽位
export function saveGame(player: PlayerState, slot?: number): void {
  const slotIdx = slot ?? player._slot;
  const saves = loadRaw();
  saves[`slot_${slotIdx}`] = {
    ...player,
    _slot: slotIdx,
    _savedAt: new Date().toLocaleString('zh-CN'),
  };
  localStorage.setItem(SAVE_KEY, JSON.stringify(saves));
}

/** P8 迁移：将旧版 talent 单字段 NPC 数据转换为 talents 数组格式 */
function migrateNpcInSave(p: PlayerState): PlayerState {
  if (!p.npcDatabase) return p;
  let changed = false;
  const migrated: Record<string, NpcStats> = {};
  for (const [id, npc] of Object.entries(p.npcDatabase)) {
    const npcAny = npc as unknown as Record<string, unknown>;
    if (!npcAny['talents'] || (npcAny['talents'] as unknown[]).length === 0) {
      const oldTalent = npcAny['talent'] as string | undefined;
      migrated[id] = {
        ...npc,
        talents: oldTalent ? [oldTalent] : ['normal'],
        isTianjiao: (npcAny['isTianjiao'] as boolean) ?? false,
      } as NpcStats;
      changed = true;
    } else if (npcAny['isTianjiao'] === undefined) {
      migrated[id] = { ...npc, isTianjiao: false } as NpcStats;
      changed = true;
    } else {
      migrated[id] = npc;
    }
  }
  return changed ? { ...p, npcDatabase: migrated } : p;
}

// 加载一个存档槽位（Zod 自动补全缺失字段，兼容旧 storyPhase 字段）
export function loadSave(slot: number): PlayerState | null {
  const saves = loadRaw();
  const raw = saves[`slot_${slot}`];
  if (!raw || typeof raw !== 'object') return null;

  const data = { ...(raw as Record<string, unknown>) };

  // 旧存档兼容：storyPhase → act
  if (data['act'] === undefined && data['storyPhase'] !== undefined) {
    data['act'] = data['storyPhase'];
  }

  const result = PlayerStateSchema.safeParse({ ...data, _slot: slot });
  if (result.success) {
    return migrateNpcInSave(result.data as unknown as PlayerState);
  }

  // 解析失败时宽松解析（补全所有缺失字段）
  console.warn('存档字段异常，使用默认值补全', result.error.issues);
  try {
    const parsed = PlayerStateSchema.parse({ ...data, _slot: slot }) as unknown as PlayerState;
    return migrateNpcInSave(parsed);
  } catch {
    return null;
  }
}

// 删除一个存档槽位
export function deleteSave(slot: number): void {
  const saves = loadRaw();
  delete saves[`slot_${slot}`];
  localStorage.setItem(SAVE_KEY, JSON.stringify(saves));
}

// 加载所有存档的摘要信息（供存档选择界面使用）
export function getAllSaveSummaries(): Array<{ slot: number; player: PlayerState | null }> {
  return Array.from({ length: MAX_SLOTS }, (_, i) => ({
    slot: i + 1,
    player: loadSave(i + 1),
  }));
}

export function hasAnySave(): boolean {
  return Object.keys(loadRaw()).length > 0;
}
