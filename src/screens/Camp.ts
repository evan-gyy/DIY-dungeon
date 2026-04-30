import { getPlayer, setPlayer, setCampTab } from '../state/GameState';
import { saveGame } from '../state/SaveSystem';
import { MUSIC, switchMusic } from '../audio/AudioManager';
import { showScreen } from './ScreenManager';
import { renderAttrPanel } from './camp/AttrPanel';
import { renderBagPanel } from './camp/BagPanel';
import { renderSkillPanel } from './camp/SkillPanel';
import { renderStoryPanel } from './camp/StoryPanel';
import { renderRelationPanel } from './camp/RelationPanel';
import { renderFabaoPanel } from './camp/FabaoPanel';
import { getChapter } from '../data/chapters/index';
import { showToast } from '../ui/toast';
import { initNpcDatabase, tickNpcBehaviors } from '../systems/NpcBehavior';
import { WORLD_MAP, type LocationId } from '../data/worldMap';
import type { CampTabId } from '../data/types';

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
  showToast(`前往了【${destLoc.name}】`);
}

/**
 * 🗺️ 显示地图弹窗
 * 展示所有已解锁的地点节点，玩家可点击前往
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
  const unlocked = allLocs.filter(loc => {
    if (!loc.unlockChapter) return true;
    return p.chapter >= loc.unlockChapter;
  });
  
  const nodesHtml = unlocked.map(loc => {
    const isCurrent = loc.id === currentId;
    const dangerColor = loc.dangerLevel >= 7 ? '#e74c3c' : loc.dangerLevel >= 4 ? '#f39c12' : '#2ecc71';
    const cardClass = isCurrent ? 'map-node-card current' : 'map-node-card';
    const isAdjacent = WORLD_MAP[currentId]?.connections.includes(loc.id);
    const canTravel = isAdjacent && !isCurrent;
    
    return `<div class="${cardClass}" data-dest="${loc.id}" 
      ${!canTravel && !isCurrent ? 'style="opacity:0.5"' : ''}
      title="${loc.description}">
      <div class="map-node-name">${isCurrent ? '📍 ' : ''}${loc.name}</div>
      <div class="map-node-desc">${loc.description}</div>
      <div class="map-node-danger" style="color:${dangerColor}">⚔ 危险等级 ${loc.dangerLevel}</div>
      ${isCurrent ? '<div style="font-size:10px;color:var(--text-gold);margin-top:4px;">当前所在地</div>' : ''}
      ${canTravel ? '<div style="font-size:10px;color:#5dade2;margin-top:4px;">点击前往 →</div>' : !isCurrent ? '<div style="font-size:10px;color:var(--text-dim);margin-top:4px;">需从相邻地点前往</div>' : ''}
    </div>`;
  }).join('');
  
  overlay.innerHTML = `
    <div class="map-overlay-inner">
      <div class="map-overlay-title">🗺️ 江 湖 地 图</div>
      <div class="map-node-grid">${nodesHtml}</div>
      <button class="map-overlay-close" id="map-overlay-close">关 闭 地 图</button>
    </div>
  `;
  
  document.body.appendChild(overlay);
  
  // 关闭按钮
  overlay.querySelector('#map-overlay-close')?.addEventListener('click', () => {
    overlay.remove();
  });
  
  // 点击背景关闭
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
  
  // 点击地点节点前往
  overlay.querySelectorAll<HTMLElement>('.map-node-card[data-dest]').forEach(card => {
    card.addEventListener('click', () => {
      const destId = card.dataset['dest'] as LocationId;
      if (!destId) return;
      const isCurrent = destId === currentId;
      const isAdjacent = WORLD_MAP[currentId]?.connections.includes(destId);
      if (isCurrent) return;
      if (!isAdjacent) {
        showToast('需要从相邻地点逐步前往。');
        return;
      }
      overlay.remove();
      travelToLocation(destId);
    });
  });
}

export function renderSidebar(): void {
  const p = getPlayer();
  const chapter = getChapter(p.chapter);
  const scene = chapter.campScenes[p.act] ?? chapter.campScenes[0]!;
  import('./camp/StoryPanel').then(m => {
    m.updateStorySidebar(scene);
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
  
  // 确保 currentLocationId 存在（旧存档兼容）
  if (!p.currentLocationId) {
    p = { ...p, currentLocationId: 'wudang_mountain' };
    setPlayer(p);
    saveGame(p);
  }

  showScreen('camp');
  switchMusic(MUSIC.main);
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

  switchCampTab('story');
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