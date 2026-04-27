import { getPlayer } from '../../state/GameState';

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
    </div>`;
}