import { getPlayer, setPlayer } from '../../state/GameState';
import { saveGame } from '../../state/SaveSystem';
import { FABAO } from '../../data/fabao';
import { showToast } from '../../ui/toast';
import type { FabaoId, FabaoType } from '../../data/types';

interface RelationChar {
  id: string;
  name: string;
  img: string;
  affection: number;
  unlocked: boolean;
}

function getRelationData(): { heroines: RelationChar[]; wudang: RelationChar[]; other: RelationChar[] } {
  const p = getPlayer();

  const heroines: RelationChar[] = [
    { id: 'liu_qinghan', name: '柳清寒', img: 'picture/Female-main/柳清寒.png', affection: 55, unlocked: p.chapter >= 1 },
    { id: 'shen_nishang', name: '沈霓裳', img: 'picture/Female-main/沈霓裳.png', affection: 15, unlocked: p.chapter >= 2 && p.act >= 4 },
    { id: 'zhao_qinwei', name: '趙沁微', img: 'picture/Female-main/趙沁微.png', affection: 0,  unlocked: false },
    { id: 'mo_jiangqing', name: '墨绐青', img: 'picture/Female-main/墨绐青.png', affection: 80, unlocked: p.chapter >= 1 },
  ];

  const wudang: RelationChar[] = [
    { id: 'zhang_xuansu', name: '张玄素', img: 'picture/NPC/张玄素.png', affection: 20, unlocked: p.chapter >= 2 },
    { id: 'chen_jingxu', name: '陈静虚', img: 'picture/NPC/陈静虚.png', affection: 30, unlocked: p.chapter >= 2 && p.act >= 1 },
    { id: 'song_zhiyuan', name: '宋知远', img: 'picture/NPC/宋知远.png', affection: 35, unlocked: p.chapter >= 2 },
    { id: 'gu_xiaosang', name: '顾小桑', img: 'picture/NPC/顾小桑.png', affection: 40, unlocked: p.chapter >= 2 },
    { id: 'lu_chengzhou', name: '陆沉舟', img: 'picture/NPC/陆沉舟.png', affection: 10, unlocked: p.chapter >= 2 && p.act >= 3 },
  ];

  const other: RelationChar[] = [
    { id: 'zhou_boan', name: '周伯安', img: 'picture/NPC/周伯安.png', affection: 15, unlocked: p.chapter >= 2 },
  ];

  return { heroines, wudang, other };
}

function renderCharCard(char: RelationChar): string {
  if (!char.unlocked) {
    return `
      <div class="rel-card locked">
        <div class="rel-card-img-wrap">
          <div class="rel-card-placeholder">?</div>
        </div>
        <div class="rel-card-name">未解锁</div>
      </div>`;
  }
  return `
    <div class="rel-card">
      <div class="rel-card-img-wrap">
        <img src="${char.img}" alt="${char.name}" onerror="this.style.display='none'">
      </div>
      <div class="rel-card-name">${char.name}</div>
      <div class="rel-card-aff">❤️ ${char.affection}</div>
    </div>`;
}

function renderSection(icon: string, title: string, chars: RelationChar[]): string {
  const cards = chars.map(renderCharCard).join('');
  const unlockedCount = chars.filter(c => c.unlocked).length;
  // 根据分类选择不同的装饰色
  const accentColor = title === '女主角' ? '#f0a0b0' : title === '武当派' ? '#c9a84c' : '#8ec8a0';
  return `
    <details class="rel-section" open>
      <summary class="rel-section-title" style="--accent:${accentColor}">
        <span class="rel-section-icon">${icon}</span>
        <span class="rel-section-text">${title}</span>
        <span class="rel-section-badge">✨ ${unlockedCount}/${chars.length} 已结识</span>
        <span class="rel-section-arrow">▼</span>
      </summary>
      <div class="rel-card-grid">${cards}</div>
    </details>`;
}

export function renderRelationPanel(content: HTMLElement): void {
  const { heroines, wudang, other } = getRelationData();
  content.innerHTML = `
    <div class="relation-panel">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
        <span style="font-size:11px;color:var(--text-dim);letter-spacing:3px;padding:3px 10px;background:rgba(201,168,76,0.1);border:1px solid rgba(201,168,76,0.3);border-radius:20px;">人物关系</span>
      </div>
      <p style="font-size:12px;color:var(--text-dim);margin-bottom:16px;">随着剧情推进，你将结识更多江湖人物。好感度会影响后续剧情发展。</p>
      ${renderSection('🌸', '女主角', heroines)}
      ${renderSection('☯️', '武当派', wudang)}
      ${renderSection('👤', '其他', other)}
      ${renderFabaoSection()}
    </div>`;

  // 绑定法宝装备事件
  bindFabaoEvents(content);
}

// ═══════════════════════════════════════════════════════════
//  法宝装备区域
// ═══════════════════════════════════════════════════════════

const FABAO_TYPE_LABELS: Record<FabaoType, { icon: string; name: string }> = {
  weapon:    { icon: '⚔️', name: '武器' },
  armor:     { icon: '🛡️', name: '衣服' },
  accessory: { icon: '💎', name: '饰品' },
};

function renderFabaoSection(): string {
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

  return `
    <div class="fabao-section">
      <div class="fabao-section-header">
        <span class="fabao-section-title">🔮 装备法宝</span>
        <span class="fabao-section-hint">点击槽位装备 / 卸下法宝</span>
      </div>
      <div class="fabao-slots">${slotCards}</div>
      <div class="fabao-selector hidden" id="fabao-selector">
        <div class="fabao-selector-header">
          <span id="fabao-selector-title">选择法宝</span>
          <button class="fabao-selector-close" id="fabao-selector-close">✕</button>
        </div>
        <div class="fabao-selector-list" id="fabao-selector-list"></div>
      </div>
    </div>`;
}

function bindFabaoEvents(content: HTMLElement): void {
  // 点击法宝槽位 → 打开选择器
  content.querySelectorAll<HTMLElement>('[data-fabao-slot]').forEach(slot => {
    slot.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      // 如果点击的是卸下按钮，不打开选择器
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

  // 获取该类型已拥有的法宝
  const ownedOfType = p.ownedFabao
    .filter(id => {
      const f = FABAO[id];
      return f && f.type === type;
    })
    .map(id => FABAO[id]!);

  // 当前已装备的（排除掉，不可重复装备）
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
      // 如果是当前槽位已装备的法宝，显示"已装备"
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

  // 绑定选择事件
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

  // 重新渲染面板
  const content = document.getElementById('camp-content');
  if (content) renderRelationPanel(content);
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

  // 重新渲染面板
  const content = document.getElementById('camp-content');
  if (content) renderRelationPanel(content);
}