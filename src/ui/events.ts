import mitt from 'mitt';
import type { BattleResult, ItemId } from '../data/types';

export type GameEvents = {
  'battle:started': {
    playerName: string;
    playerImg: string;
    enemyName: string;
    enemyIcon: string;
    enemyTier: number;
  };
  'battle:log-add': { html: string };
  'battle:updated': { round: number };
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
