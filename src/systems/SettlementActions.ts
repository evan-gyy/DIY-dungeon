// ============================================================
//  src/systems/SettlementActions.ts — 据点开发/破坏行动
// ============================================================
//  根据势力-据点关系动态生成行动：
//  - 友好据点：开发行动（提升据点属性 + statExp）
//  - 敌对据点：破坏行动（降低据点属性 + statExp/奖励）
//  - 中立据点：通用行动
// ============================================================

import type { LocationId } from '../data/worldMap';
import { WORLD_MAP } from '../data/worldMap';
import type { SettlementAttributes, MissionTrack } from '../data/sandboxTypes';
import { getPlayer, setPlayer } from '../state/GameState';
import { saveGame } from '../state/SaveSystem';
import { grantPlayerStatExp } from './ActionSystem';
import { isSectBase } from './SectManagement';

// ──── 行动定义 ────

export interface SettlementAction {
  id: string;
  icon: string;
  name: string;
  desc: string;
  track: MissionTrack;
  /** 行动类型：develop=开发 sabotage=破坏 neutral=通用 */
  category: 'develop' | 'sabotage' | 'neutral';
}

// ──── 据点关系判定 ────

export type LocationRelation = 'friendly' | 'neutral' | 'hostile';

export function getLocationRelation(locId: LocationId): {
  relation: LocationRelation;
  ownerFaction: string;
  ownerLabel: string;
} {
  const p = getPlayer();
  const territoryControl = (p.territoryControl ?? {}) as Record<string, string>;
  const ownerFromTC = territoryControl[locId];
  const ownerFromBase = isSectBase(locId);
  const owner = ownerFromTC ?? ownerFromBase;

  if (!owner) {
    return { relation: 'neutral', ownerLabel: '无主之地', ownerFaction: 'none' };
  }

  const playerFaction = p.sect !== 'none' ? p.sect : null;

  if (owner === playerFaction) {
    return { relation: 'friendly', ownerLabel: '己方势力', ownerFaction: owner };
  }

  if (owner === 'imperial_court' && p.courtRank !== 'commoner') {
    return { relation: 'friendly', ownerLabel: '朝廷领地', ownerFaction: owner };
  }

  if (owner === 'rebels' && playerFaction === 'rebels') {
    return { relation: 'friendly', ownerLabel: '义军领地', ownerFaction: owner };
  }

  if (playerFaction) {
    const rel = (p.factionRelations as any)?.[playerFaction]?.[owner];
    if (rel && (rel.relation === 'at_war' || rel.relation === 'hostile')) {
      const name = WORLD_MAP[locId]?.name ?? owner;
      return { relation: 'hostile', ownerLabel: `敌对·${name}`, ownerFaction: owner };
    }
  }

  const name = WORLD_MAP[locId]?.name ?? owner;
  return { relation: 'neutral', ownerLabel: `中立·${name}`, ownerFaction: owner };
}

// ──── 开发行动（己方据点） ────

const DEVELOP_ACTIONS: SettlementAction[] = [
  { id: 'dev_agriculture',  icon: '🌾', name: '农业开发',  desc: '督导农事、兴修水利，提升田地产出。', track: 'court_wen', category: 'develop' },
  { id: 'dev_commerce',     icon: '🏪', name: '商业投资',  desc: '招揽商贾、开设市集，繁荣地方经济。', track: 'court_wen', category: 'develop' },
  { id: 'dev_fortify',      icon: '🏰', name: '修筑城墙',  desc: '督造城墙箭楼，加固城防工事。',       track: 'court_wu',  category: 'develop' },
  { id: 'dev_garrison',     icon: '🛡️', name: '训练守军',  desc: '操练驻防兵卒，提升战力与士气。',     track: 'court_wu',  category: 'develop' },
  { id: 'dev_academy',      icon: '📚', name: '兴办学堂',  desc: '设立书院私塾，培育地方人才。',       track: 'court_wen', category: 'develop' },
  { id: 'dev_population',   icon: '👥', name: '招募流民',  desc: '开仓放粮、招抚流民，充实户口。',     track: 'universal',category: 'develop' },
];

// ──── 破坏行动（敌对据点） ────

const SABOTAGE_ACTIONS: SettlementAction[] = [
  { id: 'sabotage_rumor',     icon: '🗣️', name: '散布谣言',  desc: '在市井散布不利传闻，动摇民心。',     track: 'court_wen', category: 'sabotage' },
  { id: 'sabotage_facility',  icon: '🔥', name: '破坏设施',  desc: '暗中破坏城墙、仓库等关键设施。',     track: 'court_wu',  category: 'sabotage' },
  { id: 'sabotage_order',     icon: '💢', name: '煽动骚乱',  desc: '挑拨民怨、制造混乱，降低治安。',     track: 'jianghu',   category: 'sabotage' },
  { id: 'sabotage_scout',     icon: '👁️', name: '情报侦察',  desc: '潜入收集军情防务，为日后攻略铺垫。', track: 'court_wu',  category: 'sabotage' },
  { id: 'sabotage_commerce',  icon: '📉', name: '扰乱商路',  desc: '劫掠商队、封锁要道，损其经济命脉。',  track: 'jianghu',   category: 'sabotage' },
];

// ──── 中立行动（无主之地/中立据点） ────

const NEUTRAL_ACTIONS: SettlementAction[] = [
  { id: 'neutral_trade',    icon: '🧳', name: '行商交易',  desc: '与当地商贩互通有无，赚取些许铜钱。',   track: 'universal', category: 'neutral' },
  { id: 'neutral_info',     icon: '📰', name: '打探消息',  desc: '在茶馆酒肆探听江湖近况与天下大势。',   track: 'universal', category: 'neutral' },
  { id: 'neutral_help',     icon: '🤝', name: '仗义相助',  desc: '路见不平出手相助，积累善缘与声望。',   track: 'jianghu',   category: 'neutral' },
];

// ──── 获取可用行动 ────

export function getSettlementActions(locId: LocationId): SettlementAction[] {
  const { relation } = getLocationRelation(locId);
  switch (relation) {
    case 'friendly': return DEVELOP_ACTIONS;
    case 'hostile':  return SABOTAGE_ACTIONS;
    default:         return NEUTRAL_ACTIONS;
  }
}

// ──── 执行业务逻辑 ────

function clamp(v: number): number { return Math.max(0, Math.min(100, v)); }
function randDelta(): number { return Math.floor(Math.random() * 4) + 1; } // 1~4

function modifySettlement(locId: LocationId, changes: Partial<SettlementAttributes>): void {
  const p = getPlayer();
  const state = { ...(p.settlementState ?? {}) };
  const cur = state[locId] ?? ({} as SettlementAttributes);
  const updated: Record<string, number> = { ...(cur as any) };
  for (const [key, delta] of Object.entries(changes)) {
    if (typeof delta === 'number') {
      updated[key] = clamp((updated[key] ?? 0) + delta);
    }
  }
  state[locId] = updated as any;
  setPlayer({ ...p, settlementState: state });
  saveGame(getPlayer());
}

export function executeSettlementAction(actionId: string, locId: LocationId): string {
  const p = getPlayer();
  const locName = WORLD_MAP[locId]?.name ?? '此地';
  const delta = randDelta();

  switch (actionId) {
    // ── 开发 ──
    case 'dev_agriculture': {
      modifySettlement(locId, { agriculture: delta, development: 1 });
      grantPlayerStatExp({ combat: {}, court: { strategy: delta * 5, scholarship: delta * 3 } });
      return `🌾 农业开发完成！${locName}的农业 +${delta}。`;
    }
    case 'dev_commerce': {
      modifySettlement(locId, { commerce: delta, prosperity: 1 });
      const goldEarned = delta * 8 + 10;
      setPlayer({ ...getPlayer(), gold: getPlayer().gold + goldEarned });
      grantPlayerStatExp({ combat: {}, court: { charisma: delta * 4, scholarship: delta * 3 } });
      return `🏪 商业投资完成！${locName}的商业 +${delta}，赚得 ${goldEarned} 铜钱。`;
    }
    case 'dev_fortify': {
      modifySettlement(locId, { fortification: delta, development: 1 });
      grantPlayerStatExp({ combat: { def: delta * 4 }, court: { strategy: delta * 5 } });
      return `🏰 城墙修筑完成！${locName}的城防 +${delta}。`;
    }
    case 'dev_garrison': {
      modifySettlement(locId, { garrison: delta, publicOrder: 1 });
      grantPlayerStatExp({ combat: { atk: delta * 4, def: delta * 3 }, court: { strategy: delta * 3 } });
      return `🛡️ 守军操练完成！${locName}的驻军 +${delta}。`;
    }
    case 'dev_academy': {
      modifySettlement(locId, { academy: delta, development: 1 });
      grantPlayerStatExp({ combat: {}, court: { scholarship: delta * 7 } });
      return `📚 学堂兴办完成！${locName}的学术 +${delta}。`;
    }
    case 'dev_population': {
      modifySettlement(locId, { population: delta, publicOrder: -1 });
      grantPlayerStatExp({ combat: {}, court: { charisma: delta * 5, eloquence: delta * 3 } });
      return `👥 流民招募完成！${locName}的人口 +${delta}。`;
    }

    // ── 破坏 ──
    case 'sabotage_rumor': {
      modifySettlement(locId, { publicOrder: -delta * 2, prosperity: -1 });
      const influenceGain = delta * 3 + 5;
      setPlayer({ ...getPlayer(), influence: (getPlayer().influence ?? 0) + influenceGain });
      grantPlayerStatExp({ combat: {}, court: { eloquence: delta * 4, charisma: delta * 3 } });
      return `🗣️ 谣言散播成功！${locName}治安 -${delta * 2}，影响力 +${influenceGain}。`;
    }
    case 'sabotage_facility': {
      modifySettlement(locId, { fortification: -delta, commerce: -1 });
      grantPlayerStatExp({ combat: { atk: delta * 3, agi: delta * 3 }, court: {} });
      return `🔥 设施破坏成功！${locName}城防 -${delta}。`;
    }
    case 'sabotage_order': {
      modifySettlement(locId, { publicOrder: -delta * 2, garrison: -1 });
      grantPlayerStatExp({ combat: { agi: delta * 4, crit: delta * 2 }, court: { charisma: delta * 3 } });
      return `💢 骚乱煽动成功！${locName}治安 -${delta * 2}。`;
    }
    case 'sabotage_scout': {
      // 情报侦察：揭示据点详细属性
      const state = (p.settlementState ?? {})[locId];
      const info = state
        ? `人口${state.population} 繁荣${state.prosperity} 驻军${state.garrison} 城防${state.fortification} 治安${state.publicOrder}`
        : '暂无信息';
      grantPlayerStatExp({ combat: { agi: delta * 5 }, court: { strategy: delta * 5 } });
      return `👁️ 侦察完成！${locName}情报：${info}`;
    }
    case 'sabotage_commerce': {
      modifySettlement(locId, { commerce: -delta, prosperity: -1 });
      const goldLoot = delta * 12 + 15;
      setPlayer({ ...getPlayer(), gold: getPlayer().gold + goldLoot });
      grantPlayerStatExp({ combat: { atk: delta * 3, agi: delta * 3 }, court: {} });
      return `📉 商路扰乱成功！${locName}商业 -${delta}，劫获 ${goldLoot} 铜钱。`;
    }

    // ── 中立 ──
    case 'neutral_trade': {
      const goldEarned = delta * 5 + 8;
      setPlayer({ ...getPlayer(), gold: getPlayer().gold + goldEarned, exp: getPlayer().exp + delta * 3 });
      grantPlayerStatExp({ combat: {}, court: { charisma: delta * 2 } });
      return `🧳 行商交易完成！赚得 ${goldEarned} 铜钱。`;
    }
    case 'neutral_info': {
      const expGain = delta * 5 + 5;
      setPlayer({ ...getPlayer(), exp: getPlayer().exp + expGain });
      grantPlayerStatExp({ combat: {}, court: { scholarship: delta * 3, strategy: delta * 2 } });
      return `📰 消息打探完成！了解了${locName}及周边的江湖近况。经验 +${expGain}`;
    }
    case 'neutral_help': {
      const expGain = delta * 4 + 5;
      const goldGain = delta * 3;
      setPlayer({ ...getPlayer(), exp: getPlayer().exp + expGain, gold: getPlayer().gold + goldGain });
      grantPlayerStatExp({ combat: { atk: delta * 2, def: delta * 2 }, court: { charisma: delta * 2 } });
      return `🤝 仗义相助完成！百姓感激涕零。经验 +${expGain}，铜钱 +${goldGain}`;
    }

    default:
      return '未知行动。';
  }
}
