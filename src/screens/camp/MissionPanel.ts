// ============================================================
//  src/screens/camp/MissionPanel.ts — 宗门任务面板
// ============================================================
//  显示已接取任务列表、进度条、接取/放弃/完成操作
// ============================================================

import { getPlayer, setPlayer } from '../../state/GameState';
import { saveGame } from '../../state/SaveSystem';
import { showToast } from '../../ui/toast';
import {
  getAvailableMissions,
  acceptMission,
  abandonMission,
  completeMission,
  getMissionDef,
  formatProgress,
  getMissionTypeIcon,
  getDifficultyLabel,
  TRACK_CONFIG,
} from '../../systems/MissionSystem';
import type { MissionTrack } from '../../data/sandboxTypes';
import { MAX_ACTIVE_MISSIONS } from '../../data/sandboxTypes';
import { showCareerPathScreen } from './CareerPathScreen';
import {
  getAvailablePlayerDirectives,
  claimPlayerDirective,
  getPlayerClaimedDirectives,
  type PlayerDirectiveView,
} from '../../systems/FactionAI';

let showAvailablePanel = false;

/**
 * 渲染宗门任务面板到 content 容器。
 */
export function renderMissionPanel(container: HTMLElement): void {
  const p = getPlayer();

  // 强制路线选择：未选路线时弹出选择界面
  if (!p.playerCareer) {
    container.innerHTML = '<div class="mission-empty" style="text-align:center;padding:40px;font-size:14px;color:var(--text-dim);">请先选择职业路线…</div>';
    showCareerPathScreen(() => {
      // 选择完成后刷新面板
      const content = document.getElementById('camp-content');
      if (content) renderMissionPanel(content);
    });
    return;
  }

  const activeMissions = p.activeMissions || [];
  const acceptedMissions = activeMissions.filter(m => m.status === 'accepted');
  const completedMissions = activeMissions.filter(m => m.status === 'completed');

  const activeCount = acceptedMissions.length;
  const availableCount = getAvailableMissions().length;

  let html = '<div class="mission-panel">';

  // ── 标题栏 ──
  html += `<div class="mission-header">
    <h2>📋 宗门任务</h2>
    <span class="mission-header-info">已接 ${activeCount}/${MAX_ACTIVE_MISSIONS} · 可接 ${availableCount}</span>
  </div>`;

  // ── 势力任务：进行中 ──
  const claimedDirectives = getPlayerClaimedDirectives();
  if (claimedDirectives.length > 0) {
    html += '<div class="mission-section directive-section">';
    html += '<h3 class="mission-section-title">🏰 势力任务（进行中）</h3>';
    html += '<div class="mission-list">';
    claimedDirectives.forEach(d => {
      const pct = d.progressNeeded > 0 ? Math.round((d.currentProgress / d.progressNeeded) * 100) : 0;
      const progressBar = formatProgress(d.currentProgress, d.progressNeeded);
      const canComplete = d.currentProgress >= d.progressNeeded;
      const locText = d.targetLocation ? `📍${d.targetLocation}` : '';
      html += `<div class="mission-card directive-card ${canComplete ? 'ready' : ''}">
        <div class="mission-card-top">
          <span class="mission-icon">📯</span>
          <div class="mission-info">
            <div class="mission-title">${d.label}</div>
            <div class="mission-meta">
              <span class="mission-difficulty difficulty-hard">势力任务</span>
              ${locText ? `<span class="mission-loc">${locText}</span>` : ''}
            </div>
          </div>
          ${canComplete ? '<span class="mission-ready-badge">✅ 已完成</span>' : ''}
        </div>
        <div class="mission-desc">${d.rewardDescription}</div>
        <div class="mission-progress">
          <span class="mission-progress-label">进度：${d.currentProgress}/${d.progressNeeded}（${pct}%，每回合+${d.progressPerTurn}）</span>
          <span class="mission-progress-bar">${progressBar}</span>
        </div>
        <div class="mission-rewards">
          完成奖励：势力内政提升 · 贡献+EXP · statExp成长
        </div>
      </div>`;
    });
    html += '</div></div>';
  }

  // ── 势力任务：可认领 ──
  const availableDirectives = getAvailablePlayerDirectives();
  if (availableDirectives.length > 0) {
    html += '<div class="mission-section directive-section">';
    html += `<h3 class="mission-section-title">🏰 势力任务（可认领：${availableDirectives.length}）</h3>`;
    html += '<div class="mission-list" id="directive-available-list">';
    availableDirectives.forEach(d => {
      const locText = d.targetLocation ? `📍${d.targetLocation}` : '';
      html += `<div class="mission-card directive-card available">
        <div class="mission-card-top">
          <span class="mission-icon">📯</span>
          <div class="mission-info">
            <div class="mission-title">${d.label}</div>
            <div class="mission-meta">
              <span class="mission-difficulty difficulty-hard">势力任务</span>
              ${locText ? `<span class="mission-loc">${locText}</span>` : ''}
            </div>
          </div>
        </div>
        <div class="mission-desc">${d.rewardDescription}</div>
        <div class="mission-rewards">
          需求进度：${d.progressNeeded} · 每回合+${d.progressPerTurn}（基于属性亲和）
        </div>
        <div class="mission-actions">
          <button class="mission-btn accept" data-action="claim-directive" data-did="${d.directiveId}">📯 认领</button>
        </div>
      </div>`;
    });
    html += '</div></div>';
  }

  // ── 进行中任务 ──
  html += '<div class="mission-section">';
  html += '<h3 class="mission-section-title">📌 进行中</h3>';

  if (acceptedMissions.length === 0) {
    html += '<div class="mission-empty">暂无进行中的任务，点击下方按钮接取新任务。</div>';
  } else {
    html += '<div class="mission-list">';
    acceptedMissions.forEach((m, i) => {
      const realIdx = activeMissions.indexOf(m);
      const def = getMissionDef(m.defId);
      if (!def) return;

      const icon = getMissionTypeIcon(def.type);
      const difficulty = getDifficultyLabel(def.difficulty);
      const progressBar = formatProgress(m.progress, m.progressMax);
      const canComplete = m.progress >= m.progressMax;
      const targetLoc = def.targetLocation
        ? `<span class="mission-loc">📍${def.targetLocation}</span>`
        : '';
      const trackCfg = TRACK_CONFIG[def.track] ?? TRACK_CONFIG['universal'];
      const currencyLabel = trackCfg.currency === 'contribution' ? `⭐贡献+${def.rewardContribution}`
        : trackCfg.currency === 'influence' ? `🏛影响力+${def.rewardInfluence ?? 0}`
        : '';
      const trackTag = `<span class="mission-track track-${def.track}">${trackCfg.icon} ${trackCfg.label}</span>`;

      html += `<div class="mission-card ${canComplete ? 'ready' : ''}" data-mission-idx="${realIdx}">
        <div class="mission-card-top">
          <span class="mission-icon">${icon}</span>
          <div class="mission-info">
            <div class="mission-title">${def.title}</div>
            <div class="mission-meta">
              ${trackTag}
              <span class="mission-difficulty difficulty-${def.difficulty}">${difficulty}</span>
              ${targetLoc}
            </div>
          </div>
          ${canComplete ? '<span class="mission-ready-badge">✅ 可提交</span>' : ''}
        </div>
        <div class="mission-desc">${def.description}</div>
        <div class="mission-progress">
          <span class="mission-progress-label">进度：${m.progress}/${m.progressMax}</span>
          <span class="mission-progress-bar">${progressBar}</span>
        </div>
        <div class="mission-rewards">
          奖励：${currencyLabel}${currencyLabel ? ' · ' : ''}✨经验+${def.rewardExp} · 💰${def.rewardGold}两
        </div>
        <div class="mission-actions">
          ${canComplete
            ? `<button class="mission-btn complete" data-action="complete" data-idx="${realIdx}">🎉 提交任务</button>`
            : `<span class="mission-hint">前往目标地点完成进度</span>`
          }
          <button class="mission-btn abandon" data-action="abandon" data-idx="${realIdx}">🗑 放弃</button>
        </div>
      </div>`;
    });
    html += '</div>';
  }
  html += '</div>';

  // ── 已完成任务 ──
  if (completedMissions.length > 0) {
    html += '<div class="mission-section">';
    html += '<h3 class="mission-section-title">✅ 已完成</h3>';
    html += '<div class="mission-list completed-list">';
    completedMissions.forEach(m => {
      const def = getMissionDef(m.defId);
      const title = def?.title ?? m.defId;
      const icon = def ? getMissionTypeIcon(def.type) : '📋';
      html += `<div class="mission-card completed">
        <span class="mission-icon">${icon}</span>
        <span class="mission-title">${title}</span>
        <span class="mission-done">✓</span>
      </div>`;
    });
    html += '</div>';
    html += '</div>';
  }

  // ── 接取新任务按钮 ──
  html += '<div class="mission-accept-area">';
  html += `<button class="mission-btn accept-main" id="btn-show-available">
    ＋ 接取新任务（${availableCount} 个可选）
  </button>`;
  html += '</div>';

  // ── 可选任务面板（默认隐藏） ──
  html += '<div class="mission-available-panel" id="mission-available-panel" style="display:none;">';
  html += '<h3 class="mission-section-title">📜 可选任务</h3>';
  html += '<div class="mission-list" id="mission-available-list"></div>';
  html += '</div>';

  html += '</div>'; // .mission-panel

  container.innerHTML = html;

  // 绑定事件
  bindEvents(container);

  // 如果之前展开了可选面板，重新渲染
  if (showAvailablePanel) {
    renderAvailableList();
    const panel = document.getElementById('mission-available-panel');
    if (panel) panel.style.display = 'block';
  }
}

/**
 * 渲染可选任务列表。
 */
function renderAvailableList(): void {
  const listEl = document.getElementById('mission-available-list');
  if (!listEl) return;

  const available = getAvailableMissions();
  if (available.length === 0) {
    listEl.innerHTML = '<div class="mission-empty">当前没有可接取的任务（可能需要更高的宗门身份）。</div>';
    return;
  }

  listEl.innerHTML = available.map(def => {
    const icon = getMissionTypeIcon(def.type);
    const difficulty = getDifficultyLabel(def.difficulty);
    const targetLoc = def.targetLocation
      ? `<span class="mission-loc">📍${def.targetLocation}</span>`
      : '';
    const trackCfg = TRACK_CONFIG[def.track] ?? TRACK_CONFIG['universal'];
    const currencyLabel = trackCfg.currency === 'contribution' ? `⭐贡献+${def.rewardContribution}`
      : trackCfg.currency === 'influence' ? `🏛影响力+${def.rewardInfluence ?? 0}`
      : '';
    const trackTag = `<span class="mission-track track-${def.track}">${trackCfg.icon} ${trackCfg.label}</span>`;

    return `<div class="mission-card available" data-accept-id="${def.id}">
      <div class="mission-card-top">
        <span class="mission-icon">${icon}</span>
        <div class="mission-info">
          <div class="mission-title">${def.title}</div>
          <div class="mission-meta">
            ${trackTag}
            <span class="mission-difficulty difficulty-${def.difficulty}">${difficulty}</span>
            ${targetLoc}
          </div>
        </div>
      </div>
      <div class="mission-desc">${def.description}</div>
      <div class="mission-rewards">
        奖励：${currencyLabel}${currencyLabel ? ' · ' : ''}✨经验+${def.rewardExp} · 💰${def.rewardGold}两
      </div>
      <div class="mission-actions">
        <button class="mission-btn accept" data-action="accept" data-defid="${def.id}">✅ 接取</button>
      </div>
    </div>`;
  }).join('');

  // 绑定接取按钮
  listEl.querySelectorAll<HTMLButtonElement>('.mission-btn.accept').forEach(btn => {
    btn.addEventListener('click', () => {
      const defId = btn.dataset['defid'];
      if (defId) doAcceptMission(defId);
    });
  });
}

/**
 * 绑定面板事件。
 */
function bindEvents(container: HTMLElement): void {
  // 展开/收起可选任务
  const showBtn = container.querySelector('#btn-show-available');
  if (showBtn) {
    showBtn.addEventListener('click', () => {
      showAvailablePanel = !showAvailablePanel;
      const panel = document.getElementById('mission-available-panel');
      if (panel) {
        if (showAvailablePanel) {
          panel.style.display = 'block';
          renderAvailableList();
        } else {
          panel.style.display = 'none';
        }
      }
    });
  }

  // 提交任务
  container.querySelectorAll<HTMLButtonElement>('.mission-btn.complete').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset['idx'] || '-1', 10);
      if (idx >= 0) doCompleteMission(idx);
    });
  });

  // 放弃任务
  container.querySelectorAll<HTMLButtonElement>('.mission-btn.abandon').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset['idx'] || '-1', 10);
      if (idx >= 0) doAbandonMission(idx);
    });
  });

  // 认领势力任务
  container.querySelectorAll<HTMLButtonElement>('.mission-btn.accept[data-action="claim-directive"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const did = btn.dataset['did'];
      if (did) doClaimDirective(did);
    });
  });
}

/**
 * 执行接取任务。
 */
function doAcceptMission(defId: string): void {
  const result = acceptMission(defId);
  showToast(result.message);
  if (result.success) {
    showAvailablePanel = true;
    refreshPanel();
  }
}

/**
 * 执行完成任务。
 */
function doCompleteMission(index: number): void {
  const result = completeMission(index);
  showToast(result.message);
  refreshPanel();
}

/**
 * 执行放弃任务。
 */
function doAbandonMission(index: number): void {
  if (!confirm('确定放弃此任务吗？将扣除 5 点贡献值。')) return;
  const result = abandonMission(index);
  showToast(result.message);
  refreshPanel();
}

/**
 * 执行认领势力任务。
 */
function doClaimDirective(directiveId: string): void {
  const result = claimPlayerDirective(directiveId);
  showToast(result.message);
  if (result.success) refreshPanel();
}

/**
 * 刷新面板。
 */
function refreshPanel(): void {
  const content = document.getElementById('camp-content');
  if (!content) return;
  renderMissionPanel(content);
}
