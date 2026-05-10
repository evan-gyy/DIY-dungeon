import { getPlayer, setPlayer } from '../../state/GameState';
import { saveGame } from '../../state/SaveSystem';
import { NPC_DIALOGS } from '../../data/npcs';
import { getChapter } from '../../data/chapters/index';
import { showToast } from '../../ui/toast';
import { openDialog } from '../DialogScreen';
import { enterCamp, switchCampTab, renderSidebar } from '../Camp';
import { checkLevelUp, getRealmName } from '../../state/LevelSystem';
import { calculateFinalStats } from '../../data/realmConfig';
import { WORLD_MAP, type LocationAction } from '../../data/worldMap';
import { changeNpcAffection } from './RelationPanel';
import { syncSlotsOnPromotion } from '../../systems/NPCManager';
import { updateMissionProgress } from '../../systems/MissionSystem';
import { tickFactionDiplomacy } from '../../systems/FactionSystem';
import { tickWorldState, contributeToFaction, addChronicleEntry, joinSect } from '../../systems/WorldState';
import type { DiscipleRank } from '../../data/sandboxTypes';
import { COURT_RANK_ORDER, COURT_RANK_LABEL, type CourtRank } from '../../data/sandboxTypes';
import type { CampScene } from '../../data/chapters/types';
import type { SkillId } from '../../data/types';

/** 🆕 剧情晋升时同步更新 NPC 收纳槽位 */
function withRankSync(player: ReturnType<typeof getPlayer>, newRank: DiscipleRank) {
  const newMaxSlots = syncSlotsOnPromotion(player, newRank);
  return player.npcCollection
    ? { ...player.npcCollection, maxSlots: newMaxSlots }
    : { recruited: [], maxSlots: newMaxSlots, assignments: {}, assignmentTargets: {} };
}

function doDailyTask(action: LocationAction): void {
  const p = getPlayer();

  // 🆕 法器商店 action：打开对应商店覆盖层
  if (action.id === 'sect_fabao_shop') {
    import('./FabaoShopUI').then(m => m.showSectShopOverlay());
    return;
  }
  if (action.id === 'city_fabao_shop') {
    import('./FabaoShopUI').then(m => m.showCityShopOverlay());
    return;
  }

  // 🆕 拜入宗门
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

  // 🆕 出仕求官
  if (action.id === 'join_court') {
    showCourtPathChoice();
    return;
  }

  const contrib = action.contribution ?? 0;
  const influenceGain = action.influence ?? 0;
  
  const updated = {
    ...p,
    exp: p.exp + action.exp,
    gold: p.gold + action.gold,
    sectContribution: (p.sectContribution ?? 0) + contrib,
    influence: (p.influence ?? 0) + influenceGain,
    contributionLog: [
      ...(p.contributionLog ?? []),
      { amount: contrib, source: 'daily_task', reason: action.name, timestamp: Date.now() },
    ],
  };
  const lvResult = checkLevelUp(updated);
  const finalPlayer = lvResult.leveled ? lvResult.updatedPlayer : updated;
  setPlayer(finalPlayer);
  saveGame(finalPlayer);

  // 🆕 沙盒：日常行动触发任务进度
  updateMissionProgress('daily_action', finalPlayer.currentLocationId);

  // 🆕 沙盒：日常行动触发势力外交 tick
  tickFactionDiplomacy();

  // 🆕 沙盒：世界演算 & 个人日志
  if (p.gameMode === 'sandbox') {
    const worldResult = tickWorldState();
    if (worldResult.worldEvent?.showToPlayer) {
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

  let msg = `${action.icon} ${action.name}完成！经验 +${action.exp}`;
  if (action.gold > 0) msg += `，铜钱 +${action.gold}`;
  if (contrib > 0) msg += `，贡献 +${contrib}`;
  if (influenceGain > 0) msg += `，影响力 +${influenceGain}`;
  if (lvResult.leveled) {
    const realm = getRealmName(lvResult.newLevel);
    msg += `\n🎉 修为突破至 ${realm}！获得 ${lvResult.gainedPoints} 修为点！`;
  }
  showToast(msg);

  // 小概率随机事件（真正增加好感度）
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
    const bonus = { ...finalPlayer, exp: finalPlayer.exp + 10 };
    setPlayer(bonus);
    saveGame(bonus);
  }

  // 刷新面板
  const content = document.getElementById('camp-content');
  if (content) renderStoryPanel(content);
}

function renderDailyTasks(): string {
  const p = getPlayer();
  const locId = p.currentLocationId ?? 'wudang_mountain';
  const location = WORLD_MAP[locId];
  const actions = location?.actions ?? [];
  
  // 朝廷品阶索引（用于过滤朝廷专属行动）
  const courtRankOrder: string[] = COURT_RANK_ORDER as string[];
  const playerCourtIdx = courtRankOrder.indexOf(p.courtRank ?? 'commoner');

  // 过滤：解锁条件满足 + 未超过 maxLevel + 朝廷品阶满足
  const availableTasks = actions.filter(t => {
    if (p.chapter < (t.unlockChapter ?? 0)) return false;
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
    return true;
  });
  // 锁定任务：不满足解锁条件，或已超过 maxLevel，或朝廷品阶不足
  const lockedTasks = actions.filter(t => {
    const chapterUnlocked = p.chapter >= (t.unlockChapter ?? 0);
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
      <div class="daily-tasks-header">📋 日常修行 · ${location?.name ?? '未知'}</div>
      <p style="font-size:12px;color:var(--text-dim);text-align:center;padding:16px;">此地暂无可用行动。</p>
    </div>`;
  }

  if (availableTasks.length === 0 && p.chapter < 2 && p.gameMode !== 'sandbox') {
    return `<div class="daily-tasks-section">
      <div class="daily-tasks-header">📋 日常修行 · ${location?.name ?? '未知'}</div>
      <p style="font-size:12px;color:var(--text-dim);text-align:center;padding:16px;">完成第一章序幕后解锁日常任务。</p>
    </div>`;
  }

  const availableHtml = availableTasks.map(t => {
    const isShop = t.id === 'sect_fabao_shop' || t.id === 'city_fabao_shop';
    const goldHtml = t.gold > 0 ? '<span>+' + t.gold + ' 💰</span>' : '';
    const contribHtml = (t.contribution ?? 0) > 0 ? '<span>+' + t.contribution + ' 🏅</span>' : '';
    const influenceHtml = (t.influence ?? 0) > 0 ? '<span>+' + t.influence + ' 📜</span>' : '';
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

  return `<div class="daily-tasks-section">
    <div class="daily-tasks-header">📋 日常修行 · ${location?.name ?? '未知'}</div>
    <div class="daily-tasks-grid">${availableHtml}${lockedHtml}</div>
  </div>`;
}

export function renderStoryPanel(content: HTMLElement): void {
  const p = getPlayer();

  // ── 沙盒模式：只渲染日常修行，无主线剧情 ──
  if (p.gameMode === 'sandbox') {
    renderSidebar();
    content.innerHTML = renderDailyTasks();
    bindDailyTaskButtons(content);
    return;
  }

  // ── 剧情模式：日常修行 + 主线剧情 ──
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
      const p = getPlayer();
      const locId = p.currentLocationId ?? 'wudang_mountain';
      const location = WORLD_MAP[locId];
      const task = location?.actions?.find(t => t.id === taskId);
      if (task) doDailyTask(task);
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