import type { PlayerState } from '../data/types';
import { PlayerStateSchema } from './schemas';
import type { NpcStats } from '../data/npcStats';
import { ITEMS } from '../data/items';
import { calculateFinalStats } from '../data/realmConfig';
import type { TalentId } from '../data/realmConfig';
import { compressToBase64, decompressFromBase64 } from 'lz-string';

const SAVE_KEY = 'diy_dungeon_saves';
const MAX_SLOTS = 3;
const SAVE_VERSION = 2;

export { MAX_SLOTS };

// ──── Save format v2 ────
// {
//   version: 2,
//   slots: {
//     slot_1: "compressed_base64...",
//     slot_2: "compressed_base64...",
//   }
// }
//
// Each compressed slot contains JSON of StrippedPlayerState (inventory→id+count, NPC stats recalculable).
// v1 (legacy): { slot_1: {...raw PlayerState}, slot_2: {...} } — detected by absence of "version" field.

interface SaveContainer {
  version: number;
  slots: Record<string, string>;
}

interface StrippedInventoryItem {
  id: string;
  count: number;
}

interface StrippedNpc {
  id: string;
  name: string;
  talents: TalentId[];
  isTianjiao: boolean;
  sect: string;
  level: number;
  exp: number;
  hp: number;
  mp: number;
  skills: string[];
  equippedFabao: { weapon: string | null; armor: string | null; accessory: string | null };
  ownedFabao: string[];
  currentLocationId: string;
  discipleRank: string;
  courtRank: string;
  personality: string;
  courtStats: { strategy: number; eloquence: number; charisma: number; scholarship: number };
  influence: number;
  courtPath: string | null;
  gender: string;
  portraitIndex?: number;
  recentLog: string[];
  ambition: string;
  combatStatExp?: { atk: number; def: number; agi: number; crit: number };
  courtStatExp?: { strategy: number; eloquence: number; charisma: number; scholarship: number };
}

// ──── Serialization ────

function compress(data: string): string {
  return compressToBase64(data);
}

function decompress(data: string): string {
  return decompressFromBase64(data) ?? '';
}

function stripPlayerForSave(player: PlayerState): Record<string, unknown> {
  const stripped: Record<string, unknown> = {};

  // Directly copy non-bloated fields
  const fieldsToCopy = new Set([
    'name', 'charId', 'charImg', 'sect',
    'hp', 'maxHp', 'mp', 'maxMp', 'atk', 'def', 'agi', 'crit',
    'exp', 'gold', 'level', 'cultivationPoints',
    'gameMode', 'chapter', 'act', 'tutorialDone',
    'skills', 'equippedSkills',
    'attrBoosts', 'equippedFabao', 'ownedFabao',
    'wudangMissionAccepted', 'wudangGateCleared', 'wudangMidCleared', 'wudangElderCleared',
    'chapter2Route',
    'chapter3Breakthrough', 'master', 'blackmoonToken', 'luChenzhouRespect',
    'songZhiyuanGrowth', 'liuQinghanEngaged', 'trialChampion',
    'trueDisciple', 'blackmoonMissionStarted',
    'npcAffection', 'npcRelationship',
    'realmBreakUnlocked', 'discipleRank', 'courtRank',
    'courtStats', 'combatStatExp', 'courtStatExp', 'influence', 'courtPath', 'lastActionType',
    'sectContribution', 'contributionLog',
    'completedTrials', 'reputation',
    'npcCollection', 'activeMissions',
    'factionRelations', 'diplomacyTickCounter',
    'worldState', 'chronicle',
    'currentLocationId', 'playerTalent', 'npcRelations',
    'territoryControl', 'worldNews', 'siegeCooldown',
    'gameMonth', 'turnInMonth', 'councilCooldown',
    'sectState',
    'cityProsperity', 'settlementState', 'sectPower',
    'grandEventCooldown', 'grandEventHistory', 'coalitions',
    'factionDirectives', 'factionOfficials',
    '_slot', '_savedAt',
  ]);

  const pRaw = player as unknown as Record<string, unknown>;
  for (const key of fieldsToCopy) {
    if (key in pRaw) {
      stripped[key] = pRaw[key];
    }
  }

  // Strip inventory: store only {id, count}
  if (player.inventory?.length) {
    stripped['inventory'] = player.inventory.map(item => ({
      id: item.id,
      count: item.count,
    }));
  } else {
    stripped['inventory'] = [];
  }

  // Strip NPC database: remove recalculable combat stats (maxHp/maxMp/atk/def/agi/crit)
  if (player.npcDatabase) {
    const strippedNpcs: Record<string, StrippedNpc> = {};
    for (const [id, npc] of Object.entries(player.npcDatabase)) {
      strippedNpcs[id] = {
        id: npc.id,
        name: npc.name,
        talents: (npc.talents ?? (npc.talent ? [npc.talent] : ['normal'])) as TalentId[],
        isTianjiao: npc.isTianjiao ?? false,
        sect: npc.sect,
        level: npc.level,
        exp: npc.exp,
        hp: npc.hp,
        mp: npc.mp,
        skills: npc.skills ?? [],
        equippedFabao: npc.equippedFabao ?? { weapon: null, armor: null, accessory: null },
        ownedFabao: npc.ownedFabao ?? [],
        currentLocationId: npc.currentLocationId ?? 'wudang_mountain',
        discipleRank: npc.discipleRank ?? 'outer',
        courtRank: npc.courtRank ?? 'commoner',
        personality: npc.personality ?? 'gentle',
        courtStats: npc.courtStats ?? { strategy: 5, eloquence: 5, charisma: 5, scholarship: 5 },
        influence: npc.influence ?? 0,
        courtPath: npc.courtPath ?? null,
        gender: npc.gender ?? 'male',
        portraitIndex: npc.portraitIndex,
        recentLog: npc.recentLog ?? [],
        ambition: npc.ambition ?? 'content',
        combatStatExp: npc.combatStatExp ?? { atk: 0, def: 0, agi: 0, crit: 0 },
        courtStatExp: npc.courtStatExp ?? { strategy: 0, eloquence: 0, charisma: 0, scholarship: 0 },
      };
    }
    stripped['npcDatabase'] = strippedNpcs;
  }

  return stripped;
}

function reconstructPlayer(stripped: Record<string, unknown>): Record<string, unknown> {
  const reconstructed = { ...stripped };

  // Reconstruct inventory: expand {id, count} → full InventoryItem
  if (Array.isArray(reconstructed['inventory'])) {
    reconstructed['inventory'] = (reconstructed['inventory'] as StrippedInventoryItem[]).map(item => {
      const def = ITEMS[item.id as keyof typeof ITEMS];
      return def
        ? { ...def, count: item.count }
        : { id: item.id, name: item.id, icon: '📦', desc: '', effect: {}, count: item.count };
    });
  }

  // Reconstruct NPC combat stats: recalculate maxHp/maxMp/atk/def/agi/crit from level + talents
  if (reconstructed['npcDatabase'] && typeof reconstructed['npcDatabase'] === 'object') {
    const npcs = reconstructed['npcDatabase'] as Record<string, Record<string, unknown>>;
    for (const [id, snpc] of Object.entries(npcs)) {
      const level = (snpc['level'] as number) ?? 1;
      const talents = (snpc['talents'] as string[]) ?? ['normal'];
      const calc = calculateFinalStats(level, talents as TalentId[]);
      snpc['maxHp'] = calc.hp;
      snpc['maxMp'] = calc.mp;
      snpc['atk'] = calc.atk;
      snpc['def'] = calc.def;
      snpc['agi'] = calc.agi;
      snpc['crit'] = calc.crit;
      // Clamp current HP/MP to new max
      if ((snpc['hp'] as number) > calc.hp) snpc['hp'] = calc.hp;
      if ((snpc['mp'] as number) > calc.mp) snpc['mp'] = calc.mp;
      // Preserve talent backward compat
      if (!snpc['talent'] && talents.length > 0) {
        snpc['talent'] = talents[0];
      }
    }
  }

  return reconstructed;
}

// ──── Public API ────

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

export function saveGame(player: PlayerState, slot?: number): void {
  const slotIdx = slot ?? player._slot;
  const playerWithMeta = {
    ...player,
    _slot: slotIdx,
    _savedAt: new Date().toLocaleString('zh-CN'),
  };

  const stripped = stripPlayerForSave(playerWithMeta as unknown as PlayerState);
  const json = JSON.stringify(stripped);
  const compressed = compress(json);

  const raw = loadRaw();
  let container: SaveContainer;

  if (raw['version'] === SAVE_VERSION && raw['slots']) {
    container = raw as unknown as SaveContainer;
  } else {
    // Migrate old v1 saves to v2 container
    container = { version: SAVE_VERSION, slots: {} };
    for (const [key, value] of Object.entries(raw)) {
      if (key.startsWith('slot_') && typeof value === 'object' && value !== null) {
        const v = value as Record<string, unknown>;
        const strippedOld = stripPlayerForSave(v as unknown as PlayerState);
        container.slots[key] = compress(JSON.stringify(strippedOld));
      }
    }
  }

  container.slots[`slot_${slotIdx}`] = compressed;
  localStorage.setItem(SAVE_KEY, JSON.stringify(container));
}

/** P8 迁移：旧版 talent 单字段 → talents 数组 */
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

export function loadSave(slot: number): PlayerState | null {
  const raw = loadRaw();

  let data: Record<string, unknown>;

  // Detect save format
  if (raw['version'] === SAVE_VERSION && raw['slots']) {
    // v2 compressed format
    const container = raw as unknown as SaveContainer;
    const compressed = container.slots[`slot_${slot}`];
    if (!compressed) return null;
    const json = decompress(compressed);
    if (!json) return null;
    try {
      data = JSON.parse(json) as Record<string, unknown>;
    } catch {
      console.warn('存档解压解析失败');
      return null;
    }
  } else {
    // v1 legacy format
    const legacy = raw[`slot_${slot}`];
    if (!legacy || typeof legacy !== 'object') return null;
    data = { ...(legacy as Record<string, unknown>) };
    // Migrate old saves to v2 on next save
  }

  // Reconstruct stripped data
  const reconstructed = reconstructPlayer(data);

  // Old save compatibility: storyPhase → act
  if (reconstructed['act'] === undefined && reconstructed['storyPhase'] !== undefined) {
    reconstructed['act'] = reconstructed['storyPhase'];
  }

  reconstructed['_slot'] = slot;

  const result = PlayerStateSchema.safeParse(reconstructed);
  if (result.success) {
    return migrateNpcInSave(result.data as unknown as PlayerState);
  }

  console.warn('存档字段异常，使用默认值补全', result.error.issues);
  try {
    const parsed = PlayerStateSchema.parse(reconstructed) as unknown as PlayerState;
    return migrateNpcInSave(parsed);
  } catch {
    return null;
  }
}

export function deleteSave(slot: number): void {
  const raw = loadRaw();

  if (raw['version'] === SAVE_VERSION && raw['slots']) {
    const container = raw as unknown as SaveContainer;
    delete container.slots[`slot_${slot}`];
    localStorage.setItem(SAVE_KEY, JSON.stringify(container));
  } else {
    delete raw[`slot_${slot}`];
    localStorage.setItem(SAVE_KEY, JSON.stringify(raw));
  }
}

export function getAllSaveSummaries(): Array<{ slot: number; player: PlayerState | null }> {
  return Array.from({ length: MAX_SLOTS }, (_, i) => ({
    slot: i + 1,
    player: loadSave(i + 1),
  }));
}

export function hasAnySave(): boolean {
  const raw = loadRaw();
  if (raw['version'] === SAVE_VERSION && raw['slots']) {
    return Object.keys((raw as unknown as SaveContainer).slots).length > 0;
  }
  return Object.keys(raw).length > 0;
}
