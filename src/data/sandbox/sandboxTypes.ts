// ============================================================
//  src/data/sandbox/sandboxTypes.ts — 沙盒模式类型定义
// ============================================================

export type GameMode = 'story' | 'sandbox';

export type SandboxOrigin = 'street_kid' | 'scholar' | 'martial_apprentice' | 'jianghu_orphan';

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export interface SandboxTimeState {
  year: number;
  month: number;
  day: number;
  hourSlot: number;      // 0-5（6 个时辰槽位）
  season: Season;
}

export type SandboxActionId =
  | 'cultivate'           // 修炼
  | 'spar'                // 切磋
  | 'study'               // 研读武学
  | 'explore'             // 探索/行侠仗义
  | 'rest_early'          // 提前休息
  | 'visit_npc'           // 拜访NPC
  | 'gather_intel'        // 搜集情报
  | 'trade'               // 经商/买卖
  | 'work'                // 打工/做事
  | 'sect_task';          // 门派任务

export interface SandboxAction {
  id: SandboxActionId;
  icon: string;
  name: string;
  desc: string;
  hourCost: number;
  unlockCondition?: {
    minLevel?: number;
    minFame?: number;
    hasSect?: boolean;
    location?: string[];
  };
}

export interface WulinReputation {
  jianghuFame: number;
  sectStanding: Record<string, number>;
  alignment: number;
}

export interface CourtReputation {
  courtRank: number;
  influence: number;
  intelligence: number;
}

export interface SandboxData {
  time: SandboxTimeState;
  wulinReputation: WulinReputation;
  courtReputation: CourtReputation;
  identityProgress: number;
  completedEvents: string[];
  actionLog: Array<{ day: number; month: number; action: string }>;
}

export const HOUR_SLOT_NAMES = ['卯时·晨起', '巳时·上午', '午时·正午', '申时·下午', '酉时·傍晚', '亥时·夜间'] as const;
export const MAX_HOUR_SLOTS = 6;

export const SEASON_NAMES: Record<Season, string> = {
  spring: '春',
  summer: '夏',
  autumn: '秋',
  winter: '冬',
};

export const ORIGIN_CONFIG: Record<SandboxOrigin, {
  label: string;
  icon: string;
  desc: string;
  bonusGold: number;
  bonusHp: number;
  bonusAtk: number;
  bonusDef: number;
  bonusAgi: number;
}> = {
  street_kid: {
    label: '市井少年',
    icon: '🏠',
    desc: '临安城内长大的普通少年，见多识广，手头宽裕',
    bonusGold: 80, bonusHp: 0, bonusAtk: 0, bonusDef: 0, bonusAgi: 2,
  },
  scholar: {
    label: '书香门第',
    icon: '📚',
    desc: '没落书生之后，饱读诗书，悟性极高',
    bonusGold: 30, bonusHp: 0, bonusAtk: 0, bonusDef: 0, bonusAgi: 0,
  },
  martial_apprentice: {
    label: '武馆学徒',
    icon: '⚔️',
    desc: '街头武馆打杂的穷小子，拳脚功底扎实',
    bonusGold: 10, bonusHp: 10, bonusAtk: 3, bonusDef: 1, bonusAgi: 1,
  },
  jianghu_orphan: {
    label: '江湖孤儿',
    icon: '🎭',
    desc: '被江湖人收养，浪迹天涯，轻功出众',
    bonusGold: 20, bonusHp: 0, bonusAtk: 1, bonusDef: 0, bonusAgi: 4,
  },
};
