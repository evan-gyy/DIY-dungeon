// ============================================================
//  src/systems/SandboxTimeSystem.ts — 沙盒模式时间系统
// ============================================================

import { getPlayer, setPlayer } from '../state/GameState';
import { saveGame } from '../state/SaveSystem';
import { tickNpcBehaviors } from './NpcBehavior';
import { MAX_HOUR_SLOTS, type Season, type SandboxTimeState } from '../data/sandbox/sandboxTypes';

function getSeason(month: number): Season {
  if (month >= 1 && month <= 3) return 'spring';
  if (month >= 4 && month <= 6) return 'summer';
  if (month >= 7 && month <= 9) return 'autumn';
  return 'winter';
}

export function getSandboxTime(): SandboxTimeState {
  const p = getPlayer();
  return p.sandboxData?.time ?? { year: 1208, month: 1, day: 1, hourSlot: 0, season: 'spring' };
}

export function getRemainingHours(): number {
  return MAX_HOUR_SLOTS - getSandboxTime().hourSlot;
}

export function consumeHours(hours: number): boolean {
  const p = getPlayer();
  if (!p.sandboxData) return false;

  const time = { ...p.sandboxData.time };
  time.hourSlot += hours;

  if (time.hourSlot >= MAX_HOUR_SLOTS) {
    time.hourSlot = MAX_HOUR_SLOTS;
  }

  setPlayer({
    ...p,
    sandboxData: { ...p.sandboxData, time },
  });
  return true;
}

export function advanceDay(): void {
  const p = getPlayer();
  if (!p.sandboxData) return;

  const time = { ...p.sandboxData.time };
  time.day += 1;
  time.hourSlot = 0;

  if (time.day > 30) {
    time.day = 1;
    time.month += 1;
    if (time.month > 12) {
      time.month = 1;
      time.year += 1;
    }
    time.season = getSeason(time.month);
  }

  // NPC tick happens at end of day
  tickNpcBehaviors();

  // Restore HP/MP on rest
  const updated: typeof p = {
    ...p,
    hp: p.maxHp,
    mp: p.maxMp,
    sandboxData: { ...p.sandboxData, time },
  };

  setPlayer(updated);
  saveGame(updated);
}

export function formatDate(time: SandboxTimeState): string {
  const SEASON_LABEL: Record<Season, string> = { spring: '春', summer: '夏', autumn: '秋', winter: '冬' };
  return `大宋·${time.year}年 ${SEASON_LABEL[time.season]} ${time.month}月${time.day}日`;
}

export function isDayOver(): boolean {
  return getSandboxTime().hourSlot >= MAX_HOUR_SLOTS;
}
