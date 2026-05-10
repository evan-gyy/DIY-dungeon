/**
 * src/systems/BreakthroughPill.ts — 突破丹药系统
 *
 * 各境界突破需要对应的突破丹药来解锁 realmBreakUnlocked。
 * 丹药可在宗门贡献兑换和城池灵宝阁中获取。
 *
 * 七大突破丹：
 *   筑基丹 → 解锁 zhuji（炼气→筑基）
 *   结丹丹 → 解锁 jiedan（筑基→结丹）
 *   元婴丹 → 解锁 yuanying（结丹→元婴）
 *   化神丹 → 解锁 huashen（元婴→化神）
 *   渡劫丹 → 解锁 dujie（化神→渡劫）
 *   大乘丹 → 解锁 dacheng（渡劫→大乘）
 *   飞升丹 → 解锁 feisheng（大乘→飞升）
 */

import { getPlayer, setPlayer } from '../state/GameState';
import { saveGame } from '../state/SaveSystem';

/** 突破丹药定义 */
export interface PillDef {
  id: string;
  name: string;
  icon: string;
  /** 解锁的目标大境界 ID */
  unlockRealm: string;
  /** 所属境界（用于定价） */
  realm: string;
  desc: string;
  /** 宗门贡献价格 */
  contributionCost: number;
  /** 铜钱价格 */
  goldCost: number;
}

/** 全部突破丹药 */
export const BREAKTHROUGH_PILLS: PillDef[] = [
  {
    id: 'pill_zhuji',
    name: '筑基丹',
    icon: '💊',
    unlockRealm: 'zhuji',
    realm: 'lianqi',
    desc: '以三百年灵芝为主药，辅以七味灵草炼制。炼气修士冲击筑基境的必备丹药，可助修行者凝气成液、铸就道基。',
    contributionCost: 100,
    goldCost: 50,
  },
  {
    id: 'pill_jiedan',
    name: '结丹丹',
    icon: '💊',
    unlockRealm: 'jiedan',
    realm: 'zhuji',
    desc: '以千年雪莲为引，融合九转灵液而成。筑基修士冲击结丹境的灵丹，可助修行者凝结金丹、脱胎换骨。',
    contributionCost: 400,
    goldCost: 160,
  },
  {
    id: 'pill_yuanying',
    name: '元婴丹',
    icon: '💊',
    unlockRealm: 'yuanying',
    realm: 'jiedan',
    desc: '以五色神石粉末为基，辅以天雷淬炼之灵液。结丹修士冲击元婴境的神丹，可助金丹化婴、元神初成。',
    contributionCost: 1000,
    goldCost: 400,
  },
  {
    id: 'pill_huashen',
    name: '化神丹',
    icon: '💊',
    unlockRealm: 'huashen',
    realm: 'yuanying',
    desc: '以天外陨铁之精华为引，辅以万年灵乳炼制。元婴修士冲击化神境的圣丹，可助元神与天地交感、踏入化境。',
    contributionCost: 2400,
    goldCost: 1000,
  },
  {
    id: 'pill_dujie',
    name: '渡劫丹',
    icon: '💊',
    unlockRealm: 'dujie',
    realm: 'huashen',
    desc: '以九天神雷余烬融入丹中，辅以龙血与凤羽。化神修士冲击渡劫境的仙丹，可助修行者抵御天劫、超凡入圣。',
    contributionCost: 6000,
    goldCost: 3000,
  },
  {
    id: 'pill_dacheng',
    name: '大乘丹',
    icon: '💊',
    unlockRealm: 'dacheng',
    realm: 'dujie',
    desc: '以大道本源为引，融合天地法则碎片炼制。渡劫修士冲击大乘境的神丹，可助修行者感悟天道、成就大乘果位。',
    contributionCost: 15000,
    goldCost: 8000,
  },
  {
    id: 'pill_feisheng',
    name: '飞升丹',
    icon: '💊',
    unlockRealm: 'feisheng',
    realm: 'dacheng',
    desc: '以仙灵之气为基，辅以九天星辰碎片。大乘修士冲击飞升境的仙丹，据传此丹服下可引发飞升之劫，渡之则位列仙班。',
    contributionCost: 40000,
    goldCost: 20000,
  },
];

/** 丹药解锁的大境界名称 */
export const PILL_UNLOCK_NAMES: Record<string, string> = {
  zhuji: '筑基',
  jiedan: '结丹',
  yuanying: '元婴',
  huashen: '化神',
  dujie: '渡劫',
  dacheng: '大乘',
  feisheng: '飞升',
};

/**
 * 获取玩家可购买的丹药列表（筛选已解锁的）
 * 只能购买"下一大境界"对应的丹药，不能越级购买
 */
export function getAvailablePills(): PillDef[] {
  const p = getPlayer();
  const unlocked = new Set(p.realmBreakUnlocked || []);

  // 境界顺序
  const realmOrder = ['lianqi', 'zhuji', 'jiedan', 'yuanying', 'huashen', 'dujie', 'dacheng', 'feisheng'];

  // 找到当前已解锁的最高境界
  let currentMaxIdx = -1; // 默认未解锁任何（凡人/炼气）
  for (let i = realmOrder.length - 1; i >= 0; i--) {
    if (unlocked.has(realmOrder[i]!)) {
      currentMaxIdx = i;
      break;
    }
  }

  return BREAKTHROUGH_PILLS.filter(pill => {
    // 已解锁的目标境界 → 不再显示
    if (unlocked.has(pill.unlockRealm)) return false;

    // 只能购买下一境界的丹药
    const targetIdx = realmOrder.indexOf(pill.unlockRealm);
    // 允许购买当前最高境界+1 的丹药（即下一境界）
    // 特殊：初始（currentMaxIdx === -1）允许购买第一个（zhuji）
    return targetIdx === currentMaxIdx + 1;
  });
}

/**
 * 获取宗门贡献兑换的丹药列表
 */
export interface PillShopEntry {
  pill: PillDef;
  contributionCost: number;
  /** 是否已使用过（已解锁目标境界） */
  alreadyUsed: boolean;
}

export function getSectPillShop(): PillShopEntry[] {
  const p = getPlayer();
  const unlocked = new Set(p.realmBreakUnlocked || []);

  return BREAKTHROUGH_PILLS.map(pill => ({
    pill,
    contributionCost: pill.contributionCost,
    alreadyUsed: unlocked.has(pill.unlockRealm),
  }));
}

/**
 * 获取城池灵宝阁的丹药列表（仅显示可购买的）
 */
export interface CityPillEntry {
  pill: PillDef;
  goldCost: number;
  alreadyUsed: boolean;
}

export function getCityPillShop(): CityPillEntry[] {
  const p = getPlayer();
  const unlocked = new Set(p.realmBreakUnlocked || []);

  return BREAKTHROUGH_PILLS.map(pill => ({
    pill,
    goldCost: pill.goldCost,
    alreadyUsed: unlocked.has(pill.unlockRealm),
  }));
}

/**
 * 购买/使用突破丹药（宗门贡献）
 */
export function buyPillByContribution(pillId: string, cost: number): { success: boolean; message: string } {
  const p = getPlayer();
  const pill = BREAKTHROUGH_PILLS.find(d => d.id === pillId);
  if (!pill) return { success: false, message: '丹药不存在。' };

  const unlocked = new Set(p.realmBreakUnlocked || []);
  if (unlocked.has(pill.unlockRealm)) {
    return { success: false, message: `你已经使用过${pill.name}，该境界突破已解锁。` };
  }

  if ((p.sectContribution || 0) < cost) {
    return { success: false, message: `宗门贡献不足！需要 ${cost}，当前只有 ${p.sectContribution || 0}。` };
  }

  const updated = {
    ...p,
    sectContribution: (p.sectContribution || 0) - cost,
    realmBreakUnlocked: [...(p.realmBreakUnlocked || []), pill.unlockRealm],
    contributionLog: [
      ...(p.contributionLog || []),
      { amount: -cost, source: 'pill_shop', reason: `兑换${pill.name}`, timestamp: Date.now() },
    ],
  };
  setPlayer(updated);
  saveGame(updated);

  return { success: true, message: `✅ 成功兑换【${pill.name}】！${PILL_UNLOCK_NAMES[pill.unlockRealm]}境界突破已解锁。` };
}

/**
 * 购买/使用突破丹药（铜钱）
 */
export function buyPillByGold(pillId: string, cost: number): { success: boolean; message: string } {
  const p = getPlayer();
  const pill = BREAKTHROUGH_PILLS.find(d => d.id === pillId);
  if (!pill) return { success: false, message: '丹药不存在。' };

  const unlocked = new Set(p.realmBreakUnlocked || []);
  if (unlocked.has(pill.unlockRealm)) {
    return { success: false, message: `你已经使用过${pill.name}，该境界突破已解锁。` };
  }

  if (p.gold < cost) {
    return { success: false, message: `铜钱不足！需要 ${cost} 两，当前只有 ${p.gold} 两。` };
  }

  const updated = {
    ...p,
    gold: p.gold - cost,
    realmBreakUnlocked: [...(p.realmBreakUnlocked || []), pill.unlockRealm],
  };
  setPlayer(updated);
  saveGame(updated);

  return { success: true, message: `✅ 成功购买【${pill.name}】！${PILL_UNLOCK_NAMES[pill.unlockRealm]}境界突破已解锁。` };
}
