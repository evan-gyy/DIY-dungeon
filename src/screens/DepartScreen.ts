import { getPlayer } from '../state/GameState';
import { ENEMIES, ENCOUNTER_TIERS, WUDANG_TIERS, getRandomEnemy } from '../data/enemies';
import { showScreen } from './ScreenManager';
import { checkSkillBeforeBattle } from './Camp';
import { showToast } from '../ui/toast';
import { initBattle } from '../systems/BattleEngine';
import type { EnemyId } from '../data/types';

export function showDepartScreen(): void {
  showScreen('depart');
  renderDepartPanel();
}

export function renderDepartPanel(): void {
  const content = document.getElementById('depart-content');
  if (!content) return;
  const p = getPlayer();

  const equippedCount = p.equippedSkills.filter(Boolean).length;
  const skillHint = p.skills.length === 0
    ? `<p style="font-size:13px;color:#e74c3c;margin-bottom:12px;letter-spacing:1px;">⚠ 你尚未学习任何武功，<strong>请先前往「拜师学功」</strong>！</p>`
    : equippedCount === 0
    ? `<p style="font-size:13px;color:#e74c3c;margin-bottom:12px;letter-spacing:1px;">⚠ 你有 ${p.skills.length} 门武功未装备，<strong>请先在「技能配置」中装备</strong>！</p>`
    : `<p style="font-size:12px;color:#27ae60;margin-bottom:12px;letter-spacing:1px;">✓ 已装备 ${equippedCount} 个技能，状态良好，可放心出征。</p>`;

  const wudangProgress = p.wudangMissionAccepted ? `
    <div style="margin-bottom:12px;padding:10px 14px;background:rgba(93,173,226,0.08);border:1px solid rgba(93,173,226,0.25);border-radius:6px;">
      <div style="font-size:12px;color:#5dade2;letter-spacing:2px;margin-bottom:6px;">☯️ 武当山进度</div>
      <div style="display:flex;gap:16px;font-size:11px;letter-spacing:1px;">
        <span style="color:${p.wudangGateCleared ? '#27ae60' : '#888'}">${p.wudangGateCleared ? '✅' : '⬜'} 山门</span>
        <span style="color:${p.wudangMidCleared ? '#27ae60' : '#888'}">${p.wudangMidCleared ? '✅' : p.wudangGateCleared ? '⬜' : '🔒'} 前山</span>
        <span style="color:${p.wudangElderCleared ? '#27ae60' : '#888'}">${p.wudangElderCleared ? '✅' : p.wudangMidCleared ? '⬜' : '🔒'} 大殿</span>
      </div>
    </div>` : '';

  const wudangCards = p.wudangMissionAccepted ? WUDANG_TIERS.map((enc, i) => {
    const clearedFlags = ['wudangGateCleared', 'wudangMidCleared', 'wudangElderCleared'] as const;
    const cleared = !!p[clearedFlags[i]!];
    const locked  = i > 0 && !p[clearedFlags[i - 1]!];
    const icons   = ['🌄', '⛰️', '🏛️'];
    const names   = ['山门', '前山', '大殿'];
    return `<div class="encounter-card ${cleared ? 'cleared-card' : ''} ${locked ? 'locked-card' : ''}"
              data-tier="${enc.tier}" ${locked ? 'title="需先通过前一关"' : ''}>
      <span class="enc-icon">${icons[i]}</span>
      <div>
        <div class="enc-label">武当山 · ${names[i]}${cleared ? ' ✅' : locked ? ' 🔒' : ''}</div>
        <div class="enc-desc">${enc.desc}</div>
      </div>
    </div>`;
  }).join('') : '';

  content.innerHTML = `
    ${skillHint}
    ${!p.wudangMissionAccepted ? `
    <div style="margin-bottom:16px;padding:12px 16px;background:rgba(255,255,255,0.03);border:1px dashed var(--border-dim);border-radius:6px;font-size:12px;color:var(--text-dim);letter-spacing:1px;text-align:center;">
      🔒 武当山主线暂未解锁，请先与武当派「张三丰」对话，开启武当之路。
    </div>` : ''}
    ${wudangProgress}
    ${wudangCards ? `<div class="encounter-grid wudang-grid">${wudangCards}</div>` : ''}
    <div class="title-deco" style="margin-top:24px;"><h2>江 湖 历 练</h2></div>
    <p style="font-size:12px;color:var(--text-dim);letter-spacing:1px;margin-bottom:12px;">江湖散修在此出没，挑战后可积累武学经验。</p>
    <div class="encounter-grid">
      ${ENCOUNTER_TIERS.map((enc, i) => `
        <div class="encounter-card" data-tier="${enc.tier}">
          <span class="enc-icon">${['⚔️', '🔥', '💀'][i]}</span>
          <div>
            <div class="enc-label">${enc.label}</div>
            <div class="enc-desc">${enc.desc}</div>
          </div>
          <span class="enc-tier-badge tier-${enc.tier}">${['练习', '普通', '困难'][i]}</span>
        </div>
      `).join('')}
    </div>
  `;

  content.querySelectorAll<HTMLElement>('.encounter-card[data-tier]').forEach(card => {
    card.addEventListener('click', () => {
      const tier = parseInt(card.dataset['tier'] ?? '1');
      if (card.classList.contains('locked-card')) { showToast('请先通过前一关！'); return; }
      if (tier < 10 && !checkSkillBeforeBattle()) return;
      // For wudang tiers, pick the specific enemy by tier
      let enemyId: EnemyId;
      if (tier >= 10) {
        const tierMap: Record<number, EnemyId> = {
          10: 'wudang_gate_disciple',
          11: 'wudang_mid_disciple',
          12: 'wudang_elder_battle',
        };
        enemyId = tierMap[tier] ?? 'wudang_gate_disciple';
      } else {
        enemyId = getRandomEnemy(tier).id;
      }
      initBattle(enemyId);
      showScreen('battle');
      import('../audio/AudioManager').then(m => m.switchMusic(m.MUSIC.battle));
    });
  });
}
