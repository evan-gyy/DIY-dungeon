import type { PlayerState } from '../data/types';

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

// 加载一个存档槽位（含向下兼容：缺字段补默认值）
export function loadSave(slot: number): PlayerState | null {
  const saves = loadRaw();
  const raw = saves[`slot_${slot}`];
  if (!raw || typeof raw !== 'object') return null;

  const data = raw as Record<string, unknown>;

  // 补全所有可能缺失的字段（向下兼容旧存档）
  const player: PlayerState = {
    name:         (data['name'] as string)   ?? '无名',
    charId:       (data['charId'] as PlayerState['charId']) ?? 'male_good',
    charImg:      (data['charImg'] as string) ?? 'picture/maincharacter/male_good.png',
    sect:         (data['sect'] as PlayerState['sect']) ?? 'wudang',
    hp:           Number(data['hp'])   || 80,
    maxHp:        Number(data['maxHp']) || 80,
    mp:           Number(data['mp'])   || 20,
    maxMp:        Number(data['maxMp']) || 20,
    atk:          Number(data['atk']) || 8,
    def:          Number(data['def']) || 4,
    agi:          Number(data['agi']) || 5,
    crit:         Number(data['crit']) || 3,
    exp:          Number(data['exp'])  || 0,
    gold:         Number(data['gold']) || 10,
    level:        Number(data['level']) || 1,
    skills:       Array.isArray(data['skills']) ? (data['skills'] as PlayerState['skills']) : ['yi_li_xin_jing'],
    equippedSkills: Array.isArray(data['equippedSkills'])
      ? (data['equippedSkills'] as PlayerState['equippedSkills'])
      : [null, null, null, null],
    inventory:    Array.isArray(data['inventory']) ? (data['inventory'] as PlayerState['inventory']) : [],
    cultivationPoints: Number(data['cultivationPoints']) || 0,
    attrBoosts:   (data['attrBoosts'] as PlayerState['attrBoosts']) ?? { hp: 0, atk: 0, def: 0, agi: 0, mp: 0 },
    tutorialDone: Boolean(data['tutorialDone']),
    storyPhase:   Number(data['storyPhase']) || 0,
    wudangMissionAccepted: Boolean(data['wudangMissionAccepted']),
    wudangGateCleared:     Boolean(data['wudangGateCleared']),
    wudangMidCleared:      Boolean(data['wudangMidCleared']),
    wudangElderCleared:    Boolean(data['wudangElderCleared']),
    _slot: slot,
  };

  if (typeof data['_savedAt'] === 'string') {
    player._savedAt = data['_savedAt'];
  }

  return player;
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
