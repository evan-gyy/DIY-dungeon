import { getPlayer, setPlayer, setCampTab, getCampTab } from '../state/GameState';
import { saveGame } from '../state/SaveSystem';
import { MUSIC, switchMusic } from '../audio/AudioManager';
import { showScreen } from './ScreenManager';
import { renderAttrPanel } from './camp/AttrPanel';
import { renderBagPanel } from './camp/BagPanel';
import { renderSkillPanel } from './camp/SkillPanel';
import { renderStoryPanel } from './camp/StoryPanel';
import { renderRelationPanel } from './camp/RelationPanel';
import { renderFabaoPanel } from './camp/FabaoPanel';
import { renderMissionPanel } from './camp/MissionPanel';
import { renderCourtPanel } from './camp/CourtPanel';
import { renderWorldPanel } from './camp/WorldPanel';
import { initWorldState, initChronicle } from '../systems/WorldState';
import { showToast } from '../ui/toast';
import { initNpcDatabase, tickNpcBehaviors } from '../systems/NpcBehavior';
import { getMaxRecruitSlots, getAssignmentLabel, getRankLabel } from '../systems/NPCManager';
import { updateMissionProgress } from '../systems/MissionSystem';
import { initFactionRelations, tickFactionDiplomacy } from '../systems/FactionSystem';
import { WORLD_MAP, type LocationId } from '../data/worldMap';
import { getRealmName } from '../state/LevelSystem';
import { getNpcPortrait } from '../utils/npcPortrait';
import type { CampTabId } from '../data/types';
import type { DiscipleRank, NpcAssignment } from '../data/sandboxTypes';

export function renderCampTopbar(): void {
  const p = getPlayer();
  const hpPct = Math.max(0, Math.min(100, p.hp / p.maxHp * 100));
  const mpPct = Math.max(0, Math.min(100, p.mp / p.maxMp * 100));
  const el = (id: string) => document.getElementById(id);
  const setTxt = (id: string, v: string) => { const e = el(id); if (e) e.textContent = v; };
  setTxt('topbar-name', p.name);
  setTxt('hp-val', `${p.hp}/${p.maxHp}`);
  setTxt('mp-val', `${p.mp}/${p.maxMp}`);
  setTxt('gold-val', `💰 ${p.gold} 两`);
  setTxt('contribution-val', `🏅 ${p.sectContribution ?? 0} 贡献`);
  const hpBar = el('bar-hp'); if (hpBar) (hpBar as HTMLElement).style.width = hpPct + '%';
  const mpBar = el('bar-mp'); if (mpBar) (mpBar as HTMLElement).style.width = mpPct + '%';
  
  // 渲染地图导航栏
  renderMapBar();
}

/**
 * 渲染营地顶部地图导航栏
 * 显示当前所在地点和相邻可前往地点
 */
export function renderMapBar(): void {
  const p = getPlayer();
  const locId = p.currentLocationId ?? 'wudang_mountain';
  const currentLoc = WORLD_MAP[locId];
  if (!currentLoc) return;
  
  // 更新地点标签（仅显示名称，不再显示描述）
  const labelEl = document.getElementById('map-location-label');
  if (labelEl) labelEl.textContent = currentLoc.name;
  
  // 隐藏描述文字
  const descEl = document.getElementById('map-location-desc');
  if (descEl) descEl.style.display = 'none';
  
  // 清空附近地点按钮（通过地图弹窗进行移动）
  const nearbyEl = document.getElementById('map-nearby-locations');
  if (nearbyEl) nearbyEl.innerHTML = '';
}

/**
 * 移动到目标地点
 */
export function travelToLocation(destId: LocationId): void {
  const p = getPlayer();
  const currentLoc = WORLD_MAP[p.currentLocationId];
  const destLoc = WORLD_MAP[destId];
  
  if (!currentLoc || !destLoc) {
    showToast('地点不存在。');
    return;
  }
  
  // 检查是否相邻
  if (!currentLoc.connections.includes(destId)) {
    showToast(`无法直接前往${destLoc.name}，需要经过中间地点。`);
    return;
  }
  
  // 更新地点 + 触发 NPC 回合
  const updated = { ...p, currentLocationId: destId };
  setPlayer(updated);
  saveGame(updated);

  // 🆕 沙盒：旅行触发任务进度（investigate/diplomacy 类）
  updateMissionProgress('travel', destId);

  // 🆕 沙盒：旅行触发势力外交 tick
  const diploEvents = tickFactionDiplomacy();
  if (diploEvents.length > 0) {
    const summaries = diploEvents.map(e =>
      `${e.isFriendly ? '🤝' : '⚔️'} ${e.title}：${e.trustDelta > 0 ? '+' : ''}${e.trustDelta} 信任`
    ).join('；');
    showToast(`📜 江湖动向：${summaries}`);
  }
  
  // 移动时触发 NPC 行为回合
  const tickResults = tickNpcBehaviors();
  const moveResults = tickResults.filter(r => r.action === 'move');
  if (moveResults.length > 0) {
    const moves = moveResults.map(r => r.detail).join('；');
    showToast(`🌍 ${moves}`);
  }
  
  // 更新UI
  renderCampTopbar();
  renderSidebar();
  switchCampTab(getCampTab());  // 刷新当前面板内容
  showToast(`前往了【${destLoc.name}】`);
}

/**
 * 🗺️ 显示地图弹窗 — 可视化上北下南地图 + SVG 连线 + 拖拽缩放
 */
export function showMapOverlay(): void {
  const p = getPlayer();
  const currentId = p.currentLocationId ?? 'wudang_mountain';

  // 移除旧弹窗（如果存在）
  document.getElementById('map-overlay')?.remove();

  const overlay = document.createElement('div');
  overlay.id = 'map-overlay';
  overlay.className = 'map-overlay';

  const allLocs = Object.values(WORLD_MAP);
  const isSandbox = p.gameMode === 'sandbox';
  const unlocked = allLocs.filter(loc => {
    if (isSandbox) return true;  // 沙盒模式所有地点开放
    if (!loc.unlockChapter) return true;
    return p.chapter >= loc.unlockChapter;
  });
  const unlockedIds = new Set(unlocked.map(l => l.id));

  // ── 地点坐标（上北下南，基于宋朝真实地理）──
  const POS: Record<string, { x: number; y: number }> = {
    // 西北
    kunlun_mountain:    { x: 2,  y: 8  },
    kongtong_mountain:  { x: 10, y: 12 },
    liangzhou_city:     { x: 6,  y: 16 },
    // 关中
    changan_city:       { x: 18, y: 12 },
    huashan_base:       { x: 28, y: 15 },
    zhongnan_mountain:  { x: 18, y: 24 },
    // 北方
    taiyuan_city:       { x: 44, y: 10 },
    heimu_cliff:        { x: 51, y: 5  },
    yanjing_city:       { x: 62, y: 4  },
    // 中原
    luoyang_city:       { x: 38, y: 18 },
    kaifeng_city:       { x: 52, y: 16 },
    shaolin_temple:     { x: 44, y: 28 },
    // 荆湖线
    xiangyang_city:     { x: 32, y: 42 },
    beggar_hq:          { x: 22, y: 38 },
    wudang_mountain:    { x: 22, y: 52 },
    jiangling_city:     { x: 14, y: 62 },
    wuchang_city:       { x: 30, y: 58 },
    // 江南线
    yangzhou_city:      { x: 62, y: 34 },
    jinling_city:       { x: 60, y: 40 },
    maoshan_daoyuan:    { x: 67, y: 36 },
    jiangzhou_city:     { x: 50, y: 54 },
    suzhou_city:        { x: 72, y: 44 },
    hangzhou_city:      { x: 72, y: 56 },
    mingzhou_city:      { x: 82, y: 57 },
    xiaoyao_valley:     { x: 76, y: 50 },
    // 蜀中
    chengdu_city:       { x: 4,  y: 72 },
    tangmen_estate:     { x: 8,  y: 64 },
    chongqing_city:     { x: 14, y: 74 },
    emei_mountain:      { x: 2,  y: 82 },
    qingcheng_mountain: { x: 2,  y: 78 },
    // 南方
    tanzhou_city:       { x: 32, y: 74 },
    dali_city:          { x: 2,  y: 92 },
    diancang_mountain:  { x: 2,  y: 96 },
    fuzhou_city:        { x: 76, y: 74 },
    guangzhou_city:     { x: 55, y: 88 },
  };

  // ── 生成连线 SVG ──
  const drawnEdges = new Set<string>();
  let svgLines = '';
  for (const loc of unlocked) {
    for (const connId of loc.connections) {
      if (!unlockedIds.has(connId)) continue;
      const edgeKey = [loc.id, connId].sort().join('|');
      if (drawnEdges.has(edgeKey)) continue;
      drawnEdges.add(edgeKey);
      const a = POS[loc.id];
      const b = POS[connId];
      if (!a || !b) continue;
      svgLines += `<line x1="${a.x}%" y1="${a.y}%" x2="${b.x}%" y2="${b.y}%" />`;
    }
  }

  // ── 生成节点 HTML ──
  const nodesHtml = unlocked.map(loc => {
    const pos = POS[loc.id];
    if (!pos) return '';
    const isCurrent = loc.id === currentId;
    const isAdjacent = WORLD_MAP[currentId]?.connections.includes(loc.id);
    const canTravel = isAdjacent && !isCurrent;
    const cls = isCurrent ? 's2m-node current' : canTravel ? 's2m-node adjacent' : 's2m-node locked';

    return `<div class="${cls}" data-dest="${loc.id}"
      style="left:${pos.x}%;top:${pos.y}%;"
      title="${loc.description}">
      <div class="s2m-icon">${/mountain|temple|hq|daoyuan|estate|base/.test(loc.id) ? '⛩️' : /valley|cliff/.test(loc.id) ? '🌲' : '🏘️'}</div>
      <div class="s2m-name">${isCurrent ? '📍' : ''}${loc.name}</div>
      ${canTravel ? '<div class="s2m-go">前往 →</div>' : ''}
      ${isCurrent ? '<div class="s2m-here">当前</div>' : ''}
    </div>`;
  }).join('');

  // ── 方向标识 ──
  overlay.innerHTML = `
    <div class="s2m-container">
      <div class="s2m-title">🗺️ 江 湖 地 图</div>
      <div class="s2m-compass">
        <span class="s2m-compass-n">北 ↑</span>
        <span class="s2m-zoom-info">🖱 滚轮缩放 · 拖拽平移 · <button class="s2m-reset-btn" id="s2m-reset-btn">重置视角</button></span>
        <span class="s2m-compass-s">南 ↓</span>
      </div>
      <div class="s2m-map-viewport" id="s2m-viewport">
        <div class="s2m-map-area" id="s2m-map-area">
          <svg class="s2m-svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
            ${svgLines}
          </svg>
          ${nodesHtml}
        </div>
      </div>
      <div class="s2m-legend">
        <span class="s2m-lg"><span class="s2m-lg-dot current"></span> 当前</span>
        <span class="s2m-lg"><span class="s2m-lg-dot adjacent"></span> 可前往</span>
        <span class="s2m-lg"><span class="s2m-lg-dot locked"></span> 需绕行</span>
      </div>
      <button class="map-overlay-close" id="map-overlay-close">关 闭 地 图</button>
    </div>
  `;

  document.body.appendChild(overlay);

  // ── 拖拽 + 缩放逻辑 ──
  const viewport = document.getElementById('s2m-viewport')!;
  const mapArea = document.getElementById('s2m-map-area')!;
  
  let scale = 1.0;
  let translateX = 0;
  let translateY = 0;
  const MIN_SCALE = 0.5;
  const MAX_SCALE = 2.5;

  function applyTransform() {
    mapArea.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
  }

  // 滚轮缩放
  viewport.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale + delta));
    applyTransform();
  }, { passive: false });

  // 拖拽平移
  let dragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let startTranslateX = 0;
  let startTranslateY = 0;

  viewport.addEventListener('mousedown', (e) => {
    if ((e.target as HTMLElement).closest('.s2m-node')) return;
    dragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    startTranslateX = translateX;
    startTranslateY = translateY;
    viewport.style.cursor = 'grabbing';
  });

  window.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    translateX = startTranslateX + (e.clientX - dragStartX);
    translateY = startTranslateY + (e.clientY - dragStartY);
    applyTransform();
  });

  window.addEventListener('mouseup', () => {
    if (dragging) {
      dragging = false;
      viewport.style.cursor = 'grab';
    }
  });

  // 重置视角
  document.getElementById('s2m-reset-btn')?.addEventListener('click', () => {
    scale = 1.0;
    translateX = 0;
    translateY = 0;
    applyTransform();
  });

  // 关闭
  overlay.querySelector('#map-overlay-close')?.addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

  // 点击节点前往（不自动关闭，旅行后刷新地图）
  overlay.querySelectorAll<HTMLElement>('.s2m-node[data-dest]').forEach(node => {
    node.addEventListener('click', () => {
      const destId = node.dataset['dest'] as LocationId;
      if (!destId || destId === currentId) return;
      if (!WORLD_MAP[currentId]?.connections.includes(destId)) {
        showToast('需要从相邻地点逐步前往。');
        return;
      }
      travelToLocation(destId);
      showMapOverlay(); // 刷新地图（含新位置高亮和可达连线）
    });
  });
}

export function renderSidebar(): void {
  const p = getPlayer();
  const locId = p.currentLocationId ?? 'wudang_mountain';
  const location = WORLD_MAP[locId];
  const npcDb = p.npcDatabase ?? {};
  
  // 获取当前地点的所有 NPC
  const nearbyNpcs = Object.values(npcDb).filter(
    npc => (npc.currentLocationId ?? 'wudang_mountain') === locId
  );
  
  const gridEl = document.getElementById('sidebar-nearby-grid');
  if (!gridEl) return;
  
  if (nearbyNpcs.length === 0) {
    gridEl.innerHTML = `<p style="font-size:12px;color:var(--text-dim);text-align:center;padding:20px;">此地暂无他人</p>`;
    return;
  }
  
  // 获取 NPC 立绘映射（使用集中式 npcPortrait 工具）
  const npcImages: Record<string, string> = {};
  for (const npc of nearbyNpcs) {
    npcImages[npc.id] = getNpcPortrait(
      npc.id,
      npc.sect,
      npc.gender,
      npc.portraitIndex,
    );
  }
  
  const npcCollection = p.npcCollection;
  const recruitedSet = new Set(npcCollection?.recruited ?? []);
  
  const cardsHtml = nearbyNpcs.map(npc => {
    const imgPath = npcImages[npc.id] ?? '';
    const realm = getRealmName(npc.level);
    const locName = location?.name ?? '未知';
    
    // 状态：已招募的显示指派任务，未招募的显示宗门身份
    let statusText: string;
    let statusClass: string;
    if (recruitedSet.has(npc.id)) {
      const assignment = (npcCollection?.assignments[npc.id] ?? 'idle') as NpcAssignment;
      statusText = getAssignmentLabel(assignment);
      statusClass = 'nearby-npc-status-assigned';
    } else {
      statusText = getRankLabel(npc.discipleRank);
      statusClass = 'nearby-npc-status-rank';
    }
    
    return `<div class="nearby-npc-card" data-npc-db-id="${npc.id}" data-npc-name="${npc.name}" data-npc-img="${imgPath}">
      <div class="nearby-npc-img-wrap">
        <img src="${imgPath}" alt="${npc.name}" onerror="this.style.display='none'">
        <div class="nearby-npc-img-fallback" style="display:${imgPath ? 'none' : 'flex'};">?</div>
      </div>
      <div class="nearby-npc-info">
        <div class="nearby-npc-name">${npc.name}</div>
        <div class="nearby-npc-realm">${realm}</div>
        <div class="nearby-npc-status ${statusClass}">${statusText}</div>
        <div class="nearby-npc-location">📍 ${locName}</div>
      </div>
    </div>`;
  }).join('');
  
  gridEl.innerHTML = cardsHtml;
  
  // 绑定点击事件 → 弹出 NPC 状态面板
  import('./camp/RelationPanel').then(m => {
    gridEl.querySelectorAll<HTMLElement>('.nearby-npc-card').forEach(card => {
      card.addEventListener('click', () => {
        const npcDbId = card.dataset['npcDbId'];
        const npcName = card.dataset['npcName'] || '';
        const npcImg = card.dataset['npcImg'] || '';
        if (npcDbId) {
          m.showNpcStatsOverlay(npcDbId, npcName, npcImg);
        }
      });
    });
  });
}

export function switchCampTab(tab: CampTabId): void {
  setCampTab(tab);
  document.querySelectorAll('.camp-nav-btn').forEach(b => {
    b.classList.toggle('active', (b as HTMLElement).dataset['tab'] === tab);
  });
  const content = document.getElementById('camp-content');
  if (!content) return;
  if (tab === 'attr')     renderAttrPanel(content);
  if (tab === 'bag')      renderBagPanel(content);
  if (tab === 'skill')    renderSkillPanel(content);
  if (tab === 'story')    renderStoryPanel(content);
  if (tab === 'fabao')    renderFabaoPanel(content);
  if (tab === 'relation') renderRelationPanel(content);
  if (tab === 'mission')  renderMissionPanel(content);
  if (tab === 'court')   renderCourtPanel(content);
  if (tab === 'world')   renderWorldPanel(content);
}

export function doRest(): void {
  const p = getPlayer();
  const before = { hp: p.hp, mp: p.mp };
  const updated = { ...p, hp: p.maxHp, mp: p.maxMp };
  setPlayer(updated);
  saveGame(updated);
  
  // 休息时触发 NPC 行为回合
  const tickResults = tickNpcBehaviors();
  const moveResults = tickResults.filter(r => r.action === 'move');
  if (moveResults.length > 0) {
    const moves = moveResults.map(r => r.detail).join('；');
    showToast(`🌙 ${moves}`);
  }

  // 🆕 沙盒：休息/执行日常行动触发任务进度（gather/teach 类）
  updateMissionProgress('daily_action', updated.currentLocationId);

  // 🆕 沙盒：休息触发势力外交 tick
  tickFactionDiplomacy();

  renderCampTopbar();
  showToast(`休息完毕！气血 ${before.hp} → ${updated.maxHp}，内力 ${before.mp} → ${updated.maxMp}`);
}

export function doSaveGame(): void {
  const p = getPlayer();
  
  // 存档时触发 NPC 行为回合
  tickNpcBehaviors();
  
  saveGame(p);
  showToast('存档成功！');
}

export function enterCamp(): void {
  let p = getPlayer();
  if (!p) { showScreen('main'); return; }

  // 首次进入或旧存档：初始化 NPC 数值卡数据库
  if (!p.npcDatabase || Object.keys(p.npcDatabase).length === 0) {
    p = { ...p, npcDatabase: initNpcDatabase() };
    setPlayer(p);
    saveGame(p);
  }
  
  // 初始化 NPC 好感度（旧存档兼容）
  import('./camp/RelationPanel').then(m => m.initNpcAffection());
  
  // 🆕 旧存档兼容：初始化突破解锁和宗门身份
  let needSave = false;
  if (!p.realmBreakUnlocked) {
    p = { ...p, realmBreakUnlocked: [] };
    needSave = true;
  }
  if (!p.discipleRank) {
    p = { ...p, discipleRank: 'outer' };
    needSave = true;
  }
  // 🆕 沙盒：旧存档兼容贡献值系统
  if (p.sectContribution === undefined) {
    p = { ...p, sectContribution: 0, contributionLog: [] };
    needSave = true;
  }
  // 🆕 沙盒：旧存档兼容晋升系统
  if (!p.completedTrials) {
    p = { ...p, completedTrials: [] };
    needSave = true;
  }
  if (p.reputation === undefined) {
    p = { ...p, reputation: 0 };
    needSave = true;
  }
  if (needSave) {
    setPlayer(p);
    saveGame(p);
  }
  
  // 确保 currentLocationId 存在（旧存档兼容）
  if (!p.currentLocationId) {
    p = { ...p, currentLocationId: 'wudang_mountain' };
    setPlayer(p);
    saveGame(p);
  }

  // 🆕 双身份系统：旧存档兼容 courtRank
  if (!p.courtRank) {
    p = { ...p, courtRank: 'commoner' };
    setPlayer(p);
    saveGame(p);
  }

  // 🆕 NPC 收纳系统：旧存档兼容 npcCollection
  if (!p.npcCollection) {
    const rank = (p.discipleRank || 'outer') as DiscipleRank;
    p = {
      ...p,
      npcCollection: {
        recruited: [],
        maxSlots: getMaxRecruitSlots(rank),
        assignments: {},
        assignmentTargets: {},
      },
    };
    setPlayer(p);
    saveGame(p);
  }

  // 🆕 沙盒：旧存档兼容 activeMissions
  if (!p.activeMissions) {
    p = { ...p, activeMissions: [] };
    setPlayer(p);
    saveGame(p);
  }

  // 🆕 沙盒：旧存档兼容 factionRelations
  if (!p.factionRelations || Object.keys(p.factionRelations).length === 0) {
    p = { ...p, factionRelations: initFactionRelations(), diplomacyTickCounter: 0 };
    setPlayer(p);
    saveGame(p);
  }

  // 🆕 朝廷系统：旧存档兼容
  if (!p.courtStats) {
    p = { ...p, courtStats: { strategy: 10, eloquence: 10, charisma: 10, scholarship: 10 } };
    needSave = true;
  }
  if (p.influence === undefined) {
    p = { ...p, influence: 0 };
    needSave = true;
  }
  if (p.courtPath === undefined) {
    p = { ...p, courtPath: null };
    needSave = true;
  }
  if (p.lastActionType === undefined) {
    p = { ...p, lastActionType: 'idle' };
    needSave = true;
  }
  // 🆕 沙盒：世界态势引擎兼容初始化
  if (p.gameMode === 'sandbox' && !p.worldState) {
    p = { ...p, worldState: initWorldState() };
    needSave = true;
  }
  if (p.gameMode === 'sandbox' && !p.chronicle) {
    p = { ...p, chronicle: initChronicle() };
    needSave = true;
  }
  if (needSave) {
    setPlayer(p);
    saveGame(p);
  }

  showScreen('camp');
  switchMusic(MUSIC.main);

  // 沙盒模式：将"人物活动"标签改为"日常修行"
  const storyBtn = document.getElementById('nav-btn-story');
  if (storyBtn) {
    storyBtn.innerHTML = p.gameMode === 'sandbox'
      ? '<span class="nav-icon">📋</span>日常修行'
      : '<span class="nav-icon">💬</span>人物活动';
  }

  renderCampTopbar();
  renderSidebar();

  // re-bind nav buttons (clone trick prevents event stacking)
  document.querySelectorAll('.camp-nav-btn').forEach(btn => {
    const fresh = btn.cloneNode(true) as HTMLElement;
    btn.parentNode?.replaceChild(fresh, btn);
  });
  document.querySelectorAll<HTMLElement>('.camp-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => switchCampTab(btn.dataset['tab'] as CampTabId));
  });

  if (!p.tutorialDone) {
    setTimeout(() => {
      import('./tutorial').then(m => m.showMentorGuide(0));
    }, 400);
  }

  // 沙盒模式默认打开江湖态势，剧情模式默认打开人物活动
  switchCampTab(p.gameMode === 'sandbox' ? 'world' : 'story');
}

export function checkSkillBeforeBattle(): boolean {
  const p = getPlayer();
  const equipped = p.equippedSkills.filter(Boolean);
  if (p.skills.length === 0) {
    showSkillReminder('learn_first');
    return false;
  }
  if (equipped.length === 0) {
    showSkillReminder('equip_first');
    return false;
  }
  return true;
}

function showSkillReminder(type: 'learn_first' | 'equip_first'): void {
  const textEl    = document.getElementById('skill-reminder-text');
  const actionsEl = document.getElementById('skill-reminder-actions');
  if (!textEl || !actionsEl) return;

  if (type === 'learn_first') {
    textEl.innerHTML = `<strong>且慢！</strong><br><br>你尚未学习任何武功，贸然踏入江湖恐怕凶多吉少。<br><br>请先推进<strong>「人物活动」</strong>中的主线剧情来获得武功。`;
    actionsEl.innerHTML = '';
    const goBtn = document.createElement('button');
    goBtn.className = 'mentor-action-btn primary';
    goBtn.textContent = '前往人物活动';
    goBtn.addEventListener('click', () => {
      closeSkillReminder();
      switchCampTab('story');
    });
    const forceBtn = document.createElement('button');
    forceBtn.className = 'mentor-action-btn';
    forceBtn.textContent = '强行进入';
    forceBtn.addEventListener('click', closeSkillReminder);
    actionsEl.append(goBtn, forceBtn);
  } else {
    textEl.innerHTML = `<strong>且慢！</strong><br><br>你已学习了武功，但<span class="hi">尚未装备到上阵栏</span>。<br>未装备的技能在战斗中无法使用。<br><br>请先前往<strong>「技能配置」</strong>处装备技能（最多4格）。`;
    actionsEl.innerHTML = '';
    const configBtn = document.createElement('button');
    configBtn.className = 'mentor-action-btn primary';
    configBtn.textContent = '去配置技能';
    configBtn.addEventListener('click', () => { closeSkillReminder(); switchCampTab('skill'); });
    const forceBtn = document.createElement('button');
    forceBtn.className = 'mentor-action-btn';
    forceBtn.textContent = '强行进入';
    forceBtn.addEventListener('click', closeSkillReminder);
    actionsEl.append(configBtn, forceBtn);
  }
  document.getElementById('skill-reminder')?.classList.remove('hidden');
}

function closeSkillReminder(): void {
  document.getElementById('skill-reminder')?.classList.add('hidden');
}