// ============================================================
//  src/systems/EncounterSystem.ts — 随机遭遇事件系统
// ============================================================
//  在日常任务中有概率触发随机遭遇，战斗/对话/宝藏三种形态。
//  触发后弹出选择框（前往/忽略），交由对应系统执行。
// ============================================================

import type { LocationId } from '../data/worldMap';
import { WORLD_MAP } from '../data/worldMap';
import { getPlayer } from '../state/GameState';
import type { EnemyId } from '../data/types';

export type EncounterType = 'monster' | 'bandit' | 'ruins' | 'duel' | 'mystery';

export interface EncounterEvent {
  type: EncounterType;
  title: string;
  description: string;
  locationId: LocationId;
  locationName: string;
  /** 战斗型遭遇 */
  enemyId?: EnemyId;
  enemyName?: string;
  /** 通用奖励 */
  rewards: { exp: number; gold: number };
}

// ──── 遭遇事件池 ────

interface EncounterTemplate {
  type: EncounterType;
  title: string;
  descriptionTemplate: string;
  enemyId?: EnemyId;
  enemyName?: string;
  rewards: { exp: number; gold: number };
  minDanger: number;
}

const TEMPLATES: EncounterTemplate[] = [
  // monster 妖兽
  { type: 'monster', title: '妖兽出没',
    descriptionTemplate: '${loc}附近山林中传出野兽咆哮，村民说近日有妖兽出没伤人。',
    enemyId: 'forest_yao_beast', enemyName: '妖兽', rewards: { exp: 30, gold: 25 },
    minDanger: 3 },
  { type: 'monster', title: '恶虎下山',
    descriptionTemplate: '${loc}一带近来有猛虎昼伏夜出，已有数名樵夫遇袭。',
    enemyId: 'rogue_thug', enemyName: '恶虎', rewards: { exp: 20, gold: 15 },
    minDanger: 2 },
  // bandit 山贼
  { type: 'bandit', title: '山贼拦路',
    descriptionTemplate: '一群山贼在${loc}官道上设卡，劫掠过往商旅。',
    enemyId: 'bandit_elite', enemyName: '山贼头目', rewards: { exp: 35, gold: 40 },
    minDanger: 2 },
  { type: 'bandit', title: '马匪出没',
    descriptionTemplate: '一伙马匪在${loc}郊外横行，官府贴出告示悬赏剿灭。',
    enemyId: 'one_eye_leopard', enemyName: '独眼豹', rewards: { exp: 40, gold: 50 },
    minDanger: 3 },
  // ruins 遗迹
  { type: 'ruins', title: '古墓遗迹',
    descriptionTemplate: '${loc}附近发现一座前朝古墓，据说藏有武学秘籍。',
    rewards: { exp: 50, gold: 60 }, minDanger: 3 },
  { type: 'ruins', title: '仙人洞府',
    descriptionTemplate: '${loc}一处山崖崩塌后露出隐藏洞府，隐有灵光闪烁。',
    rewards: { exp: 40, gold: 45 }, minDanger: 4 },
  // duel 约战
  { type: 'duel', title: '路遇剑客',
    descriptionTemplate: '一位游历江湖的剑客在${loc}向你发起切磋邀约。',
    enemyId: 'huashan_swordsman', enemyName: '华山剑客', rewards: { exp: 25, gold: 10 },
    minDanger: 2 },
  { type: 'duel', title: '武僧挑战',
    descriptionTemplate: '一名云游僧人路过${loc}，见你根骨不错，想试试你的身手。',
    enemyId: 'shaolin_monk', enemyName: '少林武僧', rewards: { exp: 30, gold: 10 },
    minDanger: 2 },
  { type: 'duel', title: '散修切磋',
    descriptionTemplate: '${loc}有一位散修摆下擂台，邀人切磋武艺。',
    enemyId: 'wudang_gate_disciple', enemyName: '散修武者', rewards: { exp: 20, gold: 15 },
    minDanger: 1 },
  // mystery 奇遇
  { type: 'mystery', title: '天降陨铁',
    descriptionTemplate: '${loc}昨夜一颗流星坠地，今晨已引来不少江湖人士围观。',
    rewards: { exp: 20, gold: 80 }, minDanger: 2 },
  { type: 'mystery', title: '药农仙草',
    descriptionTemplate: '${loc}一位老药农声称在深山采到千年灵芝，愿赠予有缘人。',
    rewards: { exp: 45, gold: 30 }, minDanger: 3 },
  { type: 'mystery', title: '江湖风波',
    descriptionTemplate: '${loc}一家酒楼中，两派弟子因口角剑拔弩张，围观者议论纷纷。',
    rewards: { exp: 15, gold: 35 }, minDanger: 1 },
];

// ──── 状态 ────

let encounterCounter = 0;

// ──── 触发逻辑 ────

/** 每次日常任务后调用，概率返回一个遭遇事件 */
export function tryTriggerEncounter(): EncounterEvent | null {
  encounterCounter++;

  // 前 3 次行动必定不触发
  if (encounterCounter <= 3) return null;

  const p = getPlayer();
  const locId = p.currentLocationId ?? 'wudang_mountain';
  const loc = WORLD_MAP[locId];
  if (!loc) return null;

  // 根据 dangerLevel 决定触发概率
  const dl = loc.dangerLevel ?? 2;
  let prob: number;
  if (dl >= 5) prob = 0.25;
  else if (dl >= 3) prob = 0.18;
  else prob = 0.10;

  if (Math.random() > prob) {
    encounterCounter = Math.max(0, encounterCounter - 1); // 轻微衰减
    return null;
  }

  // 重置计数器
  encounterCounter = 0;

  // 筛选可用模板
  const candidates = TEMPLATES.filter(t => dl >= t.minDanger);
  if (candidates.length === 0) return null;

  const tpl = candidates[Math.floor(Math.random() * candidates.length)]!;
  const desc = tpl.descriptionTemplate.replace('${loc}', loc.name);

  return {
    type: tpl.type,
    title: tpl.title,
    description: desc,
    locationId: locId,
    locationName: loc.name,
    enemyId: tpl.enemyId,
    enemyName: tpl.enemyName,
    rewards: { ...tpl.rewards },
  };
}

/** 重置遭遇计数器（新存档时调用可选） */
export function resetEncounterCounter(): void {
  encounterCounter = 0;
}

// ──── 旅行遭遇 ────

export type TravelEncounterType = 'ambush' | 'treasure' | 'merchant' | 'rumor';

export interface TravelEncounterEvent {
  type: TravelEncounterType;
  title: string;
  description: string;
  /** 战斗型遭遇 */
  enemyId?: EnemyId;
  enemyName?: string;
  /** 非战斗型奖励 */
  rewards: { exp: number; gold: number; itemHint?: string };
}

interface TravelEncounterTemplate {
  type: TravelEncounterType;
  title: string;
  descriptionTemplate: string;
  enemyId?: EnemyId;
  enemyName?: string;
  rewards: { exp: number; gold: number; itemHint?: string };
}

const TRAVEL_TEMPLATES: TravelEncounterTemplate[] = [
  // ambush — 路遇山贼
  { type: 'ambush', title: '路遇山贼',
    descriptionTemplate: '行至${from}与${to}之间，忽闻一声唿哨，一群山贼从林中杀出！',
    enemyId: 'bandit_elite', enemyName: '山贼头目',
    rewards: { exp: 35, gold: 40 } },
  { type: 'ambush', title: '猛兽拦路',
    descriptionTemplate: '途经${from}前往${to}的山道，一头猛虎挡在路中，眈眈而视。',
    enemyId: 'forest_yao_beast', enemyName: '妖兽',
    rewards: { exp: 30, gold: 25 } },
  { type: 'ambush', title: '马匪劫道',
    descriptionTemplate: '${from}至${to}的官道上，一伙马匪扬尘而来，将你团团围住。',
    enemyId: 'one_eye_leopard', enemyName: '独眼豹',
    rewards: { exp: 40, gold: 50 } },
  // treasure — 发现秘境
  { type: 'treasure', title: '山崖古洞',
    descriptionTemplate: '行路途中发现一处隐蔽岩洞，洞壁上刻有模糊的武学图谱。',
    rewards: { exp: 50, gold: 30, itemHint: '或可参悟武学' } },
  { type: 'treasure', title: '前人遗宝',
    descriptionTemplate: '在一棵枯树洞中发现一个旧木匣，内藏丹药与散碎银两。',
    rewards: { exp: 25, gold: 60, itemHint: '内有一枚丹药' } },
  { type: 'treasure', title: '隐士药庐',
    descriptionTemplate: '迷路误入一處幽谷，遇一采药老翁，赠予数味灵草。',
    rewards: { exp: 40, gold: 20, itemHint: '灵草若干' } },
  // merchant — 神秘商人
  { type: 'merchant', title: '游方货郎',
    descriptionTemplate: '路上遇到一位游方货郎，摊上摆着几件稀奇物件，说是从西域带回。',
    rewards: { exp: 10, gold: 0, itemHint: '稀有货物可购' } },
  { type: 'merchant', title: '落魄铁匠',
    descriptionTemplate: '一位衣衫褴褛的铁匠蹲坐道旁，脚边放着一柄寒光闪闪的兵器。',
    rewards: { exp: 10, gold: 0, itemHint: '法宝待售' } },
  // rumor — 江湖传闻
  { type: 'rumor', title: '茶棚闲话',
    descriptionTemplate: '道旁茶棚歇脚时，听几位镖师谈论近日江湖上的大事……',
    rewards: { exp: 15, gold: 5, itemHint: '探知势力动向' } },
  { type: 'rumor', title: '信使狂奔',
    descriptionTemplate: '一匹快马从身边掠过，马上信使高喊："紧急军情——！"',
    rewards: { exp: 10, gold: 0, itemHint: '获知攻城动向' } },
  { type: 'rumor', title: '丐帮弟子',
    descriptionTemplate: '几位丐帮弟子蹲在路边窃窃私语，见你经过便收声不语，却漏了几句。',
    rewards: { exp: 15, gold: 5, itemHint: '江湖情报' } },
];

/**
 * 旅行时概率触发遭遇（20%）。
 * 由 travelToLocation() 调用。
 */
export function tryTravelEncounter(
  fromId: LocationId,
  toId: LocationId,
): TravelEncounterEvent | null {
  if (Math.random() > 0.20) return null;

  const fromLoc = WORLD_MAP[fromId];
  const toLoc = WORLD_MAP[toId];
  if (!fromLoc || !toLoc) return null;

  const tpl = TRAVEL_TEMPLATES[Math.floor(Math.random() * TRAVEL_TEMPLATES.length)]!;
  const desc = tpl.descriptionTemplate
    .replace('${from}', fromLoc.name)
    .replace('${to}', toLoc.name);

  return {
    type: tpl.type,
    title: tpl.title,
    description: desc,
    enemyId: tpl.enemyId,
    enemyName: tpl.enemyName,
    rewards: { ...tpl.rewards },
  };
}
