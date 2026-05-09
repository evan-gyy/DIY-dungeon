// ============================================================
//  src/screens/SandboxHub.ts — 沙盒模式主界面
// ============================================================

import { getPlayer, setPlayer } from '../state/GameState';
import { saveGame } from '../state/SaveSystem';
import { showScreen } from './ScreenManager';
import { showToast } from '../ui/toast';
import { MUSIC, switchMusic } from '../audio/AudioManager';
import { WORLD_MAP, getAvailableDestinations, type LocationId } from '../data/worldMap';
import { getNpcsAtLocation, tickNpcBehaviors } from '../systems/NpcBehavior';
import { getRealmName, checkLevelUp } from '../state/LevelSystem';

function doCheckLevelUp(): boolean {
  const result = checkLevelUp(getPlayer());
  if (result.leveled) {
    setPlayer(result.updatedPlayer);
    return true;
  }
  return false;
}
import {
  getSandboxTime, getRemainingHours, consumeHours, advanceDay,
  formatDate, isDayOver,
} from '../systems/SandboxTimeSystem';
import { HOUR_SLOT_NAMES, MAX_HOUR_SLOTS } from '../data/sandbox/sandboxTypes';

export function enterSandbox(): void {
  showScreen('sandbox');
  switchMusic(MUSIC.main);
  renderSandboxHub();
}

export function renderSandboxHub(): void {
  renderTopbar();
  renderActionPanel();
  renderSidebar();
}

// ── 顶部状态栏 ──

function renderTopbar(): void {
  const p = getPlayer();
  const time = getSandboxTime();
  const remaining = getRemainingHours();
  const hpPct = Math.max(0, Math.min(100, p.hp / p.maxHp * 100));
  const mpPct = Math.max(0, Math.min(100, p.mp / p.maxMp * 100));

  const locName = WORLD_MAP[p.currentLocationId]?.name ?? p.currentLocationId;
  const realmName = getRealmName(p.level);

  const hourDots = Array.from({ length: MAX_HOUR_SLOTS }, (_, i) =>
    i < time.hourSlot ? '●' : '○'
  ).join('');

  const topbar = document.getElementById('sandbox-topbar');
  if (!topbar) return;

  topbar.innerHTML = `
    <div class="sandbox-topbar-row">
      <span class="sandbox-char-name">${p.name}</span>
      <span class="sandbox-realm">${realmName}</span>
      <div class="stat-bar">
        <label>气血</label>
        <div class="bar-track"><div class="bar-fill-hp" style="width:${hpPct}%"></div></div>
        <span class="bar-val">${p.hp}/${p.maxHp}</span>
      </div>
      <div class="stat-bar">
        <label>内力</label>
        <div class="bar-track"><div class="bar-fill-mp" style="width:${mpPct}%"></div></div>
        <span class="bar-val">${p.mp}/${p.maxMp}</span>
      </div>
      <span class="gold">💰 ${p.gold} 两</span>
    </div>
    <div class="sandbox-topbar-row sandbox-time-row">
      <span class="sandbox-date">📅 ${formatDate(time)}</span>
      <span class="sandbox-hour">⏰ ${HOUR_SLOT_NAMES[time.hourSlot] ?? '夜深'}</span>
      <span class="sandbox-hour-dots">[${hourDots}] ${remaining}/${MAX_HOUR_SLOTS}</span>
      <span class="sandbox-location">📍 ${locName}</span>
      <button class="btn btn-sm" id="sandbox-btn-map">🗺️ 地图</button>
      <button class="btn btn-sm" id="sandbox-btn-save">💾 存档</button>
      <button class="btn btn-sm" id="sandbox-btn-rest">🌙 休息</button>
      <button class="btn btn-sm" id="sandbox-btn-back" style="margin-left:8px;">返回主界</button>
    </div>
  `;

  document.getElementById('sandbox-btn-map')?.addEventListener('click', showSandboxMap);
  document.getElementById('sandbox-btn-save')?.addEventListener('click', doSandboxSave);
  document.getElementById('sandbox-btn-rest')?.addEventListener('click', doSandboxRest);
  document.getElementById('sandbox-btn-back')?.addEventListener('click', () => {
    showScreen('main');
    switchMusic(MUSIC.main);
  });
}

// ── 行动面板 ──

function renderActionPanel(): void {
  const p = getPlayer();
  const remaining = getRemainingHours();
  const locName = WORLD_MAP[p.currentLocationId]?.name ?? '';
  const loc = WORLD_MAP[p.currentLocationId];

  const content = document.getElementById('sandbox-content');
  if (!content) return;

  if (isDayOver()) {
    content.innerHTML = `
      <div class="sandbox-panel">
        <h3>🌙 夜已深沉</h3>
        <p style="color:var(--text-dim);margin:12px 0;">今日的时辰已用尽，请休息以迎接新的一天。</p>
        <button class="btn" id="sandbox-end-day">🌙 结束今日，进入明天</button>
      </div>
    `;
    document.getElementById('sandbox-end-day')?.addEventListener('click', () => {
      advanceDay();
      showToast('新的一天开始了！');
      renderSandboxHub();
    });
    return;
  }

  const actions = getAvailableActions();
  let actionsHtml = actions.map(a => {
    const disabled = a.hourCost > remaining;
    return `
      <button class="sandbox-action-btn ${disabled ? 'disabled' : ''}"
              data-action="${a.id}" ${disabled ? 'disabled' : ''}>
        <span class="action-icon">${a.icon}</span>
        <span class="action-name">${a.name}</span>
        <span class="action-cost">${a.hourCost}时辰</span>
        <span class="action-desc">${a.desc}</span>
      </button>
    `;
  }).join('');

  // Location-specific daily tasks
  let dailyHtml = '';
  if (loc?.actions && loc.actions.length > 0) {
    dailyHtml = `
      <div class="sandbox-section-title">📍 ${locName}·当地活动</div>
      <div class="sandbox-daily-grid">
        ${loc.actions.map(a => {
          const disabled = 1 > remaining;
          return `
            <button class="sandbox-action-btn sandbox-daily-btn ${disabled ? 'disabled' : ''}"
                    data-daily="${a.id}" ${disabled ? 'disabled' : ''}>
              <span class="action-icon">${a.icon}</span>
              <span class="action-name">${a.name}</span>
              <span class="action-cost">1时辰</span>
              <span class="action-desc">${a.desc} | +${a.exp}经验 ${a.gold > 0 ? `+${a.gold}铜钱` : ''}</span>
            </button>
          `;
        }).join('')}
      </div>
    `;
  }

  content.innerHTML = `
    <div class="sandbox-panel">
      <div class="sandbox-section-title">⚔️ 可用行动（剩余 ${remaining} 时辰）</div>
      <div class="sandbox-action-grid">${actionsHtml}</div>
      ${dailyHtml}
      <div style="margin-top:16px;text-align:center;">
        <button class="btn btn-sm" id="sandbox-end-day-early">☀️ 结束今日</button>
      </div>
    </div>
  `;

  content.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const actionId = (btn as HTMLElement).dataset['action'];
      if (actionId) executeAction(actionId);
    });
  });

  content.querySelectorAll('[data-daily]').forEach(btn => {
    btn.addEventListener('click', () => {
      const dailyId = (btn as HTMLElement).dataset['daily'];
      if (dailyId) executeDailyTask(dailyId);
    });
  });

  document.getElementById('sandbox-end-day-early')?.addEventListener('click', () => {
    advanceDay();
    showToast('新的一天开始了！');
    renderSandboxHub();
  });
}

interface ActionDef { id: string; icon: string; name: string; desc: string; hourCost: number; }

function getAvailableActions(): ActionDef[] {
  const actions: ActionDef[] = [
    { id: 'cultivate', icon: '🧘', name: '修炼', desc: '打坐修行，增长修为', hourCost: 2 },
    { id: 'explore', icon: '🗡️', name: '行侠仗义', desc: '在附近探索，可能遇到事件', hourCost: 2 },
    { id: 'gather_intel', icon: '🕵️', name: '打探消息', desc: '收集当地情报与江湖传闻', hourCost: 1 },
    { id: 'work', icon: '💪', name: '做工赚钱', desc: '出卖劳力，赚取铜钱', hourCost: 1 },
  ];
  return actions;
}

function executeAction(actionId: string): void {
  const p = getPlayer();
  const remaining = getRemainingHours();

  switch (actionId) {
    case 'cultivate': {
      if (remaining < 2) { showToast('时辰不足'); return; }
      consumeHours(2);
      const expGain = 25 + Math.floor(Math.random() * 20);
      const updated = { ...getPlayer(), exp: getPlayer().exp + expGain };
      setPlayer(updated);
      const lvResult = doCheckLevelUp();
      if (lvResult) {
        showToast(`修炼有成，获得 ${expGain} 修为！突破至 ${getRealmName(getPlayer().level)}！`);
      } else {
        showToast(`修炼有成，获得 ${expGain} 点修为`);
      }
      break;
    }
    case 'explore': {
      if (remaining < 2) { showToast('时辰不足'); return; }
      consumeHours(2);
      const roll = Math.random();
      if (roll < 0.3) {
        const expGain = 30 + Math.floor(Math.random() * 15);
        const goldGain = 10 + Math.floor(Math.random() * 15);
        const up = { ...getPlayer(), exp: getPlayer().exp + expGain, gold: getPlayer().gold + goldGain };
        setPlayer(up);
        doCheckLevelUp();
        showToast(`行侠仗义，击退了几个小毛贼！获得 ${expGain} 修为，${goldGain} 铜钱`);
        const sd = getPlayer().sandboxData;
        if (sd) {
          const wr = { ...sd.wulinReputation, jianghuFame: sd.wulinReputation.jianghuFame + 5 };
          setPlayer({ ...getPlayer(), sandboxData: { ...sd, wulinReputation: wr } });
        }
      } else if (roll < 0.6) {
        const expGain = 15;
        setPlayer({ ...getPlayer(), exp: getPlayer().exp + expGain });
        doCheckLevelUp();
        showToast(`四处走动，见识了不少风土人情，获得 ${expGain} 修为`);
      } else {
        showToast('今日平安无事，街上一切祥和');
      }
      break;
    }
    case 'gather_intel': {
      if (remaining < 1) { showToast('时辰不足'); return; }
      consumeHours(1);
      const sd = getPlayer().sandboxData;
      if (sd) {
        const cr = { ...sd.courtReputation, intelligence: sd.courtReputation.intelligence + 3 };
        setPlayer({ ...getPlayer(), sandboxData: { ...sd, courtReputation: cr } });
      }
      showToast('你在茶馆中听到了一些江湖传闻，情报值+3');
      break;
    }
    case 'work': {
      if (remaining < 1) { showToast('时辰不足'); return; }
      consumeHours(1);
      const goldGain = 15 + Math.floor(Math.random() * 10);
      setPlayer({ ...getPlayer(), gold: getPlayer().gold + goldGain });
      showToast(`辛苦劳作，赚得 ${goldGain} 铜钱`);
      break;
    }
    default:
      showToast('未知行动');
      return;
  }

  saveGame(getPlayer());
  renderSandboxHub();
}

function executeDailyTask(taskId: string): void {
  const p = getPlayer();
  const remaining = getRemainingHours();
  if (remaining < 1) { showToast('时辰不足'); return; }

  const loc = WORLD_MAP[p.currentLocationId];
  const task = loc?.actions?.find(a => a.id === taskId);
  if (!task) { showToast('任务不存在'); return; }

  consumeHours(1);
  const updated = {
    ...getPlayer(),
    exp: getPlayer().exp + task.exp,
    gold: getPlayer().gold + task.gold,
  };
  setPlayer(updated);
  doCheckLevelUp();
  saveGame(getPlayer());

  showToast(`完成「${task.name}」！获得 ${task.exp} 修为${task.gold > 0 ? `，${task.gold} 铜钱` : ''}`);
  renderSandboxHub();
}

// ── 侧边栏（附近的人）──

function renderSidebar(): void {
  const p = getPlayer();
  const sidebar = document.getElementById('sandbox-sidebar-grid');
  if (!sidebar) return;

  const npcs = getNpcsAtLocation(p.currentLocationId);

  if (npcs.length === 0) {
    sidebar.innerHTML = '<div style="color:var(--text-dim);font-size:12px;padding:8px;">附近没有人</div>';
    return;
  }

  sidebar.innerHTML = npcs.map(npc => {
    const realmName = getRealmName(npc.level);
    return `
      <div class="sandbox-npc-card" data-npc="${npc.id}">
        <div class="npc-card-name">${npc.name}</div>
        <div class="npc-card-realm">${realmName}</div>
      </div>
    `;
  }).join('');

  sidebar.querySelectorAll('[data-npc]').forEach(card => {
    card.addEventListener('click', () => {
      const npcId = (card as HTMLElement).dataset['npc'];
      if (npcId) showToast(`${npcs.find(n => n.id === npcId)?.name ?? npcId}向你点了点头`);
    });
  });
}

// ── 地图弹窗 ──

function showSandboxMap(): void {
  const p = getPlayer();
  const existing = document.getElementById('sandbox-map-overlay');
  if (existing) existing.remove();

  const destinations = getAvailableDestinations(p.currentLocationId, 99);
  const currentLoc = WORLD_MAP[p.currentLocationId];

  const overlay = document.createElement('div');
  overlay.id = 'sandbox-map-overlay';
  overlay.className = 'map-overlay';
  overlay.innerHTML = `
    <div class="panel" style="width:520px;max-width:95vw;max-height:80vh;overflow-y:auto;">
      <div class="title-deco"><h2>🗺️ 世界地图</h2></div>
      <p style="font-size:13px;color:var(--text-dim);margin-bottom:16px;">当前位置：${currentLoc?.name ?? ''} | 移动消耗 1 时辰</p>
      <div class="map-dest-list">
        ${destinations.map(d => `
          <button class="btn map-dest-btn" data-dest="${d.id}" ${getRemainingHours() < 1 ? 'disabled' : ''}>
            <span>${d.name}</span>
            <span style="font-size:11px;color:var(--text-dim);">${d.description.slice(0, 20)}…</span>
          </button>
        `).join('')}
      </div>
      <div style="text-align:center;margin-top:16px;">
        <button class="btn btn-sm btn-danger" id="sandbox-map-close">关闭</button>
      </div>
    </div>
  `;

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });

  overlay.querySelector('#sandbox-map-close')?.addEventListener('click', () => overlay.remove());

  overlay.querySelectorAll('[data-dest]').forEach(btn => {
    btn.addEventListener('click', () => {
      const destId = (btn as HTMLElement).dataset['dest'] as LocationId;
      if (destId) {
        travelTo(destId);
        overlay.remove();
      }
    });
  });

  document.body.appendChild(overlay);
}

function travelTo(destId: LocationId): void {
  if (getRemainingHours() < 1) { showToast('时辰不足，无法移动'); return; }

  consumeHours(1);
  const destLoc = WORLD_MAP[destId];
  const updated = { ...getPlayer(), currentLocationId: destId };
  setPlayer(updated);
  saveGame(updated);

  showToast(`抵达${destLoc?.name ?? destId}`);
  renderSandboxHub();
}

// ── 存档与休息 ──

function doSandboxSave(): void {
  const p = getPlayer();
  saveGame(p);
  showToast('存档成功');
}

function doSandboxRest(): void {
  advanceDay();
  showToast('美美地睡了一觉，新的一天开始了！');
  renderSandboxHub();
}
