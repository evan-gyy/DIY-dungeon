import { getPlayer, setPlayer } from '../../state/GameState';
import { saveGame } from '../../state/SaveSystem';
import { NPC_DIALOGS } from '../../data/npcs';
import { getChapter } from '../../data/chapters/index';
import { showToast } from '../../ui/toast';
import { openDialog } from '../DialogScreen';
import type { CampScene } from '../../data/chapters/types';

export function renderStoryPanel(content: HTMLElement): void {
  const p = getPlayer();
  const chapter = getChapter(p.chapter);
  const scene = chapter.campScenes[p.act] ?? chapter.campScenes[0]!;

  updateStorySidebar(scene);

  const npcHtml = scene.npc ? `
    <div class="story-npc-portrait">
      <img src="${scene.npc.img}" alt="${scene.npc.name}" onerror="this.style.display='none'" class="story-npc-img">
      <div class="story-npc-name">${scene.npc.name}</div>
      <div class="story-npc-sub">${scene.npc.sub}</div>
    </div>` : '';

  content.innerHTML = `
    <div class="story-scene-wrap">
      <div class="story-scene-bg">
        <img src="${scene.bg}" alt="场景" onerror="this.style.display='none'"
             style="width:100%;height:100%;object-fit:cover;border-radius:8px;opacity:0.5;">
        <div class="story-scene-overlay"></div>
      </div>
      <div class="story-scene-content">
        <div style="margin-bottom:16px;display:flex;align-items:center;gap:12px;">
          <span style="font-size:11px;color:var(--text-dim);letter-spacing:3px;padding:3px 10px;background:rgba(201,168,76,0.1);border:1px solid rgba(201,168,76,0.3);border-radius:20px;">${scene.title}</span>
        </div>
        <div class="story-desc">${scene.desc}</div>
        ${npcHtml}
        <div class="story-action-area">
          <button class="btn story-action-btn" id="story-action-btn">▶ ${scene.actionLabel}</button>
        </div>
      </div>
    </div>
  `;

  content.querySelector('#story-action-btn')?.addEventListener('click', () => triggerStoryEvent(scene.actionEvent));
}

function triggerStoryEvent(eventId: string): void {
  if (eventId === 'act1_chess') {
    if (NPC_DIALOGS['mo_jiangqing']) openDialog('mo_jiangqing');
    else showToast('墨绐青的对话正在酝酿中…');
  } else if (eventId === 'act2_thunder') {
    const p = getPlayer();
    setPlayer({ ...p, act: 2 });
    saveGame(getPlayer());
    showToast('突变发生——必须立刻离开！');
    renderStoryPanel(document.getElementById('camp-content')!);
  } else if (eventId === 'act3_escape') {
    import('../../systems/BattleEngine').then(m => m.initBattle('shadow_scout'));
  } else if (eventId === 'act4_snow') {
    if (NPC_DIALOGS['liu_qinghan']) openDialog('liu_qinghan');
    else showToast('柳清寒的对话正在酝酿中…');
  } else {
    showToast('剧情即将到来…');
  }
}

export function updateStorySidebar(scene: CampScene): void {
  const imgEl  = document.getElementById('sidebar-npc-img')  as HTMLImageElement | null;
  const nameEl = document.getElementById('sidebar-npc-name');
  const subEl  = document.getElementById('sidebar-npc-sub');
  if (!scene.npc) return;
  if (imgEl)  imgEl.src         = scene.npc.img;
  if (nameEl) nameEl.textContent = scene.npc.name;
  if (subEl)  subEl.textContent  = scene.npc.sub;
}
