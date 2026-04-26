import type { PlayerState, ItemId, InventoryItem } from '../data/types';
import { ITEMS } from '../data/items';

export function addItem(player: PlayerState, id: ItemId): PlayerState {
  const template = ITEMS[id];
  if (!template) return player;

  const existing = player.inventory.find(i => i.id === id);
  if (existing) {
    return {
      ...player,
      inventory: player.inventory.map(i => i.id === id ? { ...i, count: i.count + 1 } : i),
    };
  }
  return {
    ...player,
    inventory: [...player.inventory, { ...template, count: 1 } satisfies InventoryItem],
  };
}

export function removeItem(player: PlayerState, id: ItemId, count = 1): PlayerState {
  return {
    ...player,
    inventory: player.inventory
      .map(i => i.id === id ? { ...i, count: i.count - count } : i)
      .filter(i => i.count > 0),
  };
}

export function useItem(player: PlayerState, id: ItemId): PlayerState | null {
  const item = player.inventory.find(i => i.id === id);
  if (!item || item.count <= 0) return null;

  const fx = item.effect;
  const updated: PlayerState = {
    ...player,
    hp:    fx.hp    ? Math.min(player.maxHp, player.hp + fx.hp) : player.hp,
    mp:    fx.mp    ? Math.min(player.maxMp, player.mp + fx.mp) : player.mp,
    exp:   fx.exp   ? player.exp + fx.exp : player.exp,
    def:   fx.def   ? player.def + fx.def : player.def,
  };
  return removeItem(updated, id);
}
