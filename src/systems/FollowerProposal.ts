// ============================================================
//  src/systems/FollowerProposal.ts — 随从献策系统
// ============================================================
//  每月随从有概率向玩家献策/提议，增强"武将"的代入感
//  灵感来源：三国志13 武将提案 + 太阁立志传 部下建言
// ============================================================

import { getPlayer, setPlayer } from '../state/GameState';
import type { SectId } from '../data/types';
import type { LocationId } from '../data/worldMap';
import { WORLD_MAP } from '../data/worldMap';

export interface FollowerProposal {
  id: string;
  followerName: string;
  followerId: string;
  type: 'treasure_hunt' | 'scout_enemy' | 'training' | 'introduce_npc' | 'seek_doctor' | 'war_advice';
  title: string;
  description: string;
  /** 接受后的效果描述 */
  effectDesc: string;
  /** 提案生成月份 */
  month: number;
  /** 是否已被处理 */
  resolved: boolean;
}

const PROPOSAL_STORE_KEY = '__follower_proposals';

/** 获取未处理的提案 */
export function getPendingProposals(): FollowerProposal[] {
  return ((window as any)[PROPOSAL_STORE_KEY] ?? [])
    .filter((p: FollowerProposal) => !p.resolved);
}

/** 标记提案已处理 */
export function resolveProposal(id: string): void {
  const proposals: FollowerProposal[] = (window as any)[PROPOSAL_STORE_KEY] ?? [];
  (window as any)[PROPOSAL_STORE_KEY] = proposals.map(p =>
    p.id === id ? { ...p, resolved: true } : p
  );
}

/** 每月检查随从献策 */
export function tickFollowerProposals(): FollowerProposal[] {
  const p = getPlayer();
  const recruited = p.npcCollection?.recruited ?? [];
  if (recruited.length === 0) return [];

  const db = p.npcDatabase ?? {};
  const newProposals: FollowerProposal[] = [];
  const currentMonth = p.gameMonth ?? 1;

  for (const npcId of recruited) {
    const npc = db[npcId];
    if (!npc) continue;

    // 基础概率：15%，亲密度越高越容易献策
    const aff = p.npcAffection?.[npcId] ?? 0;
    const chance = 0.10 + aff * 0.002; // 10% + 每50好感度+10%
    if (Math.random() > chance) continue;

    const proposal = generateProposal(npcId, npc.name, npc.sect, currentMonth);
    if (proposal) newProposals.push(proposal);
  }

  // 存储到 session store
  const existing: FollowerProposal[] = (window as any)[PROPOSAL_STORE_KEY] ?? [];
  (window as any)[PROPOSAL_STORE_KEY] = [...existing, ...newProposals].slice(-8); // 最多保留8条

  return newProposals;
}

const PROPOSAL_TEMPLATES: Array<{
  type: FollowerProposal['type'];
  weight: number;
  generate: (name: string, sectId: SectId, month: number) => Omit<FollowerProposal, 'id' | 'followerName' | 'followerId' | 'month' | 'resolved'>;
}> = [
  {
    type: 'treasure_hunt',
    weight: 2,
    generate: (name, sectId) => {
      const loc = getRandomLocation();
      const locName = WORLD_MAP[loc]?.name ?? '远方';
      return {
        type: 'treasure_hunt' as const,
        title: `${name}探查到宝物线索`,
        description: `"主公，属下听闻${locName}附近近日有异象，或有异宝出世。若前往探索，或有机缘。"`,
        effectDesc: `前往${locName}可触发寻宝事件（EXP +40~100，概率获得法宝）`,
      };
    },
  },
  {
    type: 'scout_enemy',
    weight: 2,
    generate: (name, sectId) => {
      const hostile = getRandomHostileSect(sectId);
      const sectName = hostile.name;
      return {
        type: 'scout_enemy' as const,
        title: `${name}侦察到敌情`,
        description: `"主公，${sectName}近日兵力调动频繁，似有异动。属下建议加强戒备，或先发制人。"`,
        effectDesc: `${sectName}下次攻城时我方防御+15%，或可主动出击抢占先机`,
      };
    },
  },
  {
    type: 'training',
    weight: 3,
    generate: (name) => {
      return {
        type: 'training' as const,
        title: `${name}请求外出历练`,
        description: `"主公，属下近日修行遇瓶颈，想外出历练一番。若得允准，定当勤修不辍。"`,
        effectDesc: `${name} EXP +30~60，小概率属性+1`,
      };
    },
  },
  {
    type: 'introduce_npc',
    weight: 1,
    generate: (name) => {
      return {
        type: 'introduce_npc' as const,
        title: `${name}引荐一位江湖人物`,
        description: `"主公，属下认识一位江湖朋友，身怀绝技。若主公有意，属下可代为引见。"`,
        effectDesc: `结识一位新NPC，初始好感度+20`,
      };
    },
  },
  {
    type: 'seek_doctor',
    weight: 1,
    generate: (name) => {
      return {
        type: 'seek_doctor' as const,
        title: `${name}身体抱恙`,
        description: `"主公，属下近日修炼出了些岔子，气血不畅。恳请准许寻医调养。"`,
        effectDesc: `${name} HP 恢复至满`,
      };
    },
  },
  {
    type: 'war_advice',
    weight: 1,
    generate: (name) => {
      return {
        type: 'war_advice' as const,
        title: `${name}献上战策`,
        description: `"主公，属下观天下大势，有些战策想与主公商议。若时机合适，或可一战建功。"`,
        effectDesc: `下次亲自参战时，首回合伤害+20%`,
      };
    },
  },
];

function generateProposal(
  npcId: string,
  name: string,
  sectId: SectId,
  month: number,
): FollowerProposal | null {
  const totalWeight = PROPOSAL_TEMPLATES.reduce((s, t) => s + t.weight, 0);
  let roll = Math.random() * totalWeight;
  let chosen = PROPOSAL_TEMPLATES[0]!;
  for (const t of PROPOSAL_TEMPLATES) {
    roll -= t.weight;
    if (roll <= 0) { chosen = t; break; }
  }

  const base = chosen.generate(name, sectId, month);
  return {
    ...base,
    id: `prop_${npcId}_${month}_${Math.random().toString(36).slice(2, 6)}`,
    followerName: name,
    followerId: npcId,
    month,
    resolved: false,
  };
}

function getRandomLocation(): LocationId {
  const keys = Object.keys(WORLD_MAP) as LocationId[];
  return keys[Math.floor(Math.random() * keys.length)]!;
}

function getRandomHostileSect(mySect: SectId): { id: SectId; name: string } {
  const p = getPlayer();
  const allSects = Object.keys(p.factionRelations ?? {}) as SectId[];
  const hostiles = allSects.filter(s => {
    const rel = p.factionRelations?.[mySect]?.[s];
    return s !== mySect && s !== 'none' && (rel?.relation === 'hostile' || (rel?.trust ?? 50) < 30);
  });
  if (hostiles.length > 0) {
    const s = hostiles[Math.floor(Math.random() * hostiles.length)]!;
    return { id: s, name: s };
  }
  // fallback: any sect
  const fallback = allSects.filter(s => s !== mySect && s !== 'none');
  const s = fallback[Math.floor(Math.random() * fallback.length)] ?? 'wudang';
  return { id: s as SectId, name: s };
}

/** 处理接受提案 */
export function acceptProposal(proposal: FollowerProposal): void {
  const p = getPlayer();
  resolveProposal(proposal.id);

  switch (proposal.type) {
    case 'training': {
      // 随从获得经验
      const db = { ...(p.npcDatabase ?? {}) };
      const npc = db[proposal.followerId];
      if (npc) {
        const expGain = 30 + Math.floor(Math.random() * 31);
        db[proposal.followerId] = { ...npc, exp: npc.exp + expGain };
        setPlayer({ ...p, npcDatabase: db });

        // 小概率属性提升
        if (Math.random() < 0.15) {
          const stats = ['atk', 'def', 'agi', 'crit'] as const;
          const stat = stats[Math.floor(Math.random() * stats.length)]!;
          const newDb = { ...db };
          const entry = { ...newDb[proposal.followerId]! };
          (entry as any)[stat] = (npc[stat] ?? 0) + 1;
          newDb[proposal.followerId] = entry;
          setPlayer({ ...getPlayer(), npcDatabase: newDb });
        }
      }
      break;
    }
    case 'seek_doctor': {
      const db = { ...(p.npcDatabase ?? {}) };
      const npc = db[proposal.followerId];
      if (npc) {
        db[proposal.followerId] = { ...npc, hp: npc.maxHp };
        setPlayer({ ...p, npcDatabase: db });
      }
      break;
    }
    case 'war_advice': {
      (window as any).__warAdviceActive = true;
      break;
    }
    case 'scout_enemy': {
      (window as any).__scoutBonusActive = true;
      break;
    }
  }
}

/** 拒绝提案（无事发生） */
export function declineProposal(proposal: FollowerProposal): void {
  resolveProposal(proposal.id);
}
