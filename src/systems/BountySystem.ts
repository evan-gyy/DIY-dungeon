// ============================================================
//  src/systems/BountySystem.ts — 悬赏系统
// ============================================================
//  官府和宗门发布通缉令，玩家接取后前往目标地点
//  击败通缉犯获得赏金和声望。
// ============================================================

import type { PlayerState, SectId } from '../data/types';
import { WORLD_MAP, type LocationId } from '../data/worldMap';
import { SECTS } from '../data/sects';
import { getPlayer, setPlayer } from '../state/GameState';

// ──── 类型 ────

export interface Bounty {
  id: string;
  /** 通缉犯名称 */
  targetName: string;
  /** 通缉犯等级 */
  targetLevel: number;
  /** 目标出现地点 */
  targetLocation: string;
  /** 发布者 */
  issuer: string;
  /** 发布者名称 */
  issuerName: string;
  /** 罪行描述 */
  crime: string;
  /** 悬赏金额 */
  rewardGold: number;
  /** 声望奖励 */
  rewardRep: number;
  /** 难度标签 */
  difficulty: string;
  /** 生成月份 */
  generatedAt: number;
  /** 过期月份（6个月后） */
  expiresAt: number;
}

// ──── 通缉犯名池 ────

const SURNAMES = ['燕', '龙', '铁', '血', '黑', '独', '鬼', '煞', '毒', '影', '风', '云', '雷', '火'];
const GIVEN_NAMES = ['赤霄', '天霸', '断魂', '无影', '追命', '冷血', '铁手', '千面', '独行', '夜枭', '残剑', '飞狐', '狂刀', '冥王'];

const CRIMES: Record<string, string[]> = {
  official: [
    '杀人越货，劫掠官银', '谋反叛逆，聚众叛乱', '贪赃枉法，卷款潜逃',
    '刺杀朝廷命官', '私铸铜钱，扰乱币制', '贩卖私盐，逃避盐税',
    '拐卖人口，逼良为娼', '盗掘皇陵，窃取国宝',
  ],
  sect: [
    '偷学本派武功秘籍', '叛出师门，杀害同门', '勾结外敌，出卖宗门',
    '盗取镇派法宝', '散布谣言，扰乱人心', '暗中毒害掌门亲传弟子',
  ],
};

const DIFFICULTY_POOLS: Record<string, { levelRange: [number, number]; goldRange: [number, number]; repRange: [number, number] }> = {
  easy:   { levelRange: [5, 15],   goldRange: [80, 200],   repRange: [5, 15] },
  normal: { levelRange: [16, 30],  goldRange: [200, 500],  repRange: [15, 30] },
  hard:   { levelRange: [31, 50],  goldRange: [500, 1500], repRange: [30, 50] },
  deadly: { levelRange: [51, 75],  goldRange: [1500, 5000], repRange: [50, 80] },
};

const CFG = { maxBounties: 6, refreshMonths: 3, maxActiveBounties: 1, };

// ──── 生成 ────

function randomName(): string {
  return SURNAMES[Math.floor(Math.random() * SURNAMES.length)]! + GIVEN_NAMES[Math.floor(Math.random() * GIVEN_NAMES.length)]!;
}

function randomDifficulty(): string {
  const r = Math.random();
  if (r < 0.30) return 'easy';
  if (r < 0.65) return 'normal';
  if (r < 0.90) return 'hard';
  return 'deadly';
}

function randomCity(): LocationId {
  const cities = Object.keys(WORLD_MAP).filter(id => WORLD_MAP[id as LocationId]!.connections.length >= 2 && !id.includes('mountain') && !id.includes('temple') && !id.includes('valley'));
  if (cities.length === 0) return 'xiangyang_city';
  return cities[Math.floor(Math.random() * cities.length)] as LocationId;
}

function randomSectId(): SectId {
  const sects = Object.keys(SECTS).filter(s => s !== 'none' && s !== 'imperial_court' && s !== 'rebels') as SectId[];
  return sects[Math.floor(Math.random() * sects.length)]!;
}

export function generateBounties(player: PlayerState): Bounty[] {
  const currentMonth = player.gameMonth ?? 1;
  const bounties: Bounty[] = [];

  // Official bounties
  const officialCities: LocationId[] = ['kaifeng_city', 'luoyang_city', 'changan_city', 'xiangyang_city', 'jiangling_city', 'chengdu_city'];
  for (let i = 0; i < 3; i++) {
    const diff = randomDifficulty();
    const pool = DIFFICULTY_POOLS[diff]!;
    const level = pool.levelRange[0] + Math.floor(Math.random() * (pool.levelRange[1] - pool.levelRange[0] + 1));
    const gold = pool.goldRange[0] + Math.floor(Math.random() * (pool.goldRange[1] - pool.goldRange[0] + 1));
    const rep = pool.repRange[0] + Math.floor(Math.random() * (pool.repRange[1] - pool.repRange[0] + 1));
    const city = officialCities[Math.floor(Math.random() * officialCities.length)]!;
    const crimes = CRIMES['official']!;
    const b: Bounty = {
      id: `bounty_official_${currentMonth}_${i}`,
      targetName: randomName(),
      targetLevel: level,
      targetLocation: city,
      issuer: 'official' as const,
      issuerName: '朝廷官府',
      crime: crimes[Math.floor(Math.random() * crimes.length)]!,
      rewardGold: gold,
      rewardRep: rep,
      difficulty: diff as Bounty['difficulty'],
      generatedAt: currentMonth,
      expiresAt: currentMonth + 6,
    };
    bounties.push(b);
  }

  // Sect bounties
  for (let i = 0; i < 3; i++) {
    const sect = randomSectId();
    const diff = randomDifficulty();
    const pool = DIFFICULTY_POOLS[diff]!;
    const level = pool.levelRange[0] + Math.floor(Math.random() * (pool.levelRange[1] - pool.levelRange[0] + 1));
    const gold = pool.goldRange[0] + Math.floor(Math.random() * (pool.goldRange[1] - pool.goldRange[0] + 1));
    const rep = pool.repRange[0] + Math.floor(Math.random() * (pool.repRange[1] - pool.repRange[0] + 1));
    const crimes = CRIMES['sect']!;
    const sectData = SECTS[sect];
    const b: Bounty = {
      id: `bounty_sect_${currentMonth}_${i}`,
      targetName: randomName(),
      targetLevel: level,
      targetLocation: randomCity(),
      issuer: sect,
      issuerName: sectData?.name ?? sect,
      crime: crimes[Math.floor(Math.random() * crimes.length)]!,
      rewardGold: Math.floor(gold * 1.2),
      rewardRep: rep,
      difficulty: diff as Bounty['difficulty'],
      generatedAt: currentMonth,
      expiresAt: currentMonth + 6,
    };
    bounties.push(b);
  }

  return bounties;
}

// ──── 管理 ────

/** 获取可用悬赏列表（过滤已过期和已接取的） */
export function getAvailableBounties(): Bounty[] {
  const p = getPlayer();
  const currentMonth = p.gameMonth ?? 1;
  const bounties = p.bountyBoard ?? [];

  // 过滤过期
  const active = bounties.filter(b => b.expiresAt > currentMonth);

  // 过滤已接取
  return active.filter(b => b.id !== p.activeBountyId);
}

/** 接取悬赏 */
export function acceptBounty(bountyId: string): { success: boolean; message: string } {
  const p = getPlayer();

  if (p.activeBountyId) {
    return { success: false, message: '你已经有一个进行中的悬赏了，先完成或放弃再试。' };
  }

  const bounties = p.bountyBoard ?? [];
  const bounty = bounties.find(b => b.id === bountyId);
  if (!bounty) {
    return { success: false, message: '该悬赏不存在或已过期。' };
  }

  setPlayer({ ...p, activeBountyId: bountyId });
  return { success: true, message: `接取了悬赏「追捕${bounty.targetName}」，前往${WORLD_MAP[bounty.targetLocation as LocationId]?.name ?? bounty.targetLocation}。` };
}

/** 放弃悬赏 */
export function abandonBounty(): { success: boolean; message: string } {
  const p = getPlayer();
  if (!p.activeBountyId) {
    return { success: false, message: '没有进行中的悬赏。' };
  }

  setPlayer({ ...p, activeBountyId: null });
  return { success: true, message: '已放弃当前悬赏。' };
}

/** 检查当前位置是否可以完成悬赏（目标在此地） */
export function checkBountyCompletion(): { canComplete: boolean; bounty?: Bounty; enemyId?: string } {
  const p = getPlayer();
  if (!p.activeBountyId) return { canComplete: false };

  const bounties = p.bountyBoard ?? [];
  const bounty = bounties.find(b => b.id === p.activeBountyId);
  if (!bounty) return { canComplete: false };

  const locId = p.currentLocationId ?? '';
  if (bounty.targetLocation !== locId) return { canComplete: false };

  return {
    canComplete: true,
    bounty,
    enemyId: `bounty_${bounty.id}`,
  };
}

/** 完成悬赏（战斗胜利后调用） */
export function completeBounty(): { success: boolean; message: string; rewardGold: number; rewardRep: number } {
  const p = getPlayer();
  if (!p.activeBountyId) return { success: false, message: '', rewardGold: 0, rewardRep: 0 };

  const bounties = p.bountyBoard ?? [];
  const bounty = bounties.find(b => b.id === p.activeBountyId);
  if (!bounty) return { success: false, message: '', rewardGold: 0, rewardRep: 0 };

  setPlayer({
    ...p,
    activeBountyId: null,
    gold: (p.gold ?? 0) + bounty.rewardGold,
    reputation: (p.reputation ?? 0) + bounty.rewardRep,
  });

  return {
    success: true,
    message: `完成了悬赏！击败${bounty.targetName}，获得 ${bounty.rewardGold} 两黄金和 ${bounty.rewardRep} 声望。`,
    rewardGold: bounty.rewardGold,
    rewardRep: bounty.rewardRep,
  };
}

/** 刷新悬赏板（每月调用一次，如果到期则刷新） */
export function tickBountyRefresh(): string[] {
  const p = getPlayer();
  const currentMonth = p.gameMonth ?? 1;
  const bounties = p.bountyBoard ?? [];

  // 移除过期悬赏
  const valid = bounties.filter(b => b.expiresAt > currentMonth);

  // 每3个月刷新
  const lastRefresh = p.lastBountyRefresh ?? 0;
  if (currentMonth - lastRefresh < CFG.refreshMonths && valid.length >= CFG.maxBounties / 2) {
    if (valid.length !== bounties.length) {
      setPlayer({ ...p, bountyBoard: valid });
    }
    return [];
  }

  const newBounties = generateBounties(p);
  const merged = [...valid, ...newBounties].slice(0, CFG.maxBounties);

  setPlayer({
    ...p,
    bountyBoard: merged,
    lastBountyRefresh: currentMonth,
  });

  return newBounties.map(b => `📜 新悬赏：「${b.targetName}」—— ${b.crime}（${b.issuerName}悬赏 ${b.rewardGold}两）`);
}

/** 难度标签 */
export function getDifficultyLabel(d: string): string {
  const map: Record<string, string> = { easy: '简单', normal: '普通', hard: '困难', deadly: '致命' };
  return map[d] ?? d;
}
