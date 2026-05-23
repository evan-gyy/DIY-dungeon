/**
 * src/systems/NPCInteraction.ts — NPC 互动系统（鬼谷八荒风格）
 *
 * 六种 NPC 性格 × 势力倾向匹配 = 复合交互倍率
 * 三种互动方式：交谈 / 送礼 / 切磋
 * 对话池按 好感度层级 × 性格 产出不同叙事文本
 * NPC 之间的自主互动逻辑在 NpcBehavior.ts 中
 */

import { getPlayer, setPlayer } from '../state/GameState';
import { saveGame } from '../state/SaveSystem';
import { getNpcStats, appendNpcLog } from './NpcBehavior';
import { changeNpcAffection, getNpcAffection } from '../screens/camp/RelationPanel';
import { SECTS } from '../data/sects';
import type { FactionAlignment } from '../data/sandboxTypes';
import type { NpcStats, NpcPersonality, PersonalityConfig } from '../data/npcStats';
import { PERSONALITY } from '../data/npcStats';
import { getPlayerNpcRelations, hasPlayerNpcRelation } from './NpcRelationship';
import type { PlayerNpcRelation } from '../data/types';
import { WORLD_MAP } from '../data/worldMap';
import type { LocationId } from '../data/worldMap';

// ═════════════════════════════════════════════════════════
//  好感度层级
// ═════════════════════════════════════════════════════════

type AffectionTierKey = 'cold' | 'neutral' | 'warm' | 'close' | 'intimate';

function getAffectionTierKey(aff: number): AffectionTierKey {
  if (aff < 10) return 'cold';
  if (aff < 30) return 'neutral';
  if (aff < 60) return 'warm';
  if (aff < 80) return 'close';
  return 'intimate';
}

// ═════════════════════════════════════════════════════════
//  交谈对话池
//  每性格 × 5 好感层级 × 2~3 条对话
// ═════════════════════════════════════════════════════════

type TalkPool = Record<NpcPersonality, Record<AffectionTierKey, string[]>>;

const TALK_DIALOGUES: TalkPool = {
  aloof: {
    cold: [
      '（冷冷扫了你一眼，并未开口）',
      '（微微蹙眉）……有事？',
      '（沉默良久）没什么好说的。',
    ],
    neutral: [
      '（略略点头）嗯。',
      '（目光望着远方）江湖上近来不太平。',
      '（淡淡开口）你倒是有闲心。',
    ],
    warm: [
      '（嘴角微微上扬，语气依旧清冷）你来了。',
      '（轻哼一声）还算有点意思。',
      '（抱着剑靠在墙边，眼神却柔和了些）说吧，什么事。',
    ],
    close: [
      '（难得露出一丝笑意）也就你还会常来找我说话。',
      '（递过一壶酒）喝吧，不醉不归。',
      '（低声）江湖虽大，也就你懂我几分。',
    ],
    intimate: [
      '（目光深邃）这些年……多谢你一直在。',
      '（罕见地笑了）从小到大，还没有人像你这样缠着我不放。',
      '（轻轻叹了口气，语气却是温暖的）你来了便好。',
    ],
  },
  kind: {
    cold: [
      '（微笑）阁下有心了。江湖险恶，多保重。',
      '（温和地看着你）初次见面，请多指教。',
      '（点头致意）阿弥陀佛…啊不，幸会幸会。',
    ],
    neutral: [
      '（温和一笑）今日风轻云淡，正是练剑的好天气。',
      '（递过一杯茶）来，喝杯热茶暖暖身子。',
      '（关切地问）近日修行可还顺利？',
    ],
    warm: [
      '（眼中含笑）你来啦……昨日听人提起一桩趣事，说与你听。',
      '（轻轻摇头）你这般修行，太拼命了，要注意休息。',
      '（从袖中摸出一颗丹药）这个你拿着，以备不时之需。',
    ],
    close: [
      '（轻轻拍了拍你的肩）有什么烦心事，尽管说与我听。',
      '（微笑）我最近新悟了一式剑招，要不要过两招？',
      '（低声道）这世上能让我牵挂的人不多，你算一个。',
    ],
    intimate: [
      '（凝视着你）遇见你，是我此生最大的福分。',
      '（眼眶微红）不管前路如何，我都会陪在你身边。',
      '（握紧你的手）从今往后，风雨同舟。',
    ],
  },
  cunning: {
    cold: [
      '（眼珠转了转，似在打量你）啧啧……',
      '（笑嘻嘻地）这位少侠看着面生啊。',
      '（凑近小声道）有什么好买卖，介绍介绍？',
    ],
    neutral: [
      '（笑吟吟地）江湖上最近可热闹了，想听听吗？',
      '（眯起眼睛）这世道……富贵险中求啊。',
      '（把玩着手中铜钱）无事不登三宝殿，说吧。',
    ],
    warm: [
      '（嘿嘿一笑）我就知道你会来找我。',
      '（左右看了看，压低声音）上次那件事……我帮你打听清楚了。',
      '（翘着二郎腿）来来来，我这儿有个内幕消息……',
    ],
    close: [
      '（收起嬉笑）说真的，你是我见过最有趣的人。',
      '（难得正经了一回）江湖上真能信得过的，也就你。',
      '（递过一张密函）这是我从暗市搞来的情报，别告诉别人。',
    ],
    intimate: [
      '（难得地沉默了许久）……我这样的人，也配有你做朋友？',
      '（大笑）你这傻子，全江湖就你还信我。',
      '（正色道）我的命是你救的，今后赴汤蹈火也在所不辞。',
    ],
  },
  upright: {
    cold: [
      '（腰板笔直，神色严肃）来者何人？',
      '（正色道）江湖中人，当以侠义为先。',
      '（略一抱拳）阁下请讲。',
    ],
    neutral: [
      '（抱拳还礼）少侠有礼了。',
      '（正襟危坐）今日无事，不妨一叙。',
      '（沉声道）习武之人，首重心性。切记切记。',
    ],
    warm: [
      '（露出欣赏之色）你的剑法进步很快。',
      '（拍案而起）痛快！与你说话，如饮烈酒！',
      '（正色）世间有不平事，你我当携手共平之。',
    ],
    close: [
      '（郑重点头）你心思纯正，我信得过你。',
      '（难得的笑容）与你并肩战斗之时，我便知此生了无遗憾。',
      '（低声道）将来江湖若有难，我第一个站你这边。',
    ],
    intimate: [
      '（双手紧握剑柄）从今往后，我的剑就是你的剑。',
      '（目光如炬）你我肝胆相照，生死与共！',
      '（长叹一声）人生得一知己，死而无憾。',
    ],
  },
  gentle: {
    cold: [
      '（轻声）初次见面，请多关照。',
      '（微微欠身）公子/姑娘有礼了。',
      '（温声细语）有什么我能帮忙的吗？',
    ],
    neutral: [
      '（微笑）这山间的风真舒服，你也这样觉得吗？',
      '（煮了一壶茶）来，坐下慢慢聊。',
      '（轻声吟道）青山不墨千秋画……',
    ],
    warm: [
      '（眼中闪着温柔的光）你每次来，我都觉得今日格外明亮。',
      '（将一束野花轻轻放在桌边）路上采的，送你。',
      '（浅笑着摇头）你还是这般冒冒失失的……',
    ],
    close: [
      '（轻轻靠在你肩上，沉默良久）这样就好。',
      '（柔声）江湖路远，你我同行便好。',
      '（低声哼着不知名的山歌，悠扬婉转）',
    ],
    intimate: [
      '（泪眼婆娑）我一直以为……我会孤独一生。',
      '（握住你的手，指尖微微颤抖）别走太远，我会担心。',
      '（靠在你耳边轻声道）此生愿与你共白首。',
    ],
  },
  bold: {
    cold: [
      '（大声）嘿！新来的？来喝一杯！',
      '（大大咧咧地）江湖儿女，不拘小节！',
      '（拍案）好汉！报上名来！',
    ],
    neutral: [
      '（哈哈大笑）痛快！今天又遇到个有意思的人！',
      '（递过酒壶）来来来，喝了这壶，我们就是朋友！',
      '（手舞足蹈）我刚才在城外遇到了件趣事……',
    ],
    warm: [
      '（一把搂住你肩膀）好兄弟/好姐妹！今天想聊什么？',
      '（咕咚灌了一口酒）这江湖啊，就得快意恩仇！',
      '（拍着桌子大笑）你是不知道，上次那只老虎……',
    ],
    close: [
      '（一拳锤在你胸口，力气却放得很轻）你这家伙总算来了！',
      '（收起玩笑之色）说真的，有大事的时候我只信你。',
      '（仰头饮尽碗中酒）人生得意须尽欢，干！',
    ],
    intimate: [
      '（眼眶微红，声音沙哑）我走南闯北这么多年……就你不一样。',
      '（重重拍案）以后谁敢欺负你，老子第一个不放过他！',
      '（酒后吐真言）其实……我挺怕你出事的。',
    ],
  },
};

// ═════════════════════════════════════════════════════════
//  送礼反应文本
// ═════════════════════════════════════════════════════════

type GiftPool = Record<NpcPersonality, Record<AffectionTierKey, string[]>>;

const GIFT_REACTIONS: GiftPool = {
  aloof: {
    cold:    ['冷冷瞥了一眼，并未伸手去接。', '微微皱眉：「不必这样。」', '淡淡道：「……放下吧。」'],
    neutral: ['看了礼物一眼，微微颔首。', '轻轻「嗯」了一声，算是收下。', '眼角似有一丝波动。'],
    warm:    ['嘴角微不可察地上扬了一下。', '低声道：「……费心了。」', '抱着礼物沉默良久，转身离去。'],
    close:   ['难得露出一丝微笑：「你倒是有心。」', '眼中闪过暖意：「记住我喜好的人不多。」', '轻声道：「多谢。」'],
    intimate:['喉结滚动了一下：「你送的……我都会收好。」', '眼眶微红：「这么多年，你是第一个。」', '沉默许久，轻轻握住了你的手。'],
  },
  kind: {
    cold:    ['微笑着双手接过：「破费了。」', '温和道：「阁下太客气了。」', '轻轻点头：「多谢美意。」'],
    neutral: ['眼中闪着喜悦的光：「哎呀，这怎么好意思。」', '双手合十：「善哉善哉，多谢施主。」', '开心地笑了：「多谢厚爱。」'],
    warm:    ['惊喜道：「你怎知我喜欢这个！」', '感动地握在手中：「每次见面都让你破费……」', '将礼物小心收好：「我会好好珍藏的。」'],
    close:   ['眼眶微湿：「你待我真好……」', '轻轻拥抱了你一下：「谢谢你。」', '笑着摇头：「你呀，每次都这么用心。」'],
    intimate:['泪水在眼眶打转：「这是我收到过最好的礼物。」', '将礼物贴在胸口：「你的心意……我都懂。」', '紧紧抱住你：「礼物不重要，你才重要。」'],
  },
  cunning: {
    cold:    ['挑了挑眉：「哟，还挺大方。」', '掂了掂礼物：「还行吧。」', '似笑非笑：「……有什么目的？」'],
    neutral: ['眼睛一亮：「好东西！哪来的？」', '嘿嘿一笑：「那我就不客气了。」', '把玩着礼物：「行啊，挺会挑。」'],
    warm:    ['眯着眼睛笑得像只狐狸：「嘿嘿……有心了。」', '凑近道：「这么大方，是不是有求于我？」', '快速收下：「好说好说，以后有消息第一个告诉你。」'],
    close:   ['愣了一下：「……你还真舍得啊。」', '难得认真：「我不会白收的，回头帮你搞个大情报。」', '竖起大拇指：「够意思！」'],
    intimate:['沉默了很久：「从小到大，没人送过我东西。」', '笑得比往常更灿烂，眼角却有泪光：「傻子。」', '低声道：「我欠你的，这辈子慢慢还。」'],
  },
  upright: {
    cold:    ['正色道：「无功不受禄。」', '推辞了一番才收下：「好吧，多谢。」', '抱拳：「阁下不必如此客气。」'],
    neutral: ['郑重收下：「此情此义，必当铭记。」', '点头道：「多谢少侠。」', '拱手：「在下定不负这番心意。」'],
    warm:    ['肃然道：「你这般费心，我却无以为报。」', '用力拍了拍你的肩：「好兄弟/好姐妹！」', '正色收下礼物，眼中却满是笑意。'],
    close:   ['握紧拳头：「你这是……何苦破费。」', '郑重道：「此后江湖风雨，我替你挡。」', '将礼物擦拭干净妥善收好：「此物，我不会让任何人碰。」'],
    intimate:['长叹一声：「我这一生最幸运的事，就是认识了你。」', '抱拳鞠躬：「此生不负。」', '目光灼灼：「士为知己者死。」'],
  },
  gentle: {
    cold:    ['脸颊微红：「这……怎么好意思。」', '轻声细语：「多谢了。」', '双手接过，小心翼翼：「谢谢。」'],
    neutral: ['微微一笑：「辛苦了，很美的礼物。」', '轻声道：「这份心意我收下了。」', '将礼物摆在案头：「看到它就会想起你。」'],
    warm:    ['眼眶微红：「你总是这样体贴……」', '轻轻抚过礼物：「我能为你做些什么吗？」', '低头浅笑：「谢谢，我很欢喜。」'],
    close:   ['双手紧握礼物，声音微颤：「你……你记得我的喜好？」', '靠在你肩头轻声道：「有你在，真好。」', '悄悄擦去眼角的泪：「这世上就你对我最好。」'],
    intimate:['泪如雨下：「我等这一天等了多久……」', '将礼物轻放在心口：「我会一辈子带着它。」', '抬头望你，目光如水：「除了心，我没什么可回报的了。」'],
  },
  bold: {
    cold:    ['朗声笑道：「哈哈哈，豪爽！我敬你一杯！」', '大手一挥：「好！收下了！」', '用力拍在桌上：「够意思！你这个朋友我认了！」'],
    neutral: ['哈哈大笑：「不客气啦！」', '高高举起礼物：「兄弟们看看，这叫什么？仗义！」', '开怀大笑：「好说好说，今晚的酒钱我包了！」'],
    warm:    ['一把抱住你：「好兄弟/好姐妹！我太喜欢了！」', '抹了抹眼角：「娘的……居然有人对我这粗人这么好。」', '一拍桌子：「等着，改天我送你个更大的！」'],
    close:   ['朗声道：「这辈子能认识你，值了！」', '用力握拳：「以后有架一起打，有肉一起吃！」', '酒碗一摔：「江湖上谁找你麻烦，就是跟我过不去！」'],
    intimate:['重重一拳捶在墙上：「娘的……我这辈子值了！」', '声音哽咽：「别人送我金山银山我也不稀罕，就稀罕你的。」', '拉着你喝酒到天亮：「千言万语……都在酒里！」'],
  },
};

// ═════════════════════════════════════════════════════════
//  NPC 性格系统
// ═════════════════════════════════════════════════════════

// NpcPersonality, PersonalityConfig, PERSONALITY 从 npcStats.ts 导入

// ═════════════════════════════════════════════════════════
//  势力倾向匹配倍率
// ═════════════════════════════════════════════════════════

/**
 * 玩家势力倾向 vs NPC 势力倾向的交互倍率
 * - 同道（same）：×1.2
 * - 相近（正+中 / 邪+中）：×0.9
 * - 相异（正+邪 / 正+混乱）：×0.5
 * - 中立+任意：×1.0
 */
const ALIGNMENT_CHART: Record<FactionAlignment, Record<FactionAlignment, number>> = {
  righteous:  { righteous: 1.2, neutral: 0.9, chaotic: 0.5 },
  neutral:    { righteous: 1.0, neutral: 1.0, chaotic: 1.0 },
  
  chaotic:    { righteous: 0.5, neutral: 1.0, chaotic: 1.2 },
};

// ═════════════════════════════════════════════════════════
//  交互系数计算
// ═════════════════════════════════════════════════════════

export interface InteractionInfo {
  /** NPC 性格 */
  personality: NpcPersonality;
  /** 势力倾向匹配倍率 */
  alignmentMult: number;
  /** 交谈总倍率 */
  talkTotalMult: number;
  /** 送礼总倍率 */
  giftTotalMult: number;
  /** 已拥有好感度 */
  affection: number;
}

/** 获取与指定 NPC 的交互信息 */
export function getInteractionInfo(npcId: string): InteractionInfo | null {
  const npc = getNpcStats(npcId);
  if (!npc) return null;

  const p = getPlayer();
  const personality = npc.personality as NpcPersonality | undefined ?? 'gentle';
  const persConfig = PERSONALITY[personality];

  // 计算势力倾向匹配
  const playerAlign = (SECTS[p.sect]?.alignment ?? 'neutral') as FactionAlignment;
  const npcAlign = (SECTS[npc.sect]?.alignment ?? 'neutral') as FactionAlignment;
  const alignmentMult = ALIGNMENT_CHART[playerAlign]?.[npcAlign] ?? 1.0;

  const affection = getNpcAffection(npcId);

  return {
    personality,
    alignmentMult,
    talkTotalMult: persConfig.talkMult * alignmentMult,
    giftTotalMult: persConfig.giftMult * alignmentMult,
    affection,
  };
}

// ═════════════════════════════════════════════════════════
//  关系型对话池（主角与 NPC 有特殊关系时优先使用）
//  非道侣/结义内容保持适当距离感
// ═════════════════════════════════════════════════════════

type RelationTalkPool = Record<PlayerNpcRelation, string[]>;

const RELATION_DIALOGUES: RelationTalkPool = {
  lover: [
    '（温柔地望着你）你来了。这几日我总在念着你。',
    '（轻声）江湖路远，有你在身边，便不觉孤单了。',
    '（浅笑）今日天气正好，不如陪我出去走走？',
  ],
  sworn_brother: [
    '（大笑）兄弟来得正好！我这正有好酒，一起饮上几杯！',
    '（拍着你的肩）有什么难处尽管说，做兄弟的赴汤蹈火！',
    '（正色道）行走江湖，义字当先。你我既结金兰，便是一生的事。',
  ],
  master: [
    '（正色道）徒儿来了。今日的功课可曾做完？不可懈怠。',
    '（颔首）近来修为略有精进，但还需勤加练习，切莫骄傲。',
    '（语重心长）修道之途，不在天赋，而在恒心。你且记住这句话。',
  ],
  student: [
    '（恭敬行礼）师父！徒儿这几日苦练不辍，请您指点一二。',
    '（眼中闪着光）师父教导的功法，徒儿终于领悟了些许！',
    '（捧上一盏茶）师父请用茶。徒儿有些困惑，想请教您。',
  ],
  friend: [
    '（微笑拱手）好久不见，正想找你聊聊天呢。',
    '（热情地）来得正好！我听说了一个有趣的江湖传闻……',
    '（拍拍你的肩膀）可有些日子没见了，一切都好吧？',
  ],
  enemy: [
    '（冷哼一声）你还敢来见我？',
    '（冷眼相对）不必假惺惺的，有什么话直说便是。',
    '（目光如刀）我与你之间，没什么好说的。',
  ],
};

// ═════════════════════════════════════════════════════════
//  交谈（+2 基础好感 × 性格 × 势力匹配）
// ═════════════════════════════════════════════════════════

export interface TalkResult {
  success: boolean;
  message: string;
  /** 真实获得的好感度 */
  gainedAffection: number;
}

/**
 * 与 NPC 交谈
 * - 基础 +2 好感度
 * - 不能连续交谈同一 NPC（需经过一次行动后刷新）
 * - 按好感度层级 × 性格产出对话
 * @param npcId NPC 的数据库 ID
 */
export function talkWithNpc(npcId: string): TalkResult {
  const info = getInteractionInfo(npcId);
  if (!info) return { success: false, message: '角色数据不存在。', gainedAffection: 0 };

  if (info.affection >= 100) {
    return { success: false, message: '好感度已达上限，无需再交谈。', gainedAffection: 0 };
  }

  const npc = getNpcStats(npcId);
  if (!npc) return { success: false, message: 'NPC 数据异常。', gainedAffection: 0 };

  const base = 2;
  const gained = Math.max(1, Math.round(base * info.talkTotalMult));

  changeNpcAffection(npcId, gained);

  // 记录到 NPC 近期经历
  appendNpcLog(npcId, `主角前来交谈`);

  // ── 生成对话 ──
  const relations = getPlayerNpcRelations(npcId);
  let dialogue: string;
  let relLabel = '';

  if (relations.length > 0) {
    // 按优先级取最高关系：lover > sworn_brother > master > student > friend > enemy
    const priority: PlayerNpcRelation[] = ['lover', 'sworn_brother', 'master', 'student', 'friend', 'enemy'];
    const primaryRel = priority.find(r => relations.includes(r));
    if (primaryRel) {
      const pool = RELATION_DIALOGUES[primaryRel];
      dialogue = pool[Math.floor(Math.random() * pool.length)]!;
      const labelMap: Record<string, string> = { lover: '💕道侣', sworn_brother: '🤝结义', master: '👨‍🏫师父', student: '📚徒弟', friend: '💚好友', enemy: '💢仇敌' };
      relLabel = ` · ${labelMap[primaryRel] ?? ''}`;
    } else {
      const tier = getAffectionTierKey(info.affection);
      const pool = TALK_DIALOGUES[info.personality]?.[tier] ?? TALK_DIALOGUES['gentle'][tier]!;
      dialogue = pool[Math.floor(Math.random() * pool.length)]!;
    }
  } else {
    const tier = getAffectionTierKey(info.affection);
    const pool = TALK_DIALOGUES[info.personality]?.[tier] ?? TALK_DIALOGUES['gentle'][tier]!;
    dialogue = pool[Math.floor(Math.random() * pool.length)]!;
  }

  const persCfg = PERSONALITY[info.personality];
  const npcName = npc.name;
  const alignStatus = info.alignmentMult >= 1.2 ? ' · 同道相惜' : info.alignmentMult <= 0.5 ? ' · 话不投机' : '';

  return {
    success: true,
    message: `${persCfg.icon} ${npcName}：${dialogue}${relLabel}${alignStatus}\n\n好感 +${gained}`,
    gainedAffection: gained,
  };
}

// ═════════════════════════════════════════════════════════
//  送礼
// ═════════════════════════════════════════════════════════

export interface GiftResult {
  success: boolean;
  message: string;
  gainedAffection: number;
  goldSpent: number;
  newGold: number;
}

/** 礼物档次 */
export const GIFT_TIERS = [
  { label: '薄礼', cost: 20, baseAffection: 3 },
  { label: '厚礼', cost: 50, baseAffection: 7 },
  { label: '重礼', cost: 120, baseAffection: 15 },
  { label: '稀世珍宝', cost: 300, baseAffection: 30 },
];

/**
 * 送礼
 * @param npcId NPC 数据库 ID
 * @param tierIndex 礼物档次索引 (0=薄礼, 1=厚礼, 2=重礼, 3=稀世珍宝)
 */
export function giveGiftToNpc(npcId: string, tierIndex: number): GiftResult {
  const info = getInteractionInfo(npcId);
  if (!info) return { success: false, message: '角色数据不存在。', gainedAffection: 0, goldSpent: 0, newGold: 0 };

  if (info.affection >= 100) {
    return { success: false, message: '好感度已达上限。', gainedAffection: 0, goldSpent: 0, newGold: 0 };
  }

  const tier = GIFT_TIERS[tierIndex];
  if (!tier) return { success: false, message: '礼物档次无效。', gainedAffection: 0, goldSpent: 0, newGold: 0 };

  const p = getPlayer();
  if (p.gold < tier.cost) {
    return {
      success: false,
      message: `铜钱不足！需要 ${tier.cost} 两，当前只有 ${p.gold} 两。`,
      gainedAffection: 0, goldSpent: 0, newGold: p.gold,
    };
  }

  const npc = getNpcStats(npcId);
  if (!npc) return { success: false, message: 'NPC 数据异常。', gainedAffection: 0, goldSpent: 0, newGold: 0 };

  // 扣钱 + 加好感
  const gained = Math.max(1, Math.round(tier.baseAffection * info.giftTotalMult));
  const newGold = p.gold - tier.cost;

  const updated = { ...p, gold: newGold };
  setPlayer(updated);
  saveGame(updated);

  changeNpcAffection(npcId, gained);

  // 记录到 NPC 近期经历
  appendNpcLog(npcId, `主角送了${tier.label}`);

  // ── 生成送礼叙事 ──
  const affTier = getAffectionTierKey(info.affection);
  const pool = GIFT_REACTIONS[info.personality]?.[affTier] ?? GIFT_REACTIONS['gentle'][affTier]!;
  const reaction = pool[Math.floor(Math.random() * pool.length)]!;
  const persCfg = PERSONALITY[info.personality];

  return {
    success: true,
    message: `你取出【${tier.label}】递上前去。\n${persCfg.icon} ${npc.name}${reaction}\n\n好感 +${gained}（-${tier.cost}两）`,
    gainedAffection: gained,
    goldSpent: tier.cost,
    newGold,
  };
}

// ═════════════════════════════════════════════════════════
//  切磋（模拟比试）
// ═════════════════════════════════════════════════════════

export interface SparResult {
  success: boolean;
  message: string;
  playerWon: boolean;
  affectionDelta: number;
  expGained: number;
  /** 是否需要确认（等级差过大） */
  needConfirm?: boolean;
}

/**
 * 与 NPC 切磋
 * 基于等级差计算胜率，胜败产生不同好感变化。
 * 若 NPC 等级远高于玩家（差>5）则需确认。
 * @param npcId NPC 数据库 ID
 * @param confirmed 是否已确认（跳过第二次检查）
 */
export function sparWithNpc(npcId: string, confirmed: boolean = false): SparResult {
  const info = getInteractionInfo(npcId);
  if (!info) return { success: false, message: '角色数据不存在。', playerWon: false, affectionDelta: 0, expGained: 0 };

  const npc = getNpcStats(npcId);
  if (!npc) return { success: false, message: 'NPC 数据异常。', playerWon: false, affectionDelta: 0, expGained: 0 };

  const p = getPlayer();
  const persCfg = PERSONALITY[info.personality];
  const levelDiff = npc.level - p.level;

  // ── 等级差警告（首次调用时检查） ──
  if (!confirmed && levelDiff > 5) {
    return {
      success: false,
      needConfirm: true,
      playerWon: false,
      affectionDelta: 0,
      expGained: 0,
      message: '',
    };
  }

  // 胜率 = 50% + 等级差×2%（上限90%，下限10%）
  const winRate = Math.max(0.1, Math.min(0.9, 0.5 - levelDiff * 0.02));
  const playerWon = Math.random() < winRate;

  const affectionDelta = playerWon
    ? persCfg.sparWinAffection
    : persCfg.sparLoseAffection;

  const expGained = Math.floor((5 + Math.random() * 10) * (playerWon ? 1.5 : 0.6));

  // 更新玩家经验
  const updatedP = { ...p, exp: p.exp + expGained };
  setPlayer(updatedP);
  saveGame(updatedP);

  // 更新好感度
  changeNpcAffection(npcId, affectionDelta);

  // 记录到 NPC 近期经历
  const resultTag = playerWon ? '胜' : '败';
  appendNpcLog(npcId, `主角前来切磋（${resultTag}）`);

  // ── 生成叙事 ──
  const npcName = npc.name;
  let duelNarrative: string;
  if (playerWon) {
    if (levelDiff > 5) {
      duelNarrative = `${npcName}踉跄后退半步，眼中闪过不可置信之色。以弱胜强，围观者无不愕然！`;
    } else {
      duelNarrative = `${npcName}收剑入鞘，拱手道：「少侠好功夫，在下佩服。」`;
    }
  } else {
    if (levelDiff > 5) {
      duelNarrative = `${npcName}轻描淡写便将你逼退数步，差距悬殊。他并未追击，只淡淡道：「……还需勤修。」`;
    } else {
      duelNarrative = `${npcName}伸手将你扶起：「承让。你我旗鼓相当，下次再来。」`;
    }
  }

  const deltaText = affectionDelta >= 0 ? `+${affectionDelta}` : `${affectionDelta}`;
  const diffLabel = levelDiff > 5 ? ' ⚠️跨阶对决' : '';

  return {
    success: true,
    playerWon,
    affectionDelta,
    expGained,
    message: `你向${persCfg.icon}${npcName}发起切磋！\n\n${duelNarrative}${diffLabel}\n\n好感 ${deltaText} · 经验 +${expGained}`,
  };
}

// ═════════════════════════════════════════════════════════
//  论道（探讨武学/道法，双方获益）
// ═════════════════════════════════════════════════════════

export interface DiscussDaoResult {
  success: boolean;
  message: string;
  playerExpGained: number;
  npcExpGained: number;
  affectionDelta: number;
}

const DAO_DIALOGUES: Record<AffectionTierKey, string[]> = {
  cold: [
    '寥寥数语，对方显然不愿多谈。不过寥寥几句，已让你若有所悟。',
    '对方冷着脸敷衍了几句，但你从只言片语中仍然捕捉到了一丝武学真意。',
  ],
  neutral: [
    '你与对方就武学之道交换了些许看法。虽然观点不尽相同，却也算有所收获。',
    '论及剑道，对方略略提了几句本门心法。虽然点到为止，却让你豁然开朗。',
  ],
  warm: [
    '对方兴致颇高，与你从剑法谈到心法，从武学谈到天地大道。不知不觉已过了一个时辰。',
    '你道出近来修行困惑，对方沉思片刻后缓缓开口：「道法自然，强求不得。你且听我慢慢道来……」',
  ],
  close: [
    '二人相对而坐，从黄昏谈到月上中天。武学、道法、人生……无所不谈。这大概就是知己的感觉吧。',
    '对方难得地打开了话匣子，将自己的修行心得倾囊相授。「这些话，我只对你一人说过。」',
  ],
  intimate: [
    '月光下，两人并肩而坐。对方轻声说道：「修道之路漫漫，有你同行，便不觉得辛苦。」论道之后，你的心境似乎也提升了几分。',
    '对方握住你的手，眼中闪着光：「今日这番论道，胜过十年苦修。遇见你之后，我才知道什么是真正的『道』。」',
  ],
};

export function discussDaoWithNpc(npcId: string): DiscussDaoResult {
  const info = getInteractionInfo(npcId);
  if (!info) return { success: false, message: '角色数据不存在。', playerExpGained: 0, npcExpGained: 0, affectionDelta: 0 };

  const npc = getNpcStats(npcId);
  if (!npc) return { success: false, message: 'NPC 数据异常。', playerExpGained: 0, npcExpGained: 0, affectionDelta: 0 };

  const p = getPlayer();
  const persCfg = PERSONALITY[info.personality];

  // 基于双方的学识属性计算收益
  const playerScholar = p.courtStats?.scholarship ?? 5;
  const npcScholar = npc.courtStats?.scholarship ?? 5;
  const scholarAvg = (playerScholar + npcScholar) / 2;

  const playerExp = Math.max(5, Math.floor(scholarAvg * 2 + Math.random() * 10));
  const npcExp = Math.max(3, Math.floor(npcScholar * 1.5 + Math.random() * 8));
  const affectionDelta = Math.max(2, Math.round((3 + Math.random() * 3) * info.talkTotalMult));

  // 更新玩家经验
  const updatedP = { ...p, exp: p.exp + playerExp };
  setPlayer(updatedP);
  saveGame(updatedP);

  // 更新 NPC 经验 + 好感
  const npcDb = { ...(p.npcDatabase ?? {}) };
  if (npcDb[npcId]) {
    npcDb[npcId] = { ...npcDb[npcId]!, exp: (npcDb[npcId]!.exp ?? 0) + npcExp };
    setPlayer({ ...updatedP, npcDatabase: npcDb });
    saveGame(getPlayer());
  }
  changeNpcAffection(npcId, affectionDelta);
  appendNpcLog(npcId, `主角前来论道（学识${playerScholar} vs ${npcScholar}）`);

  const affTier = getAffectionTierKey(info.affection);
  const pool = DAO_DIALOGUES[affTier] ?? DAO_DIALOGUES['neutral']!;
  const narrative = pool[Math.floor(Math.random() * pool.length)]!;

  return {
    success: true,
    message: `${persCfg.icon} ${npc.name}\n\n${narrative}\n\n📖 经验 +${playerExp} · ${npc.name} 经验 +${npcExp} · 好感 +${affectionDelta}`,
    playerExpGained: playerExp,
    npcExpGained: npcExp,
    affectionDelta,
  };
}

// ═════════════════════════════════════════════════════════
//  请求指点（向高等级 NPC 请教）
// ═════════════════════════════════════════════════════════

export interface AskGuidanceResult {
  success: boolean;
  message: string;
  playerExpGained: number;
  affectionDelta: number;
}

const GUIDANCE_DIALOGUES: Record<AffectionTierKey, string[]> = {
  cold: [
    '对方略一皱眉：「修行在个人，莫要事事靠人。」不过还是随手点拨了一二。',
    '对方态度冷淡，但还是指出了你剑法中的几处破绽。',
  ],
  neutral: [
    '对方沉吟片刻，指出了你运气行功中的一处谬误。「此处的内力走向当如此……」',
    '对方将你的剑招拆解了一遍，指出了三处可改进之处。虽然语气平淡，却句句在理。',
  ],
  warm: [
    '对方认真地看着你演练了一遍剑法，频频点头：「进步很大。不过这一式还可再精进……」',
    '对方仔细纠正了你的身法姿势，又传授了几招御气法门。「这些都是我师父当年教我的，你且记下。」',
  ],
  close: [
    '对方将你拉到一旁，低声道：「此法门我只传与你一人。」随后将一招精妙剑式细细拆解。',
    '对方将本门心法中最精华的部分娓娓道来。你的修为隐隐有了突破的征兆。',
  ],
  intimate: [
    '对方将毕生所学中最得意的一式传给了你。「此招名为『破云』——我从未教过别人。」',
    '「你天资聪颖，若能潜心修炼，他日成就必在我之上。」对方眼中满是期许。',
  ],
};

export function askNpcForGuidance(npcId: string): AskGuidanceResult {
  const info = getInteractionInfo(npcId);
  if (!info) return { success: false, message: '角色数据不存在。', playerExpGained: 0, affectionDelta: 0 };

  const npc = getNpcStats(npcId);
  if (!npc) return { success: false, message: 'NPC 数据异常。', playerExpGained: 0, affectionDelta: 0 };

  const p = getPlayer();

  // 对方等级必须比你高
  if (npc.level <= p.level) {
    return {
      success: false,
      message: `${npc.name}微微一笑：「你的修为已不在我之下，我没什么可教你的了。」`,
      playerExpGained: 0, affectionDelta: 0,
    };
  }

  // 好感度门槛
  if (info.affection < 20) {
    return {
      success: false,
      message: `${npc.name}婉拒了你的请求：「你我尚未熟络，不便指点。」`,
      playerExpGained: 0, affectionDelta: 0,
    };
  }

  const persCfg = PERSONALITY[info.personality];
  const levelDiff = npc.level - p.level;

  // 收益：等级差越大，经验越多
  const playerExp = Math.max(8, Math.floor(levelDiff * 3 + Math.random() * 15));
  const affectionDelta = Math.max(2, Math.round((2 + Math.random() * 3) * info.talkTotalMult));

  const updatedP = { ...p, exp: p.exp + playerExp };
  setPlayer(updatedP);
  saveGame(updatedP);

  changeNpcAffection(npcId, affectionDelta);
  appendNpcLog(npcId, `主角前来请教（等级差${levelDiff}）`);

  const affTier = getAffectionTierKey(info.affection);
  const pool = GUIDANCE_DIALOGUES[affTier] ?? GUIDANCE_DIALOGUES['neutral']!;
  const narrative = pool[Math.floor(Math.random() * pool.length)]!;

  return {
    success: true,
    message: `${persCfg.icon} ${npc.name}\n\n${narrative}\n\n📖 经验 +${playerExp} · 好感 +${affectionDelta}`,
    playerExpGained: playerExp,
    affectionDelta,
  };
}

// ═════════════════════════════════════════════════════════
//  打探情报（向 NPC 打听江湖消息）
// ═════════════════════════════════════════════════════════

export interface AskIntelResult {
  success: boolean;
  message: string;
  affectionDelta: number;
  intel: string | null;
}

const INTEL_TEMPLATES: string[] = [
  '听说%s最近不太太平，盗匪横行，官府正在悬赏缉拿。',
  '据说%s在%s发现了一处前人洞府，其中或有至宝。',
  '有人在%s见过%s的%s，似乎正在秘密筹备什么。',
  '近来%s与%s之间摩擦不断，怕是快要兵戎相见了。',
  '%s市面上的%s价格飞涨，据说是因为%s的商路被劫了。',
  '小道消息：%s有意与%s联姻，两家一旦联手，势力将大增。',
  '传闻%s中出了一位天骄弟子，修为突飞猛进，被视为下一任掌门的热门人选。',
  '%s附近近来时有妖物出没，已经伤了好几个采药人。',
  '我听说%s的%s暗中勾结%s，似乎在谋划什么大事。',
  '%s与%s的边境上，两方巡逻弟子已爆发过数次小规模冲突。',
];

function generateIntel(npc: NpcStats): string {
  const allSects = ['武当', '少林', '峨眉', '丐帮', '华山', '日月教', '茅山', '昆仑', '青城', '唐门', '逍遥', '全真', '崆峒', '点苍', '铁掌帮', '五毒教', '血刀门', '海沙派'];
  const allCities = ['襄阳', '洛阳', '长安', '开封', '成都', '金陵', '杭州', '燕京', '太原', '武昌', '明州', '广州', '凉州', '福州', '扬州', '苏州', '重庆', '大理', '江陵'];

  const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]!;

  const template = pick(INTEL_TEMPLATES);
  const replacements = template.match(/%s/g)?.length ?? 0;
  const args: string[] = [];
  for (let i = 0; i < replacements; i++) {
    // 随机选择城市或宗门填入
    args.push(Math.random() < 0.5 ? pick(allSects) : pick(allCities));
  }

  // 用 args 填充模板
  let result = template;
  for (const arg of args) {
    result = result.replace('%s', arg);
  }
  return result;
}

export function askNpcForIntel(npcId: string): AskIntelResult {
  const info = getInteractionInfo(npcId);
  if (!info) return { success: false, message: '角色数据不存在。', affectionDelta: 0, intel: null };

  const npc = getNpcStats(npcId);
  if (!npc) return { success: false, message: 'NPC 数据异常。', affectionDelta: 0, intel: null };

  const persCfg = PERSONALITY[info.personality];

  // 好感度门槛
  if (info.affection < 10) {
    return {
      success: false,
      message: `${persCfg.icon} ${npc.name}冷冷道：「我为何要告诉你？」`,
      affectionDelta: 0, intel: null,
    };
  }

  // 成功率基于 NPC 的智谋和魅力
  const npcStrategy = npc.courtStats?.strategy ?? 5;
  const npcCharisma = npc.courtStats?.charisma ?? 5;
  const successRate = 0.4 + (npcStrategy + npcCharisma) * 0.02; // 40%~80%
  const succeeded = Math.random() < successRate;

  const affectionDelta = succeeded
    ? Math.max(1, Math.round((2 + Math.random() * 2) * info.talkTotalMult))
    : Math.round(-1 * Math.random() * 2);

  changeNpcAffection(npcId, affectionDelta);
  appendNpcLog(npcId, `主角前来打探情报${succeeded ? '（成功）' : '（失败）'}`);

  if (succeeded) {
    const intel = generateIntel(npc);
    return {
      success: true,
      message: `${persCfg.icon} ${npc.name}左右看了看，压低声音道：「我告诉你一件事，你可别到处说……」\n\n📜 ${intel}\n\n好感 ${affectionDelta >= 0 ? '+' + affectionDelta : affectionDelta}`,
      affectionDelta,
      intel,
    };
  } else {
    const failLines = [
      '对方摇了摇头：「抱歉，我知道的也不比你多。」',
      '对方迟疑了一下：「这事我也不太清楚……」',
      '「不是我不愿说，是有些事知道得越少越好。」对方意味深长地看着你。',
    ];
    return {
      success: false,
      message: `${persCfg.icon} ${npc.name}\n\n${failLines[Math.floor(Math.random() * failLines.length)]!}\n\n好感 ${affectionDelta}`,
      affectionDelta,
      intel: null,
    };
  }
}

// ═════════════════════════════════════════════════════════
//  邀约同行（邀请 NPC 一同旅行）
// ═════════════════════════════════════════════════════════

export interface InviteTravelResult {
  success: boolean;
  message: string;
  affectionDelta: number;
}

export function inviteNpcToTravel(npcId: string, destLocationId: LocationId): InviteTravelResult {
  const info = getInteractionInfo(npcId);
  if (!info) return { success: false, message: '角色数据不存在。', affectionDelta: 0 };

  const npc = getNpcStats(npcId);
  if (!npc) return { success: false, message: 'NPC 数据异常。', affectionDelta: 0 };

  const p = getPlayer();
  const persCfg = PERSONALITY[info.personality];

  // 好感度门槛
  if (info.affection < 30) {
    return {
      success: false,
      message: `${persCfg.icon} ${npc.name}婉拒道：「你我尚未如此熟络，还是各自行事为好。」`,
      affectionDelta: 0,
    };
  }

  // 已经同行了（NPC 已在玩家位置）
  if (npc.currentLocationId === p.currentLocationId) {
    // 判断是否愿意
    const npcAgi = npc.agi ?? 10;
    const acceptRate = 0.4 + info.affection * 0.005 + npcAgi * 0.01; // 40%~95%
    const accepted = Math.random() < acceptRate;
    const dest = WORLD_MAP[destLocationId];
    const destName = dest?.name ?? destLocationId;

    if (accepted) {
      // 移动 NPC 到目的地
      const npcDb = { ...(p.npcDatabase ?? {}) };
      if (npcDb[npcId]) {
        npcDb[npcId] = { ...npcDb[npcId]!, currentLocationId: destLocationId };
        setPlayer({ ...p, npcDatabase: npcDb });
        saveGame(getPlayer());
      }

      const affectionDelta = Math.round(3 * info.talkTotalMult);
      changeNpcAffection(npcId, affectionDelta);
      appendNpcLog(npcId, `与主角同行前往${destName}`);

      const acceptLines = [
        `「正好我也想去${destName}看看。」${npc.name}爽快地答应了。`,
        `${npc.name}微微一笑：「有你在，到哪都行。」`,
        `「行啊！路上还能切磋切磋。」${npc.name}已经背起了行囊。`,
      ];

      return {
        success: true,
        message: `${persCfg.icon} ${npc.name}\n\n${acceptLines[Math.floor(Math.random() * acceptLines.length)]!}\n\n📍 ${npc.name} 将与你一同前往【${destName}】 · 好感 +${affectionDelta}`,
        affectionDelta,
      };
    } else {
      const declineLines = [
        `「今日我还有些私事要处理，改日吧。」${npc.name}抱歉地笑了笑。`,
        `「${destName}太远了，我怕耽误修行。」${npc.name}摇了摇头。`,
        `「最近此地有些事情需要我照应，不能走开。」`,
      ];
      return {
        success: false,
        message: `${persCfg.icon} ${npc.name}\n\n${declineLines[Math.floor(Math.random() * declineLines.length)]!}`,
        affectionDelta: 0,
      };
    }
  } else {
    // NPC 不在同一地点
    return {
      success: false,
      message: `${npc.name}不在此地，无法同行。`,
      affectionDelta: 0,
    };
  }
}

// ═════════════════════════════════════════════════════════
//  注意：NPC 之间的自主互动逻辑已移至 NpcBehavior.ts
//  以解决循环依赖问题
// ═════════════════════════════════════════════════════════
