import { getPlayer, setPlayer } from '../../state/GameState';
import { saveGame } from '../../state/SaveSystem';
import { useItem } from '../../systems/Inventory';
import { showToast } from '../../ui/toast';
import { renderCampTopbar } from '../Camp';

export function renderBagPanel(content: HTMLElement): void {
  const p = getPlayer();
  const slots = 24;
  let html = `<div class="title-deco"><h2>随身包裹</h2></div><div class="bag-grid">`;

  for (let i = 0; i < slots; i++) {
    const item = p.inventory[i];
    if (item) {
      html += `<div class="item-slot" data-bag-idx="${i}" title="${item.name}：${item.desc}">
        ${item.icon}<span class="item-count">${item.count > 1 ? item.count : ''}</span>
      </div>`;
    } else {
      html += `<div class="item-slot empty"></div>`;
    }
  }
  html += `</div>
    <p style="font-size:12px;color:var(--text-dim);margin-top:12px;letter-spacing:1px;">点击物品可使用 / 装备</p>`;
  content.innerHTML = html;

  content.querySelectorAll<HTMLElement>('[data-bag-idx]').forEach(el => {
    el.addEventListener('click', () => {
      const idx = parseInt(el.dataset['bagIdx'] ?? '0');
      const player = getPlayer();
      const item = player.inventory[idx];
      if (!item) return;

      if (item.equip) {
        const updated = {
          ...player,
          def: player.def + (item.effect.def ?? 0),
          inventory: player.inventory.filter((_, i) => i !== idx),
        };
        setPlayer(updated);
        saveGame(updated);
        showToast(`已装备 ${item.name}，防御 +${item.effect.def ?? 0}`);
      } else {
        const updated = useItem(player, item.id);
        if (!updated) return;
        setPlayer(updated);
        saveGame(updated);
        const eff = item.effect;
        showToast(`使用 ${item.name}${eff.hp ? `，气血 +${eff.hp}` : ''}${eff.mp ? `，内力 +${eff.mp}` : ''}${eff.exp ? `，经验 +${eff.exp}` : ''}`);
      }
      renderCampTopbar();
      renderBagPanel(content);
    });
  });
}
