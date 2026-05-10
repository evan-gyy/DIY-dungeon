// ============================================================
//  src/systems/MissionSystem.ts — 沙盒任务系统引擎
// ============================================================
//  负责：任务池、接取/放弃/完成/进度更新逻辑
//  关联：MissionPanel.ts (UI)、StoryPanel.ts (日常行动触发进度)
// ============================================================

import type {
  MissionDef,
  ActiveMission,
  MissionStatus,
  DiscipleRank,
} from '../data/sandboxTypes';
import { DISCIPLE_RANK_ORDER, MAX_ACTIVE_MISSIONS } from '../data/sandboxTypes';
import type { LocationId } from '../data/worldMap';
import { getPlayer, setPlayer } from '../state/GameState';
import { saveGame } from '../state/SaveSystem';
import { ALL_COURT_MISSIONS } from './CourtMissionPool';

export const MISSION_POOL: MissionDef[] = [
  // ═══ 战斗类 ═══
  {
    id: 'm_bandit_xyr',
    title: '剿灭襄阳山贼',
    type: 'combat',
    difficulty: 'easy',
    description: '襄阳城外清风岭一伙山贼劫掠过往商贾，武当弟子当替天行道。',
    issuer: 'wudang',
    minRank: 'outer',
    targetLocation: 'xiangyang_city' as LocationId,
    progressMax: 3,
    rewardContribution: 30,
    rewardExp: 40,
    rewardGold: 15,
  },
  {
    id: 'm_bandit_jlr',
    title: '江陵护卫商队',
    type: 'combat',
    difficulty: 'easy',
    description: '护送江陵城南通往峨眉的商队，途中有水匪出没。',
    issuer: 'wudang',
    minRank: 'outer',
    targetLocation: 'jiangling_city' as LocationId,
    progressMax: 3,
    rewardContribution: 25,
    rewardExp: 35,
    rewardGold: 12,
  },
  {
    id: 'm_hunt_fugitive',
    title: '追捕采花大盗',
    type: 'combat',
    difficulty: 'normal',
    description: '洛阳知府悬赏捉拿采花大盗"花蝴蝶"，此人轻功了得，藏身于洛阳城西。',
    issuer: 'wudang',
    minRank: 'inner',
    targetLocation: 'luoyang_city' as LocationId,
    progressMax: 1,
    rewardContribution: 80,
    rewardExp: 100,
    rewardGold: 50,
  },
  {
    id: 'm_beggar_thugs',
    title: '援助丐帮分舵',
    type: 'combat',
    difficulty: 'normal',
    description: '丐帮襄阳分舵被地痞恶霸骚扰，帮众受伤不轻，需武林同道援助。',
    issuer: 'wudang',
    minRank: 'inner',
    targetLocation: 'beggar_hq' as LocationId,
    progressMax: 5,
    rewardContribution: 60,
    rewardExp: 80,
    rewardGold: 30,
  },
  {
    id: 'm_demon_scout',
    title: '清除魔教探子',
    type: 'combat',
    difficulty: 'hard',
    description: '暗探来报，魔教在开封城安插了若干探子，意图窃取正道门派情报。',
    issuer: 'wudang',
    minRank: 'true',
    targetLocation: 'kaifeng_city' as LocationId,
    progressMax: 3,
    rewardContribution: 150,
    rewardExp: 200,
    rewardGold: 80,
  },
  {
    id: 'm_sword_rival',
    title: '华山论剑之约',
    type: 'combat',
    difficulty: 'hard',
    description: '华山派剑宗高手在长安设下擂台，邀天下英雄论剑。胜者可扬名立万。',
    issuer: 'huashan',
    minRank: 'true',
    targetLocation: 'changan_city' as LocationId,
    progressMax: 1,
    rewardContribution: 200,
    rewardExp: 250,
    rewardGold: 100,
  },

  // ═══ 采集类 ═══
  {
    id: 'm_gather_herbs',
    title: '采集还魂草',
    type: 'gather',
    difficulty: 'easy',
    description: '武当丹药房急需一批还魂草用于炼制疗伤丹药，请前往峨眉山采集。',
    issuer: 'wudang',
    minRank: 'outer',
    targetLocation: 'emei_mountain' as LocationId,
    progressMax: 5,
    rewardContribution: 25,
    rewardExp: 30,
    rewardGold: 10,
  },
  {
    id: 'm_gather_ore',
    title: '寻找玄铁矿石',
    type: 'gather',
    difficulty: 'normal',
    description: '铸造房需要玄铁矿石打造一批新兵器，据说成都府路附近有矿脉。',
    issuer: 'wudang',
    minRank: 'inner',
    targetLocation: 'chengdu_city' as LocationId,
    progressMax: 4,
    rewardContribution: 50,
    rewardExp: 60,
    rewardGold: 25,
  },
  {
    id: 'm_gather_lingzhi',
    title: '千年灵芝',
    type: 'gather',
    difficulty: 'hard',
    description: '传闻大理国深山中有千年灵芝，可炼制增长功力的丹药。路途遥远，需谨慎行事。',
    issuer: 'wudang',
    minRank: 'true',
    targetLocation: 'dali_city' as LocationId,
    progressMax: 1,
    rewardContribution: 180,
    rewardExp: 220,
    rewardGold: 120,
  },

  // ═══ 探查类 ═══
  {
    id: 'm_invest_hostel',
    title: '探查可疑客栈',
    type: 'investigate',
    difficulty: 'easy',
    description: '扬州城悦来客栈近日有陌生人频繁出入，举止可疑，请前往探查虚实。',
    issuer: 'wudang',
    minRank: 'outer',
    targetLocation: 'yangzhou_city' as LocationId,
    progressMax: 3,
    rewardContribution: 35,
    rewardExp: 45,
    rewardGold: 20,
  },
  {
    id: 'm_invest_missing',
    title: '调查少林弟子失踪',
    type: 'investigate',
    difficulty: 'normal',
    description: '少林寺日前三名俗家弟子外出后音讯全无，最后出现地点在苏州。',
    issuer: 'shaolin',
    minRank: 'inner',
    targetLocation: 'suzhou_city' as LocationId,
    progressMax: 5,
    rewardContribution: 100,
    rewardExp: 120,
    rewardGold: 60,
  },

  // ═══ 传功类 ═══
  {
    id: 'm_teach_outer',
    title: '指导外门师弟',
    type: 'teach',
    difficulty: 'easy',
    description: '武当新收一批外门弟子无人指点，请抽出时间指点他们基本功。',
    issuer: 'wudang',
    minRank: 'inner',
    progressMax: 3,
    rewardContribution: 40,
    rewardExp: 50,
    rewardGold: 0,
  },
  {
    id: 'm_teach_sword',
    title: '传授剑法基础',
    type: 'teach',
    difficulty: 'normal',
    description: '内门弟子中有一批人剑法根基薄弱，需真传弟子亲授武当剑法入门。',
    issuer: 'wudang',
    minRank: 'true',
    progressMax: 5,
    rewardContribution: 80,
    rewardExp: 100,
    rewardGold: 0,
  },

  // ═══ 外交类 ═══
  {
    id: 'm_diplo_visit',
    title: '拜访少林高僧',
    type: 'diplomacy',
    difficulty: 'easy',
    description: '代掌门前往少林寺，与方丈大师商议下月联合法会事宜。',
    issuer: 'wudang',
    minRank: 'inner',
    targetLocation: 'shaolin_temple' as LocationId,
    progressMax: 1,
    rewardContribution: 60,
    rewardExp: 50,
    rewardGold: 30,
  },
  {
    id: 'm_diplo_mediate',
    title: '调解丐帮纠纷',
    type: 'diplomacy',
    difficulty: 'hard',
    description: '丐帮内部净衣派与污衣派近日矛盾激化，需德高望重之人居间调停。',
    issuer: 'beggar',
    minRank: 'elder',
    targetLocation: 'beggar_hq' as LocationId,
    progressMax: 1,
    rewardContribution: 250,
    rewardExp: 300,
    rewardGold: 150,
  },
];

/** 合并全部任务池（宗门 + 朝廷） */
const ALL_MISSIONS: MissionDef[] = [...MISSION_POOL, ...ALL_COURT_MISSIONS];

// ──── 核心操作 ────

/**
 * 获取玩家当前可接取的任务列表。
 * 筛选条件：rank 达标、未接取、未完成、有空位。
 * 朝廷任务额外检查 courtRank 和 courtPath。
 */
export function getAvailableMissions(): MissionDef[] {
  const p = getPlayer();
  const rankIdx = DISCIPLE_RANK_ORDER.indexOf((p.discipleRank || 'outer') as DiscipleRank);
  const activeIds = new Set(
    (p.activeMissions || []).filter(m => m.status === 'accepted').map(m => m.defId)
  );

  // 朝廷品阶索引
  const courtRankIdx = [
    'commoner', 'xiucai', 'juren', 'jinshi', 'hanlin', 'shangshu', 'zaixiang',
  ].indexOf(p.courtRank || 'commoner');

  return ALL_MISSIONS.filter(def => {
    // 已接取，不重复显示
    if (activeIds.has(def.id)) return false;
    // rank 要求
    if (def.minRank) {
      const reqIdx = DISCIPLE_RANK_ORDER.indexOf(def.minRank);
      if (rankIdx < reqIdx) return false;
    }
    // level 要求
    if (def.minLevel && p.level < def.minLevel) return false;
    // 朝廷任务专属筛选
    if (def.requireCourtRank) {
      const reqIdx = [
        'commoner', 'xiucai', 'juren', 'jinshi', 'hanlin', 'shangshu', 'zaixiang',
      ].indexOf(def.requireCourtRank);
      if (courtRankIdx < reqIdx) return false;
    }
    if (def.courtPath && def.courtPath !== (p.courtPath || null)) return false;
    return true;
  });
}

/**
 * 接取任务。
 */
export function acceptMission(defId: string): { success: boolean; message: string } {
  const p = getPlayer();
  const missions = p.activeMissions || [];

  // 检查是否已满
  const activeCount = missions.filter(m => m.status === 'accepted').length;
  if (activeCount >= MAX_ACTIVE_MISSIONS) {
    return { success: false, message: `最多同时接取 ${MAX_ACTIVE_MISSIONS} 个任务，请先完成或放弃已有任务。` };
  }

  // 检查是否已接取
  if (missions.some(m => m.defId === defId && m.status === 'accepted')) {
    return { success: false, message: '该任务已接取，请勿重复接取。' };
  }

  const def = ALL_MISSIONS.find(d => d.id === defId);
  if (!def) {
    return { success: false, message: '任务不存在。' };
  }

  const newMission: ActiveMission = {
    defId: def.id,
    status: 'accepted' as MissionStatus,
    acceptedAt: Date.now(),
    progress: 0,
    progressMax: def.progressMax,
  };

  const updated = { ...p, activeMissions: [...missions, newMission] };
  setPlayer(updated);
  saveGame(updated);
  return { success: true, message: `接取任务【${def.title}】成功！` };
}

/**
 * 放弃任务（扣除 5 点贡献值作为惩罚）。
 */
export function abandonMission(index: number): { success: boolean; message: string } {
  const p = getPlayer();
  const missions = [...(p.activeMissions || [])];

  if (index < 0 || index >= missions.length) {
    return { success: false, message: '任务不存在。' };
  }

  const m = missions[index];
  if (!m || m.status !== 'accepted') {
    return { success: false, message: '该任务已结束，无法放弃。' };
  }

  const def = ALL_MISSIONS.find(d => d.id === m.defId);
  const title = def?.title ?? m.defId;
  const penalty = 5;

  missions.splice(index, 1);
  const updated = {
    ...p,
    activeMissions: missions,
    sectContribution: Math.max(0, (p.sectContribution || 0) - penalty),
  };
  setPlayer(updated);
  saveGame(updated);

  return {
    success: true,
    message: `已放弃任务【${title}】（扣除 ${penalty} 贡献值）`,
  };
}

/**
 * 尝试完成任务（需在目标地点）。
 * 部分任务（teach 类）不需要地点。
 */
export function completeMission(index: number): { success: boolean; message: string } {
  const p = getPlayer();
  const missions = [...(p.activeMissions || [])];

  if (index < 0 || index >= missions.length) {
    return { success: false, message: '任务不存在。' };
  }

  const m = missions[index];
  if (!m || m.status !== 'accepted') {
    return { success: false, message: '该任务已结束。' };
  }

  const def = ALL_MISSIONS.find(d => d.id === m.defId);
  if (!def) {
    return { success: false, message: '任务定义丢失，请放弃后重试。' };
  }

  // 进度检查
  if (m.progress < m.progressMax) {
    return {
      success: false,
      message: `任务进度不足（${m.progress}/${m.progressMax}），请前往${def.targetLocation ? '目标地点' : '武当'}继续执行。`,
    };
  }

  // 地点检查（teach 类不需要地点）
  if (def.targetLocation && def.type !== 'teach') {
    const currentLoc = p.currentLocationId ?? 'wudang_mountain';
    if (currentLoc !== def.targetLocation) {
      return { success: false, message: `需要前往目标地点再完成任务。` };
    }
  }

  // 发放奖励
  const influenceGain = def.rewardInfluence || 0;
  missions[index] = {
    defId: m.defId,
    status: 'completed' as MissionStatus,
    acceptedAt: m.acceptedAt,
    progress: m.progress,
    progressMax: m.progressMax,
  };
  const updated = {
    ...p,
    activeMissions: missions,
    exp: p.exp + def.rewardExp,
    gold: p.gold + def.rewardGold,
    sectContribution: (p.sectContribution || 0) + def.rewardContribution,
    influence: (p.influence || 0) + influenceGain,
  };
  setPlayer(updated);
  saveGame(updated);

  const influenceMsg = influenceGain > 0 ? ` 影响力+${influenceGain}` : '';
  return {
    success: true,
    message: `完成【${def.title}】！获得贡献+${def.rewardContribution} 经验+${def.rewardExp} 金币+${def.rewardGold}${influenceMsg}`,
  };
}

/**
 * 更新任务进度（由外部行动触发）。
 * - 'daily_action': 日常任务（采集/修炼等），推进 gather/teach 类任务
 * - 'combat': 战斗胜利，推进 combat 类任务
 * - 'travel': 到达目标地点，推进 investigate/diplomacy 类任务
 */
export function updateMissionProgress(
  trigger: 'daily_action' | 'combat' | 'travel',
  locationId?: string,
  amount = 1,
): void {
  const p = getPlayer();
  const missions = (p.activeMissions || []);
  let changed = false;
  const loc = locationId ?? p.currentLocationId ?? '';

  const newMissions = missions.map(m => {
    if (m.status !== 'accepted') return m;
    if (m.progress >= m.progressMax) return m;

    const def = ALL_MISSIONS.find(d => d.id === m.defId);
    if (!def) return m;

    let shouldProgress = false;

    switch (trigger) {
      case 'daily_action':
        // 日常行动推进 gather/teach/special 类任务（需在目标地点或无地点限制）
        if (def.type === 'gather' || def.type === 'teach' || def.type === 'special') {
          if (!def.targetLocation || loc === def.targetLocation) {
            shouldProgress = true;
          }
        }
        break;
      case 'combat':
        // 战斗推进 combat/escort 类任务
        if (def.type === 'combat' || def.type === 'escort') {
          if (!def.targetLocation || loc === def.targetLocation) {
            shouldProgress = true;
          }
        }
        break;
      case 'travel':
        // 到达地点推进 investigate/diplomacy/special 类任务
        if ((def.type === 'investigate' || def.type === 'diplomacy' || def.type === 'special') && def.targetLocation === loc) {
          shouldProgress = true;
        }
        break;
    }

    if (shouldProgress) {
      changed = true;
      return { ...m, progress: Math.min(m.progress + amount, m.progressMax) };
    }
    return m;
  });

  if (changed) {
    const updated = { ...p, activeMissions: newMissions };
    setPlayer(updated);
    saveGame(updated);
  }
}

/**
 * 根据 defId 查找任务定义。
 */
export function getMissionDef(defId: string): MissionDef | undefined {
  return ALL_MISSIONS.find(d => d.id === defId);
}

/**
 * 格式化进度显示的辅助函数。
 */
export function formatProgress(progress: number, max: number): string {
  const pct = max > 0 ? Math.round((progress / max) * 100) : 0;
  const barLen = 10;
  const filled = Math.round((progress / max) * barLen) || 0;
  const empty = barLen - filled;
  return `[${'█'.repeat(filled)}${'░'.repeat(empty)}] ${pct}%`;
}

/**
 * 获取任务类型图标。
 */
export function getMissionTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    combat: '⚔️',
    escort: '🛡️',
    gather: '🌿',
    investigate: '🔍',
    teach: '📖',
    diplomacy: '🤝',
    special: '✨',
  };
  return icons[type] ?? '📋';
}

/**
 * 获取难度标签。
 */
export function getDifficultyLabel(difficulty: string): string {
  const labels: Record<string, string> = {
    easy: '简单',
    normal: '普通',
    hard: '困难',
    legendary: '传说',
  };
  return labels[difficulty] ?? difficulty;
}
