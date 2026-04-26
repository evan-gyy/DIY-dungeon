import { getPlayer, setPlayer } from '../state/GameState';
import { saveGame } from '../state/SaveSystem';
import { SKILLS } from '../data/skills';
import { ELDERS } from '../data/skills';
import { SECTS } from '../data/sects';
import { showToast } from '../ui/toast';
import type { ElderId, SkillId } from '../data/types';
import { setLearnElderId, getLearnElderId } from '../state/GameState';

export function renderLearnScreen(): void {
  const container = document.getElementById('elder-list');
  if (!container) return;
  container.innerHTML = '';

  for (const elder of ELDERS) {
    const div = document.createElement('div');
    div.className = `elder-card ${getLearnElderId() === elder.id ? 'active' : ''}`;
    div.innerHTML = `
      <img src="${elder.img}" alt="${elder.name}" onerror="this.style.display='none'">
      <div>
        <div class="elder-name">${elder.name}</div>
        <div class="elder-sect">${SECTS[elder.sect]?.name ?? ''}</div>
      </div>
    `;
    div.addEventListener('click', () => {
      container.querySelectorAll('.elder-card').forEach(e => e.classList.remove('active'));
      div.classList.add('active');
      setLearnElderId(elder.id);
      renderElderDetail(elder.id);
    });
    container.appendChild(div);
  }

  const defaultElderId = getLearnElderId() ?? ELDERS[0]?.id;
  if (defaultElderId) {
    setLearnElderId(defaultElderId);
    const firstCard = container.querySelector('.elder-card') as HTMLElement | null;
    firstCard?.classList.add('active');
    renderElderDetail(defaultElderId);
  }
}

function renderElderDetail(elderId: ElderId): void {
  const elder = ELDERS.find(e => e.id === elderId);
  const detail = document.getElementById('learn-detail');
  if (!elder || !detail) return;

  const p = getPlayer();

  const expHtml = `<div style="display:flex;align-items:center;gap:12px;padding:10px 20px;background:rgba(0,0,0,0.3);border-bottom:1px solid var(--border-dim);font-size:13px;color:var(--text-dim);letter-spacing:1px;">
    <span>📜 当前武学经验：<strong style="color:#5dade2;">${p.exp}</strong> 点</span>
    <span style="color:var(--border-dim);">|</span>
    <span>已学武功：<strong style="color:var(--text-gold);">${p.skills.length}</strong> 门</span>
  </div>`;

  const TYPE_TAG: Record<string, string> = { attack: '攻击', support: '辅助', control: '控制', passive: '被动' };

  const skillsHtml = elder.skills.map(skId => {
    const sk = SKILLS[skId];
    if (!sk) return '';
    const learned = p.skills.includes(skId);
    return `
      <div class="learn-skill-card ${learned ? 'learned' : ''}">
        <div class="lsc-top">
          <span class="lsc-icon">${sk.icon}</span>
          <span class="lsc-name">${sk.name}</span>
          <span class="skill-tag tag-${sk.type}" style="margin-left:auto;">${TYPE_TAG[sk.type] ?? sk.type}</span>
        </div>
        <div class="lsc-desc">${sk.desc}</div>
        <div class="lsc-cost">消耗：武学经验 ${sk.cost.exp} 点</div>
        <button class="${learned ? 'lsc-btn learned-btn' : 'lsc-btn'}" ${learned ? 'disabled' : ''} data-learn-skill="${skId}">
          ${learned ? '✓ 已习得' : '传功学习'}
        </button>
      </div>
    `;
  }).join('');

  detail.innerHTML = `
    ${expHtml}
    <div class="learn-npc-header">
      <img src="${elder.img}" alt="${elder.name}" onerror="this.style.display='none'">
      <div>
        <div style="font-size:16px;color:var(--text-gold);letter-spacing:3px;">${elder.name}</div>
        <div style="font-size:12px;color:var(--text-dim);margin-top:4px;">${SECTS[elder.sect]?.name ?? ''}</div>
        <div class="npc-intro">${elder.intro}</div>
      </div>
    </div>
    <div class="learn-skill-grid">${skillsHtml}</div>
  `;

  detail.querySelectorAll<HTMLButtonElement>('[data-learn-skill]').forEach(btn => {
    btn.addEventListener('click', () => {
      const skId = btn.dataset['learnSkill'] as SkillId;
      learnSkill(skId, elderId);
    });
  });
}

function learnSkill(skId: SkillId, elderId: ElderId): void {
  const p = getPlayer();
  const sk = SKILLS[skId];
  if (!sk) return;
  if (p.skills.includes(skId)) { showToast('已经习得此武功'); return; }
  if (p.exp < sk.cost.exp) { showToast(`经验不足，需要 ${sk.cost.exp} 点武学经验（当前：${p.exp}）`); return; }

  const updated = { ...p, exp: p.exp - sk.cost.exp, skills: [...p.skills, skId] };
  setPlayer(updated);
  saveGame(updated);
  showToast(`成功习得「${sk.name}」！`);
  renderElderDetail(elderId);
}
