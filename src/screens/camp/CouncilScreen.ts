// ============================================================
//  src/screens/camp/CouncilScreen.ts — 月度议事全屏界面
// ============================================================
//  CG 风格全屏会议：
//  1. 门派大殿背景 + 掌门立绘 + 长老立绘
//  2. 掌门发言（智能议案）
//  3. 玩家选择（根据 discipleRank）
// ============================================================

import { getPlayer, setPlayer } from '../../state/GameState';
import { saveGame } from '../../state/SaveSystem';
import { showToast } from '../../ui/toast';
import { SECTS } from '../../data/sects';
import { showScreen } from '../ScreenManager';
import type { SectId } from '../../data/types';
import type { CouncilContext, CouncilProposal, CouncilResult } from '../../systems/SectManagement';
import { executeCouncilDecision } from '../../systems/SectManagement';
import { playerJoinSiege } from '../../systems/FactionWarfare';

// ──── 提案对话文本 ────

const PROPOSAL_DIALOGUE: Record<CouncilProposal['type'], string[]> = {
  siege: [
    '近日探子来报，敌对势力蠢蠢欲动。我派兵精粮足，正是开疆拓土之时！',
    '诸位师弟师妹，我意已决——本月发兵攻打敌城，扬我派威名！',
    '卧榻之侧岂容他人鼾睡？那片城池，该换个主人了。',
  ],
  stabilize: [
    '近来门内人心浮动，弟子多有懈怠。若不整肃，恐生祸端。',
    '山门之内，规矩不可废。本月当以整肃内务为先。',
    '有人暗中传播流言，动摇人心。须严加管束，重振门规！',
  ],
  gather: [
    '库房日渐空虚，弟子修炼所需丹药法器捉襟见肘。',
    '开疆扩土固然重要，但钱粮不足万事难行。本月以征收资源为重。',
    '穷则思变。各堂弟子当外出采办物资，充实门派库房。',
  ],
  develop: [
    '江湖风云变幻，我派当以稳为主。本月休养生息，培养弟子。',
    '打打杀杀非长久之计。让年轻弟子们好好修炼，他日方能独当一面。',
    '春风化雨，润物无声。诸位安心修行，门派自会蒸蒸日上。',
  ],
};

// ──── 玩家回应文本 ────

const PLAYER_RESPONSE: Record<string, string[]> = {
  siege_volunteer: [
    '弟子愿率队出征，为我派攻城拔寨！',
    '掌门放心，弟子定当不辱使命！',
  ],
  stabilize_volunteer: [
    '弟子愿担此任，亲自督查门内纪律！',
    '交给弟子来办，定让门派上下焕然一新！',
  ],
  gather_volunteer: [
    '弟子愿亲自带队外出采办，充实库房！',
    '此事弟子最是擅长，请掌门静候佳音！',
  ],
  develop_volunteer: [
    '弟子愿督促师弟师妹们勤加修炼！',
    '修行之事不可荒废，弟子定当以身作则！',
  ],
};

// ──── 入口 ────

let _currentCtx: CouncilContext | null = null;

/** 打开议事界面 */
export function showCouncilScreen(ctx: CouncilContext): void {
  _currentCtx = ctx;
  renderCouncil();
}

function closeCouncil(): void {
  _currentCtx = null;
  document.getElementById('council-overlay')?.remove();
}

// ──── 渲染 ────

function renderCouncil(): void {
  const ctx = _currentCtx;
  if (!ctx) return;

  document.getElementById('council-overlay')?.remove();

  const overlay = document.createElement('div');
  overlay.id = 'council-overlay';
  overlay.className = 'council-overlay';

  const proposal = ctx.proposal;
  const dialogue = pickOne(PROPOSAL_DIALOGUE[proposal.type]);

  // 长老立绘
  const elderHtml = ctx.elderNpcs.map((n, i) => `
    <div class="council-elder" style="animation-delay:${0.3 + i * 0.2}s">
      <div class="council-elder-img-wrap">
        <img src="${n.portrait}" alt="${n.name}" onerror="this.parentElement.innerHTML='<div class=\\'council-elder-fallback\\'>?</div>'">
      </div>
      <div class="council-elder-name">${n.name}</div>
    </div>
  `).join('');

  // 玩家选项（根据 discipleRank）
  const p = getPlayer();
  const rank = p.discipleRank ?? 'outer';
  const choices = buildChoices(proposal.type, rank);

  overlay.innerHTML = `
    <div class="council-bg">
      <div class="council-vignette"></div>
    </div>
    <div class="council-stage">
      <!-- 阶段1: 标题 + 人物展示 -->
      <div class="council-header">
        <div class="council-sect-icon">${SECTS[ctx.sectId]?.icon ?? '🏯'}</div>
        <div class="council-title">${ctx.sectName} · 月度议事</div>
        <div class="council-month">第 ${p.gameMonth ?? 1} 月</div>
      </div>

      <div class="council-characters">
        <!-- 掌门（居中，大幅） -->
        <div class="council-leader">
          <div class="council-leader-img-wrap">
            <img src="${ctx.leaderPortrait}" alt="${ctx.leaderName}" onerror="this.parentElement.innerHTML='<div class=\\'council-leader-fallback\\'>?</div>'">
          </div>
          <div class="council-leader-name">${ctx.leaderName}</div>
          <div class="council-leader-title">掌 门</div>
        </div>
        <!-- 长老（两侧，小） -->
        <div class="council-elders">
          ${elderHtml}
        </div>
      </div>

      <!-- 阶段2: 掌门发言 -->
      <div class="council-dialogue-box">
        <div class="council-dialogue-speaker">${ctx.leaderName}</div>
        <div class="council-dialogue-text">「${dialogue}」</div>
        <div class="council-proposal-label">
          <span class="council-proposal-icon">📋</span>
          本月议案：<strong>${proposal.label}</strong>
        </div>
      </div>

      <!-- 阶段3: 玩家选项 -->
      <div class="council-choices" id="council-choices">
        ${choices.map((c, i) => `
          <button class="council-choice-btn ${c.className}"
            style="animation-delay:${0.5 + i * 0.15}s"
            data-choice="${c.value}">
            <span class="council-choice-icon">${c.icon}</span>
            <span class="council-choice-label">${c.label}</span>
            ${c.hint ? `<span class="council-choice-hint">${c.hint}</span>` : ''}
          </button>
        `).join('')}
      </div>

      <div class="council-rank-hint">
        ${getRankHint(rank)}
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // 绑定事件
  requestAnimationFrame(() => {
    overlay.querySelectorAll<HTMLButtonElement>('.council-choice-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const choice = btn.dataset['choice'] as string;
        handleChoice(choice, ctx);
      });
    });
  });
}

// ──── 选项构建 ────

interface ChoiceDef {
  value: string;
  label: string;
  icon: string;
  className: string;
  hint?: string;
}

function buildChoices(proposalType: CouncilProposal['type'], rank: string): ChoiceDef[] {
  const choices: ChoiceDef[] = [];

  if (rank === 'outer') {
    // 外门弟子：只能听从安排
    choices.push({
      value: 'follow', label: '听从安排', icon: '🙏',
      className: 'council-choice-follow',
    });
  } else if (rank === 'inner') {
    // 内门弟子：附议 或 提出异议
    choices.push({
      value: 'support', label: '附议掌门', icon: '👍',
      className: 'council-choice-support',
    });
    choices.push({
      value: 'object', label: '提出异议', icon: '🤔',
      className: 'council-choice-object',
      hint: '成功率 30%',
    });
  } else {
    // 真传及以上：附议 / 异议 / 主动请缨
    choices.push({
      value: 'support', label: '附议掌门', icon: '👍',
      className: 'council-choice-support',
    });
    if (proposalType !== 'siege') {
      choices.push({
        value: 'volunteer', label: '主动请缨', icon: '⚔️',
        className: 'council-choice-volunteer',
        hint: '效果 +50%',
      });
    } else {
      choices.push({
        value: 'volunteer', label: '加入攻城队', icon: '⚔️',
        className: 'council-choice-volunteer',
        hint: '4v4 战斗',
      });
    }
    choices.push({
      value: 'object', label: '提出异议', icon: '🤔',
      className: 'council-choice-object',
      hint: '成功率 30%',
    });
  }

  return choices;
}

function getRankHint(rank: string): string {
  switch (rank) {
    case 'outer': return '外门弟子 · 列席旁听';
    case 'inner': return '内门弟子 · 可参议政事';
    case 'true': return '真传弟子 · 可主动请缨';
    case 'elder': return '长老 · 可独当一面';
    default: return '';
  }
}

// ──── 处理玩家选择 ────

function handleChoice(choice: string, ctx: CouncilContext): void {
  const p = getPlayer();

  // 提出异议：30% 成功率
  if (choice === 'object') {
    if (Math.random() < 0.30) {
      showResultOverlay('异议通过！', '掌门采纳了你的意见，重新考虑议案方向。', 'success');
      // 异议成功：改为 develop 议案
      const altResult = executeCouncilDecision(
        { type: 'develop', label: '休养生息' },
        ctx.sectId, 'support',
      );
      setTimeout(() => {
        showResultOverlay('议事结束', altResult.effectText, 'done');
        setTimeout(() => finalizeCouncil(), 2500);
      }, 2000);
    } else {
      showResultOverlay('异议驳回', '掌门认为你的意见不妥，维持原议案。', 'fail');
      setTimeout(() => {
        executeAndShowResult(ctx, 'follow');
      }, 2000);
    }
    return;
  }

  executeAndShowResult(ctx, choice as 'follow' | 'support' | 'volunteer');
}

function executeAndShowResult(ctx: CouncilContext, choice: 'follow' | 'support' | 'volunteer'): void {
  const result = executeCouncilDecision(ctx.proposal, ctx.sectId, choice);

  // 如果是攻城且玩家主动请缨，进入战斗
  if (result.enterBattle && result.battleContext && choice === 'volunteer') {
    showResultOverlay('出征！', result.effectText, 'battle');
    setTimeout(() => {
      closeCouncil();
      playerJoinSiege(
        result.battleContext!.attackerSect,
        result.battleContext!.defenderSect,
        result.battleContext!.targetLocation,
      );
    }, 1500);
    return;
  }

  // 攻城但不参战 → auto-resolve
  if (result.enterBattle && result.battleContext && choice !== 'volunteer') {
    // 调用 FactionWarfare 的自动攻城逻辑
    import('../../systems/FactionWarfare').then(m => {
      const siegeResult = m.tryTriggerSiegeForCouncil(
        result.battleContext!.attackerSect,
        result.battleContext!.defenderSect,
        result.battleContext!.targetLocation,
      );
      showResultOverlay('攻城战报', siegeResult.newsText ?? '攻城结束。', 'done');
      setTimeout(() => finalizeCouncil(), 3000);
    });
    return;
  }

  // 非攻城议案
  showResultOverlay('议事结果', result.effectText, 'done');
  setTimeout(() => finalizeCouncil(), 2500);
}

// ──── 结果弹窗 ────

function showResultOverlay(title: string, text: string, mood: 'success' | 'fail' | 'done' | 'battle'): void {
  const existing = document.getElementById('council-result');
  existing?.remove();

  const moodIcon: Record<string, string> = {
    success: '🎉', fail: '😔', done: '✅', battle: '⚔️',
  };

  const resultEl = document.createElement('div');
  resultEl.id = 'council-result';
  resultEl.className = `council-result council-result-${mood}`;
  resultEl.innerHTML = `
    <div class="council-result-icon">${moodIcon[mood] ?? '✅'}</div>
    <div class="council-result-title">${title}</div>
    <div class="council-result-text">${text}</div>
  `;
  document.getElementById('council-overlay')?.appendChild(resultEl);
}

// ──── 收尾 ────

function finalizeCouncil(): void {
  const p = getPlayer();
  setPlayer({ ...p, councilCooldown: p.gameMonth + 1 });
  saveGame(getPlayer());
  closeCouncil();
}

// ──── 工具 ────

function pickOne<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}
