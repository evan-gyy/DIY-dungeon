// ============================================================
//  src/systems/TitleSystem.ts — 称号系统逻辑
// ============================================================
//  检查称号条件 → 自动获得称号 → 选择激活 → 获得加成
// ============================================================

import type { PlayerState } from '../data/types';
import { ALL_TITLES, TITLE_MAP, type TitleDef, type PlayerTitle } from '../data/titles';
import { getPlayer, setPlayer } from '../state/GameState';
import { DISCIPLE_RANK_ORDER } from '../data/sandboxTypes';
import type { CourtRank } from '../data/sandboxTypes';
import { COURT_RANK_ORDER } from '../data/sandboxTypes';

/** 获取玩家所有已获得的称号 ID 集合 */
export function getAcquiredTitleIds(player: PlayerState): Set<string> {
  return new Set((player.playerTitles ?? []).map(t => t.titleId));
}

/** 检查玩家是否已获得某个称号 */
export function hasTitle(player: PlayerState, titleId: string): boolean {
  return getAcquiredTitleIds(player).has(titleId);
}

/** 获取当前激活的称号 */
export function getActiveTitle(player: PlayerState): TitleDef | null {
  const id = player.activeTitle;
  if (!id) return null;
  return TITLE_MAP[id] ?? null;
}

/** 检查所有称号条件，返回新获得的称号列表 */
export function checkAllTitles(player: PlayerState): TitleDef[] {
  const acquired = getAcquiredTitleIds(player);
  const newlyEarned: TitleDef[] = [];

  for (const title of ALL_TITLES) {
    if (acquired.has(title.id)) continue;
    if (checkTitleCondition(player, title)) {
      newlyEarned.push(title);
    }
  }

  return newlyEarned;
}

/** 检查单个称号条件 */
function checkTitleCondition(player: PlayerState, title: TitleDef): boolean {
  const c = title.condition;
  switch (c.type) {
    case 'kill_count':
      return (player.killCount ?? 0) >= c.threshold;
    case 'level':
      return (player.level ?? 1) >= c.threshold;
    case 'reputation':
      return (player.reputation ?? 0) >= c.threshold;
    case 'gold':
      return (player.gold ?? 0) >= c.threshold;
    case 'sect_rank':
      return getPlayerDiscipleRankIndex(player) >= c.threshold;
    case 'court_rank':
      return getPlayerCourtRankIndex(player) >= c.threshold;
    case 'skill_count':
      return (player.skills ?? []).length >= c.threshold;
    case 'steal_count':
      return (player.stealSuccessCount ?? 0) >= c.threshold;
    case 'recruit_count':
      return (player.npcCollection?.recruited?.length ?? 0) >= c.threshold;
    case 'fabao_count':
      return (player.ownedFabao ?? []).length >= c.threshold;
    case 'affection_80_count': {
      const affectionMap = player.npcAffection ?? {};
      let count = 0;
      for (const val of Object.values(affectionMap)) {
        if (val >= 80) count++;
      }
      return count >= c.threshold;
    }
    default:
      return false;
  }
}

/** 授予称号（如果尚未获得） */
export function grantTitle(player: PlayerState, titleId: string): { granted: boolean; title?: TitleDef } {
  const title = TITLE_MAP[titleId];
  if (!title) return { granted: false };
  if (hasTitle(player, titleId)) return { granted: false };

  const newTitle: PlayerTitle = {
    titleId,
    acquiredAt: player.gameMonth ?? 0,
  };
  const titles = [...(player.playerTitles ?? []), newTitle];

  // 如果是第一个非 cosmetic 称号，自动激活
  let newActiveTitle = player.activeTitle;
  if (!title.cosmetic && !newActiveTitle) {
    newActiveTitle = titleId;
  }

  setPlayer({
    ...player,
    playerTitles: titles,
    activeTitle: newActiveTitle,
  });

  return { granted: true, title };
}

/** 激活称号 */
export function activateTitle(player: PlayerState, titleId: string): { success: boolean; message: string } {
  if (!hasTitle(player, titleId)) {
    return { success: false, message: '你尚未获得此称号。' };
  }

  setPlayer({ ...player, activeTitle: titleId });
  return { success: true, message: `已激活称号「${TITLE_MAP[titleId]!.name}」。` };
}

/** 取消激活 */
export function deactivateTitle(player: PlayerState): void {
  setPlayer({ ...player, activeTitle: null });
}

/** 获取激活称号的属性加成（乘法因子） */
export function getTitleBonus(player: PlayerState): Required<NonNullable<TitleDef['bonus']>> {
  const title = getActiveTitle(player);
  if (!title) {
    return { atkMul: 0, defMul: 0, agiMul: 0, hpMul: 0, mpMul: 0, critBonus: 0, cultivationMul: 0 };
  }
  const b = title.bonus;
  return {
    atkMul: b.atkMul ?? 0,
    defMul: b.defMul ?? 0,
    agiMul: b.agiMul ?? 0,
    hpMul: b.hpMul ?? 0,
    mpMul: b.mpMul ?? 0,
    critBonus: b.critBonus ?? 0,
    cultivationMul: b.cultivationMul ?? 0,
  };
}

/** 推进事件后检查并自动授予新称号（返回 toast 消息数组） */
export function tickTitleCheck(): string[] {
  const p = getPlayer();
  const newTitles = checkAllTitles(p);
  const messages: string[] = [];

  for (const title of newTitles) {
    const result = grantTitle(p, title.id);
    if (result.granted) {
      messages.push(`🏆 获得称号：「${title.name}」—— ${title.desc}`);
    }
  }

  return messages;
}

// ──── 辅助 ────

function getPlayerDiscipleRankIndex(player: PlayerState): number {
  return DISCIPLE_RANK_ORDER.indexOf(player.discipleRank as any);
}

function getPlayerCourtRankIndex(player: PlayerState): number {
  return (COURT_RANK_ORDER as string[]).indexOf(player.courtRank ?? 'commoner');
}
