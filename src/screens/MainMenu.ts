import { showScreen } from './ScreenManager';
import { getAllSaveSummaries } from '../state/SaveSystem';
import { SECTS } from '../data/sects';

export function initMainMenu(): void {
  document.getElementById('btn-newgame')?.addEventListener('click', () => {
    renderSaveSelectScreen('new');
    showScreen('saveselect');
  });

  document.getElementById('btn-continue')?.addEventListener('click', () => {
    renderSaveSelectScreen('load');
    showScreen('saveselect');
  });

  document.getElementById('btn-sandbox')?.addEventListener('click', () => {
    renderSaveSelectScreen('sandbox');
    showScreen('saveselect');
  });

  // sect preview on main menu
  document.addEventListener('click', e => {
    const target = e.target as HTMLElement;
    if (!target.classList.contains('sect-btn')) return;
    const sectId = target.dataset['sect'] as string | undefined;
    if (!sectId) return;
    const s = SECTS[sectId as keyof typeof SECTS];
    const preview = document.getElementById('sect-preview');
    if (!s || !preview) return;
    const labelMap: Record<string, string> = { hp: '气血', mp: '内力', atk: '攻击', def: '防御', agi: '速度', crit: '暴击率' };
    const bonuses = Object.entries(s.bonus)
      .map(([k, v]) => `${labelMap[k] ?? k} ${(v as number) > 0 ? '+' : ''}${v}`)
      .join('　');
    preview.innerHTML = `<span style="color:var(--text-gold)">${s.icon} ${s.name}</span><br>${s.intro}<br><span style="color:#5dade2">${bonuses}</span>`;
  });

  renderSaveSelectScreen();
}

export function renderSaveSelectScreen(mode?: 'new' | 'load' | 'sandbox'): void {
  const summaries = getAllSaveSummaries();
  const container = document.getElementById('saveselect-slots');
  if (!container) return;
  container.innerHTML = '';

  for (const { slot, player: save } of summaries) {
    const isEmpty = !save;
    const div = document.createElement('div');
    div.className = 'save-slot-card panel ' + (isEmpty ? 'slot-empty' : 'slot-used');

    if (isEmpty) {
      div.innerHTML = `
        <div class="slot-number">存档位 ${slot}</div>
        <div class="slot-empty-icon">＋</div>
        <div class="slot-empty-text">空</div>
      `;
      if (mode === 'new') {
        div.addEventListener('click', () => {
          import('./CharCreate').then(m => {
            m.setPendingSlot(slot);
            showScreen('create');
            m.renderCreateScreen();
          });
        });
      } else if (mode === 'sandbox') {
        div.addEventListener('click', () => {
          import('./SandboxCharCreate').then(m => {
            m.setSandboxPendingSlot(slot);
            showScreen('sandbox-create');
            m.renderSandboxCreateScreen();
          });
        });
      }
    } else {
      const isSandbox = save.gameMode === 'sandbox';
      const modeLabel = isSandbox ? '🎲 沙盒' : '📖 剧情';
      const sect = SECTS[save.sect] ?? { icon: '', name: '' };
      const sectLabel = save.sect === 'none' ? '自由身' : `${sect.icon} ${sect.name}`;
      div.innerHTML = `
        <div class="slot-header">
          <span class="slot-name">${save.name}</span>
          <span class="slot-sect">${modeLabel} ${sectLabel}</span>
        </div>
        <div class="slot-meta">
          <span>等级 Lv.${save.level}</span>
          <span>💰 ${save.gold}两</span>
        </div>
        <div class="slot-time">${save._savedAt ?? ''}</div>
        <div class="slot-actions">
          <button class="btn btn-sm slot-load-btn">进入</button>
          <button class="btn btn-sm btn-danger slot-del-btn">删除</button>
        </div>
      `;

      const loadHandler = (e?: Event) => {
        e?.stopPropagation();
        import('../state/GameState').then(gs => {
          gs.setPlayer({ ...save, _slot: slot });
          closeSaveSelect(false);
          if (isSandbox) {
            import('./SandboxHub').then(m => m.enterSandbox());
          } else {
            import('./Camp').then(m => m.enterCamp());
          }
        });
      };

      div.querySelector('.slot-load-btn')?.addEventListener('click', loadHandler);
      div.querySelector('.slot-del-btn')?.addEventListener('click', e => {
        e.stopPropagation();
        if (confirm(`确定删除存档「${save.name}」？此操作不可撤销。`)) {
          import('../state/SaveSystem').then(ss => {
            ss.deleteSave(slot);
            renderSaveSelectScreen(mode);
          });
        }
      });
      if (mode === 'load' || mode === 'sandbox') {
        div.addEventListener('click', loadHandler);
      }
    }
    container.appendChild(div);
  }
}

export function closeSaveSelect(goToMain = true): void {
  const el = document.getElementById('screen-saveselect');
  el?.classList.remove('active');
  if (goToMain) showScreen('main');
}
