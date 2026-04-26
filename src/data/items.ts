import type { ItemId, ItemData, InventoryItem } from './types';

export const ITEMS: Record<ItemId, ItemData> = {
  hp_potion:  { id: 'hp_potion',  name: '红药丸',   icon: '🔴', desc: '恢复HP 50点。',   effect: { hp: 50 } },
  mp_potion:  { id: 'mp_potion',  name: '蓝药丸',   icon: '🔵', desc: '恢复MP 30点。',   effect: { mp: 30 } },
  exp_scroll: { id: 'exp_scroll', name: '武学秘籍', icon: '📜', desc: '获得经验值100点。', effect: { exp: 100 } },
  iron_guard: { id: 'iron_guard', name: '铁甲护心',  icon: '🛡️', desc: '装备后防御+10。',  effect: { def: 10 }, equip: true },
};

export const DEFAULT_INVENTORY: InventoryItem[] = [
  { ...ITEMS.hp_potion,  count: 5 },
  { ...ITEMS.mp_potion,  count: 3 },
  { ...ITEMS.exp_scroll, count: 1 },
  { ...ITEMS.iron_guard, count: 1 },
];
