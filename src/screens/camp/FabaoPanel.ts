import { getPlayer, setPlayer } from '../../state/GameState';
import { saveGame } from '../../state/SaveSystem';
import { FABAO } from '../../data/fabao';
import { showToast } from '../../ui/toast';
import type { FabaoId, FabaoType } from '../../data/types';

const FABAO_TYPE_LABELS: Record<FabaoType, { icon: string; name: string }> = {
  weapon:    { icon: '⚔️', name: '武器' },
  armor:     { icon: '🛡️', name: '衣服' },
  accessory: { icon: '💎', name: '饰品' },
};

export function renderFabaoPanel(content: HTMLElement): void {
  const p = getPlayer();
  const slots: FabaoType[] = ['weapon', 'armor', 'accessory'];

  const slotCards = slots.map(type => {
    const fabaoId = p.equippedFabao[type];
    const fabao = fabaoId ? FABAO[fabaoId] : null;
    const label = FABAO_TYPE_LABELS[type];

    if (fabao) {
      return `
        <div class="fabao-slot equipped" data-fabao-slot="${type}" style="--fabao-color:${fabao.colorCss}">
          <div class="fabao-slot-type">${label.icon} ${label.name}</div>
          <div class="fabao-slot-icon">${fabao.icon}</div>
          <div class="fabao-slot-name" style="color:${fabao.colorCss}">${fabao.name}</div>
          <div class="fabao-slot-bonus">
            ${fabao.atkBonus ? `<span>⚔️+${fabao.atkBonus}</span>` : ''}
            ${fabao.defBonus ? `<span>🛡️+${fabao.defBonus}</span>` : ''}
            ${fabao.hpBonus ? `<span>❤️+${fabao.hpBonus}</span>` : ''}
            ${fabao.specialEffect ? `<span>✨${fabao.specialEffect.desc}</span>` : ''}
          </div>
          <div class="fabao-slot-unequip" data-unequip="${type}" title="卸下">✕</div>
        </div>`;
    } else {
      return `
        <div class="fabao-slot empty" data-fabao-slot="${type}">
          <div class="fabao-slot-type">${label.icon} ${label.name}</div>
          <div class="fabao-slot-placeholder">点击装备</div>
        </div>`;
    }
  }).join('');

  content.innerHTML = `
    <div class="fabao-panel">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
        <span style="font-size:11px;color:#c084fc;letter-spacing:3px;padding:3px 10px;background:rgba(142,68,173,0.1);border:1px solid rgba(142,68,173,0.3);border-radius:20px;">🔮 法宝装备</span>
      </div>
      <p style="font-size:12px;color:var(--text-dim);margin-bottom:16px;">法宝分为武器、衣服、饰品三类，按境界提升属性。通过剧情、战斗掉落或任务获得。</p>
      <div class="fabao-slots">${slotCards}</div>
      <div class="fabao-selector hidden" id="fabao-selector">
        <div class="fabao-selector-header">
          <span id="fabao-selector-title">选择法宝</span>
          <button class="fabao-selector-close" id="fabao-selector-close">✕</button>
        </div>
        <div class="fabao-selector-list" id="fabao-selector-list"></div>
      </div>
    </div>`;

  bindFabaoEvents(content);
}

function bindFabaoEvents(content: HTMLElement): void {
  // 点击法宝槽位 → 打开选择器
  content.querySelectorAll<HTMLElement>('[data-fabao-slot]').forEach(slot => {
    slot.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.closest('[data-unequip]')) return;
      const fabaoType = slot.dataset['fabaoSlot'] as FabaoType;
      openFabaoSelector(fabaoType);
    });
  });

  // 卸下按钮
  content.querySelectorAll<HTMLElement>('[data-unequip]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const fabaoType = btn.dataset['unequip'] as FabaoType;
      unequipFabao(fabaoType);
    });
  });

  // 关闭选择器
  const closeBtn = content.querySelector('#fabao-selector-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeFabaoSelector);
  }
}

function openFabaoSelector(type: FabaoType): void {
  const p = getPlayer();
  const selector = document.getElementById('fabao-selector');
  const title = document.getElementById('fabao-selector-title');
  const list = document.getElementById('fabao-selector-list');
  if (!selector || !title || !list) return;

  const label = FABAO_TYPE_LABELS[type];
  title.textContent = `选择${label.name}`;

  const ownedOfType = p.ownedFabao
    .filter(id => {
      const f = FABAO[id];
      return f && f.type === type;
    })
    .map(id => FABAO[id]!);

  const equippedIds = new Set([
    p.equippedFabao.weapon,
    p.equippedFabao.armor,
    p.equippedFabao.accessory,
  ].filter(Boolean));

  if (ownedOfType.length === 0) {
    list.innerHTML = `<div class="fabao-selector-empty">暂未拥有该类型法宝<br><span style="font-size:11px;">通过剧情、战斗掉落或任务获得</span></div>`;
  } else {
    list.innerHTML = ownedOfType.map(f => {
      const isEquipped = equippedIds.has(f.id);
      const isCurrentSlot = p.equippedFabao[type] === f.id;
      const actionLabel = isCurrentSlot ? '✓ 已装备' : isEquipped ? '已装备于其他槽位' : '装备';
      const disabled = isEquipped;

      return `
        <div class="fabao-selector-item ${disabled ? 'disabled' : ''}" 
             data-fabao-id="${f.id}" 
             data-fabao-type="${type}"
             style="--fabao-color:${f.colorCss}">
          <div class="fabao-selector-item-icon">${f.icon}</div>
          <div class="fabao-selector-item-info">
            <div class="fabao-selector-item-name" style="color:${f.colorCss}">${f.name}</div>
            <div class="fabao-selector-item-desc">${f.desc}</div>
            <div class="fabao-selector-item-bonus">
              ${f.atkBonus ? `<span>⚔️+${f.atkBonus}</span>` : ''}
              ${f.defBonus ? `<span>🛡️+${f.defBonus}</span>` : ''}
              ${f.hpBonus ? `<span>❤️+${f.hpBonus}</span>` : ''}
              ${f.specialEffect ? `<span>✨${f.specialEffect.desc}</span>` : ''}
            </div>
          </div>
          <button class="fabao-selector-item-btn ${disabled ? 'disabled' : ''}" 
                  ${disabled ? 'disabled' : ''}>${actionLabel}</button>
        </div>`;
    }).join('');
  }

  selector.classList.remove('hidden');

  list.querySelectorAll<HTMLElement>('.fabao-selector-item:not(.disabled)').forEach(item => {
    item.addEventListener('click', () => {
      const fabaoId = item.dataset['fabaoId'] as FabaoId;
      const fabaoType = item.dataset['fabaoType'] as FabaoType;
      equipFabao(fabaoType, fabaoId);
    });
  });
}

function closeFabaoSelector(): void {
  document.getElementById('fabao-selector')?.classList.add('hidden');
}

function equipFabao(type: FabaoType, fabaoId: FabaoId): void {
  const p = getPlayer();
  const updated = {
    ...p,
    equippedFabao: { ...p.equippedFabao, [type]: fabaoId },
  };
  setPlayer(updated);
  saveGame(updated);
  closeFabaoSelector();

  const fabao = FABAO[fabaoId];
  showToast(`已装备 ${fabao?.name ?? fabaoId}`);

  const content = document.getElementById('camp-content');
  if (content) renderFabaoPanel(content);
}

function unequipFabao(type: FabaoType): void {
  const p = getPlayer();
  const fabaoId = p.equippedFabao[type];
  if (!fabaoId) return;

  const updated = {
    ...p,
    equippedFabao: { ...p.equippedFabao, [type]: null },
  };
  setPlayer(updated);
  saveGame(updated);

  const fabao = FABAO[fabaoId];
  showToast(`已卸下 ${fabao?.name ?? fabaoId}`);

  const content = document.getElementById('camp-content');
  if (content) renderFabaoPanel(content);
}