// ============================================================
//  src/screens/camp/GrandEventScreen.ts — 江湖大事件全屏界面
// ============================================================
//  CG 风格全屏事件弹窗：
//  1. 深色背景 + 动态光效
//  2. 事件标题/描述/地点/涉及势力
//  3. 3-4 个 roguelike 分支选项（含风险标签 + 条件锁定）
//  4. 选择后展示结果叙事 + 奖励
// ============================================================

import type { GrandEvent, GrandEventChoice, GrandEventResult } from '../../systems/GrandEventSystem';
import { resolveGrandEvent, checkChoiceRequirement } from '../../systems/GrandEventSystem';
import { getPlayer } from '../../state/GameState';
import { saveGame } from '../../state/SaveSystem';
import { SECTS } from '../../data/sects';

// ──── 风险颜色映射 ────

const RISK_STYLE: Record<string, { color: string; label: string; icon: string }> = {
  low:    { color: '#4caf50', label: '低风险', icon: '🟢' },
  medium: { color: '#ff9800', label: '中等风险', icon: '🟡' },
  high:   { color: '#f44336', label: '高风险', icon: '🔴' },
};

const TYPE_TITLES: Record<string, string> = {
  sect_war:        '宗门大战',
  tournament:      '武林盛会',
  treasure_hunt:   '秘宝出世',
  monster_invasion:'妖兽来袭',
  rebel_uprising:  '天下变局',
  court_decree:    '朝廷诏令',
  alliance_summit: '武林会盟',
};

// ──── 入口 ────

let _currentEvent: GrandEvent | null = null;

/** 打开江湖大事件界面 */
export function showGrandEventScreen(event: GrandEvent): void {
  _currentEvent = event;
  renderEventScreen();
}

function closeEventScreen(): void {
  _currentEvent = null;
  document.getElementById('grand-event-overlay')?.remove();
}

// ──── 渲染 ────

function renderEventScreen(): void {
  const event = _currentEvent;
  if (!event) return;

  document.getElementById('grand-event-overlay')?.remove();

  const overlay = document.createElement('div');
  overlay.id = 'grand-event-overlay';
  overlay.className = 'grand-event-overlay';

  const typeTitle = TYPE_TITLES[event.type] ?? '江湖大事';
  const sectNames = event.involvedSects
    .map(s => SECTS[s]?.name ?? s)
    .join(' · ');

  // 生成选择按钮
  const choiceButtons = event.choices.map((c, i) => {
    const req = checkChoiceRequirement(c);
    const riskStyle = RISK_STYLE[c.risk] ?? RISK_STYLE['medium']!;
    const riskColor = riskStyle.color;
    const locked = !req.valid;

    return `
      <button
        class="grand-event-choice-btn ${locked ? 'choice-locked' : ''}"
        style="animation-delay:${0.8 + i * 0.15}s; --choice-glow:${riskColor}"
        data-choice-id="${c.id}"
        ${locked ? 'disabled' : ''}
      >
        <span class="ge-choice-risk" style="color:${riskColor}">${riskStyle.icon} ${riskStyle.label}</span>
        <span class="ge-choice-label">${c.label}</span>
        ${locked && req.reason ? `<span class="ge-choice-lock-reason">🔒 ${req.reason}</span>` : ''}
        ${!locked ? `<span class="ge-choice-arrow">▶</span>` : ''}
      </button>
    `;
  }).join('');

  overlay.innerHTML = `
    <div class="grand-event-bg">
      <div class="grand-event-vignette"></div>
      <div class="grand-event-particles"></div>
    </div>

    <div class="grand-event-stage">
      <!-- 标题区 -->
      <div class="ge-header">
        <div class="ge-type-badge">${typeTitle}</div>
        <div class="ge-title">${event.title}</div>
        <div class="ge-location">
          <span class="ge-loc-icon">📍</span>
          <span class="ge-loc-name">${event.locationName}</span>
          ${sectNames ? `<span class="ge-sects"> · ${sectNames}</span>` : ''}
        </div>
      </div>

      <!-- 叙事文本 -->
      <div class="ge-description-box">
        <div class="ge-description-text">${event.description}</div>
      </div>

      <!-- 选项区 -->
      <div class="ge-choices" id="ge-choices">
        <div class="ge-choices-title">—— 如今天下大势，你当如何抉择？——</div>
        ${choiceButtons}
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // 绑定事件（非锁定按钮）
  requestAnimationFrame(() => {
    overlay.querySelectorAll<HTMLButtonElement>('.grand-event-choice-btn:not(.choice-locked)').forEach(btn => {
      btn.addEventListener('click', () => {
        const choiceId = btn.dataset['choiceId'] as string;
        handleChoice(choiceId);
      });
    });
  });
}

// ──── 选择处理 ────

function handleChoice(choiceId: string): void {
  const result = resolveGrandEvent(choiceId);
  if (!result) return;

  // 禁用所有按钮
  document.querySelectorAll<HTMLButtonElement>('.grand-event-choice-btn').forEach(btn => {
    btn.disabled = true;
    btn.style.opacity = '0.4';
    btn.style.pointerEvents = 'none';
  });

  // 高亮所选
  const selectedBtn = document.querySelector(`[data-choice-id="${choiceId}"]`);
  if (selectedBtn) {
    selectedBtn.classList.add('choice-selected');
  }

  // 延迟展示结果
  setTimeout(() => showResultOverlay(result), 600);
}

// ──── 结果展示 ────

function showResultOverlay(result: GrandEventResult): void {
  const event = _currentEvent;
  if (!event) return;

  const outcome = result.outcome;
  const rewards = outcome.rewards;

  // 奖励字符串
  const rewardParts: string[] = [];
  if (rewards.exp > 0) rewardParts.push(`修为 +${rewards.exp}`);
  if (rewards.gold > 0) rewardParts.push(`金币 +${rewards.gold}`);
  if (rewards.gold < 0) rewardParts.push(`金币 ${rewards.gold}`);
  if (rewards.contribution) rewardParts.push(`贡献 +${rewards.contribution}`);

  const effectParts = outcome.worldEffects.map(e =>
    `<div class="ge-effect-item">${e.description}</div>`
  ).join('');

  const overlay = document.getElementById('grand-event-overlay');
  if (!overlay) return;

  // 在现有 stage 后追加结果面板
  const stage = overlay.querySelector('.grand-event-stage');
  if (!stage) return;

  const resultDiv = document.createElement('div');
  resultDiv.className = 'ge-result-panel';
  resultDiv.innerHTML = `
    <div class="ge-result-divider"></div>
    <div class="ge-result-narrative">${outcome.description}</div>

    <div class="ge-result-rewards">
      <div class="ge-reward-label">🏆 获得</div>
      <div class="ge-reward-items">${rewardParts.join(' · ')}</div>
    </div>

    ${effectParts ? `
    <div class="ge-result-effects">
      <div class="ge-effect-label">🌍 天下影响</div>
      ${effectParts}
    </div>` : ''}

    <button class="ge-result-close-btn" id="ge-result-close">
      继续游历江湖
    </button>
  `;

  stage.appendChild(resultDiv);

  // 滚动到结果面板
  setTimeout(() => {
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 100);

  // 关闭按钮
  setTimeout(() => {
    document.getElementById('ge-result-close')?.addEventListener('click', () => {
      closeEventScreen();
      saveGame(getPlayer());
    });
  }, 200);
}
