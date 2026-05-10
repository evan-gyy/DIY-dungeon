/**
 * src/systems/FabaoShop.ts — 法器购买系统
 *
 * 两个渠道：
 * 1. 宗门贡献兑换（本门派）：可兑换所有 ≤ 当前境界 的法宝
 * 2. 城池随机商店：随机刷新 ≤ 当前境界+1 的法宝，用铜钱购买
 */

import type { FabaoId, FabaoData, FabaoRealm } from '../data/types';
import { FABAO, getFabaoByRealm } from '../data/fabao';
import { REALM_COLORS } from '../data/types';

// ═════════════════════════════════════════════════════════
//  定价表
// ═════════════════════════════════════════════════════════

/** 各境界法宝基础价格 */
const REALM_PRICE: Record<FabaoRealm, { contribution: number; gold: number }> = {
  lianqi:   { contribution: 50,  gold: 25 },
  zhuji:    { contribution: 200, gold: 80 },
  jiedan:   { contribution: 500, gold: 200 },
  yuanying: { contribution: 1200, gold: 500 },
  huashen:  { contribution: 3000, gold: 1500 },
  dujie:    { contribution: 8000, gold: 5000 },
  dacheng:  { contribution: 20000, gold: 12000 },
  feisheng: { contribution: 50000, gold: 30000 },
};

/** 根据类型微调价格 */
const TYPE_MODIFIER: Record<string, number> = {
  weapon: 1.1,    // 武器稍贵（主属性攻击）
  armor: 1.0,     // 衣服基准价
  accessory: 0.9, // 饰品稍便宜（特殊效果）
};

/** 价格浮动范围 */
const PRICE_VARIANCE = 0.2; // ±20%

/**
 * 获取单个法宝的价格（宗门贡献 / 铜钱）
 * 基础价 × 类型系数 ± 随机浮动
 */
function getFabaoPrice(fabao: FabaoData): { contribution: number; gold: number } {
  const base = REALM_PRICE[fabao.realm];
  const mod = TYPE_MODIFIER[fabao.type] ?? 1.0;
  // 用 id 的 hash 做伪随机以确保同一法宝价格稳定
  const seed = hashString(fabao.id);
  const variance = 1 + (seed % 100 - 50) / 100 * PRICE_VARIANCE * 2;

  return {
    contribution: Math.round(base.contribution * mod * variance),
    gold: Math.round(base.gold * mod * variance),
  };
}

/** 简单 hash 函数（用于价格伪随机） */
function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

// ═════════════════════════════════════════════════════════
//  宗门贡献兑换
// ═════════════════════════════════════════════════════════

/** 宗门商店入口数据 */
export interface SectShopEntry {
  fabao: FabaoData;
  /** 宗门贡献价格 */
  contributionCost: number;
}

/**
 * 获取宗门贡献商店可兑换的法宝列表
 * 包含所有 ≤ playerRealm 的法宝（全图鉴），按境界排序
 */
export function getSectShopCatalog(playerRealm: FabaoRealm | null): SectShopEntry[] {
  if (!playerRealm) return [];

  const realmOrder: FabaoRealm[] = ['lianqi', 'zhuji', 'jiedan', 'yuanying', 'huashen', 'dujie', 'dacheng', 'feisheng'];
  const maxIdx = realmOrder.indexOf(playerRealm);

  const entries: SectShopEntry[] = [];
  for (let i = 0; i <= maxIdx; i++) {
    const realm = realmOrder[i];
    if (!realm) continue;
    const fabaos = getFabaoByRealm(realm);
    for (const f of fabaos) {
      entries.push({
        fabao: f,
        contributionCost: getFabaoPrice(f).contribution,
      });
    }
  }
  return entries;
}

// ═════════════════════════════════════════════════════════
//  城池随机商店
// ═════════════════════════════════════════════════════════

/** 城池商店单个商品 */
export interface CityShopEntry {
  fabao: FabaoData;
  /** 铜钱价格 */
  goldCost: number;
}

/**
 * 生成城池随机商店
 * @param playerRealm 玩家当前境界
 * @param count      商品数量（默认 3-6 随机）
 * @returns 随机法宝商品列表
 */
export function generateCityShop(
  playerRealm: FabaoRealm | null,
  count?: number,
): CityShopEntry[] {
  if (!playerRealm) return [];

  const realmOrder: FabaoRealm[] = ['lianqi', 'zhuji', 'jiedan', 'yuanying', 'huashen', 'dujie', 'dacheng', 'feisheng'];
  const maxIdx = Math.min(realmOrder.indexOf(playerRealm) + 1, realmOrder.length - 1);

  // 收集所有可用法宝（≤ playerRealm+1）
  const pool: FabaoData[] = [];
  for (let i = 0; i <= maxIdx; i++) {
    const realm = realmOrder[i];
    if (!realm) continue;
    pool.push(...getFabaoByRealm(realm));
  }

  // 随机抽取
  const itemCount = count ?? (3 + Math.floor(Math.random() * 4)); // 3-6 件
  const shuffled = shuffleArray([...pool]);

  return shuffled.slice(0, itemCount).map(f => ({
    fabao: f,
    goldCost: getFabaoPrice(f).gold,
  }));
}

/** Fisher-Yates 洗牌 */
function shuffleArray<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i] as T;
    arr[i] = arr[j] as T;
    arr[j] = tmp;
  }
  return arr;
}

// ═════════════════════════════════════════════════════════
//  购买逻辑
// ═════════════════════════════════════════════════════════

export interface BuyResult {
  success: boolean;
  message: string;
  /** 成功时返回更新后的 boughtId */
  boughtId?: FabaoId;
}

/**
 * 使用宗门贡献兑换法宝
 * 不消费贡献值，只检查是否已拥有
 */
export function buyFabaoByContribution(
  ownedFabao: FabaoId[],
  contribution: number,
  fabaoId: FabaoId,
  cost: number,
): BuyResult {
  // 已拥有？
  if (ownedFabao.includes(fabaoId)) {
    return { success: false, message: '你已经拥有此法宝。' };
  }
  // 贡献不足？
  if (contribution < cost) {
    return { success: false, message: `宗门贡献不足！需要 ${cost}，当前只有 ${contribution}。` };
  }
  return { success: true, message: '', boughtId: fabaoId };
}

/**
 * 使用铜钱购买法宝
 */
export function buyFabaoByGold(
  ownedFabao: FabaoId[],
  gold: number,
  fabaoId: FabaoId,
  cost: number,
): BuyResult {
  if (ownedFabao.includes(fabaoId)) {
    return { success: false, message: '你已经拥有此法宝。' };
  }
  if (gold < cost) {
    return { success: false, message: `铜钱不足！需要 ${cost} 两，当前只有 ${gold} 两。` };
  }
  return { success: true, message: '', boughtId: fabaoId };
}

/**
 * 按境界顺序排列所有境界
 */
export function getRealmOrder(): FabaoRealm[] {
  return ['lianqi', 'zhuji', 'jiedan', 'yuanying', 'huashen', 'dujie', 'dacheng', 'feisheng'];
}
