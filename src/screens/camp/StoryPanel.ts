import { getPlayer, setPlayer } from '../../state/GameState';
import { saveGame } from '../../state/SaveSystem';
import { NPC_DIALOGS } from '../../data/npcs';
import { getChapter } from '../../data/chapters/index';
import { showToast } from '../../ui/toast';
import { openDialog } from '../DialogScreen';
import { enterCamp, switchCampTab, renderSidebar, advanceTurn } from '../Camp';
import { checkLevelUp, getRealmName } from '../../state/LevelSystem';
import { calculateFinalStats } from '../../data/realmConfig';
import { WORLD_MAP, type LocationId, type LocationAction, type TaskBattleConfig, type TaskCourtConfig } from '../../data/worldMap';
import { changeNpcAffection } from './RelationPanel';
import { syncSlotsOnPromotion } from '../../systems/NPCManager';
import { updateMissionProgress, getMissionDef } from '../../systems/MissionSystem';
import { tickFactionDiplomacy } from '../../systems/FactionSystem';
import { tickWorldState, contributeToFaction, addChronicleEntry, joinSect } from '../../systems/WorldState';
import { tryTriggerEncounter } from '../../systems/EncounterSystem';
import { getActiveDirectivesForPlayer, type ActiveDirectiveView } from '../../systems/FactionAI';
import type { DiscipleRank, SettlementAttributes } from '../../data/sandboxTypes';
import { COURT_RANK_ORDER, COURT_RANK_LABEL, DIRECTIVE_LABEL, COMBAT_STAT_LABEL, COURT_STAT_LABEL, type CourtRank, type FactionDirectiveType } from '../../data/sandboxTypes';
import type { CampScene } from '../../data/chapters/types';
import type { SkillId } from '../../data/types';
import { grantPlayerStatExp } from '../../systems/ActionSystem';
import { getEffectiveCourtStats } from '../../systems/CourtSystem';
import { getStealTargetAtLocation, canAttemptSteal } from '../../systems/StealSkillSystem';
import { getAvailableBounties, acceptBounty, abandonBounty, checkBountyCompletion, getDifficultyLabel, completeBounty } from '../../systems/BountySystem';
import { checkCoupEligibility, executeCoup, completeCoupBattle } from '../../systems/PlayerUsurpation';
import { isSectBase } from '../../systems/SectManagement';
import type { MissionTrack } from '../../data/sandboxTypes';
import { getSettlementActions, executeSettlementAction, getLocationRelation } from '../../systems/SettlementActions';

/** 🆕 剧情晋升时同步更新 NPC 收纳槽位 */
function withRankSync(player: ReturnType<typeof getPlayer>, newRank: DiscipleRank) {
  const newMaxSlots = syncSlotsOnPromotion(player, newRank);
  return player.npcCollection
    ? { ...player.npcCollection, maxSlots: newMaxSlots }
    : { recruited: [], maxSlots: newMaxSlots, assignments: {}, assignmentTargets: {} };
}

/** 共通奖励结算 + 回合推进（非战斗/非政务任务的快捷路径，以及战斗/政务成功后的回调） */
function applyTaskRewards(action: LocationAction, rewardMul: number = 1, courtDc: number = 10, testedStat?: keyof typeof COURT_STAT_LABEL): void {
  const p = getPlayer();
  const locId = p.currentLocationId ?? 'wudang_mountain';
  const settlement = (p.settlementState ?? {})[locId];

  // 武学圣地加成：据点武学值越高，修炼效率越高
  const ma = settlement?.martialArts ?? 0;
  const locationBonus = ma >= 85 ? 2.0 : ma >= 70 ? 1.5 : ma >= 40 ? 1.15 : 1.0;
  const totalMul = rewardMul * locationBonus;

  const contrib = Math.floor((action.contribution ?? 0) * rewardMul);
  const influenceGain = Math.floor((action.influence ?? 0) * rewardMul);
  const expGain = Math.floor(action.exp * totalMul);
  const goldGain = Math.floor(action.gold * rewardMul);

  const updated = {
    ...p,
    exp: p.exp + expGain,
    gold: p.gold + goldGain,
    sectContribution: (p.sectContribution ?? 0) + contrib,
    influence: (p.influence ?? 0) + influenceGain,
    contributionLog: [
      ...(p.contributionLog ?? []),
      { amount: contrib, source: 'daily_task' as const, reason: action.name, timestamp: Date.now() },
    ],
  };

  // ── statExp 成长：根据任务类型授予战斗/朝廷属性经验 ──
  const hasBattle = !!action.battleConfig;
  const hasCourt = !!action.courtConfig;
  if (hasCourt) {
    // 政务任务：经验值与任务难度（DC）挂钩
    // DC越高 → 经验越多。公式: dc * 20 * rewardMul
    // 例如 DC10 成功 = 200 exp/主属性，DC20 = 400 exp/主属性
    const baseExp = Math.round(courtDc * 20 * rewardMul);
    // 检定属性获得全额经验，其他属性获得 40% 经验
    const offExp = Math.round(baseExp * 0.4);
    const courtExp: Record<string, number> = {
      strategy: offExp, eloquence: offExp, charisma: offExp, scholarship: offExp,
    };
    if (testedStat && courtExp[testedStat] !== undefined) {
      courtExp[testedStat] = baseExp;
    }
    const levelUps = grantPlayerStatExp({
      combat: {},
      court: {
        strategy: courtExp.strategy ?? offExp,
        eloquence: courtExp.eloquence ?? offExp,
        charisma: courtExp.charisma ?? offExp,
        scholarship: courtExp.scholarship ?? offExp,
      },
    });
    if (levelUps.court.length > 0) {
      setTimeout(() => {
        const labels = levelUps.court.map(s => COURT_STAT_LABEL[s] ?? s).join('、');
        showToast(`📈 朝堂历练让${labels}提升！`);
      }, 800);
    }
  } else if (hasBattle) {
    // 战斗任务：侧重战斗属性成长，武学圣地加成
    const diffMap: Record<string, number> = { easy: 5, normal: 10, hard: 15 };
    const diffNum = diffMap[action.battleConfig!.difficulty] ?? 10;
    const baseExp = Math.round(diffNum * 5 * totalMul);
    const levelUps = grantPlayerStatExp({
      combat: { atk: baseExp, def: baseExp, agi: baseExp, crit: baseExp },
      court: {},
    });
    if (levelUps.combat.length > 0) {
      setTimeout(() => {
        const labels = levelUps.combat.map(s => COMBAT_STAT_LABEL[s] ?? s).join('、');
        showToast(`⚔️ 实战磨砺让${labels}提升！`);
      }, 800);
    }
  } else {
    // 普通日常：微量双修经验，武学圣地加成
    const baseExp = Math.round(3 * totalMul);
    grantPlayerStatExp({
      combat: { atk: baseExp, def: baseExp, agi: baseExp, crit: baseExp },
      court: { strategy: Math.round(baseExp / 2), eloquence: Math.round(baseExp / 2), charisma: Math.round(baseExp / 2), scholarship: Math.round(baseExp / 2) },
    });
  }

  // 武学圣地加成提示
  if (locationBonus > 1.0) {
    const locName = WORLD_MAP[locId]?.name ?? '此地';
    const bonusHint = locationBonus >= 2.0 ? `🔥 ${locName}武学通天，修行效率×2！`
      : locationBonus >= 1.5 ? `⚔️ ${locName}武学圣地，修行事半功倍！`
      : `📖 ${locName}尚武之风，修行略有助益。`;
    setTimeout(() => showToast(bonusHint), 1200);
  }

  // 重新获取更新后的 player（因为 grantPlayerStatExp 已经 setPlayer 了）
  const p2 = getPlayer();
  const lvResult = checkLevelUp(p2);
  const finalPlayer = lvResult.leveled ? lvResult.updatedPlayer : p2;
  setPlayer(finalPlayer);
  saveGame(finalPlayer);

  updateMissionProgress('daily_action', finalPlayer.currentLocationId);
  tickFactionDiplomacy();

  if (p.gameMode === 'sandbox') {
    const worldResult = tickWorldState();
    if (worldResult.isPending) {
      setTimeout(() => showToast(`⚡ 江湖有事待处理！前往【江湖态势】查看。`), 2000);
    } else if (worldResult.worldEvent?.showToPlayer) {
      setTimeout(() => showToast(`🌍 江湖要闻：${worldResult.worldEvent!.title}`), 2000);
    }
    addChronicleEntry({
      category: 'mission_complete',
      title: action.name,
      description: `在${WORLD_MAP[p.currentLocationId]?.name ?? '某地'}完成了${action.name}。${contrib > 0 ? `获得贡献 +${contrib}` : ''}${influenceGain > 0 ? `，影响力 +${influenceGain}` : ''}`,
      locationId: p.currentLocationId,
    });
    if (p.sect !== 'none' && contrib > 0) {
      contributeToFaction(p.sect, contrib);
    }
  }

  let msg = `${action.icon} ${action.name}完成！经验 +${expGain}`;
  if (goldGain > 0) msg += `，铜钱 +${goldGain}`;
  if (contrib > 0) msg += `，贡献 +${contrib}`;
  if (influenceGain > 0) msg += `，影响力 +${influenceGain}`;
  if (lvResult.leveled) {
    const realm = getRealmName(lvResult.newLevel);
    msg += `\n🎉 修为突破至 ${realm}！获得 ${lvResult.gainedPoints} 修为点！`;
  }
  showToast(msg);

  // 随机好感事件（仅门派日常）
  const rand = Math.random();
  if (action.id === 'chop_wood' && rand < 0.15) {
    changeNpcAffection('song_zhiyuan', 1);
    setTimeout(() => showToast('👤 宋知远偷懒被抓，讪笑着帮你劈了两捆柴。好感 +1'), 1500);
  } else if (action.id === 'carry_water' && rand < 0.15) {
    changeNpcAffection('gu_xiaosang', 1);
    setTimeout(() => showToast('💬 顾小桑路过，悄悄告诉你陆沉舟最近在打听你的事。好感 +1'), 1500);
  } else if (action.id === 'clean_hall' && rand < 0.15) {
    changeNpcAffection('zhang_xuansu', 1);
    setTimeout(() => showToast('☯️ 张玄素掌门路过，微微颔首："心静则尘净。"好感 +1'), 1500);
  } else if (action.id === 'copy_scripture' && rand < 0.15) {
    changeNpcAffection('chen_jingxu', 1);
    setTimeout(() => showToast('📖 陈静虚长老看到你的抄本，指点了几句。经验 +10，好感 +1'), 1500);
    const cur = getPlayer();
    const bonus = { ...cur, exp: cur.exp + 10 };
    setPlayer(bonus);
    saveGame(bonus);
  }

  advanceTurn();

  if (p.gameMode === 'sandbox') {
    const encounter = tryTriggerEncounter();
    if (encounter) {
      setTimeout(() => showEncounterDialog(encounter), 800);
    }
  }

  const content = document.getElementById('camp-content');
  if (content) renderStoryPanel(content);
}

/** 🆕 偷师：潜入异宗门派偷学技能 */
async function doStealSkill(targetSect: string): Promise<void> {
  const { executeSteal } = await import('../../systems/StealSkillSystem');
  const p = getPlayer();
  const result = executeSteal(p, targetSect as any);
  showToast(result.message);
  if (result.detected && result.penalty?.expelledFromSect) {
    showToast('你被逐出了宗门！');
  }
  saveGame(getPlayer());
  const content = document.getElementById('camp-content');
  if (content) renderStoryPanel(content);
}

async function doCoupAttempt(): Promise<void> {
  const result = executeCoup();
  showToast(result.message);
  if (result.enterBattle && result.battleEnemyId) {
    const { initCustomBattle } = await import('../../systems/BattleEngine');
    const { bus } = await import('../../ui/events');
    const handleEnd = ({ result: battleResult }: { result: string; expGain: number; goldGain: number; loot: string[] }) => {
      bus.off('battle:end', handleEnd as any);
      if (battleResult === 'win') {
        const coupResult = completeCoupBattle();
        showToast(coupResult.message);
      } else {
        showToast('败于掌门之手，夺权失败！');
      }
      saveGame(getPlayer());
      const content = document.getElementById('camp-content');
      if (content) { renderStoryPanel(content); renderSidebar(); }
    };
    bus.on('battle:end', handleEnd as any);
    const p = getPlayer();
    initCustomBattle([{
      id: result.battleEnemyId,
      name: result.battleEnemyName!,
      side: 'enemy' as const,
      hp: 150, maxHp: 150, mp: 60, maxMp: 60,
      atk: 22, def: 12, agi: 14, crit: 5,
      icon: '',
      skills: [],
      isPlayer: false,
      alive: true,
      enemyId: result.battleEnemyId as any,
      tier: 3,
      actions: [
        { name: '掌法攻击', icon: '👊', powerMul: 1.2, defPen: 0, hit: 95, mpCost: 0, weight: 2, effect: null },
        { name: '内功攻击', icon: '💨', powerMul: 1.0, defPen: 5, hit: 90, mpCost: 10, weight: 1, effect: null },
      ],
      reward: { exp: 80, gold: 200 },
      loot: [],
    }], [{
      id: 'player_main',
      name: p.name,
      side: 'ally',
      hp: p.hp, maxHp: p.maxHp, mp: p.mp, maxMp: p.maxMp,
      atk: p.atk, def: p.def, agi: p.agi, crit: p.crit,
      icon: p.charImg,
      skills: [...p.skills],
      isPlayer: true,
      alive: true,
    }]);
  }
  saveGame(getPlayer());
  const content = document.getElementById('camp-content');
  if (content) { renderStoryPanel(content); renderSidebar(); }
}

function doDailyTask(action: LocationAction): void {
  const p = getPlayer();

  if (action.id === 'sect_fabao_shop') {
    import('./FabaoShopUI').then(m => m.showSectShopOverlay());
    return;
  }
  if (action.id === 'city_fabao_shop') {
    import('./FabaoShopUI').then(m => m.showCityShopOverlay());
    return;
  }
  if (action.id === 'sect_learn_skill') {
    import('./SkillLearnOverlay').then(m => m.showSkillLearnOverlay());
    return;
  }
  if (action.id === 'join_sect' && action.sectTarget) {
    joinSect(action.sectTarget as any);
    showToast(`🏯 你拜入了${WORLD_MAP[p.currentLocationId]?.name ?? '宗门'}！`);
    addChronicleEntry({
      category: 'sect_join',
      title: '拜入师门',
      description: `正式成为${WORLD_MAP[p.currentLocationId]?.name ?? '某派'}弟子。`,
      locationId: p.currentLocationId,
    });
    const content = document.getElementById('camp-content');
    if (content) { renderStoryPanel(content); renderSidebar(); }
    return;
  }
  if (action.id === 'join_court') {
    showCourtPathChoice();
    return;
  }

  // 🆕 战斗型任务：进入战斗而非即时结算
  if (action.battleConfig) {
    showToast(`⚔️ 准备迎战！`);
    import('../../systems/TaskEnemyGenerator').then(m => {
      m.launchTaskBattle(action.battleConfig!).then(result => {
        if (result === 'win') {
          applyTaskRewards(action, 1.2); // 战斗胜利多加20%奖励
        } else {
          showToast('战斗失败，任务未能完成。休整后再试。');
          const content = document.getElementById('camp-content');
          if (content) renderStoryPanel(content);
        }
      });
    });
    return;
  }

  // 🆕 政务型任务：展示检定弹窗
  if (action.courtConfig) {
    showCourtTaskDialog(action);
    return;
  }

  // 普通任务：即时结算
  applyTaskRewards(action);
}

/** 执行动态据点行动（开发/破坏/中立） */
function doSettlementAction(actionId: string): void {
  const p = getPlayer();
  const locId = p.currentLocationId ?? 'wudang_mountain';
  const msg = executeSettlementAction(actionId, locId);
  showToast(msg);
  saveGame(getPlayer());
  const content = document.getElementById('camp-content');
  if (content) { renderStoryPanel(content); renderSidebar(); }
}

/** 获取玩家在当前据点的势力关系上下文 */
function getLocationContext(locId: LocationId): {
  relation: 'friendly' | 'neutral' | 'hostile';
  ownerLabel: string;
  ownerFaction: string;
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

  // 朝廷身份：朝廷领地视为友好
  if (owner === 'imperial_court' && p.courtRank !== 'commoner') {
    return { relation: 'friendly', ownerLabel: '朝廷领地', ownerFaction: owner };
  }

  // 叛军身份：叛军领地视为友好
  if (owner === 'rebels' && playerFaction === 'rebels') {
    return { relation: 'friendly', ownerLabel: '义军领地', ownerFaction: owner };
  }

  // 检查势力关系是否为敌对/交战
  if (playerFaction) {
    const rel = (p.factionRelations as any)?.[playerFaction]?.[owner];
    if (rel && (rel.relation === 'at_war' || rel.relation === 'hostile')) {
      const ownerName = WORLD_MAP[locId as LocationId]?.name ?? owner;
      return { relation: 'hostile', ownerLabel: `敌对·${ownerName}`, ownerFaction: owner };
    }
  }

  const ownerName = WORLD_MAP[locId as LocationId]?.name ?? owner;
  return { relation: 'neutral', ownerLabel: `中立·${ownerName}`, ownerFaction: owner };
}

// ──── 据点信息面板 ────

type SettlementStatKey = Exclude<keyof SettlementAttributes, 'cityRank'>;

const SETTLEMENT_ATTR_LABELS: Record<SettlementStatKey, { icon: string; name: string }> = {
  population:    { icon: '👥', name: '人口' },
  prosperity:    { icon: '💰', name: '繁荣' },
  commerce:      { icon: '🏪', name: '商业' },
  agriculture:   { icon: '🌾', name: '农业' },
  garrison:      { icon: '🛡️', name: '驻军' },
  fortification: { icon: '🏰', name: '城防' },
  publicOrder:   { icon: '⚖️', name: '治安' },
  development:   { icon: '🔧', name: '开发' },
  martialArts:   { icon: '🥋', name: '武学' },
  academy:       { icon: '📚', name: '学术' },
};

import { SECTS } from '../../data/sects';

function renderSettlementInfo(locId: string): string {
  const p = getPlayer();
  const state = (p.settlementState ?? {})[locId];
  const ctx = getLocationContext(locId as LocationId);
  const loc = WORLD_MAP[locId as LocationId];
  const locName = loc?.name ?? '未知';
  const sectIcon = (SECTS as Record<string, { icon: string; name: string }>)[ctx.ownerFaction];

  // 据点特色描述
  const isSect = isSectBase(locId as LocationId);
  let featureHtml = '';
  if (isSect && state) {
    const ma = state.martialArts ?? 0;
    const ac = state.academy ?? 0;
    if (ma >= 70) featureHtml += '<div style="color:#ffd700;">🥋 武学圣地：武学传承深厚，弟子习武事半功倍</div>';
    else if (ma >= 40) featureHtml += '<div style="color:#e67e22;">⚔️ 习武之地：有一定的武学传承</div>';
    if (ac >= 60) featureHtml += '<div style="color:#c39bd3;">📚 学术重镇：经藏丰富，学究辈出</div>';
    else if (ac >= 30) featureHtml += '<div style="color:#85c1e9;">📖 书香之地：略有文风底蕴</div>';
  } else if (!isSect && state) {
    const pop = state.population ?? 0;
    const com = state.commerce ?? 0;
    if (pop >= 60) featureHtml += '<div style="color:#27ae60;">🏙️ 繁华都会：人口稠密，商贾云集</div>';
    else if (pop >= 30) featureHtml += '<div style="color:#f0b27a;">🏘️ 中等城镇：市井热闹，生活便利</div>';
    if (com >= 60) featureHtml += '<div style="color:#c9a84c;">💎 商业枢纽：四方商路汇聚，物资丰富</div>';
  }
  if (!featureHtml) featureHtml = '<div style="color:var(--text-dim);">🏷️ 暂无显著特色</div>';

  if (!state) {
    return `<div id="settlement-info-panel" style="margin-bottom:10px;padding:12px 16px;background:rgba(255,255,255,0.02);border:1px solid var(--border-dim);border-radius:6px;">
      <div style="font-size:11px;color:var(--text-dim);text-align:center;">📊 ${locName}据点数据尚未初始化</div>
    </div>`;
  }

  const attrBars = (Object.keys(SETTLEMENT_ATTR_LABELS) as SettlementStatKey[])
    .map(k => {
      const val = (state as unknown as Record<string, number>)[k] ?? 0;
      const { icon, name } = SETTLEMENT_ATTR_LABELS[k];
      const barColor = val >= 70 ? 'linear-gradient(90deg,#27ae60,#2ecc71)'
        : val >= 40 ? 'linear-gradient(90deg,#f39c12,#f0b27a)'
        : 'linear-gradient(90deg,#e74c3c,#ef5350)';
      return `<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;font-size:10px;">
        <span style="width:48px;text-align:right;color:var(--text-dim);">${icon} ${name}</span>
        <div style="flex:1;height:8px;background:#1a1a2e;border-radius:4px;overflow:hidden;">
          <div style="height:100%;width:${val}%;background:${barColor};border-radius:4px;"></div>
        </div>
        <span style="width:24px;text-align:right;color:var(--text-dim);">${val}</span>
      </div>`;
    }).join('');

  return `<div id="settlement-info-panel" style="margin-bottom:10px;padding:12px 16px;background:rgba(255,255,255,0.03);border:1px solid var(--border-dim);border-radius:6px;animation:fadeSlideUp 0.2s ease-out;">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
      <span style="font-size:16px;">${isSect ? '🏯' : '🏙️'}</span>
      <div>
        <div style="font-size:13px;color:var(--text-gold);letter-spacing:1px;">${locName}</div>
        <div style="font-size:10px;color:var(--text-dim);">${loc?.description ?? ''}</div>
      </div>
    </div>
    <div style="margin-bottom:8px;font-size:10px;">
      <span style="color:var(--text-dim);">🏴 控制势力：</span>
      ${sectIcon ? `<span>${sectIcon.icon}</span>` : ''}
      <span style="color:#c39bd3;">${ctx.ownerLabel}</span>
    </div>
    <div style="margin-bottom:8px;">
      <div style="font-size:10px;color:var(--text-dim);letter-spacing:1px;margin-bottom:4px;">📊 据点属性</div>
      ${attrBars}
    </div>
    <div style="font-size:10px;line-height:1.6;">
      <div style="color:var(--text-dim);letter-spacing:1px;margin-bottom:2px;">🏷️ 据点特色</div>
      ${featureHtml}
    </div>
  </div>`;
}

function renderDailyTasks(): string {
  const p = getPlayer();
  const isSandbox = p.gameMode === 'sandbox';
  const locId = p.currentLocationId ?? 'wudang_mountain';
  const location = WORLD_MAP[locId];
  const actions = location?.actions ?? [];

  // ── 势力-据点关系判定 ──
  const ctx = getLocationContext(locId);

  // 朝廷品阶索引（用于过滤朝廷专属行动）
  const courtRankOrder: string[] = COURT_RANK_ORDER as string[];
  const playerCourtIdx = courtRankOrder.indexOf(p.courtRank ?? 'commoner');

  // 过滤：解锁条件满足 + 未超过 maxLevel + 朝廷品阶满足
  // 沙盒模式：章节限制不生效
  const availableTasks = actions.filter(t => {
    if (!isSandbox && p.chapter < (t.unlockChapter ?? 0)) return false;
    if (p.level < (t.unlockLevel ?? 0)) return false;
    if (t.maxLevel !== undefined && p.level > t.maxLevel) return false;
    if (t.requireCourtRank) {
      const requiredIdx = courtRankOrder.indexOf(t.requireCourtRank);
      if (playerCourtIdx < requiredIdx) return false;
    }
    // 沙盒专属：仅无宗门时显示拜师
    if (t.requireNoSect && p.sect !== 'none') return false;
    // 沙盒专属：仅无官身时显示出仕
    if (t.requireNoCourt && p.courtRank !== 'commoner') return false;
    // 习武学功：仅本派弟子可见
    if (t.id === 'sect_learn_skill' && t.sectTarget && p.sect !== t.sectTarget) return false;
    return true;
  });
  // 锁定任务：不满足解锁条件，或已超过 maxLevel，或朝廷品阶不足
  // 沙盒模式：章节限制不生效
  const lockedTasks = actions.filter(t => {
    const chapterUnlocked = isSandbox || p.chapter >= (t.unlockChapter ?? 0);
    const levelUnlocked = p.level >= (t.unlockLevel ?? 0);
    const outleveled = t.maxLevel !== undefined && p.level > t.maxLevel;
    if (!chapterUnlocked || !levelUnlocked || outleveled) return true;
    if (t.requireCourtRank) {
      const requiredIdx = courtRankOrder.indexOf(t.requireCourtRank);
      if (playerCourtIdx < requiredIdx) return true;
    }
    if (t.requireNoSect && p.sect !== 'none') return true;
    if (t.requireNoCourt && p.courtRank !== 'commoner') return true;
    return false;
  });

  if (actions.length === 0) {
    return `<div class="daily-tasks-section">
      <div class="daily-tasks-header">📋 行走江湖 · ${location?.name ?? '未知'}</div>
      <p style="font-size:12px;color:var(--text-dim);text-align:center;padding:16px;">此地暂无可用行动。</p>
    </div>`;
  }

  if (availableTasks.length === 0 && p.chapter < 2 && p.gameMode !== 'sandbox') {
    return `<div class="daily-tasks-section">
      <div class="daily-tasks-header">📋 行走江湖 · ${location?.name ?? '未知'}</div>
      <p style="font-size:12px;color:var(--text-dim);text-align:center;padding:16px;">完成第一章序幕后解锁日常任务。</p>
    </div>`;
  }

  const availableHtml = availableTasks.map(t => {
    const isShop = t.id === 'sect_fabao_shop' || t.id === 'city_fabao_shop' || t.id === 'sect_learn_skill';
    const goldHtml = t.gold > 0 ? '<span>+' + t.gold + ' 💰</span>' : '';
    const contribHtml = (t.contribution ?? 0) > 0 ? '<span>+' + t.contribution + ' 🏅</span>' : '';
    const influenceHtml = (t.influence ?? 0) > 0 ? '<span>+' + t.influence + ' 📜</span>' : '';
    // 推断轨道标签
    const track = t.courtConfig ? (p.courtPath === 'wu' ? 'court_wu' : 'court_wen')
      : t.battleConfig ? 'jianghu'
      : (t.contribution ?? 0) > 0 ? 'jianghu'
      : (t.influence ?? 0) > 0 ? 'court_wen'
      : 'universal';
    const trackLabel = track === 'jianghu' ? '🏮江湖' : track === 'court_wen' ? '📜文官' : track === 'court_wu' ? '⚔️武官' : '📋通用';
    const trackTag = `<span class="mission-track track-${track}">${trackLabel}</span>`;

    // 政务任务：显示可检定属性提示
    let courtStatHint = '';
    if (t.courtConfig) {
      const statNames = [...new Set(t.courtConfig.choices.map(c => COURT_STAT_LABEL[c.stat] ?? c.stat))];
      courtStatHint = `<div class="daily-task-court-hint" style="font-size:10px;color:#c39bd3;margin-top:2px;">🔍 可检定：${statNames.join(' / ')}</div>`;
    }

    const rewardHtml = isShop
      ? '<div class="daily-task-reward" style="color:var(--text-gold);">进入 →</div>'
      : '<div class="daily-task-reward">' +
          '<span>+' + t.exp + ' EXP</span>' +
          goldHtml +
          contribHtml +
          influenceHtml +
        '</div>';
    return '<button class="daily-task-btn' + (isShop ? ' shop' : '') + '" data-task-id="' + t.id + '">' +
      '<span class="daily-task-icon">' + t.icon + '</span>' +
      '<div class="daily-task-info">' +
      '<div class="daily-task-name">' + t.name + '</div>' +
      '<div class="daily-task-desc">' + t.desc + '</div>' +
      '<div class="daily-task-meta">' + trackTag + '</div>' +
      courtStatHint +
      '</div>' +
      rewardHtml +
      '</button>';
  }).join('');

  let lockedHtml = '';
  if (lockedTasks.length > 0) {
    const label = '<div class="daily-tasks-locked-label">🔒 不可用</div>';
    const cards = lockedTasks.map(t => {
      let unlockText: string;
      const outleveled = t.maxLevel !== undefined && p.level > t.maxLevel;
      if (outleveled) {
        unlockText = '已不再需要';
      } else if (t.requireNoSect && p.sect !== 'none') {
        unlockText = '已有宗门';
      } else if (t.requireNoCourt && p.courtRank !== 'commoner') {
        unlockText = '已有官身';
      } else if (t.requireCourtRank) {
        const requiredIdx = courtRankOrder.indexOf(t.requireCourtRank);
        if (playerCourtIdx < requiredIdx) {
          unlockText = '需 ' + (COURT_RANK_LABEL[t.requireCourtRank] ?? t.requireCourtRank);
        } else if ((t.unlockChapter ?? 0) > p.chapter) {
          unlockText = '第' + t.unlockChapter + '章解锁';
        } else if ((t.unlockLevel ?? 0) > 0) {
          unlockText = '需 炼气' + t.unlockLevel + '层';
        } else {
          unlockText = '需 外门弟子';
        }
      } else if ((t.unlockChapter ?? 0) > p.chapter) {
        unlockText = '第' + t.unlockChapter + '章解锁';
      } else if ((t.unlockLevel ?? 0) > 0) {
        unlockText = '需 炼气' + t.unlockLevel + '层';
      } else {
        unlockText = '需 外门弟子';
      }
      return '<div class="daily-task-btn locked">' +
        '<span class="daily-task-icon" style="opacity:0.3;">' + t.icon + '</span>' +
        '<div class="daily-task-info">' +
        '<div class="daily-task-name" style="color:var(--text-dim);">' + t.name + '</div>' +
        '<div class="daily-task-desc">' + t.desc + '</div>' +
        '</div>' +
        '<div class="daily-task-reward" style="color:var(--text-dim);">' + unlockText + '</div>' +
        '</div>';
    }).join('');
    lockedHtml = label + cards;
  }

  // ── 进行中战斗任务区域 ──
  const activeMissions = (p.activeMissions ?? []).filter(m => m.status === 'accepted');
  const combatHere = activeMissions.filter(m => {
    const def = getMissionDef(m.defId);
    return def && (def.type === 'combat' || def.type === 'escort') && def.targetLocation === locId;
  });

  let missionFightSection = '';
  if (combatHere.length > 0) {
    const cards = combatHere.map(m => {
      const def = getMissionDef(m.defId)!;
      const done = m.progress >= m.progressMax;
      const hasEnemy = !!def.enemyId;
      return '<div class="mission-fight-card">' +
        '<span class="daily-task-icon">⚔️</span>' +
        '<div class="daily-task-info">' +
        '<div class="daily-task-name">' + def.title + '</div>' +
        '<div class="daily-task-desc">进度：' + m.progress + '/' + m.progressMax + '</div>' +
        '</div>' +
        (done
          ? '<div class="daily-task-reward" style="color:#4caf50;">✓ 可提交</div>'
          : hasEnemy
            ? '<button class="btn" data-mission-fight="' + def.id + '" data-enemy="' + def.enemyId + '" style="padding:5px 12px;font-size:12px;">执行战斗</button>'
            : '<div class="daily-task-reward" style="color:var(--text-dim);">前往任务点</div>'
        ) +
        '</div>';
    }).join('');
    missionFightSection = '<div class="daily-tasks-section" style="margin-top:8px;">' +
      '<div class="daily-tasks-header">⚔️ 进行中任务</div>' +
      '<div class="daily-tasks-grid">' + cards + '</div>' +
      '</div>';
  }

  // 🆕 偷师按钮：当玩家在异宗门派据点时
  let stealHtml = '';
  if (isSandbox) {
    const targetSect = getStealTargetAtLocation(locId);
    if (targetSect) {
      const check = canAttemptSteal(p, targetSect);
      if (check.allowed) {
        stealHtml = `<div class="daily-tasks-section" style="margin-top:8px;">
          <div class="daily-tasks-header">🕵️ 偷师</div>
          <button class="daily-task-btn" data-task-id="steal_skill" data-steal-sect="${targetSect}">
            <span class="daily-task-icon">🕵️</span>
            <div class="daily-task-info">
              <div class="daily-task-name">暗中偷师</div>
              <div class="daily-task-desc">潜入此地偷学该门派的武学（每3月限1次）</div>
            </div>
            <div class="daily-task-reward" style="color:var(--text-gold);">⚠️ 有风险</div>
          </button>
        </div>`;
      }
    }
  }

  // 🆕 夺权：长老以上可发动门派夺权
  let coupHtml = '';
  if (isSandbox) {
    const coupCheck = checkCoupEligibility();
    if (coupCheck.possible) {
      coupHtml = `<div class="daily-tasks-section" style="margin-top:8px;">
        <div class="daily-tasks-header">⚡ 夺权篡位</div>
        <button class="daily-task-btn" data-task-id="coup_attempt">
          <span class="daily-task-icon">⚡</span>
          <div class="daily-task-info">
            <div class="daily-task-name">发动夺权</div>
            <div class="daily-task-desc">挑战掌门${coupCheck.leaderName ?? ''}（Lv.${coupCheck.leaderLevel ?? '?'}），成功率约 ${Math.round((coupCheck.successChance ?? 0) * 100)}%</div>
          </div>
          <div class="daily-task-reward" style="color:#f44336;">⚠️ 高危行动</div>
        </button>
      </div>`;
    }
  }

  // 🆕 悬赏栏：显示可用悬赏 + 当前悬赏
  let bountyHtml = '';
  if (isSandbox) {
    const bounties = getAvailableBounties();
    // 当前接取的悬赏
    if (p.activeBountyId) {
      const activeBounty = (p.bountyBoard ?? []).find(b => b.id === p.activeBountyId);
      if (activeBounty) {
        const completion = checkBountyCompletion();
        const atLocation = completion.canComplete;
        bountyHtml += `<div class="daily-tasks-section" style="margin-top:8px;">
          <div class="daily-tasks-header">🎯 当前悬赏</div>
          <div class="mission-card" style="margin:0;">
            <div><strong>${activeBounty.targetName}</strong> <span style="font-size:10px;color:var(--text-dim);">Lv.${activeBounty.targetLevel}</span></div>
            <div style="font-size:11px;color:var(--text-dim);">罪名：${activeBounty.crime}</div>
            <div style="font-size:11px;">📍 ${WORLD_MAP[activeBounty.targetLocation as LocationId]?.name ?? activeBounty.targetLocation} · 赏金 ${activeBounty.rewardGold}两</div>
            ${atLocation ? `<div style="color:#4caf50;font-weight:bold;margin-top:4px;">⚔️ 目标在此！<button class="btn" data-bounty-fight="${activeBounty.targetName}" data-bounty-level="${activeBounty.targetLevel}" style="padding:4px 10px;font-size:12px;margin-left:6px;">追捕</button></div>` : '<div style="color:var(--text-dim);">前往目标地点追捕…</div>'}
            <button class="mission-btn abandon" data-action="abandon-bounty" style="margin-top:4px;">🗑 放弃悬赏</button>
          </div>
        </div>`;
      }
    } else if (bounties.length > 0) {
      const shown = bounties.slice(0, 3);
      const cards = shown.map(b => {
        const diffLabel = getDifficultyLabel(b.difficulty);
        return `<div class="mission-card" style="margin:2px 0;cursor:pointer;" data-action="accept-bounty" data-bounty-id="${b.id}">
          <div><strong>${b.targetName}</strong> <span class="mission-difficulty difficulty-${b.difficulty === 'deadly' ? 'hard' : b.difficulty === 'hard' ? 'hard' : b.difficulty === 'normal' ? 'normal' : 'easy'}" style="font-size:10px;">${diffLabel}</span></div>
          <div style="font-size:11px;color:var(--text-dim);">${b.crime}</div>
          <div style="font-size:11px;">🎖️${b.rewardRep} · 💰${b.rewardGold}两 · ${b.issuerName}</div>
        </div>`;
      }).join('');
      bountyHtml += `<div class="daily-tasks-section" style="margin-top:8px;">
        <div class="daily-tasks-header">📜 悬赏栏（${bounties.length}条）</div>
        ${cards}
      </div>`;
    }
  }

  // ── 势力关系上下文标签 ──
  const ctxLabel = ctx.relation === 'friendly'
    ? `<span class="faction-ctx-tag friendly">🟢 ${ctx.ownerLabel}</span>`
    : ctx.relation === 'hostile'
      ? `<span class="faction-ctx-tag hostile">🔴 ${ctx.ownerLabel}</span>`
      : `<span class="faction-ctx-tag neutral">🟡 ${ctx.ownerLabel}</span>`;

  // ── 动态据点行动（仅在沙盒模式） ──
  let settlementHtml = '';
  if (isSandbox) {
    const sActions = getSettlementActions(locId);
    const sRel = getLocationRelation(locId);
    const sHeader = sRel.relation === 'friendly' ? '🏗️ 据点开发'
      : sRel.relation === 'hostile' ? '💀 暗中破坏'
      : '🧳 市井营生';
    const cards = sActions.map(a => {
      const trackIcon = a.track === 'jianghu' ? '🏮' : a.track === 'court_wen' ? '📜' : a.track === 'court_wu' ? '⚔️' : '📋';
      return `<button class="daily-task-btn settlement-action" data-settlement-action="${a.id}">
        <span class="daily-task-icon">${a.icon}</span>
        <div class="daily-task-info">
          <div class="daily-task-name">${a.name}</div>
          <div class="daily-task-desc">${a.desc}</div>
          <div class="daily-task-meta"><span class="mission-track track-${a.track}">${trackIcon} ${a.track === 'jianghu' ? '江湖' : a.track === 'court_wen' ? '文官' : a.track === 'court_wu' ? '武官' : '通用'}</span></div>
        </div>
      </button>`;
    }).join('');
    settlementHtml = `<div class="daily-tasks-section" style="margin-top:8px;">
      <div class="daily-tasks-header">${sHeader} · ${location?.name ?? '未知'}</div>
      <div class="daily-tasks-grid">${cards}</div>
    </div>`;
  }

  return `<div class="daily-tasks-section">
    <div class="daily-tasks-header">
      📋 行走江湖 · ${location?.name ?? '未知'} ${ctxLabel}
    </div>
    <div class="daily-tasks-grid">${availableHtml}${lockedHtml}</div>
  </div>${settlementHtml}${coupHtml}${stealHtml}${bountyHtml}${missionFightSection}`;
}

// ──── 指令进行中 UI ────

const TRACK_ICON: Record<string, string> = {
  military: '⚔️', jianghu: '🏮',
};

function renderDirectiveProgressSection(): string {
  const directives = getActiveDirectivesForPlayer();
  if (directives.length === 0) return '';

  const cards = directives.map(d => {
    const pct = Math.round(d.progress * 100);
    const track = d.type === 'challenge' || d.type === 'escort' || d.type === 'seek_doctor'
      || d.type === 'hunt_treasure' || d.type === 'meditate' || d.type === 'arena'
      ? 'jianghu' : 'military';
    const icon = TRACK_ICON[track] ?? '📋';
    const typeLabel = DIRECTIVE_LABEL[d.type] ?? d.type;
    const locStr = d.targetLocation ? ` · ${d.targetLocation}` : '';

    return `<div class="dd-card">
      <div class="dd-card-top">
        <span class="dd-card-icon">${icon}</span>
        <span class="dd-card-label">${typeLabel}${locStr}</span>
        <span class="dd-card-npc">${d.npcName}</span>
      </div>
      <div class="dd-progress-wrap">
        <div class="dd-progress-bar" style="width:${pct}%"></div>
      </div>
      <span class="dd-progress-pct">${pct}%</span>
    </div>`;
  }).join('');

  return `<div class="directive-progress-section">
    <div class="directive-progress-header">👁️ 势力正在执行的任务</div>
    <div class="dd-card-list">${cards}</div>
  </div>`;
}

export function renderStoryPanel(content: HTMLElement): void {
  const p = getPlayer();

  // ── 沙盒模式：只渲染行走江湖，无主线剧情 ──
  if (p.gameMode === 'sandbox') {
    renderSidebar();
    content.innerHTML = renderDailyTasks() + renderDirectiveProgressSection();
    bindDailyTaskButtons(content);
    return;
  }

  // ── 剧情模式：行走江湖 + 主线剧情 ──
  const chapter = getChapter(p.chapter);
  const scene = chapter.campScenes[p.act] ?? chapter.campScenes[0]!;

  // 刷新右侧 sidebar「附近的人」
  renderSidebar();

  const npcHtml = scene.npc ? `
    <div class="story-npc-portrait">
      <img src="${scene.npc.img}" alt="${scene.npc.name}" onerror="this.style.display='none'" class="story-npc-img">
      <div class="story-npc-name">${scene.npc.name}</div>
      <div class="story-npc-sub">${scene.npc.sub}</div>
    </div>` : '';

  content.innerHTML = `
    ${renderDailyTasks()}
    ${renderDirectiveProgressSection()}
    <div class="story-section-divider">
      <span class="story-section-label">━━━ 📖 主线剧情 ━━━</span>
    </div>
    <div class="story-scene-wrap">
      <div class="story-scene-bg">
        <img src="${scene.bg}" alt="场景" onerror="this.style.display='none'"
             style="width:100%;height:100%;object-fit:cover;border-radius:8px;opacity:0.5;">
        <div class="story-scene-overlay"></div>
      </div>
      <div class="story-scene-content">
        <div style="margin-bottom:16px;display:flex;align-items:center;gap:12px;">
          <span style="font-size:11px;color:var(--text-dim);letter-spacing:3px;padding:3px 10px;background:rgba(201,168,76,0.1);border:1px solid rgba(201,168,76,0.3);border-radius:20px;">${scene.title}</span>
        </div>
        <div class="story-desc">${scene.desc}</div>
        ${npcHtml}
        <div class="story-action-area">
          <button class="btn story-action-btn" id="story-action-btn">▶ ${scene.actionLabel}</button>
        </div>
      </div>
    </div>
  `;

  content.querySelector('#story-action-btn')?.addEventListener('click', () => triggerStoryEvent(scene.actionEvent));

  // 绑定日常任务按钮
  bindDailyTaskButtons(content);
}

/** 绑定日常任务按钮事件（沙盒与剧情共用） */
function bindDailyTaskButtons(content: HTMLElement): void {
  content.querySelectorAll<HTMLElement>('.daily-task-btn:not(.locked)').forEach(btn => {
    btn.addEventListener('click', () => {
      const taskId = btn.dataset['taskId'];
      if (taskId === 'steal_skill') {
        const sect = btn.dataset['stealSect'];
        if (sect) doStealSkill(sect);
        return;
      }
      if (taskId === 'coup_attempt') {
        doCoupAttempt();
        return;
      }
      // 动态据点行动
      const settlementActionId = btn.dataset['settlementAction'];
      if (settlementActionId) {
        doSettlementAction(settlementActionId);
        return;
      }
      const p = getPlayer();
      const locId = p.currentLocationId ?? 'wudang_mountain';
      const location = WORLD_MAP[locId];
      const task = location?.actions?.find(t => t.id === taskId);
      if (task) doDailyTask(task);
    });
  });

  // 🆕 绑定任务战斗按钮
  content.querySelectorAll<HTMLElement>('[data-mission-fight]').forEach(btn => {
    btn.addEventListener('click', () => {
      const missionDefId = btn.dataset['missionFight'];
      const enemyId = btn.dataset['enemy'];
      if (!missionDefId || !enemyId) return;

      Promise.all([
        import('../../systems/BattleEngine'),
        import('../../ui/events'),
      ]).then(([battleMod, eventsMod]) => {
        const handleEnd = ({ result }: { result: string; expGain: number; goldGain: number; loot: string[] }) => {
          eventsMod.bus.off('battle:end', handleEnd as any);
          if (result === 'win') {
            const cur = getPlayer();
            updateMissionProgress('combat', cur.currentLocationId);
            showToast('⚔️ 战斗胜利！任务进度已更新。');
          } else {
            showToast('战斗失败，再接再厉！');
          }
          const campContent = document.getElementById('camp-content');
          if (campContent) renderStoryPanel(campContent);
        };
        eventsMod.bus.on('battle:end', handleEnd as any);
        battleMod.initBattle(enemyId as any);
      });
    });
  });

  // 🆕 绑定悬赏按钮
  content.querySelectorAll<HTMLElement>('[data-action="accept-bounty"]').forEach(card => {
    card.addEventListener('click', () => {
      const bountyId = card.dataset['bountyId'];
      if (bountyId) {
        const result = acceptBounty(bountyId);
        showToast(result.message);
        if (result.success) {
          const campContent = document.getElementById('camp-content');
          if (campContent) renderStoryPanel(campContent);
        }
      }
    });
  });

  content.querySelectorAll<HTMLElement>('[data-action="abandon-bounty"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const result = abandonBounty();
      showToast(result.message);
      if (result.success) {
        const campContent = document.getElementById('camp-content');
        if (campContent) renderStoryPanel(campContent);
      }
    });
  });

  // 🆕 绑定悬赏战斗按钮
  content.querySelectorAll<HTMLElement>('[data-bounty-fight]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const targetName = btn.dataset['bountyFight'] || '通缉犯';
      const targetLevel = parseInt(btn.dataset['bountyLevel'] || '10');

      Promise.all([
        import('../../systems/BattleEngine'),
        import('../../ui/events'),
      ]).then(([battleMod, eventsMod]) => {
        const handleEnd = ({ result }: { result: string }) => {
          eventsMod.bus.off('battle:end', handleEnd as any);
          if (result === 'win') {
            const bountyResult = completeBounty();
            showToast(bountyResult.message);
          } else {
            showToast(`追捕${targetName}失败，通缉犯逃走了…`);
          }
          const campContent = document.getElementById('camp-content');
          if (campContent) renderStoryPanel(campContent);
        };
        eventsMod.bus.on('battle:end', handleEnd as any);

        // 构建通缉犯敌人
        const enemyId = `bounty_target_${targetName}`;
        battleMod.initBattle(enemyId as any);
      });
    });
  });
}

/** 出仕求官：选择文官/武官路径 */
function showCourtPathChoice(): void {
  // 移除旧弹窗
  document.getElementById('court-path-overlay')?.remove();

  const overlay = document.createElement('div');
  overlay.id = 'court-path-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:300;';
  overlay.innerHTML = `
    <div class="panel" style="max-width:420px;width:90%;padding:28px;text-align:center;">
      <div style="font-size:16px;color:var(--text-gold);letter-spacing:2px;margin-bottom:8px;">🏛️ 选择仕途</div>
      <div style="font-size:12px;color:var(--text-dim);margin-bottom:20px;">大宋朝堂，文武分途，请选择你的仕途之路</div>
      <div style="display:flex;gap:16px;justify-content:center;flex-wrap:wrap;">
        <button class="mentor-action-btn primary" id="court-path-wen" style="min-width:130px;">
          <div style="font-size:28px;">📜</div>
          <div>文官之路</div>
          <div style="font-size:10px;color:var(--text-dim);">策略·口才·学识</div>
        </button>
        <button class="mentor-action-btn" id="court-path-wu" style="min-width:130px;">
          <div style="font-size:28px;">🗡️</div>
          <div>武官之路</div>
          <div style="font-size:10px;color:var(--text-dim);">策略·魅力·武艺</div>
        </button>
      </div>
      <button class="mentor-action-btn" id="court-path-cancel" style="margin-top:16px;opacity:0.5;">暂不出仕</button>
    </div>
  `;

  document.body.appendChild(overlay);

  const close = () => overlay.remove();
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  const doJoinCourt = (path: 'wen' | 'wu') => {
    const p = getPlayer();
    const updated = {
      ...p,
      courtRank: 'xiucai' as string,
      courtPath: path as 'wen' | 'wu',
      playerCareer: path as 'wen' | 'wu',
      influence: 20,
      courtStats: path === 'wen'
        ? { strategy: 15, eloquence: 20, charisma: 15, scholarship: 25 }
        : { strategy: 20, eloquence: 15, charisma: 20, scholarship: 15 },
    };
    setPlayer(updated);
    saveGame(updated);
    addChronicleEntry({
      category: 'court_affair',
      title: '出仕求官',
      description: `从秀才起步，选择了${path === 'wen' ? '文官' : '武官'}之路。`,
      locationId: 'kaifeng_city',
    });
    close();
    showToast(`🏛️ 你踏上了${path === 'wen' ? '文官' : '武官'}之路，从秀才起步！`);
    const content = document.getElementById('camp-content');
    if (content) { renderStoryPanel(content); renderSidebar(); }
  };

  overlay.querySelector('#court-path-wen')?.addEventListener('click', () => doJoinCourt('wen'));
  overlay.querySelector('#court-path-wu')?.addEventListener('click', () => doJoinCourt('wu'));
  overlay.querySelector('#court-path-cancel')?.addEventListener('click', close);
}

/** 政务任务检定弹窗 */
function showCourtTaskDialog(action: LocationAction): void {
  const cfg = action.courtConfig!;
  document.getElementById('court-task-overlay')?.remove();

  const p = getPlayer();
  const courtStats = getEffectiveCourtStats(p);
  const allStatKeys: (keyof typeof COURT_STAT_LABEL)[] = ['strategy', 'eloquence', 'charisma', 'scholarship'];

  /** 预览成功时各属性的经验收益 */
  function previewStatExp(dc: number, rewardMul: number, testedStat: string): string {
    const base = Math.round(dc * 20 * rewardMul);
    const off = Math.round(base * 0.4);
    return allStatKeys.map(k => {
      const val = k === testedStat ? base : off;
      const label = COURT_STAT_LABEL[k] ?? k;
      return `<span style="color:${val >= base ? '#c9a84c' : '#777'};">${label}+${val}exp</span>`;
    }).join(' · ');
  }

  const choiceHtml = cfg.choices.map(c => {
    const statName = COURT_STAT_LABEL[c.stat] ?? c.stat;
    const playerStat = courtStats[c.stat] ?? 10;
    const successChance = c.dc <= 1 ? 100 : Math.min(90, Math.max(10, 40 + (playerStat - c.dc) * 5));
    const tag = c.dc <= 1 ? '安全' : successChance >= 70 ? '稳妥' : successChance >= 45 ? '挑战' : '冒险';
    const tagColor = c.dc <= 1 ? '#888' : successChance >= 70 ? '#4caf50' : successChance >= 45 ? '#ffc107' : '#ef5350';
    const statExpPreview = previewStatExp(c.dc, c.rewardMul, c.stat);
    return `<button class="court-choice-btn" data-choice-id="${c.id}" data-dc="${c.dc}" data-stat="${c.stat}" data-reward-mul="${c.rewardMul}">
      <div class="court-choice-label">${c.label}</div>
      <div class="court-choice-stat">🎯 检定：${statName} ${playerStat} vs DC${c.dc}</div>
      <div class="court-choice-tag" style="color:${tagColor}">${tag} · ${successChance}%</div>
      <div class="court-choice-desc">${c.desc}</div>
      <div class="court-choice-stat-gain" style="font-size:10px;color:var(--text-dim);margin-top:4px;line-height:1.6;">📈 ${statExpPreview}</div>
    </button>`;
  }).join('');

  const overlay = document.createElement('div');
  overlay.id = 'court-task-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:300;';
  overlay.innerHTML = `<div class="panel court-task-panel">
    <div class="court-task-header">📜 政务</div>
    <div class="court-task-name">${action.icon} ${action.name}</div>
    <div class="court-task-narrative">${cfg.narrative}</div>
    <div class="court-task-choices">${choiceHtml}</div>
    <div class="court-task-rewards">奖励：EXP +${action.exp} · 💰 +${action.gold}${action.influence ? ' · 📜 +' + action.influence : ''}</div>
    <div style="font-size:10px;color:var(--text-dim);text-align:center;margin-top:4px;">💡 检定属性获得全额经验，其余属性获得40%</div>
  </div>`;

  document.body.appendChild(overlay);

  const close = () => overlay.remove();
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  overlay.querySelectorAll<HTMLElement>('.court-choice-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const dc = parseInt(btn.dataset['dc'] ?? '1', 10);
      const stat = btn.dataset['stat'] as keyof typeof courtStats;
      const rewardMul = parseFloat(btn.dataset['rewardMul'] ?? '1');
      const playerStat = courtStats[stat] ?? 10;

      // D100 检定
      const roll = Math.floor(Math.random() * 100) + 1;
      const successChance = dc <= 1 ? 100 : Math.min(90, Math.max(10, 40 + (playerStat - dc) * 5));
      const success = roll <= successChance;
      const finalMul = success ? rewardMul : 0.3;

      const statName = COURT_STAT_LABEL[stat] ?? stat;
      const resultMsg = success
        ? `掷出 ${roll}，${statName}检定通过！(${successChance}% 成功率)`
        : `掷出 ${roll}，${statName}检定失败！(${successChance}% 成功率)\n办事不顺利，但仍有少许收获。`;

      close();
      showToast(resultMsg);
      applyTaskRewards(action, finalMul, dc, stat);
    });
  });
}

/** 随机遭遇弹窗（支持日常遭遇 & 旅行遭遇） */
export function showEncounterDialog(encounter: {
  type: string; title: string; description: string;
  enemyId?: string; enemyName?: string;
  rewards: { exp: number; gold: number; itemHint?: string };
}): void {
  const iconMap: Record<string, string> = {
    monster: '🐉', bandit: '🦹', ruins: '🏛️', duel: '⚔️', mystery: '✨',
    ambush: '🦹', treasure: '💎', merchant: '🧳', rumor: '📰',
  };
  const overlay = document.createElement('div');
  overlay.className = 'encounter-overlay';
  overlay.innerHTML = `
    <div class="encounter-dialog">
      <div class="encounter-icon">${iconMap[encounter.type] ?? '✨'}</div>
      <div class="encounter-title">${encounter.title}</div>
      <div class="encounter-desc">${encounter.description}</div>
      <div class="encounter-rewards">${encounter.rewards.exp > 0 ? `EXP +${encounter.rewards.exp}` : ''} ${encounter.rewards.gold > 0 ? `💰 +${encounter.rewards.gold}` : ''} ${encounter.rewards.itemHint ? `<br><span style="font-size:10px;color:var(--text-dim);">${encounter.rewards.itemHint}</span>` : ''}</div>
      <div class="encounter-actions">
        <button class="encounter-btn go" id="encounter-go">前往</button>
        <button class="encounter-btn ignore" id="encounter-ignore">忽略</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const close = () => overlay.remove();
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  overlay.querySelector('#encounter-ignore')?.addEventListener('click', close);

  overlay.querySelector('#encounter-go')?.addEventListener('click', () => {
    close();
    if (encounter.enemyId) {
      // 战斗型遭遇
      import('../../systems/BattleEngine').then(m => m.initBattle(encounter.enemyId as any));
    } else {
      // 非战斗型：直接给奖励
      const p = getPlayer();
      const updated = {
        ...p,
        exp: p.exp + encounter.rewards.exp,
        gold: p.gold + encounter.rewards.gold,
      };
      setPlayer(updated);
      saveGame(updated);
      showToast(`${encounter.title}完成！经验 +${encounter.rewards.exp}，铜钱 +${encounter.rewards.gold}`);
      const content = document.getElementById('camp-content');
      if (content) renderStoryPanel(content);
    }
  });
}

function triggerStoryEvent(eventId: string): void {
  // ── 第一章事件 ──
  if (eventId === 'act1_chess') {
    if (NPC_DIALOGS['mo_jiangqing']) openDialog('mo_jiangqing');
    else showToast('墨绐青的对话正在酝酿中…');
  } else if (eventId === 'act2_thunder') {
    const p = getPlayer();
    setPlayer({ ...p, act: 2 });
    saveGame(getPlayer());
    showToast('突变发生——必须立刻离开！');
    renderStoryPanel(document.getElementById('camp-content')!);
  } else if (eventId === 'act3_escape') {
    import('../../systems/BattleEngine').then(m => m.initBattle('shadow_scout'));
  } else if (eventId === 'act4_snow') {
    const p = getPlayer();
    if (NPC_DIALOGS['liu_qinghan']) {
      openDialog('liu_qinghan');
      const updated = { ...p, act: 4 };
      setPlayer(updated);
      saveGame(updated);
    } else {
      showToast('柳清寒的对话正在酝酿中…');
    }

  // ── 章节过渡：第一章 → 第二章 ──
  } else if (eventId === 'enter_chapter2') {
    const p = getPlayer();
    const updated = { ...p, chapter: 2, act: 0 };
    setPlayer(updated);
    saveGame(updated);
    import('../StoryScreen').then(m => {
      m.runStoryIntro('ch2_intro_0', () => {
        const fresh = getPlayer();
        saveGame(fresh);
        enterCamp();
      });
    });

  // ── 第二章事件 ──
  } else if (eventId === 'ch2_wendao') {
    const p = getPlayer();
    if (p.level < 1) {
      showToast('需要达到炼气一层方可问道。请先通过日常任务积累经验。');
      return;
    }
    import('../StoryScreen').then(m => {
      m.runStoryIntro('ch2_wendao_0', () => {
        const fresh = getPlayer();
        const skills = fresh.skills.includes('wudang_changquan' as SkillId)
          ? fresh.skills
          : [...fresh.skills, 'wudang_changquan' as SkillId, 'yangqi_jue' as SkillId];
        const updated = { ...fresh, act: 1, skills };
        setPlayer(updated);
        saveGame(updated);
        enterCamp();
      });
    });
  } else if (eventId === 'ch2_yeshou') {
    const p = getPlayer();
    if (p.level < 2) {
      showToast('需要达到炼气二层方可夜遇柳清寒。');
      return;
    }
    import('../StoryScreen').then(m => {
      m.runStoryIntro('ch2_yeshou_0', () => {
        const fresh = getPlayer();
        const skills = fresh.skills.includes('wudang_jianfa_basic' as SkillId)
          ? fresh.skills
          : [...fresh.skills, 'wudang_jianfa_basic' as SkillId];
        const updated = { ...fresh, act: 2, skills };
        setPlayer(updated);
        saveGame(updated);
        enterCamp();
      });
    });
  } else if (eventId === 'ch2_shijian') {
    const p = getPlayer();
    if (p.level < 6) {
      showToast('需要达到炼气六层方可参加外门小比。');
      return;
    }
    import('../StoryScreen').then(m => {
      m.runStoryIntro('ch2_shijian_0', () => {
        const fresh = getPlayer();
        const updated = { ...fresh, act: 3 };
        setPlayer(updated);
        saveGame(updated);
        enterCamp();
      });
    });
  } else if (eventId === 'ch2_xiasha') {
    const p = getPlayer();
    if (p.level < 8) {
      showToast('需要达到炼气八层方可参加外门试炼考。');
      return;
    }
    import('../StoryScreen').then(m => {
      m.runStoryIntro('ch2_xiasha_0', () => {
        const fresh = getPlayer();
        // 🆕 外门试炼完成：获得试炼奖励属性 + 晋升内门弟子
        const updated = {
          ...fresh,
          act: 4,
          discipleRank: 'inner',
          npcCollection: withRankSync(fresh, 'inner'),
          maxHp: fresh.maxHp + 30, hp: Math.min(fresh.hp + 30, fresh.maxHp + 30),
          maxMp: fresh.maxMp + 15, mp: Math.min(fresh.mp + 15, fresh.maxMp + 15),
          atk: fresh.atk + 5, def: fresh.def + 3,
        };
        setPlayer(updated);
        saveGame(updated);
        enterCamp();
      });
    });
  } else if (eventId === 'ch2_chapter_end') {
    showToast('第三章即将到来……');

  // ── 章节过渡：第二章 → 第三章 ──
  } else if (eventId === 'enter_chapter3') {
    const p = getPlayer();
    const updated = { ...p, chapter: 3, act: 0 };
    setPlayer(updated);
    saveGame(updated);
    import('../StoryScreen').then(m => {
      m.runStoryIntro('ch3_break_0', () => {
        const fresh = getPlayer();
        // 🆕 剧情解锁筑基突破 + 晋升内门弟子，不再直接设 level
        const realmUnlocked = [...(fresh.realmBreakUnlocked || [])];
        if (!realmUnlocked.includes('zhuji')) realmUnlocked.push('zhuji');
        const updated2 = {
          ...fresh,
          act: 1,
          realmBreakUnlocked: realmUnlocked,
          discipleRank: 'inner',
          npcCollection: withRankSync(fresh, 'inner'),
          chapter3Breakthrough: true,
        };
        setPlayer(updated2);
        saveGame(updated2);
        enterCamp();
      });
    });

  // ── 第三章事件 ──
  } else if (eventId === 'ch3_breakthrough') {
    const p = getPlayer();
    import('../StoryScreen').then(m => {
      m.runStoryIntro('ch3_break_0', () => {
        const fresh = getPlayer();
        // 🆕 剧情解锁筑基突破 + 晋升内门，不再直接设 level
        const realmUnlocked = [...(fresh.realmBreakUnlocked || [])];
        if (!realmUnlocked.includes('zhuji')) realmUnlocked.push('zhuji');
        const updated = {
          ...fresh,
          act: 1,
          realmBreakUnlocked: realmUnlocked,
          discipleRank: 'inner',
          npcCollection: withRankSync(fresh, 'inner'),
          chapter3Breakthrough: true,
        };
        setPlayer(updated);
        saveGame(updated);
        enterCamp();
      });
    });

  } else if (eventId === 'ch3_giftshu') {
    const p = getPlayer();
    import('../StoryScreen').then(m => {
      m.runStoryIntro('ch3_gift_0', () => {
        const fresh = getPlayer();
        const updated = { ...fresh, act: 2, songZhiyuanGrowth: true };
        setPlayer(updated);
        saveGame(updated);
        enterCamp();
      });
    });

  } else if (eventId === 'ch3_baishi') {
    const p = getPlayer();
    import('../StoryScreen').then(m => {
      m.runStoryIntro('ch3_baishi_0', () => {
        const fresh = getPlayer();
        const updated = { ...fresh, act: 3, master: 'chen_jingxu' };
        setPlayer(updated);
        saveGame(updated);
        enterCamp();
      });
    });

  } else if (eventId === 'ch3_shoujian') {
    const p = getPlayer();
    if (p.level < 13) {
      showToast('需要达到筑基三层方可学习真传剑法。');
      return;
    }
    import('../StoryScreen').then(m => {
      m.runStoryIntro('ch3_jian_0', () => {
        const fresh = getPlayer();
        const skills = fresh.skills.includes('wudang_yunkai' as SkillId)
          ? fresh.skills
          : [...fresh.skills, 'wudang_yunkai' as SkillId];
        const updated = { ...fresh, act: 4, skills };
        setPlayer(updated);
        saveGame(updated);
        enterCamp();
      });
    });

  } else if (eventId === 'ch3_xiashan') {
    const p = getPlayer();
    if (p.level < 15) {
      showToast('需要达到筑基五层方可带队下山行侠。');
      return;
    }
    import('../StoryScreen').then(m => {
      m.runStoryIntro('ch3_xiashan_0', () => {
        const fresh = getPlayer();
        const updated = { ...fresh, act: 5, blackmoonToken: true };
        setPlayer(updated);
        saveGame(updated);
        enterCamp();
      });
    });

  } else if (eventId === 'ch3_fengmang') {
    const p = getPlayer();
    if (p.level < 17) {
      showToast('需要达到筑基七层方可参加内门试剑会。');
      return;
    }
    import('../StoryScreen').then(m => {
      m.runStoryIntro('ch3_feng_0', () => {
        const fresh = getPlayer();
        const updated = { ...fresh, act: 6, luChenzhouRespect: 40 };
        setPlayer(updated);
        saveGame(updated);
        enterCamp();
      });
    });

  } else if (eventId === 'ch3_hunyue') {
    const p = getPlayer();
    import('../StoryScreen').then(m => {
      m.runStoryIntro('ch3_hun_0', () => {
        const fresh = getPlayer();
        const updated = { ...fresh, act: 7, liuQinghanEngaged: true };
        setPlayer(updated);
        saveGame(updated);
        enterCamp();
      });
    });

  } else if (eventId === 'ch3_duokui') {
    const p = getPlayer();
    import('../StoryScreen').then(m => {
      m.runStoryIntro('ch3_duo_0', () => {
        const fresh = getPlayer();
        const updated = { ...fresh, act: 8, trialChampion: true };
        setPlayer(updated);
        saveGame(updated);
        enterCamp();
      });
    });

  } else if (eventId === 'ch3_zhenchuan') {
    const p = getPlayer();
    import('../StoryScreen').then(m => {
      m.runStoryIntro('ch3_zhen_0', () => {
        const fresh = getPlayer();
        // 🆕 晋升真传弟子 + 同步NPC槽位
        const updated = {
          ...fresh,
          act: 9, trueDisciple: true, discipleRank: 'true',
          npcCollection: withRankSync(fresh, 'true'),
        };
        setPlayer(updated);
        saveGame(updated);
        enterCamp();
      });
    });

  } else if (eventId === 'ch3_chuzheng') {
    const p = getPlayer();
    import('../StoryScreen').then(m => {
      m.runStoryIntro('ch3_chu_0', () => {
        const fresh = getPlayer();
        const updated = { ...fresh, blackmoonMissionStarted: true };
        saveGame(updated);
        enterCamp();
      });
    });

  } else {
    showToast('剧情即将到来…');
  }
}

/** 已废弃：右侧 sidebar 已改为「附近的人」，不再显示剧情 NPC */
export function updateStorySidebar(_scene: CampScene): void {
  // no-op: sidebar 现在由 renderSidebar() 统一管理
}