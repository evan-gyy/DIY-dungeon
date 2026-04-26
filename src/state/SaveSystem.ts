import type { PlayerState } from '../data/types';
import { PlayerStateSchema } from './schemas';

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
    return result.data as unknown as PlayerState;
  }

  // 解析失败时宽松解析（补全所有缺失字段）
  console.warn('存档字段异常，使用默认值补全', result.error.issues);
  try {
    return PlayerStateSchema.parse({ ...data, _slot: slot }) as unknown as PlayerState;
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
