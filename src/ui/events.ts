import mitt from 'mitt';
import type { BattleResult, ItemId, BattleUnit } from '../data/types';

export type GameEvents = {
  'battle:started': {
    allies: BattleUnit[];
    enemies: BattleUnit[];
    teamBattle: boolean;
  };
  'battle:log-add': { html: string };
  'battle:updated': { round: number; currentUnit: BattleUnit | null };
  'battle:end': {
    result: BattleResult;
    expGain: number;
    goldGain: number;
    loot: ItemId[];
  };
  'story:battle-end': {
    result: BattleResult;
  };
  'player:level-up': {
    oldLevel: number;
    newLevel: number;
    gainedPoints: number;
  };
  'toast': {
    message: string;
    duration?: number;
  };
};

export const bus = mitt<GameEvents>();