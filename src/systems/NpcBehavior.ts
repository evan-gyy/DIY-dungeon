import type { SectId } from '../data/types';
import { getRealmByLevel } from '../data/types';
import type { NpcStats, NpcPersonality } from '../data/npcStats';
import { NPC_STATS_INIT } from '../data/npcStats';
import { TALENTS } from '../data/realmConfig';
import { getPlayer, setPlayer } from '../state/GameState';
import { calculateFinalStats } from '../data/realmConfig';
import { WORLD_MAP, type LocationId } from '../data/worldMap';
import { type FactionAlignment } from '../data/sandboxTypes';
import { SECTS } from '../data/sects';
import { changeNpcAffection, getNpcAffection } from '../screens/camp/RelationPanel';
import { generateAllNpcs } from './NPCGenerator';
import {
  changeNpcAffection as changeNpcPairAffection,
  getNpcAffection as getNpcPairAffection,
  canBenevolentInteraction,
  canHostileInteraction,
  getAffectionTier,
  getNpcNpcRelationTag,
} from './NpcRelationship';
import { executeSectTask, getSectCultivateBonus, shouldNpcLeaveSect, isSectBase } from './SectManagement';

// ── NPC 初始位置映射 ──
const NPC_INITIAL_LOCATION: Record<string, LocationId> = {
  // 武当派
  'liu_qinghan':       'wudang_mountain',
  'zhang_xuansu':      'wudang_mountain',
  'chen_jingxu':       'wudang_mountain',
  'lu_chengzhou':      'wudang_mountain',
  'gu_xiaosang':       'wudang_mountain',
  'song_zhiyuan':      'wudang_mountain',
  'ji_wushuang_npc':   'wudang_mountain',
  'su_yunxiu_npc':     'wudang_mountain',
  'fang_zhonghe_npc':  'wudang_mountain',
  'meng_wenyuan':      'wudang_mountain',
  'ye_ziyi':           'wudang_mountain',
  // 🆕 沙盒：少林派
  'shaolin_kongwen':   'shaolin_temple',
  'shaolin_kongjian':  'shaolin_temple',
  // 🆕 沙盒：峨眉派
  'emei_miejue':       'emei_mountain',
  'emei_jingxuan':     'emei_mountain',
  'shen_nishang':      'emei_mountain',
  // 🆕 沙盒：丐帮
  'beggar_hong':       'beggar_hq',
  'beggar_lu':         'beggar_hq',
  // 🆕 沙盒：华山派
  'huashan_master':    'huashan_base',
  'huashan_feng':      'huashan_base',
  // 🆕 沙盒：魔教
  'demon_master':      'yangzhou_city',
  'demon_yang':        'yangzhou_city',
  // 🆕 沙盒：城市官员
  'kaifeng_fuyin':     'kaifeng_city',
  'luoyang_zhifu':     'luoyang_city',
  'changan_zhifu':     'changan_city',
  'xiangyang_zhifu':   'xiangyang_city',
  'jiangling_zhifu':   'jiangling_city',
  'chengdu_zhifu':     'chengdu_city',
  'yangzhou_zhizhou':  'yangzhou_city',
  'suzhou_zhizhou':    'suzhou_city',
  'hangzhou_zhifu':    'hangzhou_city',
  'dali_guoxiang':     'dali_city',
  // 🆕 沙盒：三大新门派
  'quanzhen_zhangmen': 'zhongnan_mountain',
  'quanzhen_elder':    'zhongnan_mountain',
  'quanzhen_qiuchuji': 'zhongnan_mountain',
  'kongtong_zhangmen': 'kongtong_mountain',
  'kongtong_elder':    'kongtong_mountain',
  'diancang_zhangmen': 'diancang_mountain',
  'diancang_elder':    'diancang_mountain',
  // 🆕 沙盒：三大新城市官员
  'jiangzhou_zhizhou': 'jiangzhou_city',
  'tanzhou_zhifu':     'tanzhou_city',
  'guangzhou_shibosi': 'guangzhou_city',
  // 🆕 v2.1 五大宗门掌门
  'riyue_leader':   'heimu_cliff',
  'tiezhang_leader':'chongqing_city',
  'wudu_leader':    'dali_city',
  'xuedao_leader':  'liangzhou_city',
  'haisha_leader':  'mingzhou_city',
  // 🆕 P7 朝廷与叛军
  'prime_minister':    'kaifeng_city',
  'taiwei':            'kaifeng_city',
  'xingbu_shangshu':   'kaifeng_city',
  'zhao_qinwei':       'yanjing_city',
  'mo_jiangqing':      'yanjing_city',
  'rebel_general':     'yanjing_city',
  'rebels_strategist': 'yanjing_city',
};

/** 正道 NPC 移动至友好/同盟势力地点的权重倍数 */
const RIGHTEOUS_FRIENDLY_MOVE_WEIGHT = 3.0;

/** 混乱 NPC 移动偏好：每点危险等级增加的权重系数 */
const CHAOTIC_DANGER_WEIGHT_MULT = 0.8;

function expNeeded(level: number): number {
  return Math.floor(42 * Math.pow(level, 1.1));
}

// ── Public API ──

/**
 * P8 迁移：将旧版 `talent` 单字段转换为 `talents` 数组。
 * 旧存档兼容：如果 NPC 有 talent 但无 talents 或 talents 为空，则从 talent 构建。
 */
export function migrateNpcTalents(npc: NpcStats): NpcStats {
  if ((!npc.talents || npc.talents.length === 0) && npc.talent) {
    return { ...npc, talents: [npc.talent], isTianjiao: npc.isTianjiao ?? false };
  }
  if (!npc.talents) {
    return { ...npc, talents: ['normal'], isTianjiao: npc.isTianjiao ?? false };
  }
  if (npc.isTianjiao === undefined) {
    return { ...npc, isTianjiao: false };
  }
  return npc;
}

export function initNpcDatabase(): Record<string, NpcStats> {
  const db: Record<string, NpcStats> = {};

  // 1. 手写 NPC（核心角色）
  for (const [id, init] of Object.entries(NPC_STATS_INIT)) {
    // 优先使用 NPC 数据中指定的位置，否则从位置映射表取，最后回退到武当山
    const initialLoc = init.currentLocationId ?? NPC_INITIAL_LOCATION[id] ?? 'wudang_mountain';
    const migrated = migrateNpcTalents({ ...init, exp: 0, currentLocationId: initialLoc } as NpcStats);
    db[id] = migrated;
  }

  // 2. 随机生成 NPC（填充地图）
  const generated = generateAllNpcs();
  for (const [id, npc] of Object.entries(generated)) {
    if (db[id]) {
      console.warn(`[NPCGenerator] ID conflict: ${id} already exists, skipping`);
      continue;
    }
    db[id] = npc;
  }

  return db;
}

export function getNpcStats(id: string): NpcStats | null {
  return getPlayer().npcDatabase?.[id] ?? null;
}

export interface NpcTickResult {
  npcId: string;
  npcName: string;
  action: 'buy_fabao' | 'learn_skill' | 'cultivate' | 'move' | 'npc_interact' | 'heal' | 'sect_task';

  outcome: string;
  detail: string;
}

/**
 * NPC 回合行为引擎（优先级重构版）
 *
 * Priority 1: 疗伤 —— HP < 50% → 恢复 20-30% HP，跳过其他所有行为
 * Priority 2: 修炼 —— 60% 概率，原「修炼」逻辑（含门派资源加成）
 * Priority 3: 社交 —— 15% 概率，主动与同地点 NPC 互动
 * Priority 4: 门派任务 —— 15% 概率，执行 patrol/gather/train
 * Priority 5: 移动 —— 10% 概率，移动到相邻地点
 *
 * @returns 所有 NPC 本回合的行为结果
 */
function npcActivityLabel(result: NpcTickResult): string {
  if (result.action === 'heal') return '🩹 运功疗伤';
  if (result.action === 'cultivate') return result.detail.includes('突破') ? '🧘 境界突破！' : '🧘 修炼';
  if (result.action === 'npc_interact') return '💬 游走交流';
  if (result.action === 'sect_task') return `📋 ${result.outcome}`;
  if (result.action === 'move') {
    const dest = result.detail.split('前往')[1]?.replace('。', '') ?? '';
    return dest ? `🚶 前往${dest}` : '🚶 游历';
  }
  return '';
}

function writeActivityLog(n: NpcStats, entry: string): void {
  if (!entry) return;
  const old = n.recentLog ?? [];
  if (old.length > 0 && old[old.length - 1] === entry) return;
  n.recentLog = [...old, entry].slice(-20);
}

export function tickNpcBehaviors(): NpcTickResult[] {
  const p = getPlayer();
  if (!p.npcDatabase) return [];

  const results: NpcTickResult[] = [];
  const updatedDb = { ...p.npcDatabase };

  for (const [id, npc] of Object.entries(updatedDb)) {
    const n: NpcStats = {
      ...npc,
      equippedFabao: { ...npc.equippedFabao },
      skills: [...npc.skills],
      ownedFabao: [...npc.ownedFabao],
    };

    const primaryTalent = n.talents?.[0] ?? n.talent ?? 'normal';
    const talent = TALENTS[primaryTalent];
    let result: NpcTickResult;

    // ── Priority 1: 疗伤 ──
    if (n.hp < n.maxHp * 0.5) {
      const healPct = 0.20 + Math.random() * 0.10; // 20-30%
      const healAmount = Math.floor(n.maxHp * healPct);
      n.hp = Math.min(n.maxHp, n.hp + healAmount);
      result = {
        npcId: id, npcName: n.name, action: 'heal',
        outcome: '运功疗伤',
        detail: `${n.name}运功疗伤，恢复 ${healAmount} 点气血。`,
      };
      writeActivityLog(n, '🩹 运功疗伤');
      updatedDb[id] = n;
      results.push(result);

      // 疗伤后也检查门派稳定度过低 → NPC 可能脱离
      if (n.sect !== 'none' && shouldNpcLeaveSect(n.sect)) {
        const oldSectName = SECTS[n.sect]?.name ?? n.sect;
        n.sect = 'none';
        n.discipleRank = 'outer';
        updatedDb[id] = n;
        results.push({
          npcId: id, npcName: n.name, action: 'move',
          outcome: '脱离门派',
          detail: `${n.name}因门派动荡而脱离了${oldSectName}，成为散修。`,
        });
      }
      continue; // 跳过其他所有行为
    }

    // ── Priority 2-5: 加权随机选择（P8: 受志向影响）──
    const rand = Math.random();
    const ambition = n.ambition ?? 'content';
    // 志向调整行为概率: [cultivate, socialize, sect_task, move]
    const ambitionProbs: Record<string, [number, number, number, number]> = {
      content:  [0.60, 0.15, 0.15, 0.10],
      master:   [0.70, 0.10, 0.10, 0.10],
      power:    [0.50, 0.25, 0.15, 0.10],
      rebel:    [0.45, 0.15, 0.15, 0.25],
      avenger:  [0.65, 0.10, 0.15, 0.10],
    };
    const [cultP, socP, taskP, moveP] = ambitionProbs[ambition] ?? ambitionProbs['content']!;
    const thresh1 = cultP;
    const thresh2 = thresh1 + socP;
    const thresh3 = thresh2 + taskP;

    if (rand < thresh1) {
      // ── 修炼（含门派资源加成）──
      const cultivateBonus = getSectCultivateBonus(n.sect);
      const sub = Math.random();
      let expGain: number;
      let outcome: string;
      if (sub < 0.10) {
        expGain = Math.floor(30 * talent.cultivationMul * (1 + cultivateBonus));
        outcome = '天人合一';
      } else if (sub < 0.90) {
        expGain = Math.floor(15 * talent.cultivationMul * (1 + cultivateBonus));
        outcome = '修行';
      } else {
        expGain = Math.floor(5 * talent.cultivationMul * (1 + cultivateBonus));
        outcome = '走火入魔';
      }

      n.exp += expGain;
      if (n.exp >= expNeeded(n.level)) {
        n.exp -= expNeeded(n.level);
        n.level += 1;
        const newStats = calculateFinalStats(n.level, n.talents?.length ? n.talents : (n.talent ? [n.talent] : ['normal']));
        n.maxHp = newStats.hp; n.hp = n.maxHp;
        n.maxMp = newStats.mp; n.mp = n.maxMp;
        n.atk = newStats.atk;
        n.def = newStats.def;
        n.agi = newStats.agi;
        n.crit = newStats.crit;
        result = {
          npcId: id, npcName: n.name, action: 'cultivate', outcome,
          detail: `${n.name}${outcome}，获得 ${expGain} 点修为，突破至 ${getRealmByLevel(n.level)}！`,
        };
      } else {
        result = {
          npcId: id, npcName: n.name, action: 'cultivate', outcome,
          detail: `${n.name}${outcome}，获得 ${expGain} 点修为。`,
        };
      }

    } else if (rand < thresh2) {
      // ── 社交（简化：记录为社交行为，实际互动由 tickNpcToNpcInteractions 处理）──
      result = {
        npcId: id, npcName: n.name, action: 'npc_interact',
        outcome: '社交',
        detail: `${n.name}在附近与人攀谈交流。`,
      };

    } else if (rand < thresh3) {
      // ── 门派任务 ──
      const currentLocId = n.currentLocationId ?? 'wudang_mountain';
      const locData = WORLD_MAP[currentLocId];
      const locName = locData?.name ?? currentLocId;
      const taskResult = executeSectTask(n.sect, n.name, n.id, locName);
      n.exp += taskResult.expGain;
      result = {
        npcId: id, npcName: n.name, action: 'sect_task',
        outcome: taskResult.label,
        detail: taskResult.detail,
      };

    } else {
      // ── 移动（阵营倾向加权）──
      const currentLocId = n.currentLocationId ?? 'wudang_mountain';
      const currentLoc = WORLD_MAP[currentLocId];
      let moveResult: NpcTickResult | null = null;
      if (currentLoc && currentLoc.connections.length > 0) {
        const npcAlign = (SECTS[n.sect]?.alignment ?? 'neutral') as FactionAlignment;

        // 为每个相邻地点计算权重
        const weights = currentLoc.connections.map(destId => {
          let w = 1.0;
          const destSect = isSectBase(destId);
          if (destSect) {
            const destAlign = (SECTS[destSect]?.alignment ?? 'neutral') as FactionAlignment;
            // 正道/中立 NPC 倾向前往正道/中立门派据点
            if ((npcAlign === 'righteous' || npcAlign === 'neutral') &&
                (destAlign === 'righteous' || destAlign === 'neutral')) {
              w *= RIGHTEOUS_FRIENDLY_MOVE_WEIGHT;
            }
            // 邪道 NPC 倾向前往邪道据点
            if (npcAlign === 'chaotic' && destAlign === 'chaotic') {
              w *= 1.0 + CHAOTIC_DANGER_WEIGHT_MULT;
            }
          }
          return w;
        });

        // 加权随机选择
        const totalW = weights.reduce((s, w) => s + w, 0);
        let r = Math.random() * totalW;
        let chosenIdx = 0;
        for (let k = 0; k < weights.length; k++) {
          r -= weights[k]!;
          if (r <= 0) { chosenIdx = k; break; }
        }
        const destId = currentLoc.connections[chosenIdx]!;
        const destLoc = WORLD_MAP[destId];
        if (destLoc) {
          n.currentLocationId = destId;
          moveResult = {
            npcId: id, npcName: n.name, action: 'move',
            outcome: '移动',
            detail: `${n.name}离开了${currentLoc.name}，前往${destLoc.name}。`,
          };
        }
      }
      if (moveResult) {
        result = moveResult;
      } else {
        // 无法移动时改为修炼
        const expGain = Math.floor(10 * talent.cultivationMul);
        n.exp += expGain;
        result = {
          npcId: id, npcName: n.name, action: 'cultivate', outcome: '修行',
          detail: `${n.name}静心修行，获得 ${expGain} 点修为。`,
        };
      }
    }

    // 🆕 P8: rebel志向有几率偷取门派资源
    if (ambition === 'rebel' && n.sect !== 'none' && Math.random() < 0.08) {
      const p2 = getPlayer();
      const state = p2.sectState?.[n.sect];
      if (state && state.resources > 30) {
        const stolen = Math.floor(Math.random() * 20) + 5;
        state.resources = Math.max(0, state.resources - stolen);
        setPlayer({ ...p2, sectState: { ...p2.sectState, [n.sect]: state } });
        results.push({
          npcId: id, npcName: n.name, action: 'sect_task',
          outcome: '中饱私囊',
          detail: `${n.name}暗中侵吞了${SECTS[n.sect]?.name ?? n.sect} ${stolen} 点资源。`,
        });
      }
    }

    writeActivityLog(n, npcActivityLabel(result));
    updatedDb[id] = n;
    results.push(result);

    // 检查门派稳定度过低 → NPC 可能脱离（rebel/avenger 更易脱离）
    const leaveChance = ambition === 'rebel' ? 0.40 : ambition === 'avenger' ? 0.25 : 0.15;
    if (n.sect !== 'none' && shouldNpcLeaveSect(n.sect) && Math.random() < leaveChance) {
      const oldSectName = SECTS[n.sect]?.name ?? n.sect;
      n.sect = 'none';
      n.discipleRank = 'outer';
      updatedDb[id] = n;
      results.push({
        npcId: id, npcName: n.name, action: 'move',
        outcome: '脱离门派',
        detail: `${n.name}因门派动荡而脱离了${oldSectName}，成为散修。`,
      });
    }
  }

  setPlayer({ ...p, npcDatabase: updatedDb });

  // ── NPC 之间的自主互动 ──
  const npcInteractions = tickNpcToNpcInteractions();
  for (const ni of npcInteractions) {
    const intentLabel = ni.intent === 'benevolent' ? '善' : ni.intent === 'hostile' ? '恶' : '';
    const typeLabel = getInteractionTypeLabel(ni.type);
    results.push({
      npcId: ni.npcA,
      npcName: ni.npcAName,
      action: 'npc_interact',
      outcome: `${intentLabel}${typeLabel}`,
      detail: ni.detail,
    });
  }

  return results;
}

/**
 * 获取指定地点的所有 NPC
 */
export function getNpcsAtLocation(locationId: LocationId): NpcStats[] {
  const p = getPlayer();
  if (!p.npcDatabase) return [];
  return Object.values(p.npcDatabase).filter(
    npc => (npc.currentLocationId ?? 'wudang_mountain') === locationId
  );
}

// ═════════════════════════════════════════════════════════
//  NPC 之间的自主互动（增强版：性格×阵营×好感度 多因素驱动）
// ═════════════════════════════════════════════════════════

/** 互动意图 */
type InteractionIntent = 'benevolent' | 'neutral' | 'hostile';

/** 互动类型（动作池） */
type NpcInteractionType =
  // 善意互动
  | 'talk'             // 交谈论道
  | 'gift'             // 赠礼
  | 'guide'            // 指点迷津（高等级→低等级）
  | 'help'             // 拔刀相助
  | 'tea'              // 共品灵茶（稀有）
  | 'friendly_spar'    // 友好切磋
  // 中立/交互
  | 'info_exchange'    // 交换情报
  | 'trade'            // 交易
  | 'debate'           // 论道辩法（正邪 NPC 间）
  // 恶意互动
  | 'provoke'          // 挑衅
  | 'brawl'            // 激斗
  | 'ambush'           // 暗算
  | 'slander'          // 散布谣言
  | 'loot'             // 夺宝抢掠
  | 'revenge';         // 复仇

interface InteractionAction {
  type: NpcInteractionType;
  intent: InteractionIntent;
  baseWeight: number;
  affectionDelta: number;
  /** 发起方的经验收益（切磋类） */
  expGain?: number;
  /** 仅特定关系层级可触发（null=无限制） */
  requiredAffectionMin?: number;
  requiredAffectionMax?: number;
  /** 仅特定阵营组合可触发 */
  alignmentGate?: 'same' | 'opposite' | 'any';
  /** 性格权重修正（乘法因数） */
  personalityMod: Partial<Record<NpcPersonality, number>>;
  /** 单方发起还是双方互动？ */
  symmetric: boolean;
  detailTemplates: string[];
}

// ──── 互动动作池 ────

const INTERACTION_ACTIONS: InteractionAction[] = [
  // ═══ 善意互动 ═══
  {
    type: 'talk', intent: 'benevolent', baseWeight: 30, affectionDelta: 2,
    symmetric: true,
    personalityMod: { kind: 1.5, gentle: 1.3, bold: 1.2, aloof: 0.3, cunning: 0.7 },
    detailTemplates: [
      '{A}与{B}谈论江湖轶事，相谈甚欢。',
      '{A}向{B}请教修炼心得，彼此交流切磋。',
      '{A}与{B}聊起近日的奇遇，互道珍重。',
    ],
  },
  {
    type: 'gift', intent: 'benevolent', baseWeight: 15, affectionDelta: 3,
    symmetric: false,
    personalityMod: { cunning: 1.8, kind: 1.3, bold: 1.4, aloof: 0.2, upright: 0.6 },
    detailTemplates: [
      '{A}送了{B}一份小礼物，{B}欣然收下。',
      '{A}将近日寻得的丹药赠予{B}。',
      '{A}将一卷剑谱残页赠与{B}。',
    ],
  },
  {
    type: 'guide', intent: 'benevolent', baseWeight: 8, affectionDelta: 4,
    symmetric: false,  // 仅高等级方发起
    personalityMod: { kind: 1.8, upright: 1.3, gentle: 1.4, aloof: 0.5, cunning: 0.3 },
    detailTemplates: [
      '{A}指点{B}武学上的困惑，{B}茅塞顿开。',
      '{A}看出{B}修炼瓶颈，主动传授心得。',
      '{A}将一套运气法门传授给{B}。',
    ],
  },
  {
    type: 'help', intent: 'benevolent', baseWeight: 6, affectionDelta: 6,
    symmetric: true,
    personalityMod: { upright: 2.0, bold: 1.8, kind: 1.5, cunning: 0.2, aloof: 0.3 },
    detailTemplates: [
      '{A}见{B}遭遇麻烦，主动拔刀相助。',
      '{A}替{B}挡下恶人偷袭，{B}感激不尽。',
    ],
  },
  {
    type: 'tea', intent: 'benevolent', baseWeight: 3, affectionDelta: 8,
    symmetric: true,
    personalityMod: { gentle: 1.8, kind: 1.5, aloof: 0.8, bold: 0.6, cunning: 0.4 },
    detailTemplates: [
      '{A}与{B}共品灵茶，论剑谈玄，心心相惜。',
      '{A}取出珍藏多年的灵茶邀{B}共饮，二人相谈甚欢。',
    ],
  },
  {
    type: 'friendly_spar', intent: 'benevolent', baseWeight: 12, affectionDelta: 2, expGain: 8,
    symmetric: true,
    personalityMod: { bold: 1.8, upright: 1.3, aloof: 1.2, kind: 0.7, cunning: 0.5 },
    detailTemplates: [
      '{A}与{B}点到为止地切磋了一场。',
      '{A}一时技痒，与{B}过了几招。',
    ],
  },
  // ═══ 中立互动 ═══
  {
    type: 'info_exchange', intent: 'neutral', baseWeight: 14, affectionDelta: 1,
    symmetric: true,
    personalityMod: { cunning: 1.8, bold: 1.4, gentle: 1.2, aloof: 0.4 },
    detailTemplates: [
      '{A}与{B}交换了江湖上的最新见闻。',
      '{A}从{B}处打听到了附近秘境的消息。',
      '{A}与{B}互通了丹药和药材的行情。',
    ],
  },
  {
    type: 'trade', intent: 'neutral', baseWeight: 8, affectionDelta: 0,
    symmetric: true,
    personalityMod: { cunning: 2.0, bold: 1.3, aloof: 0.5, upright: 0.8 },
    detailTemplates: [
      '{A}与{B}互通有无，交换了些许修炼物资。',
      '{A}看中了{B}的一件法器，掏钱买了下来。',
    ],
  },
  {
    type: 'debate', intent: 'neutral', baseWeight: 6, affectionDelta: -1,
    alignmentGate: 'opposite',  // 仅正邪 NPC 间触发
    symmetric: true,
    personalityMod: { upright: 1.8, aloof: 1.4, cunning: 1.2, gentle: 0.5 },
    detailTemplates: [
      '{A}与{B}因门派理念不同展开激烈辩论，不欢而散。',
      '{A}斥责{B}门派的行事作风，{B}反唇相讥。',
      '{A}与{B}论道辩法，针锋相对却彼此暗自佩服。',
    ],
  },
  // ═══ 恶意互动 ═══
  {
    type: 'provoke', intent: 'hostile', baseWeight: 12, affectionDelta: -5,
    symmetric: false,
    personalityMod: { bold: 1.6, cunning: 1.4, aloof: 1.3, kind: 0.1, gentle: 0.2 },
    detailTemplates: [
      '{A}出言挑衅{B}，{B}怒目而视。',
      '{A}当众揭{B}的短处，引得围观众人窃窃私语。',
    ],
  },
  {
    type: 'brawl', intent: 'hostile', baseWeight: 8, affectionDelta: -8, expGain: 10,
    symmetric: true,
    personalityMod: { bold: 2.0, aloof: 1.2, upright: 1.1, kind: 0.05, gentle: 0.1 },
    detailTemplates: [
      '{A}与{B}一言不合大打出手！',
      '{A}将{B}打翻在地，{B}负伤而逃。',
    ],
  },
  {
    type: 'ambush', intent: 'hostile', baseWeight: 5, affectionDelta: -12,
    symmetric: false,
    personalityMod: { cunning: 2.5, aloof: 1.2, bold: 0.8, upright: 0.0, kind: 0.0 },
    detailTemplates: [
      '{A}趁{B}不备暗中出手，{B}被偷袭受伤！',
      '夜深人静，{A}悄悄潜入{B}住处暗算……',
    ],
  },
  {
    type: 'slander', intent: 'hostile', baseWeight: 6, affectionDelta: -7,
    symmetric: false,
    personalityMod: { cunning: 2.5, aloof: 1.4, bold: 0.8, upright: 0.0, kind: 0.0 },
    detailTemplates: [
      '{A}四处散布关于{B}的不利言论。',
      '江湖上传出{B}的丑闻，据说始作俑者是{A}……',
    ],
  },
  {
    type: 'loot', intent: 'hostile', baseWeight: 4, affectionDelta: -15,
    symmetric: false,
    personalityMod: { cunning: 2.0, bold: 1.5, aloof: 1.0, upright: 0.0, kind: 0.0, gentle: 0.0 },
    detailTemplates: [
      '{A}趁{B}一时疏忽，抢走了{B}的宝物！',
      '{A}以切磋为名设下圈套，骗走了{B}的一件法器。',
    ],
  },
  {
    type: 'revenge', intent: 'hostile', baseWeight: 3, affectionDelta: -10, expGain: 15,
    requiredAffectionMax: -60,
    symmetric: false,
    personalityMod: { bold: 2.0, upright: 1.8, aloof: 1.6, cunning: 1.2, kind: 0.5, gentle: 0.3 },
    detailTemplates: [
      '{A}寻仇而来，与{B}展开殊死搏斗！',
      '积怨已久，{A}终于找到{B}，与之一决高下。',
    ],
  },
];

// ──── 阵营兼容（用于互动倾向判定） ────

/** 阵营兼容：同道 或 同邪 视为兼容 */
function areAlignmentsCompatible(a: FactionAlignment, b: FactionAlignment): boolean {
  const righteousSet: FactionAlignment[] = ['righteous', 'neutral'];
  const chaoticSet: FactionAlignment[] = ['chaotic'];
  if (righteousSet.includes(a) && righteousSet.includes(b)) return true;
  if (chaoticSet.includes(a) && chaoticSet.includes(b)) return true;
  return false;
}

function areAlignmentsOpposite(a: FactionAlignment, b: FactionAlignment): boolean {
  const righteousSide: FactionAlignment[] = ['righteous', 'neutral'];
  const darkSide: FactionAlignment[] = ['chaotic'];
  return (righteousSide.includes(a) && darkSide.includes(b)) ||
         (darkSide.includes(a) && righteousSide.includes(b));
}

// ──── 核心互动模拟 ────

export interface NpcInteractionResult {
  npcA: string;
  npcAName: string;
  npcB: string;
  npcBName: string;
  type: NpcInteractionType;
  intent: InteractionIntent;
  detail: string;
  affectionDelta: number;
}

/**
 * 在同一地点的 NPC 之间触发随机互动
 * 使用：性格 × 阵营 × 友好度 多因素加权决定互动概率和类型
 */
export function tickNpcToNpcInteractions(): NpcInteractionResult[] {
  const p = getPlayer();
  if (!p.npcDatabase) return [];

  const results: NpcInteractionResult[] = [];
  const npcs = Object.values(p.npcDatabase);

  // 按地点分组
  const byLocation = new Map<string, NpcStats[]>();
  for (const npc of npcs) {
    const locId = npc.currentLocationId ?? 'wudang_mountain';
    if (!byLocation.has(locId)) byLocation.set(locId, []);
    byLocation.get(locId)!.push(npc);
  }

  for (const [, group] of byLocation) {
    if (group.length < 2) continue;
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const npcA = group[i]!, npcB = group[j]!;

        // ── 计算互动概率 ──
        const aPers = npcA.personality ?? 'gentle';
        const aAlign = (SECTS[npcA.sect]?.alignment ?? 'neutral') as FactionAlignment;
        const bAlign = (SECTS[npcB.sect]?.alignment ?? 'neutral') as FactionAlignment;
        const pairAff = getNpcPairAffection(npcA.id, npcB.id);

        // 性格驱动的发起概率
        const persProbMod: Record<NpcPersonality, number> = {
          bold: 0.18, kind: 0.16, gentle: 0.14, cunning: 0.15, upright: 0.11, aloof: 0.08,
        };
        const aProb = persProbMod[aPers] ?? 0.12;

        // 同门加成
        const sameSectBonus = npcA.sect === npcB.sect ? 1.3 : 1.0;

        // 阵营对立驱动更高互动率（正邪碰面更易擦出火花）
        const oppositeAlignBonus = areAlignmentsOpposite(aAlign, bAlign) ? 1.3 : 1.0;

        // 友好度过高或过低增加互动率
        const absAff = Math.abs(pairAff);
        const affinityBonus = absAff >= 60 ? 1.3 : absAff >= 30 ? 1.1 : 1.0;

        const prob = Math.min(0.35, aProb * sameSectBonus * oppositeAlignBonus * affinityBonus);

        if (Math.random() > prob) continue;

        const result = simulateNpcPairInteraction(npcA, npcB, pairAff);
        if (result) {
          // 写入 NPC 间友好度变更
          if (result.affectionDelta !== 0) {
            changeNpcPairAffection(npcA.id, npcB.id, result.affectionDelta);
          }
          // 写入双方近期经历
          const typeLabel = getInteractionTypeLabel(result.type);
          const logEntry = `与${npcB.name}${typeLabel}`;
          const logEntryB = `与${npcA.name}${typeLabel}`;
          appendNpcLogInternal(npcA.id, logEntry);
          appendNpcLogInternal(npcB.id, logEntryB);

          // 自动关系标签检测（好友/仇敌）
          const newAff = getNpcPairAffection(npcA.id, npcB.id);
          const relationTag = getNpcNpcRelationTag(newAff);
          const prevAff = pairAff; // 交互前的好感度
          const prevTag = getNpcNpcRelationTag(prevAff);
          if (relationTag !== prevTag) {
            if (relationTag === 'friend') {
              appendNpcLogInternal(npcA.id, `与${npcB.name}结为好友`);
              appendNpcLogInternal(npcB.id, `与${npcA.name}结为好友`);
            } else if (relationTag === 'enemy') {
              appendNpcLogInternal(npcA.id, `与${npcB.name}反目成仇`);
              appendNpcLogInternal(npcB.id, `与${npcA.name}反目成仇`);
            } else if (prevTag === 'friend' && relationTag === null) {
              appendNpcLogInternal(npcA.id, `与${npcB.name}情谊渐浅`);
              appendNpcLogInternal(npcB.id, `与${npcA.name}情谊渐浅`);
            } else if (prevTag === 'enemy' && relationTag === null) {
              appendNpcLogInternal(npcA.id, `与${npcB.name}关系缓和`);
              appendNpcLogInternal(npcB.id, `与${npcA.name}关系缓和`);
            }
          }

          results.push(result);
        }
      }
    }
  }

  return results;
}

function simulateNpcPairInteraction(
  a: NpcStats, b: NpcStats, currentAff: number,
): NpcInteractionResult | null {
  const aPers = a.personality ?? 'gentle';
  const aAlign = (SECTS[a.sect]?.alignment ?? 'neutral') as FactionAlignment;
  const bAlign = (SECTS[b.sect]?.alignment ?? 'neutral') as FactionAlignment;

  // ── 1. 确定互动意图（善意/中立/恶意） ──
  const intent = determineIntent(aPers, aAlign, bAlign, currentAff);

  // 过滤符合意图 + 阵营门槛的动作
  const candidates = INTERACTION_ACTIONS.filter(act => {
    if (act.intent !== intent) return false;
    // 阵营门槛
    if (act.alignmentGate === 'same' && !areAlignmentsCompatible(aAlign, bAlign)) return false;
    if (act.alignmentGate === 'opposite' && !areAlignmentsOpposite(aAlign, bAlign)) return false;
    // 友好度门槛
    if (act.requiredAffectionMin !== undefined && currentAff < act.requiredAffectionMin) return false;
    if (act.requiredAffectionMax !== undefined && currentAff > act.requiredAffectionMax) return false;
    // guide 仅高等级→低等级
    if (act.type === 'guide' && a.level <= b.level) return false;
    return true;
  });

  if (candidates.length === 0) return null;

  // ── 2. 加权随机抽取 ──
  const weights = candidates.map(act => {
    const persMod = act.personalityMod[aPers] ?? 1.0;
    return act.baseWeight * persMod;
  });
  const totalW = weights.reduce((s, w) => s + w, 0);
  let r = Math.random() * totalW;
  let chosenIdx = 0;
  for (let k = 0; k < weights.length; k++) {
    r -= weights[k]!;
    if (r <= 0) { chosenIdx = k; break; }
  }
  const action = candidates[chosenIdx]!;

  // ── 3. 生成详情 ──
  const template = action.detailTemplates[Math.floor(Math.random() * action.detailTemplates.length)]!;
  const detail = template.replace(/\{A\}/g, a.name).replace(/\{B\}/g, b.name);

  // ── 4. 结算 ──
  const affectionDelta = action.symmetric
    ? action.affectionDelta
    : action.affectionDelta; // 非对称互动，affectionDelta 直接应用

  // 切磋类互动给予经验
  if (action.expGain && action.intent !== 'hostile') {
    a.exp += action.expGain;
    b.exp += Math.floor(action.expGain * 0.7);
  }

  return {
    npcA: a.id, npcAName: a.name,
    npcB: b.id, npcBName: b.name,
    type: action.type,
    intent: action.intent,
    detail,
    affectionDelta,
  };
}

// ──── 意图判定逻辑 ────

function determineIntent(
  pers: NpcPersonality,
  aAlign: FactionAlignment,
  bAlign: FactionAlignment,
  currentAff: number,
): InteractionIntent {
  // 友好度主导：友好则强制善意，敌对则恶意倾向
  if (currentAff >= 30) {
    // 友好 NPC 间 95% 善意
    return Math.random() < 0.95 ? 'benevolent' : 'neutral';
  }
  if (currentAff <= -30) {
    // 敌对 NPC 间 80% 恶意
    return Math.random() < 0.80 ? 'hostile' : 'neutral';
  }

  // 阵营对立驱动恶意
  const opposite = areAlignmentsOpposite(aAlign, bAlign);
  // 性格驱动
  const hostilePersonalities: NpcPersonality[] = ['bold', 'cunning', 'aloof'];
  const benevolentPersonalities: NpcPersonality[] = ['kind', 'gentle', 'upright'];

  let hostileW = opposite ? 0.30 : 0.10;
  let benevolentW = 0.50;
  let neutralW = 1.0;

  if (hostilePersonalities.includes(pers)) hostileW *= 1.8;
  if (benevolentPersonalities.includes(pers)) benevolentW *= 1.5;

  // 与邪道/混乱 NPC 互动时恶意权重增加
  if (bAlign === 'chaotic') hostileW *= 1.4;

  const total = hostileW + benevolentW + neutralW;
  const r = Math.random() * total;
  if (r < hostileW) return 'hostile';
  if (r < hostileW + benevolentW) return 'benevolent';
  return 'neutral';
}

/** 互动类型 → 简短中文标签（用于日志） */
function getInteractionTypeLabel(type: NpcInteractionType): string {
  const map: Record<NpcInteractionType, string> = {
    talk: '交谈', gift: '赠礼', guide: '指点', help: '相助', tea: '品茶', friendly_spar: '切磋',
    info_exchange: '交换情报', trade: '交易', debate: '论道',
    provoke: '挑衅', brawl: '激斗', ambush: '暗算', slander: '谣言', loot: '夺宝', revenge: '复仇',
  };
  return map[type] ?? type;
}

// ──── NPC 近期经历日志 ────

/** 向 NPC 的 recentLog 追加一条记录（最多保留 20 条） */
export function appendNpcLog(npcId: string, entry: string): void {
  appendNpcLogInternal(npcId, entry);
}

function appendNpcLogInternal(npcId: string, entry: string): void {
  const p = getPlayer();
  const db = p.npcDatabase;
  if (!db?.[npcId]) return;
  const npc = db[npcId]!;
  const oldLog = npc.recentLog ?? [];
  // 去重：跳过与上一条相同的记录
  if (oldLog.length > 0 && oldLog[oldLog.length - 1] === entry) return;
  const log = [...oldLog, entry].slice(-20);
  setPlayer({ ...p, npcDatabase: { ...db, [npcId]: { ...npc, recentLog: log } } });
}