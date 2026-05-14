// ============================================================
//  src/systems/FactionWarfare.ts — 势力领土争夺系统
// ============================================================
//  每回合有一定概率触发攻城事件：
//  1. 选攻击方势力
//  2. 选目标城市（相邻 + 被其他势力控制）
//  3. 双方各选 4 名 NPC → 战力值加权骰子判定胜负
//  4. 更新领土控制 + 生成江湖传闻 + 写入 NPC 日志
// ============================================================

import type { SectId, WorldNewsItem, SkillId } from '../data/types';
import type { LocationId } from '../data/worldMap';
import type { NpcStats } from '../data/npcStats';
import { WORLD_MAP } from '../data/worldMap';
import { FACTION_DEFS, type FactionAlignment } from '../data/sandboxTypes';
import { SECTS } from '../data/sects';
import { getPlayer, setPlayer } from '../state/GameState';
import { appendNpcLog } from './NpcBehavior';
import { getNpcAffection, changeNpcAffection } from './NpcRelationship';
import { spendSiegeCost, applySiegeResult, getSectDefenseMultiplier } from './SectManagement';

// ──── 配置 ────

/** 基础攻城触发概率（每回合） */
const BASE_SIEGE_CHANCE = 0.15;

/** 势力关系 hostile 时额外概率 */
const HOSTILE_BONUS = 0.20;

/** 势力关系 at_war 时额外概率 */
const AT_WAR_BONUS = 0.30;

/** 同一地点攻城冷却（回合数） */
const SIEGE_COOLDOWN = 10;

/** 战斗结果文本模板 */
const SIEGE_RESULT_TEXT: Record<string, { win: string; lose: string }> = {
  righteous:  { win: '大获全胜', lose: '铩羽而归' },
  neutral:    { win: '成功攻占', lose: '无功而返' },
  unorthodox: { win: '毒计得逞', lose: '狼狈逃窜' },
  chaotic:    { win: '血洗城池', lose: '溃不成军' },
};

// ──── 领土初始化 ────

/** 门派据点 → 对应 SectId 映射 */
const SECT_BASE: Partial<Record<LocationId, SectId>> = {
  wudang_mountain: 'wudang',
  shaolin_temple: 'shaolin',
  emei_mountain: 'emei',
  beggar_hq: 'beggar',
  maoshan_daoyuan: 'maoshan',
  kunlun_mountain: 'kunlun',
  qingcheng_mountain: 'qingcheng',
  tangmen_estate: 'tangmen',
  xiaoyao_valley: 'xiaoyao',
  zhongnan_mountain: 'quanzhen',
  kongtong_mountain: 'kongtong',
  diancang_mountain: 'diancang',
  huashan_base: 'huashan',
  heimu_cliff: 'riyue',
};

/**
 * 初始化领土控制状态。
 * 宗门据点默认由自己控制，城市默认无主（'none'）。
 */
export function initTerritoryControl(): Record<LocationId, SectId> {
  const p = getPlayer();
  if (p.territoryControl && Object.keys(p.territoryControl).length > 0) {
    return p.territoryControl as Record<LocationId, SectId>;
  }

  const tc: Record<string, string> = {};
  for (const locId of Object.keys(WORLD_MAP)) {
    tc[locId] = SECT_BASE[locId as LocationId] ?? 'none';
  }
  return tc as Record<LocationId, SectId>;
}

// ──── 辅助 ────

/** 获取控制某地的势力 */
export function getLocationController(locationId: LocationId): SectId {
  const p = getPlayer();
  return (p.territoryControl?.[locationId] ?? SECT_BASE[locationId] ?? 'none') as SectId;
}

/** 获取某势力的所有 NPC（在 npcDatabase 中） */
function getNpcsOfSect(sectId: SectId): NpcStats[] {
  const p = getPlayer();
  const db = p.npcDatabase;
  if (!db) return [];
  return Object.values(db).filter(n => n.sect === sectId);
}

/** 获取某势力在特定地点的 NPC */
function getNpcsAtLocation(locationId: LocationId): NpcStats[] {
  const p = getPlayer();
  const db = p.npcDatabase;
  if (!db) return [];
  return Object.values(db).filter(n => n.currentLocationId === locationId);
}

/** 获取某势力的 alignment */
function getAlignment(sectId: SectId): FactionAlignment {
  return FACTION_DEFS[sectId]?.alignment ?? 'neutral';
}

/**
 * 计算队伍战力值
 * 战力 = Σ(HP×0.3 + ATK×0.4 + DEF×0.2 + AGI×0.1)
 */
function calcTeamPower(npcs: NpcStats[]): number {
  return npcs.reduce((sum, n) => {
    return sum + n.hp * 0.3 + n.atk * 0.4 + n.def * 0.2 + n.agi * 0.1;
  }, 0);
}

/** 获取两个势力间的关系（从 factionRelations） */
function getFactionRelation(sectA: SectId, sectB: SectId): string {
  const p = getPlayer();
  return p.factionRelations?.[sectA]?.[sectB]?.relation ?? 'neutral';
}

/** 恶化势力间关系 */
function worsenFactionRelation(sectA: SectId, sectB: SectId, amount: number): void {
  const p = getPlayer();
  const fr = { ...p.factionRelations };
  if (!fr[sectA]) fr[sectA] = {};
  if (!fr[sectB]) fr[sectB] = {};

  const ab = fr[sectA]?.[sectB];
  const ba = fr[sectB]?.[sectA];

  fr[sectA] = { ...fr[sectA], [sectB]: {
    relation: (ab?.trust ?? 50) - amount < 20 ? 'hostile' : ab?.relation ?? 'neutral',
    trust: Math.max(0, (ab?.trust ?? 50) - amount),
    lastEvent: '攻城战',
    lastEventTurn: p.worldState?.turn ?? 0,
  }};
  fr[sectB] = { ...fr[sectB], [sectA]: {
    relation: (ba?.trust ?? 50) - amount < 20 ? 'hostile' : ba?.relation ?? 'neutral',
    trust: Math.max(0, (ba?.trust ?? 50) - amount),
    lastEvent: '攻城战',
    lastEventTurn: p.worldState?.turn ?? 0,
  }};

  setPlayer({ ...p, factionRelations: fr });
}

// ──── 攻城主逻辑 ────

export interface SiegeResult {
  happened: boolean;
  attackerSect?: SectId;
  defenderSect?: SectId;
  targetLocation?: LocationId;
  attackerWin?: boolean;
  newsText?: string;
}

/**
 * 尝试触发一次攻城事件。
 * 由 Camp.ts 在回合结束后调用。
 */
export function tryTriggerSiege(): SiegeResult {
  const p = getPlayer();
  const currentTurn = (p.worldState?.turn ?? 0) + 1;

  // 1. 概率判定
  const allSects = Object.keys(FACTION_DEFS).filter(s => s !== 'none') as SectId[];
  const attackerSect = allSects[Math.floor(Math.random() * allSects.length)]!;
  const attackerAlign = getAlignment(attackerSect);

  // 2. 选目标：找一个相邻的、被其他势力控制的位置
  const tc = p.territoryControl ?? initTerritoryControl();
  const candidates: Array<{ locId: LocationId; controller: SectId }> = [];

  for (const [locId, controller] of Object.entries(tc)) {
    if (controller === 'none') continue;
    if (controller === attackerSect) continue;

    // 检查是否相邻（通过 WORLD_MAP 的连接关系）
    const locData = WORLD_MAP[locId as LocationId];
    if (!locData) continue;

    // 攻击方必须在某处有据点，且该据点与目标相邻
    const attackerBases = Object.entries(SECT_BASE)
      .filter(([, s]) => s === attackerSect)
      .map(([loc]) => loc as LocationId);

    const isAdjacent = attackerBases.some(base =>
      locData.connections.includes(base) ||
      (WORLD_MAP[base]?.connections.includes(locId as LocationId))
    );

    if (isAdjacent || Math.random() < 0.3) { // 30% 概率攻击非相邻地点
      candidates.push({ locId: locId as LocationId, controller: controller as SectId });
    }
  }

  if (candidates.length === 0) return { happened: false };

  const target = candidates[Math.floor(Math.random() * candidates.length)]!;
  const defenderSect = target.controller;

  // 3. 冷却检查
  const cooldowns = p.siegeCooldown ?? {};
  if ((cooldowns[target.locId] ?? 0) > currentTurn) return { happened: false };

  // 4. 资源检查
  const attackerState = p.sectState?.[attackerSect];
  if (!attackerState || attackerState.resources < 100) return { happened: false };

  // 5. 概率判定（考虑势力关系）
  const relation = getFactionRelation(attackerSect, defenderSect);
  let chance = BASE_SIEGE_CHANCE;
  if (relation === 'hostile') chance += HOSTILE_BONUS;
  if (relation === 'at_war') chance += AT_WAR_BONUS;

  if (Math.random() > chance) return { happened: false };

  // 6. 选兵将
  const attackerNpcs = pickTeam(attackerSect, 4);
  const defenderNpcs = pickTeam(defenderSect, 4);

  if (attackerNpcs.length < 2 || defenderNpcs.length < 2) return { happened: false };

  // 消耗资源
  spendSiegeCost(attackerSect);

  // 7. 战力判定（含门派稳定度加成）
  const defenderMult = getSectDefenseMultiplier(defenderSect);
  const attackerPower = calcTeamPower(attackerNpcs);
  const defenderPower = calcTeamPower(defenderNpcs) * defenderMult;

  let attackerWin: boolean;
  if (attackerPower > defenderPower * 1.1) {
    attackerWin = Math.random() < 0.80;
  } else if (defenderPower > attackerPower * 1.1) {
    attackerWin = Math.random() < 0.20;
  } else {
    attackerWin = Math.random() < 0.50;
  }

  // 8. 更新领土
  const newTc = { ...tc };
  if (attackerWin) {
    newTc[target.locId] = attackerSect;
  }

  // 9. 门派状态影响
  applySiegeResult(attackerSect, defenderSect, attackerWin);

  setPlayer({ ...getPlayer(), territoryControl: newTc });

  // 11. 冷却
  const newCooldowns = { ...cooldowns, [target.locId]: currentTurn + SIEGE_COOLDOWN };
  setPlayer({ ...getPlayer(), siegeCooldown: newCooldowns });

  // 12. 势力关系恶化
  worsenFactionRelation(attackerSect, defenderSect, 15);

  // 13. 日志
  const alignmentText = SIEGE_RESULT_TEXT[attackerAlign] ?? { win: '攻占成功', lose: '战败撤退' };
  const resultText = attackerWin ? alignmentText.win : alignmentText.lose;
  const locName = WORLD_MAP[target.locId]?.name ?? target.locId;
  const attackerName = FACTION_DEFS[attackerSect]?.alignment ?? attackerSect;
  const newsText = `听闻${getSectName(attackerSect)}攻击了${getSectName(defenderSect)}掌控下的${locName}，最终${resultText}。`;

  // 记录参战 NPC 日志
  for (const npc of [...attackerNpcs, ...defenderNpcs]) {
    appendNpcLog(npc.id, `参与了对${locName}的攻城战（${attackerWin ? '攻击方胜' : '防御方胜'}）`);
  }

  // 14. 生成新闻
  const newsItem: WorldNewsItem = {
    text: newsText + (attackerWin ? `\n${getSectName(attackerSect)}趁机占领了${locName}。` : ''),
    turn: currentTurn,
    leftTime: 5,
  };
  const currentNews = p.worldNews ?? [];
  const updatedNews = [newsItem, ...currentNews].slice(0, 10);
  setPlayer({ ...getPlayer(), worldNews: updatedNews });

  return {
    happened: true,
    attackerSect,
    defenderSect,
    targetLocation: target.locId,
    attackerWin,
    newsText,
  };
}

// ──── 选将逻辑 ────

/** 从某势力中选 N 个 NPC（优先高等级、在该势力据点附近） */
function pickTeam(sectId: SectId, count: number): NpcStats[] {
  const npcs = getNpcsOfSect(sectId);
  // 按等级降序
  const sorted = [...npcs].sort((a, b) => b.level - a.level);
  return sorted.slice(0, count);
}

// ──── 显示名称 ────

function getSectName(sectId: SectId): string {
  const names: Record<string, string> = {
    wudang: '武当派', shaolin: '少林寺', emei: '峨眉派', beggar: '丐帮',
    huashan: '华山派', quanzhen: '全真教', kunlun: '昆仑派', tangmen: '唐门',
    qingcheng: '青城派', kongtong: '崆峒派', diancang: '点苍派', maoshan: '茅山派',
    tiezhang: '铁掌帮', demon: '魔教', riyue: '日月教', wudu: '五毒教',
    xuedao: '血刀门', haisha: '海沙帮', xiaoyao: '逍遥派', none: '无',
  };
  return names[sectId] ?? sectId;
}

// ──── 领土控制效果 ────

/**
 * 获取玩家在某个地点的购物价格倍率。
 * 玩家所属门派控制 → 0.9（-10%）
 * 敌对门派控制 → 1.2（+20%）
 * 其他 → 1.0
 */
export function getLocationPriceMultiplier(locationId: LocationId): number {
  const p = getPlayer();
  const controller = getLocationController(locationId);
  if (controller === 'none') return 1.0;

  const playerSect = p.sect;
  if (controller === playerSect) return 0.9;

  const relation = getFactionRelation(playerSect as SectId, controller);
  if (relation === 'hostile' || relation === 'at_war') return 1.2;

  return 1.0;
}

/**
 * 获取玩家在某个地点与 NPC 互动的好感加成倍率。
 * 敌对门派控制 → 0.5
 */
export function getLocationAffectionMultiplier(locationId: LocationId): number {
  const p = getPlayer();
  const controller = getLocationController(locationId);
  if (controller === 'none') return 1.0;

  const playerSect = p.sect;
  if (controller === playerSect) return 1.1;

  const relation = getFactionRelation(playerSect as SectId, controller);
  if (relation === 'hostile' || relation === 'at_war') return 0.5;

  return 1.0;
}

// ──── 玩家参与攻城战 ────

/** NPC 等级 → EnemyId 映射（用于把 NPC 转为战斗敌方单位） */
function mapNpcLevelToEnemyId(level: number): string {
  if (level >= 51) return 'ancient_master';
  if (level >= 41) return 'ancient_master';
  if (level >= 31) return 'wudang_elder_battle';
  if (level >= 21) return 'wudang_mid_disciple';
  if (level >= 11) return 'huashan_swordsman';
  return 'rogue_thug';
}

interface SiegeMeta {
  attackerSect: SectId;
  defenderSect: SectId;
  targetLocation: LocationId;
  attackerNpcs: string[];
  defenderNpcs: string[];
}

/**
 * 玩家加入攻城队，进入 4v4 团队战。
 * 攻击方：玩家 + 3 名本门 NPC
 * 防守方：4 名敌方 NPC（映射为 EnemyId）
 */
export function playerJoinSiege(
  attackerSect: SectId,
  defenderSect: SectId,
  targetLocation: LocationId,
): void {
  const p = getPlayer();

  // 消耗资源
  spendSiegeCost(attackerSect);

  // 选攻击方 NPC（掌门优先，按等级降序，取前3）
  const attackerNpcs = getNpcsOfSect(attackerSect)
    .sort((a, b) => b.level - a.level)
    .slice(0, 3);

  // 选防守方 NPC（按等级降序，取前4）
  const defenderNpcs = getNpcsOfSect(defenderSect)
    .sort((a, b) => b.level - a.level)
    .slice(0, 4);

  // 构建友方单位
  const allyDefs = [
    {
      name: p.name,
      hp: p.hp, maxHp: p.maxHp,
      mp: p.mp, maxMp: p.maxMp,
      atk: p.atk, def: p.def, agi: p.agi, crit: p.crit,
      charImg: p.charImg,
      skills: p.skills as SkillId[],
      isPlayer: true,
    },
    ...attackerNpcs.map(n => ({
      name: n.name,
      hp: n.hp, maxHp: n.maxHp,
      mp: n.mp, maxMp: n.maxMp,
      atk: n.atk, def: n.def, agi: n.agi, crit: n.crit,
      icon: undefined,
      skills: n.skills,
      isPlayer: false,
    })),
  ];

  // 防守方映射为 EnemyId
  const enemyIds = defenderNpcs.map(n => mapNpcLevelToEnemyId(n.level));

  // 保存攻城上下文，供战斗结束后回调
  const siegeMeta: SiegeMeta = {
    attackerSect,
    defenderSect,
    targetLocation,
    attackerNpcs: attackerNpcs.map(n => n.id),
    defenderNpcs: defenderNpcs.map(n => n.id),
  };

  (window as any).__siegeMeta = siegeMeta;

  // 动态导入 BattleEngine 并启动团队战
  import('./BattleEngine').then(m => {
    m.initTeamBattle(allyDefs, enemyIds as any);

    // 监听战斗结束
    import('../ui/events').then(ev => {
      const handler = (data: { result: string; expGain: number; goldGain: number }) => {
        ev.bus.off('battle:end', handler);
        onSiegeBattleEnd(data.result === 'win');
      };
      ev.bus.on('battle:end', handler);
    });
  });
}

/** 攻城战斗结束后的回调 */
function onSiegeBattleEnd(playerWin: boolean): void {
  const meta = (window as any).__siegeMeta as SiegeMeta | undefined;
  if (!meta) return;
  delete (window as any).__siegeMeta;

  const p = getPlayer();

  if (playerWin) {
    // 领土变更
    const tc = { ...(p.territoryControl ?? {}) } as Record<LocationId, SectId>;
    tc[meta.targetLocation] = meta.attackerSect;
    setPlayer({ ...p, territoryControl: tc });

    // 门派状态影响
    applySiegeResult(meta.attackerSect, meta.defenderSect, true);

    // 势力关系恶化
    worsenFactionRelation(meta.attackerSect, meta.defenderSect, 15);

    // 冷却
    const currentTurn = (p.worldState?.turn ?? 0) + 1;
    const cooldowns = { ...(p.siegeCooldown ?? {}), [meta.targetLocation]: currentTurn + SIEGE_COOLDOWN };
    setPlayer({ ...getPlayer(), siegeCooldown: cooldowns });

    // 玩家奖励
    const updated = {
      ...getPlayer(),
      exp: p.exp + 80,
      gold: p.gold + 200,
      sectContribution: (p.sectContribution ?? 0) + 50,
    };
    setPlayer(updated);

    // NPC 日志
    for (const npcId of [...meta.attackerNpcs, ...meta.defenderNpcs]) {
      appendNpcLog(npcId, `参与了对${WORLD_MAP[meta.targetLocation]?.name ?? meta.targetLocation}的攻城战（玩家参战，攻击方胜）`);
    }

    // 新闻
    const locName = WORLD_MAP[meta.targetLocation]?.name ?? meta.targetLocation;
    const newsItem: WorldNewsItem = {
      text: `听闻${getSectName(meta.attackerSect)}在玩家协助下攻占了${getSectName(meta.defenderSect)}掌控的${locName}！`,
      turn: currentTurn,
      leftTime: 5,
    };
    const currentNews = p.worldNews ?? [];
    const updatedNews = [newsItem, ...currentNews].slice(0, 10);
    setPlayer({ ...getPlayer(), worldNews: updatedNews });

    import('../ui/toast').then(m => {
      m.showToast('🎉 攻城大捷！你率队攻占了' + locName + '！获得 80 修为、200 金币、50 贡献！');
    });
  } else {
    // 战败
    applySiegeResult(meta.attackerSect, meta.defenderSect, false);

    // 势力关系恶化
    worsenFactionRelation(meta.attackerSect, meta.defenderSect, 10);

    // 玩家存活但受伤
    setPlayer({ ...getPlayer(), hp: 1 });

    // 安慰奖励
    const updated = { ...getPlayer(), exp: p.exp + 20, sectContribution: (p.sectContribution ?? 0) + 10 };
    setPlayer(updated);

    import('../ui/toast').then(m => {
      m.showToast('💔 攻城失利……你身受重伤，但获得了 20 修为的经验。');
    });
  }

  import('../state/SaveSystem').then(m => m.saveGame(getPlayer()));
}

/**
 * 议事触发的攻城（auto-resolve）。
 * 不由随机触发，而是由议事决策直接调用。
 */
export function tryTriggerSiegeForCouncil(
  attackerSect: SectId,
  defenderSect: SectId,
  targetLocation: LocationId,
): { happened: boolean; attackerWin?: boolean; newsText?: string } {
  const p = getPlayer();
  const currentTurn = (p.worldState?.turn ?? 0) + 1;

  // 选兵将
  const attackerNpcs = pickTeam(attackerSect, 4);
  const defenderNpcs = pickTeam(defenderSect, 4);

  if (attackerNpcs.length < 2 || defenderNpcs.length < 2) {
    return { happened: false };
  }

  // 消耗资源
  spendSiegeCost(attackerSect);

  // 战力判定
  const defenderMult = getSectDefenseMultiplier(defenderSect);
  const attackerPower = calcTeamPower(attackerNpcs);
  const defenderPower = calcTeamPower(defenderNpcs) * defenderMult;

  let attackerWin: boolean;
  if (attackerPower > defenderPower * 1.1) {
    attackerWin = Math.random() < 0.80;
  } else if (defenderPower > attackerPower * 1.1) {
    attackerWin = Math.random() < 0.20;
  } else {
    attackerWin = Math.random() < 0.50;
  }

  // 更新领土
  const tc = { ...(p.territoryControl ?? {}) } as Record<LocationId, SectId>;
  if (attackerWin) {
    tc[targetLocation] = attackerSect;
  }
  setPlayer({ ...p, territoryControl: tc } as any);

  // 门派状态
  applySiegeResult(attackerSect, defenderSect, attackerWin);

  // 冷却
  const cooldowns = { ...(p.siegeCooldown ?? {}), [targetLocation]: currentTurn + SIEGE_COOLDOWN };
  setPlayer({ ...getPlayer(), siegeCooldown: cooldowns });

  // 势力关系
  worsenFactionRelation(attackerSect, defenderSect, 15);

  // 日志
  const locName = WORLD_MAP[targetLocation]?.name ?? targetLocation;
  for (const npc of [...attackerNpcs, ...defenderNpcs]) {
    appendNpcLog(npc.id, `参与了对${locName}的攻城战（议事决议，${attackerWin ? '攻击方胜' : '防御方胜'}）`);
  }

  // 新闻
  const newsText = attackerWin
    ? `听闻${getSectName(attackerSect)}攻占了${getSectName(defenderSect)}掌控的${locName}，大获全胜！`
    : `听闻${getSectName(attackerSect)}攻打${getSectName(defenderSect)}掌控的${locName}，铩羽而归。`;

  const newsItem: WorldNewsItem = {
    text: newsText,
    turn: currentTurn,
    leftTime: 5,
  };
  const currentNews = p.worldNews ?? [];
  const updatedNews = [newsItem, ...currentNews].slice(0, 10);
  setPlayer({ ...getPlayer(), worldNews: updatedNews });

  return { happened: true, attackerWin, newsText };
}
