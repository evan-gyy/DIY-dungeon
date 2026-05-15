// ============================================================
//  src/systems/GrandEventSystem.ts — 江湖大事件系统
// ============================================================
//  每月初有概率触发江湖大事件，玩家可从 3-4 个分支中选择
//  参与方式，产生不同的世界影响和奖励。
//  roguelike 设计：每个事件有多个选项，不同风险/收益。
// ============================================================

import type { SectId, EnemyId } from '../data/types';
import type { LocationId } from '../data/worldMap';
import { WORLD_MAP } from '../data/worldMap';
import { getPlayer, setPlayer } from '../state/GameState';
import { getSectState, updateSectState, computeSectPower, isSectBase } from './SectManagement';
import { getFactionRelation, getFactionTrust } from './FactionSystem';
import { SECTS } from '../data/sects';
import { FACTION_DEFS } from '../data/sandboxTypes';
import { addChronicleEntry } from './WorldState';

// ──── 类型定义 ────

export type GrandEventType =
  | 'sect_war'
  | 'tournament'
  | 'treasure_hunt'
  | 'monster_invasion'
  | 'rebel_uprising'
  | 'court_decree'
  | 'alliance_summit';

export interface GrandEventChoice {
  id: string;
  label: string;
  risk: 'low' | 'medium' | 'high';
  requirement?: {
    minLevel?: number;
    minReputation?: number;
    sectRelation?: { faction: SectId; minTrust: number };
  };
}

export interface WorldEffect {
  type: 'trust_change' | 'territory_change' | 'prosperity_change' | 'reputation_change' | 'sect_state';
  target: SectId | string;
  value: number;
  description: string;
}

export interface GrandEventOutcome {
  description: string;
  rewards: { exp: number; gold: number; contribution?: number; items?: string[] };
  worldEffects: WorldEffect[];
}

export interface GrandEvent {
  id: string;
  type: GrandEventType;
  title: string;
  description: string;
  locationId: LocationId;
  locationName: string;
  involvedSects: SectId[];
  choices: GrandEventChoice[];
  outcomes: Record<string, GrandEventOutcome>;
}

export interface GrandEventResult {
  eventId: string;
  choiceId: string;
  outcome: GrandEventOutcome;
  playerParticipated: boolean;
}

// ──── 事件模板 ────

interface GrandEventTemplate {
  id: string;
  type: GrandEventType;
  title: string;
  descriptionTemplate: (locName: string, sects: string[]) => string;
  /** 生成涉及势力 */
  involvedSects: () => SectId[];
  /** 生成发生地点 */
  locationId: () => LocationId;
  choices: GrandEventChoice[];
  outcomes: Record<string, GrandEventOutcome>;
  /** 最小世界月数 */
  minMonth: number;
}

// ──── 辅助：随机选取 ────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function randomSectPair(): [SectId, SectId] {
  const all = Object.keys(SECTS).filter(s =>
    s !== 'none' && s !== 'imperial_court' && s !== 'rebels'
  ) as SectId[];
  const a = pick(all);
  let b = pick(all);
  while (b === a) b = pick(all);
  return [a, b];
}

function randomCity(): LocationId {
  const cities: LocationId[] = [
    'kaifeng_city', 'luoyang_city', 'changan_city', 'xiangyang_city',
    'yangzhou_city', 'suzhou_city', 'hangzhou_city', 'chengdu_city',
    'jiangling_city', 'dali_city',
  ];
  return pick(cities);
}

function randomSectBase(): LocationId {
  const bases: LocationId[] = [
    'wudang_mountain', 'shaolin_temple', 'emei_mountain', 'beggar_hq',
    'huashan_base', 'maoshan_daoyuan', 'kunlun_mountain',
    'qingcheng_mountain', 'tangmen_estate', 'xiaoyao_valley',
    'zhongnan_mountain', 'kongtong_mountain', 'diancang_mountain',
  ];
  return pick(bases);
}

// ──── 事件模板池 ────

const TEMPLATES: GrandEventTemplate[] = [
  // ══════ sect_war: 宗门大战 ══════
  {
    id: 'sect_war_01',
    type: 'sect_war',
    title: '宗门征伐',
    descriptionTemplate: (loc, sects) =>
      `${sects[0]}大军压境，兵临${loc}城下！${sects[1]}全派上下严阵以待，一场血战在所难免。江湖各方势力都在观望——此战将改写武林格局。`,
    involvedSects: () => {
      const [a, b] = randomSectPair();
      return [a, b];
    },
    locationId: () => randomSectBase(),
    choices: [
      { id: 'join_attacker', label: '加入攻方', risk: 'high' },
      { id: 'join_defender', label: '助守方一臂之力', risk: 'high' },
      { id: 'mediate', label: '居中调停', risk: 'medium', requirement: { minReputation: 30 } },
      { id: 'ignore', label: '两不相帮，静观其变', risk: 'low' },
    ],
    outcomes: {
      join_attacker: {
        description: '你率众杀入敌阵，攻方士气大振，一举破城！战后论功行赏，你分得丰厚战利。',
        rewards: { exp: 120, gold: 200, contribution: 30 },
        worldEffects: [
          { type: 'trust_change', target: '', value: 20, description: '攻方信任大幅提升' },
          { type: 'trust_change', target: '', value: -30, description: '守方视你为仇敌' },
        ],
      },
      join_defender: {
        description: '你挺身而出，死守城关。虽伤亡惨重，但终将敌军击退。守方上下对你感激不尽。',
        rewards: { exp: 100, gold: 150, contribution: 25 },
        worldEffects: [
          { type: 'trust_change', target: '', value: -20, description: '攻方对你怀恨在心' },
          { type: 'trust_change', target: '', value: 25, description: '守方感激你的援手' },
        ],
      },
      mediate: {
        description: '你奔走于两派之间，晓以利害。最终双方各退一步，签订城下之盟，避免了一场浩劫。',
        rewards: { exp: 60, gold: 80, contribution: 15 },
        worldEffects: [
          { type: 'trust_change', target: '', value: 10, description: '两派都欠你一个人情' },
          { type: 'reputation_change', target: '', value: 15, description: '江湖声望因调停而上升' },
        ],
      },
      ignore: {
        description: '大战持续三日，尸横遍野。最终攻方略占上风，但双方元气大伤。你虽未参与，却也从中窥见了乱世生存之道。',
        rewards: { exp: 20, gold: 30 },
        worldEffects: [
          { type: 'sect_state', target: '', value: -15, description: '交战双方元气大伤' },
        ],
      },
    },
    minMonth: 3,
  },
  {
    id: 'sect_war_02',
    type: 'sect_war',
    title: '围剿魔教',
    descriptionTemplate: (loc, sects) =>
      `正道联盟发出"除魔令"，号召天下正道共讨${sects[0]}。各派高手齐聚${loc}，誓要荡平邪魔外道。`,
    involvedSects: () => {
      const chaotic = (Object.keys(SECTS).filter(s => {
        const def = FACTION_DEFS[s as SectId];
        return s !== 'none' && def?.alignment === 'chaotic';
      }) as SectId[]);
      const righteous = (Object.keys(SECTS).filter(s => {
        const def = FACTION_DEFS[s as SectId];
        return s !== 'none' && def?.alignment === 'righteous';
      }) as SectId[]);
      return [pick(chaotic.length > 0 ? chaotic : ['demon' as SectId]), pick(righteous.length > 0 ? righteous : ['wudang' as SectId])];
    },
    locationId: () => randomSectBase(),
    choices: [
      { id: 'join_righteous', label: '加入正道联盟', risk: 'medium' },
      { id: 'warn_chaotic', label: '暗中通风报信', risk: 'high', requirement: { minReputation: 10 } },
      { id: 'loot_both', label: '趁乱渔利', risk: 'medium' },
      { id: 'ignore', label: '置身事外', risk: 'low' },
    ],
    outcomes: {
      join_righteous: {
        description: '你随正道联盟奋勇杀敌，魔教节节败退。经此一役，你在正道中声名鹊起。',
        rewards: { exp: 100, gold: 120, contribution: 25 },
        worldEffects: [
          { type: 'reputation_change', target: '', value: 20, description: '正道声望大幅提升' },
        ],
      },
      warn_chaotic: {
        description: '你暗中将消息传给魔教，魔教设下埋伏反杀正道联军。你获得了魔教的暗中感激——但此事若泄露，后果不堪设想。',
        rewards: { exp: 80, gold: 180 },
        worldEffects: [
          { type: 'trust_change', target: '', value: 30, description: '魔教欠你一个大人情' },
          { type: 'trust_change', target: '', value: -20, description: '正道有所察觉' },
        ],
      },
      loot_both: {
        description: '双方激战正酣，你趁乱搜刮战场，收获颇丰。虽不太光彩，但乱世之中活着才是硬道理。',
        rewards: { exp: 40, gold: 250 },
        worldEffects: [
          { type: 'reputation_change', target: '', value: -10, description: '渔翁得利，名声受损' },
        ],
      },
      ignore: {
        description: '正邪大战尘埃落定，各有损伤。江湖格局微调，但远未到天翻地覆的地步。',
        rewards: { exp: 15, gold: 20 },
        worldEffects: [],
      },
    },
    minMonth: 4,
  },

  // ══════ tournament: 论剑大会 ══════
  {
    id: 'tournament_01',
    type: 'tournament',
    title: '华山论剑',
    descriptionTemplate: (loc, _sects) =>
      `十年一届的武林盛会！天下高手云集${loc}，争夺"天下第一"的名号。各大门派纷纷派出最强弟子，这一战将名垂青史。`,
    involvedSects: () => Object.keys(SECTS).filter(s => s !== 'none').slice(0, 5) as SectId[],
    locationId: () => 'huashan_base' as LocationId,
    choices: [
      { id: 'compete', label: '登台比武，争夺名次', risk: 'high', requirement: { minLevel: 15 } },
      { id: 'watch', label: '台下观战，学习百家', risk: 'low' },
      { id: 'gamble', label: '开设赌局，押注胜负', risk: 'medium' },
      { id: 'network', label: '借机结交天下豪杰', risk: 'low' },
    ],
    outcomes: {
      compete: {
        description: '你连战三场，使尽平生所学。虽未夺魁，但已让天下英雄记住了你的名字。',
        rewards: { exp: 150, gold: 100, contribution: 40 },
        worldEffects: [
          { type: 'reputation_change', target: '', value: 30, description: '一战成名，天下皆知' },
        ],
      },
      watch: {
        description: '你在台下细细观摩，从各派高手的招式中领悟了不少武学至理。',
        rewards: { exp: 80, gold: 10 },
        worldEffects: [],
      },
      gamble: {
        description: '你精准预测数场胜负，赚得盆满钵满。几个输光的赌徒对你怒目而视，但也无可奈何。',
        rewards: { exp: 20, gold: 300 },
        worldEffects: [
          { type: 'reputation_change', target: '', value: -5, description: '商人重利，侠名有损' },
        ],
      },
      network: {
        description: '你周旋于各派高手之间，推杯换盏，结下了不少善缘。日后行走江湖，多条路总是好的。',
        rewards: { exp: 30, gold: 40 },
        worldEffects: [
          { type: 'trust_change', target: '', value: 5, description: '与各派关系略有改善' },
        ],
      },
    },
    minMonth: 6,
  },
  {
    id: 'tournament_02',
    type: 'tournament',
    title: '武林大会',
    descriptionTemplate: (loc, _sects) =>
      `${loc}举办武林大会，推选新一任武林盟主。各派掌门携弟子齐聚，暗流涌动——这不仅是比武，更是权力的博弈。`,
    involvedSects: () => Object.keys(SECTS).filter(s => s !== 'none').slice(0, 6) as SectId[],
    locationId: () => pick(['kaifeng_city', 'luoyang_city', 'changan_city'] as LocationId[]),
    choices: [
      { id: 'run', label: '参选盟主，挑战群雄', risk: 'high', requirement: { minLevel: 20, minReputation: 50 } },
      { id: 'support_ally', label: '支持友好门派候选人', risk: 'medium' },
      { id: 'observe', label: '静观其变', risk: 'low' },
    ],
    outcomes: {
      run: {
        description: '你连败数位高手，技惊四座！虽然最终盟主之位落于他人，但你的表现已令各派掌门刮目相看。',
        rewards: { exp: 130, gold: 80, contribution: 35 },
        worldEffects: [
          { type: 'reputation_change', target: '', value: 40, description: '名动江湖' },
        ],
      },
      support_ally: {
        description: '你为盟友摇旗呐喊，助力其登上盟主之位。新盟主对你心存感激，日后必有回报。',
        rewards: { exp: 40, gold: 50, contribution: 20 },
        worldEffects: [
          { type: 'trust_change', target: '', value: 20, description: '新盟主视你为心腹' },
        ],
      },
      observe: {
        description: '盟主之争尘埃落定，江湖格局略变。你虽未参与，但对各派实力消长有了更清晰的认识。',
        rewards: { exp: 30, gold: 20 },
        worldEffects: [],
      },
    },
    minMonth: 8,
  },

  // ══════ treasure_hunt: 秘宝出世 ══════
  {
    id: 'treasure_01',
    type: 'treasure_hunt',
    title: '前朝密藏',
    descriptionTemplate: (loc, _sects) =>
      `${loc}郊外一处山崖崩塌，露出隐藏百年的前朝宝库入口。内中传闻藏有失传武学秘籍和无数金银。各方势力闻风而动，一场夺宝之战即将上演。`,
    involvedSects: () => {
      const [a, b] = randomSectPair();
      return [a, b];
    },
    locationId: () => randomCity(),
    choices: [
      { id: 'rush', label: '抢先入洞，夺取至宝', risk: 'high' },
      { id: 'team_up', label: '与一方联手探宝', risk: 'medium' },
      { id: 'wait', label: '守在洞口，坐收渔利', risk: 'medium' },
      { id: 'ignore', label: '宝藏虽好，性命更贵', risk: 'low' },
    ],
    outcomes: {
      rush: {
        description: '你凭借轻功抢先入洞，一路破关斩将，夺得一本泛黄的古籍。虽未带走金银，但这本秘籍的价值远胜万金！',
        rewards: { exp: 100, gold: 300 },
        worldEffects: [
          { type: 'reputation_change', target: '', value: 15, description: '夺宝勇士' },
        ],
      },
      team_up: {
        description: '你们联手破开机关，平分收获。虽不如独吞丰厚，但胜在稳妥。合作方也对你多了几分信任。',
        rewards: { exp: 60, gold: 180, contribution: 15 },
        worldEffects: [
          { type: 'trust_change', target: '', value: 15, description: '合作方信任增加' },
        ],
      },
      wait: {
        description: '先入洞者伤痕累累地出来，你以逸待劳，轻松截获了大半宝物。虽然手段不太光明，但——效果好极了。',
        rewards: { exp: 30, gold: 250 },
        worldEffects: [
          { type: 'reputation_change', target: '', value: -10, description: '趁火打劫，名声不佳' },
        ],
      },
      ignore: {
        description: '宝库内的机关夺走了数位高手的性命。你庆幸自己没掺和这趟浑水。',
        rewards: { exp: 5, gold: 10 },
        worldEffects: [],
      },
    },
    minMonth: 3,
  },
  {
    id: 'treasure_02',
    type: 'treasure_hunt',
    title: '天降神兵',
    descriptionTemplate: (loc, _sects) =>
      `${loc}城外的陨坑中发现了一块天外玄铁，据铸剑名匠所言，此铁可炼成绝世神兵。消息传出，各派高手蜂拥而至。`,
    involvedSects: () => {
      const [a, b] = randomSectPair();
      return [a, b];
    },
    locationId: () => randomCity(),
    choices: [
      { id: 'fight', label: '力压群雄，夺取玄铁', risk: 'high', requirement: { minLevel: 12 } },
      { id: 'buy', label: '出高价购买', risk: 'low' },
      { id: 'steal', label: '深夜潜入，盗取玄铁', risk: 'medium' },
      { id: 'ignore', label: '神兵虽好，非吾所求', risk: 'low' },
    ],
    outcomes: {
      fight: {
        description: '你连败数位争夺者，以实力赢得了玄铁的所有权。铸成的神兵将成为你日后行走江湖的最大依仗。',
        rewards: { exp: 80, gold: 50 },
        worldEffects: [
          { type: 'reputation_change', target: '', value: 20, description: '以武夺宝，名震一方' },
        ],
      },
      buy: {
        description: '你一掷千金，以高价买下玄铁。周围人议论纷纷，有人说你是冤大头，但你知道——能用钱解决的事，都不叫事。',
        rewards: { exp: 10, gold: -200 },
        worldEffects: [
          { type: 'trust_change', target: '', value: 5, description: '商贾对你另眼相看' },
        ],
      },
      steal: {
        description: '月黑风高，你施展轻功潜入，成功盗走玄铁。次日全城哗然，但无人知晓是你所为。',
        rewards: { exp: 40, gold: 100 },
        worldEffects: [
          { type: 'reputation_change', target: '', value: -5, description: '若被发现，后果严重' },
        ],
      },
      ignore: {
        description: '争夺玄铁的各方大打出手，最终两败俱伤。玄铁被朝廷收缴，谁也没得到。',
        rewards: { exp: 5, gold: 5 },
        worldEffects: [],
      },
    },
    minMonth: 4,
  },

  // ══════ monster_invasion: 妖兽潮 ══════
  {
    id: 'monster_01',
    type: 'monster_invasion',
    title: '妖兽围城',
    descriptionTemplate: (loc, _sects) =>
      `${loc}城外山林中妖兽暴动，数千妖兽如潮水般涌向城池！城墙上的守军面如土色——若无人出手，此城危在旦夕。`,
    involvedSects: () => [],
    locationId: () => randomCity(),
    choices: [
      { id: 'lead_defense', label: '率众守城，血战妖兽', risk: 'high', requirement: { minLevel: 10 } },
      { id: 'evacuate', label: '组织百姓撤离', risk: 'medium' },
      { id: 'assassinate_king', label: '深入兽巢，斩杀兽王', risk: 'high', requirement: { minLevel: 18 } },
      { id: 'flee', label: '事不关己，速速离开', risk: 'low' },
    ],
    outcomes: {
      lead_defense: {
        description: '你站在城头，浴血奋战至天明。妖兽终于退去，城中百姓将你视为救星。',
        rewards: { exp: 140, gold: 120, contribution: 30 },
        worldEffects: [
          { type: 'reputation_change', target: '', value: 25, description: '救城英雄' },
        ],
      },
      evacuate: {
        description: '你组织百姓有序撤离，虽然城池受损，但人命保住了。官府和百姓都对你感激涕零。',
        rewards: { exp: 60, gold: 60, contribution: 20 },
        worldEffects: [
          { type: 'reputation_change', target: '', value: 20, description: '百姓感恩戴德' },
          { type: 'prosperity_change', target: '', value: -10, description: '城池受损' },
        ],
      },
      assassinate_king: {
        description: '你孤身潜入兽巢，与兽王大战三百回合，终将其斩于剑下。妖兽群龙无首，四散奔逃。这一战，堪称传奇。',
        rewards: { exp: 200, gold: 200, contribution: 40 },
        worldEffects: [
          { type: 'reputation_change', target: '', value: 35, description: '屠兽英雄，天下传颂' },
        ],
      },
      flee: {
        description: '妖兽破城而入，死伤无数。你虽保全了性命，但目睹满目疮痍，心中不免愧疚。',
        rewards: { exp: 5, gold: 0 },
        worldEffects: [
          { type: 'prosperity_change', target: '', value: -20, description: '城池被毁' },
          { type: 'reputation_change', target: '', value: -10, description: '见死不救，为人不齿' },
        ],
      },
    },
    minMonth: 5,
  },

  // ══════ rebel_uprising: 叛军举事 ══════
  {
    id: 'rebel_01',
    type: 'rebel_uprising',
    title: '前朝举义',
    descriptionTemplate: (loc, _sects) =>
      `叛军首领赵沁微在${loc}举起义旗，号召天下豪杰共襄盛举，推翻暴政，光复前朝！官府调集大军围剿，一场关乎天下归属的大战即将爆发。`,
    involvedSects: () => ['rebels', 'imperial_court'] as SectId[],
    locationId: () => pick(['yanjing_city', 'luoyang_city', 'xiangyang_city'] as LocationId[]),
    choices: [
      { id: 'join_rebels', label: '加入叛军，共谋大业', risk: 'high' },
      { id: 'join_court', label: '效忠朝廷，剿灭叛贼', risk: 'high' },
      { id: 'spy', label: '假意投靠一方，实则刺探情报', risk: 'medium' },
      { id: 'ignore', label: '天下兴亡，与我何干', risk: 'low' },
    ],
    outcomes: {
      join_rebels: {
        description: '你加入叛军，在战场上屡立战功。赵沁微亲自为你斟酒，称你为"复国栋梁"。',
        rewards: { exp: 110, gold: 130, contribution: 30 },
        worldEffects: [
          { type: 'trust_change', target: 'rebels', value: 30, description: '叛军视你为心腹' },
          { type: 'trust_change', target: 'imperial_court', value: -40, description: '朝廷将你列为要犯' },
        ],
      },
      join_court: {
        description: '你率官兵连破叛军数阵，朝廷龙颜大悦，赏赐丰厚。你在官场的地位水涨船高。',
        rewards: { exp: 100, gold: 200, contribution: 25 },
        worldEffects: [
          { type: 'trust_change', target: 'imperial_court', value: 30, description: '朝廷嘉奖' },
          { type: 'trust_change', target: 'rebels', value: -40, description: '叛军视你为仇敌' },
        ],
      },
      spy: {
        description: '你周旋于两方之间，获取了大量机密情报。这些情报价值连城——至于卖给谁，就看谁出价高了。',
        rewards: { exp: 50, gold: 250 },
        worldEffects: [
          { type: 'reputation_change', target: '', value: -5, description: '双面间谍，名声微妙' },
        ],
      },
      ignore: {
        description: '战火蔓延数州，百姓流离失所。你虽未参与，但乱世之中独善其身也非易事。',
        rewards: { exp: 10, gold: 15 },
        worldEffects: [
          { type: 'prosperity_change', target: '', value: -5, description: '战乱导致民生凋敝' },
        ],
      },
    },
    minMonth: 5,
  },

  // ══════ court_decree: 朝廷诏令 ══════
  {
    id: 'court_01',
    type: 'court_decree',
    title: '朝廷诏令',
    descriptionTemplate: (loc, _sects) =>
      `朝廷颁布诏令，要求天下宗门登记造册，接受官府管辖。各派反应不一——有人俯首听命，有人怒斥暴政。${loc}已为此事争论不休。`,
    involvedSects: () => ['imperial_court'] as SectId[],
    locationId: () => randomCity(),
    choices: [
      { id: 'accept', label: '接受诏令，归顺朝廷', risk: 'medium' },
      { id: 'reject', label: '拒绝诏令，捍卫江湖自由', risk: 'medium' },
      { id: 'negotiate', label: '上书陈情，争取折衷', risk: 'low', requirement: { minReputation: 20 } },
      { id: 'ignore', label: '不置可否，拖延观望', risk: 'low' },
    ],
    outcomes: {
      accept: {
        description: '你率先响应诏令，朝廷大加赞赏。虽然江湖中人颇有微词，但背靠大树好乘凉。',
        rewards: { exp: 30, gold: 150, contribution: 20 },
        worldEffects: [
          { type: 'trust_change', target: 'imperial_court', value: 25, description: '朝廷嘉许' },
          { type: 'reputation_change', target: '', value: -15, description: '江湖中人视为朝廷走狗' },
        ],
      },
      reject: {
        description: '你公开抵制诏令，赢得江湖同道的喝彩。但也因此上了官府的黑名单。',
        rewards: { exp: 40, gold: 30 },
        worldEffects: [
          { type: 'trust_change', target: 'imperial_court', value: -25, description: '触怒朝廷' },
          { type: 'reputation_change', target: '', value: 20, description: '江湖中人敬你三分' },
        ],
      },
      negotiate: {
        description: '你撰写的陈情表言辞恳切、情理兼备。朝廷最终做出让步，江湖得以保留自治之权。你被誉为"儒侠"。',
        rewards: { exp: 60, gold: 80, contribution: 20 },
        worldEffects: [
          { type: 'reputation_change', target: '', value: 25, description: '儒侠之名传天下' },
          { type: 'trust_change', target: 'imperial_court', value: 10, description: '朝廷敬你三分' },
        ],
      },
      ignore: {
        description: '诏令风波渐渐平息，朝廷雷声大雨点小，江湖依旧我行我素。',
        rewards: { exp: 5, gold: 10 },
        worldEffects: [],
      },
    },
    minMonth: 4,
  },

  // ══════ alliance_summit: 武林会盟 ══════
  {
    id: 'alliance_01',
    type: 'alliance_summit',
    title: '武林会盟',
    descriptionTemplate: (loc, _sects) =>
      `各派掌门齐聚${loc}，商议结盟对抗日益膨胀的大势力。合纵连横，远交近攻——这将是一场没有硝烟的战争。`,
    involvedSects: () => Object.keys(SECTS).filter(s => s !== 'none').slice(0, 4) as SectId[],
    locationId: () => pick(['kaifeng_city', 'luoyang_city', 'xiangyang_city'] as LocationId[]),
    choices: [
      { id: 'lead_alliance', label: '提议组建联盟', risk: 'medium', requirement: { minReputation: 40 } },
      { id: 'join_alliance', label: '加入一方联盟', risk: 'low' },
      { id: 'sow_discord', label: '挑拨离间，破坏盟约', risk: 'medium' },
      { id: 'ignore', label: '冷眼旁观', risk: 'low' },
    ],
    outcomes: {
      lead_alliance: {
        description: '你登高一呼，应者云集！在你的斡旋下，数派结成联盟，而你被推举为盟主。号令一出，莫敢不从！',
        rewards: { exp: 90, gold: 80, contribution: 40 },
        worldEffects: [
          { type: 'reputation_change', target: '', value: 30, description: '盟主之威，号令江湖' },
          { type: 'trust_change', target: '', value: 15, description: '盟约成员信任增加' },
        ],
      },
      join_alliance: {
        description: '你选择加入一方联盟，获得了盟友的庇护和资源共享。在这个弱肉强食的世界，抱团取暖是明智之举。',
        rewards: { exp: 30, gold: 60, contribution: 15 },
        worldEffects: [
          { type: 'trust_change', target: '', value: 10, description: '盟友关系改善' },
        ],
      },
      sow_discord: {
        description: '你暗中散布流言，挑拨联盟各方关系。盟约尚未签署便已分崩离析。混乱之中，你趁势扩张了自身影响力。',
        rewards: { exp: 40, gold: 120 },
        worldEffects: [
          { type: 'trust_change', target: '', value: -15, description: '各方猜忌加深' },
          { type: 'reputation_change', target: '', value: -10, description: '暗中挑拨，为人不齿' },
        ],
      },
      ignore: {
        description: '联盟最终以微弱多数通过，但各方貌合神离。你冷眼旁观，对江湖的权力游戏有了更深的理解。',
        rewards: { exp: 15, gold: 15 },
        worldEffects: [],
      },
    },
    minMonth: 6,
  },
];

// ──── 运行时状态 ────

let _currentEvent: GrandEvent | null = null;
let _pendingResolve: ((result: GrandEventResult) => void) | null = null;

// ──── 触发逻辑 ────

/**
 * 每月初调用：尝试触发江湖大事件。
 * 返回 GrandEvent 或 null。
 *
 * 概率：基准 25%/月，受世界紧张度影响。
 * 冷却期内不会触发。
 */
export function tryTriggerGrandEvent(): GrandEvent | null {
  const p = getPlayer();
  const month = p.gameMonth ?? 1;
  const cooldown = p.grandEventCooldown ?? 0;

  // 冷却检查（至少间隔 3 个月）
  if (cooldown > month) return null;

  // 基准概率 25%
  const tensionBonus = computeWorldTension() * 0.15;
  const prob = 0.25 + Math.min(tensionBonus, 0.30);

  if (Math.random() > prob) return null;

  // 筛选可用模板
  const candidates = TEMPLATES.filter(t => month >= t.minMonth);
  if (candidates.length === 0) return null;

  const tpl = pick(candidates);
  const locId = tpl.locationId();
  const locData = WORLD_MAP[locId];
  const locName = locData?.name ?? locId;
  const sects = tpl.involvedSects();
  const sectNames = sects.map(s => SECTS[s]?.name ?? s);

  const event: GrandEvent = {
    id: `${tpl.id}_${month}`,
    type: tpl.type,
    title: tpl.title,
    description: tpl.descriptionTemplate(locName, sectNames),
    locationId: locId,
    locationName: locName,
    involvedSects: sects,
    choices: tpl.choices,
    outcomes: tpl.outcomes,
  };

  // 设置冷却
  setPlayer({ ...getPlayer(), grandEventCooldown: month + 3 + Math.floor(Math.random() * 3) });

  return event;
}

/**
 * 获取当前待处理的江湖大事件。
 */
export function getCurrentEvent(): GrandEvent | null {
  return _currentEvent;
}

/**
 * 设置当前事件并返回 Promise，等待玩家做出选择。
 */
export function presentGrandEvent(event: GrandEvent): Promise<GrandEventResult> {
  _currentEvent = event;
  return new Promise(resolve => {
    _pendingResolve = resolve;
  });
}

/**
 * 玩家做出选择后调用。
 * 解析事件结果，应用世界影响和奖励。
 */
export function resolveGrandEvent(choiceId: string): GrandEventResult | null {
  const event = _currentEvent;
  if (!event) return null;

  const outcome = event.outcomes[choiceId];
  if (!outcome) return null;

  const p = getPlayer();

  // 应用奖励
  const updates: Record<string, unknown> = {
    exp: (p.exp ?? 0) + outcome.rewards.exp,
    gold: (p.gold ?? 0) + outcome.rewards.gold,
  };
  if (outcome.rewards.contribution !== undefined) {
    updates.sectContribution = (p.sectContribution ?? 0) + outcome.rewards.contribution;
  }

  setPlayer({ ...p, ...updates });

  // 应用世界影响
  applyWorldEffects(event, choiceId, outcome);

  // 记录历史
  const history = p.grandEventHistory ?? [];
  history.push({ eventId: event.id, choice: choiceId, month: p.gameMonth ?? 1 });
  setPlayer({ ...getPlayer(), grandEventHistory: history });

  // 生成江湖传闻
  const newsItem = {
    text: `【${event.title}】${outcome.description}`,
    turn: p.gameMonth ?? 1,
    leftTime: 5,
  };
  const currentNews = getPlayer().worldNews ?? [];
  const updatedNews = [newsItem, ...currentNews].slice(0, 10);
  setPlayer({ ...getPlayer(), worldNews: updatedNews });

  // 添加编年史条目
  addChronicleEntry({
    category: 'grand_event',
    title: event.title,
    description: outcome.description,
    locationId: event.locationId,
    relatedSect: event.involvedSects[0],
  });

  const result: GrandEventResult = {
    eventId: event.id,
    choiceId,
    outcome,
    playerParticipated: choiceId !== 'ignore' && choiceId !== 'flee' && choiceId !== 'observe',
  };

  // 清理
  _currentEvent = null;
  if (_pendingResolve) {
    _pendingResolve(result);
    _pendingResolve = null;
  }

  return result;
}

// ──── 世界影响应用 ────

function applyWorldEffects(event: GrandEvent, choiceId: string, outcome: GrandEventOutcome): void {
  const p = getPlayer();
  const attacker = event.involvedSects[0];
  const defender = event.involvedSects[1];

  for (const effect of outcome.worldEffects) {
    switch (effect.type) {
      case 'trust_change': {
        const target = (effect.target || (choiceId.includes('attacker') || choiceId.includes('righteous') ? attacker : defender)) as SectId;
        if (target && target !== 'none' && target) {
          const playerSect = (getPlayer().sect ?? 'none') as SectId;
          const rel = getFactionRelation(playerSect, target);
          const newTrust = Math.max(0, Math.min(100, (rel?.trust ?? 50) + effect.value));
          const relations = { ...(p.factionRelations ?? {}) };
          const playerRels = { ...(relations[playerSect] ?? {}) };
          playerRels[target] = {
            ...(playerRels[target] ?? { relation: 'neutral', trust: 50 }),
            trust: newTrust,
            lastEvent: effect.description,
            lastEventTurn: p.gameMonth ?? 1,
          };
          relations[playerSect] = playerRels;
          setPlayer({ ...getPlayer(), factionRelations: relations });
        }
        break;
      }
      case 'reputation_change': {
        const newRep = Math.max(0, (p.reputation ?? 0) + effect.value);
        setPlayer({ ...getPlayer(), reputation: newRep });
        break;
      }
      case 'prosperity_change': {
        const locId = event.locationId;
        const cp = { ...(p.cityProsperity ?? {}) };
        const old = cp[locId] ?? 50;
        cp[locId] = Math.max(0, Math.min(100, old + effect.value));
        setPlayer({ ...getPlayer(), cityProsperity: cp });
        break;
      }
      case 'sect_state': {
        // 影响交战双方的稳定度
        for (const sid of [attacker, defender]) {
          if (sid && sid !== 'none') {
            const st = getSectState(sid);
            if (st) {
              updateSectState(sid, { stability: effect.value });
            }
          }
        }
        break;
      }
    }
  }
}

// ──── 世界紧张度 ────

function computeWorldTension(): number {
  const p = getPlayer();
  const relations = p.factionRelations ?? {};
  let warCount = 0;
  let lowTrustCount = 0;

  for (const [_fid, rels] of Object.entries(relations)) {
    for (const [_tid, data] of Object.entries(rels as Record<string, { relation?: string; trust?: number }>)) {
      if (data.relation === 'at_war') warCount++;
      if ((data.trust ?? 50) < 20) lowTrustCount++;
    }
  }

  return Math.min(1, (warCount * 0.2 + lowTrustCount * 0.05));
}

// ──── 检查玩家是否满足选项要求 ────

export function checkChoiceRequirement(choice: GrandEventChoice): { valid: boolean; reason?: string } {
  const p = getPlayer();

  if (choice.requirement?.minLevel && (p.level ?? 1) < choice.requirement.minLevel) {
    return { valid: false, reason: `需要修为等级 ${choice.requirement.minLevel}` };
  }
  if (choice.requirement?.minReputation && (p.reputation ?? 0) < choice.requirement.minReputation) {
    return { valid: false, reason: `需要声望 ${choice.requirement.minReputation}` };
  }
  if (choice.requirement?.sectRelation) {
    const { faction, minTrust } = choice.requirement.sectRelation;
    const trust = getFactionTrust(faction, p.sect as SectId);
    if (trust < minTrust) {
      return { valid: false, reason: `与${SECTS[faction]?.name ?? faction}关系不足` };
    }
  }
  return { valid: true };
}
